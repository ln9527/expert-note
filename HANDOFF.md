# Expert Note System - Handoff Document

**Last Updated:** 2026-01-12
**For:** Next AI agent picking up this project
**Context:** Comprehensive UI testing completed + security fixes applied

---

## Current System State

**Status:** ✅ Phase 5 Complete - UI Tested & Security Hardened

**Production URL:** https://spansurvey.net/annote
**Local Dev:** http://localhost:3000
**Database:** annotservice (PostgreSQL 16)

---

## What's Implemented & Ready

### ✅ User Management (Completed 2026-01-09 to 2026-01-11)

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

## Recent Changes (Jan 12, 2026)

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
│   │       │   └── invitation-codes/route.ts ← All code types
│   │       ├── invites/route.ts        ← Owner member codes
│   │       ├── documents/[id]/route.ts ← With permission checks
│   │       └── knowledge/[id]/route.ts ← With permission checks ✅ FIXED
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
| admin | super_admin | NULL | Everything + create orgs/codes |
| ning | owner | 1 | Full access + create member codes |
| expert1 | member | 1 | View shared, edit if allowed |
| student1-3 | member | 1 | View shared, edit if allowed |
| researcher1-2 | member | 1 | View shared, edit if allowed |
| guest | member | 1 | View shared, edit if allowed |

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
1. **Manual security testing** - Run tests from `PRE_DEPLOYMENT_CHECKLIST.md`
2. **Production deployment** - After testing passes
3. **Monitor production** - Watch for permission errors

### Medium Priority
1. **NULL org_id safety** - Add explicit checks in permission logic
2. **Improve error messages** - Consistent 403 vs 404 usage
3. **Prompts API review** - Check for permission vulnerabilities

### Nice to Have
1. **Integration tests** - Automated permission boundary tests
2. **Shared deletion UX** - Notify members when owner deletes
3. **Session management** - Handle expiration gracefully

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

**Handoff Complete. System is ready for testing and next development phase.**

**Questions?** Read `CLAUDE.md` for project details, or check specific docs above.
