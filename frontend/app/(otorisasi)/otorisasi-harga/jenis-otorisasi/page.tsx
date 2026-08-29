"use client";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../components/Header";
import { ApiJenisOtorisasi, api } from "../../../lib/api";

const ic = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-sm placeholder-slate-400 transition-all";
const sb = (s: string) => s === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" : "bg-red-50 text-red-700 border border-red-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full";

export default function JenisOtorisasiPage() {
  const [items, setItems] = useState<ApiJenisOtorisasi[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ApiJenisOtorisasi | null>(null);
  const [fKode, setFKode] = useState("");
  const [fNama, setFNama] = useState("");
  const [fDesk, setFDesk] = useState("");
  const [fStatus, setFStatus] = useState<"active"|"inactive">("active");

  const refresh = () => {
    api.getJenisOtorisasi().then(setItems).catch(console.error);
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => { setEditing(null); setFKode(""); setFNama(""); setFDesk(""); setFStatus("active"); setIsOpen(true); };
  const openEdit = (item: ApiJenisOtorisasi) => { setEditing(item); setFKode(item.kode); setFNama(item.nama); setFDesk(item.deskripsi); setFStatus(item.status); setIsOpen(true); };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = { kode: fKode, nama: fNama, deskripsi: fDesk, status: fStatus };
    if (editing) {
      await api.updateJenisOtorisasi(editing.id, p);
    } else {
      await api.createJenisOtorisasi(p);
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
        await api.deleteJenisOtorisasi(id);
        refresh();
      }
    });
  };

  const filtered = items.filter(i => i.kode.toLowerCase().includes(search.toLowerCase()) || i.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64 bg-slate-100">
        <Header title="Master Data Jenis Otorisasi" subtitle="Kelola jenis otorisasi harga untuk modul Otorisasi Harga" />
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari kode atau nama..." className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-blue-500 w-72 shadow-xs"/>
              <span className="text-xs text-slate-500 font-semibold">{filtered.length} data</span>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-sm shadow-xs cursor-pointer"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>Tambah Jenis Otorisasi</button>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["No","Kode","Nama","Deskripsi","Status","Aksi"].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx)=>(
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400 text-xs">{idx+1}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-blue-600">{item.kode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.nama}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate font-normal">{item.deskripsi||"—"}</td>
                    <td className="px-4 py-3"><span className={sb(item.status)}>{item.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={()=>openEdit(item)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer">Edit</button>
                        <button onClick={()=>handleDelete(item.id, item.nama)} className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length===0&&<tr><td colSpan={6} className="text-center text-slate-400 py-12 text-sm font-normal">Belum ada data</td></tr>}
              </tbody>
            </table>
          </div>
        </main>
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">{editing?"Edit":"Tambah"} Jenis Otorisasi</h3>
              <button onClick={()=>setIsOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-full cursor-pointer transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Kode *</label><input className={ic} value={fKode} onChange={e=>setFKode(e.target.value)} required placeholder="Contoh: JO-01"/></div>
                <div className="space-y-1"><label className="text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Nama *</label><input className={ic} value={fNama} onChange={e=>setFNama(e.target.value)} required placeholder="Nama jenis otorisasi"/></div>
              </div>
              <div className="space-y-1"><label className="text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Deskripsi</label><textarea className={ic} value={fDesk} onChange={e=>setFDesk(e.target.value)} rows={2} placeholder="Deskripsi..."/></div>
              <div className="space-y-1"><label className="text-slate-600 font-semibold uppercase tracking-wider text-[10px]">Status</label><select className={ic} value={fStatus} onChange={e=>setFStatus(e.target.value as any)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={()=>setIsOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 text-sm cursor-pointer transition-all">Batal</button><button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-sm cursor-pointer shadow-xs transition-all">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
