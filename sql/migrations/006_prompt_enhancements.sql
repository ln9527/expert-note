-- Migration 006: Prompt Generation Enhancements
-- Date: 2026-01-08
-- Purpose: Add source_document_ids and base_prompt_id for prompt versioning and document source tracking
-- Dependencies: Requires migrations 002 (prompt_tags) and 004 (soft_delete) to be run first

BEGIN;

-- 1. Add source_document_ids column for direct document annotation access
-- This allows prompts to reference documents directly without going through knowledge extraction
ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS source_document_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN system_prompts.source_document_ids IS
  'Array of document IDs used as direct sources (bypassing knowledge extraction). '
  'Enables prompts to reference raw document annotations.';

-- 2. Add base_prompt_id for versioning/update chain
-- Enables v1 → v2 → v3 prompt evolution tracking
ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS base_prompt_id UUID REFERENCES system_prompts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_system_prompts_base_prompt_id ON system_prompts(base_prompt_id);

COMMENT ON COLUMN system_prompts.base_prompt_id IS
  'Reference to base prompt if this is an updated version. '
  'Creates a chain: base_prompt (v1) → updated_prompt (v2) → refined_prompt (v3)';

-- 3. Verify prompt_tags table exists (should be created by migration 002)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'prompt_tags'
  ) THEN
    RAISE EXCEPTION 'prompt_tags table not found. Please run migration 002_prompt_tags.sql first.';
  END IF;
END $$;

-- 4. Verify soft delete columns exist (should be added by migration 004)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_prompts' AND column_name = 'is_deleted'
  ) THEN
    RAISE EXCEPTION 'is_deleted column not found in system_prompts. Please run migration 004_soft_delete.sql first.';
  END IF;
END $$;

COMMIT;

-- 5. Verification query
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  COALESCE(col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position), '') as comment
FROM information_schema.columns
WHERE table_name = 'system_prompts'
AND column_name IN ('source_document_ids', 'base_prompt_id', 'source_knowledge_ids', 'is_deleted', 'deleted_at')
ORDER BY column_name;

-- Display success message
SELECT '✓ Migration 006 completed successfully' as status;
SELECT '  - Added source_document_ids column' as detail
UNION ALL
SELECT '  - Added base_prompt_id column with foreign key'
UNION ALL
SELECT '  - Verified prompt_tags table exists'
UNION ALL
SELECT '  - Verified soft delete columns exist';
