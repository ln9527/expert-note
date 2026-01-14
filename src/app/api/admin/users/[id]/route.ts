import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { softDeleteUser, getUserById } from '@/lib/db/queries/users';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
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

    // Cannot delete yourself
    if (targetUserId === user.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get target user to check permissions
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions based on role
    if (user.role === 'super_admin') {
      // Super admin can delete any user (except themselves, already checked)
    } else if (user.role === 'owner') {
      // Owner can only delete users in their own org
      if (!user.orgId || !targetUser.orgId || user.orgId !== targetUser.orgId) {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Can only delete users in your organization' },
          { status: 403 }
        );
      }
      // Owner cannot delete other owners
      if (targetUser.role === 'owner') {
        return NextResponse.json(
          { success: false, error: 'Forbidden - Cannot delete other organization owners' },
          { status: 403 }
        );
      }
    } else {
      // Members cannot delete users
      return NextResponse.json(
        { success: false, error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Perform soft delete
    const success = await softDeleteUser(targetUserId);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted',
    });
  } catch (error) {
    console.error('[API] DELETE /api/admin/users/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
