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
  const [decisionStatus, setDecisionStatus] = useState<GateStatus | "">("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleClock, setScheduleClock] = useState("09:00");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProposal) return;

    if (!decisionStatus) {
      showAlert("Silakan pilih Keputusan Status Review terlebih dahulu.", "Pilihan Diperlukan");
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
    const defaultDateStr = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);
    const finalDate = scheduleDate || defaultDateStr;
    const finalClock = scheduleClock || "09:00";
    const effectiveSchedule = decisionStatus === "Gate 2 - Committee Review" ? `${finalDate}T${finalClock}` : undefined;

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

    const user = getCurrentUser();
    const reviewerName = user?.name || "Staff Accounting & Finance";

    const updatedData: Partial<CapexProposal> = {
      gateStatus: decisionStatus,
      financeNotes: effectiveNotes,
      attachmentName: combinedAttachments,
      financeApprovedBy: reviewerName,
      financeApprovedAt: now,
      startDate: editStartDate || selectedProposal.startDate || undefined,
      endDate: editEndDate || selectedProposal.endDate || undefined,
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
          ? `Usulan ${selectedProposal.id} (${selectedProposal.name}) berhasil disetujui dan diteruskan ke menu Committee Review.`
          : `Usulan ${selectedProposal.id} (${selectedProposal.name}) ditolak dan status dikembalikan.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      setSelectedProposalId(null);
      setNotes("");
      setScheduleDate("");
      setScheduleClock("09:00");
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
          title="FinAcct Review & Feasibility Study"
          subtitle="Proses peninjauan proposal investasi dan perhitungan kelayakan (Feasibility Study) oleh Tim Finance"
        />

        {toast.show && (
          <div className="fixed top-20 right-8 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl bg-white border-emerald-500/50 text-emerald-600">
            {toast.message}
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 w-full min-w-0 overflow-x-hidden">
          {/* List Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs w-full">
            <div className="pb-2 border-b border-slate-200 flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-blue-600 inline-block" />
              <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Daftar Pengajuan Menunggu Finance Review ({pendingProposals.length})
              </h2>
            </div>

            {pendingProposals.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-12">
                Tidak ada pengajuan investasi baru yang menunggu Finance Review.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider select-none">
                      <th className="py-3 px-3 w-[12%]">ID Capex</th>
                      <th className="py-3 px-3 w-[24%]">Project Name</th>
                      <th className="py-3 px-3 w-[16%]">Departemen</th>
                      <th className="py-3 px-3 w-[16%]">PIC</th>
                      <th className="py-3 px-3 w-[14%] text-right">Cost</th>
                      <th className="py-3 px-3 w-[10%] text-center">Status</th>
                      <th className="py-3 px-3 w-[8%] text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {pendingProposals.map((p) => (
                      <tr
                        key={p.id}
                        className={`hover:bg-blue-50/20 transition-colors ${
                          selectedProposalId === p.id ? "bg-blue-50/40 font-semibold" : "bg-white"
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-semibold text-slate-800 truncate" title={p.capexId}>
                          {p.capexId && p.capexId !== "-" ? p.capexId : "-"}
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium truncate" title={p.name}>
                          {p.name}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-normal truncate" title={p.department}>
                          {p.department || "-"}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-normal truncate" title={p.pic}>
                          {p.pic}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 text-right whitespace-nowrap">
                          Rp {p.estimatedCost.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StatusBadge status={p.gateStatus} size="sm" noBackground={true} showDot={false} />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedProposalId(p.id);
                              setDecisionStatus("");
                              setNotes("");
                              setEditStartDate(p.startDate && p.startDate !== "-" ? p.startDate.slice(0, 10) : "");
                              setEditEndDate(p.endDate && p.endDate !== "-" ? p.endDate.slice(0, 10) : "");
                              const defaultDateStr = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);
                              const rawSchedule = p.committeeReviewSchedule || "";
                              let initDate = defaultDateStr;
                              let initClock = "09:00";
                              if (rawSchedule.includes("T")) {
                                const parts = rawSchedule.split("T");
                                initDate = parts[0] || defaultDateStr;
                                initClock = parts[1] || "09:00";
                              } else if (rawSchedule) {
                                initDate = rawSchedule;
                              }
                              setScheduleDate(initDate);
                              setScheduleClock(initClock);
                              setUploadedFiles([]);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold tracking-wide transition-all shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Review Modal Dialog - Landscape 2-Column Layout */}
          {selectedProposal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden animate-scale-in my-8">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-6 rounded-full bg-blue-600 inline-block" />
                    <div>
                      <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                        Ulasan & Keputusan Review: {selectedProposal.name}
                      </h2>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Tinjau kelayakan finansial dan tentukan status keputusan review
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProposalId(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 max-h-[calc(85vh-130px)] overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Proposal Info & Documents Details */}
                    <div className="lg:col-span-6 bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-3.5">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Project Name</span>
                          <p className="text-sm font-semibold text-slate-800 mt-0.5">{selectedProposal.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Departemen</span>
                            <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedProposal.department || "Engineering"}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">PIC Pengaju</span>
                            <p className="text-xs font-medium text-slate-700 mt-0.5">{selectedProposal.pic || "-"}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Purpose</span>
                            <p className="text-xs font-medium text-slate-800 mt-0.5">
                              {selectedProposal.purpose || "-"}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Investment Type</span>
                            <p className="text-xs font-medium text-slate-800 mt-0.5">
                              {selectedProposal.investmentType || "-"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Durasi Proyek</span>
                          <p className="text-xs font-medium text-slate-700 mt-0.5">
                            {selectedProposal.startDate && selectedProposal.endDate && selectedProposal.startDate !== "-" && selectedProposal.endDate !== "-"
                              ? `${formatDateDisplay(selectedProposal.startDate)} s/d ${formatDateDisplay(selectedProposal.endDate)}`
                              : selectedProposal.startDate && selectedProposal.startDate !== "-"
                              ? formatDateDisplay(selectedProposal.startDate)
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block mb-1">
                            Lampiran Dokumen Usulan
                          </span>

                          {(() => {
                            const initialDocs = (selectedProposal.initialAttachmentName || "")
                              .split(", ")
                              .map((s) => s.trim())
                              .filter(Boolean);
                            const revisedDocs = (selectedProposal.revisedAttachmentName || "")
                              .split(", ")
                              .map((s) => s.trim())
                              .filter(Boolean);
                            const allDocs = (selectedProposal.attachmentName || "")
                              .split(", ")
                              .map((s) => s.trim())
                              .filter(Boolean);

                            // Baca semua batch revisi dari history
                            let revisionBatches: string[][] = [];
                            if (selectedProposal.revisedAttachmentHistory) {
                              try {
                                const rawBatches = JSON.parse(selectedProposal.revisedAttachmentHistory);
                                if (Array.isArray(rawBatches)) {
                                  const seenFiles = new Set<string>();
                                  revisionBatches = rawBatches
                                    .map((batch: string[]) => {
                                      const clean = batch.filter((f) => {
                                        if (seenFiles.has(f)) return false;
                                        seenFiles.add(f);
                                        return true;
                                      });
                                      return clean;
                                    })
                                    .filter((b: string[]) => b.length > 0);
                                }
                              } catch { revisionBatches = []; }
                            }
                            if (revisionBatches.length === 0 && revisedDocs.length > 0) {
                              revisionBatches = [revisedDocs];
                            }

                            const hasSeparateRevisions =
                              initialDocs.length > 0 &&
                              (revisionBatches.length > 0 ||
                                (allDocs.length > 0 &&
                                  JSON.stringify(initialDocs) !== JSON.stringify(allDocs)));

                            if (hasSeparateRevisions && initialDocs.length > 0) {
                              return (
                                <div className="space-y-2 mt-1">
                                  {/* Dokumen Awal */}
                                  <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                        Dokumen Awal
                                      </span>
                                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono">
                                        {initialDocs.length} File
                                      </span>
                                    </div>
                                    <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                                      {initialDocs.map((filename, i) => (
                                        <a
                                          key={i}
                                          href={api.getUploadFileUrl(filename)}
                                          download={filename}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center justify-between text-slate-700 hover:text-blue-600 font-mono font-medium text-[11px] bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded px-2 py-1 transition-all group"
                                          title={`Unduh Dokumen Awal: ${filename}`}
                                        >
                                          <span className="truncate underline font-normal max-w-[200px]">{filename}</span>
                                          <svg className="w-3 h-3 text-slate-400 group-hover:text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                          </svg>
                                        </a>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Semua batch Dokumen Revisi */}
                                  {revisionBatches.map((batch, batchIdx) => (
                                    <div key={batchIdx} className="bg-white border border-emerald-200 rounded-lg p-2.5 space-y-1.5 shadow-2xs">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                          Dokumen Revisi {revisionBatches.length > 1 ? `#${batchIdx + 1}` : ""}
                                        </span>
                                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-semibold">
                                          {batch.length} File
                                        </span>
                                      </div>
                                      <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                                        {batch.map((filename, i) => (
                                          <a
                                            key={i}
                                            href={api.getUploadFileUrl(filename)}
                                            download={filename}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-between text-emerald-800 hover:text-emerald-900 font-mono font-medium text-[11px] bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200 rounded px-2 py-1 transition-all group"
                                            title={`Unduh Dokumen Revisi #${batchIdx + 1}: ${filename}`}
                                          >
                                            <span className="truncate underline font-normal max-w-[200px]">{filename}</span>
                                            <svg className="w-3 h-3 text-emerald-600 group-hover:translate-y-0.5 shrink-0 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            }

                            return (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {allDocs.length > 0 ? (
                                  allDocs.map((filename, i) => {
                                    const cleanName = filename.trim();
                                    const downloadUrl = api.getUploadFileUrl(cleanName);
                                    return (
                                      <a
                                        key={i}
                                        href={downloadUrl}
                                        download={cleanName}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100/70 font-mono font-medium text-xs bg-blue-50/80 border border-blue-200/80 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer group shadow-2xs w-fit max-w-full"
                                        title={`Klik untuk mengunduh berkas: ${cleanName}`}
                                      >
                                        <svg className="w-3.5 h-3.5 text-blue-500 shrink-0 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span className="truncate underline font-normal">{cleanName}</span>
                                      </a>
                                    );
                                  })
                                ) : (
                                  <span className="text-xs font-medium text-slate-500">-</span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Benefit</span>
                        <p className="text-xs text-slate-600 leading-relaxed mt-0.5 font-normal">{selectedProposal.description}</p>
                      </div>

                      {selectedProposal.financeNotes && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-[10px] uppercase font-semibold text-amber-700 tracking-wider block mb-1">
                            Catatan Review Sebelumnya
                          </span>
                          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs font-normal leading-relaxed">
                            {selectedProposal.financeNotes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Review & Decision Form */}
                    <div className="lg:col-span-6 flex flex-col justify-between">
                      <form id="finance-review-form" onSubmit={handleSubmit} className="space-y-4">
                        {/* Status Options Dropdown Selection */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Keputusan Status Review <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              required
                              value={decisionStatus}
                              onChange={(e) => setDecisionStatus(e.target.value as GateStatus)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-blue-600 transition-colors appearance-none cursor-pointer pr-10"
                            >
                              <option value="" disabled>Pilih Keputusan Status Review</option>
                              <option value="Gate 2 - Committee Review">Approval (Disetujui dan Jadwalkan Komite)</option>
                              <option value="Gate 1 - Pending User Feedback">Pending (Butuh Dokumen Tambahan)</option>
                              <option value="Gate 0 - Idea">Revise (Kembali Masuk ke Draft)</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        {/* Conditional Fields: Only displayed when decisionStatus is selected */}
                        {decisionStatus !== "" ? (
                          <div className="space-y-4 animate-fadeIn">
                            {/* Editable Project Duration for Finance: Only displayed on Approval or Pending (Hidden on Revise) */}
                            {decisionStatus !== "Gate 0 - Idea" && (
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                                  Durasi Pelaksanaan Proyek
                                  <span className="text-[10px] text-slate-400 font-normal ml-1.5 normal-case">
                                    (Dapat disesuaikan oleh Finance)
                                  </span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                      Tanggal Mulai
                                    </label>
                                    <input
                                      type="date"
                                      value={editStartDate}
                                      onChange={(e) => setEditStartDate(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-normal cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                      Tanggal Selesai
                                    </label>
                                    <input
                                      type="date"
                                      value={editEndDate}
                                      onChange={(e) => setEditEndDate(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-normal cursor-pointer"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Separate Date and Time Pickers for Committee Review Schedule */}
                            {decisionStatus === "Gate 2 - Committee Review" && (
                              <div className="animate-fadeIn space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                  Jadwal Review Komite <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Tanggal Sidang */}
                                  <div>
                                    <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                      Tanggal Sidang
                                    </label>
                                    <input
                                      required
                                      type="date"
                                      value={scheduleDate}
                                      onChange={(e) => setScheduleDate(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors font-normal cursor-pointer"
                                    />
                                  </div>

                                  {/* Jam / Waktu Sidang */}
                                  <div>
                                    <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                      Jam / Waktu (WIB)
                                    </label>
                                    <input
                                      required
                                      type="time"
                                      value={scheduleClock}
                                      onChange={(e) => setScheduleClock(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors font-normal cursor-pointer"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Upload Supporting Document Field */}
                            {decisionStatus !== "Gate 0 - Idea" && (
                              <div className="animate-fadeIn space-y-2">
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                  Upload Dokumen Pendukung Finance
                                  <span className="text-[10px] text-slate-400 font-normal ml-1.5 normal-case">
                                    (Opsional - Dokumen Feasibility Study / Verifikasi)
                                  </span>
                                </label>

                                <div className="flex items-center justify-center w-full">
                                  <label className="flex flex-col items-center justify-center w-full py-3 px-4 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all">
                                    <div className="flex items-center justify-center gap-2">
                                      {isUploading ? (
                                        <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                      ) : (
                                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                      )}
                                      <span className="text-[11px] text-slate-600 font-medium">
                                        {isUploading ? "Mengunggah dokumen..." : "Klik untuk upload file dokumen pendukung (PDF/Excel/Docx/Gambar)"}
                                      </span>
                                    </div>
                                    <input
                                      type="file"
                                      className="hidden"
                                      multiple
                                      disabled={isUploading}
                                      onChange={async (e) => {
                                        const files = e.target.files;
                                        if (files && files.length > 0) {
                                          setIsUploading(true);
                                          try {
                                            const uploadResults = await api.uploadMultipleDocuments(Array.from(files));
                                            const names = uploadResults.map((r) => r.file_name || r.original_name);
                                            setUploadedFiles((prev) => Array.from(new Set([...prev, ...names])));
                                          } catch (err) {
                                            console.error("Upload error in finance review modal:", err);
                                            showAlert("Gagal mengunggah dokumen pendukung.", "Upload Gagal");
                                          } finally {
                                            setIsUploading(false);
                                          }
                                        }
                                        e.target.value = "";
                                      }}
                                    />
                                  </label>
                                </div>

                                {uploadedFiles.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {uploadedFiles.map((fn, idx) => (
                                      <div
                                        key={idx}
                                        className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-mono font-medium"
                                      >
                                        <span className="truncate max-w-55" title={fn}>{fn}</span>
                                        <button
                                          type="button"
                                          onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                                          className="text-blue-400 hover:text-red-500 font-bold ml-1 cursor-pointer"
                                          title="Hapus file"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Notes / Catatan Finance */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                Catatan / Ulasan Finance
                                {(decisionStatus === "Gate 0 - Idea" || decisionStatus === "Gate 1 - Pending User Feedback") && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              <textarea
                                rows={3}
                                required={decisionStatus === "Gate 0 - Idea" || decisionStatus === "Gate 1 - Pending User Feedback"}
                                placeholder={
                                  decisionStatus === "Gate 0 - Idea"
                                    ? "Wajib tuliskan alasan pengembalian usulan untuk direvisi..."
                                    : decisionStatus === "Gate 1 - Pending User Feedback"
                                    ? "Wajib tuliskan dokumen tambahan / feedback yang dibutuhkan dari pemohon..."
                                    : "Masukkan catatan persetujuan atau ulasan kelayakan FS..."
                                }
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors resize-none font-normal"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-center">
                            <p className="text-xs font-medium text-slate-400">
                              Pilih <strong className="text-slate-600">Keputusan Status Review</strong> di atas untuk melanjutkan pengisian form.
                            </p>
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProposalId(null);
                      setUploadedFiles([]);
                    }}
                    className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    form="finance-review-form"
                    disabled={isUploading}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    {isUploading ? "Mengunggah Dokumen..." : "Simpan Keputusan Review"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      {/* Custom Centered Alert Modal */}
      {alertConfig.show && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-slate-800 space-y-4 animate-scale-in">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
              {alertConfig.title}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">{alertConfig.message}</p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAlertConfig({ show: false, message: "" })}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
