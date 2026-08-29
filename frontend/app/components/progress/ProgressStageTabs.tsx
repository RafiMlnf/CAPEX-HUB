"use client";

interface ProgressStageTabsProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  counts: {
    all: number;
    gate0: number;
    gate1: number;
    gate2: number;
    archive?: number;
    [key: string]: number | undefined;
  };
}

export default function ProgressStageTabs({
  activeTab,
  onTabChange,
  counts,
}: ProgressStageTabsProps) {
  const tabs = [
    { id: "all", label: "Semua Progres", count: counts.all || 0 },
    { id: "gate0", label: "Budget Planning Progress", count: counts.gate0 || 0 },
    { id: "gate1", label: "FinAcct Review Progress", count: counts.gate1 || 0 },
    { id: "gate2", label: "Committee Review Progress", count: counts.gate2 || 0 },
    { id: "archive", label: "Arsip", count: counts.archive || 0 },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isArchiveTab = tab.id === "archive";
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? isArchiveTab
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-blue-600 text-white shadow-xs"
                : isArchiveTab
                ? "bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100/70 border border-emerald-200"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {isArchiveTab && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            )}
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                isActive
                  ? "bg-white/20 text-white"
                  : isArchiveTab
                  ? "bg-emerald-200/60 text-emerald-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
