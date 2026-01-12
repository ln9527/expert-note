import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createOrganizationWithOwnerCode, getAllOrganizationsWithMeta } from '@/lib/db/queries/organizations';

/**
 * GET /api/admin/organizations - List all organizations with metadata
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orgsWithMeta = await getAllOrganizationsWithMeta();

    // Format for frontend
    const organizations = orgsWithMeta.map((item) => ({
      id: item.organization.id,
      name: item.organization.name,
      description: item.organization.description,
      ownerCodeUsed: item.ownerCodeUsed,
      memberCount: item.memberCount,
      createdAt: item.organization.createdAt,
      updatedAt: item.organization.updatedAt,
    }));

    return NextResponse.json({ success: true, organizations });
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/organizations - Create org with auto-generated owner code
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Organization name required' }, { status: 400 });
    }

    const result = await createOrganizationWithOwnerCode({
      name: name.trim(),
      description: description?.trim(),
      createdBy: user.userId
    });

    return NextResponse.json({
      success: true,
      organization: result.organization,
      ownerCode: result.ownerCode.code // Return just the code string
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create organization:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
