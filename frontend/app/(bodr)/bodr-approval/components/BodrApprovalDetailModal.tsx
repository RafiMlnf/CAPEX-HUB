"use client";

import React from "react";
import { BodrProposal } from "@/app/lib/api";
import { downloadBodrPdf } from "../../bodr/components/bodrExport";
import { formatDateDisplay } from "@/app/lib/dateUtils";

interface BodrApprovalDetailModalProps {
  proposal: BodrProposal;
  onClose: () => void;
  onOpenAction: () => void;
}

export default function BodrApprovalDetailModal({
  proposal,
  onClose,
  onOpenAction,
}: BodrApprovalDetailModalProps) {
  const isApproved = proposal.status?.toLowerCase() === "approved";
  const isRejected = proposal.status?.toLowerCase() === "rejected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/80 flex justify-between items-center text-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Review Persetujuan BODR
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                  ID: #{proposal.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {proposal.bodrNo && proposal.bodrNo !== "—" ? `No. BODR: ${proposal.bodrNo}` : "Nomor resmi diterbitkan setelah full approval"}
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
            isApproved
              ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-800"
              : isRejected
              ? "bg-rose-50/70 border-rose-200/80 text-rose-800"
              : "bg-blue-50/70 border-blue-200/80 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isApproved ? "bg-emerald-500" : isRejected ? "bg-rose-500" : "bg-blue-600 animate-pulse"
              }`}
            />
            <span className="font-bold uppercase tracking-wider text-[11px]">
              Status: {proposal.status}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <span className="text-slate-400 font-normal">Tahap Berjalan:</span>
            <span className="font-semibold text-slate-800 px-2 py-0.5 bg-white rounded-md border border-slate-200/70 shadow-2xs">
              {proposal.step || "Review Approval"}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto bg-slate-50/30">
          {/* Grid Info 1 */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3.5 shadow-2xs">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Informasi Pengajuan & Anggaran
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Pengusul</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-900 shadow-2xs truncate">
                  {proposal.proposer}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Departemen</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 shadow-2xs truncate">
                  {proposal.department}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Cost Center</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 shadow-2xs truncate">
                  {proposal.costCenter || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Nilai Investasi</label>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200 rounded-lg p-2.5 text-xs font-mono font-bold text-blue-700 shadow-2xs truncate">
                  Rp {proposal.amount.toLocaleString("id-ID")}
                </div>
              </div>
            </div>
          </div>

          {/* Grid Info 2: Judul & Benefit */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3.5 shadow-2xs">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                Judul & Manfaat Usulan
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Judul Usulan</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-semibold text-slate-900 shadow-2xs">
                  {proposal.title}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Benefit & Justifikasi</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal leading-relaxed shadow-2xs">
                  {proposal.benefit ? (
                    <p className="italic text-slate-700">&quot;{proposal.benefit}&quot;</p>
                  ) : (
                    <span className="text-slate-400 italic">Tidak ada catatan manfaat khusus.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Riwayat Approval */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                Riwayat Persetujuan Approval
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {proposal.approvalHistory?.length || 0} Tahap
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {proposal.approvalHistory && proposal.approvalHistory.length > 0 ? (
                proposal.approvalHistory.map((ap, idx) => {
                  const s = (ap.status || "").toLowerCase();
                  const isAppr = s.includes("approved");
                  const isRej = s.includes("rejected");
                  const isRev = s.includes("revision") || s.includes("revise");

                  return (
                    <div
                      key={idx}
                      className="bg-slate-50/60 border border-slate-200/80 hover:border-blue-300 rounded-xl p-3.5 shadow-2xs space-y-2 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-xs block leading-tight truncate">
                              {ap.name || "Approver"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block leading-tight truncate">
                              {ap.role || "Reviewer"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              isAppr
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : isRej
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : isRev
                                ? "bg-amber-50 text-amber-700 border-amber-300"
                                : "bg-blue-50 text-blue-700 border-blue-300"
                            }`}
                          >
                            {ap.status}
                          </span>
                        </div>
                      </div>

                      {ap.note && (
                        <div className="bg-white border border-slate-100 rounded-lg px-3 py-2 text-[10.5px] text-slate-700 italic font-normal">
                          &quot;{ap.note}&quot;
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 text-[9.5px] text-slate-400 font-mono">
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDateDisplay(ap.timestamp)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 italic text-xs font-normal bg-white border border-slate-200 rounded-xl">
                  Belum ada riwayat approval.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-2xs uppercase"
          >
            Tutup
          </button>
          <button
            onClick={() => downloadBodrPdf(proposal)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-xs cursor-pointer transition-all shadow-2xs uppercase"
          >
            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Cetak PDF
          </button>
          {proposal.status === "Pending Review" && (
            <button
              onClick={() => {
                onClose();
                onOpenAction();
              }}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer active:scale-95 transition-all uppercase"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Proses Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
