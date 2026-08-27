"use client";

interface ProgressStageTabsProps {
  activeTab: "all" | "gate0" | "gate1" | "gate2";
  onTabChange: (tab: "all" | "gate0" | "gate1" | "gate2") => void;
  counts: {
    all: number;
    gate0: number;
    gate1: number;
    gate2: number;
  };
}

export default function ProgressStageTabs({
  activeTab,
  onTabChange,
  counts,
}: ProgressStageTabsProps) {
  const tabs = [
    { id: "all" as const, label: "Semua Progres", count: counts.all },
    { id: "gate0" as const, label: "Budget Planning Progress", count: counts.gate0 },
    { id: "gate1" as const, label: "FinAcct Review Progress", count: counts.gate1 },
    { id: "gate2" as const, label: "Committee Review Progress", count: counts.gate2 },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
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
