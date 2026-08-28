-- ============================================================
-- Migration: Tambah tabel capex_history untuk menyimpan
-- history aktivitas CAPEX secara permanen (append-only)
-- Created: 2026-08-27
-- ============================================================

CREATE TABLE IF NOT EXISTS core.capex_history (
  id          SERIAL PRIMARY KEY,
  capex_id    INT NOT NULL REFERENCES core.capex(id) ON DELETE CASCADE,
  gate        INT NOT NULL DEFAULT 0,
  action      VARCHAR(255) NOT NULL DEFAULT '',
  actor       VARCHAR(150) NOT NULL DEFAULT '',
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capex_history_capex_id
  ON core.capex_history(capex_id);

CREATE INDEX IF NOT EXISTS idx_capex_history_timestamp
  ON core.capex_history(timestamp);
