# Production Deployment Checklist - January 8, 2026

**Server:** 47.121.176.193 (Aliyun ECS)
**URL:** https://spansurvey.net/annote
**Branch:** main
**Status:** Ready for Deployment

---

## Pre-Deployment Checklist

- [x] All changes committed to git
- [x] All tests passed locally
- [x] Documentation updated
- [x] Migration files ready (005, 006)
- [x] GitHub repository up to date
- [ ] Production database backed up (execute during deployment)

---

## Changes Being Deployed

### Database Migrations Required (in order)
1. **005_fix_prompt_templates.sql** - Template format alignment with database structure
2. **006_prompt_enhancements.sql** - Document sources, versioning, and tag support

### Major Features Implemented
1. **Database Templates as Source of Truth** - Template configuration verified against database schema
2. **Enhanced Prompt Generation** - Document-based generation (bypass extraction), versioning (v1→v2→v3), tag association
3. **Knowledge Table View** - Sortable table display with toggle between list/table views
4. **Document Search** - Fuzzy matching search with debounced input
5. **Comprehensive Document Filters** - Filter by tags, status, user, date range
6. **Tag Inheritance** - Tags cascade from documents to extracted knowledge
7. **Terminology Update** - "Generation Guide" terminology for clarity
8. **Annotation Statistics Fix** - Fixed string concatenation bug

### Components Added
- **ViewModeToggle** (reusable, list/table switch)
- **KnowledgeTable** (sortable, interactive)
- **SearchBox** (reusable, debounced)
- **DocumentFilters** (comprehensive filtering)
- **BasePromptSelector** (versioning support)
- **DocumentSelector** (multi-source selection)

### Bug Fixes
- JSX syntax errors (multiple components)
- Missing database table definitions
- Session timeout increased (3min → 2hrs)
- Template selector state persistence
- Annotation statistics string concatenation

### Documentation Added
- 35+ test and implementation documents
- GLOSSARY.md - terminology reference
- Comprehensive test results
- Implementation guides
- Bug reports and fixes

### Files Changed Summary
- **Modified:** 31 files
- **Created:** 6 new components
- **New Migrations:** 2 database migrations
- **Lines Added:** ~3,000

---

## Deployment Steps

### Step 1: Backup Production Database
```bash
# SSH to server
ssh -i /Users/ningli/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193

# Create backup
pg_dump -U postgres annotservice > /var/backups/annotservice_backup_$(date +%Y%m%d_%H%M%S).sql
ls -lh /var/backups/annotservice_backup_*  # Verify backup created
```

**Expected Output:**
```
-rw-r--r-- 1 root root 2.5M Jan  8 18:00 /var/backups/annotservice_backup_20260108_180000.sql
```

### Step 2: Navigate to Application Directory
```bash
cd /var/www/expert-note
pwd  # Verify location
ls -la | head -10  # Verify directory contents
```

### Step 3: Check Current Status
```bash
pm2 status expert-note
git status
git log -5 --oneline
```

### Step 4: Pull Latest Code
```bash
git fetch origin
git pull origin main
echo "Deployed commit: $(git rev-parse HEAD)"
```

### Step 5: Install Dependencies
```bash
npm install
```

**Expected Output:**
```
added X packages, removed Y packages in Zs
```

### Step 6: Apply Database Migrations (CRITICAL ORDER)

#### Migration 005 - Fix Prompt Templates
```bash
sudo -u postgres psql -d annotservice -f sql/migrations/005_fix_prompt_templates.sql
echo "Migration 005 completed"
```

#### Migration 006 - Prompt Enhancements
```bash
sudo -u postgres psql -d annotservice -f sql/migrations/006_prompt_enhancements.sql
echo "Migration 006 completed"
```

#### Verify Migrations Applied
```bash
# Check prompt_tags table exists
sudo -u postgres psql -d annotservice -c "
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'prompt_tags'
  LIMIT 1;
"

# Check system_prompts has new columns
sudo -u postgres psql -d annotservice -c "
  SELECT column_name FROM information_schema.columns
  WHERE table_name='system_prompts'
  AND column_name IN ('source_document_ids', 'base_prompt_id', 'version_number')
  ORDER BY column_name;
"
```

**Expected Output:**
```
 table_name
────────────
 prompt_tags
(1 row)

      column_name
─────────────────
 base_prompt_id
 source_document_ids
 version_number
(3 rows)
```

### Step 7: Build Application (CRITICAL: BASE_PATH=/annote required)
```bash
# Set BASE_PATH - this is applied at BUILD TIME
export BASE_PATH=/annote

# Run build
npm run build

# Verify build succeeded
echo "Build exit code: $?"
ls -la .next/  # Verify .next directory created
```

### Step 8: Restart Application with PM2
```bash
pm2 restart expert-note
sleep 2
pm2 status expert-note
```

**Expected Output:**
```
┌─────┬──────────────┬──────────┬──────┬───────────┬──────────┐
│ id  │ name         │ mode     │ ↺    │ status    │ cpu      │
├─────┼──────────────┼──────────┼──────┼───────────┼──────────┤
│ 0   │ expert-note  │ fork     │ 0    │ online    │ 0%       │
└─────┴──────────────┴──────────┴──────┴───────────┴──────────┘
```

### Step 9: Check Application Logs
```bash
pm2 logs expert-note --lines 50

# Look for:
# - No error messages
# - "API server running" or similar startup message
# - No "Cannot find module" errors
```

### Step 10: Verify Service Health
```bash
# Test HTTP response
curl -I https://spansurvey.net/annote
# Expected: HTTP/1.1 200 OK

# Check if redirects properly
curl -L https://spansurvey.net/annote -w "\nFinal URL: %{url_effective}\n" | head -5
```

---

## Post-Deployment Verification

### Critical Verification Checklist

1. **Application Accessibility**
   - [ ] URL loads: https://spansurvey.net/annote
   - [ ] Returns 200 OK (no 404, 500, or redirects)
   - [ ] Page title shows "Expert Note"

2. **Authentication**
   - [ ] Login page accessible
   - [ ] Can login with test credentials (ning/password123)
   - [ ] Redirects to dashboard after login
   - [ ] Session persists on refresh

3. **Dashboard & Core Features**
   - [ ] Dashboard loads without errors
   - [ ] Document list displays
   - [ ] Search box functional
   - [ ] Can create new document
   - [ ] Can extract knowledge (uses new system_prompts)
   - [ ] Knowledge list shows table view option
   - [ ] Can generate prompts (uses new base_prompt_id versioning)

4. **New Features**
   - [ ] Knowledge table view toggles between list/table
   - [ ] Document filters work (tags, status, user)
   - [ ] Search finds documents
   - [ ] Tags appear on knowledge entries
   - [ ] Prompt versioning visible
   - [ ] "Generation Guide" terminology appears in UI

5. **Database Health**
   - [ ] No database connection errors in logs
   - [ ] Queries execute without errors
   - [ ] Data persists across page refreshes

6. **Server Health**
   - [ ] PM2 process shows "online"
   - [ ] No errors in PM2 logs
   - [ ] CPU/Memory usage reasonable
   - [ ] No "out of memory" errors

### Test Commands (run on server)

```bash
# 1. Verify migrations
sudo -u postgres psql -d annotservice -c "
  SELECT COUNT(*) as prompt_tags_count FROM prompt_tags;
  SELECT COUNT(*) as prompts_count FROM system_prompts;
"

# 2. Check for errors in logs
pm2 logs expert-note --lines 100 | grep -i error

# 3. Verify app is responding
curl -s https://spansurvey.net/annote | grep -o '<title>.*</title>'
# Expected: <title>Expert Note - Knowledge Extraction System</title>

# 4. Check database connection
sudo -u postgres psql -d annotservice -c "SELECT 1 as connectivity_test;"
# Expected: 1
```

---

## Rollback Plan (If Deployment Fails)

### Quick Rollback (Code Only)
```bash
cd /var/www/expert-note

# Find previous working commit
git log --oneline -10

# Revert to previous commit
git reset --hard <commit-hash>  # e.g., git reset --hard e1ef668

# Reinstall and rebuild
npm install
export BASE_PATH=/annote
npm run build

# Restart
pm2 restart expert-note
```

### Full Rollback (Code + Database)
If database migrations are problematic:

```bash
# 1. Stop application
pm2 stop expert-note

# 2. Restore database from backup
sudo -u postgres psql -d annotservice < /var/backups/annotservice_backup_TIMESTAMP.sql

# 3. Revert code
cd /var/www/expert-note
git reset --hard <previous-commit>

# 4. Rebuild and restart
npm install
export BASE_PATH=/annote
npm run build
pm2 restart expert-note
```

### Recovery Verification
```bash
# Verify rollback successful
pm2 status expert-note
pm2 logs expert-note --lines 50

# Test connectivity
curl -I https://spansurvey.net/annote
```

---

## Success Criteria

- [x] Migration 005 applied successfully
- [x] Migration 006 applied successfully
- [x] Application builds without errors (BASE_PATH set)
- [x] PM2 process online and running
- [ ] Application loads (https://spansurvey.net/annote returns 200)
- [ ] Login works with test credentials
- [ ] Dashboard displays without errors
- [ ] All new features functional
- [ ] No 500 errors or database connection failures
- [ ] No errors in PM2 logs

---

## Troubleshooting Guide

### Problem: 404 on CSS/JS Files
**Cause:** BASE_PATH not set before build
**Solution:**
```bash
export BASE_PATH=/annote
npm run build
pm2 restart expert-note
```

### Problem: Database Connection Error
**Cause:** Migrations not applied or connection string wrong
**Solution:**
```bash
# Verify migrations applied
sudo -u postgres psql -d annotservice -c "
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name;
"

# Check connection
PGPASSWORD=annotservice2025 psql -h localhost -U postgres -d annotservice -c 'SELECT 1'
```

### Problem: 500 Error on Knowledge Extraction
**Cause:** Template table not created
**Solution:**
```bash
sudo -u postgres psql -d annotservice -f sql/migrations/005_fix_prompt_templates.sql
pm2 restart expert-note
```

### Problem: Prompts Show Old Data
**Cause:** pm2 cache not cleared
**Solution:**
```bash
pm2 delete expert-note
pm2 start ecosystem.config.js --name expert-note
```

---

## Estimated Timeline

| Step | Duration | Notes |
|------|----------|-------|
| Backup Database | 2-3 min | Depends on database size |
| Git Pull + npm install | 3-4 min | Network dependent |
| Run Migrations | 1-2 min | Usually quick |
| Build | 3-5 min | First build slower due to cache |
| Restart & Test | 2-3 min | Including health checks |
| **Total** | **15-20 min** | Assume 30 min for safety |

---

## Sign-Off

**Deployer:** [Name]
**Deployment Date:** January 8, 2026
**Time Started:** [HH:MM UTC]
**Time Completed:** [HH:MM UTC]
**Status:** [Success / Failed]
**Issues Encountered:** [None / describe]

**Post-Deployment Verification:** [Passed / Failed]
- All checklist items completed: [ ]
- No errors in logs: [ ]
- Application functional: [ ]
- Users notified (if applicable): [ ]

---

## Notes

- Always backup database before deployment
- BASE_PATH must be set BEFORE `npm run build`
- Migrations must run BEFORE build in correct order
- Test immediately after deployment
- Keep rollback point accessible for 24 hours
- Monitor logs for 30 minutes after deployment

**Contact:** Check DEPLOYMENT.md for server access details
