# Migration Numbering Cleanup Required

## Issue

The migration numbering has conflicts due to parallel development:

### Duplicate 005 Migrations
- `005_fix_prompt_templates.sql`
- `005_user_management_system.sql`

### Duplicate 006 Migrations
- `006_org_creation_improvements.sql`
- `006_prompt_enhancements.sql`

## Current Status

Latest migration: `007_org_creation_improvements.sql` (Jan 11, 2026)

## Action Required for Next Deployment

**IMPORTANT:** Before next production deployment, AI agents or developers should:

1. **Review Migration History**
   - Check which migrations have been applied to production database
   - Identify which 005/006 variants are actually in use

2. **Renumber Conflicting Migrations**
   - Rename unused/superseded migrations to sequential numbers (008, 009, etc.)
   - OR delete if they're truly unused
   - Update any migration tracking tables if they exist

3. **Verify Migration Order**
   - Ensure migrations run in correct dependency order
   - Check for any foreign key or schema dependencies between migrations

4. **Test Migration Path**
   - Test full migration sequence on a clean database
   - Verify production database state matches expected schema

## Migration Checklist

```bash
# Check which migrations have been applied
psql -U ningli -d annotservice -c "SELECT * FROM schema_migrations ORDER BY version;"

# Apply migrations in order (if tracking table exists)
# If no tracking: manually verify each migration has been applied

# After cleanup: rename this file to archive
mv README_MIGRATION_CLEANUP.md MIGRATION_CLEANUP_COMPLETED_[DATE].md
```

## Notes

- This cleanup was deferred during Jan 11, 2026 documentation cleanup
- Current production deployment (spansurvey.net/annote) may already have some migrations applied
- Conservative approach recommended: rename rather than delete until confirmed unused

---

**Created:** 2026-01-11
**Status:** Pending cleanup
**Priority:** High (required before next deployment)
