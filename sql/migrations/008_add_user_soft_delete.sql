-- Migration: 008_add_user_soft_delete.sql
-- Description: Add soft delete support for users
-- Date: 2026-01-13

-- Add deleted_at column for soft delete
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for efficient filtering of non-deleted users
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'deleted_at'
    ) THEN
        RAISE NOTICE 'Migration 008: deleted_at column added successfully';
    ELSE
        RAISE EXCEPTION 'Migration 008: Failed to add deleted_at column';
    END IF;
END $$;
