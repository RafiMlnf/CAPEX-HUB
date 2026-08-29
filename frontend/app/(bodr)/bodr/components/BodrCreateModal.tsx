"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";
import { User, api, BodrProposal, BodrCategory, ApiApprovalWorkflow } from "@/app/lib/api";

interface BodrCreateModalProps {
  currentUser: User | null;
  proposalsCount: number;
  costCenters: any[];
  capexItems: any[];
  approvedCapexProposals: any[];
  workflows?: ApiApprovalWorkflow[];
  onClose: () => void;
  onSuccess: (newProposal: BodrProposal) => void;
}

export default function BodrCreateModal({
  currentUser,
  proposalsCount,
  costCenters,
  capexItems,
  approvedCapexProposals,
  workflows = [],
  onClose,
  onSuccess,
}: BodrCreateModalProps) {
  const [form, setForm] = useState({
    user: currentUser?.name || "",
    department: currentUser?.department || "",
    costCenter: costCenters.length > 0 ? costCenters[0].kode || costCenters[0].kode_cost_center : "",
    kriteria: "FOH" as "FOH" | "CAP" | "GOP",
    title: "",
    startDate: "",
    endDate: "",
    benefit: "",
    capexId: "",
    amountRp: "",
    budgetType: "budget" as "budget" | "unbudget",
    unbudgetRemark: "",
    remarks: "",
    documents: [] as File[],
    namaAsset: "",
    plan: "2301",
    location: "Office" as "Office" | "Plant",
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Smart Auto-Numbering Handler on Enter Keypress for Benefit / Manfaat ──
  const handleBenefitKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;

      // Extract text before and after cursor
      const textBefore = value.substring(0, selectionStart);
      const textAfter = value.substring(selectionEnd);
      const lines = textBefore.split("\n");
      const currentLine = lines[lines.length - 1];

      // Regex matching numbered patterns like "1. ", "2. ", "10. "
      const match = currentLine.match(/^(\s*)(\d+)\.\s*(.*)$/);

      if (match) {
        e.preventDefault();
        const indent = match[1];
        const currentNum = parseInt(match[2], 10);
        const itemContent = match[3].trim();

        if (itemContent === "") {
          // If user presses enter on an empty number (e.g. "2. "), clear the number
          const updatedBefore = lines.slice(0, -1).join("\n") + (lines.length > 1 ? "\n" : "");
          const newValue = updatedBefore + textAfter;
          setForm((prev) => ({ ...prev, benefit: newValue }));

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = updatedBefore.length;
          }, 0);
        } else {
          // Auto increment number (e.g. "1. " -> "2. ")
          const nextNum = currentNum + 1;
          const insertText = `\n${indent}${nextNum}. `;
          const newValue = textBefore + insertText + textAfter;
          const nextCursor = selectionStart + insertText.length;

          setForm((prev) => ({ ...prev, benefit: newValue }));

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = nextCursor;
          }, 0);
        }
      }
    }
  };

  // ── Smart Auto-Numbering Handler for Unbudget Remarks ──────────────────────
  const handleUnbudgetKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;

      const textBefore = value.substring(0, selectionStart);
      const textAfter = value.substring(selectionEnd);
      const lines = textBefore.split("\n");
      const currentLine = lines[lines.length - 1];

      const match = currentLine.match(/^(\s*)(\d+)\.\s*(.*)$/);

      if (match) {
        e.preventDefault();
        const indent = match[1];
        const currentNum = parseInt(match[2], 10);
        const itemContent = match[3].trim();

        if (itemContent === "") {
          const updatedBefore = lines.slice(0, -1).join("\n") + (lines.length > 1 ? "\n" : "");
          const newValue = updatedBefore + textAfter;
          setForm((prev) => ({ ...prev, unbudgetRemark: newValue }));

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = updatedBefore.length;
          }, 0);
        } else {
          const nextNum = currentNum + 1;
          const insertText = `\n${indent}${nextNum}. `;
          const newValue = textBefore + insertText + textAfter;
          const nextCursor = selectionStart + insertText.length;

          setForm((prev) => ({ ...prev, unbudgetRemark: newValue }));

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = nextCursor;
          }, 0);
        }
      }
    }
  };

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

    const combinedNotes =
      form.budgetType === "unbudget"
        ? form.unbudgetRemark + (form.remarks ? ` | Remarks: ${form.remarks}` : "")
        : form.remarks;

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
        status: "Pending Review",
        date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        notes: combinedNotes,
        proposer: form.user,
        benefit: form.benefit,
        capex_id: form.capexId || "-",
        no_asset: noAsset,
        cost_center: form.costCenter,
        start_date: form.startDate,
        end_date: form.endDate,
        budget_type: form.budgetType,
        budget_remarks: form.unbudgetRemark,
        nama_asset: form.namaAsset,
        plan: form.plan,
        location: form.location,
        documents: uploadedDocUrls,
      };

      const created = await api.createBodrProposal(newBodr);

      const nextProposal: BodrProposal = {
        id: created?.id || nextId,
        bodrNo: created?.bodr_no || nextBodrNo,
        title: created?.title || form.title,
        category: (created?.category || category) as BodrCategory,
        department: created?.department || form.department,
        amount: Number(created?.amount) || amount,
        step: created?.step || "Step 1",
        status: created?.status || "Pending Review",
        date: created?.date || newBodr.date,
        notes: created?.notes || combinedNotes,
        proposer: created?.proposer || form.user,
        benefit: created?.benefit || form.benefit,
        capexId: created?.capex_id || form.capexId || "-",
        noAsset: created?.no_asset || noAsset,
        costCenter: created?.cost_center || form.costCenter || "-",
        startDate: created?.start_date || form.startDate || "-",
        endDate: created?.end_date || form.endDate || "-",
        budgetType: (created?.budget_type as "budget" | "unbudget") || form.budgetType,
        namaAsset: created?.nama_asset || form.namaAsset || "-",
        plan: created?.plan || form.plan || "-",
        location: created?.location || form.location || "-",
        assetType: created?.asset_type || "",
        approvalHistory: created?.approval_history || [],
        documents: created?.documents || uploadedDocUrls,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-800 flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">BODR Resolution</h3>
            <p className="text-[11px] text-slate-500 font-normal">Formulir Pengajuan Usulan Anggaran Budget Over Design Review</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Container (2-Column Grid Layout) */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── KOLOM KIRI: INFORMASI PENGAJU & DETAIL INVESTASI ────────────── */}
            <div className="lg:col-span-6 space-y-4">
              {/* Card 1: Informasi Pengaju */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Informasi Pengaju</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">User</label>
                    <div className="px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold">
                      {form.user || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Department</label>
                    <div className="px-3.5 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold">
                      {form.department || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Informasi Umum Investasi */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Informasi Investasi</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Cost Center *</label>
                    <select
                      required
                      value={form.costCenter}
                      onChange={(e) => setForm({ ...form, costCenter: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                    >
                      <option value="">Pilih Cost Center...</option>
                      {costCenters.map((cc) => (
                        <option key={cc.id} value={cc.kode || cc.kode_cost_center}>
                          {cc.kode || cc.kode_cost_center} - {cc.nama || cc.nama_cost_center}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kriteria BODR (Dropdown Select Standard Sesuai Permintaan) */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Kriteria BODR *</label>
                    <select
                      required
                      value={form.kriteria}
                      onChange={(e) => setForm({ ...form, kriteria: e.target.value as "FOH" | "CAP" | "GOP" })}
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-semibold"
                    >
                      <option value="FOH">FOH</option>
                      <option value="CAP">CAPEX (CAP)</option>
                      <option value="GOP">GOP</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Judul Investasi *</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
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
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                    />
                  </div>

                  {/* Benefit / Manfaat (Penomoran Otomatis saat Enter & Poin Terstruktur) */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Benefit / Manfaat *</label>
                    <textarea
                      required
                      rows={4}
                      value={form.benefit}
                      onChange={(e) => setForm({ ...form, benefit: e.target.value })}
                      onKeyDown={handleBenefitKeyDown}
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal resize-none leading-relaxed"
                      placeholder={`1. Meningkatkan kapasitas dan efisiensi produksi\n2. Mengurangi tingkat downtime operasional mesin\n3. Penghematan biaya perawatan tahunan`}
                    />
                    <p className="text-[9px] text-slate-400">
                      Tekan <span className="font-semibold text-slate-600">Enter</span> untuk melanjutkan penomoran baris berikutnya secara otomatis.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── KOLOM KANAN: DETAIL ANGGARAN, MASTER ASET & DOKUMEN ──────────── */}
            <div className="lg:col-span-6 space-y-4">
              {/* Card 3: Detail Anggaran */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Detail Anggaran</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Kondisional Khusus CAPEX Box */}
                  {form.kriteria === "CAP" && (
                    <div className="col-span-2 space-y-3 p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                      <div>
                        <label className="text-[10px] font-semibold text-blue-900 uppercase tracking-wider block mb-1">
                          ID Capex (Data Master CAPEX Approved) *
                        </label>
                        <select
                          required={form.kriteria === "CAP"}
                          value={form.capexId}
                          onChange={(e) => setForm({ ...form, capexId: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-blue-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                        >
                          <option value="">Pilih ID Capex Terkait...</option>
                          {approvedCapexProposals.map((cp) => (
                            <option key={cp.id} value={cp.id}>
                              {cp.id} - {cp.name} (Pagu: Rp {Number(cp.estimatedCost || 0).toLocaleString("id-ID")})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-blue-900 uppercase tracking-wider block mb-1">
                          Amount Available (Sisa Dana Capex)
                        </label>
                        <div className="px-3.5 py-2 rounded-lg bg-white border border-blue-200 text-emerald-700 text-xs font-mono font-bold">
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
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                      Nilai Investasi (Amount IDR) *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.amountRp}
                      onChange={(e) => {
                        const num = e.target.value.replace(/\D/g, "");
                        setForm({ ...form, amountRp: num ? Number(num).toLocaleString("id-ID") : "" });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-mono font-bold"
                      placeholder="Contoh: 50.000.000"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                      Category *
                    </label>
                    <select
                      value={form.budgetType}
                      onChange={(e) => setForm({ ...form, budgetType: e.target.value as "budget" | "unbudget" })}
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                    >
                      <option value="budget">Budget</option>
                      <option value="unbudget">Unbudget</option>
                    </select>
                  </div>

                  {/* Pengisian Keterangan Alokasi Budget (Unbudget) dengan Format Penomoran / Enter Otomatis */}
                  {form.budgetType === "unbudget" && (
                    <div className="col-span-2 space-y-1.5 p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl">
                      <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                        Pengisian Keterangan Alokasi Budget (Unbudget) *
                      </label>
                      <textarea
                        required={form.budgetType === "unbudget"}
                        rows={3}
                        value={form.unbudgetRemark}
                        onChange={(e) => setForm({ ...form, unbudgetRemark: e.target.value })}
                        onKeyDown={handleUnbudgetKeyDown}
                        className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-amber-300 text-slate-800 focus:border-amber-600 text-xs font-normal resize-none leading-relaxed"
                        placeholder={`1. Alasan kebutuhan investasi di luar pagu alokasi (Unbudget)\n2. Penjelasan sumber pergeseran / pos anggaran terkait (jika ada)\n3. Dampak operasional apabila usulan tidak direalisasikan`}
                      />
                      <p className="text-[9px] text-amber-800 font-medium">
                        Wajib diisi dengan format penjelasan/poin terstruktur. Tekan <span className="font-bold">Enter</span> untuk penomoran otomatis.
                      </p>
                    </div>
                  )}

                  <div className="col-span-2">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                      Remarks (Catatan Tambahan)
                    </label>
                    <input
                      type="text"
                      value={form.remarks}
                      onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-white border-slate-200 text-slate-800 focus:border-blue-600 text-xs font-normal"
                      placeholder="Catatan tambahan bila ada..."
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Asset Master Data (Khusus jika Kriteria CAP) */}
              {form.kriteria === "CAP" && (
                <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      Asset Master Data (Khusus Kriteria CAP)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-3">
                      <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                        Nama Asset *
                      </label>
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
                      <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                        Plan (Terkunci)
                      </label>
                      <input
                        type="text"
                        value="2301"
                        readOnly
                        className="w-full px-3.5 py-2.5 rounded-lg border outline-none bg-slate-100 border-slate-200 text-slate-600 text-xs font-mono font-semibold cursor-not-allowed"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                        Location *
                      </label>
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

              {/* Card 5: Dokumen Lampiran */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      Dokumen Lampiran
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-semibold">
                    {form.documents.length}/50 file
                  </span>
                </div>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setForm((prev) => ({ ...prev, documents: [...prev.documents, ...files].slice(0, 50) }));
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <p className="text-[9px] text-slate-400">
                  Format didukung: PDF, Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), Gambar
                </p>

                {form.documents.length > 0 && (
                  <div className="mt-1.5 space-y-1 max-h-28 overflow-y-auto">
                    {form.documents.map((f, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs">
                        <span className="truncate max-w-xs text-[11px] font-medium text-slate-700">
                          {idx + 1}. {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, documents: p.documents.filter((_, i) => i !== idx) }))}
                          className="text-red-500 hover:text-red-700 font-bold text-xs cursor-pointer ml-2"
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

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider shadow-2xs disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
            >
              {submitting ? "Menyimpan..." : "Simpan Pengajuan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
