-- Migration 005: User Management System
-- This migration adds organization support, fixes security issues, and enables sharing
-- Run: psql -U ningli -d annotservice -f sql/migrations/005_user_management_system.sql

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 0: SECURITY FIXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add created_by column to knowledge_entries (CRITICAL: enables user filtering)
-- Root cause fix: knowledge_entries had no user ownership column at all
ALTER TABLE knowledge_entries
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create index for filtering knowledge by user
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_created_by ON knowledge_entries(created_by);

-- 2. Fix system_prompts CASCADE DELETE → SET NULL for safety
-- This prevents accidental deletion of all prompts when a user is deleted
ALTER TABLE system_prompts
DROP CONSTRAINT IF EXISTS system_prompts_user_id_fkey;

ALTER TABLE system_prompts
ADD CONSTRAINT system_prompts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 1: ORGANIZATION FOUNDATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- 3. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create invitation_codes table
CREATE TABLE IF NOT EXISTS invitation_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('individual', 'org_creator', 'org_invite')),
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  -- org_invite type requires org_id, others don't
  CONSTRAINT invitation_code_org_check CHECK (
    (type = 'org_invite' AND org_id IS NOT NULL) OR
    (type != 'org_invite')
  )
);

CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_org_id ON invitation_codes(org_id);

-- 5. Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member'
CHECK (role IN ('super_admin', 'owner', 'member', 'individual'));

CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 1: SHARING COLUMNS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 6. Add sharing columns to documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS allow_edit BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_documents_is_shared ON documents(is_shared);

-- 7. Add sharing columns to knowledge_entries
ALTER TABLE knowledge_entries
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

ALTER TABLE knowledge_entries
ADD COLUMN IF NOT EXISTS allow_edit BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_knowledge_entries_is_shared ON knowledge_entries(is_shared);

-- 8. Add sharing columns to system_prompts
ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS allow_edit BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_system_prompts_is_shared ON system_prompts(is_shared);

-- Add soft delete columns to system_prompts if not exists (from migration 004)
ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_system_prompts_is_deleted ON system_prompts(is_deleted);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DATA MIGRATION: Create Test Organization and migrate existing users
-- ═══════════════════════════════════════════════════════════════════════════════

-- 9. Create Test Organization (only if not exists)
INSERT INTO organizations (id, name, description)
VALUES (1, 'Test Organization', 'Default organization for existing users')
ON CONFLICT DO NOTHING;

-- Reset sequence to avoid conflicts
SELECT setval('organizations_id_seq', COALESCE((SELECT MAX(id) FROM organizations), 1));

-- 10. Update 'admin' user to be super_admin
UPDATE users SET role = 'super_admin' WHERE username = 'admin';

-- 11. Update 'ning' user to be owner of Test Organization
UPDATE users SET role = 'owner', org_id = 1 WHERE username = 'ning';

-- 12. Update all other users to be members of Test Organization
UPDATE users
SET role = 'member', org_id = 1
WHERE username NOT IN ('admin', 'ning') AND org_id IS NULL;

-- 13. Backfill created_by on knowledge_entries
-- Set to the document creator if linked, otherwise to user 'ning' (id=2)
UPDATE knowledge_entries ke
SET created_by = COALESCE(
  (SELECT d.created_by FROM documents d WHERE d.id = ke.source_document_id),
  2  -- Default to 'ning' user
)
WHERE ke.created_by IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- 14. Add updated_at trigger for organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (Run these to verify migration success)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check organizations created
-- SELECT * FROM organizations;

-- Check user roles assigned
-- SELECT id, username, display_name, role, org_id FROM users ORDER BY id;

-- Check knowledge_entries have created_by
-- SELECT id, created_by, source_document_id FROM knowledge_entries LIMIT 10;

-- Check columns added
-- \d documents
-- \d knowledge_entries
-- \d system_prompts
-- \d users

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (if needed)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- -- Remove sharing columns
-- ALTER TABLE documents DROP COLUMN IF EXISTS is_shared;
-- ALTER TABLE documents DROP COLUMN IF EXISTS allow_edit;
-- ALTER TABLE knowledge_entries DROP COLUMN IF EXISTS is_shared;
-- ALTER TABLE knowledge_entries DROP COLUMN IF EXISTS allow_edit;
-- ALTER TABLE system_prompts DROP COLUMN IF EXISTS is_shared;
-- ALTER TABLE system_prompts DROP COLUMN IF EXISTS allow_edit;
--
-- -- Remove user org columns
-- ALTER TABLE users DROP COLUMN IF EXISTS phone;
-- ALTER TABLE users DROP COLUMN IF EXISTS org_id;
-- ALTER TABLE users DROP COLUMN IF EXISTS role;
--
-- -- Remove knowledge created_by
-- ALTER TABLE knowledge_entries DROP COLUMN IF EXISTS created_by;
--
-- -- Drop new tables
-- DROP TABLE IF EXISTS invitation_codes;
-- DROP TABLE IF EXISTS organizations CASCADE;
