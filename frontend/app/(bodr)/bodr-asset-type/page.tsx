"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import { ApiAssetType, api } from "../../lib/api";

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-xs font-normal placeholder-slate-400 transition-all";
const selectCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-xs font-medium cursor-pointer transition-all";
const statusBadge = (s: string) => s === "active"
  ? "bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full"
  : "bg-red-50 text-red-700 border border-red-300 text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full";

export default function AssetTypePage() {
  const [items, setItems] = useState<ApiAssetType[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ApiAssetType | null>(null);
  const [fClass, setFClass] = useState(""); const [fNamaType, setFNamaType] = useState(""); const [fDeskripsi, setFDeskripsi] = useState(""); const [fStatus, setFStatus] = useState<"active"|"inactive">("active");

  const refresh = () => {
    api.getAssetTypes().then(setItems).catch(console.error);
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => { setEditing(null); setFClass(""); setFNamaType(""); setFDeskripsi(""); setFStatus("active"); setIsOpen(true); };
  const openEdit = (item: ApiAssetType) => { setEditing(item); setFClass(item.class); setFNamaType(item.nama_type); setFDeskripsi(item.deskripsi); setFStatus(item.status); setIsOpen(true); };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { class: fClass, nama_type: fNamaType, deskripsi: fDeskripsi, status: fStatus };
    if (editing) {
      await api.updateAssetType(editing.id, payload);
    } else {
      await api.createAssetType(payload);
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
        await api.deleteAssetType(id);
        refresh();
      }
    });
  };
  const filtered = items.filter(i => i.class.toLowerCase().includes(search.toLowerCase()) || i.nama_type.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen ml-64 bg-slate-100 overflow-hidden">
        <Header title="Master Asset Type" subtitle="Kelola tipe-tipe aset untuk formulir pengajuan BODR" />
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari tipe aset..." className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-500 w-72 shadow-2xs font-normal"/>
              <span className="text-xs text-slate-500 font-semibold">{filtered.length} data</span>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-2xs cursor-pointer transition-all active:scale-95"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>Tambah Asset Type</button>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>{["No","Class","Nama Type","Deskripsi","Status","Aksi"].map(h=><th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx)=>(
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{idx+1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{item.class}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.nama_type}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate font-normal">{item.deskripsi||"—"}</td>
                    <td className="px-4 py-3"><span className={statusBadge(item.status)}>{item.status}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-3"><button onClick={()=>openEdit(item)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer">Edit</button><button onClick={()=>handleDelete(item.id,item.nama_type)} className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer">Hapus</button></div></td>
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan={6} className="text-center text-slate-400 py-12 text-xs font-normal">Belum ada data Asset Type</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">{editing?"Edit Asset Type":"Tambah Asset Type"}</h3>
              <button onClick={()=>setIsOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-full cursor-pointer transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Class *</label><input className={inputCls} value={fClass} onChange={e=>setFClass(e.target.value)} required placeholder="BLDG"/></div>
                <div className="space-y-1"><label className="text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Nama Type *</label><input className={inputCls} value={fNamaType} onChange={e=>setFNamaType(e.target.value)} required placeholder="Building"/></div>
              </div>
              <div className="space-y-1"><label className="text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Deskripsi</label><textarea className={inputCls} value={fDeskripsi} onChange={e=>setFDeskripsi(e.target.value)} rows={2} placeholder="Deskripsi asset type..."/></div>
              <div className="space-y-1"><label className="text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Status</label><select className={selectCls} value={fStatus} onChange={e=>setFStatus(e.target.value as any)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setIsOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 text-xs cursor-pointer transition-all">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-xs cursor-pointer active:scale-95 transition-all shadow-xs">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
