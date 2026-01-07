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
  version: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
}

export interface SystemPrompt {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  content: string;
  templateType: string | null;
  sourceKnowledgeIds: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
}

interface TagRow {
  id: number;
  name: string;
  color: string;
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
    version: row.version,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    tags,
  };
}

export interface GetAllPromptsOptions {
  templateType?: string;
  tagIds?: number[];
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get tags for a specific prompt
 */
export async function getPromptTags(promptId: string): Promise<Tag[]> {
  const sql = `
    SELECT t.id, t.name, t.color
    FROM tags t
    INNER JOIN prompt_tags pt ON t.id = pt.tag_id
    WHERE pt.prompt_id = $1
    ORDER BY t.name
  `;
  const rows = await query<TagRow>(sql, [promptId]);
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    color: row.color,
  }));
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
 * Get all prompts for a user with optional filtering and pagination
 */
export async function getAllPrompts(
  userId: string,
  options: GetAllPromptsOptions = {}
): Promise<{ prompts: SystemPrompt[]; total: number }> {
  const { templateType, tagIds, search, limit = 50, offset = 0 } = options;

  const conditions: string[] = ['sp.user_id = $1', 'sp.is_deleted = FALSE'];
  const params: unknown[] = [userId];
  let paramIndex = 2;

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

  const countParams = tagIds && tagIds.length > 0 ? params.slice(0, -1).concat([tagIds]) : params.slice(0, paramIndex - (tagIds?.length ? 1 : 0));
  const countResult = await queryOne<{ total: string }>(countSql, params.slice(0, paramIndex - 1 + (tagIds?.length ? 1 : 0)));
  const total = parseInt(countResult?.total || '0', 10);

  // Get paginated results with tags
  const sql = tagIds && tagIds.length > 0
    ? `
      SELECT sp.*
      FROM system_prompts sp
      ${tagJoin}
      WHERE ${whereClause}
      GROUP BY sp.id
      ${tagHaving}
      ORDER BY sp.updated_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `
    : `
      SELECT sp.*
      FROM system_prompts sp
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
    SELECT pt.prompt_id, t.id, t.name, t.color
    FROM prompt_tags pt
    INNER JOIN tags t ON pt.tag_id = t.id
    WHERE pt.prompt_id = ANY($1::uuid[])
    ORDER BY t.name
  `;
  const tagRows = await query<TagRow & { prompt_id: string }>(tagsSql, [promptIds]);

  // Group tags by prompt
  const tagsByPrompt = new Map<string, Tag[]>();
  for (const row of tagRows) {
    if (!tagsByPrompt.has(row.prompt_id)) {
      tagsByPrompt.set(row.prompt_id, []);
    }
    tagsByPrompt.get(row.prompt_id)!.push({
      id: row.id,
      name: row.name,
      color: row.color,
    });
  }

  const prompts = rows.map(row => mapPromptRow(row, tagsByPrompt.get(row.id) || []));

  return { prompts, total };
}

/**
 * Get a single prompt by ID with tags (excludes deleted by default)
 */
export async function getPromptById(id: string, includeDeleted = false): Promise<SystemPrompt | null> {
  const sql = includeDeleted
    ? `SELECT * FROM system_prompts WHERE id = $1`
    : `SELECT * FROM system_prompts WHERE id = $1 AND is_deleted = FALSE`;
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
    tagIds = [],
  } = data;

  const sql = `
    INSERT INTO system_prompts (
      user_id, title, description, content, template_type, source_knowledge_ids
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const row = await queryOne<SystemPromptRow>(sql, [
    userId,
    title,
    description,
    content,
    templateType,
    sourceKnowledgeIds.length > 0 ? sourceKnowledgeIds : null,
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
    SELECT pt.prompt_id, t.id, t.name, t.color
    FROM prompt_tags pt
    INNER JOIN tags t ON pt.tag_id = t.id
    WHERE pt.prompt_id = ANY($1::uuid[])
    ORDER BY t.name
  `;
  const tagRows = await query<TagRow & { prompt_id: string }>(tagsSql, [promptIds]);

  const tagsByPrompt = new Map<string, Tag[]>();
  for (const row of tagRows) {
    if (!tagsByPrompt.has(row.prompt_id)) {
      tagsByPrompt.set(row.prompt_id, []);
    }
    tagsByPrompt.get(row.prompt_id)!.push({
      id: row.id,
      name: row.name,
      color: row.color,
    });
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
    SELECT pt.prompt_id, t.id, t.name, t.color
    FROM prompt_tags pt
    INNER JOIN tags t ON pt.tag_id = t.id
    WHERE pt.prompt_id = ANY($1::uuid[])
    ORDER BY t.name
  `;
  const tagRows = await query<TagRow & { prompt_id: string }>(tagsSql, [promptIds]);

  const tagsByPrompt = new Map<string, Tag[]>();
  for (const row of tagRows) {
    if (!tagsByPrompt.has(row.prompt_id)) {
      tagsByPrompt.set(row.prompt_id, []);
    }
    tagsByPrompt.get(row.prompt_id)!.push({
      id: row.id,
      name: row.name,
      color: row.color,
    });
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
