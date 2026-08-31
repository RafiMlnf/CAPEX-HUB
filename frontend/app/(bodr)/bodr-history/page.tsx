"use client";

import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import { BodrProposal, api } from "../../lib/api";
import { useCapex } from "../../context/CapexContext";
import { formatDateDisplay } from "../../lib/dateUtils";

const fmtRupiah = (val: number | string | undefined | null) => {
  const num = typeof val === "number" ? val : Number(val || 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
};

const fmtDate = (ts: string | undefined | null) => {
  return formatDateDisplay(ts ?? undefined);
};

export default function BodrHistoryPage() {
  const { currentUser, hasPermission } = useCapex();
  const [proposals, setProposals] = useState<BodrProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [viewingProposal, setViewingProposal] = useState<BodrProposal | null>(null);

  const isAdmin =
    (currentUser?.role || "").toLowerCase() === "admin" ||
    (currentUser?.username || "").toLowerCase() === "admin";

  const isAllAccess =
    hasPermission("perm_approve_bodr") ||
    hasPermission("perm_view_reports") ||
    hasPermission("ALL_ACCESS") ||
    isAdmin;

  const fetchApprovedBodr = () => {
    setLoading(true);
    api.getBodrProposals()
      .then((res: any) => {
        const all = res || [];
        // Map and filter only approved BODR proposals
        const mapped: BodrProposal[] = all
          .filter((b: any) => (b.status || "").toLowerCase() === "approved")
          .map((b: any) => ({
            id: b.id,
            bodrNo: b.bodr_no || b.bodrNo,
            title: b.title,
            category: b.category,
            department: b.department,
            amount: typeof b.amount === "number" ? b.amount : parseFloat(b.amount || 0),
            step: b.step,
            status: b.status,
            date: b.date || b.created_at,
            notes: b.notes || b.budget_remarks,
            proposer: b.proposer,
            benefit: b.benefit,
            capexId: b.capex_id,
            noAsset: b.no_asset,
            costCenter: b.cost_center || "-",
            startDate: b.start_date || "-",
            endDate: b.end_date || "-",
            budgetType: (b.budget_type || b.category) as "budget" | "unbudget",
            namaAsset: b.nama_asset || "-",
            plan: b.plan || "-",
            location: b.location || "-",
            assetType: b.asset_type || "-",
            approvalHistory: b.approval_history || [],
            documents: b.documents || [],
          }));
        setProposals(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApprovedBodr();
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
      const pProposer = (p.proposer || "").toLowerCase().trim();

      const isSameDept = userDept && (pDept === userDept || pDept.includes(userDept) || userDept.includes(pDept));
      const isSameUser =
        (userName && (pProposer === userName || pProposer.includes(userName))) ||
        (username && pProposer === username) ||
        (userNpk && pProposer === userNpk);

      return isSameDept || isSameUser;
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
        (p.bodrNo || "").toLowerCase().includes(q) ||
        (p.title || "").toLowerCase().includes(q) ||
        (p.proposer || "").toLowerCase().includes(q) ||
        (p.department || "").toLowerCase().includes(q) ||
        (p.costCenter || "").toLowerCase().includes(q);

      const matchDept = selectedDept === "All" || p.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [visibleProposals, search, selectedDept]);

  const handleDelete = async (p: BodrProposal) => {
    const result = await Swal.fire({
      title: "Hapus Riwayat BODR?",
      text: `Apakah Anda yakin ingin menghapus data usulan "${p.title}" (${p.bodrNo})? Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await api.deleteBodrProposal(p.id);
        Swal.fire({
          title: "Terhapus!",
          text: "Data riwayat BODR berhasil dihapus.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchApprovedBodr();
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
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-64">
        <Header
          title="BODR History"
          subtitle="Daftar seluruh pengajuan BODR yang telah disetujui (Approved)"
        />

        <main className="flex-1 p-6 space-y-5">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari No. BODR, Judul, Pengusul, Departemen, Cost Center..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Departemen:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Data BODR Disetujui (Approved)
                <span className="ml-2 text-xs text-slate-400 font-normal">({filtered.length} data)</span>
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium">Belum ada data BODR yang disetujui</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80">
                      <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider w-12">No</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Tanggal Disetujui</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">No. BODR</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Judul Pengajuan</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Departemen</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Pengusul</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Cost Center</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Nilai Investasi</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-center px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 text-slate-400 font-mono text-center">{idx + 1}</td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{fmtDate(p.date)}</td>
                        <td className="px-4 py-3.5 font-mono font-semibold text-blue-700 whitespace-nowrap">
                          {p.bodrNo}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800 max-w-xs truncate" title={p.title}>
                          {p.title}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{p.department || "—"}</td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium">{p.proposer || "—"}</td>
                        <td className="px-4 py-3.5 text-slate-600 font-mono">{p.costCenter || "—"}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-emerald-700">
                          {fmtRupiah(p.amount)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                            Approved
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewingProposal(p)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Detail BODR"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data BODR"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal View Details */}
      {viewingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div
            className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                  {viewingProposal.bodrNo}
                </span>
                <h2 className="text-sm font-semibold text-slate-800 truncate max-w-md">
                  {viewingProposal.title}
                </h2>
              </div>
              <button
                onClick={() => setViewingProposal(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-emerald-800">Status: Disetujui (Approved)</span>
                </div>
                <span className="text-emerald-700 font-mono font-semibold">
                  Tanggal: {fmtDate(viewingProposal.date)}
                </span>
              </div>

              {/* General Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Pengusul</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingProposal.proposer || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Departemen</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingProposal.department || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Nilai Investasi</span>
                  <p className="font-mono font-bold text-emerald-700 mt-0.5">{fmtRupiah(viewingProposal.amount)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Cost Center</span>
                  <p className="font-mono font-semibold text-slate-800 mt-0.5">{viewingProposal.costCenter || "—"}</p>
                </div>
              </div>

              {/* Category & Schedule */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Kriteria Approval</span>
                  <p className="font-semibold text-blue-700 mt-0.5">{viewingProposal.category || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Tipe Budget</span>
                  <p className="font-semibold text-slate-800 mt-0.5 capitalize">{viewingProposal.budgetType || "budget"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Tanggal Mulai</span>
                  <p className="font-medium text-slate-700 mt-0.5">{viewingProposal.startDate || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Tanggal Selesai</span>
                  <p className="font-medium text-slate-700 mt-0.5">{viewingProposal.endDate || "—"}</p>
                </div>
              </div>

              {/* Benefit & Remarks */}
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Manfaat / Benefit Investasi</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {viewingProposal.benefit || "Tidak ada rincian manfaat."}
                  </div>
                </div>
                {viewingProposal.notes && (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Catatan Tambahan</span>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {viewingProposal.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Asset Information if CAP */}
              {viewingProposal.category === "CAP" && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Spesifikasi Aset</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Nama Aset</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{viewingProposal.namaAsset || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Plant</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{viewingProposal.plan || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Lokasi</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{viewingProposal.location || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Jenis Aset</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{viewingProposal.assetType || "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Section */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Dokumen Lampiran</span>
                {Array.isArray(viewingProposal.documents) && viewingProposal.documents.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewingProposal.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={api.getUploadFileUrl(doc)}
                        download={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-blue-600 hover:text-blue-800 font-mono text-[11px] shadow-2xs hover:bg-blue-50 transition"
                      >
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {doc}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Tidak ada lampiran dokumen.</p>
                )}
              </div>

              {/* Approval History */}
              {Array.isArray(viewingProposal.approvalHistory) && viewingProposal.approvalHistory.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Riwayat Persetujuan Approval
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {viewingProposal.approvalHistory.map((h, i) => {
                      const s = (h.status || "").toLowerCase();
                      const isApproved = s.includes("approved");
                      const isRejected = s.includes("rejected");
                      const isRevision = s.includes("revision") || s.includes("revise");

                      return (
                        <div key={i} className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl space-y-1.5 shadow-2xs transition-all">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center">
                                {i + 1}
                              </span>
                              <div>
                                <span className="font-bold text-slate-800 text-xs block leading-tight">
                                  {h.name || "Approver"}
                                </span>
                                <span className="text-[9.5px] text-slate-500 font-medium block leading-tight">
                                  {h.role || "Reviewer"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9.5px] font-mono text-slate-400 whitespace-nowrap">
                                {fmtDate(h.timestamp)}
                              </span>
                              <span
                                className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                  isApproved
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : isRejected
                                    ? "bg-red-50 text-red-700 border-red-300"
                                    : isRevision
                                    ? "bg-amber-50 text-amber-700 border-amber-300"
                                    : "bg-blue-50 text-blue-700 border-blue-300"
                                }`}
                              >
                                {h.status}
                              </span>
                            </div>
                          </div>
                          {h.note && (
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] text-slate-700 italic font-normal">
                              &quot;{h.note}&quot;
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingProposal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
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
