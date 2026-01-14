import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  createOrganizationWithOwnerCode,
  getAllOrganizationsWithMeta,
  softDeleteOrganization,
  restoreOrganization
} from '@/lib/db/queries/organizations';

/**
 * GET /api/admin/organizations - List all organizations with metadata
 * Query params: includeDeleted=true to include soft-deleted orgs
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const orgsWithMeta = await getAllOrganizationsWithMeta({ includeDeleted });

    // Format for frontend - include owner code and usage info
    const organizations = orgsWithMeta.map((item) => ({
      id: item.organization.id,
      name: item.organization.name,
      description: item.organization.description,
      ownerCode: item.ownerCode,
      ownerCodeUses: item.ownerCodeUses,
      ownerCodeUsed: item.ownerCodeUsed,
      memberCount: item.memberCount,
      deletedAt: item.organization.deletedAt,
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

/**
 * DELETE /api/admin/organizations?id=123 - Soft delete an organization
 * This also soft-deletes all users in the organization
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    await softDeleteOrganization(parseInt(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete organization:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/organizations - Restore a soft-deleted organization
 * Body: { id: number, action: 'restore' }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, action } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    if (action === 'restore') {
      const restored = await restoreOrganization(id);
      if (!restored) {
        return NextResponse.json({ error: 'Organization not found or not deleted' }, { status: 404 });
      }
      return NextResponse.json({ success: true, organization: restored });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update organization:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
