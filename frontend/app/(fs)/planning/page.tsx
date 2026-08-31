"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarFS";
import Header from "../../components/Header";
import StatusBadge from "../../components/StatusBadge";
import IdeaForm from "../../components/planning/IdeaForm";
import PlanningLeadTimeSection from "../../components/planning/PlanningLeadTimeSection";
import Modal from "../../components/shared/Modal";
import { useCapex } from "../../context/CapexContext";
import { CapexProposal, api } from "../../lib/api";
import { formatDateDisplay } from "../../lib/dateUtils";

export default function PlanningPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-semibold text-slate-500">Memuat Halaman Perencanaan CAPEX...</div>}>
      <PlanningPageContent />
    </Suspense>
  );
}

function PlanningPageContent() {
  const { proposals, hasPermission, createProposal, editProposal, loadingProposals, currentUser } = useCapex();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState<CapexProposal | null>(null);
  const [viewingProposal, setViewingProposal] = useState<CapexProposal | null>(null);
  const [uploadProposal, setUploadProposal] = useState<CapexProposal | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<string[]>([]);

  // Search, Filter & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const canCreate = hasPermission("perm_create_capex");

  const isAdmin =
    (currentUser?.role || "").toLowerCase() === "admin" ||
    (currentUser?.username || "").toLowerCase() === "admin";

  const isAllAccess =
    hasPermission("perm_review_capex") ||
    hasPermission("perm_committee_review") ||
    hasPermission("perm_view_reports") ||
    hasPermission("ALL_ACCESS") ||
    isAdmin;

  // Filter proposals according to user login & role permissions
  const visibleProposals = useMemo(() => {
    if (isAllAccess) return proposals;
    if (!currentUser) return proposals;

    const userDept = (currentUser.department || "").toLowerCase().trim();
    const userName = (currentUser.name || "").toLowerCase().trim();
    const userNpk = (currentUser.npk || "").toLowerCase().trim();
    const username = (currentUser.username || "").toLowerCase().trim();

    return proposals.filter((p: any) => {
      const pDept = (p.department || "").toLowerCase().trim();
      const pPic = (p.pic || "").toLowerCase().trim();

      const isSameDept = userDept && (pDept === userDept || pDept.includes(userDept) || userDept.includes(pDept));
      const isSamePic =
        (userName && (pPic === userName || pPic.includes(userName))) ||
        (username && pPic === username) ||
        (userNpk && pPic === userNpk);

      return isSameDept || isSamePic;
    });
  }, [proposals, isAllAccess, currentUser]);

  useEffect(() => {
    if (editId && visibleProposals.length > 0) {
      const found = visibleProposals.find((p) => p.id === editId);
      if (found) {
        setEditingProposal(found);
        setShowModal(true);
      }
    }
  }, [editId, visibleProposals]);

  const handleCreateIdea = async (proposalData: {
    id?: string;
    name: string;
    description: string;
    department: string;
    pic: string;
    estimatedCost: number;
    purpose: string;
    investmentType: string;
    startDate: string;
    endDate: string;
    attachmentName: string;
    isDraft?: boolean;
  }) => {
    try {
      const targetStatus = proposalData.isDraft ? "Gate 0 - Idea" : "Gate 1 - Finance Review";

      if (proposalData.id) {
        const existingP = proposals.find((p) => p.id === proposalData.id);
        const now = new Date().toISOString();
        const actorName = currentUser?.name || currentUser?.username || proposalData.pic || "Pemohon";

        await editProposal(proposalData.id, {
          name: proposalData.name,
          description: proposalData.description,
          department: proposalData.department,
          pic: proposalData.pic,
          estimatedCost: proposalData.estimatedCost,
          purpose: proposalData.purpose,
          investmentType: proposalData.investmentType,
          startDate: proposalData.startDate,
          endDate: proposalData.endDate,
          attachmentName: proposalData.attachmentName,
          gateStatus: targetStatus,
          history: [
            ...(existingP?.history || []),
            {
              gate: 0,
              action: proposalData.isDraft ? "Draft Diperbarui" : "Diajukan Ulang (Resubmitted)",
              actor: actorName,
              timestamp: now,
              notes: proposalData.description || "Usulan diperbarui oleh pemohon.",
            },
          ],
        });
        setShowModal(false);
        setEditingProposal(null);
        Swal.fire({
          title: proposalData.isDraft ? "Draft Disimpan" : "Berhasil Diperbarui",
          text: proposalData.isDraft
            ? "Usulan Budget Planning berhasil disimpan sebagai draft CAPEX."
            : "Usulan Budget Planning berhasil di-update dan diajukan ulang ke Finance Review.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createProposal({
          name: proposalData.name,
          description: proposalData.description,
          department: proposalData.department,
          pic: proposalData.pic,
          estimatedCost: proposalData.estimatedCost,
          purpose: proposalData.purpose,
          investmentType: proposalData.investmentType,
          startDate: proposalData.startDate,
          endDate: proposalData.endDate,
          attachmentName: proposalData.attachmentName,
          gateStatus: targetStatus,
        });
        setShowModal(false);
        setEditingProposal(null);
        Swal.fire({
          title: proposalData.isDraft ? "Draft Disimpan" : "Berhasil Diajukan",
          text: proposalData.isDraft
            ? "Pengajuan Budget Planning berhasil disimpan ke dalam Draft CAPEX."
            : "Pengajuan Budget Planning baru berhasil dibuat dan diteruskan ke Finance Review.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      Swal.fire({
        title: "Gagal Menyimpan",
        text: err.message || "Terjadi kesalahan saat menyimpan perencanaan budget.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  // Filtered proposals
  const filteredProposals = useMemo(() => {
    return visibleProposals.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q)) ||
        (p.pic && p.pic.toLowerCase().includes(q)) ||
        (p.purpose && p.purpose.toLowerCase().includes(q)) ||
        (p.investmentType && p.investmentType.toLowerCase().includes(q));

      const status = (p.gateStatus || (p as any).status || "").toLowerCase();
      let matchesStatus = true;
      if (statusFilter === "review") {
        matchesStatus = status.includes("review") || status.includes("pending");
      } else if (statusFilter === "draft") {
        matchesStatus = status.includes("draft") || status.includes("idea");
      } else if (statusFilter === "reject") {
        matchesStatus = status.includes("reject");
      } else if (statusFilter === "revisi") {
        matchesStatus = status.includes("revis") || status.includes("feedback");
      } else if (statusFilter === "close") {
        matchesStatus =
          status.includes("close") ||
          status.includes("approved") ||
          status.includes("archived") ||
          status.includes("complet");
      }

      return matchesSearch && matchesStatus;
    });
  }, [visibleProposals, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage) || 1;
  const paginatedProposals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProposals.slice(start, start + itemsPerPage);
  }, [filteredProposals, currentPage, itemsPerPage]);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen ml-64 min-w-0 overflow-hidden">
        <Header
          title="Perencanaan Capex"
          subtitle="Daftar usulan perencanaan anggaran belanja modal dan manajemen inisiasi proyek"
        />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Banner Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800 tracking-tight">CAPEX Budget Planning Management</h2>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-semibold">
                      Perencanaan Anggaran
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Manajemen inisiasi proyek, penyusunan anggaran belanja modal (CAPEX), serta monitoring proses telaah kelayakan investasi.
                  </p>
                </div>
              </div>

              {/* Controls: Search, Status & Add Planning */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <input
                    type="text"
                    placeholder="Cari ID, Proyek, PIC..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="review">Review</option>
                  <option value="draft">Draft</option>
                  <option value="reject">Reject</option>
                  <option value="revisi">Revisi</option>
                  <option value="close">Close / Approved</option>
                </select>

                <span className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200 text-xs">
                  {filteredProposals.length} Usulan Terdaftar
                </span>

                {canCreate && (
                  <button
                    onClick={() => {
                      setEditingProposal(null);
                      setShowModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer text-xs shadow-xs active:scale-95 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Planning
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Unified Modern Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                DAFTAR USULAN PERENCANAAN BUDGET CAPEX
              </span>
              <span className="text-[11px] text-slate-500">
                Menampilkan {paginatedProposals.length} dari {filteredProposals.length} usulan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-36">ID Capex</th>
                    <th className="py-3 px-4 min-w-[200px]">Nama Proyek</th>
                    <th className="py-3 px-4 w-32">Departemen</th>
                    <th className="py-3 px-4 w-32">Purpose</th>
                    <th className="py-3 px-4 w-36">Investment Type</th>
                    <th className="py-3 px-4 w-32">PIC</th>
                    <th className="py-3 px-4 w-36 text-right">Estimasi Biaya</th>
                    <th className="py-3 px-4 w-40 text-center">Periode Pelaksanaan</th>
                    <th className="py-3 px-4 w-36 text-center">Status</th>
                    <th className="py-3 px-4 w-24 text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingProposals ? (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-slate-500 font-bold">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Memuat data perencanaan budget...
                      </td>
                    </tr>
                  ) : paginatedProposals.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-slate-400 italic">
                        {searchQuery
                          ? `Tidak ada perencanaan yang cocok dengan pencarian "${searchQuery}"`
                          : "Belum ada usulan perencanaan budget planning."}
                      </td>
                    </tr>
                  ) : (
                    paginatedProposals.map((p, idx) => {
                      const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                            {rowNumber}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                            {p.capexId && p.capexId !== "-" ? p.capexId : "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800 text-xs">{p.name}</p>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                            {p.department}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {p.purpose || "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-normal whitespace-nowrap">
                            {p.investmentType || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                            {p.pic}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            Rp {p.estimatedCost ? Number(p.estimatedCost).toLocaleString("id-ID") : "0"}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-600 font-mono text-[10px] font-normal whitespace-nowrap">
                            {p.startDate && p.endDate && p.startDate !== "-" && p.endDate !== "-"
                              ? `${formatDateDisplay(p.startDate)} s/d ${formatDateDisplay(p.endDate)}`
                              : p.startDate && p.startDate !== "-"
                              ? formatDateDisplay(p.startDate)
                              : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex justify-center">
                              <StatusBadge status={p.gateStatus} size="sm" noBackground />
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setViewingProposal(p)}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
                              title="Lihat Detail Usulan Perencanaan"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Lihat
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {!loadingProposals && filteredProposals.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">
                    Menampilkan <span className="font-semibold text-slate-800">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredProposals.length)}</span> - <span className="font-semibold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredProposals.length)}</span> dari <span className="font-semibold text-slate-800">{filteredProposals.length}</span> entri
                  </span>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">Tampilkan:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Pengajuan / Edit Budget Planning */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProposal(null);
        }}
        title={editingProposal ? `Edit Perencanaan Budget — ${editingProposal.name}` : "Pengajuan Budget Planning Baru"}
        maxWidth="max-w-6xl"
      >
        <IdeaForm
          isModal={true}
          initialData={editingProposal}
          onSubmit={handleCreateIdea}
          onCancel={() => {
            setShowModal(false);
            setEditingProposal(null);
          }}
        />
      </Modal>

      {/* Modal Upload File Pendukung (Pending User Feedback) */}
      <Modal
        open={!!uploadProposal}
        onClose={() => setUploadProposal(null)}
        title={`Upload File Pendukung: ${uploadProposal?.id}`}
        maxWidth="max-w-lg"
      >
        {uploadProposal && (
          <div className="space-y-4">
            <div className="text-xs text-slate-600 leading-relaxed font-normal">
              Finance meminta dokumen/file pendukung tambahan untuk proposal <b>{uploadProposal.name}</b>.
              {uploadProposal.financeNotes && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl italic">
                  &quot;{uploadProposal.financeNotes}&quot;
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Pilih File Pendukung (Maksimal 10 File)
              </label>

              {supportingFiles.length > 0 && (
                <div className="p-3 border border-slate-200 rounded-xl space-y-1.5 bg-slate-50">
                  {supportingFiles.map((filename, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="truncate max-w-[250px] font-mono text-slate-700 font-medium">{filename}</span>
                      <button
                        type="button"
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
                      <span className="text-[11px] text-slate-600 font-medium">Klik untuk upload file pendukung</span>
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
                            console.error("Upload error in planning page:", err);
                          }
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUploadProposal(null)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const now = new Date().toISOString();
                  const uploaderName = currentUser?.name || uploadProposal.pic || "Pemohon";
                  const fileListStr = supportingFiles.join(", ");

                  // Akumulasi dengan dokumen aktif keseluruhan — kirim hanya file baru untuk batch revisi ini
                  const existingAll = (uploadProposal.attachmentName || "")
                    .split(", ")
                    .map(s => s.trim())
                    .filter(Boolean);
                  const combinedAll = Array.from(new Set([...existingAll, ...supportingFiles])).join(", ");

                  await editProposal(uploadProposal.id, {
                    attachmentName: combinedAll,
                    revisedAttachmentName: fileListStr,
                    gateStatus: "Gate 1 - Finance Review",
                    history: [
                      ...(uploadProposal.history || []),
                      {
                        gate: 1,
                        action: "Dokumen Diunggah Ulang / Pendukung",
                        actor: uploaderName,
                        timestamp: now,
                        notes: `Dokumen pendukung diunggah: ${fileListStr}`,
                      },
                    ],
                  });
                  setUploadProposal(null);
                  Swal.fire({
                    title: "Berhasil Dikirim",
                    text: "Dokumen pendukung berhasil diunggah dan dikirim ke Finance Review.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                  });
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Kirim Dokumen
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Detail Perencanaan Budget (View Only) */}
      <Modal
        open={!!viewingProposal}
        onClose={() => setViewingProposal(null)}
        title={
          viewingProposal?.capexId && viewingProposal.capexId !== "-"
            ? `Detail Usulan Perencanaan: ${viewingProposal.capexId}`
            : `Detail Usulan Perencanaan: ${viewingProposal?.name || ""}`
        }
        maxWidth="max-w-7xl"
      >
        {viewingProposal && (
          <div className="space-y-3.5 text-xs text-slate-800">
            {/* Top Summary Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl">
              <div>
                <span className="text-[9px] uppercase font-semibold text-blue-700 tracking-wider">Nama Proyek</span>
                <h3 className="text-sm font-semibold text-slate-900 mt-0.5">{viewingProposal.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                {viewingProposal.capexId && viewingProposal.capexId !== "-" && (
                  <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                    {viewingProposal.capexId}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Status:</span>
                  <StatusBadge status={viewingProposal.gateStatus} size="sm" />
                </div>
              </div>
            </div>

            {/* 4-Column Grid Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5">
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">ID Capex Resmi</span>
                <p className="font-mono font-semibold text-blue-600 mt-0.5 truncate" title={viewingProposal.capexId || ""}>
                  {viewingProposal.capexId && viewingProposal.capexId !== "-" ? viewingProposal.capexId : "- (Belum Disetujui Komite)"}
                </p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">Departemen</span>
                <p className="font-semibold text-slate-800 mt-0.5 truncate">{viewingProposal.department || "-"}</p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">PIC Pengaju</span>
                <p className="font-semibold text-slate-800 mt-0.5 truncate">{viewingProposal.pic || "-"}</p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">Purpose</span>
                <p className="font-medium text-slate-700 mt-0.5 truncate">
                  {viewingProposal.purpose || "-"}
                </p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">Investment Type</span>
                <p className="font-medium text-slate-700 mt-0.5 truncate">
                  {viewingProposal.investmentType || "-"}
                </p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">Estimasi Biaya</span>
                <p className="font-semibold text-blue-600 font-mono mt-0.5 truncate">
                  Rp {viewingProposal.estimatedCost ? Number(viewingProposal.estimatedCost).toLocaleString("id-ID") : "0"}
                </p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">Durasi Pelaksanaan</span>
                <p className="font-medium text-slate-700 mt-0.5 truncate">
                  {viewingProposal.startDate && viewingProposal.endDate && viewingProposal.startDate !== "-" && viewingProposal.endDate !== "-"
                    ? `${formatDateDisplay(viewingProposal.startDate)} s/d ${formatDateDisplay(viewingProposal.endDate)}`
                    : viewingProposal.startDate && viewingProposal.startDate !== "-"
                    ? formatDateDisplay(viewingProposal.startDate)
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">Kebutuhan FS</span>
                <p className="font-medium text-slate-700 mt-0.5 truncate">
                  {viewingProposal.isFsRequired ? `Ya (FS: ${viewingProposal.fsCategory || "-"})` : "Tidak (Non-FS)"}
                </p>
              </div>
              {/* Jadwal Sidang Komite: Hanya muncul jika usulan telah disetujui Finance dan diteruskan ke Sidang Komite / tahap setelahnya */}
              {(() => {
                const gsLower = (viewingProposal.gateStatus || "").toLowerCase();
                const isApprovedByFinance =
                  gsLower.includes("committee") ||
                  gsLower.includes("komite") ||
                  gsLower.includes("procurement") ||
                  gsLower.includes("approved") ||
                  gsLower.includes("closed") ||
                  gsLower.includes("archived");

                if (!isApprovedByFinance || !viewingProposal.committeeReviewSchedule) return null;

                return (
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">Jadwal Sidang Komite</span>
                    <p className="font-semibold text-purple-900 mt-0.5 truncate">
                      📅 {formatDateDisplay(viewingProposal.committeeReviewSchedule)}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* 2-Column Responsive Layout: Left Details & Notes | Right Integrated Progress Lead Time */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column (lg:col-span-6): Lampiran Dokumen, Deskripsi & Catatan Review */}
              <div className="lg:col-span-6 space-y-3.5">
                {/* Lampiran Dokumen Usulan */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                    Lampiran Dokumen Usulan
                  </span>

                  {(() => {
                    const initialDocs = (viewingProposal.initialAttachmentName || "")
                      .split(", ")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const revisedDocs = (viewingProposal.revisedAttachmentName || "")
                      .split(", ")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const allDocs = (viewingProposal.attachmentName || "")
                      .split(", ")
                      .map((s) => s.trim())
                      .filter(Boolean);

                    // Baca semua batch revisi dari history (JSON array of arrays)
                    let revisionBatches: string[][] = [];
                    if (viewingProposal.revisedAttachmentHistory) {
                      try {
                        const rawBatches = JSON.parse(viewingProposal.revisedAttachmentHistory);
                        if (Array.isArray(rawBatches)) {
                          const seenFiles = new Set<string>();
                          revisionBatches = rawBatches
                            .map((batch: string[]) => {
                              const clean = batch.filter((f) => {
                                if (seenFiles.has(f)) return false;
                                seenFiles.add(f);
                                return true;
                              });
                              return clean;
                            })
                            .filter((b: string[]) => b.length > 0);
                        }
                      } catch { revisionBatches = []; }
                    }
                    // Fallback: jika history belum ada tapi revisedDocs ada, tampilkan sebagai batch tunggal
                    if (revisionBatches.length === 0 && revisedDocs.length > 0) {
                      revisionBatches = [revisedDocs];
                    }

                    const hasSeparateRevisions =
                      initialDocs.length > 0 &&
                      (revisionBatches.length > 0 ||
                        (allDocs.length > 0 &&
                          JSON.stringify(initialDocs) !== JSON.stringify(allDocs)));

                    if (hasSeparateRevisions && initialDocs.length > 0) {
                      return (
                        <div className="space-y-2">
                          {/* Dokumen Awal */}
                          <div className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase font-semibold text-slate-600 tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                Dokumen Awal
                              </span>
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                                {initialDocs.length} File
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                              {initialDocs.map((filename, i) => (
                                <a
                                  key={i}
                                  href={api.getUploadFileUrl(filename)}
                                  download={filename}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-between text-slate-700 hover:text-blue-600 font-mono font-medium text-[11px] bg-slate-50 hover:bg-blue-50/60 border border-slate-200 rounded px-2 py-1 transition-all shadow-2xs group"
                                  title={`Unduh Dokumen Awal: ${filename}`}
                                >
                                  <span className="truncate underline max-w-[180px]">{filename}</span>
                                  <svg className="w-3 h-3 text-slate-400 group-hover:text-blue-500 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </a>
                              ))}
                            </div>
                          </div>

                          {/* Semua batch Dokumen Revisi */}
                          {revisionBatches.map((batch, batchIdx) => (
                            <div key={batchIdx} className="bg-white border border-emerald-200 rounded-lg p-2.5 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] uppercase font-semibold text-emerald-700 tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Dokumen Revisi {revisionBatches.length > 1 ? `#${batchIdx + 1}` : ""}
                                </span>
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                                  {batch.length} File
                                </span>
                              </div>
                              <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                                {batch.map((filename, i) => (
                                  <a
                                    key={i}
                                    href={api.getUploadFileUrl(filename)}
                                    download={filename}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-between text-emerald-800 hover:text-emerald-900 font-mono font-medium text-[11px] bg-emerald-50/50 hover:bg-emerald-100/70 border border-emerald-200 rounded px-2 py-1 transition-all shadow-2xs group"
                                    title={`Unduh Dokumen Revisi #${batchIdx + 1}: ${filename}`}
                                  >
                                    <span className="truncate underline max-w-[180px]">{filename}</span>
                                    <svg className="w-3 h-3 text-emerald-600 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </a>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
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
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 font-mono font-medium text-[11px] bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 transition-all shadow-2xs cursor-pointer"
                                title={`Klik untuk mengunduh: ${cleanName}`}
                              >
                                <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="truncate max-w-[200px]">{cleanName}</span>
                              </a>
                            );
                          })
                        ) : (
                          <span className="text-slate-400 italic text-xs">Tidak ada lampiran dokumen.</span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Description */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                    Deskripsi Lengkap Proyek
                  </span>
                  <p className="text-slate-700 leading-relaxed font-normal bg-white p-2.5 rounded-lg border border-slate-200/70 whitespace-pre-line text-xs max-h-24 overflow-y-auto">
                    {viewingProposal.description || "-"}
                  </p>
                </div>

                {/* Finance Notes */}
                {(() => {
                  const financeEntries = (viewingProposal.history || [])
                    .filter((h) => {
                      if (h.gate !== 1 || !h.notes || !h.notes.trim()) return false;
                      const actLower = (h.action || "").toLowerCase();
                      const notesLower = (h.notes || "").toLowerCase();
                      if (
                        actLower.includes("unggah") ||
                        actLower.includes("upload") ||
                        notesLower.startsWith("dokumen pendukung diunggah") ||
                        notesLower.startsWith("dokumen pendukung:")
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((h) => ({ notes: h.notes!, actor: h.actor, timestamp: h.timestamp }));

                  const fallbackNote = financeEntries.length === 0 && viewingProposal.financeNotes
                    ? [{ notes: viewingProposal.financeNotes, actor: "Finance", timestamp: viewingProposal.financeApprovedAt || "" }]
                    : [];
                  const allFinanceNotes = [...financeEntries, ...fallbackNote];

                  if (allFinanceNotes.length === 0) return null;

                  if (allFinanceNotes.length === 1) {
                    const single = allFinanceNotes[0];
                    return (
                      <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Catatan Finance
                          </span>
                          {single.timestamp && (
                            <span className="text-[9px] text-amber-700 font-mono">
                              {formatDateDisplay(single.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className="text-amber-950 italic font-medium text-xs leading-relaxed">
                          &quot;{single.notes}&quot;
                        </p>
                        <p className="text-[10px] text-amber-700 font-semibold mt-1">
                          Pengulas: {single.actor}
                        </p>
                      </div>
                    );
                  }

                  const latestNote = allFinanceNotes[allFinanceNotes.length - 1];
                  const olderNotes = allFinanceNotes.slice(0, -1);

                  return (
                    <div className="space-y-2.5">
                      <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3.5 space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            Catatan Finance (Terkini)
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wider shadow-2xs">
                            ⚡ Terbaru
                          </span>
                        </div>
                        <p className="text-amber-950 italic font-semibold text-xs leading-relaxed">
                          &quot;{latestNote.notes}&quot;
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-amber-800 font-medium pt-1 border-t border-amber-200">
                          <span>Pengulas: <strong>{latestNote.actor}</strong></span>
                          {latestNote.timestamp && (
                            <span className="font-mono text-[9px]">{formatDateDisplay(latestNote.timestamp)}</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
                          <span>Riwayat Catatan Sebelumnya ({olderNotes.length} Komentar Lama)</span>
                        </span>
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1 divide-y divide-slate-200/80">
                          {olderNotes.map((entry, idx) => (
                            <div key={idx} className={`${idx > 0 ? "pt-2" : ""} space-y-1`}>
                              <div className="flex items-center justify-between">
                                <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-mono font-semibold">
                                  Revisi #{idx + 1} (Lama)
                                </span>
                                {entry.timestamp && (
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {formatDateDisplay(entry.timestamp)}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-700 italic font-normal text-xs leading-relaxed">
                                &quot;{entry.notes}&quot;
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                Pengulas: {entry.actor}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Committee Notes */}
                {(() => {
                  const committeeEntries = (viewingProposal.history || [])
                    .filter((h) => {
                      if (h.gate !== 2 || !h.notes || !h.notes.trim()) return false;
                      const actLower = (h.action || "").toLowerCase();
                      const notesLower = (h.notes || "").toLowerCase();
                      if (
                        actLower.includes("unggah") ||
                        actLower.includes("upload") ||
                        notesLower.startsWith("dokumen pendukung")
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((h) => ({ notes: h.notes!, actor: h.actor, timestamp: h.timestamp }));

                  const fallbackNote = committeeEntries.length === 0 && viewingProposal.committeeNotes
                    ? [{ notes: viewingProposal.committeeNotes, actor: "Komite Investasi", timestamp: viewingProposal.committeeApprovedAt || "" }]
                    : [];
                  const allCommitteeNotes = [...committeeEntries, ...fallbackNote];

                  if (allCommitteeNotes.length === 0) return null;

                  if (allCommitteeNotes.length === 1) {
                    const single = allCommitteeNotes[0];
                    return (
                      <div className="bg-purple-50/90 border border-purple-300 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-purple-900 tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            Catatan Sidang Komite Investasi
                          </span>
                          {single.timestamp && (
                            <span className="text-[9px] text-purple-700 font-mono">
                              {formatDateDisplay(single.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className="text-purple-950 italic font-medium text-xs leading-relaxed">
                          &quot;{single.notes}&quot;
                        </p>
                        <p className="text-[10px] text-purple-700 font-semibold mt-1">
                          Pengulas: {single.actor}
                        </p>
                      </div>
                    );
                  }

                  const latestComm = allCommitteeNotes[allCommitteeNotes.length - 1];
                  const olderComm = allCommitteeNotes.slice(0, -1);

                  return (
                    <div className="space-y-2.5">
                      <div className="bg-purple-50 border-2 border-purple-400 rounded-xl p-3.5 space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase font-bold text-purple-900 tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                            Catatan Sidang Komite (Terkini)
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold text-[9px] uppercase tracking-wider shadow-2xs">
                            ⚡ Terbaru
                          </span>
                        </div>
                        <p className="text-purple-950 italic font-semibold text-xs leading-relaxed">
                          &quot;{latestComm.notes}&quot;
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-purple-800 font-medium pt-1 border-t border-purple-200">
                          <span>Pengulas: <strong>{latestComm.actor}</strong></span>
                          {latestComm.timestamp && (
                            <span className="font-mono text-[9px]">{formatDateDisplay(latestComm.timestamp)}</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
                          <span>Riwayat Catatan Sidang Sebelumnya ({olderComm.length} Komentar Lama)</span>
                        </span>
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1 divide-y divide-slate-200/80">
                          {olderComm.map((entry, idx) => (
                            <div key={idx} className={`${idx > 0 ? "pt-2" : ""} space-y-1`}>
                              <div className="flex items-center justify-between">
                                <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-mono font-semibold">
                                  Sidang #{idx + 1} (Lama)
                                </span>
                                {entry.timestamp && (
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {formatDateDisplay(entry.timestamp)}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-700 italic font-normal text-xs leading-relaxed">
                                &quot;{entry.notes}&quot;
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                Pengulas: {entry.actor}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right Column (lg:col-span-6): Integrated Progress Stages & Lead Time */}
              <div className="lg:col-span-6 h-full">
                <PlanningLeadTimeSection proposal={viewingProposal} />
              </div>
            </div>

            {/* Footer Buttons with Action Routing */}
            {(() => {
              const st = (viewingProposal.gateStatus || "").toLowerCase();
              const canEditViewing = canCreate && (st.includes("idea") || st.includes("draft") || st.includes("revis"));
              const isViewingPendingFeedback = st.includes("pending");

              return (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {canEditViewing && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = viewingProposal;
                          setViewingProposal(null);
                          setEditingProposal(target);
                          setShowModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Perencanaan
                      </button>
                    )}

                    {isViewingPendingFeedback && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = viewingProposal;
                          setViewingProposal(null);
                          setUploadProposal(target);
                          setSupportingFiles(target.attachmentName ? target.attachmentName.split(", ") : []);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Upload Dokumen Pendukung
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewingProposal(null)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    Tutup
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
