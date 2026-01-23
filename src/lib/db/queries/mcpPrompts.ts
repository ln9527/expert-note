/**
 * MCP Prompts Database Queries
 *
 * MCP Prompts are deployable prompts accessible via Model Context Protocol.
 * They follow the same permission patterns as system_prompts and skills.
 */

import { query, queryOne } from '../index';
import crypto from 'crypto';

export interface McpPromptRow {
  id: string;
  title: string;
  description: string | null;
  namespace: string;
  content: string;
  source_prompt_ids: string[] | null;
  source_knowledge_ids: string[] | null;
  access_token: string | null;
  deployed_at: string | null;
  deployment_status: 'draft' | 'deployed' | 'disabled';
  created_by: number;
  is_shared: boolean;
  allow_edit: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  access_count: number;
  // Joined from users table
  creator?: {
    id: number;
    username: string;
    displayName: string | null;
    orgId: number | null;
  } | null;
}

export interface McpPrompt {
  id: string;
  title: string;
  description: string | null;
  namespace: string;
  content: string;
  sourcePromptIds: string[];
  sourceKnowledgeIds: string[];
  accessToken: string | null;
  deployedAt: Date | null;
  deploymentStatus: 'draft' | 'deployed' | 'disabled';
  createdBy: number;
  isShared: boolean;
  allowEdit: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  accessCount: number;
  creator?: {
    id: number;
    username: string;
    displayName: string | null;
    orgId: number | null;
  } | null;
}

function mapMcpPromptRow(row: McpPromptRow): McpPrompt {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    namespace: row.namespace,
    content: row.content,
    sourcePromptIds: row.source_prompt_ids || [],
    sourceKnowledgeIds: row.source_knowledge_ids || [],
    accessToken: row.access_token,
    deployedAt: row.deployed_at ? new Date(row.deployed_at) : null,
    deploymentStatus: row.deployment_status,
    createdBy: row.created_by,
    isShared: row.is_shared ?? false,
    allowEdit: row.allow_edit ?? false,
    isPublic: row.is_public ?? false,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    isDeleted: row.is_deleted || false,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    accessCount: row.access_count ?? 0,
    creator: row.creator || null,
  };
}

export interface GetAllMcpPromptsOptions {
  search?: string;
  limit?: number;
  offset?: number;
  status?: 'draft' | 'deployed' | 'disabled';
  // Org visibility options
  orgId?: number | null;
  role?: string;
}

/**
 * Get all MCP prompts with org-based visibility
 *
 * Visibility rules:
 * - Users see their own MCP prompts (created_by = userId)
 * - Users see shared MCP prompts from same org (is_shared = true AND creator in same org)
 * - Org owners see ALL MCP prompts in their org
 * - Individual users only see their own MCP prompts
 * - super_admin sees all MCP prompts
 */
export async function getAllMcpPrompts(
  userId: string,
  options: GetAllMcpPromptsOptions = {}
): Promise<{ mcpPrompts: McpPrompt[]; total: number }> {
  const { search, limit = 50, offset = 0, status, orgId, role } = options;

  const conditions: string[] = ['m.is_deleted = FALSE'];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Build visibility condition based on role
  // Only add userId to params when it's actually used in the query
  let visibilityCondition: string;
  if (role === 'super_admin') {
    // Super admin sees all MCP prompts - no userId needed in query
    visibilityCondition = 'TRUE';
  } else if (role === 'owner' && orgId) {
    // Owners see ALL MCP prompts in their org
    params.push(userId);
    params.push(orgId);
    visibilityCondition = `(m.created_by = $${paramIndex++} OR m.created_by IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))`;
  } else if (role === 'member' && orgId) {
    // Members see own MCP prompts + shared MCP prompts from same org
    params.push(userId);
    params.push(orgId);
    visibilityCondition = `(
      m.created_by = $${paramIndex++}
      OR (m.is_shared = TRUE AND m.created_by IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))
    )`;
  } else {
    // Individuals and users without org: only own MCP prompts
    params.push(userId);
    visibilityCondition = `m.created_by = $${paramIndex++}`;
  }
  conditions.push(visibilityCondition);

  // Filter by deployment status
  if (status) {
    conditions.push(`m.deployment_status = $${paramIndex++}`);
    params.push(status);
  }

  // Search in title and description
  if (search && search.trim()) {
    conditions.push(`(m.title ILIKE $${paramIndex} OR m.description ILIKE $${paramIndex} OR m.namespace ILIKE $${paramIndex})`);
    params.push(`%${search.trim()}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM mcp_prompts m WHERE ${whereClause}`;
  const countResult = await queryOne<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || '0', 10);

  // Get paginated results with creator info
  const sql = `
    SELECT m.*,
      CASE WHEN u.id IS NOT NULL THEN
        json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
      ELSE NULL END as creator
    FROM mcp_prompts m
    LEFT JOIN users u ON m.created_by = u.id
    WHERE ${whereClause}
    ORDER BY m.updated_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const finalParams = [...params, limit, offset];
  const rows = await query<McpPromptRow>(sql, finalParams);

  const mcpPrompts = rows.map(row => mapMcpPromptRow(row));

  return { mcpPrompts, total };
}

/**
 * Get a single MCP prompt by ID (excludes deleted by default)
 */
export async function getMcpPromptById(id: string, includeDeleted = false): Promise<McpPrompt | null> {
  const sql = includeDeleted
    ? `
      SELECT m.*,
        CASE WHEN u.id IS NOT NULL THEN
          json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
        ELSE NULL END as creator
      FROM mcp_prompts m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.id = $1
    `
    : `
      SELECT m.*,
        CASE WHEN u.id IS NOT NULL THEN
          json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
        ELSE NULL END as creator
      FROM mcp_prompts m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.id = $1 AND m.is_deleted = FALSE
    `;
  const row = await queryOne<McpPromptRow>(sql, [id]);
  if (!row) return null;

  return mapMcpPromptRow(row);
}

export interface CreateMcpPromptData {
  userId: string;
  title: string;
  description?: string;
  namespace: string;
  content: string;
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  isShared?: boolean;
  allowEdit?: boolean;
  isPublic?: boolean;
}

/**
 * Create a new MCP prompt
 */
export async function createMcpPrompt(data: CreateMcpPromptData): Promise<McpPrompt> {
  const {
    userId,
    title,
    description = null,
    namespace,
    content,
    sourcePromptIds = [],
    sourceKnowledgeIds = [],
    isShared = false,
    allowEdit = false,
    isPublic = false,
  } = data;

  const sql = `
    INSERT INTO mcp_prompts (
      title, description, namespace, content,
      source_prompt_ids, source_knowledge_ids,
      created_by, is_shared, allow_edit, is_public
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const row = await queryOne<McpPromptRow>(sql, [
    title,
    description,
    namespace,
    content,
    sourcePromptIds.length > 0 ? sourcePromptIds : null,
    sourceKnowledgeIds.length > 0 ? sourceKnowledgeIds : null,
    userId,
    isShared,
    allowEdit,
    isPublic,
  ]);

  return mapMcpPromptRow(row!);
}

export interface UpdateMcpPromptData {
  title?: string;
  description?: string | null;
  namespace?: string;
  content?: string;
  isShared?: boolean;
  allowEdit?: boolean;
  isPublic?: boolean;
}

/**
 * Update an existing MCP prompt
 */
export async function updateMcpPrompt(
  id: string,
  data: UpdateMcpPromptData
): Promise<McpPrompt | null> {
  const updates: string[] = ['updated_at = NOW()'];
  const params: unknown[] = [id];
  let paramIndex = 2;

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    params.push(data.title);
  }

  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    params.push(data.description);
  }

  if (data.namespace !== undefined) {
    updates.push(`namespace = $${paramIndex++}`);
    params.push(data.namespace);
  }

  if (data.content !== undefined) {
    updates.push(`content = $${paramIndex++}`);
    params.push(data.content);
  }

  if (data.isShared !== undefined) {
    updates.push(`is_shared = $${paramIndex++}`);
    params.push(data.isShared);
  }

  if (data.allowEdit !== undefined) {
    updates.push(`allow_edit = $${paramIndex++}`);
    params.push(data.allowEdit);
  }

  if (data.isPublic !== undefined) {
    updates.push(`is_public = $${paramIndex++}`);
    params.push(data.isPublic);
  }

  const sql = `
    UPDATE mcp_prompts
    SET ${updates.join(', ')}
    WHERE id = $1 AND is_deleted = FALSE
    RETURNING *
  `;

  const row = await queryOne<McpPromptRow>(sql, params);
  if (!row) return null;

  // Fetch again with creator info
  return getMcpPromptById(id);
}

/**
 * Soft delete an MCP prompt (move to trash)
 */
export async function deleteMcpPrompt(id: string): Promise<boolean> {
  const sql = `
    UPDATE mcp_prompts
    SET is_deleted = TRUE, deleted_at = NOW(), deployment_status = 'disabled'
    WHERE id = $1 AND is_deleted = FALSE
  `;
  await query(sql, [id]);
  return true;
}

/**
 * Generate a secure access token for MCP deployment
 */
function generateAccessToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Deploy an MCP prompt - generates access token and sets status to deployed
 */
export async function deployMcpPrompt(id: string): Promise<McpPrompt | null> {
  // First check if it already has an access token
  const existing = await getMcpPromptById(id);
  if (!existing) return null;

  const accessToken = existing.accessToken || generateAccessToken();

  const sql = `
    UPDATE mcp_prompts
    SET access_token = $2, deployed_at = NOW(), deployment_status = 'deployed', updated_at = NOW()
    WHERE id = $1 AND is_deleted = FALSE
    RETURNING *
  `;

  const row = await queryOne<McpPromptRow>(sql, [id, accessToken]);
  if (!row) return null;

  return getMcpPromptById(id);
}

/**
 * Disable an MCP prompt deployment
 */
export async function disableMcpPrompt(id: string): Promise<McpPrompt | null> {
  const sql = `
    UPDATE mcp_prompts
    SET deployment_status = 'disabled', updated_at = NOW()
    WHERE id = $1 AND is_deleted = FALSE
    RETURNING *
  `;

  const row = await queryOne<McpPromptRow>(sql, [id]);
  if (!row) return null;

  return getMcpPromptById(id);
}

/**
 * Regenerate access token for an MCP prompt
 */
export async function regenerateAccessToken(id: string): Promise<McpPrompt | null> {
  const newToken = generateAccessToken();

  const sql = `
    UPDATE mcp_prompts
    SET access_token = $2, updated_at = NOW()
    WHERE id = $1 AND is_deleted = FALSE
    RETURNING *
  `;

  const row = await queryOne<McpPromptRow>(sql, [id, newToken]);
  if (!row) return null;

  return getMcpPromptById(id);
}

/**
 * Check if an MCP prompt belongs to a user
 */
export async function isMcpPromptOwnedByUser(
  mcpPromptId: string,
  userId: string
): Promise<boolean> {
  const sql = `SELECT 1 FROM mcp_prompts WHERE id = $1 AND created_by = $2`;
  const row = await queryOne(sql, [mcpPromptId, userId]);
  return row !== null;
}

/**
 * Check if user can edit an MCP prompt
 *
 * Edit rules:
 * - super_admin can edit any MCP prompt
 * - MCP prompt creator can edit their own MCP prompt
 * - Org owner can edit shared MCP prompts with allow_edit from same org
 * - Member cannot edit others' MCP prompts (even if shared)
 */
export async function canUserEditMcpPrompt(
  mcpPromptId: string,
  userId: string,
  userOrgId: number | null,
  userRole: string
): Promise<boolean> {
  // super_admin can edit anything
  if (userRole === 'super_admin') {
    return true;
  }

  // Get MCP prompt with creator info
  const mcpPrompt = await getMcpPromptById(mcpPromptId);
  if (!mcpPrompt) return false;

  // Creator can always edit
  if (mcpPrompt.createdBy === parseInt(userId, 10)) {
    return true;
  }

  // Org owner can edit shared MCP prompts with allowEdit from same org
  if (
    userRole === 'owner' &&
    mcpPrompt.isShared &&
    mcpPrompt.allowEdit &&
    userOrgId &&
    mcpPrompt.creator?.orgId === userOrgId
  ) {
    return true;
  }

  return false;
}

/**
 * Get an MCP prompt by its access token (for public MCP server endpoint)
 */
export async function getMcpPromptByAccessToken(accessToken: string): Promise<McpPrompt | null> {
  const sql = `
    SELECT m.*,
      CASE WHEN u.id IS NOT NULL THEN
        json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
      ELSE NULL END as creator
    FROM mcp_prompts m
    LEFT JOIN users u ON m.created_by = u.id
    WHERE m.access_token = $1 AND m.is_deleted = FALSE AND m.deployment_status = 'deployed'
  `;
  const row = await queryOne<McpPromptRow>(sql, [accessToken]);
  if (!row) return null;

  return mapMcpPromptRow(row);
}

/**
 * Increment the access count for an MCP prompt
 * Called when the MCP endpoint is accessed
 */
export async function incrementAccessCount(id: string): Promise<void> {
  await query(
    `UPDATE mcp_prompts
     SET access_count = access_count + 1
     WHERE id = $1`,
    [id]
  );
}
