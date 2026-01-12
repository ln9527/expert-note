# Agent D: Integration & Edge Case Testing Report
**Date:** 2026-01-09
**Server:** http://localhost:3000
**Status:** ⚠️ Partial Testing - Server Permission Issues

## Executive Summary

Due to sandbox restrictions preventing server startup, I conducted a comprehensive **code review and static analysis** approach instead of live browser testing. This report documents:
1. Integration points between features
2. Potential edge cases identified through code analysis
3. Database query validation
4. Recommendations for manual testing

---

## Testing Environment Issues

### Issue 1: Server Permission Error
- **Problem:** Dev server fails to start with `EPERM: operation not permitted 0.0.0.0:3000`
- **Cause:** Sandbox restrictions prevent binding to 0.0.0.0
- **Solution:** User needs to run `npm run dev` manually outside Claude Code sandbox

### Issue 2: Browser Automation Tool Restrictions
- **Blocked Tools:** `browser_fill_form`, `browser_console_messages`, `browser_network_requests`
- **Impact:** Cannot perform live integration testing
- **Alternative:** Static code analysis + database query validation

---

## Code Review Findings

### ✅ 1. Org Visibility Implementation

#### Documents Feature
**File:** `src/lib/db/queries/documents.ts`

**Query Logic:**
```typescript
// Non-admin users see:
// 1. Their own documents (created_by = user_id)
// 2. Shared documents where share_with_org = TRUE AND org_id matches
WHERE (d.created_by = $1 OR (d.share_with_org = TRUE AND u.org_id = d.org_id))
```

**✅ Strengths:**
- Correctly uses OR logic for own vs shared documents
- Includes org_id matching for shared items
- Filters out deleted items (`WHERE d.is_deleted = FALSE`)
- Admin bypass implemented (`WHERE (role = 'super_admin' OR ...)`)

**⚠️ Potential Issues:**
- No explicit handling of NULL org_id (users without org)
- Query doesn't validate that shared documents have valid org_id

#### Knowledge Feature
**File:** `src/lib/db/queries/knowledge.ts`

**Query Logic:**
```typescript
WHERE (k.created_by = $1 OR (k.share_with_org = TRUE AND u.org_id = k.org_id))
```

**✅ Consistent with Documents:**
- Same visibility pattern
- Proper soft delete filtering
- Admin bypass

**⚠️ Same Concerns:**
- NULL org_id edge case
- No validation that k.org_id references valid org

#### Prompts Feature
**File:** `src/lib/db/queries/prompts.ts`

**Query Logic:**
```typescript
WHERE (sp.created_by = $1 OR (sp.share_with_org = TRUE AND u.org_id = sp.org_id))
```

**✅ Consistency Achievement:**
- All three entities use identical visibility pattern
- Good architectural consistency

---

### ✅ 2. Creator Info Display

#### Implementation Review

**Documents Table Component:**
```typescript
// Column: "Uploaded By"
<td>{doc.created_by_name || 'Unknown'}</td>
```

**Knowledge Cards:**
```typescript
<p className="text-sm text-gray-500">
  Created by {entry.created_by_name || 'Unknown'}
</p>
```

**Prompts List:**
```typescript
<p>Created by: {prompt.created_by_name || 'Unknown'}</p>
```

**✅ Strengths:**
- Consistent fallback to 'Unknown' for missing names
- Uses LEFT JOIN to include creator name in queries
- All three features display creator information

**Database JOIN:**
```sql
LEFT JOIN users u2 ON d.created_by = u2.id
SELECT u2.username as created_by_name
```

**✅ Verified:** All queries properly join users table for creator names

---

### ⚠️ 3. Permission Boundaries

#### Edit Permission Implementation

**Documents:**
```typescript
// API: /api/documents/[id]/route.ts
const canEdit = document.created_by === userId ||
                (document.share_with_org && document.allow_edit && userOrgId === document.org_id);

if (!canEdit) {
  return NextResponse.json({ error: 'No edit permission' }, { status: 403 });
}
```

**✅ Logic Correct:**
- Owner can always edit
- Shared users can edit ONLY if `allow_edit = TRUE`
- Org membership verified

**⚠️ Potential Issue:**
```typescript
userOrgId === document.org_id
```
- **Problem:** No NULL checks
- **Edge Case:** If user has NULL org_id, comparison might behave unexpectedly
- **Recommendation:** Add explicit NULL check: `userOrgId && document.org_id && userOrgId === document.org_id`

#### Knowledge Edit Permissions
**File:** `src/app/knowledge/[id]/edit/page.tsx`

```typescript
if (entry.created_by !== session.user.id) {
  if (!entry.share_with_org || !entry.allow_edit) {
    redirect('/knowledge');
  }
}
```

**⚠️ Inconsistency Found:**
- This check is LESS strict than documents API
- Missing org_id validation
- Could allow users from different orgs to edit if share_with_org=TRUE

**🔴 Security Issue:**
```typescript
// Current: Any user can edit if share_with_org=TRUE and allow_edit=TRUE
// Should be: Only users IN THE SAME ORG can edit

// Fix needed:
if (entry.created_by !== session.user.id) {
  if (!entry.share_with_org ||
      !entry.allow_edit ||
      session.user.org_id !== entry.org_id) {
    redirect('/knowledge');
  }
}
```

---

### ⚠️ 4. Multi-User Edge Cases

#### Scenario: Shared Document Deletion

**Current Behavior:**
```typescript
// DELETE /api/documents/[id]
const document = await getDocumentById(id, session.user.id);
if (!document || document.created_by !== session.user.id) {
  return NextResponse.json({ error: 'Document not found or no permission' }, { status: 404 });
}
```

**✅ Correct:** Only creator can delete (even if shared)

**Implications:**
- Shared users can view but cannot delete
- If creator deletes → moves to trash → disappears for all users
- **Question:** Should shared users see "Deleted by owner" message?

#### Scenario: Restore from Trash

**Implementation:**
```typescript
// PATCH /api/documents/[id] with action='restore'
const document = await getDocumentById(id, session.user.id, { includeDeleted: true });
if (document.created_by !== session.user.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

**✅ Correct:** Only creator can restore

**Edge Case:**
- If document was shared before deletion, does it automatically re-share after restore?
- **Answer:** YES - share_with_org flag persists through soft delete
- **Verified in schema:** No trigger clears share_with_org on deletion

---

### ✅ 5. Trash System Integration

#### Shared Items in Trash

**Query Logic:**
```typescript
// /api/trash GET
const documents = await pool.query(`
  SELECT d.*, u.username as created_by_name
  FROM documents d
  LEFT JOIN users u ON d.created_by = u.id
  WHERE d.is_deleted = TRUE AND d.created_by = $1
`, [userId]);
```

**✅ Correct Behavior:**
- Only creators see deleted items in their trash
- Shared users do NOT see deleted shared items
- After restore, shared users see item again

**Permanent Delete:**
```typescript
// DELETE /api/trash?type=document&id=X
// Only creator can permanently delete
if (document.created_by !== userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

**✅ Security:** Proper authorization check

---

### ⚠️ 6. Navigation & Redirects

#### Role-Based Redirects

**Middleware:** `src/middleware.ts`
```typescript
if (session.user.role === 'super_admin') {
  return NextResponse.redirect(new URL('/admin', request.url));
}
return NextResponse.redirect(new URL('/', request.url));
```

**✅ Implementation:** Admins redirected to /admin, others to /

**Potential Issue:**
- No handling of expired sessions during navigation
- If session expires mid-browse, user might see errors instead of login redirect

#### Direct URL Access

**Protection:** All pages use `getSession()` and redirect if no session
```typescript
const session = await getSession();
if (!session) {
  redirect('/login');
}
```

**✅ Protected Routes:** All authenticated pages check session

**Edge Case:**
- What if user navigates to `/documents/123` for a document they can't access?
- **Current Behavior:** `getDocumentById()` returns null → 404 error
- **Better UX:** Could show "No permission" message vs generic 404

---

## Database Query Validation

### Org Visibility Queries

Let me validate the actual SQL logic:

**Test Query 1: User's Own Documents**
```sql
SELECT COUNT(*) FROM documents
WHERE created_by = 2 AND is_deleted = FALSE;
-- Expected: All documents created by user ID 2
```

**Test Query 2: Shared Documents**
```sql
SELECT d.* FROM documents d
JOIN users u ON u.id = 2
WHERE d.share_with_org = TRUE
  AND u.org_id = d.org_id
  AND d.is_deleted = FALSE
  AND d.created_by != 2;
-- Expected: Documents shared with user 2's org (excluding own)
```

**Test Query 3: Combined (What User Sees)**
```sql
SELECT d.* FROM documents d
JOIN users u ON u.id = 2
WHERE (d.created_by = 2 OR (d.share_with_org = TRUE AND u.org_id = d.org_id))
  AND d.is_deleted = FALSE;
-- Expected: Own + Shared documents
```

**✅ SQL Logic:** Queries are logically sound

---

## Identified Edge Cases & Recommendations

### 🔴 Critical Issues

1. **Knowledge Edit Permission Vulnerability**
   - **Issue:** Missing org_id check in edit page
   - **Impact:** Users from different orgs could edit shared knowledge
   - **Fix:** Add `session.user.org_id !== entry.org_id` check
   - **File:** `src/app/knowledge/[id]/edit/page.tsx`

2. **NULL org_id Handling**
   - **Issue:** No explicit NULL checks in permission logic
   - **Impact:** Unpredictable behavior for users without org
   - **Fix:** Add null safety: `userOrgId && document.org_id && ...`
   - **Files:** All permission checks in API routes

### ⚠️ Important Issues

3. **Shared Item Deletion UX**
   - **Issue:** When creator deletes shared item, it disappears for shared users with no message
   - **Recommendation:** Show notification "Item removed by owner"
   - **Complexity:** Requires tracking "last seen" state

4. **Direct URL Access Error Messages**
   - **Issue:** 404 errors for permission denied vs not found
   - **Recommendation:** Return 403 Forbidden with clear message
   - **Files:** All `[id]` API routes

### ℹ️ Minor Issues

5. **Session Expiration During Navigation**
   - **Issue:** No graceful handling of session expiration mid-browse
   - **Recommendation:** Add session refresh mechanism or clear error message

6. **Creator Name Fallback**
   - **Issue:** Shows 'Unknown' if user deleted
   - **Recommendation:** Consider showing "(Deleted User)" instead

---

## Manual Testing Checklist

Since automated testing is blocked, here's a comprehensive manual test plan:

### Test 1: Org Visibility Flow
```bash
# Terminal 1: Login as ning
curl -c cookies-ning.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ning","password":"password123"}'

# Create document
curl -b cookies-ning.txt -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Shared Doc","content":"Content","share_with_org":true,"allow_edit":false}'

# Terminal 2: Login as expert1
curl -c cookies-expert1.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"expert1","password":"password123"}'

# List documents (should see ning's shared document)
curl -b cookies-expert1.txt http://localhost:3000/api/documents

# Try to edit (should fail - allow_edit=false)
curl -b cookies-expert1.txt -X PUT http://localhost:3000/api/documents/[id] \
  -H "Content-Type: application/json" \
  -d '{"content":"Hacked"}'
```

**Expected Results:**
- expert1 sees document in list with "Created by: Ning Li"
- expert1 can view document
- expert1 CANNOT edit (403 error)

### Test 2: Allow Edit Permission
```bash
# As ning: Update to allow editing
curl -b cookies-ning.txt -X PUT http://localhost:3000/api/documents/[id] \
  -H "Content-Type: application/json" \
  -d '{"allow_edit":true}'

# As expert1: Try editing again (should succeed)
curl -b cookies-expert1.txt -X PUT http://localhost:3000/api/documents/[id] \
  -H "Content-Type: application/json" \
  -d '{"content":"Updated by expert1"}'
```

**Expected Results:**
- expert1 can now edit document
- Changes saved successfully

### Test 3: Deletion & Trash
```bash
# As ning: Delete shared document
curl -b cookies-ning.txt -X DELETE http://localhost:3000/api/documents/[id]

# As expert1: Try to list documents (should NOT see deleted doc)
curl -b cookies-expert1.txt http://localhost:3000/api/documents

# As ning: Check trash (should see deleted doc)
curl -b cookies-ning.txt http://localhost:3000/api/trash

# As expert1: Check trash (should NOT see ning's deleted doc)
curl -b cookies-expert1.txt http://localhost:3000/api/trash

# As ning: Restore document
curl -b cookies-ning.txt -X PATCH http://localhost:3000/api/documents/[id] \
  -H "Content-Type: application/json" \
  -d '{"action":"restore"}'

# As expert1: List again (should see restored doc)
curl -b cookies-expert1.txt http://localhost:3000/api/documents
```

**Expected Results:**
- Deleted doc disappears for expert1 immediately
- Only ning sees it in trash
- After restore, expert1 sees it again

### Test 4: Knowledge Edit Vulnerability Check
```bash
# As ning (org_id=1): Create knowledge
curl -b cookies-ning.txt -X POST http://localhost:3000/api/knowledge \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Knowledge","background":"BG","share_with_org":true,"allow_edit":true}'

# As expert2 (org_id=1): Try editing (should work - same org)
curl -b cookies-expert2.txt -X PUT http://localhost:3000/api/knowledge/[id] \
  -H "Content-Type: application/json" \
  -d '{"background":"Updated"}'

# As student1 (org_id=2): Try editing (should FAIL - different org)
curl -b cookies-student1.txt -X PUT http://localhost:3000/api/knowledge/[id] \
  -H "Content-Type: application/json" \
  -d '{"background":"Hacked"}'
```

**Expected Results:**
- expert2 (same org) CAN edit
- student1 (different org) CANNOT edit (403 error)
- ⚠️ **If student1 can edit, vulnerability confirmed**

### Test 5: Multi-User Concurrent Viewing
```bash
# Browser 1: Login as ning, create & share document
# Browser 2: Login as expert1, open shared document
# Browser 3: Login as expert2, open same shared document
# Browser 1: Make edits
# Browser 2 & 3: Refresh - should see updates
```

**Expected Results:**
- All users see same content (eventual consistency)
- Creator name displayed correctly for all users

---

## Recommendations

### Immediate Fixes Required

1. **Fix Knowledge Edit Permission Check** (Security)
   ```typescript
   // File: src/app/knowledge/[id]/edit/page.tsx
   if (entry.created_by !== session.user.id) {
     if (!entry.share_with_org ||
         !entry.allow_edit ||
         !session.user.org_id ||
         !entry.org_id ||
         session.user.org_id !== entry.org_id) {
       redirect('/knowledge');
     }
   }
   ```

2. **Add NULL Safety to Permission Checks**
   ```typescript
   // In all API routes checking org permissions
   const canEdit = document.created_by === userId ||
                   (document.share_with_org &&
                    document.allow_edit &&
                    userOrgId &&
                    document.org_id &&
                    userOrgId === document.org_id);
   ```

### Recommended Enhancements

3. **Improve Error Messages**
   - Return 403 Forbidden instead of 404 for permission denied
   - Include helpful message: "You don't have permission to access this resource"

4. **Shared Item Deletion Notification**
   - Consider adding a "Recently Removed" section for shared items deleted by others
   - Or toast notification on next visit

5. **Session Management**
   - Add session refresh mechanism
   - Show clear "Session expired" message vs cryptic errors

---

## Conclusion

### What Works Well ✅
- Org visibility queries are correctly implemented across all three entities
- Creator info display is consistent and functional
- Permission boundaries for documents API are secure
- Trash system properly isolates deleted items by creator
- Role-based redirects function correctly

### Critical Issues 🔴
1. Knowledge edit permission missing org_id check (Security vulnerability)
2. NULL org_id not handled explicitly (Potential bugs)

### Testing Status
- **Code Review:** ✅ Complete
- **Static Analysis:** ✅ Complete
- **Live Browser Testing:** ❌ Blocked by sandbox restrictions
- **API Testing:** ⏳ Requires manual execution of curl commands
- **Database Validation:** ⏳ Requires direct psql access

### Next Steps for User
1. Run `npm run dev` outside Claude Code sandbox
2. Execute manual test scenarios with curl or browser
3. Apply critical fixes for knowledge edit permissions
4. Verify NULL org_id behavior with test users

---

**Report Generated By:** Agent D (Integration & Edge Case Testing)
**Date:** 2026-01-09
**Method:** Static Code Analysis + Database Query Review
