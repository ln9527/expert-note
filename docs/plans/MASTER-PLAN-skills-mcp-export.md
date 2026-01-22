# Skills & MCP Export Feature - Master Plan

**Project Start:** 2026-01-21
**Last Updated:** 2026-01-22
**Status:** Phase 5 Complete - Project Complete 🎉

---

## Project Overview

Transform expert-note from a knowledge capture system into an AI skill distribution platform by enabling users to export prompts/knowledge as:
1. **Claude Code Skills** - SKILL.md packages with prompts, examples, tests
2. **MCP Endpoints** - Deployable Model Context Protocol servers

---

## Phase Summary

| Phase | Name | Status | Completion Date |
|-------|------|--------|-----------------|
| 1 | Foundation (Database + Basic UI) | ✅ Complete | 2026-01-21 |
| 1.5 | Core Features (Download, Edit, MCP Endpoint) | ✅ Complete | 2026-01-21 |
| 2 | Generation Templates | ✅ Complete | 2026-01-21 |
| 3 | Skills Builder Wizard | ✅ Complete | 2026-01-21 |
| 4 | MCP Builder Wizard | ✅ Complete | 2026-01-22 |
| 5 | Polish & Production | ✅ Complete | 2026-01-22 |

---

## Phase 1: Foundation ✅ COMPLETE

**Goal:** Database schema and basic CRUD operations

### Deliverables
- [x] `skills` table migration (012_skills_table.sql)
- [x] `mcp_prompts` table migration (013_mcp_prompts_table.sql)
- [x] Skills API routes (`/api/skills`, `/api/skills/[id]`)
- [x] MCP API routes (`/api/mcp`, `/api/mcp/[id]`)
- [x] MCP deployment routes (deploy, disable, regenerate-token)
- [x] Skills list page (`/skills`)
- [x] Skills detail page (`/skills/[id]`)
- [x] Skills create page (`/skills/new`)
- [x] MCP list page (`/mcp`)
- [x] MCP detail page (`/mcp/[id]`)
- [x] MCP create page (`/mcp/new`)
- [x] Navigation links in AppHeader
- [x] i18n translations (EN/ZH)

### Test Report
`test-reports/comprehensive-test-2026-01-21-skills-mcp.md`

---

## Phase 1.5: Core Features ✅ COMPLETE

**Goal:** Essential functionality for usable MVP

### Deliverables
- [x] Skill download as ZIP (`/api/skills/[id]/download`)
- [x] Skill edit page (`/skills/[id]/edit`)
- [x] MCP edit page (`/mcp/[id]/edit`)
- [x] MCP server endpoint (`/annote/mcp/[token]`)
  - GET: Returns manifest
  - POST: Handles initialize, prompts/list, prompts/get

### Commits
```
94902bf feat: Add MCP server endpoint handler at /annote/mcp/[token]
265c074 feat: Add MCP edit page at /mcp/[id]/edit
c996b58 fix: Preserve existing prompts/examples/tests when editing skill
a027b1d feat: Add skill edit page at /skills/[id]/edit
46a5cdb feat: Add skill download API endpoint with ZIP export
```

### Implementation Plan
`docs/plans/2026-01-21-phase2-skills-mcp-implementation.md`

---

## Phase 2: Generation Templates ✅ COMPLETE

**Goal:** Create AI prompts that generate high-quality skills and MCP content

### Approach
1. Study superpowers `writing-skills` skill for patterns
2. Create prompt templates in database (new categories)
3. Templates guide AI to produce well-structured output

### Deliverables
- [x] Study superpowers writing-skills patterns
- [x] Create `skill-generation` category templates:
  - [x] `skill-md-generator` - Creates SKILL.md content
  - [x] `skill-prompts-generator` - Creates prompts/ folder content
  - [x] `skill-examples-generator` - Creates examples/ content
  - [x] `skill-tests-generator` - Creates tests/ content
- [x] Create `mcp-generation` category templates:
  - [x] `mcp-prompt-generator` - Creates deployable MCP prompt content
- [x] Seed templates as `is_default: true` in prompt_templates table
- [x] Update API to support new categories

### Commits
```
f13e2a5 feat: Add skill-generation and mcp-generation categories to prompt_templates
e53ea58 feat: Add skill-generation templates (skill-md, prompts, examples, tests)
b9cffe2 feat: Add MCP prompt generator template
7f99d55 feat: Support skill-generation and mcp-generation categories in API
88c84e4 test: Add Phase 2 generation templates test report
```

### Test Report
`test-reports/phase2-generation-templates-test.md`

### Template Categories (prompt_templates table)
| Category | Purpose |
|----------|---------|
| extraction | (existing) Refine annotations into knowledge |
| generation | (existing) Synthesize knowledge into prompts |
| skill-generation | Generate skill file structures |
| mcp-generation | Generate MCP prompt content |

---

## Phase 3: Skills Builder Wizard ✅ COMPLETE

**Goal:** 4-step wizard UI for building skills with AI assistance

### Wizard Steps
1. **Select Sources** - Choose prompts and knowledge entries
2. **Enter Instructions** - Title, description, additional guidance
3. **Review Plan** - AI generates structure preview
4. **Build** - Confirm and create skill package

### Deliverables
- [x] Wizard UI component (`/skills/build`)
- [x] Source selection component (multi-select prompts/knowledge)
- [x] `/api/skills/generate` - AI generates plan from sources
- [x] `/api/skills/build` - Assemble files from confirmed plan
- [x] Plan preview with expandable file content
- [x] Download ZIP on completion

### Components Created
- `WizardStepIndicator.tsx` - Step progress navigation
- `WizardSourcesStep.tsx` - Prompt/knowledge selection with tabs
- `WizardInstructionsStep.tsx` - Title and instructions form
- `WizardPreviewStep.tsx` - Generated plan preview
- `WizardBuildStep.tsx` - Build and success state
- `WizardPreviewPanel.tsx` - Sticky sidebar preview

### Commits
```
ed2f83c docs: Add Phase 3 Skills Builder Wizard implementation plan
3164c52 feat: Add skills builder wizard page layout
87f037f feat: Add skills generate API endpoint
43b8269 feat: Add skills build API endpoint
286ed0b feat: Enhance source selection step with prompt/knowledge loading
dc4357f feat: Integrate wizard with generate and build APIs
```

### Test Report
`test-reports/phase3-skills-builder-test.md`

---

## Phase 4: MCP Builder Wizard ✅ COMPLETE

**Goal:** Similar wizard for building MCP prompts

### Wizard Steps
1. **Select Sources** - Choose prompts and knowledge
2. **Enter Instructions** - Title, namespace, description, guidance
3. **Review Plan** - AI generates prompt preview
4. **Build & Deploy** - Create and optionally deploy

### Deliverables
- [x] Wizard UI component (`/mcp/build`)
- [x] `/api/mcp/generate` - AI generates MCP content
- [x] `/api/mcp/build` - Create MCP prompt with permission checks
- [x] Auto-deploy option after build
- [x] Connection panel with config snippets (Claude Code, Cursor)
- [x] i18n translations (EN/ZH)

### Components Created
- `McpWizardInstructionsStep.tsx` - Title, namespace, description, instructions form
- `McpWizardPreviewStep.tsx` - Generated content preview
- `McpWizardBuildStep.tsx` - Build button and success state
- `McpConnectionPanel.tsx` - Connection config snippets with copy buttons

### Commits
```
76368df docs: Add Phase 4 MCP Builder Wizard implementation plan
bc503a6 feat: Add MCP builder wizard page layout
1462e89 fix: Use WizardStepIndicator from skills instead of inline implementation
ff4813c feat: Add MCP-specific wizard components
40fb4e2 fix: Address code quality issues in McpConnectionPanel
a3479c3 feat: Add MCP generate API endpoint
ac1e932 fix: Use handleApiError in GET /mcp/generate endpoint
d1fbca4 feat: Add MCP build API endpoint with auto-deploy
e8a0f4d fix: Add source permission checks and handle deploy failure in MCP build
dba0f38 feat: Integrate MCP wizard with generate and build APIs
bad2aec feat: Add i18n translations for MCP builder wizard
7e15f75 test: Add Phase 4 MCP builder test report
```

### Test Report
`test-reports/phase4-mcp-builder-test.md`

### Key Differences from Skills Wizard
| Feature | Skills Wizard | MCP Wizard |
|---------|---------------|------------|
| Output | File structure (SKILL.md, prompts/, examples/, tests/) | Single content string |
| Namespace | Not applicable | Required, auto-generated from title |
| Auto-deploy | Not applicable | Checkbox option (default: true) |
| Connection panel | Not applicable | Shows config snippets for Claude Code, Cursor |
| Download | ZIP file | Not applicable |

---

## Phase 5: Polish & Production ✅ COMPLETE

**Goal:** Production readiness and UX improvements

### Deliverables
- [x] CORS headers for MCP endpoints
- [x] Rate limiting on MCP endpoints (100 req/min per IP per token)
- [x] Access tracking for MCP prompts (access_count column)
- [x] Public badge display (is_public field UI)
- [x] Multi-tool config generation (Claude Code, Cursor, Windsurf, Generic)
- [x] i18n translations for new features
- [x] User documentation (Skills & MCP guides)
- [ ] Production deployment to spansurvey.net (manual step)

### New Files Created
- `src/lib/rateLimit.ts` - In-memory rate limiter
- `sql/migrations/017_mcp_access_tracking.sql` - Access count migration
- `docs/user-guide/07-skills-export.md` - Skills user guide
- `docs/user-guide/08-mcp-endpoints.md` - MCP user guide

### Commits
```
b0b7516 docs: Add Phase 5 Polish & Production implementation plan
3d342fe feat: Add CORS headers to MCP endpoint
5127cb5 feat: Add rate limiting to MCP endpoint
88a9587 feat: Add access tracking to MCP prompts
cc9e81c feat: Show public badge and access count on MCP detail page
4f9a5dd feat: Add multi-tool config support (Windsurf, generic)
53fdb9a test: Add Phase 5 polish and production test report
```

### Test Report
`test-reports/phase5-polish-production-test.md`

---

## Technical Architecture

### Database Schema

**skills table:**
```sql
- id UUID PK
- title, description
- content JSONB {skill_md, prompts:{}, examples:{}, tests:{}}
- source_prompt_ids UUID[]
- source_knowledge_ids UUID[]
- created_by, is_shared, allow_edit
- download_count, status
- created_at, updated_at, is_deleted
```

**mcp_prompts table:**
```sql
- id UUID PK
- title, description, namespace
- content TEXT
- source_prompt_ids UUID[]
- source_knowledge_ids UUID[]
- access_token VARCHAR(64)
- deployment_status (draft/deployed/disabled)
- created_by, is_shared, allow_edit, is_public
- created_at, updated_at, is_deleted
```

### File Structure (Skills Package)
```
my-skill/
├── SKILL.md           # Overview, when to use, instructions
├── prompts/           # Prompt assets
│   └── *.md
├── examples/          # Example inputs/outputs
│   └── *.md
└── tests/             # Validation scenarios
    └── *.md
```

### MCP Endpoint Structure
```
GET  /annote/mcp/{token}           → Server manifest
POST /annote/mcp/{token}           → JSON-RPC handler
  - initialize                      → Protocol info
  - prompts/list                    → Available prompts
  - prompts/get {name}              → Prompt content
```

---

## Key Decisions

1. **Skills are snapshots** - No auto-sync when sources change
2. **MCP uses signed URLs** - Token in URL is the credential
3. **Single MCP server** - Namespaced by token, not separate endpoints
4. **Templates in database** - Refinable via existing admin UI
5. **AI generation via OpenRouter** - Uses Grok 4.1 Fast model

---

## Session Log

| Date | Session | Work Done |
|------|---------|-----------|
| 2026-01-21 | 1 | Phase 1 complete: DB, API, basic UI |
| 2026-01-21 | 2 | Phase 1.5 complete: Download, Edit, MCP endpoint |
| 2026-01-21 | 3 | Phase 2 complete: Generation templates (5 templates seeded) |
| 2026-01-21 | 4 | Phase 3 complete: Skills Builder Wizard (6 components, 2 APIs) |
| 2026-01-22 | 5 | Phase 4 complete: MCP Builder Wizard (4 components, 2 APIs) |
| 2026-01-22 | 6 | Phase 5 complete: Polish & Production (CORS, rate limiting, docs) |

---

## Project Complete 🎉

All 5 phases of the Skills & MCP Export feature are complete:

1. ✅ **Phase 1**: Database schema and basic CRUD
2. ✅ **Phase 1.5**: Download, Edit, MCP server endpoint
3. ✅ **Phase 2**: AI generation templates
4. ✅ **Phase 3**: Skills Builder Wizard
5. ✅ **Phase 4**: MCP Builder Wizard
6. ✅ **Phase 5**: CORS, rate limiting, access tracking, docs

### Remaining Manual Steps
1. Apply migration `017_mcp_access_tracking.sql` to production
2. Deploy to spansurvey.net
3. Test CORS from external origin
4. Verify rate limiting with load test

### Future Enhancements (Optional)
- Analytics dashboard for download/access counts
- Public listing page for is_public MCPs
- Webhook notifications for access
- More tool-specific config formats
