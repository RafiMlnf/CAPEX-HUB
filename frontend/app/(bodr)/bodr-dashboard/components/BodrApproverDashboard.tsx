"use client";

import { useState, useMemo } from "react";
import { BodrProposal } from "../../../lib/api";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

interface BodrApproverDashboardProps {
  currentUser: any;
  bodrList: BodrProposal[];
}

export default function BodrApproverDashboard({
  currentUser,
  bodrList,
}: BodrApproverDashboardProps) {
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("ALL");
  const [monthlyChartType, setMonthlyChartType] = useState<"bar" | "line">("bar");
  const [approverKriteriaFilter, setApproverKriteriaFilter] = useState<string>("ALL");
  const [criteriaChartType, setCriteriaChartType] = useState<"bar" | "line">("bar");

  const userRole = (currentUser?.role || "").toLowerCase().trim();
  const userFullName = (currentUser?.name || "").toLowerCase().trim();
  const userUsername = (currentUser?.username || "").toLowerCase().trim();
  const userNpk = (currentUser?.npk || "").toLowerCase().trim();

  // ── 1. Dynamic KPI 1: Total Dokumen BODR Seluruh Sistem ──────────────────────
  const totalBodrAll = bodrList.length;

  // ── 2. Dynamic KPI 2: Pending Action (Menunggu Approval User Login) ──────────
  const pendingActionForUser = useMemo(() => {
    if (!currentUser) {
      return bodrList.filter((b) => b.status === "Pending Review" || b.status === "in_approval").length;
    }

    return bodrList.filter((b) => {
      // Must be currently active in review
      if (b.status !== "Pending Review" && b.status !== "in_approval") return false;

      const history = b.approvalHistory || [];
      const userHasActed = history.some((h: any) => {
        const hName = (h.name || "").toLowerCase().trim();
        const hRole = (h.role || "").toLowerCase().trim();
        const isMe =
          (userFullName && hName === userFullName) ||
          (userUsername && hName === userUsername) ||
          (userNpk && hName === userNpk) ||
          (userRole && hRole === userRole);

        return isMe && (h.status === "Approved" || h.status === "approved" || h.status === "Rejected" || h.status === "rejected");
      });

      return !userHasActed;
    }).length;
  }, [bodrList, currentUser, userFullName, userUsername, userNpk, userRole]);

  // ── 3. Dynamic KPI 3: Total Nilai Anggaran BODR ──────────────────────────────
  const totalAmountAll = useMemo(() => {
    return bodrList.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  }, [bodrList]);

  // ── 4. Dynamic KPI 4: Selesai Disetujui (Approved) ───────────────────────────
  const approvedBodrAll = useMemo(() => {
    return bodrList.filter((b) => b.status === "Approved" || b.status === "approved").length;
  }, [bodrList]);

  // ── 5. Dynamic Approver Chart 1: Monthly Trend Data (12 Bulan) ───────────────
  const monthlyBodrData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      monthName: MONTH_NAMES[i],
      monthShort: MONTH_NAMES[i].substring(0, 3),
      count: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      amount: 0,
    }));

    bodrList.forEach((b) => {
      let monthIdx = -1;
      if (b.date) {
        const d = new Date(b.date);
        if (!isNaN(d.getTime())) {
          monthIdx = d.getMonth();
        }
      }
      if (monthIdx >= 0 && monthIdx < 12) {
        months[monthIdx].count += 1;
        months[monthIdx].amount += Number(b.amount) || 0;
        if (b.status === "Approved" || b.status === "approved") {
          months[monthIdx].approvedCount += 1;
        } else if (b.status === "Pending Review" || b.status === "in_approval") {
          months[monthIdx].pendingCount += 1;
        } else if (b.status === "Rejected" || b.status === "rejected") {
          months[monthIdx].rejectedCount += 1;
        }
      }
    });

    const displayMonths =
      selectedMonthFilter === "ALL"
        ? months
        : months.filter((m) => m.monthIndex.toString() === selectedMonthFilter);

    const highest = Math.max(...displayMonths.map((m) => m.count));
    const maxCount = highest > 0 ? highest : 4;

    return { months: displayMonths, allMonths: months, maxCount, highest };
  }, [bodrList, selectedMonthFilter]);

  // ── 6. Dynamic Approver Chart 2: Criteria Breakdown Data ─────────────────────
  const criteriaBodrData = useMemo(() => {
    const rawCategories = [
      { key: "CAPEX", label: "CAPEX" },
      { key: "FOH", label: "FOH" },
      { key: "GOP", label: "GOP" },
    ];

    const categories =
      approverKriteriaFilter === "ALL"
        ? rawCategories
        : rawCategories.filter((c) => c.key === approverKriteriaFilter);

    const items = categories.map((cat) => {
      const list = bodrList.filter((b) => {
        const c = (b.category || "").toUpperCase();
        if (cat.key === "CAPEX") return c === "CAPEX" || c === "CAP";
        return c === cat.key;
      });

      const approved = list.filter((b) => b.status === "Approved" || b.status === "approved").length;
      const pending = list.filter((b) => b.status === "Pending Review" || b.status === "in_approval").length;
      const rejected = list.filter(
        (b) => b.status === "Rejected" || b.status === "rejected" || b.status === "Revision Required"
      ).length;
      const totalAmount = list.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);

      return {
        key: cat.key,
        label: cat.label,
        total: list.length,
        approved,
        pending,
        rejected,
        totalAmount,
      };
    });

    const highest = Math.max(...items.map((x) => Math.max(x.total, x.approved, x.pending, x.rejected)));
    const maxCount = highest > 0 ? highest : 4;

    return { items, maxCount, highest };
  }, [bodrList, approverKriteriaFilter]);

  // ── 7. Dynamic Table List ───────────────────────────────────────────────────
  const approverFilteredList = useMemo(() => {
    return bodrList.filter((b) => {
      const c = (b.category || "").toUpperCase();
      if (approverKriteriaFilter === "ALL") return true;
      if (approverKriteriaFilter === "CAP") return c === "CAPEX" || c === "CAP";
      return c === approverKriteriaFilter;
    });
  }, [bodrList, approverKriteriaFilter]);

  return (
    <div className="space-y-4">
      {/* 4 100% DYNAMIC STATIC KPI CARDS APPROVER / EXECUTIVE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Jumlah BODR (Total) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between select-none">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              TOTAL JUMLAH BODR
            </p>
            <p className="text-2xl font-bold text-slate-900 font-mono">{totalBodrAll}</p>
            <p className="text-[10px] text-slate-400">Seluruh dokumen terdaftar</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        {/* KPI 2: Pending Action (Static) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between select-none">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
              PENDING ACTION ANDA
            </p>
            <p className="text-2xl font-bold text-amber-700 font-mono">{pendingActionForUser}</p>
            <p className="text-[10px] text-amber-600 font-medium">Memerlukan persetujuan Anda</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* KPI 3: Total Nilai Anggaran BODR */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between select-none">
          <div className="space-y-1 min-w-0 pr-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              TOTAL NILAI ANGGARAN
            </p>
            <p className="text-lg font-bold text-slate-900 font-mono truncate" title={`Rp ${totalAmountAll.toLocaleString("id-ID")}`}>
              Rp {totalAmountAll.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-slate-400">Akumulasi seluruh proposal</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* KPI 4: Selesai Disetujui (Approved) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between select-none">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              DISETUJUI (APPROVED)
            </p>
            <p className="text-2xl font-bold text-emerald-600 font-mono">{approvedBodrAll}</p>
            <p className="text-[10px] text-slate-400">Proposal disetujui penuh</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2 CHARTS IN GRID SESUAI DETAILS.TXT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GRAFIK 1: GRAFIK BODR PER BULAN (STANDAR BAR / LINE CHART) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Grafik BODR Per Bulan
              </h3>
              <p className="text-[10px] text-slate-500">
                Tren volume dokumen BODR sepanjang 12 bulan periode berjalan
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Bulan Standard Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                <label className="text-[10px] font-semibold text-slate-500">Bulan:</label>
                <select
                  value={selectedMonthFilter}
                  onChange={(e) => setSelectedMonthFilter(e.target.value)}
                  className="bg-transparent text-slate-800 font-semibold text-xs outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Bulan (12 Bulan)</option>
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx} value={idx.toString()}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Chart Type */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                <select
                  value={monthlyChartType}
                  onChange={(e) => setMonthlyChartType(e.target.value as "bar" | "line")}
                  className="bg-transparent text-slate-800 font-semibold text-xs outline-none cursor-pointer"
                >
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                </select>
              </div>
            </div>
          </div>

          {/* Canvas Area for Monthly Chart */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 pt-5">
            {monthlyChartType === "bar" ? (
              <div className="relative h-48 flex">
                {/* Y-Axis */}
                <div className="w-7 flex flex-col justify-between text-[9px] font-mono text-slate-400 pb-5 text-right pr-1.5 select-none">
                  <span>{monthlyBodrData.maxCount}</span>
                  <span>{Math.round(monthlyBodrData.maxCount * 0.5)}</span>
                  <span>0</span>
                </div>

                {/* Chart Grid & Bars */}
                <div className="flex-1 flex flex-col justify-between relative border-b border-slate-300 pb-5">
                  <div className="absolute inset-0 pb-5 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                  </div>

                  <div className="relative h-full flex items-end justify-around px-1 gap-1 z-10">
                    {monthlyBodrData.months.map((m) => {
                      const heightPct = (m.count / monthlyBodrData.maxCount) * 100;
                      const hasData = m.count > 0;

                      return (
                        <div key={m.monthIndex} className="flex flex-col items-center h-full justify-end flex-1 group">
                          {hasData && (
                            <span className="text-[9px] font-bold text-blue-700 mb-0.5 font-mono">
                              {m.count}
                            </span>
                          )}
                          <div
                            className={`w-full max-w-6 rounded-t-md transition-all duration-500 ${
                              hasData
                                ? "bg-linear-to-t from-blue-600 to-indigo-500 shadow-2xs"
                                : "bg-slate-200/60"
                            }`}
                            style={{ height: `${hasData ? Math.max(heightPct, 10) : 4}%` }}
                            title={`${m.monthName}: ${m.count} Dokumen (Rp ${(m.amount || 0).toLocaleString("id-ID")})`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-48 flex">
                {/* Y-Axis */}
                <div className="w-7 flex flex-col justify-between text-[9px] font-mono text-slate-400 pb-5 text-right pr-1.5 select-none">
                  <span>{monthlyBodrData.maxCount}</span>
                  <span>{Math.round(monthlyBodrData.maxCount * 0.5)}</span>
                  <span>0</span>
                </div>

                {/* SVG Line Canvas */}
                <div className="flex-1 relative border-b border-slate-300 pb-5 flex items-center">
                  <div className="absolute inset-0 pb-5 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                  </div>

                  <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradMonthly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {(() => {
                      const pts = monthlyBodrData.months.map((m, idx, arr) => {
                        const x = arr.length === 1 ? 150 : (idx / (arr.length - 1)) * 280 + 10;
                        const y = 90 - (m.count / monthlyBodrData.maxCount) * 80;
                        return { x, y, item: m };
                      });

                      const polylinePts = pts.map((p) => `${p.x},${p.y}`).join(" ");
                      const areaPts = `10,95 ${polylinePts} ${pts[pts.length - 1].x},95`;

                      return (
                        <>
                          <polygon points={areaPts} fill="url(#gradMonthly)" />
                          <polyline
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={polylinePts}
                          />
                          {pts.map((p, i) => (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r={p.item.count > 0 ? "4" : "2"}
                              fill="#ffffff"
                              stroke="#2563eb"
                              strokeWidth="2"
                            />
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            )}

            {/* X-Axis labels for 12 months */}
            <div className="flex pl-7 pr-1 pt-1.5 border-t border-slate-200">
              {monthlyBodrData.months.map((m) => (
                <div key={m.monthIndex} className="flex-1 text-center select-none">
                  <span className="text-[9px] font-semibold text-slate-600 block truncate">
                    {m.monthShort}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GRAFIK 2: GRAFIK BODR BERDASARKAN KRITERIA APPROVAL (STANDAR BAR / LINE) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Grafik BODR Berdasarkan Kriteria Approval
                </h3>
              </div>
              <p className="text-[10px] text-slate-500">
                Distribusi volume pengajuan per kriteria (CAPEX, FOH, GOP)
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Kriteria Standard Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                <label className="text-[10px] font-semibold text-slate-500">Kriteria:</label>
                <select
                  value={approverKriteriaFilter}
                  onChange={(e) => setApproverKriteriaFilter(e.target.value)}
                  className="bg-transparent text-slate-800 font-semibold text-xs outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Kriteria</option>
                  <option value="CAPEX">CAPEX</option>
                  <option value="FOH">FOH</option>
                  <option value="GOP">GOP</option>
                </select>
              </div>

              {/* Toggle Chart Type */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                <select
                  value={criteriaChartType}
                  onChange={(e) => setCriteriaChartType(e.target.value as "bar" | "line")}
                  className="bg-transparent text-slate-800 font-semibold text-xs outline-none cursor-pointer"
                >
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                </select>
              </div>
            </div>
          </div>

          {/* Legends */}
          <div className="flex items-center justify-end gap-3 text-[10px] font-semibold pb-1">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Disetujui</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block"></span> Pending</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500 inline-block"></span> Ditolak</span>
          </div>

          {/* Canvas Area for Criteria Chart */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 pt-5">
            <div className="relative h-48 flex">
              {/* Y-Axis */}
              <div className="w-7 flex flex-col justify-between text-[9px] font-mono text-slate-400 pb-5 text-right pr-1.5 select-none">
                <span>{criteriaBodrData.maxCount}</span>
                <span>{Math.round(criteriaBodrData.maxCount * 0.5)}</span>
                <span>0</span>
              </div>

              {/* Main Chart Area */}
              <div className="flex-1 flex flex-col justify-between relative border-b border-slate-300 pb-5">
                <div className="absolute inset-0 pb-5 flex flex-col justify-between pointer-events-none">
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                </div>

                <div className="relative h-full flex items-end justify-around px-3 gap-3 z-10">
                  {criteriaBodrData.items.map((item) => {
                    const appHeight = (item.approved / criteriaBodrData.maxCount) * 100;
                    const pendHeight = (item.pending / criteriaBodrData.maxCount) * 100;
                    const rejHeight = (item.rejected / criteriaBodrData.maxCount) * 100;

                    return (
                      <div key={item.key} className="flex flex-col items-center h-full justify-end flex-1 max-w-36 group">
                        <div className="flex items-end justify-center gap-1.5 h-full w-full">
                          {/* Approved */}
                          <div
                            className={`w-full rounded-t-md transition-all duration-500 ${
                              item.approved > 0 ? "bg-emerald-500 shadow-2xs" : "bg-slate-200/60"
                            }`}
                            style={{ height: `${item.approved > 0 ? Math.max(appHeight, 10) : 4}%` }}
                            title={`Approved: ${item.approved}`}
                          />
                          {/* Pending */}
                          <div
                            className={`w-full rounded-t-md transition-all duration-500 ${
                              item.pending > 0 ? "bg-blue-600 shadow-2xs" : "bg-slate-200/60"
                            }`}
                            style={{ height: `${item.pending > 0 ? Math.max(pendHeight, 10) : 4}%` }}
                            title={`Pending: ${item.pending}`}
                          />
                          {/* Rejected */}
                          <div
                            className={`w-full rounded-t-md transition-all duration-500 ${
                              item.rejected > 0 ? "bg-red-500 shadow-2xs" : "bg-slate-200/60"
                            }`}
                            style={{ height: `${item.rejected > 0 ? Math.max(rejHeight, 10) : 4}%` }}
                            title={`Rejected: ${item.rejected}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-Axis labels */}
            <div className="flex pl-7 pr-1 pt-1.5 border-t border-slate-200">
              {criteriaBodrData.items.map((item) => (
                <div key={item.key} className="flex-1 text-center select-none">
                  <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                  <span className="text-[9px] text-slate-500">
                    Total: {item.total} Dok ({item.approved} Appr)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TABEL MONITORING / ANTREAN TINDAKAN APPROVAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Daftar Monitoring & Antrean Approval BODR
            </h3>
            <p className="text-[10px] text-slate-500">
              Pengajuan aktif yang sedang berjalan dalam tahapan persetujuan berjenjang
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Total: {approverFilteredList.length} Dokumen
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-3.5 border-r border-slate-200">BODR NO</th>
                <th className="py-3 px-3.5 border-r border-slate-200">Requester / Dept</th>
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-44">Judul Proposal</th>
                <th className="py-3 px-3.5 border-r border-slate-200 text-right">Nominal (Rp)</th>
                <th className="py-3 px-3.5 border-r border-slate-200 text-center">Tahap / Step</th>
                <th className="py-3 px-3.5 text-center">Status BODR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {approverFilteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    Tidak ada data pengajuan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                approverFilteredList.slice(0, 8).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-600 border-r border-slate-100 whitespace-nowrap">
                      {b.bodrNo}
                    </td>
                    <td className="py-3 px-3.5 border-r border-slate-100 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{b.proposer || "Requester"}</span>
                      <span className="text-[10px] text-slate-500">{b.department || "-"}</span>
                    </td>
                    <td className="py-3 px-3.5 font-medium text-slate-800 border-r border-slate-100 max-w-64 truncate" title={b.title}>
                      {b.title}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-semibold text-slate-900 border-r border-slate-100 text-right whitespace-nowrap">
                      Rp {Number(b.amount || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-3.5 text-center border-r border-slate-100 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold">
                        {b.step || "Step 1"}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          b.status === "Approved" || b.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                            : b.status === "Rejected" || b.status === "rejected"
                            ? "bg-red-50 text-red-700 border border-red-300"
                            : "bg-blue-50 text-blue-700 border border-blue-300"
                        }`}
                      >
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
  );
}
