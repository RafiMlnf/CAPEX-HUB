"use client";

import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarFS";
import Header from "../../components/Header";
import { CapexProposal, api } from "../../lib/api";
import { useCapex } from "../../context/CapexContext";

const fmtRupiah = (val: number | string | undefined | null) => {
  const num = typeof val === "number" ? val : Number(val || 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
};

const fmtDate = (ts: string | undefined | null) => {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CapexHistoryPage() {
  const { currentUser, hasPermission } = useCapex();
  const [proposals, setProposals] = useState<CapexProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [viewingProposal, setViewingProposal] = useState<CapexProposal | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const isAdmin =
    (currentUser?.role || "").toLowerCase() === "admin" ||
    (currentUser?.username || "").toLowerCase() === "admin";

  const isAllAccess =
    hasPermission("perm_review_capex") ||
    hasPermission("perm_committee_review") ||
    hasPermission("perm_view_reports") ||
    hasPermission("ALL_ACCESS") ||
    isAdmin;

  const fetchApprovedProposals = () => {
    setLoading(true);
    api.getCapexProposals()
      .then((res) => {
        const all: CapexProposal[] = res || [];
        // Filter only approved / closed proposals
        const approvedOnly = all.filter((p) => {
          const s = (p.gateStatus || "").toLowerCase();
          const kode = (p.capexId || "").toLowerCase();
          return s.includes("approv") || s.includes("close") || kode.startsWith("cpx");
        });
        setProposals(approvedOnly);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApprovedProposals();
  }, []);

  // Filter proposals according to user login & role permissions dynamically & realtime
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

  const departments = useMemo(() => {
    const set = new Set<string>();
    visibleProposals.forEach((p) => {
      if (p.department) set.add(p.department);
    });
    return ["All", ...Array.from(set)];
  }, [visibleProposals]);

  const filtered = useMemo(() => {
    return visibleProposals.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (p.capexId || "").toLowerCase().includes(q) ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.department || "").toLowerCase().includes(q) ||
        (p.pic || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q);

      const matchDept = selectedDept === "All" || p.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [visibleProposals, search, selectedDept]);

  // Total Approved Budget
  const totalApprovedBudget = useMemo(() => {
    return filtered.reduce((acc, p) => acc + (Number(p.estimatedCost) || 0), 0);
  }, [filtered]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedProposals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handleDelete = async (p: CapexProposal) => {
    const result = await Swal.fire({
      title: "Hapus Riwayat CAPEX?",
      text: `Apakah Anda yakin ingin menghapus data usulan "${p.name}" (${p.capexId || p.id})? Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await api.deleteProposal(p.id);
        Swal.fire({
          title: "Terhapus!",
          text: "Data riwayat CAPEX berhasil dihapus.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchApprovedProposals();
      } catch (err: any) {
        Swal.fire({
          title: "Gagal Menghapus",
          text: err.message || "Terjadi kesalahan saat menghapus data.",
          icon: "error",
        });
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen ml-64 min-w-0 overflow-hidden">
        <Header
          title="CAPEX History"
          subtitle="Daftar seluruh usulan CAPEX yang telah disetujui resmi oleh Komite Investasi"
        />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Banner Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800 tracking-tight">CAPEX Approval History & Archiving</h2>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-semibold">
                      Arsip Resmi Disetujui
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Riwayat arsip usulan proyek belanja modal (CAPEX) yang telah resmi disetujui oleh Komite Investasi dan Manajemen.
                  </p>
                </div>
              </div>

              {/* Controls: Search, Department Filter, Counter & Total Budget */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari Kode CAPEX, Nama Proyek, PIC..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-500">Dept:</span>
                  <select
                    value={selectedDept}
                    onChange={(e) => {
                      setSelectedDept(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-slate-700 font-semibold text-xs focus:outline-none cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs">
                  {filtered.length} Disetujui
                </span>

                <span className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200 text-xs font-mono">
                  Total: {fmtRupiah(totalApprovedBudget)}
                </span>

                <button
                  onClick={fetchApprovedProposals}
                  className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                  title="Segarkan data"
                >
                  <svg className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Unified Modern Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                DAFTAR ARSIP USULAN CAPEX RESMI (APPROVED)
              </span>
              <span className="text-[11px] text-slate-500">
                Menampilkan {paginatedProposals.length} dari {filtered.length} usulan disetujui
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-36">Tanggal Disetujui</th>
                    <th className="py-3 px-4 w-36">Kode CAPEX</th>
                    <th className="py-3 px-4 min-w-[200px]">Nama Proyek</th>
                    <th className="py-3 px-4 w-32">Departemen</th>
                    <th className="py-3 px-4 w-32">PIC</th>
                    <th className="py-3 px-4 w-36 text-right">Total Anggaran</th>
                    <th className="py-3 px-4 w-32 text-center">Status</th>
                    <th className="py-3 px-4 w-28 text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-500 font-bold">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Memuat data riwayat CAPEX...
                      </td>
                    </tr>
                  ) : paginatedProposals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400 italic">
                        {search
                          ? `Tidak ada data CAPEX yang cocok dengan pencarian "${search}"`
                          : "Belum ada riwayat CAPEX yang disetujui."}
                      </td>
                    </tr>
                  ) : (
                    paginatedProposals.map((p, idx) => {
                      const rowNumber = (currentPage - 1) * pageSize + idx + 1;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                            {rowNumber}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                            {fmtDate(p.committeeApprovedAt || p.financeApprovedAt || p.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                            {p.capexId && p.capexId !== "-" ? p.capexId : `CPX-${p.id}`}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800 text-xs">{p.name}</p>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                            {p.department || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                            {p.pic || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                            {fmtRupiah(p.estimatedCost)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Approved
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingProposal(p)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
                                title="Lihat Detail CAPEX"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Detail
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                                  title="Hapus Data CAPEX"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {!loading && filtered.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-600">
                  Halaman {currentPage} dari {totalPages} ({filtered.length} total usulan disetujui)
                </span>

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

      {/* Modal View Details */}
      {viewingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div
            className="bg-white border border-slate-200 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl">
                  {viewingProposal.capexId || `CPX-${viewingProposal.id}`}
                </span>
                <h2 className="text-sm font-bold text-slate-800 truncate max-w-md">
                  {viewingProposal.name}
                </h2>
              </div>
              <button
                onClick={() => setViewingProposal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status Banner */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-emerald-800">Status: Disetujui (Approved)</span>
                </div>
                <span className="text-emerald-700 font-mono font-semibold text-[11px]">
                  Disetujui: {fmtDate(viewingProposal.committeeApprovedAt || viewingProposal.financeApprovedAt || viewingProposal.createdAt)}
                </span>
              </div>

              {/* General Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Departemen</span>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingProposal.department || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">PIC Proyek</span>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingProposal.pic || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Anggaran</span>
                  <p className="font-mono font-bold text-emerald-700 mt-0.5">{fmtRupiah(viewingProposal.estimatedCost)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Jenis Investasi</span>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingProposal.investmentType || "—"}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-600 block tracking-wider">
                  Deskripsi Proyek
                </span>
                <p className="text-slate-700 leading-relaxed font-normal bg-slate-50 p-3 rounded-2xl border border-slate-200 whitespace-pre-line text-xs">
                  {viewingProposal.description || "Tidak ada deskripsi."}
                </p>
              </div>

              {/* Review Notes */}
              {(viewingProposal.financeNotes || viewingProposal.committeeNotes) && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-600 block tracking-wider">Catatan Review</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingProposal.financeNotes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-amber-800 block">
                          Catatan Finance Review:
                        </span>
                        <p className="text-amber-950 italic font-normal leading-relaxed">
                          &quot;{viewingProposal.financeNotes}&quot;
                        </p>
                      </div>
                    )}
                    {viewingProposal.committeeNotes && (
                      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-purple-800 block">
                          Catatan Komite Review:
                        </span>
                        <p className="text-purple-950 italic font-normal leading-relaxed">
                          &quot;{viewingProposal.committeeNotes}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval Timeline History */}
              {Array.isArray(viewingProposal.history) && viewingProposal.history.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-600 block tracking-wider">Timeline Riwayat Approval</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl divide-y divide-slate-200 overflow-hidden">
                    {viewingProposal.history.map((h, i) => (
                      <div key={i} className="p-3 flex items-start justify-between gap-3">
                        <div>
                          <span className="font-bold text-slate-800">{h.action}</span>
                          <span className="text-slate-500 ml-2">oleh <strong className="text-slate-700">{h.actor}</strong></span>
                          {h.notes && <p className="text-slate-600 mt-1 italic">&quot;{h.notes}&quot;</p>}
                        </div>
                        <span className="text-slate-400 font-mono text-[10px] whitespace-nowrap">{fmtDate(h.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingProposal(null)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-2xs"
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
