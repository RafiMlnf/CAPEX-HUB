"use client";

export default function BodrProgressStatusLegend() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-2xs flex flex-wrap items-center gap-2.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none shrink-0">
        STATUS LEGEND:
      </span>
      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        {/* IN PROGRESS */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          IN PROGRESS
        </span>

        {/* APPROVED */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          APPROVED
        </span>

        {/* REVISION */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          REVISION
        </span>

        {/* REJECTED */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          REJECTED
        </span>

        {/* WAITING */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          WAITING
        </span>
      </div>
    </div>
  );
}
