/**
 * MCP Build API Endpoint
 *
 * POST /api/mcp/build
 * Creates an MCP prompt record in the database from generated content.
 * Optionally auto-deploys the MCP prompt with an access token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createMcpPrompt, deployMcpPrompt, deleteMcpPrompt } from '@/lib/db/queries/mcpPrompts';
import { getPromptById, SystemPrompt } from '@/lib/db/queries/prompts';
import { getKnowledgeEntryById, KnowledgeEntry } from '@/lib/db/queries/knowledge';
import { handleApiError } from '@/lib/api/errors';
import { Session } from '@/types';

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
 * Check if user can view a prompt based on permission rules
 */
function canViewPrompt(user: Session, prompt: SystemPrompt): boolean {
  if (user.role === 'super_admin') {
    return true;
  }

  const isOwner = prompt.userId === String(user.userId);
  if (isOwner) {
    return true;
  }

  if (user.role === 'owner' && user.orgId) {
    const creatorOrgId = prompt.creator?.orgId;
    // Owners can see prompts from their org members
    return creatorOrgId === user.orgId;
  }

  if (user.role === 'member' && user.orgId) {
    const creatorOrgId = prompt.creator?.orgId;
    // Members can see shared prompts from same org
    return prompt.isShared && creatorOrgId === user.orgId;
  }

  return false;
}

/**
 * Check if user can view a knowledge entry based on permission rules
 */
function canViewKnowledge(user: Session, entry: KnowledgeEntry): boolean {
  if (user.role === 'super_admin') {
    return true;
  }

  const isOwner = entry.createdBy === user.userId;
  if (isOwner) {
    return true;
  }

  if (user.role === 'owner' && user.orgId) {
    const creatorOrgId = entry.creator?.orgId;
    return creatorOrgId === user.orgId;
  }

  if (user.role === 'member' && user.orgId) {
    const creatorOrgId = entry.creator?.orgId;
    return entry.isShared && creatorOrgId === user.orgId;
  }

  return false;
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

    // Validate user has access to all source prompts
    for (const promptId of sourcePromptIds) {
      const prompt = await getPromptById(promptId);
      if (!prompt) {
        return NextResponse.json(
          { success: false, error: `Prompt not found: ${promptId}` },
          { status: 404 }
        );
      }
      if (!canViewPrompt(user, prompt)) {
        return NextResponse.json(
          { success: false, error: `Access denied to prompt: ${promptId}` },
          { status: 403 }
        );
      }
    }

    // Validate user has access to all source knowledge entries
    for (const knowledgeId of sourceKnowledgeIds) {
      const entry = await getKnowledgeEntryById(knowledgeId);
      if (!entry) {
        return NextResponse.json(
          { success: false, error: `Knowledge entry not found: ${knowledgeId}` },
          { status: 404 }
        );
      }
      if (!canViewKnowledge(user, entry)) {
        return NextResponse.json(
          { success: false, error: `Access denied to knowledge entry: ${knowledgeId}` },
          { status: 403 }
        );
      }
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
        console.error('[MCP Build] Failed to auto-deploy MCP prompt, rolling back');
        // Delete the created MCP since deployment was requested but failed
        await deleteMcpPrompt(mcpPrompt.id);
        return NextResponse.json(
          { success: false, error: 'MCP created but deployment failed. Please try again.' },
          { status: 500 }
        );
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
