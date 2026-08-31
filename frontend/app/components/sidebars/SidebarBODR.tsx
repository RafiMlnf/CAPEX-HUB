"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCapex } from "../../context/CapexContext";

const mainItems = [
  { href: "/bodr-dashboard", label: "Dashboard", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { href: "/bodr", label: "BODR List", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { href: "/bodr-approval", label: "BODR Approval", reqApprove: true, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: "/bodr-history", label: "History", isHistory: true, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

export default function SidebarBODR() {
  const pathname = usePathname();
  const { currentUser, hasPermission } = useCapex();

  const isAdmin = (currentUser?.role || "").toLowerCase() === "admin" || (currentUser?.username || "").toLowerCase() === "admin";
  const canViewDashboard = hasPermission("perm_view_dashboard");
  const canCreateBodr = hasPermission("perm_create_bodr");
  const canApproveBodr = hasPermission("perm_approve_bodr");

  const visibleMainItems = mainItems.filter((item) => {
    if (item.href === "/bodr-dashboard") return canViewDashboard || isAdmin;
    if (item.href === "/bodr") return canCreateBodr || isAdmin;
    if (item.href === "/bodr-approval") return canApproveBodr || isAdmin;
    if ((item as any).isHistory) return canViewDashboard || canApproveBodr || canCreateBodr || hasPermission("perm_view_reports") || isAdmin;
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
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3.5 py-4 space-y-4 overflow-y-auto relative z-10">
        <div>
          <p className="px-3 text-[10.5px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span className="w-1 h-3 rounded-full bg-blue-600" />
            BODR Menu
          </p>
          <div className="space-y-1">
            {visibleMainItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Back to Portal */}
      {(() => {
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
