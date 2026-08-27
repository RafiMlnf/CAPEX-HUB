"use client";

import React from "react";
import Link from "next/link";

interface BodrPendingListsProps {
  pendingCapex: any[];
  pendingBodr: any[];
}

export default function BodrPendingLists({
  pendingCapex,
  pendingBodr,
}: BodrPendingListsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Pending BODR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Antrian Pending Review BODR</h3>
            <p className="text-[10px] text-slate-500 font-medium">{pendingBodr.length} pengajuan menunggu approval</p>
          </div>
          <Link
            href="/bodr-approval"
            className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 uppercase"
          >
            Lihat Semua →
          </Link>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {pendingBodr.length === 0 ? (
            <p className="text-center text-slate-400 py-8 italic text-xs font-normal">Tidak ada antrian pending BODR.</p>
          ) : (
            pendingBodr.map((b) => (
              <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-mono font-semibold text-blue-600 block">{b.bodr_no || b.id}</span>
                  <span className="font-medium text-slate-800 truncate max-w-50 block">{b.title}</span>
                  <span className="text-[10px] text-slate-500 font-normal">Oleh: {b.proposer} ({b.department})</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold text-slate-800 block">Rp {Number(b.amount || 0).toLocaleString("id-ID")}</span>
                  <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {b.step}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Capex */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Antrian Pending Review Capex</h3>
            <p className="text-[10px] text-slate-500 font-medium">{pendingCapex.length} proposal menunggu gate review</p>
          </div>
          <Link
            href="/dashboard"
            className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 uppercase"
          >
            Lihat Semua →
          </Link>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {pendingCapex.length === 0 ? (
            <p className="text-center text-slate-400 py-8 italic text-xs font-normal">Tidak ada antrian pending Capex.</p>
          ) : (
            pendingCapex.map((c) => (
              <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-mono font-semibold text-purple-600 block">{c.id}</span>
                  <span className="font-medium text-slate-800 truncate max-w-50 block">{c.name}</span>
                  <span className="text-[10px] text-slate-500 font-normal">PIC: {c.pic} ({c.department})</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold text-slate-800 block">Rp {Number(c.estimated_cost || c.estimatedCost || 0).toLocaleString("id-ID")}</span>
                  <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    {c.gate_status || c.gateStatus || "Gate 1"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
