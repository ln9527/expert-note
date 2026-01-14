// Knowledge entry database queries

import { query, queryOne, transaction } from '../index';
import { Tag, AnnotationLevel } from '@/types';
import { PoolClient } from 'pg';

// Database row types
interface KnowledgeEntryRow {
  id: string;
  source_document_id: string | null;
  background: string | null;
  created_by: number | null;
  is_shared: boolean;
  allow_edit: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  tags?: Tag[];
  annotation_count?: number;
  source_document_name?: string;
  creator?: { id: number; username: string; displayName: string | null; orgId: number | null } | null;
}

interface AnnotationRow {
  id: string;
  knowledge_id: string;
  level: string;
  original_text: string;
  comment: string;
  refined_comment: string | null;
  location: string | null;
  background_context: string | null;
  position_line: number | null;
  position_char: number | null;
  created_at: string;
}

// Application types
export interface KnowledgeEntry {
  id: string;
  sourceDocumentId: string | null;
  background: string | null;
  createdBy: number | null;
  isShared: boolean;
  allowEdit: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
  annotationCount: number;
  sourceDocumentName?: string;
  creator?: { id: number; username: string; displayName: string | null; orgId: number | null } | null;
}

export interface KnowledgeAnnotation {
  id: string;
  knowledgeId: string;
  level: AnnotationLevel;
  originalText: string;
  comment: string;
  refinedComment: string | null;
  location: string | null;
  backgroundContext: string | null;
  positionLine: number | null;
  positionChar: number | null;
  createdAt: Date;
}

export interface AnnotationData {
  level: AnnotationLevel;
  originalText: string;
  comment: string;
  refinedComment?: string;
  location?: string;
  backgroundContext?: string;
  positionLine?: number;
  positionChar?: number;
}

export interface KnowledgeEntryWithAnnotations extends KnowledgeEntry {
  annotations: KnowledgeAnnotation[];
}

// Transform functions
function mapKnowledgeRow(row: KnowledgeEntryRow): KnowledgeEntry {
  return {
    id: row.id,
    sourceDocumentId: row.source_document_id,
    background: row.background,
    createdBy: row.created_by,
    isShared: row.is_shared ?? false,
    allowEdit: row.allow_edit ?? false,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    tags: row.tags || [],
    annotationCount: Number(row.annotation_count) || 0,
    sourceDocumentName: row.source_document_name,
    creator: row.creator,
  };
}

function mapAnnotationRow(row: AnnotationRow): KnowledgeAnnotation {
  return {
    id: row.id,
    knowledgeId: row.knowledge_id,
    level: row.level.toUpperCase() as AnnotationLevel,
    originalText: row.original_text,
    comment: row.comment,
    refinedComment: row.refined_comment,
    location: row.location,
    backgroundContext: row.background_context,
    positionLine: row.position_line,
    positionChar: row.position_char,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Get all knowledge entries with optional filtering
 *
 * Visibility rules:
 * - Users see their own entries (created_by = userId)
 * - Users see shared entries from same org (is_shared = true AND creator in same org)
 * - Org owners see ALL entries in their org
 * - Individual users only see their own entries
 */
export async function getAllKnowledgeEntries(
  userId: string,
  options: {
    tagIds?: number[];
    limit?: number;
    offset?: number;
    orgId?: number | null;  // User's organization
    role?: string;          // User's role: owner, member, individual
  } = {}
): Promise<KnowledgeEntry[]> {
  const { tagIds, limit = 50, offset = 0, orgId, role } = options;

  // Build visibility conditions based on role
  let visibilityCondition: string;
  const params: unknown[] = [userId];
  let paramIndex = 2;

  if (role === 'owner' && orgId) {
    // Owners see ALL entries in their org
    params.push(orgId);
    visibilityCondition = `(ke.created_by = $1 OR ke.created_by IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))`;
  } else if (role === 'member' && orgId) {
    // Members see own entries + shared entries from same org
    params.push(orgId);
    visibilityCondition = `(
      ke.created_by = $1
      OR (ke.is_shared = TRUE AND ke.created_by IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))
    )`;
  } else {
    // Individuals and users without org: only own entries
    visibilityCondition = `ke.created_by = $1`;
  }

  const conditions: string[] = ['ke.is_deleted = FALSE', visibilityCondition];

  // Filter by tags if provided
  if (tagIds && tagIds.length > 0) {
    conditions.push(
      `ke.id IN (SELECT knowledge_id FROM knowledge_tags WHERE tag_id = ANY($${paramIndex++}))`
    );
    params.push(tagIds);
  }

  const whereClause = 'WHERE ' + conditions.join(' AND ');

  const sql = `
    SELECT
      ke.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
         FROM knowledge_tags kt JOIN tags t ON kt.tag_id = t.id WHERE kt.knowledge_id = ke.id AND t.is_deleted = FALSE),
        '[]'
      ) as tags,
      (SELECT COUNT(*)::INTEGER FROM annotations WHERE knowledge_id = ke.id) as annotation_count,
      d.filename as source_document_name,
      CASE WHEN u.id IS NOT NULL THEN
        json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
      ELSE NULL END as creator
    FROM knowledge_entries ke
    LEFT JOIN documents d ON ke.source_document_id = d.id
    LEFT JOIN users u ON ke.created_by = u.id
    ${whereClause}
    ORDER BY ke.updated_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);

  const rows = await query<KnowledgeEntryRow>(sql, params);
  return rows.map(mapKnowledgeRow);
}

/**
 * Get a single knowledge entry by ID (excludes deleted by default)
 */
export async function getKnowledgeEntryById(id: string, includeDeleted = false): Promise<KnowledgeEntry | null> {
  const deleteFilter = includeDeleted ? '' : 'AND ke.is_deleted = FALSE';
  const sql = `
    SELECT
      ke.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
         FROM knowledge_tags kt JOIN tags t ON kt.tag_id = t.id WHERE kt.knowledge_id = ke.id AND t.is_deleted = FALSE),
        '[]'
      ) as tags,
      (SELECT COUNT(*)::INTEGER FROM annotations WHERE knowledge_id = ke.id) as annotation_count,
      d.filename as source_document_name
    FROM knowledge_entries ke
    LEFT JOIN documents d ON ke.source_document_id = d.id
    WHERE ke.id = $1 ${deleteFilter}
  `;

  const row = await queryOne<KnowledgeEntryRow>(sql, [id]);
  return row ? mapKnowledgeRow(row) : null;
}

/**
 * Get knowledge entry with all annotations
 */
export async function getKnowledgeEntryWithAnnotations(
  id: string
): Promise<KnowledgeEntryWithAnnotations | null> {
  const entry = await getKnowledgeEntryById(id);
  if (!entry) {
    return null;
  }

  const annotations = await getKnowledgeEntryAnnotations(id);

  return {
    ...entry,
    annotations,
  };
}

/**
 * Create a new knowledge entry with annotations and tags
 */
export async function createKnowledgeEntry(data: {
  sourceDocumentId?: string;
  background: string;
  tagIds?: number[];
  annotations: AnnotationData[];
  createdBy: number;  // Required: track who created the knowledge entry
}): Promise<KnowledgeEntry> {
  return transaction(async (client: PoolClient) => {
    const { sourceDocumentId, background, tagIds, annotations, createdBy } = data;

    // Insert knowledge entry and get full row back
    const entryResult = await client.query<KnowledgeEntryRow>(
      `INSERT INTO knowledge_entries (source_document_id, background, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [sourceDocumentId || null, background, createdBy]
    );
    const knowledgeId = entryResult.rows[0].id;

    // Insert tags
    if (tagIds && tagIds.length > 0) {
      const tagValues = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO knowledge_tags (knowledge_id, tag_id) VALUES ${tagValues}`,
        [knowledgeId, ...tagIds]
      );
    }

    // Insert annotations
    for (const ann of annotations) {
      await client.query(
        `INSERT INTO annotations (knowledge_id, level, original_text, comment, refined_comment, location, background_context, position_line, position_char)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          knowledgeId,
          ann.level.toLowerCase(),
          ann.originalText,
          ann.comment,
          ann.refinedComment || null,
          ann.location || null,
          ann.backgroundContext || null,
          ann.positionLine || null,
          ann.positionChar || null,
        ]
      );
    }

    // Fetch complete entry with tags using same transaction connection
    // Note: We must use client.query here to stay within the transaction
    const sql = `
      SELECT
        ke.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
           FROM knowledge_tags kt JOIN tags t ON kt.tag_id = t.id WHERE kt.knowledge_id = ke.id AND t.is_deleted = FALSE),
          '[]'
        ) as tags,
        (SELECT COUNT(*)::INTEGER FROM annotations WHERE knowledge_id = ke.id) as annotation_count,
        d.filename as source_document_name
      FROM knowledge_entries ke
      LEFT JOIN documents d ON ke.source_document_id = d.id
      WHERE ke.id = $1
    `;
    const result = await client.query<KnowledgeEntryRow>(sql, [knowledgeId]);
    return mapKnowledgeRow(result.rows[0]);
  });
}

/**
 * Update a knowledge entry
 */
export async function updateKnowledgeEntry(
  id: string,
  data: {
    background?: string;
    tagIds?: number[];
    isShared?: boolean;
    allowEdit?: boolean;
  }
): Promise<KnowledgeEntry | null> {
  return transaction(async (client: PoolClient) => {
    const { background, tagIds, isShared, allowEdit } = data;

    // Build update query
    const updates: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [id];
    let paramIndex = 2;

    if (background !== undefined) {
      updates.push(`background = $${paramIndex++}`);
      params.push(background);
    }

    if (isShared !== undefined) {
      updates.push(`is_shared = $${paramIndex++}`);
      params.push(isShared);
    }

    if (allowEdit !== undefined) {
      updates.push(`allow_edit = $${paramIndex++}`);
      params.push(allowEdit);
    }

    await client.query(
      `UPDATE knowledge_entries SET ${updates.join(', ')} WHERE id = $1`,
      params
    );

    // Update tags if provided
    if (tagIds !== undefined) {
      await client.query(`DELETE FROM knowledge_tags WHERE knowledge_id = $1`, [id]);
      if (tagIds.length > 0) {
        const tagValues = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO knowledge_tags (knowledge_id, tag_id) VALUES ${tagValues}`,
          [id, ...tagIds]
        );
      }
    }

    return getKnowledgeEntryById(id);
  });
}

/**
 * Soft delete a knowledge entry (move to trash)
 */
export async function deleteKnowledgeEntry(id: string): Promise<void> {
  await query(
    `UPDATE knowledge_entries SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1 AND is_deleted = FALSE`,
    [id]
  );
}

/**
 * Restore a soft-deleted knowledge entry from trash
 */
export async function restoreKnowledgeEntry(id: string): Promise<KnowledgeEntry | null> {
  await query(
    `UPDATE knowledge_entries SET is_deleted = FALSE, deleted_at = NULL, updated_at = NOW() WHERE id = $1 AND is_deleted = TRUE`,
    [id]
  );
  return getKnowledgeEntryById(id);
}

/**
 * Permanently delete a knowledge entry (cannot be undone)
 */
export async function permanentlyDeleteKnowledgeEntry(id: string): Promise<void> {
  // Cascading delete will handle annotations and tags
  await query(`DELETE FROM knowledge_entries WHERE id = $1`, [id]);
}

/**
 * Get all soft-deleted knowledge entries (trash)
 * SECURITY: Now properly filters by user
 */
export async function getDeletedKnowledgeEntries(userId: string): Promise<KnowledgeEntry[]> {
  const sql = `
    SELECT
      ke.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
         FROM knowledge_tags kt JOIN tags t ON kt.tag_id = t.id WHERE kt.knowledge_id = ke.id AND t.is_deleted = FALSE),
        '[]'
      ) as tags,
      (SELECT COUNT(*)::INTEGER FROM annotations WHERE knowledge_id = ke.id) as annotation_count,
      d.filename as source_document_name,
      CASE WHEN u.id IS NOT NULL THEN
        json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
      ELSE NULL END as creator
    FROM knowledge_entries ke
    LEFT JOIN documents d ON ke.source_document_id = d.id
    LEFT JOIN users u ON ke.created_by = u.id
    WHERE ke.is_deleted = TRUE AND ke.created_by = $1
    ORDER BY ke.deleted_at DESC
  `;

  const rows = await query<KnowledgeEntryRow>(sql, [userId]);
  return rows.map(mapKnowledgeRow);
}

/**
 * Get all annotations for a knowledge entry
 */
export async function getKnowledgeEntryAnnotations(
  knowledgeId: string
): Promise<KnowledgeAnnotation[]> {
  const sql = `
    SELECT id, knowledge_id, level, original_text, comment, refined_comment,
           location, background_context, position_line, position_char, created_at
    FROM annotations
    WHERE knowledge_id = $1
    ORDER BY position_line ASC NULLS LAST, created_at ASC
  `;

  const rows = await query<AnnotationRow>(sql, [knowledgeId]);
  return rows.map(mapAnnotationRow);
}

/**
 * Add a tag to a knowledge entry
 */
export async function addKnowledgeTag(
  knowledgeId: string,
  tagId: number
): Promise<void> {
  await query(
    `INSERT INTO knowledge_tags (knowledge_id, tag_id)
     VALUES ($1, $2)
     ON CONFLICT (knowledge_id, tag_id) DO NOTHING`,
    [knowledgeId, tagId]
  );
}

/**
 * Remove a tag from a knowledge entry
 */
export async function removeKnowledgeTag(
  knowledgeId: string,
  tagId: number
): Promise<void> {
  await query(
    `DELETE FROM knowledge_tags WHERE knowledge_id = $1 AND tag_id = $2`,
    [knowledgeId, tagId]
  );
}

/**
 * Add an annotation to a knowledge entry
 */
export async function addAnnotation(
  knowledgeId: string,
  data: AnnotationData
): Promise<KnowledgeAnnotation> {
  const sql = `
    INSERT INTO annotations (knowledge_id, level, original_text, comment, refined_comment, location, background_context, position_line, position_char)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, knowledge_id, level, original_text, comment, refined_comment, location, background_context, position_line, position_char, created_at
  `;

  const row = await queryOne<AnnotationRow>(sql, [
    knowledgeId,
    data.level.toLowerCase(),
    data.originalText,
    data.comment,
    data.refinedComment || null,
    data.location || null,
    data.backgroundContext || null,
    data.positionLine || null,
    data.positionChar || null,
  ]);

  return mapAnnotationRow(row!);
}

/**
 * Update an annotation's refined comment
 */
export async function updateAnnotationRefinedComment(
  annotationId: string,
  refinedComment: string
): Promise<KnowledgeAnnotation | null> {
  const sql = `
    UPDATE annotations
    SET refined_comment = $2
    WHERE id = $1
    RETURNING id, knowledge_id, level, original_text, comment, refined_comment, location, background_context, position_line, position_char, created_at
  `;

  const row = await queryOne<AnnotationRow>(sql, [annotationId, refinedComment]);
  return row ? mapAnnotationRow(row) : null;
}

/**
 * Delete an annotation
 */
export async function deleteAnnotation(annotationId: string): Promise<void> {
  await query(`DELETE FROM annotations WHERE id = $1`, [annotationId]);
}

/**
 * Get knowledge entries count (for pagination, excludes deleted)
 * Uses same visibility rules as getAllKnowledgeEntries
 */
export async function getKnowledgeEntriesCount(
  userId: string,
  options: {
    tagIds?: number[];
    orgId?: number | null;
    role?: string;
  } = {}
): Promise<number> {
  const { tagIds, orgId, role } = options;

  // Build visibility conditions (same as getAllKnowledgeEntries)
  let visibilityCondition: string;
  const params: unknown[] = [userId];
  let paramIndex = 2;

  if (role === 'owner' && orgId) {
    params.push(orgId);
    visibilityCondition = `(created_by = $1 OR created_by IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))`;
  } else if (role === 'member' && orgId) {
    params.push(orgId);
    visibilityCondition = `(
      created_by = $1
      OR (is_shared = TRUE AND created_by IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))
    )`;
  } else {
    visibilityCondition = `created_by = $1`;
  }

  const conditions: string[] = ['is_deleted = FALSE', visibilityCondition];

  if (tagIds && tagIds.length > 0) {
    conditions.push(
      `id IN (SELECT knowledge_id FROM knowledge_tags WHERE tag_id = ANY($${paramIndex++}))`
    );
    params.push(tagIds);
  }

  const whereClause = 'WHERE ' + conditions.join(' AND ');

  const sql = `SELECT COUNT(*) as count FROM knowledge_entries ${whereClause}`;
  const row = await queryOne<{ count: string }>(sql, params);
  return parseInt(row?.count || '0', 10);
}
