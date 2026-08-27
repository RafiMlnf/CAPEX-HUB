"use client";

export default function ProgressStatusLegend() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-2xs flex flex-wrap items-center gap-2.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none shrink-0">
        STATUS LEGEND:
      </span>
      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        {/* 1. FINACCT REVIEW */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          FINACCT REVIEW
        </span>

        {/* 2. PENDING USER FEEDBACK */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          PENDING USER FEEDBACK
        </span>

        {/* 3. REVISE */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          REVISE
        </span>

        {/* 4. SCHEDULE COMMITTEE REVIEW */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          SCHEDULE COMMITTEE REVIEW
        </span>
      </div>
    </div>
  );
}
