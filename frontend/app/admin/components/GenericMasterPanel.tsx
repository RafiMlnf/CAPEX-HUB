"use client";

import { useState, useMemo } from "react";
import Swal from "sweetalert2";
import Modal from "../../components/shared/Modal";
import FormField from "../../components/shared/FormField";

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-normal placeholder-slate-400 transition-all";
const selectCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-normal cursor-pointer transition-all";

export const statusBadge = (s: string) =>
  s === "active"
    ? "inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-lg"
    : "inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-lg";

interface GenericItem {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  status: "active" | "inactive";
}

interface GenericMasterPanelProps<T extends GenericItem> {
  title: string;
  items: T[];
  onSave: (data: Partial<T>, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function GenericMasterPanel<T extends GenericItem>({
  title,
  items,
  onSave,
  onDelete,
}: GenericMasterPanelProps<T>) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "active" | "inactive">("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const totalActive = useMemo(() => items.filter((i) => i.status === "active").length, [items]);
  const totalInactive = useMemo(() => items.filter((i) => i.status === "inactive").length, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const itemKode = (item.kode || (item as any).kode_departemen || (item as any).kode_role || "").toLowerCase();
      const itemNama = (item.nama || (item as any).nama_departemen || (item as any).nama_role || "").toLowerCase();
      const itemDesc = (item.deskripsi || "").toLowerCase();

      const matchSearch =
        !q ||
        itemKode.includes(q) ||
        itemNama.includes(q) ||
        itemDesc.includes(q);

      const matchStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [items, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setKode("");
    setNama("");
    setDeskripsi("");
    setStatus("active");
    setOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    setKode(item.kode || (item as any).kode_departemen || (item as any).kode_role || "");
    setNama(item.nama || (item as any).nama_departemen || (item as any).nama_role || "");
    setDeskripsi(item.deskripsi || "");
    setStatus(item.status || "active");
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave({ kode, nama, deskripsi, status } as any, editing?.id);
      setOpen(false);
      Swal.fire({
        title: "Berhasil",
        text: "Data master berhasil disimpan.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      let errorMsg = err.message || "Gagal menyimpan data master.";
      const isDuplicate =
        errorMsg.toLowerCase().includes("duplicate") ||
        errorMsg.toLowerCase().includes("duplikat") ||
        errorMsg.toLowerCase().includes("sudah terdaftar") ||
        errorMsg.toLowerCase().includes("unique constraint") ||
        errorMsg.toLowerCase().includes("23505") ||
        errorMsg.toLowerCase().includes("p2002");

      if (isDuplicate) {
        errorMsg = `Kode "${kode}" sudah terdaftar dalam sistem. Silakan gunakan kode lain yang unik.`;
        Swal.fire({
          title: "Kode Sudah Terdaftar!",
          text: errorMsg,
          icon: "warning",
          confirmButtonColor: "#3b82f6",
          confirmButtonText: "Tutup",
        });
      } else {
        Swal.fire({
          title: "Gagal Menyimpan",
          text: errorMsg,
          icon: "error",
          confirmButtonColor: "#ef4444",
          confirmButtonText: "Tutup",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Main Table Card (Tema Biru & Putih) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs w-full min-w-0 max-w-full space-y-4">
        {/* Controls: Title, Universal Search & Status Filter & Action Button */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              {title}
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Kelola daftar data master dan arsip status untuk modul sistem
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Universal Search Bar */}
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                placeholder="Cari kode, nama, deskripsi..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full sm:w-52 md:w-56 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter Status (Semua, Aktif, Arsip) */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
              aria-label="Filter status data"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs shrink-0"
            >
              <option value="ALL">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Arsip</option>
            </select>

            {/* Button Tambah Data */}
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 whitespace-nowrap shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Data
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 whitespace-nowrap">
                <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-14 text-center">
                  No
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-32">
                  Kode
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center w-28">
                  Status
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right w-24">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedItems.map((item, index) => {
                const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                const isInactive = item.status === "inactive";

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/30 transition-colors duration-150 ${
                      isInactive ? "bg-slate-50/40" : ""
                    }`}
                  >
                    {/* No */}
                    <td className="py-3.5 px-4 font-normal text-slate-400 text-center whitespace-nowrap">
                      {rowNumber}
                    </td>

                    {/* Kode */}
                    <td className="py-3.5 px-4 font-mono font-medium text-blue-600 whitespace-nowrap">
                      <span className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md inline-block">
                        {item.kode || (item as any).kode_departemen || (item as any).kode_role || "-"}
                      </span>
                    </td>

                    {/* Nama */}
                    <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {item.nama || (item as any).nama_departemen || (item as any).nama_role || "-"}
                    </td>

                    {/* Deskripsi */}
                    <td className="py-3.5 px-4 text-slate-600 font-normal max-w-md">
                      {item.deskripsi ? (
                        <div className="whitespace-pre-line text-xs leading-relaxed max-h-24 overflow-y-auto pr-1">
                          {item.deskripsi}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={statusBadge(item.status)}>
                        {item.status === "active" ? "Aktif" : "Arsip"}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(item)}
                          title="Edit Data"
                          className="p-1.5 text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-100 rounded-lg transition-all cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: "Konfirmasi Hapus",
                              text: `Hapus data "${item.nama}"?`,
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#ef4444",
                              cancelButtonColor: "#64748b",
                              confirmButtonText: "Ya, Hapus",
                              cancelButtonText: "Batal",
                              reverseButtons: true,
                            }).then((result) => {
                              if (result.isConfirmed) {
                                onDelete(item.id);
                              }
                            });
                          }}
                          title="Hapus Data"
                          className="p-1.5 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-100 rounded-lg transition-all cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 font-normal py-12">
                    {searchQuery
                      ? `Tidak ada data yang cocok dengan pencarian "${searchQuery}"`
                      : statusFilter === "inactive"
                      ? "Tidak ada data yang diarsipkan (status non-aktif)."
                      : "Belum ada data master."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-normal">
                Menampilkan <span className="font-medium text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredItems.length)}</span> - <span className="font-medium text-slate-700">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> dari <span className="font-medium text-slate-700">{filteredItems.length}</span> entri
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white shadow-xs"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form Tambah / Edit */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${title}` : `Tambah ${title} Baru`}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kode *">
              <input className={inputCls} value={kode} onChange={(e) => setKode(e.target.value)} required placeholder="Contoh: DEPT01" />
            </FormField>
            <FormField label="Nama *">
              <input className={inputCls} value={nama} onChange={(e) => setNama(e.target.value)} required placeholder="Contoh: Human Resource" />
            </FormField>
          </div>

          <FormField label="Deskripsi">
            <textarea
              className={`${inputCls} font-normal leading-relaxed`}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.currentTarget;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const val = target.value;
                  const lastLineStart = val.lastIndexOf("\n", start - 1) + 1;
                  const currentLine = val.substring(lastLineStart, start);

                  const numberMatch = currentLine.match(/^(\s*)(\d+)(\.|\))\s+(.*)$/);
                  const emptyNumberMatch = currentLine.match(/^(\s*)(\d+)(\.|\))\s*$/);
                  const bulletMatch = currentLine.match(/^(\s*)([-*•])\s+(.*)$/);
                  const emptyBulletMatch = currentLine.match(/^(\s*)([-*•])\s*$/);

                  if (emptyNumberMatch || emptyBulletMatch) {
                    e.preventDefault();
                    const nextVal = val.substring(0, lastLineStart) + val.substring(end);
                    setDeskripsi(nextVal);
                    setTimeout(() => {
                      target.selectionStart = target.selectionEnd = lastLineStart;
                    }, 0);
                    return;
                  }

                  if (numberMatch) {
                    e.preventDefault();
                    const indent = numberMatch[1];
                    const nextNum = parseInt(numberMatch[2], 10) + 1;
                    const delimiter = numberMatch[3];
                    const insertion = `\n${indent}${nextNum}${delimiter} `;
                    const nextVal = val.substring(0, start) + insertion + val.substring(end);
                    setDeskripsi(nextVal);
                    setTimeout(() => {
                      target.selectionStart = target.selectionEnd = start + insertion.length;
                    }, 0);
                    return;
                  }

                  if (bulletMatch) {
                    e.preventDefault();
                    const indent = bulletMatch[1];
                    const bulletChar = bulletMatch[2];
                    const insertion = `\n${indent}${bulletChar} `;
                    const nextVal = val.substring(0, start) + insertion + val.substring(end);
                    setDeskripsi(nextVal);
                    setTimeout(() => {
                      target.selectionStart = target.selectionEnd = start + insertion.length;
                    }, 0);
                    return;
                  }
                }
              }}
              rows={3}
              placeholder="Keterangan atau deskripsi tambahan..."
            />
          </FormField>

          <FormField label="Status">
            <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="active">Active (Aktif)</option>
              <option value="inactive">Inactive (Arsip / Nonaktif)</option>
            </select>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm cursor-pointer transition-all">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm cursor-pointer shadow-xs transition-all active:scale-95 flex items-center gap-2"
            >
              {isSaving ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


