"use client";

export interface StageTabItem {
  id: string;
  label: string;
  count: number;
}

interface BodrProgressStageTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs?: StageTabItem[];
  counts?: Record<string, number>;
  steps?: string[];
  phaseLabels?: string[];
}

export default function BodrProgressStageTabs({
  activeTab,
  onTabChange,
  tabs,
  counts = {},
  steps = [],
  phaseLabels,
}: BodrProgressStageTabsProps) {
  const dynamicSteps = steps.length > 0 ? steps : phaseLabels || [];

  const tabList: StageTabItem[] = tabs && tabs.length > 0
    ? tabs
    : [
        { id: "all", label: "Semua Progres", count: counts.all || 0 },
        ...dynamicSteps.map((s) => ({
          id: s,
          label: s,
          count: counts[s] || 0,
        })),
      ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabList.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? "bg-indigo-600 text-white shadow-xs"
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
