import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  getMcpPromptById,
  deployMcpPrompt,
  canUserEditMcpPrompt,
} from '@/lib/db/queries/mcpPrompts';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/mcp/[id]/deploy - Deploy MCP prompt
 * Generates access token if not exists and sets status to 'deployed'
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

    // Check if MCP prompt exists
    const existingMcpPrompt = await getMcpPromptById(id);
    if (!existingMcpPrompt) {
      return NextResponse.json({ success: false, error: 'MCP prompt not found' }, { status: 404 });
    }

    // Check edit permission (deploying requires edit access)
    const canEdit = await canUserEditMcpPrompt(id, String(user.userId), user.orgId, user.role);
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to deploy this MCP prompt' },
        { status: 403 }
      );
    }

    // Deploy the MCP prompt
    const mcpPrompt = await deployMcpPrompt(id);
    if (!mcpPrompt) {
      return NextResponse.json({ success: false, error: 'Failed to deploy MCP prompt' }, { status: 500 });
    }

    // Build the access URL
    // The URL structure follows the design: /annote/mcp/{token}
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spansurvey.net';
    const basePath = process.env.BASE_PATH || '/annote';
    const accessUrl = `${baseUrl}${basePath}/mcp/${mcpPrompt.accessToken}`;

    return NextResponse.json({
      success: true,
      mcpPrompt,
      accessUrl,
    });
  } catch (error) {
    console.error('[API] POST /mcp/[id]/deploy error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
