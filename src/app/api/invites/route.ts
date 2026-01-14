import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  createInvitationCode,
  getInvitationCodesByOrg,
  deleteInvitationCode
} from '@/lib/db/queries/invitationCodes';

// GET /api/invites - List codes for owner's org
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners can access
    if (user.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Owner access required' }, { status: 403 });
    }

    // Validate org_id exists and is a valid number
    if (user.orgId === null || user.orgId === undefined) {
      return NextResponse.json({ success: false, error: 'No organization assigned' }, { status: 400 });
    }

    // Get codes for this org only using the efficient query
    const { searchParams } = new URL(request.url);
    const includeUsed = searchParams.get('includeUsed') !== 'false';

    // Use the org-specific query for better efficiency
    const orgCodes = await getInvitationCodesByOrg(user.orgId, { includeUsed });

    return NextResponse.json({ success: true, codes: orgCodes });
  } catch (error) {
    console.error('Failed to fetch invitation codes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// POST /api/invites - Create member code for owner's org
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Owner access required' }, { status: 403 });
    }

    // Validate org_id exists and is a valid number
    if (user.orgId === null || user.orgId === undefined) {
      return NextResponse.json({ success: false, error: 'No organization assigned' }, { status: 400 });
    }

    // Parse optional body for maxUses
    let maxUses = 1; // Default to single-use
    try {
      const body = await request.json();
      if (body.maxUses !== undefined) {
        maxUses = parseInt(body.maxUses, 10);
        if (isNaN(maxUses) || maxUses < 0) {
          return NextResponse.json({ success: false, error: 'maxUses must be a non-negative integer' }, { status: 400 });
        }
      }
    } catch {
      // No body or invalid JSON is fine, use default maxUses
    }

    // Create org_member code for owner's org
    const code = await createInvitationCode({
      type: 'org_member',
      orgId: user.orgId,
      createdBy: user.userId,
      maxUses,
    });

    return NextResponse.json({
      success: true,
      code,
      message: `Member code created: ${code.code}`
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create invitation code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/invites?id=X - Delete unused code
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Owner access required' }, { status: 403 });
    }

    // Validate org_id exists and is a valid number
    if (user.orgId === null || user.orgId === undefined) {
      return NextResponse.json({ success: false, error: 'No organization assigned' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');
    if (!idStr) {
      return NextResponse.json({ success: false, error: 'Code ID required' }, { status: 400 });
    }

    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid code ID' }, { status: 400 });
    }

    // Verify code belongs to owner's org before deleting
    // Use the efficient org-specific query
    const orgCodes = await getInvitationCodesByOrg(user.orgId, { includeUsed: true });
    const code = orgCodes.find(c => c.id === id);

    if (!code) {
      return NextResponse.json({ success: false, error: 'Code not found' }, { status: 404 });
    }

    // Additional safety check: don't delete codes that have been used
    if (code.currentUses > 0) {
      return NextResponse.json({ success: false, error: 'Cannot delete a code that has been used' }, { status: 400 });
    }

    await deleteInvitationCode(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete invitation code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
