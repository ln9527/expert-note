-- Migration 011: Add content field to knowledge_entries
-- Purpose: Store raw LLM markdown output directly instead of parsing into annotations
-- Date: 2026-01-15

-- Add content column for storing raw LLM markdown
ALTER TABLE knowledge_entries
ADD COLUMN IF NOT EXISTS content TEXT;

-- Add index for content search (optional, can be removed if not needed)
-- CREATE INDEX IF NOT EXISTS idx_knowledge_entries_content ON knowledge_entries USING gin(to_tsvector('english', content));

-- Comment explaining the field
COMMENT ON COLUMN knowledge_entries.content IS 'Raw LLM-generated markdown content. Primary storage for knowledge extraction output.';

-- Note: Existing entries will have NULL content.
-- The system should fall back to generating markdown from annotations for backward compatibility.
