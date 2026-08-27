"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";
import { User, api, BodrProposal, BodrCategory } from "@/app/lib/api";

interface BodrCreateModalProps {
  currentUser: User | null;
  proposalsCount: number;
  costCenters: any[];
  capexItems: any[];
  approvedCapexProposals: any[];
  onClose: () => void;
  onSuccess: (newProposal: BodrProposal) => void;
}

export default function BodrCreateModal({
  currentUser,
  proposalsCount,
  costCenters,
  capexItems,
  approvedCapexProposals,
  onClose,
  onSuccess,
}: BodrCreateModalProps) {
  const [form, setForm] = useState({
    user: currentUser?.name || "",
    department: currentUser?.department || "",
    costCenter: costCenters.length > 0 ? costCenters[0].kode : "",
    kriteria: "FOH" as "FOH" | "CAP" | "GOP",
    title: "",
    startDate: "",
    endDate: "",
    benefit: "",
    capexId: "",
    amountRp: "",
    budgetType: "budget" as "budget" | "unbudget",
    budgetRemark: "",
    documents: [] as File[],
    namaAsset: "",
    plan: "2301",
    location: "Office" as "Office" | "Plant",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const nextId = `BODR-2026-${String(proposalsCount + 1).padStart(3, "0")}`;
    const nextBodrNo = `BODR/MTM/2026/${String(proposalsCount + 1).padStart(3, "0")}`;
    const category = form.kriteria === "CAP" ? "CAPEX" : form.kriteria === "FOH" ? "FOH" : "GOP";
    const amount = Number(form.amountRp.replace(/\D/g, ""));
    const noAsset = form.namaAsset
      ? `AST-${new Date().getFullYear()}-${String(proposalsCount + 100).padStart(3, "0")}`
      : "-";

    try {
      let uploadedDocUrls: string[] = [];
      if (form.documents && form.documents.length > 0) {
        const uploadRes = await api.uploadMultipleDocuments(form.documents);
        uploadedDocUrls = uploadRes.map((r) => r.url);
      }

      const newBodr = {
        id: nextId,
        bodr_no: nextBodrNo,
        title: form.title,
        category,
        department: form.department,
        amount,
        step: "Approval Dept",
        status: "Pending Review",
        date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        notes: form.budgetRemark,
        proposer: form.user,
        benefit: form.benefit,
        capex_id: form.capexId || "-",
        no_asset: noAsset,
        documents: uploadedDocUrls,
      };

      await api.createBodrProposal(newBodr);

      const nextProposal: BodrProposal = {
        id: nextId,
        bodrNo: nextBodrNo,
        title: form.title,
        category: category as BodrCategory,
        department: form.department,
        amount,
        step: "Approval Dept",
        status: "Pending Review",
        date: newBodr.date,
        notes: form.budgetRemark,
        proposer: form.user,
        benefit: form.benefit,
        capexId: form.capexId || "-",
        noAsset,
        costCenter: form.costCenter || "-",
        startDate: form.startDate || "-",
        endDate: form.endDate || "-",
        budgetType: form.budgetType,
        namaAsset: form.namaAsset || "-",
        plan: form.plan || "-",
        location: form.location || "-",
        assetType: "",
        approvalHistory: [],
        documents: uploadedDocUrls,
      };

      onSuccess(nextProposal);
    } catch (err) {
      console.error("Failed to create BODR:", err);
      Swal.fire({
        title: "Gagal",
        text: "Gagal membuat pengajuan BODR.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden text-slate-800">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 uppercase tracking-wider">BODR Resolution</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[80vh] bg-white">
          <div className="p-6 space-y-5">
            {/* User Info */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5">Informasi Pengaju</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">User</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-800 font-medium text-xs">{form.user}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Department</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-800 font-medium text-xs">{form.department}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* General Info */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5">Informasi Umum</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Cost Center *</label>
                  <select
                    required
                    value={form.costCenter}
                    onChange={(e) => setForm({ ...form, costCenter: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                  >
                    <option value="">Pilih Cost Center...</option>
                    {costCenters.map((cc) => (
                      <option key={cc.id} value={cc.kode}>
                        {cc.kode} - {cc.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Kriteria BODR *</label>
                  <div className="flex gap-2">
                    {(["FOH", "CAP", "GOP"] as const).map((k) => (
                      <label
                        key={k}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer transition-all flex-1 justify-center ${
                          form.kriteria === k
                            ? "bg-blue-600 border-blue-600 text-white font-semibold shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-normal"
                        }`}
                      >
                        <input
                          type="radio"
                          name="kriteria"
                          value={k}
                          checked={form.kriteria === k}
                          onChange={() => setForm({ ...form, kriteria: k })}
                          className="hidden"
                        />
                        <span className="text-[10px]">{k === "CAP" ? "CAPEX" : k}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Judul Investasi *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                    placeholder="Contoh: Pengadaan Mesin CNC Milling Baru"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Benefit / Manfaat *</label>
                  <textarea
                    required
                    rows={2}
                    value={form.benefit}
                    onChange={(e) => setForm({ ...form, benefit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal resize-none"
                    placeholder="Jelaskan justifikasi dan manfaat investasi..."
                  />
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1.5">Detail Anggaran</p>
              <div className="grid grid-cols-2 gap-4">
                {form.kriteria === "CAP" && (
                  <div className="col-span-2 space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">ID Capex (Data Master CAPEX Approved) *</label>
                      <select
                        required={form.kriteria === "CAP"}
                        value={form.capexId}
                        onChange={(e) => setForm({ ...form, capexId: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                      >
                        <option value="">Pilih ID Capex Terkait</option>
                        {approvedCapexProposals.map((cp) => (
                          <option key={cp.id} value={cp.id}>
                            {cp.id} - {cp.name} (Pagu: Rp {Number(cp.estimatedCost || 0).toLocaleString("id-ID")})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount Available (Otomatis ambil sisa dana) */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Amount Available (Sisa Dana Capex)</label>
                      <div className="px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-mono font-semibold">
                        {(() => {
                          const selected = approvedCapexProposals.find((c) => c.id === form.capexId);
                          if (!selected) return "Pilih Capex untuk melihat sisa dana";
                          const avail = Number(selected.estimatedCost || 0) - Number(selected.actualSpent || 0);
                          return `Rp ${Math.max(0, avail).toLocaleString("id-ID")}`;
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Nilai Investasi (Amount IDR) *</label>
                  <input
                    type="text"
                    required
                    value={form.amountRp}
                    onChange={(e) => {
                      const num = e.target.value.replace(/\D/g, "");
                      setForm({ ...form, amountRp: num ? Number(num).toLocaleString("id-ID") : "" });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-mono font-semibold"
                    placeholder="Contoh: 50.000.000"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Category *</label>
                  <select
                    value={form.budgetType}
                    onChange={(e) => setForm({ ...form, budgetType: e.target.value as "budget" | "unbudget" })}
                    className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                  >
                    <option value="budget">Budget</option>
                    <option value="unbudget">Unbudget</option>
                  </select>
                </div>

                {form.budgetType === "unbudget" && (
                  <div className="col-span-2">
                    <label className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider block mb-1">Pengisian Keterangan Alokasi Budget (Unbudget) *</label>
                    <input
                      type="text"
                      required={form.budgetType === "unbudget"}
                      value={form.budgetRemark}
                      onChange={(e) => setForm({ ...form, budgetRemark: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-amber-50/60 border-amber-200 text-slate-800 focus:border-amber-600 text-xs font-normal"
                      placeholder="Jelaskan alasan dan justifikasi alokasi unbudget..."
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Remarks (Catatan Tambahan)</label>
                  <input
                    type="text"
                    value={form.budgetRemark}
                    onChange={(e) => setForm({ ...form, budgetRemark: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                    placeholder="Catatan tambahan bila ada..."
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Document (Attachment Maks. 50 File)</label>
                    <span className="text-[10px] text-slate-400 font-mono">{form.documents.length}/50 file</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      setForm((prev) => ({ ...prev, documents: [...prev.documents, ...files].slice(0, 50) }));
                    }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Format didukung: PDF, Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx)</p>
                  {form.documents.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
                      {form.documents.map((f, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded text-xs">
                          <span className="truncate max-w-sm">{idx + 1}. {f.name}</span>
                          <button
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, documents: p.documents.filter((_, i) => i !== idx) }))}
                            className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Asset Master Data for CAPEX */}
            {form.kriteria === "CAP" && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-1.5">Asset Master Data (Khusus Kriteria CAP)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Nama Asset *</label>
                    <input
                      type="text"
                      required={form.kriteria === "CAP"}
                      value={form.namaAsset}
                      onChange={(e) => setForm({ ...form, namaAsset: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                      placeholder="Contoh: Mesin Press 200 Ton Line 3"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Plan (Terkunci)</label>
                    <input
                      type="text"
                      value="2301"
                      readOnly
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-slate-100 border-slate-200 text-slate-600 text-xs font-mono font-semibold cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Location *</label>
                    <select
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value as "Office" | "Plant" })}
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                    >
                      <option value="Office">Office</option>
                      <option value="Plant">Plant / Pabrik</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-[10px] uppercase cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-[10px] uppercase shadow-2xs disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
            >
              {submitting ? "Menyimpan..." : "Simpan Pengajuan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
