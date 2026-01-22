/**
 * MCP Build API Endpoint
 *
 * POST /api/mcp/build
 * Creates an MCP prompt record in the database from generated content.
 * Optionally auto-deploys the MCP prompt with an access token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createMcpPrompt, deployMcpPrompt } from '@/lib/db/queries/mcpPrompts';
import { handleApiError } from '@/lib/api/errors';

/**
 * Request body for MCP build
 */
interface BuildRequest {
  plan: {
    content: string;
    namespace: string;
  };
  title: string;
  description?: string;
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  isShared?: boolean;
  allowEdit?: boolean;
  isPublic?: boolean;
  autoDeploy?: boolean;
}

/**
 * POST /api/mcp/build - Create MCP prompt record
 *
 * Creates a new MCP prompt in the database from the generated plan content.
 * If autoDeploy is true, also generates an access token and sets status to deployed.
 *
 * Returns: { success, mcpPrompt }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: BuildRequest = await request.json();
    const {
      plan,
      title,
      description,
      sourcePromptIds = [],
      sourceKnowledgeIds = [],
      isShared = false,
      allowEdit = false,
      isPublic = false,
      autoDeploy = false,
    } = body;

    // Validate required fields
    if (!plan || typeof plan !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Plan is required' },
        { status: 400 }
      );
    }

    if (!plan.content || typeof plan.content !== 'string' || plan.content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Plan content is required' },
        { status: 400 }
      );
    }

    if (!plan.namespace || typeof plan.namespace !== 'string' || plan.namespace.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Plan namespace is required' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate namespace format
    const namespaceRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
    const normalizedNamespace = plan.namespace.trim().toLowerCase();
    if (!namespaceRegex.test(normalizedNamespace)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Namespace must be lowercase alphanumeric with hyphens, starting and ending with alphanumeric',
        },
        { status: 400 }
      );
    }

    console.log('[MCP Build] Creating MCP prompt:', {
      title: title.trim(),
      namespace: normalizedNamespace,
      contentLength: plan.content.length,
      autoDeploy,
      userId: user.userId,
    });

    // Create the MCP prompt record
    let mcpPrompt = await createMcpPrompt({
      userId: String(user.userId),
      title: title.trim(),
      description: description?.trim() || undefined,
      namespace: normalizedNamespace,
      content: plan.content.trim(),
      sourcePromptIds,
      sourceKnowledgeIds,
      isShared,
      allowEdit,
      isPublic,
    });

    console.log('[MCP Build] MCP prompt created:', { id: mcpPrompt.id });

    // Handle auto-deploy
    if (autoDeploy) {
      console.log('[MCP Build] Auto-deploying MCP prompt...');
      const deployedMcp = await deployMcpPrompt(mcpPrompt.id);
      if (deployedMcp) {
        mcpPrompt = deployedMcp;
        console.log('[MCP Build] MCP prompt deployed:', {
          id: mcpPrompt.id,
          status: mcpPrompt.deploymentStatus,
          hasAccessToken: !!mcpPrompt.accessToken,
        });
      } else {
        console.error('[MCP Build] Failed to auto-deploy MCP prompt');
      }
    }

    return NextResponse.json(
      {
        success: true,
        mcpPrompt,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, 'build MCP');
  }
}
