"use client";

import React from "react";

interface BodrKpiCardsProps {
  totalBudget: number;
  totalActual: number;
  totalBodr: number;
}

export default function BodrKpiCards({
  totalBudget,
  totalActual,
  totalBodr,
}: BodrKpiCardsProps) {
  const percentage = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Total Budget */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Anggaran (Capex)</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-xl font-semibold text-slate-800 font-mono">
          Rp {totalBudget.toLocaleString("id-ID")}
        </p>
        <p className="text-[10px] text-slate-500 font-medium">Total alokasi pagu Capex tahun berjalan</p>
      </div>

      {/* Total Actual */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Realisasi (BODR)</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-xl font-semibold text-emerald-600 font-mono">
          Rp {totalActual.toLocaleString("id-ID")}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }} />
          </div>
          <span className="text-[10px] font-semibold text-slate-600 font-mono">{percentage}%</span>
        </div>
      </div>

      {/* Total BODR Proposals */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Pengajuan BODR</span>
          <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <p className="text-xl font-semibold text-slate-800 font-mono">
          {totalBodr} <span className="text-xs font-normal text-slate-500">Dokumen</span>
        </p>
        <p className="text-[10px] text-slate-500 font-medium">Seluruh proposal yang terdaftar di sistem</p>
      </div>
    </div>
  );
}
