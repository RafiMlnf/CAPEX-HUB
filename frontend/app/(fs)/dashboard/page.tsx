"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Sidebar from "../../components/sidebars/SidebarFS";
import Header from "../../components/Header";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/shared/Modal";
import { useCapex } from "../../context/CapexContext";
import { api, CapexProposal } from "../../lib/api";
import Swal from "sweetalert2";

export default function DashboardPage() {
  const { proposals, refreshProposals, hasPermission, currentUser } = useCapex();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewingProposal, setViewingProposal] = useState<CapexProposal | null>(null);

  const canViewDashboard = hasPermission("perm_view_dashboard");

  // Real-time automatic background sync on component mount & periodic cycle
  useEffect(() => {
    if (canViewDashboard) {
      api.syncFromBodr()
        .then(() => refreshProposals())
        .catch(() => {});
    }
  }, [canViewDashboard, refreshProposals]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await api.syncFromBodr();
      await refreshProposals();
      Swal.fire({
        title: "Sinkronisasi Berhasil",
        text: "Data investasi berhasil disinkronkan dengan modul BODR.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        title: "Sinkronisasi Selesai",
        text: "Data telah diperbarui.",
        icon: "info",
        timer: 1200,
        showConfirmButton: false,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculations
  const totalBudget = useMemo(() => {
    return proposals.reduce((sum: number, item: any) => sum + (item.estimatedCost || 0), 0);
  }, [proposals]);

  const totalCount = proposals.length;

  // Filtered items for table
  const filteredItems = useMemo(() => {
    return proposals.filter((item: any) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.department && item.department.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase().includes(q)) ||
        (item.capexId && item.capexId.toLowerCase().includes(q)) ||
        (item.pic && item.pic.toLowerCase().includes(q)) ||
        (item.purpose && item.purpose.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        item.gateStatus === statusFilter ||
        (statusFilter === "gate1" && item.gateStatus?.includes("Gate 1")) ||
        (statusFilter === "gate2" && item.gateStatus?.includes("Gate 2")) ||
        (statusFilter === "approved" && (item.gateStatus?.includes("Approved") || item.gateStatus?.includes("Gate 3")));

      return matchesSearch && matchesStatus;
    });
  }, [proposals, searchTerm, statusFilter]);

  // Department distribution
  const deptDistribution = useMemo(() => {
    const map: Record<string, { budget: number; count: number }> = {};
    proposals.forEach((p) => {
      const dept = p.department || "Other";
      if (!map[dept]) {
        map[dept] = { budget: 0, count: 0 };
      }
      map[dept].budget += (p.estimatedCost || 0);
      map[dept].count += 1;
    });

    const entries = Object.entries(map);
    const maxBudget = Math.max(...entries.map(([, v]) => v.budget), 1);

    return entries.map(([dept, val]) => ({
      dept,
      budget: val.budget,
      count: val.count,
      percentage: Math.round((val.budget / maxBudget) * 100),
    }));
  }, [proposals]);

  if (!canViewDashboard) {
    return (
      <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800 flex-col">
        <Header
          title="CAPEX Portal"
          subtitle="Capital Expenditure Management System - PT Menara Terus Makmur"
        />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 max-w-md w-full shadow-lg text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-800 uppercase tracking-wide">Akses Ditolak (403)</h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Maaf, Anda tidak memiliki izin untuk mengakses Dashboard CAPEX.
                Silakan hubungi Administrator untuk meminta konfigurasi hak akses akun Anda.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer w-full text-center"
            >
              Kembali ke Portal Utama
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen ml-64 bg-slate-100 min-w-0 overflow-x-hidden">
        <Header
          title="Dashboard Ringkasan Capex"
          subtitle="Ringkasan eksekutif alokasi anggaran, status usulan gate, dan realisasi komitmen belanja modal"
        />

        <main className="flex-1 overflow-y-auto px-6 py-5 space-y-5 w-full min-w-0">
          
          {/* Top Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card: Total Anggaran Pengajuan (Blue Left Border) */}
            <div className="bg-white border border-slate-200 border-l-4 border-l-blue-600 rounded-2xl p-5 shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                TOTAL ANGGARAN PENGAJUAN
              </span>
              <p className="text-2xl font-black text-blue-600 tracking-tight font-mono">
                Rp {totalBudget.toLocaleString("id-ID")}
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {totalCount} Total Usulan
                </span>
              </div>
            </div>
          </div>

          {/* Middle Card: DAFTAR INVESTASI CAPEX 2026 Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs w-full space-y-4">
            {/* Header with Title & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                DAFTAR INVESTASI CAPEX 2026
                <span className="text-slate-400 cursor-help" title="Daftar usulan aktif">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </h2>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* SYNC DARI BODR Button */}
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <svg className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isSyncing ? "Menyinkronkan..." : "SYNC DARI BODR"}
                </button>

                {/* Search Bar */}
                <div className="relative w-48">
                  <input
                    type="text"
                    placeholder="Cari ID, nama, PIC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs font-normal"
                  />
                  <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Status Gate Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                >
                  <option value="all">Semua Status Gate</option>
                  <option value="gate1">Gate 1 - Finance Review</option>
                  <option value="gate2">Gate 2 - Komite Review</option>
                  <option value="approved">Gate 3+ - Disetujui</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic text-xs font-normal">
                Belum ada data usulan investasi.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider select-none">
                      <th className="py-3 px-3.5 text-center w-12">NO</th>
                      <th className="py-3 px-3.5">PROPOSAL ID</th>
                      <th className="py-3 px-3.5">DEPARTMENT</th>
                      <th className="py-3 px-3.5">PROJECT NAME</th>
                      <th className="py-3 px-3.5">PURPOSE / TYPE</th>
                      <th className="py-3 px-3.5">PIC</th>
                      <th className="py-3 px-3.5 text-right">AMOUNT</th>
                      <th className="py-3 px-3.5 text-center">DURATION</th>
                      <th className="py-3 px-3.5 text-center">ATTACHMENT</th>
                      <th className="py-3 px-3.5 text-center">STATUS GATE</th>
                      <th className="py-3 px-3.5 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {filteredItems.map((p, idx) => {
                      const firstDoc = (p.attachmentName || "").split(", ")[0]?.trim();
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3.5 font-mono text-slate-800 text-[11px]">
                            {p.capexId && p.capexId !== "-" ? p.capexId : p.id}
                          </td>
                          <td className="py-3 px-3.5 text-slate-700">{p.department}</td>
                          <td className="py-3 px-3.5 text-slate-800 font-medium">{p.name}</td>
                          <td className="py-3 px-3.5 text-slate-600">
                            <div>{p.purpose || "-"}</div>
                            <div className="text-[10px] text-slate-400">{p.investmentType || "-"}</div>
                          </td>
                          <td className="py-3 px-3.5 text-slate-600">{p.pic}</td>
                          <td className="py-3 px-3.5 font-bold text-blue-600 text-right">
                            Rp {p.estimatedCost.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-3.5 text-center text-[10px] text-slate-500 font-mono">
                            {p.startDate && p.endDate && p.startDate !== "-" && p.endDate !== "-"
                              ? `${p.startDate} s/d ${p.endDate}`
                              : p.startDate || "-"}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {firstDoc ? (
                              <a
                                href={api.getUploadFileUrl(firstDoc)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-medium hover:bg-blue-100 transition-colors"
                              >
                                <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                {firstDoc}
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              • {p.gateStatus.replace("Gate 1 - ", "").replace("Gate 2 - ", "")}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => setViewingProposal(p)}
                              className="text-slate-400 hover:text-blue-600 p-1 transition-colors cursor-pointer"
                              title="Lihat Detail"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom Card: DISTRIBUSI ANGGARAN PER DEPARTEMEN */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs w-full space-y-4">
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                DISTRIBUSI ANGGARAN PER DEPARTEMEN
                <span className="text-slate-400 cursor-help" title="Sebaran anggaran">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                Sebaran usulan anggaran belanja modal berdasarkan unit kerja pengaju
              </p>
            </div>

            {/* List of Departments */}
            {deptDistribution.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic text-xs font-normal">
                Belum ada data distribusi departemen.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {deptDistribution.map((item) => (
                  <div key={item.dept} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{item.dept}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600 font-mono">
                          Rp {item.budget.toLocaleString("id-ID")} ({item.count} proposal)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm(item.dept);
                          }}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 cursor-pointer"
                          title="Filter tabel untuk departemen ini"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* View Detail Modal */}
        {viewingProposal && (
          <Modal
            open={!!viewingProposal}
            onClose={() => setViewingProposal(null)}
            title={`Detail Usulan: ${viewingProposal.capexId || viewingProposal.id}`}
          >
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID CAPEX</span>
                    <p className="font-mono font-bold text-slate-800">{viewingProposal.capexId || viewingProposal.id}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">STATUS</span>
                    <p className="font-bold text-blue-600">{viewingProposal.gateStatus}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NAMA PROYEK</span>
                    <p className="font-bold text-slate-800">{viewingProposal.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DEPARTEMEN</span>
                    <p className="text-slate-700">{viewingProposal.department}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ESTIMASI COST</span>
                    <p className="font-bold text-blue-600">Rp {viewingProposal.estimatedCost.toLocaleString("id-ID")}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PIC PENGAJU</span>
                    <p className="text-slate-700">{viewingProposal.pic}</p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">BENEFIT / DESKRIPSI</span>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 leading-relaxed font-normal">
                  {viewingProposal.description || "-"}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewingProposal(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
