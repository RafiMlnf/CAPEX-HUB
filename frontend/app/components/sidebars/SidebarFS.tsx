"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCapex } from "../../context/CapexContext";
import { useState, useEffect } from "react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zm10-5a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8z" />
      </svg>
    ),
    hasDotKey: "",
  },
  {
    href: "/planning",
    label: "Perencanaan CAPEX",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    hasDotKey: "planning",
  },
  {
    href: "/finance-review",
    label: "Finance Review",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    hasDotKey: "financeReview",
  },
  {
    href: "/approvals",
    label: "Komite Review",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    hasDotKey: "approvals",
  },
  {
    href: "/drafts",
    label: "Draft CAPEX",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    hasDotKey: "drafts",
  },
];

export default function SidebarFS() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "";
  const { proposals, hasPermission, hasRole, currentUser } = useCapex();

  const isFinanceOrAdmin = hasPermission("perm_review_capex") || hasRole("Finance", "Accounting", "Admin");
  const isChildActive = pathname === "/finance-review" || (pathname === "/realization" && mode === "finance");
  const [isFinanceReviewOpen, setIsFinanceReviewOpen] = useState(false);

  useEffect(() => {
    if (isChildActive) {
      setIsFinanceReviewOpen(true);
    }
  }, [pathname, mode, isChildActive]);

  const canViewDashboard = hasPermission("perm_view_dashboard");
  const canPlan = hasPermission("perm_create_capex");
  const canReview = hasPermission("perm_review_capex");
  const canApprove = hasPermission("perm_committee_review");
  const canProgress = hasPermission("perm_closing_capex") || hasPermission("perm_view_dashboard");

  const hasPlanningUpdate =
    canPlan &&
    proposals.some((p: { gateStatus: string }) => p.gateStatus === "Gate 2 - Revised");

  const hasFinanceReviewUpdate =
    canReview &&
    proposals.some((p: { gateStatus: string }) => p.gateStatus === "Gate 1 - Finance Review");

  const hasApprovalUpdate =
    canApprove &&
    proposals.some((p: { gateStatus: string }) => p.gateStatus === "Gate 2 - Committee Review");

  const hasDraftsUpdate =
    canPlan &&
    proposals.some((p: { gateStatus: string }) => p.gateStatus === "Gate 0 - Idea" || p.gateStatus === "Gate 1 - Pending User Feedback");

  const showDotFor = (key: string) => {
    if (key === "planning") return hasPlanningUpdate;
    if (key === "financeReview") return hasFinanceReviewUpdate;
    if (key === "approvals") return hasApprovalUpdate;
    if (key === "drafts") return hasDraftsUpdate;
    return false;
  };

  const visibleNavItems = navItems.filter((item) => {
    if (item.href === "/dashboard") return canViewDashboard;
    if (item.href === "/planning") return canPlan;
    if (item.href === "/finance-review") return canReview;
    if (item.href === "/approvals") return canApprove;
    if (item.href === "/drafts") return canPlan;
    return false;
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-xs">

      {/* Logo + Sub-app Badge */}
      <div className="relative z-10 h-18 flex items-center justify-center px-4 border-b border-slate-200">
        <img
          src="/assets/img/logowide.jpeg"
          alt="Capex System Logo"
          className="w-full h-auto object-contain max-h-11"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto relative z-10">
        <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">MENU FS CAPEX</p>
        
        {visibleNavItems.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-400">
            <p>Belum ada izin menu yang diberikan oleh Administrator.</p>
          </div>
        ) : (
          visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const hasBadge = showDotFor(item.hasDotKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-700 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={isActive ? "text-white" : "text-slate-500 group-hover:text-blue-600 transition-colors"}>
                    {item.icon}
                  </span>
                  {item.label}
                </span>
                {hasBadge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </Link>
            );
          })
        )}
      </nav>

      {/* Back to Portal */}
      <div className="px-3 py-4 border-t border-slate-200 relative z-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 group w-full"
        >
          <span className="w-7 h-7 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            N
          </span>
          <span className="truncate">Kembali ke Portal</span>
        </Link>
      </div>
    </aside>
  );
}
