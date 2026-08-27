"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarFS";
import Header from "../../components/Header";
import StatusBadge from "../../components/StatusBadge";
import { useCapex } from "../../context/CapexContext";
import { CapexProposal, GateStatus, api } from "../../lib/api";

function formatDateDisplay(dateStr?: string) {
  if (!dateStr || dateStr === "-" || dateStr.trim() === "") return "-";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export default function FinanceReviewPage() {
  const { proposals, hasPermission, editProposal } = useCapex();
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<GateStatus>("Gate 2 - Committee Review");
  const [scheduleTime, setScheduleTime] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Editable fields by Finance (Purpose, Investment Type, Start Date, End Date)
  const [editPurpose, setEditPurpose] = useState("Capacity");
  const [editInvestmentType, setEditInvestmentType] = useState("Capacity Up");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });
  const [alertConfig, setAlertConfig] = useState<{ show: boolean; title?: string; message: string }>({
    show: false,
    message: "",
  });

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  };

  const showAlert = (message: string, title: string = "Notifikasi") => {
    setAlertConfig({ show: true, title, message });
  };

  const canAccess = hasPermission("perm_review_capex");

  // Only allow access to users with review permission (or Admin)
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
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer w-full text-center mt-2"
          >
            Kembali ke Portal Utama
          </Link>
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

  // Synchronize edit fields when selected proposal changes
  useEffect(() => {
    if (selectedProposal) {
      setEditPurpose(selectedProposal.purpose || "Capacity");
      setEditInvestmentType(selectedProposal.investmentType || "Capacity Up");
      setEditStartDate(selectedProposal.startDate || "");
      setEditEndDate(selectedProposal.endDate || "");
      setUploadedFiles([]);
      setNotes("");
    }
  }, [selectedProposalId, selectedProposal]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const results = await api.uploadMultipleDocuments(Array.from(files));
      const names = results.map((r) => r.file_name || r.original_name);
      setUploadedFiles((prev) => Array.from(new Set([...prev, ...names])));
    } catch (err: any) {
      Swal.fire({
        title: "Gagal Mengunggah",
        text: err.message || "Gagal mengunggah lampiran Finance.",
        icon: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProposal) return;

    const effectiveNotes = notes.trim() || (
      decisionStatus === "Gate 2 - Committee Review"
        ? "Disetujui oleh Finance untuk diteruskan ke Committee Review."
        : decisionStatus === "Gate 1 - Pending User Feedback"
        ? "Menunggu kelengkapan dokumen pendukung tambahan dari pemohon."
        : "Usulan dikembalikan untuk revisi."
    );

    const now = new Date().toISOString();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const defaultSchedule = futureDate.toISOString().slice(0, 10) + "T09:00";
    const effectiveSchedule = scheduleTime || (decisionStatus === "Gate 2 - Committee Review" ? defaultSchedule : undefined);

    let actionLabel = "";
    if (decisionStatus === "Gate 0 - Idea") {
      actionLabel = "Draft (Revise oleh Finance)";
    } else if (decisionStatus === "Gate 1 - Pending User Feedback") {
      actionLabel = "Pending (Butuh File Pendukung)";
    } else if (decisionStatus === "Gate 2 - Committee Review") {
      actionLabel = `Disetujui ke Komite - Jadwal: ${effectiveSchedule}`;
    }

    const currentAttachments = selectedProposal.attachmentName
      ? selectedProposal.attachmentName.split(", ").map((s) => s.trim()).filter(Boolean)
      : [];
    const combinedAttachments =
      decisionStatus !== "Gate 0 - Idea" && uploadedFiles.length > 0
        ? Array.from(new Set([...currentAttachments, ...uploadedFiles])).join(", ")
        : selectedProposal.attachmentName;

    const updatedData: Partial<CapexProposal> = {
      purpose: editPurpose,
      investmentType: editInvestmentType,
      startDate: editStartDate,
      endDate: editEndDate,
      gateStatus: decisionStatus,
      financeNotes: effectiveNotes,
      attachmentName: combinedAttachments,
      financeApprovedAt: decisionStatus === "Gate 2 - Committee Review" ? now : undefined,
      committeeReviewSchedule: decisionStatus === "Gate 2 - Committee Review" ? effectiveSchedule : undefined,
      revisionSource: decisionStatus === "Gate 0 - Idea" ? "Finance" : undefined,
      history: [
        ...selectedProposal.history,
        {
          gate: 1,
          action: actionLabel,
          actor: "Finance (Accounting)",
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
          ? `Usulan ${selectedProposal.id} (${selectedProposal.name}) berhasil disetujui dan diteruskan ke menu Committee Review (Gate 2).`
          : `Keputusan review untuk usulan ${selectedProposal.id} berhasil diperbarui.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      setSelectedProposalId(null);
      setNotes("");
      setScheduleTime("");
      setUploadedFiles([]);
      setUploadedFiles([]);
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

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen ml-64 bg-slate-100 min-w-0 overflow-x-hidden">
        <Header
          title="FinAcct Review & Feasibility Study (Gate 1)"
          subtitle="Proses peninjauan proposal investasi dan perhitungan kelayakan (Feasibility Study) oleh Tim Finance"
        />

        {toast.show && (
          <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl bg-white border-emerald-500/50 text-emerald-600">
            {toast.message}
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-4 w-full min-w-0">
          <div className={`grid grid-cols-1 ${selectedProposal ? "xl:grid-cols-2" : "grid-cols-1"} gap-4 items-start w-full transition-all`}>
            
            {/* Left Card: Daftar Pengajuan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs w-full">
              <div className="pb-2 border-b border-slate-200 flex items-center gap-2">
                <span className="w-1.5 h-4.5 rounded-full bg-blue-600 inline-block" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  DAFTAR PENGAJUAN MENUNGGU FINANCE REVIEW ({pendingProposals.length})
                </h2>
              </div>

              {pendingProposals.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-medium text-xs">
                  Tidak ada pengajuan investasi yang menunggu Finance Review.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider select-none">
                        <th className="py-3 px-3.5">ID CAPEX</th>
                        <th className="py-3 px-3.5">PROJECT NAME</th>
                        <th className="py-3 px-3.5">PIC</th>
                        <th className="py-3 px-3.5 text-right">COST</th>
                        <th className="py-3 px-3.5 text-center">STATUS</th>
                        <th className="py-3 px-3.5 text-center">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                      {pendingProposals.map((p) => {
                        const isSelected = selectedProposalId === p.id;
                        return (
                          <tr
                            key={p.id}
                            className={`transition-colors ${
                              isSelected ? "bg-blue-50/50 font-semibold" : "hover:bg-slate-50/70 bg-white"
                            }`}
                          >
                            <td className="py-3 px-3.5 font-mono text-slate-800 text-[11px]">
                              {p.capexId && p.capexId !== "-" ? p.capexId : p.id}
                            </td>
                            <td className="py-3 px-3.5 text-slate-800 font-medium text-xs">{p.name}</td>
                            <td className="py-3 px-3.5 text-slate-600 font-normal text-xs">{p.pic}</td>
                            <td className="py-3 px-3.5 font-bold text-slate-800 text-right text-xs">
                              <div className="text-[10px] text-slate-400 font-normal">Rp</div>
                              Rp {p.estimatedCost.toLocaleString("id-ID")}
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                FinAcct Review
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <button
                                onClick={() => {
                                  setSelectedProposalId(p.id);
                                  const targetDecision: GateStatus =
                                    p.gateStatus === "Gate 1 - Pending User Feedback"
                                      ? "Gate 1 - Pending User Feedback"
                                      : p.gateStatus === "Gate 0 - Idea"
                                      ? "Gate 0 - Idea"
                                      : "Gate 2 - Committee Review";
                                  setDecisionStatus(targetDecision);
                                  setNotes(p.financeNotes || "");
                                  const futureDate = new Date();
                                  futureDate.setDate(futureDate.getDate() + 3);
                                  const defaultSchedule = futureDate.toISOString().slice(0, 10) + "T09:00";
                                  setScheduleTime(p.committeeReviewSchedule || defaultSchedule);
                                  setUploadedFiles([]);
                                }}
                                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold tracking-wide transition-all shadow-2xs cursor-pointer"
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

            {/* Right Card: Ulasan & Keputusan Review */}
            {selectedProposal && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs w-full">
                {/* Header */}
                <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4.5 rounded-full bg-blue-600 inline-block" />
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      ULASAN & KEPUTUSAN REVIEW: {selectedProposal.capexId || selectedProposal.id}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedProposalId(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Tutup Panel"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Details Section */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: Fixed Info */}
                    <div className="space-y-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PROJECT NAME</span>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedProposal.name}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DEPARTEMEN</span>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{selectedProposal.department || "PE"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PIC PENGAJU</span>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">{selectedProposal.pic || "-"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ESTIMASI BIAYA</span>
                        <p className="text-xs font-bold text-blue-600 mt-0.5">
                          Rp {selectedProposal.estimatedCost.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">BENEFIT</span>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-normal">{selectedProposal.description || "-"}</p>
                      </div>
                    </div>

                    {/* Right Column: Editable by Finance & Existing Attachments */}
                    <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block border-b border-slate-100 pb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        Penyesuaian Finance (Edit Data)
                      </span>

                      {/* Purpose & Investment Type Edit */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            PURPOSE
                          </label>
                          <select
                            value={editPurpose}
                            onChange={(e) => setEditPurpose(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
                          >
                            <option value="Capacity">Capacity</option>
                            <option value="Cost Reduction">Cost Reduction</option>
                            <option value="Quality">Quality</option>
                            <option value="Safety / Environment">Safety / Environment</option>
                            <option value="Replacement / Overhaul">Replacement / Overhaul</option>
                            <option value="Supporting">Supporting</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            INVESTMENT TYPE
                          </label>
                          <select
                            value={editInvestmentType}
                            onChange={(e) => setEditInvestmentType(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
                          >
                            <option value="Capacity Up">Capacity Up</option>
                            <option value="Line Expansion">Line Expansion</option>
                            <option value="New Model">New Model</option>
                            <option value="Machine Renewal">Machine Renewal</option>
                            <option value="Automation">Automation</option>
                            <option value="Cost Down">Cost Down</option>
                            <option value="Safety / 5S">Safety / 5S</option>
                            <option value="Supporting">Supporting</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Start Date & End Date Edit */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            START DATE
                          </label>
                          <input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            END DATE
                          </label>
                          <input
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Existing proposal attachments */}
                      <div className="pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">LAMPIRAN PEMOHON</span>
                        {(() => {
                          const allDocs = (selectedProposal.attachmentName || "")
                            .split(", ")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          if (allDocs.length === 0) return <span className="text-xs text-slate-400 italic">Tidak ada lampiran</span>;
                          return (
                            <div className="flex flex-col gap-1">
                              {allDocs.map((doc, idx) => (
                                <a
                                  key={idx}
                                  href={api.getUploadFileUrl(doc)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-[11px] font-medium underline"
                                >
                                  <svg className="w-3 h-3 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <span className="truncate">{doc}</span>
                                </a>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Decisions */}
                <form id="finance-review-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Radio Choice Cards */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                      KEPUTUSAN STATUS REVIEW <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* 1. APPROVAL */}
                      <div
                        onClick={() => setDecisionStatus("Gate 2 - Committee Review")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          decisionStatus === "Gate 2 - Committee Review"
                            ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <p className="text-xs font-bold text-emerald-600">1. APPROVAL</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Approve & jadwalkan komite</p>
                      </div>

                      {/* 2. PENDING */}
                      <div
                        onClick={() => setDecisionStatus("Gate 1 - Pending User Feedback")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          decisionStatus === "Gate 1 - Pending User Feedback"
                            ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <p className="text-xs font-bold text-amber-600">2. PENDING</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Butuh dokumen tambahan</p>
                      </div>

                      {/* 3. REVISE */}
                      <div
                        onClick={() => setDecisionStatus("Gate 0 - Idea")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          decisionStatus === "Gate 0 - Idea"
                            ? "border-red-500 bg-red-50/50 ring-2 ring-red-500/20"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <p className="text-xs font-bold text-red-600">3. REVISE</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Kembalikan ke Draft</p>
                      </div>
                    </div>
                  </div>

                  {/* Date Time Picker for Committee Review Schedule */}
                  {decisionStatus === "Gate 2 - Committee Review" && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        JADWAL REVIEW KOMITE <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="datetime-local"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs font-normal"
                      />
                    </div>
                  )}

                  {/* Notes Textarea */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      CATATAN / ULASAN FINANCE
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Masukkan ulasan kelayakan FS atau revisi yang diperlukan..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors resize-none shadow-2xs font-normal"
                    />
                  </div>

                  {/* Attachment Upload by Finance (Perhitungan Feasibility Study / FS) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        LAMPIRAN PERHITUNGAN FEASIBILITY STUDY (FS) OLEH FINANCE
                      </label>
                      {editPurpose.toLowerCase().includes("supporting") && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                          Supporting Purpose (FS Tidak Wajib)
                        </span>
                      )}
                    </div>

                    {editPurpose.toLowerCase().includes("supporting") ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs flex items-center gap-2">
                        <span className="text-blue-600">ℹ️</span>
                        <span>Usulan dengan Purpose <strong>Supporting</strong> tidak memerlukan perhitungan Feasibility Study (FS). Upload lampiran bersifat opsional.</span>
                      </div>
                    ) : null}

                    <label className="flex flex-col items-center justify-center w-full py-4 px-3 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 transition-all text-center">
                      <svg className="w-5 h-5 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-[11px] font-semibold text-slate-700">
                        {isUploading ? "Mengunggah file..." : "Klik untuk upload lampiran perhitungan FS Finance"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PDF, Excel (Kalkulasi ROI/NPV/Payback), Word, PPT up to 10MB
                      </span>
                      <input
                        type="file"
                        multiple
                        disabled={isUploading}
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                      />
                    </label>

                    {/* Uploaded files chips */}
                    {uploadedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {uploadedFiles.map((fn, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            <span className="truncate max-w-48">{fn}</span>
                            <button
                              type="button"
                              onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-blue-400 hover:text-red-600 font-bold ml-0.5 cursor-pointer"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProposalId(null);
                        setUploadedFiles([]);
                      }}
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer active:scale-95"
                    >
                      {isUploading ? "Menyimpan..." : "Simpan Keputusan Review"}
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
