"use client";

import { useState, useEffect, useMemo } from "react";
import { api, getUsers, ApiPortalAccess } from "../../lib/api";
import Modal from "../../components/shared/Modal";

export default function PortalAccessSettingsPanel() {
  const [items, setItems] = useState<ApiPortalAccess[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiPortalAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [fCapex, setFCapex] = useState(true);
  const [fBodr, setFBodr] = useState(true);
  const [fPrice, setFPrice] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await api.getPortalAccess();
      setItems(data || []);
    } catch (err: any) {
      console.warn("Gagal memuat portal access, mencoba fallback user list:", err);
      try {
        const fallbackUsers = await getUsers();
        const mapped: ApiPortalAccess[] = (fallbackUsers || []).map((u) => ({
          user_id: Number(u.id) || 0,
          npk: u.npk || "",
          name: u.name || "",
          username: u.username || "",
          department: u.department || "",
          role: typeof u.role === "string" ? u.role : "",
          can_capex: true,
          can_bodr: true,
          can_price: true,
          allowed_portals: ["capex", "bodr", "price"],
        }));
        setItems(mapped);
      } catch (e: any) {
        setErrorMsg("Gagal memuat data akses portal. Pastikan backend aktif.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openEdit = (item: ApiPortalAccess) => {
    setEditing(item);
    setFCapex(item.can_capex !== false);
    setFBodr(item.can_bodr !== false);
    setFPrice(item.can_price !== false);
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await api.upsertPortalAccess({
        user_id: editing.user_id,
        can_capex: fCapex,
        can_bodr: fBodr,
        can_price: fPrice,
      });
      refresh();
      setOpen(false);
    } catch (err) {
      console.error("Gagal menyimpan akses portal:", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    if (!s) return items;
    return items.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const uname = (item.username || "").toLowerCase();
      const npk = (item.npk || "").toLowerCase();
      const dept = (item.department || "").toLowerCase();
      const role = (item.role || "").toLowerCase();
      return (
        name.includes(s) ||
        uname.includes(s) ||
        npk.includes(s) ||
        dept.includes(s) ||
        role.includes(s)
      );
    });
  }, [items, searchQuery]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs w-full min-w-0 space-y-4">
      {/* Controls Bar: Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide">
            Pengaturan Akses Portal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Konfigurasi hak akses modul portal (CAPEX, BODR, Otorisasi Harga) per pengguna
          </p>
        </div>

        {/* Universal Search Bar */}
        <div className="relative">
          <input
            className="w-56 sm:w-72 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
            placeholder="Cari user / NPK / role / dept..."
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
      </div>

      {/* Table View */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-12 whitespace-nowrap">
                No
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                NPK
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Pengguna
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Departemen
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Role
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                CAPEX
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                BODR
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Otorisasi Harga
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredItems.map((item, idx) => (
              <tr key={item.user_id} className="hover:bg-slate-50 transition-colors">
                {/* No */}
                <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400 whitespace-nowrap">
                  {idx + 1}
                </td>

                {/* NPK */}
                <td className="px-4 py-3 font-mono text-slate-700 font-medium text-xs whitespace-nowrap">
                  {item.npk || "-"}
                </td>

                {/* User Info */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 text-xs">{item.name}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      @{item.username}
                    </span>
                  </div>
                </td>

                {/* Departemen */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs font-medium text-slate-700">{item.department || (item as any).departemen || "Semua Dept"}</span>
                </td>

                {/* Role */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs font-medium text-slate-700">{item.role || (item as any).role_name || "-"}</span>
                </td>

                {/* CAPEX */}
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  {item.can_capex !== false ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                      Nonaktif
                    </span>
                  )}
                </td>

                {/* BODR */}
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  {item.can_bodr !== false ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                      Nonaktif
                    </span>
                  )}
                </td>

                {/* Otorisasi Harga */}
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  {item.can_price !== false ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                      Nonaktif
                    </span>
                  )}
                </td>

                {/* Action */}
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button
                    onClick={() => openEdit(item)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium cursor-pointer"
                  >
                    Edit Akses
                  </button>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={9} className="text-center text-slate-500 py-8 text-xs font-normal">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Memuat data akses portal...</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && errorMsg && (
              <tr>
                <td colSpan={9} className="text-center py-6 text-xs text-amber-600 bg-amber-50/50">
                  <div className="flex flex-col items-center gap-2">
                    <span>{errorMsg}</span>
                    <button
                      onClick={refresh}
                      className="px-3 py-1 bg-white border border-amber-300 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100/50 cursor-pointer"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {!loading && !errorMsg && filteredItems.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-slate-400 italic py-8 text-xs font-normal">
                  {searchQuery ? `Tidak ada data yang cocok dengan pencarian "${searchQuery}"` : "Belum ada data user"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Edit Hak Akses Portal">
        <form onSubmit={handleSave} className="space-y-4">
          {editing && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-xs font-semibold text-slate-800">{editing.name}</p>
              <p className="text-[11px] text-slate-500 font-normal">
                NPK: {editing.npk || "-"} • @{editing.username} • {editing.role} — {editing.department || "Semua Dept"}
              </p>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              PILIH PORTAL YANG DAPAT DIAKSES:
            </p>

            {/* Checkbox CAPEX */}
            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={fCapex}
                onChange={(e) => setFCapex(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-800">
                  Portal CAPEX (Budget & Asset Expenditure)
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Akses ke dashboard anggaran dan form pengajuan belanja modal
                </span>
              </div>
            </label>

            {/* Checkbox BODR */}
            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={fBodr}
                onChange={(e) => setFBodr(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-800">
                  Portal BODR (Budget Over Design Review)
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Akses ke pengajuan, persetujuan alur, dan monitoring BODR
                </span>
              </div>
            </label>

            {/* Checkbox Otorisasi Harga */}
            <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={fPrice}
                onChange={(e) => setFPrice(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-800">
                  Portal Otorisasi Harga (Approval Harga Purchasing)
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Akses ke modul otorisasi harga produk & non-produk purchasing
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 text-sm cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 text-sm cursor-pointer shadow-xs disabled:opacity-75"
            >
              {saving ? "Menyimpan..." : "Simpan Akses"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
