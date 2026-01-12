import { query } from '../connection';
import { User, UserRole } from '@/types';

interface UserRow {
  id: number;
  username: string;
  display_name: string | null;
  phone: string | null;
  org_id: number | null;
  role: string;
  is_active: boolean;
  created_at: Date;
  last_login_at: Date | null;
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
    orgId: row.org_id,
    role: (row.role || 'member') as UserRole,
    isActive: row.is_active,
    createdAt: row.created_at,
    lastLogin: row.last_login_at,
  };
}

/**
 * Get user by username (without password hash)
 * @param username - The username to look up
 * @returns User object or null if not found
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await query<UserRow>(
    `SELECT id, username, display_name, phone, org_id, role, is_active, created_at, last_login_at
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
    `SELECT id, username, display_name, phone, org_id, role, is_active, created_at, last_login_at
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
    `SELECT id, username, display_name, phone, org_id, role, password_hash, is_active, created_at, last_login_at
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
    `SELECT id, username, display_name, phone, org_id, role, is_active, created_at, last_login_at
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
    orgId?: number;
    role?: UserRole;
  } = {}
): Promise<User> {
  const { displayName, phone, orgId, role = 'member' } = options;
  const result = await query<UserRow>(
    `INSERT INTO users (username, password_hash, display_name, phone, org_id, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, username, display_name, phone, org_id, role, is_active, created_at, last_login_at`,
    [username, passwordHash, displayName || null, phone || null, orgId || null, role]
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
     RETURNING id, username, display_name, phone, org_id, role, is_active, created_at, last_login_at`,
    [userId, orgId, role]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return rowToUser(result.rows[0]);
}

/**
 * Check if username already exists
 * @param username - The username to check
 * @returns true if username exists
 */
export async function usernameExists(username: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM users WHERE username = $1`,
    [username]
  );
  return parseInt(result.rows[0].count, 10) > 0;
}

/**
 * Check if phone number already exists
 * @param phone - The phone number to check
 * @returns true if phone exists
 */
export async function phoneExists(phone: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM users WHERE phone = $1`,
    [phone]
  );
  return parseInt(result.rows[0].count, 10) > 0;
}
