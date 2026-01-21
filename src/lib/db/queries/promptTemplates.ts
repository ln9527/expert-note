// Generation Guide (user-facing: "Generation Guide" | code: "Prompt Template") database queries

import { query, queryOne } from '../index';

// Type alias for template categories - reused across all interfaces
export type TemplateCategory = 'extraction' | 'generation' | 'skill-generation' | 'mcp-generation';

export interface PromptTemplateRow {
  id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  template_type: string | null;
  content: string;
  is_default: boolean;
  is_active: boolean;
  created_by: number | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  templateType: string | null;
  content: string;
  isDefault: boolean;
  isActive: boolean;
  createdBy: number | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

function mapTemplateRow(row: PromptTemplateRow): PromptTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    templateType: row.template_type,
    content: row.content,
    isDefault: row.is_default,
    isActive: row.is_active,
    createdBy: row.created_by,
    version: row.version,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface GetTemplatesOptions {
  category?: TemplateCategory;
  templateType?: string;
  isActive?: boolean;
  includeDefaults?: boolean;
  // Organization-based filtering
  userRole?: 'super_admin' | 'owner' | 'member' | 'individual';
  userId?: number;
  orgId?: number | null;
}

/**
 * Get all generation guides (code: prompt templates) with optional filtering
 *
 * Organization-based visibility:
 * - System/default templates (is_default = true): Visible to ALL users
 * - User-created templates (is_default = false):
 *   - super_admin: Can see ALL templates
 *   - owner/member: See templates created by users in their org
 *   - individual: See only templates they created themselves
 */
export async function getAllPromptTemplates(
  options: GetTemplatesOptions = {}
): Promise<PromptTemplate[]> {
  const {
    category,
    templateType,
    isActive = true,
    includeDefaults = true,
    userRole,
    userId,
    orgId,
  } = options;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (category) {
    conditions.push(`category = $${paramIndex++}`);
    params.push(category);
  }

  if (templateType) {
    conditions.push(`template_type = $${paramIndex++}`);
    params.push(templateType);
  }

  if (isActive !== undefined) {
    conditions.push(`is_active = $${paramIndex++}`);
    params.push(isActive);
  }

  if (!includeDefaults) {
    conditions.push(`is_default = FALSE`);
  }

  // Apply organization-based filtering
  if (userRole && userRole !== 'super_admin') {
    if (userRole === 'individual') {
      // Individual users see system templates + only their own templates
      conditions.push(`(is_default = TRUE OR created_by = $${paramIndex++})`);
      params.push(userId);
    } else if ((userRole === 'owner' || userRole === 'member') && orgId) {
      // Org members see system templates + templates from users in their org
      conditions.push(
        `(is_default = TRUE OR created_by IN (SELECT id FROM users WHERE org_id = $${paramIndex++}))`
      );
      params.push(orgId);
    }
    // super_admin sees everything - no additional filter needed
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT *
    FROM prompt_templates
    ${whereClause}
    ORDER BY is_default DESC, name ASC
  `;

  const rows = await query<PromptTemplateRow>(sql, params);
  return rows.map(mapTemplateRow);
}

/**
 * Get a single generation guide (code: prompt template) by ID
 */
export async function getPromptTemplateById(id: string): Promise<PromptTemplate | null> {
  const sql = `SELECT * FROM prompt_templates WHERE id = $1`;
  const row = await queryOne<PromptTemplateRow>(sql, [id]);
  return row ? mapTemplateRow(row) : null;
}

/**
 * Get the default template for a category
 *
 * Priority order when templateType is specified:
 * 1. Template with matching template_type (regardless of is_default)
 * 2. Category default template (is_default=TRUE, template_type=NULL)
 *
 * This allows both specific templates (e.g., template_type='introduction')
 * and generic defaults to work correctly.
 */
export async function getDefaultTemplate(
  category: TemplateCategory,
  templateType?: string
): Promise<PromptTemplate | null> {
  if (templateType) {
    console.log(`[Template Query] Looking for ${category} template with type: ${templateType}`);

    // Strategy: Try to find template with matching template_type first
    // This works for both is_default=TRUE and is_default=FALSE templates
    let sql = `
      SELECT * FROM prompt_templates
      WHERE category = $1 AND is_active = TRUE AND template_type = $2
      ORDER BY is_default DESC
      LIMIT 1
    `;
    let params: unknown[] = [category, templateType];

    let row = await queryOne<PromptTemplateRow>(sql, params);

    if (row) {
      console.log(`[Template Query] ✓ Found template: ${row.name} (is_default=${row.is_default})`);
      return mapTemplateRow(row);
    }

    // Fallback: If no template with specific type, get category default
    console.log(`[Template Query] No template found for type "${templateType}", falling back to category default`);
    sql = `
      SELECT * FROM prompt_templates
      WHERE category = $1 AND is_default = TRUE AND is_active = TRUE
      LIMIT 1
    `;
    params = [category];

    row = await queryOne<PromptTemplateRow>(sql, params);

    if (row) {
      console.log(`[Template Query] ✓ Using category default: ${row.name}`);
      return mapTemplateRow(row);
    }

    console.log(`[Template Query] ✗ No template found for category ${category}`);
    return null;
  } else {
    // No templateType specified - get category default
    console.log(`[Template Query] Looking for ${category} default template`);

    const sql = `
      SELECT * FROM prompt_templates
      WHERE category = $1 AND is_default = TRUE AND is_active = TRUE
      LIMIT 1
    `;
    const params = [category];

    const row = await queryOne<PromptTemplateRow>(sql, params);

    if (row) {
      console.log(`[Template Query] ✓ Found default: ${row.name}`);
      return mapTemplateRow(row);
    }

    console.log(`[Template Query] ✗ No default template found for category ${category}`);
    return null;
  }
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category: TemplateCategory;
  templateType?: string;
  content: string;
  isDefault?: boolean;
  createdBy?: number;
}

/**
 * Create a new generation guide (code: prompt template)
 */
export async function createPromptTemplate(data: CreateTemplateData): Promise<PromptTemplate> {
  const {
    name,
    description = null,
    category,
    templateType = null,
    content,
    isDefault = false,
    createdBy = null,
  } = data;

  const sql = `
    INSERT INTO prompt_templates (
      name, description, category, template_type, content, is_default, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const row = await queryOne<PromptTemplateRow>(sql, [
    name,
    description,
    category,
    templateType,
    content,
    isDefault,
    createdBy,
  ]);

  return mapTemplateRow(row!);
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  content?: string;
  templateType?: string;
  isActive?: boolean;
}

/**
 * Update an existing generation guide (code: prompt template)
 */
export async function updatePromptTemplate(
  id: string,
  data: UpdateTemplateData
): Promise<PromptTemplate | null> {
  const updates: string[] = ['updated_at = NOW()'];
  const params: unknown[] = [id];
  let paramIndex = 2;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    params.push(data.name);
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

  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    params.push(data.isActive);
  }

  const sql = `
    UPDATE prompt_templates
    SET ${updates.join(', ')}
    WHERE id = $1
    RETURNING *
  `;

  const row = await queryOne<PromptTemplateRow>(sql, params);
  return row ? mapTemplateRow(row) : null;
}

/**
 * Delete a generation guide (code: prompt template) - only non-default guides can be deleted
 */
export async function deletePromptTemplate(id: string): Promise<boolean> {
  // Don't allow deleting default templates
  const checkSql = `SELECT is_default FROM prompt_templates WHERE id = $1`;
  const existing = await queryOne<{ is_default: boolean }>(checkSql, [id]);

  if (existing?.is_default) {
    throw new Error('Cannot delete default templates');
  }

  const sql = `DELETE FROM prompt_templates WHERE id = $1 AND is_default = FALSE`;
  await query(sql, [id]);
  return true;
}

/**
 * Duplicate a template (for creating custom versions)
 */
export async function duplicatePromptTemplate(
  id: string,
  newName: string,
  createdBy?: number
): Promise<PromptTemplate> {
  const original = await getPromptTemplateById(id);
  if (!original) {
    throw new Error('Template not found');
  }

  return createPromptTemplate({
    name: newName,
    description: original.description || undefined,
    category: original.category,
    templateType: original.templateType || undefined,
    content: original.content,
    isDefault: false,
    createdBy,
  });
}
