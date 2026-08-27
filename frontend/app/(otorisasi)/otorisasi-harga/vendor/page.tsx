"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../../components/sidebars/SidebarOtorisasi";
import Header from "../../../components/Header";
import { ApiVendor, api } from "../../../lib/api";

const inputCls = "w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 text-sm shadow-xs";
const selectCls = "w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 text-sm shadow-xs";
const statusBadge = (s: string) => s === "active"
  ? "bg-emerald-100 text-emerald-700 border border-emerald-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
  : "bg-red-100 text-red-700 border border-red-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full";

export default function VendorPage() {
  const [items, setItems] = useState<ApiVendor[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<ApiVendor | null>(null);
  
  // Fields strictly following details.txt:
  // - Kode vendor
  // - email vendor
  // - Vendor Name
  // - Street
  // - Status (active/inactive)
  const [fKode, setFKode] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fNama, setFNama] = useState("");
  const [fStreet, setFStreet] = useState("");
  const [fStatus, setFStatus] = useState<"active" | "inactive">("active");

  const refresh = () => {
    api.getVendors().then(setItems).catch(console.error);
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => {
    setEditing(null);
    setFKode("");
    setFEmail("");
    setFNama("");
    setFStreet("");
    setFStatus("active");
    setIsOpen(true);
  };

  const openEdit = (item: ApiVendor) => {
    setEditing(item);
    setFKode(item.kode_vendor || item.kode || "");
    setFEmail(item.email_vendor || item.email || "");
    setFNama(item.vendor_name || item.nama || "");
    setFStreet(item.street || "");
    setFStatus(item.status || "active");
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      kode_vendor: fKode,
      kode: fKode,
      email_vendor: fEmail,
      email: fEmail,
      vendor_name: fNama,
      nama_vendor: fNama,
      nama: fNama,
      street: fStreet,
      alamat: fStreet,
      status: fStatus,
    };

    if (editing) {
      await api.updateVendor(editing.id, payload);
    } else {
      await api.createVendor(payload);
    }
    refresh();
    setIsOpen(false);
  };

  const handleDelete = async (id: string, nama: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus data vendor "${nama}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        await api.deleteVendor(id);
        refresh();
      }
    });
  };

  const filtered = items.filter(i => {
    const s = search.toLowerCase();
    const k = (i.kode_vendor || i.kode || "").toLowerCase();
    const n = (i.vendor_name || i.nama || "").toLowerCase();
    const e = (i.email_vendor || i.email || "").toLowerCase();
    const st = (i.street || "").toLowerCase();
    return k.includes(s) || n.includes(s) || e.includes(s) || st.includes(s);
  });

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header
          title="Master Data Vendor"
          subtitle="Kelola master data vendor / supplier untuk otorisasi harga"
        />
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari kode vendor, vendor name, email, street..."
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-500 w-80 shadow-xs"
              />
              <span className="text-xs text-slate-500 font-bold">{filtered.length} vendor</span>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 text-sm shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Tambah Vendor
            </button>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["No", "Kode Vendor", "Vendor Name", "Email Vendor", "Street", "Status", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      {item.kode_vendor || item.kode}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {item.vendor_name || item.nama}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {item.email_vendor || item.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                      {item.street || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEdit(item)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.vendor_name || item.nama)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-400 py-12 text-sm">
                      Belum ada data vendor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Modal Add / Edit Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-800 animate-scaleUp">
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/80">
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wide text-sm">
                  {editing ? "Edit Master Vendor" : "Tambah Master Vendor"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editing ? "Perbarui informasi data master vendor" : "Lengkapi formulir untuk menambahkan data master vendor baru"}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    Kode Vendor *
                  </label>
                  <input
                    className={inputCls}
                    value={fKode}
                    onChange={e => setFKode(e.target.value)}
                    placeholder="Contoh: VND-001"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    Email Vendor
                  </label>
                  <input
                    type="email"
                    className={inputCls}
                    value={fEmail}
                    onChange={e => setFEmail(e.target.value)}
                    placeholder="Contoh: sales@vendor.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    Vendor Name *
                  </label>
                  <input
                    className={inputCls}
                    value={fNama}
                    onChange={e => setFNama(e.target.value)}
                    placeholder="Contoh: PT Surya Baja Mandiri"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    Status
                  </label>
                  <select
                    className={selectCls}
                    value={fStatus}
                    onChange={e => setFStatus(e.target.value as any)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    Street (Alamat)
                  </label>
                  <textarea
                    className={inputCls}
                    value={fStreet}
                    onChange={e => setFStreet(e.target.value)}
                    placeholder="Alamat jalan / kawasan industri vendor"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                >
                  Simpan Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
