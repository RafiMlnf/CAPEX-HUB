"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarFS";
import Header from "../../components/Header";
import StatusBadge from "../../components/StatusBadge";
import IdeaForm from "../../components/planning/IdeaForm";
import Modal from "../../components/shared/Modal";
import { useCapex } from "../../context/CapexContext";
import { CapexProposal, api } from "../../lib/api";

function formatDateDisplay(dateStr?: string) {
  if (!dateStr || dateStr === "-" || dateStr.trim() === "") return "-";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (match) {
    const [, year, month, day, hours, minutes] = match;
    if (hours && minutes) {
      return `${day}/${month}/${year} pukul ${hours}:${minutes} WIB`;
    }
    return `${day}/${month}/${year}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    if (dateStr.includes("T") || dateStr.includes(" ")) {
      return `${day}/${month}/${year} pukul ${hours}:${minutes} WIB`;
    }
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

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

  const isAllAccess =
    hasPermission("perm_review_capex") ||
    hasPermission("perm_committee_review") ||
    hasPermission("perm_view_reports") ||
    (currentUser?.role || "").toLowerCase() === "admin" ||
    (currentUser?.role || "").toLowerCase().includes("accounting") ||
    (currentUser?.role || "").toLowerCase().includes("finance") ||
    (currentUser?.role || "").toLowerCase().includes("director") ||
    (currentUser?.role || "").toLowerCase().includes("division head");

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

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "gate0" && (p.gateStatus === "Gate 0 - Idea" || p.gateStatus === "Gate 0 - Draft")) ||
        (statusFilter === "gate1" && (p.gateStatus.includes("Gate 1") || p.gateStatus.includes("Finance"))) ||
        (statusFilter === "gate2" && (p.gateStatus.includes("Gate 2") || p.gateStatus.includes("Committee"))) ||
        (statusFilter === "approved" && (p.gateStatus.includes("Gate 3") || p.gateStatus.includes("Procurement") || p.gateStatus.includes("Closed")));

      return matchesSearch && matchesStatus;
    });
  }, [visibleProposals, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage) || 1;
  const paginatedProposals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProposals.slice(start, start + itemsPerPage);
  }, [filteredProposals, currentPage, itemsPerPage]);

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen ml-64 bg-slate-100 min-w-0 overflow-x-hidden">
        <Header
          title="Perencanaan Capex"
          subtitle="Daftar usulan perencanaan anggaran belanja modal dan manajemen inisiasi proyek (Gate 0 & Gate 1)"
        />

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 w-full min-w-0 overflow-x-hidden">
          {/* Main Table Card (Tema Putih-Biru) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs w-full min-w-0 space-y-4">
            {/* Header Controls: Title, Search, Filter & Add Planning Button */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Daftar Perencanaan Budget Planning
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Kelola usulan belanja modal baru, pantau status verifikasi Finance & persetujuan Komite Investasi
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                {/* Search Bar */}
                <div className="relative w-48 sm:w-56">
                  <input
                    type="text"
                    placeholder="Cari ID, Proyek, PIC..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                  />
                  <svg
                    className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs shrink-0"
                >
                  <option value="all">Semua Status</option>
                  <option value="gate0">Gate 0 - Idea / Draft</option>
                  <option value="gate1">Gate 1 - Finance Review</option>
                  <option value="gate2">Gate 2 - Komite Review</option>
                  <option value="approved">Gate 3+ - Disetujui</option>
                </select>

                {/* Add Planning Button */}
                {canCreate && (
                  <button
                    onClick={() => {
                      setEditingProposal(null);
                      setShowModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer text-xs shadow-xs active:scale-95 whitespace-nowrap shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Planning
                  </button>
                )}
              </div>
            </div>

            {/* Table View */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full min-w-[1300px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-center w-14 border-r border-slate-100">
                      No
                    </th>
                    <th className="py-3.5 px-4 w-36 border-r border-slate-100 whitespace-nowrap">
                      ID Capex
                    </th>
                    <th className="py-3.5 px-4 min-w-[260px] border-r border-slate-100">
                      Nama Proyek
                    </th>
                    <th className="py-3.5 px-4 w-36 border-r border-slate-100 whitespace-nowrap">
                      Departemen
                    </th>
                    <th className="py-3.5 px-4 w-40 border-r border-slate-100 whitespace-nowrap">
                      Purpose / Type
                    </th>
                    <th className="py-3.5 px-4 w-32 border-r border-slate-100 whitespace-nowrap">
                      PIC
                    </th>
                    <th className="py-3.5 px-4 text-right w-44 border-r border-slate-100 whitespace-nowrap">
                      Estimasi Biaya
                    </th>
                    <th className="py-3.5 px-4 text-center w-32 border-r border-slate-100 whitespace-nowrap">
                      Start Date
                    </th>
                    <th className="py-3.5 px-4 text-center w-32 border-r border-slate-100 whitespace-nowrap">
                      End Date
                    </th>
                    <th className="py-3.5 px-4 text-center w-44 border-r border-slate-100 whitespace-nowrap">
                      Status Gate
                    </th>
                    <th className="py-3.5 px-4 text-right w-28 whitespace-nowrap">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingProposals ? (
                    <tr>
                      <td colSpan={11} className="text-center text-slate-400 font-normal py-12">
                        Memuat daftar perencanaan budget...
                      </td>
                    </tr>
                  ) : paginatedProposals.map((p, idx) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                    const canEditRow = canCreate && (p.gateStatus === "Gate 0 - Idea" || p.gateStatus === "Gate 0 - Draft" || p.gateStatus === "Gate 2 - Revised");
                    const isPendingFeedback = p.gateStatus === "Gate 1 - Pending User Feedback";

                    return (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-normal border-r border-slate-100">
                          {rowNumber}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-blue-600 border-r border-slate-100 whitespace-nowrap">
                          {p.capexId && p.capexId !== "-" ? p.capexId : "-"}
                        </td>
                        <td className="py-3.5 px-4 border-r border-slate-100">
                          <p className="font-semibold text-slate-800 text-xs">{p.name}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium border-r border-slate-100 whitespace-nowrap">
                          {p.department}
                        </td>
                        <td className="py-3.5 px-4 border-r border-slate-100">
                          <div className="font-medium text-slate-800">{p.purpose || "-"}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{p.investmentType || "-"}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-normal border-r border-slate-100 whitespace-nowrap">
                          {p.pic}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-blue-700 border-r border-slate-100 whitespace-nowrap">
                          Rp {p.estimatedCost ? Number(p.estimatedCost).toLocaleString("id-ID") : "0"}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-600 font-mono text-[11px] font-normal border-r border-slate-100 whitespace-nowrap">
                          {formatDateDisplay(p.startDate)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-600 font-mono text-[11px] font-normal border-r border-slate-100 whitespace-nowrap">
                          {formatDateDisplay(p.endDate)}
                        </td>
                        <td className="py-3.5 px-4 text-center border-r border-slate-100 whitespace-nowrap">
                          <div className="inline-flex justify-center">
                            <StatusBadge status={p.gateStatus} size="sm" noBackground />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Lihat Detail (View Only) */}
                            <button
                              type="button"
                              onClick={() => setViewingProposal(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-white bg-slate-100 hover:bg-blue-600 border border-slate-300 hover:border-blue-600 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-2xs"
                              title="Lihat Detail (View Only)"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Lihat
                            </button>

                            {canEditRow && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProposal(p);
                                  setShowModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-amber-700 hover:text-white bg-amber-50 hover:bg-amber-600 border border-amber-200 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-2xs"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                            )}

                            {isPendingFeedback && (
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadProposal(p);
                                  setSupportingFiles(p.attachmentName ? p.attachmentName.split(", ") : []);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-2xs"
                              >
                                Upload File
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!loadingProposals && filteredProposals.length === 0 && (
                    <tr>
                      <td colSpan={11} className="text-center text-slate-400 font-normal py-12">
                        {searchQuery
                          ? `Tidak ada perencanaan yang cocok dengan pencarian "${searchQuery}"`
                          : "Belum ada usulan perencanaan budget planning."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loadingProposals && filteredProposals.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-normal">
                    Menampilkan <span className="font-medium text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredProposals.length)}</span> - <span className="font-medium text-slate-700">{Math.min(currentPage * itemsPerPage, filteredProposals.length)}</span> dari <span className="font-medium text-slate-700">{filteredProposals.length}</span> entri
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
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
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
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
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
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
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
                  await editProposal(uploadProposal.id, {
                    attachmentName: supportingFiles.join(", "),
                    gateStatus: "Gate 1 - Finance Review",
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
        maxWidth="max-w-4xl"
      >
        {viewingProposal && (
          <div className="space-y-4 text-xs text-slate-800">
            {/* Top Summary Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Nama Proyek</span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{viewingProposal.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                {viewingProposal.capexId && viewingProposal.capexId !== "-" && (
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-lg">
                    {viewingProposal.capexId}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Status:</span>
                  <StatusBadge status={viewingProposal.gateStatus} size="sm" />
                </div>
              </div>
            </div>

            {/* Grid Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 border border-slate-200 rounded-xl p-4">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">ID Capex Resmi</span>
                <p className="font-mono font-bold text-blue-600 mt-0.5">
                  {viewingProposal.capexId && viewingProposal.capexId !== "-" ? viewingProposal.capexId : "- (Belum Disetujui Komite)"}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Departemen</span>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingProposal.department || "-"}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">PIC Pengaju</span>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingProposal.pic || "-"}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Purpose / Investment Type</span>
                <p className="font-medium text-slate-700 mt-0.5">
                  {viewingProposal.purpose || "-"} / {viewingProposal.investmentType || "-"}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Estimasi Biaya</span>
                <p className="font-bold text-blue-600 font-mono mt-0.5">
                  Rp {viewingProposal.estimatedCost ? Number(viewingProposal.estimatedCost).toLocaleString("id-ID") : "0"}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Durasi Pelaksanaan</span>
                <p className="font-medium text-slate-700 mt-0.5">
                  {viewingProposal.startDate && viewingProposal.endDate && viewingProposal.startDate !== "-" && viewingProposal.endDate !== "-"
                    ? `${formatDateDisplay(viewingProposal.startDate)} s/d ${formatDateDisplay(viewingProposal.endDate)}`
                    : viewingProposal.startDate && viewingProposal.startDate !== "-"
                    ? formatDateDisplay(viewingProposal.startDate)
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Kebutuhan Studi Kelayakan</span>
                <p className="font-medium text-slate-700 mt-0.5">
                  {viewingProposal.isFsRequired ? `Ya (FS: ${viewingProposal.fsCategory || "-"})` : "Tidak (Non-FS)"}
                </p>
              </div>

              {/* Jadwal Sidang Komite (Otomatis tampil pada usulan tahap Komite Review / yang telah dijadwalkan) */}
              {viewingProposal.committeeReviewSchedule ? (
                <div className="md:col-span-2 pt-2.5 border-t border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Jadwal Sidang Komite Investasi
                  </span>
                  <p className="font-bold text-xs text-purple-900 font-mono mt-1 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg w-fit">
                    📅 {formatDateDisplay(viewingProposal.committeeReviewSchedule)}
                  </p>
                </div>
              ) : (viewingProposal.gateStatus?.toLowerCase().includes("committee") || viewingProposal.gateStatus?.toLowerCase().includes("gate 2")) ? (
                <div className="md:col-span-2 pt-2.5 border-t border-slate-200/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                    Jadwal Sidang Komite Investasi
                  </span>
                  <p className="font-medium text-xs text-slate-500 italic mt-0.5">
                    Sedang dikoordinasikan oleh Finance
                  </p>
                </div>
              ) : null}
            </div>

            {/* Attachments Section with Initial vs Revised Audit Support */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
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

                const hasSeparateRevisions =
                  initialDocs.length > 0 &&
                  (revisedDocs.length > 0 ||
                    (allDocs.length > 0 &&
                      JSON.stringify(initialDocs) !== JSON.stringify(allDocs)));

                const effectiveRevised =
                  revisedDocs.length > 0
                    ? revisedDocs
                    : hasSeparateRevisions
                    ? allDocs.filter((d) => !initialDocs.includes(d))
                    : [];

                if (hasSeparateRevisions && (initialDocs.length > 0 || effectiveRevised.length > 0)) {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Dokumen Awal */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Dokumen Awal (Versi Pengajuan)
                          </span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                            {initialDocs.length} File
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {initialDocs.map((filename, i) => (
                            <a
                              key={i}
                              href={api.getUploadFileUrl(filename)}
                              download={filename}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-between text-slate-700 hover:text-blue-600 font-mono font-medium text-xs bg-slate-50 hover:bg-blue-50/60 border border-slate-200 rounded px-2.5 py-1.5 transition-all shadow-2xs group"
                              title={`Unduh Dokumen Awal: ${filename}`}
                            >
                              <span className="truncate underline">{filename}</span>
                              <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Dokumen Revisi */}
                      <div className="bg-white border border-emerald-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Dokumen Revisi (Terbaru)
                          </span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                            {(effectiveRevised.length > 0 ? effectiveRevised : allDocs).length} File
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {(effectiveRevised.length > 0 ? effectiveRevised : allDocs).map((filename, i) => (
                            <a
                              key={i}
                              href={api.getUploadFileUrl(filename)}
                              download={filename}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-between text-emerald-800 hover:text-emerald-900 font-mono font-medium text-xs bg-emerald-50/50 hover:bg-emerald-100/70 border border-emerald-200 rounded px-2.5 py-1.5 transition-all shadow-2xs group"
                              title={`Unduh Dokumen Revisi: ${filename}`}
                            >
                              <span className="truncate underline">{filename}</span>
                              <svg className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-y-0.5 shrink-0 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-wrap gap-2">
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
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 font-mono font-medium text-xs bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 transition-all shadow-2xs cursor-pointer"
                            title={`Klik untuk mengunduh: ${cleanName}`}
                          >
                            <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>{cleanName}</span>
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
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                Deskripsi Lengkap Proyek
              </span>
              <p className="text-slate-700 leading-relaxed font-normal bg-white p-3 rounded-lg border border-slate-200/70 whitespace-pre-line">
                {viewingProposal.description || "-"}
              </p>
            </div>

            {/* Finance Notes if any */}
            {viewingProposal.financeNotes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                  Catatan Finance:
                </span>
                <p className="text-amber-900 italic font-normal leading-relaxed">
                  &quot;{viewingProposal.financeNotes}&quot;
                </p>
              </div>
            )}

            {/* Committee Notes if any */}
            {viewingProposal.committeeNotes && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">
                  Catatan Sidang Komite Investasi:
                </span>
                <p className="text-purple-900 italic font-normal leading-relaxed">
                  &quot;{viewingProposal.committeeNotes}&quot;
                </p>
              </div>
            )}

            {/* Footer Button */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingProposal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
