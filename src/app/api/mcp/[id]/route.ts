import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  getMcpPromptById,
  updateMcpPrompt,
  deleteMcpPrompt,
  canUserEditMcpPrompt,
} from '@/lib/db/queries/mcpPrompts';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * GET /api/mcp/[id] - Get MCP prompt by ID
 * Returns: { success, mcpPrompt }
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate UUID format to prevent database errors
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid MCP prompt ID format' }, { status: 400 });
    }

    const mcpPrompt = await getMcpPromptById(id);
    if (!mcpPrompt) {
      return NextResponse.json({ success: false, error: 'MCP prompt not found' }, { status: 404 });
    }

    // Check visibility: user must be creator, or MCP prompt must be shared in same org,
    // or user is org owner in same org, or user is super_admin
    const canView = await canUserViewMcpPrompt(mcpPrompt, user);
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view this MCP prompt' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, mcpPrompt });
  } catch (error) {
    console.error('[API] GET /mcp/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/mcp/[id] - Update MCP prompt
 * Body: { title?, description?, namespace?, content?, isShared?, allowEdit?, isPublic? }
 * Returns: { success, mcpPrompt }
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

    // Validate UUID format to prevent database errors
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid MCP prompt ID format' }, { status: 400 });
    }

    // Check if MCP prompt exists
    const existingMcpPrompt = await getMcpPromptById(id);
    if (!existingMcpPrompt) {
      return NextResponse.json({ success: false, error: 'MCP prompt not found' }, { status: 404 });
    }

    // Check edit permission
    const canEdit = await canUserEditMcpPrompt(id, String(user.userId), user.orgId, user.role);
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit this MCP prompt' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, namespace, content, isShared, allowEdit, isPublic } = body;

    // Validate namespace if provided
    if (namespace !== undefined) {
      const namespaceRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
      if (typeof namespace !== 'string' || !namespaceRegex.test(namespace)) {
        return NextResponse.json(
          { success: false, error: 'Namespace must be lowercase alphanumeric with hyphens, starting and ending with alphanumeric' },
          { status: 400 }
        );
      }
    }

    const mcpPrompt = await updateMcpPrompt(id, {
      title: title?.trim(),
      description: description !== undefined ? (description?.trim() || null) : undefined,
      namespace: namespace?.trim().toLowerCase(),
      content,
      isShared,
      allowEdit,
      isPublic,
    });

    if (!mcpPrompt) {
      return NextResponse.json({ success: false, error: 'MCP prompt not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, mcpPrompt });
  } catch (error) {
    console.error('[API] PUT /mcp/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/mcp/[id] - Soft delete MCP prompt
 * Returns: { success: true }
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

    // Validate UUID format to prevent database errors
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid MCP prompt ID format' }, { status: 400 });
    }

    // Check if MCP prompt exists
    const existingMcpPrompt = await getMcpPromptById(id);
    if (!existingMcpPrompt) {
      return NextResponse.json({ success: false, error: 'MCP prompt not found' }, { status: 404 });
    }

    // Check edit permission (same rules as update)
    const canEdit = await canUserEditMcpPrompt(id, String(user.userId), user.orgId, user.role);
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this MCP prompt' },
        { status: 403 }
      );
    }

    await deleteMcpPrompt(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /mcp/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Check if user can view an MCP prompt
 *
 * View rules:
 * - super_admin can view any MCP prompt
 * - MCP prompt creator can view their own MCP prompt
 * - Org owner can view all MCP prompts from same org
 * - Member can view own + shared MCP prompts from same org
 * - Individual can only view own MCP prompts
 */
async function canUserViewMcpPrompt(
  mcpPrompt: { createdBy: number; isShared: boolean; creator?: { orgId: number | null } | null },
  user: { userId: number; orgId: number | null; role: string }
): Promise<boolean> {
  // super_admin can view anything
  if (user.role === 'super_admin') {
    return true;
  }

  // Creator can always view
  if (mcpPrompt.createdBy === user.userId) {
    return true;
  }

  // Check org-based visibility
  const creatorOrgId = mcpPrompt.creator?.orgId;

  if (user.role === 'owner' && user.orgId && creatorOrgId === user.orgId) {
    // Org owner can view all MCP prompts from same org
    return true;
  }

  if (user.role === 'member' && user.orgId && mcpPrompt.isShared && creatorOrgId === user.orgId) {
    // Member can view shared MCP prompts from same org
    return true;
  }

  return false;
}
