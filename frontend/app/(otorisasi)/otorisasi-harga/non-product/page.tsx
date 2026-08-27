"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import Sidebar from "../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../components/Header";
import { ApiOtorisasiHargaNonProduct, api } from "../../../lib/api";
import { useCapex } from "../../../context/CapexContext";

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
  if (s === "Approved") return "bg-emerald-100 text-emerald-700 border border-emerald-300";
  if (s === "Rejected") return "bg-red-100 text-red-700 border border-red-300";
  if (s === "Revision Required") return "bg-orange-100 text-orange-700 border border-orange-300";
  return "bg-blue-100 text-blue-700 border border-blue-300";
};

export default function OtorisasiNPListPage() {
  const { currentUser } = useCapex();
  const [items, setItems] = useState<ApiOtorisasiHargaNonProduct[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const refresh = () => {
    api.getOtorisasiHargaNPList().then(setItems).catch(console.error);
  };

  useEffect(() => { refresh(); }, []);

  const handleDelete = async (id: string, noDoc: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus dokumen "${noDoc}"?`,
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
        refresh();
      }
    });
  };

  const filtered = items.filter(i => {
    const s = search.toLowerCase();
    const matchSearch = i.no_doc.toLowerCase().includes(s) || i.no_pr.toLowerCase().includes(s) || i.buyer_nama.toLowerCase().includes(s);
    const matchStatus = statusFilter === "ALL" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header title="Otorisasi Harga Non-Product" subtitle="Daftar dokumen otorisasi harga untuk pengadaan non-product" />
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Filters + Create */}
          <div className="flex items-center gap-3">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari no. dokumen, no. PR, buyer..." className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-500 w-72 shadow-xs"/>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-500 shadow-xs">
              <option value="ALL">Semua Status</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="ml-auto">
              <Link href="/otorisasi-harga/non-product/create" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 text-sm shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                Buat Otorisasi
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["No","No. Dokumen","No. PR","No. BODR","Buyer","Dana BODR","Step","Status","Aksi"].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{idx+1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 whitespace-nowrap">{item.no_doc}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.no_pr||"—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.no_bodr||"—"}</td>
                    <td className="px-4 py-3 text-slate-800 font-bold text-xs">{item.buyer_nama}</td>
                    <td className="px-4 py-3 text-slate-700 font-bold text-xs whitespace-nowrap">{fmt(item.dana_bodr)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{getFullStepName(item.step)}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusBadge(item.status)}`}>{item.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/otorisasi-harga/non-product/${item.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-bold">Detail</Link>
                        <button onClick={()=>handleDelete(item.id, item.no_doc)} className="text-red-500 hover:text-red-700 text-xs font-bold">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan={9} className="text-center text-slate-400 py-12 text-sm">Belum ada dokumen Otorisasi Harga Non-Product</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
