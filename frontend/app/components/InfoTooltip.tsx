import React from "react";

interface InfoTooltipProps {
  content: string;
}

export default function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <div className="relative group inline-flex items-center ml-2 select-none self-center" style={{ transform: "translateY(-1px)" }}>
      <button
        type="button"
        className="inline-flex items-center justify-center text-slate-400 hover:text-blue-400 border border-slate-500 hover:border-blue-400 rounded-full transition-colors cursor-help focus:outline-none"
        style={{ width: "14px", height: "14px", fontSize: "9px", fontWeight: "bold", padding: 0, lineHeight: 1 }}
      >
        i
      </button>
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block group-focus:block w-64 p-2.5 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg shadow-xl z-50 pointer-events-none leading-relaxed text-left font-normal normal-case tracking-normal">
        {content}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-4 border-transparent border-b-slate-900" />
      </div>
    </div>
  );
}
