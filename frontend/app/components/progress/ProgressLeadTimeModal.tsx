"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ProgressRowData } from "./ProgressMatrixTable";
import { getUsers, getCurrentUser, User } from "../../lib/api";
import { formatDateDisplay } from "../../lib/dateUtils";

interface ActivityLogItem {
  id: string | number;
  date: string;
  rawTimestamp?: number;
  roleName: string;
  submitBy: string;
  approvalType: string;
  action: string;
  actionType: "upload" | "approved" | "rejected" | "revised" | "review" | "default";
  days: string | number;
  description: string;
}

interface ProgressLeadTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: (ProgressRowData & { rawProposal?: any }) | null;
}

function formatDateWIB(dateStr?: string): string {
  return formatDateDisplay(dateStr);
}

export default function ProgressLeadTimeModal({
  isOpen,
  onClose,
  proposal,
}: ProgressLeadTimeModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [usersList, setUsersList] = useState<User[]>([]);
  const itemsPerPage = 8;

  useEffect(() => {
    getUsers()
      .then((data) => {
        if (Array.isArray(data)) setUsersList(data);
      })
      .catch((err) => console.error("Error fetching users for lead time modal:", err));
  }, []);

  // Helper to find a specific user by identifier (exact name, username, or NPK)
  const findUserByIdentifier = (rawId?: string): User | undefined => {
    if (!rawId) return undefined;
    const q = rawId.trim().toLowerCase();
    const loggedIn = getCurrentUser();
    if (
      loggedIn &&
      ((loggedIn.name && loggedIn.name.trim().toLowerCase() === q) ||
        (loggedIn.username && loggedIn.username.trim().toLowerCase() === q) ||
        (loggedIn.npk && loggedIn.npk.trim().toLowerCase() === q))
    ) {
      return loggedIn;
    }
    if (!usersList.length) return undefined;
    return (
      usersList.find(
        (u) =>
          (u.name && u.name.trim().toLowerCase() === q) ||
          (u.username && u.username.trim().toLowerCase() === q) ||
          (u.npk && u.npk.trim().toLowerCase() === q)
      ) || undefined
    );
  };

  // ── 1. Dedicated Handler: Gate 0 Capex Planning Submission ──
  const buildPlanningStageLog = (
    picIdentifier?: string,
    deptFallback?: string,
    benefitText?: string,
    dateStr?: string,
    daysVal: number = 1
  ): ActivityLogItem => {
    const resolvedIdentifier = (picIdentifier || "").trim() || proposal?.pic || raw?.pic || getCurrentUser()?.name || "Pemohon";

    const found =
      findUserByIdentifier(resolvedIdentifier) ||
      (getCurrentUser()?.name?.toLowerCase() === resolvedIdentifier.toLowerCase() ? getCurrentUser() : undefined);

    const roleName = found?.role
      ? (found.department ? `${found.role} (${found.department})` : found.role)
      : (deptFallback ? `Proposer / Pemohon (${deptFallback})` : "Proposer / Pemohon");

    const submitByName = (found?.name || resolvedIdentifier).toUpperCase();

    return {
      id: 1,
      date: formatDateWIB(dateStr),
      rawTimestamp: new Date(dateStr || 0).getTime() || 0,
      roleName,
      submitBy: submitByName,
      approvalType: "Capex Planning",
      action: "SUBMITTED",
      actionType: "default",
      days: `${daysVal} Days`,
      description: benefitText || "-",
    };
  };

  // ── 2. Dedicated Handler: Document Upload (Revisi / Dokumen Pendukung) ──
  const buildDocumentUploadStageLog = (
    uploaderIdentifier?: string,
    deptFallback?: string,
    fileNames?: string,
    dateStr?: string,
    id: number = 4
  ): ActivityLogItem => {
    const resolvedIdentifier = (uploaderIdentifier || "").trim() || proposal?.pic || raw?.pic || getCurrentUser()?.name || "Pemohon";

    const found =
      findUserByIdentifier(resolvedIdentifier) ||
      (getCurrentUser()?.name?.toLowerCase() === resolvedIdentifier.toLowerCase() ? getCurrentUser() : undefined);

    const roleName = found?.role
      ? (found.department ? `${found.role} (${found.department})` : found.role)
      : (deptFallback ? `Proposer / Pemohon (${deptFallback})` : "Proposer / Pemohon");

    const proposalBenefit =
      raw?.description ||
      raw?.benefit ||
      (proposal as any)?.description ||
      (proposal as any)?.benefit ||
      "-";

    const submitByName = (found?.name || resolvedIdentifier || getCurrentUser()?.name || "Pemohon").toUpperCase();

    return {
      id,
      date: formatDateWIB(dateStr),
      rawTimestamp: new Date(dateStr || 0).getTime() || 0,
      roleName,
      submitBy: submitByName,
      approvalType: "Document Upload",
      action: "UPLOAD",
      actionType: "upload",
      days: "1 Day",
      description: proposalBenefit,
    };
  };

  // ── 3. Dedicated Handler: Gate 1 Finance & Accounting Review ──
  const buildFinanceReviewStageLog = (
    explicitActor?: string,
    approvedByField?: string,
    dateStr?: string,
    notes?: string,
    isApproved: boolean = false,
    isRevised: boolean = false,
    isPending: boolean = false,
    daysVal: number = 1,
    id: number = 3
  ): ActivityLogItem => {
    const target = (explicitActor || approvedByField || "").trim();
    const found = target ? findUserByIdentifier(target) : undefined;

    const roleName = found?.role
      ? (found.department ? `${found.role} (${found.department})` : found.role)
      : (target ? `Finance (${target})` : "Finance & Accounting");

    const submitByName = (found?.name || target || "Finance Reviewer").toUpperCase();

    return {
      id,
      date: formatDateWIB(dateStr),
      rawTimestamp: new Date(dateStr || 0).getTime() || 0,
      roleName,
      submitBy: submitByName,
      approvalType: "Finance Review",
      action: isApproved ? "Approved" : isRevised ? "Revised" : isPending ? "Pending" : "Review",
      actionType: isApproved ? "approved" : isRevised ? "revised" : isPending ? "review" : "review",
      days: `${daysVal} Days`,
      description:
        notes ||
        (isApproved
          ? "Verifikasi anggaran dan evaluasi kelayakan usulan CAPEX disetujui untuk diteruskan ke Sidang Komite."
          : isRevised
          ? "Catatan revisi dari Finance telah dikirimkan ke pemohon untuk perbaikan."
          : "Review dokumen kelayakan dan evaluasi estimasi budget usulan sedang berlangsung."),
    };
  };

  // ── 4. Dedicated Handler: Gate 2 Investment Committee Approval ──
  const buildCommitteeApprovalStageLog = (
    explicitActor?: string,
    approvedByField?: string,
    dateStr?: string,
    notes?: string,
    isApproved: boolean = false,
    isRejected: boolean = false,
    isRevised: boolean = false,
    capexId?: string,
    daysVal: number = 1,
    id: number = 5
  ): ActivityLogItem => {
    const target = (explicitActor || approvedByField || "").trim();
    const found = target ? findUserByIdentifier(target) : undefined;

    const roleName = found?.role
      ? (found.department ? `${found.role} (${found.department})` : found.role)
      : (target ? `Komite (${target})` : "Komite Investasi");

    const submitByName = (found?.name || target || "Komite Investasi").toUpperCase();

    return {
      id,
      date: formatDateWIB(dateStr),
      rawTimestamp: new Date(dateStr || 0).getTime() || 0,
      roleName,
      submitBy: submitByName,
      approvalType: "Committee Approval",
      action: isApproved ? "Approved" : isRejected ? "Rejected" : isRevised ? "Revised" : "Review",
      actionType: isApproved ? "approved" : isRejected ? "rejected" : isRevised ? "revised" : "review",
      days: `${daysVal} Days`,
      description:
        notes ||
        (isApproved
          ? `Usulan resmi disetujui dalam Sidang Komite Investasi dan diterbitkan ID CAPEX: ${capexId || "Disetujui"}.`
          : isRejected
          ? "Usulan ditolak dalam Sidang Komite Investasi berdasarkan pertimbangan strategis."
          : isRevised
          ? "Catatan rekomendasi penyesuaian dari Komite Investasi telah diberikan (Kembali ke Draft)."
          : "Penjadwalan dan pelaksanaan Sidang Komite Investasi."),
    };
  };

  const raw = proposal?.rawProposal || {};

  // Build the complete chronological activity log
  const activityLogs: ActivityLogItem[] = useMemo(() => {
    if (!proposal) return [];

    const logs: ActivityLogItem[] = [];
    const dept = proposal.department || raw.department || "Departemen";
    const pic = proposal.pic || raw.pic || getCurrentUser()?.name || "Pemohon";
    const createdAt = proposal.createdAt || raw.createdAt || new Date().toISOString();
    const gs = (proposal.gateStatus || raw.gateStatus || "Idea").toLowerCase();

    const g0DaysVal = parseInt(proposal.g0Days) || 1;
    const g1DaysVal = parseInt(proposal.g1Days) || 1;
    const g2DaysVal = parseInt(proposal.g2Days) || 1;

    // 1. Initial Planning Submission via Dedicated Handler
    const initBenefit = raw.description || raw.benefit || (proposal as any)?.description || (proposal as any)?.benefit || "-";
    logs.push(buildPlanningStageLog(pic, dept, initBenefit, createdAt, g0DaysVal));

    // 2. Database History Logs (if stored in history array)
    const hasHistoryArray = Array.isArray(raw.history) && raw.history.length > 0;
    if (hasHistoryArray) {
      raw.history.forEach((h: any, idx: number) => {
        if (!h) return;
        const actLower = (h.action || "").toLowerCase();
        const actorLower = (h.actor || "").toLowerCase();
        const notesLower = (h.notes || "").toLowerCase();

        // Skip test verification entries
        if (actLower.startsWith("test") || notesLower.includes("entry ini harus tersimpan")) return;

        // Skip duplicate initial submit/draft entry if it matches initial creation
        const isInitialSubmit =
          idx === 0 &&
          (actLower.includes("submit") ||
            actLower.includes("draft") ||
            actLower.includes("diajukan") ||
            actLower.includes("create") ||
            h.gate === 0);

        if (isInitialSubmit) {
          if (logs.length > 0) {
            if (h.actor) {
              const foundActor = findUserByIdentifier(h.actor);
              logs[0].submitBy = (foundActor?.name || h.actor).toUpperCase();
              if (foundActor?.role) {
                logs[0].roleName = foundActor.department
                  ? `${foundActor.role} (${foundActor.department})`
                  : foundActor.role;
              }
            }
            if (h.notes && h.notes !== "-" && h.notes.trim()) {
              logs[0].description = h.notes;
            }
            if (h.timestamp) {
              logs[0].date = formatDateWIB(h.timestamp);
              logs[0].rawTimestamp = new Date(h.timestamp).getTime() || logs[0].rawTimestamp;
            }
          }
          return;
        }

        const isFin = actorLower.includes("finan") || actorLower.includes("account") || h.gate === 1;
        const isComm = actorLower.includes("komite") || actorLower.includes("committee") || actorLower.includes("division") || actorLower.includes("direksi") || h.gate === 2;
        const isUpload = actLower.includes("upload") || actLower.includes("unggah") || actLower.includes("dokumen");

        if (isUpload) {
          logs.push(buildDocumentUploadStageLog(h.actor, dept, h.notes, h.timestamp || createdAt, 100 + idx));
        } else if (isComm) {
          const isAppr = actLower.includes("approv") || actLower.includes("setuju");
          const isRej = actLower.includes("reject") || actLower.includes("tolak");
          const isRev = actLower.includes("revis") || actLower.includes("kembali");
          logs.push(buildCommitteeApprovalStageLog(h.actor, undefined, h.timestamp || createdAt, h.notes, isAppr, isRej, isRev, raw.capexId, g2DaysVal, 100 + idx));
        } else if (isFin) {
          const isAppr = actLower.includes("approv") || actLower.includes("setuju");
          const isRev = actLower.includes("revis") || actLower.includes("kembali");
          const isPend = actLower.includes("pending");
          logs.push(buildFinanceReviewStageLog(h.actor, undefined, h.timestamp || createdAt, h.notes, isAppr, isRev, isPend, g1DaysVal, 100 + idx));
        } else {
          logs.push(buildPlanningStageLog(h.actor, dept, h.notes, h.timestamp || createdAt, 1));
        }
      });
    } else {
      // 3. Fallback only for legacy proposals without history array
      const hasFinanceNotes = Boolean(raw.financeNotes);
      const hasFinanceStage =
        hasFinanceNotes ||
        Boolean(raw.financeApprovedAt) ||
        raw.revisionSource === "Finance" ||
        gs.includes("finance") ||
        gs.includes("accounting") ||
        gs.includes("committee") ||
        gs.includes("komite") ||
        gs.includes("sidang") ||
        gs.includes("approved") ||
        gs.includes("closed");

      if (hasFinanceStage) {
        const finDate = raw.financeApprovedAt || createdAt;
        const isFinPendingFeedback = gs.includes("pending");
        const isFinRevised = raw.revisionSource === "Finance" || gs.includes("revis");
        const isFinApproved = !isFinPendingFeedback && !isFinRevised;

        logs.push(
          buildFinanceReviewStageLog(
            raw.financeApprovedBy,
            raw.financeApprovedBy,
            finDate,
            raw.financeNotes,
            isFinApproved,
            isFinRevised,
            isFinPendingFeedback,
            g1DaysVal,
            3
          )
        );
      }

      // 4. Revised Document Upload (if uploaded separately in legacy mode)
      if (raw.revisedAttachmentName) {
        logs.push(
          buildDocumentUploadStageLog(
            pic,
            dept,
            raw.revisedAttachmentName,
            raw.financeApprovedAt || createdAt,
            4
          )
        );
      }

      // 5. Investment Committee Review Stage (only if actually reached committee stage in legacy mode)
      const hasCommitteeStage =
        Boolean(raw.committeeApprovedAt) ||
        (raw.revisionSource === "Committee" && Boolean(raw.committeeNotes)) ||
        gs.includes("committee") ||
        gs.includes("komite") ||
        gs.includes("sidang") ||
        gs.includes("reject") ||
        gs.includes("tolak") ||
        gs.includes("approved") ||
        gs.includes("closed") ||
        (Boolean(raw.capexId) && raw.capexId !== "-");

      if (hasCommitteeStage) {
        const commDate = raw.committeeApprovedAt || createdAt;
        const isCommRejected = gs.includes("reject") || gs.includes("tolak");
        const isCommRevised = raw.revisionSource === "Committee" || (!raw.committeeApprovedAt && Boolean(raw.committeeNotes) && !isCommRejected);
        const isCommApproved = !isCommRejected && !isCommRevised && (gs.includes("approved") || gs.includes("closed") || Boolean(raw.capexId && raw.capexId !== "-") || Boolean(raw.committeeApprovedAt));

        logs.push(
          buildCommitteeApprovalStageLog(
            raw.committeeApprovedBy,
            raw.committeeApprovedBy,
            commDate,
            raw.committeeNotes,
            isCommApproved,
            isCommRejected,
            isCommRevised,
            raw.capexId || proposal.capexId,
            g2DaysVal,
            5
          )
        );
      }
    }

    // Sort chronologically ascending by timestamp so activities appear in exact timeline order
    logs.sort((a, b) => {
      const timeA = a.rawTimestamp || 0;
      const timeB = b.rawTimestamp || 0;
      if (timeA !== timeB) return timeA - timeB;
      return (typeof a.id === "number" ? a.id : 0) - (typeof b.id === "number" ? b.id : 0);
    });

    // Recalculate step-by-step lead time (in days/hours) based on elapsed time from previous activity
    for (let i = 0; i < logs.length; i++) {
      logs[i].id = `act-${i + 1}-${logs[i].rawTimestamp || Date.now()}`;
      if (i === 0) {
        logs[i].days = "0 Day";
      } else {
        const prevTime = logs[i - 1].rawTimestamp || logs[0].rawTimestamp || 0;
        const curTime = logs[i].rawTimestamp || prevTime;
        const diffMs = Math.max(0, curTime - prevTime);
        const hours = diffMs / (1000 * 60 * 60);
        const days = hours / 24;

        if (hours === 0) {
          logs[i].days = "0 Day";
        } else if (days < 1) {
          logs[i].days = `${days.toFixed(1)} Day`;
        } else {
          logs[i].days = `${days.toFixed(1)} Days`;
        }
      }
    }

    return logs;
  }, [proposal, raw, usersList]);

  // Compute total accumulated lead time across all activities
  const totalLeadTimeDisplay = useMemo(() => {
    if (activityLogs.length === 0) return "0 Day";
    const firstTime = activityLogs[0]?.rawTimestamp || 0;
    const lastTime = activityLogs[activityLogs.length - 1]?.rawTimestamp || firstTime;
    const diffMs = Math.max(0, lastTime - firstTime);
    const hours = diffMs / (1000 * 60 * 60);
    const days = hours / 24;

    if (hours === 0) return "0 Day";
    if (days < 1) {
      const roundedHours = Math.max(1, Math.round(hours));
      return `${days.toFixed(1)} Day (~${roundedHours} Jam)`;
    }
    return `${days.toFixed(1)} Days`;
  }, [activityLogs]);

  const totalRecords = activityLogs.length;
  const totalPages = Math.ceil(totalRecords / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activityLogs.slice(start, start + itemsPerPage);
  }, [activityLogs, currentPage, itemsPerPage]);

  if (!isOpen || !proposal) return null;

  // Status mapping
  const rawStatus = proposal.gateStatus || raw.gateStatus || "Gate 0 - Idea";
  const displayTitle = proposal.capexId && proposal.capexId !== "-" ? proposal.capexId : proposal.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white border border-slate-200 w-full max-w-[95vw] 2xl:max-w-7xl rounded-2xl shadow-2xl overflow-hidden my-4 text-slate-800 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  HISTORY OF {displayTitle}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {rawStatus.includes("Approved") ? "Approved" : rawStatus.includes("Draft") ? "Draft" : "In Progress"}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                {proposal.department || "DEPT"}
                {proposal.capexId && proposal.capexId !== "-" && proposal.capexId !== proposal.name ? ` • ${proposal.name}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Top 4 Info Pill Cards - Separating PURPOSE and INVESTMENT TYPE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Box 1: Project Name */}
            <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">
                PROJECT NAME
              </span>
              <p className="font-medium text-slate-800 truncate" title={proposal.name}>
                {proposal.name}
              </p>
            </div>

            {/* Box 2: Purpose */}
            <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">
                PURPOSE
              </span>
              <p className="font-medium text-slate-700 truncate" title={proposal.purpose || "—"}>
                {proposal.purpose || "—"}
              </p>
            </div>

            {/* Box 3: Investment Type */}
            <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider block">
                INVESTMENT TYPE
              </span>
              <p className="font-medium text-slate-700 truncate" title={proposal.investmentType || "—"}>
                {proposal.investmentType || "—"}
              </p>
            </div>

            {/* Box 4: Current Step */}
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1">
              <span className="text-[9px] uppercase font-semibold text-blue-600 tracking-wider block">
                CURRENT STEP
              </span>
              <p className="font-medium text-blue-700 uppercase truncate">
                {proposal.g2Status === "Closed"
                  ? "Approved / Archived"
                  : proposal.g2Status === "In Progress"
                  ? "Sidang Komite Review"
                  : proposal.g1Status === "In Progress"
                  ? "Finance & Accounting Review"
                  : "Idea Planning"}
              </p>
            </div>
          </div>

          {/* Section Heading */}
          <div className="pt-2">
            <h4 className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider">
              CAPEX REVIEW ACTIVITY STAGES & LEAD TIME
            </h4>
          </div>

          {/* Detailed Activity Stages Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-2.5 w-10 text-center border-r border-slate-100">NO</th>
                    <th className="py-3 px-3 w-36 border-r border-slate-100 whitespace-nowrap">DATE</th>
                    <th className="py-3 px-3 w-44 border-r border-slate-100 whitespace-nowrap">ROLE NAME</th>
                    <th className="py-3 px-3 w-40 border-r border-slate-100 whitespace-nowrap">SUBMIT BY</th>
                    <th className="py-3 px-3 w-36 border-r border-slate-100 whitespace-nowrap">APPROVAL TYPE</th>
                    <th className="py-3 px-2.5 w-24 text-center border-r border-slate-100 whitespace-nowrap">ACTION</th>
                    <th className="py-3 px-2.5 w-20 text-center border-r border-slate-100 whitespace-nowrap">DAYS</th>
                    <th className="py-3 px-4 min-w-[200px]">BENEFIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-normal">
                  {paginatedLogs.map((log, index) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <tr key={`lead-act-${log.id || index}`} className="hover:bg-blue-50/20 transition-colors">
                        <td className="py-3 px-2.5 text-center text-slate-400 font-mono border-r border-slate-100">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600 border-r border-slate-100 whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="py-3 px-3 font-normal text-slate-700 border-r border-slate-100">
                          {log.roleName}
                        </td>
                        <td className="py-3 px-3 font-normal text-slate-700 border-r border-slate-100">
                          {log.submitBy}
                        </td>
                        <td className="py-3 px-3 text-slate-600 border-r border-slate-100 whitespace-nowrap font-normal">
                          {log.approvalType}
                        </td>
                        <td className="py-3 px-2.5 text-center border-r border-slate-100 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${
                              log.actionType === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                                : log.actionType === "rejected"
                                ? "bg-red-50 text-red-700 border border-red-300"
                                : log.actionType === "revised"
                                ? "bg-amber-50 text-amber-700 border border-amber-300"
                                : log.actionType === "upload"
                                ? "bg-slate-100 text-slate-700 border border-slate-300"
                                : "bg-blue-50 text-blue-700 border border-blue-300"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-2.5 text-center border-r border-slate-100 whitespace-nowrap font-mono text-[11px]">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-normal bg-slate-100 text-slate-600 border border-slate-200">
                            {typeof log.days === "number" ? `${log.days} Days` : log.days || "1 Day"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-normal leading-relaxed break-words">
                          {log.description}
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedLogs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 italic">
                        Belum ada riwayat aktivitas yang tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
                {activityLogs.length > 0 && (
                  <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 font-semibold text-slate-800 text-xs">
                    <tr>
                      <td colSpan={8} className="py-3.5 px-4 text-left">
                        <div className="flex items-center gap-2.5">
                          <span className="uppercase tracking-wider text-[11px] text-slate-500 font-bold">
                            TOTAL LEAD TIME:
                          </span>
                          <span className="text-xs font-bold text-slate-800 font-mono">
                            {totalLeadTimeDisplay}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
            <span>
              Page {currentPage} of {totalPages} &bull; Total: {totalRecords} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 font-semibold"
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      currentPage === pg
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 font-semibold"
                >
                  &gt;
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
