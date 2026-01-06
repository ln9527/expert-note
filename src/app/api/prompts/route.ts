import { NextRequest, NextResponse } from 'next/server';
import { getAllPrompts, createPrompt } from '@/lib/db/queries/prompts';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get('templateType') || undefined;
    const search = searchParams.get('search') || undefined;
    const tagIdsParam = searchParams.get('tagIds');
    const tagIds = tagIdsParam ? tagIdsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id)) : undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await getAllPrompts(String(user.userId), {
      templateType,
      search,
      tagIds,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      prompts: result.prompts,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API] GET /prompts error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, content, templateType, sourceKnowledgeIds, tagIds } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    // Validate tagIds if provided
    const validTagIds = Array.isArray(tagIds)
      ? tagIds.filter(id => typeof id === 'number' && !isNaN(id))
      : undefined;

    const prompt = await createPrompt({
      userId: String(user.userId),
      title: title.trim(),
      description: description?.trim() || undefined,
      content: content.trim(),
      templateType: templateType || undefined,
      sourceKnowledgeIds: sourceKnowledgeIds || undefined,
      tagIds: validTagIds,
    });

    return NextResponse.json({ success: true, prompt }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /prompts error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
