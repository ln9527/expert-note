// Document database queries

import { query, queryOne, transaction } from '../index';
import { Document, Tag, AnnotationCounts, CreatorInfo } from '@/types';
import { parseAnnotations } from '@/lib/utils/annotation';
import { PoolClient } from 'pg';

interface DocumentRow {
  id: string;
  filename: string;
  content: string;
  status: string;
  created_by: number | null;
  updated_by: number | null;
  is_shared: boolean;
  allow_edit: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  annotation_counts?: AnnotationCounts;
  creator?: CreatorInfo | null;
}

function mapDocumentRow(row: DocumentRow): Document {
  return {
    id: row.id,
    filename: row.filename,
    content: row.content,
    status: row.status as Document['status'],
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    creator: row.creator || null,
    isShared: row.is_shared ?? false,
    allowEdit: row.allow_edit ?? false,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    tags: row.tags || [],
    annotationCounts: row.annotation_counts || { macro: 0, meso: 0, micro: 0 },
  };
}

/**
 * Get documents with org-based visibility
 *
 * Visibility rules:
 * - Users see their own documents (created_by = userId)
 * - Users see shared documents from same org (is_shared = true AND creator in same org)
 * - Org owners see ALL documents in their org
 * - Individual users only see their own documents
 */
export async function getDocuments(options: {
  includeDeleted?: boolean;
  status?: string;
  tagIds?: number[];
  search?: string;
  createdBy?: number;
  // Org visibility options
  userId?: number;
  orgId?: number | null;
  role?: string;
} = {}): Promise<Document[]> {
  const { includeDeleted = false, status, tagIds, search, createdBy, userId, orgId, role } = options;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (!includeDeleted) {
    conditions.push(`d.is_deleted = FALSE`);
  }

  // Build visibility condition if userId is provided
  if (userId !== undefined) {
    params.push(userId);
    let visibilityCondition: string;

    if (role === 'owner' && orgId) {
      // Owners see ALL documents in their org
      params.push(orgId);
      visibilityCondition = `(d.created_by = $${paramIndex++} OR d.created_by IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))`;
    } else if (role === 'member' && orgId) {
      // Members see own docs + shared docs from same org
      params.push(orgId);
      visibilityCondition = `(
        d.created_by = $${paramIndex++}
        OR (d.is_shared = TRUE AND d.created_by IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))
      )`;
    } else {
      // Individuals and users without org: only own documents
      visibilityCondition = `d.created_by = $${paramIndex++}`;
    }
    conditions.push(visibilityCondition);
  } else if (createdBy !== undefined && createdBy !== null) {
    // Legacy: Filter by specific creator (backwards compatibility)
    conditions.push(`d.created_by = $${paramIndex++}`);
    params.push(createdBy);
  }

  if (status) {
    conditions.push(`d.status = $${paramIndex++}`);
    params.push(status);
  }

  if (tagIds && tagIds.length > 0) {
    conditions.push(`d.id IN (SELECT document_id FROM document_tags WHERE tag_id = ANY($${paramIndex++}))`);
    params.push(tagIds);
  }

  // Fuzzy search across filename and content
  if (search) {
    conditions.push(`(d.filename ILIKE $${paramIndex} OR d.content ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const sql = `
    SELECT
      d.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
         FROM document_tags dt JOIN tags t ON dt.tag_id = t.id WHERE dt.document_id = d.id AND t.is_deleted = FALSE),
        '[]'
      ) as tags,
      (SELECT json_build_object(
        'macro', COUNT(*) FILTER (WHERE level = 'MACRO'),
        'meso', COUNT(*) FILTER (WHERE level = 'MESO'),
        'micro', COUNT(*) FILTER (WHERE level = 'MICRO')
      ) FROM annotations WHERE document_id = d.id) as annotation_counts,
      CASE WHEN u.id IS NOT NULL THEN
        json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
      ELSE NULL END as creator
    FROM documents d
    LEFT JOIN users u ON d.created_by = u.id
    ${whereClause}
    ORDER BY d.updated_at DESC
  `;

  const rows = await query<DocumentRow>(sql, params);
  return rows.map(mapDocumentRow);
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const sql = `
    SELECT
      d.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
         FROM document_tags dt JOIN tags t ON dt.tag_id = t.id WHERE dt.document_id = d.id AND t.is_deleted = FALSE),
        '[]'
      ) as tags,
      (SELECT json_build_object(
        'macro', COUNT(*) FILTER (WHERE level = 'MACRO'),
        'meso', COUNT(*) FILTER (WHERE level = 'MESO'),
        'micro', COUNT(*) FILTER (WHERE level = 'MICRO')
      ) FROM annotations WHERE document_id = d.id) as annotation_counts,
      CASE WHEN u.id IS NOT NULL THEN
        json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
      ELSE NULL END as creator
    FROM documents d
    LEFT JOIN users u ON d.created_by = u.id
    WHERE d.id = $1
  `;

  const row = await queryOne<DocumentRow>(sql, [id]);
  return row ? mapDocumentRow(row) : null;
}

export async function createDocument(data: {
  filename: string;
  content: string;
  createdBy: number;
  tagIds?: number[];
}): Promise<Document> {
  return transaction(async (client: PoolClient) => {
    const { filename, content, createdBy, tagIds } = data;

    // Insert document
    const docResult = await client.query<DocumentRow>(
      `INSERT INTO documents (filename, content, created_by, updated_by)
       VALUES ($1, $2, $3, $3)
       RETURNING *`,
      [filename, content, createdBy]
    );
    const docId = docResult.rows[0].id;

    // Insert tags
    if (tagIds && tagIds.length > 0) {
      const tagValues = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO document_tags (document_id, tag_id) VALUES ${tagValues}`,
        [docId, ...tagIds]
      );
    }

    // Parse and save annotations
    const annotations = parseAnnotations(content);
    for (const ann of annotations) {
      await client.query(
        `INSERT INTO annotations (document_id, level, content, position_line, position_char, raw_text)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [docId, ann.level, ann.content, ann.line, ann.char, ann.rawText]
      );
    }

    // Update status if has annotations
    if (annotations.length > 0) {
      await client.query(`UPDATE documents SET status = 'annotated' WHERE id = $1`, [docId]);
    }

    // Fetch full document with tags, annotation counts, and creator within transaction
    const sql = `
      SELECT
        d.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
           FROM document_tags dt JOIN tags t ON dt.tag_id = t.id WHERE dt.document_id = d.id AND t.is_deleted = FALSE),
          '[]'
        ) as tags,
        (SELECT json_build_object(
          'macro', COUNT(*) FILTER (WHERE level = 'MACRO'),
          'meso', COUNT(*) FILTER (WHERE level = 'MESO'),
          'micro', COUNT(*) FILTER (WHERE level = 'MICRO')
        ) FROM annotations WHERE document_id = d.id) as annotation_counts,
        CASE WHEN u.id IS NOT NULL THEN
          json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name)
        ELSE NULL END as creator
      FROM documents d
      LEFT JOIN users u ON d.created_by = u.id
      WHERE d.id = $1
    `;
    const result = await client.query<DocumentRow>(sql, [docId]);
    return mapDocumentRow(result.rows[0]);
  });
}

export async function updateDocument(
  id: string,
  data: {
    filename?: string;
    content?: string;
    tagIds?: number[];
    isShared?: boolean;
    allowEdit?: boolean;
    updatedBy: number;
  }
): Promise<Document> {
  return transaction(async (client: PoolClient) => {
    const { filename, content, tagIds, isShared, allowEdit, updatedBy } = data;

    // Build update query
    const updates: string[] = ['updated_by = $2'];
    const params: unknown[] = [id, updatedBy];
    let paramIndex = 3;

    if (filename !== undefined) {
      updates.push(`filename = $${paramIndex++}`);
      params.push(filename);
    }

    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      params.push(content);
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
      `UPDATE documents SET ${updates.join(', ')} WHERE id = $1`,
      params
    );

    // Update tags if provided
    if (tagIds !== undefined) {
      await client.query(`DELETE FROM document_tags WHERE document_id = $1`, [id]);
      if (tagIds.length > 0) {
        const tagValues = tagIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO document_tags (document_id, tag_id) VALUES ${tagValues}`,
          [id, ...tagIds]
        );
      }
    }

    // Re-parse annotations if content changed
    if (content !== undefined) {
      await client.query(`DELETE FROM annotations WHERE document_id = $1`, [id]);

      const annotations = parseAnnotations(content);
      for (const ann of annotations) {
        await client.query(
          `INSERT INTO annotations (document_id, level, content, position_line, position_char, raw_text)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, ann.level, ann.content, ann.line, ann.char, ann.rawText]
        );
      }

      // Update status based on annotations
      const newStatus = annotations.length > 0 ? 'annotated' : 'raw';
      await client.query(`UPDATE documents SET status = $2 WHERE id = $1`, [id, newStatus]);
    }

    // Fetch updated document with creator within transaction
    const sql = `
      SELECT
        d.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
           FROM document_tags dt JOIN tags t ON dt.tag_id = t.id WHERE dt.document_id = d.id AND t.is_deleted = FALSE),
          '[]'
        ) as tags,
        (SELECT json_build_object(
          'macro', COUNT(*) FILTER (WHERE level = 'MACRO'),
          'meso', COUNT(*) FILTER (WHERE level = 'MESO'),
          'micro', COUNT(*) FILTER (WHERE level = 'MICRO')
        ) FROM annotations WHERE document_id = d.id) as annotation_counts,
        CASE WHEN u.id IS NOT NULL THEN
          json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name)
        ELSE NULL END as creator
      FROM documents d
      LEFT JOIN users u ON d.created_by = u.id
      WHERE d.id = $1
    `;
    const result = await client.query<DocumentRow>(sql, [id]);
    return mapDocumentRow(result.rows[0]);
  });
}

export async function deleteDocument(id: string, permanent = false): Promise<void> {
  if (permanent) {
    await query(`DELETE FROM documents WHERE id = $1`, [id]);
  } else {
    await query(
      `UPDATE documents SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1`,
      [id]
    );
  }
}

export async function restoreDocument(id: string): Promise<Document | null> {
  await query(
    `UPDATE documents SET is_deleted = FALSE, deleted_at = NULL WHERE id = $1`,
    [id]
  );
  return getDocumentById(id);
}

/**
 * Get all soft-deleted documents (for trash)
 * SECURITY: Now properly filters by user
 */
export async function getDeletedDocuments(userId: number): Promise<Document[]> {
  const sql = `
    SELECT
      d.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
         FROM document_tags dt JOIN tags t ON dt.tag_id = t.id WHERE dt.document_id = d.id AND t.is_deleted = FALSE),
        '[]'
      ) as tags,
      (SELECT json_build_object(
        'macro', COUNT(*) FILTER (WHERE level = 'MACRO'),
        'meso', COUNT(*) FILTER (WHERE level = 'MESO'),
        'micro', COUNT(*) FILTER (WHERE level = 'MICRO')
      ) FROM annotations WHERE document_id = d.id) as annotation_counts,
      CASE WHEN u.id IS NOT NULL THEN
        json_build_object('id', u.id, 'username', u.username, 'displayName', u.display_name, 'orgId', u.org_id)
      ELSE NULL END as creator
    FROM documents d
    LEFT JOIN users u ON d.created_by = u.id
    WHERE d.is_deleted = TRUE AND d.created_by = $1
    ORDER BY d.deleted_at DESC
  `;

  const rows = await query<DocumentRow>(sql, [userId]);
  return rows.map(mapDocumentRow);
}
