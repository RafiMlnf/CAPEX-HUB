"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import { api, BodrProposal, CapexProposal } from "../../lib/api";
import { useCapex } from "../../context/CapexContext";
import BodrRequesterDashboard from "./components/BodrRequesterDashboard";
import BodrApproverDashboard from "./components/BodrApproverDashboard";

export default function BodrDashboardPage() {
  const { currentUser, hasPermission } = useCapex();
  const [data, setData] = useState<any | null>(null);
  const [bodrList, setBodrList] = useState<BodrProposal[]>([]);
  const [capexList, setCapexList] = useState<CapexProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewDashboard = hasPermission("perm_view_dashboard");

  const refreshData = () => {
    if (!canViewDashboard) return;
    setLoading(true);
    const userId = currentUser?.id ? currentUser.id.toString() : undefined;

    Promise.all([
      api.getBodrDashboard(userId).catch(() => null),
      api.getBodrProposals().catch(() => []),
      api.getProposals().catch(() => []),
    ])
      .then(([dashData, proposals, capex]) => {
        setData(dashData);
        setBodrList(
          (proposals || []).map((b: any) => ({
            id: b.id,
            bodrNo: b.bodr_no || b.id,
            title: b.title,
            category: b.category,
            department: b.department,
            amount: Number(b.amount || 0),
            step: b.step,
            status: b.status,
            date: b.date || b.created_at || "",
            notes: b.notes,
            proposer: b.proposer,
            benefit: b.benefit,
            capexId: b.capex_id,
            noAsset: b.no_asset,
            costCenter: b.cost_center,
            startDate: b.start_date,
            endDate: b.end_date,
            budgetType: b.budget_type,
            namaAsset: b.nama_asset,
            plan: b.plan,
            location: b.location,
            assetType: b.asset_type || "",
            approvalHistory: b.approval_history || [],
          }))
        );
        setCapexList(capex || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (canViewDashboard) {
      refreshData();
    }
  }, [canViewDashboard, currentUser]);

  // Role detection
  const userRole = (currentUser?.role || "").toLowerCase();
  const userName = (currentUser?.username || "").toLowerCase();
  const isAdmin = userRole === "admin" || userName === "admin";
  const isAccounting = isAdmin || hasPermission("perm_approve_bodr");
  const isApprover = isAdmin || hasPermission("perm_approve_bodr");
  const isProposer = hasPermission("perm_create_bodr") && !isAccounting && !isApprover && !isAdmin;

  if (!canViewDashboard) {
    return (
      <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800 flex-col">
        <Header
          title="BODR Portal"
          subtitle="Budget Over Design Review System - PT Menara Terus Makmur"
        />
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
                Maaf, Anda tidak memiliki izin untuk mengakses Dashboard BODR.
                Silakan hubungi Administrator untuk meminta konfigurasi hak akses akun Anda.
              </p>
            </div>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-2xs w-full text-center"
            >
              Kembali ke Portal Utama
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen ml-64 overflow-hidden">
        <Header
          title="BODR Portal"
          subtitle="Ringkasan eksekutif anggaran Capex, realisasi pengeluaran BODR, dan status antrian persetujuan"
        />

        <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Top Hero Banner */}
          <div className="bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl px-6 py-4 text-white shadow-sm relative overflow-hidden">
            <div className="relative z-10 space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold backdrop-blur-sm border border-white/20">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {isProposer
                  ? `Dashboard Requester (${currentUser?.department || "Department"})`
                  : isAccounting
                  ? "Dashboard Accounting & Finance BODR"
                  : "Dashboard Approval & Executive BODR"}
              </span>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                {isProposer
                  ? `Dashboard Pengajuan BODR - ${currentUser?.department || "Requester"}`
                  : isAccounting
                  ? "Dashboard Verifikasi & Pengendalian Anggaran BODR"
                  : "Dashboard Approval & Monitoring Eksekutif BODR"}
              </h1>
              <p className="text-blue-100 text-[11px] max-w-2xl font-normal leading-normal">
                {isProposer
                  ? "Ringkasan pengajuan usulan BODR Anda, status antrean persetujuan, sisa pagu Capex, serta riwayat usulan anggaran departemen."
                  : "Monitoring menyeluruh seluruh pengajuan BODR perusahaan, tren pengajuan bulanan, distribusi kriteria approval, dan antrean tindakan."}
              </p>
            </div>
            {/* Geometric accents */}
            <div className="absolute right-0 top-0 w-80 h-full bg-white/5 transform skew-x-12 pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/30 rounded-full blur-2xl pointer-events-none" />
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-semibold shadow-2xs">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
              <p>Memuat data dashboard BODR...</p>
            </div>
          ) : isProposer ? (
            /* 1. DASHBOARD KHUSUS PEMOHON / REQUESTER */
            <BodrRequesterDashboard
              currentUser={currentUser}
              bodrList={bodrList}
              capexList={capexList}
              data={data}
            />
          ) : (
            /* 2. DASHBOARD KHUSUS APPROVAL / EXECUTIVE / ADMIN / FINACCT */
            <BodrApproverDashboard
              currentUser={currentUser}
              bodrList={bodrList}
            />
          )}
        </main>
      </div>
    </div>
  );
}
