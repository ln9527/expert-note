-- Migration: Add prompt_tags junction table for prompt tagging system
-- Run: psql -U ningli -d annotservice -f sql/migrations/002_prompt_tags.sql
--
-- This follows the same pattern as document_tags and knowledge_tags tables
-- to maintain consistency across the codebase.

BEGIN;

-- Create junction table for prompt-tag relationships
CREATE TABLE IF NOT EXISTS prompt_tags (
  prompt_id UUID REFERENCES system_prompts(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, tag_id)
);

-- Create index for efficient tag-based queries
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag_id ON prompt_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt_id ON prompt_tags(prompt_id);

COMMIT;

-- Verify creation
SELECT 'prompt_tags table created successfully' as status;
