"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { CapexProposal, api } from "../../lib/api";
import { useCapex } from "../../context/CapexContext";
import StatusBadge from "../StatusBadge";
import InfoTooltip from "../InfoTooltip";

interface CommitteeReviewFormProps {
  pendingApprovals: CapexProposal[];
  activeRole?: string;
  canApprove?: boolean;
  onDecision: (proposal: CapexProposal, decision: "Approve" | "Reject" | "Revise", notes: string) => void;
}

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

export default function CommitteeReviewForm({ pendingApprovals, onDecision }: CommitteeReviewFormProps) {
  const { hasPermission, currentUser } = useCapex();
  const [selectedProposal, setSelectedProposal] = useState<CapexProposal | null>(null);
  const [committeeNotes, setCommitteeNotes] = useState("");
  const [notesError, setNotesError] = useState(false);

  const isAuthorized = hasPermission("perm_committee_review");

  const handleDecisionSubmit = (proposal: CapexProposal, decision: "Approve" | "Reject" | "Revise") => {
    if ((decision === "Revise" || decision === "Reject") && !committeeNotes.trim()) {
      setNotesError(true);
      Swal.fire({
        icon: "warning",
        title: "Catatan Wajib Diisi",
        text: decision === "Revise"
          ? "Mohon tuliskan alasan atau rekomendasi revisi agar pemohon dapat memperbaikinya."
          : "Mohon tuliskan alasan penolakan usulan investasi ini.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setNotesError(false);
    onDecision(proposal, decision, committeeNotes);
    setSelectedProposal(null);
    setCommitteeNotes("");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
      <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white font-semibold text-sm w-7 h-7 flex items-center justify-center rounded-lg shrink-0">
            2
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center">
              Menunggu Persetujuan Komite
              <InfoTooltip content="Daftar usulan yang telah diverifikasi kelayakannya oleh Finance dan siap untuk diputuskan oleh Sidang Komite." />
            </h2>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
          {pendingApprovals.length} Usulan
        </span>
      </div>

      {!isAuthorized && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 px-4 py-3 rounded-xl text-xs font-medium leading-relaxed">
          <span className="font-semibold">Perhatian:</span> Akun Anda ({currentUser?.role || "Pengguna"}) saat ini dalam mode tinjau dan belum memiliki izin <span className="font-semibold">perm_committee_review</span> untuk mengambil keputusan persetujuan Komite.
        </div>
      )}

      {/* Structured Clean Table for Pending Approvals */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <th className="py-3 px-3">ID Capex</th>
              <th className="py-3 px-3">Nama Proyek</th>
              <th className="py-3 px-3">Departemen</th>
              <th className="py-3 px-3">PIC</th>
              <th className="py-3 px-3 text-right">Biaya (Rp)</th>
              <th className="py-3 px-3 text-center">Jadwal Komite</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingApprovals.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 italic font-normal">
                  Tidak ada pengajuan investasi baru yang menunggu keputusan Komite.
                </td>
              </tr>
            ) : (
              pendingApprovals.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-blue-50/20 transition-colors ${
                    selectedProposal?.id === item.id ? "bg-blue-50/40 font-medium" : "bg-white"
                  }`}
                >
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                    {item.capexId && item.capexId !== "-" ? item.capexId : "-"}
                  </td>
                  <td className="py-3 px-3 text-slate-800 font-medium max-w-45 truncate" title={item.name}>
                    {item.name}
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-normal">{item.department || "-"}</td>
                  <td className="py-3 px-3 text-slate-600 font-normal">{item.pic}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800 text-right font-mono">
                    Rp {item.estimatedCost.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600 font-normal">
                    {item.committeeReviewSchedule ? (
                      <span className="text-[11px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono">
                        {formatDateDisplay(item.committeeReviewSchedule)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={item.gateStatus} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProposal(item);
                        setCommitteeNotes(item.committeeNotes || "");
                        setNotesError(false);
                      }}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold tracking-wide transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      Tinjau
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review & Decision Modal (Spacious 2-Column Horizontal Layout) */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden animate-scale-in text-slate-800 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-6 bg-blue-600 rounded-full"></div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide text-slate-800">
                    ULASAN & KEPUTUSAN KOMITE: {selectedProposal.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    Tinjau detail kelayakan usulan investasi dan tentukan keputusan sidang Komite
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Tutup"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - 2 Column Wide Grid */}
            <div className="p-6 max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column (7 cols): Informasi Detail Proyek & Catatan Finance */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3.5">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Project Name</span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedProposal.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-3">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Departemen</span>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedProposal.department || "-"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">PIC Pengaju</span>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedProposal.pic}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-3">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Purpose</span>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">
                          {selectedProposal.purpose || "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Investment Type</span>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">
                          {selectedProposal.investmentType || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-3">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Jadwal Sidang Komite</span>
                        <p className="text-xs font-semibold text-slate-800 mt-0.5 font-mono">
                          {selectedProposal.committeeReviewSchedule ? formatDateDisplay(selectedProposal.committeeReviewSchedule) : "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Kebutuhan Studi Kelayakan</span>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">
                          {selectedProposal.isFsRequired ? `Ya (FS: ${selectedProposal.fsCategory || "-"})` : "Tidak (Non-FS)"}
                        </p>
                      </div>
                    </div>

                    {/* Description / Benefit */}
                    <div className="border-t border-slate-200/80 pt-3">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Deskripsi / Benefit Proyek</span>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1 font-normal bg-white p-3 rounded-lg border border-slate-200/70 whitespace-pre-line">
                        {selectedProposal.description || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Finance Notes Card */}
                  {selectedProposal.financeNotes && (
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Catatan Finance:
                      </span>
                      <p className="text-xs text-amber-900 italic font-normal leading-relaxed">
                        &quot;{selectedProposal.financeNotes}&quot;
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column (5 cols): Lampiran Dokumen & Form Keputusan Komite */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Attachments Card with Audit Trail Support */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
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

                      const hasSeparateRevisions =
                        initialDocs.length > 0 &&
                        (revisedDocs.length > 0 ||
                          (allDocs.length > 0 &&
                            JSON.stringify(initialDocs) !== JSON.stringify(allDocs)));

                      const effectiveRevised =
                        revisedDocs.length > 0
                          ? revisedDocs
                          : hasSeparateRevisions
                          ? allDocs.filter((d) => !initialDocs.includes(d))
                          : [];

                      if (hasSeparateRevisions && (initialDocs.length > 0 || effectiveRevised.length > 0)) {
                        return (
                          <div className="space-y-3">
                            {/* Dokumen Awal */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  Dokumen Awal (Versi Pengajuan)
                                </span>
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                                  {initialDocs.length} File
                                </span>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {initialDocs.map((filename, i) => (
                                  <a
                                    key={i}
                                    href={api.getUploadFileUrl(filename)}
                                    download={filename}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-between text-slate-700 hover:text-blue-600 font-mono font-medium text-xs bg-slate-50 hover:bg-blue-50/60 border border-slate-200 rounded-lg px-2.5 py-1.5 transition-all shadow-2xs group"
                                    title={`Unduh Dokumen Awal: ${filename}`}
                                  >
                                    <span className="truncate underline font-normal">{filename}</span>
                                    <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </a>
                                ))}
                              </div>
                            </div>

                            {/* Dokumen Revisi */}
                            <div className="bg-white border border-emerald-200 rounded-xl p-3 space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Dokumen Revisi (Terbaru)
                                </span>
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                                  {(effectiveRevised.length > 0 ? effectiveRevised : allDocs).length} File
                                </span>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {(effectiveRevised.length > 0 ? effectiveRevised : allDocs).map((filename, i) => (
                                  <a
                                    key={i}
                                    href={api.getUploadFileUrl(filename)}
                                    download={filename}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-between text-emerald-800 hover:text-emerald-900 font-mono font-medium text-xs bg-emerald-50/50 hover:bg-emerald-100/70 border border-emerald-200 rounded-lg px-2.5 py-1.5 transition-all shadow-2xs group"
                                    title={`Unduh Dokumen Revisi: ${filename}`}
                                  >
                                    <span className="truncate underline font-normal">{filename}</span>
                                    <svg className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-y-0.5 shrink-0 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-2">
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
                                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100/70 font-mono font-medium text-xs bg-white border border-blue-200 rounded-lg px-3 py-2 transition-all cursor-pointer group shadow-2xs w-full"
                                  title={`Klik untuk mengunduh berkas: ${cleanName}`}
                                >
                                  <svg className="w-4 h-4 text-blue-500 shrink-0 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  <span className="truncate underline font-normal">{cleanName}</span>
                                </a>
                              );
                            })
                          ) : (
                            <span className="text-xs font-medium text-slate-500 italic">Tidak ada lampiran berkas</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Committee Decision Form */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      <span>Catatan / Rekomendasi Komite</span>
                      <span className="text-[11px] font-normal text-slate-400 normal-case">
                        (Wajib saat Revisi / Tolak)
                      </span>
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Tuliskan catatan persetujuan, atau wajib tuliskan alasan saat meminta revisi / menolak usulan..."
                      value={committeeNotes}
                      onChange={(e) => {
                        setCommitteeNotes(e.target.value);
                        if (notesError && e.target.value.trim()) setNotesError(false);
                      }}
                      className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-colors resize-none font-normal leading-relaxed ${
                        notesError ? "border-red-500 ring-2 ring-red-200" : "border-slate-200 focus:border-blue-600"
                      }`}
                    />
                    {notesError && (
                      <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Catatan / alasan wajib diisi saat meminta revisi atau menolak usulan.
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer shadow-2xs transition-all"
              >
                Batal
              </button>

              {isAuthorized ? (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDecisionSubmit(selectedProposal, "Revise")}
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold rounded-xl cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    Minta Revisi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecisionSubmit(selectedProposal, "Reject")}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold rounded-xl cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecisionSubmit(selectedProposal, "Approve")}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all active:scale-95"
                  >
                    Setujui (Approve)
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 italic">
                  Akun Anda tidak memiliki izin untuk menyimpan keputusan.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
