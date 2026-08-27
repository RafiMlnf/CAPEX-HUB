-- ============================================================================
-- SCRIPT: CLEAR MASTER JENIS OTORISASI
-- ============================================================================

-- 1. Lepaskan relasi pada otorisasi_harga jika ada yang merujuk ke data lama
UPDATE purchasing.otorisasi_harga 
SET jenis_otorisasi_id = NULL 
WHERE jenis_otorisasi_id IS NOT NULL;

-- 2. Kosongkan tabel master jenis otorisasi dan reset sequence id
TRUNCATE TABLE purchasing.jenis_otorisasi RESTART IDENTITY CASCADE;
