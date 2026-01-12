-- Migration 007: Organization Creation Improvements
-- Updates invitation code types for clearer flow
-- Run: psql -U ningli -d annotservice -f sql/migrations/007_org_creation_improvements.sql

BEGIN;

-- 1. Drop old constraints FIRST (before updating data)
ALTER TABLE invitation_codes
DROP CONSTRAINT IF EXISTS invitation_codes_type_check;

ALTER TABLE invitation_codes
DROP CONSTRAINT IF EXISTS invitation_code_org_check;

-- 2. Delete any org_creator codes that have org_name but no org_id
-- These were never used and can't be migrated cleanly
DELETE FROM invitation_codes
WHERE type = 'org_creator' AND org_id IS NULL;

-- 3. Update existing invitation code types
UPDATE invitation_codes
SET type = 'org_owner'
WHERE type = 'org_creator';

UPDATE invitation_codes
SET type = 'org_member'
WHERE type = 'org_invite';

-- 3. Add new constraint with updated types
ALTER TABLE invitation_codes
ADD CONSTRAINT invitation_codes_type_check
CHECK (type IN ('individual', 'org_owner', 'org_member'));

-- 4. Update org constraint
ALTER TABLE invitation_codes
DROP CONSTRAINT IF EXISTS invitation_code_org_check;

ALTER TABLE invitation_codes
ADD CONSTRAINT invitation_code_org_check
CHECK (
  (type = 'org_member' AND org_id IS NOT NULL) OR
  (type = 'org_owner' AND org_id IS NOT NULL) OR
  (type = 'individual')
);

-- 5. Remove org_name column (no longer needed)
ALTER TABLE invitation_codes
DROP COLUMN IF EXISTS org_name;

-- 6. Add helpful comment
COMMENT ON COLUMN invitation_codes.type IS
'individual: standalone user | org_owner: joins existing org as owner | org_member: joins existing org as member';

COMMIT;
