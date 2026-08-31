"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import { User, api, getCurrentUser, BodrProposal, BodrCategory, ApiApprovalWorkflow } from "../../lib/api";
import { useCapex } from "../../context/CapexContext";
import BodrTable from "./components/BodrTable";
import BodrCreateModal from "./components/BodrCreateModal";
import BodrDetailModal from "./components/BodrDetailModal";
import BodrOtorisasiModal from "./components/BodrOtorisasiModal";
import { exportBodrToExcel } from "./components/bodrExport";

// ── Map DB enum status → display label ───────────────────────────────────────
const mapBodrStatus = (s: string): string => {
  switch ((s || "").toLowerCase()) {
    case "in_approval":      return "Pending Review";
    case "approved":         return "Approved";
    case "rejected":         return "Rejected";
    case "revision_required":return "Revision Required";
    case "draft":            return "Draft";
    default:                 return s;
  }
};

export default function BodrPage() {
  const router = useRouter();
  const { currentUser: authUser, hasPermission } = useCapex();
  const [proposals, setProposals] = useState<BodrProposal[]>([]);
  const [workflows, setWorkflows] = useState<ApiApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BodrProposal | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOtorisasiModal, setShowOtorisasiModal] = useState(false);
  const [exportToast, setExportToast] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const canCreateBodr = hasPermission("perm_create_bodr");
  const canApproveBodr = hasPermission("perm_approve_bodr");
  const canViewDashboard = hasPermission("perm_view_dashboard");
  const canExport = hasPermission("perm_view_reports") || hasPermission("perm_export_data");
  const isAdmin = (authUser?.role || "").toLowerCase() === "admin" || (currentUser?.role || "").toLowerCase() === "admin";

  // If user does not have permission to create BODR, redirect them to their permitted page
  useEffect(() => {
    if (authUser && !loading && !canCreateBodr && !isAdmin) {
      if (canApproveBodr) {
        router.replace("/bodr-approval");
      } else if (canViewDashboard) {
        router.replace("/bodr-dashboard");
      } else {
        router.replace("/bodr-progress");
      }
    }
  }, [authUser, loading, canCreateBodr, isAdmin, canApproveBodr, canViewDashboard, router]);

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
      api.getApprovalWorkflows().catch(() => []),
    ])
      .then(([bList, cList, ciList, cpList, wfs]) => {
        const mapped: BodrProposal[] = (bList || []).map((b: any) => ({
          id: b.id,
          bodrNo: b.bodr_id_final ?? "—",
          title: b.title,
          category: b.category as BodrCategory,
          department: b.department,
          amount: b.amount,
          step: b.step,
          status: mapBodrStatus(b.status),
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
        setWorkflows((wfs || []).filter((w: ApiApprovalWorkflow) => w.status === "active"));
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
    const s = (p.gateStatus || p.status || p.gate_status || "").toLowerCase();
    return (
      s.includes("approved") ||
      s.includes("procurement") ||
      s.includes("commissioning") ||
      s.includes("benefit") ||
      s.includes("closing") ||
      s.includes("closed") ||
      Boolean(p.capexId && p.capexId !== "-")
    );
  });

  // Filter based on search & user role/department dimension
  const filtered = proposals.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      p.bodrNo.toLowerCase().includes(term) ||
      p.title.toLowerCase().includes(term) ||
      p.proposer.toLowerCase().includes(term) ||
      p.department.toLowerCase().includes(term);

    // If admin, can view everything
    if (isAdmin) return matchesSearch;

    // Normal user: prioritize department matching
    const userDept = (currentUser?.department || authUser?.department || "").toLowerCase();
    if (userDept) {
      return matchesSearch && (p.department || "").toLowerCase() === userDept;
    }
    return matchesSearch;
  });

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen ml-64 overflow-hidden">
        <Header title="BODR Application" subtitle="Daftar dan pengajuan Budget Over Design Review" />

        {/* Export Notification Toast */}
        {exportToast && (
          <div className="fixed top-20 right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/20 bg-white/95 backdrop-blur-md text-emerald-800 text-xs font-semibold shadow-lg transition-all">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              ✓
            </div>
            <div>
              <p className="font-semibold text-xs text-slate-800">Ekspor Berhasil</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Data BODR berhasil diekspor ke Excel!</p>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Header & Controls */}
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari no. BODR, judul, pengusul..."
                className="w-72 pl-3 pr-4 py-2 rounded-xl border outline-none bg-slate-50 border-slate-200 text-slate-900 text-xs font-normal focus:border-blue-600 focus:bg-white"
              />
              <span className="text-xs text-slate-500 font-normal">{filtered.length} Usulan</span>
            </div>

            <div className="flex items-center gap-3">
              {canExport && (
                <button
                  type="button"
                  onClick={() => {
                    exportBodrToExcel(filtered);
                    setExportToast(true);
                    setTimeout(() => setExportToast(false), 4000);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Excel
                </button>
              )}
              {canCreateBodr && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Ajukan BODR
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium">
              Memuat data pengajuan BODR...
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
          workflows={workflows}
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
