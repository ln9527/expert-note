import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  getKnowledgeEntryById,
  getKnowledgeEntryWithAnnotations,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
} from '@/lib/db/queries/knowledge';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/knowledge/[id]
 * Get a single knowledge entry with its annotations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check query param for whether to include annotations
    const { searchParams } = new URL(request.url);
    const includeAnnotations = searchParams.get('includeAnnotations') !== 'false';

    let entry;
    if (includeAnnotations) {
      entry = await getKnowledgeEntryWithAnnotations(id);
    } else {
      entry = await getKnowledgeEntryById(id);
    }

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Knowledge entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('[API] GET /knowledge/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/knowledge/[id]
 * Update a knowledge entry
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { background, tagIds } = body;

    // Check if entry exists
    const existing = await getKnowledgeEntryById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Knowledge entry not found' },
        { status: 404 }
      );
    }

    // Update the entry
    const entry = await updateKnowledgeEntry(id, {
      background,
      tagIds,
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('[API] PUT /knowledge/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge/[id]
 * Delete a knowledge entry
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if entry exists
    const existing = await getKnowledgeEntryById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Knowledge entry not found' },
        { status: 404 }
      );
    }

    await deleteKnowledgeEntry(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /knowledge/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
