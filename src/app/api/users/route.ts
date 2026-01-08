import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { query } from '@/lib/db';
import { User } from '@/types';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query<User>(
      `SELECT id as "userId", username, display_name as "displayName", is_active as "isActive", last_login as "lastLogin", created_at as "createdAt"
       FROM users
       WHERE is_active = TRUE
       ORDER BY display_name, username`,
      []
    );

    return NextResponse.json({ success: true, users: result });
  } catch (error) {
    console.error('[API] GET /users error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
