"use client";

import { useState, useMemo } from "react";
import { BodrProposal, CapexProposal } from "../../../lib/api";

interface BodrRequesterDashboardProps {
  currentUser: any;
  bodrList: BodrProposal[];
  capexList: CapexProposal[];
  data: any | null;
}

export default function BodrRequesterDashboard({
  currentUser,
  bodrList,
  capexList,
  data,
}: BodrRequesterDashboardProps) {
  const [requesterKriteriaFilter, setRequesterKriteriaFilter] = useState<string>("ALL");

  // ── 1. Dynamic Filtered Proposal List for User / Department ──────────────────
  const userDeptList = useMemo(() => {
    if (!currentUser) return bodrList;
    const userDept = (currentUser.department || "").toLowerCase().trim();
    const myName = (currentUser.name || "").toLowerCase().trim();
    const myUsername = (currentUser.username || "").toLowerCase().trim();
    const myNpk = (currentUser.npk || "").toLowerCase().trim();

    return bodrList.filter((b) => {
      const bDept = (b.department || "").toLowerCase().trim();
      const bProposer = (b.proposer || "").toLowerCase().trim();

      const matchDept = userDept && (bDept === userDept || bDept.includes(userDept) || userDept.includes(bDept));
      const matchProposer =
        (myName && (bProposer === myName || bProposer.includes(myName))) ||
        (myUsername && bProposer === myUsername) ||
        (myNpk && bProposer === myNpk);

      return matchDept || matchProposer;
    });
  }, [bodrList, currentUser]);

  // ── 2. Dynamic KPI 1: Jumlah BODR (Total Usulan User / Dept) ─────────────────
  const requesterTotalBodr = userDeptList.length;

  // ── 3. Dynamic KPI 2: Pending Approval ───────────────────────────────────────
  const requesterPendingCount = useMemo(() => {
    return userDeptList.filter(
      (b) => b.status === "Pending Review" || b.status === "in_approval"
    ).length;
  }, [userDeptList]);

  // ── 4. Dynamic KPI 3: Amount Capex Actual (Realisasi dari BODR Approved) ─────
  const requesterCapexActual = useMemo(() => {
    // Filter approved BODR proposals belonging to this requester / department
    const approvedBodrs = userDeptList.filter(
      (b) => b.status === "Approved" || b.status === "approved"
    );

    if (approvedBodrs.length > 0) {
      return approvedBodrs.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
    }

    // Fallback to backend aggregate if available
    if (data?.capex_actual !== undefined && data.capex_actual !== null) {
      return Number(data.capex_actual);
    }

    return 0;
  }, [userDeptList, data]);

  // ── 5. Dynamic KPI 4: Capex Budget (Pagu Anggaran Capex Departemen / Total) ──
  const requesterCapexBudget = useMemo(() => {
    if (!currentUser) return 0;
    const userDept = (currentUser.department || "").toLowerCase().trim();

    // Find Capex proposals matching user's department
    const deptCapexList = capexList.filter((c: any) => {
      const cDept = (c.department || "").toLowerCase().trim();
      return userDept && (cDept === userDept || cDept.includes(userDept) || userDept.includes(cDept));
    });

    if (deptCapexList.length > 0) {
      return deptCapexList.reduce(
        (acc, c: any) => acc + Number(c.estimated_cost || c.estimatedCost || c.total_amount || 0),
        0
      );
    }

    // Fallback: If no dept capex, check backend data aggregate or total capex
    if (data?.capex_budget !== undefined && data.capex_budget !== null && Number(data.capex_budget) > 0) {
      return Number(data.capex_budget);
    }

    if (capexList.length > 0) {
      return capexList.reduce(
        (acc, c: any) => acc + Number(c.estimated_cost || c.estimatedCost || c.total_amount || 0),
        0
      );
    }

    return 0;
  }, [currentUser, capexList, data]);

  // ── 6. Dynamic Chart Statistics (Real Data Aggregation) ──────────────────────
  const requesterChartData = useMemo(() => {
    const rawCategories = [
      { key: "CAP", label: "CAP (Capex)" },
      { key: "FOH", label: "FOH" },
      { key: "GOP", label: "GOP" },
    ];

    const categories =
      requesterKriteriaFilter === "ALL"
        ? rawCategories
        : rawCategories.filter((c) => c.key === requesterKriteriaFilter);

    const items = categories.map((cat) => {
      const list = userDeptList.filter((b) => {
        const c = (b.category || "").toUpperCase();
        if (cat.key === "CAP") return c === "CAPEX" || c === "CAP";
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

    const highestCount = Math.max(...items.map((x) => Math.max(x.total, x.approved, x.pending, x.rejected)));
    const maxCount = highestCount > 0 ? highestCount : 4;

    const totalApproved = items.reduce((a, b) => a + b.approved, 0);
    const totalPending = items.reduce((a, b) => a + b.pending, 0);
    const totalRejected = items.reduce((a, b) => a + b.rejected, 0);
    const grandTotalDocs = items.reduce((a, b) => a + b.total, 0);
    const grandTotalNominal = items.reduce((a, b) => a + b.totalAmount, 0);

    return {
      items,
      maxCount,
      highestCount,
      totalApproved,
      totalPending,
      totalRejected,
      grandTotalDocs,
      grandTotalNominal,
    };
  }, [userDeptList, requesterKriteriaFilter]);

  // ── 7. Dynamic Filtered Table List ──────────────────────────────────────────
  const requesterFilteredTable = useMemo(() => {
    return userDeptList.filter((b) => {
      const c = (b.category || "").toUpperCase();
      if (requesterKriteriaFilter === "ALL") return true;
      if (requesterKriteriaFilter === "CAP") return c === "CAPEX" || c === "CAP";
      return c === requesterKriteriaFilter;
    });
  }, [userDeptList, requesterKriteriaFilter]);

  return (
    <div className="space-y-4">
      {/* 4 100% DYNAMIC STATIC KPI CARDS REQUESTER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Jumlah BODR */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between select-none">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              JUMLAH BODR
            </p>
            <p className="text-2xl font-bold text-slate-900 font-mono">{requesterTotalBodr}</p>
            <p className="text-[10px] text-slate-400">Total usulan Anda / departemen</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* KPI 2: Status Pending Approval (Static Display) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between select-none">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
              PENDING APPROVAL
            </p>
            <p className="text-2xl font-bold text-amber-700 font-mono">{requesterPendingCount}</p>
            <p className="text-[10px] text-amber-600 font-medium">Dalam proses peninjauan</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* KPI 3: Amount Capex Acctual (100% Dynamic from DB) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between select-none">
          <div className="space-y-1 min-w-0 pr-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              AMOUNT CAPEX ACTUAL
            </p>
            <p className="text-lg font-bold text-emerald-600 font-mono truncate" title={`Rp ${requesterCapexActual.toLocaleString("id-ID")}`}>
              Rp {requesterCapexActual.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-slate-400">Total realisasi terpakai</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* KPI 4: Capex Budget (100% Dynamic from DB) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between select-none">
          <div className="space-y-1 min-w-0 pr-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              CAPEX BUDGET
            </p>
            <p className="text-lg font-bold text-slate-900 font-mono truncate" title={`Rp ${requesterCapexBudget.toLocaleString("id-ID")}`}>
              Rp {requesterCapexBudget.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-slate-400">Alokasi pagu Capex berjalan</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>

      {/* GRAFIK JUMLAH BODR (STANDAR BAR / LINE CHART DENGAN FILTER DROPDOWN) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Grafik Jumlah BODR (Kriteria Pengajuan)
            </h3>
            <p className="text-[10px] text-slate-500">
              Visualisasi statistik volume dokumen BODR berdasarkan kriteria CAP, FOH, dan GOP
            </p>
          </div>

          {/* Standard Filter Dropdowns & View Mode Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Kriteria Standard Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              <label className="text-[10px] font-semibold text-slate-500">Filter Kriteria:</label>
              <select
                value={requesterKriteriaFilter}
                onChange={(e) => setRequesterKriteriaFilter(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold text-xs outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kriteria (CAP, FOH, GOP)</option>
                <option value="CAP">CAP (Capex)</option>
                <option value="FOH">FOH</option>
                <option value="GOP">GOP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Legends */}
        <div className="flex flex-wrap items-center justify-end gap-4 text-[10px] font-semibold text-slate-600 pb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Disetujui ({requesterChartData.totalApproved})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" /> Pending ({requesterChartData.totalPending})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" /> Ditolak / Revisi ({requesterChartData.totalRejected})
          </span>
        </div>

        {/* Canvas Area: Real Vertical Bar Chart */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 pt-6">
          <div className="relative h-60 flex">
            {/* Y-Axis scale numbers on left */}
            <div className="w-8 flex flex-col justify-between text-[9px] font-mono text-slate-400 pb-6 text-right pr-2 select-none">
              <span>{requesterChartData.maxCount}</span>
              <span>{Math.round(requesterChartData.maxCount * 0.75)}</span>
              <span>{Math.round(requesterChartData.maxCount * 0.5)}</span>
              <span>{Math.round(requesterChartData.maxCount * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Main Chart Area */}
            <div className="flex-1 flex flex-col justify-between relative border-b border-slate-300 pb-6">
              {/* Grid lines */}
              <div className="absolute inset-0 pb-6 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
              </div>

              {/* Bars Group */}
              <div className="relative h-full flex items-end justify-around px-4 gap-4 z-10">
                {requesterChartData.items.map((item) => {
                  const appHeight = (item.approved / requesterChartData.maxCount) * 100;
                  const pendHeight = (item.pending / requesterChartData.maxCount) * 100;
                  const rejHeight = (item.rejected / requesterChartData.maxCount) * 100;

                  return (
                    <div key={item.key} className="flex flex-col items-center h-full justify-end flex-1 max-w-44 group">
                      <div className="flex items-end justify-center gap-2 h-full w-full">
                        {/* Approved Bar (Green) */}
                        <div className="flex flex-col items-center justify-end h-full flex-1 max-w-10">
                          {item.approved > 0 && (
                            <span className="text-[9px] font-bold text-emerald-700 mb-1 font-mono">
                              {item.approved}
                            </span>
                          )}
                          <div
                            className={`w-full rounded-t-md transition-all duration-500 ${
                              item.approved > 0
                                ? "bg-linear-to-t from-emerald-600 to-emerald-400 shadow-2xs"
                                : "bg-slate-200/60"
                            }`}
                            style={{ height: `${item.approved > 0 ? Math.max(appHeight, 8) : 4}%` }}
                            title={`Disetujui: ${item.approved}`}
                          />
                        </div>

                        {/* Pending Bar (Blue) */}
                        <div className="flex flex-col items-center justify-end h-full flex-1 max-w-10">
                          {item.pending > 0 && (
                            <span className="text-[9px] font-bold text-blue-700 mb-1 font-mono">
                              {item.pending}
                            </span>
                          )}
                          <div
                            className={`w-full rounded-t-md transition-all duration-500 ${
                              item.pending > 0
                                ? "bg-linear-to-t from-blue-600 to-blue-400 shadow-2xs"
                                : "bg-slate-200/60"
                            }`}
                            style={{ height: `${item.pending > 0 ? Math.max(pendHeight, 8) : 4}%` }}
                            title={`Pending: ${item.pending}`}
                          />
                        </div>

                        {/* Rejected Bar (Red) */}
                        <div className="flex flex-col items-center justify-end h-full flex-1 max-w-10">
                          {item.rejected > 0 && (
                            <span className="text-[9px] font-bold text-red-600 mb-1 font-mono">
                              {item.rejected}
                            </span>
                          )}
                          <div
                            className={`w-full rounded-t-md transition-all duration-500 ${
                              item.rejected > 0
                                ? "bg-linear-to-t from-red-600 to-red-400 shadow-2xs"
                                : "bg-slate-200/60"
                            }`}
                            style={{ height: `${item.rejected > 0 ? Math.max(rejHeight, 8) : 4}%` }}
                            title={`Ditolak/Revisi: ${item.rejected}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* X-Axis Labels */}
          <div className="flex pl-8 pr-2 pt-2 border-t border-slate-200">
            {requesterChartData.items.map((item) => (
              <div key={item.key} className="flex-1 text-center select-none">
                <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Rp {item.totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODR LIST (TABEL DAFTAR USULAN REQUESTER SESUAI DETAILS.TXT) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              BODR List (Daftar Pengajuan Usulan Anda)
            </h3>
            <p className="text-[10px] text-slate-500">
              Seluruh dokumen BODR yang sedang atau telah diajukan oleh akun Anda
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Total: {requesterFilteredTable.length} Dokumen
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-3.5 border-r border-slate-200">BODR NO</th>
                <th className="py-3 px-3.5 border-r border-slate-200">Created BODR</th>
                <th className="py-3 px-3.5 border-r border-slate-200 min-w-44">Title BODR</th>
                <th className="py-3 px-3.5 border-r border-slate-200 text-right">AMOUNT</th>
                <th className="py-3 px-3.5 border-r border-slate-200 text-center">Kriteria Capex</th>
                <th className="py-3 px-3.5 text-center">Status BODR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {requesterFilteredTable.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-sm font-semibold text-slate-600">Belum ada pengajuan BODR</span>
                      <span className="text-[11px] text-slate-400">Silakan gunakan menu Create BODR untuk membuat pengajuan baru.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                requesterFilteredTable.slice(0, 10).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-600 border-r border-slate-100 whitespace-nowrap">
                      {b.bodrNo}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {b.date ? b.date.split("T")[0] : "-"}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-slate-800 border-r border-slate-100 max-w-64 truncate" title={b.title}>
                      {b.title}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-semibold text-slate-900 border-r border-slate-100 text-right whitespace-nowrap">
                      Rp {Number(b.amount || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-3.5 text-center border-r border-slate-100 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {b.category || "CAPEX"}
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
