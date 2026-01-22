-- Migration 013: Create mcp_prompts table
-- Purpose: Store MCP (Model Context Protocol) prompts that can be deployed as API endpoints
-- Date: 2026-01-21

-- ═══════════════════════════════════════════════════════════════════════════════
-- MCP_PROMPTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mcp_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  namespace VARCHAR(100) NOT NULL,  -- URL-safe identifier for MCP endpoint

  -- Content
  content TEXT NOT NULL,  -- The prompt content

  -- Source tracking
  source_prompt_ids UUID[],
  source_knowledge_ids UUID[],

  -- Deployment
  access_token VARCHAR(64) UNIQUE,  -- For signed URL authentication
  deployed_at TIMESTAMPTZ,
  deployment_status VARCHAR(20) DEFAULT 'draft',  -- draft, deployed, disabled

  -- Permissions
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  allow_edit BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,  -- Beyond org sharing

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT chk_deployment_status CHECK (deployment_status IN ('draft', 'deployed', 'disabled'))
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_mcp_prompts_created_by ON mcp_prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_is_deleted ON mcp_prompts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_access_token ON mcp_prompts(access_token);
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_deployment_status ON mcp_prompts(deployment_status);
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_namespace ON mcp_prompts(namespace);
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_is_shared ON mcp_prompts(is_shared);
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_is_public ON mcp_prompts(is_public);

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE mcp_prompts IS 'Stores MCP prompts that can be deployed as queryable API endpoints';
COMMENT ON COLUMN mcp_prompts.namespace IS 'URL-safe identifier used in MCP endpoint routing';
COMMENT ON COLUMN mcp_prompts.access_token IS '64-character token for signed URL authentication';
COMMENT ON COLUMN mcp_prompts.deployment_status IS 'Deployment state: draft (not deployed), deployed (active), disabled (suspended)';
COMMENT ON COLUMN mcp_prompts.is_public IS 'If true, accessible to anyone with the URL (beyond org sharing)';

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER FOR UPDATED_AT
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS update_mcp_prompts_updated_at ON mcp_prompts;
CREATE TRIGGER update_mcp_prompts_updated_at
  BEFORE UPDATE ON mcp_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
