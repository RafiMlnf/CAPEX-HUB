"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCapex } from "../context/CapexContext";

const modules = [
  {
    label: "FS",
    color: "text-blue-400",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    items: [
      { href: "/dashboard", label: "Feasibility Study" },
      { href: "/fs-capex", label: "CAPEX Progress" },
    ],
  },
  {
    label: "BODR",
    color: "text-purple-400",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    items: [
      { href: "/bodr", label: "BODR List" },
      { href: "/bodr-approval", label: "BODR Approval" },
      { href: "/bodr-progress", label: "BODR Progress" },
    ],
  },
  {
    label: "Authorization",
    color: "text-amber-400",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    items: [
      { href: "/otorisasi-harga", label: "Price Authorization" },
      { href: "/otorisasi-harga/progress", label: "Authorization Progress" },
    ],
  },
  {
    label: "Admin",
    color: "text-emerald-400",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    items: [
      { href: "/admin", label: "Admin Portal" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useCapex();
  const isAdmin = (currentUser?.role || "").toLowerCase() === "admin" || (currentUser?.username || "").toLowerCase() === "admin";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-xs">

      {/* Logo */}
      <div className="relative z-10 h-18 flex items-center justify-center px-4 border-b border-slate-200">
        <img
          src="/assets/img/logowide.jpeg"
          alt="Capex System Logo"
          className="w-full h-auto object-contain max-h-11"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const textLogo = e.currentTarget.parentElement?.querySelector(".text-logo-fallback");
            if (textLogo) textLogo.classList.remove("hidden");
          }}
        />
        <div className="text-logo-fallback hidden text-slate-900 font-semibold text-xl tracking-wider items-center gap-2">
          <span className="w-3.5 h-8 rounded-full bg-blue-600 inline-block" />
          CAPEX SYSTEM
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto relative z-10">
        {modules.map((mod) => {
          if (mod.label === "Admin" && !isAdmin) {
            return null;
          }
          return (
            <div key={mod.label}>
              {/* Module Header */}
              <div className={`flex items-center gap-2 px-2 mb-1.5 ${mod.color}`}>
                {mod.icon}
                <span className="text-[10px] font-semibold uppercase tracking-widest">{mod.label}</span>
              </div>
            {/* Sub Items */}
            <div className="space-y-0.5">
              {mod.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between pl-6 pr-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                      isActive
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-medium"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              </div>
            </div>
          );
        })}

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
            <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between gap-1">
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
      </nav>
    </aside>
  );
}
