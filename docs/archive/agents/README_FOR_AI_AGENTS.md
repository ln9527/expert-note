# Guide for AI Agents - Start Here

**If you're an AI agent picking up this project, read this first.**

---

## 📍 You Are Here

This is the **Expert Note System** - an annotation-based knowledge capture application.

**Current Status:** ✅ **User management complete** - Ready for testing and production

---

## 🗺️ Documentation Map (Read in This Order)

### 1. Start: Current System State
**Read:** `HANDOFF.md` (5 minutes)
- What's implemented and working
- What needs to be done next
- Quick reference for common tasks
- File locations you'll need

### 2. Project Configuration
**Read:** `CLAUDE.md` (3 minutes)
- Quick start commands
- Database connection
- Permission patterns
- Deployment info

### 3. Recent Work Context
**Read:** `RECENT_WORK_2026-01.md` (10 minutes if needed)
- What was just implemented (Jan 9-11)
- Why certain decisions were made
- What changed and where

### 4. Before Making Changes
**Check:**
- `PRE_DEPLOYMENT_CHECKLIST.md` - If deploying
- `docs/GLOSSARY.md` - If confused about terminology
- `docs/IMPLEMENTATION_HISTORY.md` - If need detailed history

---

## 🎯 Quick Decision Tree

### "I need to..."

**...understand the current system**
→ Read `HANDOFF.md`

**...add a new feature**
→ Read `HANDOFF.md` → Check "Permission Pattern" in `CLAUDE.md` → Follow existing patterns

**...fix a bug**
→ Read debugging principles in `CLAUDE.md` → Find root cause → Fix systematically

**...deploy to production**
→ Read `DEPLOYMENT.md` → Follow checklist in `PRE_DEPLOYMENT_CHECKLIST.md`

**...understand "Generation Guide" vs "Template" confusion**
→ Read `docs/GLOSSARY.md`

**...know what was just done**
→ Read `RECENT_WORK_2026-01.md`

---

## ⚡ Super Quick Start

```bash
# Start dev server
npm run dev

# Login
# URL: http://localhost:3000
# User: ning | Password: password123

# Test sharing (new feature)
# 1. Dashboard shows 🔓/🔒 icons
# 2. Click to toggle sharing
# 3. Open document - no sharing toggles inside
```

---

## 🎓 Key Concepts

### User Roles (4 types)
- **super_admin** → Creates orgs, all codes
- **owner** → Manages org, creates member codes
- **member** → Uses shared content
- **individual** → No org features

### Sharing States (3 modes)
- 🔒 **Private** → Only creator
- 🔓 **Shared (view-only)** → Org can view
- 🔓+✏️ **Shared (editable)** → Org can edit

### Invitation Codes (3 types)
- **individual** → Standalone user
- **org_owner** → Joins org as owner (auto-generated)
- **org_member** → Joins org as member

---

## 🚨 Critical Rules

1. **Always check permissions** - Every API route needs auth + authorization
2. **Never patch bugs** - Find and fix root causes
3. **Test with multiple roles** - admin, owner, member views differ
4. **Follow patterns** - Use documents API as reference
5. **Build must pass** - `npm run build` before any commit

---

## 📂 Where Things Are

```
Key Files:
├── HANDOFF.md              ← Start here
├── CLAUDE.md               ← Project config
├── RECENT_WORK_2026-01.md  ← Recent changes
│
├── src/app/page.tsx        ← Dashboard (sharing icons)
├── src/app/api/            ← All API routes
├── src/lib/db/queries/     ← Database queries
├── src/types/index.ts      ← Type definitions
│
├── sql/migrations/         ← Database migrations
└── docs/                   ← Additional documentation
```

---

## ✅ What Works Now

- Full annotation system (MACRO/MESO/MICRO)
- Knowledge extraction with AI
- Prompt generation
- User management with organizations
- Sharing with permission control
- Read-only mode for shared documents
- Admin and owner invitation management

**Everything is ready for testing!**

---

## ⏭️ What's Next

1. **Test** - Manual security testing (see checklist)
2. **Deploy** - Push to production (see DEPLOYMENT.md)
3. **Enhance** - NULL safety, better errors, integration tests

---

## 🆘 If You're Stuck

1. **System overview?** → Read `HANDOFF.md`
2. **Can't find something?** → Check `docs/IMPLEMENTATION_HISTORY.md`
3. **Terminology confusing?** → Read `docs/GLOSSARY.md`
4. **Need to deploy?** → Read `DEPLOYMENT.md`
5. **Build failing?** → Check TypeScript errors, verify types

---

## 📝 Documentation Structure

```
Root Level (Essential - read these):
├── README_FOR_AI_AGENTS.md  ← You are here
├── HANDOFF.md               ← System state & next tasks
├── CLAUDE.md                ← Project configuration
├── RECENT_WORK_2026-01.md   ← Recent changes log
├── PRE_DEPLOYMENT_CHECKLIST.md ← Testing checklist
└── DEPLOYMENT.md            ← Deployment guide

docs/ (Reference - read as needed):
├── GLOSSARY.md              ← Terminology reference
├── IMPLEMENTATION_HISTORY.md ← Detailed feature history
├── TESTING_SUMMARY_2026-01-09.md ← Test results
├── SECURITY_FIX_KNOWLEDGE_EDIT.md ← Security fixes applied
└── (other agent reports...)
```

---

## 💬 Quick Facts

- **Language:** TypeScript + React
- **Database:** PostgreSQL 16
- **Test Users:** 10 (admin, ning, expert1-2, student1-3, researcher1-2, guest)
- **All Passwords:** `password123`
- **Build Time:** ~15-30 seconds
- **Latest Migration:** 007 (invitation code types)
- **Last Major Work:** User management system (Jan 9-11, 2026)

---

**Updated:** 2026-01-11
**For:** Next AI agent
**Next Step:** Read `HANDOFF.md` → Start developing

**Good luck!** 🚀
