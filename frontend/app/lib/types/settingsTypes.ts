export interface ApprovalWorkflowStep {
  user_id: string;
  user_name: string;
  role: string;
  order: number;
}

export interface ApiApprovalWorkflow {
  id: string;
  departemen_id: string;
  departemen_nama: string;
  type_approval_id: string;
  type_approval_nama: string;
  list_approval: ApprovalWorkflowStep[];
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiApprovalPriceWorkflow {
  id: string;
  departemen_id: string;
  departemen_nama: string;
  type_approval_id: string;
  type_approval_nama: string;
  list_approval: ApprovalWorkflowStep[];
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiDeptSettings {
  id: string;
  departemen_id: string;
  departemen_nama: string;
  keterangan: string;
  head_dept_id: string;
  head_dept_nama: string;
  accounting_id: string;
  accounting_nama: string;
  created_at: string;
}
