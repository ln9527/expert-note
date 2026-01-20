import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  updateAnnotationRefinedComment,
  deleteAnnotation,
  getAnnotationWithContext,
  AnnotationWithContext,
} from '@/lib/db/queries/knowledge';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Check if user can modify an annotation
 *
 * Permission rules:
 * - super_admin: Can modify any annotation
 * - Knowledge entry creator: Can modify annotations on their entries
 * - Document owner: Can modify annotations on entries from their documents
 * - Same org owner: Can modify if knowledge is shared and allowEdit is true
 */
function canModifyAnnotation(
  user: { userId: number; orgId: number | null; role: string },
  context: AnnotationWithContext
): boolean {
  // Super admin can modify anything
  if (user.role === 'super_admin') {
    return true;
  }

  // Knowledge entry creator can modify
  if (context.knowledgeCreatedBy === user.userId) {
    return true;
  }

  // Document owner can modify annotations on entries from their documents
  if (context.documentCreatedBy === user.userId) {
    return true;
  }

  // Org owner can modify shared entries with allowEdit from same org
  if (
    user.role === 'owner' &&
    context.knowledgeIsShared &&
    context.knowledgeAllowEdit &&
    user.orgId &&
    context.knowledgeCreatorOrgId === user.orgId
  ) {
    return true;
  }

  return false;
}

/**
 * PUT /api/annotations/[id]
 * Update an annotation's refined comment
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get annotation with ownership context
    const context = await getAnnotationWithContext(id);
    if (!context) {
      return NextResponse.json({ success: false, error: 'Annotation not found' }, { status: 404 });
    }

    // Check permission
    if (!canModifyAnnotation(user, context)) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to modify this annotation' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { refinedComment } = body;

    if (typeof refinedComment !== 'string') {
      return NextResponse.json(
        { success: false, error: 'refinedComment is required' },
        { status: 400 }
      );
    }

    const annotation = await updateAnnotationRefinedComment(id, refinedComment);

    if (!annotation) {
      return NextResponse.json({ success: false, error: 'Annotation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, annotation });
  } catch (error) {
    console.error('[API] PUT /annotations/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/annotations/[id]
 * Delete an annotation
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get annotation with ownership context
    const context = await getAnnotationWithContext(id);
    if (!context) {
      return NextResponse.json({ success: false, error: 'Annotation not found' }, { status: 404 });
    }

    // Check permission
    if (!canModifyAnnotation(user, context)) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this annotation' },
        { status: 403 }
      );
    }

    await deleteAnnotation(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /annotations/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
