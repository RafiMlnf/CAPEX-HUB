-- ============================================================================
-- SQL SCRIPT: Reset / Bersihkan Semua Data Pengajuan & Transaksi Uji Coba
-- Database: bodr_db
-- Catatan: Skrip ini menghapus seluruh data transaksi pengajuan (Capex, BODR, 
-- Otorisasi Harga & Log Login) tanpa menghapus Master Data (Users, Roles, Departemen).
-- ============================================================================

BEGIN;

-- 1. Hapus transaksi Otorisasi Harga (Purchasing)
TRUNCATE TABLE purchasing.approval_harga CASCADE;
TRUNCATE TABLE purchasing.otorisasi_harga_item CASCADE;
TRUNCATE TABLE purchasing.otorisasi_harga_supplier CASCADE;
TRUNCATE TABLE purchasing.otorisasi_harga CASCADE;

-- 2. Hapus transaksi BODR
TRUNCATE TABLE bodr.bodr_approval CASCADE;
TRUNCATE TABLE bodr.bodr_document CASCADE;
TRUNCATE TABLE bodr.bodr_asset CASCADE;
TRUNCATE TABLE bodr.otorisasi_harga_request CASCADE;
TRUNCATE TABLE bodr.bodr CASCADE;

-- 3. Hapus seluruh data Pengajuan Capex (FS Capex) & Reset Nomor Urut ID ke 1
TRUNCATE TABLE core.capex RESTART IDENTITY CASCADE;

-- 4. Bersihkan catatan riwayat login uji coba
TRUNCATE TABLE core.login_logs RESTART IDENTITY;

COMMIT;

-- Verifikasi hasil penghapusan (semua harus bernilai 0)
SELECT count(*) AS total_capex_tersisa FROM core.capex;
SELECT count(*) AS total_bodr_tersisa FROM bodr.bodr;
