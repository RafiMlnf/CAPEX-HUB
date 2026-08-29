"use client";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  showDot?: boolean;
  noBackground?: boolean;
}

export default function StatusBadge({ status, size = "sm", showDot = false, noBackground = true }: StatusBadgeProps) {
  const badgeMap: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "approved / archived": "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    "pending review": "bg-amber-50 text-amber-700 border-amber-200",
    in_approval: "bg-amber-50 text-amber-700 border-amber-200",
    draft: "bg-slate-50 text-slate-700 border-slate-200",
    open: "bg-blue-50 text-blue-700 border-blue-200",
    "on track": "bg-blue-50 text-blue-700 border-blue-200",
    "revision required": "bg-orange-50 text-orange-700 border-orange-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-slate-50 text-slate-600 border-slate-200",
    "gate 0 - idea": "bg-blue-50 text-blue-700 border-blue-200",
    "gate 1 - finance review": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "gate 1 - pending user feedback": "bg-orange-50 text-orange-700 border-orange-200",
    "gate 1 - revise": "bg-amber-50 text-amber-700 border-amber-200",
    "gate 2 - committee review": "bg-purple-50 text-purple-700 border-purple-200",
    "gate 2 - revised": "bg-amber-50 text-amber-700 border-amber-200",
    "gate 2 - rejected": "bg-red-50 text-red-700 border-red-200",
    "gate 3 - procurement": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "gate 4 - commissioning": "bg-teal-50 text-teal-700 border-teal-200",
    "gate 5 - benefit realization": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "gate 6 - project closing": "bg-rose-50 text-rose-700 border-rose-200",
    closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  
  const dotMap: Record<string, string> = {
    approved: "bg-emerald-500",
    "approved / archived": "bg-emerald-500",
    rejected: "bg-red-500",
    pending: "bg-amber-500",
    "pending review": "bg-amber-500",
    in_approval: "bg-amber-500",
    draft: "bg-slate-400",
    open: "bg-blue-500",
    "on track": "bg-blue-500",
    "revision required": "bg-orange-500",
    completed: "bg-emerald-500",
    active: "bg-emerald-500",
    inactive: "bg-slate-400",
    "gate 0 - idea": "bg-blue-500",
    "gate 1 - finance review": "bg-indigo-500",
    "gate 1 - pending user feedback": "bg-orange-500",
    "gate 1 - revise": "bg-amber-500",
    "gate 2 - committee review": "bg-purple-500",
    "gate 2 - revised": "bg-amber-500",
    "gate 2 - rejected": "bg-red-500",
    "gate 3 - procurement": "bg-cyan-500",
    "gate 4 - commissioning": "bg-teal-500",
    "gate 5 - benefit realization": "bg-emerald-500",
    "gate 6 - project closing": "bg-rose-500",
    closed: "bg-emerald-500",
  };

  const labelMap: Record<string, string> = {
    approved: "Approved",
    rejected: "Rejected",
    pending: "Pending",
    "pending review": "Pending Review",
    in_approval: "In Approval",
    draft: "Draft",
    open: "Open",
    "on track": "On Track",
    "revision required": "Revision Required",
    completed: "Completed",
    active: "Active",
    inactive: "Inactive",
    "gate 0 - idea": "Idea",
    "gate 1 - finance review": "FinAcct Review",
    "gate 1 - pending user feedback": "Pending Feedback",
    "gate 1 - revise": "Finance: Revision",
    "gate 2 - committee review": "Committee Review",
    "gate 2 - revised": "Committee: Revision",
    "gate 2 - rejected": "Committee: Rejected",
    "gate 3 - procurement": "CAPEX Approval",
    "gate 4 - commissioning": "Propose AOP",
    "gate 5 - benefit realization": "Realization",
    "gate 6 - project closing": "Monitoring / PIR",
    closed: "Completed (Closed)",
  };

  const statusKey = status.toLowerCase();
  const badgeClass = badgeMap[statusKey] || "bg-slate-50 text-slate-700 border-slate-200";
  const dotClass = dotMap[statusKey] || "bg-slate-400";
  const label = labelMap[statusKey] || status;

  if (noBackground) {
    const textColorMap: Record<string, string> = {
      approved: "text-emerald-700",
      "approved / archived": "text-emerald-700",
      rejected: "text-red-700",
      pending: "text-amber-700",
      "pending review": "text-amber-700",
      in_approval: "text-amber-700",
      draft: "text-slate-600",
      open: "text-blue-700",
      "on track": "text-blue-700",
      "revision required": "text-orange-700",
      completed: "text-emerald-700",
      active: "text-emerald-700",
      inactive: "text-slate-500",
      "gate 0 - idea": "text-blue-700",
      "gate 1 - finance review": "text-indigo-700",
      "gate 1 - pending user feedback": "text-orange-700",
      "gate 1 - revise": "text-amber-700",
      "gate 2 - committee review": "text-purple-700",
      "gate 2 - revised": "text-amber-700",
      "gate 2 - rejected": "text-red-700",
      "gate 3 - procurement": "text-cyan-700",
      "gate 4 - commissioning": "text-teal-700",
      "gate 5 - benefit realization": "text-emerald-700",
      "gate 6 - project closing": "text-rose-700",
      closed: "text-emerald-700",
    };
    const textColor = textColorMap[statusKey] || "text-slate-700";
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${textColor}`}>
        {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotClass} shrink-0`} />}
        <span>{label}</span>
      </span>
    );
  }

  if (size === "sm") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border ${badgeClass}`}>
        {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />}
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold border ${badgeClass}`}>
      {showDot && <span className={`w-2 h-2 rounded-full ${dotClass}`} />}
      {label}
    </span>
  );
}
