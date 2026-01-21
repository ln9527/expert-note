# Skills & MCP Export Feature - Master Plan

**Project Start:** 2026-01-21
**Last Updated:** 2026-01-21
**Status:** Phase 2 Complete

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
| 3 | Skills Builder Wizard | ⏳ Pending | - |
| 4 | MCP Builder Wizard | ⏳ Pending | - |
| 5 | Polish & Production | ⏳ Pending | - |

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

## Phase 3: Skills Builder Wizard ⏳ PENDING

**Goal:** 4-step wizard UI for building skills with AI assistance

### Wizard Steps
1. **Select Sources** - Choose prompts and knowledge entries
2. **Enter Instructions** - Title, description, additional guidance
3. **Review Plan** - AI generates structure preview
4. **Build** - Confirm and create skill package

### Deliverables
- [ ] Wizard UI component (`/skills/build`)
- [ ] Source selection component (multi-select prompts/knowledge)
- [ ] `/api/skills/generate` - AI generates plan from sources
- [ ] `/api/skills/build` - Assemble files from confirmed plan
- [ ] Plan preview with expandable file content
- [ ] Download ZIP on completion

### API Specs
```
POST /api/skills/generate
Body: { sourcePromptIds[], sourceKnowledgeIds[], title, description, instructions }
Returns: { plan: { files: [...] }, previewContent: {...} }

POST /api/skills/build
Body: { plan, title, description, isShared, allowEdit }
Returns: { skill, downloadUrl }
```

---

## Phase 4: MCP Builder Wizard ⏳ PENDING

**Goal:** Similar wizard for building MCP prompts

### Wizard Steps
1. **Select Sources** - Choose prompts and knowledge
2. **Enter Instructions** - Title, namespace, description, guidance
3. **Review Plan** - AI generates prompt preview
4. **Build & Deploy** - Create and optionally deploy

### Deliverables
- [ ] Wizard UI component (`/mcp/build`)
- [ ] `/api/mcp/generate` - AI generates MCP content
- [ ] `/api/mcp/build` - Create MCP prompt
- [ ] Auto-deploy option after build
- [ ] Connect panel with config snippets

### API Specs
```
POST /api/mcp/generate
Body: { sourcePromptIds[], sourceKnowledgeIds[], title, description, namespace, instructions }
Returns: { plan: { content, namespace }, previewContent }

POST /api/mcp/build
Body: { plan, title, description, namespace, isShared, allowEdit, isPublic }
Returns: { mcpPrompt }
```

---

## Phase 5: Polish & Production ⏳ PENDING

**Goal:** Production readiness and UX improvements

### Deliverables
- [ ] Multi-tool config generation (Claude Code, Cursor, others)
- [ ] Download tracking and analytics
- [ ] Public sharing controls
- [ ] Rate limiting on MCP endpoints
- [ ] CORS headers for MCP endpoints
- [ ] Production deployment to spansurvey.net
- [ ] Documentation for end users

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

---

## Next Actions (Phase 3: Skills Builder Wizard)

1. Create wizard UI component (`/skills/build`)
2. Build source selection component (multi-select prompts/knowledge)
3. Implement `/api/skills/generate` endpoint
4. Implement `/api/skills/build` endpoint
5. Add plan preview with expandable file content
6. Integrate ZIP download on completion
