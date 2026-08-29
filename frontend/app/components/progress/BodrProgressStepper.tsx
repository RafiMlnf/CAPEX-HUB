"use client";

interface BodrProgressStepperProps {
  steps?: string[];
  phaseLabels?: string[];
}

export default function BodrProgressStepper({ steps, phaseLabels }: BodrProgressStepperProps) {
  const dynamicSteps = steps || phaseLabels || [];

  return (
    <div className="flex flex-wrap items-center gap-3.5 pb-2.5 border-b border-slate-100">
      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider shrink-0">
        BODR Stage &amp; Workflow Progress
      </h2>

      {dynamicSteps.length === 0 ? (
        <span className="text-[11px] text-slate-400 italic">
          (Workflow approval belum diatur di Settings Admin)
        </span>
      ) : (
        /* Connected Stepper Line — 100% dinamis dari workflow langkah approval */
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
          {dynamicSteps.map((label, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider font-bold">
                {label}
              </span>
              {idx < dynamicSteps.length - 1 && (
                <span className="text-slate-400 font-bold">→</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
