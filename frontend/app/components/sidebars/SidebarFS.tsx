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
    label: "CAPEX Planning",
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
    label: "Committee Review",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    hasDotKey: "approvals",
  },
  {
    href: "/capex-history",
    label: "History",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    hasDotKey: "",
  },
];

export default function SidebarFS() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "";
  const { proposals, hasPermission, currentUser } = useCapex();
  const isAdmin = (currentUser?.role || "").toLowerCase() === "admin" || (currentUser?.username || "").toLowerCase() === "admin";
  const isFinanceOrAdmin = hasPermission("perm_review_capex") || isAdmin;
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

  const hasPlanningUpdate =
    canPlan &&
    proposals.some((p: { gateStatus?: string }) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return gs.includes("revis");
    });

  const hasFinanceReviewUpdate =
    canReview &&
    proposals.some((p: { gateStatus?: string }) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return gs.includes("finance") || gs.includes("idea") || gs.includes("feedback");
    });

  const hasApprovalUpdate =
    canApprove &&
    proposals.some((p: { gateStatus?: string }) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return gs.includes("committee") || gs.includes("komite");
    });

  const showDotFor = (key: string) => {
    if (key === "planning") return hasPlanningUpdate;
    if (key === "financeReview") return hasFinanceReviewUpdate;
    if (key === "approvals") return hasApprovalUpdate;
    return false;
  };

  const visibleNavItems = navItems.filter((item) => {
    if (item.href === "/dashboard") return canViewDashboard;
    if (item.href === "/planning") return canPlan;
    if (item.href === "/finance-review") return canReview;
    if (item.href === "/approvals") return canApprove;
    if (item.href === "/capex-history") return canViewDashboard || canPlan || canReview || canApprove || hasPermission("perm_view_reports") || isAdmin;
    return false;
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-xs">
      {/* Logo Container */}
      <div className="relative z-10 h-18 flex items-center justify-center px-5 border-b border-slate-200/80 bg-gradient-to-b from-slate-50/50 to-white">
        <img
          src="/assets/img/logowide.jpeg"
          alt="Capex System Logo"
          className="w-full h-auto object-contain max-h-11 select-none"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3.5 py-4 space-y-1 overflow-y-auto relative z-10">
        <p className="px-3 text-[10.5px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span className="w-1 h-3 rounded-full bg-blue-600" />
          FS CAPEX Menu
        </p>
        
        {visibleNavItems.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-400 font-normal">
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                    : "text-slate-700 hover:text-blue-600 hover:bg-blue-50/70"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600 transition-colors"}>
                    {item.icon}
                  </span>
                  <span className="tracking-wide">{item.label}</span>
                </span>
                {hasBadge && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                {isActive && !hasBadge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            );
          })
        )}
      </nav>

      {/* Back to Portal */}
      {(() => {
        const isAdmin = (currentUser?.role || "").toLowerCase() === "admin" || (currentUser?.username || "").toLowerCase() === "admin";
        let portalCount = 0;
        if (currentUser?.allowed_portals && Array.isArray(currentUser.allowed_portals)) {
          portalCount = currentUser.allowed_portals.length;
        } else if (currentUser) {
          if (currentUser.can_capex !== false) portalCount++;
          if (currentUser.can_bodr !== false) portalCount++;
          if (currentUser.can_price !== false) portalCount++;
        }
        if (!isAdmin && portalCount <= 1) return null;
        return (
          <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/50 relative z-10">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50/80 border border-slate-200/90 transition-all duration-150 group shadow-2xs"
            >
              <svg className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
              <span className="truncate">Kembali ke Portal Hub</span>
            </Link>
          </div>
        );
      })()}
    </aside>
  );
}
