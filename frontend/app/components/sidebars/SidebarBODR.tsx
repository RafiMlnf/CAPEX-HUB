"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCapex } from "../../context/CapexContext";

const mainItems = [
  { href: "/bodr-dashboard", label: "Dashboard", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { href: "/bodr", label: "BODR List", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { href: "/bodr-approval", label: "BODR Approval", reqApprove: true, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: "/bodr-progress", label: "BODR Progress", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
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
    if (item.href === "/bodr-progress") return canViewDashboard || canApproveBodr || canCreateBodr || isAdmin;
    return false;
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-xs">
      {/* Logo */}
      <div className="relative z-10 h-18 flex items-center justify-center px-4 border-b border-slate-200">
        <img
          src="/assets/img/logowide.jpeg"
          alt="Capex System Logo"
          className="w-full h-auto object-contain max-h-11"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto relative z-10">
        {/* Main Menu */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Main Menu</p>
          <div className="space-y-0.5">
            {visibleMainItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
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
          <div className="px-3 py-4 border-t border-slate-200 flex items-center justify-between gap-1 relative z-10">
            <Link
              href="/"
              className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 group whitespace-nowrap min-w-0"
            >
              <svg className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
              <span className="truncate">Back to Portals</span>
            </Link>
          </div>
        );
      })()}
    </aside>
  );
}
