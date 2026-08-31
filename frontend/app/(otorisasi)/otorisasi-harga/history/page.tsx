"use client";

import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../components/Header";
import { api, ApiOtorisasiHargaNonProduct, ApiOtorisasiHarga } from "../../../lib/api";
import { useCapex } from "../../../context/CapexContext";

const fmtRupiah = (val: number | string | undefined | null) => {
  const num = typeof val === "number" ? val : Number(val || 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
};

const fmtDate = (ts: string | undefined | null) => {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface UnifiedPriceItem {
  id: string;
  isProduct: boolean;
  no_doc: string;
  no_pr: string;
  no_bodr: string;
  dana_bodr: number;
  tanggal: string;
  buyer: string;
  status: string;
  product_name?: string;
  customer?: string;
  final_price?: number;
  suppliers?: any[];
  approval_history?: any[];
  rawItem: any;
}

export default function OtorisasiHargaHistoryPage() {
  const { currentUser, hasPermission } = useCapex();
  const [items, setItems] = useState<UnifiedPriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState<"All" | "non_product" | "product">("All");
  const [viewingItem, setViewingItem] = useState<UnifiedPriceItem | null>(null);

  const isAdmin =
    (currentUser?.role || "").toLowerCase() === "admin" ||
    (currentUser?.username || "").toLowerCase() === "admin";

  const isAllAccess =
    hasPermission("perm_approve_price") ||
    hasPermission("perm_view_reports") ||
    hasPermission("ALL_ACCESS") ||
    isAdmin;

  const fetchApprovedPriceData = () => {
    setLoading(true);
    Promise.all([
      api.getOtorisasiHargaNPList(),
      api.getOtorisasiHargaList(),
    ])
      .then(([npList, pList]) => {
        const unified: UnifiedPriceItem[] = [];

        // 1. Non-Product approved
        (npList || [])
          .filter((i: any) => (i.status || "").toLowerCase() === "approved")
          .forEach((i: ApiOtorisasiHargaNonProduct) => {
            unified.push({
              id: i.id,
              isProduct: false,
              no_doc: i.no_doc || "—",
              no_pr: i.no_pr || "—",
              no_bodr: i.no_bodr || "—",
              dana_bodr: i.dana_bodr || 0,
              tanggal: i.tanggal || i.created_at,
              buyer: i.buyer_nama || "—",
              status: i.status || "Approved",
              suppliers: i.suppliers || [],
              approval_history: i.approval_history || [],
              rawItem: i,
            });
          });

        // 2. Product approved
        (pList || [])
          .filter((i: any) => (i.status || "").toLowerCase() === "approved")
          .forEach((i: ApiOtorisasiHarga) => {
            unified.push({
              id: i.id,
              isProduct: true,
              no_doc: i.no_doc || `PRD-${i.id}`,
              no_pr: i.no_pr || "—",
              no_bodr: i.bodr_no || "—",
              dana_bodr: i.dana_bodr || 0,
              tanggal: i.tanggal || i.date || i.created_at,
              buyer: i.buyer || i.prepared_by || "—",
              status: i.status || "Approved",
              product_name: i.product,
              customer: i.customer,
              final_price: i.final_price || i.normal_price || 0,
              approval_history: i.approval_history || [],
              rawItem: i,
            });
          });

        // Sort descending by date
        unified.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
        setItems(unified);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApprovedPriceData();
  }, []);

  // Filter items according to user login & role permissions dynamically & realtime
  const visibleItems = useMemo(() => {
    if (isAllAccess) return items;
    if (!currentUser) return items;

    const userDept = (currentUser.department || "").toLowerCase().trim();
    const userName = (currentUser.name || "").toLowerCase().trim();
    const userNpk = (currentUser.npk || "").toLowerCase().trim();
    const username = (currentUser.username || "").toLowerCase().trim();

    return items.filter((item) => {
      const itemBuyer = (item.buyer || "").toLowerCase().trim();

      // Check if user is in Purchasing/Commercial department OR is the buyer/preparer
      const isPurchasingOrCommercial = userDept.includes("purchasing") || userDept.includes("commercial") || userDept.includes("procurement");
      const isSameUser =
        (userName && (itemBuyer === userName || itemBuyer.includes(userName))) ||
        (username && itemBuyer === username) ||
        (userNpk && itemBuyer === userNpk);

      return isPurchasingOrCommercial || isSameUser;
    });
  }, [items, isAllAccess, currentUser]);

  const filtered = useMemo(() => {
    return visibleItems.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.no_doc.toLowerCase().includes(q) ||
        item.no_pr.toLowerCase().includes(q) ||
        item.no_bodr.toLowerCase().includes(q) ||
        item.buyer.toLowerCase().includes(q) ||
        (item.product_name || "").toLowerCase().includes(q) ||
        (item.customer || "").toLowerCase().includes(q);

      const matchJenis =
        filterJenis === "All" ||
        (filterJenis === "product" && item.isProduct) ||
        (filterJenis === "non_product" && !item.isProduct);

      return matchSearch && matchJenis;
    });
  }, [visibleItems, search, filterJenis]);

  const handleDelete = async (item: UnifiedPriceItem) => {
    const result = await Swal.fire({
      title: "Hapus Riwayat Price Approval?",
      text: `Apakah Anda yakin ingin menghapus data dokumen "${item.no_doc}"? Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        if (item.isProduct) {
          await api.deleteOtorisasiHarga(item.id);
        } else {
          await api.deleteOtorisasiHargaNP(item.id);
        }

        Swal.fire({
          title: "Terhapus!",
          text: "Data riwayat Otorisasi Harga berhasil dihapus.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchApprovedPriceData();
      } catch (err: any) {
        Swal.fire({
          title: "Gagal Menghapus",
          text: err.message || "Terjadi kesalahan saat menghapus data.",
          icon: "error",
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-64">
        <Header
          title="Price Approval History"
          subtitle="Daftar seluruh pengajuan Otorisasi Harga yang telah disetujui (Approved)"
        />

        <main className="flex-1 p-6 space-y-5">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari No. Dokumen, No. PR, BODR, Buyer, Produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {(["All", "non_product", "product"] as const).map((j) => (
                <button
                  key={j}
                  onClick={() => setFilterJenis(j)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer ${
                    filterJenis === j
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  {j === "All" ? "Semua Kategori" : j === "non_product" ? "Non-Product" : "Product"}
                </button>
              ))}
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Data Otorisasi Harga Disetujui (Approved)
                <span className="ml-2 text-xs text-slate-400 font-normal">({filtered.length} data)</span>
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium">Belum ada data Otorisasi Harga yang disetujui</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80">
                      <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider w-12">No</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Tanggal Disetujui</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">No. Dokumen</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">No. PR / Reference</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Jenis</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Buyer</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Dana BODR / Nilai</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-center px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((item, idx) => (
                      <tr key={`${item.isProduct ? "p" : "np"}-${item.id}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 text-slate-400 font-mono text-center">{idx + 1}</td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{fmtDate(item.tanggal)}</td>
                        <td className="px-4 py-3.5 font-mono font-semibold text-blue-700 whitespace-nowrap">
                          {item.no_doc}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700">
                          {item.no_pr !== "—" ? item.no_pr : item.customer || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.isProduct ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"
                          }`}>
                            {item.isProduct ? "Product" : "Non-Product"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium">{item.buyer}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-emerald-700">
                          {item.dana_bodr ? fmtRupiah(item.dana_bodr) : item.final_price ? fmtRupiah(item.final_price) : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                            Approved
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewingItem(item)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Detail Otorisasi"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Otorisasi"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal View Details */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div
            className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                  {viewingItem.no_doc}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  viewingItem.isProduct ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"
                }`}>
                  {viewingItem.isProduct ? "Product" : "Non-Product"}
                </span>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-emerald-800">Status: Disetujui (Approved)</span>
                </div>
                <span className="text-emerald-700 font-mono font-semibold">
                  Tanggal: {fmtDate(viewingItem.tanggal)}
                </span>
              </div>

              {/* Document Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">No. Purchase Request (PR)</span>
                  <p className="font-mono font-semibold text-slate-800 mt-0.5">{viewingItem.no_pr}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">No. Referensi BODR</span>
                  <p className="font-mono font-semibold text-blue-700 mt-0.5">{viewingItem.no_bodr}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Buyer / PIC</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingItem.buyer}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Dana Anggaran BODR</span>
                  <p className="font-mono font-bold text-emerald-700 mt-0.5">{fmtRupiah(viewingItem.dana_bodr)}</p>
                </div>
              </div>

              {/* Non-Product Suppliers Comparison Table */}
              {!viewingItem.isProduct && Array.isArray(viewingItem.suppliers) && viewingItem.suppliers.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Perbandingan Penawaran Vendor / Supplier</span>
                  <div className="space-y-3">
                    {viewingItem.suppliers.map((sup: any, sIdx: number) => (
                      <div key={sIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-xs">{sup.vendor_nama || `Vendor #${sIdx + 1}`}</span>
                            {sup.is_cheapest && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                                Rekomendasi Terpilih
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-emerald-700">
                            Total: {fmtRupiah(sup.total_final_price || sup.harga)}
                          </span>
                        </div>

                        {/* Part Items Breakdown */}
                        {Array.isArray(sup.items) && sup.items.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr className="text-slate-500 border-b border-slate-200">
                                  <th className="text-left py-1.5 font-medium">Part Number / Item</th>
                                  <th className="text-center py-1.5 font-medium">Qty</th>
                                  <th className="text-right py-1.5 font-medium">Price Quotation</th>
                                  <th className="text-right py-1.5 font-medium">Target Price</th>
                                  <th className="text-right py-1.5 font-medium">Final Price</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/60">
                                {sup.items.map((it: any, itIdx: number) => (
                                  <tr key={itIdx}>
                                    <td className="py-1.5 text-slate-700">
                                      <p className="font-mono font-semibold">{it.part_number}</p>
                                      <p className="text-[10px] text-slate-500">{it.part_name}</p>
                                    </td>
                                    <td className="py-1.5 text-center font-mono">{it.qty} {it.satuan || "pcs"}</td>
                                    <td className="py-1.5 text-right font-mono text-slate-600">{fmtRupiah(it.price_quot || it.price_quote)}</td>
                                    <td className="py-1.5 text-right font-mono text-slate-600">{fmtRupiah(it.target_price)}</td>
                                    <td className="py-1.5 text-right font-mono font-semibold text-emerald-700">{fmtRupiah(it.final_price)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Pricing Details */}
              {viewingItem.isProduct && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Nama Produk</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{viewingItem.product_name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Customer</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{viewingItem.customer || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Final Price</span>
                    <p className="font-mono font-bold text-emerald-700 mt-0.5">{fmtRupiah(viewingItem.final_price)}</p>
                  </div>
                </div>
              )}

              {/* Approval History */}
              {Array.isArray(viewingItem.approval_history) && viewingItem.approval_history.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Riwayat Persetujuan Approval</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
                    {viewingItem.approval_history.map((h: any, i: number) => (
                      <div key={i} className="p-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{h.name || h.approver}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                              {h.role}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-100 text-emerald-700">
                              {h.status}
                            </span>
                          </div>
                          {h.note && <p className="text-slate-600 mt-1 italic">&quot;{h.note}&quot;</p>}
                        </div>
                        <span className="text-slate-400 font-mono whitespace-nowrap">{fmtDate(h.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
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
