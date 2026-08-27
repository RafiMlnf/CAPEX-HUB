"use client";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../components/Header";
import { ApiJenisBarang, api } from "../../../lib/api";

const ic = "w-full bg-slate-800 border border-slate-700/70 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 text-sm";
const sb = (s: string) => s === "active" ? "bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" : "bg-red-100 text-red-700 border border-red-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full";

export default function JenisBarangPage() {
  const [items, setItems] = useState<ApiJenisBarang[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ApiJenisBarang | null>(null);
  const [fKode, setFKode] = useState("");
  const [fNama, setFNama] = useState("");
  const [fDesk, setFDesk] = useState("");
  const [fStatus, setFStatus] = useState<"active"|"inactive">("active");

  const refresh = () => {
    api.getJenisBarang().then(setItems).catch(console.error);
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => { setEditing(null); setFKode(""); setFNama(""); setFDesk(""); setFStatus("active"); setIsOpen(true); };
  const openEdit = (item: ApiJenisBarang) => { setEditing(item); setFKode(item.kode); setFNama(item.nama); setFDesk(item.deskripsi); setFStatus(item.status); setIsOpen(true); };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = { kode: fKode, nama: fNama, deskripsi: fDesk, status: fStatus };
    if (editing) {
      await api.updateJenisBarang(editing.id, p);
    } else {
      await api.createJenisBarang(p);
    }
    refresh();
    setIsOpen(false);
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
        await api.deleteJenisBarang(id);
        refresh();
      }
    });
  };

  const filtered = items.filter(i => i.kode.toLowerCase().includes(search.toLowerCase()) || i.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header title="Master Jenis Barang" subtitle="Kelola jenis-jenis barang dalam otorisasi harga" />
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari jenis barang..." className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-500 w-72 shadow-xs"/>
              <span className="text-xs text-slate-500 font-bold">{filtered.length} data</span>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 text-sm shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Tambah
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["No","Kode","Nama","Deskripsi","Status","Aksi"].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx)=>(
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400 text-xs">{idx+1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{item.kode}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{item.nama}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{item.deskripsi||"—"}</td>
                    <td className="px-4 py-3"><span className={sb(item.status)}>{item.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={()=>openEdit(item)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">Edit</button>
                        <button onClick={()=>handleDelete(item.id, item.nama)} className="text-red-500 hover:text-red-700 text-xs font-bold">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan={6} className="text-center text-slate-400 py-12 text-sm">Belum ada data</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-black text-slate-100 uppercase tracking-wide text-sm">{editing?"Edit":"Tambah"} Jenis Barang</h3>
              <button onClick={()=>setIsOpen(false)} className="text-slate-500 hover:text-red-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Kode *</label><input className={ic} value={fKode} onChange={e=>setFKode(e.target.value)} required/></div>
                <div className="space-y-1"><label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Nama *</label><input className={ic} value={fNama} onChange={e=>setFNama(e.target.value)} required/></div>
              </div>
              <div className="space-y-1"><label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Deskripsi</label><textarea className={ic} value={fDesk} onChange={e=>setFDesk(e.target.value)} rows={2}/></div>
              <div className="space-y-1"><label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Status</label><select className={ic} value={fStatus} onChange={e=>setFStatus(e.target.value as any)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setIsOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 text-sm">Batal</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 text-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
