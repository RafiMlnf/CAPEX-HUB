"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCapex } from "../../context/CapexContext";

const mainMenu = [
  { href: "/otorisasi-harga", label: "Dashboard", perm: "perm_view_dashboard", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { href: "/otorisasi-harga/approval", label: "Approval", perm: "perm_approve_price", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: "/otorisasi-harga/progress", label: "Authorization Progress", perm: "perm_view_dashboard", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
];

const otorisasiMenu = {
  label: "Price Authorization",
  perm: "perm_create_price",
  icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  items: [
    { href: "/otorisasi-harga/non-product", label: "Non-Product", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { href: "/otorisasi-harga/product", label: "Product", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  ]
};

const masterDataMenu = {
  label: "Master Data",
  icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  ),
  items: [
    { href: "/otorisasi-harga/vendor", label: "Vendor", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { href: "/otorisasi-harga/part-number", label: "Part Number", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg> },
    { href: "/otorisasi-harga/jenis-otorisasi", label: "Source Types", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    { href: "/otorisasi-harga/jenis-barang", label: "Item Types", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> },
  ]
};

export default function SidebarOtorisasi() {
  const pathname = usePathname();
  const { currentUser, hasPermission } = useCapex();

  const isOtorisasiActive = pathname.startsWith("/otorisasi-harga/non-product") || pathname.startsWith("/otorisasi-harga/product");
  const isMasterActive = pathname.startsWith("/otorisasi-harga/vendor") ||
                         pathname.startsWith("/otorisasi-harga/part-number") ||
                         pathname.startsWith("/otorisasi-harga/jenis-otorisasi") ||
                         pathname.startsWith("/otorisasi-harga/jenis-barang");

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    otorisasi: true,
    masterdata: true,
  });

  useEffect(() => {
    if (isOtorisasiActive) {
      setOpenSections(prev => ({ ...prev, otorisasi: true }));
    }
    if (isMasterActive) {
      setOpenSections(prev => ({ ...prev, masterdata: true }));
    }
  }, [isOtorisasiActive, isMasterActive]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Check if user has access to multiple portals or is admin
  const role = (currentUser?.role || "").toLowerCase();
  const username = (currentUser?.username || "").toLowerCase();
  const isAdmin = role === "admin" || username === "admin";

  let portalCount = 0;
  if (currentUser?.allowed_portals && Array.isArray(currentUser.allowed_portals)) {
    portalCount = currentUser.allowed_portals.length;
  } else if (currentUser) {
    if (currentUser.can_capex !== false) portalCount++;
    if (currentUser.can_bodr !== false) portalCount++;
    if (currentUser.can_price !== false) portalCount++;
  }

  const showBackToPortal = isAdmin || portalCount > 1;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-xs">
      <div className="relative z-10 h-18 flex items-center justify-center px-4 border-b border-slate-200">
        <img src="/assets/img/logowide.jpeg" alt="Logo" className="w-full h-auto object-contain max-h-11" onError={(e) => { e.currentTarget.style.display = "none"; }}/>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto relative z-10">
        {/* Main Menu */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Main Menu</p>
          <div className="space-y-0.5">
            {mainMenu.map((item) => {
              if (item.perm && !hasPermission(item.perm)) return null;
              const isActive = pathname === item.href || (item.href !== "/otorisasi-harga" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors group ${
                    isActive ? "bg-blue-600 text-white shadow-2xs" : "text-slate-700 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={isActive ? "text-white" : "text-slate-500 group-hover:text-blue-600 transition-colors"}>{item.icon}</span>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Dropdown 1: Price Authorization */}
        {(!otorisasiMenu.perm || hasPermission(otorisasiMenu.perm)) && (
          <div>
            <button
              type="button"
              onClick={() => toggleSection("otorisasi")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isOtorisasiActive
                  ? "bg-blue-50/80 text-blue-600"
                  : "text-slate-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className={isOtorisasiActive ? "text-blue-600" : "text-slate-500"}>
                  {otorisasiMenu.icon}
                </span>
                <span>{otorisasiMenu.label}</span>
              </span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ease-in-out ${
                  openSections.otorisasi ? "rotate-180 text-blue-600" : "rotate-0 text-slate-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Submenu Price Authorization */}
            <div
              className={`grid transition-all duration-200 ease-in-out overflow-hidden ${
                openSections.otorisasi ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden ml-3.5 pl-2.5 border-l-2 border-slate-100 space-y-0.5">
                {otorisasiMenu.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                        isActive
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600 transition-colors"}>
                          {item.icon}
                        </span>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Dropdown 2: Master Data */}
        {(hasPermission("perm_manage_config") || hasPermission("perm_manage_settings")) && (
          <div>
            <button
              type="button"
              onClick={() => toggleSection("masterdata")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isMasterActive
                  ? "bg-blue-50/80 text-blue-600"
                  : "text-slate-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className={isMasterActive ? "text-blue-600" : "text-slate-500"}>
                  {masterDataMenu.icon}
                </span>
                <span>{masterDataMenu.label}</span>
              </span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ease-in-out ${
                  openSections.masterdata ? "rotate-180 text-blue-600" : "rotate-0 text-slate-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Submenu Master Data */}
            <div
              className={`grid transition-all duration-200 ease-in-out overflow-hidden ${
                openSections.masterdata ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden ml-3.5 pl-2.5 border-l-2 border-slate-100 space-y-0.5">
                {masterDataMenu.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                        isActive
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600 transition-colors"}>
                          {item.icon}
                        </span>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>

      {showBackToPortal && (
        <div className="px-3 py-4 border-t border-slate-200 relative z-10">
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors group">
            <svg className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
            Back to Portals
          </Link>
        </div>
      )}
    </aside>
  );
}
