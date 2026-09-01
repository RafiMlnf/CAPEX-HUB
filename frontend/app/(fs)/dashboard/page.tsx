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
    const myName = (currentUser.name || "").toLowerCase().trim();
    const userNpk = (currentUser.npk || "").toLowerCase().trim();
    const myUsername = (currentUser.username || "").toLowerCase().trim();

    return proposals.filter((p: any) => {
      const pDept = (p.department || "").toLowerCase().trim();
      const pPic = (p.pic || "").toLowerCase().trim();

      const isSameDept = userDept && (pDept === userDept || pDept.includes(userDept) || userDept.includes(pDept));
      const isSamePic =
        (myName && (pPic === myName || pPic.includes(myName))) ||
        (myUsername && pPic === myUsername) ||
        (userNpk && pPic === userNpk);

      return isSameDept || isSamePic;
    });
  }, [proposals, isAllAccess, currentUser]);

  const calculateLeadTime = (createdAt?: string) => {
    if (!createdAt) return "0 Hari";
    const start = new Date(createdAt).getTime();
    const now = Date.now();
    const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    return `${diffDays} Hari`;
  };

  // Real-time automatic background sync
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

  // 1. Menunggu Review Finance (Gate 1)
  const waitingFinanceCount = useMemo(() => {
    return visibleProposals.filter((p: any) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return (
        (gs.includes("finance") || gs === "gate 1 - finance review" || gs === "gate 1 - pending user feedback") &&
        !gs.includes("revis") &&
        !p.revisionSource
      );
    }).length;
  }, [visibleProposals]);

  // 2. Siap / Sidang Komite (Gate 2)
  const readyCommitteeCount = useMemo(() => {
    return visibleProposals.filter((p: any) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return (
        (gs.includes("committee") || gs.includes("komite")) &&
        !gs.includes("reject") &&
        !gs.includes("revis")
      );
    }).length;
  }, [visibleProposals]);

  // 3. Disetujui / Selesai (Approved / Procurement / Closed)
  const approvedCount = useMemo(() => {
    return visibleProposals.filter((p: any) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return (
        gs === "approved" ||
        gs === "closed" ||
        gs.includes("procurement") ||
        gs.includes("handover")
      );
    }).length;
  }, [visibleProposals]);

  // 4. Draft / Perlu Revisi (Gate 0 / Draft / Revisi)
  const draftAndReviseCount = useMemo(() => {
    return visibleProposals.filter((p: any) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return (
        gs.includes("idea") ||
        gs.includes("draft") ||
        gs.includes("revis") ||
        Boolean(p.revisionSource)
      );
    }).length;
  }, [visibleProposals]);

  // 5. Ditolak Komite (Gate 2 - Rejected)
  const rejectedCount = useMemo(() => {
    return visibleProposals.filter((p: any) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return gs.includes("reject");
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
        (item.capexId || "").toLowerCase().includes(q) ||
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
        matchesStatus = status.includes("close") || status.includes("approved");
      }

      return matchesSearch && matchesStatus;
    });
  }, [visibleProposals, searchTerm, statusFilter]);

  // Department breakdown
  const deptData = useMemo(() => {
    const map: Record<string, { budget: number; count: number }> = {};
    visibleProposals.forEach((p: any) => {
      const dept = p.department || "General";
      if (!map[dept]) {
        map[dept] = { budget: 0, count: 0 };
      }
      map[dept].budget += (p.estimatedCost || 0);
      map[dept].count += 1;
    });
    return Object.entries(map).map(([dept, val]) => ({
      dept,
      ...val,
    }));
  }, [visibleProposals]);

  // Purpose breakdown
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
          title="DASHBOARD CAPEX"
          subtitle="Sistem monitoring perencanaan, verifikasi anggaran, dan alur persetujuan Capital Expenditure"
        />

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 w-full min-w-0 overflow-x-hidden">
          {/* Top Hero Banner */}
          <div className="bg-linear-to-r from-blue-600 via-indigo-700 to-blue-800 rounded-2xl px-6 py-4 text-white shadow-sm relative overflow-hidden flex items-center">
            <div className="relative z-10">
              <h1 className="text-xl font-bold tracking-tight text-white uppercase">
                DASHBOARD CAPEX
              </h1>
            </div>
            <div className="absolute right-0 top-0 w-80 h-full bg-white/5 transform skew-x-12 pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* KPI CARDS (Cleaned up & Minimalist) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* KPI 1: Total Dokumen CAPEX */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL DOKUMEN CAPEX</p>
              <p className="text-xl font-semibold text-slate-900 font-mono mt-1">{visibleProposals.length}</p>
            </div>

            {/* KPI 2: Total Nilai Pengajuan */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TOTAL NILAI PENGAJUAN</p>
              <p className="text-lg font-semibold text-slate-900 font-mono truncate mt-1" title={`Rp ${totalBudget.toLocaleString("id-ID")}`}>
                Rp {totalBudget.toLocaleString("id-ID")}
              </p>
            </div>

            {/* KPI 3: Menunggu Review Finance */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">REVIEW FINANCE</p>
              <p className="text-xl font-semibold text-amber-700 font-mono mt-1">{waitingFinanceCount}</p>
            </div>

            {/* KPI 4: Siap Sidang Komite */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs">
              <p className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">SIDANG KOMITE</p>
              <p className="text-xl font-semibold text-purple-700 font-mono mt-1">{readyCommitteeCount}</p>
            </div>
          </div>

          {/* 2 Graphs in Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* Graph 1: Alokasi per Departemen atau Kategori */}
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    </svg>
                  </span>
                  <h3 className="text-xs font-bold text-slate-800">
                    {isProposer ? "Kategori Investasi Departemen" : "Distribusi Anggaran & Dokumen per Departemen"}
                  </h3>
                </div>
                <p className="text-[10px] text-slate-500">
                  {isProposer
                    ? "Rincian alokasi usulan berdasarkan jenis dan tujuan investasi"
                    : "Alokasi anggaran belanja modal yang diajukan oleh setiap departemen"}
                </p>
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
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                  <h3 className="text-xs font-bold text-slate-800">Pipeline Status Usulan CAPEX</h3>
                </div>
                <p className="text-[10px] text-slate-500">Distribusi jumlah usulan berdasarkan tahapan alur verifikasi aktif</p>
              </div>

              <div className="space-y-2 pt-1 max-h-60 overflow-y-auto">
                {[
                  { label: "Draft / Perlu Revisi", count: draftAndReviseCount, color: "bg-slate-400" },
                  { label: "Verifikasi Finance (Gate 1)", count: waitingFinanceCount, color: "bg-blue-600" },
                  { label: "Sidang Komite (Gate 2)", count: readyCommitteeCount, color: "bg-purple-600" },
                  { label: "Disetujui Komite (Approved)", count: approvedCount, color: "bg-emerald-600" },
                  { label: "Ditolak Komite", count: rejectedCount, color: "bg-rose-500" },
                ].map((s, idx) => {
                  const pct = visibleProposals.length > 0 ? Math.round((s.count / visibleProposals.length) * 100) : 0;
                  return (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{s.label}</span>
                        <span className="font-mono font-bold text-slate-700 text-[11px]">
                          {s.count} Usulan ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${s.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CAPEX List Table with Lead Time & Separated Columns */}
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

            {/* Separated Column Grid Table with Lead Time */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full min-w-[1050px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wider select-none">
                    <th className="py-3 px-3.5 text-center w-12 border-r border-slate-100">No</th>
                    <th className="py-3 px-3.5 w-28 border-r border-slate-100 whitespace-nowrap">ID Capex</th>
                    <th className="py-3 px-3.5 min-w-[200px] border-r border-slate-100">Nama Capex</th>
                    <th className="py-3 px-3.5 w-32 border-r border-slate-100 whitespace-nowrap">Purpose / Type</th>
                    <th className="py-3 px-3.5 w-28 border-r border-slate-100 whitespace-nowrap">PIC</th>
                    <th className="py-3 px-3.5 w-28 border-r border-slate-100 whitespace-nowrap">Lead Time</th>
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
                          {item.capexId && item.capexId !== "-" ? item.capexId : item.id}
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-slate-800 border-r border-slate-100">
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          {item.description && (
                            <p className="text-[10.5px] text-slate-400 font-normal line-clamp-1 truncate mt-0.5">{item.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-slate-700 border-r border-slate-100 whitespace-nowrap">
                          <span className="font-medium text-slate-800">{item.purpose || "-"}</span>
                          <span className="text-slate-400 block text-[10px]">{item.investmentType || "-"}</span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 font-normal border-r border-slate-100 whitespace-nowrap">{item.pic}</td>
                        <td className="py-3 px-3.5 text-slate-600 font-mono border-r border-slate-100 whitespace-nowrap text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            ⏱️ {calculateLeadTime(item.createdAt)}
                          </span>
                        </td>
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
