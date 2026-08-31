"use client";

import { CapexProposal, GateStatus } from "../../lib/api";

interface VisualStepperProps {
  proposal: CapexProposal;
}

export default function VisualStepper({ proposal }: VisualStepperProps) {
  const getGateNumber = (status: GateStatus) => {
    if (status === "Gate 0 - Idea") return 0;
    if (status === "Gate 1 - Finance Review") return 1;
    if (status === "Gate 2 - Committee Review" || status === "Gate 2 - Revised") return 2;
    if (status === "Gate 2 - Rejected") return 2;
    if (status === "Gate 3 - Procurement") return 3;
    if (status === "Gate 4 - Commissioning") return 4;
    if (status === "Gate 5 - Benefit Realization") return 5;
    if (status === "Gate 6 - Project Closing") return 6;
    return 7; // Closed
  };

  const currentGate = getGateNumber(proposal.gateStatus);
  const isRejected = proposal.gateStatus === "Gate 2 - Rejected";

  const getCleanGateLabel = (status: GateStatus) => {
    return (status || "")
      .replace("Gate 0 - Idea", "Tahap 1: Ide Awal / Draft")
      .replace("Gate 1 - Finance Review", "Tahap 2: Review Finance")
      .replace("Gate 2 - Committee Review", "Tahap 3: Sidang Komite")
      .replace("Gate 2 - Revised", "Revisi Komite")
      .replace("Gate 2 - Rejected", "Ditolak Komite")
      .replace("Gate 3 - Procurement", "Tahap 4: Proses Pengadaan")
      .replace("Gate 4 - Commissioning", "Tahap 5: Commissioning")
      .replace("Gate 5 - Benefit Realization", "Tahap 6: Benefit Realization")
      .replace("Gate 6 - Project Closing", "Tahap 7: Project Closing")
      .replace(/^Gate\s*\d+\s*[-–:]\s*/i, "")
      .replace("Closed", "Selesai (Closed)");
  };

  return (
    <div className="w-full py-1 flex flex-col gap-1.5 justify-center">
      <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider">
        <span className={isRejected ? "text-red-600" : "text-blue-600"}>
          {getCleanGateLabel(proposal.gateStatus)}
        </span>
        <span className="text-slate-400 font-mono font-medium">
          {isRejected ? "Rejected" : `${currentGate}/7 Selesai`}
        </span>
      </div>
      <div className="w-full bg-slate-150 rounded-full h-1.5 overflow-hidden border border-slate-200/30">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isRejected ? "bg-red-500" : "bg-blue-600"
          }`}
          style={{ width: `${(currentGate / 7) * 100}%` }}
        />
      </div>
    </div>
  );
}

