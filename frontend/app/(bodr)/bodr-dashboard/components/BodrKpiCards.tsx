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
      <div className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-5 space-y-3 shadow-2xs transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
            Total Anggaran (Capex)
          </span>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            Rp {totalBudget.toLocaleString("id-ID")}
          </p>
          <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">
            Total alokasi pagu Capex tahun berjalan
          </p>
        </div>
      </div>

      {/* Total Actual */}
      <div className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 space-y-3 shadow-2xs transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
            Total Realisasi (BODR)
          </span>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xs">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-600 font-mono tracking-tight">
            Rp {totalActual.toLocaleString("id-ID")}
          </p>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700 font-mono">{percentage}%</span>
          </div>
        </div>
      </div>

      {/* Total BODR Proposals */}
      <div className="bg-white border border-slate-200/90 hover:border-purple-300 rounded-2xl p-5 space-y-3 shadow-2xs transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
            Total Pengajuan BODR
          </span>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-xs">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {totalBodr} <span className="text-xs font-semibold text-slate-400">Dokumen</span>
          </p>
          <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">
            Seluruh proposal yang terdaftar di sistem
          </p>
        </div>
      </div>
    </div>
  );
}
