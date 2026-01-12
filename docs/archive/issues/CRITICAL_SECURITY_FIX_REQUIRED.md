# 🔴 CRITICAL SECURITY FIX REQUIRED

**DO NOT DEPLOY TO PRODUCTION UNTIL THIS IS FIXED**

---

## The Problem

**File:** `/src/app/api/knowledge/[id]/route.ts`
**Vulnerability:** Missing permission checks in PUT, GET, DELETE endpoints

### Current Behavior (INSECURE)
```typescript
// Anyone can edit anyone's knowledge entries
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  const { id } = await params;
  const existing = await getKnowledgeEntryById(id);
  if (!existing) { return 404; }

  // ❌ NO PERMISSION CHECK - ANYONE CAN EDIT!
  await updateKnowledgeEntry(id, { ... });
  return 200;
}
```

### Attack Demo
```bash
# User from org_id=2 successfully edits entry from org_id=1
curl -X PUT /api/knowledge/123 -d '{"background":"Hacked"}'
# Returns: 200 OK (SHOULD BE 403!)
```

---

## The Fix

**Add permission check before update:**

```typescript
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) { return 401; }

  const { id } = await params;
  const existing = await getKnowledgeEntryById(id);
  if (!existing) { return 404; }

  // ✅ ADD THIS PERMISSION CHECK
  const isOwner = existing.created_by === user.id;
  const canEdit = isOwner ||
                  (existing.share_with_org &&
                   existing.allow_edit &&
                   user.org_id &&
                   existing.org_id &&
                   user.org_id === existing.org_id);

  if (!canEdit) {
    return NextResponse.json(
      { error: 'No permission to edit' },
      { status: 403 }
    );
  }

  // Now safe to update
  await updateKnowledgeEntry(id, { ... });
  return 200;
}
```

---

## Apply Same Fix To

1. **PUT endpoint** (line 90-132) - Edit permission
2. **GET endpoint** (line 45-80) - View permission
3. **DELETE endpoint** (line 138-173) - Delete permission (owner only)

---

## How to Verify Fix

```bash
# Test: Cross-org user tries to edit
# Expected: 403 Forbidden
# Current: 200 OK (VULNERABILITY!)

# 1. Login as user from different org
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -d '{"username":"student1","password":"password123"}'

# 2. Try to edit knowledge entry from different org
curl -b cookies.txt -X PUT http://localhost:3000/api/knowledge/1 \
  -H "Content-Type: application/json" \
  -d '{"background":"Cross-org attack"}'

# BEFORE FIX: Returns 200 (success) ❌
# AFTER FIX: Returns 403 (forbidden) ✅
```

---

## Complete Documentation

- **Full Fix:** `/docs/SECURITY_FIX_KNOWLEDGE_EDIT.md` (detailed patch)
- **Test Report:** `/docs/AGENT_D_TEST_REPORT.md` (full analysis)
- **Summary:** `/docs/AGENT_D_FINAL_SUMMARY.md` (executive summary)

---

## Reference: Correct Pattern (from Documents API)

```typescript
// Use this pattern from /api/documents/[id]/route.ts
const canEdit = document.created_by === userId ||
                (document.share_with_org &&
                 document.allow_edit &&
                 userOrgId &&
                 document.org_id &&
                 userOrgId === document.org_id);

if (!canEdit) {
  return NextResponse.json({ error: 'No permission' }, { status: 403 });
}
```

---

**Priority:** 🔴 CRITICAL - Fix immediately
**Impact:** High - Cross-org data manipulation
**Effort:** Low - 30 min fix + testing
**Discovered:** 2026-01-09 by Agent D

---
