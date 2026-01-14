// Tag database queries

import { query, queryOne } from '../index';
import { Tag } from '@/types';

interface TagRow {
  id: number;
  name: string;
  color: string;
  created_at: string;
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

/**
 * Get all tags (excludes deleted)
 */
export async function getAllTags(): Promise<Tag[]> {
  const sql = `
    SELECT id, name, color, created_at, created_by, is_deleted, deleted_at
    FROM tags
    WHERE is_deleted = FALSE
    ORDER BY name ASC
  `;
  const rows = await query<TagRow>(sql);
  return rows.map(mapTagRow);
}

/**
 * Get tag by ID (excludes deleted)
 */
export async function getTagById(id: number): Promise<Tag | null> {
  const sql = `
    SELECT id, name, color, created_at, created_by, is_deleted, deleted_at
    FROM tags
    WHERE id = $1 AND is_deleted = FALSE
  `;
  const row = await queryOne<TagRow>(sql, [id]);
  return row ? mapTagRow(row) : null;
}

/**
 * Get tag by name (excludes deleted)
 */
export async function getTagByName(name: string): Promise<Tag | null> {
  const sql = `
    SELECT id, name, color, created_at, created_by, is_deleted, deleted_at
    FROM tags
    WHERE name = $1 AND is_deleted = FALSE
  `;
  const row = await queryOne<TagRow>(sql, [name]);
  return row ? mapTagRow(row) : null;
}

/**
 * Create a new tag
 */
export async function createTag(
  name: string,
  color?: string,
  createdBy?: number
): Promise<Tag> {
  // Generate a random color if not provided
  const tagColor = color || generateRandomColor();

  const sql = `
    INSERT INTO tags (name, color, created_by)
    VALUES ($1, $2, $3)
    RETURNING id, name, color, created_at, created_by, is_deleted, deleted_at
  `;
  const row = await queryOne<TagRow>(sql, [name, tagColor, createdBy || null]);
  return mapTagRow(row!);
}

/**
 * Update a tag (only updates non-deleted tags)
 */
export async function updateTag(
  id: number,
  data: { name?: string; color?: string }
): Promise<Tag | null> {
  const updates: string[] = [];
  const params: unknown[] = [id];
  let paramIndex = 2;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    params.push(data.name);
  }

  if (data.color !== undefined) {
    updates.push(`color = $${paramIndex++}`);
    params.push(data.color);
  }

  if (updates.length === 0) {
    return getTagById(id);
  }

  const sql = `
    UPDATE tags
    SET ${updates.join(', ')}
    WHERE id = $1 AND is_deleted = FALSE
    RETURNING id, name, color, created_at, created_by, is_deleted, deleted_at
  `;
  const row = await queryOne<TagRow>(sql, params);
  return row ? mapTagRow(row) : null;
}

/**
 * Soft delete a tag
 */
export async function deleteTag(id: number): Promise<boolean> {
  const sql = `
    UPDATE tags
    SET is_deleted = TRUE, deleted_at = NOW()
    WHERE id = $1 AND is_deleted = FALSE
  `;
  await query(sql, [id]);
  return true;
}

/**
 * Check if a user can delete a tag
 * - super_admin can delete any tag
 * - Global tags (created_by = NULL) can only be deleted by super_admin
 * - Users can only delete tags they created
 */
export async function canDeleteTag(
  tagId: number,
  userId: number,
  userRole: string
): Promise<boolean> {
  const tag = await getTagById(tagId);
  if (!tag) return false;

  // super_admin can delete any tag
  if (userRole === 'super_admin') return true;

  // Global tags (created_by = NULL) can only be deleted by super_admin
  if (tag.createdBy === null) return false;

  // User can only delete tags they created
  return tag.createdBy === userId;
}

/**
 * Get tags for a specific document (excludes deleted tags)
 */
export async function getTagsForDocument(documentId: string): Promise<Tag[]> {
  const sql = `
    SELECT t.id, t.name, t.color, t.created_at, t.created_by, t.is_deleted, t.deleted_at
    FROM tags t
    INNER JOIN document_tags dt ON t.id = dt.tag_id
    WHERE dt.document_id = $1 AND t.is_deleted = FALSE
    ORDER BY t.name ASC
  `;
  const rows = await query<TagRow>(sql, [documentId]);
  return rows.map(mapTagRow);
}

/**
 * Generate a random hex color
 */
function generateRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
