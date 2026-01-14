/**
 * Admin Invitation Codes API
 *
 * Only accessible by super_admin users.
 * Manages creation and listing of invitation codes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  getAllInvitationCodes,
  createInvitationCode,
  deleteInvitationCode,
} from '@/lib/db/queries/invitationCodes';
import { getAllOrganizations } from '@/lib/db/queries/organizations';
import { InvitationCodeType } from '@/types';

/**
 * Check if user is super_admin
 */
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

/**
 * GET /api/admin/invitation-codes
 * List all invitation codes (super_admin only)
 */
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
    const includeUsed = searchParams.get('includeUsed') !== 'false';
    const type = searchParams.get('type') as InvitationCodeType | null;

    const codes = await getAllInvitationCodes({
      includeUsed,
      type: type || undefined,
    });

    // Also get organizations for reference
    const organizations = await getAllOrganizations();

    return NextResponse.json({
      success: true,
      codes,
      organizations,
    });
  } catch (error) {
    console.error('[API] GET /admin/invitation-codes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/invitation-codes
 * Create a new invitation code (super_admin only)
 *
 * Request body:
 * {
 *   type: 'individual' | 'org_owner' | 'org_member',
 *   orgId?: number,    // Required for org_owner/org_member
 *   maxUses?: number,  // How many times the code can be used (0 = unlimited, default 1)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { type, orgId, maxUses = 1 } = body;

    // Validate type
    if (!type || !['individual', 'org_owner', 'org_member'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid code type. Must be: individual, org_owner, or org_member' },
        { status: 400 }
      );
    }

    // Validate maxUses
    if (typeof maxUses !== 'number' || maxUses < 0 || !Number.isInteger(maxUses)) {
      return NextResponse.json(
        { success: false, error: 'maxUses must be a non-negative integer (0 for unlimited)' },
        { status: 400 }
      );
    }

    // Validate type-specific requirements
    if ((type === 'org_owner' || type === 'org_member') && !orgId) {
      return NextResponse.json(
        { success: false, error: `${type} codes require an organization ID` },
        { status: 400 }
      );
    }

    const code = await createInvitationCode({
      type: type as InvitationCodeType,
      orgId: (type === 'org_member' || type === 'org_owner') ? orgId : undefined,
      createdBy: authResult.user.userId,
      maxUses,
    });

    return NextResponse.json({
      success: true,
      code,
      message: `Invitation code created: ${code.code}`,
    }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /admin/invitation-codes error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/invitation-codes
 * Delete an unused invitation code (super_admin only)
 *
 * Query params:
 *   id: number - The code ID to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin();
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');

    if (!idStr) {
      return NextResponse.json(
        { success: false, error: 'Code ID is required' },
        { status: 400 }
      );
    }

    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid code ID' },
        { status: 400 }
      );
    }

    await deleteInvitationCode(id);

    return NextResponse.json({
      success: true,
      message: 'Invitation code deleted',
    });
  } catch (error) {
    console.error('[API] DELETE /admin/invitation-codes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
