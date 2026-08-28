"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { User, ApiVendor, ApiJenisOtorisasi, api, BodrProposal } from "@/app/lib/api";

interface BodrOtorisasiModalProps {
  proposal: BodrProposal;
  currentUser: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BodrOtorisasiModal({
  proposal,
  currentUser,
  onClose,
  onSuccess,
}: BodrOtorisasiModalProps) {
  const [prNo, setPrNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prNo) {
      setError("No. PR wajib diisi!");
      return;
    }
    setError("");
    setSubmitting(true);

    const payload = {
      no_doc: `OH-NP/${new Date().toISOString().slice(0, 10).replace(/-/g, "")}/${String(Math.floor(1000 + Math.random() * 9000))}`,
      no_pr: prNo,
      bodr_id: proposal.id,
      no_bodr: proposal.bodrNo,
      dana_bodr: proposal.amount,
      tanggal: new Date().toISOString().split("T")[0],
      buyer_id: currentUser?.id || "USR-001",
      buyer_nama: currentUser?.name || "Purchasing Staff",
      suppliers: [],
      step: "SH PURH",
      status: "Pending Review",
      approval_history: [],
    };

    try {
      await api.createOtorisasiHargaNP(payload);
      await Swal.fire({
        title: "Berhasil",
        text: "Pengajuan Otorisasi Harga berhasil dikirim ke Purchasing!",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Gagal mengajukan Otorisasi Harga.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-800">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">Pengajuan Otorisasi Harga</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 font-semibold transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 font-normal">{error}</p>}

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
              No. PR (Input Manual) *
            </label>
            <input
              required
              type="text"
              value={prNo}
              onChange={(e) => setPrNo(e.target.value)}
              placeholder="Contoh: PR-2026-001"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              No. BODR (Otomatis)
            </label>
            <input
              type="text"
              disabled
              value={proposal.bodrNo || "-"}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Judul Investasi
            </label>
            <input
              type="text"
              disabled
              value={proposal.title}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 truncate"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Nilai Investasi (Dana BODR)
            </label>
            <input
              type="text"
              disabled
              value={`Rp ${proposal.amount.toLocaleString("id-ID")}`}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold font-mono text-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Memproses..." : "Kirim Pengajuan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
