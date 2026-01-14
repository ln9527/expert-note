-- Migration: 010_tag_ownership_soft_delete.sql
-- Description: Add ownership tracking and soft delete to tags
-- Date: 2026-01-14

-- Add created_by column (NULL = global/seed tag, can only be deleted by super_admin)
ALTER TABLE tags ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add soft delete columns
ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_tags_created_by ON tags(created_by);
CREATE INDEX IF NOT EXISTS idx_tags_is_deleted ON tags(is_deleted);

-- Remove old unique constraint on name (if exists)
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;

-- Add partial unique index (only for non-deleted tags - allows reusing deleted tag names)
DROP INDEX IF EXISTS idx_tags_name_active;
CREATE UNIQUE INDEX idx_tags_name_active ON tags(name) WHERE is_deleted = FALSE;

-- Update existing tags to have is_deleted = FALSE
UPDATE tags SET is_deleted = FALSE WHERE is_deleted IS NULL;

-- Verification
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tags' AND column_name = 'created_by'
    ) THEN
        RAISE EXCEPTION 'Migration 010: Failed to add created_by column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tags' AND column_name = 'is_deleted'
    ) THEN
        RAISE EXCEPTION 'Migration 010: Failed to add is_deleted column';
    END IF;

    RAISE NOTICE 'Migration 010: Tag ownership and soft delete columns added successfully';
END $$;
