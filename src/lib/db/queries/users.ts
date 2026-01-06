import { query } from '../connection';
import { User } from '@/types';

interface UserRow {
  id: number;
  username: string;
  display_name: string | null;
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
    `SELECT id, username, display_name, is_active, created_at, last_login_at
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
    `SELECT id, username, display_name, is_active, created_at, last_login_at
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
    `SELECT id, username, display_name, password_hash, is_active, created_at, last_login_at
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
    `SELECT id, username, display_name, is_active, created_at, last_login_at
     FROM users
     ORDER BY id`
  );

  return result.rows.map(rowToUser);
}

/**
 * Create a new user
 * @param username - The username
 * @param passwordHash - The hashed password
 * @param displayName - Optional display name
 * @returns The created user
 */
export async function createUser(
  username: string,
  passwordHash: string,
  displayName?: string
): Promise<User> {
  const result = await query<UserRow>(
    `INSERT INTO users (username, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING id, username, display_name, is_active, created_at, last_login_at`,
    [username, passwordHash, displayName || null]
  );

  return rowToUser(result.rows[0]);
}
