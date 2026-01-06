// System prompt database queries

import { query, queryOne } from '../index';

export interface SystemPromptRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content: string;
  template_type: string | null;
  source_knowledge_ids: string[] | null;
  version: number;
  created_at: string;
  updated_at: string;
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
}

function mapPromptRow(row: SystemPromptRow): SystemPrompt {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    content: row.content,
    templateType: row.template_type,
    sourceKnowledgeIds: row.source_knowledge_ids || [],
    version: row.version,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface GetAllPromptsOptions {
  templateType?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get all prompts for a user with optional filtering and pagination
 */
export async function getAllPrompts(
  userId: string,
  options: GetAllPromptsOptions = {}
): Promise<{ prompts: SystemPrompt[]; total: number }> {
  const { templateType, limit = 50, offset = 0 } = options;

  const conditions: string[] = ['user_id = $1'];
  const params: unknown[] = [userId];
  let paramIndex = 2;

  if (templateType) {
    conditions.push(`template_type = $${paramIndex++}`);
    params.push(templateType);
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM system_prompts WHERE ${whereClause}`;
  const countResult = await queryOne<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || '0', 10);

  // Get paginated results
  const sql = `
    SELECT *
    FROM system_prompts
    WHERE ${whereClause}
    ORDER BY updated_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const rows = await query<SystemPromptRow>(sql, [...params, limit, offset]);
  return {
    prompts: rows.map(mapPromptRow),
    total,
  };
}

/**
 * Get a single prompt by ID
 */
export async function getPromptById(id: string): Promise<SystemPrompt | null> {
  const sql = `SELECT * FROM system_prompts WHERE id = $1`;
  const row = await queryOne<SystemPromptRow>(sql, [id]);
  return row ? mapPromptRow(row) : null;
}

export interface CreatePromptData {
  userId: string;
  title: string;
  description?: string;
  content: string;
  templateType?: string;
  sourceKnowledgeIds?: string[];
}

/**
 * Create a new system prompt
 */
export async function createPrompt(data: CreatePromptData): Promise<SystemPrompt> {
  const {
    userId,
    title,
    description = null,
    content,
    templateType = null,
    sourceKnowledgeIds = [],
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

  return mapPromptRow(row!);
}

export interface UpdatePromptData {
  title?: string;
  description?: string;
  content?: string;
  templateType?: string;
  sourceKnowledgeIds?: string[];
}

/**
 * Update an existing system prompt
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
  return row ? mapPromptRow(row) : null;
}

/**
 * Delete a system prompt
 */
export async function deletePrompt(id: string): Promise<boolean> {
  const sql = `DELETE FROM system_prompts WHERE id = $1`;
  await query(sql, [id]);
  return true;
}

/**
 * Get prompts by template type for a user
 */
export async function getPromptsByTemplateType(
  userId: string,
  templateType: string
): Promise<SystemPrompt[]> {
  const sql = `
    SELECT *
    FROM system_prompts
    WHERE user_id = $1 AND template_type = $2
    ORDER BY updated_at DESC
  `;

  const rows = await query<SystemPromptRow>(sql, [userId, templateType]);
  return rows.map(mapPromptRow);
}

/**
 * Check if a prompt belongs to a user
 */
export async function isPromptOwnedByUser(
  promptId: string,
  userId: string
): Promise<boolean> {
  const sql = `SELECT 1 FROM system_prompts WHERE id = $1 AND user_id = $2`;
  const row = await queryOne(sql, [promptId, userId]);
  return row !== null;
}
