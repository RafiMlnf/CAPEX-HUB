"use client";

import React from "react";
import { BodrProposal } from "@/app/lib/api";

interface BodrApprovalTableProps {
  proposals: BodrProposal[];
  currentUser: any;
  onSelect: (proposal: BodrProposal) => void;
  onOpenAction: (proposal: BodrProposal) => void;
}

const statusBadgeStyle = (s: string) => {
  const st = (s || "").toLowerCase();
  if (st.includes("approved") || st.includes("closed")) {
    return { bg: "bg-emerald-50 text-emerald-700 border-emerald-300", dot: "bg-emerald-500" };
  }
  if (st.includes("revision") || st.includes("revise")) {
    return { bg: "bg-amber-50 text-amber-800 border-amber-300", dot: "bg-amber-500" };
  }
  if (st.includes("rejected")) {
    return { bg: "bg-red-50 text-red-700 border-red-300", dot: "bg-red-500" };
  }
  return { bg: "bg-blue-50 text-blue-700 border-blue-300", dot: "bg-blue-500" };
};

export default function BodrApprovalTable({
  proposals,
  currentUser,
  onSelect,
  onOpenAction,
}: BodrApprovalTableProps) {
  const getUserResponse = (p: BodrProposal) => {
    if (!currentUser) return "Pending";
    const userRole = (currentUser.role || "").toLowerCase();
    const userName = (currentUser.name || currentUser.username || "").toLowerCase();
    const myHistory = (p.approvalHistory || []).find((h: any) => 
      (h.role && h.role.toLowerCase() === userRole) || 
      (h.name && h.name.toLowerCase() === userName)
    );
    if (myHistory) return myHistory.status;
    return p.status === "Approved" ? "Approved" : "Pending";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider select-none">
              <th className="py-3 px-2 text-center border-r border-slate-200 w-10">No</th>
              <th className="py-3 px-2.5 border-r border-slate-200 whitespace-nowrap">BODR ID</th>
              <th className="py-3 px-2.5 border-r border-slate-200 whitespace-nowrap">BODR NO</th>
              <th className="py-3 px-3 border-r border-slate-200 whitespace-nowrap">Requester</th>
              <th className="py-3 px-2.5 border-r border-slate-200 whitespace-nowrap">Create Date</th>
              <th className="py-3 px-3 border-r border-slate-200 min-w-44">Title / Judul</th>
              <th className="py-3 px-3 border-r border-slate-200 min-w-36">Benefit</th>
              <th className="py-3 px-2.5 text-right border-r border-slate-200 whitespace-nowrap">Amount (Rp)</th>
              <th className="py-3 px-2.5 text-center border-r border-slate-200 whitespace-nowrap">Status BODR</th>
              <th className="py-3 px-2.5 text-center border-r border-slate-200 whitespace-nowrap">Response Anda</th>
              <th className="py-3 px-2.5 text-center border-r border-slate-200 whitespace-nowrap">Nomor Assets</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-xs text-slate-600">Tidak Ada Antrian Persetujuan</p>
                    <p className="text-[11px] text-slate-400 max-w-sm">
                      Saat ini tidak ada pengajuan BODR yang memerlukan tindakan Anda sesuai filter yang dipilih.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              proposals.map((p, idx) => {
                const userResponse = getUserResponse(p);
                const isApproved = p.status === "Approved" || userResponse === "Approved";
                const bodrStyle = statusBadgeStyle(p.status);
                const userStyle = statusBadgeStyle(userResponse);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-2 text-center font-medium text-slate-500 font-mono border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-2.5 font-mono font-semibold text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {p.status === "Approved" ? p.id : "—"}
                    </td>
                    <td className="py-3 px-2.5 font-mono font-bold text-indigo-600 border-r border-slate-100 whitespace-nowrap">
                      {p.bodrNo}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 border-r border-slate-100 whitespace-nowrap">
                      {p.proposer}
                    </td>
                    <td className="py-3 px-2.5 font-normal text-slate-500 border-r border-slate-100 whitespace-nowrap">
                      {p.date}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 border-r border-slate-100 max-w-56 truncate" title={p.title}>
                      {p.title}
                    </td>
                    <td className="py-3 px-3 font-normal text-slate-600 border-r border-slate-100 max-w-44 truncate" title={p.benefit}>
                      {p.benefit || "—"}
                    </td>
                    <td className="py-3 px-2.5 text-right font-mono font-semibold text-slate-800 border-r border-slate-100 whitespace-nowrap">
                      Rp {p.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-2.5 text-center border-r border-slate-100 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${bodrStyle.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${bodrStyle.dot}`} />
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-2.5 text-center border-r border-slate-100 whitespace-nowrap font-medium">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${userStyle.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${userStyle.dot}`} />
                        {userResponse}
                      </span>
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono font-semibold text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {p.noAsset || "—"}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isApproved ? (
                        <button
                          type="button"
                          onClick={() => onSelect(p)}
                          className="px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          View Details
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenAction(p)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-[11px] font-bold tracking-wide transition-all cursor-pointer shadow-2xs"
                        >
                          Approval
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
