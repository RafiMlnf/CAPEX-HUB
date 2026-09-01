"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarFS";
import Header from "../../components/Header";
import StatusBadge from "../../components/StatusBadge";
import { useCapex } from "../../context/CapexContext";
import { CapexProposal, api } from "../../lib/api";
import { formatDateDisplay } from "../../lib/dateUtils";

export default function ApprovalsPage() {
  const { proposals, hasPermission, editProposal, currentUser } = useCapex();
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [committeeNotes, setCommitteeNotes] = useState("");

  const isAdmin =
    (currentUser?.role || "").toLowerCase() === "admin" ||
    (currentUser?.username || "").toLowerCase() === "admin";

  const canViewPage =
    hasPermission("perm_committee_review") ||
    hasPermission("ALL_ACCESS") ||
    isAdmin;

  if (!canViewPage) {
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
            Halaman ini memerlukan izin <span className="font-semibold">Komite Review</span> atau hak akses terkait.
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

  // Filter proposals waiting for Committee Review
  const pendingApprovals = proposals.filter(
    (p) =>
      p.gateStatus === "Gate 2 - Committee Review" ||
      (p.gateStatus || "").toLowerCase().includes("committee")
  );

  // Proposals already processed by committee
  const processedApprovals = proposals.filter(
    (p) =>
      p.committeeApprovedAt ||
      p.gateStatus === "Gate 3 - Procurement" ||
      p.gateStatus === "Approved" ||
      p.gateStatus === "Gate 2 - Rejected" ||
      p.history.some((h) => (h.action || "").toLowerCase().includes("komite"))
  );

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

  const getAttachmentsList = (proposal: CapexProposal) => {
    const raw = proposal.attachmentName || proposal.initialAttachmentName || "";
    return raw
      .split(", ")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleDecision = async (
    proposal: CapexProposal,
    decision: "Approve" | "Reject" | "Revise"
  ) => {
    if ((decision === "Revise" || decision === "Reject") && !committeeNotes.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Catatan Wajib Diisi",
        text: decision === "Revise"
          ? "Mohon tuliskan catatan atau alasan revisi agar pemohon dapat memperbaikinya."
          : "Mohon tuliskan alasan penolakan usulan investasi ini.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const effectiveNotes = committeeNotes.trim() || (
      decision === "Approve"
        ? "Disetujui oleh Komite Investasi untuk lanjut ke proses Procurement."
        : decision === "Reject"
        ? "Ditolak oleh Komite Investasi."
        : "Minta revisi oleh Komite Investasi."
    );

    const now = new Date().toISOString();

    let newStatus = proposal.gateStatus;
    let actionLabel = "";

    if (decision === "Approve") {
      newStatus = "Approved";
      actionLabel = "Disetujui Komite (Lanjut ke BODR/Procurement)";
    } else if (decision === "Reject") {
      newStatus = "Gate 2 - Rejected";
      actionLabel = "Ditolak Komite";
    } else {
      newStatus = "Gate 0 - Idea";
      actionLabel = "Minta Revisi Komite (Kembali ke Draft)";
    }

    const reviewerName = currentUser?.name || currentUser?.username || "Komite Investasi";

    const updated: Partial<CapexProposal> = {
      gateStatus: newStatus,
      committeeNotes: effectiveNotes,
      committeeApprovedBy: reviewerName,
      committeeApprovedAt: now,
      revisionSource: decision === "Revise" ? "Committee" : undefined,
      history: [
        ...proposal.history,
        {
          gate: 2,
          action: actionLabel,
          actor: reviewerName,
          timestamp: now,
          notes: effectiveNotes,
        },
      ],
    };

    try {
      await editProposal(proposal.id, updated);
      Swal.fire({
        title: "Keputusan Disimpan!",
        text: `Keputusan untuk usulan ${proposal.capexId || proposal.name} berhasil disimpan!`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      setSelectedProposalId(null);
      setCommitteeNotes("");
    } catch (err: any) {
      console.error("Committee decision error:", err);
      Swal.fire({
        title: "Gagal Menyimpan",
        text: err.message || "Gagal menyimpan keputusan komite ke server.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen ml-64 bg-slate-100 min-w-0 overflow-hidden">
        <Header
          title="Persetujuan Investasi (Gate 2)"
          subtitle="Dashboard peninjauan dan persetujuan pengajuan Capex oleh Komite Investasi"
        />

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 w-full min-w-0 overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Menunggu Persetujuan Komite */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    MENUNGGU PERSETUJUAN KOMITE ({pendingApprovals.length})
                  </h2>
                </div>
              </div>

              {pendingApprovals.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-12">
                  Tidak ada pengajuan yang sedang menunggu persetujuan Komite.
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((item) => {
                    const isExpanded = selectedProposalId === item.id;
                    const isNonFs = item.purpose === "Supporting" || item.investmentType === "Supporting";

                    return (
                      <div
                        key={item.id}
                        className={`border rounded-xl p-4 bg-white transition-all ${
                          isExpanded
                            ? "border-blue-500 ring-1 ring-blue-500/20 shadow-xs"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Proposal Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-semibold text-slate-700">
                                {item.capexId && item.capexId !== "-" ? item.capexId : "-"}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                                {item.purpose || "Capacity"} — {item.investmentType || "Standard"}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 font-normal">
                              <span>Dept: <strong className="text-slate-700">{item.department || "-"}</strong></span>
                              <span>•</span>
                              <span>PIC: <strong className="text-slate-700">{item.pic || "-"}</strong></span>
                              <span>•</span>
                              <span>
                                Biaya: <strong className="text-blue-600 font-semibold font-mono">Rp {item.estimatedCost.toLocaleString("id-ID")}</strong>
                              </span>
                              <span>•</span>
                              <span>Leadtime: <strong className="text-slate-700 font-mono">⏱️ {calculateLeadTime(item.createdAt)}</strong></span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (isExpanded) {
                                setSelectedProposalId(null);
                                setCommitteeNotes("");
                              } else {
                                setSelectedProposalId(item.id);
                                setCommitteeNotes(item.committeeNotes || "");
                              }
                            }}
                            className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          >
                            {isExpanded ? "Tutup" : "Tinjau"}
                          </button>
                        </div>

                        {/* Expanded Proposal Review Form */}
                        {isExpanded && (
                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-3.5 animate-in fade-in-50 duration-150">
                            {/* Detail Box */}
                            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 text-[11px] space-y-2.5">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                                      PURPOSE & INVESTMENT TYPE
                                    </span>
                                    <p className="text-slate-800 font-semibold mt-0.5">
                                      {item.purpose || "-"} / {item.investmentType || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                                      DURASI PENGERJAAN PROYEK
                                    </span>
                                    <p className="text-slate-700 font-medium mt-0.5">
                                      {item.startDate && item.endDate && item.startDate !== "-" && item.endDate !== "-"
                                        ? `${item.startDate.slice(0, 10)} s/d ${item.endDate.slice(0, 10)} (${calculateProjectDuration(item.startDate, item.endDate)})`
                                        : "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                                      BENEFIT & DESKRIPSI
                                    </span>
                                    <p className="text-slate-700 font-medium mt-0.5">{item.description || "-"}</p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div>
                                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                                      JADWAL SIDANG KOMITE
                                    </span>
                                    <p className="text-purple-700 font-semibold mt-0.5">
                                      📅 {item.committeeReviewSchedule ? formatDateDisplay(item.committeeReviewSchedule) : "Belum Dijadwalkan"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                                      LAMPIRAN PENGAJU
                                    </span>
                                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                                      {getAttachmentsList(item).length === 0 ? (
                                        <span className="text-slate-400 italic">Tidak ada lampiran</span>
                                      ) : (
                                        getAttachmentsList(item).map((f, idx) => (
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
                                  <div>
                                    <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                                      LAMPIRAN PERHITUNGAN FS (FINANCE)
                                    </span>
                                    {isNonFs ? (
                                      <p className="text-slate-500 italic mt-0.5">Supporting / Non-FS (Tidak memerlukan FS)</p>
                                    ) : item.financeAttachmentName ? (
                                      <a
                                        href={api.getUploadFileUrl(item.financeAttachmentName)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 underline font-medium text-[11px] mt-0.5"
                                      >
                                        <span>📊 {item.financeAttachmentName}</span>
                                      </a>
                                    ) : (
                                      <p className="text-slate-400 italic mt-0.5">Tidak ada lampiran FS</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {item.financeNotes && (
                                <div className="pt-2 border-t border-slate-200/60">
                                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                                    CATATAN / ULASAN FINANCE
                                  </span>
                                  <p className="text-slate-700 font-medium italic mt-0.5">
                                    "{item.financeNotes}"
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Form Input */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                                CATATAN / REKOMENDASI KOMITE
                              </label>
                              <textarea
                                rows={3}
                                value={committeeNotes}
                                onChange={(e) => setCommitteeNotes(e.target.value)}
                                placeholder="Tulis alasan persetujuan, penolakan, atau revisi..."
                                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 outline-none focus:border-blue-600 bg-white text-slate-800 placeholder:text-slate-400 resize-none font-normal"
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setSelectedProposalId(null)}
                                className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDecision(item, "Revise")}
                                className="px-3.5 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                              >
                                Minta Revisi
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDecision(item, "Reject")}
                                className="px-3.5 py-1.5 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                              >
                                Tolak
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDecision(item, "Approve")}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                              >
                                Setujui (Approve)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Riwayat Keputusan Komite */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  RIWAYAT KEPUTUSAN KOMITE
                </h2>
                <span className="text-[10px] text-slate-500 font-mono font-medium">
                  {processedApprovals.length} Dokumen
                </span>
              </div>

              {processedApprovals.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  Belum ada keputusan komite yang tercatat.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
                  {processedApprovals.map((p) => {
                    const isRejected = (p.gateStatus || "").toLowerCase().includes("reject");
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-slate-700 text-[10px]">
                            {p.capexId && p.capexId !== "-" ? p.capexId : p.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              isRejected
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {isRejected ? "Ditolak" : "Disetujui"}
                          </span>
                        </div>
                        <p className="font-medium text-slate-800 text-xs truncate" title={p.name}>
                          {p.name}
                        </p>
                        <div className="text-[10px] text-slate-500 flex justify-between font-mono">
                          <span>PIC: {p.pic || "-"}</span>
                          <span>Rp {p.estimatedCost.toLocaleString("id-ID")}</span>
                        </div>
                        {p.committeeNotes && (
                          <p className="text-[10.5px] text-slate-600 italic bg-white p-2 rounded border border-slate-200/80">
                            "{p.committeeNotes}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
