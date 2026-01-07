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
| Dashboard | Done | Document list, stats, quick links |
| Document Editor | Done | Side-by-side layout, auto-save |
| Annotation Toolbar | Done | MACRO/MESO/MICRO buttons, Cmd+1/2/3 |
| Annotation Parsing | Done | `[[LEVEL: content]]` format |
| Tag Management | Done | 10 default academic tags |
| Knowledge Base UI | Done | List, detail, filter by tags, **edit**, **download** |
| Knowledge Edit Page | Done | Edit background, tags, refined comments |
| Knowledge Download | Done | Export as Markdown with annotations by level |
| Prompt Generator UI | Done | Template selection, knowledge picker |
| Prompt Templates | Done | Customizable extraction/generation templates |
| Document API | Done | CRUD operations |
| Knowledge API | Done | Extraction, CRUD, batch processing |
| Annotations API | Done | PUT/DELETE for individual annotations |
| Prompts API | Done | Generation, CRUD |
| AI Integration | Done | OpenRouter/Qwen with batch processing |

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
│   └── seed.sql            # 10 users + 10 tags
├── src/
│   ├── app/
│   │   ├── page.tsx        # Dashboard
│   │   ├── login/          # Login page
│   │   ├── documents/      # Editor pages
│   │   ├── knowledge/
│   │   │   ├── page.tsx    # Knowledge list
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Detail view + download
│   │   │       └── edit/page.tsx # Edit page (NEW)
│   │   ├── prompts/        # Prompt generator pages
│   │   ├── settings/       # Settings pages (prompts config)
│   │   └── api/
│   │       ├── documents/  # Document CRUD
│   │       ├── knowledge/  # Knowledge CRUD + extraction
│   │       ├── annotations/[id]/ # Annotation PUT/DELETE (NEW)
│   │       ├── prompts/    # Prompt CRUD + generation
│   │       ├── prompt-templates/ # Template CRUD
│   │       └── tags/       # Tag CRUD
│   ├── components/
│   │   ├── auth/           # LoginForm
│   │   ├── editor/         # MarkdownEditor, AnnotationToolbar, Modal
│   │   ├── knowledge/      # KnowledgeCard, AnnotationList, TagFilter
│   │   └── prompts/        # PromptCard, TemplateSelector, Preview
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
```

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
| SSH | `ssh -i ningli.pem root@47.121.176.193` |
| App Location | `/var/www/expert-note` |
| PM2 Process | `expert-note` |

### Quick Update Commands
```bash
# SSH to server
ssh -i ningli.pem root@47.121.176.193

# Update & restart
cd /var/www/expert-note && git pull && npm install && npm run build && pm2 restart expert-note

# View logs
pm2 logs expert-note --lines 50
```

### GitHub Token (for git operations)
```
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
```
