# Expert Note

Annotation-based knowledge capture system for structured expert note-taking.

**Status**: ✅ Tag Ownership & PDF Upload UX Complete (Jan 15, 2026)

---

## Quick Start

```bash
# Development
npm run dev                    # Start at http://localhost:3000
npm run build                  # Build for production
npm run lint                   # Run linter

# Test credentials (password: password123)
# admin (super_admin) - only user after DB cleanup
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

1. **Test Tag Ownership** - Verify users can only delete their own tags, admin can delete all
2. **PDF Word-Joining Issue** - Words like "demandpersonalized" still occur in PDF conversion
3. **Migration Cleanup** - Renumber duplicate migration files (005, 006, 007)
4. **Add Toast Notifications** - Show feedback when copy/download actions occur
5. **Test PDF/DOCX Upload Flow** - Verify convert endpoint and form editing works

## Recent Work (Jan 14-15, 2026)

### Session 4 (Current) - Tag Ownership & PDF Upload UX
- ✅ **PDF Conversion Quality**: Switched to pdfjs-dist with hasEOL for better text extraction
- ✅ **PDF/DOCX Upload UX**: New /api/documents/convert endpoint lets users edit title/tags before saving
- ✅ **TagFilter Bug Fix**: Added type="button" to 5 buttons to prevent form auto-submit
- ✅ **Database Cleanup**: Hard deleted all test data, kept only admin user and seed tags
- ✅ **Tag Ownership System**: Migration 010 adds created_by, is_deleted, deleted_at
  - Users can only delete tags they created
  - Global tags (created_by=NULL) only deletable by super_admin
  - UI shows ownership badges (System/Yours/Shared) and conditional delete
- ⚠️ **Known Issue**: PDF word-joining (e.g., "demandpersonalized") - needs spacing heuristic
- 📄 **Commits**: 5 commits (38423cc, 209b1f3, fbc90fc, 507180f, 7a0d908)

### Session 3 - Table Actions & Multi-Use Codes
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

**Latest Migration:** 010_tag_ownership_soft_delete.sql (Applied to production Jan 15, 2026)

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

**Last Updated:** 2026-01-15 (Session 4: Tag Ownership & PDF Upload UX)
