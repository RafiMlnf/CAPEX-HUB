-- ============================================================================
-- PORTAL TERPADU CAPEX, BODR & OTORISASI HARGA
-- ALL-IN-ONE COMPLETE DATABASE INITIALIZATION SCRIPT (PostgreSQL / pgAdmin)
-- ============================================================================
-- Seluruh tabel, skema, relasi, master data, hak akses portal, dan user akun
-- digabungkan menjadi 1 file SQL utuh yang siap dieksekusi di database "bodr_db".
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 2. SCHEMAS
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS bodr;
CREATE SCHEMA IF NOT EXISTS purchasing;

-- ----------------------------------------------------------------------------
-- 3. TRIGGER FUNCTION: Updated At Auto-Update
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION core.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 4. CORE SCHEMA - MASTER DATA TABLES
-- ----------------------------------------------------------------------------

-- Departemens
CREATE TABLE IF NOT EXISTS core.departemens (
    id               SERIAL PRIMARY KEY,
    kode_departemen  VARCHAR(20) NOT NULL UNIQUE,
    nama_departemen  VARCHAR(150) NOT NULL,
    deskripsi        TEXT,
    status           VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles
CREATE TABLE IF NOT EXISTS core.roles (
    id          SERIAL PRIMARY KEY,
    kode_role   VARCHAR(20) NOT NULL UNIQUE,
    nama_role   VARCHAR(100) NOT NULL,
    deskripsi   TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permissions
CREATE TABLE IF NOT EXISTS core.permissions (
    id               SERIAL PRIMARY KEY,
    kode_permission  VARCHAR(30) NOT NULL UNIQUE,
    nama_permission  VARCHAR(150) NOT NULL,
    deskripsi        TEXT,
    status           VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Type Approval
CREATE TABLE IF NOT EXISTS core.type_approval (
    id             SERIAL PRIMARY KEY,
    kode_approval  VARCHAR(20) NOT NULL UNIQUE,
    nama_approval  VARCHAR(100) NOT NULL,
    deskripsi      TEXT,
    status         VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS core.users (
    id             SERIAL PRIMARY KEY,
    npk            VARCHAR(30) NOT NULL UNIQUE,
    nama_user      VARCHAR(150) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    username       VARCHAR(50) NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    departemen_id  INTEGER NOT NULL REFERENCES core.departemens(id),
    role_id        INTEGER NOT NULL REFERENCES core.roles(id),
    status         VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Portal Access (Hak Akses per Modul)
CREATE TABLE IF NOT EXISTS core.user_portal_access (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    can_capex  BOOLEAN NOT NULL DEFAULT true,
    can_bodr   BOOLEAN NOT NULL DEFAULT true,
    can_price  BOOLEAN NOT NULL DEFAULT true,
    can_admin  BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_portal_access_user_id UNIQUE (user_id)
);

-- Login Audit Logs
CREATE TABLE IF NOT EXISTS core.login_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES core.users(id),
    npk         VARCHAR(30),
    nama_user   VARCHAR(150),
    username    VARCHAR(50) NOT NULL,
    departemen  VARCHAR(150),
    role        VARCHAR(100),
    ip_address  VARCHAR(50),
    user_agent  TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    keterangan  TEXT,
    login_time  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cost Center
CREATE TABLE IF NOT EXISTS core.cost_center (
    id                SERIAL PRIMARY KEY,
    kode_cost_center  VARCHAR(20) NOT NULL UNIQUE,
    nama_cost_center  VARCHAR(150) NOT NULL,
    deskripsi         TEXT,
    status            VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Capex Type
CREATE TABLE IF NOT EXISTS core.capex_type (
    id          SERIAL PRIMARY KEY,
    kode_type   VARCHAR(20) NOT NULL UNIQUE,
    nama_type   VARCHAR(150) NOT NULL,
    deskripsi   TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Capex Reference
CREATE TABLE IF NOT EXISTS core.capex_reference (
    id              SERIAL PRIMARY KEY,
    kode_reference  VARCHAR(20) NOT NULL UNIQUE,
    nama            VARCHAR(150) NOT NULL,
    deskripsi       TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asset Type
CREATE TABLE IF NOT EXISTS core.asset_type (
    id          SERIAL PRIMARY KEY,
    class       VARCHAR(50) NOT NULL,
    nama_type   VARCHAR(150) NOT NULL,
    deskripsi   TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Capex Master & Projects
CREATE TABLE IF NOT EXISTS core.capex (
    id                         SERIAL PRIMARY KEY,
    kode_capex                 VARCHAR(30) NOT NULL UNIQUE,
    nama_capex                 VARCHAR(150) NOT NULL,
    capex_type_id              INTEGER REFERENCES core.capex_type(id),
    capex_reference_id         INTEGER REFERENCES core.capex_reference(id),
    departemen_id              INTEGER REFERENCES core.departemens(id),
    total_amount               NUMERIC(18,2) NOT NULL DEFAULT 0,
    allocated_amount           NUMERIC(18,2) NOT NULL DEFAULT 0,
    status                     VARCHAR(50) NOT NULL DEFAULT 'Gate 0 - Idea',
    description                TEXT,
    pic                        VARCHAR(100),
    purpose                    TEXT,
    investment_type            VARCHAR(100),
    start_date                 VARCHAR(50),
    end_date                   VARCHAR(50),
    attachment_name            TEXT,
    initial_attachment_name    TEXT,
    revised_attachment_name    TEXT,
    revised_attachment_history TEXT,
    is_fs_required             BOOLEAN NOT NULL DEFAULT false,
    fs_category                VARCHAR(50),
    finance_notes              TEXT,
    finance_approved_at        TIMESTAMPTZ,
    committee_notes            TEXT,
    committee_approved_at      TIMESTAMPTZ,
    committee_review_schedule  VARCHAR(50),
    po_number                  VARCHAR(100),
    po_date                    VARCHAR(50),
    commissioning_doc_name     TEXT,
    commissioning_notes        TEXT,
    commissioning_approved_at  TIMESTAMPTZ,
    benefit_target             NUMERIC(18,2),
    benefit_realized           NUMERIC(18,2),
    benefit_notes              TEXT,
    pir_notes                  TEXT,
    pir_closed_at              TIMESTAMPTZ,
    revision_source            VARCHAR(50),
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Capex History (Append-only)
CREATE TABLE IF NOT EXISTS core.capex_history (
    id         SERIAL PRIMARY KEY,
    capex_id   INTEGER NOT NULL REFERENCES core.capex(id) ON DELETE CASCADE,
    gate       INTEGER NOT NULL DEFAULT 0,
    action     VARCHAR(255) NOT NULL DEFAULT '',
    actor      VARCHAR(150) NOT NULL DEFAULT '',
    timestamp  TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. WORKFLOW SCHEMA - SETTINGS & APPROVAL RULES
-- ----------------------------------------------------------------------------

-- Role Permissions Mapping
CREATE TABLE IF NOT EXISTS workflow.role_permissions (
    id             SERIAL PRIMARY KEY,
    role_id        INTEGER NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
    permission_id  INTEGER NOT NULL REFERENCES core.permissions(id) ON DELETE CASCADE,
    status         VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (role_id, permission_id)
);

-- Approval Workflow (BODR)
CREATE TABLE IF NOT EXISTS workflow.approval_workflow (
    id               SERIAL PRIMARY KEY,
    departemen_id    INTEGER NOT NULL REFERENCES core.departemens(id),
    type_approval_id INTEGER NOT NULL REFERENCES core.type_approval(id),
    status           VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (departemen_id, type_approval_id)
);

-- Approval Workflow Steps (BODR)
CREATE TABLE IF NOT EXISTS workflow.approval_workflow_steps (
    id               SERIAL PRIMARY KEY,
    workflow_id      INTEGER NOT NULL REFERENCES workflow.approval_workflow(id) ON DELETE CASCADE,
    step_order       INTEGER NOT NULL,
    approver_user_id INTEGER NOT NULL REFERENCES core.users(id),
    keterangan       VARCHAR(150),
    UNIQUE (workflow_id, step_order)
);

-- Approval Price Workflow
CREATE TABLE IF NOT EXISTS workflow.approval_price_workflow (
    id               SERIAL PRIMARY KEY,
    departemen_id    INTEGER NOT NULL REFERENCES core.departemens(id),
    type_approval_id INTEGER NOT NULL REFERENCES core.type_approval(id),
    status           VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (departemen_id, type_approval_id)
);

-- Approval Price Workflow Steps
CREATE TABLE IF NOT EXISTS workflow.approval_price_workflow_steps (
    id               SERIAL PRIMARY KEY,
    workflow_id      INTEGER NOT NULL REFERENCES workflow.approval_price_workflow(id) ON DELETE CASCADE,
    step_order       INTEGER NOT NULL,
    approver_user_id INTEGER NOT NULL REFERENCES core.users(id),
    keterangan       VARCHAR(150),
    UNIQUE (workflow_id, step_order)
);

-- Department Settings (Head Dept & Accounting default per Departemen)
CREATE TABLE IF NOT EXISTS workflow.department_settings (
    id                 SERIAL PRIMARY KEY,
    departemen_id      INTEGER NOT NULL UNIQUE REFERENCES core.departemens(id),
    keterangan         TEXT,
    head_dept_user_id  INTEGER REFERENCES core.users(id),
    accounting_user_id INTEGER REFERENCES core.users(id),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. BODR SCHEMA - DISBURSEMENT & APPROVAL
-- ----------------------------------------------------------------------------

-- BODR Header
CREATE TABLE IF NOT EXISTS bodr.bodr (
    id                 SERIAL PRIMARY KEY,
    bodr_no            VARCHAR(40) NOT NULL UNIQUE,
    bodr_id_final      VARCHAR(40) UNIQUE,
    title              VARCHAR(200) NOT NULL,
    user_id            INTEGER NOT NULL REFERENCES core.users(id),
    departemen_id      INTEGER NOT NULL REFERENCES core.departemens(id),
    cost_center_id     INTEGER NOT NULL REFERENCES core.cost_center(id),
    kriteria_approval  VARCHAR(20) NOT NULL,
    start_date         DATE NOT NULL,
    end_date           DATE NOT NULL,
    benefit            TEXT,
    capex_id           INTEGER NOT NULL REFERENCES core.capex(id),
    amount             NUMERIC(18,2) NOT NULL,
    category           VARCHAR(20) NOT NULL DEFAULT 'budget',
    budget_remarks     TEXT,
    status             VARCHAR(30) NOT NULL DEFAULT 'draft',
    current_step       INTEGER NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BODR Asset Detail
CREATE TABLE IF NOT EXISTS bodr.bodr_asset (
    id            SERIAL PRIMARY KEY,
    bodr_id       INTEGER NOT NULL UNIQUE REFERENCES bodr.bodr(id) ON DELETE CASCADE,
    nama_asset    VARCHAR(200) NOT NULL,
    plant         VARCHAR(10) NOT NULL DEFAULT '2301',
    location      VARCHAR(20) NOT NULL DEFAULT 'office',
    asset_type_id INTEGER REFERENCES core.asset_type(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BODR Documents
CREATE TABLE IF NOT EXISTS bodr.bodr_document (
    id          SERIAL PRIMARY KEY,
    bodr_id     INTEGER NOT NULL REFERENCES bodr.bodr(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_path   TEXT NOT NULL,
    file_type   VARCHAR(10) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BODR Approval Steps
CREATE TABLE IF NOT EXISTS bodr.bodr_approval (
    id               SERIAL PRIMARY KEY,
    bodr_id          INTEGER NOT NULL REFERENCES bodr.bodr(id) ON DELETE CASCADE,
    step_order       INTEGER NOT NULL,
    approver_user_id INTEGER NOT NULL REFERENCES core.users(id),
    status           VARCHAR(20) NOT NULL DEFAULT 'pending',
    comment          TEXT,
    action_date      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (bodr_id, step_order)
);

-- BODR History Logs (Append-only)
CREATE TABLE IF NOT EXISTS bodr.bodr_history (
    id            SERIAL PRIMARY KEY,
    bodr_id       INTEGER NOT NULL REFERENCES bodr.bodr(id) ON DELETE CASCADE,
    action        VARCHAR(100) NOT NULL,
    actor         VARCHAR(150) NOT NULL,
    actor_role    VARCHAR(100),
    status_before VARCHAR(30),
    status_after  VARCHAR(30),
    comment       TEXT,
    timestamp     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BODR Otorisasi Harga Request
CREATE TABLE IF NOT EXISTS bodr.otorisasi_harga_request (
    id          SERIAL PRIMARY KEY,
    bodr_id     INTEGER NOT NULL REFERENCES bodr.bodr(id),
    no_pr       VARCHAR(50) NOT NULL,
    deskripsi   TEXT,
    amount      NUMERIC(18,2) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'submitted',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 7. PURCHASING SCHEMA - OTORISASI HARGA
-- ----------------------------------------------------------------------------

-- Master Vendor
CREATE TABLE IF NOT EXISTS purchasing.vendor (
    id           SERIAL PRIMARY KEY,
    kode_vendor  VARCHAR(50) NOT NULL UNIQUE,
    email_vendor VARCHAR(150),
    vendor_name  VARCHAR(250) NOT NULL,
    street       TEXT,
    status       VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Part Number
CREATE TABLE IF NOT EXISTS purchasing.part_number (
    id                 SERIAL PRIMARY KEY,
    part_number        VARCHAR(100),
    part_name          VARCHAR(200),
    name_material      VARCHAR(200),
    deskripsi          TEXT,
    deskripsi_material TEXT,
    satuan             VARCHAR(20),
    status             VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Jenis Otorisasi (Source)
CREATE TABLE IF NOT EXISTS purchasing.jenis_otorisasi (
    id          SERIAL PRIMARY KEY,
    kode        VARCHAR(20) NOT NULL UNIQUE,
    nama        VARCHAR(150) NOT NULL,
    deskripsi   TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Jenis Barang
CREATE TABLE IF NOT EXISTS purchasing.jenis_barang (
    id                SERIAL PRIMARY KEY,
    kode              VARCHAR(50),
    kode_jenis        VARCHAR(20),
    nama              VARCHAR(150),
    nama_jenis_barang VARCHAR(150),
    deskripsi         TEXT,
    status            VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Otorisasi Harga Header
CREATE TABLE IF NOT EXISTS purchasing.otorisasi_harga (
    id                 SERIAL PRIMARY KEY,
    no_doc             VARCHAR(50) NOT NULL UNIQUE,
    jenis              VARCHAR(20) NOT NULL DEFAULT 'non_product',
    no_pr              VARCHAR(50),
    bodr_id            INTEGER REFERENCES bodr.bodr(id),
    dana_bodr          NUMERIC(18,2),
    tanggal            DATE NOT NULL DEFAULT current_date,
    buyer_user_id      INTEGER NOT NULL REFERENCES core.users(id),
    jenis_otorisasi_id INTEGER REFERENCES purchasing.jenis_otorisasi(id),
    status             VARCHAR(30) NOT NULL DEFAULT 'Pending Review',
    current_step       INTEGER NOT NULL DEFAULT 1,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Otorisasi Harga Supplier Detail
CREATE TABLE IF NOT EXISTS purchasing.otorisasi_harga_supplier (
    id                 SERIAL PRIMARY KEY,
    otorisasi_harga_id INTEGER NOT NULL REFERENCES purchasing.otorisasi_harga(id) ON DELETE CASCADE,
    vendor_id          INTEGER NOT NULL REFERENCES purchasing.vendor(id),
    quality_factor     VARCHAR(50),
    delivery_factor    VARCHAR(50),
    safety_factor      VARCHAR(50) NOT NULL DEFAULT 'OK',
    is_lowest_price    BOOLEAN NOT NULL DEFAULT false,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Otorisasi Harga Item Detail
CREATE TABLE IF NOT EXISTS purchasing.otorisasi_harga_item (
    id           SERIAL PRIMARY KEY,
    supplier_id  INTEGER NOT NULL REFERENCES purchasing.otorisasi_harga_supplier(id) ON DELETE CASCADE,
    part_number  VARCHAR(100) NOT NULL,
    part_name    VARCHAR(200) NOT NULL,
    qty          NUMERIC(18,2) NOT NULL DEFAULT 1,
    satuan       VARCHAR(20) NOT NULL DEFAULT 'pcs',
    price_quote  NUMERIC(18,2) NOT NULL DEFAULT 0,
    target_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    final_price  NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approval Harga Steps
CREATE TABLE IF NOT EXISTS purchasing.approval_harga (
    id                  SERIAL PRIMARY KEY,
    otorisasi_harga_id  INTEGER NOT NULL REFERENCES purchasing.otorisasi_harga(id) ON DELETE CASCADE,
    step_order          INTEGER NOT NULL,
    approver_user_id    INTEGER NOT NULL REFERENCES core.users(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    comment             TEXT,
    action_date         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (otorisasi_harga_id, step_order)
);

-- Otorisasi Harga History Logs (Append-only)
CREATE TABLE IF NOT EXISTS purchasing.otorisasi_harga_history (
    id                 SERIAL PRIMARY KEY,
    otorisasi_harga_id INTEGER NOT NULL REFERENCES purchasing.otorisasi_harga(id) ON DELETE CASCADE,
    action             VARCHAR(100) NOT NULL,
    actor              VARCHAR(150) NOT NULL,
    actor_role         VARCHAR(100),
    status_before      VARCHAR(30),
    status_after       VARCHAR(30),
    comment            TEXT,
    timestamp          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. INDEXES UNTUK PERFORMA QUERY CEPAT
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_npk ON core.users(npk);
CREATE INDEX IF NOT EXISTS idx_users_username ON core.users(username);
CREATE INDEX IF NOT EXISTS idx_users_dept ON core.users(departemen_id);
CREATE INDEX IF NOT EXISTS idx_capex_dept ON core.capex(departemen_id);
CREATE INDEX IF NOT EXISTS idx_capex_history_capex ON core.capex_history(capex_id);
CREATE INDEX IF NOT EXISTS idx_bodr_user ON bodr.bodr(user_id);
CREATE INDEX IF NOT EXISTS idx_bodr_dept ON bodr.bodr(departemen_id);
CREATE INDEX IF NOT EXISTS idx_bodr_history_bodr ON bodr.bodr_history(bodr_id);
CREATE INDEX IF NOT EXISTS idx_oh_no_doc ON purchasing.otorisasi_harga(no_doc);
CREATE INDEX IF NOT EXISTS idx_oh_history_oh ON purchasing.otorisasi_harga_history(otorisasi_harga_id);

-- ============================================================================
-- 9. MASTER DATA SEEDS & INITIAL VALUES
-- ============================================================================

-- 9.1 Master Departemens
INSERT INTO core.departemens (id, kode_departemen, nama_departemen, deskripsi, status) VALUES
(1, 'IT', 'Information Technology', 'Pengelolaan sistem, server & infrastruktur IT', 'active'),
(2, 'FIN', 'Finance & Accounting', 'Pengelolaan anggaran, verifikasi & pencairan dana', 'active'),
(3, 'PUR', 'Purchasing', 'Pengadaan barang/jasa, negosiasi harga & vendor', 'active'),
(4, 'ENG', 'Engineering', 'Rekayasa teknologi, modifikasi & fasilitas mesin', 'active'),
(5, 'OMD', 'Operation Management', 'Manajemen operasional pabrik & utilitas', 'active'),
(6, 'PROD', 'Production', 'Pelaksanaan proses manufaktur pabrik', 'active'),
(7, 'QA', 'Quality Assurance', 'Pengendalian mutu & standar produk', 'active'),
(8, 'HRGA', 'Human Resources & GA', 'Personalia, fasilitas umum & K3L', 'active')
ON CONFLICT (id) DO UPDATE SET 
    nama_departemen = EXCLUDED.nama_departemen,
    kode_departemen = EXCLUDED.kode_departemen;

-- 9.2 Master Roles
INSERT INTO core.roles (id, kode_role, nama_role, deskripsi, status) VALUES
(1, 'Admin', 'Administrator', 'Akses penuh konfigurasi master data & sistem', 'active'),
(2, 'Proposer', 'Proposer / Pemohon', 'Pengaju draft proposal BODR, CAPEX & Form OH', 'active'),
(3, 'Head Dept', 'Head of Department', 'Penyetuju tahap pertama tingkat departemen', 'active'),
(4, 'Accounting', 'Accounting Officer', 'Verifikasi pos akun anggaran & pembukuan', 'active'),
(5, 'Finance', 'Finance Reviewer', 'Review kelayakan finansial & pencairan dana', 'active'),
(6, 'Komite CAPEX', 'Investment Committee', 'Sidang penilai investasi modal belanja CAPEX', 'active'),
(7, 'Purchasing', 'Purchasing Buyer', 'Otorisasi harga rekanan & negosiasi vendor', 'active'),
(8, 'DIV ENG', 'Division Head Engineering', 'Otorisasi teknis rekayasa fasilitas mesin', 'active'),
(9, 'DEPUTY PLAN', 'Deputy Plant Manager', 'Perencanaan utilisasi fasilitas & kapasitas plant', 'active'),
(10, 'DIR', 'Director', 'Direktur operasional penyetuju final', 'active'),
(11, 'PRESDIR', 'President Director', 'Presiden Direktur pengambil keputusan tertinggi', 'active')
ON CONFLICT (id) DO UPDATE SET 
    nama_role = EXCLUDED.nama_role,
    kode_role = EXCLUDED.kode_role;

-- 9.3 Master Permissions
INSERT INTO core.permissions (id, kode_permission, nama_permission, deskripsi, status) VALUES
(1, 'perm_create_capex', 'Buat Usulan CAPEX', 'Membuat draft usulan CAPEX Gate 0', 'active'),
(2, 'perm_review_capex', 'Review Feasibility CAPEX', 'Review kelayakan finansial Gate 1', 'active'),
(3, 'perm_committee_review', 'Sidang Komite CAPEX', 'Otorisasi komite investasi Gate 2', 'active'),
(4, 'perm_closing_capex', 'Closing & Evaluasi CAPEX', 'Evaluasi manfaat & PIR Gate 3 - 6', 'active'),
(5, 'perm_create_bodr', 'Buat Pengajuan BODR', 'Membuat draft pengajuan pencairan BODR', 'active'),
(6, 'perm_approve_bodr', 'Approve Alur BODR', 'Menyetujui / menolak langkah alur BODR', 'active'),
(7, 'perm_create_price', 'Buat Otorisasi Harga', 'Membuat dokumen penetapan harga vendor', 'active'),
(8, 'perm_approve_price', 'Approve Otorisasi Harga', 'Menyetujui jenjang otorisasi harga', 'active'),
(9, 'perm_sync_bodr', 'Sinkronisasi BODR', 'Memicu sinkronisasi data antar modul', 'active'),
(10, 'perm_view_dashboard', 'Monitor Dashboard & KPI', 'Melihat grafik, metrik & status gate', 'active'),
(11, 'perm_view_reports', 'Unduh Laporan & Audit', 'Mengunduh laporan excel & riwayat log', 'active'),
(12, 'perm_manage_users', 'Kelola Pengguna', 'Kelola akun user & hak akses portal', 'active'),
(13, 'perm_manage_config', 'Konfigurasi Master & Alur', 'Konfigurasi workflow, master & sistem', 'active')
ON CONFLICT (id) DO UPDATE SET 
    nama_permission = EXCLUDED.nama_permission,
    kode_permission = EXCLUDED.kode_permission;

-- 9.4 Master Type Approval
INSERT INTO core.type_approval (id, kode_approval, nama_approval, deskripsi, status) VALUES
(1, 'CAP', 'Capex Investment', 'Alur usulan belanja modal mesin & infrastruktur baru', 'active'),
(2, 'FOH', 'Factory Overhead', 'Pengeluaran biaya operasional rutin manufaktur pabrik', 'active'),
(3, 'GOP', 'General Operational Expense', 'Pengeluaran operasional umum kantor non-manufaktur', 'active'),
(4, 'PRICE_PROD', 'Otorisasi Harga Product', 'Otorisasi harga komponen baku produk manufaktur', 'active'),
(5, 'PRICE_NONPROD', 'Otorisasi Harga Non-Product', 'Otorisasi harga alat kerja, tools & spare parts', 'active')
ON CONFLICT (id) DO UPDATE SET 
    nama_approval = EXCLUDED.nama_approval,
    kode_approval = EXCLUDED.kode_approval;

-- 9.5 Master Users (Password default untuk semua akun: admin)
-- Hash bcrypt $2b$10$7Z2v1w21P4R7kHkU9H2t/O9y8B/sZ/w8kZ/sZ1f67f3l5e1k5eDu = 'admin'
INSERT INTO core.users (id, npk, nama_user, email, username, password_hash, departemen_id, role_id, status) VALUES
(1, 'ADM001', 'Administrator Sistem', 'admin@mtm.co.id', 'admin', '$2b$10$o1v9Y1rFkU/YvHsmO1NfZ.yS3eN7PGB/O4r5T3W6aR.rL1g8ZkWq6', 1, 1, 'active'),
(2, 'ENG010', 'Budi Santoso', 'budi.eng@mtm.co.id', 'budi.eng', '$2b$10$o1v9Y1rFkU/YvHsmO1NfZ.yS3eN7PGB/O4r5T3W6aR.rL1g8ZkWq6', 4, 2, 'active'),
(3, 'ENG001', 'Ir. Hendra Gunawan', 'hendra.hdept@mtm.co.id', 'hendra.hdept', '$2b$10$o1v9Y1rFkU/YvHsmO1NfZ.yS3eN7PGB/O4r5T3W6aR.rL1g8ZkWq6', 4, 3, 'active'),
(4, 'ACC005', 'Siti Rahmawati', 'siti.acc@mtm.co.id', 'siti.acc', '$2b$10$o1v9Y1rFkU/YvHsmO1NfZ.yS3eN7PGB/O4r5T3W6aR.rL1g8ZkWq6', 2, 4, 'active'),
(5, 'FIN002', 'Agus Pratama', 'agus.fin@mtm.co.id', 'agus.fin', '$2b$10$o1v9Y1rFkU/YvHsmO1NfZ.yS3eN7PGB/O4r5T3W6aR.rL1g8ZkWq6', 2, 5, 'active'),
(6, 'KOM001', 'Tim Komite Investasi', 'komite.capex@mtm.co.id', 'komite.capex', '$2b$10$o1v9Y1rFkU/YvHsmO1NfZ.yS3eN7PGB/O4r5T3W6aR.rL1g8ZkWq6', 2, 6, 'active'),
(7, 'PUR003', 'Rina Wijaya', 'rina.pur@mtm.co.id', 'rina.pur', '$2b$10$o1v9Y1rFkU/YvHsmO1NfZ.yS3eN7PGB/O4r5T3W6aR.rL1g8ZkWq6', 3, 7, 'active'),
(8, 'PUR001', 'Doni Kusuma', 'doni.hdept@mtm.co.id', 'doni.hdept', '$2b$10$o1v9Y1rFkU/YvHsmO1NfZ.yS3eN7PGB/O4r5T3W6aR.rL1g8ZkWq6', 3, 3, 'active'),
(9, 'DIV001', 'Bambang Subroto', 'bambang.div@mtm.co.id', 'bambang.div', '$2b$10$o1v9Y1rFkU/YvHsmO1NfZ.yS3eN7PGB/O4r5T3W6aR.rL1g8ZkWq6', 4, 8, 'active'),
(10, 'DPL001', 'Dr. Ir. Taufik Hidayat', 'taufik.dplan@mtm.co.id', 'taufik.dplan', '$2b$10$o1v9Y1rFkU/YvHsmO1NfZ.yS3eN7PGB/O4r5T3W6aR.rL1g8ZkWq6', 5, 9, 'active'),
(11, 'DIR001', 'Kusuma Wardhana, MBA', 'kusuma.dir@mtm.co.id', 'kusuma.dir', '$2b$10$o1v9Y1rFkU/YvHsmO1NfZ.yS3eN7PGB/O4r5T3W6aR.rL1g8ZkWq6', 5, 10, 'active'),
(12, 'DIR002', 'Ir. Djoko Siswanto', 'djoko.presdir@mtm.co.id', 'djoko.presdir', '$2b$10$o1v9Y1rFkU/YvHsmO1NfZ.yS3eN7PGB/O4r5T3W6aR.rL1g8ZkWq6', 5, 11, 'active')
ON CONFLICT (id) DO UPDATE SET 
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash;

-- Update password admin agar selalu valid
UPDATE core.users 
SET password_hash = crypt('admin', gen_salt('bf', 10)) 
WHERE username IN ('admin', 'budi.eng', 'hendra.hdept', 'siti.acc', 'agus.fin', 'komite.capex', 'rina.pur', 'doni.hdept', 'bambang.div', 'taufik.dplan', 'kusuma.dir', 'djoko.presdir');

-- 9.6 User Portal Access Initialization
INSERT INTO core.user_portal_access (user_id, can_capex, can_bodr, can_price, can_admin)
SELECT id, true, true, true, (role_id = 1)
FROM core.users
ON CONFLICT (user_id) DO UPDATE SET
    can_capex = EXCLUDED.can_capex,
    can_bodr = EXCLUDED.can_bodr,
    can_price = EXCLUDED.can_price,
    can_admin = EXCLUDED.can_admin;

-- 9.7 Master Cost Center
INSERT INTO core.cost_center (id, kode_cost_center, nama_cost_center, deskripsi, status) VALUES
(1, 'CC-IT-01', 'Cost Center IT Infrastructure', 'Biaya server, jaringan & lisensi', 'active'),
(2, 'CC-ENG-01', 'Cost Center Engineering Tooling', 'Biaya mesin, cetakan & peralatan teknis', 'active'),
(3, 'CC-PROD-01', 'Cost Center Lini Produksi A', 'Biaya lini permesinan & casting', 'active'),
(4, 'CC-FIN-01', 'Cost Center Finance & Treasury', 'Biaya operasional akuntansi & audit', 'active'),
(5, 'CC-PUR-01', 'Cost Center Purchasing & Vendor', 'Biaya logistik & pengadaan', 'active')
ON CONFLICT (id) DO NOTHING;

-- 9.8 Master Capex Type & Reference
INSERT INTO core.capex_type (id, kode_type, nama_type, deskripsi, status) VALUES
(1, 'CT-01', 'New Capacity Expansion', 'Penambahan mesin dan lini kapasitas baru', 'active'),
(2, 'CT-02', 'Replacement & Modernization', 'Peremajaan mesin usang dan rekondisi', 'active'),
(3, 'CT-03', 'Efficiency & Automation', 'Otomasi lini perakitan & reduksi manpower', 'active'),
(4, 'CT-04', 'Quality & Safety Upgrade', 'Peningkatan standar mutu & sistem K3L', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO core.capex_reference (id, kode_reference, nama, deskripsi, status) VALUES
(1, 'CR-01', 'Strategic Business Plan 2026', 'Rencana kerja strategis anggaran tahun 2026', 'active'),
(2, 'CR-02', 'Customer New Model OEM', 'Proyek part komponen pesanan OEM baru', 'active'),
(3, 'CR-03', 'Green Factory Initiative', 'Program reduksi emisi karbon pabrik', 'active')
ON CONFLICT (id) DO NOTHING;

-- 9.9 Master Asset Type
INSERT INTO core.asset_type (id, class, nama_type, deskripsi, status) VALUES
(1, 'Class 1', 'Mesin Produksi & CNC', 'Peralatan mesin utama pemrosesan logam', 'active'),
(2, 'Class 2', 'Dies, Mold & Jigs', 'Cetakan stamping dan alat bantu presisi', 'active'),
(3, 'Class 3', 'Kendaraan Operasional & Forklift', 'Sarana transportasi material logistik', 'active'),
(4, 'Class 4', 'Komputer, Server & Jaringan', 'Perangkat keras pengolah data', 'active')
ON CONFLICT (id) DO NOTHING;

-- 9.10 Master Vendors
INSERT INTO purchasing.vendor (id, kode_vendor, vendor_name, email_vendor, street, status) VALUES
(1, 'VND-001', 'PT Surya Baja Mandiri', 'sales@suryabaja.co.id', 'Kawasan Industri GIIC Cikarang', 'active'),
(2, 'VND-002', 'PT Precision Tooling Nusantara', 'info@precisiontools.com', 'Kawasan Industri MM2100 Cibitung', 'active'),
(3, 'VND-003', 'PT Mega Cipta Tehnik', 'contact@megatehnik.co.id', 'Jl. Industri Raya Blok B-4 Karawang', 'active'),
(4, 'VND-004', 'PT Astra Komponen Logam', 'marketing@astrakomponen.co.id', 'Kawasan Industri Mitra Karawang', 'active')
ON CONFLICT (id) DO UPDATE SET
    vendor_name = EXCLUDED.vendor_name,
    email_vendor = EXCLUDED.email_vendor,
    street = EXCLUDED.street;

-- 9.11 Master Part Numbers
INSERT INTO purchasing.part_number (id, part_number, part_name, name_material, deskripsi, deskripsi_material, satuan, status) VALUES
(1, 'PN-ST-001', 'Steel Rod Hardened 25mm', 'Steel Rod Hardened 25mm', 'Bahan baku poros as presisi', 'Bahan baku poros as presisi', 'kg', 'active'),
(2, 'PN-ST-002', 'Alloy Casting Ingot AC4B', 'Alloy Casting Ingot AC4B', 'Bahan baku peleburan casting mesin', 'Bahan baku peleburan casting mesin', 'kg', 'active'),
(3, 'PN-TL-001', 'Carbide Endmill 4 Flute D12', 'Carbide Endmill 4 Flute D12', 'Mata pisau potong mesin CNC milling', 'Mata pisau potong mesin CNC milling', 'pcs', 'active'),
(4, 'PN-TL-002', 'Insert Turning WNMG080408', 'Insert Turning WNMG080408', 'Mata bubut tahan gesekan tinggi', 'Mata bubut tahan gesekan tinggi', 'pcs', 'active')
ON CONFLICT (id) DO NOTHING;

-- 9.12 Master Jenis Barang
INSERT INTO purchasing.jenis_barang (id, kode, kode_jenis, nama, nama_jenis_barang, deskripsi, status) VALUES
(1, 'JB-RAW', 'JB-RAW', 'Raw Material Logam', 'Raw Material Logam', 'Bahan baku utama produksi logam', 'active'),
(2, 'JB-TOOL', 'JB-TOOL', 'Cutting Tools & Consumable', 'Cutting Tools & Consumable', 'Peralatan aus pemotongan mesin', 'active'),
(3, 'JB-SPARE', 'JB-SPARE', 'Spare Part Mesin', 'Spare Part Mesin', 'Suku cadang perbaikan mesin pabrik', 'active')
ON CONFLICT (id) DO NOTHING;

-- 9.13 Department Settings Default
INSERT INTO workflow.department_settings (departemen_id, keterangan, head_dept_user_id, accounting_user_id) VALUES
(4, 'Departemen Engineering Plant', 3, 4),
(3, 'Departemen Purchasing Procurement', 8, 4),
(1, 'Departemen IT Information Technology', 1, 4),
(2, 'Departemen Finance & Accounting', 5, 4)
ON CONFLICT (departemen_id) DO UPDATE SET
    head_dept_user_id = EXCLUDED.head_dept_user_id,
    accounting_user_id = EXCLUDED.accounting_user_id;

-- 9.14 Approval Workflow Defaults (BODR)
INSERT INTO workflow.approval_workflow (id, departemen_id, type_approval_id, status) VALUES
(1, 4, 1, 'active'),
(2, 4, 2, 'active'),
(3, 3, 1, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workflow.approval_workflow_steps (workflow_id, step_order, approver_user_id, keterangan) VALUES
(1, 1, 3, 'Persetujuan Head Dept Engineering'),
(1, 2, 4, 'Verifikasi Pos Anggaran Accounting'),
(1, 3, 9, 'Persetujuan Div Head Engineering'),
(1, 4, 10, 'Persetujuan Deputy Plant Manager'),
(1, 5, 11, 'Persetujuan Direktur Operasional')
ON CONFLICT (workflow_id, step_order) DO NOTHING;

-- 9.15 Approval Price Workflow Defaults
INSERT INTO workflow.approval_price_workflow (id, departemen_id, type_approval_id, status) VALUES
(1, 3, 4, 'active'),
(2, 3, 5, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workflow.approval_price_workflow_steps (workflow_id, step_order, approver_user_id, keterangan) VALUES
(1, 1, 8, 'Persetujuan Head Dept Purchasing'),
(1, 2, 5, 'Review Anggaran & Finansial Finance'),
(1, 3, 11, 'Otorisasi Final Direktur')
ON CONFLICT (workflow_id, step_order) DO NOTHING;

-- 9.16 Sample Data CAPEX (Gate 0 s/d Gate 3)
INSERT INTO core.capex (
    id, kode_capex, nama_capex, capex_type_id, capex_reference_id, departemen_id,
    total_amount, allocated_amount, status, description, pic, purpose, investment_type,
    start_date, end_date, is_fs_required, fs_category
) VALUES
(1, 'CPX-2026-001', 'Line Automation CNC Stamping Plant 2', 3, 1, 4, 2500000000.00, 1850000000.00, 'Gate 2 - In Review', 'Otomasi lini stamping robotik untuk efisiensi siklus produksi', 'Budi Santoso', 'Meningkatkan output 25% dan efisiensi manpower', 'Direct Investment', '2026-01-10', '2026-11-30', true, 'Category A (>1M)'),
(2, 'CPX-2026-002', 'Pengadaan Mesin CMM 3D Scanning Presisi', 4, 2, 4, 850000000.00, 850000000.00, 'Gate 3 - Approved', 'Mesin inspeksi akurasi mutu dimensi produk OEM', 'Ir. Hendra Gunawan', 'Menjamin zero defect part presisi customer', 'Replacement', '2026-02-01', '2026-08-15', true, 'Category B (500jt - 1M)')
ON CONFLICT (id) DO NOTHING;

-- 9.17 Reset Sequences ke Max ID
SELECT setval('core.departemens_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.departemens));
SELECT setval('core.roles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.roles));
SELECT setval('core.permissions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.permissions));
SELECT setval('core.type_approval_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.type_approval));
SELECT setval('core.users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.users));
SELECT setval('core.user_portal_access_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.user_portal_access));
SELECT setval('core.cost_center_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.cost_center));
SELECT setval('core.capex_type_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.capex_type));
SELECT setval('core.capex_reference_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.capex_reference));
SELECT setval('core.asset_type_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.asset_type));
SELECT setval('core.capex_id_seq', (SELECT COALESCE(MAX(id), 1) FROM core.capex));
SELECT setval('purchasing.vendor_id_seq', (SELECT COALESCE(MAX(id), 1) FROM purchasing.vendor));
SELECT setval('purchasing.part_number_id_seq', (SELECT COALESCE(MAX(id), 1) FROM purchasing.part_number));
SELECT setval('purchasing.jenis_barang_id_seq', (SELECT COALESCE(MAX(id), 1) FROM purchasing.jenis_barang));
SELECT setval('workflow.approval_workflow_id_seq', (SELECT COALESCE(MAX(id), 1) FROM workflow.approval_workflow));
SELECT setval('workflow.approval_price_workflow_id_seq', (SELECT COALESCE(MAX(id), 1) FROM workflow.approval_price_workflow));

-- ============================================================================
-- DATABASE INITIALIZATION COMPLETED SUCCESSFULLY!
-- ============================================================================
