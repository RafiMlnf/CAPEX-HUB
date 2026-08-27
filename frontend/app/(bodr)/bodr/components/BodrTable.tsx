"use client";

import React from "react";
import { BodrProposal } from "@/app/lib/api";

interface BodrTableProps {
  proposals: BodrProposal[];
  onSelect: (proposal: BodrProposal) => void;
}

const statusBorderColor = (s: BodrProposal["status"]) => {
  switch (s) {
    case "Approved": return "border-l-emerald-500";
    case "Pending Review": return "border-l-blue-500";
    case "Revision Required": return "border-l-orange-500";
    case "Rejected": return "border-l-red-500";
    default: return "border-l-slate-700";
  }
};

const statusBadgeColor = (s: BodrProposal["status"]) => {
  switch (s) {
    case "Approved": return "bg-emerald-600/15 text-emerald-700 border border-emerald-300";
    case "Pending Review": return "bg-blue-600/15 text-blue-700 border border-blue-300";
    case "Revision Required": return "bg-orange-500/15 text-orange-700 border border-orange-300";
    case "Rejected": return "bg-red-600/15 text-red-700 border border-red-300";
    default: return "bg-slate-200 text-slate-700 border border-slate-300";
  }
};

export default function BodrTable({ proposals, onSelect }: BodrTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[10px] font-semibold uppercase tracking-wider select-none">
              <th className="py-2.5 px-2 text-center border-r border-slate-200">No</th>
              <th className="py-2.5 px-2 border-r border-slate-200">BODR ID</th>
              <th className="py-2.5 px-2 border-r border-slate-200">BODR No</th>
              <th className="py-2.5 px-2 border-r border-slate-200">Create Date</th>
              <th className="py-2.5 px-2 border-r border-slate-200">Requester</th>
              <th className="py-2.5 px-2 border-r border-slate-200">Title</th>
              <th className="py-2.5 px-2 border-r border-slate-200">Benefit</th>
              <th className="py-2.5 px-2 border-r border-slate-200">Amount</th>
              <th className="py-2.5 px-2 text-center border-r border-slate-200">Status BODR</th>
              <th className="py-2.5 px-2 text-center border-r border-slate-200">Capex</th>
              <th className="py-2.5 px-2 text-center border-r border-slate-200">No Asset</th>
              <th className="py-2.5 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 text-xs">
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-500 italic font-normal">
                  Tidak ada pengajuan BODR yang cocok dengan pencarian Anda.
                </td>
              </tr>
            ) : (
              proposals.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50 transition-colors border-l-4 ${statusBorderColor(p.status)} ${
                    idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"
                  }`}
                >
                  <td className="py-2.5 px-2 text-center font-medium text-slate-500 font-mono border-r border-slate-200">{idx + 1}</td>
                  <td className="py-2.5 px-2 font-mono font-semibold text-slate-800 border-r border-slate-200">{p.id}</td>
                  <td className="py-2.5 px-2 font-mono font-normal text-slate-700 border-r border-slate-200">{p.bodrNo}</td>
                  <td className="py-2.5 px-2 text-slate-600 font-medium border-r border-slate-200">{p.date}</td>
                  <td className="py-2.5 px-2 font-semibold text-slate-800 max-w-25 wrap-break-word whitespace-normal border-r border-slate-200" title={p.proposer}>{p.proposer}</td>
                  <td className="py-2.5 px-2 font-normal text-slate-800 max-w-50 wrap-break-word whitespace-normal border-r border-slate-200" title={p.title}>{p.title}</td>
                  <td className="py-2.5 px-2 text-slate-600 max-w-50 wrap-break-word whitespace-normal border-r border-slate-200 font-normal" title={p.benefit}>{p.benefit}</td>
                  <td className="py-2.5 px-2 font-mono font-semibold text-blue-600 border-r border-slate-200 whitespace-nowrap">
                    Rp {p.amount.toLocaleString("id-ID")}
                  </td>
                  <td className="py-2.5 px-2 text-center border-r border-slate-200">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusBadgeColor(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-700 border-r border-slate-200">{p.capexId}</td>
                  <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-700 border-r border-slate-200">{p.noAsset}</td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={() => onSelect(p)}
                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
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
