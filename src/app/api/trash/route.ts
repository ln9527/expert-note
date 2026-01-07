import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getDeletedDocuments, deleteDocument } from '@/lib/db/queries/documents';
import { getDeletedPrompts, permanentlyDeletePrompt } from '@/lib/db/queries/prompts';
import { getDeletedKnowledgeEntries, permanentlyDeleteKnowledgeEntry } from '@/lib/db/queries/knowledge';

export interface TrashItem {
  id: string;
  type: 'document' | 'prompt' | 'knowledge';
  name: string;
  deletedAt: Date | null;
}

/**
 * GET /api/trash
 * Get all soft-deleted items (documents, prompts, knowledge entries)
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all deleted items in parallel
    const [documents, prompts, knowledge] = await Promise.all([
      getDeletedDocuments(),
      getDeletedPrompts(String(user.userId)),
      getDeletedKnowledgeEntries(),
    ]);

    // Transform to unified TrashItem format
    const items: TrashItem[] = [
      ...documents.map(d => ({
        id: d.id,
        type: 'document' as const,
        name: d.filename,
        deletedAt: d.deletedAt,
      })),
      ...prompts.map(p => ({
        id: p.id,
        type: 'prompt' as const,
        name: p.title,
        deletedAt: p.updatedAt, // Prompts use updatedAt when deleted
      })),
      ...knowledge.map(k => ({
        id: k.id,
        type: 'knowledge' as const,
        name: k.background?.slice(0, 50) || `Knowledge #${k.id.slice(0, 8)}`,
        deletedAt: k.updatedAt, // Knowledge uses updatedAt when deleted
      })),
    ];

    // Sort by deletion date (newest first)
    items.sort((a, b) => {
      const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      items,
      counts: {
        documents: documents.length,
        prompts: prompts.length,
        knowledge: knowledge.length,
        total: items.length,
      },
    });
  } catch (error) {
    console.error('[API] GET /trash error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trash
 * Delete specific item permanently or empty entire trash
 * Query params:
 *   - type: 'document' | 'prompt' | 'knowledge' (optional, for specific item)
 *   - id: string (optional, for specific item)
 *   - If no params, empties entire trash
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'document' | 'prompt' | 'knowledge' | null;
    const id = searchParams.get('id');

    // Delete specific item
    if (type && id) {
      switch (type) {
        case 'document':
          await deleteDocument(id, true); // permanent = true
          break;
        case 'prompt':
          await permanentlyDeletePrompt(id);
          break;
        case 'knowledge':
          await permanentlyDeleteKnowledgeEntry(id);
          break;
        default:
          return NextResponse.json(
            { success: false, error: 'Invalid type' },
            { status: 400 }
          );
      }
      return NextResponse.json({ success: true });
    }

    // Empty entire trash
    const [documents, prompts, knowledge] = await Promise.all([
      getDeletedDocuments(),
      getDeletedPrompts(String(user.userId)),
      getDeletedKnowledgeEntries(),
    ]);

    // Delete all items in parallel
    await Promise.all([
      ...documents.map(d => deleteDocument(d.id, true)),
      ...prompts.map(p => permanentlyDeletePrompt(p.id)),
      ...knowledge.map(k => permanentlyDeleteKnowledgeEntry(k.id)),
    ]);

    return NextResponse.json({
      success: true,
      deletedCount: documents.length + prompts.length + knowledge.length,
    });
  } catch (error) {
    console.error('[API] DELETE /trash error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
