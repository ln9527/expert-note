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
  created_at: Date;
  updated_at: Date;
}

function mapOrganizationRow(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
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
 */
export async function getAllOrganizations(): Promise<Organization[]> {
  const rows = await query<OrganizationRow>(
    'SELECT * FROM organizations ORDER BY name'
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
       RETURNING id, name, description, created_at, updated_at`,
      [name, description || null]
    );
    const org = mapOrganizationRow(orgResult.rows[0]);

    // Generate code
    const code = generateCode();

    // Create org_owner invitation code
    const codeResult = await client.query<{
      id: number;
      code: string;
      type: string;
      org_id: number | null;
      created_by: number | null;
      used_by: number | null;
      used_at: Date | null;
      created_at: Date;
    }>(
      `INSERT INTO invitation_codes (code, type, org_id, created_by)
       VALUES ($1, 'org_owner', $2, $3)
       RETURNING id, code, type, org_id, created_by, used_by, used_at, created_at`,
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
 * Delete organization (only if no users belong to it)
 */
export async function deleteOrganization(id: number): Promise<boolean> {
  // Check if any users belong to this org
  const userCount = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM users WHERE org_id = $1',
    [id]
  );

  if (userCount && parseInt(userCount.count) > 0) {
    throw new Error('Cannot delete organization with active users');
  }

  await query('DELETE FROM organizations WHERE id = $1', [id]);
  return true;
}

/**
 * Get organization members count
 */
export async function getOrganizationMemberCount(orgId: number): Promise<number> {
  const result = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM users WHERE org_id = $1',
    [orgId]
  );
  return parseInt(result?.count || '0', 10);
}

/**
 * Check if an organization's owner code has been used
 */
export async function isOwnerCodeUsed(orgId: number): Promise<boolean> {
  const result = await queryOne<{ used_by: number | null }>(
    `SELECT used_by FROM invitation_codes
     WHERE org_id = $1 AND type = 'org_owner'
     LIMIT 1`,
    [orgId]
  );
  return result ? result.used_by !== null : false;
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
 */
export async function getAllOrganizationsWithMeta(): Promise<Array<{
  organization: Organization;
  ownerCodeUsed: boolean;
  memberCount: number;
}>> {
  const orgs = await getAllOrganizations();

  const orgsWithMeta = await Promise.all(
    orgs.map(async (org) => {
      const ownerCodeUsed = await isOwnerCodeUsed(org.id);
      const memberCount = await getOrganizationMemberCount(org.id);
      return {
        organization: org,
        ownerCodeUsed,
        memberCount,
      };
    })
  );

  return orgsWithMeta;
}
