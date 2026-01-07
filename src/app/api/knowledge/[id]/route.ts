import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  getKnowledgeEntryById,
  getKnowledgeEntryWithAnnotations,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
  permanentlyDeleteKnowledgeEntry,
  restoreKnowledgeEntry,
} from '@/lib/db/queries/knowledge';
import { getTagByName, createTag } from '@/lib/db/queries/tags';

/**
 * Resolve tag names to tag IDs, creating new tags if needed
 */
async function resolveTagNames(tagNames: string[]): Promise<number[]> {
  const tagIds: number[] = [];

  for (const name of tagNames) {
    const trimmedName = name.trim();
    if (!trimmedName) continue;

    // Try to find existing tag
    let tag = await getTagByName(trimmedName);

    // Create tag if it doesn't exist
    if (!tag) {
      tag = await createTag(trimmedName);
    }

    tagIds.push(tag.id);
  }

  return tagIds;
}

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
 *
 * Accepts either:
 * - tagIds: number[] - direct tag IDs
 * - tags: string[] - tag names (will be resolved to IDs, creating new tags if needed)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { background, tagIds, tags } = body;

    // Check if entry exists
    const existing = await getKnowledgeEntryById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Knowledge entry not found' },
        { status: 404 }
      );
    }

    // Resolve tag names to IDs if provided
    let resolvedTagIds = tagIds;
    if (tags && Array.isArray(tags)) {
      resolvedTagIds = await resolveTagNames(tags);
    }

    // Update the entry
    const entry = await updateKnowledgeEntry(id, {
      background,
      tagIds: resolvedTagIds,
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
 * Delete a knowledge entry (soft delete by default, permanent with ?permanent=true)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    // For permanent delete, check if entry exists (including deleted)
    // For soft delete, check if entry exists and is not deleted
    const existing = await getKnowledgeEntryById(id, permanent);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Knowledge entry not found' },
        { status: 404 }
      );
    }

    if (permanent) {
      await permanentlyDeleteKnowledgeEntry(id);
    } else {
      await deleteKnowledgeEntry(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /knowledge/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/knowledge/[id]
 * Restore a soft-deleted knowledge entry
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'restore') {
      const entry = await restoreKnowledgeEntry(id);
      if (!entry) {
        return NextResponse.json(
          { success: false, error: 'Knowledge entry not found or not deleted' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, entry });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[API] PATCH /knowledge/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
