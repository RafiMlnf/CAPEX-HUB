"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import { getUsers, addUser, updateUser, deleteUser, api, User } from "../../lib/api";
import Modal from "../../components/shared/Modal";
import FormField from "../../components/shared/FormField";
import SearchableSelect from "../../components/shared/SearchableSelect";

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-normal placeholder-slate-400 transition-all";
const selectCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-normal cursor-pointer transition-all";
const statusBadge = (s: string) =>
  s === "active"
    ? "inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-lg"
    : "inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-lg";

export default function UsersPanel() {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "active" | "inactive">("ALL");
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formName, setFormName] = useState("");
  const [formNpk, setFormNpk] = useState("");
  const [formRole, setFormRole] = useState("Admin");
  const [formDepartment, setFormDepartment] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");
  const [formError, setFormError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [data, deptData, roleData] = await Promise.all([
        getUsers(),
        api.getDepartemens(),
        api.getRoles(),
      ]);
      setUsersList(data || []);
      const deptMap = new Map<string, string>();
      (deptData || []).forEach((d: any) => {
        const dName = (d.nama || d.nama_departemen || d.kode || "").trim();
        if (dName) deptMap.set(dName.toLowerCase(), dName);
      });
      (data || []).forEach((u: any) => {
        const uDept = (u.department || (u as any).departemen || "").trim();
        if (uDept) deptMap.set(uDept.toLowerCase(), uDept);
      });
      setDepartments(Array.from(deptMap.values()));
      
      const roleMap = new Map<string, string>();
      (roleData || []).forEach((r: any) => {
        const rName = r.nama || r.nama_role || r.kode;
        if (rName) roleMap.set(rName.toLowerCase(), rName);
      });
      (data || []).forEach((u: any) => {
        const uRole = (u.role_name || u.role || "").trim();
        if (uRole) roleMap.set(uRole.toLowerCase(), uRole);
      });
      setAvailableRoles(Array.from(roleMap.values()));
    } catch (err) {
      console.error("Gagal mengambil data user/master:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalActive = useMemo(() => usersList.filter((u: any) => (u.status || "active") === "active").length, [usersList]);
  const totalInactive = useMemo(() => usersList.filter((u: any) => u.status === "inactive").length, [usersList]);

  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditingUser(null);
    setFormUsername("");
    setFormName("");
    setFormNpk("");
    setFormEmail("");
    setFormRole("");
    setFormDepartment("");
    setFormPassword("");
    setFormStatus("active");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormName(u.name);
    setFormNpk((u as any).npk || "");
    setFormEmail((u as any).email || "");
    setFormRole((u as any).role_name || u.role || "");
    setFormDepartment(u.department || "");
    setFormPassword("");
    setFormStatus((u as any).status || "active");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formName.trim() || !formNpk.trim()) {
      setFormError("Username, Nama Lengkap, dan NPK wajib diisi!");
      return;
    }
    if (!formRole.trim()) {
      setFormError("Role wajib dipilih!");
      return;
    }
    if (!formDepartment.trim()) {
      setFormError("Departemen wajib dipilih!");
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      const emailVal = formEmail.trim() || `${formUsername.trim()}@mtm.co.id`;
      const payload = {
        username: formUsername.trim(),
        name: formName.trim(),
        nama_user: formName.trim(),
        email: emailVal,
        role: formRole as any,
        department: formDepartment,
        npk: formNpk.trim(),
        status: formStatus,
        ...(formPassword ? { password: formPassword } : {}),
      };
      if (editingUser) {
        await updateUser(editingUser.id, payload);
      } else {
        await addUser({ ...payload, password: formPassword });
      }
      setIsModalOpen(false);
      await fetchUsers();
      Swal.fire({
        title: "Berhasil",
        text: "Data user berhasil disimpan.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      let errorMsg = err.message || "Gagal menyimpan user.";
      const isDuplicate =
        errorMsg.toLowerCase().includes("duplicate") ||
        errorMsg.toLowerCase().includes("duplikat") ||
        errorMsg.toLowerCase().includes("sudah terdaftar") ||
        errorMsg.toLowerCase().includes("unique constraint") ||
        errorMsg.toLowerCase().includes("23505") ||
        errorMsg.toLowerCase().includes("p2002") ||
        errorMsg.toLowerCase().includes("npk");

      if (isDuplicate) {
        errorMsg = `NPK "${formNpk}" atau Username "${formUsername}" sudah terdaftar dalam sistem. Silakan gunakan NPK/Username yang berbeda.`;
        Swal.fire({
          title: "NPK / Username Duplikat!",
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
      setFormError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus user "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        await deleteUser(id);
        await fetchUsers();
      }
    });
  };

  const roles = useMemo(() => {
    const map = new Map<string, string>();
    (availableRoles || []).forEach((r) => {
      if (r) map.set(r.toLowerCase(), r);
    });
    usersList.forEach((u) => {
      const r = (u as any).role_name || u.role;
      if (r && !map.has(r.toLowerCase())) {
        map.set(r.toLowerCase(), r);
      }
    });
    return ["ALL", ...Array.from(map.values())];
  }, [availableRoles, usersList]);

  const filtered = useMemo(() => {
    return usersList.filter((u) => {
      const s = searchQuery.toLowerCase().trim();
      const userRole = ((u as any).role_name || u.role || "").toLowerCase();
      const userCode = (u.role || "").toLowerCase();
      const userStatus = (u as any).status || "active";

      const matchSearch =
        !s ||
        (u.name && u.name.toLowerCase().includes(s)) ||
        (u.username && u.username.toLowerCase().includes(s)) ||
        (u.department && u.department.toLowerCase().includes(s)) ||
        ((u as any).npk && String((u as any).npk).toLowerCase().includes(s)) ||
        (userRole && userRole.includes(s));

      const matchRole =
        roleFilter === "ALL" ||
        userRole === roleFilter.toLowerCase() ||
        userCode === roleFilter.toLowerCase();

      const matchStatus =
        statusFilter === "ALL" || userStatus === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [usersList, searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs w-full min-w-0 max-w-full space-y-4">
        {/* Controls: Title, Search, Filter & Action */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Master Data User
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Daftar seluruh akun pengguna dan hak akses peran dalam sistem
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Universal Search Bar */}
            <div className="relative flex-1 sm:flex-initial">
              <input
                className="w-full sm:w-52 md:w-56 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                placeholder="Cari user / NPK / dept / role..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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

            {/* Filter Role */}
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer shrink-0"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              aria-label="Filter berdasarkan Role"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r === "ALL" ? "Semua Role" : r}
                </option>
              ))}
            </select>

            {/* Filter Status (Semua, Aktif, Arsip) */}
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer shrink-0"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
              aria-label="Filter berdasarkan Status"
            >
              <option value="ALL">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Arsip</option>
            </select>

            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tambah User
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-normal text-xs italic">Memuat data user...</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 whitespace-nowrap">
                  <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-14 text-center">No</th>
                  <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-28">NPK</th>
                  <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Departemen</th>
                  <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center w-28">Status</th>
                  <th className="py-3.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedUsers.map((u, index) => {
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  const isInactive = (u as any).status === "inactive";

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-blue-50/30 transition-colors duration-150 ${
                        isInactive ? "bg-slate-50/40" : ""
                      }`}
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 font-normal text-slate-400 text-center whitespace-nowrap">
                        {rowNumber}
                      </td>

                      {/* NPK */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700 text-xs whitespace-nowrap">
                        {(u as any).npk || u.username || "-"}
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-medium flex items-center justify-center text-xs shrink-0">
                            {(u.name || u.username || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-slate-800 font-medium text-xs">{u.name}</p>
                            <p className="text-slate-400 font-normal text-[10px]">
                              @{u.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 text-xs whitespace-nowrap">
                        {(u as any).role_name || u.role}
                      </td>

                      {/* Departemen */}
                      <td className="py-3.5 px-4 text-slate-700 font-normal whitespace-nowrap">
                        {u.department || (u as any).departemen || "-"}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-slate-500 font-normal text-[11px] whitespace-nowrap">
                        {(u as any).email || "-"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={statusBadge((u as any).status || "active")}>
                          {((u as any).status || "active") === "active" ? "Aktif" : "Arsip"}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(u)}
                            title="Edit User"
                            className="p-1.5 text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-100 rounded-lg transition-all cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            title="Hapus User"
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
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-slate-400 font-normal py-12 text-xs">
                      {searchQuery
                        ? `Tidak ada user yang cocok dengan pencarian "${searchQuery}"`
                        : statusFilter === "inactive"
                        ? "Tidak ada user yang diarsipkan (status non-aktif)."
                        : "Tidak ada user ditemukan"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-normal">
                Menampilkan <span className="font-medium text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}</span> - <span className="font-medium text-slate-700">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> dari <span className="font-medium text-slate-700">{filtered.length}</span> user
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
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
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

      {/* Modal Form */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Edit User" : "Tambah User Baru"} maxWidth="max-w-3xl">
        <form onSubmit={handleSave} className="space-y-5">
          {formError && (
            <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-200">{formError}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Username *">
              <input className={inputCls} value={formUsername} onChange={(e) => setFormUsername(e.target.value)} required placeholder="john.doe" />
            </FormField>
            <FormField label="Nama Lengkap *">
              <input className={inputCls} value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="John Doe" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="NPK *">
              <input className={inputCls} value={formNpk} onChange={(e) => setFormNpk(e.target.value)} required placeholder="Contoh: ADM001 atau 12345" />
            </FormField>
            <FormField label="Email">
              <input
                className={inputCls}
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder={formUsername ? `${formUsername}@mtm.co.id` : "user@mtm.co.id"}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Role *">
              <SearchableSelect
                options={availableRoles.map((r) => ({ value: r, label: r }))}
                value={formRole}
                onChange={(val) => setFormRole(String(val))}
                placeholder="Pilih Role"
                searchPlaceholder="Cari role..."
              />
            </FormField>
            <FormField label="Departemen *">
              <SearchableSelect
                options={departments.map((d) => ({ value: d, label: d }))}
                value={formDepartment}
                onChange={(val) => setFormDepartment(String(val))}
                placeholder="Pilih Departemen"
                searchPlaceholder="Cari departemen..."
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={editingUser ? "Password Baru (kosongkan jika tidak diubah)" : "Password *"}>
              <input
                className={inputCls}
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editingUser ? "••••••••" : "Masukkan password"}
                required={!editingUser}
              />
            </FormField>
            <FormField label="Status">
              <select className={selectCls} value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                <option value="active">Active (Aktif)</option>
                <option value="inactive">Inactive (Arsip / Nonaktif)</option>
              </select>
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm cursor-pointer transition-all">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm cursor-pointer shadow-xs transition-all active:scale-95 flex items-center gap-2"
            >
              {isSaving ? "Menyimpan..." : "Simpan User"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


