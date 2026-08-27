"use client";

import { useState } from "react";
import { CapexProposal, FsCategory } from "../../lib/api";
import InfoTooltip from "../InfoTooltip";

interface FinanceReviewFormProps {
  pendingProposals: CapexProposal[];
  onSubmitReview: (proposal: CapexProposal, reviewData: {
    isFsRequired: boolean;
    fsCategory: FsCategory;
    financeNotes: string;
  }) => void;
}

export default function FinanceReviewForm({ pendingProposals, onSubmitReview }: FinanceReviewFormProps) {
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [isFsRequired, setIsFsRequired] = useState<boolean>(true);
  const [fsCategory, setFsCategory] = useState<FsCategory>("Capacity Up");
  const [financeNotes, setFinanceNotes] = useState("");

  const handleSubmit = (e: React.FormEvent, proposal: CapexProposal) => {
    e.preventDefault();
    onSubmitReview(proposal, {
      isFsRequired,
      fsCategory: isFsRequired ? fsCategory : "Supporting",
      financeNotes,
    });
    setSelectedProposalId(null);
    setFinanceNotes("");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
      <div className="pb-2 border-b border-slate-200 flex items-center gap-3">
        <div className="bg-blue-600 text-white font-semibold text-sm w-7 h-7 flex items-center justify-center rounded-lg shrink-0">
          1
        </div>
        <div>
          <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center">
            Verifikasi Ide Investasi
            <InfoTooltip content="Tinjau ide yang masuk dan tentukan apakah memerlukan Feasibility Study (FS) beserta jenisnya." />
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {pendingProposals.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-6">
            Tidak ada ide pengajuan baru yang menunggu verifikasi Finance.
          </p>
        ) : (
          pendingProposals.map((item) => (
            <div
              key={item.id}
              className={`border rounded-xl p-4 transition-all ${
                selectedProposalId === item.id
                  ? "border-blue-500 bg-blue-50/10"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-slate-650 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-semibold">
                    {item.id}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-800 mt-2">{item.name}</h3>
                  <p className="text-xs text-slate-600 mt-1.5">{item.description}</p>
                  <div className="text-xs text-slate-500 flex gap-4 mt-3">
                    <span>Dept: <span className="font-semibold text-slate-700">{item.department}</span></span>
                    <span>Biaya: <span className="font-semibold text-blue-600">Rp {item.estimatedCost.toLocaleString("id-ID")}</span></span>
                  </div>
                </div>
                {selectedProposalId !== item.id && (
                  <button
                    onClick={() => {
                      setSelectedProposalId(item.id);
                      setIsFsRequired(true);
                      setFsCategory("Capacity Up");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold tracking-wide hover:border-blue-500 hover:text-blue-600 transition-all cursor-pointer shadow-2xs"
                  >
                    Pilih Verifikasi
                  </button>
                )}
              </div>

              {selectedProposalId === item.id && (
                <form
                  onSubmit={(e) => handleSubmit(e, item)}
                  className="mt-4 pt-4 border-t border-slate-200 space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        Memerlukan Feasibility Study (FS)?
                      </label>
                      <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 w-fit">
                        <button
                          type="button"
                          onClick={() => setIsFsRequired(true)}
                          className={`px-4 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                            isFsRequired ? "bg-blue-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Ya (FS)
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsFsRequired(false)}
                          className={`px-4 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                            !isFsRequired ? "bg-amber-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Tidak (Non-FS)
                        </button>
                      </div>
                    </div>

                    {isFsRequired && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                          Alternatif Klasifikasi FS
                        </label>
                        <select
                          value={fsCategory}
                          onChange={(e) => setFsCategory(e.target.value as FsCategory)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
                        >
                          <option value="Capacity Up">Capacity Up</option>
                          <option value="Capability - New Product Expansion">Capability - New Product Expansion</option>
                          <option value="Capability - Increase Value Added & Competency">Capability - Increase Value Added & Competency</option>
                          <option value="Capability - Restore Capacity">Capability - Restore Capacity</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Catatan Finance
                    </label>
                    <input
                      type="text"
                      placeholder="Tulis catatan kelayakan..."
                      value={financeNotes}
                      onChange={(e) => setFinanceNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedProposalId(null)}
                      className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer shadow-2xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-2xs"
                    >
                      Simpan Verifikasi
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
