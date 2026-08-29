export interface ApprovalHistory {
  step_order?: number;        // untuk dynamic step resolution di modal (dari DB)
  approver_user_id?: number;  // untuk validasi akses approver per step (dari DB)
  initials: string;
  role: string;
  name: string;
  status: string;
  timestamp: string;
  note?: string;
}

export type BodrStep = string;

export type BodrCategory = "FOH" | "GOP" | "CAPEX" | string;

export interface BodrProposal {
  id: string;
  bodrNo: string;
  title: string;
  category: BodrCategory;
  department: string;
  amount: number;
  step: BodrStep;
  status: "Draft" | "Pending Review" | "Approved" | "Revision Required" | "Rejected" | string;
  date: string;
  notes: string;
  proposer: string;
  lastActor?: string;
  lastNote?: string;
  benefit: string;
  capexId: string;
  noAsset: string;
  costCenter: string;
  startDate: string;
  endDate: string;
  budgetType: "budget" | "unbudget";
  namaAsset: string;
  plan: string;
  location: string;
  assetType: string;
  approvalHistory: ApprovalHistory[];
  documents?: string[];
}

export interface ApiBodrProposal {
  id: string;
  bodr_no: string;
  title: string;
  category: string;
  department: string;
  amount: number;
  step: string;
  status: string;
  date: string;
  notes?: string;
  proposer: string;
  last_actor?: string;
  last_note?: string;
  benefit?: string;
  capex_id?: string;
  no_asset?: string;
  cost_center?: string;
  start_date?: string;
  end_date?: string;
  budget_type?: string;
  nama_asset?: string;
  plan?: string;
  location?: string;
  asset_type?: string;
  approval_history?: ApprovalHistory[];
  created_at: string;
  documents?: string[];
}

// ── BODR Progress API Response Types (from GET /bodr/progress) ────────────

export interface BodrProgressApprovalStep {
  step_order: number;
  role: string;
  name: string;
  initials: string;
  status: string;
  timestamp: string;
  note: string;
}

export interface BodrProgressWorkflowStep {
  step_order: number;
  role: string;
  user_name: string;
}

export interface BodrProgressProposalItem {
  id: string;
  bodr_no: string;
  title: string;
  category: string;
  department: string;
  proposer: string;
  amount: number;
  status: string;
  current_step: number;
  created_at: string;
  notes?: string;
  benefit?: string;
  approval_history: BodrProgressApprovalStep[];
  workflow_id: string | null;
  workflow_steps: BodrProgressWorkflowStep[];
}

export interface BodrProgressWorkflowSummary {
  departemen_id: string;
  departemen_nama: string;
  steps: BodrProgressWorkflowStep[];
}

export interface BodrProgressApiResponse {
  proposals: BodrProgressProposalItem[];
  workflows: BodrProgressWorkflowSummary[];
}
