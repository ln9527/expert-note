# Expert Note

Annotation-based knowledge capture system for structured expert note-taking.

**Status**: ✅ Security Fix - Org-Based API Filtering (Jan 19, 2026)

---

## Quick Start

```bash
# Development
npm run dev                    # Start at http://localhost:3000
npm run build                  # Build for production

# Test credentials (password: password123)
# admin (super_admin), ning (owner), expert1 (member)
```

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- React 19 + TailwindCSS 4
- PostgreSQL 16 + iron-session
- OpenRouter (Grok 4.1 Fast model)

## Key Directories

```
src/
├── app/api/                   # API routes
├── components/                # React components
├── i18n/                      # Internationalization (EN/CN)
├── lib/
│   ├── auth/                  # Session management
│   └── db/queries/            # Database queries
sql/migrations/                # Database migrations
```

## Current Priorities

1. **PDF Word-Joining** - Words like "demandpersonalized" still occur
2. **Migration Cleanup** - Renumber duplicate files (005, 006, 007)
3. **Remove Legacy "Test Organization"** - Clean up seed data

## Recent Work

### Session 10 (Jan 19, 2026) - Security: Org-Based Filtering

Fixed multi-tenant data isolation across API endpoints:

| Endpoint | Fix |
|----------|-----|
| `/api/users` | Filter by org (super_admin sees all, org members see same org, individuals see self) |
| `/api/tags` | Filter by creator's org |
| `/api/prompt-templates` | System templates visible to all, user-created org-scoped |
| `/api/annotations/[id]` | Added ownership validation for PUT/DELETE |
| `/api/prompts/generate` | Validate user access to source documents/knowledge |

**Test Reports:** `test-reports/backend-test-2026-01-19-security-fixes.md`

### Session 9 (Jan 18) - i18n Language Switch

- English/Chinese toggle in AppHeader
- ~260 translation strings in `src/i18n/locales/`
- ~34 components migrated

### Session 8 (Jan 16) - Knowledge Markdown Architecture

- Knowledge entries store raw markdown in `content` field
- Migration 011 adds content column

## Database

```bash
psql -h localhost -U ningli -d annotservice
SELECT username, role, org_id FROM users;
```

**Latest Migration:** 011_knowledge_entry_content.sql

## Production

**URL:** https://spansurvey.net/annote
**Server:** 47.121.176.193
**PM2 Process ID:** 30

```bash
# Deploy (after git push)
ssh -i /Users/ningli/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193 \
  "cd /var/www/expert-note && git pull && export BASE_PATH=/annote && npm install && npm run build && pm2 restart expert-note"

# ⚠️ CRITICAL: PM2 does NOT load .env files. See DEPLOYMENT.md for env vars.
```

## Permission Pattern

```typescript
const canEdit =
  entity.createdBy === userId ||
  (entity.isShared && entity.allowEdit &&
   userOrgId && entity.creator?.orgId === userOrgId);
```

## Key Docs

| Doc | Purpose |
|-----|---------|
| [HANDOFF.md](./HANDOFF.md) | System overview |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment |
| [docs/GLOSSARY.md](./docs/GLOSSARY.md) | Terminology |

---

**Last Updated:** 2026-01-19 (Session 10: Security Fix)
