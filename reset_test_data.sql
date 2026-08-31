-- ============================================================================
-- SQL SCRIPT: Reset / Bersihkan Semua Data Transaksi Uji Coba (DINAMIS)
-- Database  : bodr_db
-- Tujuan    : Hapus seluruh data transaksi (Capex, BODR, Otorisasi Harga,
--             History & Log Login) tanpa menyentuh Master Data.
-- Cara kerja: Auto-discover tabel transaksi dari pg_tables berdasarkan
--             schema aktif, lalu TRUNCATE CASCADE secara otomatis.
--             Cukup tambah ke daftar MASTER jika ada tabel master baru.
-- ============================================================================

DO $$
DECLARE
  -- ── Daftar tabel MASTER DATA yang TIDAK boleh di-reset ────────────────────
  -- Tambahkan entri baru di sini jika ada tabel master dari migration baru.
  v_master_tables TEXT[] := ARRAY[
    'core.asset_type',
    'core.capex_reference',
    'core.capex_type',
    'core.cost_center',
    'core.departemens',
    'core.permissions',
    'core.roles',
    'core.type_approval',
    'core.user_portal_access',
    'core.users',
    'purchasing.jenis_barang',
    'purchasing.jenis_otorisasi',
    'purchasing.otorisasi_jenis_ref',
    'purchasing.part_number',
    'purchasing.vendor',
    'workflow.approval_price_workflow',
    'workflow.approval_price_workflow_steps',
    'workflow.approval_workflow',
    'workflow.approval_workflow_steps',
    'workflow.department_settings',
    'workflow.role_permissions'
  ];

  v_rec   RECORD;
  v_tabel TEXT;
  v_sql   TEXT;
BEGIN
  RAISE NOTICE '====== Mulai Reset Data Transaksi ======';

  -- Loop seluruh tabel di schema transaksi, skip master data
  FOR v_rec IN
    SELECT schemaname, tablename
    FROM   pg_tables
    WHERE  schemaname IN ('bodr', 'core', 'purchasing')
    ORDER  BY schemaname, tablename
  LOOP
    v_tabel := v_rec.schemaname || '.' || v_rec.tablename;

    IF v_tabel = ANY(v_master_tables) THEN
      RAISE NOTICE 'SKIP  (master) : %', v_tabel;
      CONTINUE;
    END IF;

    v_sql := 'TRUNCATE TABLE ' || v_tabel || ' CASCADE;';
    RAISE NOTICE 'TRUNCATE       : %', v_tabel;
    EXECUTE v_sql;
  END LOOP;

  RAISE NOTICE '====== Reset Selesai ======';
END $$;

-- ── Verifikasi: semua tabel transaksi harus bernilai 0 ────────────────────
SELECT 'bodr.bodr'                               AS tabel, count(*) AS sisa FROM bodr.bodr
UNION ALL
SELECT 'bodr.bodr_history',                               count(*) FROM bodr.bodr_history
UNION ALL
SELECT 'bodr.bodr_approval',                              count(*) FROM bodr.bodr_approval
UNION ALL
SELECT 'bodr.bodr_asset',                                 count(*) FROM bodr.bodr_asset
UNION ALL
SELECT 'bodr.bodr_document',                              count(*) FROM bodr.bodr_document
UNION ALL
SELECT 'bodr.otorisasi_harga_request',                    count(*) FROM bodr.otorisasi_harga_request
UNION ALL
SELECT 'core.capex',                                      count(*) FROM core.capex
UNION ALL
SELECT 'core.capex_history',                              count(*) FROM core.capex_history
UNION ALL
SELECT 'core.login_logs',                                 count(*) FROM core.login_logs
UNION ALL
SELECT 'purchasing.approval_harga',                       count(*) FROM purchasing.approval_harga
UNION ALL
SELECT 'purchasing.otorisasi_harga',                      count(*) FROM purchasing.otorisasi_harga
UNION ALL
SELECT 'purchasing.otorisasi_harga_history',              count(*) FROM purchasing.otorisasi_harga_history
UNION ALL
SELECT 'purchasing.otorisasi_harga_item',                 count(*) FROM purchasing.otorisasi_harga_item
UNION ALL
SELECT 'purchasing.otorisasi_harga_supplier',             count(*) FROM purchasing.otorisasi_harga_supplier
ORDER BY tabel;
