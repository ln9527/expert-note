-- Migration: 017_cleanup_duplicate_templates.sql
-- Description: Remove duplicate prompt templates, keeping only the most recent one per category+template_type
-- Date: 2026-01-24
--
-- This migration cleans up duplicates that were created by running migrations 015/016 multiple times.
-- It keeps the most recently created template for each (category, template_type) combination.

BEGIN;

-- First, let's see what duplicates exist (for logging purposes)
DO $$
DECLARE
    dup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dup_count
    FROM (
        SELECT category, template_type, COUNT(*) as cnt
        FROM prompt_templates
        WHERE template_type IS NOT NULL
        GROUP BY category, template_type
        HAVING COUNT(*) > 1
    ) dups;

    RAISE NOTICE 'Found % duplicate template groups to clean up', dup_count;
END $$;

-- Delete older duplicates, keeping the newest one for each (category, template_type) pair
-- This uses a common pattern: delete rows where there exists a newer row with the same key
DELETE FROM prompt_templates a
USING prompt_templates b
WHERE a.category = b.category
  AND a.template_type = b.template_type
  AND a.template_type IS NOT NULL
  AND a.created_at < b.created_at;

-- Verify no duplicates remain
DO $$
DECLARE
    remaining_dups INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_dups
    FROM (
        SELECT category, template_type, COUNT(*) as cnt
        FROM prompt_templates
        WHERE template_type IS NOT NULL
        GROUP BY category, template_type
        HAVING COUNT(*) > 1
    ) dups;

    IF remaining_dups > 0 THEN
        RAISE EXCEPTION 'Still have % duplicate groups remaining', remaining_dups;
    ELSE
        RAISE NOTICE 'Successfully cleaned up all duplicates';
    END IF;
END $$;

-- Show the final state
DO $$
DECLARE
    template_record RECORD;
BEGIN
    RAISE NOTICE 'Final prompt_templates state:';
    FOR template_record IN
        SELECT category, template_type, name, is_default
        FROM prompt_templates
        WHERE template_type IS NOT NULL
        ORDER BY category, template_type
    LOOP
        RAISE NOTICE '  % / % : % (default=%)',
            template_record.category,
            template_record.template_type,
            template_record.name,
            template_record.is_default;
    END LOOP;
END $$;

COMMIT;

-- Verification query (run separately to confirm):
-- SELECT category, template_type, COUNT(*) as count
-- FROM prompt_templates
-- WHERE template_type IS NOT NULL
-- GROUP BY category, template_type
-- ORDER BY category, template_type;
