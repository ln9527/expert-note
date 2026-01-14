// Tag update and delete API routes
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getTagById, updateTag, deleteTag, canDeleteTag } from '@/lib/db/queries/tags';

// GET /api/tags/[id] - Get a single tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const tagId = parseInt(id, 10);
    if (isNaN(tagId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tag ID' },
        { status: 400 }
      );
    }

    const tag = await getTagById(tagId);
    if (!tag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, tag });
  } catch (error) {
    console.error('Error fetching tag:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tag' },
      { status: 500 }
    );
  }
}

// PUT /api/tags/[id] - Update a tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const tagId = parseInt(id, 10);
    if (isNaN(tagId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tag ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, color } = body;

    // Validate at least one field to update
    if (!name && !color) {
      return NextResponse.json(
        { success: false, error: 'At least one field (name or color) is required' },
        { status: 400 }
      );
    }

    const updateData: { name?: string; color?: string } = {};
    if (name) updateData.name = name.trim();
    if (color) updateData.color = color;

    const updatedTag = await updateTag(tagId, updateData);
    if (!updatedTag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, tag: updatedTag });
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

// DELETE /api/tags/[id] - Delete a tag (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const tagId = parseInt(id, 10);
    if (isNaN(tagId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tag ID' },
        { status: 400 }
      );
    }

    // Check if tag exists
    const existingTag = await getTagById(tagId);
    if (!existingTag) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this tag
    const canDelete = await canDeleteTag(tagId, session.userId, session.role);
    if (!canDelete) {
      // Determine appropriate error message
      if (existingTag.createdBy === null) {
        return NextResponse.json(
          { success: false, error: 'Global tags can only be deleted by administrators' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'You can only delete tags you created' },
        { status: 403 }
      );
    }

    // Soft delete the tag
    await deleteTag(tagId);

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
