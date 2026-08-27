"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../components/Header";
import { ApiOtorisasiHargaNonProduct, ApiOtorisasiHarga, ApprovalHistoryOH, api } from "../../../lib/api";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const STEPS_NP = [
  "SH PURH",
  "DH PURH",
  "User DH",
  "User Div Head",
  "Admin Div Head",
  "Direktur",
  "Presiden Direktur",
];

const STEPS_P = [
  "SH PURH",
  "DH PURH",
  "Admin Div Head",
  "Direktur",
  "Presiden Direktur",
];

const getFullStepName = (step: string): string => {
  const mapping: Record<string, string> = {
    "SH PURH": "Section Head Purchasing",
    "DH PURH": "Department Head Purchasing",
    "User DH": "User Dept Head",
    "User Div Head": "User Div Head",
    "Admin Div Head": "Admin Division Head",
    "Direktur": "Direktur",
    "Presiden Direktur": "Presiden Direktur",
  };
  return mapping[step] || step;
};

const statusBadge = (s: string) => {
  const st = (s || "").toLowerCase();
  if (st.includes("approved") || st === "completed") return "bg-emerald-50 text-emerald-700 border border-emerald-300";
  if (st.includes("rejected")) return "bg-red-50 text-red-700 border border-red-300";
  if (st.includes("revision") || st.includes("revise")) return "bg-orange-50 text-orange-700 border border-orange-300";
  return "bg-blue-50 text-blue-700 border border-blue-300";
};

export default function OtorisasiProgressPage() {
  const [npList, setNpList] = useState<ApiOtorisasiHargaNonProduct[]>([]);
  const [pList, setPList] = useState<ApiOtorisasiHarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "NP" | "P">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "In Progress" | "Approved" | "Rejected">("ALL");
  const [selectedItemHistory, setSelectedItemHistory] = useState<{
    noDokumen: string;
    description: string;
    history: ApprovalHistoryOH[];
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resNP, resP] = await Promise.all([
        api.getOtorisasiHargaNPList().catch(() => []),
        api.getOtorisasiHargaList().catch(() => []),
      ]);
      setNpList(resNP || []);
      setPList(resP || []);
    } catch (err) {
      console.error("Failed to fetch otorisasi progress:", err);
    } finally {
      setLoading(false);
    }
  };

  // Unify item representation for progress tracking
  const unifiedItems = [
    ...npList.map((item) => {
      const history: ApprovalHistoryOH[] = item.approval_history || [];
      const recommendedSupplier = (item.suppliers || []).find((s) => s.recommended) || item.suppliers?.[0];
      const supplierDesc = recommendedSupplier?.vendor_nama || "Supplier";
      const totalAmount = Number(item.dana_bodr || recommendedSupplier?.total_final_price || recommendedSupplier?.harga || 0);
      const activeStep = item.status === "Approved" ? "Completed" : (item.step || STEPS_NP[0]);

      return {
        id: item.id,
        noDokumen: item.no_doc || `NP-${item.id}`,
        type: "Non-Product" as const,
        description: `Pengajuan Non-Product: ${supplierDesc}`,
        creator: item.buyer_nama || "Buyer",
        department: "Purchasing",
        totalAmount,
        status: item.status || "Draft",
        activeStep,
        steps: STEPS_NP,
        history,
        createdAt: item.tanggal || item.created_at || "",
      };
    }),
    ...pList.map((item) => {
      const history: ApprovalHistoryOH[] = item.approval_history || [];
      const totalAmount = Number(item.final_price || item.normal_price || item.dana_bodr || 0);
      const activeStep = item.status === "Approved" ? "Completed" : (item.step || STEPS_P[0]);

      return {
        id: item.id,
        noDokumen: item.no_doc || `P-${item.id}`,
        type: "Product" as const,
        description: `${item.product || "Product"} ${item.part_number ? `(${item.part_number})` : ""}`,
        creator: item.buyer || item.prepared_by || "Buyer",
        department: "Purchasing",
        totalAmount,
        status: item.status || "Draft",
        activeStep,
        steps: STEPS_P,
        history,
        createdAt: item.tanggal || item.date || item.created_at || "",
      };
    }),
  ];

  const filteredItems = unifiedItems.filter((item) => {
    const matchSearch =
      item.noDokumen.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.creator.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      categoryFilter === "ALL" ||
      (categoryFilter === "NP" && item.type === "Non-Product") ||
      (categoryFilter === "P" && item.type === "Product");

    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "Approved" && item.status === "Approved") ||
      (statusFilter === "Rejected" && item.status === "Rejected") ||
      (statusFilter === "In Progress" && item.status !== "Approved" && item.status !== "Rejected");

    return matchSearch && matchCategory && matchStatus;
  });

  const totalCount = unifiedItems.length;

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pl-64">
        <Header title="PROGRESS OTORISASI HARGA" />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

          {/* Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Cari no. dokumen, barang, pemohon..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Category Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">Kategori:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="ALL">Semua Kategori ({totalCount})</option>
                    <option value="NP">Non-Product ({npList.length})</option>
                    <option value="P">Product ({pList.length})</option>
                  </select>
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 font-medium cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="In Progress">Dalam Proses</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Tracking Table */}
            <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center border-r border-slate-200">No</th>
                    <th className="py-3 px-4 w-44 border-r border-slate-200">No Dokumen</th>
                    <th className="py-3 px-4 w-32 text-center border-r border-slate-200">Kategori</th>
                    <th className="py-3 px-4 border-r border-slate-200">Deskripsi Pengajuan</th>
                    <th className="py-3 px-4 w-36 text-right border-r border-slate-200">Total Nominal</th>
                    <th className="py-3 px-4 w-44 text-center border-r border-slate-200">Workflow Step</th>
                    <th className="py-3 px-4 w-28 text-center border-r border-slate-200">Status</th>
                    <th className="py-3 px-4 w-24 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-normal">
                        Memuat data progress otorisasi harga...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-normal italic">
                        Tidak ada dokumen otorisasi harga yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 text-center border-r border-slate-150 font-medium text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-3.5 px-4 border-r border-slate-150 font-mono font-semibold text-blue-600">
                            {item.noDokumen}
                          </td>
                          <td className="py-3.5 px-4 border-r border-slate-150 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.type === "Non-Product" ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 border-r border-slate-150 font-medium text-slate-800">
                            <div className="font-semibold text-slate-800">{item.description}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{item.creator} • {item.department}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right border-r border-slate-150 font-semibold font-mono text-slate-900">
                            {fmt(item.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-center border-r border-slate-150 font-medium text-slate-600">
                            {item.status === "Approved" ? "Selesai (Approved)" : getFullStepName(item.activeStep)}
                          </td>
                          <td className="py-3.5 px-4 text-center border-r border-slate-150">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${statusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setSelectedItemHistory({
                                noDokumen: item.noDokumen,
                                description: item.description,
                                history: item.history,
                              })}
                              className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg text-[10px] font-semibold border border-slate-200 hover:border-blue-300 cursor-pointer transition-all uppercase tracking-wider"
                              title="Lihat riwayat approval"
                            >
                              Riwayat
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* History Detail Modal */}
      {selectedItemHistory && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-800">
                  Riwayat Approval: {selectedItemHistory.noDokumen}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{selectedItemHistory.description}</p>
              </div>
              <button
                onClick={() => setSelectedItemHistory(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {selectedItemHistory.history.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">Belum ada riwayat approval yang tercatat.</p>
              ) : (
                selectedItemHistory.history.map((h, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800">{h.role || `Step ${i + 1}`}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge(h.status || "Approved")}`}>
                        {h.status || "Approved"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Oleh: <span className="font-medium text-slate-700">{h.name || "System"}</span> • {h.timestamp || "-"}
                    </div>
                    {h.note && (
                      <p className="mt-1 p-2 bg-white border border-slate-200 rounded text-slate-700 italic text-[11px]">
                        &quot;{h.note}&quot;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedItemHistory(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
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
