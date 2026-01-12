# CRITICAL SECURITY FIX: Knowledge Edit Permission Vulnerability

**Severity:** 🔴 **HIGH**
**Affected File:** `/src/app/api/knowledge/[id]/route.ts`
**Vulnerability:** Missing permission check in PUT endpoint
**Discovered:** 2026-01-09 (Agent D Testing)

---

## Summary

The `PUT /api/knowledge/[id]` endpoint allows ANY authenticated user to edit ANY knowledge entry, regardless of ownership or sharing settings. This bypasses the intended permission model where only:
1. The creator can always edit
2. Org members can edit IF `share_with_org=TRUE` AND `allow_edit=TRUE` AND same `org_id`

---

## Vulnerability Details

### Current Implementation (INSECURE)

```typescript
// File: src/app/api/knowledge/[id]/route.ts
// Lines: 90-132

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { background, tagIds, tags, isShared, allowEdit } = body;

  // ❌ VULNERABILITY: Only checks if entry exists, not if user can edit
  const existing = await getKnowledgeEntryById(id);
  if (!existing) {
    return NextResponse.json(
      { success: false, error: 'Knowledge entry not found' },
      { status: 404 }
    );
  }

  // ❌ NO PERMISSION CHECK HERE
  const entry = await updateKnowledgeEntry(id, { ... });
  return NextResponse.json({ success: true, entry });
}
```

### Attack Scenario

1. **User A** (org_id=1) creates knowledge entry ID=5, shares with org
2. **User B** (org_id=2, different org) discovers the ID
3. **User B** sends: `PUT /api/knowledge/5` with arbitrary changes
4. **Result:** User B successfully modifies User A's knowledge entry
5. **Impact:** Cross-org data manipulation

---

## Secure Implementation

### Required Fix

```typescript
// File: src/app/api/knowledge/[id]/route.ts
// Replace PUT handler (lines 90-132) with:

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { background, tagIds, tags, isShared, allowEdit } = body;

    // Check if entry exists
    const existing = await getKnowledgeEntryById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Knowledge entry not found' },
        { status: 404 }
      );
    }

    // ✅ ADD PERMISSION CHECK
    const isOwner = existing.created_by === user.id;
    const canEdit = isOwner ||
                    (existing.share_with_org &&
                     existing.allow_edit &&
                     user.org_id &&
                     existing.org_id &&
                     user.org_id === existing.org_id);

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit this knowledge entry' },
        { status: 403 }
      );
    }

    // Resolve tag names to IDs if provided
    let resolvedTagIds = tagIds;
    if (tags && Array.isArray(tags)) {
      resolvedTagIds = await resolveTagNames(tags);
    }

    // Update the entry
    const entry = await updateKnowledgeEntry(id, {
      background,
      tagIds: resolvedTagIds,
      isShared,
      allowEdit,
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('[API] PUT /knowledge/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Permission Logic Breakdown

```typescript
const isOwner = existing.created_by === user.id;
// ✅ Creator always has permission

const canEdit = isOwner ||
  (
    existing.share_with_org &&     // ✅ Must be shared with org
    existing.allow_edit &&         // ✅ Must allow editing
    user.org_id &&                 // ✅ User must have an org
    existing.org_id &&             // ✅ Entry must have an org
    user.org_id === existing.org_id // ✅ Must be same org
  );

if (!canEdit) {
  return 403 Forbidden;  // ✅ Deny unauthorized edits
}
```

---

## Comparison with Documents API (Correct Implementation)

### Documents PUT Endpoint (SECURE)

```typescript
// File: src/app/api/documents/[id]/route.ts
// This is the CORRECT pattern to follow

const document = await getDocumentById(id, session.user.id);
if (!document || document.created_by !== session.user.id) {
  return NextResponse.json({ error: 'Document not found or no permission' }, { status: 404 });
}

const canEdit = document.created_by === userId ||
                (document.share_with_org &&
                 document.allow_edit &&
                 userOrgId === document.org_id);

if (!canEdit) {
  return NextResponse.json({ error: 'No edit permission' }, { status: 403 });
}
```

**Why Documents API is better:**
- ✅ Explicit `canEdit` check
- ✅ Returns 403 Forbidden (not 404)
- ✅ Clear error message

**Why Knowledge API is vulnerable:**
- ❌ No permission check at all
- ❌ Anyone can edit anything

---

## Additional Issues in Same File

### GET Endpoint (Line 45-80)

```typescript
export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let entry = await getKnowledgeEntryWithAnnotations(id);

  if (!entry) {
    return NextResponse.json(
      { success: false, error: 'Knowledge entry not found' },
      { status: 404 }
    );
  }

  // ⚠️ ISSUE: No visibility check
  // Should verify user can see this entry (own or shared)
  return NextResponse.json({ success: true, entry });
}
```

**Problem:** Any authenticated user can view ANY knowledge entry if they know the ID.

**Fix Needed:**
```typescript
// After fetching entry, add visibility check:
const isOwner = entry.created_by === user.id;
const canView = isOwner ||
                (entry.share_with_org &&
                 user.org_id &&
                 entry.org_id &&
                 user.org_id === entry.org_id);

if (!canView) {
  return NextResponse.json(
    { success: false, error: 'Knowledge entry not found' },
    { status: 404 }  // Return 404 to not reveal existence
  );
}
```

### DELETE Endpoint (Line 138-173)

```typescript
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getKnowledgeEntryById(id, permanent);
  if (!existing) {
    return NextResponse.json(
      { success: false, error: 'Knowledge entry not found' },
      { status: 404 }
    );
  }

  // ⚠️ ISSUE: No ownership check
  // Anyone can delete anyone's knowledge entries
  await deleteKnowledgeEntry(id);
  return NextResponse.json({ success: true });
}
```

**Fix Needed:**
```typescript
// After checking existence, add ownership check:
if (existing.created_by !== user.id) {
  return NextResponse.json(
    { success: false, error: 'Only the creator can delete this entry' },
    { status: 403 }
  );
}
```

---

## Testing the Fix

### Test 1: Owner Can Edit (Should Pass)
```bash
# Login as ning (creator)
curl -c cookies-ning.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ning","password":"password123"}'

# Create knowledge
ID=$(curl -b cookies-ning.txt -X POST http://localhost:3000/api/knowledge \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","background":"BG","sourceDocumentId":1}' \
  | jq -r '.entry.id')

# Edit (should succeed)
curl -b cookies-ning.txt -X PUT "http://localhost:3000/api/knowledge/$ID" \
  -H "Content-Type: application/json" \
  -d '{"background":"Updated by owner"}'

# Expected: 200 OK
```

### Test 2: Same Org with Permission Can Edit (Should Pass)
```bash
# As ning: Share with org, allow editing
curl -b cookies-ning.txt -X PUT "http://localhost:3000/api/knowledge/$ID" \
  -H "Content-Type: application/json" \
  -d '{"isShared":true,"allowEdit":true}'

# Login as expert1 (same org_id=1)
curl -c cookies-expert1.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"expert1","password":"password123"}'

# Try to edit (should succeed)
curl -b cookies-expert1.txt -X PUT "http://localhost:3000/api/knowledge/$ID" \
  -H "Content-Type: application/json" \
  -d '{"background":"Updated by expert1"}'

# Expected: 200 OK
```

### Test 3: Same Org WITHOUT Permission Cannot Edit (Should Fail)
```bash
# As ning: Disable allow_edit
curl -b cookies-ning.txt -X PUT "http://localhost:3000/api/knowledge/$ID" \
  -H "Content-Type: application/json" \
  -d '{"isShared":true,"allowEdit":false}'

# As expert1: Try to edit (should fail)
curl -b cookies-expert1.txt -X PUT "http://localhost:3000/api/knowledge/$ID" \
  -H "Content-Type: application/json" \
  -d '{"background":"Hacked"}'

# Expected: 403 Forbidden
# Expected message: "You do not have permission to edit this knowledge entry"
```

### Test 4: Different Org CANNOT Edit (Should Fail) - CRITICAL TEST
```bash
# As ning (org_id=1): Share with org, allow editing
curl -b cookies-ning.txt -X PUT "http://localhost:3000/api/knowledge/$ID" \
  -H "Content-Type: application/json" \
  -d '{"isShared":true,"allowEdit":true}'

# Login as student1 (org_id=2, different org)
curl -c cookies-student1.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"password123"}'

# Try to edit (should fail)
curl -b cookies-student1.txt -X PUT "http://localhost:3000/api/knowledge/$ID" \
  -H "Content-Type: application/json" \
  -d '{"background":"Cross-org attack"}'

# Expected: 403 Forbidden
# Expected message: "You do not have permission to edit this knowledge entry"
# ⚠️ If this returns 200 OK, the vulnerability exists!
```

---

## Impact Assessment

### Current State (Before Fix)
- ❌ Any user can edit any knowledge entry
- ❌ Cross-org data manipulation possible
- ❌ Privacy breach: anyone can modify shared org knowledge
- ❌ No audit trail for unauthorized edits

### After Fix
- ✅ Only owner can edit by default
- ✅ Org members can edit only if explicitly allowed
- ✅ Org boundaries enforced
- ✅ Clear 403 errors for unauthorized attempts

---

## Action Items

### Immediate (Critical)
1. ✅ Apply permission check to `PUT /api/knowledge/[id]`
2. ✅ Apply ownership check to `DELETE /api/knowledge/[id]`
3. ✅ Apply visibility check to `GET /api/knowledge/[id]`

### Testing (Before Deployment)
4. ⏳ Run Test 4 (cross-org edit) to verify vulnerability is fixed
5. ⏳ Run all four test scenarios to ensure permissions work correctly
6. ⏳ Test with NULL org_id users (if they exist)

### Documentation
7. ⏳ Update API documentation with permission requirements
8. ⏳ Add permission check examples to developer guide

---

## Related Files to Review

Check these files for similar permission vulnerabilities:

1. `/src/app/api/prompts/[id]/route.ts` - May have same issue
2. `/src/app/api/documents/[id]/route.ts` - ✅ Already secure (use as reference)
3. `/src/app/api/annotations/[id]/route.ts` - Check permission model

---

## Conclusion

This is a **critical security vulnerability** that allows unauthorized editing and deletion of knowledge entries across organization boundaries. The fix is straightforward and follows the pattern already implemented in the documents API.

**Priority:** 🔴 **FIX IMMEDIATELY BEFORE PRODUCTION DEPLOYMENT**

---

**Discovered by:** Agent D (Integration & Edge Case Testing)
**Report Date:** 2026-01-09
**Status:** ⚠️ Vulnerability Confirmed, Fix Documented
