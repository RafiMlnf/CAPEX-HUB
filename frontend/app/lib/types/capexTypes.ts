export type FsCategory = string;
export type GateStatus = string;

export interface HistoryLog {
  gate: number;
  action: string;
  actor: string;
  timestamp: string;
  notes?: string;
}

export interface CapexProposal {
  id: string;
  capexId?: string;
  name: string;
  description: string;
  department: string;
  pic: string;
  estimatedCost: number;
  createdAt: string;
  gateStatus: GateStatus;
  isFsRequired?: boolean;
  fsCategory?: FsCategory;
  financeNotes?: string;
  financeApprovedAt?: string;
  committeeNotes?: string;
  committeeApprovedAt?: string;
  poNumber?: string;
  poDate?: string;
  commissioningDocName?: string;
  commissioningNotes?: string;
  commissioningApprovedAt?: string;
  benefitTarget?: number;
  benefitRealized?: number;
  benefitNotes?: string;
  pirNotes?: string;
  pirClosedAt?: string;
  history: HistoryLog[];
  purpose?: string;
  investmentType?: string;
  startDate?: string;
  endDate?: string;
  attachmentName?: string;
  initialAttachmentName?: string;
  revisedAttachmentName?: string;
  committeeReviewSchedule?: string;
  revisionSource?: "Finance" | "Committee";
}

export interface ApiCapexItem {
  id: string;
  name: string;
  department: string;
  tahun: string;
  budget: number;
  amount_bodr: number;
  available: number;
  capex_type: string;
  reference?: string;
  remark?: string;
  status: string;
  created_at: string;
}
