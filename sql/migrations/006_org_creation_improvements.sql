-- Migration 006: Organization Creation Improvements
-- Changes invitation code types for clearer org creation flow

-- 1. Update existing data
UPDATE invitation_codes
SET type = 'org_owner'
WHERE type = 'org_creator';

UPDATE invitation_codes
SET type = 'org_member'
WHERE type = 'org_invite';

-- 2. Drop old constraint
ALTER TABLE invitation_codes
DROP CONSTRAINT IF EXISTS invitation_codes_type_check;

-- 3. Add new constraint with updated types
ALTER TABLE invitation_codes
ADD CONSTRAINT invitation_codes_type_check
CHECK (type IN ('individual', 'org_owner', 'org_member'));

-- 4. Update org_member constraint (was org_invite)
ALTER TABLE invitation_codes
DROP CONSTRAINT IF EXISTS invitation_code_org_check;

ALTER TABLE invitation_codes
ADD CONSTRAINT invitation_code_org_check
CHECK (
  (type = 'org_member' AND org_id IS NOT NULL) OR
  (type = 'org_owner' AND org_id IS NOT NULL) OR
  (type = 'individual')
);

-- 5. Add index for owner codes
CREATE INDEX IF NOT EXISTS idx_invitation_codes_type
ON invitation_codes(type);

COMMENT ON COLUMN invitation_codes.type IS
'Code type: individual (standalone user), org_owner (creates owner for existing org), org_member (joins existing org as member)';
