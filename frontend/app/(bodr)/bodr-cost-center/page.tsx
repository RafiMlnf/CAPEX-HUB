"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import { ApiCostCenter, api } from "../../lib/api";

const inputCls = "w-full bg-slate-800 border border-slate-700/70 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 text-xs font-normal";
const selectCls = "w-full bg-slate-800 border border-slate-700/70 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 text-xs font-medium";
const statusBadge = (s: string) => s === "active"
  ? "bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full"
  : "bg-red-50 text-red-700 border border-red-300 text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full";

export default function CostCenterPage() {
  const [items, setItems] = useState<ApiCostCenter[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCostCenter | null>(null);
  const [fKode, setFKode] = useState(""); const [fNama, setFNama] = useState(""); const [fDeskripsi, setFDeskripsi] = useState(""); const [fStatus, setFStatus] = useState<"active"|"inactive">("active");

  const refresh = () => {
    api.getCostCenters().then(setItems).catch(console.error);
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => { setEditing(null); setFKode(""); setFNama(""); setFDeskripsi(""); setFStatus("active"); setIsOpen(true); };
  const openEdit = (item: ApiCostCenter) => { setEditing(item); setFKode(item.kode); setFNama(item.nama); setFDeskripsi(item.deskripsi); setFStatus(item.status); setIsOpen(true); };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { kode: fKode, nama: fNama, deskripsi: fDeskripsi, status: fStatus };
    if (editing) {
      await api.updateCostCenter(editing.id, payload);
    } else {
      await api.createCostCenter(payload);
    }
    refresh(); setIsOpen(false);
  };
  const handleDelete = async (id: string, nama: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus "${nama}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        await api.deleteCostCenter(id);
        refresh();
      }
    });
  };

  const filtered = items.filter(i => i.kode.toLowerCase().includes(search.toLowerCase()) || i.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header title="Master Data Cost Center" subtitle="Kelola daftar Cost Center yang digunakan dalam pengajuan BODR" />
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kode atau nama..." className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs font-normal focus:outline-none focus:border-blue-600 w-72 shadow-2xs"/>
              <span className="text-xs text-slate-500 font-medium">{filtered.length} data</span>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-xs shadow-2xs cursor-pointer active:scale-95 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Tambah Cost Center
            </button>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["No","Kode","Nama Cost Center","Deskripsi","Status","Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs font-medium font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-blue-600">{item.kode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.nama}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate font-normal">{item.deskripsi || "—"}</td>
                    <td className="px-4 py-3"><span className={statusBadge(item.status)}>{item.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer">Edit</button>
                        <button onClick={() => handleDelete(item.id, item.nama)} className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-slate-400 py-12 text-xs font-normal">Belum ada data Cost Center</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-semibold text-slate-100 uppercase tracking-wide text-sm">{editing ? "Edit Cost Center" : "Tambah Cost Center"}</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-400 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Kode *</label><input className={inputCls} value={fKode} onChange={e=>setFKode(e.target.value)} required placeholder="CC-001"/></div>
                <div className="space-y-1"><label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Nama *</label><input className={inputCls} value={fNama} onChange={e=>setFNama(e.target.value)} required placeholder="CC-PROD"/></div>
              </div>
              <div className="space-y-1"><label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Deskripsi</label><textarea className={inputCls} value={fDeskripsi} onChange={e=>setFDeskripsi(e.target.value)} rows={2} placeholder="Keterangan cost center"/></div>
              <div className="space-y-1"><label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Status</label><select className={selectCls} value={fStatus} onChange={e=>setFStatus(e.target.value as any)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setIsOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 text-xs cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-xs cursor-pointer active:scale-95 transition-all">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
