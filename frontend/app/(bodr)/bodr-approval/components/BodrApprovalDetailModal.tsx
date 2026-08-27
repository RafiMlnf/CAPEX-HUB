"use client";

import React from "react";
import { BodrProposal } from "@/app/lib/api";
import { downloadBodrPdf } from "../../bodr/components/bodrExport";

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden my-8 text-slate-800" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Detail Pengajuan BODR</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{proposal.bodrNo}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Pengusul</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium">{proposal.proposer}</div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Departemen</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium">{proposal.department}</div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Cost Center</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium">{proposal.costCenter}</div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Nilai Investasi</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-semibold text-blue-600">
                Rp {proposal.amount.toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Judul Pengajuan</label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-medium text-slate-800">{proposal.title}</div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Benefit & Justifikasi</label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 whitespace-pre-wrap font-normal">{proposal.benefit || "-"}</div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Riwayat Approval</label>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {proposal.approvalHistory && proposal.approvalHistory.length > 0 ? (
                proposal.approvalHistory.map((ap, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">{ap.name} ({ap.role})</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">{ap.timestamp}</span>
                      {ap.note && <p className="text-[11px] text-slate-600 mt-1 italic font-normal">"{ap.note}"</p>}
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {ap.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400 italic text-xs font-normal">Belum ada riwayat approval.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={() => downloadBodrPdf(proposal)}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs cursor-pointer"
          >
            Cetak PDF
          </button>
          {proposal.status === "Pending Review" && (
            <button
              onClick={() => {
                onClose();
                onOpenAction();
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-2xs cursor-pointer active:scale-95 transition-all"
            >
              Proses Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
