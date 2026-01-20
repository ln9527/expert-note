import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { query } from '@/lib/db';
import { User } from '@/types';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, orgId, role } = user;

    let sql = `
      SELECT id as "userId", username, display_name as "displayName",
             is_active as "isActive", last_login_at as "lastLogin", created_at as "createdAt"
      FROM users
      WHERE is_active = TRUE AND deleted_at IS NULL`;
    const params: (string | number)[] = [];

    if (role === 'super_admin') {
      // Super admin can see all users - no additional filter
    } else if ((role === 'owner' || role === 'member') && orgId) {
      // Org users can only see users in their organization
      sql += ` AND org_id = $1`;
      params.push(orgId);
    } else {
      // Individual users can only see themselves
      sql += ` AND id = $1`;
      params.push(userId);
    }

    sql += ` ORDER BY display_name, username`;

    const result = await query<User>(sql, params);

    return NextResponse.json({ success: true, users: result });
  } catch (error) {
    console.error('[API] GET /users error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
