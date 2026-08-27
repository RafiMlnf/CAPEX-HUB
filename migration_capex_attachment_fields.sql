-- ============================================================================
-- MIGRATION: Dukungan Lampiran Multi-File Dokumen & Review Finance pada Capex
-- Schema: core.capex
-- ============================================================================

-- 1. Pastikan kolom attachment_name mendukung teks panjang (multiple files)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'core' 
          AND table_name = 'capex' 
          AND column_name = 'attachment_name'
    ) THEN
        ALTER TABLE core.capex ALTER COLUMN attachment_name TYPE TEXT;
    ELSE
        ALTER TABLE core.capex ADD COLUMN attachment_name TEXT;
    END IF;
END $$;

-- 2. Pastikan kolom dokumen commissioning mendukung teks panjang
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'core' 
          AND table_name = 'capex' 
          AND column_name = 'commissioning_doc_name'
    ) THEN
        ALTER TABLE core.capex ALTER COLUMN commissioning_doc_name TYPE TEXT;
    ELSE
        ALTER TABLE core.capex ADD COLUMN commissioning_doc_name TEXT;
    END IF;
END $$;

-- 3. Pastikan kolom catatan & jadwal review tersedia
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'capex' AND column_name = 'finance_notes') THEN
        ALTER TABLE core.capex ADD COLUMN finance_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'capex' AND column_name = 'finance_approved_at') THEN
        ALTER TABLE core.capex ADD COLUMN finance_approved_at TIMESTAMPTZ(6);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'capex' AND column_name = 'committee_review_schedule') THEN
        ALTER TABLE core.capex ADD COLUMN committee_review_schedule VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'core' AND table_name = 'capex' AND column_name = 'revision_source') THEN
        ALTER TABLE core.capex ADD COLUMN revision_source VARCHAR(50);
    END IF;
END $$;
