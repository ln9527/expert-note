# Pre-Deployment Security Checklist

**Status:** ⚠️ CRITICAL ISSUES - DO NOT DEPLOY YET

---

## Critical Security Fixes (MUST FIX)

### 🔴 1. Knowledge API Permission Checks
**File:** `/src/app/api/knowledge/[id]/route.ts`

- [ ] **PUT endpoint** - Add edit permission check (lines 90-132)
  - Check: Owner OR (shared + allow_edit + same org)
  - Return 403 if unauthorized

- [ ] **GET endpoint** - Add view permission check (lines 45-80)
  - Check: Owner OR (shared + same org)
  - Return 404 if unauthorized (to not reveal existence)

- [ ] **DELETE endpoint** - Add ownership check (lines 138-173)
  - Check: Only owner can delete
  - Return 403 if not owner

**Reference:** See `/docs/SECURITY_FIX_KNOWLEDGE_EDIT.md` for complete implementation

---

## Testing Requirements (MUST PASS)

### Test 1: Cross-Org Edit Prevention ⚠️ CRITICAL
```bash
# ning (org 1) creates entry, student1 (org 2) tries to edit
curl -b cookies-student1.txt -X PUT /api/knowledge/[id] -d '{...}'
```
- [ ] Returns 403 Forbidden
- [ ] Error message: "No permission to edit"
- [ ] Entry not modified in database

### Test 2: Same-Org Edit with Permission
```bash
# ning shares with org + allow_edit, expert1 (same org) edits
curl -b cookies-expert1.txt -X PUT /api/knowledge/[id] -d '{...}'
```
- [ ] Returns 200 OK
- [ ] Changes saved successfully

### Test 3: Same-Org Edit without Permission
```bash
# ning shares with org but allow_edit=false, expert1 tries to edit
curl -b cookies-expert1.txt -X PUT /api/knowledge/[id] -d '{...}'
```
- [ ] Returns 403 Forbidden
- [ ] Entry not modified

### Test 4: Owner Can Always Edit
```bash
# ning edits own entry
curl -b cookies-ning.txt -X PUT /api/knowledge/[id] -d '{...}'
```
- [ ] Returns 200 OK
- [ ] Changes saved successfully

### Test 5: Cross-Org View Prevention
```bash
# student1 (org 2) tries to view ning's (org 1) private entry
curl -b cookies-student1.txt /api/knowledge/[id]
```
- [ ] Returns 404 Not Found (to not reveal existence)

### Test 6: Non-Owner Cannot Delete
```bash
# expert1 tries to delete ning's entry
curl -b cookies-expert1.txt -X DELETE /api/knowledge/[id]
```
- [ ] Returns 403 Forbidden
- [ ] Entry not deleted

---

## Optional Improvements (Nice to Have)

### NULL Safety
- [ ] Add explicit NULL checks for org_id comparisons
  ```typescript
  userOrgId && document.org_id && userOrgId === document.org_id
  ```

### Error Messages
- [ ] Consistent 403 vs 404 usage
- [ ] Clear permission denied messages

### UX Enhancements
- [ ] Shared item deletion notifications
- [ ] Session expiration handling
- [ ] Concurrent edit detection

---

## Code Review Checklist

### Permission Pattern Consistency
- [ ] Documents API: ✅ Secure (reference implementation)
- [ ] Knowledge API: 🔴 Needs fixing
- [ ] Prompts API: ⏳ Not reviewed yet

### Verify All Endpoints Have:
- [ ] Authentication check (getSessionUser)
- [ ] Authorization check (owner or shared with permission)
- [ ] Org boundary enforcement (same org_id)
- [ ] Proper error codes (401, 403, 404)

---

## Database Verification

### Check Queries
- [ ] Visibility queries use correct OR logic
- [ ] Soft delete filters applied (is_deleted = FALSE)
- [ ] Admin bypass works correctly
- [ ] No SQL injection vulnerabilities

### Test Data
- [ ] Users in different orgs (ning=org1, student1=org2)
- [ ] Shared and private entries
- [ ] Entries with and without tags
- [ ] Deleted entries in trash

---

## Integration Tests

### Org Visibility Flow
- [ ] Create document as ning
- [ ] Share with org
- [ ] Verify expert1 sees it
- [ ] Verify student1 does NOT see it

### Multi-User Scenario
- [ ] ning creates & shares
- [ ] expert1 and expert2 both view
- [ ] Only ning can delete
- [ ] Restore works for all viewers

### Trash System
- [ ] Delete moves to trash
- [ ] Only creator sees in trash
- [ ] Restore brings back
- [ ] Permanent delete requires ownership

---

## Deployment Steps

1. **Apply Fixes**
   ```bash
   # Edit /src/app/api/knowledge/[id]/route.ts
   # Add permission checks to PUT, GET, DELETE
   ```

2. **Run Local Tests**
   ```bash
   npm run dev
   # Execute all 6 test scenarios above
   ```

3. **Commit Changes**
   ```bash
   git add src/app/api/knowledge/[id]/route.ts
   git commit -m "fix: Add permission checks to Knowledge API endpoints"
   ```

4. **Deploy to Production**
   ```bash
   ssh root@47.121.176.193
   cd /var/www/expert-note
   git pull
   export BASE_PATH=/annote
   npm run build
   pm2 restart expert-note
   ```

5. **Verify Production**
   ```bash
   # Run test scenarios on https://spansurvey.net/annote
   ```

---

## Documentation Updates

- [ ] Update API documentation with permission requirements
- [ ] Document security model in README
- [ ] Add permission examples to developer guide

---

## Sign-Off

Before deploying to production, verify:

- [ ] All critical fixes applied
- [ ] All 6 test scenarios pass
- [ ] Code reviewed by another developer
- [ ] No other security vulnerabilities found
- [ ] Database migrations run (if any)
- [ ] Backup created before deployment

**Deployment Approved By:** _______________
**Date:** _______________
**Production URL:** https://spansurvey.net/annote

---

## Rollback Plan

If issues found in production:

1. **Immediate Rollback**
   ```bash
   cd /var/www/expert-note
   git reset --hard HEAD~1
   export BASE_PATH=/annote
   npm run build
   pm2 restart expert-note
   ```

2. **Report Issue**
   - Document what went wrong
   - Create GitHub issue
   - Test fix locally before redeploying

---

**Checklist Created:** 2026-01-09
**Last Updated:** 2026-01-09
**Status:** ⚠️ Pending Critical Fixes
