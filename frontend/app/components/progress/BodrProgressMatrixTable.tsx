"use client";

import React, { useMemo } from "react";
import { BodrProgressProposalItem } from "../../lib/api";

// Status Badge Pill Component for BODR Progress
export function BodrProgressStatusPill({ status }: { status: string }) {
  const s = (status || "").toLowerCase();

  if (s.includes("approved") || s.includes("closed")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {status}
      </span>
    );
  }
  if (s.includes("in progress") || s.includes("pending")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-300 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        {status}
      </span>
    );
  }
  if (s.includes("revision") || s.includes("revise")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {status}
      </span>
    );
  }
  if (s.includes("rejected")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-300 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        {status}
      </span>
    );
  }
  // Default: Waiting
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {status || "Waiting"}
    </span>
  );
}

export interface BodrProgressStepStatus {
  days: string;
  status: string;
}

export interface BodrProgressRowData {
  id: string;
  bodr_no: string;
  title: string;
  category: string;
  department: string;
  proposer: string;
  amount: number;
  step: string;
  status: string;
  created_at: string;
  stepStatuses?: Record<string, BodrProgressStepStatus>;
  f1Days?: string;
  f1Status?: string;
  f2Days?: string;
  f2Status?: string;
  f3Days?: string;
  f3Status?: string;
  rawProposal: BodrProgressProposalItem;
}

interface BodrProgressMatrixTableProps {
  loading: boolean;
  rows: BodrProgressRowData[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  onSelectProject?: (row: BodrProgressRowData) => void;
  steps?: string[];
  phaseLabels?: string[];
}

const fmt = (n: number) => `Rp ${(n || 0).toLocaleString("id-ID")}`;

const STEP_HEADER_COLORS = [
  "bg-blue-50/40 text-blue-800",
  "bg-indigo-50/40 text-indigo-800",
  "bg-purple-50/40 text-purple-800",
  "bg-emerald-50/40 text-emerald-800",
  "bg-amber-50/40 text-amber-800",
  "bg-cyan-50/40 text-cyan-800",
  "bg-rose-50/40 text-rose-800",
];

export default function BodrProgressMatrixTable({
  loading,
  rows,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  onSelectProject,
  steps,
  phaseLabels,
}: BodrProgressMatrixTableProps) {
  const totalEntries = rows.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;

  const dynamicSteps = steps || phaseLabels || [];

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return rows.slice(start, start + itemsPerPage);
  }, [rows, currentPage, itemsPerPage]);

  const totalColumns = 7 + dynamicSteps.length * 2;

  return (
    <div className="space-y-3">
      {/* Matrix Progress Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-2xs">
        <table className="w-full min-w-[1050px] text-left border-collapse">
          <thead>
            {/* Top Header Grouping — 100% dinamis per step workflow */}
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              <th colSpan={7} className="py-2.5 px-3 text-center border-r border-slate-200 bg-slate-100/60">
                DETAILS
              </th>
              {dynamicSteps.map((stepName, sIdx) => {
                const colorClass = STEP_HEADER_COLORS[sIdx % STEP_HEADER_COLORS.length];
                return (
                  <th
                    key={sIdx}
                    colSpan={2}
                    className={`py-2.5 px-2 text-center border-r border-slate-200 ${colorClass}`}
                  >
                    {stepName.toUpperCase()}
                  </th>
                );
              })}
            </tr>

            {/* Sub Header Columns */}
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[9px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="py-2 px-2.5 w-10 text-center border-r border-slate-200">No</th>
              <th className="py-2 px-2.5 w-28 border-r border-slate-200 whitespace-nowrap">No BODR</th>
              <th className="py-2 px-3 min-w-[160px] border-r border-slate-200">Judul</th>
              <th className="py-2 px-3 w-20 border-r border-slate-200 whitespace-nowrap">Kategori</th>
              <th className="py-2 px-3 w-28 border-r border-slate-200 whitespace-nowrap">Departemen</th>
              <th className="py-2 px-3 w-28 border-r border-slate-200 whitespace-nowrap">Pengusul</th>
              <th className="py-2 px-2.5 w-28 border-r border-slate-200 text-right whitespace-nowrap">Amount (Rp)</th>

              {/* Dynamic Step Sub-columns */}
              {dynamicSteps.map((_, sIdx) => (
                <React.Fragment key={sIdx}>
                  <th className="py-2 px-1.5 w-20 text-center border-r border-slate-200 whitespace-nowrap">Actual (Days)</th>
                  <th className="py-2 px-2 w-28 text-center border-r border-slate-200 whitespace-nowrap">Status</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={totalColumns} className="py-8 text-center text-slate-400 italic">
                  Memuat data matrix progres BODR...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="py-8 text-center text-slate-400 italic">
                  Tidak ada pengajuan BODR yang sesuai dengan filter.
                </td>
              </tr>
            ) : (
              paginatedRows.map((r, idx) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-2.5 text-center font-mono text-slate-500 border-r border-slate-100">
                      {globalIndex}
                    </td>
                    <td className="py-2.5 px-2.5 font-mono font-semibold text-indigo-600 border-r border-slate-100 whitespace-nowrap">
                      {r.bodr_no || "-"}
                    </td>
                    <td
                      onClick={() => onSelectProject?.(r)}
                      className="py-2.5 px-3 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer border-r border-slate-100 transition-colors"
                      title={`Klik untuk melihat detail riwayat approval "${r.title}"`}
                    >
                      {r.title}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700 border-r border-slate-100 whitespace-nowrap text-xs">
                      {r.category || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100 whitespace-nowrap text-xs">
                      {r.department || "—"}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-600 border-r border-slate-100 whitespace-nowrap font-normal">
                      {r.proposer || "—"}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-semibold font-mono text-slate-800 border-r border-slate-100 whitespace-nowrap">
                      {fmt(r.amount)}
                    </td>

                    {/* Dynamic Step Data Cells */}
                    {dynamicSteps.map((stepName, sIdx) => {
                      const stepData = r.stepStatuses?.[stepName] || (
                        sIdx === 0
                          ? { days: r.f1Days || "-", status: r.f1Status || "Waiting" }
                          : sIdx === 1
                          ? { days: r.f2Days || "-", status: r.f2Status || "Waiting" }
                          : sIdx === 2
                          ? { days: r.f3Days || "-", status: r.f3Status || "Waiting" }
                          : { days: "-", status: "Waiting" }
                      );

                      return (
                        <React.Fragment key={sIdx}>
                          <td className="py-2.5 px-1.5 text-center font-mono text-slate-700 border-r border-slate-100">
                            {stepData.days}
                          </td>
                          <td className="py-2.5 px-2 text-center border-r border-slate-100">
                            <BodrProgressStatusPill status={stepData.status} />
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>of {totalEntries} entries</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium shadow-2xs cursor-pointer"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              type="button"
              onClick={() => onPageChange(pg)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentPage === pg
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
              }`}
            >
              {pg}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium shadow-2xs cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
