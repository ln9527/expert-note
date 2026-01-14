# Expert Note

Annotation-based knowledge capture system for structured expert note-taking.

**Status**: ✅ Multi-Use Codes & Table Actions Complete (Jan 14, 2026)

---

## Quick Start

```bash
# Development
npm run dev                    # Start at http://localhost:3000
npm run build                  # Build for production
npm run lint                   # Run linter

# Test credentials (password: password123)
# admin (super_admin) | ning (owner) | expert1 (member) | testuser123 (individual)
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

1. **Test Password Reset** - Verify temp password flow works for all user types
2. **Migration Cleanup** - Renumber duplicate migration files (005, 006, 007)
3. **Add Toast Notifications** - Show feedback when copy/download actions occur
4. **Monitor Production** - Watch for permission or user management errors

## Recent Work (Jan 14, 2026)

### Session 3 (Current) - Table Actions & Multi-Use Codes
- ✅ **Org Owner Invitations Page**: Fixed 4 issues to match admin page functionality
  - Added create modal with Usage Limit input
  - Updated table columns: CODE | USAGE | CREATED | ACTIONS
  - Added TYPE column (blue "Owner" / green "Member" badges)
  - Download exports as markdown with metadata
  - Delete only available for unused codes
- ✅ **Knowledge Entries Table**: Added download/delete icon buttons
  - Matches Documents table pattern
  - Download exports entry with background, tags, created date
  - Delete only available for creator
- ✅ **Prompts Table**: Added download/delete icon buttons
  - Download exports prompt with title, description, version, tags, content
  - Delete only available for creator (owner)
- ✅ **Deployment Docs**: Updated SSH key path to full absolute path
- 📄 **Commits**: 4 commits (30580ab, 16951d9, 52cfa4c, 55ffebc)

### Session 2 (Jan 14) - User Management System
- ✅ **User Management System**: Complete implementation for admins and org owners
- ✅ **Password Reset**: Temp password shown once in modal
- ✅ **Soft Delete**: Users can be deleted (data preserved) via `deleted_at` column
- ✅ **Login Security**: Disabled/deleted users see appropriate messages

## Database

```bash
# Connect
psql -h localhost -U ningli -d annotservice

# Check users
SELECT username, role, org_id FROM users;
```

**Latest Migration:** 008_add_user_soft_delete.sql (Applied to production Jan 14, 2026)

## Production

**URL:** https://spansurvey.net/annote
**Server:** 47.121.176.193

```bash
# Deploy (after git push)
# SSH key located at: ./ningli.pem (in project root)
ssh -i /Users/ningli/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193 \
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

**Last Updated:** 2026-01-14 (Session 3: Table Actions & Multi-Use Codes)
