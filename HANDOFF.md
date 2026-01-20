# Expert Note - Handoff Document

**Last Updated:** 2026-01-19
**Status:** ✅ Security Fix - Org-Based API Filtering deployed

---

## Current System State

**Production:** https://spansurvey.net/annote
**Local Dev:** http://localhost:3000
**Database:** annotservice (PostgreSQL 16)
**PM2 Process ID:** 30

---

## Recent Changes (Jan 19, 2026)

### Security Fix: Org-Based API Filtering

Fixed multi-tenant data isolation - users now only see data within their organization:

| Endpoint | Issue | Fix |
|----------|-------|-----|
| `/api/users` | Returned all users | Filter by org_id |
| `/api/tags` | Returned all tags | Filter by creator's org |
| `/api/prompt-templates` | Returned all templates | System templates visible to all, user-created org-scoped |
| `/api/annotations/[id]` | No ownership check | Added validation for PUT/DELETE |
| `/api/prompts/generate` | No access validation | Validate source document/knowledge access |

**Files Modified:**
```
src/app/api/users/route.ts
src/app/api/tags/route.ts
src/app/api/prompt-templates/route.ts
src/app/api/annotations/[id]/route.ts
src/app/api/prompts/generate/route.ts
src/lib/db/queries/tags.ts
src/lib/db/queries/knowledge.ts
src/lib/db/queries/promptTemplates.ts
```

---

## What's Implemented

### Core Features
- Login/Auth with iron-session
- Document editing with Markdown + auto-save
- Annotations (MACRO/MESO/MICRO)
- AI knowledge extraction via OpenRouter
- Prompt generation with templates
- Tag management
- Soft delete & trash

### User Management
- Roles: super_admin, owner, member, individual
- Organizations with invitation codes
- User enable/disable, password reset, soft delete
- Self-service account settings

### i18n (EN/CN)
- Language toggle in header
- ~260 translation strings
- LocalStorage persistence

---

## User Roles & Access

| Role | Access |
|------|--------|
| super_admin | Everything, manage all orgs/users |
| owner | Full org access, manage members |
| member | View shared, edit if allowed |
| individual | Own content only |

**Test Users:** admin, ning, expert1 (password: `password123`)

---

## Key Permission Pattern

```typescript
// Org-based visibility (documents, knowledge, etc.)
if (role === 'super_admin') {
  // See all
} else if ((role === 'owner' || role === 'member') && orgId) {
  // See same org only
} else {
  // Individual: own content only
}
```

---

## File Structure

```
src/
├── app/api/           # API routes with org filtering
├── components/        # React components
├── i18n/              # Internationalization
├── lib/
│   ├── auth/          # Session management
│   └── db/queries/    # Database queries with org visibility
sql/migrations/        # Database migrations (latest: 011)
```

---

## Deployment

```bash
# After git push
ssh -i /Users/ningli/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193 \
  "cd /var/www/expert-note && git pull && export BASE_PATH=/annote && npm install && npm run build && pm2 restart expert-note"
```

⚠️ **PM2 does NOT load .env files!** See DEPLOYMENT.md for explicit env vars.

---

## Priorities

1. **PDF Word-Joining** - Words like "demandpersonalized" in PDF conversion
2. **Migration Cleanup** - Renumber duplicate migration files
3. **Remove "Test Organization"** - Legacy seed data cleanup

---

## Quick Commands

```bash
npm run dev                              # Local dev
npm run build                            # Build (must pass)
psql -h localhost -U ningli -d annotservice  # DB access
```

---

**Read `CLAUDE.md` for more project details.**
