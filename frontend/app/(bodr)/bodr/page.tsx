"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import { User, api, getCurrentUser, BodrProposal, BodrCategory } from "../../lib/api";
import BodrTable from "./components/BodrTable";
import BodrCreateModal from "./components/BodrCreateModal";
import BodrDetailModal from "./components/BodrDetailModal";
import BodrOtorisasiModal from "./components/BodrOtorisasiModal";
import { exportBodrToExcel } from "./components/bodrExport";

export default function BodrPage() {
  const [proposals, setProposals] = useState<BodrProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BodrProposal | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOtorisasiModal, setShowOtorisasiModal] = useState(false);
  const [exportToast, setExportToast] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Dynamic master data states
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [capexItems, setCapexItems] = useState<any[]>([]);
  const [capexProposals, setCapexProposals] = useState<any[]>([]);

  // Fetch BODR proposals and master data from backend API
  const refreshData = () => {
    setLoading(true);
    Promise.all([
      api.getBodrProposals(),
      api.getCostCenters(),
      api.getCapexItems(),
      api.getCapexProposals(),
    ])
      .then(([bList, cList, ciList, cpList]) => {
        const mapped: BodrProposal[] = (bList || []).map((b: any) => ({
          id: b.id,
          bodrNo: b.bodr_no,
          title: b.title,
          category: b.category as BodrCategory,
          department: b.department,
          amount: b.amount,
          step: b.step,
          status: b.status,
          date: b.date,
          notes: b.notes,
          proposer: b.proposer,
          lastActor: b.last_actor,
          lastNote: b.last_note,
          benefit: b.benefit,
          capexId: b.capex_id,
          noAsset: b.no_asset,
          costCenter: b.cost_center || "-",
          startDate: b.start_date || "-",
          endDate: b.end_date || "-",
          budgetType: (b.budget_type as "budget" | "unbudget") || "budget",
          namaAsset: b.nama_asset || "-",
          plan: b.plan || "-",
          location: b.location || "-",
          assetType: b.asset_type || "-",
          approvalHistory: b.approval_history || [],
          documents: b.documents || [],
        }));
        setProposals(mapped);
        setCostCenters((cList || []).filter((c: any) => c.status === "active"));
        setCapexItems(ciList || []);
        setCapexProposals(cpList || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshData();
    const user = getCurrentUser();
    if (user) setCurrentUser(user);
  }, []);

  const approvedCapexProposals = capexProposals.filter((p) => {
    return (
      p.gateStatus === "Gate 3 - Procurement" ||
      p.gateStatus === "Gate 4 - Commissioning" ||
      p.gateStatus === "Gate 5 - Benefit Realization" ||
      p.gateStatus === "Gate 6 - Project Closing" ||
      p.gateStatus === "Closed" ||
      p.gate_status?.includes("Gate")
    );
  });

  // Filter based on search & user role/department dimension
  const filtered = proposals.filter((p) => {
    if (currentUser) {
      const role = (currentUser.role as string || "").toUpperCase();
      const isBOD = role === "PRESDIR" || role === "DIR" || role === "ADMIN";
      const isReviewer = role.includes("ACCOUNTING") || role.includes("FINANCE") || role.includes("KOMITE") || role.includes("COMMITTEE") || role.includes("HEAD") || role.includes("DIV");
      const isCreator = p.proposer.toLowerCase() === currentUser.name.toLowerCase() || (currentUser.username && p.proposer.toLowerCase() === currentUser.username.toLowerCase());
      const isSameDept = currentUser.department && p.department.toLowerCase() === currentUser.department.toLowerCase();

      const hasAccess = isBOD || isReviewer || isCreator || isSameDept;
      if (!hasAccess && role !== "ADMIN") return false;
    }

    const term = search.toLowerCase();
    return (
      p.id.toLowerCase().includes(term) ||
      p.bodrNo.toLowerCase().includes(term) ||
      p.title.toLowerCase().includes(term) ||
      p.proposer.toLowerCase().includes(term) ||
      p.department.toLowerCase().includes(term) ||
      p.status.toLowerCase().includes(term)
    );
  });

  const handleExport = () => {
    exportBodrToExcel(filtered);
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header title="BODR Resolution" subtitle="Daftar seluruh proposal BODR, monitoring status, dan pembuatan usulan baru" />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {exportToast && (
            <div className="fixed top-20 right-8 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-xl border border-emerald-500">
              <span className="text-[10px] tracking-wider uppercase">Data BODR Berhasil Diekspor!</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl gap-4 shadow-2xs">
            <div className="relative flex items-center w-80">
              <span className="absolute left-3.5 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari berdasarkan ID, No. BODR, Judul, Pengaju..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border outline-none bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white text-xs font-normal transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider text-[10px] shadow-2xs"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Buat BODR Baru
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider text-[10px] shadow-2xs"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Excel
              </button>
            </div>
          </div>

          {/* Table View */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium">
              Memuat data BODR...
            </div>
          ) : (
            <BodrTable proposals={filtered} onSelect={(p) => setSelected(p)} />
          )}
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <BodrCreateModal
          currentUser={currentUser}
          proposalsCount={proposals.length}
          costCenters={costCenters}
          capexItems={capexItems}
          approvedCapexProposals={approvedCapexProposals}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newP) => {
            setProposals((prev) => [newP, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Detail Modal */}
      {selected && (
        <BodrDetailModal
          proposal={selected}
          onClose={() => setSelected(null)}
          onOpenOtorisasi={() => setShowOtorisasiModal(true)}
        />
      )}

      {/* Otorisasi Modal */}
      {showOtorisasiModal && selected && (
        <BodrOtorisasiModal
          proposal={selected}
          currentUser={currentUser}
          onClose={() => setShowOtorisasiModal(false)}
          onSuccess={() => {
            setShowOtorisasiModal(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
