/**
 * Skills Database Queries
 *
 * Skills are exportable packages of prompts/knowledge for Claude Code.
 * They follow the same permission patterns as system_prompts.
 */

import { query, queryOne } from '../index';

export interface SkillRow {
  id: string;
  title: string;
  description: string | null;
  content: Record<string, unknown>;  // JSONB storing file structure
  source_prompt_ids: string[] | null;
  source_knowledge_ids: string[] | null;
  created_by: number;
  is_shared: boolean;
  allow_edit: boolean;
  download_count: number;
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

export interface Skill {
  id: string;
  title: string;
  description: string | null;
  content: Record<string, unknown>;
  sourcePromptIds: string[];
  sourceKnowledgeIds: string[];
  createdBy: number;
  isShared: boolean;
  allowEdit: boolean;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  creator?: {
    id: number;
    username: string;
    displayName: string | null;
    orgId: number | null;
  } | null;
}

function mapSkillRow(row: SkillRow): Skill {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    sourcePromptIds: row.source_prompt_ids || [],
    sourceKnowledgeIds: row.source_knowledge_ids || [],
    createdBy: row.created_by,
    isShared: row.is_shared ?? false,
    allowEdit: row.allow_edit ?? false,
    downloadCount: row.download_count ?? 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    isDeleted: row.is_deleted || false,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    creator: row.creator || null,
  };
}

export interface GetAllSkillsOptions {
  search?: string;
  limit?: number;
  offset?: number;
  // Org visibility options
  orgId?: number | null;
  role?: string;
}

/**
 * Get all skills with org-based visibility
 *
 * Visibility rules:
 * - Users see their own skills (created_by = userId)
 * - Users see shared skills from same org (is_shared = true AND creator in same org)
 * - Org owners see ALL skills in their org
 * - Individual users only see their own skills
 * - super_admin sees all skills
 */
export async function getAllSkills(
  userId: string,
  options: GetAllSkillsOptions = {}
): Promise<{ skills: Skill[]; total: number }> {
  const { search, limit = 50, offset = 0, orgId, role } = options;

  const conditions: string[] = ['s.is_deleted = FALSE'];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Build visibility condition based on role
  // Only add userId to params when it's actually used in the query
  let visibilityCondition: string;
  if (role === 'super_admin') {
    // Super admin sees all skills - no userId needed in query
    visibilityCondition = 'TRUE';
  } else if (role === 'owner' && orgId) {
    // Owners see ALL skills in their org
    params.push(userId);
    params.push(orgId);
    visibilityCondition = `(s.created_by = $${paramIndex++} OR s.created_by IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))`;
  } else if (role === 'member' && orgId) {
    // Members see own skills + shared skills from same org
    params.push(userId);
    params.push(orgId);
    visibilityCondition = `(
      s.created_by = $${paramIndex++}
      OR (s.is_shared = TRUE AND s.created_by IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))
    )`;
  } else {
    // Individuals and users without org: only own skills
    params.push(userId);
    visibilityCondition = `s.created_by = $${paramIndex++}`;
  }
  conditions.push(visibilityCondition);

  // Search in title and description
  if (search && search.trim()) {
    conditions.push(`(s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`);
    params.push(`%${search.trim()}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM skills s WHERE ${whereClause}`;
  const countResult = await queryOne<{ total: string }>(countSql, params);
  const total = parseInt(countResult?.total || '0', 10);

  // Get paginated results with creator info
  const sql = `
    SELECT s.*,
      CASE WHEN u.id IS NOT NULL THEN
        json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
      ELSE NULL END as creator
    FROM skills s
    LEFT JOIN users u ON s.created_by = u.id
    WHERE ${whereClause}
    ORDER BY s.updated_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const finalParams = [...params, limit, offset];
  const rows = await query<SkillRow>(sql, finalParams);

  const skills = rows.map(row => mapSkillRow(row));

  return { skills, total };
}

/**
 * Get a single skill by ID (excludes deleted by default)
 */
export async function getSkillById(id: string, includeDeleted = false): Promise<Skill | null> {
  const sql = includeDeleted
    ? `
      SELECT s.*,
        CASE WHEN u.id IS NOT NULL THEN
          json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
        ELSE NULL END as creator
      FROM skills s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = $1
    `
    : `
      SELECT s.*,
        CASE WHEN u.id IS NOT NULL THEN
          json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
        ELSE NULL END as creator
      FROM skills s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = $1 AND s.is_deleted = FALSE
    `;
  const row = await queryOne<SkillRow>(sql, [id]);
  if (!row) return null;

  return mapSkillRow(row);
}

export interface CreateSkillData {
  userId: string;
  title: string;
  description?: string;
  content: Record<string, unknown>;
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  isShared?: boolean;
  allowEdit?: boolean;
}

/**
 * Create a new skill
 */
export async function createSkill(data: CreateSkillData): Promise<Skill> {
  const {
    userId,
    title,
    description = null,
    content,
    sourcePromptIds = [],
    sourceKnowledgeIds = [],
    isShared = false,
    allowEdit = false,
  } = data;

  const sql = `
    INSERT INTO skills (
      title, description, content,
      source_prompt_ids, source_knowledge_ids,
      created_by, is_shared, allow_edit
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const row = await queryOne<SkillRow>(sql, [
    title,
    description,
    JSON.stringify(content),
    sourcePromptIds.length > 0 ? sourcePromptIds : null,
    sourceKnowledgeIds.length > 0 ? sourceKnowledgeIds : null,
    userId,
    isShared,
    allowEdit,
  ]);

  return mapSkillRow(row!);
}

export interface UpdateSkillData {
  title?: string;
  description?: string;
  content?: Record<string, unknown>;
  isShared?: boolean;
  allowEdit?: boolean;
}

/**
 * Update an existing skill
 */
export async function updateSkill(
  id: string,
  data: UpdateSkillData
): Promise<Skill | null> {
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
    params.push(JSON.stringify(data.content));
  }

  if (data.isShared !== undefined) {
    updates.push(`is_shared = $${paramIndex++}`);
    params.push(data.isShared);
  }

  if (data.allowEdit !== undefined) {
    updates.push(`allow_edit = $${paramIndex++}`);
    params.push(data.allowEdit);
  }

  const sql = `
    UPDATE skills
    SET ${updates.join(', ')}
    WHERE id = $1 AND is_deleted = FALSE
    RETURNING *
  `;

  const row = await queryOne<SkillRow>(sql, params);
  if (!row) return null;

  // Fetch again with creator info
  return getSkillById(id);
}

/**
 * Soft delete a skill (move to trash)
 */
export async function deleteSkill(id: string): Promise<boolean> {
  const sql = `
    UPDATE skills
    SET is_deleted = TRUE, deleted_at = NOW()
    WHERE id = $1 AND is_deleted = FALSE
  `;
  await query(sql, [id]);
  return true;
}

/**
 * Restore a soft-deleted skill from trash
 */
export async function restoreSkill(id: string): Promise<Skill | null> {
  const sql = `
    UPDATE skills
    SET is_deleted = FALSE, deleted_at = NULL, updated_at = NOW()
    WHERE id = $1 AND is_deleted = TRUE
    RETURNING *
  `;
  const row = await queryOne<SkillRow>(sql, [id]);
  if (!row) return null;

  return mapSkillRow(row);
}

/**
 * Check if a skill belongs to a user
 */
export async function isSkillOwnedByUser(
  skillId: string,
  userId: string
): Promise<boolean> {
  const sql = `SELECT 1 FROM skills WHERE id = $1 AND created_by = $2`;
  const row = await queryOne(sql, [skillId, userId]);
  return row !== null;
}

/**
 * Check if user can edit a skill
 *
 * Edit rules:
 * - super_admin can edit any skill
 * - Skill creator can edit their own skill
 * - Org owner can edit shared skills with allow_edit from same org
 * - Member cannot edit others' skills (even if shared)
 */
export async function canUserEditSkill(
  skillId: string,
  userId: string,
  userOrgId: number | null,
  userRole: string
): Promise<boolean> {
  // super_admin can edit anything
  if (userRole === 'super_admin') {
    return true;
  }

  // Get skill with creator info
  const skill = await getSkillById(skillId);
  if (!skill) return false;

  // Creator can always edit
  if (skill.createdBy === parseInt(userId, 10)) {
    return true;
  }

  // Org owner can edit shared skills with allowEdit from same org
  if (
    userRole === 'owner' &&
    skill.isShared &&
    skill.allowEdit &&
    userOrgId &&
    skill.creator?.orgId === userOrgId
  ) {
    return true;
  }

  return false;
}

/**
 * Get all soft-deleted skills for a user (trash)
 */
export async function getDeletedSkills(userId: string): Promise<Skill[]> {
  const sql = `
    SELECT s.*,
      CASE WHEN u.id IS NOT NULL THEN
        json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
      ELSE NULL END as creator
    FROM skills s
    LEFT JOIN users u ON s.created_by = u.id
    WHERE s.created_by = $1 AND s.is_deleted = TRUE
    ORDER BY s.deleted_at DESC
  `;
  const rows = await query<SkillRow>(sql, [userId]);

  return rows.map(row => mapSkillRow(row));
}

/**
 * Increment download count for a skill
 */
export async function incrementDownloadCount(skillId: string): Promise<void> {
  const sql = `
    UPDATE skills
    SET download_count = download_count + 1
    WHERE id = $1
  `;
  await query(sql, [skillId]);
}
