"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import { User, api, getCurrentUser, BodrProposal } from "../../lib/api";
import BodrApprovalTable from "./components/BodrApprovalTable";
import BodrApprovalActionModal from "./components/BodrApprovalActionModal";
import BodrApprovalDetailModal from "./components/BodrApprovalDetailModal";

export default function BodrApprovalPage() {
  const [proposals, setProposals] = useState<BodrProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<BodrProposal | null>(null);
  const [selectedAction, setSelectedAction] = useState<BodrProposal | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all-pending");

  const refreshData = () => {
    setLoading(true);
    api.getBodrProposals()
      .then((data) => {
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
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen ml-64">
        <Header title="Approval BODR" subtitle="Pusat otorisasi dan persetujuan bertingkat pengajuan BOD Review" />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Filter Toolbar */}
          <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-2xl gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari no. BODR, judul, pengusul..."
                className="w-72 pl-3 pr-4 py-2 rounded-xl border outline-none bg-slate-50 border-slate-200 text-slate-900 text-xs font-normal focus:border-blue-600 focus:bg-white"
              />
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: "all-pending", label: "Perlu Persetujuan" },
                  { id: "approved", label: "Disetujui" },
                  { id: "rejected", label: "Ditolak / Revisi" },
                  { id: "all", label: "Semua" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === tab.id
                        ? "bg-white text-blue-600 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={refreshData}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer shadow-2xs"
            >
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
