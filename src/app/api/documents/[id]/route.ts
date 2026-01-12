import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, updateDocument, deleteDocument, restoreDocument } from '@/lib/db/queries/documents';
import { getSessionUser } from '@/lib/auth/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const document = await getDocumentById(id);

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // Check view permission
    const isOwner = document.createdBy === user.userId;
    const creatorOrgId = document.creator?.orgId;
    const canView = isOwner ||
                    (document.isShared &&
                     user.orgId &&
                     creatorOrgId &&
                     user.orgId === creatorOrgId);

    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 } // Return 404 to not reveal existence
      );
    }

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('[API] GET /documents/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { filename, content, tagIds, isShared, allowEdit } = body;

    const existing = await getDocumentById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // Check edit permission
    const isOwner = existing.createdBy === user.userId;
    const creatorOrgId = existing.creator?.orgId;
    const canEdit = isOwner ||
                    (existing.isShared &&
                     existing.allowEdit &&
                     user.orgId &&
                     creatorOrgId &&
                     user.orgId === creatorOrgId);

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit this document' },
        { status: 403 }
      );
    }

    // Only owner can change sharing settings
    const updateData: {
      filename?: string;
      content?: string;
      tagIds?: number[];
      isShared?: boolean;
      allowEdit?: boolean;
      updatedBy: number;
    } = {
      filename,
      content,
      tagIds,
      updatedBy: user.userId,
    };

    // Only allow owner to modify sharing settings
    if (isOwner) {
      updateData.isShared = isShared;
      updateData.allowEdit = allowEdit;
    }

    const document = await updateDocument(id, updateData);

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('[API] PUT /documents/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    const existing = await getDocumentById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // Only creator can delete
    if (existing.createdBy !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Only the creator can delete this document' },
        { status: 403 }
      );
    }

    await deleteDocument(id, permanent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /documents/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (body.action === 'restore') {
      // Check if document exists (including deleted documents)
      const existing = await getDocumentById(id);
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }

      // Only creator can restore
      if (existing.createdBy !== user.userId) {
        return NextResponse.json(
          { success: false, error: 'Only the creator can restore this document' },
          { status: 403 }
        );
      }

      const document = await restoreDocument(id);
      if (!document) {
        return NextResponse.json(
          { success: false, error: 'Document not found or not deleted' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, document });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[API] PATCH /documents/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
