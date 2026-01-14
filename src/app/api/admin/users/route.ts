import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getAllUsersWithOrg } from '@/lib/db/queries/users';
import { UserRole } from '@/types';

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

const VALID_ROLES: UserRole[] = ['super_admin', 'owner', 'member', 'individual'];
const VALID_STATUSES = ['active', 'inactive', 'deleted', 'all'] as const;
type StatusFilter = typeof VALID_STATUSES[number];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const roleParam = searchParams.get('role');
    const statusParam = searchParams.get('status') || 'all';

    // Validate role parameter
    const role: UserRole | undefined = roleParam && VALID_ROLES.includes(roleParam as UserRole)
      ? roleParam as UserRole
      : undefined;

    // Validate status parameter
    const status: StatusFilter = VALID_STATUSES.includes(statusParam as StatusFilter)
      ? statusParam as StatusFilter
      : 'all';

    const users = await getAllUsersWithOrg({
      search,
      role,
      status,
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('[API] GET /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
