-- Migration: Add soft delete support to system_prompts and knowledge_entries
-- Date: 2026-01-07
-- Description: Adds is_deleted and deleted_at columns to enable trash/recycle bin functionality

-- Add soft delete columns to system_prompts
ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add soft delete columns to knowledge_entries
ALTER TABLE knowledge_entries
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add indexes for efficient filtering of non-deleted items
CREATE INDEX IF NOT EXISTS idx_system_prompts_is_deleted ON system_prompts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_is_deleted ON knowledge_entries(is_deleted);

-- Update existing records to have is_deleted = FALSE (in case column was added as NULL)
UPDATE system_prompts SET is_deleted = FALSE WHERE is_deleted IS NULL;
UPDATE knowledge_entries SET is_deleted = FALSE WHERE is_deleted IS NULL;
