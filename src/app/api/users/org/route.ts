import { NextResponse, NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getOrgMembers } from '@/lib/db/queries/users';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only owner role can access org members
    if (user.role !== 'owner') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only owners can view organization members' },
        { status: 403 }
      );
    }

    // Check if user has an org_id
    if (!user.orgId) {
      return NextResponse.json(
        { success: false, error: 'User is not associated with an organization' },
        { status: 400 }
      );
    }

    // Get search query parameter
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    // Get org members with optional search filter
    const users = await getOrgMembers(user.orgId, { search });

    return NextResponse.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('[API] get-org-members error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
