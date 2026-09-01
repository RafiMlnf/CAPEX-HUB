import { User, CapexProposal } from "./types";

export interface BodrItem {
  id: number;
  nomor_bodr: string;
  deskripsi: string;
  departemen: string;
  capex_number: string;
  stage: string;
  status: string;
  created_at: string;
}

export interface OtorisasiHargaItem {
  id: number;
  nomor_dokumen?: string;
  nomor_otorisasi?: string;
  nomor_pr?: string;
  judul?: string;
  deskripsi?: string;
  tipe?: string;
  departemen?: string;
  vendor?: string;
  total_amount?: number;
  total_pengajuan?: number;
  stage?: string;
  status?: string;
  created_at?: string;
  [key: string]: any;
}

export interface DepartemenItem {
  id: number;
  kode_departemen: string;
  nama_departemen: string;
  deskripsi: string;
  status: string;
}

export interface RoleItem {
  id: number;
  kode_role: string;
  nama_role: string;
  deskripsi: string;
  status: string;
}

export interface PermissionItem {
  id: number;
  kode_permission: string;
  nama_permission: string;
  deskripsi: string;
  status: string;
}


const PREFIX = "mtm_capex_hub_";

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(PREFIX + key);
    if (!item) {
      localStorage.setItem(PREFIX + key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

// ── DEFAULT DATASETS ─────────────────────────────────────────────────────────

export const DEFAULT_USERS: User[] = [
  {
    id: 1,
    npk: "1001",
    name: "Administrator System",
    username: "admin",
    email: "admin@mtm.co.id",
    role: "Admin",
    department: "Management",
    department_id: 8,
    role_id: 1,
    status: "active",
    can_capex: true,
    can_bodr: true,
    can_price: true,
    can_admin: true,
    allowed_portals: ["capex", "bodr", "price", "admin"],
  },
  {
    id: 2,
    npk: "1002",
    name: "Budi Santoso",
    username: "budi.eng",
    email: "budi.santoso@mtm.co.id",
    role: "Department Head",
    department: "Engineering",
    department_id: 1,
    role_id: 7,
    status: "active",
    can_capex: true,
    can_bodr: true,
    can_price: false,
    can_admin: false,
    allowed_portals: ["capex", "bodr"],
  },
  {
    id: 3,
    npk: "1003",
    name: "Rina Purchasing",
    username: "rina.pur",
    email: "rina.purchasing@mtm.co.id",
    role: "Department Head",
    department: "Purchasing",
    department_id: 2,
    role_id: 7,
    status: "active",
    can_capex: false,
    can_bodr: true,
    can_price: true,
    can_admin: false,
    allowed_portals: ["bodr", "price"],
  },
  {
    id: 4,
    npk: "1004",
    name: "Joko Finance",
    username: "joko.fin",
    email: "joko.finance@mtm.co.id",
    role: "Staff",
    department: "Finance & Accounting",
    department_id: 3,
    role_id: 3,
    status: "active",
    can_capex: true,
    can_bodr: true,
    can_price: false,
    can_admin: false,
    allowed_portals: ["capex", "bodr"],
  },
  {
    id: 5,
    npk: "1005",
    name: "Siti Nurhaliza",
    username: "siti.mgr",
    email: "siti.nurhaliza@mtm.co.id",
    role: "Division Head",
    department: "Manufacturing",
    department_id: 4,
    role_id: 8,
    status: "active",
    can_capex: true,
    can_bodr: true,
    can_price: true,
    can_admin: false,
    allowed_portals: ["capex", "bodr", "price"],
  },
  {
    id: 6,
    npk: "1006",
    name: "Hendra Wijaya",
    username: "hendra.dir",
    email: "hendra.wijaya@mtm.co.id",
    role: "Director",
    department: "Management",
    department_id: 8,
    role_id: 9,
    status: "active",
    can_capex: true,
    can_bodr: true,
    can_price: true,
    can_admin: false,
    allowed_portals: ["capex", "bodr", "price"],
  },
];

export const DEFAULT_DEPARTMENTS: DepartemenItem[] = [
  { id: 1, kode_departemen: "ENG", nama_departemen: "Engineering", deskripsi: "Divisi Teknik & Perancangan", status: "active" },
  { id: 2, kode_departemen: "PUR", nama_departemen: "Purchasing", deskripsi: "Divisi Pengadaan & Vendor", status: "active" },
  { id: 3, kode_departemen: "FIN", nama_departemen: "Finance & Accounting", deskripsi: "Divisi Keuangan & Akuntansi", status: "active" },
  { id: 4, kode_departemen: "MFG", nama_departemen: "Manufacturing", deskripsi: "Divisi Pabrik & Produksi", status: "active" },
  { id: 5, kode_departemen: "HRGA", nama_departemen: "HR & GA", deskripsi: "Human Resources & General Affairs", status: "active" },
  { id: 6, kode_departemen: "MKT", nama_departemen: "Marketing", deskripsi: "Divisi Pemasaran & Penjualan", status: "active" },
  { id: 7, kode_departemen: "QAQC", nama_departemen: "QA & QC", deskripsi: "Quality Assurance & Control", status: "active" },
  { id: 8, kode_departemen: "MGMT", nama_departemen: "Management", deskripsi: "Direksi & Eksekutif", status: "active" },
];

export const DEFAULT_ROLES: RoleItem[] = [
  { id: 1, kode_role: "ADMIN", nama_role: "Admin", deskripsi: "Full System Administrator", status: "active" },
  { id: 2, kode_role: "OPERATOR", nama_role: "Operator", deskripsi: "Operator Lapangan", status: "active" },
  { id: 3, kode_role: "STAFF", nama_role: "Staff", deskripsi: "Staff Departemen", status: "active" },
  { id: 4, kode_role: "SUPERVISOR", nama_role: "Supervisor", deskripsi: "Supervisor Regu", status: "active" },
  { id: 5, kode_role: "SECTION_HEAD", nama_role: "Section Head", deskripsi: "Kepala Seksi", status: "active" },
  { id: 6, kode_role: "DEPT_HEAD", nama_role: "Department Head", deskripsi: "Kepala Departemen", status: "active" },
  { id: 7, kode_role: "DIV_HEAD", nama_role: "Division Head", deskripsi: "Kepala Divisi", status: "active" },
  { id: 8, kode_role: "DIRECTOR", nama_role: "Director", deskripsi: "Direktur Operasional/Finance", status: "active" },
  { id: 9, kode_role: "PRESDIR", nama_role: "President Director", deskripsi: "Presiden Direktur", status: "active" },
];

export const DEFAULT_PERMISSIONS: PermissionItem[] = [
  { id: 1, kode_permission: "perm_view_dashboard", nama_permission: "View Dashboard", deskripsi: "Melihat dashboard statistik", status: "active" },
  { id: 2, kode_permission: "perm_create_capex", nama_permission: "Create Capex Planning", deskripsi: "Membuat usulan belanja modal baru", status: "active" },
  { id: 3, kode_permission: "perm_review_capex", nama_permission: "Review Capex (Finance)", deskripsi: "Verifikasi kelayakan usulan oleh Finance", status: "active" },
  { id: 4, kode_permission: "perm_committee_review", nama_permission: "Committee Review", deskripsi: "Persetujuan sidang komite investasi", status: "active" },
  { id: 5, kode_permission: "perm_manage_users", nama_permission: "Manage Users", deskripsi: "Manajemen data pengguna", status: "active" },
  { id: 6, kode_permission: "perm_manage_config", nama_permission: "Manage Configuration", deskripsi: "Konfigurasi sistem dan master data", status: "active" },
  { id: 7, kode_permission: "perm_view_reports", nama_permission: "View Reports", deskripsi: "Melihat laporan eksekutif", status: "active" },
  { id: 8, kode_permission: "perm_create_bodr", nama_permission: "Create BODR", deskripsi: "Membuat registrasi aset BODR", status: "active" },
  { id: 9, kode_permission: "perm_approve_bodr", nama_permission: "Approve BODR", deskripsi: "Persetujuan berjenjang BODR", status: "active" },
  { id: 10, kode_permission: "perm_create_price", nama_permission: "Create Price Authorization", deskripsi: "Mengajukan otorisasi harga", status: "active" },
  { id: 11, kode_permission: "perm_approve_price", nama_permission: "Approve Price Authorization", deskripsi: "Menyetujui otorisasi harga", status: "active" },
  { id: 12, kode_permission: "perm_manage_master_price", nama_permission: "Manage Master Price", deskripsi: "Mengelola vendor dan part number", status: "active" },
  { id: 13, kode_permission: "perm_view_bodr_dashboard", nama_permission: "View BODR Dashboard", deskripsi: "Melihat dashboard BODR", status: "active" },
];

export const DEFAULT_PROPOSALS: CapexProposal[] = [
  {
    id: "CPX-2026-001",
    capexId: "CPX-2026-001",
    name: "Pembelian Mesin CNC High Precision 5-Axis",
    description: "Ekspansi kapasitas lini permesinan untuk produk transmisi baru.",
    department: "Engineering",
    pic: "Budi Santoso",
    estimatedCost: 2500000000,
    purpose: "Capacity",
    investmentType: "Capacity Up",
    startDate: "2026-03-01",
    endDate: "2026-08-30",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    gateStatus: "Gate 2 - Committee Review",
    committeeReviewSchedule: "2026-09-10T09:00",
    financeApprovedBy: "Joko Finance",
    financeApprovedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    financeNotes: "Studi kelayakan finansial ROI 2.8 tahun terverifikasi layak.",
    attachmentName: "FS_Mesin_CNC_5Axis.pdf, Penawaran_Vendor_CNC.pdf",
    history: [
      {
        gate: 0,
        action: "Usulan Dibuat (Gate 0)",
        actor: "Budi Santoso",
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        notes: "Pengajuan usulan inisiasi anggaran.",
      },
      {
        gate: 1,
        action: "Disetujui Finance (Gate 1)",
        actor: "Joko Finance",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        notes: "Dokumen FS dan kalkulasi NPV/IRR lengkap.",
      },
    ],
  },
  {
    id: "CPX-2026-002",
    capexId: "CPX-2026-002",
    name: "Upgrade Server Database & Cloud Disaster Recovery",
    description: "Peningkatan infrastruktur IT untuk keandalan operasional pabrik.",
    department: "Engineering",
    pic: "Budi Santoso",
    estimatedCost: 450000000,
    purpose: "Capability",
    investmentType: "Increase Competency",
    startDate: "2026-04-01",
    endDate: "2026-07-15",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    gateStatus: "Gate 1 - Finance Review",
    attachmentName: "Proposal_Server_Cloud_DR.pdf",
    history: [
      {
        gate: 0,
        action: "Usulan Dibuat (Gate 0)",
        actor: "Budi Santoso",
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        notes: "Inisiasi belanja modal IT.",
      },
    ],
  },
  {
    id: "CPX-2026-003",
    capexId: "CPX-2026-003",
    name: "Instalasi Rooftop Solar PV Line 3",
    description: "Pengurangan biaya listrik dan pemenuhan target dekarbonisasi.",
    department: "Manufacturing",
    pic: "Siti Nurhaliza",
    estimatedCost: 1200000000,
    purpose: "Capability",
    investmentType: "Increase Value Added",
    startDate: "2026-01-15",
    endDate: "2026-05-30",
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    gateStatus: "Approved",
    financeApprovedBy: "Joko Finance",
    financeApprovedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    committeeApprovedBy: "Hendra Wijaya",
    committeeApprovedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    poNumber: "PO-2026-0891",
    poDate: "2026-02-01",
    history: [
      {
        gate: 0,
        action: "Usulan Dibuat",
        actor: "Siti Nurhaliza",
        timestamp: new Date(Date.now() - 86400000 * 20).toISOString(),
      },
      {
        gate: 1,
        action: "Disetujui Finance",
        actor: "Joko Finance",
        timestamp: new Date(Date.now() - 86400000 * 15).toISOString(),
      },
      {
        gate: 2,
        action: "Disetujui Komite",
        actor: "Hendra Wijaya",
        timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
    ],
  },
  {
    id: "CPX-2026-004",
    capexId: "CPX-2026-004",
    name: "Pengadaan Alat Uji CMM Laboratorium QA",
    description: "Peralatan kalibrasi dan pengukuran presisi suku cadang.",
    department: "QA & QC",
    pic: "Dewi Quality",
    estimatedCost: 350000000,
    purpose: "Supporting",
    investmentType: "Supporting",
    startDate: "2026-05-01",
    endDate: "2026-07-31",
    createdAt: new Date().toISOString(),
    gateStatus: "Gate 0 - Idea",
    history: [
      {
        gate: 0,
        action: "Draft Usulan Dibuat",
        actor: "Dewi Quality",
        timestamp: new Date().toISOString(),
      },
    ],
  },
];

export const DEFAULT_BODR_ITEMS: BodrItem[] = [
  {
    id: 1,
    nomor_bodr: "BODR-2026-001",
    deskripsi: "Pengadaan Mesin Bubut CNC Mori Seiki",
    departemen: "Engineering",
    capex_number: "CPX-2026-001",
    stage: "Approval Dept Head",
    status: "In Progress",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 2,
    nomor_bodr: "BODR-2026-002",
    deskripsi: "Renovasi Ruang Server IT & Rack Battery",
    departemen: "Engineering",
    capex_number: "CPX-2026-002",
    stage: "Draft",
    status: "Draft",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export const DEFAULT_PRICE_ITEMS: OtorisasiHargaItem[] = [
  {
    id: 1,
    nomor_dokumen: "PO-PRC-2026-001",
    judul: "Pengadaan Sparepart Carbide Insert Sandvik",
    tipe: "Product",
    departemen: "Purchasing",
    vendor: "PT Astra Otoparts Tbk",
    total_nilai: 85000000,
    status: "Waiting Approval",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    nomor_dokumen: "PO-PRC-2026-002",
    judul: "Jasa Kalibrasi Peralatan CMM Mitutoyo",
    tipe: "Non-Product",
    departemen: "QA & QC",
    vendor: "PT Denso Indonesia",
    total_nilai: 24000000,
    status: "Approved",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

// ── STORAGE API CLIENT ───────────────────────────────────────────────────────

export const mockStorage = {
  // Users
  getUsers: (): User[] => getStorage("users", DEFAULT_USERS),
  saveUsers: (users: User[]) => setStorage("users", users),

  // Proposals
  getProposals: (): CapexProposal[] => getStorage("proposals", DEFAULT_PROPOSALS),
  saveProposals: (proposals: CapexProposal[]) => setStorage("proposals", proposals),

  // BODR
  getBodrItems: (): BodrItem[] => getStorage("bodr", DEFAULT_BODR_ITEMS),
  saveBodrItems: (items: BodrItem[]) => setStorage("bodr", items),

  // Price Authorization
  getPriceItems: (): OtorisasiHargaItem[] => getStorage("price", DEFAULT_PRICE_ITEMS),
  savePriceItems: (items: OtorisasiHargaItem[]) => setStorage("price", items),

  // Master Data
  getDepartments: (): DepartemenItem[] => getStorage("departments", DEFAULT_DEPARTMENTS),
  saveDepartments: (deps: DepartemenItem[]) => setStorage("departments", deps),

  getRoles: (): RoleItem[] => getStorage("roles", DEFAULT_ROLES),
  saveRoles: (roles: RoleItem[]) => setStorage("roles", roles),

  getPermissions: (): PermissionItem[] => getStorage("permissions", DEFAULT_PERMISSIONS),
  savePermissions: (perms: PermissionItem[]) => setStorage("permissions", perms),
};
