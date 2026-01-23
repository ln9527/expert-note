import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  getMcpPromptById,
  regenerateAccessToken,
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
 * POST /api/mcp/[id]/regenerate-token - Generate new access token
 * Invalidates the old token and generates a new one
 * Returns: { success, mcpPrompt, accessUrl }
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

    // Validate UUID format to prevent database errors
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid MCP prompt ID format' }, { status: 400 });
    }

    // Check if MCP prompt exists
    const existingMcpPrompt = await getMcpPromptById(id);
    if (!existingMcpPrompt) {
      return NextResponse.json({ success: false, error: 'MCP prompt not found' }, { status: 404 });
    }

    // Check edit permission (regenerating token requires edit access)
    const canEdit = await canUserEditMcpPrompt(id, String(user.userId), user.orgId, user.role);
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to regenerate the access token' },
        { status: 403 }
      );
    }

    // Regenerate the access token
    const mcpPrompt = await regenerateAccessToken(id);
    if (!mcpPrompt) {
      return NextResponse.json({ success: false, error: 'Failed to regenerate access token' }, { status: 500 });
    }

    // Build the new access URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spansurvey.net';
    const basePath = process.env.BASE_PATH || '/annote';
    const accessUrl = `${baseUrl}${basePath}/mcp/${mcpPrompt.accessToken}`;

    return NextResponse.json({
      success: true,
      mcpPrompt,
      accessUrl,
    });
  } catch (error) {
    console.error('[API] POST /mcp/[id]/regenerate-token error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
