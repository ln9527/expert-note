import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { updateUserProfile } from '@/lib/db/queries/users';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { displayName } = body;

    // Validate displayName
    if (!displayName || typeof displayName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Display name is required' },
        { status: 400 }
      );
    }

    const trimmedDisplayName = displayName.trim();

    // Validate displayName length
    if (trimmedDisplayName.length < 1 || trimmedDisplayName.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Display name must be between 1 and 100 characters' },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await updateUserProfile(user.userId, trimmedDisplayName);

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('[API] update-profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
