"use client";

import { useMemo } from "react";

// Status Badge Pill Component matching the reference design
export function ProgressStatusPill({ status }: { status: string }) {
  const s = (status || "").toLowerCase();

  if (s.includes("schedule committee review") || s.includes("committee review") || s.includes("closed") || s.includes("approved")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {status.toUpperCase().includes("SCHEDULE") ? "SCHEDULE COMMITTEE REVIEW" : status}
      </span>
    );
  }
  if (s.includes("finacct review") || s.includes("finance review") || s.includes("in progress") || s.includes("review")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-300 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        {status.toUpperCase().includes("FINACCT") ? "FINACCT REVIEW" : status}
      </span>
    );
  }
  if (s.includes("pending user feedback") || s.includes("pending") || s.includes("semi close")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-300 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        {status.toUpperCase().includes("PENDING") ? "PENDING USER FEEDBACK" : status}
      </span>
    );
  }
  if (s.includes("revise") || s.includes("draft") || s.includes("open")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {status.toUpperCase().includes("REVISE") ? "REVISE" : status}
      </span>
    );
  }
  // Default: Waiting / standard status
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {status || "Waiting"}
    </span>
  );
}

export interface ProgressRowData {
  id: string;
  name: string;
  department: string;
  purpose?: string;
  investmentType?: string;
  estimatedCost?: number;
  g0Days: string;
  g0Status: string;
  g1Days: string;
  g1Status: string;
  g2Days: string;
  g2Status: string;
}

interface ProgressMatrixTableProps {
  loading: boolean;
  rows: ProgressRowData[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

export default function ProgressMatrixTable({
  loading,
  rows,
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: ProgressMatrixTableProps) {
  const totalEntries = rows.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return rows.slice(start, start + itemsPerPage);
  }, [rows, currentPage, itemsPerPage]);

  return (
    <div className="space-y-3">
      {/* Matrix Progress Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-2xs">
        <table className="w-full min-w-[1000px] text-left border-collapse">
          <thead>
            {/* Top Header Grouping */}
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              <th colSpan={5} className="py-2.5 px-3 text-center border-r border-slate-200 bg-slate-100/60">
                DETAILS
              </th>
              <th colSpan={2} className="py-2.5 px-2 text-center border-r border-slate-200 bg-blue-50/40 text-blue-800">
                PLANNING
              </th>
              <th colSpan={2} className="py-2.5 px-2 text-center border-r border-slate-200 bg-indigo-50/40 text-indigo-800">
                FINACCT REVIEW
              </th>
              <th colSpan={2} className="py-2.5 px-2 text-center bg-purple-50/40 text-purple-800">
                KOMITE REVIEW
              </th>
            </tr>

            {/* Sub Header Columns */}
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[9px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="py-2 px-2.5 w-10 text-center border-r border-slate-200">No</th>
              <th className="py-2 px-2.5 w-28 border-r border-slate-200 whitespace-nowrap">ID Capex</th>
              <th className="py-2 px-3 min-w-[180px] border-r border-slate-200">Nama Proyek</th>
              <th className="py-2 px-2.5 w-28 border-r border-slate-200 whitespace-nowrap">Departemen</th>
              <th className="py-2 px-2.5 w-28 border-r border-slate-200 text-right whitespace-nowrap">Budget (Rp)</th>

              {/* Gate 0 */}
              <th className="py-2 px-1.5 w-20 text-center border-r border-slate-200 whitespace-nowrap">Actual (Days)</th>
              <th className="py-2 px-2 w-28 text-center border-r border-slate-200 whitespace-nowrap">Status</th>

              {/* Gate 1 */}
              <th className="py-2 px-1.5 w-20 text-center border-r border-slate-200 whitespace-nowrap">Actual (Days)</th>
              <th className="py-2 px-2 w-28 text-center border-r border-slate-200 whitespace-nowrap">Status</th>

              {/* Gate 2 */}
              <th className="py-2 px-1.5 w-20 text-center border-r border-slate-200 whitespace-nowrap">Actual (Days)</th>
              <th className="py-2 px-2 w-28 text-center whitespace-nowrap">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                  Memuat data matrix progres...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                  Tidak ada usulan capex yang sesuai dengan filter.
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
                    <td className="py-2.5 px-2.5 font-mono font-semibold text-blue-600 border-r border-slate-100 whitespace-nowrap">
                      {r.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-slate-100">
                      <div>{r.name}</div>
                      {r.purpose && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {r.purpose} {r.investmentType ? `• ${r.investmentType}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-600 border-r border-slate-100 whitespace-nowrap font-normal">
                      {r.department}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-semibold font-mono text-slate-800 border-r border-slate-100 whitespace-nowrap">
                      Rp {(r.estimatedCost || 0).toLocaleString("id-ID")}
                    </td>

                    {/* Gate 0 */}
                    <td className="py-2.5 px-1.5 text-center font-mono text-slate-700 border-r border-slate-100">
                      {r.g0Days}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-100">
                      <ProgressStatusPill status={r.g0Status} />
                    </td>

                    {/* Gate 1 */}
                    <td className="py-2.5 px-1.5 text-center font-mono text-slate-700 border-r border-slate-100">
                      {r.g1Days}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-100">
                      <ProgressStatusPill status={r.g1Status} />
                    </td>

                    {/* Gate 2 */}
                    <td className="py-2.5 px-1.5 text-center font-mono text-slate-700 border-r border-slate-100">
                      {r.g2Days}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <ProgressStatusPill status={r.g2Status} />
                    </td>
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
                  ? "bg-blue-600 text-white shadow-2xs"
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
