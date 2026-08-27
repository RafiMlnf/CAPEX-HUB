"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarOtorisasi";
import Header from "../../components/Header";
import { ApiOtorisasiHargaNonProduct, ApiOtorisasiHarga, api } from "../../lib/api";

import { useCapex } from "../../context/CapexContext";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const getFullStepName = (step: string): string => {
  const mapping: Record<string, string> = {
    "SH PURH": "Section Head Purchasing",
    "DH PURH": "Department Head Purchasing",
    "DH Purch": "Department Head Purchasing",
    "User DH": "User Dept Head",
    "User Div Head": "User Div Head",
    "Div Head": "User Div Head",
    "Admin Div Head": "Admin Division Head",
    "Direktur": "Direktur",
    "Presiden Direktur": "Presiden Direktur"
  };
  return mapping[step] || step;
};

const statusBadge = (s: string) => {
  if (s === "Approved") return "bg-emerald-50 text-emerald-700 border border-emerald-300";
  if (s === "Rejected") return "bg-red-50 text-red-700 border border-red-300";
  if (s === "Revision Required") return "bg-orange-50 text-orange-700 border border-orange-300";
  return "bg-blue-50 text-blue-700 border border-blue-300";
};

export default function OtorisasiHargaDashboard() {
  const { hasPermission } = useCapex();
  const [npList, setNpList] = useState<ApiOtorisasiHargaNonProduct[]>([]);
  const [pList, setPList] = useState<ApiOtorisasiHarga[]>([]);
  
  // Tab & search states for document list
  const [listTab, setListTab] = useState<"non-product" | "product">("non-product");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected item modal states (for read-only popup on dashboard)
  const [selectedP, setSelectedP] = useState<ApiOtorisasiHarga | null>(null);

  const canViewDashboard = hasPermission("perm_view_dashboard");

  const refreshData = () => {
    if (!canViewDashboard) return;
    api.getOtorisasiHargaNPList()
      .then(setNpList)
      .catch(console.error);

    api.getOtorisasiHargaList()
      .then(setPList)
      .catch(console.error);
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
          title="Price Authorization"
          subtitle="Non-Product / Product Price Approval System - PT Menara Terus Makmur"
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
                Maaf, Anda tidak memiliki izin untuk mengakses Dashboard Otorisasi Harga.
                Silakan hubungi Administrator untuk meminta konfigurasi hak akses akun Anda.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer w-full text-center"
            >
              Kembali ke Portal Utama
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleDeleteNP = async (id: string, noDoc: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus dokumen otorisasi non-product "${noDoc}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        await api.deleteOtorisasiHargaNP(id);
        refreshData();
      }
    });
  };

  const handleDeleteP = async (id: string, product: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus otorisasi product "${product}"?`,
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
        refreshData();
      }
    });
  };

  // KPIs based on total documents (Non-Product + Product)
  const totalCount = npList.length + pList.length;
  const pendingCount = npList.filter(i => i.status === "Pending Review").length + pList.filter(i => i.status === "Pending Review").length;
  const approvedCount = npList.filter(i => i.status === "Approved").length + pList.filter(i => i.status === "Approved").length;
  const rejectedCount = npList.filter(i => i.status === "Rejected").length + pList.filter(i => i.status === "Rejected").length;

  const kpis = [
    { label: "Total Otorisasi", value: totalCount, color: "text-slate-700", bg: "bg-white border-slate-200" },
    { label: "Pending Action", value: pendingCount, color: "text-blue-600", bg: "bg-white border-slate-200" },
    { label: "Approved", value: approvedCount, color: "text-emerald-700", bg: "bg-emerald-50/60 border-emerald-200" },
    { label: "Rejected / Ditolak", value: rejectedCount, color: "text-rose-700", bg: "bg-rose-50/60 border-rose-200" },
  ];

  // Filtered lists for the table view
  const filteredNP = npList.filter(item => {
    const s = searchQuery.toLowerCase();
    return item.no_doc.toLowerCase().includes(s) || item.no_pr.toLowerCase().includes(s) || item.buyer_nama.toLowerCase().includes(s);
  });

  const filteredP = pList.filter(item => {
    const s = searchQuery.toLowerCase();
    return item.product.toLowerCase().includes(s) || item.customer.toLowerCase().includes(s) || item.id.toLowerCase().includes(s);
  });

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header title="Dashboard Otorisasi Harga" subtitle="Overview pengajuan otorisasi harga Non-Product & Product — PT Menara Terus Makmur" />
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            {kpis.map(k => (
              <div key={k.label} className={`border rounded-2xl p-5 shadow-2xs flex flex-col gap-1 ${k.bg}`}>
                <p className={`text-3xl font-semibold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Unified Document Lists Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              {/* Tab Switcher */}
              <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 w-fit">
                <button
                  onClick={() => { setListTab("non-product"); setSearchQuery(""); }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${listTab === "non-product" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800 font-medium"}`}
                >
                  Otorisasi Non-Product ({npList.length})
                </button>
                <button
                  onClick={() => { setListTab("product"); setSearchQuery(""); }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${listTab === "product" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800 font-medium"}`}
                >
                  Otorisasi Product ({pList.length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-80">
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={listTab === "non-product" ? "Cari nomor dokumen, PR, buyer..." : "Cari product, customer..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all font-medium placeholder-slate-400"
                />
              </div>
            </div>

            {/* List representation */}
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase tracking-wider">
                  {listTab === "non-product" ? (
                    <tr>
                      <th className="px-4 py-3 text-center w-12 border-r border-slate-200">No</th>
                      <th className="px-4 py-3 border-r border-slate-200">Nomor Dokumen</th>
                      <th className="px-4 py-3 border-r border-slate-200">PR / BODR</th>
                      <th className="px-4 py-3 border-r border-slate-200">Buyer</th>
                      <th className="px-4 py-3 text-right border-r border-slate-200">Dana BODR</th>
                      <th className="px-4 py-3 text-center border-r border-slate-200">Workflow Step</th>
                      <th className="px-4 py-3 text-center border-r border-slate-200">Status</th>
                      <th className="px-4 py-3 text-center w-28">Aksi</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-4 py-3 text-center w-12 border-r border-slate-200">No</th>
                      <th className="px-4 py-3 border-r border-slate-200">ID Otorisasi</th>
                      <th className="px-4 py-3 border-r border-slate-200">Nama Product</th>
                      <th className="px-4 py-3 border-r border-slate-200">Customer</th>
                      <th className="px-4 py-3 text-right border-r border-slate-200">Final Price</th>
                      <th className="px-4 py-3 text-center border-r border-slate-200">Workflow Step</th>
                      <th className="px-4 py-3 text-center border-r border-slate-200">Status</th>
                      <th className="px-4 py-3 text-center w-28">Aksi</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs bg-white">
                  {listTab === "non-product" ? (
                    filteredNP.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 font-normal italic">
                          Tidak ada data otorisasi harga Non-Product ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredNP.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5 text-center text-slate-400 font-medium font-mono border-r border-slate-150">{idx + 1}</td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-blue-600 border-r border-slate-150">{item.no_doc}</td>
                          <td className="px-4 py-3.5 font-mono text-slate-600 border-r border-slate-150">
                            <div>PR: {item.no_pr || "—"}</div>
                            <div className="font-medium text-[10px] text-slate-400">BODR: {item.no_bodr || "—"}</div>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-800 border-r border-slate-150">{item.buyer_nama}</td>
                          <td className="px-4 py-3.5 text-right font-semibold text-slate-900 font-mono border-r border-slate-150">{fmt(item.dana_bodr)}</td>
                          <td className="px-4 py-3.5 text-center border-r border-slate-150 font-medium text-slate-600">{getFullStepName(item.step)}</td>
                          <td className="px-4 py-3.5 text-center border-r border-slate-150">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${statusBadge(item.status)}`}>{item.status}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex justify-center gap-2.5">
                              <Link href={`/otorisasi-harga/non-product/${item.id}`} className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] uppercase tracking-wider">
                                Detail
                              </Link>
                              <button onClick={() => handleDeleteNP(item.id, item.no_doc)} className="text-red-500 hover:text-red-700 font-semibold text-[11px] uppercase tracking-wider cursor-pointer">
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    filteredP.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 font-normal italic">
                          Tidak ada data otorisasi harga Product ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredP.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5 text-center text-slate-400 font-medium font-mono border-r border-slate-150">{idx + 1}</td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-blue-600 border-r border-slate-150">{item.id}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-800 border-r border-slate-150">{item.product}</td>
                          <td className="px-4 py-3.5 font-medium text-slate-700 border-r border-slate-150">{item.customer}</td>
                          <td className="px-4 py-3.5 text-right font-semibold text-slate-900 font-mono border-r border-slate-150">{fmt(item.normal_price * (1 - item.discount_pct / 100))}</td>
                          <td className="px-4 py-3.5 text-center border-r border-slate-150 font-medium text-slate-600">{getFullStepName(item.step)}</td>
                          <td className="px-4 py-3.5 text-center border-r border-slate-150">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${statusBadge(item.status)}`}>{item.status}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex justify-center gap-2.5">
                              <button onClick={() => setSelectedP(item)} className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] uppercase tracking-wider cursor-pointer">
                                Detail
                              </button>
                              <button onClick={() => handleDeleteP(item.id, item.product)} className="text-red-500 hover:text-red-700 font-semibold text-[11px] uppercase tracking-wider cursor-pointer">
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Simplified details modal for Product (read-only popup on dashboard) */}
      {selectedP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setSelectedP(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-slate-900 tracking-wide text-sm">{selectedP.id}</h3>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${statusBadge(selectedP.status)}`}>{selectedP.status}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Detail Otorisasi Harga Product</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs">
                <div className="col-span-2">
                  <p className="text-slate-500 font-medium uppercase text-[9px]">Nama Product / Component</p>
                  <p className="font-semibold text-slate-800">{selectedP.product}</p>
                </div>
                <div><p className="text-slate-500 font-medium uppercase text-[9px]">Customer</p><p className="font-medium text-slate-700">{selectedP.customer}</p></div>
                <div><p className="text-slate-500 font-medium uppercase text-[9px]">Prepared By</p><p className="font-medium text-slate-700">{selectedP.prepared_by}</p></div>
                <div><p className="text-slate-500 font-medium uppercase text-[9px]">Normal Price</p><p className="font-medium text-slate-500 line-through font-mono">{fmt(selectedP.normal_price)}</p></div>
                <div><p className="text-slate-500 font-medium uppercase text-[9px]">Discount (%)</p><p className="font-semibold text-red-600 font-mono">{selectedP.discount_pct}%</p></div>
                <div className="col-span-2"><p className="text-slate-500 font-medium uppercase text-[9px]">Final Price Proposal</p><p className="font-semibold text-emerald-700 text-sm font-mono">{fmt(selectedP.normal_price * (1 - selectedP.discount_pct/100))}</p></div>
                <div><p className="text-slate-500 font-medium uppercase text-[9px]">Tahap Approval</p><p className="font-semibold text-blue-700">{getFullStepName(selectedP.step)}</p></div>
              </div>
              
              {selectedP.notes && (
                <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl text-xs">
                  <p className="font-semibold text-blue-800 text-[10px] uppercase tracking-wider mb-0.5">Catatan Pengaju</p>
                  <p className="text-slate-600 italic font-normal">"{selectedP.notes}"</p>
                </div>
              )}

              {selectedP.approval_history && selectedP.approval_history.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Riwayat Persetujuan</p>
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-150 max-h-40 overflow-y-auto">
                    {selectedP.approval_history.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${h.status === "Approved" ? "bg-emerald-500" : "bg-red-500"}`} />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-700 text-[11px]">{getFullStepName(h.role)} — <span className={h.status === "Approved" ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>{h.status}</span></p>
                          <p className="text-[10px] text-slate-500 font-normal">Oleh: {h.name} · {h.timestamp}</p>
                          <p className="text-[10px] text-slate-500 italic mt-0.5 font-normal">Note: "{h.note || "—"}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
