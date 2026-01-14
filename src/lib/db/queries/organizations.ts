/**
 * Organization database queries
 *
 * Handles CRUD operations for organizations.
 */

import { query, queryOne, transaction } from '../index';
import { Organization, InvitationCode } from '@/types';
import { PoolClient } from 'pg';

interface OrganizationRow {
  id: number;
  name: string;
  description: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapOrganizationRow(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(id: number): Promise<Organization | null> {
  const row = await queryOne<OrganizationRow>(
    'SELECT * FROM organizations WHERE id = $1',
    [id]
  );
  return row ? mapOrganizationRow(row) : null;
}

/**
 * Get all organizations
 * @param options.includeDeleted - If true, include soft-deleted organizations
 */
export async function getAllOrganizations(options?: {
  includeDeleted?: boolean;
}): Promise<Organization[]> {
  const whereClause = options?.includeDeleted ? '' : 'WHERE deleted_at IS NULL';
  const rows = await query<OrganizationRow>(
    `SELECT * FROM organizations ${whereClause} ORDER BY name`
  );
  return rows.map(mapOrganizationRow);
}

/**
 * Create a new organization
 */
export async function createOrganization(data: {
  name: string;
  description?: string;
}): Promise<Organization> {
  const row = await queryOne<OrganizationRow>(
    `INSERT INTO organizations (name, description)
     VALUES ($1, $2)
     RETURNING *`,
    [data.name, data.description || null]
  );
  return mapOrganizationRow(row!);
}

/**
 * Generate a random invitation code
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like O, 0, I, 1
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create organization with auto-generated org_owner invitation code
 * This is used by super_admin to create new organizations
 * Owner codes are unlimited by default (max_uses = 0)
 */
export async function createOrganizationWithOwnerCode(data: {
  name: string;
  description?: string | null;
  createdBy: number;
}): Promise<{ organization: Organization; ownerCode: InvitationCode }> {
  return transaction(async (client: PoolClient) => {
    const { name, description, createdBy } = data;

    // Create organization
    const orgResult = await client.query<OrganizationRow>(
      `INSERT INTO organizations (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description, deleted_at, created_at, updated_at`,
      [name, description || null]
    );
    const org = mapOrganizationRow(orgResult.rows[0]);

    // Generate code
    const code = generateCode();

    // Create org_owner invitation code (unlimited by default: max_uses = 0)
    const codeResult = await client.query<{
      id: number;
      code: string;
      type: string;
      org_id: number | null;
      created_by: number | null;
      used_by: number | null;
      used_at: Date | null;
      max_uses: number;
      current_uses: number;
      created_at: Date;
    }>(
      `INSERT INTO invitation_codes (code, type, org_id, created_by, max_uses, current_uses)
       VALUES ($1, 'org_owner', $2, $3, 0, 0)
       RETURNING id, code, type, org_id, created_by, used_by, used_at, max_uses, current_uses, created_at`,
      [code, org.id, createdBy]
    );

    const ownerCode: InvitationCode = {
      id: codeResult.rows[0].id,
      code: codeResult.rows[0].code,
      type: codeResult.rows[0].type as 'org_owner',
      orgId: codeResult.rows[0].org_id,
      createdBy: codeResult.rows[0].created_by,
      usedBy: codeResult.rows[0].used_by,
      usedAt: codeResult.rows[0].used_at,
      maxUses: codeResult.rows[0].max_uses,
      currentUses: codeResult.rows[0].current_uses,
      createdAt: codeResult.rows[0].created_at,
    };

    return { organization: org, ownerCode };
  });
}

/**
 * Update organization
 */
export async function updateOrganization(
  id: number,
  data: { name?: string; description?: string }
): Promise<Organization | null> {
  const updates: string[] = [];
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

  if (updates.length === 0) {
    return getOrganizationById(id);
  }

  updates.push(`updated_at = NOW()`);

  const row = await queryOne<OrganizationRow>(
    `UPDATE organizations SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return row ? mapOrganizationRow(row) : null;
}

/**
 * Hard delete organization (only if no users belong to it)
 * Use softDeleteOrganization for normal deletion
 */
export async function deleteOrganization(id: number): Promise<boolean> {
  // Check if any users belong to this org
  const userCount = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM users WHERE org_id = $1',
    [id]
  );

  if (userCount && parseInt(userCount.count) > 0) {
    throw new Error('Cannot hard delete organization with users. Use soft delete instead.');
  }

  await query('DELETE FROM organizations WHERE id = $1', [id]);
  return true;
}

/**
 * Soft delete organization and cascade to all users
 * - Sets org's deleted_at
 * - Soft deletes all users in org (renames username, clears phone/email)
 */
export async function softDeleteOrganization(id: number): Promise<boolean> {
  return transaction(async (client: PoolClient) => {
    const timestamp = Date.now();

    // Soft-delete all users in this org (including owners and members)
    // Rename username to release the name for reuse
    // Clear phone and email to release them for reuse
    await client.query(
      `UPDATE users
       SET deleted_at = NOW(),
           is_active = FALSE,
           username = username || '_deleted_' || $2,
           phone = NULL,
           email = NULL
       WHERE org_id = $1 AND deleted_at IS NULL`,
      [id, timestamp]
    );

    // Soft-delete the organization
    await client.query(
      `UPDATE organizations SET deleted_at = NOW() WHERE id = $1`,
      [id]
    );

    return true;
  });
}

/**
 * Restore a soft-deleted organization
 * Note: Users must be restored individually
 */
export async function restoreOrganization(id: number): Promise<Organization | null> {
  const row = await queryOne<OrganizationRow>(
    `UPDATE organizations
     SET deleted_at = NULL
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return row ? mapOrganizationRow(row) : null;
}

/**
 * Get organization members count (active users only)
 */
export async function getOrganizationMemberCount(orgId: number): Promise<number> {
  const result = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM users WHERE org_id = $1 AND deleted_at IS NULL',
    [orgId]
  );
  return parseInt(result?.count || '0', 10);
}

/**
 * Get owner code info for an organization
 * Returns the code string and usage info
 */
export async function getOwnerCodeInfo(orgId: number): Promise<{
  code: string | null;
  currentUses: number;
  maxUses: number;
  usageDisplay: string;
} | null> {
  const result = await queryOne<{
    code: string;
    current_uses: number;
    max_uses: number;
  }>(
    `SELECT code, current_uses, max_uses FROM invitation_codes
     WHERE org_id = $1 AND type = 'org_owner'
     ORDER BY created_at DESC
     LIMIT 1`,
    [orgId]
  );

  if (!result) return null;

  const usageDisplay = result.max_uses === 0
    ? `${result.current_uses}/∞`
    : `${result.current_uses}/${result.max_uses}`;

  return {
    code: result.code,
    currentUses: result.current_uses,
    maxUses: result.max_uses,
    usageDisplay,
  };
}

/**
 * Check if an organization's owner code has been used (legacy: for backward compat)
 */
export async function isOwnerCodeUsed(orgId: number): Promise<boolean> {
  const result = await queryOne<{ current_uses: number }>(
    `SELECT current_uses FROM invitation_codes
     WHERE org_id = $1 AND type = 'org_owner'
     LIMIT 1`,
    [orgId]
  );
  return result ? result.current_uses > 0 : false;
}

/**
 * Get organization with additional metadata (owner code status, member count)
 */
export async function getOrganizationWithMeta(orgId: number): Promise<{
  organization: Organization;
  ownerCodeUsed: boolean;
  memberCount: number;
} | null> {
  const org = await getOrganizationById(orgId);
  if (!org) return null;

  const ownerCodeUsed = await isOwnerCodeUsed(orgId);
  const memberCount = await getOrganizationMemberCount(orgId);

  return {
    organization: org,
    ownerCodeUsed,
    memberCount,
  };
}

/**
 * Get all organizations with metadata
 * @param options.includeDeleted - If true, include soft-deleted organizations
 */
export async function getAllOrganizationsWithMeta(options?: {
  includeDeleted?: boolean;
}): Promise<Array<{
  organization: Organization;
  ownerCode: string | null;
  ownerCodeUses: string;
  ownerCodeUsed: boolean;
  memberCount: number;
}>> {
  const orgs = await getAllOrganizations(options);

  const orgsWithMeta = await Promise.all(
    orgs.map(async (org) => {
      const ownerCodeInfo = await getOwnerCodeInfo(org.id);
      const memberCount = await getOrganizationMemberCount(org.id);
      return {
        organization: org,
        ownerCode: ownerCodeInfo?.code || null,
        ownerCodeUses: ownerCodeInfo?.usageDisplay || '0/0',
        ownerCodeUsed: ownerCodeInfo ? ownerCodeInfo.currentUses > 0 : false,
        memberCount,
      };
    })
  );

  return orgsWithMeta;
}
