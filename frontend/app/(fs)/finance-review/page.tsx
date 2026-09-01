"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarFS";
import Header from "../../components/Header";
import StatusBadge from "../../components/StatusBadge";
import { useCapex } from "../../context/CapexContext";
import { CapexProposal, GateStatus, api } from "../../lib/api";
import { getCurrentUser } from "../../lib/authApi";
import { formatDateDisplay } from "../../lib/dateUtils";

export default function FinanceReviewPage() {
  const { proposals, hasPermission, editProposal } = useCapex();
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<GateStatus | "">("Gate 2 - Committee Review");
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [notes, setNotes] = useState("");

  // Finance edit state
  const [isEditingData, setIsEditingData] = useState(false);
  const [editPurpose, setEditPurpose] = useState("");
  const [editInvestmentType, setEditInvestmentType] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  // Finance FS Attachment state
  const [financeAttachment, setFinanceAttachment] = useState<string>("");
  const [uploadingFs, setUploadingFs] = useState(false);

  const canAccess = hasPermission("perm_review_capex");

  const investmentTypesMap: Record<string, string[]> = {
    Capacity: ["Capacity Up", "New Product Expansion"],
    Capability: [
      "Increase Value Added",
      "Increase Competency",
      "Restore Capacity",
    ],
    Supporting: ["Supporting"],
  };

  if (!canAccess) {
    return (
      <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800 flex-col items-center justify-center p-8">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mx-auto text-red-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-base font-semibold text-slate-800 uppercase tracking-wide">Akses Ditolak</h1>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Halaman ini hanya dapat diakses oleh pengguna dengan izin <span className="font-semibold">Finance Review</span>.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer w-full text-center mt-2"
          >
            Kembali ke Portal Utama
          </a>
        </div>
      </div>
    );
  }

  // Filter proposals waiting for Finance Review
  const pendingProposals = proposals.filter(
    (p) =>
      p.gateStatus === "Gate 1 - Finance Review" ||
      p.gateStatus === "Gate 1 - Pending User Feedback" ||
      p.gateStatus === "Gate 1 - Revise"
  );

  const selectedProposal = proposals.find((p) => p.id === selectedProposalId);

  const calculateLeadTime = (createdAt?: string) => {
    if (!createdAt) return "0 Hari";
    const start = new Date(createdAt).getTime();
    const now = Date.now();
    const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    return `${diffDays} Hari`;
  };

  const calculateProjectDuration = (start?: string, end?: string) => {
    if (!start || !end || start === "-" || end === "-") return "-";
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (isNaN(s) || isNaN(e) || e < s) return "-";
    const days = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
    const months = (days / 30).toFixed(1);
    return `${days} Hari (~${months} Bulan)`;
  };

  const handleSelectProposal = (p: CapexProposal) => {
    setSelectedProposalId(p.id);
    setDecisionStatus("Gate 2 - Committee Review");
    setNotes("");
    const defaultDateStr = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16);
    setScheduleDateTime(p.committeeReviewSchedule ? p.committeeReviewSchedule.slice(0, 16) : defaultDateStr);

    // Initial edit states
    setEditPurpose(p.purpose || "Capacity");
    setEditInvestmentType(p.investmentType || "Capacity Up");
    setEditStartDate(p.startDate || "");
    setEditEndDate(p.endDate || "");
    setFinanceAttachment(p.financeAttachmentName || "");
    setIsEditingData(false);
  };

  const handleEditPurposeChange = (val: string) => {
    setEditPurpose(val);
    if (val === "Supporting") {
      setEditInvestmentType("Supporting");
    } else {
      const available = investmentTypesMap[val] || [];
      setEditInvestmentType(available[0] || "");
    }
  };

  const handleSaveProjectDetails = async () => {
    if (!selectedProposal) return;
    try {
      await editProposal(selectedProposal.id, {
        purpose: editPurpose,
        investmentType: editInvestmentType,
        startDate: editStartDate,
        endDate: editEndDate,
      });
      Swal.fire({
        title: "Data Disimpan",
        text: "Detail Purpose, Investment Type, dan Tanggal Proyek berhasil diperbarui oleh Finance.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      setIsEditingData(false);
    } catch (err: any) {
      Swal.fire({
        title: "Gagal Menyimpan",
        text: err.message || "Gagal memperbarui data proyek.",
        icon: "error",
      });
    }
  };

  const handleFsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFs(true);
      const res = await api.uploadDocument(file);
      setFinanceAttachment(res.file_name || file.name);
      Swal.fire({
        title: "Dokumen FS Terunggah",
        text: `Lampiran perhitungan FS "${file.name}" berhasil diunggah.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        title: "Gagal Mengunggah",
        text: err.message || "Gagal mengunggah file perhitungan FS.",
        icon: "error",
      });
    } finally {
      setUploadingFs(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProposal) return;

    if (!decisionStatus) {
      Swal.fire({
        icon: "warning",
        title: "Pilihan Diperlukan",
        text: "Silakan pilih Keputusan Status Review terlebih dahulu.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const effectiveNotes = notes.trim() || (
      decisionStatus === "Gate 2 - Committee Review"
        ? "Disetujui oleh Finance untuk diteruskan ke Committee Review."
        : decisionStatus === "Gate 1 - Pending User Feedback"
        ? "Menunggu kelengkapan dokumen pendukung tambahan dari pemohon."
        : "Usulan dikembalikan untuk revisi."
    );

    const now = new Date().toISOString();
    const effectiveSchedule = decisionStatus === "Gate 2 - Committee Review" ? scheduleDateTime : undefined;

    let actionLabel = "";
    if (decisionStatus === "Gate 0 - Idea") {
      actionLabel = "Draft (Revise oleh Finance)";
    } else if (decisionStatus === "Gate 1 - Pending User Feedback") {
      actionLabel = "Pending (Butuh File Pendukung)";
    } else if (decisionStatus === "Gate 2 - Committee Review") {
      actionLabel = `Disetujui ke Komite - Jadwal: ${effectiveSchedule || now}`;
    }

    const user = getCurrentUser();
    const reviewerName = user?.name || "Staff Accounting & Finance";

    const currentPurpose = isEditingData ? editPurpose : (selectedProposal.purpose || editPurpose);
    const isSupporting = currentPurpose === "Supporting";

    const updatedData: Partial<CapexProposal> = {
      gateStatus: decisionStatus,
      financeNotes: effectiveNotes,
      financeApprovedBy: reviewerName,
      financeApprovedAt: now,
      financeAttachmentName: isSupporting ? undefined : financeAttachment || undefined,
      purpose: editPurpose || selectedProposal.purpose,
      investmentType: editInvestmentType || selectedProposal.investmentType,
      startDate: editStartDate || selectedProposal.startDate,
      endDate: editEndDate || selectedProposal.endDate,
      committeeNotes: decisionStatus === "Gate 2 - Committee Review" ? "" : (selectedProposal.committeeNotes || undefined),
      committeeReviewSchedule: effectiveSchedule,
      revisionSource: decisionStatus === "Gate 0 - Idea" ? "Finance" : undefined,
      history: [
        ...selectedProposal.history,
        {
          gate: 1,
          action: actionLabel,
          actor: reviewerName,
          timestamp: now,
          notes: effectiveNotes,
        },
      ],
    };

    try {
      await editProposal(selectedProposal.id, updatedData);
      Swal.fire({
        title: "Keputusan Disimpan!",
        text: decisionStatus === "Gate 2 - Committee Review"
          ? `Usulan ${selectedProposal.capexId || selectedProposal.name} berhasil disetujui dan diteruskan ke menu Komite Review.`
          : `Usulan ${selectedProposal.capexId || selectedProposal.name} berhasil diperbarui.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      setSelectedProposalId(null);
      setNotes("");
    } catch (err: any) {
      console.error("Submit finance review error:", err);
      Swal.fire({
        title: "Gagal Menyimpan",
        text: err.message || "Gagal menyimpan keputusan review ke server.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const getAttachmentsList = (proposal: CapexProposal) => {
    const raw = proposal.attachmentName || proposal.initialAttachmentName || "";
    return raw
      .split(", ")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const isSupportingPurpose =
    (isEditingData ? editPurpose : selectedProposal?.purpose) === "Supporting";

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen ml-64 bg-slate-100 min-w-0 overflow-hidden">
        <Header
          title="FinAcct Review & Feasibility Study (Gate 1)"
          subtitle="Proses peninjauan proposal investasi, verifikasi kelayakan (Feasibility Study), dan penyesuaian detail oleh Tim Finance"
        />

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 w-full min-w-0 overflow-x-hidden">
          <div className={`grid grid-cols-1 ${selectedProposal ? "lg:grid-cols-2" : "grid-cols-1"} gap-4 items-start`}>
            {/* Left Box: Daftar Pengajuan */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 w-full">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-3.5 bg-blue-600 rounded-full" />
                  <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    DAFTAR PENGAJUAN MENUNGGU FINANCE REVIEW ({pendingProposals.length})
                  </h2>
                </div>
              </div>

              {pendingProposals.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-12">
                  Tidak ada pengajuan investasi baru yang menunggu Finance Review.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase text-[9.5px] font-semibold tracking-wider select-none">
                        <th className="py-2.5 px-3">ID CAPEX</th>
                        <th className="py-2.5 px-3">PROJECT NAME</th>
                        <th className="py-2.5 px-3">PIC</th>
                        <th className="py-2.5 px-3">LEADTIME</th>
                        <th className="py-2.5 px-3 text-right">COST</th>
                        <th className="py-2.5 px-3 text-center">STATUS</th>
                        <th className="py-2.5 px-3 text-center">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                      {pendingProposals.map((p) => {
                        const isSelected = selectedProposalId === p.id;
                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-blue-50/30 transition-colors ${
                              isSelected ? "bg-blue-50/50 font-medium" : "bg-white"
                            }`}
                          >
                            <td className="py-3 px-3 font-mono font-medium text-slate-800 text-[11px]">
                              {p.capexId && p.capexId !== "-" ? p.capexId : "-"}
                            </td>
                            <td className="py-3 px-3 text-slate-800 font-medium truncate max-w-[130px]" title={p.name}>
                              {p.name}
                            </td>
                            <td className="py-3 px-3 text-slate-600 truncate max-w-[90px]" title={p.pic}>
                              {p.pic}
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                ⏱️ {calculateLeadTime(p.createdAt)}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-right whitespace-nowrap">
                              <span className="text-[10px] text-slate-400 mr-1">Rp</span>
                              <span className="font-semibold text-slate-800">
                                {p.estimatedCost.toLocaleString("id-ID")}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                FinAcct Review
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleSelectProposal(p)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                              >
                                Pilih
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Box: Ulasan & Keputusan Review */}
            {selectedProposal && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4 w-full animate-in fade-in-50 duration-200">
                {/* Header with Close */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-blue-600 rounded-full" />
                    <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      ULASAN & KEPUTUSAN REVIEW: {selectedProposal.capexId && selectedProposal.capexId !== "-" ? selectedProposal.capexId : selectedProposal.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProposalId(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Summary & Edit Section */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 text-[11px] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      DATA USULAN INVESTASI
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingData(!isEditingData)}
                      className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10.5px] font-semibold transition-all cursor-pointer"
                    >
                      {isEditingData ? "Batal Edit" : "✏️ Edit by Finance"}
                    </button>
                  </div>

                  {isEditingData ? (
                    /* Finance Edit Form (Purpose, Investment Type, Start Date, End Date) */
                    <div className="space-y-3 bg-white p-3 rounded-lg border border-blue-200 shadow-2xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Purpose <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={editPurpose}
                            onChange={(e) => handleEditPurposeChange(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-blue-600 bg-white text-slate-800"
                          >
                            <option value="Capacity">Capacity</option>
                            <option value="Capability">Capability</option>
                            <option value="Supporting">Supporting</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Investment Type <span className="text-red-500">*</span>
                          </label>
                          {editPurpose === "Supporting" ? (
                            <input
                              type="text"
                              readOnly
                              value="Supporting"
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed"
                            />
                          ) : (
                            <select
                              value={editInvestmentType}
                              onChange={(e) => setEditInvestmentType(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-blue-600 bg-white text-slate-800"
                            >
                              {(investmentTypesMap[editPurpose] || []).map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-blue-600 bg-white text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                            End Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 outline-none focus:border-blue-600 bg-white text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleSaveProjectDetails}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Read-Only Summary Details */
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div className="space-y-2.5">
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">PROJECT NAME</span>
                          <span className="font-semibold text-slate-800 text-xs">{selectedProposal.name}</span>
                        </div>
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">DEPARTEMEN</span>
                          <span className="text-slate-700 font-medium">{selectedProposal.department || "-"}</span>
                        </div>
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">PURPOSE / TYPE</span>
                          <span className="text-slate-700 font-medium">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 mr-1 font-semibold">
                              {selectedProposal.purpose || "-"}
                            </span>
                            / {selectedProposal.investmentType || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">DURASI PROYEK</span>
                          <span className="text-slate-700 font-medium">
                            {selectedProposal.startDate && selectedProposal.endDate && selectedProposal.startDate !== "-" && selectedProposal.endDate !== "-"
                              ? `${selectedProposal.startDate.slice(0, 10)} s/d ${selectedProposal.endDate.slice(0, 10)} (${calculateProjectDuration(selectedProposal.startDate, selectedProposal.endDate)})`
                              : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">BENEFIT</span>
                          <span className="text-slate-700 font-medium">{selectedProposal.description || "-"}</span>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-2.5">
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">PIC PENGAJU</span>
                          <span className="text-slate-700 font-medium">{selectedProposal.pic || "-"}</span>
                        </div>
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">LEADTIME PENGAJUAN</span>
                          <span className="text-slate-700 font-medium">
                            ⏱️ {calculateLeadTime(selectedProposal.createdAt)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">ESTIMASI COST</span>
                          <span className="text-blue-600 font-bold text-xs font-mono">
                            Rp {selectedProposal.estimatedCost.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">LAMPIRAN PENGAJU</span>
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {getAttachmentsList(selectedProposal).length === 0 ? (
                              <span className="text-slate-400 italic">Tidak ada lampiran</span>
                            ) : (
                              getAttachmentsList(selectedProposal).map((f, idx) => (
                                <a
                                  key={idx}
                                  href={api.getUploadFileUrl(f)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline font-medium text-[11px]"
                                >
                                  <span>📄 {f}</span>
                                </a>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Controls */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Decision Boxes */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      KEPUTUSAN STATUS REVIEW <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {/* 1. APPROVAL */}
                      <button
                        type="button"
                        onClick={() => setDecisionStatus("Gate 2 - Committee Review")}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          decisionStatus === "Gate 2 - Committee Review"
                            ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <span className="text-[11px] font-bold text-emerald-700 block">1. APPROVAL</span>
                        <span className="text-[9.5px] text-slate-500 block leading-tight">Approve & Jadwalkan Komite</span>
                      </button>

                      {/* 2. PENDING */}
                      <button
                        type="button"
                        onClick={() => setDecisionStatus("Gate 1 - Pending User Feedback")}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          decisionStatus === "Gate 1 - Pending User Feedback"
                            ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <span className="text-[11px] font-bold text-amber-700 block">2. PENDING</span>
                        <span className="text-[9.5px] text-slate-500 block leading-tight">Butuh dokumen tambahan</span>
                      </button>

                      {/* 3. REVISE */}
                      <button
                        type="button"
                        onClick={() => setDecisionStatus("Gate 0 - Idea")}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          decisionStatus === "Gate 0 - Idea"
                            ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <span className="text-[11px] font-bold text-rose-700 block">3. REVISE</span>
                        <span className="text-[9.5px] text-slate-500 block leading-tight">Kembalikan ke Draft</span>
                      </button>
                    </div>
                  </div>

                  {/* Attachment FS by Finance (Upload Perhitungan FS) */}
                  {isSupportingPurpose ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 flex items-center gap-2">
                      <span className="text-blue-600 text-sm">ℹ️</span>
                      <span>
                        <strong>Purpose Supporting (Non-FS):</strong> Dokumen perhitungan Feasibility Study (FS) tidak diwajibkan untuk diunggah oleh Finance.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                        UPLOAD LAMPIRAN PERHITUNGAN FS (FINANCE)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs">
                          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>{uploadingFs ? "Mengunggah..." : "Pilih File Perhitungan FS"}</span>
                          <input
                            type="file"
                            onChange={handleFsFileUpload}
                            className="hidden"
                            accept=".xlsx,.xls,.pdf,.doc,.docx"
                            disabled={uploadingFs}
                          />
                        </label>
                        {financeAttachment ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                            📄 {financeAttachment}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Belum ada file perhitungan FS yang diunggah
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Schedule if Approval */}
                  {decisionStatus === "Gate 2 - Committee Review" && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        JADWAL REVIEW KOMITE <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduleDateTime}
                        onChange={(e) => setScheduleDateTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-blue-600 bg-white text-slate-800"
                        required
                      />
                    </div>
                  )}

                  {/* Notes Textarea */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      CATATAN / ULASAN FINANCE
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Masukkan ulasan kelayakan FS atau revisi yang diperlukan..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-blue-600 bg-white text-slate-800 placeholder:text-slate-400 resize-none font-normal"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedProposalId(null)}
                      className="px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      Simpan Keputusan Review
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
