"use client";

import { useState, useEffect, useMemo } from "react";
import { api, getUsers, User, ApiDeptSettings, ApiDepartemen } from "../../lib/api";
import Modal from "../../components/shared/Modal";
import FormField from "../../components/shared/FormField";
import SearchableUserSelect from "../../components/shared/SearchableUserSelect";
import SearchableSelect from "../../components/shared/SearchableSelect";

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-normal placeholder-slate-400";
const selectCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-normal cursor-pointer";

export default function DeptSettingsPanel() {
  const [items, setItems] = useState<ApiDeptSettings[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departemens, setDepartemens] = useState<ApiDepartemen[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiDeptSettings | null>(null);
  const [fDeptId, setFDeptId] = useState("");
  const [fKet, setFKet] = useState("");
  const [fHeadId, setFHeadId] = useState("");
  const [fAccId, setFAccId] = useState("");

  const refresh = () => {
    api.getDeptSettings().then((data) => setItems(data || [])).catch(console.error);
    api.getDepartemens().then((data) => setDepartemens(data || [])).catch(console.error);
    getUsers().then((data) => setUsers(data || [])).catch(console.error);
  };

  useEffect(() => { refresh(); }, []);

  const openEdit = (item: ApiDeptSettings) => {
    setEditing(item);
    setFDeptId(String(item.departemen_id || ""));
    setFKet(item.keterangan || "");
    setFHeadId(String((item as any).head_dept_id || ""));
    setFAccId(String((item as any).accounting_id || ""));
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setFDeptId("");
    setFKet("");
    setFHeadId("");
    setFAccId("");
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const dept = departemens.find((d) => String(d.id) === String(fDeptId));
    const head = users.find((u) => String(u.id) === String(fHeadId));
    const acc = users.find((u) => String(u.id) === String(fAccId));

    await api.upsertDeptSettings({
      departemen_id: Number(fDeptId) || 0,
      departemen: dept?.nama || "",
      department: dept?.nama || "",
      keterangan: fKet,
      head_dept: head?.name || "",
      head_dept_nama: head?.name || "",
      accounting: acc?.name || "",
      accounting_nama: acc?.name || "",
      ...(editing ? { id: editing.id } : {}),
    });
    refresh();
    setOpen(false);
  };

  const filteredItems = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    if (!s) return items;
    return items.filter((item) => {
      const dept = ((item as any).departemen_nama || (item as any).departemen || "").toLowerCase();
      const ket = ((item as any).keterangan || "").toLowerCase();
      const head = ((item as any).head_dept_nama || (item as any).head_dept || "").toLowerCase();
      const acc = ((item as any).accounting_nama || (item as any).accounting || "").toLowerCase();
      return dept.includes(s) || ket.includes(s) || head.includes(s) || acc.includes(s);
    });
  }, [items, searchQuery]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs w-full min-w-0 space-y-4">
      {/* Controls Bar: Title, Search, Action */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide">
            Departemen Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Konfigurasi Head Dept dan Accounting per departemen
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Universal Search Bar */}
          <div className="relative flex-1 sm:flex-initial">
            <input
              className="w-full sm:w-56 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              placeholder="Cari dept / head / acc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah
          </button>
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto w-full rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Departemen", "Keterangan", "Head Dept", "Accounting", "Aksi"].map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredItems.map((item) => {
              const deptName = (item as any).departemen_nama || (item as any).departemen || "-";
              const headName = (item as any).head_dept_nama || (item as any).head_dept || "-";
              const accName = (item as any).accounting_nama || (item as any).accounting || "-";

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{deptName}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-normal">{item.keterangan || "-"}</td>
                  <td className="px-4 py-3 text-slate-700 text-xs font-normal">
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                      {headName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 text-xs font-normal">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                      {accName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-700 text-xs font-medium cursor-pointer">
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 italic py-8 text-xs font-normal">
                  {searchQuery ? `Tidak ada data yang cocok dengan pencarian "${searchQuery}"` : "Belum ada konfigurasi"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah / Edit Dept Settings (Landscape / Horizontal) */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Dept Settings" : "Tambah Dept Settings"}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-80 pb-32">
            <FormField label="Departemen *">
              <SearchableSelect
                options={departemens.map((d) => ({
                  value: d.id,
                  label: d.nama,
                  badge: d.kode,
                }))}
                value={fDeptId}
                onChange={(val) => setFDeptId(String(val))}
                placeholder="Pilih Departemen"
                searchPlaceholder="Cari nama departemen..."
              />
            </FormField>

            <FormField label="Keterangan">
              <input
                className={inputCls}
                value={fKet}
                onChange={(e) => setFKet(e.target.value)}
                placeholder="Deskripsi atau fungsi departemen"
              />
            </FormField>

            <FormField label="Head Dept *">
              <SearchableUserSelect
                users={users}
                value={fHeadId}
                onChange={setFHeadId}
                placeholder="Cari Head Dept by NPK / Nama..."
                valueKey="id"
              />
            </FormField>

            <FormField label="Accounting *">
              <SearchableUserSelect
                users={users}
                value={fAccId}
                onChange={setFAccId}
                placeholder="Cari Accounting by NPK / Nama..."
                valueKey="id"
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 sticky bottom-0 bg-white z-10">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

