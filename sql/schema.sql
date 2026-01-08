-- Expert Note System - Database Schema
-- PostgreSQL 16+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (10 hardcoded for MVP)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMPTZ
);

-- 2. Tags table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  content TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'raw' CHECK (status IN ('raw', 'annotating', 'annotated', 'extracted')),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Document-Tags junction table
CREATE TABLE document_tags (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);

-- 5. Knowledge Entries (AI-extracted from annotations)
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  background TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Knowledge-Tags junction table
CREATE TABLE knowledge_tags (
  knowledge_id UUID REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_id, tag_id)
);

-- 7. Annotations (can be linked to document OR knowledge entry)
-- For document annotations: stores parsed annotations from markdown
-- For knowledge annotations: stores extracted/refined annotations
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Either document_id or knowledge_id should be set, not both
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  knowledge_id UUID REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  level VARCHAR(10) NOT NULL CHECK (level IN ('MACRO', 'MESO', 'MICRO', 'macro', 'meso', 'micro')),
  -- For document annotations
  content TEXT,
  context_text TEXT,
  raw_text TEXT,
  -- For knowledge annotations
  original_text TEXT,
  comment TEXT,
  refined_comment TEXT,
  -- Location and context info (AI-extracted)
  location VARCHAR(255),                -- Human-readable location (e.g., "Chapter 7, Section 1")
  background_context TEXT,              -- AI-extracted context around this annotation
  -- Position info
  position_line INTEGER,
  position_char INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  -- Ensure annotation is linked to either document or knowledge entry
  CONSTRAINT annotation_link_check CHECK (
    (document_id IS NOT NULL AND knowledge_id IS NULL) OR
    (document_id IS NULL AND knowledge_id IS NOT NULL)
  )
);

-- 8. System Prompts (user-generated prompts)
CREATE TABLE system_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  template_type VARCHAR(50),
  source_knowledge_ids UUID[],
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════
-- TERMINOLOGY NOTE: "Prompt Templates" = "Generation Guides"
-- ═══════════════════════════════════════════════════════════════════
--
-- This table stores "Generation Guides" (user-facing term).
--
-- A Generation Guide contains instructions for HOW to generate system prompts.
-- It's NOT the generated prompt itself (those are in system_prompts table).
--
-- Example: "Introduction Review Guide" tells the AI:
--   - Focus on research importance
--   - Emphasize gap identification
--   - Structure with 4 pillars
--
-- TERMINOLOGY MISMATCH:
-- - Table name: prompt_templates (legacy)
-- - UI labels: "Generation Guide" (clarity improvement, Jan 2026)
-- - Both refer to the same concept
--
-- See /docs/GLOSSARY.md for full explanation.
-- ═══════════════════════════════════════════════════════════════════

-- 9. Prompt Templates (system templates for extraction/generation)
-- These are the predefined/user-customizable templates that guide AI behavior
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('extraction', 'generation')),
  template_type VARCHAR(50), -- For generation: introduction, methodology, discussion, academicCoach, custom
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_is_deleted ON documents(is_deleted);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_annotations_document_id ON annotations(document_id) WHERE document_id IS NOT NULL;
CREATE INDEX idx_annotations_knowledge_id ON annotations(knowledge_id) WHERE knowledge_id IS NOT NULL;
CREATE INDEX idx_annotations_level ON annotations(level);
CREATE INDEX idx_knowledge_entries_source ON knowledge_entries(source_document_id);
CREATE INDEX idx_system_prompts_user_id ON system_prompts(user_id);
CREATE INDEX idx_system_prompts_template_type ON system_prompts(template_type);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_prompt_templates_is_default ON prompt_templates(is_default);

-- Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_entries_updated_at
  BEFORE UPDATE ON knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_prompts_updated_at
  BEFORE UPDATE ON system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
