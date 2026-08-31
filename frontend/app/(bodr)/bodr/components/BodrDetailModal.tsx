"use client";

import React, { useState, useMemo } from "react";
import { BodrProposal } from "@/app/lib/api";
import { downloadBodrPdf } from "./bodrExport";
import { formatDateDisplay } from "@/app/lib/dateUtils";

interface BodrDetailModalProps {
  proposal: BodrProposal;
  onClose: () => void;
  onOpenOtorisasi: () => void;
}

// Approval status badge styling
const approvalBadgeColor = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "approved") return "bg-emerald-50 text-emerald-700 border border-emerald-300";
  if (s === "rejected") return "bg-rose-50 text-rose-700 border border-rose-300";
  if (s === "revision") return "bg-amber-50 text-amber-800 border border-amber-300";
  return "bg-blue-50 text-blue-700 border border-blue-300"; // pending / in-progress
};

const approvalStatusLabel = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "approved") return "Disetujui";
  if (s === "rejected") return "Ditolak";
  if (s === "revision") return "Revisi";
  return "Menunggu";
};

// Calculate lead time duration in days and hours
function calculateDuration(startStr?: string, endStr?: string): { text: string; hours: number; daysNum: number } {
  if (!startStr) return { text: "0 Day", hours: 0, daysNum: 0 };
  const start = new Date(startStr).getTime();
  if (isNaN(start)) return { text: "0 Day", hours: 0, daysNum: 0 };
  const end = endStr ? new Date(endStr).getTime() : Date.now();
  if (isNaN(end)) return { text: "0 Day", hours: 0, daysNum: 0 };
  const diffMs = Math.max(0, end - start);
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  const daysNum = parseFloat((diffMs / (1000 * 60 * 60 * 24)).toFixed(1));
  const text = daysNum === 0 ? "0 Day" : `${daysNum} Day`;
  return { text, hours, daysNum };
}

export default function BodrDetailModal({
  proposal,
  onClose,
  onOpenOtorisasi,
}: BodrDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"detail" | "progress">("detail");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Build Chronological Timeline Activity Logs
  const activityLogs = useMemo(() => {
    const logs: Array<{
      id: string;
      date: string;
      rawTimestamp: string;
      approvalType: string;
      action: string;
      actionType: "submitted" | "approved" | "rejected" | "revision" | "pending";
      submitBy: string;
      roleName: string;
      description?: string;
      durationText: string;
    }> = [];

    const createdAt = proposal.date || new Date().toISOString();

    // 1. Initial Submission Log
    logs.push({
      id: "log-create",
      date: formatDateDisplay(createdAt),
      rawTimestamp: createdAt,
      approvalType: "Perencanaan Budget",
      action: "SUBMITTED",
      actionType: "submitted",
      submitBy: proposal.proposer || "Pengusul",
      roleName: `Proposer / Pemohon (${proposal.department || "Marketing"})`,
      description: proposal.title || proposal.benefit || "",
      durationText: "0 Day",
    });

    // 2. Approval Action Logs from approvalHistory
    if (proposal.approvalHistory && proposal.approvalHistory.length > 0) {
      proposal.approvalHistory.forEach((ap, idx) => {
        const st = (ap.status || "").toLowerCase();
        let actionType: "submitted" | "approved" | "rejected" | "revision" | "pending" = "pending";
        if (st === "approved") actionType = "approved";
        else if (st === "rejected") actionType = "rejected";
        else if (st === "revision") actionType = "revision";

        const prevTimestamp = idx === 0 ? createdAt : (proposal.approvalHistory[idx - 1]?.timestamp || createdAt);
        const { text: durationText } = calculateDuration(prevTimestamp, ap.timestamp);

        logs.push({
          id: `log-approval-${idx}`,
          date: formatDateDisplay(ap.timestamp || createdAt),
          rawTimestamp: ap.timestamp || createdAt,
          approvalType: ap.role || `Approval Tahap ${idx + 1}`,
          action: (ap.status || "PENDING").toUpperCase(),
          actionType,
          submitBy: ap.name || ap.role || "Approver",
          roleName: `${ap.role || "Approver"} (${proposal.department || "-"})`,
          description: ap.note || "",
          durationText,
        });
      });
    }

    return logs;
  }, [proposal]);

  // Total Lead Time calculation from creation to now / final action
  const totalLeadTimeDisplay = useMemo(() => {
    const createdAt = proposal.date || new Date().toISOString();
    const latestTimestamp =
      proposal.approvalHistory && proposal.approvalHistory.length > 0
        ? proposal.approvalHistory[proposal.approvalHistory.length - 1]?.timestamp
        : undefined;
    const { daysNum, hours } = calculateDuration(createdAt, latestTimestamp);
    return `${daysNum.toFixed(1)} Day (~${hours} Jam)`;
  }, [proposal]);

  // Stepper Stages for BODR
  const stepperStages = useMemo(() => {
    const stages: Array<{
      order: number;
      name: string;
      subName: string;
      status: "Closed" | "In Progress" | "Waiting";
    }> = [];

    // Stage 1: Perencanaan / Budget Planning (Always Closed/Done once created)
    stages.push({
      order: 1,
      name: "Perencanaan",
      subName: "Budget Planning",
      status: "Closed",
    });

    // Subsequent approval stages from approvalHistory
    if (proposal.approvalHistory && proposal.approvalHistory.length > 0) {
      proposal.approvalHistory.forEach((ap, idx) => {
        const st = (ap.status || "").toLowerCase();
        let stageStatus: "Closed" | "In Progress" | "Waiting" = "Waiting";
        if (st === "approved") {
          stageStatus = "Closed";
        } else if (st === "rejected" || st === "revision") {
          stageStatus = "In Progress";
        } else {
          // If previous stage is Closed and this is pending -> In Progress
          const prevStatus = idx === 0 ? "Closed" : stages[idx]?.status;
          if (prevStatus === "Closed") {
            stageStatus = "In Progress";
          } else {
            stageStatus = "Waiting";
          }
        }

        stages.push({
          order: idx + 2,
          name: ap.role || `Tahap ${idx + 2}`,
          subName: ap.name || "Approver",
          status: stageStatus,
        });
      });
    }

    return stages;
  }, [proposal]);

  // Pagination for Activity Feed
  const totalPages = Math.ceil(activityLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activityLogs.slice(start, start + itemsPerPage);
  }, [activityLogs, currentPage]);

  const isApprovedStatus = proposal.status?.toLowerCase() === "approved";
  const isRejectedStatus = proposal.status?.toLowerCase() === "rejected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 w-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 flex justify-between items-center text-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Detail Pengajuan BODR
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                  ID: #{proposal.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {proposal.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-all cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200"
            title="Tutup Modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Strip Banner */}
        <div
          className={`px-6 py-2.5 border-b flex items-center justify-between gap-4 text-xs font-semibold tracking-wide ${
            isApprovedStatus
              ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-800"
              : isRejectedStatus
              ? "bg-rose-50/70 border-rose-200/80 text-rose-800"
              : "bg-blue-50/70 border-blue-200/80 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isApprovedStatus ? "bg-emerald-500" : isRejectedStatus ? "bg-rose-500" : "bg-blue-600 animate-pulse"
              }`}
            />
            <span className="font-bold uppercase tracking-wider text-[11px]">
              Status: {proposal.status}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <span className="text-slate-400 font-normal">Tahap Berjalan:</span>
            <span className="font-semibold text-slate-800 px-2 py-0.5 bg-white rounded-md border border-slate-200/70 shadow-2xs">
              {proposal.step || "Perencanaan"}
            </span>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="px-6 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2 pt-2.5">
          <button
            onClick={() => setActiveTab("detail")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeTab === "detail"
                ? "bg-white text-blue-600 border-slate-200 border-b-white -mb-px shadow-2xs font-bold"
                : "bg-transparent text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100/70"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Informasi Detail
          </button>

          <button
            onClick={() => setActiveTab("progress")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeTab === "progress"
                ? "bg-white text-blue-600 border-slate-200 border-b-white -mb-px shadow-2xs font-bold"
                : "bg-transparent text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100/70"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Progress & Lead Time
            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[9px] font-bold">
              {activityLogs.length}
            </span>
          </button>
        </div>

        {/* ── TAB: DETAIL INFORMASI ────────────────────────────────────────── */}
        {activeTab === "detail" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-y-auto flex-1 bg-slate-50/30">
            {/* Left Column: Form Info (7 cols) */}
            <div className="lg:col-span-7 p-6 space-y-5 overflow-y-auto bg-white">
              {/* Section 1: Informasi Pengajuan */}
              <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    1. Informasi Dokumen & Pengusul
                  </span>
                  <span className="text-[9.5px] font-mono text-slate-400">
                    {formatDateDisplay(proposal.date)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      BODR ID
                    </label>
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 shadow-2xs">
                      #{proposal.id}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      No. Dokumen BODR
                    </label>
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-800 shadow-2xs">
                      {proposal.bodrNo || "—"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Pengusul (Proposer)
                    </label>
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] uppercase shrink-0">
                        {proposal.proposer?.charAt(0) || "U"}
                      </span>
                      <span className="truncate">{proposal.proposer}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Departemen
                    </label>
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs">
                      {proposal.department}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Judul & Manfaat Investasi */}
              <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="border-b border-slate-200/70 pb-2">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    2. Judul & Manfaat Usulan
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Judul Investasi
                    </label>
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs">
                      {proposal.title}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Benefit / Manfaat yang Diharapkan
                    </label>
                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-700 leading-relaxed font-normal shadow-2xs whitespace-pre-wrap">
                      {proposal.benefit ? (
                        <p className="italic text-slate-700">&quot;{proposal.benefit}&quot;</p>
                      ) : (
                        <span className="text-slate-400 italic">Tidak ada catatan manfaat khusus.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Anggaran & Spesifikasi Aset */}
              <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="border-b border-slate-200/70 pb-2">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    3. Anggaran & Aset Terkait
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Nilai Anggaran Investasi
                    </label>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200 rounded-lg px-3.5 py-2 text-sm font-mono font-bold text-blue-700 shadow-2xs">
                      Rp {proposal.amount.toLocaleString("id-ID")}
                    </div>
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Cost Center
                    </label>
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs">
                      {proposal.costCenter || "-"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Capex Terkait (FS)
                    </label>
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800 shadow-2xs">
                      {proposal.capexId || "-"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Nama / No. Aset
                    </label>
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800 shadow-2xs">
                      {proposal.noAsset || proposal.namaAsset || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Riwayat Approval (5 cols) */}
            <div className="lg:col-span-5 p-6 space-y-4 bg-slate-50/70 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Riwayat Persetujuan
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Tahapan persetujuan usulan
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs">
                  {proposal.approvalHistory?.length || 0} Tahap
                </span>
              </div>

              <div className="space-y-3">
                {proposal.approvalHistory && proposal.approvalHistory.length > 0 ? (
                  proposal.approvalHistory.map((ap, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-xl p-3.5 shadow-2xs space-y-2.5 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {ap.initials || ap.name?.substring(0, 2).toUpperCase() || "AP"}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {ap.name || "Approver"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block truncate">
                              {ap.role || `Tahap ${idx + 1}`}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${approvalBadgeColor(
                            ap.status
                          )}`}
                        >
                          {approvalStatusLabel(ap.status)}
                        </span>
                      </div>

                      {ap.note && (
                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10.5px] text-slate-700 leading-relaxed font-normal">
                          <p className="italic">&quot;{ap.note}&quot;</p>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 text-[9.5px] text-slate-400 font-mono">
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDateDisplay(ap.timestamp)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400 italic text-xs bg-white rounded-xl border border-slate-200">
                    Belum ada riwayat persetujuan yang tercatat.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: PROGRESS & LEAD TIME ACTIVITY ──────────────────────────── */}
        {activeTab === "progress" && (
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
            {/* Section Header Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      PROGRESS & LEAD TIME ACTIVITY
                    </h4>
                    <p className="text-[10.5px] text-slate-500 font-medium">
                      Alur tahapan review & akumulasi durasi proses usulan
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full font-mono shadow-2xs">
                  ⚡ Total: {totalLeadTimeDisplay}
                </span>
              </div>

              {/* Dynamic Horizontal Stage Stepper Bar */}
              <div
                className="grid gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200 shadow-2xs text-center"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(stepperStages.length, 3)}, minmax(0, 1fr))`,
                }}
              >
                {stepperStages.map((stage) => {
                  const isClosed = stage.status === "Closed";
                  const isInProgress = stage.status === "In Progress";

                  return (
                    <div key={stage.order} className="space-y-1">
                      <div className="flex items-center justify-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-bold shadow-xs transition-all ${
                            isClosed
                              ? "bg-emerald-500 text-white"
                              : isInProgress
                              ? "bg-blue-600 text-white animate-pulse"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {isClosed ? "✓" : stage.order}
                        </div>
                      </div>
                      <p
                        className={`text-[10px] font-bold truncate ${
                          isClosed
                            ? "text-emerald-700"
                            : isInProgress
                            ? "text-blue-700"
                            : "text-slate-500"
                        }`}
                      >
                        {stage.name}
                      </p>
                      <p className="text-[8.5px] text-slate-400 truncate font-medium">{stage.subName}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vertical Activity Timeline Feed (Cards) */}
            <div className="space-y-3">
              {paginatedLogs.map((log) => {
                const isApproved = log.actionType === "approved";
                const isRejected = log.actionType === "rejected";
                const isRevision = log.actionType === "revision";
                const isSubmitted = log.actionType === "submitted";

                return (
                  <div
                    key={log.id}
                    className="relative bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-2xs space-y-2.5 transition-all group"
                  >
                    {/* Timeline Card Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10.5px] text-slate-500 font-semibold">
                            📅 {log.date}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10.5px] font-bold text-slate-800">
                            {log.approvalType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Action Badge */}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                              : isRejected
                              ? "bg-red-50 text-red-700 border border-red-300"
                              : isRevision
                              ? "bg-amber-50 text-amber-700 border border-amber-300"
                              : isSubmitted
                              ? "bg-blue-50 text-blue-700 border border-blue-300"
                              : "bg-slate-100 text-slate-700 border border-slate-300"
                          }`}
                        >
                          {log.action}
                        </span>

                        {/* Duration Lead Time Chip */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9.5px] font-semibold">
                          ⏱ {log.durationText}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Card Actor & Role */}
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                          {log.submitBy.charAt(0) || "U"}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">
                            {log.submitBy}
                          </span>
                          <span className="text-[10px] text-slate-500 block leading-tight">
                            {log.roleName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Card Note/Benefit */}
                    {log.description && log.description.trim() !== "" && log.description !== "-" && (
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[10.5px] text-slate-700 leading-relaxed font-normal">
                        <p className="italic">&quot;{log.description}&quot;</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {paginatedLogs.length === 0 && (
                <div className="text-center py-12 text-slate-400 italic text-xs bg-white rounded-xl border border-slate-200">
                  Belum ada riwayat aktivitas yang tercatat.
                </div>
              )}
            </div>

            {/* Footer Pagination & Count */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10.5px] text-slate-500">
              <span>
                Halaman {currentPage} dari {totalPages} • Total: {activityLogs.length} aktivitas
              </span>
              {totalPages > 1 && (
                <div className="flex gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 cursor-pointer disabled:cursor-not-allowed font-medium text-[10px] shadow-2xs"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 cursor-pointer disabled:cursor-not-allowed font-medium text-[10px] shadow-2xs"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs uppercase cursor-pointer transition-all shadow-2xs"
          >
            Tutup
          </button>
          {proposal.status === "Approved" && (
            <button
              onClick={onOpenOtorisasi}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl text-xs uppercase shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Ajukan Otorisasi Harga
            </button>
          )}
          <button
            onClick={() => downloadBodrPdf(proposal)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs uppercase shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
