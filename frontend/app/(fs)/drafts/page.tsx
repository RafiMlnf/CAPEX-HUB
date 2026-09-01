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
  const [activeTab, setActiveTab] = useState<"all" | "revisions" | "pending" | "rejected">("all");
  const [selectedNotesProposal, setSelectedNotesProposal] = useState<CapexProposal | null>(null);

  const calculateLeadTime = (createdAt?: string) => {
    if (!createdAt) return "0 Hari";
    const start = new Date(createdAt).getTime();
    const now = Date.now();
    const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    return `${diffDays} Hari`;
  };

  const isAdmin =
    (currentUser?.role || "").toLowerCase() === "admin" ||
    (currentUser?.username || "").toLowerCase() === "admin";

  // Filter proposals strictly based on logged-in user / PIC
  const userProposals = useMemo(() => {
    if (!currentUser) return proposals;

    const userName = (currentUser.name || "").toLowerCase().trim();
    const userNpk = (currentUser.npk || "").toLowerCase().trim();
    const username = (currentUser.username || "").toLowerCase().trim();

    return proposals.filter((p: any) => {
      const pPic = (p.pic || "").toLowerCase().trim();

      const isMyPic =
        (userName && (pPic === userName || pPic.includes(userName))) ||
        (username && pPic === username) ||
        (userNpk && pPic === userNpk);

      // If admin, show all or user's
      if (isAdmin) return true;

      return isMyPic;
    });
  }, [proposals, currentUser, isAdmin]);

  // Exclude proposals currently in Finance Review pipeline (Gate 1 - Finance Review)
  const draftEligibleProposals = useMemo(() => {
    return userProposals.filter((p: any) => {
      const gs = (p.gateStatus || "").toLowerCase();
      // Exclude in-review proposals from drafts
      if (gs === "gate 1 - finance review" || gs === "gate 2 - committee review" || gs === "approved" || gs === "closed") {
        return false;
      }
      return true;
    });
  }, [userProposals]);

  // 1. REVISI: Dikembalikan untuk revisi oleh Finance atau Komite
  const revisionProposals = useMemo(() => {
    return draftEligibleProposals.filter((p: any) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return (
        gs.includes("revis") ||
        p.revisionSource === "Finance" ||
        p.revisionSource === "Committee" ||
        (gs.includes("idea") && (p.financeNotes || p.committeeNotes))
      );
    });
  }, [draftEligibleProposals]);

  // 2. PENDING / DRAFT: Draft baru yang belum dikirimkan / belum ada revisi atau penolakan
  const pendingDraftProposals = useMemo(() => {
    return draftEligibleProposals.filter((p: any) => {
      const gs = (p.gateStatus || "").toLowerCase();
      const isDraftStatus = gs.includes("idea") || gs.includes("draft") || gs === "pending";
      const isNotRevision = !p.revisionSource && !p.financeNotes && !p.committeeNotes;
      const isNotRejected = !gs.includes("reject");
      return isDraftStatus && isNotRevision && isNotRejected;
    });
  }, [draftEligibleProposals]);

  // 3. DITOLAK: Proposal yang ditolak oleh Komite
  const rejectedProposals = useMemo(() => {
    return draftEligibleProposals.filter((p: any) => {
      const gs = (p.gateStatus || "").toLowerCase();
      return gs.includes("reject");
    });
  }, [draftEligibleProposals]);

  const displayedProposals = useMemo(() => {
    if (activeTab === "revisions") return revisionProposals;
    if (activeTab === "pending") return pendingDraftProposals;
    if (activeTab === "rejected") return rejectedProposals;
    return draftEligibleProposals;
  }, [activeTab, revisionProposals, pendingDraftProposals, rejectedProposals, draftEligibleProposals]);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen ml-64 min-w-0 overflow-hidden">
        <Header
          title="DRAFT & TINDAKAN CAPEX"
          subtitle={`Daftar usulan CAPEX draft, revisi, dan penolakan untuk PIC: ${currentUser?.name || currentUser?.username || "User"}`}
        />

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-4.5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold uppercase tracking-wider">
                Pusat Draft & Tindakan CAPEX (Per PIC: {currentUser?.name || currentUser?.username || "User"})
              </h2>
              <p className="text-xs text-blue-100 leading-relaxed font-normal">
                Kelola usulan draft Anda, lakukan perbaikan atas permintaan revisi Finance/Komite, atau tinjau catatan hasil evaluasi.
              </p>
            </div>
            <button
              onClick={() => router.push("/planning")}
              className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer shrink-0"
            >
              + Buat Usulan Baru
            </button>
          </div>

          {/* Action Tabs: Semua, Revisi, Pending, Ditolak */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4 shadow-2xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl">
                {/* 1. SEMUA */}
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "all"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semua
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {draftEligibleProposals.length}
                  </span>
                </button>

                {/* 2. REVISI */}
                <button
                  onClick={() => setActiveTab("revisions")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "revisions"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Perlu Revisi
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === "revisions" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {revisionProposals.length}
                  </span>
                </button>

                {/* 3. PENDING (DRAFT) */}
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "pending"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pending / Draft
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {pendingDraftProposals.length}
                  </span>
                </button>

                {/* 4. DITOLAK */}
                <button
                  onClick={() => setActiveTab("rejected")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "rejected"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ditolak
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === "rejected" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {rejectedProposals.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Table Content */}
            {displayedProposals.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic text-xs font-normal">
                Tidak ada dokumen pada kategori ini.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200">No</th>
                      <th className="py-2.5 px-3 w-28 border-r border-slate-200">ID CAPEX</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Nama Project</th>
                      <th className="py-2.5 px-3 w-28 border-r border-slate-200">Purpose / Type</th>
                      <th className="py-2.5 px-3 w-24 border-r border-slate-200">PIC</th>
                      <th className="py-2.5 px-3 w-28 border-r border-slate-200">Leadtime</th>
                      <th className="py-2.5 px-3 w-28 text-right border-r border-slate-200">Estimasi Biaya</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-center">Status / Kategori</th>
                      <th className="py-2.5 px-3 w-32 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {displayedProposals.map((p, idx) => {
                      const isRev = revisionProposals.some((r) => r.id === p.id);
                      const isRej = rejectedProposals.some((r) => r.id === p.id);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center border-r border-slate-200 font-medium text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-semibold text-blue-600">
                            {p.capexId && p.capexId !== "-" ? p.capexId : p.id}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-semibold text-slate-800">
                            <div>{p.name}</div>
                            {p.description && (
                              <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">{p.description}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700">
                            <span className="font-semibold text-slate-800">{p.purpose || "-"}</span>
                            <span className="text-slate-500 block text-[10.5px]">{p.investmentType || "-"}</span>
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-700">{p.pic}</td>
                          <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            ⏱️ {calculateLeadTime(p.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 text-right border-r border-slate-200 font-semibold text-blue-600 font-mono whitespace-nowrap">
                            Rp {p.estimatedCost.toLocaleString("id-ID")}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                            {isRev ? (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md font-semibold text-[10px] border border-amber-200">
                                ⚠️ Revisi ({p.revisionSource || "Finance"})
                              </span>
                            ) : isRej ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-800 rounded-md font-semibold text-[10px] border border-rose-200">
                                ❌ Ditolak
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px] border border-slate-200">
                                📝 Pending Draft
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center space-x-1.5 whitespace-nowrap">
                            {isRev ? (
                              <button
                                onClick={() => router.push(`/planning?edit=${p.id}`)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all shadow-2xs cursor-pointer text-[10px]"
                              >
                                Edit Revisi
                              </button>
                            ) : isRej ? (
                              <button
                                onClick={() => setSelectedNotesProposal(p)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all border border-slate-300 cursor-pointer text-[10px]"
                              >
                                Alasan Tolak
                              </button>
                            ) : (
                              <button
                                onClick={() => router.push(`/planning?edit=${p.id}`)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-2xs cursor-pointer text-[10px]"
                              >
                                Lanjutkan
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Catatan Ulasan / Penolakan */}
          {selectedNotesProposal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
              <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Catatan Evaluasi — {selectedNotesProposal.capexId || selectedNotesProposal.name}
                  </h3>
                  <button
                    onClick={() => setSelectedNotesProposal(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {selectedNotesProposal.financeNotes && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                        Catatan Finance Review:
                      </span>
                      <p className="text-slate-700 italic">"{selectedNotesProposal.financeNotes}"</p>
                    </div>
                  )}

                  {selectedNotesProposal.committeeNotes && (
                    <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                        Catatan Komite Investasi:
                      </span>
                      <p className="text-slate-700 italic">"{selectedNotesProposal.committeeNotes}"</p>
                    </div>
                  )}

                  {!selectedNotesProposal.financeNotes && !selectedNotesProposal.committeeNotes && (
                    <p className="text-slate-500 italic">Belum ada catatan tertulis.</p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedNotesProposal(null)}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
