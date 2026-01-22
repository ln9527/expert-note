-- Migration 012: Create skills table
-- Purpose: Store Claude Code skill packages generated from prompts/knowledge
-- Date: 2026-01-21

-- ═══════════════════════════════════════════════════════════════════════════════
-- SKILLS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Content (JSON storing file structure)
  -- Format: {skill_md: "...", prompts: {...}, examples: {...}, tests: {...}}
  content JSONB NOT NULL,

  -- Source tracking (references to prompts and knowledge entries used to generate this skill)
  source_prompt_ids UUID[],
  source_knowledge_ids UUID[],

  -- Permissions (matching existing pattern from documents, knowledge_entries, system_prompts)
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  allow_edit BOOLEAN DEFAULT FALSE,

  -- Usage tracking
  download_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Index for filtering by creator
CREATE INDEX IF NOT EXISTS idx_skills_created_by ON skills(created_by);

-- Index for filtering deleted/non-deleted skills
CREATE INDEX IF NOT EXISTS idx_skills_is_deleted ON skills(is_deleted);

-- Index for filtering shared skills
CREATE INDEX IF NOT EXISTS idx_skills_is_shared ON skills(is_shared);

-- Index for title search
CREATE INDEX IF NOT EXISTS idx_skills_title ON skills(title);

-- GIN index for JSONB content queries
CREATE INDEX IF NOT EXISTS idx_skills_content ON skills USING gin(content);

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE skills IS 'Stores Claude Code skill packages generated from user prompts and knowledge entries';

COMMENT ON COLUMN skills.content IS 'JSONB storing skill file structure: {skill_md: "...", prompts: {...}, examples: {...}, tests: {...}}';

COMMENT ON COLUMN skills.source_prompt_ids IS 'Array of UUID references to system_prompts used to generate this skill';

COMMENT ON COLUMN skills.source_knowledge_ids IS 'Array of UUID references to knowledge_entries used to generate this skill';

COMMENT ON COLUMN skills.is_shared IS 'If true, skill is visible to other users in the same organization';

COMMENT ON COLUMN skills.allow_edit IS 'If true and is_shared, other users in same org can edit this skill';

COMMENT ON COLUMN skills.download_count IS 'Number of times this skill has been downloaded';

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER FOR UPDATED_AT
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS update_skills_updated_at ON skills;
CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
