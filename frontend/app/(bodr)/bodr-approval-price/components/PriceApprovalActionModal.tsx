"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";
import { User, api } from "@/app/lib/api";

interface PriceApprovalActionModalProps {
  item: any;
  type: "non-product" | "product";
  currentUser: User | null;
  workflowSteps: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function PriceApprovalActionModal({
  item,
  type,
  currentUser,
  workflowSteps,
  onClose,
  onSuccess,
}: PriceApprovalActionModalProps) {
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"Approved" | "Rejected">("Approved");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note && action === "Rejected") {
      Swal.fire({
        title: "Perhatian",
        text: "Alasan penolakan wajib diisi.",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    setSubmitting(true);

    const actorName = currentUser?.name || "Approver";
    const actorRole = currentUser?.role || "Approver";

    let nextStep = item.step;
    let nextStatus = item.status;

    if (action === "Approved") {
      const fallbackSteps = ["SH PURH", "DH PURH", "User DH", "User Div Head", "Admin Div Head", "Direktur", "Presiden Direktur"];
      const steps = workflowSteps.length > 0 ? workflowSteps : fallbackSteps;
      const currentIdx = steps.indexOf(item.step);
      if (currentIdx >= 0 && currentIdx < steps.length - 1) {
        nextStep = steps[currentIdx + 1];
        nextStatus = "Pending Review";
      } else {
        nextStatus = "Approved";
      }
    } else {
      nextStatus = "Rejected";
    }

    const newHistory = [
      ...(item.approval_history || []),
      {
        role: actorRole,
        name: actorName,
        status: action,
        timestamp: new Date().toLocaleString("id-ID"),
        note: note || "Disetujui tanpa catatan",
      },
    ];

    try {
      if (type === "non-product") {
        await api.updateOtorisasiHargaNP(item.id, {
          step: nextStep,
          status: nextStatus,
          approval_history: newHistory,
        });
      } else {
        await api.updateOtorisasiHarga(item.id, {
          step: nextStep,
          status: nextStatus,
          approval_history: newHistory,
        });
      }
      await Swal.fire({
        title: "Berhasil",
        text: `Persetujuan Otorisasi Harga berhasil diproses: ${action}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Gagal",
        text: "Gagal memproses persetujuan.",
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
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Review Otorisasi Harga</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 font-bold transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
            <p><strong>No. PR:</strong> {item.no_pr || item.id}</p>
            {type === "non-product" ? (
              <p><strong>No. BODR:</strong> {item.no_bodr || "-"}</p>
            ) : (
              <p><strong>Produk:</strong> {item.product}</p>
            )}
            <p><strong>Tahap:</strong> <span className="font-bold text-blue-600">{item.step}</span></p>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider block mb-1.5">Tindakan *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAction("Approved")}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                  action === "Approved"
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setAction("Rejected")}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                  action === "Rejected"
                    ? "bg-red-600 border-red-600 text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Reject
              </button>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider block mb-1">Catatan Justifikasi *</label>
            <textarea
              required={action === "Rejected"}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={action === "Approved" ? "Catatan opsional..." : "Alasan penolakan..."}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? "Memproses..." : "Konfirmasi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
