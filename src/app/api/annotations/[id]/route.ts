import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { updateAnnotationRefinedComment, deleteAnnotation } from '@/lib/db/queries/knowledge';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/annotations/[id]
 * Update an annotation's refined comment
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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
      return NextResponse.json(
        { success: false, error: 'Annotation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, annotation });
  } catch (error) {
    console.error('[API] PUT /annotations/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/annotations/[id]
 * Delete an annotation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await deleteAnnotation(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /annotations/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
