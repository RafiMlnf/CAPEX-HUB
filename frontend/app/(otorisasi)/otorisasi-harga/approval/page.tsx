"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../components/Header";
import {
  User,
  ApiOtorisasiHargaNonProduct,
  ApiOtorisasiHarga,
  ApprovalHistoryOH,
  api,
  getCurrentUser,
} from "../../../lib/api";

const fmt = (n: number | string | undefined | null) => {
  const num = typeof n === "number" ? n : Number(n || 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
};

// Status Pill Component
function StatusPill({ status }: { status: string }) {
  const s = (status || "").toLowerCase();

  if (s.includes("approved") || s.includes("selesai")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Approved
      </span>
    );
  }
  if (s.includes("rejected") || s.includes("tolak")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
      Pending Review
    </span>
  );
}

export default function OtorisasiHargaApprovalPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // List States
  const [npItems, setNpItems] = useState<ApiOtorisasiHargaNonProduct[]>([]);
  const [pItems, setPItems] = useState<ApiOtorisasiHarga[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "NP" | "P">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selection states (for Detail / Verification Modal)
  const [selectedNP, setSelectedNP] = useState<ApiOtorisasiHargaNonProduct | null>(null);
  const [selectedP, setSelectedP] = useState<ApiOtorisasiHarga | null>(null);

  // Action states
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [dataNP, dataP, wfList] = await Promise.all([
        api.getOtorisasiHargaNPList().catch(() => []),
        api.getOtorisasiHargaList().catch(() => []),
        api.getApprovalPriceWorkflows().catch(() => []),
      ]);
      setNpItems(dataNP || []);
      setPItems(dataP || []);
      setWorkflows(wfList || []);
    } catch (err) {
      console.error("Failed to load otorisasi list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    refreshData();
  }, []);

  // Dynamic workflow roles from Database Settings
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
      if (entries.length > 0) return entries.map(([role]) => role);
    }

    const historyRoles = new Set<string>();
    [...npItems, ...pItems].forEach((item: any) => {
      (item.approval_history || []).forEach((h: any) => {
        if (h.role) historyRoles.add(h.role.trim());
      });
      if (item.step) historyRoles.add(item.step.trim());
    });
    return Array.from(historyRoles);
  }, [workflows, npItems, pItems]);

  // Map and unify all items from DB
  interface UnifiedApprovalItem {
    id: string;
    no_doc: string;
    no_pr: string;
    no_bodr: string;
    description: string;
    type: "Non-Product" | "Product";
    isProduct: boolean;
    buyer: string;
    amount: number;
    step: string;
    status: string;
    created_at: string;
    rawNP?: ApiOtorisasiHargaNonProduct;
    rawP?: ApiOtorisasiHarga;
  }

  const unifiedList: UnifiedApprovalItem[] = useMemo(() => {
    const list: UnifiedApprovalItem[] = [];

    // 1. Non-Product Items
    npItems.forEach((item) => {
      const recommendedSupplier = (item.suppliers || []).find((s) => s.recommended) || item.suppliers?.[0];
      const desc = recommendedSupplier?.vendor_nama
        ? `Pengadaan Supplier: ${recommendedSupplier.vendor_nama}`
        : `Pengajuan Non-Product #${item.id}`;
      const amount = Number(item.dana_bodr || recommendedSupplier?.total_final_price || recommendedSupplier?.harga || 0);

      list.push({
        id: `np-${item.id}`,
        no_doc: item.no_doc || `NP-${item.id}`,
        no_pr: item.no_pr || "—",
        no_bodr: item.no_bodr || "—",
        description: desc,
        type: "Non-Product",
        isProduct: false,
        buyer: item.buyer_nama || "Buyer",
        amount,
        step: item.step || "Step 1",
        status: item.status || "Pending Review",
        created_at: item.tanggal || item.created_at || "",
        rawNP: item,
      });
    });

    // 2. Product Items
    pItems.forEach((item) => {
      const desc = `${item.product || "Barang Product"} ${item.part_number ? `(${item.part_number})` : ""}`;
      const amount = Number(item.final_price || item.normal_price || item.dana_bodr || 0);

      list.push({
        id: `p-${item.id}`,
        no_doc: item.no_doc || `PRD-${item.id}`,
        no_pr: item.no_pr || "—",
        no_bodr: item.bodr_no || "—",
        description: desc,
        type: "Product",
        isProduct: true,
        buyer: item.buyer || item.prepared_by || "Buyer",
        amount,
        step: item.step || "Step 1",
        status: item.status || "Pending Review",
        created_at: item.tanggal || item.date || item.created_at || "",
        rawP: item,
      });
    });

    // Sort newest first
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [npItems, pItems]);

  // Filtered List based on Category, Status, and Search
  const filteredList = useMemo(() => {
    return unifiedList.filter((item) => {
      // Category filter
      if (categoryFilter === "NP" && item.isProduct) return false;
      if (categoryFilter === "P" && !item.isProduct) return false;

      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "Pending Review") {
          const st = item.status.toLowerCase();
          if (!st.includes("pending") && !st.includes("draft")) return false;
        } else if (statusFilter === "Approved") {
          if (!item.status.toLowerCase().includes("approved")) return false;
        } else if (statusFilter === "Rejected") {
          if (!item.status.toLowerCase().includes("reject")) return false;
        }
      }

      // Search text
      if (searchQuery.trim()) {
        const s = searchQuery.toLowerCase();
        const match =
          item.no_doc.toLowerCase().includes(s) ||
          item.no_pr.toLowerCase().includes(s) ||
          item.no_bodr.toLowerCase().includes(s) ||
          item.description.toLowerCase().includes(s) ||
          item.buyer.toLowerCase().includes(s);
        if (!match) return false;
      }

      return true;
    });
  }, [unifiedList, categoryFilter, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage]);

  // Handle Approve Action
  const handleApprove = async () => {
    setProcessing(true);
    try {
      if (selectedNP) {
        const steps = workflowStepNames.length > 0 ? workflowStepNames : [selectedNP.step || "Approver"];
        const currentStepIdx = steps.findIndex((s) => s.toLowerCase().trim() === (selectedNP.step || "").toLowerCase().trim());
        const isLast = currentStepIdx === -1 || currentStepIdx >= steps.length - 1;
        const nextStep = isLast ? selectedNP.step : steps[currentStepIdx + 1];
        const nextStatus = isLast ? "Approved" : "Pending Review";

        const newHistoryEntry: ApprovalHistoryOH = {
          role: selectedNP.step || "Approver",
          name: currentUser?.name || "Approver",
          status: "Approved",
          note: note || "Disetujui",
          timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " " + new Date().toLocaleTimeString("id-ID"),
        };

        const updated: ApiOtorisasiHargaNonProduct = {
          ...selectedNP,
          step: nextStep,
          status: nextStatus as any,
          approval_history: [...(selectedNP.approval_history || []), newHistoryEntry],
        };

        await api.updateOtorisasiHargaNP(selectedNP.id, updated);
        await refreshData();
        setSelectedNP(null);
        setNote("");
        setAlertMessage("Otorisasi Non-Product berhasil disetujui!");
      } else if (selectedP) {
        const stepVal = selectedP.step || "Step 1";
        const steps = workflowStepNames.length > 0 ? workflowStepNames : [stepVal];
        const currentStepIdx = steps.findIndex((s) => s.toLowerCase().trim() === stepVal.toLowerCase().trim());
        const isLast = currentStepIdx === -1 || currentStepIdx >= steps.length - 1;
        const nextStep = isLast ? stepVal : steps[currentStepIdx + 1];
        const nextStatus = isLast ? "Approved" : "Pending Review";

        const newHistoryEntry: ApprovalHistoryOH = {
          role: stepVal,
          name: currentUser?.name || "Approver",
          status: "Approved",
          note: note || "Disetujui",
          timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " " + new Date().toLocaleTimeString("id-ID"),
        };

        const updated: ApiOtorisasiHarga = {
          ...selectedP,
          step: nextStep,
          status: nextStatus as any,
          approval_history: [...(selectedP.approval_history || []), newHistoryEntry],
        };

        await api.updateOtorisasiHarga(selectedP.id, updated);
        await refreshData();
        setSelectedP(null);
        setNote("");
        setAlertMessage("Otorisasi Product berhasil disetujui!");
      }
    } catch (e) {
      console.error("Failed to approve:", e);
    } finally {
      setProcessing(false);
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  // Handle Reject Action
  const handleReject = async () => {
    setProcessing(true);
    try {
      if (selectedNP) {
        const newHistoryEntry: ApprovalHistoryOH = {
          role: selectedNP.step || "Approver",
          name: currentUser?.name || "Approver",
          status: "Rejected",
          note: note || "Ditolak",
          timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " " + new Date().toLocaleTimeString("id-ID"),
        };

        const updated: ApiOtorisasiHargaNonProduct = {
          ...selectedNP,
          status: "Rejected",
          approval_history: [...(selectedNP.approval_history || []), newHistoryEntry],
        };

        await api.updateOtorisasiHargaNP(selectedNP.id, updated);
        await refreshData();
        setSelectedNP(null);
        setNote("");
        setAlertMessage("Otorisasi Non-Product ditolak!");
      } else if (selectedP) {
        const stepVal = selectedP.step || "Step 1";
        const newHistoryEntry: ApprovalHistoryOH = {
          role: stepVal,
          name: currentUser?.name || "Approver",
          status: "Rejected",
          note: note || "Ditolak",
          timestamp: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " " + new Date().toLocaleTimeString("id-ID"),
        };

        const updated: ApiOtorisasiHarga = {
          ...selectedP,
          status: "Rejected",
          approval_history: [...(selectedP.approval_history || []), newHistoryEntry],
        };

        await api.updateOtorisasiHarga(selectedP.id, updated);
        await refreshData();
        setSelectedP(null);
        setNote("");
        setAlertMessage("Otorisasi Product ditolak!");
      }
    } catch (e) {
      console.error("Failed to reject:", e);
    } finally {
      setProcessing(false);
      setTimeout(() => setAlertMessage(null), 4000);
    }
  };

  const getCheapestNPIndex = (item: ApiOtorisasiHargaNonProduct) => {
    let cheapestIdx = -1;
    let minPrice = Infinity;
    item.suppliers?.forEach((s, idx) => {
      const price = s.total_final_price ?? s.harga ?? 0;
      if (price < minPrice && price > 0) {
        minPrice = price;
        cheapestIdx = idx;
      }
    });
    return cheapestIdx;
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen ml-64 min-w-0 overflow-hidden">
        <Header
          title="Approval Harga"
          subtitle="Pusat otorisasi dan verifikasi persetujuan perbandingan harga supplier & diskon penjualan"
        />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Toast Alert */}
          {alertMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-fade-in text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {alertMessage}
              </div>
              <button onClick={() => setAlertMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>
          )}

          {/* Banner Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800 tracking-tight">Price Authorization Approval</h2>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-semibold">
                      Approval Queue
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Verifikasi dan persetujuan bertingkat perbandingan harga supplier & diskon penjualan secara realtime.
                  </p>
                </div>
              </div>

              {/* Controls: Search, Category, Status & Refresh */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari No Doc, PR, BODR, Buyer..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Category Filter Dropdown */}
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="NP">Otorisasi Non-Product</option>
                  <option value="P">Otorisasi Product</option>
                </select>

                {/* Status Filter Dropdown (Menggantikan Semua Role) */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <span className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200 text-xs">
                  {filteredList.length} Dokumen
                </span>

                <button
                  onClick={refreshData}
                  className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                  title="Segarkan data"
                >
                  <svg className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Unified Modern Table Representation (Tanpa Kolom Tahap Approval) */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                DAFTAR PENGAJUAN OTORISASI HARGA
              </span>
              <span className="text-[11px] text-slate-500">
                Menampilkan {paginatedList.length} dari {filteredList.length} pengajuan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-36">No Dokumen</th>
                    <th className="py-3 px-4 w-40 text-center">No. PR / No. BODR</th>
                    <th className="py-3 px-4 min-w-[180px]">Deskripsi Pengajuan</th>
                    <th className="py-3 px-4 w-28 text-center">Kategori</th>
                    <th className="py-3 px-4 w-36">Buyer</th>
                    <th className="py-3 px-4 w-36 text-right">Dana BODR / Total</th>
                    <th className="py-3 px-4 w-32 text-center">Status</th>
                    <th className="py-3 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-500 font-bold">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Memuat data pengajuan approval harga...
                      </td>
                    </tr>
                  ) : paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400 italic">
                        Tidak ada pengajuan otorisasi harga yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((item, idx) => {
                      const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                            {globalIndex}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                            {item.no_doc}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                            <div className="text-[10px] text-slate-500">PR: {item.no_pr}</div>
                            <div className="text-[10px] text-blue-700 font-bold">BODR: {item.no_bodr}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{item.description}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{item.created_at || "—"}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.type === "Non-Product"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              }`}
                            >
                              {item.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {item.buyer}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {fmt(item.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <StatusPill status={item.status} />
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (item.rawNP) {
                                  setSelectedNP(item.rawNP);
                                  setSelectedP(null);
                                } else if (item.rawP) {
                                  setSelectedP(item.rawP);
                                  setSelectedNP(null);
                                }
                                setNote("");
                                setProcessing(false);
                              }}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
                            >
                              {item.status.toLowerCase().includes("approved") ? "Detail" : "Verifikasi"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-600">
                Halaman {currentPage} dari {totalPages} ({filteredList.length} total pengajuan)
              </span>

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

      {/* ── Modal Verifikasi Non-Product (Comparison of Vendors) ──────────── */}
      {selectedNP && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-slate-200 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl p-6 text-slate-800 space-y-5 overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-800 font-mono">{selectedNP.no_doc}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Otorisasi Non-Product
                  </span>
                  <StatusPill status={selectedNP.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Verifikasi dan komparasi penawaran harga supplier non-product
                </p>
              </div>
              <button
                onClick={() => setSelectedNP(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Buyer (Pengaju)</span>
                <span className="font-bold text-slate-800">{selectedNP.buyer_nama}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">No PR / BODR</span>
                <span className="font-bold text-slate-800 font-mono">PR: {selectedNP.no_pr || "—"} / {selectedNP.no_bodr || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tanggal</span>
                <span className="font-bold text-slate-800">{selectedNP.tanggal || selectedNP.created_at || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Dana BODR</span>
                <span className="font-bold text-blue-700 font-mono">{fmt(selectedNP.dana_bodr)}</span>
              </div>
            </div>

            {/* Comparison of Suppliers Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Komparasi Penawaran Vendor Supplier
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-2.5 px-3">Nama Vendor</th>
                      <th className="py-2.5 px-3 text-right">Target Price</th>
                      <th className="py-2.5 px-3 text-right">Price Quotation</th>
                      <th className="py-2.5 px-3 text-right">Final Price</th>
                      <th className="py-2.5 px-3 text-center">Status Pilihan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedNP.suppliers || []).map((s, sIdx) => {
                      const isCheapest = sIdx === getCheapestNPIndex(selectedNP);
                      const isRecommended = s.recommended;
                      return (
                        <tr
                          key={sIdx}
                          className={isRecommended ? "bg-blue-50/50 font-semibold" : "hover:bg-slate-50"}
                        >
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800">{s.vendor_nama}</div>
                            {isCheapest && (
                              <span className="text-[9px] text-emerald-600 font-bold">★ Harga Terendah</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {fmt(s.items?.[0]?.target_price || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {fmt(s.items?.[0]?.price_quot || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {fmt(s.total_final_price || s.harga || 0)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isRecommended ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                                Direkomendasikan
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Pembanding</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approval Stepper History */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Riwayat Persetujuan Bertingkat</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(selectedNP.approval_history || []).length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 italic text-xs">
                    Belum ada riwayat approval tercatat.
                  </div>
                ) : (
                  (selectedNP.approval_history || []).map((h, hIdx) => {
                    const s = (h.status || "").toLowerCase();
                    const isAppr = s.includes("approved");
                    const isRej = s.includes("rejected");
                    const isRev = s.includes("revision") || s.includes("revise");

                    return (
                      <div key={hIdx} className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl space-y-1.5 shadow-2xs transition-all">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center">
                              {hIdx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-slate-800 text-xs block leading-tight">
                                {h.name || "Approver"}
                              </span>
                              <span className="text-[9.5px] text-slate-500 font-medium block leading-tight">
                                {h.role || `Step ${hIdx + 1}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9.5px] font-mono text-slate-400 whitespace-nowrap">
                              {h.timestamp || "—"}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                isAppr
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : isRej
                                  ? "bg-red-50 text-red-700 border-red-300"
                                  : isRev
                                  ? "bg-amber-50 text-amber-700 border-amber-300"
                                  : "bg-blue-50 text-blue-700 border-blue-300"
                              }`}
                            >
                              {h.status}
                            </span>
                          </div>
                        </div>
                        {h.note && (
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] text-slate-700 italic font-normal">
                            &quot;{h.note}&quot;
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Note Input */}
            {selectedNP.status !== "Approved" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                  Catatan / Komentar Verifikasi (Opsional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tuliskan alasan persetujuan atau catatan revisi..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedNP(null)}
                disabled={processing}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Tutup
              </button>
              {selectedNP.status !== "Approved" && (
                <>
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {processing ? "Memproses..." : "Tolak Pengajuan"}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {processing ? "Memproses..." : "Setujui Pengajuan"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Verifikasi Product ────────────────────────────────────── */}
      {selectedP && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-slate-200 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl p-6 text-slate-800 space-y-5 overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-800 font-mono">{selectedP.no_doc || `PRD-${selectedP.id}`}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Otorisasi Product
                  </span>
                  <StatusPill status={selectedP.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {selectedP.product || "Barang Product"} {selectedP.part_number ? `(${selectedP.part_number})` : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedP(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Buyer</span>
                <span className="font-bold text-slate-800">{selectedP.buyer || selectedP.prepared_by || "Buyer"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer / Vendor</span>
                <span className="font-bold text-slate-800">{selectedP.customer || selectedP.vendor || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tanggal</span>
                <span className="font-bold text-slate-800">{selectedP.tanggal || selectedP.date || selectedP.created_at || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Harga Final</span>
                <span className="font-bold text-blue-700 font-mono">{fmt(selectedP.final_price || selectedP.normal_price)}</span>
              </div>
            </div>

            {/* Approval Stepper History */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Riwayat Persetujuan Bertingkat</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(selectedP.approval_history || []).length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 italic text-xs">
                    Belum ada riwayat approval tercatat.
                  </div>
                ) : (
                  (selectedP.approval_history || []).map((h, hIdx) => {
                    const s = (h.status || "").toLowerCase();
                    const isAppr = s.includes("approved");
                    const isRej = s.includes("rejected");
                    const isRev = s.includes("revision") || s.includes("revise");

                    return (
                      <div key={hIdx} className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl space-y-1.5 shadow-2xs transition-all">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center">
                              {hIdx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-slate-800 text-xs block leading-tight">
                                {h.name || "Approver"}
                              </span>
                              <span className="text-[9.5px] text-slate-500 font-medium block leading-tight">
                                {h.role || `Step ${hIdx + 1}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9.5px] font-mono text-slate-400 whitespace-nowrap">
                              {h.timestamp || "—"}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                isAppr
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : isRej
                                  ? "bg-red-50 text-red-700 border-red-300"
                                  : isRev
                                  ? "bg-amber-50 text-amber-700 border-amber-300"
                                  : "bg-blue-50 text-blue-700 border-blue-300"
                              }`}
                            >
                              {h.status}
                            </span>
                          </div>
                        </div>
                        {h.note && (
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] text-slate-700 italic font-normal">
                            &quot;{h.note}&quot;
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Note Input */}
            {selectedP.status !== "Approved" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                  Catatan / Komentar Verifikasi (Opsional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tuliskan alasan persetujuan atau catatan revisi..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedP(null)}
                disabled={processing}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Tutup
              </button>
              {selectedP.status !== "Approved" && (
                <>
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {processing ? "Memproses..." : "Tolak Pengajuan"}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    {processing ? "Memproses..." : "Setujui Pengajuan"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
