"use client";

export default function ProgressStepper() {
  return (
    <div className="flex flex-wrap items-center gap-3.5 pb-2.5 border-b border-slate-100">
      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider shrink-0">
        CAPEX Stage & Workflow Progress
      </h2>

      {/* Connected Stepper Line */}
      <div className="flex flex-wrap items-center gap-1 text-[10px] font-semibold">
        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          PLANNING
        </span>
        <span className="text-slate-400">→</span>
        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          FINACCT REVIEW
        </span>
        <span className="text-slate-400">→</span>
        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          KOMITE REVIEW
        </span>
      </div>
    </div>
  );
}
