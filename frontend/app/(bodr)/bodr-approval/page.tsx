"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import { User, api, getCurrentUser, BodrProposal, ApiApprovalWorkflow } from "../../lib/api";
import BodrApprovalTable from "./components/BodrApprovalTable";
import BodrApprovalActionModal from "./components/BodrApprovalActionModal";
import BodrApprovalDetailModal from "./components/BodrApprovalDetailModal";

export default function BodrApprovalPage() {
  const [proposals, setProposals] = useState<BodrProposal[]>([]);
  const [workflows, setWorkflows] = useState<ApiApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<BodrProposal | null>(null);
  const [selectedAction, setSelectedAction] = useState<BodrProposal | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all-pending");

  const refreshData = () => {
    setLoading(true);
    Promise.all([
      api.getBodrProposals(),
      api.getApprovalWorkflows().catch(() => []),
    ])
      .then(([data, wfs]) => {
        const mapped: BodrProposal[] = (data || []).map((b: any) => ({
          id: b.id,
          bodrNo: b.bodr_no,
          title: b.title,
          category: b.category,
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
        }));
        setProposals(mapped);
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

  const filtered = proposals.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      p.bodrNo.toLowerCase().includes(term) ||
      p.title.toLowerCase().includes(term) ||
      p.proposer.toLowerCase().includes(term) ||
      p.department.toLowerCase().includes(term);

    if (statusFilter === "all-pending") {
      return matchesSearch && p.status === "Pending Review";
    }
    if (statusFilter === "approved") {
      return matchesSearch && p.status === "Approved";
    }
    if (statusFilter === "rejected") {
      return matchesSearch && (p.status === "Rejected" || p.status === "Revision Required");
    }
    return matchesSearch;
  });

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen ml-64 overflow-hidden">
        <Header title="Approval BODR" subtitle="Pusat otorisasi dan persetujuan bertingkat pengajuan BOD Review" />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-5 py-3.5 border border-slate-200 rounded-2xl gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari no. BODR, judul, pengusul..."
                  className="w-72 pl-9 pr-3 py-2 rounded-xl border outline-none bg-slate-50/70 border-slate-200 text-slate-900 text-xs font-normal focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 hidden md:inline">Status:</span>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 text-slate-800 text-xs font-semibold focus:border-indigo-600 focus:bg-white outline-none cursor-pointer transition-all shadow-2xs"
                  >
                    <option value="all-pending">Perlu Persetujuan</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak / Revisi</option>
                    <option value="all">Semua Status</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Counter info */}
              <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                Total: <strong className="text-slate-800 font-semibold">{filtered.length}</strong> pengajuan
              </span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={refreshData}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer shadow-2xs transition-all shrink-0"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium">
              Memuat antrian approval...
            </div>
          ) : (
            <BodrApprovalTable
              proposals={filtered}
              currentUser={currentUser}
              onSelect={(p) => setSelectedDetail(p)}
              onOpenAction={(p) => setSelectedAction(p)}
            />
          )}
        </main>
      </div>

      {/* Action Review Modal */}
      {selectedAction && (
        <BodrApprovalActionModal
          proposal={selectedAction}
          currentUser={currentUser}
          workflow={
            workflows.find(
              (w) =>
                (w.departemen_nama || "").toLowerCase().trim() ===
                (selectedAction.department || "").toLowerCase().trim()
            ) ||
            workflows[0] ||
            null
          }
          onClose={() => setSelectedAction(null)}
          onSuccess={(updated) => {
            setProposals((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            setSelectedAction(null);
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedDetail && (
        <BodrApprovalDetailModal
          proposal={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onOpenAction={() => {
            setSelectedAction(selectedDetail);
            setSelectedDetail(null);
          }}
        />
      )}
    </div>
  );
}
