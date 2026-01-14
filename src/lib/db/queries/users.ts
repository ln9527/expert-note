import { query } from '../connection';
import { User, UserRole, UserWithOrg, UserStats } from '@/types';

interface UserRow {
  id: number;
  username: string;
  display_name: string | null;
  phone: string | null;
  email: string | null;
  org_id: number | null;
  role: string;
  is_active: boolean;
  created_at: Date;
  last_login_at: Date | null;
  deleted_at: Date | null;
}

// Extended user row with organization name for admin views
interface UserWithOrgRow extends UserRow {
  org_name: string | null;
}

interface UserWithPasswordRow extends UserRow {
  password_hash: string;
}

/**
 * Transform database row to User object
 */
function rowToUser(row: UserRow): User {
  return {
    userId: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    phone: row.phone,
    email: row.email,
    orgId: row.org_id,
    role: (row.role || 'member') as UserRole,
    isActive: row.is_active,
    createdAt: row.created_at,
    lastLogin: row.last_login_at,
    deletedAt: row.deleted_at,
  };
}

/**
 * Transform database row to UserWithOrg object (includes organization name)
 */
function rowToUserWithOrg(row: UserWithOrgRow): UserWithOrg {
  return {
    ...rowToUser(row),
    orgName: row.org_name,
  };
}

/**
 * Get user by username (without password hash)
 * @param username - The username to look up
 * @returns User object or null if not found
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await query<UserRow>(
    `SELECT id, username, display_name, phone, email, org_id, role, is_active, created_at, last_login_at, deleted_at
     FROM users
     WHERE username = $1`,
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return rowToUser(result.rows[0]);
}

/**
 * Get user by ID
 * @param id - The user ID
 * @returns User object or null if not found
 */
export async function getUserById(id: number): Promise<User | null> {
  const result = await query<UserRow>(
    `SELECT id, username, display_name, phone, email, org_id, role, is_active, created_at, last_login_at, deleted_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return rowToUser(result.rows[0]);
}

/**
 * Get user with password hash for authentication
 * @param username - The username to look up
 * @returns User and password hash, or null if not found
 */
export async function getUserWithPasswordHash(
  username: string
): Promise<{ user: User; passwordHash: string } | null> {
  const result = await query<UserWithPasswordRow>(
    `SELECT id, username, display_name, phone, email, org_id, role, password_hash, is_active, created_at, last_login_at, deleted_at
     FROM users
     WHERE username = $1`,
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    user: rowToUser(row),
    passwordHash: row.password_hash,
  };
}

/**
 * Update user's last login timestamp
 * @param userId - The user ID
 */
export async function updateLastLogin(userId: number): Promise<void> {
  await query(
    `UPDATE users
     SET last_login_at = NOW()
     WHERE id = $1`,
    [userId]
  );
}

/**
 * Get all users (for admin purposes)
 * @returns Array of all users
 */
export async function getAllUsers(): Promise<User[]> {
  const result = await query<UserRow>(
    `SELECT id, username, display_name, phone, email, org_id, role, is_active, created_at, last_login_at, deleted_at
     FROM users
     ORDER BY id`
  );

  return result.rows.map(rowToUser);
}

/**
 * Create a new user
 * @param username - The username
 * @param passwordHash - The hashed password
 * @param options - Optional parameters
 * @returns The created user
 */
export async function createUser(
  username: string,
  passwordHash: string,
  options: {
    displayName?: string;
    phone?: string;
    email?: string;
    orgId?: number;
    role?: UserRole;
  } = {}
): Promise<User> {
  const { displayName, phone, email, orgId, role = 'member' } = options;
  const result = await query<UserRow>(
    `INSERT INTO users (username, password_hash, display_name, phone, email, org_id, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, username, display_name, phone, email, org_id, role, is_active, created_at, last_login_at, deleted_at`,
    [username, passwordHash, displayName || null, phone || null, email || null, orgId || null, role]
  );

  return rowToUser(result.rows[0]);
}

/**
 * Update user's organization and role
 * @param userId - The user ID
 * @param orgId - The organization ID (null for individual users)
 * @param role - The user's role
 */
export async function updateUserOrgAndRole(
  userId: number,
  orgId: number | null,
  role: UserRole
): Promise<User | null> {
  const result = await query<UserRow>(
    `UPDATE users
     SET org_id = $2, role = $3
     WHERE id = $1
     RETURNING id, username, display_name, phone, email, org_id, role, is_active, created_at, last_login_at, deleted_at`,
    [userId, orgId, role]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return rowToUser(result.rows[0]);
}

/**
 * Check if username already exists (excluding soft-deleted users)
 * @param username - The username to check
 * @returns true if username exists for an active user
 */
export async function usernameExists(username: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM users WHERE username = $1 AND deleted_at IS NULL`,
    [username]
  );
  return parseInt(result.rows[0].count, 10) > 0;
}

/**
 * Check if phone number already exists (excluding soft-deleted users)
 * @param phone - The phone number to check
 * @returns true if phone exists for an active user
 */
export async function phoneExists(phone: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM users WHERE phone = $1 AND deleted_at IS NULL`,
    [phone]
  );
  return parseInt(result.rows[0].count, 10) > 0;
}

/**
 * Check if email already exists (excluding soft-deleted users)
 * @param email - The email to check
 * @returns true if email exists for an active user
 */
export async function emailExists(email: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  );
  return parseInt(result.rows[0].count, 10) > 0;
}

// ============================================================================
// USER MANAGEMENT FUNCTIONS (Admin/Owner)
// ============================================================================

/**
 * Get all users with organization names (for super_admin)
 * Includes all users: active, inactive, and soft-deleted
 * @param options - Filter options
 * @returns Array of users with organization names
 */
export async function getAllUsersWithOrg(options?: {
  search?: string;
  role?: UserRole;
  status?: 'active' | 'inactive' | 'deleted' | 'all';
}): Promise<UserWithOrg[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Search filter (username or display_name)
  if (options?.search) {
    conditions.push(`(u.username ILIKE $${paramIndex} OR u.display_name ILIKE $${paramIndex})`);
    params.push(`%${options.search}%`);
    paramIndex++;
  }

  // Role filter
  if (options?.role) {
    conditions.push(`u.role = $${paramIndex}`);
    params.push(options.role);
    paramIndex++;
  }

  // Status filter
  if (options?.status && options.status !== 'all') {
    if (options.status === 'active') {
      conditions.push('u.is_active = TRUE AND u.deleted_at IS NULL');
    } else if (options.status === 'inactive') {
      conditions.push('u.is_active = FALSE AND u.deleted_at IS NULL');
    } else if (options.status === 'deleted') {
      conditions.push('u.deleted_at IS NOT NULL');
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query<UserWithOrgRow>(
    `SELECT u.id, u.username, u.display_name, u.phone, u.email, u.org_id, u.role,
            u.is_active, u.created_at, u.last_login_at, u.deleted_at,
            o.name as org_name
     FROM users u
     LEFT JOIN organizations o ON u.org_id = o.id
     ${whereClause}
     ORDER BY u.created_at DESC`,
    params
  );

  return result.rows.map(rowToUserWithOrg);
}

/**
 * Get users in a specific organization (for org owner)
 * @param orgId - The organization ID
 * @param options - Filter options
 * @returns Array of users in the organization
 */
export async function getOrgMembers(
  orgId: number,
  options?: {
    search?: string;
    includeDeleted?: boolean;
  }
): Promise<User[]> {
  const conditions: string[] = ['u.org_id = $1'];
  const params: unknown[] = [orgId];
  let paramIndex = 2;

  // Search filter
  if (options?.search) {
    conditions.push(`(u.username ILIKE $${paramIndex} OR u.display_name ILIKE $${paramIndex})`);
    params.push(`%${options.search}%`);
    paramIndex++;
  }

  // Exclude deleted by default
  if (!options?.includeDeleted) {
    conditions.push('u.deleted_at IS NULL');
  }

  const result = await query<UserRow>(
    `SELECT u.id, u.username, u.display_name, u.phone, u.email, u.org_id, u.role,
            u.is_active, u.created_at, u.last_login_at, u.deleted_at
     FROM users u
     WHERE ${conditions.join(' AND ')}
     ORDER BY u.role DESC, u.display_name ASC`,
    params
  );

  return result.rows.map(rowToUser);
}

/**
 * Get user statistics for admin dashboard
 * @returns Statistics about users and organizations
 */
export async function getUserStats(): Promise<UserStats> {
  // Get total organizations
  const orgResult = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM organizations'
  );

  // Get user counts by status and role
  const userResult = await query<{
    total: string;
    active: string;
    deleted: string;
    super_admin: string;
    owner: string;
    member: string;
    individual: string;
  }>(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE is_active = TRUE AND deleted_at IS NULL) as active,
       COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted,
       COUNT(*) FILTER (WHERE role = 'super_admin' AND deleted_at IS NULL) as super_admin,
       COUNT(*) FILTER (WHERE role = 'owner' AND deleted_at IS NULL) as owner,
       COUNT(*) FILTER (WHERE role = 'member' AND deleted_at IS NULL) as member,
       COUNT(*) FILTER (WHERE role = 'individual' AND deleted_at IS NULL) as individual
     FROM users`
  );

  const stats = userResult.rows[0];
  return {
    totalOrgs: parseInt(orgResult.rows[0].count, 10),
    totalUsers: parseInt(stats.total, 10),
    activeUsers: parseInt(stats.active, 10),
    deletedUsers: parseInt(stats.deleted, 10),
    byRole: {
      super_admin: parseInt(stats.super_admin, 10),
      owner: parseInt(stats.owner, 10),
      member: parseInt(stats.member, 10),
      individual: parseInt(stats.individual, 10),
    },
  };
}

/**
 * Update user's password
 * @param userId - The user ID
 * @param newPasswordHash - The new hashed password
 */
export async function updatePassword(
  userId: number,
  newPasswordHash: string
): Promise<boolean> {
  const result = await query(
    `UPDATE users
     SET password_hash = $2
     WHERE id = $1 AND deleted_at IS NULL`,
    [userId, newPasswordHash]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Enable or disable a user
 * @param userId - The user ID
 * @param isActive - Whether the user should be active
 * @returns The updated user or null if not found
 */
export async function setUserActive(
  userId: number,
  isActive: boolean
): Promise<User | null> {
  const result = await query<UserRow>(
    `UPDATE users
     SET is_active = $2
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, username, display_name, phone, email, org_id, role, is_active, created_at, last_login_at, deleted_at`,
    [userId, isActive]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return rowToUser(result.rows[0]);
}

/**
 * Soft delete a user (set deleted_at timestamp)
 * - Renames username to `{username}_deleted_{timestamp}` to release the name
 * - Clears phone and email to release them for reuse
 * @param userId - The user ID
 * @returns true if user was deleted
 */
export async function softDeleteUser(userId: number): Promise<boolean> {
  const timestamp = Date.now();
  const result = await query(
    `UPDATE users
     SET deleted_at = NOW(),
         is_active = FALSE,
         username = username || '_deleted_' || $2,
         phone = NULL,
         email = NULL
     WHERE id = $1 AND deleted_at IS NULL`,
    [userId, timestamp]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Restore a soft-deleted user
 * @param userId - The user ID
 * @returns The restored user or null if not found
 */
export async function restoreUser(userId: number): Promise<User | null> {
  const result = await query<UserRow>(
    `UPDATE users
     SET deleted_at = NULL, is_active = TRUE
     WHERE id = $1 AND deleted_at IS NOT NULL
     RETURNING id, username, display_name, phone, email, org_id, role, is_active, created_at, last_login_at, deleted_at`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return rowToUser(result.rows[0]);
}

/**
 * Update user profile (display name)
 * @param userId - The user ID
 * @param displayName - The new display name
 * @returns The updated user or null if not found
 */
export async function updateUserProfile(
  userId: number,
  displayName: string
): Promise<User | null> {
  const result = await query<UserRow>(
    `UPDATE users
     SET display_name = $2
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, username, display_name, phone, email, org_id, role, is_active, created_at, last_login_at, deleted_at`,
    [userId, displayName]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return rowToUser(result.rows[0]);
}

/**
 * Get password hash for a user by ID (for password change verification)
 * @param userId - The user ID
 * @returns The password hash or null if not found
 */
export async function getPasswordHashById(userId: number): Promise<string | null> {
  const result = await query<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].password_hash;
}
