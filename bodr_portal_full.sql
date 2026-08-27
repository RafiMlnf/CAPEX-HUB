-- ============================================================================
-- BODR PORTAL - FULL DATABASE SCHEMA (PostgreSQL / pgAdmin)
-- ============================================================================
-- Cakupan:
--   1. Portal Admin  -> pengajuan & approval BODR
--   2. Portal Approval Harga -> khusus departemen Purchasing
--
-- CATATAN PENTING SEBELUM EKSEKUSI DI PGADMIN:
--   - Query "CREATE DATABASE" TIDAK BOLEH dijalankan dalam transaction block,
--     jadi jalankan blok CREATE DATABASE di bawah ini SENDIRIAN (Execute Query,
--     bukan di dalam satu script besar), baru setelah itu connect ke database
--     "bodr_db" dan jalankan sisa script ini.
-- ============================================================================

-- STEP 1: Jalankan baris ini sendiri, di context database manapun (mis. postgres)
-- CREATE DATABASE bodr_db;

-- STEP 2: Setelah connect ke bodr_db, lanjutkan menjalankan sisa script di bawah ini.

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- untuk hashing password (crypt/gen_salt)

-- ============================================================================
-- SCHEMAS
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS core;        -- master data global: user, role, dept, dll
CREATE SCHEMA IF NOT EXISTS workflow;    -- konfigurasi approval workflow
CREATE SCHEMA IF NOT EXISTS bodr;        -- modul pengajuan & approval BODR
CREATE SCHEMA IF NOT EXISTS purchasing;  -- modul portal approval harga (purchasing)

-- ============================================================================
-- ENUM TYPES
-- ============================================================================
CREATE TYPE core.status_type AS ENUM ('active', 'inactive');

CREATE TYPE bodr.kriteria_approval_type AS ENUM ('CAP', 'FOH', 'GOP');
CREATE TYPE bodr.category_type AS ENUM ('budget', 'unbudget');
CREATE TYPE bodr.location_type AS ENUM ('office', 'plant');
CREATE TYPE bodr.bodr_status_type AS ENUM ('draft', 'in_approval', 'approved', 'rejected');
CREATE TYPE bodr.approval_action_type AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE purchasing.otorisasi_jenis_type AS ENUM ('non_product', 'product');
CREATE TYPE purchasing.satuan_qty_type AS ENUM ('pcs', 'kg');

-- ============================================================================
-- GENERIC TRIGGER FUNCTION: auto-update kolom updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION core.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CORE SCHEMA - MASTER DATA (Portal Admin > Master Data)
-- ============================================================================

-- Master Data: Departemens
CREATE TABLE core.departemens (
    id               SERIAL PRIMARY KEY,
    kode_departemen  VARCHAR(20) NOT NULL UNIQUE,
    nama_departemen  VARCHAR(150) NOT NULL,
    deskripsi        TEXT,
    status           core.status_type NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Data: Roles
CREATE TABLE core.roles (
    id          SERIAL PRIMARY KEY,
    kode_role   VARCHAR(20) NOT NULL UNIQUE,
    nama_role   VARCHAR(100) NOT NULL,
    deskripsi   TEXT,
    status      core.status_type NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Data: Permission
CREATE TABLE core.permissions (
    id               SERIAL PRIMARY KEY,
    kode_permission  VARCHAR(30) NOT NULL UNIQUE,
    nama_permission  VARCHAR(150) NOT NULL,
    deskripsi        TEXT,
    status           core.status_type NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Data: Type Approval (juga berfungsi sbg "Kriteria Approval" pada form Create BODR
-- untuk konfigurasi workflow; nilai CAP/FOH/GOP di BODR sendiri disimpan sbg enum tersendiri
-- karena punya business rule spesifik -> lihat bodr.bodr.kriteria_approval)
CREATE TABLE core.type_approval (
    id             SERIAL PRIMARY KEY,
    kode_approval  VARCHAR(20) NOT NULL UNIQUE,
    nama_approval  VARCHAR(100) NOT NULL,
    deskripsi      TEXT,
    status         core.status_type NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Data: User
CREATE TABLE core.users (
    id             SERIAL PRIMARY KEY,
    npk            VARCHAR(30) NOT NULL UNIQUE,
    nama_user      VARCHAR(150) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    username       VARCHAR(50) NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    departemen_id  INTEGER NOT NULL REFERENCES core.departemens(id),
    role_id        INTEGER NOT NULL REFERENCES core.roles(id),
    status         core.status_type NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Data: Cost Center (modul BODR)
CREATE TABLE core.cost_center (
    id                SERIAL PRIMARY KEY,
    kode_cost_center  VARCHAR(20) NOT NULL UNIQUE,
    nama_cost_center  VARCHAR(150) NOT NULL,
    deskripsi         TEXT,
    status            core.status_type NOT NULL DEFAULT 'active',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Data: Capex Type
CREATE TABLE core.capex_type (
    id          SERIAL PRIMARY KEY,
    kode_type   VARCHAR(20) NOT NULL UNIQUE,
    nama_type   VARCHAR(150) NOT NULL,
    deskripsi   TEXT,
    status      core.status_type NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Data: Capex Reference
CREATE TABLE core.capex_reference (
    id             SERIAL PRIMARY KEY,
    kode_reference VARCHAR(20) NOT NULL UNIQUE,
    nama           VARCHAR(150) NOT NULL,
    deskripsi      TEXT,
    status         core.status_type NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Data: Asset Type
CREATE TABLE core.asset_type (
    id          SERIAL PRIMARY KEY,
    class       VARCHAR(50) NOT NULL,
    nama_type   VARCHAR(150) NOT NULL,
    deskripsi   TEXT,
    status      core.status_type NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Data: Capex (dipakai di dropdown "ID Capex" pada Create BODR;
-- amount_available dihitung otomatis = total_amount - allocated_amount)
CREATE TABLE core.capex (
    id                  SERIAL PRIMARY KEY,
    kode_capex          VARCHAR(30) NOT NULL UNIQUE,
    nama_capex          VARCHAR(150) NOT NULL,
    capex_type_id       INTEGER REFERENCES core.capex_type(id),
    capex_reference_id  INTEGER REFERENCES core.capex_reference(id),
    departemen_id       INTEGER REFERENCES core.departemens(id),
    total_amount        NUMERIC(18,2) NOT NULL DEFAULT 0,
    allocated_amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
    amount_available    NUMERIC(18,2) GENERATED ALWAYS AS (total_amount - allocated_amount) STORED,
    status              VARCHAR(50) NOT NULL DEFAULT 'Gate 0 - Idea',
    description         TEXT,
    pic                 VARCHAR(100),
    purpose             TEXT,
    investment_type     VARCHAR(100),
    start_date          VARCHAR(50),
    end_date            VARCHAR(50),
    attachment_name     VARCHAR(255),
    is_fs_required      BOOLEAN DEFAULT false,
    fs_category         VARCHAR(50),
    finance_notes       TEXT,
    finance_approved_at TIMESTAMPTZ,
    committee_notes     TEXT,
    committee_approved_at TIMESTAMPTZ,
    committee_review_schedule VARCHAR(50),
    po_number           VARCHAR(100),
    po_date             VARCHAR(50),
    commissioning_doc_name VARCHAR(255),
    commissioning_notes TEXT,
    commissioning_approved_at TIMESTAMPTZ,
    benefit_target      NUMERIC(18,2),
    benefit_realized    NUMERIC(18,2),
    benefit_notes       TEXT,
    pir_notes           TEXT,
    pir_closed_at       TIMESTAMPTZ,
    revision_source     VARCHAR(50),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Triggers updated_at untuk tabel core
CREATE TRIGGER trg_upd_departemens BEFORE UPDATE ON core.departemens FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();
CREATE TRIGGER trg_upd_roles BEFORE UPDATE ON core.roles FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();
CREATE TRIGGER trg_upd_permissions BEFORE UPDATE ON core.permissions FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();
CREATE TRIGGER trg_upd_type_approval BEFORE UPDATE ON core.type_approval FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();
CREATE TRIGGER trg_upd_users BEFORE UPDATE ON core.users FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();
CREATE TRIGGER trg_upd_cost_center BEFORE UPDATE ON core.cost_center FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();
CREATE TRIGGER trg_upd_capex_type BEFORE UPDATE ON core.capex_type FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();
CREATE TRIGGER trg_upd_capex_reference BEFORE UPDATE ON core.capex_reference FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();
CREATE TRIGGER trg_upd_asset_type BEFORE UPDATE ON core.asset_type FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();
CREATE TRIGGER trg_upd_capex BEFORE UPDATE ON core.capex FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();

-- Master Data: Login & Audit Logs
CREATE TABLE core.login_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES core.users(id) ON DELETE SET NULL,
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

-- Settings: Hak Akses Portal per Pengguna
CREATE TABLE core.user_portal_access (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    can_capex   BOOLEAN NOT NULL DEFAULT true,
    can_bodr    BOOLEAN NOT NULL DEFAULT true,
    can_price   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_portal_access_user_id UNIQUE (user_id)
);

-- Index tambahan untuk pencarian umum
CREATE INDEX idx_users_departemen ON core.users(departemen_id);
CREATE INDEX idx_users_role ON core.users(role_id);
CREATE INDEX idx_capex_departemen ON core.capex(departemen_id);
CREATE INDEX idx_login_logs_login_time ON core.login_logs(login_time DESC);
CREATE INDEX idx_login_logs_user_id ON core.login_logs(user_id);
CREATE INDEX idx_user_portal_access_user_id ON core.user_portal_access(user_id);
-- ============================================================================
-- WORKFLOW SCHEMA (Portal Admin > Settings)
-- ============================================================================

-- Settings: Role Permission
-- Satu baris tabel di UI mewakili satu role; permission-nya adalah checkbox multi.
-- Di database dinormalisasi jadi junction table per (role, permission).
CREATE TABLE workflow.role_permissions (
    id             SERIAL PRIMARY KEY,
    role_id        INTEGER NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
    permission_id  INTEGER NOT NULL REFERENCES core.permissions(id) ON DELETE CASCADE,
    status         core.status_type NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (role_id, permission_id)
);
CREATE TRIGGER trg_upd_role_permissions BEFORE UPDATE ON workflow.role_permissions FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();

-- Settings: Approval Workflow (untuk approval BODR)
-- Header per kombinasi Departemen + Type Approval, detail step approval-nya berurutan.
CREATE TABLE workflow.approval_workflow (
    id               SERIAL PRIMARY KEY,
    departemen_id    INTEGER NOT NULL REFERENCES core.departemens(id),
    type_approval_id INTEGER NOT NULL REFERENCES core.type_approval(id),
    status           core.status_type NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (departemen_id, type_approval_id)
);
CREATE TRIGGER trg_upd_approval_workflow BEFORE UPDATE ON workflow.approval_workflow FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();

CREATE TABLE workflow.approval_workflow_steps (
    id               SERIAL PRIMARY KEY,
    workflow_id      INTEGER NOT NULL REFERENCES workflow.approval_workflow(id) ON DELETE CASCADE,
    step_order       INTEGER NOT NULL,
    approver_user_id INTEGER NOT NULL REFERENCES core.users(id),
    keterangan       VARCHAR(150),
    UNIQUE (workflow_id, step_order)
);

-- Settings: Approval Price Workflow (untuk approval Otorisasi Harga)
CREATE TABLE workflow.approval_price_workflow (
    id               SERIAL PRIMARY KEY,
    departemen_id    INTEGER NOT NULL REFERENCES core.departemens(id),
    type_approval_id INTEGER NOT NULL REFERENCES core.type_approval(id),
    status           core.status_type NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (departemen_id, type_approval_id)
);
CREATE TRIGGER trg_upd_approval_price_workflow BEFORE UPDATE ON workflow.approval_price_workflow FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();

CREATE TABLE workflow.approval_price_workflow_steps (
    id               SERIAL PRIMARY KEY,
    workflow_id      INTEGER NOT NULL REFERENCES workflow.approval_price_workflow(id) ON DELETE CASCADE,
    step_order       INTEGER NOT NULL,
    approver_user_id INTEGER NOT NULL REFERENCES core.users(id),
    keterangan       VARCHAR(150),
    UNIQUE (workflow_id, step_order)
);

-- Settings: Departemen Settings
CREATE TABLE workflow.department_settings (
    id                    SERIAL PRIMARY KEY,
    departemen_id         INTEGER NOT NULL UNIQUE REFERENCES core.departemens(id),
    keterangan            TEXT,
    head_dept_user_id     INTEGER REFERENCES core.users(id),
    accounting_user_id    INTEGER REFERENCES core.users(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_upd_department_settings BEFORE UPDATE ON workflow.department_settings FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();

CREATE INDEX idx_wf_steps_workflow ON workflow.approval_workflow_steps(workflow_id);
CREATE INDEX idx_wfp_steps_workflow ON workflow.approval_price_workflow_steps(workflow_id);
-- ============================================================================
-- BODR SCHEMA (Portal Admin > Create BODR, BODR Approval, List BODR, dst)
-- ============================================================================

-- Sequence untuk generate BODR NO otomatis, format: BODR/YYYYMM/0001
CREATE SEQUENCE bodr.seq_bodr_no START 1;
-- Sequence untuk BODR ID final (hanya terisi ketika full approved)
CREATE SEQUENCE bodr.seq_bodr_id START 1;

-- Tabel utama: Create BODR
CREATE TABLE bodr.bodr (
    id                  SERIAL PRIMARY KEY,
    bodr_no             VARCHAR(40) NOT NULL UNIQUE,          -- auto generate saat insert
    bodr_id_final       VARCHAR(40) UNIQUE,                   -- terisi otomatis saat full approved
    title               VARCHAR(200) NOT NULL,                -- Title / Judul
    user_id             INTEGER NOT NULL REFERENCES core.users(id),        -- requester, dari user login
    departemen_id       INTEGER NOT NULL REFERENCES core.departemens(id),  -- dari user login
    cost_center_id      INTEGER NOT NULL REFERENCES core.cost_center(id),
    kriteria_approval   bodr.kriteria_approval_type NOT NULL,             -- CAP / FOH / GOP
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    benefit             TEXT,
    capex_id            INTEGER NOT NULL REFERENCES core.capex(id),
    amount              NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    category            bodr.category_type NOT NULL,
    budget_remarks      TEXT,                                  -- wajib diisi jika category = unbudget
    status              bodr.bodr_status_type NOT NULL DEFAULT 'draft',
    current_step        INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_end_after_start CHECK (end_date >= start_date),
    CONSTRAINT chk_unbudget_remarks CHECK (
        (category = 'unbudget' AND budget_remarks IS NOT NULL)
        OR (category = 'budget')
    )
);
CREATE TRIGGER trg_upd_bodr BEFORE UPDATE ON bodr.bodr FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();
CREATE INDEX idx_bodr_user ON bodr.bodr(user_id);
CREATE INDEX idx_bodr_departemen ON bodr.bodr(departemen_id);
CREATE INDEX idx_bodr_status ON bodr.bodr(status);
CREATE INDEX idx_bodr_kriteria ON bodr.bodr(kriteria_approval);

-- Asset Master Data (muncul hanya jika kriteria_approval = 'CAP')
CREATE TABLE bodr.bodr_asset (
    id            SERIAL PRIMARY KEY,
    bodr_id       INTEGER NOT NULL UNIQUE REFERENCES bodr.bodr(id) ON DELETE CASCADE,
    nama_asset    VARCHAR(200) NOT NULL,
    plant         VARCHAR(10) NOT NULL DEFAULT '2301',   -- default & terkunci di form
    location      bodr.location_type NOT NULL,
    asset_type_id INTEGER REFERENCES core.asset_type(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dokumen lampiran BODR (maks 50 file, format pdf/excel/ppt)
CREATE TABLE bodr.bodr_document (
    id          SERIAL PRIMARY KEY,
    bodr_id     INTEGER NOT NULL REFERENCES bodr.bodr(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_path   TEXT NOT NULL,
    file_type   VARCHAR(10) NOT NULL CHECK (file_type IN ('pdf','xls','xlsx','ppt','pptx')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bodr_document_bodr ON bodr.bodr_document(bodr_id);

-- Log / step approval BODR (mengikuti urutan dari workflow.approval_workflow_steps)
CREATE TABLE bodr.bodr_approval (
    id                SERIAL PRIMARY KEY,
    bodr_id           INTEGER NOT NULL REFERENCES bodr.bodr(id) ON DELETE CASCADE,
    step_order        INTEGER NOT NULL,
    approver_user_id  INTEGER NOT NULL REFERENCES core.users(id),
    status            bodr.approval_action_type NOT NULL DEFAULT 'pending',
    comment           TEXT,
    action_date       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (bodr_id, step_order)
);
CREATE INDEX idx_bodr_approval_bodr ON bodr.bodr_approval(bodr_id);
CREATE INDEX idx_bodr_approval_approver ON bodr.bodr_approval(approver_user_id);

-- Trigger: setelah full approved ke Presidir, muncul button "pengajuan otorisasi harga"
-- yang men-trigger ke purchasing. Tabel ini menyimpan pengajuan tsb (No PR dari requester).
CREATE TABLE bodr.otorisasi_harga_request (
    id           SERIAL PRIMARY KEY,
    bodr_id      INTEGER NOT NULL REFERENCES bodr.bodr(id),
    no_pr        VARCHAR(50) NOT NULL,
    deskripsi    TEXT,
    amount       NUMERIC(18,2) NOT NULL,     -- dana yang ada di BODR tsb
    status       VARCHAR(20) NOT NULL DEFAULT 'submitted',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ohr_bodr ON bodr.otorisasi_harga_request(bodr_id);

-- ----------------------------------------------------------------------------
-- FUNCTIONS & TRIGGERS: automasi BODR
-- ----------------------------------------------------------------------------

-- 1. Auto-generate BODR NO saat insert, format BODR/YYYYMM/0001
CREATE OR REPLACE FUNCTION bodr.fn_generate_bodr_no()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bodr_no IS NULL OR NEW.bodr_no = '' THEN
        NEW.bodr_no := 'BODR/' || to_char(now(), 'YYYYMM') || '/' ||
                        lpad(nextval('bodr.seq_bodr_no')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bodr_generate_no
BEFORE INSERT ON bodr.bodr
FOR EACH ROW EXECUTE FUNCTION bodr.fn_generate_bodr_no();

-- 2. Batasi maksimal 50 dokumen lampiran per BODR
CREATE OR REPLACE FUNCTION bodr.fn_check_document_limit()
RETURNS TRIGGER AS $$
DECLARE
    total_doc INTEGER;
BEGIN
    SELECT count(*) INTO total_doc FROM bodr.bodr_document WHERE bodr_id = NEW.bodr_id;
    IF total_doc >= 50 THEN
        RAISE EXCEPTION 'Maksimal 50 dokumen lampiran per BODR';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bodr_document_limit
BEFORE INSERT ON bodr.bodr_document
FOR EACH ROW EXECUTE FUNCTION bodr.fn_check_document_limit();

-- 3. Validasi & alokasi dana capex saat BODR dibuat
--    (amount tidak boleh melebihi sisa dana capex, lalu alokasi dikunci)
CREATE OR REPLACE FUNCTION bodr.fn_validate_and_allocate_capex()
RETURNS TRIGGER AS $$
DECLARE
    v_available NUMERIC(18,2);
BEGIN
    SELECT amount_available INTO v_available FROM core.capex WHERE id = NEW.capex_id FOR UPDATE;
    IF v_available IS NULL THEN
        RAISE EXCEPTION 'Capex ID % tidak ditemukan', NEW.capex_id;
    END IF;
    IF NEW.amount > v_available THEN
        RAISE EXCEPTION 'Amount (% ) melebihi sisa dana capex yang tersedia (%)', NEW.amount, v_available;
    END IF;

    UPDATE core.capex
       SET allocated_amount = allocated_amount + NEW.amount
     WHERE id = NEW.capex_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bodr_allocate_capex
AFTER INSERT ON bodr.bodr
FOR EACH ROW EXECUTE FUNCTION bodr.fn_validate_and_allocate_capex();

-- 4. Ketika BODR direject, lepaskan kembali alokasi dana capex
CREATE OR REPLACE FUNCTION bodr.fn_release_capex_on_reject()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
        UPDATE core.capex
           SET allocated_amount = allocated_amount - OLD.amount
         WHERE id = OLD.capex_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bodr_release_capex
AFTER UPDATE ON bodr.bodr
FOR EACH ROW EXECUTE FUNCTION bodr.fn_release_capex_on_reject();

-- 5. Cek kelengkapan approval: jika semua step untuk satu BODR sudah 'approved',
--    otomatis set status BODR jadi 'approved' + generate bodr_id_final.
--    Jika ada satu step 'rejected', status BODR langsung 'rejected'.
CREATE OR REPLACE FUNCTION bodr.fn_check_bodr_full_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_total_step   INTEGER;
    v_approved_step INTEGER;
    v_rejected_step INTEGER;
BEGIN
    IF NEW.status = 'rejected' THEN
        UPDATE bodr.bodr SET status = 'rejected' WHERE id = NEW.bodr_id;
        RETURN NEW;
    END IF;

    IF NEW.status = 'approved' THEN
        SELECT count(*) INTO v_total_step FROM bodr.bodr_approval WHERE bodr_id = NEW.bodr_id;
        SELECT count(*) INTO v_approved_step FROM bodr.bodr_approval WHERE bodr_id = NEW.bodr_id AND status = 'approved';

        IF v_total_step > 0 AND v_total_step = v_approved_step THEN
            UPDATE bodr.bodr
               SET status = 'approved',
                   bodr_id_final = 'BID/' || to_char(now(), 'YYYY') || '/' || lpad(nextval('bodr.seq_bodr_id')::text, 5, '0')
             WHERE id = NEW.bodr_id AND bodr_id_final IS NULL;
        ELSE
            UPDATE bodr.bodr SET status = 'in_approval', current_step = NEW.step_order WHERE id = NEW.bodr_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bodr_approval_check
AFTER UPDATE ON bodr.bodr_approval
FOR EACH ROW
WHEN (NEW.status IS DISTINCT FROM OLD.status)
EXECUTE FUNCTION bodr.fn_check_bodr_full_approval();
-- ============================================================================
-- PURCHASING SCHEMA (Portal Approval Harga - khusus departemen Purchasing)
-- ============================================================================

-- Master Data: Vendor
CREATE TABLE purchasing.vendor (
    id           SERIAL PRIMARY KEY,
    kode_vendor  VARCHAR(50) NOT NULL UNIQUE,
    email_vendor VARCHAR(150),
    vendor_name  VARCHAR(250) NOT NULL,
    street       TEXT,
    status       core.status_type NOT NULL DEFAULT 'active',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_upd_vendor BEFORE UPDATE ON purchasing.vendor FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();

-- Master Data: Part Number
CREATE TABLE purchasing.part_number (
    id                 SERIAL PRIMARY KEY,
    part_number        VARCHAR(100),
    part_name          VARCHAR(200),
    name_material      VARCHAR(200),
    deskripsi          TEXT,
    deskripsi_material TEXT,
    satuan             VARCHAR(20),
    status             core.status_type NOT NULL DEFAULT 'active',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_upd_part_number BEFORE UPDATE ON purchasing.part_number FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();

-- Master Data: Jenis Otorisasi (Otorisasi)
CREATE TABLE purchasing.jenis_otorisasi (
    id          SERIAL PRIMARY KEY,
    kode        VARCHAR(20) NOT NULL UNIQUE,
    kode_jenis  VARCHAR(20),
    nama        VARCHAR(150) NOT NULL,
    nama_jenis  VARCHAR(150),
    deskripsi   TEXT,
    status      core.status_type NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_upd_jenis_otorisasi BEFORE UPDATE ON purchasing.jenis_otorisasi FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();

-- Alias/view untuk kompatibilitas nama lama otorisasi_jenis_ref
CREATE OR REPLACE VIEW purchasing.otorisasi_jenis_ref AS
SELECT id, kode AS kode_jenis, nama AS nama_jenis, deskripsi, status, created_at, updated_at
FROM purchasing.jenis_otorisasi;

-- Master Data: Jenis Barang
CREATE TABLE purchasing.jenis_barang (
    id                SERIAL PRIMARY KEY,
    kode              VARCHAR(50),
    kode_jenis        VARCHAR(20),
    nama              VARCHAR(150),
    nama_jenis_barang VARCHAR(150),
    deskripsi         TEXT,
    status            core.status_type NOT NULL DEFAULT 'active',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_upd_jenis_barang BEFORE UPDATE ON purchasing.jenis_barang FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();

-- NB: Master Data Departemens pada Portal Approval Harga memakai tabel yang sama
-- dengan Portal Admin (core.departemens), karena datanya harus konsisten satu sumber.

-- Header: Create Otorisasi Harga (Non Product & Product)
CREATE TABLE purchasing.otorisasi_harga (
    id                 SERIAL PRIMARY KEY,
    no_doc             VARCHAR(50) NOT NULL UNIQUE,      -- input manual sesuai format buyer
    jenis              purchasing.otorisasi_jenis_type NOT NULL DEFAULT 'non_product',
    no_pr              VARCHAR(50),                       -- wajib untuk non_product
    bodr_id            INTEGER REFERENCES bodr.bodr(id),  -- wajib untuk non_product
    dana_bodr          NUMERIC(18,2),                      -- auto dari bodr.amount, non_product
    tanggal            DATE NOT NULL DEFAULT current_date,
    buyer_user_id      INTEGER NOT NULL REFERENCES core.users(id),
    jenis_otorisasi_id INTEGER REFERENCES purchasing.jenis_otorisasi(id),
    status             VARCHAR(30) NOT NULL DEFAULT 'Pending Review',
    current_step       INTEGER NOT NULL DEFAULT 1,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_non_product_requires_bodr CHECK (
        (jenis = 'non_product' AND no_pr IS NOT NULL AND bodr_id IS NOT NULL)
        OR (jenis = 'product')
    )
);
CREATE TRIGGER trg_upd_otorisasi_harga BEFORE UPDATE ON purchasing.otorisasi_harga FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();
CREATE INDEX idx_oh_bodr ON purchasing.otorisasi_harga(bodr_id);
CREATE INDEX idx_oh_buyer ON purchasing.otorisasi_harga(buyer_user_id);

-- Detail per Supplier (button "Add Supplier", bisa berkali-kali)
CREATE TABLE purchasing.otorisasi_harga_supplier (
    id                SERIAL PRIMARY KEY,
    otorisasi_harga_id INTEGER NOT NULL REFERENCES purchasing.otorisasi_harga(id) ON DELETE CASCADE,
    vendor_id         INTEGER NOT NULL REFERENCES purchasing.vendor(id),
    quality_factor    VARCHAR(50),
    delivery_factor   VARCHAR(50),
    safety_factor     VARCHAR(50) NOT NULL DEFAULT 'OK',
    is_lowest_price   BOOLEAN NOT NULL DEFAULT false,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ohs_header ON purchasing.otorisasi_harga_supplier(otorisasi_harga_id);

-- Detail Item per Supplier (button "Add Item", bisa berkali-kali)
CREATE TABLE purchasing.otorisasi_harga_item (
    id           SERIAL PRIMARY KEY,
    supplier_id  INTEGER NOT NULL REFERENCES purchasing.otorisasi_harga_supplier(id) ON DELETE CASCADE,
    part_number  VARCHAR(100) NOT NULL,
    part_name    VARCHAR(200) NOT NULL,
    qty          NUMERIC(18,2) NOT NULL,
    satuan       purchasing.satuan_qty_type NOT NULL,
    price_quote  NUMERIC(18,2) NOT NULL,
    target_price NUMERIC(18,2) NOT NULL,
    final_price  NUMERIC(18,2) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ohi_supplier ON purchasing.otorisasi_harga_item(supplier_id);

-- Log / step Approval Price (Fitur Approval Price - hanya departemen Purchasing)
CREATE TABLE purchasing.approval_harga (
    id                  SERIAL PRIMARY KEY,
    otorisasi_harga_id  INTEGER NOT NULL REFERENCES purchasing.otorisasi_harga(id) ON DELETE CASCADE,
    step_order          INTEGER NOT NULL,
    approver_user_id    INTEGER NOT NULL REFERENCES core.users(id),
    status              bodr.approval_action_type NOT NULL DEFAULT 'pending',
    comment             TEXT,
    action_date         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (otorisasi_harga_id, step_order)
);
CREATE INDEX idx_ah_header ON purchasing.approval_harga(otorisasi_harga_id);
CREATE INDEX idx_ah_approver ON purchasing.approval_harga(approver_user_id);

-- ----------------------------------------------------------------------------
-- FUNCTIONS & TRIGGERS: automasi Purchasing
-- ----------------------------------------------------------------------------

-- 1. Saat header otorisasi_harga dibuat untuk jenis non_product, auto isi dana_bodr
CREATE OR REPLACE FUNCTION purchasing.fn_fill_dana_bodr()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.jenis = 'non_product' AND NEW.bodr_id IS NOT NULL THEN
        SELECT amount INTO NEW.dana_bodr FROM bodr.bodr WHERE id = NEW.bodr_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_oh_fill_dana_bodr
BEFORE INSERT ON purchasing.otorisasi_harga
FOR EACH ROW EXECUTE FUNCTION purchasing.fn_fill_dana_bodr();

-- 2. Auto-flag supplier dengan total final_price termurah untuk satu otorisasi harga
CREATE OR REPLACE FUNCTION purchasing.fn_flag_lowest_price()
RETURNS TRIGGER AS $$
DECLARE
    v_header_id INTEGER;
    v_lowest_supplier_id INTEGER;
BEGIN
    SELECT otorisasi_harga_id INTO v_header_id
    FROM purchasing.otorisasi_harga_supplier
    WHERE id = COALESCE(NEW.supplier_id, OLD.supplier_id);

    SELECT s.id INTO v_lowest_supplier_id
    FROM purchasing.otorisasi_harga_supplier s
    JOIN purchasing.otorisasi_harga_item i ON i.supplier_id = s.id
    WHERE s.otorisasi_harga_id = v_header_id
    GROUP BY s.id
    ORDER BY sum(i.final_price * i.qty) ASC
    LIMIT 1;

    UPDATE purchasing.otorisasi_harga_supplier
       SET is_lowest_price = (id = v_lowest_supplier_id)
     WHERE otorisasi_harga_id = v_header_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ohi_flag_lowest_price
AFTER INSERT OR UPDATE OF final_price OR DELETE ON purchasing.otorisasi_harga_item
FOR EACH ROW EXECUTE FUNCTION purchasing.fn_flag_lowest_price();

-- 3. Cek kelengkapan approval harga: jika semua step 'approved' -> header jadi 'approved'
--    Jika ada step 'rejected' -> header jadi 'rejected'
CREATE OR REPLACE FUNCTION purchasing.fn_check_full_approval_harga()
RETURNS TRIGGER AS $$
DECLARE
    v_total_step    INTEGER;
    v_approved_step INTEGER;
BEGIN
    IF NEW.status = 'rejected' THEN
        UPDATE purchasing.otorisasi_harga SET status = 'rejected' WHERE id = NEW.otorisasi_harga_id;
        RETURN NEW;
    END IF;

    IF NEW.status = 'approved' THEN
        SELECT count(*) INTO v_total_step FROM purchasing.approval_harga WHERE otorisasi_harga_id = NEW.otorisasi_harga_id;
        SELECT count(*) INTO v_approved_step FROM purchasing.approval_harga WHERE otorisasi_harga_id = NEW.otorisasi_harga_id AND status = 'approved';

        IF v_total_step > 0 AND v_total_step = v_approved_step THEN
            UPDATE purchasing.otorisasi_harga SET status = 'approved' WHERE id = NEW.otorisasi_harga_id;
        ELSE
            UPDATE purchasing.otorisasi_harga SET status = 'in_approval', current_step = NEW.step_order WHERE id = NEW.otorisasi_harga_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_approval_harga_check
AFTER UPDATE ON purchasing.approval_harga
FOR EACH ROW
WHEN (NEW.status IS DISTINCT FROM OLD.status)
EXECUTE FUNCTION purchasing.fn_check_full_approval_harga();
-- ============================================================================
-- VIEWS - mendukung KPI & grafik di Dashboard
-- ============================================================================

-- Dashboard Admin: ringkasan user & departemen
CREATE OR REPLACE VIEW core.v_dashboard_admin AS
SELECT
    (SELECT count(*) FROM core.users) AS total_user,
    (SELECT count(*) FROM core.departemens) AS total_departemen,
    (SELECT count(*) FROM core.users WHERE status = 'active') AS user_active,
    (SELECT count(*) FROM core.roles) AS total_role;

-- Grafik jumlah BODR per departemen
CREATE OR REPLACE VIEW bodr.v_bodr_per_departemen AS
SELECT d.nama_departemen, count(b.id) AS jumlah_bodr
FROM core.departemens d
LEFT JOIN bodr.bodr b ON b.departemen_id = d.id
GROUP BY d.nama_departemen;

-- Dashboard Requester: list BODR ringkas
CREATE OR REPLACE VIEW bodr.v_bodr_list AS
SELECT
    b.id,
    b.bodr_no,
    b.bodr_id_final,
    b.title,
    u.nama_user       AS requester,
    b.created_at,
    b.benefit,
    b.amount,
    b.kriteria_approval,
    b.status,
    c.kode_capex,
    a.nama_asset       AS nomor_assets
FROM bodr.bodr b
JOIN core.users u ON u.id = b.user_id
JOIN core.capex c ON c.id = b.capex_id
LEFT JOIN bodr.bodr_asset a ON a.bodr_id = b.id;

-- Dashboard Requester: KPI jumlah BODR & capex actual per user
CREATE OR REPLACE VIEW bodr.v_dashboard_requester AS
SELECT
    u.id AS user_id,
    count(b.id) AS jumlah_bodr,
    count(b.id) FILTER (WHERE b.status = 'in_approval') AS pending_approval,
    coalesce(sum(b.amount) FILTER (WHERE b.status = 'approved'), 0) AS capex_actual,
    coalesce(sum(cx.total_amount), 0) AS capex_budget
FROM core.users u
LEFT JOIN bodr.bodr b ON b.user_id = u.id
LEFT JOIN core.capex cx ON cx.id = b.capex_id
GROUP BY u.id;

-- Dashboard Approval: KPI total BODR & pending action per approver
CREATE OR REPLACE VIEW bodr.v_dashboard_approval AS
SELECT
    ba.approver_user_id AS user_id,
    (SELECT count(*) FROM bodr.bodr) AS total_bodr,
    count(*) FILTER (WHERE ba.status = 'pending') AS pending_action
FROM bodr.bodr_approval ba
GROUP BY ba.approver_user_id;

-- Fitur Progress BODR: monitoring dari create sampai full approval
CREATE OR REPLACE VIEW bodr.v_progress_bodr AS
SELECT
    b.id AS bodr_id,
    b.bodr_no,
    b.title,
    ta.nama_approval AS type_approval,
    ba.step_order,
    approver.nama_user AS approval_head_dept,
    ba.status AS status_step,
    ba.comment,
    ba.action_date
FROM bodr.bodr b
LEFT JOIN bodr.bodr_approval ba ON ba.bodr_id = b.id
LEFT JOIN core.users approver ON approver.id = ba.approver_user_id
LEFT JOIN workflow.department_settings ds ON ds.departemen_id = b.departemen_id
LEFT JOIN core.type_approval ta ON ta.id = (
    SELECT type_approval_id FROM workflow.approval_workflow wf
    JOIN workflow.approval_workflow_steps s ON s.workflow_id = wf.id
    WHERE wf.departemen_id = b.departemen_id
    LIMIT 1
)
ORDER BY b.id, ba.step_order;

-- Portal Approval Harga - Dashboard purchasing
CREATE OR REPLACE VIEW purchasing.v_dashboard_purchasing AS
SELECT
    (SELECT count(*) FROM purchasing.otorisasi_harga) AS total_otorisasi_harga,
    (SELECT count(*) FROM bodr.bodr) AS total_bodr;

CREATE OR REPLACE VIEW purchasing.v_otorisasi_harga_per_bulan AS
SELECT to_char(tanggal, 'YYYY-MM') AS bulan, count(*) AS jumlah
FROM purchasing.otorisasi_harga
GROUP BY 1
ORDER BY 1;

CREATE OR REPLACE VIEW purchasing.v_otorisasi_harga_per_departemen AS
SELECT d.nama_departemen, count(oh.id) AS jumlah
FROM purchasing.otorisasi_harga oh
JOIN bodr.bodr b ON b.id = oh.bodr_id
JOIN core.departemens d ON d.id = b.departemen_id
GROUP BY d.nama_departemen;

-- Ringkasan otorisasi harga + supplier termurah
CREATE OR REPLACE VIEW purchasing.v_otorisasi_harga_summary AS
SELECT
    oh.id,
    oh.no_doc,
    oh.no_pr,
    b.bodr_no,
    buyer.nama_user AS buyer,
    oh.created_at,
    oh.status,
    s.vendor_id,
    v.vendor_name,
    s.is_lowest_price
FROM purchasing.otorisasi_harga oh
LEFT JOIN bodr.bodr b ON b.id = oh.bodr_id
JOIN core.users buyer ON buyer.id = oh.buyer_user_id
LEFT JOIN purchasing.otorisasi_harga_supplier s ON s.otorisasi_harga_id = oh.id
LEFT JOIN purchasing.vendor v ON v.id = s.vendor_id;
-- ============================================================================
-- SEED DATA - HANYA ADMIN
-- ============================================================================
-- Catatan: tabel core.users mewajibkan departemen_id & role_id (NOT NULL FK),
-- jadi 1 departemen & 1 role pendukung dibuat seperlunya supaya user admin valid.
-- Master data lain (BODR, purchasing, dll) TIDAK di-seed - silakan diisi lewat
-- aplikasi oleh admin.

INSERT INTO core.departemens (kode_departemen, nama_departemen, deskripsi, status)
VALUES ('ADM', 'Administrator', 'Departemen sistem untuk akun administrator', 'active');

INSERT INTO core.roles (kode_role, nama_role, deskripsi, status)
VALUES ('ADMIN', 'Admin', 'Full akses seluruh modul sistem', 'active');

INSERT INTO core.permissions (kode_permission, nama_permission, deskripsi, status)
VALUES ('ALL_ACCESS', 'Full Access', 'Akses penuh ke seluruh fitur & menu', 'active');

INSERT INTO workflow.role_permissions (role_id, permission_id, status)
SELECT r.id, p.id, 'active'
FROM core.roles r, core.permissions p
WHERE r.kode_role = 'ADMIN' AND p.kode_permission = 'ALL_ACCESS';

INSERT INTO core.users (npk, nama_user, email, username, password_hash, departemen_id, role_id, status)
SELECT
    'ADM001',
    'Administrator',
    'admin@bodrportal.local',
    'admin',
    crypt('admin123', gen_salt('bf')),
    d.id,
    r.id,
    'active'
FROM core.departemens d, core.roles r
WHERE d.kode_departemen = 'ADM' AND r.kode_role = 'ADMIN';

-- Note: purchasing.jenis_otorisasi dibiarkan kosong sebagai master data


INSERT INTO purchasing.vendor (kode_vendor, email_vendor, vendor_name, street, status)
VALUES
    ('VND-001', 'sales@suryabaja.co.id', 'PT Surya Baja Mandiri', 'Jl. Industri Raya Blok A1 No. 5, Cikarang', 'active'),
    ('VND-002', 'info@mitratehnik.com', 'CV Mitra Tehnik Perkasa', 'Jl. Raya Jababeka II No. 12, Bekasi', 'active'),
    ('VND-003', 'contact@primakomponen.co.id', 'PT Prima Komponen Utama', 'Kawasan Industri GIIC Blok C3, Cikarang Pusat', 'active')
ON CONFLICT (kode_vendor) DO NOTHING;

-- Verifikasi login: SELECT * FROM core.users WHERE username = 'admin'
--   AND password_hash = crypt('admin123', password_hash);

