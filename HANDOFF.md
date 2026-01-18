# Expert Note System - Handoff Document

**Last Updated:** 2026-01-18
**For:** Next AI agent picking up this project
**Context:** i18n (EN/CN) feature complete and deployed to production

---

## Current System State

**Status:** ✅ Phase 8 Complete - i18n Language Switching (EN/CN)

**Production URL:** https://spansurvey.net/annote
**Local Dev:** http://localhost:3000
**Database:** annotservice (PostgreSQL 16)
**PM2 Process ID:** 30

---

## What's Implemented & Ready

### ✅ User Management (Completed 2026-01-09 to 2026-01-14)

| Feature | Status | Location |
|---------|--------|----------|
| User roles (super_admin, owner, member, individual) | ✅ Working | Database + Auth |
| Organizations system | ✅ Working | `/settings/admin` |
| Organization-based visibility | ✅ Working | All queries |
| Sharing controls in document list | ✅ Working | Dashboard |
| Read-only mode for shared docs | ✅ Working | Editors |
| Generation guides admin-only | ✅ Working | `/settings/prompts` |
| Admin invitation codes | ✅ Working | `/settings/admin` |
| Owner member invitations | ✅ Working | `/settings/invites` |
| **Admin user management** | ✅ Working | `/settings/admin/users` |
| **Org member management** | ✅ Working | `/settings/members` |
| **Account settings (self-service)** | ✅ Working | `/settings/account` |
| **Password reset (temp password)** | ✅ Working | Admin/Owner action |
| **Disable/Enable users** | ✅ Working | Admin/Owner action |
| **Soft delete users** | ✅ Working | Admin/Owner action |
| **Registration with basePath** | ✅ Working | `/register` |

### ✅ Core Features (Production-Ready)

| Feature | Status | Notes |
|---------|--------|-------|
| Login/Auth | ✅ | 10 test users, iron-session |
| Document editing | ✅ | Markdown editor with auto-save |
| Annotations (MACRO/MESO/MICRO) | ✅ | Color-coded, keyboard shortcuts |
| Knowledge extraction | ✅ | AI-powered via OpenRouter |
| Prompt generation | ✅ | Template-based system prompts |
| Tag management | ✅ | 10 default tags |
| Soft delete & trash | ✅ | Restore/permanent delete |

---

## Recent Changes (Jan 18, 2026)

### i18n Language Switching Feature (Session 9)

**Feature:** English/Chinese UI language toggle

| Component | Changes |
|-----------|---------|
| LanguageContext | React Context + Provider for language state |
| useTranslation hook | `const { t, language, setLanguage } = useTranslation()` |
| en.json / zh.json | ~260 translation strings each |
| LanguageSwitcher | Toggle in AppHeader showing "中文"/"EN" |

**Key Files Created:**
```
src/i18n/
├── index.ts              # Main exports
├── LanguageContext.tsx   # Context + Provider
├── useTranslation.ts     # Custom hook
├── types.ts              # TypeScript types
└── locales/
    ├── en.json           # English translations
    └── zh.json           # Chinese translations
```

**Components Migrated (~34 total):**
- AppHeader, LoginForm, DeleteConfirmModal
- DocumentFilters, KnowledgeCard, KnowledgeTable
- PromptsTable, ViewModeToggle
- All settings pages (layout, prompts, tags, members, etc.)
- Dashboard, Knowledge, Prompts pages

**What's Translated:**
- Navigation labels, button text, form labels
- Table headers, filter options, empty states
- Error messages, modal dialogs

**What Stays in English:**
- "Expert Note" (app name)
- System prompts / LLM generation guides
- User-generated content, tag names

**Persistence:** localStorage key `expert-note-language`, defaults to English

---

## Lessons Learned (Session 9)

### ⚠️ SSH Key Path Variability

The Dropbox path varies between machines/configurations:

| Path Type | Example |
|-----------|---------|
| Direct | `/Users/ningli/Dropbox/...` |
| CloudStorage | `/Users/ningli/Library/CloudStorage/Dropbox/...` |

**Always verify with `ls` before using:**
```bash
ls /Users/ningli/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem
# OR if that fails:
ls /Users/ningli/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem
```

**Current Working Path:**
```
/Users/ningli/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem
```

### ⚠️ i18n Migration: Systematic Component Tracing Required

**Problem:** Initial i18n migration missed many components, leaving English text visible after switching to Chinese.

**Root Cause:** Only migrated "main" page components, didn't trace through all child components like:
- ViewModeToggle (Table/Card buttons)
- KnowledgeTable, PromptsTable (table headers, labels)
- Settings layout (sidebar items)

**Lesson:** Before starting i18n migration:
1. List ALL components in the feature area
2. Read each component to identify hardcoded strings
3. Create comprehensive translation key list
4. Migrate systematically, verifying each component

---

## Previous Changes (Jan 15, 2026)

### Production PM2 & Nginx Fixes (Session 6)

**Critical Discovery:** PM2 does NOT automatically load .env files!

| Issue | Symptom | Fix |
|-------|---------|-----|
| DB_PASSWORD missing | Login 500 errors, "client password must be a string" | Explicitly set in PM2 startup |
| OPENROUTER_API_KEY missing | Extraction 401 errors, using old key | Explicitly set in PM2 startup |
| Nginx timeout too short | 504 Gateway Timeout on large documents | Increased to 300s (5 min) |

**Key Changes:**
- ✅ All environment variables now explicitly set when starting PM2
- ✅ Nginx `/annote` location has `proxy_read_timeout 300s`
- ✅ Database templates verified working (marker test confirmed)
- ✅ OpenRouter API key updated to correct value

**PM2 Restart Command (if needed):**
```bash
pm2 delete expert-note
PORT=3006 NODE_ENV=production BASE_PATH=/annote DB_HOST=localhost DB_PORT=5432 \
DB_NAME=annotservice DB_USER=postgres DB_PASSWORD=annotservice2025 \
OPENROUTER_API_KEY='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' \
SESSION_SECRET='annote-production-secret-key-secure-2025-deployment' \
pm2 start npm --name expert-note -- start && pm2 save
```

**Fix Reports:** `test-reports/fix-report-2026-01-15-pm2-environment.md`

---

## Previous Changes (Jan 14, 2026)

### User Management System - Complete Implementation

**Admin Features (`/settings/admin/users`):**
- Stats dashboard showing total orgs, users, and breakdown by role
- User table with search, filter by role/status
- Actions: Reset password, Disable/Enable, Delete (soft)
- Password reset shows temp password once in modal

**Owner Features (`/settings/members`):**
- View and manage org members only
- Same actions as admin but scoped to org
- Cannot manage other owners or super_admins

**Self-Service (`/settings/account`):**
- Change display name
- Change password (requires current password)

**Login Security:**
- Disabled users: "Your account has been disabled"
- Deleted users: "Your account has been deleted"

### Bug Fixes
- ✅ `/api/users` - Fixed column name `last_login` → `last_login_at`
- ✅ `/api/admin/invitation-codes` - Fixed type validation to `org_owner`/`org_member`
- ✅ Admin UI - Fixed `orgId` not sent for `org_owner` codes
- ✅ `/register` - Added `buildApiPath` for production basePath support

### New Files Created
```
src/app/api/admin/users/route.ts          # List all users
src/app/api/admin/users/stats/route.ts    # User statistics
src/app/api/admin/users/[id]/route.ts     # Delete user
src/app/api/admin/users/[id]/password/route.ts  # Reset password
src/app/api/admin/users/[id]/status/route.ts    # Enable/disable
src/app/api/auth/change-password/route.ts # Self-service password change
src/app/api/users/profile/route.ts        # Update display name
src/app/api/users/org/route.ts            # List org members
src/app/settings/admin/users/page.tsx     # Admin user management page
src/app/settings/members/page.tsx         # Owner member management page
src/app/settings/account/page.tsx         # Self-service account settings
src/components/users/UserTable.tsx        # Reusable user table
src/components/users/TempPasswordModal.tsx # Temp password display
sql/migrations/008_add_user_soft_delete.sql # Soft delete migration
```

---

## Previous Changes (Jan 12, 2026)

### Comprehensive UI Testing
- ✅ **15/15 tests passed** - Document creation, annotations, knowledge extraction, sharing
- ✅ **Multi-user testing** - Verified sharing between ning (owner) and expert1 (member)
- ✅ **Permission boundaries** - Members cannot see/use sharing controls
- 📄 **Report:** `test-reports/ui-test-2026-01-12-comprehensive.md`

### Security Fixes (Delete Button Visibility)
- ✅ **Documents:** Delete button now hidden for non-owners (was showing to editors)
- ✅ **Knowledge:** Delete button now hidden for non-owners
- ✅ **Backend confirmed secure:** All DELETE APIs have ownership checks
- 📄 **Report:** `test-reports/fix-report-2026-01-12-delete-visibility.md`

### Files Modified
- `src/app/documents/[id]/page.tsx` - Added `isOwner` state for delete visibility
- `src/app/knowledge/page.tsx` - Added `currentUserId` for ownership checks
- `src/components/knowledge/KnowledgeCard.tsx` - Added ownership check
- `src/components/knowledge/KnowledgeTable.tsx` - Added ownership check

---

## Previous Changes (Jan 9-11, 2026)

### Security Fixes Applied
- ✅ **Knowledge API permissions** - Added GET/PUT/DELETE permission checks
- ✅ **Sharing UI bug** - Hidden from users without organizations

### Feature Additions
- ✅ **Document list sharing controls** - 🔓/🔒/✏️ icons for owners
- ✅ **Read-only editor mode** - For view-only shared documents
- ✅ **Organization creation** - Admin creates orgs with auto-generated owner codes
- ✅ **Owner invitation management** - Owners can create member codes

### Database Migrations
- ✅ **Migration 007** - Updated invitation code types (org_creator → org_owner, org_invite → org_member)

---

## File Structure (Key Locations)

```
expert-note/
├── HANDOFF.md                          ← You are here
├── CLAUDE.md                           ← Project config (read this next)
├── RECENT_WORK_2026-01.md              ← Detailed changes log
│
├── src/
│   ├── i18n/                           ← i18n system ✅ NEW (Session 9)
│   │   ├── index.ts                    ← Main exports
│   │   ├── LanguageContext.tsx         ← Context + Provider
│   │   ├── useTranslation.ts           ← Hook: t(), language, setLanguage
│   │   └── locales/
│   │       ├── en.json                 ← English (~260 strings)
│   │       └── zh.json                 ← Chinese (~260 strings)
│   ├── app/
│   │   ├── page.tsx                    ← Dashboard with sharing icons
│   │   ├── documents/[id]/page.tsx     ← Editor with read-only mode
│   │   ├── knowledge/[id]/edit/page.tsx ← Knowledge editor
│   │   ├── settings/
│   │   │   ├── admin/page.tsx          ← Super admin: orgs + all codes
│   │   │   ├── invites/page.tsx        ← Owner: member codes only
│   │   │   └── prompts/page.tsx        ← Admin-only generation guides
│   │   └── api/
│   │       ├── admin/
│   │       │   ├── organizations/route.ts  ← Create orgs
│   │       │   ├── invitation-codes/route.ts ← All code types
│   │       │   └── users/              ← User management ✅ NEW
│   │       │       ├── route.ts        ← List all users
│   │       │       ├── stats/route.ts  ← User statistics
│   │       │       └── [id]/           ← User actions
│   │       │           ├── route.ts    ← Delete user
│   │       │           ├── password/   ← Reset password
│   │       │           └── status/     ← Enable/disable
│   │       ├── auth/change-password/route.ts ← Self-service ✅ NEW
│   │       ├── users/
│   │       │   ├── route.ts            ← List users
│   │       │   ├── org/route.ts        ← Org members ✅ NEW
│   │       │   └── profile/route.ts    ← Update profile ✅ NEW
│   │       ├── invites/route.ts        ← Owner member codes
│   │       ├── documents/[id]/route.ts ← With permission checks
│   │       └── knowledge/[id]/route.ts ← With permission checks
│   │
│   └── lib/db/queries/
│       ├── documents.ts                ← Org visibility queries
│       ├── knowledge.ts                ← Org visibility queries
│       ├── organizations.ts            ← createOrganizationWithOwnerCode
│       └── invitationCodes.ts          ← Updated types
│
├── sql/migrations/
│   ├── 005_user_management_system.sql  ← Org foundation
│   └── 007_org_creation_improvements.sql ← Type updates ✅ EXECUTED
│
└── docs/
    ├── TESTING_SUMMARY_2026-01-09.md   ← Test results
    ├── SECURITY_FIX_KNOWLEDGE_EDIT.md  ← Security vulnerability docs
    └── PRE_DEPLOYMENT_CHECKLIST.md     ← Before production

```

---

## User Types & Access Matrix

| User | Role | Org ID | Can Do |
|------|------|--------|--------|
| admin | super_admin | NULL | Everything + create orgs/codes + manage all users |
| ning | owner | 1 | Full access + create member codes + manage org members |
| expert1 | member | 1 | View shared, edit if allowed |
| student1-3 | member | 1 | View shared, edit if allowed |
| researcher1-2 | member | 1 | View shared, edit if allowed |
| guest | member | 1 | View shared, edit if allowed |
| testuser123 | individual | NULL | Own content only, no org access |

**All passwords:** `password123`

---

## Common Tasks for Next AI

### Add New Feature
1. Read `CLAUDE.md` for project structure
2. Check `src/types/index.ts` for data models
3. Follow patterns in existing features
4. Update database if needed (create migration in `sql/migrations/`)
5. Test with different user roles

### Fix Bug
1. Check `docs/TESTING_SUMMARY_2026-01-09.md` for known issues
2. Follow "no patches" principle - find root cause
3. Verify fix doesn't break permissions
4. Test with org and non-org users

### Update UI
1. Check existing components in `src/components/`
2. Follow TailwindCSS patterns
3. Ensure responsive design
4. Test with different user roles

### Database Changes
1. Create migration in `sql/migrations/00X_description.sql`
2. Update types in `src/types/index.ts`
3. Update queries in `src/lib/db/queries/`
4. Test migration is idempotent
5. Update both local and production DBs

---

## Testing Checklist

### Before Any Changes
- [ ] Run `npm run dev` locally
- [ ] Test with admin, ning, and expert1 users
- [ ] Check browser console for errors
- [ ] Verify database connection

### After Changes
- [ ] Run `npm run build` (must succeed)
- [ ] Test affected features with all user roles
- [ ] Check permission boundaries
- [ ] Review for security issues

---

## Critical Files to Understand

### Permission System
- `src/lib/auth/session.ts` - Session management
- `src/lib/db/queries/documents.ts` (line 55-146) - Org visibility pattern
- `src/app/api/knowledge/[id]/route.ts` (lines 72-86, 110-125, 192-198) - Permission checks

### Sharing System
- `src/app/page.tsx` - Sharing icons in list
- `src/app/documents/[id]/page.tsx` - Read-only mode implementation

### Organization Management
- `src/app/api/admin/organizations/route.ts` - Org creation
- `src/lib/db/queries/organizations.ts` - createOrganizationWithOwnerCode
- `src/app/settings/admin/page.tsx` - Admin UI
- `src/app/settings/invites/page.tsx` - Owner UI

---

## Known Issues & Limitations

### ⚠️ Requires Manual Testing
- Cross-org permission boundaries (see `PRE_DEPLOYMENT_CHECKLIST.md`)
- Shared document deletion UX (no notification to members)
- NULL org_id edge cases (needs explicit NULL checks)

### 💡 Future Enhancements
- Bulk sharing operations
- Shared item deletion notifications
- Code expiration dates
- Usage analytics
- Email invitations

---

## Quick Start Commands

```bash
# Local Development
npm run dev                              # Start local server
psql -U ningli -d annotservice          # Connect to database

# Build & Deploy
npm run build                            # Must pass before deploy
ssh -i ningli.pem root@47.121.176.193  # SSH to production

# Database
psql -h localhost -U ningli -d annotservice -c "\dt"  # List tables
psql -h localhost -U ningli -d annotservice -f sql/migrations/XXX.sql  # Run migration
```

---

## If Build Fails

**Common Issues:**
1. TypeScript errors → Check `src/types/index.ts` for missing types
2. Missing dependencies → Run `npm install`
3. Database connection → Check `.env.local`
4. Permission checks → Verify all API routes have auth checks

---

## Documentation Index

**For New AI Agents:**
- `HANDOFF.md` ← Start here
- `CLAUDE.md` ← Project configuration
- `RECENT_WORK_2026-01.md` ← What was just done

**For Development:**
- `docs/GLOSSARY.md` ← Terminology (Generation Guide vs Template)
- `LOCAL_SETUP.md` ← New machine setup
- `DEPLOYMENT.md` ← Production deployment

**For Testing:**
- `docs/TESTING_SUMMARY_2026-01-09.md` ← Test results
- `test-owner-invites.md` ← Owner invites testing
- `PRE_DEPLOYMENT_CHECKLIST.md` ← Before production

**For Security:**
- `CRITICAL_SECURITY_FIX_REQUIRED.md` ← Was fixed (archive)
- `docs/SECURITY_FIX_KNOWLEDGE_EDIT.md` ← Details of fixes applied

---

## Next Development Tasks (Prioritized)

### High Priority
1. **i18n Coverage Check** - Verify all pages display correctly in Chinese
2. **PDF Word-Joining Issue** - Words like "demandpersonalized" still occur in PDF conversion
3. **Migration cleanup** - Renumber duplicate migration files (005, 006, 007)

### Medium Priority
1. **Add Toast Notifications** - Show feedback when copy/download actions occur
2. **Test PDF/DOCX Upload Flow** - Verify convert endpoint and form editing works
3. **Monitor production** - Watch for any remaining PM2/nginx issues

### Nice to Have
1. **Integration tests** - Automated user management tests
2. **Bulk user operations** - Disable/enable multiple users
3. **User activity logs** - Track password resets, status changes

---

## Emergency Rollback

If issues found in production:
```bash
cd /var/www/expert-note
git reset --hard HEAD~1
export BASE_PATH=/annote
npm run build
pm2 restart expert-note
```

---

**Handoff Complete. i18n (EN/CN) feature deployed and operational.**

**⚠️ Critical Reminders:**
1. PM2 does NOT load .env files! See DEPLOYMENT.md "Issue 2" if you need to restart PM2.
2. SSH key path may be `/Users/ningli/Dropbox/...` or `/Users/ningli/Library/CloudStorage/Dropbox/...` - verify with `ls` first.

**Questions?** Read `CLAUDE.md` for project details, or check specific docs above.

**Test Users:** admin (super_admin) - password `password123`
