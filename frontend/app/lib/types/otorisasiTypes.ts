export interface ApprovalHistoryOH {
  role: string;
  name: string;
  status: "Approved" | "Rejected" | "Pending";
  timestamp: string;
  note?: string;
}

export interface ApiOtorisasiHarga {
  id: string;
  no_doc?: string;
  no_pr?: string;
  bodr_id?: number | string;
  bodr_no?: string;
  buyer_id?: number | string;
  buyer?: string;
  product: string;
  part_number?: string;
  vendor?: string;
  customer: string;
  normal_price: number;
  discount_pct: number;
  final_price?: number;
  dana_bodr?: number;
  jenis?: string;
  jenis_otorisasi_id?: number;
  jenis_otorisasi?: string;
  current_step?: number;
  step: string;
  status: string;
  tanggal?: string;
  date?: string;
  notes?: string;
  prepared_by?: string;
  last_approver?: string;
  last_note?: string;
  approved_by?: string[];
  approval_history?: ApprovalHistoryOH[];
  created_at: string;
  updated_at?: string;
}

export interface OtorisasiSupplierItem {
  part_number: string;
  part_name: string;
  qty: number;
  satuan: string;
  price_quot: number;
  target_price: number;
  final_price: number;
}

export interface OtorisasiSupplier {
  vendor_id: string;
  vendor_nama: string;
  items?: OtorisasiSupplierItem[];
  quality_factor?: string;
  delivery_factor?: string;
  safety_factor?: string;
  total_final_price?: number;
  is_cheapest?: boolean;
  harga?: number;
  jenis_otorisasi_id?: string;
  jenis_otorisasi_nama?: string;
  keterangan?: string;
  recommended?: boolean;
}

export interface ApiOtorisasiHargaNonProduct {
  id: string;
  no_doc: string;
  no_pr: string;
  no_bodr: string;
  dana_bodr: number;
  tanggal: string;
  bodr_id?: string;
  buyer_id: string;
  buyer_nama: string;
  suppliers: OtorisasiSupplier[];
  step: string;
  status: "Draft" | "Pending Review" | "Approved" | "Rejected";
  approval_history: ApprovalHistoryOH[];
  created_at: string;
}
