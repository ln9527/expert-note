// Tag database queries

import { query, queryOne } from '../index';
import { Tag } from '@/types';

interface TagRow {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

function mapTagRow(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  };
}

/**
 * Get all tags
 */
export async function getAllTags(): Promise<Tag[]> {
  const sql = `SELECT id, name, color, created_at FROM tags ORDER BY name ASC`;
  const rows = await query<TagRow>(sql);
  return rows.map(mapTagRow);
}

/**
 * Get tag by ID
 */
export async function getTagById(id: number): Promise<Tag | null> {
  const sql = `SELECT id, name, color, created_at FROM tags WHERE id = $1`;
  const row = await queryOne<TagRow>(sql, [id]);
  return row ? mapTagRow(row) : null;
}

/**
 * Get tag by name
 */
export async function getTagByName(name: string): Promise<Tag | null> {
  const sql = `SELECT id, name, color, created_at FROM tags WHERE name = $1`;
  const row = await queryOne<TagRow>(sql, [name]);
  return row ? mapTagRow(row) : null;
}

/**
 * Create a new tag
 */
export async function createTag(name: string, color?: string): Promise<Tag> {
  // Generate a random color if not provided
  const tagColor = color || generateRandomColor();

  const sql = `
    INSERT INTO tags (name, color)
    VALUES ($1, $2)
    RETURNING id, name, color, created_at
  `;
  const row = await queryOne<TagRow>(sql, [name, tagColor]);
  return mapTagRow(row!);
}

/**
 * Update a tag
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
    WHERE id = $1
    RETURNING id, name, color, created_at
  `;
  const row = await queryOne<TagRow>(sql, params);
  return row ? mapTagRow(row) : null;
}

/**
 * Delete a tag
 */
export async function deleteTag(id: number): Promise<boolean> {
  const sql = `DELETE FROM tags WHERE id = $1`;
  await query(sql, [id]);
  return true;
}

/**
 * Get tags for a specific document
 */
export async function getTagsForDocument(documentId: string): Promise<Tag[]> {
  const sql = `
    SELECT t.id, t.name, t.color, t.created_at
    FROM tags t
    INNER JOIN document_tags dt ON t.id = dt.tag_id
    WHERE dt.document_id = $1
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
