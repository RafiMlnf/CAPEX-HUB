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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xs shadow-2xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Antrian Pending BODR
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                {pendingBodr.length} pengajuan menunggu approval
              </p>
            </div>
          </div>
          <Link
            href="/bodr-approval"
            className="text-[10.5px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider flex items-center gap-1"
          >
            <span>Semua</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {pendingBodr.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-slate-100 text-slate-400 italic text-xs font-normal">
              Tidak ada antrian pending BODR saat ini.
            </div>
          ) : (
            pendingBodr.map((b) => (
              <div
                key={b.id}
                className="p-3 bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl flex justify-between items-center text-xs transition-all shadow-2xs gap-3"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-blue-600 text-xs">
                      {b.bodr_no || `#${b.id}`}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900 truncate block text-xs" title={b.title}>
                    {b.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate">
                    Pengusul: {b.proposer} ({b.department})
                  </span>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <span className="font-mono font-bold text-slate-900 block text-xs">
                    Rp {Number(b.amount || 0).toLocaleString("id-ID")}
                  </span>
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                    {b.step || "Step 1"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Capex */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold text-xs shadow-2xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Antrian Pending Capex
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                {pendingCapex.length} usulan menunggu review
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-[10.5px] font-bold text-purple-600 hover:text-purple-800 transition-colors uppercase tracking-wider flex items-center gap-1"
          >
            <span>Semua</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {pendingCapex.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-slate-100 text-slate-400 italic text-xs font-normal">
              Tidak ada antrian pending Capex saat ini.
            </div>
          ) : (
            pendingCapex.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-purple-300 rounded-xl flex justify-between items-center text-xs transition-all shadow-2xs gap-3"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-purple-600 text-xs">
                      #{c.id}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900 truncate block text-xs" title={c.name}>
                    {c.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate">
                    PIC: {c.pic} ({c.department})
                  </span>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <span className="font-mono font-bold text-slate-900 block text-xs">
                    Rp {Number(c.estimated_cost || c.estimatedCost || 0).toLocaleString("id-ID")}
                  </span>
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                    {(c.gate_status || c.gateStatus || "Review").replace(/^gate\s*\d+\s*[-–:]\s*/i, "")}
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
