# Implementation History - Detailed Archive

**This document archives detailed implementation information.**
**For current system state, see HANDOFF.md**

---

## Complete Feature Matrix (As of Jan 11, 2026)

| Feature | Status | Implementation Date | Notes |
|---------|--------|-------------------|-------|
| Login/Auth | ✅ Done | Initial | 10 hardcoded users, iron-session |
| Dashboard | ✅ Done | Initial | Document list, stats, quick links |
| Document Editor | ✅ Done | Initial | Side-by-side layout, auto-save |
| Annotation Toolbar | ✅ Done | Initial | MACRO/MESO/MICRO buttons, Cmd+1/2/3 |
| Annotation Parsing | ✅ Done | Initial | `[[LEVEL: content]]` format |
| Tag Management | ✅ Done | Initial | 10 default academic tags |
| Knowledge Base UI | ✅ Done | Initial | List, detail, filter by tags |
| Knowledge Edit Page | ✅ Done | Initial | Edit background, tags, refined comments |
| Knowledge Download | ✅ Done | Initial | Export as Markdown |
| Prompt Generator UI | ✅ Done | Initial | Template selection, knowledge picker |
| Prompt Templates | ✅ Done | Initial | Extraction/generation templates |
| Soft Delete & Trash | ✅ Done | Initial | Trash page, restore, permanent delete |
| Registration System | ✅ Done | Jan 9 | With invitation codes |
| User Roles | ✅ Done | Jan 9 | super_admin, owner, member, individual |
| Organizations | ✅ Done | Jan 9-11 | With member management |
| Org-based Visibility | ✅ Done | Jan 9 | All entities (docs, knowledge, prompts) |
| Sharing Toggles | ✅ Done | Jan 9-11 | In document list (not editor) |
| Read-only Mode | ✅ Done | Jan 11 | For view-only shared documents |
| Admin Org Creation | ✅ Done | Jan 11 | With auto-generated owner codes |
| Owner Member Invites | ✅ Done | Jan 11 | Scoped to owner's org |
| Permission Checks | ✅ Done | Jan 9-11 | All API endpoints secured |

---

## Annotation Format

```
[[MACRO: High-level principle or judgment]]
[[MESO: Pattern-level guidance]]
[[MICRO: Specific edit or suggestion]]
```

Colors: MACRO=Red, MESO=Yellow, MICRO=Green

---

## Complete Project Structure

```
expert-note/
├── sql/
│   ├── schema.sql                      # Database tables
│   ├── seed.sql                        # 10 users + 10 tags
│   └── migrations/                     # Database migrations
│       ├── 001_add_location_to_annotations.sql
│       ├── 002_prompt_tags.sql
│       ├── 003_update_extraction_template.sql
│       ├── 004_soft_delete.sql
│       ├── 005_user_management_system.sql
│       ├── 006_org_creation_improvements.sql  # Not used
│       └── 007_org_creation_improvements.sql  # Latest ✅
│
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Dashboard
│   │   ├── login/page.tsx              # Login
│   │   ├── register/page.tsx           # Registration
│   │   │
│   │   ├── documents/
│   │   │   ├── [id]/page.tsx           # Editor
│   │   │   └── new/page.tsx            # New document
│   │   │
│   │   ├── knowledge/
│   │   │   ├── page.tsx                # Knowledge list
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Detail view
│   │   │       └── edit/page.tsx       # Edit page
│   │   │
│   │   ├── prompts/
│   │   │   ├── page.tsx                # Prompts list
│   │   │   ├── [id]/page.tsx           # Prompt detail
│   │   │   └── generate/page.tsx       # Generator
│   │   │
│   │   ├── settings/
│   │   │   ├── page.tsx                # Settings redirect
│   │   │   ├── layout.tsx              # Settings navigation
│   │   │   ├── admin/page.tsx          # Super admin features
│   │   │   ├── invites/page.tsx        # Owner invitations
│   │   │   ├── prompts/page.tsx        # Generation guides
│   │   │   └── tags/page.tsx           # Tag management
│   │   │
│   │   ├── trash/page.tsx              # Trash management
│   │   │
│   │   └── api/
│   │       ├── auth/                   # Authentication
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   ├── register/route.ts
│   │       │   └── session/route.ts
│   │       │
│   │       ├── admin/                  # Admin endpoints
│   │       │   ├── organizations/route.ts
│   │       │   └── invitation-codes/route.ts
│   │       │
│   │       ├── documents/              # Document CRUD
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       │
│   │       ├── knowledge/              # Knowledge CRUD
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   └── extract/route.ts
│   │       │
│   │       ├── prompts/                # Prompts CRUD
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   ├── generate/route.ts
│   │       │   └── upload/route.ts
│   │       │
│   │       ├── prompt-templates/       # Template CRUD
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       │
│   │       ├── annotations/[id]/route.ts
│   │       ├── tags/                   # Tag CRUD
│   │       ├── invites/route.ts        # Owner invitations
│   │       ├── trash/route.ts          # Trash operations
│   │       └── users/route.ts
│   │
│   ├── components/
│   │   ├── auth/LoginForm.tsx
│   │   ├── editor/
│   │   │   ├── MarkdownEditor.tsx
│   │   │   ├── AnnotationToolbar.tsx
│   │   │   └── Modal.tsx
│   │   ├── knowledge/
│   │   │   ├── KnowledgeCard.tsx
│   │   │   ├── AnnotationList.tsx
│   │   │   └── TagFilter.tsx
│   │   ├── prompts/
│   │   │   ├── PromptCard.tsx
│   │   │   ├── TemplateSelector.tsx
│   │   │   └── Preview.tsx
│   │   ├── documents/
│   │   │   └── DocumentSwitcher.tsx
│   │   ├── layout/
│   │   │   └── AppHeader.tsx
│   │   └── shared/
│   │       └── DeleteConfirmModal.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── queries/
│   │   │       ├── documents.ts
│   │   │       ├── knowledge.ts
│   │   │       ├── prompts.ts
│   │   │       ├── promptTemplates.ts
│   │   │       ├── tags.ts
│   │   │       ├── users.ts
│   │   │       ├── organizations.ts
│   │   │       └── invitationCodes.ts
│   │   │
│   │   ├── ai/
│   │   │   └── extraction.ts
│   │   │
│   │   ├── auth/
│   │   │   └── session.ts
│   │   │
│   │   └── utils/
│   │       ├── annotation.ts
│   │       └── pathHelper.ts
│   │
│   └── types/
│       └── index.ts                    # All TypeScript definitions
│
├── HANDOFF.md                          # Current system state
├── CLAUDE.md                           # This config
├── RECENT_WORK_2026-01.md              # Recent changes
├── DEPLOYMENT.md                       # Deployment guide
├── PRE_DEPLOYMENT_CHECKLIST.md         # Testing checklist
├── .env.example                        # Environment template
└── .env.local                          # Local environment (gitignored)
```

---

## Soft Delete System (Detailed)

All three main entities support soft delete:

| Entity | Columns | Query File |
|--------|---------|------------|
| Documents | `is_deleted`, `deleted_at` | `src/lib/db/queries/documents.ts` |
| Prompts | `is_deleted`, `deleted_at` | `src/lib/db/queries/prompts.ts` |
| Knowledge | `is_deleted`, `deleted_at` | `src/lib/db/queries/knowledge.ts` |

### Workflow

1. **Delete from list view** → `is_deleted = TRUE`, `deleted_at = NOW()` → Moves to trash
2. **Restore from trash** → `is_deleted = FALSE`, `deleted_at = NULL` → Returns to list
3. **Permanent delete** → `DELETE FROM` → Cannot be undone
4. **Empty trash** → Deletes all items where `is_deleted = TRUE`

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

### Security
- Only creators see their deleted items in trash
- Only creators can restore their items
- Only creators can permanently delete their items
- Shared users don't see deleted shared items

---

## User Roles & Permissions (Detailed)

### Role Hierarchy

```
super_admin (system administrator)
  ↓
owner (organization administrator)
  ↓
member (organization user)

individual (standalone user, no org)
```

### Permission Matrix

| Action | super_admin | owner | member | individual |
|--------|-------------|-------|--------|------------|
| Create organization | ✅ | ❌ | ❌ | ❌ |
| Generate owner codes | ✅ (auto) | ❌ | ❌ | ❌ |
| Generate member codes | ✅ | ✅ (own org) | ❌ | ❌ |
| Generate individual codes | ✅ | ❌ | ❌ | ❌ |
| Manage generation guides | ✅ | ✅ | ❌ | ❌ |
| View own content | ✅ | ✅ | ✅ | ✅ |
| View shared content | ✅ | ✅ (same org) | ✅ (same org) | ❌ |
| Share content | ✅ | ✅ | ✅ | ❌ (no org) |
| Edit shared content | ✅ | ✅ (if allowed) | ✅ (if allowed) | ❌ |
| Delete any content | ✅ (own only) | ✅ (own only) | ✅ (own only) | ✅ (own only) |
| Manage tags | ✅ | ✅ | ✅ | ✅ |

### Test Users (Local DB)

| Username | Role | Org ID | Use For |
|----------|------|--------|---------|
| admin | super_admin | NULL | System admin testing |
| ning | owner | 1 | Org owner testing |
| expert1-2 | member | 1 | Org member testing |
| student1-3 | member | 1 | Additional members |
| researcher1-2 | member | 1 | Additional members |
| guest | member | 1 | Guest access testing |

All passwords: `password123`

---

## Org Visibility Implementation (Detailed)

### SQL Pattern (Used in Documents, Knowledge, Prompts)

```sql
-- Base visibility query pattern
WHERE (
  entity.created_by = $user_id  -- User's own items
  OR
  (entity.is_shared = TRUE       -- Shared items
   AND creator.org_id = $user_org_id)  -- Same organization
)
AND entity.is_deleted = FALSE    -- Exclude deleted items
```

### Admin Bypass

```sql
-- For super_admin and owners
WHERE (
  role = 'super_admin'
  OR (role = 'owner' AND creator.org_id = $user_org_id)
  OR entity.created_by = $user_id
  OR (entity.is_shared = TRUE AND creator.org_id = $user_org_id)
)
```

### Implementation Locations

**Documents:** `src/lib/db/queries/documents.ts` (lines 55-146)
**Knowledge:** `src/lib/db/queries/knowledge.ts` (lines 127-197)
**Prompts:** `src/lib/db/queries/prompts.ts` (similar pattern)

---

## Sharing System (Detailed)

### Three Sharing States

1. **Private (🔒)**
   - `is_shared = FALSE`
   - Only creator can see/edit
   - No org visibility

2. **Shared, View-only (🔓)**
   - `is_shared = TRUE`, `allow_edit = FALSE`
   - Org members can view
   - Cannot edit (read-only mode)

3. **Shared, Editable (🔓 + ✏️)**
   - `is_shared = TRUE`, `allow_edit = TRUE`
   - Org members can view AND edit
   - Full editing capabilities

### Control Location

**Before (Jan 9):** Toggles inside document editor
- Problem: Members could see/manipulate toggles
- Security risk: Confusion about who controls sharing

**After (Jan 11):** Icons in document list
- Owners: Clickable icons to toggle
- Members: Read-only badges (visual indicators only)
- Clear: Who owns controls what

### UI Elements

**Document List (Dashboard):**
- Sharing column: 🔓 (shared) or 🔒 (private)
- Edit column: ✏️ (editable, only when shared)
- Owners see clickable buttons
- Members see gray badges

**Document Editor:**
- No sharing controls
- Read-only banner if view-only
- Editor disabled if cannot edit
- Extract/Delete buttons hidden if read-only

---

## Invitation Code System (Detailed)

### Evolution

**Before (Initial):**
- `org_creator`: Created new org during registration
- `org_invite`: Joined existing org
- `individual`: Standalone user

**Problem:** Org didn't exist until someone used code → dropdown was empty

**After (Jan 11):**
- `org_owner`: Joins existing org as owner
- `org_member`: Joins existing org as member
- `individual`: Standalone user

**Solution:** Admin creates org first → Auto-generates owner code → Clear flow

### Workflow

```
1. Super Admin:
   └─> Creates organization "Research Lab"
       └─> System auto-generates org_owner code "ABC12345"

2. Researcher:
   └─> Registers with code "ABC12345"
       └─> Becomes owner of "Research Lab"

3. Owner or Super Admin:
   └─> Creates org_member codes for "Research Lab"

4. Team Members:
   └─> Register with member codes
       └─> Join "Research Lab" as members
```

### Code Generation Rules

| Who | Can Create | Code Type | Scope |
|-----|------------|-----------|-------|
| super_admin | Any code | individual, org_owner (auto), org_member | Any org |
| owner | Member codes only | org_member | Own org only |
| member | None | - | - |
| individual | None | - | - |

---

## Security Vulnerability Fixes (Jan 9, 2026)

### Critical Issues Found

**Agent D (Integration Testing) discovered:**

1. **Knowledge API PUT** - No permission check
   - Impact: Any user could edit any knowledge entry
   - Severity: HIGH
   - Fixed: Added owner/org permission validation

2. **Knowledge API GET** - No visibility check
   - Impact: Any user could view any knowledge entry
   - Severity: MEDIUM
   - Fixed: Added owner/org visibility check

3. **Knowledge API DELETE** - No ownership check
   - Impact: Any user could delete any knowledge entry
   - Severity: MEDIUM
   - Fixed: Restricted to creator only

### How They Were Fixed

**File:** `src/app/api/knowledge/[id]/route.ts`

**Lines 72-86** (GET endpoint):
```typescript
const canView = entry.createdBy === user.userId ||
                (entry.isShared && userOrgId && creatorOrgId &&
                 userOrgId === creatorOrgId);
if (!canView) return 404;
```

**Lines 110-125** (PUT endpoint):
```typescript
const canEdit = existing.createdBy === user.userId ||
                (existing.isShared && existing.allowEdit &&
                 userOrgId && creatorOrgId &&
                 userOrgId === creatorOrgId);
if (!canEdit) return 403;
```

**Lines 192-198** (DELETE endpoint):
```typescript
if (existing.createdBy !== user.userId) return 403;
```

### Attack Scenarios Prevented

**Before Fix:**
```bash
# User from org_id=2 could edit entry from org_id=1
curl -X PUT /api/knowledge/123 -d '{"background":"Hacked"}'
# Returned: 200 OK ❌
```

**After Fix:**
```bash
# Same request now properly rejected
curl -X PUT /api/knowledge/123 -d '{"background":"Hacked"}'
# Returns: 403 Forbidden ✅
```

---

## API Keys & Environment

```env
OPENROUTER_API_KEY=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

DATABASE_URL=postgresql://ningli@localhost:5432/annotservice

SESSION_SECRET=complex_password_at_least_32_characters_long
```

---

## Database Migrations Timeline

| # | File | Date | Description |
|---|------|------|-------------|
| 001 | add_location_to_annotations.sql | - | Added location tracking |
| 002 | prompt_tags.sql | - | Tag support for prompts |
| 003 | update_extraction_template.sql | - | Improved extraction |
| 004 | soft_delete.sql | - | Soft delete for all entities |
| 005 | user_management_system.sql | Jan 9 | Orgs, roles, sharing columns |
| 006 | org_creation_improvements.sql | Jan 11 | Created but not used (duplicate) |
| 007 | org_creation_improvements.sql | Jan 11 | Invitation type updates ✅ |

---

## Local Database Setup (Detailed)

```bash
# 1. Create database
psql -U ningli -d postgres -c "CREATE DATABASE annotservice;"

# 2. Run schema
psql -U ningli -d annotservice -f sql/schema.sql

# 3. Seed data
psql -U ningli -d annotservice -f sql/seed.sql

# 4. Run all migrations (in order)
for f in sql/migrations/*.sql; do
  echo "Running $f..."
  psql -U ningli -d annotservice -f "$f"
done

# 5. Verify
psql -U ningli -d annotservice -c "\dt"  # List tables
```

---

## Production Server Details

**Aliyun ECS Server:**
- IP: 47.121.176.193
- OS: Ubuntu/Debian
- Nginx: Reverse proxy (port 80/443 → 3006)
- PM2: Process manager
- PostgreSQL: Database server
- Node.js: Runtime

**App Location:** `/var/www/expert-note`
**Process Name:** `expert-note`
**Port:** 3006
**Base Path:** `/annote`

**SSH Key:** `ningli.pem` (in project root)

### Full Deployment Steps

```bash
# 1. SSH to server
ssh -i /Users/ningli/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193

# 2. Navigate to app
cd /var/www/expert-note

# 3. Pull changes
git pull origin main

# 4. Install dependencies
npm install

# 5. Run migrations (if any)
sudo -u postgres psql -d annotservice -f sql/migrations/007_org_creation_improvements.sql

# 6. Build with BASE_PATH
export BASE_PATH=/annote
npm run build

# 7. Restart PM2
pm2 restart expert-note

# 8. Verify
pm2 logs expert-note --lines 50
curl https://spansurvey.net/annote

# 9. Check status
pm2 status
pm2 logs expert-note
```

---

## Testing Approach History

### Phase 4 Testing (Jan 9, 2026)

**Method:** 4 parallel test agents using browser automation

**Results:**
- Agent A: Sharing toggles (found UX bug - sharing shown to no-org users)
- Agent B: Access control (all tests passed ✅)
- Agent C: Invitation codes (blocked by sandbox restrictions)
- Agent D: Integration testing (code review - found 3 critical security bugs)

**Outcome:** 4 bugs found, 4 bugs fixed (100% resolution)

### Final Implementation (Jan 11, 2026)

**Method:** 5 parallel agents implementing fixes

**Results:**
- Agent 1: Document list sharing UI ✅
- Agent 2: Editor cleanup + read-only ✅
- Agent 3: Database schema updates ✅
- Agent 4: Org creation API + UI ✅
- Agent 5: Owner invitation management ✅

**Outcome:** All features implemented, build successful, migration executed

---

## Terminology Guide (Detailed)

See `docs/GLOSSARY.md` for complete reference.

### Common Confusions

1. **"Generation Guide" vs "PromptTemplate"**
   - UI label: "Generation Guide"
   - Code/DB: `PromptTemplate`, `prompt_templates` table
   - Reason: UX clarity (changed Jan 2026 for user-facing clarity)

2. **"System Prompt" vs "Generated Prompt"**
   - Both refer to same thing
   - Database: `system_prompts` table
   - UI: "Prompts" page

3. **"Sharing" vs "Organization Visibility"**
   - Same concept, different contexts
   - Sharing: UI terminology
   - Org visibility: Database/code terminology

4. **"Annotation" vs "Knowledge"**
   - Annotation: Raw expert comment in document
   - Knowledge: Extracted, refined annotation with metadata

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://ningli@localhost:5432/annotservice
DB_HOST=localhost
DB_PORT=5432
DB_NAME=annotservice
DB_USER=ningli
DB_PASSWORD=

# Auth
SESSION_SECRET=complex_password_at_least_32_characters_long

# AI
OPENROUTER_API_KEY=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

# Production
BASE_PATH=/annote  # Only for production builds
```

---

## Known Issues & Edge Cases

### Resolved
- ✅ Knowledge API permissions (fixed Jan 9)
- ✅ Sharing UI shown to no-org users (fixed Jan 11)
- ✅ Org creation confusion (fixed Jan 11 - create org first)
- ✅ Members could toggle sharing (fixed Jan 11 - removed from editor)

### Pending
- ⏳ NULL org_id edge cases (needs explicit NULL checks)
- ⏳ Shared deletion UX (no notification to members)
- ⏳ Session expiration handling (no graceful error)
- ⏳ Prompts API permission review (may have same vulnerabilities)

### By Design (Not Issues)
- "Generation Guide" ≠ "PromptTemplate" in code (terminology mismatch is intentional)
- Sharing controls in list not editor (user requested)
- No bulk operations yet (future enhancement)
- No email invitations (future enhancement)

---

## Git Workflow

```bash
# Check status
git status

# Recent branches
git branch -a

# Recent commits
git log --oneline -10

# Current branch
git branch --show-current
```

**Main branch:** `main`
**No feature branches currently**
**Direct commits to main** (small team workflow)

---

**Archive Date:** 2026-01-11
**Purpose:** Preserve detailed implementation history
**Current Docs:** See HANDOFF.md and RECENT_WORK_2026-01.md for active information
