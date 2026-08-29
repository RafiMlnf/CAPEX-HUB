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

    // 100% Dynamic workflow steps from database / Admin Settings
    const dynamicSteps = workflowSteps && workflowSteps.length > 0
      ? workflowSteps
      : (workflow?.list_approval || [])
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((s) => s.role)
          .filter(Boolean);

    // If no workflow steps found, fallback to current step
    const steps = dynamicSteps.length > 0 ? dynamicSteps : [proposal.step];

    let nextStatus = proposal.status;
    let nextStep = proposal.step;

    if (action === "Approve") {
      // Find current step position in the dynamic steps list
      const currentIdx = steps.findIndex(
        (s) => s.toLowerCase().trim() === (proposal.step || "").toLowerCase().trim()
      );

      if (currentIdx >= 0 && currentIdx < steps.length - 1) {
        // Advance to next dynamic step
        nextStep = steps[currentIdx + 1];
        nextStatus = "Pending Review";
      } else {
        // Last step completed -> Approved
        nextStep = steps[steps.length - 1] || proposal.step;
        nextStatus = "Approved";
      }
    } else if (action === "Reject") {
      nextStatus = "Rejected";
    } else if (action === "Revision") {
      nextStatus = "Revision Required";
      // Return to the first step of this department's dynamic workflow
      nextStep = steps[0] || "Draft";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-800">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">Review Persetujuan BODR</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{proposal.bodrNo}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-semibold transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <p className="text-xs font-semibold text-slate-800">{proposal.title}</p>
            <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              <span>Pengusul: <strong className="font-semibold text-slate-700">{proposal.proposer}</strong></span>
              <span className="font-mono font-semibold text-blue-600">Rp {proposal.amount.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">Pilih Tindakan *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction("Approve")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  action === "Approve"
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setAction("Revision")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  action === "Revision"
                    ? "bg-orange-500 border-orange-500 text-white shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Revisi
              </button>
              <button
                type="button"
                onClick={() => setAction("Reject")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  action === "Reject"
                    ? "bg-red-600 border-red-600 text-white shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Reject
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">Catatan / Justifikasi *</label>
            <textarea
              required={action !== "Approve"}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={action === "Approve" ? "Catatan opsional..." : "Berikan alasan justifikasi/revisi..."}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-blue-600 focus:outline-none resize-none font-normal"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-2xs disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
            >
              {submitting ? "Memproses..." : "Konfirmasi Tindakan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
