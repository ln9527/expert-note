-- Migration: 009_multiuse_codes_org_softdelete.sql
-- Description: Multi-use invitation codes, org soft delete, email field, username rename on delete
-- Date: 2026-01-14

-- ============================================================================
-- PART 1: Multi-use invitation codes
-- ============================================================================

-- Add max_uses and current_uses columns to invitation_codes
ALTER TABLE invitation_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1;
ALTER TABLE invitation_codes ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;

-- Update existing codes: set max_uses=1, current_uses based on used_by
UPDATE invitation_codes
SET max_uses = 1, current_uses = CASE WHEN used_by IS NOT NULL THEN 1 ELSE 0 END
WHERE max_uses IS NULL OR current_uses IS NULL;

-- For existing org_owner codes, set to unlimited (0) so orgs can have multiple owners
UPDATE invitation_codes
SET max_uses = 0
WHERE type = 'org_owner' AND used_by IS NULL;

-- ============================================================================
-- PART 2: Organization soft delete
-- ============================================================================

-- Add deleted_at column to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at ON organizations(deleted_at);

-- ============================================================================
-- PART 3: Email field for users
-- ============================================================================

-- Add email column to users (optional)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- PART 4: Phone index for uniqueness checks
-- ============================================================================

-- Add index for phone lookups (phone already nullable)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    -- Check invitation_codes columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'invitation_codes' AND column_name = 'max_uses'
    ) THEN
        RAISE EXCEPTION 'Migration 009: Failed to add max_uses column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'invitation_codes' AND column_name = 'current_uses'
    ) THEN
        RAISE EXCEPTION 'Migration 009: Failed to add current_uses column';
    END IF;

    -- Check organizations deleted_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'deleted_at'
    ) THEN
        RAISE EXCEPTION 'Migration 009: Failed to add organizations.deleted_at column';
    END IF;

    -- Check users email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email'
    ) THEN
        RAISE EXCEPTION 'Migration 009: Failed to add email column';
    END IF;

    RAISE NOTICE 'Migration 009: All columns added successfully';
END $$;
