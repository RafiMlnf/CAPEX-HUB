"use client";

import React from "react";
import { BodrProposal } from "@/app/lib/api";
import { formatDateDisplay } from "@/app/lib/dateUtils";

interface BodrTableProps {
  proposals: BodrProposal[];
  onSelect: (proposal: BodrProposal) => void;
}

const statusBorderColor = (s: BodrProposal["status"]) => {
  switch (s) {
    case "Approved": return "border-l-emerald-500";
    case "Pending Review": return "border-l-blue-500";
    case "Revision Required": return "border-l-amber-500";
    case "Rejected": return "border-l-rose-500";
    default: return "border-l-slate-400";
  }
};

const StatusPill = ({ status }: { status: BodrProposal["status"] }) => {
  const s = (status || "").toLowerCase();

  if (s === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Approved
      </span>
    );
  }
  if (s === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Rejected
      </span>
    );
  }
  if (s === "revision required" || s === "revision") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Revision
      </span>
    );
  }
  if (s === "draft") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-300 shadow-2xs">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      Pending Review
    </span>
  );
};

export default function BodrTable({ proposals, onSelect }: BodrTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider select-none">
              <th className="py-3 px-2.5 text-center border-r border-slate-200/80 w-12">No</th>
              <th className="py-3 px-2.5 border-r border-slate-200/80">BODR ID</th>
              <th className="py-3 px-2.5 border-r border-slate-200/80">BODR No</th>
              <th className="py-3 px-2.5 border-r border-slate-200/80">Create Date</th>
              <th className="py-3 px-2.5 border-r border-slate-200/80">Requester</th>
              <th className="py-3 px-2.5 border-r border-slate-200/80">Title</th>
              <th className="py-3 px-2.5 border-r border-slate-200/80">Benefit</th>
              <th className="py-3 px-2.5 border-r border-slate-200/80">Amount</th>
              <th className="py-3 px-2.5 text-center border-r border-slate-200/80">Status BODR</th>
              <th className="py-3 px-2.5 text-center border-r border-slate-200/80">Capex</th>
              <th className="py-3 px-2.5 text-center border-r border-slate-200/80">No Asset</th>
              <th className="py-3 px-2.5 text-center w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 text-xs">
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-16 text-center text-slate-400 italic font-normal">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Tidak ada pengajuan BODR yang cocok dengan pencarian Anda.</span>
                  </div>
                </td>
              </tr>
            ) : (
              proposals.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`hover:bg-blue-50/40 transition-colors border-l-4 ${statusBorderColor(p.status)} ${
                    idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                  }`}
                >
                  <td className="py-3 px-2.5 text-center font-medium text-slate-500 font-mono border-r border-slate-200/70">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-2.5 font-mono font-bold text-slate-900 border-r border-slate-200/70">
                    #{p.id}
                  </td>
                  <td className="py-3 px-2.5 font-mono font-semibold text-slate-700 border-r border-slate-200/70">
                    {p.bodrNo}
                  </td>
                  <td className="py-3 px-2.5 text-slate-600 font-medium border-r border-slate-200/70 whitespace-nowrap">
                    {formatDateDisplay(p.date)}
                  </td>
                  <td
                    className="py-3 px-2.5 font-semibold text-slate-900 max-w-[120px] wrap-break-word whitespace-normal border-r border-slate-200/70"
                    title={p.proposer}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] uppercase shrink-0">
                        {p.proposer?.charAt(0) || "U"}
                      </span>
                      <span className="truncate">{p.proposer}</span>
                    </div>
                  </td>
                  <td
                    className="py-3 px-2.5 font-medium text-slate-800 max-w-[180px] wrap-break-word whitespace-normal border-r border-slate-200/70"
                    title={p.title}
                  >
                    {p.title}
                  </td>
                  <td
                    className="py-3 px-2.5 text-slate-600 max-w-[160px] wrap-break-word whitespace-normal border-r border-slate-200/70 font-normal"
                    title={p.benefit}
                  >
                    {p.benefit || "—"}
                  </td>
                  <td className="py-3 px-2.5 font-mono font-bold text-blue-700 border-r border-slate-200/70 whitespace-nowrap">
                    <span className="bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 text-[11px]">
                      Rp {p.amount.toLocaleString("id-ID")}
                    </span>
                  </td>
                  <td className="py-3 px-2.5 text-center border-r border-slate-200/70 whitespace-nowrap">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="py-3 px-2.5 text-center font-mono font-semibold text-slate-700 border-r border-slate-200/70">
                    {p.capexId || "—"}
                  </td>
                  <td className="py-3 px-2.5 text-center font-mono font-semibold text-slate-700 border-r border-slate-200/70">
                    {p.noAsset || "—"}
                  </td>
                  <td className="py-3 px-2.5 text-center">
                    <button
                      onClick={() => onSelect(p)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-blue-200 shadow-2xs"
                      title="Lihat Detail"
                    >
                      <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
