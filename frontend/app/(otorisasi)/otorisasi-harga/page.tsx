"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarOtorisasi";
import Header from "../../components/Header";
import { ApiOtorisasiHargaNonProduct, ApiOtorisasiHarga, api } from "../../lib/api";

import { useCapex } from "../../context/CapexContext";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const statusBadge = (s: string) => {
  if (s === "Approved") return "bg-emerald-50 text-emerald-700 border border-emerald-300";
  if (s === "Rejected") return "bg-red-50 text-red-700 border border-red-300";
  if (s === "Revision Required") return "bg-orange-50 text-orange-700 border border-orange-300";
  return "bg-blue-50 text-blue-700 border border-blue-300";
};

export default function OtorisasiHargaDashboard() {
  const { currentUser, hasPermission } = useCapex();
  const [npList, setNpList] = useState<ApiOtorisasiHargaNonProduct[]>([]);
  const [pList, setPList] = useState<ApiOtorisasiHarga[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab & search states for document list
  const [listTab, setListTab] = useState<"non-product" | "product">("non-product");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected item modal states (for read-only popup on dashboard)
  const [selectedP, setSelectedP] = useState<ApiOtorisasiHarga | null>(null);

  const canViewDashboard = hasPermission("perm_view_dashboard");

  const refreshData = () => {
    if (!canViewDashboard) return;
    setLoading(true);
    Promise.all([
      api.getOtorisasiHargaNPList(),
      api.getOtorisasiHargaList(),
    ])
      .then(([np, p]) => {
        setNpList(np || []);
        setPList(p || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (canViewDashboard) {
      refreshData();
    }
  }, [canViewDashboard]);

  const userRole = (currentUser?.role || "").toLowerCase();
  const userName = (currentUser?.username || "").toLowerCase();
  const isAdmin = userRole === "admin" || userName === "admin";
  const isAccounting = isAdmin || hasPermission("perm_approve_price");
  const isPurchasing = isAdmin || hasPermission("perm_create_price");
  const isApprover = isAdmin || hasPermission("perm_approve_price");
  const isProposer = hasPermission("perm_create_price") && !isAccounting && !isApprover && !isAdmin && !isPurchasing;

  if (!canViewDashboard) {
    return (
      <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800 flex-col">
        <Header
          title="Price Authorization"
          subtitle="Non-Product / Product Price Approval System - PT Menara Terus Makmur"
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
                Maaf, Anda tidak memiliki izin untuk mengakses Dashboard Otorisasi Harga.
                Silakan hubungi Administrator untuk meminta konfigurasi hak akses akun Anda.
              </p>
            </div>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer w-full text-center"
            >
              Kembali ke Portal Utama
            </a>
          </div>
        </main>
      </div>
    );
  }

  const handleDeleteNP = async (id: string, noDoc: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus dokumen otorisasi non-product "${noDoc}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        await api.deleteOtorisasiHargaNP(id);
        refreshData();
      }
    });
  };

  const handleDeleteP = async (id: string, product: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus otorisasi product "${product}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        await api.deleteOtorisasiHarga(id);
        refreshData();
      }
    });
  };

  // KPIs based on total documents (Non-Product + Product)
  const totalCount = npList.length + pList.length;
  const pendingCount = npList.filter(i => i.status === "Pending Review").length + pList.filter(i => i.status === "Pending Review").length;
  const approvedCount = npList.filter(i => i.status === "Approved").length + pList.filter(i => i.status === "Approved").length;
  const rejectedCount = npList.filter(i => (i.status as string) === "Rejected" || (i.status as string) === "Revision Required").length + pList.filter(i => (i.status as string) === "Rejected" || (i.status as string) === "Revision Required").length;

  // Filtered lists for the table view
  const filteredNP = npList.filter(item => {
    const s = searchQuery.toLowerCase();
    return item.no_doc.toLowerCase().includes(s) || item.no_pr.toLowerCase().includes(s) || item.buyer_nama.toLowerCase().includes(s);
  });

  const filteredP = pList.filter(item => {
    const s = searchQuery.toLowerCase();
    return item.product.toLowerCase().includes(s) || item.customer.toLowerCase().includes(s) || item.id.toLowerCase().includes(s);
  });

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen ml-64 overflow-hidden">
        <Header
          title="Price Authorization"
          subtitle="Overview pengajuan otorisasi harga Non-Product & Product — PT Menara Terus Makmur"
        />

        <main className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
          {/* Top Hero Banner */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl px-6 py-4 text-white shadow-sm relative overflow-hidden">
            <div className="relative z-10 space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold backdrop-blur-sm border border-white/20">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {isAccounting
                  ? "Accounting & Finance Workspace"
                  : isPurchasing
                  ? "Purchasing & Commercial Workspace"
                  : isApprover
                  ? "Executive Price Authorization Workspace"
                  : `${currentUser?.department || "Commercial"} Price Workspace`}
              </span>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                {isAccounting
                  ? "Dashboard Verifikasi & Pengendalian Otorisasi Harga"
                  : isPurchasing
                  ? "Dashboard Pengajuan Otorisasi Harga Pengadaan"
                  : isApprover
                  ? "Executive Price Authorization & Approval Monitoring"
                  : "Dashboard Otorisasi Penetapan Harga"}
              </h1>
              <p className="text-blue-100 text-[11px] max-w-2xl font-normal leading-normal">
                {isAccounting
                  ? "Monitoring verifikasi harga pengadaan Non-Product dan penetapan harga Product, evaluasi margin komersial, serta antrean persetujuan Finance."
                  : isPurchasing
                  ? "Monitoring usulan penetapan harga pengadaan Non-Product dan Product, perbandingan penawaran vendor, dan status approval berjenjang."
                  : "Ringkasan eksekutif persetujuan harga pengadaan Non-Product & penetapan harga Product, monitoring margin laba, dan antrean persetujuan direksi."}
              </p>
            </div>
            {/* Background geometric accents */}
            <div className="absolute right-0 top-0 w-80 h-full bg-white/5 transform skew-x-12 pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/30 rounded-full blur-2xl pointer-events-none" />
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-semibold">
              Memuat data dashboard otorisasi harga...
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* KPI CARDS - Role Specific Layout */}
              {isAccounting ? (
                /* ── ACCOUNTING KPI CARDS (5 Cards) ─────────────────────────────── */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* KPI 1: Total Dokumen Otorisasi */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL OTORISASI</p>
                      <p className="text-xl font-semibold text-slate-900 font-mono">{totalCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* KPI 2: Otorisasi Non-Product */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">NON-PRODUCT (PR)</p>
                      <p className="text-xl font-semibold text-indigo-700 font-mono">{npList.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>

                  {/* KPI 3: Otorisasi Product */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">PRODUCT COMPONENT</p>
                      <p className="text-xl font-semibold text-cyan-700 font-mono">{pList.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>

                  {/* KPI 4: Menunggu Review & Approval */}
                  <Link
                    href="/otorisasi-harga/approval"
                    className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between transition-all hover:bg-amber-50/40 group cursor-pointer"
                    title="Buka Antrean Approval Otorisasi Harga"
                  >
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">REVIEW & APPROVAL</p>
                      <p className="text-xl font-semibold text-amber-700 font-mono">{pendingCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </Link>

                  {/* KPI 5: Disetujui (Approved) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">DISETUJUI (APPROVED)</p>
                      <p className="text-xl font-semibold text-emerald-600 font-mono">{approvedCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : isPurchasing ? (
                /* ── PURCHASING / BUYER KPI CARDS (4 Cards) ─────────────────────── */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* KPI 1: Total Usulan Otorisasi */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL USULAN HARGA</p>
                      <p className="text-xl font-semibold text-slate-900 font-mono">{totalCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* KPI 2: Non-Product (PR) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">NON-PRODUCT (PR)</p>
                      <p className="text-xl font-semibold text-indigo-700 font-mono">{npList.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>

                  {/* KPI 3: Dalam Proses Approval */}
                  <Link
                    href="/otorisasi-harga/non-product"
                    className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between transition-all hover:bg-amber-50/40 group cursor-pointer"
                    title="Buka Daftar Otorisasi Harga"
                  >
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">DALAM PROSES REVIEW</p>
                      <p className="text-xl font-semibold text-amber-700 font-mono">{pendingCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </Link>

                  {/* KPI 4: Disetujui (Approved) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">DISETUJUI (APPROVED)</p>
                      <p className="text-xl font-semibold text-emerald-600 font-mono">{approvedCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── APPROVER / EXECUTIVE / ADMIN KPI CARDS (4 Cards) ─────────────── */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* KPI 1: TOTAL PENGAJUAN OTORISASI */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL OTORISASI</p>
                      <p className="text-xl font-semibold text-slate-900 font-mono">{totalCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* KPI 2: MENUNGGU PERSETUJUAN */}
                  <Link
                    href="/otorisasi-harga/approval"
                    className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between transition-all hover:bg-amber-50/40 group cursor-pointer"
                    title="Buka Antrean Approval Otorisasi Harga"
                  >
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">MENUNGGU APPROVAL</p>
                      <p className="text-xl font-semibold text-amber-700 font-mono">{pendingCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </Link>

                  {/* KPI 3: DISETUJUI (APPROVED) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">DISETUJUI (APPROVED)</p>
                      <p className="text-xl font-semibold text-emerald-600 font-mono">{approvedCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* KPI 4: REJECTED / REVISI */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider">REJECTED / REVISI</p>
                      <p className="text-xl font-semibold text-rose-700 font-mono">{rejectedCount}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Unified Document Lists Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3.5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  {/* Tab Switcher */}
                  <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
                    <button
                      onClick={() => { setListTab("non-product"); setSearchQuery(""); }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${listTab === "non-product" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900 font-medium"}`}
                    >
                      Otorisasi Non-Product ({npList.length})
                    </button>
                    <button
                      onClick={() => { setListTab("product"); setSearchQuery(""); }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${listTab === "product" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900 font-medium"}`}
                    >
                      Otorisasi Product ({pList.length})
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder={listTab === "non-product" ? "Cari no dokumen, PR, buyer..." : "Cari product, customer..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all font-medium placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* List representation */}
                <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase tracking-wider">
                  {listTab === "non-product" ? (
                    <tr>
                      <th className="px-4 py-3 text-center w-12 border-r border-slate-200">No</th>
                      <th className="px-4 py-3 border-r border-slate-200">Nomor Dokumen</th>
                      <th className="px-4 py-3 border-r border-slate-200">PR / BODR</th>
                      <th className="px-4 py-3 border-r border-slate-200">Buyer</th>
                      <th className="px-4 py-3 text-right border-r border-slate-200">Dana BODR</th>
                      <th className="px-4 py-3 text-center border-r border-slate-200">Status</th>
                      <th className="px-4 py-3 text-center w-28">Aksi</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-4 py-3 text-center w-12 border-r border-slate-200">No</th>
                      <th className="px-4 py-3 border-r border-slate-200">ID Otorisasi</th>
                      <th className="px-4 py-3 border-r border-slate-200">Nama Product</th>
                      <th className="px-4 py-3 border-r border-slate-200">Customer</th>
                      <th className="px-4 py-3 text-right border-r border-slate-200">Final Price</th>
                      <th className="px-4 py-3 text-center border-r border-slate-200">Status</th>
                      <th className="px-4 py-3 text-center w-28">Aksi</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs bg-white">
                  {listTab === "non-product" ? (
                    filteredNP.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-normal italic">
                          Tidak ada data otorisasi harga Non-Product ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredNP.map((item, idx) => (
                        <tr key={`np-${item.id}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5 text-center text-slate-400 font-medium font-mono border-r border-slate-150">{idx + 1}</td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-blue-600 border-r border-slate-150">{item.no_doc}</td>
                          <td className="px-4 py-3.5 font-mono text-slate-600 border-r border-slate-150">
                            <div>PR: {item.no_pr || "—"}</div>
                            <div className="font-medium text-[10px] text-slate-400">BODR: {item.no_bodr || "—"}</div>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-800 border-r border-slate-150">{item.buyer_nama}</td>
                          <td className="px-4 py-3.5 text-right font-semibold text-slate-900 font-mono border-r border-slate-150">{fmt(item.dana_bodr)}</td>
                          <td className="px-4 py-3.5 text-center border-r border-slate-150">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${statusBadge(item.status)}`}>{item.status}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex justify-center gap-2.5">
                              <Link href={`/otorisasi-harga/non-product/${item.id}`} className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] uppercase tracking-wider">
                                Detail
                              </Link>
                              <button onClick={() => handleDeleteNP(item.id, item.no_doc)} className="text-red-500 hover:text-red-700 font-semibold text-[11px] uppercase tracking-wider cursor-pointer">
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    filteredP.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-normal italic">
                          Tidak ada data otorisasi harga Product ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredP.map((item, idx) => (
                        <tr key={`p-${item.id}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5 text-center text-slate-400 font-medium font-mono border-r border-slate-150">{idx + 1}</td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-blue-600 border-r border-slate-150">{item.id}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-800 border-r border-slate-150">{item.product}</td>
                          <td className="px-4 py-3.5 font-medium text-slate-700 border-r border-slate-150">{item.customer}</td>
                          <td className="px-4 py-3.5 text-right font-semibold text-slate-900 font-mono border-r border-slate-150">{fmt(item.normal_price * (1 - item.discount_pct / 100))}</td>
                          <td className="px-4 py-3.5 text-center border-r border-slate-150">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${statusBadge(item.status)}`}>{item.status}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex justify-center gap-2.5">
                              <button onClick={() => setSelectedP(item)} className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] uppercase tracking-wider cursor-pointer">
                                Detail
                              </button>
                              <button onClick={() => handleDeleteP(item.id, item.product)} className="text-red-500 hover:text-red-700 font-semibold text-[11px] uppercase tracking-wider cursor-pointer">
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  </div>

      {/* Simplified details modal for Product (read-only popup on dashboard) */}
      {selectedP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setSelectedP(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-slate-900 tracking-wide text-sm">{selectedP.id}</h3>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${statusBadge(selectedP.status)}`}>{selectedP.status}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Detail Otorisasi Harga Product</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs">
                <div className="col-span-2">
                  <p className="text-slate-500 font-medium uppercase text-[9px]">Nama Product / Component</p>
                  <p className="font-semibold text-slate-800">{selectedP.product}</p>
                </div>
                <div><p className="text-slate-500 font-medium uppercase text-[9px]">Customer</p><p className="font-medium text-slate-700">{selectedP.customer}</p></div>
                <div><p className="text-slate-500 font-medium uppercase text-[9px]">Prepared By</p><p className="font-medium text-slate-700">{selectedP.prepared_by}</p></div>
                <div><p className="text-slate-500 font-medium uppercase text-[9px]">Normal Price</p><p className="font-medium text-slate-500 line-through font-mono">{fmt(selectedP.normal_price)}</p></div>
                <div><p className="text-slate-500 font-medium uppercase text-[9px]">Discount (%)</p><p className="font-semibold text-red-600 font-mono">{selectedP.discount_pct}%</p></div>
                <div className="col-span-2"><p className="text-slate-500 font-medium uppercase text-[9px]">Final Price Proposal</p><p className="font-semibold text-emerald-700 text-sm font-mono">{fmt(selectedP.normal_price * (1 - selectedP.discount_pct/100))}</p></div>
                <div><p className="text-slate-500 font-medium uppercase text-[9px]">Tahap Approval</p><p className="font-semibold text-blue-700">{selectedP.step || "—"}</p></div>
              </div>
              
              {selectedP.notes && (
                <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl text-xs">
                  <p className="font-semibold text-blue-800 text-[10px] uppercase tracking-wider mb-0.5">Catatan Pengaju</p>
                  <p className="text-slate-600 italic font-normal">"{selectedP.notes}"</p>
                </div>
              )}

              {selectedP.approval_history && selectedP.approval_history.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Riwayat Persetujuan</p>
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-150 max-h-40 overflow-y-auto">
                    {selectedP.approval_history.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${h.status === "Approved" ? "bg-emerald-500" : "bg-red-500"}`} />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-700 text-[11px]">{h.role || "Approver"} — <span className={h.status === "Approved" ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>{h.status}</span></p>
                          <p className="text-[10px] text-slate-500 font-normal">Oleh: {h.name} · {h.timestamp}</p>
                          <p className="text-[10px] text-slate-500 italic mt-0.5 font-normal">Note: "{h.note || "—"}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
