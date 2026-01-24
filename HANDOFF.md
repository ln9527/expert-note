# Expert Note - Handoff Document

**Last Updated:** 2026-01-24
**Status:** ✅ Custom Template Selection + Duplicate Cleanup Complete

---

## Current System State

**Production:** https://spansurvey.net/annote
**Local Dev:** http://localhost:3000
**Database:** annotservice (PostgreSQL 16)
**PM2 Process ID:** 30

---

## Recent Changes (Jan 24, 2026)

### Custom Template Selection for Skills/MCP Wizards

Added ability for users to select custom generation templates and disable optional components during wizard flow.

**Features:**
- Collapsible "Advanced: Generation Templates" section in wizard Details step
- Checkbox to enable/disable each component (SKILL.md always required)
- Dropdown to select template for each enabled component
- Skills: SKILL.md, Prompts, Examples, Tests (last 3 optional)
- MCP: Single MCP Prompt template

**Files Created:**
```
src/components/shared/TemplateSelector.tsx    # Reusable template selector UI
src/components/shared/index.ts                # Shared component exports
docs/plans/2026-01-24-custom-template-selection-design.md
docs/plans/2026-01-24-custom-template-selection-implementation.md
```

**Files Modified:**
```
src/types/index.ts                            # Added TemplateConfig, SkillTemplateSelection, McpTemplateSelection
src/app/api/skills/generate/route.ts          # Accept templates param, use selected or defaults
src/app/api/mcp/generate/route.ts             # Accept template param
src/components/skills/WizardInstructionsStep.tsx  # Added template selector
src/app/skills/build/page.tsx                 # Pass template selections to API
src/components/mcp/McpWizardInstructionsStep.tsx  # Added template selector
src/app/mcp/build/page.tsx                    # Pass template selection to API
src/app/settings/prompts/page.tsx             # Added skill-generation & mcp-generation category filters
src/i18n/locales/en.json                      # Added i18n strings
src/i18n/locales/zh.json                      # Added i18n strings
```

### Prompt Template Duplicate Cleanup

Fixed duplicate templates caused by migrations running multiple times.

**Migrations Updated:**
```
sql/migrations/015_skill_generation_templates.sql  # Added unique partial index + ON CONFLICT
sql/migrations/016_mcp_generation_templates.sql    # Added ON CONFLICT DO NOTHING
sql/migrations/017_cleanup_duplicate_templates.sql # NEW: Removes older duplicates
```

**Final Template State (7 total, no duplicates):**
| Category | Template Type | Name |
|----------|--------------|------|
| extraction | (default) | Default Knowledge Extraction |
| generation | (default) | Default Prompt Generation |
| skill-generation | skill-md | Skill MD Generator |
| skill-generation | skill-prompts | Skill Prompts Generator |
| skill-generation | skill-examples | Skill Examples Generator |
| skill-generation | skill-tests | Skill Tests Generator |
| mcp-generation | mcp-prompt | MCP Prompt Generator |

---

## Previous Changes (Jan 23, 2026)

### Skills & MCP Bug Fixes

Fixed critical bugs affecting Skills and MCP features:

**Issues Fixed:**
1. **500 Error on Invalid UUIDs** - Requests to `/api/mcp/new` or `/api/skills/new` were caught by dynamic routes and failed with PostgreSQL UUID parse errors
2. **Missing Header** - Skills/MCP pages weren't showing AppHeader (stale build cache)

**Files Modified (UUID validation added):**
```
src/app/api/mcp/[id]/route.ts
src/app/api/mcp/[id]/deploy/route.ts
src/app/api/mcp/[id]/disable/route.ts
src/app/api/mcp/[id]/regenerate-token/route.ts
src/app/api/skills/[id]/route.ts
src/app/api/skills/[id]/download/route.ts
```

**Fix Pattern:**
```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!isValidUUID(id)) {
  return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
}
```

**Test Report:** `test-reports/ui-test-2026-01-23-skills-mcp-fixes.md`

---

## Previous Changes (Jan 21, 2026)

### Voice Input Feature for Annotations (NEW - NEEDS TESTING)

Added voice recognition to annotation input using **Alibaba Cloud ASR (智能语音交互)**.

**Features:**
- Bilingual support (Chinese & English) via 中英自由说 model
- Real-time transcription with interim results
- Microphone button in AnnotationModal

**Files Created:**
```
src/hooks/useVoiceInput.ts              # Voice capture + WebSocket hook
src/app/api/speech/token/route.ts       # Aliyun ASR token generation API
src/components/editor/VoiceInputButton.tsx  # Mic button component
```

**Files Modified:**
```
src/components/editor/AnnotationModal.tsx  # Added voice input button
.env.local                                  # Added Aliyun credentials
```

**Environment Variables Added (.env.local):**
```bash
ALIYUN_ACCESS_KEY_ID=<your-access-key-id>
ALIYUN_ACCESS_KEY_SECRET=<your-access-key-secret>
ALIYUN_ASR_APP_KEY=<your-app-key>
NEXT_PUBLIC_ALIYUN_ASR_APP_KEY=<your-app-key>
```

**Aliyun Console Setup:**
- Service: 智能语音交互 (Intelligent Speech Interaction)
- Project: expert-note
- Model: 中英自由说 (Chinese-English bilingual)
- AppKey: (see .env.local)

**To Test:**
1. Start dev server: `npm run dev`
2. Log in and open any document
3. Click annotation button (MACRO/MESO/MICRO)
4. Click microphone icon 🎤 in top-right of text input
5. Speak in Chinese or English
6. Text should appear in the textarea

**Known Issues:**
- Dev server had compilation issues on one machine (may need to clear .next cache: `rm -rf .next`)
- If server stuck on "Loading...", try restarting

---

## Previous Changes (Jan 19, 2026)

### Security Fix: Org-Based API Filtering

Fixed multi-tenant data isolation - users now only see data within their organization:

| Endpoint | Issue | Fix |
|----------|-------|-----|
| `/api/users` | Returned all users | Filter by org_id |
| `/api/tags` | Returned all tags | Filter by creator's org |
| `/api/prompt-templates` | Returned all templates | System templates visible to all, user-created org-scoped |
| `/api/annotations/[id]` | No ownership check | Added validation for PUT/DELETE |
| `/api/prompts/generate` | No access validation | Validate source document/knowledge access |

**Files Modified:**
```
src/app/api/users/route.ts
src/app/api/tags/route.ts
src/app/api/prompt-templates/route.ts
src/app/api/annotations/[id]/route.ts
src/app/api/prompts/generate/route.ts
src/lib/db/queries/tags.ts
src/lib/db/queries/knowledge.ts
src/lib/db/queries/promptTemplates.ts
```

---

## What's Implemented

### Core Features
- Login/Auth with iron-session
- Document editing with Markdown + auto-save
- Annotations (MACRO/MESO/MICRO)
- AI knowledge extraction via OpenRouter
- Prompt generation with templates
- Tag management
- Soft delete & trash

### User Management
- Roles: super_admin, owner, member, individual
- Organizations with invitation codes
- User enable/disable, password reset, soft delete
- Self-service account settings

### i18n (EN/CN)
- Language toggle in header
- ~260 translation strings
- LocalStorage persistence

---

## User Roles & Access

| Role | Access |
|------|--------|
| super_admin | Everything, manage all orgs/users |
| owner | Full org access, manage members |
| member | View shared, edit if allowed |
| individual | Own content only |

**Test Users:** admin, ning, expert1 (password: `password123`)

---

## Key Permission Pattern

```typescript
// Org-based visibility (documents, knowledge, etc.)
if (role === 'super_admin') {
  // See all
} else if ((role === 'owner' || role === 'member') && orgId) {
  // See same org only
} else {
  // Individual: own content only
}
```

---

## File Structure

```
src/
├── app/api/           # API routes with org filtering
├── components/        # React components
├── i18n/              # Internationalization
├── lib/
│   ├── auth/          # Session management
│   └── db/queries/    # Database queries with org visibility
sql/migrations/        # Database migrations (latest: 017)
```

---

## Deployment

```bash
# After git push
ssh -i /Users/ningli/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193 \
  "cd /var/www/expert-note && git pull && export BASE_PATH=/annote && npm install && npm run build && pm2 restart expert-note"
```

⚠️ **PM2 does NOT load .env files!** See DEPLOYMENT.md for explicit env vars.

---

## Priorities

1. **PDF Word-Joining** - Words like "demandpersonalized" in PDF conversion
2. **Migration Cleanup** - Renumber duplicate migration files
3. **Remove "Test Organization"** - Legacy seed data cleanup

---

## Quick Commands

```bash
npm run dev                              # Local dev
npm run build                            # Build (must pass)
psql -h localhost -U ningli -d annotservice  # DB access
```

---

**Read `CLAUDE.md` for more project details.**
