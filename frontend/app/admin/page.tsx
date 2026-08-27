"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SidebarAdmin from "../components/sidebars/SidebarAdmin";
import Header from "../components/Header";
import { useCapex } from "../context/CapexContext";
import DashboardPanel from "./components/DashboardPanel";
import UsersPanel from "./components/UsersPanel";
import DepartemenPanel from "./components/DepartemenPanel";
import RolesPanel from "./components/RolesPanel";
import PermissionsPanel from "./components/PermissionsPanel";
import TypeApprovalPanel from "./components/TypeApprovalPanel";
import RolePermissionPanel from "./components/RolePermissionPanel";
import ApprovalWorkflowPanel from "./components/ApprovalWorkflowPanel";
import DeptSettingsPanel from "./components/DeptSettingsPanel";
import PortalAccessSettingsPanel from "./components/PortalAccessSettingsPanel";
import HistoryLogsPanel from "./components/HistoryLogsPanel";

function AdminPageInner() {
  const { currentUser } = useCapex();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "dashboard";
  const sub = searchParams.get("sub") || "";

  const userRole = (currentUser?.role || "").toLowerCase();
  const userName = (currentUser?.username || "").toLowerCase();
  const isAdmin = userRole === "admin" || userName === "admin";

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800 flex-col">
        <Header title="Portal Admin" subtitle="Dashboard, Master Data & Konfigurasi Sistem" />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 max-w-md w-full shadow-lg text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-800 uppercase tracking-wide">Akses Ditolak (403)</h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Maaf, Anda tidak memiliki izin untuk mengakses halaman Portal Admin.
                Halaman ini khusus dibatasi untuk peran Administrator.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer w-full text-center"
            >
              Kembali ke Portal Utama
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const renderContent = () => {
    if (tab === "dashboard") return <DashboardPanel />;

    if (tab === "masterdata") {
      const activeSub = sub || "users";
      return (
        <div className="w-full min-w-0">
          {activeSub === "users" && <UsersPanel />}
          {activeSub === "departemen" && <DepartemenPanel />}
          {activeSub === "roles" && <RolesPanel />}
          {activeSub === "permissions" && <PermissionsPanel />}
          {activeSub === "type_approval" && <TypeApprovalPanel />}
        </div>
      );
    }

    if (tab === "settings") {
      const activeSub = sub || "role_permission";
      return (
        <div className="w-full min-w-0">
          {activeSub === "role_permission" && <RolePermissionPanel />}
          {activeSub === "approval_workflow" && <ApprovalWorkflowPanel />}
          {activeSub === "approval_price" && <ApprovalWorkflowPanel price />}
          {activeSub === "dept_settings" && <DeptSettingsPanel />}
          {activeSub === "portal_access" && <PortalAccessSettingsPanel />}
        </div>
      );
    }

    if (tab === "history") return <HistoryLogsPanel />;

    return <DashboardPanel />;
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800 overflow-x-hidden">
      <SidebarAdmin />
      <div className="flex-1 flex flex-col min-h-screen ml-64 min-w-0">
        <Header
          title="Portal Admin"
          subtitle="Dashboard, Master Data & Konfigurasi Sistem PT Menara Terus Makmur"
        />
        <main className="flex-1 overflow-y-auto px-8 py-6 min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminPageInner />
    </Suspense>
  );
}
