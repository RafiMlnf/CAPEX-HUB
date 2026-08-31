"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "../../components/sidebars/SidebarFS";
import Header from "../../components/Header";
import StatusBadge from "../../components/StatusBadge";
import { useCapex } from "../../context/CapexContext";
import { api } from "../../lib/api";

export default function DashboardPage() {
  const { proposals, refreshProposals, hasPermission, currentUser } = useCapex();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const canViewDashboard = hasPermission("perm_view_dashboard");

  // Dynamic role & permission detection
  const roleLower = (currentUser?.role || "").toLowerCase();
  const userName = (currentUser?.username || "").toLowerCase();
  const isAdmin = roleLower === "admin" || userName === "admin";
  const isAccounting = hasPermission("perm_review_capex") || isAdmin;
  const isCommittee = hasPermission("perm_committee_review") || isAdmin;
  const isProposer = hasPermission("perm_create_capex") && !isAccounting && !isCommittee && !isAdmin;
  const isAllAccess = isAccounting || isCommittee || hasPermission("perm_view_reports") || isAdmin;

  // Filter proposals according to user login & role permissions
  const visibleProposals = useMemo(() => {
    if (isAllAccess) return proposals;
    if (!currentUser) return proposals;

    const userDept = (currentUser.department || "").toLowerCase().trim();
    const userName = (currentUser.name || "").toLowerCase().trim();
    const userNpk = (currentUser.npk || "").toLowerCase().trim();
    const username = (currentUser.username || "").toLowerCase().trim();

    return proposals.filter((p: any) => {
      const pDept = (p.department || "").toLowerCase().trim();
      const pPic = (p.pic || "").toLowerCase().trim();

      const isSameDept = userDept && (pDept === userDept || pDept.includes(userDept) || userDept.includes(pDept));
      const isSamePic =
        (userName && (pPic === userName || pPic.includes(userName))) ||
        (username && pPic === username) ||
        (userNpk && pPic === userNpk);

      return isSameDept || isSamePic;
    });
  }, [proposals, isAllAccess, currentUser]);

  // Real-time automatic background sync on component mount & periodic cycle
  useEffect(() => {
    if (canViewDashboard) {
      api.syncFromBodr()
        .then(() => {
          refreshProposals();
        })
        .catch(() => {});
    }
  }, [canViewDashboard, refreshProposals]);

  // Dynamic calculations
  const totalBudget = useMemo(() => {
    return visibleProposals.reduce((sum: number, item: any) => sum + (item.estimatedCost || 0), 0);
  }, [visibleProposals]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set(
      visibleProposals
        .map((p) => (p.department || "").trim())
        .filter(Boolean)
    );
    return Array.from(depts);
  }, [visibleProposals]);

  const waitingFinanceCount = useMemo(() => {
    return visibleProposals.filter((p) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return gs.includes("finance") || gs.includes("pending") || gs.includes("feedback");
    }).length;
  }, [visibleProposals]);

  const readyCommitteeCount = useMemo(() => {
    return visibleProposals.filter((p) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return gs.includes("committee") || gs.includes("komite");
    }).length;
  }, [visibleProposals]);

  const approvedCount = useMemo(() => {
    return visibleProposals.filter((p) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return gs.includes("approved") || gs.includes("closed") || gs.includes("procurement");
    }).length;
  }, [visibleProposals]);

  const approvedBudget = useMemo(() => {
    return visibleProposals.reduce((sum: number, item: any) => {
      const gs = (item.gateStatus || "").toLowerCase();
      const isAppr = gs.includes("approved") || gs.includes("closed") || gs.includes("procurement");
      return sum + (isAppr ? (item.estimatedCost || 0) : 0);
    }, 0);
  }, [visibleProposals]);

  const draftCount = useMemo(() => {
    return visibleProposals.filter((p) => {
      const s = (p.gateStatus || "").toLowerCase();
      return s.includes("idea") || s.includes("draft");
    }).length;
  }, [visibleProposals]);

  const inReviewCount = useMemo(() => {
    return visibleProposals.filter((p) => {
      const s = (p.gateStatus || "").toLowerCase();
      return s.includes("review") || s.includes("finance") || s.includes("committee") || s.includes("komite") || s.includes("pending");
    }).length;
  }, [visibleProposals]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return visibleProposals.filter((item: any) => {
      const matchesSearch =
        !q ||
        (item.name || "").toLowerCase().includes(q) ||
        (item.department || "").toLowerCase().includes(q) ||
        (item.id || "").toLowerCase().includes(q) ||
        (item.pic || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q);

      const status = (item.gateStatus || item.status || "").toLowerCase();
      let matchesStatus = true;
      if (statusFilter === "review") {
        matchesStatus = status.includes("review") || status.includes("pending");
      } else if (statusFilter === "draft") {
        matchesStatus = status.includes("draft") || status.includes("idea");
      } else if (statusFilter === "reject") {
        matchesStatus = status.includes("reject");
      } else if (statusFilter === "revisi") {
        matchesStatus = status.includes("revis") || status.includes("feedback");
      } else if (statusFilter === "close") {
        matchesStatus =
          status.includes("close") ||
          status.includes("approved") ||
          status.includes("archived") ||
          status.includes("complet");
      }
      return matchesSearch && matchesStatus;
    });
  }, [visibleProposals, searchTerm, statusFilter]);

  // Department summary for graph
  const deptData = useMemo(() => {
    const map: Record<string, { budget: number; count: number; approved: number }> = {};
    visibleProposals.forEach((p: any) => {
      const dept = p.department || "General";
      if (!map[dept]) {
        map[dept] = { budget: 0, count: 0, approved: 0 };
      }
      map[dept].budget += (p.estimatedCost || 0);
      map[dept].count += 1;

      const isAppr =
        p.gateStatus === "Approved / Archived" ||
        p.gateStatus === "Closed" ||
        p.gateStatus === "Gate 3 - Procurement";
      if (isAppr) {
        map[dept].approved += (p.estimatedCost || 0);
      }
    });
    return Object.entries(map).map(([dept, val]) => ({
      dept,
      ...val,
    }));
  }, [visibleProposals]);

  // Investment purpose summary for proposer
  const purposeData = useMemo(() => {
    const map: Record<string, { budget: number; count: number }> = {};
    visibleProposals.forEach((p: any) => {
      const purpose = p.purpose || p.investmentType || "Standard";
      if (!map[purpose]) {
        map[purpose] = { budget: 0, count: 0 };
      }
      map[purpose].budget += (p.estimatedCost || 0);
      map[purpose].count += 1;
    });
    return Object.entries(map).map(([purpose, val]) => ({
      purpose,
      ...val,
    }));
  }, [visibleProposals]);

  // Status breakdown summary
  const statusSummary = useMemo(() => {
    return [
      {
        label: "Draft & Usulan Awal",
        count: draftCount,
        color: "bg-slate-400",
        badge: "bg-slate-50 text-slate-700 border-slate-200",
      },
      {
        label: "Verifikasi Finance",
        count: waitingFinanceCount,
        color: "bg-blue-500",
        badge: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        label: "Sidang Komite",
        count: readyCommitteeCount,
        color: "bg-purple-500",
        badge: "bg-purple-50 text-purple-700 border-purple-200",
      },
      {
        label: "Disetujui & Terarsip",
        count: approvedCount,
        color: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
    ];
  }, [draftCount, waitingFinanceCount, readyCommitteeCount, approvedCount]);

  if (!canViewDashboard) {
    return (
      <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800 flex-col">
        <Header
          title="CAPEX Portal"
          subtitle="Capital Expenditure Management System - PT Menara Terus Makmur"
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
                Maaf, Anda tidak memiliki izin untuk mengakses Dashboard CAPEX.
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

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen ml-64 bg-slate-100 min-w-0 overflow-hidden">
        <Header
          title={
            isAccounting
              ? "Dashboard Accounting & Finance CAPEX"
              : isCommittee
              ? "Dashboard Komite Investasi CAPEX"
              : currentUser?.department
              ? `Dashboard CAPEX ${currentUser.department}`
              : "Dashboard CAPEX"
          }
          subtitle="Sistem monitoring perencanaan, verifikasi anggaran, dan alur persetujuan Capital Expenditure"
        />

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 w-full min-w-0 overflow-x-hidden">
          {/* Top Hero Banner - Personalized by Role */}
          <div className="bg-linear-to-r from-blue-600 via-indigo-700 to-blue-800 rounded-2xl px-6 py-4 text-white shadow-sm relative overflow-hidden">
            <div className="relative z-10 space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold backdrop-blur-sm border border-white/20">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {isAccounting
                  ? "Accounting & Finance Workspace"
                  : isCommittee
                  ? "Investment Committee Workspace"
                  : `${currentUser?.department || "Department"} Capex Workspace`}
              </span>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                {isAccounting
                  ? "Dashboard Verifikasi & Pengendalian Anggaran CAPEX"
                  : isCommittee
                  ? "Executive CAPEX Dashboard & Approval Monitoring"
                  : currentUser?.department
                  ? `Dashboard Pengajuan Belanja Modal ${currentUser.department}`
                  : "Dashboard Pengajuan Belanja Modal"}
              </h1>
              <p className="text-blue-100 text-[11px] max-w-2xl font-normal leading-normal">
                {isAccounting
                  ? "Ringkasan verifikasi kelayakan anggaran belanja modal, total dokumen masuk dari seluruh departemen, serta antrean review Finance dan sidang Komite."
                  : isCommittee
                  ? "Ringkasan eksekutif alokasi investasi belanja modal, keputusan sidang Komite, dan realisasi anggaran seluruh departemen."
                  : `Ringkasan usulan pengajuan belanja modal, status verifikasi Finance, dan persetujuan sidang Komite untuk ${currentUser?.department || "Departemen Anda"}.`}
              </p>
            </div>
            {/* Background accents */}
            <div className="absolute right-0 top-0 w-80 h-full bg-white/5 transform skew-x-12 pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* KPI CARDS - Role Specific Layout */}
          {isAccounting ? (
            /* ── ACCOUNTING KPI CARDS ─────────────────────────────────────────── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* KPI 1: Total Dokumen CAPEX */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL DOKUMEN CAPEX</p>
                  <p className="text-xl font-semibold text-slate-900 font-mono">{visibleProposals.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>

              {/* KPI 2: Total Departemen Pengajuan */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">DEPARTEMEN PENGAJU</p>
                  <p className="text-xl font-semibold text-indigo-700 font-mono">{uniqueDepartments.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>

              {/* KPI 3: Total Nilai Pengajuan */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL NILAI PENGAJUAN</p>
                  <p className="text-lg font-semibold text-slate-900 font-mono truncate" title={`Rp ${totalBudget.toLocaleString("id-ID")}`}>
                    Rp {totalBudget.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* KPI 4: Menunggu Review Finance */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">REVIEW FINANCE</p>
                  <p className="text-xl font-semibold text-amber-700 font-mono">{waitingFinanceCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* KPI 5: Siap Sidang Komite */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">SIDANG KOMITE</p>
                  <p className="text-xl font-semibold text-purple-700 font-mono">{readyCommitteeCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : isProposer ? (
            /* ── PROPOSER / DEPT USER KPI CARDS ──────────────────────────────── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* KPI 1: Total Usulan Departemen */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">DOKUMEN USULAN</p>
                  <p className="text-xl font-semibold text-slate-900 font-mono">{visibleProposals.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>

              {/* KPI 2: Total Anggaran Departemen */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL ANGGARAN DEPT</p>
                  <p className="text-lg font-semibold text-blue-600 font-mono truncate" title={`Rp ${approvedBudget.toLocaleString("id-ID")}`}>
                    Rp {approvedBudget.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* KPI 3: Dalam Proses Review */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">DALAM PROSES REVIEW</p>
                  <p className="text-xl font-semibold text-amber-700 font-mono">{inReviewCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* KPI 4: Usulan Disetujui Komite */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">DISETUJUI KOMITE</p>
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
            /* ── COMMITTEE / MANAGEMENT KPI CARDS ─────────────────────────────── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* KPI 1: Total Usulan Investasi */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL USULAN INVESTASI</p>
                  <p className="text-lg font-semibold text-slate-900 font-mono truncate" title={`Rp ${totalBudget.toLocaleString("id-ID")}`}>
                    Rp {totalBudget.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </div>
              </div>

              {/* KPI 2: Menunggu Sidang Komite */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">ANTREAN SIDANG KOMITE</p>
                  <p className="text-xl font-semibold text-purple-700 font-mono">{readyCommitteeCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>

              {/* KPI 3: Investasi Disetujui Komite */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">INVESTASI DISETUJUI</p>
                  <p className="text-lg font-semibold text-emerald-600 font-mono truncate" title={`Rp ${approvedBudget.toLocaleString("id-ID")}`}>
                    Rp {approvedBudget.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* KPI 4: Total Departemen */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">DEPARTEMEN PENGAJU</p>
                  <p className="text-xl font-semibold text-indigo-700 font-mono">{uniqueDepartments.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* 2 Graphs in Grid - Role Specific */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* Graph 1: Alokasi per Departemen atau Kategori Investasi */}
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      </svg>
                    </span>
                    <h3 className="text-xs font-bold text-slate-800">
                      {isProposer
                        ? "Kategori Investasi Departemen"
                        : "Distribusi Anggaran & Dokumen per Departemen"}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {isProposer
                      ? "Rincian alokasi usulan berdasarkan jenis dan tujuan investasi"
                      : "Alokasi anggaran belanja modal yang diajukan oleh setiap departemen"}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1 max-h-60 overflow-y-auto">
                {isProposer ? (
                  purposeData.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-8">Belum ada data usulan.</p>
                  ) : (
                    purposeData.map((d, idx) => {
                      const pct = totalBudget > 0 ? Math.round((d.budget / totalBudget) * 100) : 0;
                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{d.purpose}</span>
                              <span className="text-[10px] text-slate-500 font-normal">({d.count} Usulan)</span>
                            </div>
                            <span className="font-mono font-bold text-blue-600 text-[11px]">
                              Rp {d.budget.toLocaleString("id-ID")} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  deptData.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-8">Belum ada data departemen.</p>
                  ) : (
                    deptData.map((d, idx) => {
                      const pct = totalBudget > 0 ? Math.round((d.budget / totalBudget) * 100) : 0;
                      return (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{d.dept}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-semibold font-mono">
                                {d.count} Dokumen
                              </span>
                            </div>
                            <span className="font-mono font-bold text-blue-600 text-[11px]">
                              Rp {d.budget.toLocaleString("id-ID")} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>

            {/* Graph 2: Pipeline Tahapan Usulan CAPEX */}
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </span>
                    <h3 className="text-xs font-bold text-slate-800">Pipeline Status Usulan CAPEX</h3>
                  </div>
                  <p className="text-[10px] text-slate-500">Distribusi jumlah usulan berdasarkan tahapan alur verifikasi</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {statusSummary.map((st, idx) => {
                  const pct = visibleProposals.length > 0 ? Math.round((st.count / visibleProposals.length) * 100) : 0;
                  return (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${st.color}`}></span>
                          <span className="font-semibold text-slate-800">{st.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 font-mono">{st.count} Usulan</span>
                          <span className="text-[10px] text-slate-500">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${st.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CAPEX List Table with Separated Columns and Quick Filter Tabs */}
          <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Daftar Usulan CAPEX Aktif
                </h2>
              </div>

              {/* Action & Filter Row */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Input */}
                <div className="relative w-48">
                  <input
                    type="text"
                    placeholder="Cari ID, nama, PIC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:bg-white focus:border-blue-600 transition-all shadow-2xs"
                  />
                  <span className="absolute left-2.5 inset-y-0 flex items-center text-slate-400 pointer-events-none">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                </div>

                {/* Status Filter Dropdown */}
                <div className="relative w-44">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-lg pl-3 pr-8 py-1.5 cursor-pointer focus:outline-none focus:bg-white focus:border-blue-600 transition-all shadow-2xs"
                  >
                    <option value="all">Semua Status</option>
                    <option value="review">Review</option>
                    <option value="draft">Draft</option>
                    <option value="reject">Reject</option>
                    <option value="revisi">Revisi</option>
                    <option value="close">Close</option>
                  </select>
                  <span className="pointer-events-none absolute right-2.5 inset-y-0 flex items-center text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* Separated Column Grid Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wider select-none">
                    <th className="py-3 px-3.5 text-center w-12 border-r border-slate-100">No</th>
                    <th className="py-3 px-3.5 w-28 border-r border-slate-100 whitespace-nowrap">ID Capex</th>
                    <th className="py-3 px-3.5 min-w-[200px] border-r border-slate-100">Nama Capex</th>
                    <th className="py-3 px-3.5 min-w-[220px] border-r border-slate-100">Deskripsi</th>
                    <th className="py-3 px-3.5 w-32 border-r border-slate-100 whitespace-nowrap">Departemen</th>
                    <th className="py-3 px-3.5 w-28 border-r border-slate-100 whitespace-nowrap">PIC</th>
                    <th className="py-3 px-3.5 w-36 text-right border-r border-slate-100 whitespace-nowrap">Estimasi Anggaran</th>
                    <th className="py-3 px-3.5 text-center w-40 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 text-xs">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 italic font-normal">
                        Tidak ada pengajuan investasi ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item: any, idx: number) => (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/30 transition-colors duration-150"
                      >
                        <td className="py-3 px-3.5 text-center font-medium text-slate-400 font-mono border-r border-slate-100">{idx + 1}</td>
                        <td className="py-3 px-3.5 font-mono font-semibold text-blue-600 text-xs border-r border-slate-100 whitespace-nowrap">
                          {item.capexId && item.capexId !== "-" ? item.capexId : "-"}
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-slate-800 border-r border-slate-100">
                          <p className="font-semibold text-slate-800">{item.name}</p>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 font-normal border-r border-slate-100">
                          <p className="text-[11px] text-slate-500 font-normal whitespace-pre-line line-clamp-2" title={item.description}>
                            {item.description || "-"}
                          </p>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 font-medium border-r border-slate-100 whitespace-nowrap">{item.department}</td>
                        <td className="py-3 px-3.5 text-slate-600 font-normal border-r border-slate-100 whitespace-nowrap">{item.pic}</td>
                        <td className="py-3 px-3.5 font-bold text-blue-700 whitespace-nowrap text-right font-mono border-r border-slate-100">
                          Rp {item.estimatedCost ? Number(item.estimatedCost).toLocaleString("id-ID") : "0"}
                        </td>
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex justify-center">
                            <StatusBadge status={item.gateStatus} size="sm" noBackground />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
