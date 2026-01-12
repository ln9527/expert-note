/**
 * Invitation Code database queries
 *
 * Handles CRUD operations for invitation codes.
 *
 * Code Types:
 * - 'individual': Creates a standalone user with no org
 * - 'org_owner': Joins existing organization as owner
 * - 'org_member': Joins existing organization as member
 */

import { query, queryOne, transaction } from '../index';
import { InvitationCode, InvitationCodeType, Organization } from '@/types';
import { PoolClient } from 'pg';
import { createOrganization } from './organizations';

interface InvitationCodeRow {
  id: number;
  code: string;
  type: string;
  org_id: number | null;
  created_by: number | null;
  used_by: number | null;
  used_at: Date | null;
  created_at: Date;
}

function mapInvitationCodeRow(row: InvitationCodeRow): InvitationCode {
  return {
    id: row.id,
    code: row.code,
    type: row.type as InvitationCodeType,
    orgId: row.org_id,
    createdBy: row.created_by,
    usedBy: row.used_by,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
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
 * Get invitation code by code string
 */
export async function getInvitationCodeByCode(code: string): Promise<InvitationCode | null> {
  const row = await queryOne<InvitationCodeRow>(
    'SELECT * FROM invitation_codes WHERE code = $1',
    [code.toUpperCase()]
  );
  return row ? mapInvitationCodeRow(row) : null;
}

/**
 * Validate an invitation code
 * Returns the code if valid and unused, null otherwise
 */
export async function validateInvitationCode(code: string): Promise<{
  valid: boolean;
  code?: InvitationCode;
  error?: string;
}> {
  const inviteCode = await getInvitationCodeByCode(code);

  if (!inviteCode) {
    return { valid: false, error: 'Invalid invitation code' };
  }

  if (inviteCode.usedBy !== null) {
    return { valid: false, error: 'Invitation code has already been used' };
  }

  return { valid: true, code: inviteCode };
}

/**
 * Create a new invitation code
 * Only super_admin can create codes
 */
export async function createInvitationCode(data: {
  type: InvitationCodeType;
  orgId?: number;      // Required for 'org_member' and 'org_owner' types
  createdBy: number;   // Must be super_admin
}): Promise<InvitationCode> {
  const { type, orgId, createdBy } = data;

  // Validate type-specific requirements
  if (type === 'org_member' && !orgId) {
    throw new Error('org_member codes require an organization ID');
  }

  if (type === 'org_owner' && !orgId) {
    throw new Error('org_owner codes require an organization ID');
  }

  const code = generateCode();

  const row = await queryOne<InvitationCodeRow>(
    `INSERT INTO invitation_codes (code, type, org_id, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [code, type, orgId || null, createdBy]
  );

  return mapInvitationCodeRow(row!);
}

/**
 * Use an invitation code during registration
 * Returns the organization ID if applicable
 */
export async function useInvitationCode(
  code: string,
  userId: number
): Promise<{ orgId: number | null; role: 'owner' | 'member' | 'individual' }> {
  return transaction(async (client: PoolClient) => {
    // Get and validate the code
    const result = await client.query<InvitationCodeRow>(
      'SELECT * FROM invitation_codes WHERE code = $1 FOR UPDATE',
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid invitation code');
    }

    const inviteCode = result.rows[0];

    if (inviteCode.used_by !== null) {
      throw new Error('Invitation code has already been used');
    }

    let orgId: number | null = null;
    let role: 'owner' | 'member' | 'individual' = 'individual';

    switch (inviteCode.type) {
      case 'individual':
        // No org, individual user
        orgId = null;
        role = 'individual';
        break;

      case 'org_owner':
        // Join existing organization as owner
        orgId = inviteCode.org_id;
        role = 'owner';
        break;

      case 'org_member':
        // Join existing organization as member
        orgId = inviteCode.org_id;
        role = 'member';
        break;
    }

    // Mark code as used
    await client.query(
      `UPDATE invitation_codes SET used_by = $1, used_at = NOW() WHERE id = $2`,
      [userId, inviteCode.id]
    );

    return { orgId, role };
  });
}

/**
 * Get all invitation codes (for admin)
 */
export async function getAllInvitationCodes(options: {
  includeUsed?: boolean;
  type?: InvitationCodeType;
} = {}): Promise<InvitationCode[]> {
  const { includeUsed = true, type } = options;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (!includeUsed) {
    conditions.push('used_by IS NULL');
  }

  if (type) {
    conditions.push(`type = $${paramIndex++}`);
    params.push(type);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const rows = await query<InvitationCodeRow>(
    `SELECT * FROM invitation_codes ${whereClause} ORDER BY created_at DESC`,
    params
  );

  return rows.map(mapInvitationCodeRow);
}

/**
 * Delete an unused invitation code
 */
export async function deleteInvitationCode(id: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM invitation_codes WHERE id = $1 AND used_by IS NULL',
    [id]
  );
  return true;
}

/**
 * Get codes created by a specific user
 */
export async function getInvitationCodesByCreator(createdBy: number): Promise<InvitationCode[]> {
  const rows = await query<InvitationCodeRow>(
    'SELECT * FROM invitation_codes WHERE created_by = $1 ORDER BY created_at DESC',
    [createdBy]
  );
  return rows.map(mapInvitationCodeRow);
}

/**
 * Get invitation codes for a specific organization
 * This is more efficient than getAllInvitationCodes + filter
 */
export async function getInvitationCodesByOrg(
  orgId: number,
  options: { includeUsed?: boolean } = {}
): Promise<InvitationCode[]> {
  const { includeUsed = true } = options;

  const conditions: string[] = ['org_id = $1'];
  const params: unknown[] = [orgId];

  if (!includeUsed) {
    conditions.push('used_by IS NULL');
  }

  const whereClause = 'WHERE ' + conditions.join(' AND ');

  const rows = await query<InvitationCodeRow>(
    `SELECT * FROM invitation_codes ${whereClause} ORDER BY created_at DESC`,
    params
  );

  return rows.map(mapInvitationCodeRow);
}
