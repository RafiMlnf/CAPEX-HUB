"use client";

import React from "react";

interface KpiCardProps {
  title: string;
  value: string;
  target?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  color?: "blue" | "green" | "amber" | "red" | "purple";
  icon?: React.ReactNode;
}

const colorMap = {
  blue: {
    border: "hover:border-blue-300",
    bgIcon: "bg-blue-50 text-blue-600 border border-blue-200",
    textVal: "text-slate-900",
    dot: "bg-blue-500",
  },
  green: {
    border: "hover:border-emerald-300",
    bgIcon: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    textVal: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  amber: {
    border: "hover:border-amber-300",
    bgIcon: "bg-amber-50 text-amber-600 border border-amber-200",
    textVal: "text-amber-700",
    dot: "bg-amber-500",
  },
  red: {
    border: "hover:border-rose-300",
    bgIcon: "bg-rose-50 text-rose-600 border border-rose-200",
    textVal: "text-rose-700",
    dot: "bg-rose-500",
  },
  purple: {
    border: "hover:border-purple-300",
    bgIcon: "bg-purple-50 text-purple-600 border border-purple-200",
    textVal: "text-purple-700",
    dot: "bg-purple-500",
  },
};

export default function KpiCard({
  title,
  value,
  color = "blue",
  icon,
}: KpiCardProps) {
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs transition-all duration-200 hover:shadow-md ${c.border} space-y-2`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider truncate flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
          {title}
        </p>
        {icon && (
          <div className={`p-2 rounded-xl shrink-0 shadow-2xs ${c.bgIcon}`}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <h3 className={`text-2xl font-bold tracking-tight font-mono ${c.textVal}`}>
          {value}
        </h3>
      </div>
    </div>
  );
}
