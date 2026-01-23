# Expert Note

Annotation-based knowledge capture system for structured expert note-taking.

**Status**: ✅ Skills & MCP Fully Functional - Deployed to Production (Jan 23, 2026)

---

## Quick Start

```bash
# Development
npm run dev                    # Start at http://localhost:3000
npm run build                  # Build for production

# If dev server stuck, clear cache:
rm -rf .next && npm run dev

# Test credentials (password: password123)
# admin (super_admin), ning (owner), expert1 (member)
```

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- React 19 + TailwindCSS 4
- PostgreSQL 16 + iron-session
- OpenRouter (Grok 4.1 Fast model)
- **Alibaba Cloud ASR** (Voice recognition - Chinese/English)

## Key Directories

```
src/
├── app/api/                   # API routes
│   └── speech/token/          # Aliyun ASR token endpoint (NEW)
├── components/                # React components
│   └── editor/                # AnnotationModal, VoiceInputButton (NEW)
├── hooks/                     # Custom React hooks (NEW)
│   └── useVoiceInput.ts       # Voice recognition hook
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

### Session 15 (Jan 23, 2026) - Wizard Knowledge Data Fix

Fixed critical bug where Skills/MCP wizard showed 0 knowledge entries despite data existing.

**Root Cause:** API returns `{ entries: [...] }` but wizard expected `{ knowledgeEntries: [...] }`.

**Fix:**
```typescript
// src/components/skills/WizardSourcesStep.tsx
// BEFORE (buggy)
setKnowledge(knowledgeData.knowledgeEntries || []);

// AFTER (fixed)
setKnowledge(knowledgeData.entries || []);
```

**Verified:** Both Skills and MCP wizards now correctly display knowledge entries and complete end-to-end.

### Session 14 (Jan 23, 2026) - Wizard-Only Creation for Skills & MCP

Enforced wizard-based creation flow, removing redundant manual forms.

**Problem:** Two parallel creation paths existed:
- Manual form (`/skills/new`, `/mcp/new`) - Direct content entry
- Wizard (`/skills/build`, `/mcp/build`) - 4-step guided process using AI generation

The manual path contradicted the design vision of packaging existing prompts/knowledge into structured skills.

**Changes:**
| File | Change |
|------|--------|
| `src/app/skills/new/` | DELETED (entire directory) |
| `src/app/mcp/new/` | DELETED (entire directory) |
| `src/app/skills/page.tsx` | Updated "Create Skill" links → `/skills/build` |
| `src/app/mcp/page.tsx` | Updated "Create MCP" links → `/mcp/build` |

**Behavior:**
- Create buttons now redirect to wizard flow
- Old URLs `/skills/new` and `/mcp/new` return 404
- Edit forms (`/skills/[id]/edit`, `/mcp/[id]/edit`) unchanged

### Session 13 (Jan 23, 2026) - Skills & MCP Production Fix

Fixed critical production issues preventing Skills and MCP from working:

**Issues Fixed:**
1. **SQL Parameter Mismatch (500 Error)** - `getAllSkills()` and `getAllMcpPrompts()` always added `userId` to params array, but for `super_admin` role the visibility condition was `'TRUE'` with no parameter placeholders, causing PostgreSQL error: "bind message supplies 1 parameters, but prepared statement requires 0"
2. **Missing Layout Files on Server** - `skills/layout.tsx` and `mcp/layout.tsx` were missing on production (git pull had failed due to network issues), causing pages to render without AppHeader
3. **Missing /new Page Directories** - `skills/new/` and `mcp/new/` directories weren't deployed, causing 500 errors when trying to create new items

**Files Fixed:**
| File | Fix |
|------|-----|
| `src/lib/db/queries/skills.ts` | Only add userId to params when used in query (not for super_admin) |
| `src/lib/db/queries/mcpPrompts.ts` | Only add userId to params when used in query (not for super_admin) |

**Root Cause Pattern:**
```typescript
// BEFORE (buggy) - userId always in params
const params: unknown[] = [userId];
if (role === 'super_admin') {
  visibilityCondition = 'TRUE';  // No $1 placeholder!
}

// AFTER (fixed) - only add when needed
const params: unknown[] = [];
if (role === 'super_admin') {
  visibilityCondition = 'TRUE';
} else {
  params.push(userId);
  visibilityCondition = `s.created_by = $${paramIndex++}`;
}
```

**Deployment Note:** When git pull fails on production due to network issues, files must be manually copied via scp.

**Verified Working:**
- ✅ Skills list page loads with AppHeader
- ✅ MCP list page loads with AppHeader
- ✅ Create new skill works
- ✅ Create new MCP works
- ✅ View skill details works

### Session 12 (Jan 23, 2026) - Skills & MCP UUID Validation

Fixed API routes catching "new" as an ID and failing with PostgreSQL UUID parse errors.

**API Routes Updated (added UUID validation):**
- `src/app/api/mcp/[id]/route.ts`
- `src/app/api/mcp/[id]/deploy/route.ts`
- `src/app/api/mcp/[id]/disable/route.ts`
- `src/app/api/mcp/[id]/regenerate-token/route.ts`
- `src/app/api/skills/[id]/route.ts`
- `src/app/api/skills/[id]/download/route.ts`

**UUID Validation Pattern:**
```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!isValidUUID(id)) {
  return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
}
```

### Session 11 (Jan 21, 2026) - Voice Input for Annotations

Added voice recognition using Alibaba Cloud ASR (智能语音交互).

**Status:** ✅ Deployed to Production

**Voice Input Locations:**
- Annotation Modal (content field)
- Prompt Generation (Additional Instructions field)

**New Files:**
| File | Purpose |
|------|---------|
| `src/hooks/useVoiceInput.ts` | Voice capture + WebSocket to Aliyun ASR |
| `src/app/api/speech/token/route.ts` | Token generation for ASR authentication |
| `src/components/editor/VoiceInputButton.tsx` | Microphone button component |

**Bug Fixes Applied:**
1. Aliyun requires `message_id`/`task_id` **without dashes** (32 hex chars) → fixed with `.replace(/-/g, '')`
2. BASE_PATH issue: API calls must use `buildApiPath()` for production `/annote` prefix

**Aliyun Setup:**
- Service: 智能语音交互 (Intelligent Speech Interaction)
- Model: 中英自由说 (Chinese-English bilingual)
- AppKey: `65ah5xG5SNSN42Zf`

**Environment Variables (required in both .env.local and .env.production):**
```bash
ALIYUN_ACCESS_KEY_ID=<your-access-key-id>
ALIYUN_ACCESS_KEY_SECRET=<your-access-key-secret>
ALIYUN_ASR_APP_KEY=<your-app-key>
NEXT_PUBLIC_ALIYUN_ASR_APP_KEY=<your-app-key>
```

**Important:** `NEXT_PUBLIC_` vars must be set at **build time** to be embedded in client bundle.

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

**Last Updated:** 2026-01-23 (Session 14: Wizard-Only Creation)
