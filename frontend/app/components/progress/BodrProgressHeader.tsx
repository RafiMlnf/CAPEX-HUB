"use client";

interface BodrProgressHeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onExportExcel: () => void;
  totalCount: number;
}

export default function BodrProgressHeader({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onExportExcel,
  totalCount,
}: BodrProgressHeaderProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
      {/* Title & Info */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">BODR Progress Monitoring</h1>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
              BODR Workflows
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-normal">
            Monitoring tahapan approval pengajuan BODR secara realtime berdasarkan workflow per departemen.
          </p>
        </div>
      </div>

      {/* Action Buttons & Filters */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
        {/* Search Bar */}
        <div className="relative w-48 sm:w-56">
          <input
            type="text"
            placeholder="Cari No BODR, Judul, Pengusul..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
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

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs appearance-none"
          >
            <option value="All">Semua Status</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Revision Required">Revision Required</option>
            <option value="Rejected">Rejected</option>
          </select>
          <span className="pointer-events-none absolute right-2.5 inset-y-0 flex items-center text-slate-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </span>
        </div>

        {/* Total Count */}
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{totalCount} BODR</span>

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
