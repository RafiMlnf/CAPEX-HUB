"use client";

import React from "react";
import { BodrProposal } from "@/app/lib/api";
import { downloadBodrPdf } from "./bodrExport";

interface BodrDetailModalProps {
  proposal: BodrProposal;
  onClose: () => void;
  onOpenOtorisasi: () => void;
}

export default function BodrDetailModal({
  proposal,
  onClose,
  onOpenOtorisasi,
}: BodrDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden my-8 text-slate-800" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-slate-800">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Detail BODR</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Banner */}
        <div className="px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Status: {proposal.status} | Tahap: {proposal.step}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 p-6 space-y-5 overflow-y-auto max-h-[70vh] bg-white">
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5">Informasi Pengajuan</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">BODR ID</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800">
                    {proposal.id}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">No. BODR</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800">
                    {proposal.bodrNo}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Pengusul</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800">
                    {proposal.proposer}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Departemen</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800">
                    {proposal.department}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5">Judul & Manfaat</p>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Judul Investasi</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800">
                  {proposal.title}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Benefit / Manfaat</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 whitespace-pre-wrap font-normal">
                  {proposal.benefit || "-"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5">Anggaran & Aset</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Nilai Investasi</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-blue-600">
                    Rp {proposal.amount.toLocaleString("id-ID")}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Cost Center</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800">
                    {proposal.costCenter}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Capex Terkait</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800">
                    {proposal.capexId}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">No. Aset</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800">
                    {proposal.noAsset}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: List Approval Timeline (5 cols) */}
          <div className="lg:col-span-5 p-6 space-y-4 bg-slate-50 overflow-y-auto max-h-[70vh]">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200">Riwayat Approval</h3>
            <div className="space-y-3">
              {proposal.approvalHistory && proposal.approvalHistory.length > 0 ? (
                proposal.approvalHistory.map((ap, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-semibold text-xs text-slate-700">
                          {ap.initials}
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-800 block">{ap.name}</span>
                          <span className="text-[9px] text-slate-500 font-normal">{ap.role}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-blue-600 text-white uppercase">
                        {ap.status}
                      </span>
                    </div>
                    {ap.note && (
                      <p className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic font-normal">
                        "{ap.note}"
                      </p>
                    )}
                    <span className="text-[9px] text-slate-400 font-mono block text-right font-normal">{ap.timestamp}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 italic text-xs font-normal">Belum ada riwayat approval.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-[10px] uppercase cursor-pointer"
          >
            Tutup
          </button>
          {proposal.status === "Approved" && (
            <button
              onClick={onOpenOtorisasi}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-[10px] uppercase shadow-2xs cursor-pointer active:scale-95 transition-all"
            >
              Ajukan Otorisasi Harga
            </button>
          )}
          <button
            onClick={() => downloadBodrPdf(proposal)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-[10px] uppercase shadow-2xs cursor-pointer active:scale-95 transition-all"
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
