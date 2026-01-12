# Testing Guide: Owner Invitation Codes

## Quick Test Procedure

### Setup
1. Start dev server (if not running): `npm run dev`
2. Open browser: http://localhost:3000

---

## Test 1: Owner Access

**Login as Owner:**
- Username: `ning`
- Password: `password123`

**Expected Results:**
1. After login → redirected to dashboard
2. Click "Settings" in header
3. Sidebar should show:
   - ✅ Generation Guides
   - ✅ Tag Management
   - ✅ **Member Invitations** ← NEW
   - ❌ Admin section (not super_admin)
   - ✅ Trash

4. Click "Member Invitations"
5. URL should be: `/settings/invites`
6. Page title: "Member Invitations"
7. Subtitle: "Create invitation codes for members to join your organization."

---

## Test 2: Code Creation

**On `/settings/invites` page:**

1. Click "Create Member Code" button
2. Wait for code to appear
3. Verify table shows:
   - Code: 8-character uppercase code (e.g., "ABC12345")
   - Status: Green badge "Available"
   - Created: Today's date
   - Used: "-" (empty)
   - Actions: "Delete" button

4. Create 2-3 more codes
5. Verify all codes appear in table

---

## Test 3: Copy Code

1. Hover over any code → should see copy icon
2. Click copy icon
3. Paste in text editor → should match code displayed
4. Verify visual feedback (if any)

---

## Test 4: Filter Used Codes

1. Uncheck "Show used codes"
2. Verify all codes still visible (none used yet)
3. Check "Show used codes" again
4. Verify all codes still visible

---

## Test 5: Delete Code

1. Click "Delete" on any code
2. Verify confirmation dialog appears
3. Click "Cancel" → code should remain
4. Click "Delete" again → confirm
5. Code should disappear from table
6. Refresh page → code should still be gone

---

## Test 6: Non-Owner Access

**Logout and Login as Member:**
- Username: `expert1`
- Password: `password123`

**Expected Results:**
1. Go to Settings
2. Should NOT see "Member Invitations" link
3. Try direct URL: `/settings/invites`
4. Should redirect to `/settings` (access denied)

**Logout and Login as Super Admin:**
- Username: `admin`
- Password: `password123`

**Expected Results:**
1. Go to Settings
2. Should NOT see "Member Invitations" link (different role)
3. Should see "Admin" section with "Invitation Codes"
4. Admin page shows ALL codes, all types

---

## Test 7: API Security

**Using browser console or Postman:**

### Test as Non-Owner (login as expert1 first)

```javascript
// In browser console:
fetch('/api/invites')
  .then(r => r.json())
  .then(console.log);
// Expected: { error: 'Owner access required', status: 403 }
```

### Test as Owner (login as ning)

```javascript
// In browser console:
fetch('/api/invites')
  .then(r => r.json())
  .then(console.log);
// Expected: { success: true, codes: [...] }
```

---

## Test 8: Database Verification

**Check created codes in database:**

```bash
# Connect to database
psql -U ningli -d annotservice

# Check codes
SELECT id, code, type, org_id, created_by, used_by
FROM invitation_codes
WHERE type = 'org_member'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- `type` = 'org_member'
- `org_id` = 1 (ning's org)
- `created_by` = 1 (ning's user_id)
- `used_by` = NULL

---

## Test 9: Code Usage (Integration Test)

**Register new user with code:**

1. Logout from all accounts
2. Go to `/register`
3. Copy one of the codes from ning's invites page
4. Fill registration form:
   - Username: `testmember1`
   - Password: `password123`
   - Display Name: Test Member
   - Invitation Code: [paste code]

5. Submit registration
6. Login as new user
7. Verify:
   - Role: member
   - Can see dashboard
   - Belongs to ning's org

8. Login as ning again
9. Go to `/settings/invites`
10. Verify code shows:
    - Status: "Used" (gray badge)
    - Used: Today's date
    - Actions: (empty - no delete button)

---

## Test 10: Error Handling

### Test 1: Delete Used Code
1. After Test 9, try to delete the used code
2. Delete button should NOT be visible

### Test 2: Network Error
1. Open browser DevTools → Network tab
2. Set "Offline" mode
3. Try to create code
4. Should show error: "Network error. Please try again."
5. Dismiss error
6. Set "Online" mode
7. Try again → should work

### Test 3: Invalid Code ID
```javascript
// In browser console (as ning):
fetch('/api/invites?id=99999', { method: 'DELETE' })
  .then(r => r.json())
  .then(console.log);
// Expected: { error: 'Code not found' }
```

---

## Expected Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Owner Access | ✅ | Link appears for ning |
| Code Creation | ✅ | Creates org_member codes |
| Copy Code | ✅ | Copies to clipboard |
| Filter Used | ✅ | Works correctly |
| Delete Code | ✅ | Removes unused codes |
| Non-Owner Access | ✅ | Blocked correctly |
| API Security | ✅ | 403 for non-owners |
| Database Check | ✅ | Correct data stored |
| Code Usage | ✅ | Registration works |
| Error Handling | ✅ | Shows appropriate errors |

---

## Known Issues to Ignore

1. **Admin Page TypeScript Errors:** The admin page has type errors from old code types. This is a separate issue (Agent 4 incomplete).

2. **No Org Name Display:** Owner page shows generic text instead of actual org name. This is intentional simplification.

3. **Filter Behavior:** When no codes are used yet, the filter has no visible effect. This is expected.

---

## If Tests Fail

### Code Not Appearing
1. Check browser console for errors
2. Check network tab for failed API calls
3. Verify database connection
4. Check server logs: `pm2 logs expert-note` (if deployed)

### Access Denied
1. Verify user role in database:
   ```sql
   SELECT username, role, org_id FROM users WHERE username = 'ning';
   ```
2. Should show: role = 'owner', org_id = 1
3. Clear cookies and re-login

### Delete Not Working
1. Check if code is already used (usedBy != NULL)
2. Verify code belongs to ning's org (org_id = 1)
3. Check API error in network tab

---

## Cleanup After Testing

```sql
-- Remove test codes (optional)
DELETE FROM invitation_codes
WHERE type = 'org_member' AND used_by IS NULL;

-- Remove test user (optional)
DELETE FROM users WHERE username = 'testmember1';
```

---

*Ready to test! Start with Test 1 (Owner Access).*
