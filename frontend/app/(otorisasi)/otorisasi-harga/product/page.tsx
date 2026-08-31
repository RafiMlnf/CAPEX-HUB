"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import Sidebar from "../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../components/Header";
import { ApiOtorisasiHarga, api } from "../../../lib/api";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const statusBadge = (s: string) => {
  if (s === "Approved") return "bg-emerald-100 text-emerald-700 border border-emerald-300";
  if (s === "Rejected") return "bg-red-100 text-red-700 border border-red-300";
  if (s === "Revision Required") return "bg-orange-100 text-orange-700 border border-orange-300";
  return "bg-blue-100 text-blue-700 border border-blue-300";
};

export default function ProductPage() {
  const [items, setItems] = useState<ApiOtorisasiHarga[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    api.getOtorisasiHargaList()
      .then((data) => setItems(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleDelete = async (id: string, name: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus dokumen otorisasi product "${name}"?`,
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
        refresh();
      }
    });
  };

  const filtered = items.filter(i => {
    const s = search.toLowerCase();
    const matchSearch = (i.product || "").toLowerCase().includes(s) ||
      (i.part_number || "").toLowerCase().includes(s) ||
      (i.buyer || "").toLowerCase().includes(s) ||
      (i.id || "").toLowerCase().includes(s);
    const matchStatus = statusFilter === "ALL" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen ml-64 overflow-hidden">
        <Header title="Otorisasi Harga Product" subtitle="Daftar dokumen otorisasi harga untuk pengadaan barang produk" />
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Filters + Create */}
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Cari part number, produk, buyer..."
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-500 w-72 shadow-xs"
            />
            <select
              value={statusFilter}
              onChange={e=>setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-500 shadow-xs"
            >
              <option value="ALL">Semua Status</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="ml-auto">
              <Link
                href="/otorisasi-harga/product/create"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 text-sm shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                Buat Otorisasi Product
              </Link>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center text-slate-400 font-semibold text-xs">Memuat data dari database...</div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[9px] font-semibold tracking-wider">
                    <th className="py-3 px-4">Part / Product</th>
                    <th className="py-3 px-4">Jenis Source</th>
                    <th className="py-3 px-4">Buyer</th>
                    <th className="py-3 px-4 text-right">Dana BODR</th>
                    <th className="py-3 px-4 text-right">Final Price</th>
                    <th className="py-3 px-4">Tahapan Approval</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic font-normal">
                        Tidak ada dokumen otorisasi product ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="text-slate-900 text-xs font-semibold">{item.product || item.part_number || "Barang Product"}</p>
                          <p className="text-slate-400 font-mono text-[10px]">{item.part_number ? `PN: ${item.part_number}` : `DOC: ${item.id}`}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {item.jenis_otorisasi || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{item.buyer || "-"}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-900 font-semibold">{fmt(item.dana_bodr || 0)}</td>
                        <td className="py-3 px-4 text-right font-mono text-blue-600 font-semibold">
                          {item.final_price ? fmt(item.final_price) : "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{item.step || "SH PURH"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase border ${statusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleDelete(item.id, item.product || item.part_number || item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Hapus Dokumen"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
