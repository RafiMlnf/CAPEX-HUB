"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";
import { User, api, BodrProposal, ApiApprovalWorkflow } from "@/app/lib/api";

interface BodrApprovalActionModalProps {
  proposal: BodrProposal;
  currentUser: User | null;
  workflow?: ApiApprovalWorkflow | null;
  workflowSteps?: string[];
  onClose: () => void;
  onSuccess: (updated: BodrProposal) => void;
}

export default function BodrApprovalActionModal({
  proposal,
  currentUser,
  workflow,
  workflowSteps,
  onClose,
  onSuccess,
}: BodrApprovalActionModalProps) {
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"Approve" | "Reject" | "Revision">("Approve");
  const [submitting, setSubmitting] = useState(false);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note && action !== "Approve") {
      Swal.fire({
        title: "Perhatian",
        text: "Catatan justifikasi wajib diisi untuk penolakan atau permintaan revisi.",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    setSubmitting(true);

    const actorName = currentUser?.name || "Approver";
    const actorRole = currentUser?.role || "Approver";

    // Resolve current pending step dari approval_history (100% dinamis dari DB — zero hardcode)
    const sortedHistory = [...(proposal.approvalHistory || [])].sort(
      (a, b) => (a.step_order ?? 0) - (b.step_order ?? 0)
    );
    const pendingStep = sortedHistory.find(
      (h) => (h.status || "").toLowerCase() === "pending"
    );
    const totalSteps = sortedHistory.length;
    const isLastStep =
      pendingStep?.step_order !== undefined &&
      pendingStep.step_order === totalSteps;

    let nextStatus = proposal.status;
    let nextStep = proposal.step;

    if (action === "Approve") {
      if (isLastStep) {
        nextStatus = "Approved";
        nextStep = pendingStep?.role || "Approved";
      } else {
        const nextStepOrder = (pendingStep?.step_order ?? 0) + 1;
        const nextStepItem = sortedHistory.find((h) => h.step_order === nextStepOrder);
        nextStatus = "Pending Review";
        nextStep = nextStepItem?.role || "Pending Review";
      }
    } else if (action === "Reject") {
      nextStatus = "Rejected";
      nextStep = pendingStep?.role || proposal.step;
    } else if (action === "Revision") {
      nextStatus = "Revision Required";
      const firstStep = sortedHistory[0];
      nextStep = firstStep?.role || "Draft";
    }

    const newHistory = [
      ...(proposal.approvalHistory || []),
      {
        initials: actorName.slice(0, 2).toUpperCase(),
        role: actorRole,
        name: actorName,
        status: action === "Approve" ? "Approved" : action === "Reject" ? "Rejected" : "Revision Required",
        timestamp: new Date().toLocaleString("id-ID"),
        note: note || "Disetujui tanpa catatan",
      },
    ];

    const updatedProposal: BodrProposal = {
      ...proposal,
      step: nextStep,
      status: nextStatus,
      lastActor: actorName,
      lastNote: note,
      approvalHistory: newHistory,
    };

    try {
      await api.updateBodrProposal(proposal.id, {
        approval_action: action === "Approve" ? "approved" : action === "Reject" ? "rejected" : "revision",
        step_order: pendingStep?.step_order,
        approver_user_id: currentUser?.id ? parseInt(currentUser.id) : undefined,
        comment: note || null,
        step: nextStep,
        status: nextStatus,
        last_actor: actorName,
        last_note: note,
        approval_history: newHistory,
      });
      await Swal.fire({
        title: "Berhasil",
        text: `Persetujuan berhasil diproses: ${action}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      onSuccess(updatedProposal);
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Gagal",
        text: "Gagal memproses persetujuan BODR.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Review Persetujuan BODR
              </h3>
              <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                {proposal.bodrNo && proposal.bodrNo !== "—" ? proposal.bodrNo : `ID: #${proposal.id}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
          {/* Proposal Summary Card */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-2 shadow-2xs">
            <p className="text-xs font-bold text-slate-900 leading-snug">{proposal.title}</p>
            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-200/70">
              <span>
                Pengusul: <strong className="font-bold text-slate-700">{proposal.proposer}</strong> ({proposal.department})
              </span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-md">
                Rp {proposal.amount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Action Choice Tiles */}
          <div>
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Pilih Keputusan Persetujuan *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setAction("Approve")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  action === "Approve"
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Approve</span>
              </button>

              <button
                type="button"
                onClick={() => setAction("Revision")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  action === "Revision"
                    ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Revisi</span>
              </button>

              <button
                type="button"
                onClick={() => setAction("Reject")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  action === "Reject"
                    ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* Catatan / Justifikasi */}
          <div>
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Catatan / Justifikasi {action !== "Approve" ? "*" : "(Opsional)"}
            </label>
            <textarea
              required={action !== "Approve"}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={action === "Approve" ? "Catatan persetujuan opsional..." : "Tuliskan alasan penolakan atau perbaikan yang dibutuhkan..."}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none resize-none font-normal shadow-2xs transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end items-center gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-2xs uppercase"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer active:scale-95 transition-all uppercase"
            >
              {submitting ? "Memproses..." : "Konfirmasi Tindakan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
