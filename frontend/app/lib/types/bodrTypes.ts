export interface ApprovalHistory {
  initials: string;
  role: string;
  name: string;
  status: string;
  timestamp: string;
  note?: string;
}

export type BodrStep =
  | "Create"
  | "Approval Dept"
  | "Approve ACC"
  | "Approve Dept. ACC"
  | "Approve Div Plan"
  | "Approve Div Eng"
  | "Approve Div Admin"
  | "Approve Director"
  | "Approve Presdir"
  | string;

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
