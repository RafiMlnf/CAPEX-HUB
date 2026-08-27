"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import { api } from "../../lib/api";

interface CapexRow {
  id: string;
  name: string;
  department: string;
  tahun: string;
  budget: number;
  amountBodr: number;
  available: number;
  type: string;
  capexType: "New" | "Carry Over";
  reference: string;
  remark: string;
  status: "Open" | "On Track" | "Completed" | "Revision Required" | "Cancelled";
}

interface BodrRelated {
  title: string;
  requester: string;
  amount: number;
  noBodr: string;
  capexReference: string;
  status: string;
}

const statusColor = (s: CapexRow["status"]) => {
  switch (s) {
    case "Completed": return "bg-emerald-600 text-white font-bold";
    case "On Track": return "bg-blue-600 text-white font-bold";
    case "Open": return "bg-slate-700 text-white font-bold";
    case "Revision Required": return "bg-orange-500 text-white font-bold";
    case "Cancelled": return "bg-red-600 text-white font-bold";
    default: return "bg-slate-700 text-white font-bold";
  }
};

const statusBorder = (s: CapexRow["status"]) => {
  switch (s) {
    case "Completed": return "border-l-emerald-500";
    case "On Track": return "border-l-blue-500";
    case "Open": return "border-l-slate-500";
    case "Revision Required": return "border-l-orange-500";
    case "Cancelled": return "border-l-red-500";
    default: return "border-l-slate-700";
  }
};

const bodrStatusColor = (s: string) => {
  switch (s) {
    case "Approved": return "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30";
    case "Pending Review": return "bg-blue-600/20 text-blue-400 border border-blue-500/30";
    case "Revision Required": return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    case "Rejected": return "bg-red-600/20 text-red-400 border border-red-500/30";
    default: return "bg-slate-700/20 text-slate-400 border border-slate-600/30";
  }
};

export default function CapexPage() {
  const [rows, setRows] = useState<CapexRow[]>([]);
  const [bodrRelated, setBodrRelated] = useState<Record<string, BodrRelated[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [exportToast, setExportToast] = useState(false);
  const [selectedCapex, setSelectedCapex] = useState<CapexRow | null>(null);
  
  // Filters
  const [filterType, setFilterType] = useState<"All" | "New" | "Carry Over">("All");

  const [syncing, setSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.getCapexItems(),
      api.getBodrProposals(),
    ])
      .then(([capexItems, bodrProposals]) => {
        // Map Capex Items
        const mappedCapex: CapexRow[] = (capexItems || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          department: item.department,
          tahun: item.tahun,
          budget: Number(item.budget),
          amountBodr: Number(item.amount_bodr),
          available: Number(item.available),
          type: "CAPEX",
          capexType: item.capex_type,
          reference: item.reference || "-",
          remark: item.remark || "-",
          status: item.status,
        }));
        setRows(mappedCapex);

        // Group related BODRs
        const grouped: Record<string, BodrRelated[]> = {};
        (bodrProposals || []).forEach((b: any) => {
          if (b.capex_id && b.capex_id !== "-") {
            if (!grouped[b.capex_id]) {
              grouped[b.capex_id] = [];
            }
            grouped[b.capex_id].push({
              title: b.title,
              requester: b.proposer,
              amount: Number(b.amount),
              noBodr: b.bodr_no,
              capexReference: b.capex_id,
              status: b.status,
            });
          }
        });
        setBodrRelated(grouped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = () => {
    setSyncing(true);
    api.syncFromBodr()
      .then((res: any) => {
        if (res.success) {
          setSyncToast({
            show: true,
            msg: `Berhasil sinkronisasi! (OH: ${res.ohSynced || 0}, CAPEX: ${res.capexSynced || 0}, FS: ${res.fsProposalsUpdated || 0})`,
          });
          setTimeout(() => setSyncToast({ show: false, msg: "" }), 4000);
          fetchData();
        }
      })
      .catch((err) => {
        console.error("Sync error:", err);
        Swal.fire({
          title: "Gagal Sinkronisasi",
          text: "Gagal sinkronisasi data dari BODR.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      })
      .finally(() => setSyncing(false));
  };

  const filtered = rows.filter((r) => {
    const t = search.toLowerCase();
    const matchSearch =
      r.id.toLowerCase().includes(t) ||
      r.name.toLowerCase().includes(t) ||
      r.department.toLowerCase().includes(t) ||
      r.type.toLowerCase().includes(t) ||
      r.reference.toLowerCase().includes(t) ||
      r.remark.toLowerCase().includes(t);
    const matchType = filterType === "All" || r.capexType === filterType;
    return matchSearch && matchType;
  });

  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalBodr = rows.reduce((s, r) => s + r.amountBodr, 0);
  const totalAvailable = rows.reduce((s, r) => s + r.available, 0);

  const handleExport = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  const relatedBodr = selectedCapex ? (bodrRelated[selectedCapex.id] ?? []) : [];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-100 font-sans text-xs">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen ml-64 items-center justify-center">
          <p className="text-sm font-black text-slate-500 italic">Memuat data CAPEX...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header title="CAPEX" subtitle="Daftar rencana & realisasi investasi per tahun anggaran" />

        {/* Sync Toast */}
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/20 bg-white/80 backdrop-blur-md text-emerald-800 text-xs font-extrabold shadow-lg transition-all duration-500 transform ${
          syncToast.show ? "translate-x-0 opacity-100 scale-100" : "translate-x-20 opacity-0 scale-95 pointer-events-none"
        }`}>
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-extrabold text-[11px] text-slate-800">Sinkronisasi Berhasil</p>
            <p className="text-[9px] text-slate-500 font-bold mt-0.5">{syncToast.msg}</p>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Export Toast */}
          <div className={`fixed top-20 right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/20 bg-white/80 backdrop-blur-md text-emerald-800 text-xs font-extrabold shadow-lg transition-all duration-500 transform ${
            exportToast ? "translate-x-0 opacity-100 scale-100" : "translate-x-20 opacity-0 scale-95 pointer-events-none"
          }`}>
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-extrabold text-[11px] text-slate-800">Ekspor Berhasil</p>
              <p className="text-[9px] text-slate-500 font-bold mt-0.5">Data CAPEX berhasil diekspor ke Excel!</p>
            </div>
          </div>
          {/* KPI Summary Cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              Ringkasan Anggaran CAPEX 2026
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Item", value: rows.length, color: "text-slate-900", border: "border-l-4 border-l-slate-400 bg-slate-50/50" },
                { label: "Total Budget", value: `Rp ${totalBudget.toLocaleString("id-ID")}`, color: "text-blue-700", border: "border-l-4 border-l-blue-500 bg-blue-50/20" },
                { label: "Amount BODR", value: `Rp ${totalBodr.toLocaleString("id-ID")}`, color: "text-purple-700", border: "border-l-4 border-l-purple-500 bg-purple-50/20" },
                { label: "Available Budget", value: `Rp ${totalAvailable.toLocaleString("id-ID")}`, color: "text-emerald-700", border: "border-l-4 border-l-emerald-500 bg-emerald-50/20" },
              ].map((k) => (
                <div key={k.label} className={`flex flex-col justify-between p-4 rounded-xl border border-slate-200 shadow-xs ${k.border}`}>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">{k.label}</p>
                  <h3 className={`text-base font-extrabold tracking-tight ${k.color}`}>{k.value}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-white p-4 border border-slate-200 rounded-2xl gap-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex items-center w-full md:w-72">
                <span className="absolute left-3.5 text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Cari ID, Nama, Type, Reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border outline-none bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/10 transition-all text-xs font-bold"
                />
              </div>

              {/* Capex Type Filter */}
              <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider">
                {(["All", "New", "Carry Over"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      filterType === t
                        ? t === "New"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : t === "Carry Over"
                          ? "bg-amber-500 text-white shadow-xs"
                          : "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-955"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSync}
                className={`flex items-center gap-1.5 border px-3.5 py-2.5 rounded-xl font-black uppercase tracking-wider text-[9px] shadow-xs transition-all duration-300 cursor-pointer ${
                  syncing
                    ? "bg-blue-50/80 border-blue-300 text-blue-600 animate-pulse"
                    : "border-slate-250 bg-white text-slate-700 hover:text-blue-600 hover:border-blue-500 hover:bg-slate-50"
                }`}
                disabled={syncing}
              >
                <svg className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                </svg>
                <span>{syncing ? "Menyinkronkan..." : "Sync dari BODR"}</span>
              </button>
              
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 border border-slate-250 bg-white text-slate-700 hover:text-blue-600 hover:border-blue-500 hover:bg-slate-50 font-black px-3.5 py-2.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider text-[9px] shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* CAPEX Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[8px] font-black uppercase tracking-wider select-none">
                    <th className="py-2.5 px-3 text-center w-8">No</th>
                    <th className="py-2.5 px-3 w-28">ID Capex</th>
                    <th className="py-2.5 px-3">Nama Capex</th>
                    <th className="py-2.5 px-3 text-center w-14">Tahun</th>
                    <th className="py-2.5 px-3 w-32">Budget</th>
                    <th className="py-2.5 px-3 w-32">Amount BODR</th>
                    <th className="py-2.5 px-3 w-32">Available</th>
                    <th className="py-2.5 px-3 text-center w-20">Type</th>
                    <th className="py-2.5 px-3 w-24">Reference</th>
                    <th className="py-2.5 px-3">Remark</th>
                    <th className="py-2.5 px-3 text-center w-24">Status</th>
                    <th className="py-2.5 px-3 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-450 italic font-bold">
                        Tidak ada item CAPEX yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50/50 transition-colors border-l-2 ${statusBorder(r.status)} ${idx % 2 === 1 ? "bg-slate-50/30" : "bg-white"}`}
                      >
                        <td className="py-2.5 px-3 text-center font-bold text-slate-450 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-[10px]">{r.id}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 max-w-[200px] break-words whitespace-normal leading-snug" title={r.name}>{r.name}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-bold">{r.tahun}</td>
                        <td className="py-2.5 px-3 font-black text-slate-900 whitespace-nowrap">
                          Rp {r.budget.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 font-black text-blue-600 whitespace-nowrap">
                          Rp {r.amountBodr.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 font-black text-emerald-600 whitespace-nowrap">
                          Rp {r.available.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                          {r.capexType}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-550 text-[10px]">{r.reference}</td>
                        <td className="py-2.5 px-3 text-slate-655 max-w-[150px] break-words whitespace-normal">{r.remark}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-[9px] font-black border shadow-xs ${
                            r.status === "Completed" ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : r.status === "On Track" ? "bg-blue-50 text-blue-800 border-blue-200"
                              : r.status === "Open" ? "bg-slate-50 text-slate-700 border-slate-200"
                              : r.status === "Revision Required" ? "bg-orange-50 text-orange-850 border-orange-200 animate-pulse"
                              : "bg-red-50 text-red-800 border-red-200"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setSelectedCapex(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 font-black hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600 text-[10px] cursor-pointer transition-all shadow-xs"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Summary Footer Row */}
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 text-[10px] font-black text-slate-900">
                    <td colSpan={4} className="py-2.5 px-3 text-slate-700 uppercase tracking-wider">
                      Total ({filtered.length} item)
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-900">
                      Rp {filtered.reduce((s, r) => s + r.budget, 0).toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-blue-600">
                      Rp {filtered.reduce((s, r) => s + r.amountBodr, 0).toLocaleString("id-ID")}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-emerald-600">
                      Rp {filtered.reduce((s, r) => s + r.available, 0).toLocaleString("id-ID")}
                    </td>
                    <td colSpan={5} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Detail Capex Modal */}
      {selectedCapex && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setSelectedCapex(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Detail Capex</h2>
                  <p className="text-[10px] text-slate-500 font-bold">{selectedCapex.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCapex(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info Fields Grid */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3">
                  {[
                    { label: "Nama Capex", value: selectedCapex.name },
                    { label: "ID Capex", value: selectedCapex.id },
                    { label: "Tahun", value: selectedCapex.tahun },
                    { label: "Department", value: selectedCapex.department },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{f.label}</p>
                      <div className="bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-[11px] font-extrabold text-slate-800">
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  {[
                    {
                      label: "Amount Budget",
                      value: `Rp ${selectedCapex.budget.toLocaleString("id-ID")}`,
                      color: "text-slate-900 font-extrabold",
                    },
                    {
                      label: "Amount BODR",
                      value: `Rp ${selectedCapex.amountBodr.toLocaleString("id-ID")}`,
                      color: "text-blue-600 font-extrabold",
                    },
                    {
                      label: "Amount Available",
                      value: `Rp ${selectedCapex.available.toLocaleString("id-ID")}`,
                      color: "text-emerald-600 font-extrabold",
                    },
                    { label: "Status", value: selectedCapex.status },
                    { label: "Remark", value: selectedCapex.remark },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{f.label}</p>
                      {f.label === "Status" ? (
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg inline-block shadow-xs border ${statusColor(selectedCapex.status)}`}>
                          {f.value}
                        </span>
                      ) : (
                        <div className={`bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 text-[11px] ${f.color ?? "text-slate-800 font-bold"}`}>
                          {f.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Related BODR Table */}
              <div>
                <div className="pb-2 mb-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Daftar BODR Terkait
                    <span className="text-[9px] font-black text-slate-600 bg-slate-100 border border-slate-250 px-2 py-0.5 rounded-full">
                      {relatedBodr.length} item
                    </span>
                  </h3>
                  {relatedBodr.length > 0 && (
                    <button
                      onClick={() => {
                        if (!selectedCapex) return;
                        const headers = ["Title", "Requester", "Amount", "No BODR", "Capex Reference", "Status"];
                        const rows2 = relatedBodr.map(b => [
                          `"${b.title}"`,
                          `"${b.requester}"`,
                          b.amount,
                          b.noBodr,
                          b.capexReference,
                          b.status,
                        ]);
                        const csv = [headers.join(","), ...rows2.map(r => r.join(","))].join("\n");
                        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `BODR_${selectedCapex.id}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-250 hover:bg-emerald-100 transition-all cursor-pointer uppercase tracking-wider shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export BODR
                    </button>
                  )}
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[8px] font-black uppercase tracking-wider">
                        <th className="py-2 px-3 border-r border-slate-200">Title</th>
                        <th className="py-2 px-3 border-r border-slate-200">Requester</th>
                        <th className="py-2 px-3 border-r border-slate-200 text-right">Amount</th>
                        <th className="py-2 px-3 border-r border-slate-200">No BODR</th>
                        <th className="py-2 px-3 border-r border-slate-200">Capex Reference</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10px]">
                      {relatedBodr.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-450 italic font-bold">
                            No data available in table
                          </td>
                        </tr>
                      ) : (
                        relatedBodr.map((b, idx) => (
                          <tr
                            key={idx}
                            className={`${idx % 2 === 1 ? "bg-slate-50/30" : "bg-white"} hover:bg-blue-50/50 transition-colors`}
                          >
                            <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200 max-w-[160px] break-words">{b.title}</td>
                            <td className="py-2 px-3 text-slate-500 font-bold border-r border-slate-200">{b.requester}</td>
                            <td className="py-2 px-3 font-extrabold text-blue-600 whitespace-nowrap border-r border-slate-200 text-right">
                              Rp {b.amount.toLocaleString("id-ID")}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-500 font-bold border-r border-slate-200 text-[9px]">{b.noBodr}</td>
                            <td className="py-2 px-3 font-mono text-slate-500 font-bold border-r border-slate-200 text-[9px]">{b.capexReference}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md inline-block border shadow-xs ${bodrStatusColor(b.status)}`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Section */}
              <div className="border-t border-slate-200 pt-4 flex items-center justify-between gap-3">
                <p className="text-[10px] text-slate-500 font-extrabold">
                  Kelola pengajuan BODR atau revisi terkait CAPEX ini
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      Swal.fire({
                        title: "Informasi",
                        text: `Ajukan BODR baru untuk ${selectedCapex?.id}`,
                        icon: "info",
                        confirmButtonColor: "#3b82f6",
                      })
                    }
                    className="flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white hover:shadow-xs transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Ajukan BODR Baru
                  </button>
                  <button
                    onClick={() => setSelectedCapex(null)}
                    className="flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-250 hover:border-slate-450 hover:shadow-xs transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
