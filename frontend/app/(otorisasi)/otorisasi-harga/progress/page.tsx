"use client";

import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../components/Header";
import {
  api,
  ApiOtorisasiHargaNonProduct,
  ApiOtorisasiHarga,
  ApprovalHistoryOH,
} from "../../../lib/api";

const fmtRupiah = (val: number | string | undefined | null) => {
  const num = typeof val === "number" ? val : Number(val || 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
};

// ── Helper: calculate actual days between two date strings ──────────────────
function calculateDays(startStr?: string, endStr?: string): string {
  if (!startStr) return "-";
  const start = new Date(startStr).getTime();
  if (isNaN(start)) return "-";
  const end = endStr ? new Date(endStr).getTime() : Date.now();
  if (isNaN(end)) return "-";
  const diffMs = Math.max(0, end - start);
  const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return `${diffDays}d`;
}

// ── Status Badge Pill Component for Price Approval Progress ─────────────────
function PriceProgressStatusPill({ status }: { status: string }) {
  const s = (status || "").toLowerCase();

  if (s.includes("approved") || s.includes("closed") || s.includes("selesai")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        {status}
      </span>
    );
  }
  if (s.includes("in progress") || s.includes("pending")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-300 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        {status}
      </span>
    );
  }
  if (s.includes("revision") || s.includes("revise")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        {status}
      </span>
    );
  }
  if (s.includes("rejected") || s.includes("tolak")) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-300 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
        {status}
      </span>
    );
  }
  // Default: Waiting
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
      {status || "Waiting"}
    </span>
  );
}

interface PriceProgressRow {
  id: string;
  noDoc: string;
  isProduct: boolean;
  type: "Non-Product" | "Product";
  description: string;
  category: string;
  department: string;
  creator: string;
  amount: number;
  step: string;
  status: string;
  created_at: string;
  stepStatuses: Record<string, { days: string; status: string }>;
  isClosedAll: boolean;
  history: ApprovalHistoryOH[];
  rawItem: any;
}

const STEP_HEADER_COLORS = [
  "bg-blue-50/70 text-blue-900 border-b border-blue-200",
  "bg-indigo-50/70 text-indigo-900 border-b border-indigo-200",
  "bg-purple-50/70 text-purple-900 border-b border-purple-200",
  "bg-emerald-50/70 text-emerald-900 border-b border-emerald-200",
  "bg-amber-50/70 text-amber-900 border-b border-amber-200",
  "bg-cyan-50/70 text-cyan-900 border-b border-cyan-200",
  "bg-rose-50/70 text-rose-900 border-b border-rose-200",
  "bg-teal-50/70 text-teal-900 border-b border-teal-200",
];

export default function OtorisasiProgressPage() {
  const [npList, setNpList] = useState<ApiOtorisasiHargaNonProduct[]>([]);
  const [pList, setPList] = useState<ApiOtorisasiHarga[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "NP" | "P">("ALL");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState<PriceProgressRow | null>(null);
  const [exportToast, setExportToast] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resNP, resP, wfList] = await Promise.all([
        api.getOtorisasiHargaNPList().catch(() => []),
        api.getOtorisasiHargaList().catch(() => []),
        api.getApprovalPriceWorkflows().catch(() => []),
      ]);
      setNpList(resNP || []);
      setPList(resP || []);
      setWorkflows(wfList || []);
    } catch (err) {
      console.error("Failed to fetch otorisasi progress:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── 100% Dynamic Workflow Step Columns from Database Settings ─────────────
  const workflowStepNames: string[] = useMemo(() => {
    if (workflows.length > 0) {
      const stepMap = new Map<string, number>();
      workflows.forEach((w: any) => {
        (w.list_approval || []).forEach((s: any) => {
          if (s.role) {
            const rKey = s.role.trim();
            const rOrder = s.order || 1;
            if (!stepMap.has(rKey) || (stepMap.get(rKey) || 99) > rOrder) {
              stepMap.set(rKey, rOrder);
            }
          }
        });
      });

      const entries = Array.from(stepMap.entries()).sort((a, b) => a[1] - b[1]);
      if (entries.length > 0) {
        return entries.map(([role]) => role);
      }
    }

    // Fallback if no workflow records: Extract unique roles from transactions history
    const historyRoles = new Set<string>();
    [...npList, ...pList].forEach((item: any) => {
      (item.approval_history || []).forEach((h: any) => {
        if (h.role) historyRoles.add(h.role.trim());
      });
    });

    if (historyRoles.size > 0) {
      return Array.from(historyRoles);
    }

    return [];
  }, [workflows, npList, pList]);

  // ── Enrich Items into PriceProgressRow with Matrix Step Statuses ───────────
  const enrichedRows: PriceProgressRow[] = useMemo(() => {
    const allItems: PriceProgressRow[] = [];

    // 1. Non-Product Items
    npList.forEach((item) => {
      const history: ApprovalHistoryOH[] = item.approval_history || [];
      const recommendedSupplier = (item.suppliers || []).find((s) => s.recommended) || item.suppliers?.[0];
      const supplierDesc = recommendedSupplier?.vendor_nama || "Supplier";
      const totalAmount = Number(item.dana_bodr || recommendedSupplier?.total_final_price || recommendedSupplier?.harga || 0);
      const itemStatus = (item.status || "Draft").toLowerCase();

      const stepStatuses: Record<string, { days: string; status: string }> = {};

      workflowStepNames.forEach((stepRole, sIdx) => {
        const roleLower = stepRole.toLowerCase().trim();
        const matchHist = history.find((h) => (h.role || "").toLowerCase().trim() === roleLower);

        if (matchHist) {
          const st = (matchHist.status || "").toLowerCase();
          const prevTs = sIdx === 0 ? (item.tanggal || item.created_at) : (history[sIdx - 1]?.timestamp || item.tanggal || item.created_at);
          const days = calculateDays(prevTs, matchHist.timestamp);

          if (st.includes("reject")) {
            stepStatuses[stepRole] = { days, status: "Rejected" };
          } else if (st.includes("revision") || st.includes("revise")) {
            stepStatuses[stepRole] = { days, status: "Revision" };
          } else if (st.includes("approve")) {
            stepStatuses[stepRole] = { days, status: "Approved" };
          } else {
            stepStatuses[stepRole] = { days, status: "In Progress" };
          }
        } else {
          const isCurrent =
            (item.step || "").toLowerCase().trim() === roleLower ||
            (sIdx === 0 && history.length === 0 && !itemStatus.includes("draft") && !itemStatus.includes("approve"));

          if (isCurrent) {
            const prevTs = sIdx === 0 ? (item.tanggal || item.created_at) : (history[sIdx - 1]?.timestamp || item.tanggal || item.created_at);
            const days = calculateDays(prevTs);
            stepStatuses[stepRole] = { days, status: "In Progress" };
          } else {
            stepStatuses[stepRole] = { days: "-", status: "Waiting" };
          }
        }
      });

      const isClosedAll =
        itemStatus.includes("approved") ||
        (Object.values(stepStatuses).length > 0 &&
          Object.values(stepStatuses).every((s) => (s.status || "").toLowerCase().includes("approved")));

      allItems.push({
        id: `np-${item.id}`,
        noDoc: item.no_doc || `NP-${item.id}`,
        isProduct: false,
        type: "Non-Product",
        description: `Pengajuan Non-Product: ${supplierDesc}`,
        category: (item as any).jenis_otorisasi_nama || "Non-Product",
        department: (item as any).departemen_nama || "Purchasing",
        creator: item.buyer_nama || "Buyer",
        amount: totalAmount,
        step: item.step || (isClosedAll ? "Approved" : "Pending Review"),
        status: item.status || "Pending Review",
        created_at: item.tanggal || item.created_at || "",
        stepStatuses,
        isClosedAll,
        history,
        rawItem: item,
      });
    });

    // 2. Product Items
    pList.forEach((item) => {
      const history: ApprovalHistoryOH[] = item.approval_history || [];
      const totalAmount = Number(item.final_price || item.normal_price || item.dana_bodr || 0);
      const itemStatus = (item.status || "Draft").toLowerCase();

      const stepStatuses: Record<string, { days: string; status: string }> = {};

      workflowStepNames.forEach((stepRole, sIdx) => {
        const roleLower = stepRole.toLowerCase().trim();
        const matchHist = history.find((h) => (h.role || "").toLowerCase().trim() === roleLower);

        if (matchHist) {
          const st = (matchHist.status || "").toLowerCase();
          const prevTs = sIdx === 0 ? (item.tanggal || item.date || item.created_at) : (history[sIdx - 1]?.timestamp || item.tanggal || item.date || item.created_at);
          const days = calculateDays(prevTs, matchHist.timestamp);

          if (st.includes("reject")) {
            stepStatuses[stepRole] = { days, status: "Rejected" };
          } else if (st.includes("revision") || st.includes("revise")) {
            stepStatuses[stepRole] = { days, status: "Revision" };
          } else if (st.includes("approve")) {
            stepStatuses[stepRole] = { days, status: "Approved" };
          } else {
            stepStatuses[stepRole] = { days, status: "In Progress" };
          }
        } else {
          const isCurrent =
            (item.step || "").toLowerCase().trim() === roleLower ||
            (sIdx === 0 && history.length === 0 && !itemStatus.includes("draft") && !itemStatus.includes("approve"));

          if (isCurrent) {
            const prevTs = sIdx === 0 ? (item.tanggal || item.date || item.created_at) : (history[sIdx - 1]?.timestamp || item.tanggal || item.date || item.created_at);
            const days = calculateDays(prevTs);
            stepStatuses[stepRole] = { days, status: "In Progress" };
          } else {
            stepStatuses[stepRole] = { days: "-", status: "Waiting" };
          }
        }
      });

      const isClosedAll =
        itemStatus.includes("approved") ||
        (Object.values(stepStatuses).length > 0 &&
          Object.values(stepStatuses).every((s) => (s.status || "").toLowerCase().includes("approved")));

      allItems.push({
        id: `p-${item.id}`,
        noDoc: item.no_doc || `PRD-${item.id}`,
        isProduct: true,
        type: "Product",
        description: `${item.product || "Barang Product"} ${item.part_number ? `(${item.part_number})` : ""}`,
        category: (item as any).jenis_otorisasi_nama || "Product",
        department: "Purchasing",
        creator: item.buyer || item.prepared_by || "Buyer",
        amount: totalAmount,
        step: item.step || (isClosedAll ? "Approved" : "Pending Review"),
        status: item.status || "Pending Review",
        created_at: item.tanggal || item.date || item.created_at || "",
        stepStatuses,
        isClosedAll,
        history,
        rawItem: item,
      });
    });

    // Sort descending by date
    allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return allItems;
  }, [npList, pList, workflowStepNames]);

  // ── Dynamic Tab Filtering ──────────────────────────────────────────────────
  const tabFiltered = useMemo(() => {
    return enrichedRows.filter((r) => {
      if (activeTab === "archive") {
        return r.isClosedAll;
      }
      if (r.isClosedAll) return false;

      if (activeTab === "all") return true;

      const st = r.stepStatuses?.[activeTab]?.status || "";
      return st === "In Progress" || st === "Revision";
    });
  }, [enrichedRows, activeTab]);

  // ── Search, Category & Status Filter ───────────────────────────────────────
  const filteredRows = useMemo(() => {
    return tabFiltered.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.noDoc.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.creator.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);

      const matchCategory =
        categoryFilter === "ALL" ||
        (categoryFilter === "NP" && !r.isProduct) ||
        (categoryFilter === "P" && r.isProduct);

      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Approved" && r.isClosedAll) ||
        (statusFilter === "Rejected" && r.status.toLowerCase().includes("reject")) ||
        (statusFilter === "Revision" && r.status.toLowerCase().includes("revis")) ||
        (statusFilter === "In Progress" && !r.isClosedAll && !r.status.toLowerCase().includes("reject"));

      return matchSearch && matchCategory && matchStatus;
    });
  }, [tabFiltered, search, categoryFilter, statusFilter]);

  // ── Tab Counts ─────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const activeCount = enrichedRows.filter((r) => !r.isClosedAll).length;
    const archiveCount = enrichedRows.filter((r) => r.isClosedAll).length;

    const stepCounts: Record<string, number> = {};
    workflowStepNames.forEach((s) => {
      stepCounts[s] = enrichedRows.filter((r) => {
        if (r.isClosedAll) return false;
        const st = r.stepStatuses?.[s]?.status || "";
        return st === "In Progress" || st === "Revision";
      }).length;
    });

    return { activeCount, archiveCount, stepCounts };
  }, [enrichedRows, workflowStepNames]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage, itemsPerPage]);

  const handleExport = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3500);
  };

  const totalCols = 7 + Math.max(1, workflowStepNames.length) * 2;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen ml-64 min-w-0 overflow-hidden">
        <Header title="PROGRESS OTORISASI HARGA" />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

          {/* Banner Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800 tracking-tight">Price Authorization Progress Monitoring</h2>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-semibold">
                      Price Approval Workflow
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Monitoring tahapan approval pengajuan otorisasi harga secara realtime berdasarkan workflow per jenis & departemen.
                  </p>
                </div>
              </div>

              {/* Controls: Search, Status Filter & Export */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari No Doc, Barang, Buyer..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 font-medium cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="NP">Non-Product</option>
                  <option value="P">Product</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 font-medium cursor-pointer"
                >
                  <option value="All">Semua Status</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Approved">Approved</option>
                  <option value="Revision">Revision</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200 text-xs">
                  {filteredRows.length} Otorisasi
                </span>

                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Excel
                </button>
              </div>
            </div>

            {/* Status Legend Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Legend:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> IN PROGRESS
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> APPROVED
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> REVISION
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> REJECTED
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> WAITING
              </span>
            </div>
          </div>

          {/* Stage Tabs (Semua Progres, Steps, Arsip) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setActiveTab("all");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Semua Progres
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                {counts.activeCount}
              </span>
            </button>

            {workflowStepNames.map((sName) => {
              const count = counts.stepCounts[sName] || 0;
              const isActive = activeTab === sName;
              return (
                <button
                  key={sName}
                  onClick={() => {
                    setActiveTab(sName);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {sName}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={() => {
                setActiveTab("archive");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "archive"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Arsip
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "archive" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                {counts.archiveCount}
              </span>
            </button>
          </div>

          {/* Matrix Progress Table Container (100% Sesuai Standar BODR Matrix) */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  PRICE APPROVAL STAGE & WORKFLOW PROGRESS
                </span>
                {workflowStepNames.length === 0 && (
                  <span className="text-[10px] text-amber-600 font-normal italic">
                    (Workflow approval belum diatur di Settings Admin)
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500">
                Menampilkan {paginatedRows.length} dari {filteredRows.length} pengajuan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left border-collapse">
                {/* 2-Level Multi-Header — 100% Dinamis per Step Workflow Tanpa Header Statis */}
                <thead>
                  {/* Top Header Grouping */}
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    <th colSpan={7} className="py-2.5 px-3 text-center border-r border-slate-200 bg-slate-100/70">
                      DETAILS
                    </th>
                    {workflowStepNames.length === 0 ? (
                      <th colSpan={2} className="py-2.5 px-2 text-center border-r border-slate-200 bg-blue-50/60 text-blue-900">
                        ALUR APPROVAL
                      </th>
                    ) : (
                      workflowStepNames.map((sName, sIdx) => {
                        const colorClass = STEP_HEADER_COLORS[sIdx % STEP_HEADER_COLORS.length];
                        return (
                          <th
                            key={sIdx}
                            colSpan={2}
                            className={`py-2.5 px-2 text-center border-r border-slate-200 ${colorClass}`}
                          >
                            {sName.toUpperCase()}
                          </th>
                        );
                      })
                    )}
                  </tr>

                  {/* Sub Header Columns */}
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[9px] font-bold text-slate-500 uppercase tracking-wider select-none">
                    <th className="py-2 px-2.5 w-10 text-center border-r border-slate-200">No</th>
                    <th className="py-2 px-2.5 w-28 border-r border-slate-200 whitespace-nowrap">No Dokumen</th>
                    <th className="py-2 px-3 min-w-[160px] border-r border-slate-200">Deskripsi Pengajuan</th>
                    <th className="py-2 px-3 w-20 text-center border-r border-slate-200 whitespace-nowrap">Kategori</th>
                    <th className="py-2 px-3 w-28 border-r border-slate-200 whitespace-nowrap">Departemen</th>
                    <th className="py-2 px-3 w-28 border-r border-slate-200 whitespace-nowrap">Buyer</th>
                    <th className="py-2 px-2.5 w-28 border-r border-slate-200 text-right whitespace-nowrap">Total Nominal</th>

                    {/* Dynamic Step Sub-columns: Actual (Days) & Status */}
                    {workflowStepNames.length === 0 ? (
                      <React.Fragment>
                        <th className="py-2 px-1.5 w-20 text-center border-r border-slate-200 whitespace-nowrap">Actual (Days)</th>
                        <th className="py-2 px-2 w-28 text-center border-r border-slate-200 whitespace-nowrap">Status</th>
                      </React.Fragment>
                    ) : (
                      workflowStepNames.map((_, sIdx) => (
                        <React.Fragment key={sIdx}>
                          <th className="py-2 px-1.5 w-20 text-center border-r border-slate-200 whitespace-nowrap">Actual (Days)</th>
                          <th className="py-2 px-2 w-28 text-center border-r border-slate-200 whitespace-nowrap">Status</th>
                        </React.Fragment>
                      ))
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={totalCols} className="py-12 text-center text-slate-500 font-bold">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Memuat data matrix progres otorisasi harga...
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={totalCols} className="py-12 text-center text-slate-400 italic">
                        Tidak ada pengajuan otorisasi harga yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, idx) => {
                      const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-2.5 text-center font-mono text-slate-500 border-r border-slate-100">
                            {globalIndex}
                          </td>
                          <td className="py-2.5 px-2.5 font-mono font-semibold text-blue-600 border-r border-slate-100 whitespace-nowrap">
                            {row.noDoc || "-"}
                          </td>
                          <td
                            onClick={() => setSelectedItem(row)}
                            className="py-2.5 px-3 font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer border-r border-slate-100 transition-colors"
                            title={`Klik untuk melihat detail riwayat approval "${row.description}"`}
                          >
                            {row.description}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              row.type === "Non-Product" ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100 whitespace-nowrap text-xs">
                            {row.department || "—"}
                          </td>
                          <td className="py-2.5 px-2.5 text-slate-600 border-r border-slate-100 whitespace-nowrap font-normal">
                            {row.creator || "—"}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-semibold font-mono text-slate-800 border-r border-slate-100 whitespace-nowrap">
                            {fmtRupiah(row.amount)}
                          </td>

                          {/* Dynamic Step Data Cells: Actual Days & Status Pill */}
                          {workflowStepNames.length === 0 ? (
                            <React.Fragment>
                              <td className="py-2.5 px-1.5 text-center font-mono text-slate-600 border-r border-slate-100 whitespace-nowrap">
                                -
                              </td>
                              <td className="py-2.5 px-2 text-center border-r border-slate-100 whitespace-nowrap">
                                <PriceProgressStatusPill status={row.status} />
                              </td>
                            </React.Fragment>
                          ) : (
                            workflowStepNames.map((sName) => {
                              const stepData = row.stepStatuses?.[sName] || { days: "-", status: "Waiting" };
                              return (
                                <React.Fragment key={sName}>
                                  <td className="py-2.5 px-1.5 text-center font-mono text-slate-600 border-r border-slate-100 whitespace-nowrap">
                                    {stepData.days || "-"}
                                  </td>
                                  <td className="py-2.5 px-2 text-center border-r border-slate-100 whitespace-nowrap">
                                    <PriceProgressStatusPill status={stepData.status} />
                                  </td>
                                </React.Fragment>
                              );
                            })
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>of {filteredRows.length} entries</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Export Toast */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-100 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in text-xs font-medium">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="font-bold">Export Excel Berhasil</p>
            <p className="text-slate-300 text-[11px]">Data progress otorisasi harga berhasil diunduh.</p>
          </div>
        </div>
      )}

      {/* Detail Timeline & Lead Time Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl p-6 text-slate-800 space-y-5 animate-scale-in">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-800 font-mono">{selectedItem.noDoc}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedItem.type === "Non-Product" ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  }`}>
                    {selectedItem.type}
                  </span>
                  <PriceProgressStatusPill status={selectedItem.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">{selectedItem.description}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Buyer</span>
                <span className="font-bold text-slate-800">{selectedItem.creator}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Departemen</span>
                <span className="font-bold text-slate-800">{selectedItem.department}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tanggal Pengajuan</span>
                <span className="font-bold text-slate-800">{selectedItem.created_at || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Nominal</span>
                <span className="font-bold text-blue-700 font-mono">{fmtRupiah(selectedItem.amount)}</span>
              </div>
            </div>

            {/* Stepper Timeline Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Alur Persetujuan & Riwayat Verifikasi</span>
              </h4>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {selectedItem.history.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-400 italic text-xs">
                    Belum ada riwayat approval yang tercatat. Dokumen sedang dalam antrian verifikasi awal.
                  </div>
                ) : (
                  selectedItem.history.map((h, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl space-y-1.5 shadow-2xs transition-all">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center">
                            {i + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-800 text-xs block leading-tight">
                              {h.name || "System"}
                            </span>
                            <span className="text-[9.5px] text-slate-500 font-medium block leading-tight">
                              {h.role || `Step ${i + 1}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9.5px] font-mono text-slate-400 whitespace-nowrap">
                            {h.timestamp || "—"}
                          </span>
                          <PriceProgressStatusPill status={h.status || "Approved"} />
                        </div>
                      </div>
                      {h.note && (
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] text-slate-700 italic font-normal">
                          &quot;{h.note}&quot;
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
