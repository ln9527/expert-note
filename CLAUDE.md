# Expert Note

Annotation-based knowledge capture system for structured expert note-taking.

**Status**: ✅ Knowledge Entry Markdown Architecture (Jan 16, 2026)

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
| [docs/user-guide/](./docs/user-guide/) | User guides & landing page |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment |

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- React 19 + TailwindCSS 4
- PostgreSQL 16 + iron-session
- OpenRouter (Grok 4.1 Fast model)

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

1. **PDF Word-Joining Issue** - Words like "demandpersonalized" still occur in PDF conversion
2. **Migration Cleanup** - Renumber duplicate migration files (005, 006, 007)
3. **Add Toast Notifications** - Show feedback when copy/download actions occur
4. **Test PDF/DOCX Upload Flow** - Verify convert endpoint and form editing works
5. **Monitor Production** - Watch for any remaining PM2/nginx issues

## Recent Work (Jan 14-16, 2026)

### Session 8 (Current) - Knowledge Entry Markdown Architecture
- ✅ **Raw Markdown Storage**: Knowledge entries now store full LLM output in `content` field
  - Migration 011 adds `content TEXT` column to `knowledge_entries`
  - Extraction API stores raw markdown instead of parsing into annotations
  - Detail page displays content as rendered markdown
  - Edit page has markdown textarea with Edit/Preview toggle
- ✅ **Download Button Fix**: Added missing `onDownload` prop to KnowledgeCard
- ✅ **Backward Compatible**: Legacy entries without `content` still work via annotations

### Session 7 - LLM Model Upgrade
- ✅ **Switched to Grok 4.1 Fast**: `x-ai/grok-4.1-fast` for faster inference

### Session 6 - Production PM2 & Nginx Fixes
- ✅ **PM2 Environment Variables**: Fixed critical issue where PM2 doesn't load .env files
  - Root cause: PM2 doesn't automatically load .env files into process environment
  - Fix: Must explicitly set env vars when starting PM2 (see DEPLOYMENT.md)
  - Fixed vars: DB_PASSWORD, OPENROUTER_API_KEY, DB_HOST, DB_PORT, etc.
- ✅ **OpenRouter API Key**: Updated to correct key in PM2 environment
- ✅ **Database Templates Verified**: Marker test confirmed templates ARE being loaded from database
- ✅ **Nginx Timeout**: Increased to 5 minutes (300s) for large document LLM calls
  - Added `proxy_read_timeout 300s`, `proxy_send_timeout 300s` to /annote location
- ⚠️ **Key Learning**: PM2 requires explicit env vars - don't rely on .env files!
- 📄 **Fix Reports**: `test-reports/fix-report-2026-01-15-pm2-environment.md`

### Session 5 - User Documentation & Landing Page
- ✅ **User Guide**: Complete DOCX with 15 annotated screenshots
- ✅ **Quick Start Guide**: Streamlined 4-screenshot version for onboarding
- ✅ **Landing Page**: `expert-note-landing.html` - conceptual page based on "generation abundant, evaluation scarce" thesis
- 📁 **Location**: `docs/user-guide/` contains all documentation assets

### Session 4 - Tag Ownership & PDF Upload UX
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

**Latest Migration:** 011_knowledge_entry_content.sql (Applied to production Jan 16, 2026)

## Production

**URL:** https://spansurvey.net/annote
**Server:** 47.121.176.193
**PM2 Process ID:** 30

```bash
# Deploy (after git push) - See DEPLOYMENT.md for full details
ssh -i /Users/ningli/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193 \
  "cd /var/www/expert-note && git pull && export BASE_PATH=/annote && npm install && npm run build && pm2 restart expert-note"

# ⚠️ CRITICAL: If PM2 process is deleted/recreated, must set ALL env vars explicitly!
# PM2 does NOT load .env files. See DEPLOYMENT.md "PM2 Environment Variables" section.
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

**Last Updated:** 2026-01-16 (Session 8: Knowledge Entry Markdown Architecture)
