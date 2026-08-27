"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import { api, getUsers, User, ApiDepartemen, ApiTypeApproval } from "../../lib/api";
import Modal from "../../components/shared/Modal";
import FormField from "../../components/shared/FormField";
import SectionHeader from "../../components/shared/SectionHeader";
import SearchableUserSelect from "../../components/shared/SearchableUserSelect";
import SearchableSelect from "../../components/shared/SearchableSelect";

const selectCls =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-sm font-normal cursor-pointer transition-colors";

const statusBadge = (s: string) =>
  s === "active"
    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full"
    : "bg-red-50 text-red-700 border border-red-300 text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full";

interface ApprovalWorkflowPanelProps {
  price?: boolean;
}

export default function ApprovalWorkflowPanel({ price = false }: ApprovalWorkflowPanelProps) {
  const [items, setItems] = useState<any[]>([]);
  const [departemens, setDepartemens] = useState<ApiDepartemen[]>([]);
  const [typeApprovals, setTypeApprovals] = useState<ApiTypeApproval[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter type approval berdasarkan mode panel (Price Workflow vs Standard Workflow)
  const filteredTypeApprovals = useMemo(() => {
    if (price) {
      const priceTypes = typeApprovals.filter((t) => {
        const name = (t.nama || "").toLowerCase();
        const code = (t.kode || "").toLowerCase();
        const desc = (t.deskripsi || "").toLowerCase();
        return (
          name.includes("harga") ||
          name.includes("price") ||
          code.includes("harga") ||
          code.includes("price") ||
          desc.includes("harga") ||
          desc.includes("price")
        );
      });
      return priceTypes.length > 0 ? priceTypes : typeApprovals;
    } else {
      const standardTypes = typeApprovals.filter((t) => {
        const name = (t.nama || "").toLowerCase();
        const code = (t.kode || "").toLowerCase();
        const desc = (t.deskripsi || "").toLowerCase();
        const isPrice =
          name.includes("harga") ||
          name.includes("price") ||
          code.includes("harga") ||
          code.includes("price") ||
          desc.includes("harga") ||
          desc.includes("price");
        return !isPrice;
      });
      return standardTypes.length > 0 ? standardTypes : typeApprovals;
    }
  }, [typeApprovals, price]);

  // Modal State
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [fDeptId, setFDeptId] = useState<number | string>("");
  const [fTypeAppId, setFTypeAppId] = useState<number | string>("");
  const [fApprovers, setFApprovers] = useState<string[]>([]);
  const [fStatus, setFStatus] = useState<"active" | "inactive">("active");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [wfData, deptData, typeData, userData] = await Promise.all([
        price ? api.getApprovalPriceWorkflows() : api.getApprovalWorkflows(),
        api.getDepartemens().catch(() => []),
        api.getTypeApprovals().catch(() => []),
        getUsers().catch(() => []),
      ]);

      setItems(wfData || []);
      setDepartemens(deptData || []);
      setTypeApprovals(typeData || []);
      setUsers(userData || []);
    } catch (err) {
      console.error("Gagal memuat data workflow:", err);
    } finally {
      setLoading(false);
    }
  }, [price]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = () => {
    setEditing(null);
    setFDeptId("");
    setFTypeAppId("");
    setFApprovers([]);
    setFStatus("active");
    setFormError("");
    setOpen(true);
  };

  const openEdit = (wf: any) => {
    setEditing(wf);
    setFDeptId(wf.departemen_id || "");
    setFTypeAppId(wf.type_approval_id || "");
    
    // Ambil daftar nama approver dari format yang tersedia
    let existingApprovers: string[] = [];
    if (wf.approvers && Array.isArray(wf.approvers) && wf.approvers.length > 0) {
      existingApprovers = [...wf.approvers];
    } else {
      const stepList = wf.list_approval || wf.steps || [];
      existingApprovers = stepList.map((s: any) => s.approver_name || s.user_name || s.nama_user || "");
    }

    setFApprovers(existingApprovers);
    setFStatus(wf.status || "active");
    setFormError("");
    setOpen(true);
  };

  const addApproverStep = () => {
    setFApprovers((prev) => [...prev, ""]);
  };

  const removeApproverStep = (index: number) => {
    setFApprovers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateApproverStep = (index: number, value: string) => {
    setFApprovers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fDeptId || !fTypeAppId) {
      setFormError("Departemen dan Type Approval wajib dipilih.");
      return;
    }
    const validApprovers = fApprovers.filter((a) => a.trim() !== "");
    if (validApprovers.length === 0) {
      setFormError("Silakan pilih user approver pada langkah yang ditambahkan.");
      return;
    }

    const selectedDept = departemens.find((d) => String(d.id) === String(fDeptId));
    const selectedType = typeApprovals.find((t) => String(t.id) === String(fTypeAppId));

    const payload = {
      departemen_id: Number(fDeptId) || 0,
      departemen: selectedDept?.nama || "",
      department: selectedDept?.nama || "",
      type_approval_id: Number(fTypeAppId) || 0,
      type_approval: selectedType?.nama || "",
      approvers: validApprovers,
      status: fStatus,
    };

    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        if (price) {
          await api.updateApprovalPriceWorkflow(editing.id, payload);
        } else {
          await api.updateApprovalWorkflow(editing.id, payload);
        }
      } else {
        if (price) {
          await api.createApprovalPriceWorkflow(payload);
        } else {
          await api.createApprovalWorkflow(payload);
        }
      }
      await refresh();
      setOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan workflow approval.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Hapus konfigurasi approval workflow untuk "${label}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      if (price) {
        await api.deleteApprovalPriceWorkflow(id);
      } else {
        await api.deleteApprovalWorkflow(id);
      }
      await refresh();
    } catch (err: any) {
      Swal.fire({
        title: "Gagal Menghapus",
        text: err.message || "Terjadi kesalahan",
        icon: "error",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  const titleText = price ? "Approval Price Workflow" : "Approval Workflow";
  const subtitleText = price
    ? "Konfigurasi urutan approver otorisasi harga per departemen"
    : "Konfigurasi urutan approver per departemen";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs w-full min-w-0 space-y-4">
      <SectionHeader
        title={titleText}
        subtitle={subtitleText}
        action={
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Workflow
          </button>
        }
      />

      {loading ? (
        <div className="p-8 text-center text-slate-400 font-normal text-xs">Memuat data workflow...</div>
      ) : (
        <div className="space-y-4">
          {items.map((wf) => {
            const deptName = wf.departemen_nama || wf.departemen || "-";
            const typeAppName = wf.type_approval_nama || wf.type_approval || "-";
            const stepList = (wf.list_approval || wf.steps || []).map((s: any, idx: number) => ({
              order: s.step_order || s.order || idx + 1,
              name: s.approver_name || s.user_name || s.nama_user || wf.approvers?.[idx] || "Approver",
              role: s.role || `Step ${idx + 1}`,
            }));

            // Fallback jika hanya ada array approvers
            const displaySteps =
              stepList.length > 0
                ? stepList
                : (wf.approvers || []).map((name: string, idx: number) => ({
                    order: idx + 1,
                    name: name,
                    role: `Step ${idx + 1}`,
                  }));

            return (
              <div key={wf.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs transition-all hover:border-slate-300">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {deptName} — <span className="text-blue-600 font-medium">{typeAppName}</span>
                    </p>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      {displaySteps.length} langkah approval berurutan
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={statusBadge(wf.status || "active")}>{wf.status || "active"}</span>
                    <button
                      onClick={() => openEdit(wf)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-white border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(wf.id, `${deptName} - ${typeAppName}`)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 bg-white border border-slate-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {displaySteps.map((step: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-left shadow-xs flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-medium flex items-center justify-center text-[11px] border border-blue-100">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">
                            {step.role || `Langkah ${i + 1}`}
                          </p>
                          <p className="text-xs font-medium text-slate-800">{step.name}</p>
                        </div>
                      </div>
                      {i < displaySteps.length - 1 && (
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                  {displaySteps.length === 0 && (
                    <p className="text-xs text-slate-400 italic font-normal">Belum ada langkah approver ditentukan</p>
                  )}
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700">Belum ada workflow dikonfigurasi</p>
              <p className="text-xs text-slate-400 mt-1 font-normal">
                Klik tombol &quot;Tambah Workflow&quot; di atas untuk mengatur alur persetujuan.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah / Edit Workflow (Lebar Landscape / Horizontal) */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${titleText}` : `Tambah ${titleText}`}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {formError && (
            <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-200">
              {formError}
            </p>
          )}

          {/* Top Form Row: 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Departemen *">
              <SearchableSelect
                options={departemens.map((d) => ({
                  value: d.id,
                  label: d.nama,
                  badge: d.kode,
                }))}
                value={fDeptId}
                onChange={(val) => setFDeptId(val)}
                placeholder="Pilih Departemen"
                searchPlaceholder="Cari nama departemen..."
                disabled={!!editing}
              />
            </FormField>

            <FormField label="Type Approval *">
              <SearchableSelect
                options={filteredTypeApprovals.map((t) => ({
                  value: t.id,
                  label: t.nama,
                  badge: t.kode,
                }))}
                value={fTypeAppId}
                onChange={(val) => setFTypeAppId(val)}
                placeholder={price ? "Pilih Otorisasi Harga" : "Pilih Type Approval"}
                searchPlaceholder={price ? "Cari otorisasi harga..." : "Cari tipe approval..."}
                disabled={!!editing}
              />
            </FormField>

            <FormField label="Status *">
              <select
                className={selectCls}
                value={fStatus}
                onChange={(e) => setFStatus(e.target.value as any)}
              >
                <option value="active">Active (Aktif)</option>
                <option value="inactive">Inactive (Arsip / Nonaktif)</option>
              </select>
            </FormField>
          </div>

          {/* Approver Steps Grid: 2 Columns */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-slate-700 font-semibold text-xs uppercase tracking-wider block">
                  Urutan Langkah Approver *
                </label>
                <span className="text-[11px] text-slate-400 font-normal">
                  Tambahkan personil approver sesuai tahapan hierarki persetujuan
                </span>
              </div>
              <button
                type="button"
                onClick={addApproverStep}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Tambah Langkah
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1 bg-slate-50/50 rounded-2xl border border-slate-200/80">
              {fApprovers.length === 0 && (
                <div className="col-span-full text-center py-8 px-4 border border-dashed border-slate-300 rounded-xl text-xs text-slate-400 font-normal bg-white">
                  Belum ada langkah. Klik <span className="font-semibold text-blue-600">+ Tambah Langkah</span> untuk menambahkan approver.
                </div>
              )}

              {fApprovers.map((approverName, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-2.5 bg-white border border-slate-200 hover:border-blue-200 rounded-xl shadow-2xs transition-all">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <SearchableUserSelect
                      users={users}
                      value={approverName}
                      onChange={(val) => updateApproverStep(idx, val)}
                      placeholder="Cari approver by NPK / Nama..."
                      valueKey="name"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeApproverStep(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus langkah"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Workflow"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
