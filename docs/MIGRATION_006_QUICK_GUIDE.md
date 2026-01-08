# Migration 006: Quick Reference Guide

**Migration:** Add prompt enhancements (source_document_ids, base_prompt_id)
**Date:** 2026-01-08
**Status:** Ready to run

---

## Local Development

```bash
# 1. Connect to database and run migration
psql -U ningli -d annotservice -f sql/migrations/006_prompt_enhancements.sql

# Expected output:
# BEGIN
# ALTER TABLE
# CREATE INDEX
# psql:sql/migrations/006_prompt_enhancements.sql:XX: NOTICE: ...
# COMMIT
# ✓ Migration 006 completed successfully
```

### Verify Migration

```bash
# Check new columns exist
psql -U ningli -d annotservice -c "
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'system_prompts'
  AND column_name IN ('source_document_ids', 'base_prompt_id')
  ORDER BY column_name;
"

# Expected output:
#    column_name      |   data_type   | column_default
# --------------------+---------------+----------------
#  base_prompt_id     | uuid          |
#  source_document_ids| ARRAY         | '{}'::uuid[]
```

---

## Production Deployment

```bash
# 1. SSH to server
ssh -i /Users/ningli/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/ningli.pem root@47.121.176.193

# 2. Navigate to app
cd /var/www/expert-note

# 3. Pull latest code
git pull

# 4. Run migration
sudo -u postgres psql -d annotservice -f sql/migrations/006_prompt_enhancements.sql

# 5. Rebuild app (CRITICAL: Set BASE_PATH!)
export BASE_PATH=/annote
npm run build

# 6. Restart PM2
pm2 restart expert-note

# 7. Check logs
pm2 logs expert-note --lines 50
```

---

## Rollback (If Needed)

```sql
-- ONLY IF MIGRATION FAILED AND YOU NEED TO REVERT

BEGIN;

-- Drop the new columns
ALTER TABLE system_prompts DROP COLUMN IF EXISTS source_document_ids;
ALTER TABLE system_prompts DROP COLUMN IF EXISTS base_prompt_id;

-- Drop the index
DROP INDEX IF EXISTS idx_system_prompts_base_prompt_id;

COMMIT;
```

**Note:** This rollback is ONLY for emergency use if migration fails. Once in production and used, rolling back will cause data loss!

---

## Dependencies

This migration requires:
- ✅ Migration 002: `prompt_tags` table
- ✅ Migration 004: `is_deleted`, `deleted_at` columns

If either is missing, the migration will fail with an error message.

---

## Testing After Migration

```bash
# 1. Verify TypeScript compilation
npx tsc --noEmit

# 2. Start dev server
npm run dev

# 3. Test API endpoint
curl -X GET http://localhost:3000/api/prompts \
  -H "Cookie: session=..." \
  | jq '.prompts[0] | {sourceKnowledgeIds, sourceDocumentIds, basePromptId}'

# Should return:
# {
#   "sourceKnowledgeIds": [...],
#   "sourceDocumentIds": [],
#   "basePromptId": null
# }
```

---

## Common Issues

### Issue 1: "prompt_tags table not found"
**Cause:** Migration 002 not run
**Fix:** Run migration 002 first:
```bash
psql -U ningli -d annotservice -f sql/migrations/002_prompt_tags.sql
```

### Issue 2: "is_deleted column not found"
**Cause:** Migration 004 not run
**Fix:** Run migration 004 first:
```bash
psql -U ningli -d annotservice -f sql/migrations/004_soft_delete.sql
```

### Issue 3: "Operation not permitted"
**Cause:** Database connection issues
**Fix:** Check PostgreSQL is running:
```bash
brew services list | grep postgresql
# Should show "started"
```

---

## What Gets Changed

### system_prompts Table
- Adds `source_document_ids UUID[]` column (default: empty array)
- Adds `base_prompt_id UUID` column (default: NULL)
- Creates index on `base_prompt_id`

### No Data Loss
- All existing prompts remain unchanged
- New columns are nullable/have defaults
- Backwards compatible with existing code

---

## Post-Migration Checklist

- [ ] Migration completed without errors
- [ ] New columns visible in table schema
- [ ] Index created on base_prompt_id
- [ ] TypeScript compilation passes
- [ ] Dev server starts successfully
- [ ] API returns new fields in responses
- [ ] No console errors in browser

---

**Last Updated:** 2026-01-08
**Migration File:** `sql/migrations/006_prompt_enhancements.sql`
**Related Docs:** `docs/AGENT1_IMPLEMENTATION_SUMMARY.md`
