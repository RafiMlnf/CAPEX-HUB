"use client";

import { useState, useMemo, Suspense } from "react";
import Sidebar from "../../components/sidebars/SidebarFS";
import Header from "../../components/Header";
import StatusBadge from "../../components/StatusBadge";
import { useCapex } from "../../context/CapexContext";
import { CapexProposal, api } from "../../lib/api";
import { useRouter } from "next/navigation";

export default function DraftsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-semibold text-slate-500">Loading Drafts Page...</div>}>
      <DraftsPageContent />
    </Suspense>
  );
}

function DraftsPageContent() {
  const { proposals, editProposal, hasPermission, currentUser } = useCapex();
  const router = useRouter();
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });
  const [activeTab, setActiveTab] = useState<"revisi" | "pending" | "ditolak">("revisi");
  const [uploadProposal, setUploadProposal] = useState<CapexProposal | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<string[]>([]);
  const [selectedNotesProposal, setSelectedNotesProposal] = useState<CapexProposal | null>(null);

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  };

  const isAllAccess =
    hasPermission("perm_review_capex") ||
    hasPermission("perm_committee_review") ||
    hasPermission("perm_view_reports") ||
    (currentUser?.role || "").toLowerCase() === "admin";

  // Filter proposals strictly per logged-in user / PIC unless admin
  const userProposals = useMemo(() => {
    if (isAllAccess) return proposals;
    if (!currentUser) return proposals;

    const userName = (currentUser.name || "").toLowerCase().trim();
    const userNpk = (currentUser.npk || "").toLowerCase().trim();
    const username = (currentUser.username || "").toLowerCase().trim();

    return proposals.filter((p: any) => {
      const pPic = (p.pic || "").toLowerCase().trim();
      return (
        (userName && (pPic === userName || pPic.includes(userName))) ||
        (username && (pPic === username || pPic.includes(username))) ||
        (userNpk && pPic === userNpk)
      );
    });
  }, [proposals, isAllAccess, currentUser]);

  // 1. Revisi (Revisi Finance, Revisi Komite, atau Draft tersimpan)
  const revisionProposals = userProposals.filter(
    (p: any) =>
      p.gateStatus === "Gate 2 - Revised" ||
      p.gateStatus === "Gate 0 - Idea" ||
      p.gateStatus === "Gate 0 - Draft" ||
      p.gateStatus === "Draft" ||
      p.revisionSource === "Finance" ||
      p.revisionSource === "Committee"
  );

  // 2. Pending Upload Dokumen (Menunggu dokumen tambahan dari pengaju)
  const pendingProposals = userProposals.filter((p: any) => p.gateStatus === "Gate 1 - Pending User Feedback");

  // 3. Ditolak Komite (Rejected)
  const rejectedProposals = userProposals.filter(
    (p: any) => p.gateStatus === "Gate 2 - Rejected" || p.gateStatus === "Rejected"
  );

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 pl-64">
        <Header title="DRAFT & TINDAKAN CAPEX" />

        {/* Toast */}
        {toast.show && (
          <div className={`fixed top-20 right-8 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl transition-all ${
            toast.type === "success" ? "bg-white border-emerald-500/50 text-emerald-600" : "bg-white border-red-500/50 text-red-650"
          }`}>
            {toast.message}
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Instruction banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-1">
                Pusat Tindakan & Draft CAPEX
              </h2>
              <p className="text-xs opacity-90 leading-relaxed font-normal">
                Kelola usulan Anda yang memerlukan tindakan perbaikan (Revisi), permintaan dokumen pendukung (Pending), dan arsip usulan Ditolak.
              </p>
            </div>
          </div>

          {/* Action Tabs: Revisi, Pending, Ditolak */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("revisi")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "revisi"
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  1. Revisi
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === "revisi" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {revisionProposals.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "pending"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  2. Pending
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {pendingProposals.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("ditolak")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "ditolak"
                      ? "bg-red-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  3. Ditolak
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === "ditolak" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {rejectedProposals.length}
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                PIC Pengguna: <span className="font-semibold text-slate-700">{currentUser?.name || currentUser?.username || "All"}</span>
              </div>
            </div>

            {/* Tab 1: Revisi Content */}
            {activeTab === "revisi" && (
              revisionProposals.length === 0 ? (
                <div className="py-12 text-center text-slate-500 italic text-xs font-normal">
                  Tidak ada draft atau usulan CAPEX yang perlu direvisi saat ini.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200">No</th>
                        <th className="py-2.5 px-3 w-28 border-r border-slate-200">ID CAPEX</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">Nama Project</th>
                        <th className="py-2.5 px-3 w-28 border-r border-slate-200">Dept</th>
                        <th className="py-2.5 px-3 w-28 text-right border-r border-slate-200">Estimasi Biaya</th>
                        <th className="py-2.5 px-3 border-r border-slate-200 text-center">Tipe / Catatan</th>
                        <th className="py-2.5 px-3 w-32 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-xs">
                      {revisionProposals.map((p, idx) => {
                        const isFinanceRev = p.revisionSource === "Finance" || p.financeNotes;
                        const isCommitteeRev = p.revisionSource === "Committee" || p.committeeNotes;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 text-center border-r border-slate-200 font-medium">{idx + 1}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-semibold text-slate-800">{p.id}</td>
                            <td className="py-2.5 px-3 border-r border-slate-200 font-semibold text-slate-800">
                              <div>{p.name}</div>
                              {p.description && (
                                <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">{p.description}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-200 font-medium">{p.department}</td>
                            <td className="py-2.5 px-3 text-right border-r border-slate-200 font-semibold text-blue-600">
                              Rp {p.estimatedCost.toLocaleString("id-ID")}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                              {isCommitteeRev ? (
                                <button
                                  onClick={() => setSelectedNotesProposal(p)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                                >
                                  Revisi Komite
                                </button>
                              ) : isFinanceRev ? (
                                <button
                                  onClick={() => setSelectedNotesProposal(p)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                                >
                                  Revisi Finance
                                </button>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  Draft Pengaju
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => router.push(`/planning?edit=${p.id}`)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg tracking-wider transition-all shadow-2xs cursor-pointer text-[10px]"
                              >
                                EDIT / KIRIM
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {activeTab === "pending" && (
              pendingProposals.length === 0 ? (
                <div className="py-12 text-center text-slate-500 italic text-xs font-normal">
                  Tidak ada pengajuan yang membutuhkan upload dokumen pendukung saat ini.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                        <th className="py-3 px-3 w-12 text-center border-r border-slate-200">No</th>
                        <th className="py-3 px-3 w-28 border-r border-slate-200">ID CAPEX</th>
                        <th className="py-3 px-3 border-r border-slate-200">Nama Project</th>
                        <th className="py-3 px-3 w-28 border-r border-slate-200">Dept</th>
                        <th className="py-3 px-3 w-28 text-right border-r border-slate-200">Estimasi Biaya</th>
                        <th className="py-3 px-3 border-r border-slate-200 text-center">Catatan Finance</th>
                        <th className="py-3 px-3 w-36 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-xs">
                      {pendingProposals.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 text-center border-r border-slate-200 font-medium">{idx + 1}</td>
                          <td className="py-3 px-3 border-r border-slate-200 font-mono font-semibold text-slate-800">{p.id}</td>
                          <td className="py-3 px-3 border-r border-slate-200 font-semibold text-slate-800">{p.name}</td>
                          <td className="py-3 px-3 border-r border-slate-200 font-medium">{p.department}</td>
                          <td className="py-3 px-3 text-right border-r border-slate-200 font-semibold text-blue-600">
                            Rp {p.estimatedCost.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-center">
                            {p.financeNotes ? (
                              <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-medium inline-block max-w-[200px] truncate" title={p.financeNotes}>
                                &quot;{p.financeNotes}&quot;
                              </span>
                            ) : "-"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                setUploadProposal(p);
                                setSupportingFiles(p.attachmentName ? p.attachmentName.split(", ") : []);
                              }}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg tracking-wider transition-all shadow-2xs cursor-pointer text-[10px]"
                            >
                              UPLOAD DOKUMEN
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {activeTab === "ditolak" && (
              rejectedProposals.length === 0 ? (
                <div className="py-12 text-center text-slate-500 italic text-xs font-normal">
                  Tidak ada proposal yang ditolak oleh Komite Review.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                        <th className="py-3 px-3 w-12 text-center border-r border-slate-200">No</th>
                        <th className="py-3 px-3 w-28 border-r border-slate-200">ID CAPEX</th>
                        <th className="py-3 px-3 border-r border-slate-200">Nama Project</th>
                        <th className="py-3 px-3 w-28 border-r border-slate-200">Dept</th>
                        <th className="py-3 px-3 w-28 text-right border-r border-slate-200">Estimasi Biaya</th>
                        <th className="py-3 px-3 border-r border-slate-200 text-center">Rekomendasi Komite</th>
                        <th className="py-3 px-3 w-24 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-xs">
                      {rejectedProposals.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 bg-red-50/5">
                          <td className="py-3 px-3 text-center border-r border-slate-200 font-medium">{idx + 1}</td>
                          <td className="py-3 px-3 border-r border-slate-200 font-mono font-semibold text-slate-800">{p.id}</td>
                          <td className="py-3 px-3 border-r border-slate-200 font-semibold text-slate-800">{p.name}</td>
                          <td className="py-3 px-3 border-r border-slate-200 font-medium">{p.department}</td>
                          <td className="py-3 px-3 text-right border-r border-slate-200 font-semibold text-red-600">
                            Rp {p.estimatedCost.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-200 text-center">
                            {p.committeeNotes ? (
                              <span className="text-red-700 bg-red-50 border border-red-150 px-2.5 py-1 rounded-lg font-medium inline-block max-w-[200px] truncate" title={p.committeeNotes}>
                                &quot;{p.committeeNotes}&quot;
                              </span>
                            ) : "-"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <StatusBadge status={p.gateStatus} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </main>
      </div>

      {/* Upload Attachment Modal */}
      {uploadProposal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-800 animate-scaleIn">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Upload File Pendukung: {uploadProposal.id}
              </h3>
              <button
                onClick={() => setUploadProposal(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed font-normal">
                Finance meminta dokumen pendukung tambahan untuk project <span className="font-semibold text-slate-800">{uploadProposal.name}</span>.
                {uploadProposal.financeNotes && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-250 text-amber-800 rounded-lg italic">
                    &quot;{uploadProposal.financeNotes}&quot;
                  </div>
                )}
              </div>

              {/* Upload Input */}
              <div className="space-y-3">
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Pilih File Pendukung (Maksimal 10 File)
                </label>
                
                {supportingFiles.length > 0 && (
                  <div className="p-3 border border-slate-200 rounded-lg space-y-1.5 bg-slate-50">
                    {supportingFiles.map((filename, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="truncate max-w-[250px] font-mono text-slate-700 font-medium">{filename}</span>
                        <button
                          onClick={() => setSupportingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {supportingFiles.length < 10 && (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all">
                      <div className="flex flex-col items-center justify-center pt-3 pb-4">
                        <svg className="w-6 h-6 mb-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-xs text-slate-500 font-medium">Click to upload files</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            try {
                              const uploadResults = await api.uploadMultipleDocuments(Array.from(files));
                              const names = uploadResults.map((r) => r.file_name || r.original_name);
                              setSupportingFiles((prev) => {
                                const combined = Array.from(new Set([...prev, ...names]));
                                return combined.slice(0, 10);
                              });
                            } catch (err) {
                              console.error("Upload error in drafts page:", err);
                            }
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-150">
                <button
                  onClick={() => setUploadProposal(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[10px] font-semibold rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    await editProposal(uploadProposal.id, {
                      attachmentName: supportingFiles.join(", "),
                      gateStatus: "Gate 1 - Finance Review", // send back to finance review
                    });
                    setUploadProposal(null);
                    triggerToast("Dokumen pendukung berhasil dikirim ke Finance Review!");
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Kirim Dokumen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Catatan Terakhir Details Modal */}
      {selectedNotesProposal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-slate-800 space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              Catatan Riwayat Ulasan
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Actor</span>
                <span className="font-medium text-slate-800">{selectedNotesProposal.history[selectedNotesProposal.history.length - 1]?.actor || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Tindakan</span>
                <span className="font-medium text-slate-800">{selectedNotesProposal.history[selectedNotesProposal.history.length - 1]?.action || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Catatan / Ulasan</span>
                <p className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 italic font-normal whitespace-pre-wrap">
                  &quot;{selectedNotesProposal.history[selectedNotesProposal.history.length - 1]?.notes || "Tidak ada catatan."}&quot;
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNotesProposal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
