"use client";

import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import Modal from "../../components/shared/Modal";
import FormField from "../../components/shared/FormField";
import { api, ApiVendor, ApiPartNumber, ApiJenisOtorisasi, ApiJenisBarang } from "@/app/lib/api";

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-normal placeholder-slate-400 transition-all";
const selectCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-normal cursor-pointer transition-all";

export const statusBadge = (s: string) =>
  s === "active"
    ? "inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-lg"
    : "inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-lg";

// ── 1. Vendor Panel ──────────────────────────────────────────────────────────
export function VendorPanel() {
  const [items, setItems] = useState<ApiVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiVendor | null>(null);

  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const refresh = () => {
    setLoading(true);
    api.getVendors().then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => {
    setEditing(null);
    setKode("");
    setNama("");
    setEmail("");
    setStreet("");
    setStatus("active");
    setOpen(true);
  };

  const openEdit = (item: ApiVendor) => {
    setEditing(item);
    setKode(item.kode_vendor || item.kode || "");
    setNama(item.vendor_name || item.nama || "");
    setEmail(item.email_vendor || item.email || "");
    setStreet(item.street || "");
    setStatus(item.status || "active");
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateVendor(editing.id, {
          kode_vendor: kode,
          vendor_name: nama,
          email_vendor: email,
          street,
          status,
        });
      } else {
        await api.createVendor({
          kode_vendor: kode,
          vendor_name: nama,
          email_vendor: email,
          street,
          status,
        });
      }
      setOpen(false);
      refresh();
      Swal.fire({ icon: "success", title: "Berhasil", text: "Data vendor berhasil disimpan", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal menyimpan data vendor" });
    }
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus data vendor "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    }).then(async (res) => {
      if (res.isConfirmed) {
        await api.deleteVendor(id);
        refresh();
      }
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((i) =>
      !q ||
      (i.kode_vendor || i.kode || "").toLowerCase().includes(q) ||
      (i.vendor_name || i.nama || "").toLowerCase().includes(q) ||
      (i.email_vendor || i.email || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">Master Data Vendor</h2>
          <p className="text-xs text-slate-500 font-normal">Kelola data rekanan dan pemasok harga pengadaan (Otorisasi Harga)</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Cari vendor, kode, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-600 w-60"
          />
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            + Tambah Vendor
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 border-r border-slate-200 w-12 text-center">No</th>
              <th className="py-3 px-4 border-r border-slate-200">Kode Vendor</th>
              <th className="py-3 px-4 border-r border-slate-200">Nama Vendor</th>
              <th className="py-3 px-4 border-r border-slate-200">Email</th>
              <th className="py-3 px-4 border-r border-slate-200">Alamat / Street</th>
              <th className="py-3 px-4 border-r border-slate-200 text-center">Status</th>
              <th className="py-3 px-4 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">Memuat data vendor...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400 italic">Tidak ada data vendor yang cocok.</td></tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-slate-400 border-r border-slate-100">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 border-r border-slate-100">{item.kode_vendor || item.kode}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 border-r border-slate-100">{item.vendor_name || item.nama}</td>
                  <td className="py-3 px-4 text-slate-600 border-r border-slate-100">{item.email_vendor || item.email || "—"}</td>
                  <td className="py-3 px-4 text-slate-600 border-r border-slate-100 max-w-xs truncate">{item.street || "—"}</td>
                  <td className="py-3 px-4 text-center border-r border-slate-100">
                    <span className={statusBadge(item.status || "active")}>{item.status || "active"}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">Edit</button>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleDelete(item.id, item.vendor_name || item.nama)} className="text-red-500 hover:text-red-700 font-semibold cursor-pointer">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Vendor" : "Tambah Vendor Baru"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Kode Vendor">
            <input type="text" value={kode} onChange={(e) => setKode(e.target.value)} required placeholder="Contoh: VND-001" className={inputCls} />
          </FormField>
          <FormField label="Nama Vendor">
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} required placeholder="Contoh: PT Sumber Rezeki Mandiri" className={inputCls} />
          </FormField>
          <FormField label="Email Vendor">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Contoh: vendor@supplier.com" className={inputCls} />
          </FormField>
          <FormField label="Alamat / Street">
            <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Contoh: Jl. Industri No. 12, Bekasi" className={inputCls} />
          </FormField>
          <FormField label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={selectCls}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer">Batal</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs cursor-pointer">Simpan Data</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── 2. Part Number Panel ─────────────────────────────────────────────────────
export function PartNumberPanel() {
  const [items, setItems] = useState<ApiPartNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiPartNumber | null>(null);

  const [namaMaterial, setNamaMaterial] = useState("");
  const [deskripsiMaterial, setDeskripsiMaterial] = useState("");
  const [satuan, setSatuan] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const refresh = () => {
    setLoading(true);
    api.getPartNumbers().then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => {
    setEditing(null);
    setNamaMaterial("");
    setDeskripsiMaterial("");
    setSatuan("PCS");
    setStatus("active");
    setOpen(true);
  };

  const openEdit = (item: ApiPartNumber) => {
    setEditing(item);
    setNamaMaterial(item.nama_material || "");
    setDeskripsiMaterial(item.deskripsi_material || "");
    setSatuan(item.satuan || "PCS");
    setStatus(item.status || "active");
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updatePartNumber(editing.id, {
          nama_material: namaMaterial,
          deskripsi_material: deskripsiMaterial,
          satuan,
          status,
        });
      } else {
        await api.createPartNumber({
          nama_material: namaMaterial,
          deskripsi_material: deskripsiMaterial,
          satuan,
          status,
        });
      }
      setOpen(false);
      refresh();
      Swal.fire({ icon: "success", title: "Berhasil", text: "Data part number berhasil disimpan", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal menyimpan data part number" });
    }
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus part number "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    }).then(async (res) => {
      if (res.isConfirmed) {
        await api.deletePartNumber(id);
        refresh();
      }
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((i) =>
      !q ||
      (i.nama_material || "").toLowerCase().includes(q) ||
      (i.deskripsi_material || "").toLowerCase().includes(q) ||
      (i.satuan || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">Master Data Part Number</h2>
          <p className="text-xs text-slate-500 font-normal">Katalog nomor part dan komponen produk (Otorisasi Harga)</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Cari part number, deskripsi, satuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-600 w-60"
          />
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            + Tambah Part Number
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 border-r border-slate-200 w-12 text-center">No</th>
              <th className="py-3 px-4 border-r border-slate-200">Nama Material / Part No</th>
              <th className="py-3 px-4 border-r border-slate-200">Deskripsi Material</th>
              <th className="py-3 px-4 border-r border-slate-200">Satuan</th>
              <th className="py-3 px-4 border-r border-slate-200 text-center">Status</th>
              <th className="py-3 px-4 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Memuat data part number...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">Tidak ada data part number yang cocok.</td></tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-slate-400 border-r border-slate-100">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 border-r border-slate-100">{item.nama_material}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 border-r border-slate-100">{item.deskripsi_material}</td>
                  <td className="py-3 px-4 text-slate-600 border-r border-slate-100">{item.satuan || "PCS"}</td>
                  <td className="py-3 px-4 text-center border-r border-slate-100">
                    <span className={statusBadge(item.status || "active")}>{item.status || "active"}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">Edit</button>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleDelete(item.id, item.nama_material)} className="text-red-500 hover:text-red-700 font-semibold cursor-pointer">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Part Number" : "Tambah Part Number Baru"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Nama Material / Part Number">
            <input type="text" value={namaMaterial} onChange={(e) => setNamaMaterial(e.target.value)} required placeholder="Contoh: PN-43210-MTM" className={inputCls} />
          </FormField>
          <FormField label="Deskripsi Material">
            <input type="text" value={deskripsiMaterial} onChange={(e) => setDeskripsiMaterial(e.target.value)} required placeholder="Contoh: Brake Drum Front RH" className={inputCls} />
          </FormField>
          <FormField label="Satuan">
            <input type="text" value={satuan} onChange={(e) => setSatuan(e.target.value)} placeholder="Contoh: PCS / SET / UNIT" className={inputCls} />
          </FormField>
          <FormField label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={selectCls}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer">Batal</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs cursor-pointer">Simpan Data</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── 3. Jenis Otorisasi Panel (Source Types) ───────────────────────────────────
export function JenisOtorisasiPanel() {
  const [items, setItems] = useState<ApiJenisOtorisasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiJenisOtorisasi | null>(null);

  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const refresh = () => {
    setLoading(true);
    api.getJenisOtorisasi().then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => {
    setEditing(null);
    setKode("");
    setNama("");
    setDeskripsi("");
    setStatus("active");
    setOpen(true);
  };

  const openEdit = (item: ApiJenisOtorisasi) => {
    setEditing(item);
    setKode(item.kode || "");
    setNama(item.nama || "");
    setDeskripsi(item.deskripsi || "");
    setStatus(item.status || "active");
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateJenisOtorisasi(editing.id, {
          kode,
          nama,
          deskripsi,
          status,
        });
      } else {
        await api.createJenisOtorisasi({
          kode,
          nama,
          deskripsi,
          status,
        });
      }
      setOpen(false);
      refresh();
      Swal.fire({ icon: "success", title: "Berhasil", text: "Data jenis otorisasi berhasil disimpan", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal menyimpan data jenis otorisasi" });
    }
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus jenis otorisasi "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    }).then(async (res) => {
      if (res.isConfirmed) {
        await api.deleteJenisOtorisasi(id);
        refresh();
      }
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((i) =>
      !q ||
      (i.kode || "").toLowerCase().includes(q) ||
      (i.nama || "").toLowerCase().includes(q) ||
      (i.deskripsi || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">Master Data Jenis Otorisasi (Source Types)</h2>
          <p className="text-xs text-slate-500 font-normal">Kategori sumber usulan pengadaan harga (Otorisasi Harga)</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Cari jenis otorisasi, kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-600 w-60"
          />
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            + Tambah Jenis
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 border-r border-slate-200 w-12 text-center">No</th>
              <th className="py-3 px-4 border-r border-slate-200">Kode Jenis</th>
              <th className="py-3 px-4 border-r border-slate-200">Nama Jenis Otorisasi</th>
              <th className="py-3 px-4 border-r border-slate-200">Deskripsi</th>
              <th className="py-3 px-4 border-r border-slate-200 text-center">Status</th>
              <th className="py-3 px-4 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Memuat data jenis otorisasi...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">Tidak ada data jenis otorisasi yang cocok.</td></tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-slate-400 border-r border-slate-100">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 border-r border-slate-100">{item.kode}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 border-r border-slate-100">{item.nama}</td>
                  <td className="py-3 px-4 text-slate-600 border-r border-slate-100">{item.deskripsi || "—"}</td>
                  <td className="py-3 px-4 text-center border-r border-slate-100">
                    <span className={statusBadge(item.status || "active")}>{item.status || "active"}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">Edit</button>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleDelete(item.id, item.nama)} className="text-red-500 hover:text-red-700 font-semibold cursor-pointer">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Jenis Otorisasi" : "Tambah Jenis Otorisasi Baru"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Kode Jenis">
            <input type="text" value={kode} onChange={(e) => setKode(e.target.value)} required placeholder="Contoh: SR-01" className={inputCls} />
          </FormField>
          <FormField label="Nama Jenis Otorisasi">
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} required placeholder="Contoh: Single Sourcing" className={inputCls} />
          </FormField>
          <FormField label="Deskripsi">
            <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi jenis otorisasi..." rows={3} className={inputCls} />
          </FormField>
          <FormField label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={selectCls}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer">Batal</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs cursor-pointer">Simpan Data</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── 4. Jenis Barang Panel (Item Types) ────────────────────────────────────────
export function JenisBarangPanel() {
  const [items, setItems] = useState<ApiJenisBarang[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiJenisBarang | null>(null);

  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const refresh = () => {
    setLoading(true);
    api.getJenisBarang().then(setItems).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => {
    setEditing(null);
    setKode("");
    setNama("");
    setDeskripsi("");
    setStatus("active");
    setOpen(true);
  };

  const openEdit = (item: ApiJenisBarang) => {
    setEditing(item);
    setKode(item.kode || "");
    setNama(item.nama || "");
    setDeskripsi(item.deskripsi || "");
    setStatus(item.status || "active");
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateJenisBarang(editing.id, {
          kode,
          nama,
          deskripsi,
          status,
        });
      } else {
        await api.createJenisBarang({
          kode,
          nama,
          deskripsi,
          status,
        });
      }
      setOpen(false);
      refresh();
      Swal.fire({ icon: "success", title: "Berhasil", text: "Data jenis barang berhasil disimpan", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal menyimpan data jenis barang" });
    }
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus jenis barang "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    }).then(async (res) => {
      if (res.isConfirmed) {
        await api.deleteJenisBarang(id);
        refresh();
      }
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((i) =>
      !q ||
      (i.kode || "").toLowerCase().includes(q) ||
      (i.nama || "").toLowerCase().includes(q) ||
      (i.deskripsi || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">Master Data Jenis Barang (Item Types)</h2>
          <p className="text-xs text-slate-500 font-normal">Katalog jenis komoditas dan barang pengadaan (Otorisasi Harga)</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Cari jenis barang, kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-600 w-60"
          />
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            + Tambah Jenis Barang
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 border-r border-slate-200 w-12 text-center">No</th>
              <th className="py-3 px-4 border-r border-slate-200">Kode Barang</th>
              <th className="py-3 px-4 border-r border-slate-200">Nama Jenis Barang</th>
              <th className="py-3 px-4 border-r border-slate-200">Deskripsi</th>
              <th className="py-3 px-4 border-r border-slate-200 text-center">Status</th>
              <th className="py-3 px-4 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Memuat data jenis barang...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">Tidak ada data jenis barang yang cocok.</td></tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-center font-mono text-slate-400 border-r border-slate-100">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600 border-r border-slate-100">{item.kode}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 border-r border-slate-100">{item.nama}</td>
                  <td className="py-3 px-4 text-slate-600 border-r border-slate-100">{item.deskripsi || "—"}</td>
                  <td className="py-3 px-4 text-center border-r border-slate-100">
                    <span className={statusBadge(item.status || "active")}>{item.status || "active"}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">Edit</button>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleDelete(item.id, item.nama)} className="text-red-500 hover:text-red-700 font-semibold cursor-pointer">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Jenis Barang" : "Tambah Jenis Barang Baru"}>
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Kode Barang">
            <input type="text" value={kode} onChange={(e) => setKode(e.target.value)} required placeholder="Contoh: RM-01" className={inputCls} />
          </FormField>
          <FormField label="Nama Jenis Barang">
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} required placeholder="Contoh: Raw Material" className={inputCls} />
          </FormField>
          <FormField label="Deskripsi">
            <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi jenis barang..." rows={3} className={inputCls} />
          </FormField>
          <FormField label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={selectCls}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer">Batal</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs cursor-pointer">Simpan Data</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
