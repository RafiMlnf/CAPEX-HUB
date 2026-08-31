"use client";

import React, { useMemo, useState, useEffect } from "react";
import { CapexProposal, getUsers, getCurrentUser, User } from "../../lib/api";
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

interface PlanningLeadTimeSectionProps {
  proposal: CapexProposal;
}

function formatDateWIB(dateStr?: string): string {
  return formatDateDisplay(dateStr);
}

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

// 100% Accumulated Planning Lead Time (Doesn't reset on revision/reject)
function calculatePlanningLeadTime(proposal: any): string {
  const createdAt = proposal.createdAt ? new Date(proposal.createdAt).getTime() : Date.now();
  const history: any[] = Array.isArray(proposal.history) ? proposal.history : [];
  const gsLower = (proposal.gateStatus || (proposal as any).status || "").toLowerCase();
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
    totalMs += Math.max(0, Date.now() - createdAt);
  }

  // 2. Subsequent Revision intervals (from revision return until next resubmit)
  for (let i = 0; i < history.length; i++) {
    const h = history[i];
    const actionLower = (h.action || "").toLowerCase();
    const notesLower = (h.notes || "").toLowerCase();

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
          totalMs += Math.max(0, Date.now() - revStartTime);
        }
      }
    }
  }

  const days = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
  return days.toString();
}

export default function PlanningLeadTimeSection({ proposal }: PlanningLeadTimeSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [usersList, setUsersList] = useState<User[]>([]);
  const itemsPerPage = 4;

  useEffect(() => {
    getUsers()
      .then((data) => {
        if (Array.isArray(data)) setUsersList(data);
      })
      .catch((err) => console.error("Error fetching users for lead time:", err));
  }, []);

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

  // Compute Stage Status & Actual Days without Gate terminology
  const progressData = useMemo(() => {
    const gs = proposal.gateStatus || (proposal as any).status || "Idea";
    const createdAt = proposal.createdAt || new Date().toISOString();
    const gsLower = gs.toLowerCase();

    // Stage 1: Planning
    let g0Status = "Waiting";
    let g0Days = calculatePlanningLeadTime(proposal);
    if (gsLower.includes("idea") || gsLower.includes("draft")) {
      g0Status = "Open";
    } else {
      g0Status = "Closed";
    }

    // Stage 2: FinAcct Review
    let g1Status = "Waiting";
    let g1Days = "-";
    const g1Start =
      (Array.isArray(proposal.history) && proposal.history.find((h: any) => h.gate >= 1)?.timestamp) ||
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
      const g1End = proposal.financeApprovedAt || g1Start;
      g1Days = calculateDays(g1Start, g1End);
    }

    // Stage 3: Komite Review
    let g2Status = "Waiting";
    let g2Days = "-";
    const g2Start =
      proposal.financeApprovedAt ||
      (Array.isArray(proposal.history) && proposal.history.find((h: any) => h.gate === 2)?.timestamp) ||
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
      const g2End = proposal.committeeApprovedAt || g2Start;
      g2Days = calculateDays(g2Start, g2End);
    }

    return {
      g0Status,
      g0Days,
      g1Status,
      g1Days,
      g2Status,
      g2Days,
    };
  }, [proposal]);

  // Dedicated Handlers for Stage Logs
  const buildPlanningStageLog = (
    picIdentifier?: string,
    deptFallback?: string,
    benefitText?: string,
    dateStr?: string,
    daysVal: number = 1
  ): ActivityLogItem => {
    const resolvedIdentifier = (picIdentifier || "").trim() || proposal.pic || getCurrentUser()?.name || "Pemohon";
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
      approvalType: "Perencanaan Budget",
      action: "SUBMITTED",
      actionType: "default",
      days: `${daysVal} Days`,
      description: benefitText || "-",
    };
  };

  const buildDocumentUploadStageLog = (
    uploaderIdentifier?: string,
    deptFallback?: string,
    fileNames?: string,
    dateStr?: string,
    id: number = 4
  ): ActivityLogItem => {
    const resolvedIdentifier = (uploaderIdentifier || "").trim() || proposal.pic || getCurrentUser()?.name || "Pemohon";
    const found =
      findUserByIdentifier(resolvedIdentifier) ||
      (getCurrentUser()?.name?.toLowerCase() === resolvedIdentifier.toLowerCase() ? getCurrentUser() : undefined);

    const roleName = found?.role
      ? (found.department ? `${found.role} (${found.department})` : found.role)
      : (deptFallback ? `Proposer / Pemohon (${deptFallback})` : "Proposer / Pemohon");

    const proposalBenefit = proposal.description || proposal.purpose || "-";
    const submitByName = (found?.name || resolvedIdentifier || getCurrentUser()?.name || "Pemohon").toUpperCase();

    return {
      id,
      date: formatDateWIB(dateStr),
      rawTimestamp: new Date(dateStr || 0).getTime() || 0,
      roleName,
      submitBy: submitByName,
      approvalType: "Dokumen Pendukung",
      action: "UPLOAD",
      actionType: "upload",
      days: "1 Day",
      description: proposalBenefit,
    };
  };

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
      approvalType: "Review Finance",
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
      approvalType: "Sidang Komite",
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

  // Build the complete chronological activity log
  const activityLogs: ActivityLogItem[] = useMemo(() => {
    if (!proposal) return [];

    const logs: ActivityLogItem[] = [];
    const dept = proposal.department || "Departemen";
    const pic = proposal.pic || getCurrentUser()?.name || "Pemohon";
    const createdAt = proposal.createdAt || new Date().toISOString();
    const gs = (proposal.gateStatus || (proposal as any).status || "Idea").toLowerCase();

    const g0DaysVal = parseInt(progressData.g0Days) || 1;
    const g1DaysVal = parseInt(progressData.g1Days) || 1;
    const g2DaysVal = parseInt(progressData.g2Days) || 1;

    // 1. Initial Planning Submission
    const initBenefit = proposal.description || proposal.purpose || "-";
    logs.push(buildPlanningStageLog(pic, dept, initBenefit, createdAt, g0DaysVal));

    // 2. Database History Logs
    const hasHistoryArray = Array.isArray(proposal.history) && proposal.history.length > 0;
    if (hasHistoryArray) {
      proposal.history.forEach((h: any, idx: number) => {
        if (!h) return;
        const actLower = (h.action || "").toLowerCase();
        const actorLower = (h.actor || "").toLowerCase();
        const notesLower = (h.notes || "").toLowerCase();

        if (actLower.startsWith("test") || notesLower.includes("entry ini harus tersimpan")) return;

        // Skip duplicate initial submission entry
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
          logs.push(buildCommitteeApprovalStageLog(h.actor, undefined, h.timestamp || createdAt, h.notes, isAppr, isRej, isRev, proposal.capexId, g2DaysVal, 100 + idx));
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
      // 3. Fallback for legacy proposals
      const hasFinanceNotes = Boolean(proposal.financeNotes);
      const hasFinanceStage =
        hasFinanceNotes ||
        Boolean(proposal.financeApprovedAt) ||
        (proposal as any).revisionSource === "Finance" ||
        gs.includes("finance") ||
        gs.includes("accounting") ||
        gs.includes("committee") ||
        gs.includes("komite") ||
        gs.includes("sidang") ||
        gs.includes("approved") ||
        gs.includes("closed");

      if (hasFinanceStage) {
        const finDate = proposal.financeApprovedAt || createdAt;
        const isFinPendingFeedback = gs.includes("pending");
        const isFinRevised = (proposal as any).revisionSource === "Finance" || gs.includes("revis");
        const isFinApproved = !isFinPendingFeedback && !isFinRevised;

        logs.push(
          buildFinanceReviewStageLog(
            proposal.financeApprovedBy,
            proposal.financeApprovedBy,
            finDate,
            proposal.financeNotes,
            isFinApproved,
            isFinRevised,
            isFinPendingFeedback,
            g1DaysVal,
            3
          )
        );
      }

      if (proposal.revisedAttachmentName) {
        logs.push(
          buildDocumentUploadStageLog(
            pic,
            dept,
            proposal.revisedAttachmentName,
            proposal.financeApprovedAt || createdAt,
            4
          )
        );
      }

      const hasCommitteeStage =
        Boolean(proposal.committeeApprovedAt) ||
        ((proposal as any).revisionSource === "Committee" && Boolean(proposal.committeeNotes)) ||
        gs.includes("committee") ||
        gs.includes("komite") ||
        gs.includes("sidang") ||
        gs.includes("reject") ||
        gs.includes("tolak") ||
        gs.includes("approved") ||
        gs.includes("closed") ||
        (Boolean(proposal.capexId) && proposal.capexId !== "-");

      if (hasCommitteeStage) {
        const commDate = proposal.committeeApprovedAt || createdAt;
        const isCommRejected = gs.includes("reject") || gs.includes("tolak");
        const isCommRevised = (proposal as any).revisionSource === "Committee" || (!proposal.committeeApprovedAt && Boolean(proposal.committeeNotes) && !isCommRejected);
        const isCommApproved = !isCommRejected && !isCommRevised && (gs.includes("approved") || gs.includes("closed") || Boolean(proposal.capexId && proposal.capexId !== "-") || Boolean(proposal.committeeApprovedAt));

        logs.push(
          buildCommitteeApprovalStageLog(
            proposal.committeeApprovedBy,
            proposal.committeeApprovedBy,
            commDate,
            proposal.committeeNotes,
            isCommApproved,
            isCommRejected,
            isCommRevised,
            proposal.capexId,
            g2DaysVal,
            5
          )
        );
      }
    }

    // Sort chronologically ascending
    logs.sort((a, b) => {
      const timeA = a.rawTimestamp || 0;
      const timeB = b.rawTimestamp || 0;
      if (timeA !== timeB) return timeA - timeB;
      return (typeof a.id === "number" ? a.id : 0) - (typeof b.id === "number" ? b.id : 0);
    });

    // Recalculate step-by-step lead time (in days/hours) based on elapsed time from previous activity
    for (let i = 0; i < logs.length; i++) {
      logs[i].id = `lead-act-${i + 1}-${logs[i].rawTimestamp || Date.now()}`;
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
  }, [proposal, progressData, usersList]);

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

  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-2xs h-full flex flex-col justify-between">
      <div className="space-y-3.5">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Progress & Lead Time Activity
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">
                Alur tahapan review & akumulasi durasi proses usulan
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono shadow-2xs">
            ⚡ Total: {totalLeadTimeDisplay}
          </span>
        </div>

        {/* 3-Stage Progress Stepper Bar (Clean, No "Gate") */}
        <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs text-center">
          {/* Stage 1: Planning */}
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                ✓
              </div>
            </div>
            <p className="text-[9.5px] font-bold text-emerald-700">Perencanaan</p>
            <p className="text-[8.5px] text-slate-500 truncate font-medium">Budget Planning</p>
          </div>

          {/* Stage 2: Finance Review */}
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                  progressData.g1Status === "Closed"
                    ? "bg-emerald-500 text-white"
                    : progressData.g1Status === "In Progress" || progressData.g1Status === "Semi Close"
                    ? "bg-blue-600 text-white animate-pulse"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {progressData.g1Status === "Closed" ? "✓" : "2"}
              </div>
            </div>
            <p
              className={`text-[9.5px] font-bold ${
                progressData.g1Status === "Closed"
                  ? "text-emerald-700"
                  : progressData.g1Status === "In Progress" || progressData.g1Status === "Semi Close"
                  ? "text-blue-700"
                  : "text-slate-500"
              }`}
            >
              Review Finance
            </p>
            <p className="text-[8.5px] text-slate-500 truncate font-medium">FinAcct Evaluation</p>
          </div>

          {/* Stage 3: Committee Review */}
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                  progressData.g2Status === "Closed"
                    ? "bg-emerald-500 text-white"
                    : progressData.g2Status === "In Progress"
                    ? "bg-purple-600 text-white animate-pulse"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {progressData.g2Status === "Closed" ? "✓" : "3"}
              </div>
            </div>
            <p
              className={`text-[9.5px] font-bold ${
                progressData.g2Status === "Closed"
                  ? "text-emerald-700"
                  : progressData.g2Status === "In Progress"
                  ? "text-purple-700"
                  : "text-slate-500"
              }`}
            >
              Sidang Komite
            </p>
            <p className="text-[8.5px] text-slate-500 truncate font-medium">Approval Komite</p>
          </div>
        </div>

        {/* Modern Vertical Timeline Feed (Spacious, Clean, No Cramped Tables) */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {paginatedLogs.map((log, index) => {
            const isAppr = log.actionType === "approved";
            const isRej = log.actionType === "rejected";
            const isRev = log.actionType === "revised";
            const isUp = log.actionType === "upload";

            return (
              <div
                key={log.id}
                className="relative bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-3 shadow-2xs space-y-2 transition-all group"
              >
                {/* Timeline Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">
                        📅 {log.date}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] font-bold text-slate-700">
                        {log.approvalType}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Action Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        isAppr
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                          : isRej
                          ? "bg-red-50 text-red-700 border border-red-300"
                          : isRev
                          ? "bg-amber-50 text-amber-700 border border-amber-300"
                          : isUp
                          ? "bg-slate-100 text-slate-700 border border-slate-300"
                          : "bg-blue-50 text-blue-700 border border-blue-300"
                      }`}
                    >
                      {log.action}
                    </span>

                    {/* Duration Lead Time Chip */}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9.5px] font-semibold">
                      ⏱ {typeof log.days === "number" ? `${log.days} Days` : log.days || "1 Day"}
                    </span>
                  </div>
                </div>

                {/* Timeline Card Actor & Role */}
                <div className="flex items-center justify-between text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[9px] uppercase shrink-0">
                      {log.submitBy.charAt(0) || "U"}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">
                        {log.submitBy}
                      </span>
                      <span className="text-[9.5px] text-slate-500 block leading-tight">
                        {log.roleName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline Card Note/Benefit */}
                {log.description && log.description !== "-" && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] text-slate-700 leading-relaxed font-normal">
                    <p className="italic">&quot;{log.description}&quot;</p>
                  </div>
                )}
              </div>
            );
          })}

          {paginatedLogs.length === 0 && (
            <div className="text-center py-8 text-slate-400 italic text-xs bg-white rounded-xl border border-slate-200">
              Belum ada riwayat aktivitas yang tercatat.
            </div>
          )}
        </div>
      </div>

      {/* Footer & Pagination */}
      <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-500">
        <span>
          Halaman {currentPage} dari {totalPages} &bull; Total: {totalRecords} aktivitas
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded font-semibold text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`px-2 py-0.5 rounded font-semibold text-xs cursor-pointer transition-all ${
                  currentPage === pg
                    ? "bg-blue-600 text-white shadow-2xs"
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
              className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded font-semibold text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
