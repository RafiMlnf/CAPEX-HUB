-- ============================================================================
-- MIGRATION: Pengaturan Akses Portal per Pengguna
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.user_portal_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    can_capex BOOLEAN NOT NULL DEFAULT true,
    can_bodr BOOLEAN NOT NULL DEFAULT true,
    can_price BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_portal_access_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_portal_access_user_id ON core.user_portal_access(user_id);

-- Inisialisasi data hak akses untuk seluruh pengguna yang sudah terdaftar
INSERT INTO core.user_portal_access (user_id, can_capex, can_bodr, can_price)
SELECT id, true, true, true
FROM core.users
ON CONFLICT (user_id) DO NOTHING;
