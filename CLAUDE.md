# Expert Note System - Project Configuration

**Project**: Expert Note (Annotation-based knowledge capture)
**Status**: Production Deployed
**Production URL**: https://spansurvey.net/annote
**Local URL**: http://localhost:3000
**GitHub**: https://github.com/ln9527/expert-note

---

## Quick Start (Local Testing)

```bash
cd /Users/ningli/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note
npm run dev
# Open http://localhost:3000
```

**Test Credentials:**
- Username: `ning` (or any of: admin, expert1, expert2, student1-3, researcher1-2, guest)
- Password: `password123`

---

## What's Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Login/Auth | Done | 10 hardcoded users, iron-session |
| Dashboard | Done | Document list, stats, quick links, **delete button** |
| Document Editor | Done | Side-by-side layout, auto-save |
| Annotation Toolbar | Done | MACRO/MESO/MICRO buttons, Cmd+1/2/3 |
| Annotation Parsing | Done | `[[LEVEL: content]]` format |
| Tag Management | Done | 10 default academic tags |
| Knowledge Base UI | Done | List, detail, filter by tags, **edit**, **download**, **delete** |
| Knowledge Edit Page | Done | Edit background, tags, refined comments |
| Knowledge Download | Done | Export as Markdown with annotations by level |
| Prompt Generator UI | Done | Template selection, knowledge picker, **delete** |
| Prompt Templates | Done | Customizable extraction/generation templates |
| Soft Delete & Trash | Done | Trash page, restore, permanent delete |
| Document API | Done | CRUD + soft delete + restore |
| Knowledge API | Done | Extraction, CRUD + soft delete + restore |
| Annotations API | Done | PUT/DELETE for individual annotations |
| Prompts API | Done | Generation, CRUD + soft delete + restore |
| Trash API | Done | List deleted items, restore, permanent delete |
| AI Integration | Done | OpenRouter/Qwen with batch processing |

---

## ⚠️ Terminology: Generation Guides vs Templates

**IMPORTANT:** To avoid confusion, read this section!

### UI vs Code Terminology Mismatch

The system uses different terms in the user interface vs code/database:

| What Users See | What Code Says | Why |
|----------------|----------------|-----|
| **"Generation Guide"** | `PromptTemplate`, `prompt_templates` | UI clarity (changed Jan 2026) |
| **"System Prompt"** | `SystemPrompt`, `system_prompts` | Consistent everywhere |

### What Each Term Means

#### Generation Guide (code: PromptTemplate)
- **Purpose:** Guides/instructions for HOW to generate system prompts
- **Example:** "Introduction Review Guide" tells AI to focus on research importance, gap identification, etc.
- **Location:** Settings → Generation Guides page
- **Database:** `prompt_templates` table
- **Used in:** `/prompts/generate` page to select generation strategy

#### System Prompt (code: SystemPrompt)
- **Purpose:** The GENERATED prompt that guides LLM behavior
- **Example:** "You are an expert academic writing reviewer specializing in..."
- **Location:** Prompts page (list of generated prompts)
- **Database:** `system_prompts` table
- **Used in:** Actual LLM systems (Claude, GPT, etc.)

### Why Not Rename Everything?

We could rename `prompt_templates` → `generation_guides` in the database, but:
1. **Risk:** Requires migration affecting 100+ code locations
2. **Effort:** 6-8 hours of work + extensive testing
3. **Benefit:** Clarity achieved with UI-only changes
4. **Decision:** Deferred to future major version

### For Future AI Agents

When working with this codebase:
- **If you see "template" in code** → Think "generation guide"
- **Check UI labels** → They're authoritative for user-facing terms
- **Read /docs/GLOSSARY.md** → Full terminology reference
- **Read /src/types/index.ts** → Top of file has detailed glossary

### Quick Reference

```typescript
// This code:
const [templateType, setTemplateType] = useState('');
fetch('/api/prompt-templates');

// Refers to this UI:
"Generation Guide" dropdown
"Select a guide..."
```

---

## Annotation Format

```
[[MACRO: High-level principle or judgment]]
[[MESO: Pattern-level guidance]]
[[MICRO: Specific edit or suggestion]]
```

Colors: MACRO=Red, MESO=Yellow, MICRO=Green

---

## Project Structure

```
expert-note/
├── sql/
│   ├── schema.sql          # Database tables
│   ├── seed.sql            # 10 users + 10 tags
│   └── migrations/         # Database migrations
│       └── 004_soft_delete.sql  # Soft delete for prompts/knowledge
├── src/
│   ├── app/
│   │   ├── page.tsx        # Dashboard (with delete buttons)
│   │   ├── login/          # Login page
│   │   ├── documents/      # Editor pages
│   │   ├── knowledge/
│   │   │   ├── page.tsx    # Knowledge list (with delete)
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Detail view + download
│   │   │       └── edit/page.tsx # Edit page
│   │   ├── prompts/        # Prompt generator pages (with delete)
│   │   ├── trash/          # Trash page (restore/permanent delete)
│   │   ├── settings/       # Settings pages (prompts config, trash link)
│   │   └── api/
│   │       ├── documents/  # Document CRUD + soft delete
│   │       ├── knowledge/  # Knowledge CRUD + soft delete + restore
│   │       ├── annotations/[id]/ # Annotation PUT/DELETE
│   │       ├── prompts/    # Prompt CRUD + soft delete + restore
│   │       ├── prompt-templates/ # Template CRUD
│   │       ├── tags/       # Tag CRUD
│   │       └── trash/      # Trash API (list, restore, permanent delete)
│   ├── components/
│   │   ├── auth/           # LoginForm
│   │   ├── editor/         # MarkdownEditor, AnnotationToolbar, Modal
│   │   ├── knowledge/      # KnowledgeCard, AnnotationList, TagFilter
│   │   ├── prompts/        # PromptCard, TemplateSelector, Preview
│   │   └── shared/         # DeleteConfirmModal (reusable)
│   ├── lib/
│   │   ├── db/             # PostgreSQL connection + queries
│   │   ├── ai/             # OpenRouter client + extraction (batch)
│   │   ├── auth/           # Session management
│   │   └── utils/          # Annotation parser, path helpers
│   └── types/              # TypeScript definitions
├── .env.example            # Environment template
├── .env.local              # Local environment (not committed)
└── LOCAL_SETUP.md          # Setup guide for new machines
```

---

## Local Database Setup

```bash
# Create database
psql -U ningli -d postgres -c "CREATE DATABASE annotservice;"

# Run schema and seed
psql -U ningli -d annotservice -f sql/schema.sql
psql -U ningli -d annotservice -f sql/seed.sql

# Run migrations (for soft delete support)
psql -U ningli -d annotservice -f sql/migrations/004_soft_delete.sql
```

---

## Soft Delete & Trash System

All three main entities (Documents, Prompts, Knowledge) support soft delete:

| Entity | Soft Delete Columns | Query File |
|--------|---------------------|------------|
| Documents | `is_deleted`, `deleted_at` | `src/lib/db/queries/documents.ts` |
| Prompts | `is_deleted`, `deleted_at` | `src/lib/db/queries/prompts.ts` |
| Knowledge | `is_deleted`, `deleted_at` | `src/lib/db/queries/knowledge.ts` |

### How It Works

1. **Delete from list view** → Sets `is_deleted = TRUE`, item moves to Trash
2. **Restore from Trash** → Sets `is_deleted = FALSE`, item returns to list
3. **Permanent delete** → Hard DELETE from database (only from Trash page)
4. **Empty Trash** → Permanently deletes ALL items in trash

### API Endpoints

| Endpoint | Method | Action |
|----------|--------|--------|
| `/api/documents/[id]` | DELETE | Soft delete |
| `/api/documents/[id]` | PATCH `{action: 'restore'}` | Restore |
| `/api/prompts/[id]` | DELETE | Soft delete |
| `/api/prompts/[id]` | PATCH `{action: 'restore'}` | Restore |
| `/api/knowledge/[id]` | DELETE | Soft delete |
| `/api/knowledge/[id]` | PATCH `{action: 'restore'}` | Restore |
| `/api/trash` | GET | List all deleted items |
| `/api/trash?type=X&id=Y` | DELETE | Permanent delete specific item |
| `/api/trash` | DELETE | Empty entire trash |

### Key Files

- `src/app/trash/page.tsx` - Trash UI with filters and actions
- `src/app/api/trash/route.ts` - Trash API endpoint
- `src/components/shared/DeleteConfirmModal.tsx` - Reusable confirmation modal
- `sql/migrations/004_soft_delete.sql` - Database migration

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16 + React + TypeScript + Tailwind |
| Backend | Next.js API Routes |
| Database | PostgreSQL 16 |
| AI Model | Qwen via OpenRouter |
| Auth | iron-session + bcryptjs |

---

## API Keys

```
OPENROUTER_API_KEY=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
```

---

## Testing & Debugging Principles

**CRITICAL: Do NOT patch bugs. Always identify and fix root causes systematically.**

### When Encountering Bugs

1. **Reproduce First** - Create minimal reproduction steps
2. **Trace to Root Cause** - Follow data flow from entry to failure
3. **Understand the "Why"** - What assumption was wrong?
4. **Fix Systematically** - Fix the root cause, not symptoms
5. **Verify Comprehensively** - Test fix and related functionality

### Anti-Patterns to Avoid

| Bad Practice | Better Approach |
|--------------|-----------------|
| Adding `try/catch` to hide errors | Fix the error source |
| Type casting to silence TypeScript | Fix the type definitions |
| Adding `if` checks for undefined | Ensure data exists at source |
| "It works now" without understanding | Document the root cause |

---

## Next Steps (TODO)

1. [x] Complete local testing of all features
2. [x] Deploy to Aliyun ECS (spansurvey.net/annote/)
3. [ ] Test AI knowledge extraction with real documents
4. [ ] Improve extraction prompt quality
5. [ ] Test prompt generation workflow

---

## Production Deployment

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.**

| Item | Value |
|------|-------|
| Server | 47.121.176.193 (Aliyun ECS) |
| Production URL | https://spansurvey.net/annote |
| Port | 3006 |
| SSH | `ssh -i /Users/ningli/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193` |
| App Location | `/var/www/expert-note` |
| PM2 Process | `expert-note` |

### Quick Update Commands
```bash
# SSH to server
ssh -i /Users/ningli/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193

# Update & restart (IMPORTANT: BASE_PATH must be set before build!)
cd /var/www/expert-note && git pull && npm install && export BASE_PATH=/annote && npm run build && pm2 restart expert-note

# Run database migrations (if any new ones)
sudo -u postgres psql -d annotservice -f sql/migrations/004_soft_delete.sql

# View logs
pm2 logs expert-note --lines 50
```

### CRITICAL: Build Requirement
**Always set `BASE_PATH=/annote` before running `npm run build` on production.**
Next.js `basePath` and `assetPrefix` are applied at BUILD TIME, not runtime.
Without this, JS/CSS assets will fail to load (404 errors).

### GitHub Token (for git operations)
```
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
```
