-- ============================================================================
-- MIGRATION SCRIPT: FIX PURCHASING TABLES & COLUMNS (PostgreSQL / pgAdmin)
-- ============================================================================
-- Jalankan script ini di database "bodr_db" pada pgAdmin / psql.
-- ============================================================================

-- 1. Schema Purchasing
CREATE SCHEMA IF NOT EXISTS purchasing;

-- 2. Pastikan tabel core.users memiliki email unik yang valid (tidak kosong/duplikat)
UPDATE core.users
SET email = username || '@mtm.co.id'
WHERE email IS NULL OR email = '' OR email = ' ';

-- 3. Tabel Master: Jenis Source
CREATE TABLE IF NOT EXISTS purchasing.jenis_otorisasi (
    id          SERIAL PRIMARY KEY,
    kode        VARCHAR(20) NOT NULL UNIQUE,
    nama        VARCHAR(150) NOT NULL,
    deskripsi   TEXT,
    status      core.status_type NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Note: purchasing.jenis_otorisasi (Jenis Source) dibiarkan kosong sebagai master data yang diisi oleh user.


-- 4. Tabel Master: Vendor (Sinkronisasi kolom)
CREATE TABLE IF NOT EXISTS purchasing.vendor (
    id           SERIAL PRIMARY KEY,
    kode_vendor  VARCHAR(30) NOT NULL UNIQUE,
    nama_vendor  VARCHAR(200),
    vendor_name  VARCHAR(200),
    alamat       TEXT,
    street       TEXT,
    telepon      VARCHAR(50),
    email        VARCHAR(150),
    email_vendor VARCHAR(150),
    status       core.status_type NOT NULL DEFAULT 'active',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE purchasing.vendor ADD COLUMN IF NOT EXISTS nama_vendor VARCHAR(200);
ALTER TABLE purchasing.vendor ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(200);
ALTER TABLE purchasing.vendor ADD COLUMN IF NOT EXISTS alamat TEXT;
ALTER TABLE purchasing.vendor ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE purchasing.vendor ADD COLUMN IF NOT EXISTS telepon VARCHAR(50);
ALTER TABLE purchasing.vendor ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE purchasing.vendor ADD COLUMN IF NOT EXISTS email_vendor VARCHAR(150);

UPDATE purchasing.vendor SET 
    nama_vendor = COALESCE(NULLIF(nama_vendor, ''), vendor_name, ''),
    vendor_name = COALESCE(NULLIF(vendor_name, ''), nama_vendor, ''),
    email = COALESCE(NULLIF(email, ''), email_vendor, ''),
    email_vendor = COALESCE(NULLIF(email_vendor, ''), email, ''),
    alamat = COALESCE(NULLIF(alamat, ''), street, ''),
    street = COALESCE(NULLIF(street, ''), alamat, '');

-- 5. Tabel Master: Part Number (Sinkronisasi kolom)
CREATE TABLE IF NOT EXISTS purchasing.part_number (
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

ALTER TABLE purchasing.part_number ADD COLUMN IF NOT EXISTS part_number VARCHAR(100);
ALTER TABLE purchasing.part_number ADD COLUMN IF NOT EXISTS part_name VARCHAR(200);
ALTER TABLE purchasing.part_number ADD COLUMN IF NOT EXISTS name_material VARCHAR(200);
ALTER TABLE purchasing.part_number ADD COLUMN IF NOT EXISTS deskripsi TEXT;
ALTER TABLE purchasing.part_number ADD COLUMN IF NOT EXISTS deskripsi_material TEXT;

UPDATE purchasing.part_number SET 
    part_number = COALESCE(NULLIF(part_number, ''), 'PART-' || lpad(id::text, 4, '0')),
    part_name = COALESCE(NULLIF(part_name, ''), name_material, ''),
    name_material = COALESCE(NULLIF(name_material, ''), part_name, ''),
    deskripsi = COALESCE(NULLIF(deskripsi, ''), deskripsi_material, ''),
    deskripsi_material = COALESCE(NULLIF(deskripsi_material, ''), deskripsi, '');

-- 6. Tabel Master: Jenis Barang (Sinkronisasi kolom)
CREATE TABLE IF NOT EXISTS purchasing.jenis_barang (
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

ALTER TABLE purchasing.jenis_barang ADD COLUMN IF NOT EXISTS kode VARCHAR(50);
ALTER TABLE purchasing.jenis_barang ADD COLUMN IF NOT EXISTS kode_jenis VARCHAR(20);
ALTER TABLE purchasing.jenis_barang ADD COLUMN IF NOT EXISTS nama VARCHAR(150);
ALTER TABLE purchasing.jenis_barang ADD COLUMN IF NOT EXISTS nama_jenis_barang VARCHAR(150);

UPDATE purchasing.jenis_barang SET 
    kode = COALESCE(NULLIF(kode, ''), kode_jenis, ''),
    kode_jenis = COALESCE(NULLIF(kode_jenis, ''), kode, ''),
    nama = COALESCE(NULLIF(nama, ''), nama_jenis_barang, ''),
    nama_jenis_barang = COALESCE(NULLIF(nama_jenis_barang, ''), nama, '');

-- 7. Tabel Header: Otorisasi Harga
CREATE TABLE IF NOT EXISTS purchasing.otorisasi_harga (
    id                 SERIAL PRIMARY KEY,
    no_doc             VARCHAR(50) NOT NULL UNIQUE,
    jenis              purchasing.otorisasi_jenis_type NOT NULL DEFAULT 'non_product',
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

ALTER TABLE purchasing.otorisasi_harga ADD COLUMN IF NOT EXISTS jenis_otorisasi_id INTEGER;

-- 8. Tabel Detail: Supplier & Item Otorisasi Harga
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

CREATE TABLE IF NOT EXISTS purchasing.approval_harga (
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

-- ============================================================================
-- SELESAI
-- ============================================================================
