-- Migration: Add skill-generation and mcp-generation categories to prompt_templates
-- Run: psql -h localhost -U ningli -d annotservice -f sql/migrations/014_skill_mcp_template_categories.sql
--
-- This extends the category CHECK constraint to support skill and MCP generation templates
-- for the Skills & MCP Export feature.

BEGIN;

-- Drop and recreate the constraint with new categories
ALTER TABLE prompt_templates
DROP CONSTRAINT IF EXISTS prompt_templates_category_check;

ALTER TABLE prompt_templates
ADD CONSTRAINT prompt_templates_category_check
CHECK (category IN ('extraction', 'generation', 'skill-generation', 'mcp-generation'));

COMMIT;

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'prompt_templates_category_check';
