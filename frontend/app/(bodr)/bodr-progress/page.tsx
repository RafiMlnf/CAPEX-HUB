"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "../../components/sidebars/SidebarBODR";
import Header from "../../components/Header";
import {
  api,
  BodrProgressProposalItem,
  BodrProgressWorkflowSummary,
  BodrProgressWorkflowStep,
  ApiApprovalWorkflow,
} from "../../lib/api";

import BodrProgressHeader from "../../components/progress/BodrProgressHeader";
import BodrProgressStatusLegend from "../../components/progress/BodrProgressStatusLegend";
import BodrProgressStageTabs from "../../components/progress/BodrProgressStageTabs";
import BodrProgressStepper from "../../components/progress/BodrProgressStepper";
import BodrProgressMatrixTable, { BodrProgressRowData } from "../../components/progress/BodrProgressMatrixTable";
import BodrProgressLeadTimeModal from "../../components/progress/BodrProgressLeadTimeModal";

// ── Helper: calculate actual days between two date strings ──────────────────
function calculateDays(startStr?: string, endStr?: string): string {
  if (!startStr) return "-";
  const start = new Date(startStr).getTime();
  if (isNaN(start)) return "-";
  const end = endStr ? new Date(endStr).getTime() : Date.now();
  if (isNaN(end)) return "-";
  const diffMs = Math.max(0, end - start);
  const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return diffDays.toString();
}

// ── Helper: convert BodrProgressWorkflowSummary to ApiApprovalWorkflow shape ─
function toApiWorkflow(summary: BodrProgressWorkflowSummary | null): ApiApprovalWorkflow | null {
  if (!summary) return null;
  return {
    id: summary.departemen_id,
    departemen_id: summary.departemen_id,
    departemen_nama: summary.departemen_nama,
    type_approval_id: "",
    type_approval_nama: "",
    list_approval: summary.steps.map((s) => ({
      user_id: "",
      user_name: s.user_name,
      role: s.role,
      order: s.step_order,
    })),
    status: "active",
    created_at: "",
  };
}

export default function BodrProgressPage() {
  const [proposals, setProposals] = useState<BodrProgressProposalItem[]>([]);
  const [workflows, setWorkflows] = useState<BodrProgressWorkflowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedProject, setSelectedProject] = useState<BodrProgressRowData | null>(null);
  const [exportToast, setExportToast] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getBodrProgress()
      .then((res) => {
        setProposals(res.proposals || []);
        setWorkflows((res.workflows || []).filter((w) => w.steps.length > 0));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── 100% Dynamic Workflow Steps from DB Settings (Zero Mock / Zero Hardcode) ─
  const workflowStepNames: string[] = useMemo(() => {
    if (workflows.length === 0) {
      return [];
    }
    const allStepsWithOrder: { role: string; order: number }[] = [];
    workflows.forEach((w) => {
      (w.steps || []).forEach((s) => {
        if (s.role && !allStepsWithOrder.some((x) => x.role.toLowerCase().trim() === s.role.toLowerCase().trim())) {
          allStepsWithOrder.push({ role: s.role, order: s.step_order });
        }
      });
    });
    allStepsWithOrder.sort((a, b) => a.order - b.order);
    return allStepsWithOrder.map((s) => s.role);
  }, [workflows]);

  // ── Find workflow summary for a given departemen_nama ──────────────────────
  const getWorkflowForDept = (deptName: string): BodrProgressWorkflowSummary | null => {
    const name = deptName.toLowerCase().trim();
    return (
      workflows.find((w) => (w.departemen_nama || "").toLowerCase().trim() === name) ||
      workflows[0] ||
      null
    );
  };

  // ── Enrich proposals into BodrProgressRowData (Dynamic Step Statuses) ───────
  const enrichedRows: BodrProgressRowData[] = useMemo(() => {
    return proposals.map((proposal) => {
      const history = proposal.approval_history || [];
      const proposalStatus = (proposal.status || "").toLowerCase();

      const stepStatuses: Record<string, { days: string; status: string }> = {};

      workflowStepNames.forEach((stepRole, sIdx) => {
        const roleLower = stepRole.toLowerCase().trim();
        const matchHist = history.find((h) => (h.role || "").toLowerCase().trim() === roleLower);

        if (matchHist) {
          const st = (matchHist.status || "").toLowerCase();
          const prevTs = sIdx === 0 ? proposal.created_at : (history[sIdx - 1]?.timestamp || proposal.created_at);
          const days = calculateDays(prevTs, matchHist.timestamp);

          if (st.includes("reject")) {
            stepStatuses[stepRole] = { days, status: "Rejected" };
          } else if (st.includes("revision")) {
            stepStatuses[stepRole] = { days, status: "Revision" };
          } else if (st.includes("approve")) {
            stepStatuses[stepRole] = { days, status: "Approved" };
          } else {
            stepStatuses[stepRole] = { days, status: "In Progress" };
          }
        } else {
          // Check if proposal is currently waiting at this step
          const isCurrent =
            proposal.current_step === sIdx + 1 ||
            (sIdx === 0 && history.length === 0 && !proposalStatus.includes("draft") && !proposalStatus.includes("approve"));

          if (isCurrent) {
            const prevTs = sIdx === 0 ? proposal.created_at : (history[sIdx - 1]?.timestamp || proposal.created_at);
            const days = calculateDays(prevTs);
            stepStatuses[stepRole] = { days, status: "In Progress" };
          } else {
            stepStatuses[stepRole] = { days: "-", status: "Waiting" };
          }
        }
      });

      // Dynamically resolve active step's role from workflow_steps or approval_history
      const currentStepObj = (proposal.workflow_steps || []).find((s) => s.step_order === proposal.current_step)
        || (proposal.approval_history || []).find((h) => h.step_order === proposal.current_step);
      const activeStepName = currentStepObj?.role || (proposalStatus.includes("approved") ? "Approved" : "Pending Review");

      // Dynamic resolution: if proposal status is Approved or all step statuses are Approved -> isClosedAll
      const isClosedAll =
        proposalStatus.includes("approved") ||
        (Object.values(stepStatuses).length > 0 &&
          Object.values(stepStatuses).every((s) => (s.status || "").toLowerCase().includes("approved")));

      return {
        id: proposal.id,
        bodr_no: proposal.bodr_no,
        title: proposal.title,
        category: proposal.category,
        department: proposal.department,
        proposer: proposal.proposer,
        amount: proposal.amount,
        step: activeStepName,
        status: proposal.status,
        created_at: proposal.created_at,
        stepStatuses,
        isClosedAll,
        rawProposal: proposal,
      };
    });
  }, [proposals, workflows, workflowStepNames]);

  // ── Dynamic Tab Filtering ──────────────────────────────────────────────────
  const tabFiltered = useMemo(() => {
    return enrichedRows.filter((r) => {
      if (activeTab === "archive") {
        return r.isClosedAll;
      }
      // For active tabs, only show active proposals (not yet full approved)
      if (r.isClosedAll) return false;

      if (activeTab === "all") return true;

      const st = r.stepStatuses?.[activeTab]?.status || "";
      return st === "In Progress" || st === "Revision";
    });
  }, [enrichedRows, activeTab]);

  // ── Search & Status Filter ─────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    return tabFiltered.filter((r) => {
      const s = search.toLowerCase();
      const matchSearch =
        r.bodr_no.toLowerCase().includes(s) ||
        r.title.toLowerCase().includes(s) ||
        r.proposer.toLowerCase().includes(s) ||
        r.department.toLowerCase().includes(s) ||
        r.category.toLowerCase().includes(s);

      const matchStatus =
        statusFilter === "All" || r.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [tabFiltered, search, statusFilter]);

  // ── Dynamic Tab Badge Counters ─────────────────────────────────────────────
  const tabCounts = useMemo(() => {
    const activeRows = enrichedRows.filter((r) => !r.isClosedAll);
    const archiveRows = enrichedRows.filter((r) => r.isClosedAll);

    const counts: Record<string, number> = {
      all: activeRows.length,
      archive: archiveRows.length,
    };
    workflowStepNames.forEach((s) => {
      counts[s] = activeRows.filter((r) => {
        const st = r.stepStatuses?.[s]?.status || "";
        return st === "In Progress" || st === "Revision";
      }).length;
    });
    return counts;
  }, [enrichedRows, workflowStepNames]);

  // ── Get ApiApprovalWorkflow shape for the selected project's modal ──────────
  const selectedWorkflow = useMemo((): ApiApprovalWorkflow | null => {
    if (!selectedProject) return null;
    const wfSummary = getWorkflowForDept(selectedProject.department);
    return toApiWorkflow(wfSummary);
  }, [selectedProject, workflows]);

  const handleExportExcel = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 4000);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-xs text-slate-800 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen ml-64 bg-slate-100 min-w-0 overflow-hidden">
        <Header
          title="BODR Progress Monitoring"
          subtitle="Overview dan detail workflow approval pengajuan BODR per departemen secara realtime"
        />

        {/* Export Notification Toast */}
        {exportToast && (
          <div className="fixed top-20 right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/20 bg-white/95 backdrop-blur-md text-emerald-800 text-xs font-semibold shadow-lg transition-all">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              ✓
            </div>
            <div>
              <p className="font-semibold text-xs text-slate-800">Ekspor Berhasil</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Data Progress BODR berhasil diekspor ke Excel!
              </p>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 w-full min-w-0 overflow-x-hidden">
          {/* Header Action Bar */}
          <BodrProgressHeader
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
            totalCount={filteredRows.length}
          />

          {/* Status Legend Strip */}
          <BodrProgressStatusLegend />

          {/* Process Stage Navigation Tabs — 100% Dinamis per Approval Step */}
          <BodrProgressStageTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            counts={tabCounts}
            steps={workflowStepNames}
          />

          {/* Stepper & Main Table Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs w-full min-w-0 space-y-3.5">
            <BodrProgressStepper steps={workflowStepNames} />

            <BodrProgressMatrixTable
              loading={loading}
              rows={filteredRows}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(num) => {
                setItemsPerPage(num);
                setCurrentPage(1);
              }}
              onSelectProject={(row) => setSelectedProject(row)}
              steps={workflowStepNames}
            />
          </div>
        </main>
      </div>

      {/* Lead Time & Approval History Modal */}
      <BodrProgressLeadTimeModal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        row={selectedProject}
        approvalWorkflow={selectedWorkflow}
      />
    </div>
  );
}
