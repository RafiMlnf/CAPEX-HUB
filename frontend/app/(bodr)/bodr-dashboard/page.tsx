"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import { api, BodrProposal, CapexProposal } from "../../lib/api";
import { useCapex } from "../../context/CapexContext";

export default function BodrDashboardPage() {
  const router = useRouter();
  const { currentUser, hasPermission } = useCapex();
  const [data, setData] = useState<any | null>(null);
  const [bodrList, setBodrList] = useState<BodrProposal[]>([]);
  const [capexList, setCapexList] = useState<CapexProposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Chart
  const [kriteriaFilter, setKriteriaFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const canViewDashboard = hasPermission("perm_view_dashboard");

  const refreshData = () => {
    if (!canViewDashboard) return;
    setLoading(true);
    Promise.all([
      api.getBodrDashboard(),
      api.getBodrProposals(),
      api.getProposals(),
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
            date: b.date,
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
  }, [canViewDashboard]);

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
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer w-full text-center"
            >
              Kembali ke Portal Utama
            </a>
          </div>
        </main>
      </div>
    );
  }

  // Filtered List based on dropdown filters
  const filteredList = useMemo(() => {
    return bodrList.filter((b) => {
      const c = (b.category || "").toUpperCase();
      const matchKriteria =
        kriteriaFilter === "ALL" ||
        (kriteriaFilter === "CAP" && (c === "CAPEX" || c === "CAP")) ||
        c === kriteriaFilter;
      const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
      return matchKriteria && matchStatus;
    });
  }, [bodrList, kriteriaFilter, statusFilter]);

  // KPIs
  const totalBodr = bodrList.length;
  const pendingRequests = bodrList.filter((b) => b.status === "Pending Review").length;
  const completedTasks = bodrList.filter((b) => b.status === "Approved").length;
  const overdueTasks = bodrList.filter((b) => b.status === "Rejected" || b.status === "Revision Required").length;

  // Donut Chart Status Distribution Calculations
  const donutData = useMemo(() => {
    const total = bodrList.length || 1;
    const approved = bodrList.filter((b) => b.status === "Approved").length;
    const pending = bodrList.filter((b) => b.status === "Pending Review").length;
    const rejected = bodrList.filter((b) => b.status === "Rejected" || b.status === "Revision Required").length;

    const r = 50;
    const c = 2 * Math.PI * r; // ~314.16

    const pApproved = (approved / total) * c;
    const pPending = (pending / total) * c;
    const pRejected = (rejected / total) * c;

    return {
      approved,
      pending,
      rejected,
      total: bodrList.length,
      c,
      pApproved,
      pPending,
      pRejected,
      offsetApproved: 0,
      offsetPending: -pApproved,
      offsetRejected: -(pApproved + pPending),
    };
  }, [bodrList]);

  // Bar Chart Data (Kriteria Breakdown / Comparison)
  const barChartData = useMemo(() => {
    const categories = ["CAPEX", "FOH", "GOP"];
    const items = categories.map((cat) => {
      const list = filteredList.filter((b) => {
        const c = (b.category || "").toUpperCase();
        if (cat === "CAPEX") return c === "CAPEX" || c === "CAP";
        return c === cat;
      });
      const pendingCount = list.filter((b) => b.status === "Pending Review").length;
      const approvedCount = list.filter((b) => b.status === "Approved").length;
      const totalCount = list.length;
      return {
        category: cat,
        pendingCount,
        approvedCount,
        totalCount,
      };
    });

    const maxVal = Math.max(...items.map((x) => Math.max(x.pendingCount, x.approvedCount)), 3);
    return { items, maxVal };
  }, [filteredList]);

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header
          title="BODR Portal"
          subtitle="Ringkasan eksekutif anggaran Capex, realisasi pengeluaran BODR, dan status antrian persetujuan"
        />

        <main className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
          {/* Top Hero Banner */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl px-6 py-4 text-white shadow-sm relative overflow-hidden">
            <div className="relative z-10 space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold backdrop-blur-sm border border-white/20">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                BODR Workspace
              </span>
              <h1 className="text-xl font-black tracking-tight text-white">BODR Portal & Monitoring</h1>
              <p className="text-blue-100 text-[11px] max-w-2xl font-normal leading-normal">
                Monitor and manage Capex, FOH, and GOP investment proposals, approvals, and budget allocation in an integrated workspace.
              </p>
            </div>
            {/* Background geometric accents */}
            <div className="absolute right-0 top-0 w-80 h-full bg-white/5 transform skew-x-12 pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/30 rounded-full blur-2xl pointer-events-none" />
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-bold">
              Memuat data dashboard eksekutif...
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* KPI 1: TOTAL REQUESTS */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TOTAL BODR REQUESTS</p>
                    <p className="text-2xl font-black text-slate-900 font-mono">{totalBodr}</p>
                    <p className="text-[10px] text-slate-400 font-medium">All requests</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>

                {/* KPI 2: PENDING REQUESTS */}
                <div
                  onClick={() => router.push("/bodr")}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50/50 group"
                  title="Klik untuk membuka List BODR"
                >
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PENDING REQUESTS</p>
                    <p className="text-2xl font-black text-slate-900 font-mono">{pendingRequests}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Awaiting approval</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* KPI 3: COMPLETED TASKS */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">COMPLETED TASKS</p>
                    <p className="text-2xl font-black text-slate-900 font-mono">{completedTasks}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Approved proposals</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* KPI 4: URGENT / OVERDUE TASKS */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 px-4 shadow-2xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">REJECTED / REVISION</p>
                    <p className="text-2xl font-black text-slate-900 font-mono">{overdueTasks}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Need attention</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm shadow-red-500/20">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Chart Filters Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 px-4 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">CHART FILTERS</h3>
                    <p className="text-[10px] text-slate-500">Filter chart statistics by criteria and status</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-500">Kriteria:</span>
                    <select
                      value={kriteriaFilter}
                      onChange={(e) => setKriteriaFilter(e.target.value)}
                      className="bg-transparent text-slate-800 font-bold text-xs outline-none cursor-pointer"
                    >
                      <option value="ALL">Semua Kriteria</option>
                      <option value="CAP">CAPEX</option>
                      <option value="FOH">FOH</option>
                      <option value="GOP">GOP</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-500">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-transparent text-slate-800 font-bold text-xs outline-none cursor-pointer"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2 Charts in Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {/* Left Chart: Donut Chart Status Distribution */}
                <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <h3 className="text-xs font-bold text-slate-800">BODR Work Status Distribution</h3>
                    </div>
                    <p className="text-[10px] text-slate-500">Current proportion of BODR approval task statuses</p>
                  </div>

                  <div className="flex flex-col items-center justify-center pt-2 pb-1 space-y-3">
                    {/* SVG Donut */}
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        {/* Background track */}
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          stroke="#f1f5f9"
                          strokeWidth="14"
                        />
                        {/* Approved Segment (Green) */}
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth="14"
                          strokeDasharray={`${donutData.pApproved} ${donutData.c}`}
                          strokeDashoffset={donutData.offsetApproved}
                          className="transition-all duration-700"
                        />
                        {/* Pending Segment (Blue) */}
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          stroke="#3b82f6"
                          strokeWidth="14"
                          strokeDasharray={`${donutData.pPending} ${donutData.c}`}
                          strokeDashoffset={donutData.offsetPending}
                          className="transition-all duration-700"
                        />
                        {/* Rejected Segment (Red) */}
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          stroke="#ef4444"
                          strokeWidth="14"
                          strokeDasharray={`${donutData.pRejected} ${donutData.c}`}
                          strokeDashoffset={donutData.offsetRejected}
                          className="transition-all duration-700"
                        />
                      </svg>
                      {/* Center total count */}
                      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-black text-slate-800 font-mono">{donutData.total}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Total Doc</span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span className="text-slate-700 text-[10px]">Completed / Approved ({donutData.approved})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                        <span className="text-slate-700 text-[10px]">Rejected ({donutData.rejected})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                        <span className="text-slate-700 text-[10px]">Pending / Review ({donutData.pending})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Chart: Bar Chart Quotation & Estimation Trends */}
                <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </span>
                        <h3 className="text-xs font-bold text-slate-800">Criteria Quotation & Estimation Trends</h3>
                      </div>
                      <p className="text-[10px] text-slate-500">Volume of BODR proposals processed by criteria</p>
                    </div>

                    {/* Legend Top-Right */}
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                        <span className="text-slate-600">Completed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
                        <span className="text-slate-600">Pending / In Progress</span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Bar Chart Canvas */}
                  <div className="pt-1 pb-1">
                    <div className="relative h-40 flex">
                      {/* Y-Axis scale numbers on left */}
                      <div className="w-8 flex flex-col justify-between text-[9px] font-mono text-slate-400 pb-5 text-right pr-2">
                        <span>{barChartData.maxVal}</span>
                        <span>{(barChartData.maxVal * 0.75).toFixed(0)}</span>
                        <span>{(barChartData.maxVal * 0.5).toFixed(0)}</span>
                        <span>{(barChartData.maxVal * 0.25).toFixed(0)}</span>
                        <span>0</span>
                      </div>

                      {/* Main Chart Area */}
                      <div className="flex-1 flex flex-col justify-between relative border-b border-slate-200 pb-5">
                        {/* Grid lines */}
                        <div className="absolute inset-0 pb-5 flex flex-col justify-between pointer-events-none">
                          <div className="border-b border-slate-100 w-full" />
                          <div className="border-b border-slate-100 w-full" />
                          <div className="border-b border-slate-100 w-full" />
                          <div className="border-b border-slate-100 w-full" />
                        </div>

                        {/* Bars Group */}
                        <div className="relative h-full flex items-end justify-around px-4">
                          {barChartData.items.map((item, idx) => {
                            const pHeight = Math.max(0, (item.pendingCount / barChartData.maxVal) * 100);
                            const cHeight = Math.max(0, (item.approvedCount / barChartData.maxVal) * 100);

                            return (
                              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                                <div className="flex items-end gap-1.5 h-full">
                                  {/* Pending Bar (Blue) */}
                                  <div
                                    className="w-9 bg-blue-600 rounded-t transition-all duration-500 hover:bg-blue-700 relative"
                                    style={{ height: `${pHeight > 0 ? pHeight : 3}%` }}
                                    title={`Pending: ${item.pendingCount}`}
                                  />
                                  {/* Completed Bar (Green) */}
                                  <div
                                    className="w-9 bg-emerald-500 rounded-t transition-all duration-500 hover:bg-emerald-600 relative"
                                    style={{ height: `${cHeight > 0 ? cHeight : 3}%` }}
                                    title={`Approved: ${item.approvedCount}`}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 mt-1.5 block select-none">
                                  {item.category}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabel BODR List Ringkas */}
              <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-2xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">BODR List (Daftar Pengajuan)</h3>
                    <p className="text-[10px] text-slate-500">Proposal yang sedang aktif dalam proses approval</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/bodr")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Buka Seluruh List BODR →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3 border-r border-slate-200">BODR NO</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Created BODR</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Title BODR</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">AMOUNT</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 text-center">Kriteria Capex</th>
                        <th className="py-2.5 px-3 text-center">Status BODR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                            Tidak ada data pengajuan yang cocok dengan filter.
                          </td>
                        </tr>
                      ) : (
                        filteredList.slice(0, 8).map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600 border-r border-slate-100">{b.bodrNo}</td>
                            <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100">{b.date}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-slate-100 max-w-64 truncate" title={b.title}>{b.title}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800 border-r border-slate-100 whitespace-nowrap">
                              Rp {b.amount.toLocaleString("id-ID")}
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {b.category || "CAPEX"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                b.status === "Approved"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                                  : b.status === "Rejected"
                                  ? "bg-red-50 text-red-700 border border-red-300"
                                  : "bg-blue-50 text-blue-700 border border-blue-300"
                              }`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
