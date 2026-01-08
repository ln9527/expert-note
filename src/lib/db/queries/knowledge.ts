// Knowledge entry database queries

import { query, queryOne, transaction } from '../index';
import { Tag, AnnotationLevel } from '@/types';
import { PoolClient } from 'pg';

// Database row types
interface KnowledgeEntryRow {
  id: string;
  source_document_id: string | null;
  background: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  tags?: Tag[];
  annotation_count?: number;
  source_document_name?: string;
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
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
  annotationCount: number;
  sourceDocumentName?: string;
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
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    tags: row.tags || [],
    annotationCount: Number(row.annotation_count) || 0,
    sourceDocumentName: row.source_document_name,
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
 */
export async function getAllKnowledgeEntries(
  userId: string,
  options: {
    tagIds?: number[];
    limit?: number;
    offset?: number;
  } = {}
): Promise<KnowledgeEntry[]> {
  const { tagIds, limit = 50, offset = 0 } = options;

  const conditions: string[] = ['ke.is_deleted = FALSE'];
  const params: unknown[] = [];
  let paramIndex = 1;

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
         FROM knowledge_tags kt JOIN tags t ON kt.tag_id = t.id WHERE kt.knowledge_id = ke.id),
        '[]'
      ) as tags,
      (SELECT COUNT(*)::INTEGER FROM annotations WHERE knowledge_id = ke.id) as annotation_count,
      d.filename as source_document_name
    FROM knowledge_entries ke
    LEFT JOIN documents d ON ke.source_document_id = d.id
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
         FROM knowledge_tags kt JOIN tags t ON kt.tag_id = t.id WHERE kt.knowledge_id = ke.id),
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
}): Promise<KnowledgeEntry> {
  return transaction(async (client: PoolClient) => {
    const { sourceDocumentId, background, tagIds, annotations } = data;

    // Insert knowledge entry and get full row back
    const entryResult = await client.query<KnowledgeEntryRow>(
      `INSERT INTO knowledge_entries (source_document_id, background)
       VALUES ($1, $2)
       RETURNING *`,
      [sourceDocumentId || null, background]
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
           FROM knowledge_tags kt JOIN tags t ON kt.tag_id = t.id WHERE kt.knowledge_id = ke.id),
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
  }
): Promise<KnowledgeEntry | null> {
  return transaction(async (client: PoolClient) => {
    const { background, tagIds } = data;

    // Build update query
    const updates: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [id];
    let paramIndex = 2;

    if (background !== undefined) {
      updates.push(`background = $${paramIndex++}`);
      params.push(background);
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
 */
export async function getDeletedKnowledgeEntries(): Promise<KnowledgeEntry[]> {
  const sql = `
    SELECT
      ke.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
         FROM knowledge_tags kt JOIN tags t ON kt.tag_id = t.id WHERE kt.knowledge_id = ke.id),
        '[]'
      ) as tags,
      (SELECT COUNT(*)::INTEGER FROM annotations WHERE knowledge_id = ke.id) as annotation_count,
      d.filename as source_document_name
    FROM knowledge_entries ke
    LEFT JOIN documents d ON ke.source_document_id = d.id
    WHERE ke.is_deleted = TRUE
    ORDER BY ke.deleted_at DESC
  `;

  const rows = await query<KnowledgeEntryRow>(sql, []);
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
 */
export async function getKnowledgeEntriesCount(
  userId: string,
  options: { tagIds?: number[] } = {}
): Promise<number> {
  const { tagIds } = options;

  const conditions: string[] = ['is_deleted = FALSE'];
  const params: unknown[] = [];
  let paramIndex = 1;

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
