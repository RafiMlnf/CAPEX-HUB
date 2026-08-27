"use client";

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
    borderLeft: "border-l-4 border-l-blue-500 bg-blue-50/20 text-blue-700",
  },
  green: {
    borderLeft: "border-l-4 border-l-emerald-500 bg-emerald-50/20 text-emerald-700",
  },
  amber: {
    borderLeft: "border-l-4 border-l-amber-500 bg-amber-50/20 text-amber-700",
  },
  red: {
    borderLeft: "border-l-4 border-l-red-500 bg-red-50/20 text-red-700",
  },
  purple: {
    borderLeft: "border-l-4 border-l-purple-500 bg-purple-50/20 text-purple-700",
  },
};

export default function KpiCard({
  title,
  value,
  target,
  trend,
  trendValue,
  color = "blue",
  icon,
}: KpiCardProps) {
  const c = colorMap[color];

  return (
    <div className={`relative rounded-xl border border-slate-200 p-4 shadow-xs overflow-hidden ${c.borderLeft}`}>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-none mb-2.5 truncate">{title}</p>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold tracking-tight leading-tight text-slate-800">{value}</h3>
        {icon && (
          <div className="p-1.5 rounded-lg bg-white/70 text-slate-600 shadow-xs shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
