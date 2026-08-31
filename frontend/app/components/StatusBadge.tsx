"use client";

import React from "react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  showDot?: boolean;
  noBackground?: boolean;
}

export default function StatusBadge({
  status,
  size = "sm",
  showDot = true,
  noBackground = false,
}: StatusBadgeProps) {
  const statusKey = (status || "").toLowerCase().trim();

  // Dynamic status category resolver
  const getStatusConfig = (key: string) => {
    // Approved / Done
    if (
      key.includes("approved") ||
      key.includes("completed") ||
      key.includes("closed") ||
      key === "active"
    ) {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
        label: key.includes("closed") ? "Completed" : "Approved",
        isPulse: false,
      };
    }

    // Rejected
    if (key.includes("reject") || key.includes("ditolak")) {
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
        label: "Rejected",
        isPulse: false,
      };
    }

    // Revision
    if (key.includes("revis") || key.includes("feedback")) {
      return {
        bg: "bg-amber-50 text-amber-800 border-amber-300",
        dot: "bg-amber-500",
        label: "Revision",
        isPulse: false,
      };
    }

    // Draft
    if (key === "draft" || key.includes("gate 0")) {
      return {
        bg: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-400",
        label: "Draft",
        isPulse: false,
      };
    }

    // Pending / In Review
    return {
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
      label: key.replace(/^gate\s*\d+\s*[-–:]\s*/i, "").trim() || "Pending Review",
      isPulse: true,
    };
  };

  const config = getStatusConfig(statusKey);
  const displayLabel =
    statusKey === "in_approval" || statusKey === "pending review"
      ? "Pending Review"
      : statusKey === "approved / archived"
      ? "Approved"
      : config.label;

  if (noBackground) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${config.bg.split(" ")[1]}`}>
        {showDot && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0 ${
              config.isPulse ? "animate-pulse" : ""
            }`}
          />
        )}
        <span className="capitalize">{displayLabel}</span>
      </span>
    );
  }

  const sizeClasses =
    size === "md"
      ? "px-3 py-1 text-xs gap-2 font-bold"
      : "px-2.5 py-0.5 text-[10px] gap-1.5 font-bold";

  return (
    <span
      className={`inline-flex items-center rounded-full uppercase tracking-wider border shadow-2xs ${config.bg} ${sizeClasses}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0 ${
            config.isPulse ? "animate-pulse" : ""
          }`}
        />
      )}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
