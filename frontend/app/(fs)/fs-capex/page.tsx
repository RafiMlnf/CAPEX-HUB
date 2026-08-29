"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "../../components/sidebars/SidebarFS";
import Header from "../../components/Header";
import { api } from "../../lib/api";
import { useCapex } from "../../context/CapexContext";

// Modular Subcomponents
import ProgressHeader from "../../components/progress/ProgressHeader";
import ProgressStatusLegend from "../../components/progress/ProgressStatusLegend";
import ProgressStageTabs from "../../components/progress/ProgressStageTabs";
import ProgressStepper from "../../components/progress/ProgressStepper";
import ProgressMatrixTable, { ProgressRowData } from "../../components/progress/ProgressMatrixTable";
import ProgressLeadTimeModal from "../../components/progress/ProgressLeadTimeModal";

export default function CapexProgressPage() {
  const { proposals, refreshProposals, currentUser } = useCapex();
  const [dbCapexItems, setDbCapexItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<"all" | "gate0" | "gate1" | "gate2">("all");
  const [exportToast, setExportToast] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeadTimeProject, setSelectedLeadTimeProject] = useState<ProgressRowData | null>(null);

  // Sync real-time database data on component mount
  useEffect(() => {
    setLoading(true);
    refreshProposals();
    Promise.all([
      api.getCapexProposals().catch(() => []),
      api.getCapexItems().catch(() => []),
    ])
      .then(([cpxProposals, items]) => {
        const merged = [...(cpxProposals || []), ...(items || [])];
        setDbCapexItems(merged);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [refreshProposals]);

  // Combined live proposals from context and database API (0 mock data)
  const combinedProposals = useMemo(() => {
    if (proposals && proposals.length > 0) {
      return proposals;
    }
    if (dbCapexItems && dbCapexItems.length > 0) {
      return dbCapexItems.map((c: any, idx: number) => ({
        id: c.id || `CPX-2026-${String(idx + 1).padStart(3, "0")}`,
        capexId: c.capexId || c.code || c.kode_capex || "-",
        name: c.name || c.nama_capex || c.item_name || c.capex_name || "-",
        description: c.description || "-",
        department: c.department || c.departemen || c.departemen?.nama_departemen || currentUser?.department || "-",
        purpose: c.purpose || "-",
        investmentType: c.investmentType || c.investment_type || c.capex_type || "-",
        pic: c.pic || currentUser?.name || currentUser?.username || "-",
        estimatedCost: Number(c.total_amount || c.estimatedCost || c.budget || c.amount || 0),
        gateStatus: c.gateStatus || c.status || "Gate 0 - Idea",
        createdAt: c.createdAt || new Date().toISOString(),
        history: c.history || [],
      }));
    }
    return [];
  }, [proposals, dbCapexItems, currentUser]);

function calculateDays(startDateStr?: string, endDateStr?: string): string {
  if (!startDateStr) return "1";
  const start = new Date(startDateStr).getTime();
  if (isNaN(start)) return "1";
  const end = endDateStr ? new Date(endDateStr).getTime() : Date.now();
  if (isNaN(end)) return "1";
  const diffMs = Math.max(0, end - start);
  const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return diffDays.toString();
}

// ── 100% Accumulated Planning Lead Time (Doesn't reset on revision/reject) ──
function calculatePlanningLeadTime(proposal: any): string {
  const createdAt = proposal.createdAt ? new Date(proposal.createdAt).getTime() : Date.now();
  const history: any[] = Array.isArray(proposal.history) ? proposal.history : [];
  const gsLower = (proposal.gateStatus || "").toLowerCase();
  const isCurrentlyInPlanning = gsLower.includes("idea") || gsLower.includes("draft");

  let totalMs = 0;

  // 1. Initial Planning interval (from createdAt to first submission)
  const firstSubmission = history.find(
    (h: any) => h.gate >= 1 || (h.action && (h.action.includes("SUBMITTED") || h.action.includes("Diajukan")))
  );
  const firstSubTime = firstSubmission
    ? new Date(firstSubmission.timestamp).getTime()
    : proposal.financeApprovedAt
    ? new Date(proposal.financeApprovedAt).getTime()
    : null;

  if (firstSubTime && !isNaN(firstSubTime)) {
    totalMs += Math.max(0, firstSubTime - createdAt);
  } else {
    // Has never been submitted yet
    totalMs += Math.max(0, Date.now() - createdAt);
  }

  // 2. Subsequent Revision intervals (from revision return until next resubmit)
  for (let i = 0; i < history.length; i++) {
    const h = history[i];
    const actionLower = (h.action || "").toLowerCase();
    const notesLower = (h.notes || "").toLowerCase();

    // Check if this history entry returned proposal to Draft/Revision
    const isRevisionReturn =
      actionLower.includes("revise") ||
      actionLower.includes("revisi") ||
      actionLower.includes("reject") ||
      actionLower.includes("tolak") ||
      actionLower.includes("kembali") ||
      notesLower.includes("revisi") ||
      notesLower.includes("reject");

    if (isRevisionReturn) {
      const revStartTime = new Date(h.timestamp).getTime();
      if (!isNaN(revStartTime)) {
        // Find when it was resubmitted next
        let resubTime: number | null = null;
        for (let j = i + 1; j < history.length; j++) {
          const nextH = history[j];
          const nextActionLower = (nextH.action || "").toLowerCase();
          if (
            nextActionLower.includes("resubmitted") ||
            nextActionLower.includes("diajukan ulang") ||
            nextActionLower.includes("diunggah ulang") ||
            nextH.gate >= 1
          ) {
            const t = new Date(nextH.timestamp).getTime();
            if (!isNaN(t) && t >= revStartTime) {
              resubTime = t;
              break;
            }
          }
        }

        if (resubTime !== null) {
          totalMs += Math.max(0, resubTime - revStartTime);
        } else if (isCurrentlyInPlanning) {
          // Still in draft currently, continue counting
          totalMs += Math.max(0, Date.now() - revStartTime);
        }
      }
    }
  }

  const days = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
  return days.toString();
}

  // Compute Gate Status & Actual Days for each row
  const enrichedRows: ProgressRowData[] = useMemo(() => {
    return combinedProposals.map((p: any) => {
      const gs = p.gateStatus || "Gate 0 - Idea";
      const createdAt = p.createdAt || new Date().toISOString();

      // Gate 0 (Planning) — Accumulated lead time
      const gsLower = gs.toLowerCase();
      let g0Status = "Waiting";
      let g0Days = calculatePlanningLeadTime(p);
      if (gsLower.includes("idea") || gsLower.includes("draft")) {
        g0Status = "Open";
      } else {
        g0Status = "Closed";
      }

      // Gate 1 (FinAcct Review)
      let g1Status = "Waiting";
      let g1Days = "-";
      const g1Start =
        (Array.isArray(p.history) && p.history.find((h: any) => h.gate >= 1)?.timestamp) ||
        createdAt;

      if (gsLower.includes("finance") || gsLower.includes("revise")) {
        g1Status = "In Progress";
        g1Days = calculateDays(g1Start);
      } else if (gsLower.includes("pending") || gsLower.includes("feedback")) {
        g1Status = "Semi Close";
        g1Days = calculateDays(g1Start);
      } else if (
        gsLower.includes("committee") ||
        gsLower.includes("komite") ||
        gsLower.includes("procurement") ||
        gsLower.includes("approved") ||
        gsLower.includes("closed")
      ) {
        g1Status = "Closed";
        const g1End = p.financeApprovedAt || g1Start;
        g1Days = calculateDays(g1Start, g1End);
      }

      // Gate 2 (Komite Review)
      let g2Status = "Waiting";
      let g2Days = "-";
      const g2Start =
        p.financeApprovedAt ||
        (Array.isArray(p.history) && p.history.find((h: any) => h.gate === 2)?.timestamp) ||
        g1Start;

      if (gsLower.includes("committee") || gsLower.includes("komite")) {
        g2Status = "In Progress";
        g2Days = calculateDays(g2Start);
      } else if (gsLower.includes("revised")) {
        g2Status = "Open";
        g2Days = calculateDays(g2Start);
      } else if (gsLower.includes("rejected") || gsLower.includes("tolak")) {
        g2Status = "Overdue, Closed";
        g2Days = calculateDays(g2Start);
      } else if (
        gsLower.includes("approved") ||
        gsLower.includes("procurement") ||
        gsLower.includes("closed")
      ) {
        g2Status = "Closed";
        const g2End = p.committeeApprovedAt || g2Start;
        g2Days = calculateDays(g2Start, g2End);
      }

      return {
        id: p.id,
        capexId: p.capexId && p.capexId !== "-" ? p.capexId : "-",
        name: p.name,
        department: p.department,
        purpose: p.purpose,
        investmentType: p.investmentType,
        estimatedCost: p.estimatedCost,
        pic: p.pic,
        createdAt: p.createdAt,
        gateStatus: p.gateStatus,
        attachmentName: p.attachmentName,
        rawProposal: p,
        g0Days,
        g0Status,
        g1Days,
        g1Status,
        g2Days,
        g2Status,
      };
    });
  }, [combinedProposals]);

  // Tab Filtering
  const tabFiltered = useMemo(() => {
    return enrichedRows.filter((r) => {
      if (activeTab === "gate0") return r.g0Status === "Open" || r.g0Status === "In Progress";
      if (activeTab === "gate1") return r.g1Status === "In Progress" || r.g1Status === "Semi Close";
      if (activeTab === "gate2") return r.g2Status === "In Progress" || r.g2Status === "Closed";
      return true;
    });
  }, [enrichedRows, activeTab]);

  // Search & Status Filter
  const filteredRows = useMemo(() => {
    return tabFiltered.filter((r) => {
      const matchSearch =
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        (r.capexId && r.capexId.toLowerCase().includes(search.toLowerCase())) ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase()) ||
        (r.purpose && r.purpose.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === "All" ||
        r.g0Status.toLowerCase() === statusFilter.toLowerCase() ||
        r.g1Status.toLowerCase() === statusFilter.toLowerCase() ||
        r.g2Status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [tabFiltered, search, statusFilter]);

  // Tab badge counters
  const tabCounts = useMemo(() => ({
    all: enrichedRows.length,
    gate0: enrichedRows.filter(r => r.g0Status === "Open" || r.g0Status === "In Progress").length,
    gate1: enrichedRows.filter(r => r.g1Status === "In Progress" || r.g1Status === "Semi Close").length,
    gate2: enrichedRows.filter(r => r.g2Status === "In Progress" || r.g2Status === "Closed").length,
  }), [enrichedRows]);

  const handleExportExcel = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 4000);
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen ml-64 bg-slate-100 min-w-0 overflow-x-hidden">
        <Header
          title="CAPEX Progress Monitoring"
          subtitle="Overview and details of CAPEX workflow across active stages and departments"
        />

        {/* Export Notification Toast */}
        {exportToast && (
          <div className="fixed top-20 right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/20 bg-white/95 backdrop-blur-md text-emerald-800 text-xs font-semibold shadow-lg transition-all">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              ✓
            </div>
            <div>
              <p className="font-semibold text-xs text-slate-800">Ekspor Berhasil</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Data Progress CAPEX berhasil diekspor ke Excel!</p>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 w-full min-w-0 overflow-x-hidden">
          {/* Header Action Bar */}
          <ProgressHeader
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            onExportExcel={handleExportExcel}
          />

          {/* Status Legend Strip */}
          <ProgressStatusLegend />

          {/* Process Stage Navigation Tabs */}
          <ProgressStageTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            counts={tabCounts}
          />

          {/* Stepper Diagram & Main Table Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs w-full min-w-0 space-y-3.5">
            {/* Stage Stepper Line */}
            <ProgressStepper />

            {/* Matrix Progress Table */}
            <ProgressMatrixTable
              loading={loading}
              rows={filteredRows}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(num) => {
                setItemsPerPage(num);
                setCurrentPage(1);
              }}
              onSelectProject={(row) => setSelectedLeadTimeProject(row)}
            />
          </div>
        </main>
      </div>

      {/* Details of Lead Time & Stage Activities Modal */}
      <ProgressLeadTimeModal
        isOpen={!!selectedLeadTimeProject}
        onClose={() => setSelectedLeadTimeProject(null)}
        proposal={selectedLeadTimeProject}
      />
    </div>
  );
}
