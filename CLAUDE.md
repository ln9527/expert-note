# Expert Note

Annotation-based knowledge capture system for structured expert note-taking.

**Status**: ✅ UI Tested & Security Fixed (Jan 12, 2026)

---

## Quick Start

```bash
# Development
npm run dev                    # Start at http://localhost:3000
npm run build                  # Build for production
npm run lint                   # Run linter

# Test credentials (password: password123)
# admin (super_admin) | ning (owner) | expert1 (member)
```

## Key Documentation

| Doc | Purpose |
|-----|---------|
| [HANDOFF.md](./HANDOFF.md) | System overview - read first |
| [RECENT_WORK_2026-01.md](./RECENT_WORK_2026-01.md) | Recent changes |
| [docs/INDEX.md](./docs/INDEX.md) | Full documentation index |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment |

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- React 19 + TailwindCSS 4
- PostgreSQL 16 + iron-session
- OpenRouter (Qwen model)

## Key Directories

```
src/
├── app/                       # Next.js App Router pages
│   ├── api/                   # API routes
│   ├── documents/[id]/        # Document editor
│   ├── knowledge/[id]/edit/   # Knowledge editor
│   └── settings/              # Admin & settings pages
├── components/                # React components
├── lib/
│   ├── auth/                  # Session management
│   └── db/queries/            # Database queries
└── types/                     # TypeScript definitions
sql/
├── schema.sql                 # Database schema
├── seed.sql                   # Seed data
└── migrations/                # Database migrations
```

## Current Priorities

1. **Commit & Deploy** - Push security fixes to production
2. **UI Layout Fix** - ACTIONS column cut off on narrow viewports
3. **Generation Guide Dropdown** - Investigate unresponsive behavior
4. **NULL Safety** - Add explicit checks for org_id comparisons

## Recent Testing (Jan 12, 2026)

- ✅ UI Testing: 15/15 tests passed (multi-user sharing verified)
- ✅ Security Fix: Delete buttons now hidden for non-owners
- ✅ Backend: All DELETE APIs have ownership checks
- 📄 Reports: `test-reports/ui-test-2026-01-12-comprehensive.md`

## Database

```bash
# Connect
psql -h localhost -U ningli -d annotservice

# Check users
SELECT username, role, org_id FROM users;
```

**Latest Migration:** 007_org_creation_improvements.sql

## Production

**URL:** https://spansurvey.net/annote
**Server:** 47.121.176.193

```bash
# Deploy (after git push)
ssh -i ningli.pem root@47.121.176.193 \
  "cd /var/www/expert-note && git pull && export BASE_PATH=/annote && npm install && npm run build && pm2 restart expert-note"
```

## Important Notes

### Terminology
UI says "Generation Guide" -> Code says "PromptTemplate"
See `docs/GLOSSARY.md` for full explanation.

### Permission Pattern
```typescript
const canEdit =
  entity.createdBy === userId ||
  (entity.isShared && entity.allowEdit &&
   userOrgId && entity.creator?.orgId &&
   userOrgId === entity.creator.orgId);
```

### Debugging Principle
Never patch bugs. Find root causes: Reproduce -> Trace -> Understand -> Fix -> Verify

---

**Last Updated:** 2026-01-12
