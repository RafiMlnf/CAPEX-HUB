"use client";

import React from "react";

interface BodrChartsProps {
  capexChart: { id: string; name: string; budget: number; actual: number }[];
  bodrExpense: { department: string; amount: number }[];
}

export default function BodrCharts({ capexChart, bodrExpense }: BodrChartsProps) {
  const maxExpense = Math.max(...bodrExpense.map((e) => e.amount), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: Budget vs Actual Capex */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Perbandingan Budget vs Realisasi BODR</h3>
          <div className="flex items-center gap-3 text-[10px] font-semibold">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Budget</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Realisasi</span>
          </div>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {capexChart.length === 0 ? (
            <p className="text-center text-slate-400 py-12 italic text-xs font-normal">Belum ada data Capex.</p>
          ) : (
            capexChart.map((c, idx) => {
              const maxVal = Math.max(c.budget, c.actual, 1);
              const budgetPct = (c.budget / maxVal) * 100;
              const actualPct = (c.actual / maxVal) * 100;

              return (
                <div key={idx} className="space-y-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span className="truncate max-w-55" title={c.name}>{c.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 font-medium">
                      Rp {c.actual.toLocaleString("id-ID")} / Rp {c.budget.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${budgetPct}%` }} />
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${actualPct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chart 2: Expense per Department */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="pb-2 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Distribusi Realisasi per Departemen</h3>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {bodrExpense.length === 0 ? (
            <p className="text-center text-slate-400 py-12 italic text-xs font-normal">Belum ada data pengeluaran departemen.</p>
          ) : (
            bodrExpense.map((d, idx) => {
              const pct = (d.amount / maxExpense) * 100;
              return (
                <div key={idx} className="space-y-1 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span>{d.department}</span>
                    <span className="font-mono text-blue-600 font-semibold">Rp {d.amount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-linear-to-r from-blue-500 to-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
