import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  getAllKnowledgeEntries,
  createKnowledgeEntry,
  getKnowledgeEntriesCount,
} from '@/lib/db/queries/knowledge';

/**
 * GET /api/knowledge
 * List all knowledge entries with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const tagsParam = searchParams.get('tags');
    const tagIds = tagsParam ? tagsParam.split(',').map(Number).filter(Boolean) : undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get knowledge entries with org visibility
    const entries = await getAllKnowledgeEntries(String(user.userId), {
      tagIds,
      limit,
      offset,
      orgId: user.orgId,
      role: user.role,
    });

    // Get total count for pagination (also needs org visibility)
    const totalCount = await getKnowledgeEntriesCount(String(user.userId), {
      tagIds,
      orgId: user.orgId,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      entries,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + entries.length < totalCount,
      },
    });
  } catch (error) {
    console.error('[API] GET /knowledge error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge
 * Create a new knowledge entry manually
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceDocumentId, background, tagIds, annotations } = body;

    // Validate required fields
    if (!background || typeof background !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Background is required' },
        { status: 400 }
      );
    }

    if (!annotations || !Array.isArray(annotations) || annotations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one annotation is required' },
        { status: 400 }
      );
    }

    // Validate each annotation
    for (const ann of annotations) {
      if (!ann.level || !['MACRO', 'MESO', 'MICRO'].includes(ann.level.toUpperCase())) {
        return NextResponse.json(
          { success: false, error: 'Each annotation must have a valid level (MACRO, MESO, MICRO)' },
          { status: 400 }
        );
      }
      if (!ann.originalText || typeof ann.originalText !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Each annotation must have originalText' },
          { status: 400 }
        );
      }
      if (!ann.comment || typeof ann.comment !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Each annotation must have a comment' },
          { status: 400 }
        );
      }
    }

    // Create knowledge entry
    const entry = await createKnowledgeEntry({
      sourceDocumentId: sourceDocumentId || undefined,
      background: background.trim(),
      tagIds: tagIds || [],
      annotations: annotations.map((ann: {
        level: string;
        originalText: string;
        comment: string;
        refinedComment?: string;
        positionLine?: number;
        positionChar?: number;
      }) => ({
        level: ann.level.toUpperCase() as 'MACRO' | 'MESO' | 'MICRO',
        originalText: ann.originalText,
        comment: ann.comment,
        refinedComment: ann.refinedComment,
        positionLine: ann.positionLine,
        positionChar: ann.positionChar,
      })),
      createdBy: user.userId,  // SECURITY: Track who created this entry
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /knowledge error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
