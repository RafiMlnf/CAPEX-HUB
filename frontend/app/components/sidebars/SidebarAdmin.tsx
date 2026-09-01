"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useCapex } from "../../context/CapexContext";

type AdminSection = string;
type MasterBodrSub = string;
type MasterPriceSub = string;
type SettingsSub = string;

const masterBodrItems: { key: MasterBodrSub; label: string; perm?: string }[] = [
  { key: "users", label: "Users", perm: "perm_manage_users" },
  { key: "departemen", label: "Department", perm: "perm_manage_config" },
  { key: "roles", label: "Roles", perm: "perm_manage_config" },
  { key: "permissions", label: "Permissions", perm: "perm_manage_config" },
  { key: "type_approval", label: "Approval Types", perm: "perm_manage_config" },
  { key: "cost_centers", label: "Cost Centers", perm: "perm_manage_config" },
  { key: "capex_types", label: "Capex Types", perm: "perm_manage_config" },
  { key: "capex_references", label: "Capex References", perm: "perm_manage_config" },
  { key: "asset_types", label: "Asset Types", perm: "perm_manage_config" },
];

const masterPriceItems: { key: MasterPriceSub; label: string; perm?: string }[] = [
  { key: "vendor", label: "Vendor", perm: "perm_manage_master_price" },
  { key: "part_number", label: "Part Number", perm: "perm_manage_master_price" },
  { key: "jenis_otorisasi", label: "Source Types", perm: "perm_manage_master_price" },
  { key: "jenis_barang", label: "Item Types", perm: "perm_manage_master_price" },
];

const settingsItems: { key: SettingsSub; label: string }[] = [
  { key: "role_permission", label: "Role Permissions" },
  { key: "approval_workflow", label: "Approval Workflow" },
  { key: "approval_price", label: "Price Approval Workflow" },
  { key: "dept_settings", label: "Department Settings" },
  { key: "portal_access", label: "Portal Access" },
];

export default function SidebarAdmin() {
  const { currentUser, hasPermission } = useCapex();
  const searchParams = useSearchParams();

  const userRole = (currentUser?.role || "").toLowerCase();
  const userName = (currentUser?.username || "").toLowerCase();
  const isAdmin = userRole === "admin" || userName === "admin";
  const canManageMasterData = hasPermission("perm_manage_config") || isAdmin || currentUser?.can_admin === true;
  const canManageConfig = hasPermission("perm_manage_config") || isAdmin || currentUser?.can_admin === true;
  const canManageUsers = hasPermission("perm_manage_users") || canManageMasterData || isAdmin || currentUser?.can_admin === true;

  const defaultTab = isAdmin ? "dashboard" : (canManageMasterData ? "masterdata" : "settings");
  const rawTab = searchParams.get("tab");
  const tab = ((!isAdmin && (!rawTab || rawTab === "dashboard")) ? defaultTab : (rawTab || defaultTab)) as AdminSection;
  const sub = searchParams.get("sub") || "";

  const isBodrActive = tab === "masterdata" && (masterBodrItems.some((i) => i.key === sub) || (!sub && !masterPriceItems.some((i) => i.key === sub)));
  const isPriceActive = tab === "masterdata" && masterPriceItems.some((i) => i.key === sub);

  // Filter master items
  const visibleMasterBodrItems = masterBodrItems.filter((item) => {
    if (isAdmin || canManageMasterData) return true;
    if (item.key === "users") {
      return canManageUsers;
    }
    return canManageConfig;
  });

  const visibleMasterPriceItems = masterPriceItems.filter(() => {
    return (
      isAdmin ||
      canManageMasterData ||
      canManageConfig ||
      hasPermission("perm_manage_master_price")
    );
  });

  // State accordion
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    master_bodr: isBodrActive || (!isAdmin && canManageMasterData),
    master_price: isPriceActive || (!isAdmin && canManageMasterData),
    settings: tab === "settings" || (!isAdmin && canManageConfig && !canManageMasterData),
  });

  // Sinkronkan state buka saat URL tab berubah
  useEffect(() => {
    if (tab === "masterdata") {
      if (masterPriceItems.some((i) => i.key === sub)) {
        setOpenSections((prev) => ({ ...prev, master_price: true }));
      } else {
        setOpenSections((prev) => ({ ...prev, master_bodr: true }));
      }
    } else if (tab === "settings") {
      setOpenSections((prev) => ({ ...prev, settings: true }));
    }
  }, [tab, sub]);

  // Toggle buka/tutup
  const toggleSection = (sectionKey: "master_bodr" | "master_price" | "settings") => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-xs">
      {/* Logo Header */}
      <div className="flex flex-col items-center justify-center px-4 py-5 border-b border-slate-200">
        <img
          src="/assets/img/logowide.jpeg"
          alt="Capex System Logo"
          className="w-full h-auto object-contain max-h-12"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
          System Administration
        </p>

        {/* 1. Dashboard Link */}
        {isAdmin && (
          <Link
            href="/admin?tab=dashboard"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              tab === "dashboard"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            <span className={tab === "dashboard" ? "text-white" : "text-slate-400"}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zm10-5a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8z"
                />
              </svg>
            </span>
            <span>Dashboard</span>
          </Link>
        )}

        {/* Operational Portals Quick Switch */}
        <div className="pt-2 pb-1">
          <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
            Operational Portals
          </p>
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Portal CAPEX</span>
            </Link>
            <Link
              href="/bodr-dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-150"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Portal BODR</span>
            </Link>
            <Link
              href="/otorisasi-harga"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Portal Otorisasi Harga</span>
            </Link>
          </div>
        </div>

        <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest pt-2 mb-1.5">
          Configuration & Master Data
        </p>

        {/* 2. Master Data BODR & Core (Accordion Toggle) */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("master_bodr")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
              isBodrActive
                ? "bg-blue-50 text-blue-600"
                : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className={isBodrActive ? "text-blue-600" : "text-slate-400"}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </span>
              <span>Master Data</span>
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                openSections.master_bodr ? "rotate-180 text-blue-600" : "rotate-0 text-slate-400"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Submenu Master Data BODR */}
          <div
            className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
              openSections.master_bodr ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden ml-4 pl-3 border-l-2 border-slate-100 space-y-0.5">
              {visibleMasterBodrItems.map((item) => {
                const isActive = tab === "masterdata" && (sub === item.key || (!sub && item.key === visibleMasterBodrItems[0]?.key));
                return (
                  <Link
                    key={item.key}
                    href={`/admin?tab=masterdata&sub=${item.key}`}
                    className={`flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Master Data Otorisasi Harga (Accordion Toggle) */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("master_price")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
              isPriceActive
                ? "bg-blue-50 text-blue-600"
                : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className={isPriceActive ? "text-blue-600" : "text-slate-400"}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              <span>Master Data Otorisasi</span>
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                openSections.master_price ? "rotate-180 text-blue-600" : "rotate-0 text-slate-400"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Submenu Master Data Otorisasi Harga */}
          <div
            className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
              openSections.master_price ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden ml-4 pl-3 border-l-2 border-slate-100 space-y-0.5">
              {visibleMasterPriceItems.map((item) => {
                const isActive = tab === "masterdata" && sub === item.key;
                return (
                  <Link
                    key={item.key}
                    href={`/admin?tab=masterdata&sub=${item.key}`}
                    className={`flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Settings (Accordion Toggle) */}
        {canManageConfig && (
          <div>
            <button
              type="button"
              onClick={() => toggleSection("settings")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                tab === "settings"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-700 hover:text-blue-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className={tab === "settings" ? "text-blue-600" : "text-slate-400"}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <span>Settings</span>
              </span>
              <svg
                className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                  openSections.settings ? "rotate-180 text-blue-600" : "rotate-0 text-slate-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Submenu Settings */}
            <div
              className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                openSections.settings ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden ml-4 pl-3 border-l-2 border-slate-100 space-y-0.5">
                {settingsItems.map((item) => {
                  const isActive = tab === "settings" && (sub === item.key || (!sub && item.key === "role_permission"));
                  return (
                    <Link
                      key={item.key}
                      href={`/admin?tab=settings&sub=${item.key}`}
                      className={`flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. History Logs Link */}
        {isAdmin && (
          <Link
            href="/admin?tab=history"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              tab === "history"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            <span className={tab === "history" ? "text-white" : "text-slate-400"}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <span>History Logs</span>
          </Link>
        )}
      </nav>

      {/* Back to Portal */}
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
    </aside>
  );
}
