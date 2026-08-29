"use client";

import React, { useMemo, useState, useEffect } from "react";
import { BodrProgressRowData } from "./BodrProgressMatrixTable";
import { ApiApprovalWorkflow, BodrProgressApprovalStep } from "../../lib/api";
import { formatDateDisplay } from "../../lib/dateUtils";

interface BodrProgressLeadTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  row: BodrProgressRowData | null;
  approvalWorkflow: ApiApprovalWorkflow | null;
}

function formatDateWIB(dateStr?: string): string {
  return formatDateDisplay(dateStr);
}

function calculateDaysBetween(startStr?: string, endStr?: string): number {
  if (!startStr) return 0;
  const start = new Date(startStr).getTime();
  if (isNaN(start)) return 0;
  const end = endStr ? new Date(endStr).getTime() : Date.now();
  if (isNaN(end)) return 0;
  const diff = Math.max(0, end - start);
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getActionStyle(status: string): {
  bgColor: string;
  textColor: string;
  badgeColor: string;
  icon: string;
} {
  const s = (status || "").toLowerCase();
  if (s.includes("approved")) return { bgColor: "bg-emerald-50", textColor: "text-emerald-700", badgeColor: "bg-emerald-500", icon: "✓" };
  if (s.includes("rejected")) return { bgColor: "bg-red-50", textColor: "text-red-700", badgeColor: "bg-red-500", icon: "✕" };
  if (s.includes("revision")) return { bgColor: "bg-amber-50", textColor: "text-amber-800", badgeColor: "bg-amber-500", icon: "↩" };
  return { bgColor: "bg-blue-50", textColor: "text-blue-700", badgeColor: "bg-blue-500", icon: "●" };
}

export default function BodrProgressLeadTimeModal({
  isOpen,
  onClose,
  row,
  approvalWorkflow,
}: BodrProgressLeadTimeModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const proposal = row?.rawProposal;

  // Reset page when row changes
  useEffect(() => {
    setCurrentPage(1);
  }, [row?.id]);

  const approvalHistory: BodrProgressApprovalStep[] = useMemo(
    () => proposal?.approval_history || [],
    [proposal]
  );

  // Expected steps from workflow (dinamis dari API atau workflow_steps proposal)
  const workflowSteps = useMemo(() => {
    if (approvalWorkflow?.list_approval && approvalWorkflow.list_approval.length > 0) {
      return [...approvalWorkflow.list_approval].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    if (proposal?.workflow_steps && proposal.workflow_steps.length > 0) {
      return [...proposal.workflow_steps]
        .map((s) => ({
          user_id: "",
          user_name: s.user_name,
          role: s.role,
          order: s.step_order,
        }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return [];
  }, [approvalWorkflow, proposal]);

  // Separate actual completed history vs pending actions
  const actualHistory = useMemo(
    () => approvalHistory.filter((h) => (h.status || "").toLowerCase() !== "pending"),
    [approvalHistory]
  );

  // Build chronological timeline combining:
  // 1. Initial "Create/Submit" entry from created_at
  // 2. Each actual approval history entry (approved/rejected/revision)
  // 3. Pending/expected steps (from workflow that haven't been completed yet)
  const timelineEntries = useMemo(() => {
    if (!row || !proposal) return [];

    const entries: {
      id: string;
      stepLabel: string;
      role: string;
      actorName: string;
      status: string;
      timestamp: string;
      note: string;
      days: number;
      isActual: boolean;
      isPending: boolean;
    }[] = [];

    const createdAt = proposal.created_at || new Date().toISOString();

    // Entry 1: Initial submission
    entries.push({
      id: "create",
      stepLabel: "Pengajuan BODR",
      role: "Proposer / Pengusul",
      actorName: (proposal.proposer || "—").toUpperCase(),
      status: "Submitted",
      timestamp: createdAt,
      note: proposal.notes || "Pengajuan BODR dibuat dan disubmit.",
      days: 1,
      isActual: true,
      isPending: false,
    });

    // Entry 2+: Actual completed approval history entries
    actualHistory.forEach((h, idx) => {
      const prevTimestamp = idx === 0 ? createdAt : actualHistory[idx - 1].timestamp;
      const days = calculateDaysBetween(prevTimestamp, h.timestamp);
      entries.push({
        id: `history-${idx}`,
        stepLabel: h.role || (h.name ? `${h.name}` : "Approver"),
        role: h.role || "Approver",
        actorName: (h.name || h.initials || "—").toUpperCase(),
        status: h.status || "Review",
        timestamp: h.timestamp || "",
        note: h.note || "—",
        days,
        isActual: true,
        isPending: false,
      });
    });

    // Entry 3+: Remaining expected steps from workflow (steps NOT yet completed in actualHistory)
    const coveredRoles = new Set(actualHistory.map((h) => (h.role || "").toLowerCase().trim()));
    const pendingSteps = workflowSteps.filter(
      (s) => !coveredRoles.has((s.role || "").toLowerCase().trim())
    );

    const isFinal =
      (proposal.status || "").toLowerCase().includes("approved") ||
      (proposal.status || "").toLowerCase().includes("rejected");

    if (!isFinal) {
      pendingSteps.forEach((s, idx) => {
        entries.push({
          id: `pending-${idx}`,
          stepLabel: s.role || (s.user_name ? `${s.user_name}` : "Approver"),
          role: s.role || "Approver",
          actorName: (s.user_name || "—").toUpperCase(),
          status: "Waiting",
          timestamp: "",
          note: "Menunggu persetujuan.",
          days: 0,
          isActual: false,
          isPending: true,
        });
      });
    }

    return entries;
  }, [row, proposal, actualHistory, workflowSteps]);

  const totalPages = Math.ceil(timelineEntries.length / itemsPerPage) || 1;
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return timelineEntries.slice(start, start + itemsPerPage);
  }, [timelineEntries, currentPage]);

  // Summary stats
  const totalDays = actualHistory.reduce((sum, _, idx) => {
    const prevTs = idx === 0 ? proposal?.created_at : actualHistory[idx - 1].timestamp;
    return sum + calculateDaysBetween(prevTs, actualHistory[idx].timestamp);
  }, 0);

  const approvedCount = actualHistory.filter((h) => (h.status || "").toLowerCase().includes("approved")).length;
  const rejectedCount = actualHistory.filter((h) => (h.status || "").toLowerCase().includes("rejected")).length;
  const revisionCount = actualHistory.filter((h) => (h.status || "").toLowerCase().includes("revision")).length;

  if (!isOpen || !row) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Lead Time &amp; Riwayat Approval BODR
              </h2>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                {row.bodr_no} — {row.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all shrink-0 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Proposal Summary Bar */}
        <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Departemen:</span>
              <span className="font-semibold text-slate-700">{row.department || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Pengusul:</span>
              <span className="font-semibold text-slate-700">{row.proposer || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Kategori:</span>
              <span className="font-semibold text-slate-700">{row.category || "—"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Amount:</span>
              <span className="font-semibold font-mono text-slate-800">Rp {(row.amount || 0).toLocaleString("id-ID")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  (row.status || "").toLowerCase().includes("approved")
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : (row.status || "").toLowerCase().includes("rejected")
                    ? "bg-red-50 text-red-700 border-red-300"
                    : (row.status || "").toLowerCase().includes("revision")
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-blue-50 text-blue-700 border-blue-300"
                }`}
              >
                {row.status || "Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="px-6 py-3 border-b border-slate-100 grid grid-cols-4 gap-3 shrink-0">
          {[
            { label: "Total Lead Time", value: `${totalDays} Hari`, color: "text-indigo-600" },
            { label: "Disetujui", value: `${approvedCount} Step`, color: "text-emerald-600" },
            { label: "Revisi", value: `${revisionCount} Step`, color: "text-amber-600" },
            { label: "Ditolak", value: `${rejectedCount} Step`, color: "text-red-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
              <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Expected Workflow Steps from API */}
        {workflowSteps.length > 0 && (
          <div className="px-6 py-3 border-b border-slate-100 shrink-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Hirarki Approval (dari Workflow Dept {approvalWorkflow?.departemen_nama || row.department}):
            </p>
            <div className="flex flex-wrap items-center gap-1">
              {workflowSteps.map((s, idx) => {
                const isApproved = actualHistory.some(
                  (h: BodrProgressApprovalStep) =>
                    (h.role || "").toLowerCase().trim() === (s.role || "").toLowerCase().trim() &&
                    (h.status || "").toLowerCase().includes("approved")
                );
                const isTouched = actualHistory.some(
                  (h: BodrProgressApprovalStep) =>
                    (h.role || "").toLowerCase().trim() === (s.role || "").toLowerCase().trim()
                );
                return (
                  <span key={idx} className="flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isTouched
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {s.role}
                    </span>
                    {idx < workflowSteps.length - 1 && (
                      <span className="text-slate-300 text-[10px]">→</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
            Riwayat Aktivitas &amp; Approval
          </p>

          {timelineEntries.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="font-semibold text-sm">Belum ada riwayat approval</p>
              <p className="text-xs mt-1">Pengajuan BODR ini belum memiliki aktivitas approval.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedEntries.map((entry, idx) => {
                const style = getActionStyle(entry.status);
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                return (
                  <div
                    key={entry.id}
                    className={`rounded-xl border px-4 py-3 flex items-start gap-4 transition-all ${
                      entry.isPending
                        ? "bg-slate-50 border-slate-200 opacity-60"
                        : `${style.bgColor} border-slate-200`
                    }`}
                  >
                    {/* Step Badge */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs ${
                          entry.isPending ? "bg-slate-300" : style.badgeColor
                        }`}
                      >
                        {entry.isPending ? "?" : entry.isActual ? style.icon : globalIdx}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">#{globalIdx}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-bold ${entry.isPending ? "text-slate-500" : style.textColor}`}>
                          {entry.stepLabel}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            entry.isPending
                              ? "bg-slate-100 text-slate-500 border-slate-200"
                              : `${style.bgColor} ${style.textColor} border-slate-200`
                          }`}
                        >
                          {entry.status.toUpperCase()}
                        </span>
                        {!entry.isPending && entry.days > 0 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {entry.days} hari
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 mb-1.5">
                        <span>
                          <strong className="text-slate-700">Role:</strong> {entry.role}
                        </span>
                        <span>
                          <strong className="text-slate-700">Oleh:</strong> {entry.actorName}
                        </span>
                        {entry.timestamp && (
                          <span>
                            <strong className="text-slate-700">Waktu:</strong> {formatDateWIB(entry.timestamp)}
                          </span>
                        )}
                      </div>
                      {entry.note && entry.note !== "—" && (
                        <p className="text-[11px] text-slate-600 italic font-normal bg-white/70 rounded-lg px-2.5 py-1.5 border border-slate-100">
                          "{entry.note}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer with Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
            <span className="text-[10px] text-slate-500">
              {timelineEntries.length} aktivitas total
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 text-xs font-medium cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentPage === pg
                      ? "bg-indigo-600 text-white"
                      : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 text-xs font-medium cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Close Button Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
