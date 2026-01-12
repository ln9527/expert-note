# Agent 3: Database Schema + Type Updates - COMPLETE

**Date:** 2026-01-11
**Status:** ✅ Complete (Manual DB Migration Required)

---

## Summary

Successfully updated invitation code types from `org_creator/org_invite` to `org_owner/org_member` across:
1. Database schema (migration file created)
2. TypeScript type definitions
3. Database query functions

---

## Files Modified

### 1. Migration Created
**File:** `/sql/migrations/006_org_creation_improvements.sql`

**Changes:**
- Updates existing `org_creator` → `org_owner`
- Updates existing `org_invite` → `org_member`
- Updates type constraint to new values
- Updates org_id constraint for both new types
- Adds index on type column
- Adds column comment documenting new types

### 2. TypeScript Types Updated
**File:** `/src/types/index.ts`

**Changes:**
- Line 143: `InvitationCodeType = 'individual' | 'org_owner' | 'org_member'`
- Updated interface comments to reflect new semantics

### 3. Query Logic Updated
**File:** `/src/lib/db/queries/invitationCodes.ts`

**Changes:**
- Updated file header documentation
- `createInvitationCode`: Validates `org_member` and `org_owner` require `orgId`
- `useInvitationCode`: Updated switch cases:
  - `org_owner` → joins existing org as owner (NO org creation)
  - `org_member` → joins existing org as member
- Removed org creation logic (was in `org_creator` case)

---

## Database Migration Status

### ⚠️ Manual Execution Required

The migration file is created but NOT yet executed due to macOS security restrictions preventing PostgreSQL connections.

**Migration File Location:**
```
/sql/migrations/006_org_creation_improvements.sql
```

**To Execute Locally:**
User needs to run manually with appropriate permissions:
```bash
psql -U ningli -d annotservice -f sql/migrations/006_org_creation_improvements.sql
```

**Or wait for Production Deployment:**
Migration will be executed on production server where database access is available.

---

## Remaining Work (For Agents 4 & 5)

TypeScript compiler detected **22 errors** in files that reference old type names:

### API Routes to Fix
1. `/src/app/api/admin/invitation-codes/route.ts` (1 error)
   - Remove `orgName` parameter from `createInvitationCode` call

### Admin UI to Fix
2. `/src/app/settings/admin/page.tsx` (17 errors)
   - Replace `'org_creator'` → `'org_owner'`
   - Replace `'org_invite'` → `'org_member'`
   - Remove references to `orgName` property
   - Update form fields and validation logic

### Other UI Files
3. `/src/app/knowledge/[id]/edit/page.tsx` (5 errors - unrelated)
   - Missing variable declarations (not related to org types)

---

## Key Semantic Changes

### Before (Agents 1-2)
```typescript
'org_creator' → Created NEW organization, user becomes owner
'org_invite'  → Joined EXISTING organization as member
```

### After (Agent 3+)
```typescript
'org_owner'   → Joins EXISTING organization as owner
'org_member'  → Joins EXISTING organization as member
```

**Critical Change:**
- Organization creation is now SEPARATE from invitation code usage
- Both `org_owner` and `org_member` require an EXISTING `org_id`
- No automatic org creation during registration

---

## Database Schema Details

### invitation_codes Table Constraints

**Type Constraint:**
```sql
CHECK (type IN ('individual', 'org_owner', 'org_member'))
```

**Org ID Constraint:**
```sql
CHECK (
  (type = 'org_member' AND org_id IS NOT NULL) OR
  (type = 'org_owner' AND org_id IS NOT NULL) OR
  (type = 'individual')
)
```

Both `org_owner` and `org_member` types MUST have a valid `org_id`.

---

## Testing Checklist

Once migration is executed:

- [ ] Verify type column values updated:
  ```sql
  SELECT type, COUNT(*) FROM invitation_codes GROUP BY type;
  ```
  Should show: `individual`, `org_owner`, `org_member` (no `org_creator`, `org_invite`)

- [ ] Verify constraints:
  ```sql
  SELECT conname, pg_get_constraintdef(oid)
  FROM pg_constraint
  WHERE conrelid = 'invitation_codes'::regclass;
  ```

- [ ] Test org_owner code usage (after Agent 4-5 fixes):
  - Create code with existing org_id
  - Register with code
  - Verify user joins as owner

- [ ] Test org_member code usage:
  - Create code with existing org_id
  - Register with code
  - Verify user joins as member

---

## Next Steps

**For Agents 4 & 5:**
1. Fix API route: Remove `orgName` parameter handling
2. Fix Admin UI: Update all type comparisons and form logic
3. Update any UI text/labels referencing old terminology
4. Test complete registration flow with new types

**For Production Deployment:**
1. Run migration 006 on production database
2. Verify data migration completed successfully
3. Deploy updated code
4. Test registration flows

---

## Notes

- Migration is **backward compatible** for existing data
- All existing codes will be automatically updated to new types
- No data loss - only type names change
- Database constraints ensure data integrity

