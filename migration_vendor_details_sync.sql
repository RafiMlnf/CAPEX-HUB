-- ============================================================================
-- MIGRATION SCRIPT: CLEAN & STANDARDIZE VENDOR TABLE (PostgreSQL / pgAdmin)
-- ============================================================================
-- Merapikan kolom tabel purchasing.vendor agar 100% presisi sesuai details.txt:
-- 1. kode_vendor
-- 2. email_vendor
-- 3. vendor_name
-- 4. street
-- 5. status (active / inactive)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS purchasing;

-- 1. Buat tabel purchasing.vendor bersih jika belum ada
CREATE TABLE IF NOT EXISTS purchasing.vendor (
    id           SERIAL PRIMARY KEY,
    kode_vendor  VARCHAR(50) NOT NULL UNIQUE,
    email_vendor VARCHAR(150),
    vendor_name  VARCHAR(250) NOT NULL,
    street       TEXT,
    status       core.status_type NOT NULL DEFAULT 'active',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Pastikan kolom resmi details.txt ada
ALTER TABLE purchasing.vendor ADD COLUMN IF NOT EXISTS kode_vendor VARCHAR(50);
ALTER TABLE purchasing.vendor ADD COLUMN IF NOT EXISTS email_vendor VARCHAR(150);
ALTER TABLE purchasing.vendor ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(250);
ALTER TABLE purchasing.vendor ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE purchasing.vendor ADD COLUMN IF NOT EXISTS status core.status_type DEFAULT 'active';

-- 3. Salin data dari kolom lama (jika ada data) ke kolom resmi details.txt
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='purchasing' AND table_name='vendor' AND column_name='nama_vendor') THEN
        UPDATE purchasing.vendor SET vendor_name = COALESCE(NULLIF(vendor_name, ''), nama_vendor) WHERE vendor_name IS NULL OR vendor_name = '';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='purchasing' AND table_name='vendor' AND column_name='email') THEN
        UPDATE purchasing.vendor SET email_vendor = COALESCE(NULLIF(email_vendor, ''), email) WHERE email_vendor IS NULL OR email_vendor = '';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='purchasing' AND table_name='vendor' AND column_name='alamat') THEN
        UPDATE purchasing.vendor SET street = COALESCE(NULLIF(street, ''), alamat) WHERE street IS NULL OR street = '';
    END IF;
END $$;

-- 4. Hapus kolom-kolom duplikat / alias lama agar tabel bersih
ALTER TABLE purchasing.vendor DROP COLUMN IF EXISTS nama_vendor;
ALTER TABLE purchasing.vendor DROP COLUMN IF EXISTS email;
ALTER TABLE purchasing.vendor DROP COLUMN IF EXISTS alamat;
ALTER TABLE purchasing.vendor DROP COLUMN IF EXISTS telepon;
