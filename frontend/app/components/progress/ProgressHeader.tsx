"use client";

interface ProgressHeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onExportExcel: () => void;
}

export default function ProgressHeader({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onExportExcel,
}: ProgressHeaderProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
      {/* Title & Info */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">CAPEX Progress Monitoring</h1>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
              CAPEX Workflows
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-normal">
            Monitoring tahapan usulan anggaran belanja modal (Gate 0 s/d Gate 3+) secara realtime.
          </p>
        </div>
      </div>

      {/* Action Buttons & Filters */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
        {/* Search Bar */}
        <div className="relative w-48 sm:w-56">
          <input
            type="text"
            placeholder="Cari ID Capex, Proyek, PIC, Dept..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
          />
          <svg
            className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* All Statuses Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs appearance-none"
          >
            <option value="All">Semua Status</option>
            <option value="Closed">Closed</option>
            <option value="In Progress">In Progress</option>
            <option value="Open">Open</option>
            <option value="Waiting">Waiting</option>
            <option value="Semi Close">Semi Close</option>
            <option value="Overdue, Open">Overdue, Open</option>
            <option value="Overdue, Closed">Overdue, Closed</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 inset-y-0 flex items-center text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </span>
        </div>

        {/* Export Excel Button */}
        <button
          type="button"
          onClick={onExportExcel}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
        >
          <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Excel
        </button>
      </div>
    </div>
  );
}
