import { NextRequest, NextResponse } from 'next/server';
import { getAllMcpPrompts, createMcpPrompt } from '@/lib/db/queries/mcpPrompts';
import { getSessionUser } from '@/lib/auth/session';

/**
 * GET /api/mcp - List MCP prompts with org-based visibility
 * Query params: search, limit, offset, status (filter by deployment status)
 * Returns: { success, mcpPrompts, total, limit, offset }
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
    const status = searchParams.get('status') as 'draft' | 'deployed' | 'disabled' | null;

    // Use org-based visibility
    const result = await getAllMcpPrompts(String(user.userId), {
      search,
      limit,
      offset,
      status: status || undefined,
      orgId: user.orgId,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      mcpPrompts: result.mcpPrompts,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API] GET /mcp error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/mcp - Create new MCP prompt
 * Body: { title, description, namespace, content, sourcePromptIds, sourceKnowledgeIds, isShared, allowEdit, isPublic }
 * Returns: { success, mcpPrompt }
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
      namespace,
      content,
      sourcePromptIds,
      sourceKnowledgeIds,
      isShared,
      allowEdit,
      isPublic,
    } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    if (!namespace || typeof namespace !== 'string') {
      return NextResponse.json({ success: false, error: 'Namespace is required' }, { status: 400 });
    }

    // Validate namespace format (URL-safe identifier)
    const namespaceRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
    if (!namespaceRegex.test(namespace)) {
      return NextResponse.json(
        { success: false, error: 'Namespace must be lowercase alphanumeric with hyphens, starting and ending with alphanumeric' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    const mcpPrompt = await createMcpPrompt({
      userId: String(user.userId),
      title: title.trim(),
      description: description?.trim() || undefined,
      namespace: namespace.trim().toLowerCase(),
      content,
      sourcePromptIds: sourcePromptIds || undefined,
      sourceKnowledgeIds: sourceKnowledgeIds || undefined,
      isShared: isShared ?? false,
      allowEdit: allowEdit ?? false,
      isPublic: isPublic ?? false,
    });

    return NextResponse.json({ success: true, mcpPrompt }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /mcp error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
