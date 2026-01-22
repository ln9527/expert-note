-- 017_mcp_access_tracking.sql
-- Add access_count column to mcp_prompts table for tracking API usage

ALTER TABLE mcp_prompts
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- Add index for frequently accessed MCPs
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_access_count
ON mcp_prompts(access_count DESC)
WHERE is_deleted = FALSE;
