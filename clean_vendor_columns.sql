-- ============================================================================
-- SCRIPT: HAPUS KOLOM DUPLIKAT PADA TABEL PURCHASING.VENDOR
-- ============================================================================
-- Menghapus kolom lama/alias agar struktur tabel 100% bersih & tidak konflik:
-- 1. nama_vendor -> diganti vendor_name
-- 2. email       -> diganti email_vendor
-- 3. alamat      -> diganti street
-- 4. telepon
-- ============================================================================

-- 1. Pastikan data di kolom resmi terselamatkan (jika ada data lama)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='purchasing' AND table_name='vendor' AND column_name='nama_vendor') THEN
        UPDATE purchasing.vendor SET vendor_name = COALESCE(NULLIF(vendor_name, ''), nama_vendor) WHERE id IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='purchasing' AND table_name='vendor' AND column_name='email') THEN
        UPDATE purchasing.vendor SET email_vendor = COALESCE(NULLIF(email_vendor, ''), email) WHERE id IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='purchasing' AND table_name='vendor' AND column_name='alamat') THEN
        UPDATE purchasing.vendor SET street = COALESCE(NULLIF(street, ''), alamat) WHERE id IS NOT NULL;
    END IF;
END $$;

-- 2. Hapus kolom-kolom duplikat / yang tidak terpakai
ALTER TABLE purchasing.vendor DROP COLUMN IF EXISTS nama_vendor;
ALTER TABLE purchasing.vendor DROP COLUMN IF EXISTS email;
ALTER TABLE purchasing.vendor DROP COLUMN IF EXISTS alamat;
ALTER TABLE purchasing.vendor DROP COLUMN IF EXISTS telepon;

-- 3. Verifikasi struktur tabel hasil pembersihan
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'purchasing' AND table_name = 'vendor'
ORDER BY ordinal_position;
