# Admin Screenshots Capture Guide

This document provides specifications for capturing the 4 admin/settings screenshots with annotations.

## Prerequisites

- Login as admin user (username: admin, password: password123)
- Browser extension or screenshot tool that supports annotations
- Orange color for annotations: `#FF8C00` (RGB: 255, 140, 0)
- Line width: 3px

## Screenshot Specifications

### 08-admin-organizations.png

**URL:** https://spansurvey.net/annote/settings/admin

**Viewport:** 1486 x 900 px

**Focus:** Organizations section (top of page)

**Annotations:**
1. **Arrow pointing left** at Create Organization button (1208, 115)
   - Label: "Create Organization"
2. **Box** around organization table (405, 195) to (1290, 285)
   - Label: "Organization Table"
3. **Arrow pointing up** at Invitation Codes heading (488, 345)
   - Label: "Invitation Codes"

**Elements to capture:**
- Page title: "Organizations"
- Description: "Create and manage organizations..."
- "Show deleted organizations" checkbox
- Organization table with columns: NAME | OWNER CODE | USES | MEMBERS | CREATED | ACTIONS
- One organization row visible
- Invitation Codes section header below

---

### 09-invitation-codes.png

**URL:** https://spansurvey.net/annote/settings/admin
(Scroll to Invitation Codes section)

**Viewport:** 1486 x 900 px

**Focus:** Invitation Codes section

**Annotations:**
1. **Arrow pointing left** at Create Code button (1224, 356)
   - Label: "Create Code"
2. **Box** around code type badges (595, 535) to (675, 610)
   - Label: "Code Types"
3. **Arrow pointing down** at usage status (975, 549)
   - Label: "Usage Status"

**Elements to capture:**
- Section title: "Invitation Codes"
- Description: "Manage invitation codes for user registration"
- "Show used codes" checkbox and "Type:" filter dropdown
- Code table with columns: CODE | TYPE | DETAILS | STATUS | CREATED | ACTIONS
- At least 2 code rows visible showing:
  - Green "org member" badge
  - Blue "org owner" badge
  - Usage status (e.g., "0/15", "1/∞")
  - Member/Owner details

---

### 10-user-management.png

**URL:** https://spansurvey.net/annote/settings/admin/users

**Viewport:** 1486 x 900 px

**Focus:** User Management page

**Annotations:**
1. **Box** around search and filter row (168, 150) to (1290, 195)
   - Label: "Search & Filters"
2. **Box** around user table (168, 240) to (1290, 400)
   - Label: "User Table"
3. **Arrow pointing left** at Actions column (1240, 272)
   - Label: "Actions"

**Elements to capture:**
- Page title: "User Management"
- Search bar with placeholder "Search users..."
- Filter dropdowns: Role | Status | Organization
- User table with columns: USERNAME | DISPLAY NAME | ROLE | ORG | STATUS | CREATED | ACTIONS
- At least 3-4 user rows visible
- Action buttons: Edit icon, Password reset icon

---

### 11-tag-management.png

**URL:** https://spansurvey.net/annote/settings/tags

**Viewport:** 1486 x 900 px

**Focus:** Tag Management page

**Annotations:**
1. **Arrow pointing left** at Create Tag button (1210, 115)
   - Label: "Create Tag"
2. **Arrow pointing down** at tag list area (427, 214)
   - Label: "Tag List"
3. **Box** around ownership badge column (800, 250) to (920, 380)
   - Label: "Ownership Badges"

**Elements to capture:**
- Page title: "Tag Management"
- Description: "Create and manage tags..."
- Create Tag button (green)
- Tag table with columns: NAME | COLOR | OWNER | CREATED | ACTIONS
- Multiple tag rows showing ownership badges:
  - "System" (gray badge) - for system/global tags
  - "Yours" (blue badge) - for tags created by current user
  - "Shared" (green badge) - for tags from other org members
- Delete action (only for user's own tags)

---

## Capture Methods

### Method 1: Browser DevTools (Manual)

1. Open URL in browser
2. Open DevTools Console (F12)
3. Take base screenshot
4. Use image editor to add orange annotations

### Method 2: Claude in Chrome Extension

1. Navigate to URL
2. Use screenshot tool
3. Add annotations programmatically

### Method 3: Puppeteer Script

Run: `node capture-admin-pages.js`

Requires puppeteer installed: `npm install puppeteer`

### Method 4: Python + Selenium

Run: `python3 capture-admin-screenshots.py`

Requires: selenium, Pillow, and Chrome driver

---

## Output

Save all screenshots as PNG files to:
```
screenshots/images/
├── 08-admin-organizations.png
├── 09-invitation-codes.png
├── 10-user-management.png
└── 11-tag-management.png
```

**Expected file sizes:** ~60-130 KB per PNG

---

## Verification Checklist

- [ ] All 4 PNG files created
- [ ] Orange annotations visible (#FF8C00)
- [ ] All annotation labels readable
- [ ] Screenshots show actual UI content (not loading/error states)
- [ ] File sizes reasonable (< 200 KB each)
- [ ] Files saved to correct directory

---

## Troubleshooting

**Issue:** Can't login
- **Solution:** Use admin/password123 credentials

**Issue:** Page shows "Access Denied"
- **Solution:** Ensure logged in as super_admin role

**Issue:** Annotations not showing
- **Solution:** Verify coordinates match current UI layout

**Issue:** npm/Python permission errors
- **Solution:** Use manual capture method or fix permissions

---

*Generated: 2026-01-15*
*For: Expert Note User Guide Documentation*
