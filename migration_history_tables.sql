-- ============================================================================
-- Migration: Add History Tables for BODR and OtorisasiHarga
-- ============================================================================

-- 1. Create bodr_history table in schema bodr
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

CREATE INDEX IF NOT EXISTS idx_bodr_history_bodr_id ON bodr.bodr_history(bodr_id);
CREATE INDEX IF NOT EXISTS idx_bodr_history_timestamp ON bodr.bodr_history(timestamp DESC);

-- 2. Create otorisasi_harga_history table in schema purchasing
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

CREATE INDEX IF NOT EXISTS idx_oh_history_oh_id ON purchasing.otorisasi_harga_history(otorisasi_harga_id);
CREATE INDEX IF NOT EXISTS idx_oh_history_timestamp ON purchasing.otorisasi_harga_history(timestamp DESC);
