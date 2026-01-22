/**
 * System Prompt Generation Queries
 *
 * TERMINOLOGY NOTE:
 * - "PromptTemplate" in code = "Generation Guide" in UI
 * - "SystemPrompt" in code = "System Prompt" in UI (consistent)
 *
 * Generation Guides (prompt_templates table):
 * → Guide the AI on HOW to generate system prompts
 * → Configurable by users in Settings
 *
 * System Prompts (system_prompts table):
 * → The GENERATED prompts (output)
 * → Used to guide LLM behavior
 *
 * See /src/types/index.ts for full glossary.
 */

// System prompt database queries

import { query, queryOne } from '../index';
import { Tag } from '@/types';

export interface SystemPromptRow {
  id: string;
  user_id: number;  // Database column is INTEGER
  title: string;
  description: string | null;
  content: string;
  template_type: string | null;
  source_knowledge_ids: string[] | null;
  source_document_ids: string[] | null;
  base_prompt_id: string | null;
  version: number;
  is_shared: boolean;
  allow_edit: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  // Joined from users table
  creator?: {
    id: number;
    username: string;
    displayName: string | null;
    orgId: number | null;
  } | null;
}

export interface SystemPrompt {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  content: string;
  templateType: string | null;
  sourceKnowledgeIds: string[];
  sourceDocumentIds: string[];
  basePromptId: string | null;
  version: number;
  isShared: boolean;
  allowEdit: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
  creator?: {
    id: number;
    username: string;
    displayName: string | null;
    orgId: number | null;
  } | null;
}

interface TagRow {
  id: number;
  name: string;
  color: string;
  created_by: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
}

function mapTagRow(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdBy: row.created_by,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  };
}

function mapPromptRow(row: SystemPromptRow, tags: Tag[] = []): SystemPrompt {
  return {
    id: row.id,
    userId: String(row.user_id),  // Convert to string for consistent comparison
    title: row.title,
    description: row.description,
    content: row.content,
    templateType: row.template_type,
    sourceKnowledgeIds: row.source_knowledge_ids || [],
    sourceDocumentIds: row.source_document_ids || [],
    basePromptId: row.base_prompt_id,
    version: row.version,
    isShared: row.is_shared ?? false,
    allowEdit: row.allow_edit ?? false,
    isDeleted: row.is_deleted || false,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    tags,
    creator: row.creator || null,
  };
}

export interface GetAllPromptsOptions {
  templateType?: string;
  tagIds?: number[];
  search?: string;
  limit?: number;
  offset?: number;
  // Org visibility options
  orgId?: number | null;
  role?: string;
}

/**
 * Get tags for a specific prompt (excludes deleted tags)
 */
export async function getPromptTags(promptId: string): Promise<Tag[]> {
  const sql = `
    SELECT t.id, t.name, t.color, t.created_by, t.is_deleted, t.deleted_at
    FROM tags t
    INNER JOIN prompt_tags pt ON t.id = pt.tag_id
    WHERE pt.prompt_id = $1 AND t.is_deleted = FALSE
    ORDER BY t.name
  `;
  const rows = await query<TagRow>(sql, [promptId]);
  return rows.map(mapTagRow);
}

/**
 * Add tags to a prompt
 */
export async function addPromptTags(promptId: string, tagIds: number[]): Promise<void> {
  if (tagIds.length === 0) return;

  // Build bulk insert
  const values = tagIds.map((tagId, i) => `($1, $${i + 2})`).join(', ');
  const sql = `
    INSERT INTO prompt_tags (prompt_id, tag_id)
    VALUES ${values}
    ON CONFLICT (prompt_id, tag_id) DO NOTHING
  `;
  await query(sql, [promptId, ...tagIds]);
}

/**
 * Update prompt tags (replace all existing tags)
 */
export async function updatePromptTags(promptId: string, tagIds: number[]): Promise<void> {
  // Delete existing tags
  await query('DELETE FROM prompt_tags WHERE prompt_id = $1', [promptId]);

  // Add new tags
  if (tagIds.length > 0) {
    await addPromptTags(promptId, tagIds);
  }
}

/**
 * Get all prompts with org-based visibility
 *
 * Visibility rules:
 * - Users see their own prompts (user_id = userId)
 * - Users see shared prompts from same org (is_shared = true AND creator in same org)
 * - Org owners see ALL prompts in their org
 * - Individual users only see their own prompts
 */
export async function getAllPrompts(
  userId: string,
  options: GetAllPromptsOptions = {}
): Promise<{ prompts: SystemPrompt[]; total: number }> {
  const { templateType, tagIds, search, limit = 50, offset = 0, orgId, role } = options;

  const conditions: string[] = ['sp.is_deleted = FALSE'];
  const params: unknown[] = [userId];
  let paramIndex = 2;

  // Build visibility condition based on role
  let visibilityCondition: string;
  if (role === 'owner' && orgId) {
    // Owners see ALL prompts in their org
    params.push(orgId);
    visibilityCondition = `(sp.user_id = $1 OR sp.user_id IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))`;
  } else if (role === 'member' && orgId) {
    // Members see own prompts + shared prompts from same org
    params.push(orgId);
    visibilityCondition = `(
      sp.user_id = $1
      OR (sp.is_shared = TRUE AND sp.user_id IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))
    )`;
  } else {
    // Individuals and users without org: only own prompts
    visibilityCondition = `sp.user_id = $1`;
  }
  conditions.push(visibilityCondition);

  if (templateType) {
    conditions.push(`sp.template_type = $${paramIndex++}`);
    params.push(templateType);
  }

  // Search in title and content
  if (search && search.trim()) {
    conditions.push(`(sp.title ILIKE $${paramIndex} OR sp.content ILIKE $${paramIndex})`);
    params.push(`%${search.trim()}%`);
    paramIndex++;
  }

  // Filter by tags (prompts must have ALL specified tags)
  let tagJoin = '';
  let tagHaving = '';
  if (tagIds && tagIds.length > 0) {
    tagJoin = `
      INNER JOIN prompt_tags pt_filter ON sp.id = pt_filter.prompt_id
        AND pt_filter.tag_id = ANY($${paramIndex}::int[])
    `;
    tagHaving = `HAVING COUNT(DISTINCT pt_filter.tag_id) = ${tagIds.length}`;
    params.push(tagIds);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count (with tag filtering)
  const countSql = tagIds && tagIds.length > 0
    ? `
      SELECT COUNT(*) as total FROM (
        SELECT sp.id
        FROM system_prompts sp
        ${tagJoin}
        WHERE ${whereClause}
        GROUP BY sp.id
        ${tagHaving}
      ) filtered
    `
    : `SELECT COUNT(*) as total FROM system_prompts sp WHERE ${whereClause}`;

  const countResult = await queryOne<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || '0', 10);

  // Get paginated results with creator info
  const sql = tagIds && tagIds.length > 0
    ? `
      SELECT sp.*,
        CASE WHEN u.id IS NOT NULL THEN
          json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
        ELSE NULL END as creator
      FROM system_prompts sp
      LEFT JOIN users u ON sp.user_id = u.id
      ${tagJoin}
      WHERE ${whereClause}
      GROUP BY sp.id, u.id, u.username, u.display_name, u.org_id
      ${tagHaving}
      ORDER BY sp.updated_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `
    : `
      SELECT sp.*,
        CASE WHEN u.id IS NOT NULL THEN
          json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
        ELSE NULL END as creator
      FROM system_prompts sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE ${whereClause}
      ORDER BY sp.updated_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

  const finalParams = [...params, limit, offset];
  const rows = await query<SystemPromptRow>(sql, finalParams);

  // Get tags for all prompts in one query
  if (rows.length === 0) {
    return { prompts: [], total };
  }

  const promptIds = rows.map(r => r.id);
  const tagsSql = `
    SELECT pt.prompt_id, t.id, t.name, t.color, t.created_by, t.is_deleted, t.deleted_at
    FROM prompt_tags pt
    INNER JOIN tags t ON pt.tag_id = t.id
    WHERE pt.prompt_id = ANY($1::uuid[]) AND t.is_deleted = FALSE
    ORDER BY t.name
  `;
  const tagRows = await query<TagRow & { prompt_id: string }>(tagsSql, [promptIds]);

  // Group tags by prompt
  const tagsByPrompt = new Map<string, Tag[]>();
  for (const row of tagRows) {
    if (!tagsByPrompt.has(row.prompt_id)) {
      tagsByPrompt.set(row.prompt_id, []);
    }
    tagsByPrompt.get(row.prompt_id)!.push(mapTagRow(row));
  }

  const prompts = rows.map(row => mapPromptRow(row, tagsByPrompt.get(row.id) || []));

  return { prompts, total };
}

/**
 * Get a single prompt by ID with tags (excludes deleted by default)
 */
export async function getPromptById(id: string, includeDeleted = false): Promise<SystemPrompt | null> {
  const sql = includeDeleted
    ? `
      SELECT sp.*,
        CASE WHEN u.id IS NOT NULL THEN
          json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
        ELSE NULL END as creator
      FROM system_prompts sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE sp.id = $1
    `
    : `
      SELECT sp.*,
        CASE WHEN u.id IS NOT NULL THEN
          json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
        ELSE NULL END as creator
      FROM system_prompts sp
      LEFT JOIN users u ON sp.user_id = u.id
      WHERE sp.id = $1 AND sp.is_deleted = FALSE
    `;
  const row = await queryOne<SystemPromptRow>(sql, [id]);
  if (!row) return null;

  const tags = await getPromptTags(id);
  return mapPromptRow(row, tags);
}

export interface CreatePromptData {
  userId: string;
  title: string;
  description?: string;
  content: string;
  templateType?: string;
  sourceKnowledgeIds?: string[];
  sourceDocumentIds?: string[];
  basePromptId?: string;
  tagIds?: number[];
}

/**
 * Create a new system prompt with optional tags
 */
export async function createPrompt(data: CreatePromptData): Promise<SystemPrompt> {
  const {
    userId,
    title,
    description = null,
    content,
    templateType = null,
    sourceKnowledgeIds = [],
    sourceDocumentIds = [],
    basePromptId = null,
    tagIds = [],
  } = data;

  const sql = `
    INSERT INTO system_prompts (
      user_id, title, description, content, template_type,
      source_knowledge_ids, source_document_ids, base_prompt_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const row = await queryOne<SystemPromptRow>(sql, [
    userId,
    title,
    description,
    content,
    templateType,
    sourceKnowledgeIds.length > 0 ? sourceKnowledgeIds : null,
    sourceDocumentIds.length > 0 ? sourceDocumentIds : null,
    basePromptId,
  ]);

  const prompt = row!;

  // Add tags if provided
  if (tagIds.length > 0) {
    await addPromptTags(prompt.id, tagIds);
  }

  const tags = tagIds.length > 0 ? await getPromptTags(prompt.id) : [];
  return mapPromptRow(prompt, tags);
}

export interface UpdatePromptData {
  title?: string;
  description?: string;
  content?: string;
  templateType?: string;
  sourceKnowledgeIds?: string[];
  sourceDocumentIds?: string[];
  basePromptId?: string;
  tagIds?: number[];
}

/**
 * Update an existing system prompt with optional tag update
 */
export async function updatePrompt(
  id: string,
  data: UpdatePromptData
): Promise<SystemPrompt | null> {
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

  if (data.content !== undefined) {
    updates.push(`content = $${paramIndex++}`);
    params.push(data.content);
    // Increment version when content changes
    updates.push(`version = version + 1`);
  }

  if (data.templateType !== undefined) {
    updates.push(`template_type = $${paramIndex++}`);
    params.push(data.templateType);
  }

  if (data.sourceKnowledgeIds !== undefined) {
    updates.push(`source_knowledge_ids = $${paramIndex++}`);
    params.push(data.sourceKnowledgeIds.length > 0 ? data.sourceKnowledgeIds : null);
  }

  if (data.sourceDocumentIds !== undefined) {
    updates.push(`source_document_ids = $${paramIndex++}`);
    params.push(data.sourceDocumentIds.length > 0 ? data.sourceDocumentIds : null);
  }

  if (data.basePromptId !== undefined) {
    updates.push(`base_prompt_id = $${paramIndex++}`);
    params.push(data.basePromptId);
  }

  const sql = `
    UPDATE system_prompts
    SET ${updates.join(', ')}
    WHERE id = $1
    RETURNING *
  `;

  const row = await queryOne<SystemPromptRow>(sql, params);
  if (!row) return null;

  // Update tags if provided
  if (data.tagIds !== undefined) {
    await updatePromptTags(id, data.tagIds);
  }

  const tags = await getPromptTags(id);
  return mapPromptRow(row, tags);
}

/**
 * Soft delete a system prompt (move to trash)
 */
export async function deletePrompt(id: string): Promise<boolean> {
  const sql = `
    UPDATE system_prompts
    SET is_deleted = TRUE, deleted_at = NOW()
    WHERE id = $1 AND is_deleted = FALSE
  `;
  await query(sql, [id]);
  return true;
}

/**
 * Restore a soft-deleted prompt from trash
 */
export async function restorePrompt(id: string): Promise<SystemPrompt | null> {
  const sql = `
    UPDATE system_prompts
    SET is_deleted = FALSE, deleted_at = NULL, updated_at = NOW()
    WHERE id = $1 AND is_deleted = TRUE
    RETURNING *
  `;
  const row = await queryOne<SystemPromptRow>(sql, [id]);
  if (!row) return null;

  const tags = await getPromptTags(id);
  return mapPromptRow(row, tags);
}

/**
 * Permanently delete a system prompt (cannot be undone)
 */
export async function permanentlyDeletePrompt(id: string): Promise<boolean> {
  const sql = `DELETE FROM system_prompts WHERE id = $1`;
  await query(sql, [id]);
  return true;
}

/**
 * Get all soft-deleted prompts for a user (trash)
 */
export async function getDeletedPrompts(userId: string): Promise<SystemPrompt[]> {
  const sql = `
    SELECT * FROM system_prompts
    WHERE user_id = $1 AND is_deleted = TRUE
    ORDER BY deleted_at DESC
  `;
  const rows = await query<SystemPromptRow>(sql, [userId]);

  if (rows.length === 0) return [];

  // Get tags for all prompts
  const promptIds = rows.map(r => r.id);
  const tagsSql = `
    SELECT pt.prompt_id, t.id, t.name, t.color, t.created_by, t.is_deleted, t.deleted_at
    FROM prompt_tags pt
    INNER JOIN tags t ON pt.tag_id = t.id
    WHERE pt.prompt_id = ANY($1::uuid[]) AND t.is_deleted = FALSE
    ORDER BY t.name
  `;
  const tagRows = await query<TagRow & { prompt_id: string }>(tagsSql, [promptIds]);

  const tagsByPrompt = new Map<string, Tag[]>();
  for (const row of tagRows) {
    if (!tagsByPrompt.has(row.prompt_id)) {
      tagsByPrompt.set(row.prompt_id, []);
    }
    tagsByPrompt.get(row.prompt_id)!.push(mapTagRow(row));
  }

  return rows.map(row => mapPromptRow(row, tagsByPrompt.get(row.id) || []));
}

/**
 * Get prompts by template type for a user (excludes deleted)
 */
export async function getPromptsByTemplateType(
  userId: string,
  templateType: string
): Promise<SystemPrompt[]> {
  const sql = `
    SELECT *
    FROM system_prompts
    WHERE user_id = $1 AND template_type = $2 AND is_deleted = FALSE
    ORDER BY updated_at DESC
  `;

  const rows = await query<SystemPromptRow>(sql, [userId, templateType]);

  // Get tags for all prompts
  const promptIds = rows.map(r => r.id);
  if (promptIds.length === 0) return [];

  const tagsSql = `
    SELECT pt.prompt_id, t.id, t.name, t.color, t.created_by, t.is_deleted, t.deleted_at
    FROM prompt_tags pt
    INNER JOIN tags t ON pt.tag_id = t.id
    WHERE pt.prompt_id = ANY($1::uuid[]) AND t.is_deleted = FALSE
    ORDER BY t.name
  `;
  const tagRows = await query<TagRow & { prompt_id: string }>(tagsSql, [promptIds]);

  const tagsByPrompt = new Map<string, Tag[]>();
  for (const row of tagRows) {
    if (!tagsByPrompt.has(row.prompt_id)) {
      tagsByPrompt.set(row.prompt_id, []);
    }
    tagsByPrompt.get(row.prompt_id)!.push(mapTagRow(row));
  }

  return rows.map(row => mapPromptRow(row, tagsByPrompt.get(row.id) || []));
}

/**
 * Check if a prompt belongs to a user (includes deleted prompts for restore/permanent delete operations)
 */
export async function isPromptOwnedByUser(
  promptId: string,
  userId: string
): Promise<boolean> {
  const sql = `SELECT 1 FROM system_prompts WHERE id = $1 AND user_id = $2`;
  const row = await queryOne(sql, [promptId, userId]);
  return row !== null;
}

/**
 * Check if a prompt is soft-deleted
 */
export async function isPromptDeleted(promptId: string): Promise<boolean> {
  const sql = `SELECT is_deleted FROM system_prompts WHERE id = $1`;
  const row = await queryOne<{ is_deleted: boolean }>(sql, [promptId]);
  return row?.is_deleted === true;
}
