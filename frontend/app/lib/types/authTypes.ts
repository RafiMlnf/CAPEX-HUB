export type UserRole =
  | "Proposer"
  | "Finance"
  | "Investment Committee"
  | "Procurement"
  | "Admin"
  | "Presdir"
  | "Direktur"
  | "Accounting"
  | "Purchasing"
  | "DIV ENG"
  | "DEPUTY PLAN";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole | string;
  department: string;
  wa_number?: string;
  waNumber?: string;
  password?: string;
  photoUrl?: string;
  photo_url?: string;
  npk?: string;
  status?: "active" | "inactive";
  allowed_portals?: string[];
  can_capex?: boolean;
  can_bodr?: boolean;
  can_price?: boolean;
  created_at?: string;
}

export interface ApiRole {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiPermission {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiRolePermission {
  id: string;
  role_id: string;
  kode_role: string;
  nama_role: string;
  permissions: string[];
  status: "active" | "inactive";
  created_at: string;
}

export interface ApiLoginLog {
  id: number | string;
  user_id?: number;
  npk?: string;
  nama_user?: string;
  username: string;
  departemen?: string;
  role?: string;
  ip_address?: string;
  user_agent?: string;
  status: "SUCCESS" | "FAILED" | string;
  keterangan?: string;
  is_archived?: boolean;
  login_time: string;
}

export interface ApiPortalAccess {
  user_id: number;
  npk: string;
  name: string;
  username: string;
  department: string;
  role: string;
  can_capex: boolean;
  can_bodr: boolean;
  can_price: boolean;
  allowed_portals: string[];
}
