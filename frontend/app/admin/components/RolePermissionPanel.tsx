"use client";

import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import { api, ApiRolePermission, ApiPermission } from "../../lib/api";
import Modal from "../../components/shared/Modal";

export default function RolePermissionPanel() {
  const [rps, setRps] = useState<ApiRolePermission[]>([]);
  const [perms, setPerms] = useState<ApiPermission[]>([]);
  const [editing, setEditing] = useState<ApiRolePermission | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const refresh = () => {
    setLoading(true);
    Promise.all([api.getRolePermissions(), api.getPermissions()])
      .then(([rpsData, permsData]) => {
        setRps(rpsData || []);
        setPerms(permsData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const filteredRps = useMemo(() => {
    return rps.filter((rp) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (rp.kode_role && rp.kode_role.toLowerCase().includes(q)) ||
        (rp.nama_role && rp.nama_role.toLowerCase().includes(q)) ||
        (rp.permissions && rp.permissions.some((p) => p.toLowerCase().includes(q)))
      );
    });
  }, [rps, searchQuery]);

  const totalPages = Math.ceil(filteredRps.length / itemsPerPage) || 1;
  const paginatedRps = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRps.slice(start, start + itemsPerPage);
  }, [filteredRps, currentPage, itemsPerPage]);

  const openEdit = (rp: ApiRolePermission) => {
    setEditing(rp);
    setSelected([...rp.permissions]);
  };

  const togglePerm = (kode: string) => {
    setSelected((s) => (s.includes(kode) ? s.filter((x) => x !== kode) : [...s, kode]));
  };

  const selectAll = () => {
    setSelected(perms.map((p) => p.kode));
  };

  const deselectAll = () => {
    setSelected([]);
  };

  const handleSave = async () => {
    if (!editing || isSaving) return;
    setIsSaving(true);
    try {
      await api.updateRolePermission(editing.id, { permissions: selected });
      refresh();
      setEditing(null);
      Swal.fire({
        title: "Berhasil",
        text: `Hak akses untuk role ${editing.nama_role} berhasil diperbarui.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        title: "Gagal Menyimpan",
        text: err.message || "Terjadi kesalahan saat menyimpan role permission.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Main Table Card (Tema Biru & Putih) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs w-full min-w-0 max-w-full space-y-4">
        {/* Controls: Title, Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Role Permission
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Atur hak akses permission spesifik yang dimiliki oleh masing-masing role
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari role / permission..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-56 sm:w-64 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
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
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-16 text-center">
                  No
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-40">
                  Kode Role
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-56">
                  Nama Role
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Permission yang Diberikan
                </th>
                <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right w-24">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 font-normal py-12">
                    Memuat data role permission...
                  </td>
                </tr>
              ) : paginatedRps.map((rp, index) => {
                const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                return (
                  <tr key={rp.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                    <td className="py-3.5 px-4 font-normal text-slate-400 text-center">
                      {rowNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">
                        {rp.kode_role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs">
                      {rp.nama_role}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-2xl">
                        {rp.permissions && rp.permissions.length > 0 ? (
                          rp.permissions.map((p) => (
                            <span
                              key={p}
                              className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-medium"
                            >
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px] font-normal italic">
                            Belum ada permission
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEdit(rp)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-100 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-2xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredRps.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 font-normal py-12">
                    {searchQuery
                      ? `Tidak ada role yang cocok dengan pencarian "${searchQuery}"`
                      : "Belum ada data role permission."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredRps.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-normal">
                Menampilkan <span className="font-medium text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredRps.length)}</span> - <span className="font-medium text-slate-700">{Math.min(currentPage * itemsPerPage, filteredRps.length)}</span> dari <span className="font-medium text-slate-700">{filteredRps.length}</span> entri
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

      {/* Modal Edit Permission (2 Kolom Melebar) */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit Permission — ${editing?.nama_role}`} maxWidth="max-w-4xl">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <p className="text-xs text-slate-500 font-medium">
              Centang permission yang diberikan kepada role <span className="font-semibold text-slate-700">{editing?.nama_role}</span> ({selected.length} dipilih):
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all cursor-pointer"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-700 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer"
              >
                Hapus Semua
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[58vh] overflow-y-auto pr-1">
            {perms.map((p) => {
              const isChecked = selected.includes(p.kode);
              return (
                <label
                  key={p.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? "bg-blue-50/70 border-blue-300 ring-1 ring-blue-300 shadow-2xs"
                      : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/60 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePerm(p.kode)}
                    className="mt-0.5 w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`font-semibold text-xs truncate ${isChecked ? "text-blue-900" : "text-slate-800"}`}>
                        {p.nama}
                      </p>
                      <span className="font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                        {p.kode}
                      </span>
                    </div>
                    {p.deskripsi && (
                      <p className="text-slate-500 text-[11px] font-normal mt-0.5 line-clamp-2 leading-relaxed">
                        {p.deskripsi}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setEditing(null)}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm cursor-pointer transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm cursor-pointer shadow-xs transition-all active:scale-95 flex items-center gap-2"
            >
              {isSaving ? "Menyimpan..." : "Simpan Permission"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
