"use client";

import React from "react";
import { BodrProposal } from "@/app/lib/api";

interface BodrApprovalTableProps {
  proposals: BodrProposal[];
  currentUser: any;
  onSelect: (proposal: BodrProposal) => void;
  onOpenAction: (proposal: BodrProposal) => void;
}

const statusBadgeColor = (s: string) => {
  switch (s) {
    case "Approved": return "bg-emerald-600/15 text-emerald-700 border border-emerald-300";
    case "Pending Review": return "bg-blue-600/15 text-blue-700 border border-blue-300";
    case "Revision Required": return "bg-orange-500/15 text-orange-700 border border-orange-300";
    case "Rejected": return "bg-red-600/15 text-red-700 border border-red-300";
    default: return "bg-slate-200 text-slate-700 border border-slate-300";
  }
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
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[10px] font-semibold uppercase tracking-wider select-none">
              <th className="py-2.5 px-2 text-center border-r border-slate-200">No</th>
              <th className="py-2.5 px-2 border-r border-slate-200">BODR ID</th>
              <th className="py-2.5 px-2 border-r border-slate-200">BODR NO</th>
              <th className="py-2.5 px-2 border-r border-slate-200">Requester</th>
              <th className="py-2.5 px-2 border-r border-slate-200">Create Date</th>
              <th className="py-2.5 px-2 border-r border-slate-200">Title/Judul</th>
              <th className="py-2.5 px-2 border-r border-slate-200">Benefit</th>
              <th className="py-2.5 px-2 border-r border-slate-200">Amount</th>
              <th className="py-2.5 px-2 text-center border-r border-slate-200">Status BODR</th>
              <th className="py-2.5 px-2 text-center border-r border-slate-200">Response Anda</th>
              <th className="py-2.5 px-2 text-center border-r border-slate-200">Nomor Assets</th>
              <th className="py-2.5 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 text-xs">
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-500 italic font-normal">
                  Tidak ada antrian persetujuan BODR yang memerlukan tindakan Anda saat ini.
                </td>
              </tr>
            ) : (
              proposals.map((p, idx) => {
                const userResponse = getUserResponse(p);
                const isApproved = p.status === "Approved" || userResponse === "Approved";

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-2 text-center font-medium text-slate-500 font-mono border-r border-slate-200">{idx + 1}</td>
                    <td className="py-2.5 px-2 font-mono font-semibold text-slate-800 border-r border-slate-200">
                      {p.status === "Approved" ? p.id : "—"}
                    </td>
                    <td className="py-2.5 px-2 font-mono font-medium text-blue-600 border-r border-slate-200">{p.bodrNo}</td>
                    <td className="py-2.5 px-2 font-normal text-slate-800 border-r border-slate-200">{p.proposer}</td>
                    <td className="py-2.5 px-2 font-medium text-slate-600 border-r border-slate-200">{p.date}</td>
                    <td className="py-2.5 px-2 font-normal text-slate-800 border-r border-slate-200 max-w-44 truncate" title={p.title}>{p.title}</td>
                    <td className="py-2.5 px-2 font-normal text-slate-600 border-r border-slate-200 max-w-36 truncate" title={p.benefit}>{p.benefit || "—"}</td>
                    <td className="py-2.5 px-2 font-mono font-semibold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                      Rp {p.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-200">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusBadgeColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-200 font-medium">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        userResponse === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                          : userResponse === "Rejected"
                          ? "bg-red-50 text-red-700 border border-red-300"
                          : "bg-blue-50 text-blue-700 border border-blue-300"
                      }`}>
                        {userResponse}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-700 border-r border-slate-200">
                      {p.noAsset || "—"}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {isApproved ? (
                        <button
                          onClick={() => onSelect(p)}
                          className="px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenAction(p)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95"
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
