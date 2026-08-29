"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarFS";
import Header from "../../components/Header";
import StatusBadge from "../../components/StatusBadge";
import CommitteeReviewForm from "../../components/approvals/CommitteeReviewForm";
import { useCapex } from "../../context/CapexContext";
import { CapexProposal } from "../../lib/api";

export default function ApprovalsPage() {
  const { proposals, hasPermission, hasRole, activeRole, editProposal, currentUser } = useCapex();
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
            Halaman ini memerlukan izin <span className="font-semibold">perm_committee_review</span> atau hak akses menu terkait.
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

  const handleDecision = async (proposal: CapexProposal, decision: "Approve" | "Reject" | "Revise", notes: string) => {
    const effectiveNotes = notes.trim() || (
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
      newStatus = "Approved / Archived";
      actionLabel = "Disetujui Komite (Selesai / Terarsip & Lanjut ke BODR)";
    } else if (decision === "Reject") {
      newStatus = "Gate 2 - Rejected";
      actionLabel = "Ditolak Komite";
    } else {
      newStatus = "Gate 0 - Idea";
      actionLabel = "Minta Revisi Komite (Kembali ke Draft)";
    }

    const reviewerName = currentUser?.name || "Komite Investasi (Direksi)";

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
        text: `Keputusan "${decision}" untuk usulan ${proposal.id} (${proposal.name}) berhasil disimpan!`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
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

  // Filter proposals waiting for Committee Review
  const pendingApprovals = proposals.filter((p) => p.gateStatus === "Gate 2 - Committee Review" || p.gateStatus?.toLowerCase().includes("committee"));
  const processedApprovals = proposals.filter(
    (p) =>
      p.gateStatus === "Gate 3 - Procurement" ||
      p.gateStatus === "Gate 4 - Commissioning" ||
      p.gateStatus === "Gate 5 - Benefit Realization" ||
      p.gateStatus === "Gate 6 - Project Closing" ||
      p.gateStatus === "Closed" ||
      p.gateStatus === "Gate 2 - Rejected" ||
      p.history.some((h) => h.actor.includes("Committee"))
  );

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen ml-64 bg-slate-100 min-w-0 overflow-x-hidden">
        <Header
          title="Persetujuan Investasi Komite"
          subtitle="Dashboard peninjauan dan persetujuan pengajuan Capex oleh Komite Investasi (Division Head ke atas)"
        />

        {/* Toast */}
        {toast.show && (
          <div className={`fixed top-20 right-8 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl transition-all ${toast.type === "success" ? "bg-white border-emerald-500/50 text-emerald-600" : "bg-white border-red-500/50 text-red-650"
            }`}>
            {toast.message}
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 w-full min-w-0 overflow-x-hidden">
          {/* CommitteeReviewForm component (Full Width Table) */}
          <div className="w-full">
            <CommitteeReviewForm
              pendingApprovals={pendingApprovals}
              onDecision={handleDecision}
            />
          </div>
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
