import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getUserById, updatePassword } from '@/lib/db/queries/users';
import bcrypt from 'bcryptjs';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let randomPart = '';
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Temp-${randomPart}!`;
}

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

    // Cannot reset own password this way
    if (targetUserId === currentUser.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot reset your own password using this method' },
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
      // super_admin can reset any user's password
    } else if (currentUser.role === 'owner') {
      // owner can reset passwords for users in their org
      // but not other owners or super_admins
      if (targetUser.role === 'super_admin' || targetUser.role === 'owner') {
        return NextResponse.json(
          { success: false, error: 'Cannot reset password for this user' },
          { status: 403 }
        );
      }
      if (currentUser.orgId !== targetUser.orgId) {
        return NextResponse.json(
          { success: false, error: 'Cannot reset password for users outside your organization' },
          { status: 403 }
        );
      }
    } else {
      // Regular members cannot reset passwords
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Update password
    await updatePassword(targetUserId, hashedPassword);

    return NextResponse.json({
      success: true,
      tempPassword: tempPassword
    });
  } catch (error) {
    console.error('[API] Password reset error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
