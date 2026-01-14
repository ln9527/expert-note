import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getUserStats } from '@/lib/db/queries/users';

async function requireSuperAdmin() {
  const user = await getSessionUser();
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }
  if (user.role !== 'super_admin') {
    return { error: 'Forbidden - Super Admin access required', status: 403 };
  }
  return { user };
}

export async function GET() {
  try {
    const authResult = await requireSuperAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const stats = await getUserStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[API] GET /api/admin/users/stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
