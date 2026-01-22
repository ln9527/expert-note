/**
 * MCP Generation API Endpoint
 *
 * POST /api/mcp/generate
 * Generates MCP prompt content from source prompts and knowledge entries using AI.
 *
 * The endpoint loads generation templates from the prompt_templates table
 * with category='mcp-generation' and uses them to generate:
 * - content: The MCP prompt content string
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getPromptById } from '@/lib/db/queries/prompts';
import { getKnowledgeEntryById } from '@/lib/db/queries/knowledge';
import { getAllPromptTemplates } from '@/lib/db/queries/promptTemplates';
import { chatCompletion } from '@/lib/ai/openrouter';
import { handleApiError } from '@/lib/api/errors';
import { Session } from '@/types';
import { SystemPrompt } from '@/lib/db/queries/prompts';
import { KnowledgeEntry } from '@/lib/db/queries/knowledge';

/**
 * Request body for MCP generation
 */
interface GenerateMcpRequest {
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  title: string;
  namespace: string;
  description?: string;
  instructions?: string;
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
 * Build source context from prompts and knowledge entries
 */
function buildSourceContext(
  prompts: SystemPrompt[],
  knowledge: KnowledgeEntry[]
): string {
  const promptSection = prompts.length > 0
    ? `## Source Prompts:\n${prompts.map(p => `### ${p.title}\n${p.content}`).join('\n\n')}`
    : '';

  const knowledgeSection = knowledge.length > 0
    ? `## Source Knowledge:\n${knowledge.map(k => `### ${k.background || 'Knowledge Entry'}\n${k.content || '(No content)'}`).join('\n\n')}`
    : '';

  return [promptSection, knowledgeSection].filter(Boolean).join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateMcpRequest = await request.json();
    const {
      sourcePromptIds = [],
      sourceKnowledgeIds = [],
      title,
      namespace,
      description,
      instructions,
    } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!namespace || typeof namespace !== 'string' || namespace.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Namespace is required' },
        { status: 400 }
      );
    }

    // Validate at least one source is selected
    if (
      (!sourcePromptIds || sourcePromptIds.length === 0) &&
      (!sourceKnowledgeIds || sourceKnowledgeIds.length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one source prompt or knowledge entry is required',
        },
        { status: 400 }
      );
    }

    // Load and validate source prompts
    const prompts: SystemPrompt[] = [];
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
      prompts.push(prompt);
    }

    // Load and validate source knowledge entries
    const knowledge: KnowledgeEntry[] = [];
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
      knowledge.push(entry);
    }

    // Load MCP generation template from database
    const mcpTemplates = await getAllPromptTemplates({ category: 'mcp-generation' });
    const promptTemplate = mcpTemplates.find(t => t.templateType === 'mcp-prompt');

    // Build source context
    const sourceContext = buildSourceContext(prompts, knowledge);

    // Generate MCP content
    console.log('[MCP Generate] Generating MCP prompt content...');
    let generatedContent = '';

    if (promptTemplate) {
      const mcpPrompt = `${promptTemplate.content}

# User Request
Title: ${title.trim()}
Namespace: ${namespace.trim()}
Description: ${description?.trim() || 'None provided'}
Additional Instructions: ${instructions?.trim() || 'None provided'}

# Source Materials
${sourceContext}

Generate the MCP prompt content now:`;

      generatedContent = await chatCompletion(
        [{ role: 'user', content: mcpPrompt }],
        { temperature: 0.7, maxTokens: 4000 }
      );
    } else {
      // Fallback if no template exists - generate a basic MCP prompt structure
      console.log('[MCP Generate] No mcp-prompt template found, using fallback generation');

      const fallbackPrompt = `You are an expert at creating MCP (Model Context Protocol) prompts for AI assistants.

Based on the following source materials, create a comprehensive MCP prompt that:
1. Captures the domain expertise and knowledge from the sources
2. Provides clear instructions for the AI to follow
3. Includes relevant context and constraints
4. Is well-structured and easy to understand

# User Request
Title: ${title.trim()}
Namespace: ${namespace.trim()}
Description: ${description?.trim() || 'None provided'}
Additional Instructions: ${instructions?.trim() || 'None provided'}

# Source Materials
${sourceContext}

Generate a well-structured MCP prompt content that encapsulates the expertise from the source materials:`;

      generatedContent = await chatCompletion(
        [{ role: 'user', content: fallbackPrompt }],
        { temperature: 0.7, maxTokens: 4000 }
      );
    }

    console.log('[MCP Generate] Generation complete:', {
      contentLength: generatedContent.length,
      namespace: namespace.trim(),
    });

    return NextResponse.json({
      success: true,
      plan: {
        content: generatedContent,
        namespace: namespace.trim(),
      },
      meta: {
        sourcePromptCount: prompts.length,
        sourceKnowledgeCount: knowledge.length,
        templateUsed: !!promptTemplate,
      },
    });
  } catch (error) {
    return handleApiError(error, 'generate MCP');
  }
}

/**
 * GET: Return available template types for MCP generation
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch MCP generation templates from database
    const templates = await getAllPromptTemplates({ category: 'mcp-generation' });

    return NextResponse.json({
      success: true,
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        templateType: t.templateType,
      })),
    });
  } catch (error) {
    console.error('[API] GET /mcp/generate error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
