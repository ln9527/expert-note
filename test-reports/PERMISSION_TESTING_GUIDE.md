# Permission System Testing Guide

Quick reference for understanding and testing the Expert Note permission system.

---

## Permission Model Overview

### User Roles
| Role | Org | Sees Own | Sees Shared | Sees All |
|------|-----|----------|-------------|----------|
| **super_admin** | NULL | N/A | N/A | ✓ All items |
| **owner** | Yes | ✓ | ✓ All shared in org | ✓ All in org |
| **member** | Yes | ✓ | ✓ Shared in org | ✗ |
| **individual** | NULL | ✓ | ✗ | ✗ |

### Permission Rules by Role

#### Super Admin
```
SELECT * FROM documents
WHERE is_deleted = FALSE
-- No org filtering applied
```

#### Owner
```
SELECT * FROM documents
WHERE is_deleted = FALSE
AND (
  created_by = $userId          -- Own docs
  OR created_by IN (             -- All org member docs
    SELECT id FROM users
    WHERE org_id = $orgId
  )
)
```

#### Member
```
SELECT * FROM documents
WHERE is_deleted = FALSE
AND (
  created_by = $userId          -- Own docs only
  OR (
    is_shared = TRUE            -- Shared docs
    AND created_by IN (         -- From same org
      SELECT id FROM users
      WHERE org_id = $orgId
    )
  )
)
```

#### Individual
```
SELECT * FROM documents
WHERE is_deleted = FALSE
AND created_by = $userId        -- Own docs only
```

---

## Sharing Controls

### View Permission
```typescript
const canView = isOwner ||
                (isShared &&
                 user.orgId &&
                 creatorOrgId &&
                 user.orgId === creatorOrgId);
```

**Requirements**:
- User is creator, OR
- Document is shared AND both users in same org

### Edit Permission
```typescript
const canEdit = isOwner ||
                (isShared &&
                 allowEdit &&        // ← Additional gate
                 user.orgId &&
                 creatorOrgId &&
                 user.orgId === creatorOrgId);
```

**Requirements**:
- User is creator, OR
- Document is shared AND allowEdit=true AND both users in same org

**Note**: Only creator can change is_shared or allow_edit flags

### Delete Permission
```typescript
const canDelete = isOwner;  // Only creator
```

---

## Manual Testing Scenarios

### Scenario 1: Owner Creates Doc, Shares with Member
1. **Owner** creates document: `doc_1`
2. **Owner** sets `is_shared=true, allow_edit=false`
3. **Member** should: See `doc_1` ✓
4. **Member** tries to edit: BLOCKED (403) ✓
5. **Member** from different org: Cannot see ✓

### Scenario 2: Owner Enables Edit for Member
1. **Owner** sets `allow_edit=true` on `doc_1`
2. **Member** updates content: ALLOWED ✓
3. **Member** tries to change `is_shared`: BLOCKED (403) ✓
4. **Member** tries to delete: BLOCKED (403) ✓

### Scenario 3: Cross-Organization Access
1. **Org A member** creates `doc_2` and shares it
2. **Org B member** tries to access: Cannot see (404) ✓
3. **Org B member** tries direct URL: 404 returned ✓

### Scenario 4: Super Admin Access
1. **Super admin** can see all docs across all orgs ✓
2. **Super admin** can update generation guides ✓
3. **Super admin** role cannot be assigned to regular users ✓

### Scenario 5: Private Document Isolation
1. **User A** creates private doc (is_shared=false)
2. **User B** in same org: Cannot see ✓
3. **User A** lists docs: Sees own ✓
4. **User B** lists docs: Doesn't see ✓

---

## Testing with Postman/CLI

### Setup Test Credentials
```bash
# All test users have password: password123
ADMIN_ID=1      # admin
OWNER_ID=2      # ning (org_id=1)
MEMBER_ID=3     # expert1 (org_id=1)
```

### Login Example
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ning",
    "password": "password123"
  }'
```

### Get Documents (With Session)
```bash
# As owner - should see all org docs
curl http://localhost:3000/api/documents \
  -H "Cookie: [session-cookie]"

# As member - should see only shared docs
curl http://localhost:3000/api/documents \
  -H "Cookie: [session-cookie]"
```

### Create and Share Document
```bash
# Create
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "Test Doc",
    "content": "Test content"
  }'

# Share (as owner)
curl -X PUT http://localhost:3000/api/documents/[doc-id] \
  -H "Content-Type: application/json" \
  -d '{
    "isShared": true,
    "allowEdit": false
  }'
```

### Test Permission Denial
```bash
# Try to edit as member (allowEdit=false)
curl -X PUT http://localhost:3000/api/documents/[doc-id] \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Modified content"
  }'
# Expected: 403 Forbidden
```

---

## SQL Queries for Verification

### Check User Organization
```sql
SELECT id, username, role, org_id FROM users;
```

### Check Document Sharing
```sql
SELECT id, filename, created_by, is_shared, allow_edit
FROM documents
WHERE deleted_at IS NULL;
```

### Check Organization Membership
```sql
SELECT u.id, u.username, o.id, o.name
FROM users u
LEFT JOIN organizations o ON u.org_id = o.id;
```

### Test Visibility Query (Member)
```sql
-- What docs should member see?
SELECT d.id, d.filename, d.created_by, u.username, d.is_shared
FROM documents d
JOIN users u ON d.created_by = u.id
WHERE d.deleted_at IS NULL
AND (
  d.created_by = 3  -- member_id
  OR (
    d.is_shared = TRUE
    AND d.created_by IN (
      SELECT id FROM users WHERE org_id = 1  -- member's org_id
    )
  )
);
```

---

## Error Responses

### 404 Not Found (Resource Doesn't Exist OR No Permission)
```json
{
  "success": false,
  "error": "Document not found"
}
```
**When**: User lacks permission to view resource
**Why**: Prevents enumeration of which docs exist

### 403 Forbidden (Resource Exists But No Edit Permission)
```json
{
  "success": false,
  "error": "You do not have permission to edit this document"
}
```
**When**: User can view but cannot edit/delete
**Why**: More specific error for debugging

---

## Files to Review

### Core Permission Logic
- `src/lib/db/queries/documents.ts` - Document visibility queries
- `src/lib/db/queries/knowledge.ts` - Knowledge entry visibility
- `src/lib/db/queries/prompts.ts` - System prompt visibility

### API Permission Checks
- `src/app/api/documents/[id]/route.ts` - Document edit/view checks
- `src/app/api/knowledge/[id]/route.ts` - Knowledge edit/view checks
- `src/app/api/prompts/route.ts` - Prompt list visibility

### Database Schema
- `sql/schema.sql` - Base schema (users, documents, etc.)
- `sql/migrations/005_user_management_system.sql` - Org and sharing columns
- `sql/migrations/007_org_creation_improvements.sql` - Invitation code updates

---

## Debugging Tips

### Enable SQL Logging
Set in `src/lib/db/connection.ts`:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[DB] Query executed', {
    text: text.substring(0, 100),
    duration: `${duration}ms`,
    rows: result.rowCount,
  });
}
```

### Check Session User
In API routes:
```typescript
const user = await getSessionUser();
console.log('User:', user);
// { userId: 2, username: 'ning', role: 'owner', orgId: 1 }
```

### Verify Creator Info
Documents/knowledge entries include creator:
```typescript
entry.creator?.orgId  // Creator's org_id for comparisons
entry.creator?.username  // For debugging
```

### Common Issues
- **User sees nothing**: Check role is set correctly
- **Member sees all docs**: Check is_shared flag is being set
- **Cross-org access**: Verify orgId comparison logic
- **Edit not blocked**: Verify allowEdit=false is set

---

## Quick Checklist for New Features

When adding new shareable entities:

- [ ] Add `is_shared BOOLEAN DEFAULT FALSE` column
- [ ] Add `allow_edit BOOLEAN DEFAULT FALSE` column
- [ ] Add `created_by INTEGER REFERENCES users(id)` column
- [ ] Add `org_id` query parameters to visibility function
- [ ] Implement role-based visibility in query function
- [ ] Add permission checks in API route (view, edit, delete)
- [ ] Return 404 for permission denied (not 403)
- [ ] Test with owner, member, and individual roles
- [ ] Test cross-org access (should be blocked)

---

**Last Updated**: January 12, 2026
**Related**: PERMISSION_SYSTEM_TEST_REPORT.md, TEST_RESULTS_SUMMARY.md
