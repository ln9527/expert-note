import { NextRequest, NextResponse } from 'next/server';
import { getAllSkills, createSkill } from '@/lib/db/queries/skills';
import { getSessionUser } from '@/lib/auth/session';

/**
 * GET /api/skills - List skills with org-based visibility
 * Query params: search, limit, offset
 * Returns: { success, skills, total, limit, offset }
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Use org-based visibility
    const result = await getAllSkills(String(user.userId), {
      search,
      limit,
      offset,
      orgId: user.orgId,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      skills: result.skills,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API] GET /skills error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/skills - Create new skill
 * Body: { title, description, content, sourcePromptIds, sourceKnowledgeIds, isShared, allowEdit }
 * Returns: { success, skill }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      content,
      sourcePromptIds,
      sourceKnowledgeIds,
      isShared,
      allowEdit,
    } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    if (!content || typeof content !== 'object') {
      return NextResponse.json({ success: false, error: 'Content is required and must be an object' }, { status: 400 });
    }

    const skill = await createSkill({
      userId: String(user.userId),
      title: title.trim(),
      description: description?.trim() || undefined,
      content,
      sourcePromptIds: sourcePromptIds || undefined,
      sourceKnowledgeIds: sourceKnowledgeIds || undefined,
      isShared: isShared ?? false,
      allowEdit: allowEdit ?? false,
    });

    return NextResponse.json({ success: true, skill }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /skills error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
