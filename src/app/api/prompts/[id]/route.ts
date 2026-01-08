import { NextRequest, NextResponse } from 'next/server';
import {
  getPromptById,
  updatePrompt,
  deletePrompt,
  permanentlyDeletePrompt,
  restorePrompt,
  isPromptOwnedByUser,
} from '@/lib/db/queries/prompts';
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
    const prompt = await getPromptById(id);

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }

    // Check ownership
    if (prompt.userId !== String(user.userId)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error('[API] GET /prompts/[id] error:', error);
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

    // Check ownership
    const isOwner = await isPromptOwnedByUser(id, String(user.userId));
    if (!isOwner) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      content,
      templateType,
      sourceKnowledgeIds,
      sourceDocumentIds,
      basePromptId,
      tagIds,
    } = body;

    // Validate tagIds if provided
    const validTagIds = tagIds !== undefined
      ? (Array.isArray(tagIds) ? tagIds.filter(id => typeof id === 'number' && !isNaN(id)) : [])
      : undefined;

    const prompt = await updatePrompt(id, {
      title: title?.trim(),
      description: description?.trim(),
      content: content?.trim(),
      templateType,
      sourceKnowledgeIds,
      sourceDocumentIds,
      basePromptId,
      tagIds: validTagIds,
    });

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, prompt });
  } catch (error) {
    console.error('[API] PUT /prompts/[id] error:', error);
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

    // Check ownership
    const isOwner = await isPromptOwnedByUser(id, String(user.userId));
    if (!isOwner) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }

    if (permanent) {
      await permanentlyDeletePrompt(id);
    } else {
      await deletePrompt(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /prompts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH handler for restore action
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Check ownership
    const isOwner = await isPromptOwnedByUser(id, String(user.userId));
    if (!isOwner) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }

    if (action === 'restore') {
      const prompt = await restorePrompt(id);
      if (!prompt) {
        return NextResponse.json({ success: false, error: 'Prompt not found or not deleted' }, { status: 404 });
      }
      return NextResponse.json({ success: true, prompt });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[API] PATCH /prompts/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
