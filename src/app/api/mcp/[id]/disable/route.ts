import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  getMcpPromptById,
  disableMcpPrompt,
  canUserEditMcpPrompt,
} from '@/lib/db/queries/mcpPrompts';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/mcp/[id]/disable - Disable deployed MCP prompt
 * Sets status to 'disabled' (keeps access token for potential re-deployment)
 * Returns: { success, mcpPrompt }
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if MCP prompt exists
    const existingMcpPrompt = await getMcpPromptById(id);
    if (!existingMcpPrompt) {
      return NextResponse.json({ success: false, error: 'MCP prompt not found' }, { status: 404 });
    }

    // Check edit permission (disabling requires edit access)
    const canEdit = await canUserEditMcpPrompt(id, String(user.userId), user.orgId, user.role);
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to disable this MCP prompt' },
        { status: 403 }
      );
    }

    // Disable the MCP prompt
    const mcpPrompt = await disableMcpPrompt(id);
    if (!mcpPrompt) {
      return NextResponse.json({ success: false, error: 'Failed to disable MCP prompt' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mcpPrompt,
    });
  } catch (error) {
    console.error('[API] POST /mcp/[id]/disable error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
