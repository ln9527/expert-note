import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getUserById, setUserActive } from '@/lib/db/queries/users';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const targetUserId = parseInt(id, 10);
    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    // Cannot toggle own status
    if (targetUserId === currentUser.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own status' },
        { status: 403 }
      );
    }

    // Get target user
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Permission checks
    if (currentUser.role === 'super_admin') {
      // super_admin can toggle any user (except themselves, checked above)
    } else if (currentUser.role === 'owner') {
      // owner can toggle users in their org
      // except themselves, other owners, and super_admins
      if (targetUser.role === 'super_admin' || targetUser.role === 'owner') {
        return NextResponse.json(
          { success: false, error: 'Cannot change status for this user' },
          { status: 403 }
        );
      }
      if (currentUser.orgId !== targetUser.orgId) {
        return NextResponse.json(
          { success: false, error: 'Cannot change status for users outside your organization' },
          { status: 403 }
        );
      }
    } else {
      // Regular members cannot toggle user status
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update user status
    const updatedUser = await setUserActive(targetUserId, body.isActive);

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('[API] Status toggle error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
