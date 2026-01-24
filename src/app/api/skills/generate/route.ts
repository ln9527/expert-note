/**
 * Skills Generation API Endpoint
 *
 * POST /api/skills/generate
 * Generates a skill plan from source prompts and knowledge entries using AI.
 *
 * The endpoint loads generation templates from the prompt_templates table
 * with category='skill-generation' and uses them to generate:
 * - skill-md: The SKILL.md content
 * - skill-prompts: JSON object of prompt templates
 * - skill-examples: JSON object of examples
 * - skill-tests: JSON object of test cases
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getPromptById } from '@/lib/db/queries/prompts';
import { getKnowledgeEntryById } from '@/lib/db/queries/knowledge';
import { getAllPromptTemplates } from '@/lib/db/queries/promptTemplates';
import { chatCompletion, parseJsonResponse } from '@/lib/ai/openrouter';
import { handleApiError } from '@/lib/api/errors';
import { Session } from '@/types';
import { SystemPrompt } from '@/lib/db/queries/prompts';
import { KnowledgeEntry } from '@/lib/db/queries/knowledge';

/**
 * Generated skill plan structure
 */
interface GeneratedPlan {
  skillMd: string;
  prompts: Record<string, string>;
  examples: Record<string, string>;
  tests: Record<string, string>;
}

/**
 * Request body for skill generation
 */
interface GenerateSkillRequest {
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  title: string;
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

/**
 * Parse JSON response safely, handling markdown code blocks
 */
function safeParseJson(response: string): Record<string, string> {
  try {
    return parseJsonResponse<Record<string, string>>(response);
  } catch {
    console.warn('[Skills Generate] Failed to parse JSON response, returning empty object');
    return {};
  }
}

/**
 * Strip markdown code fences from AI response
 * AI sometimes wraps output in ```markdown ... ``` even when not asked
 */
function stripMarkdownCodeFence(content: string): string {
  let result = content.trim();

  // Remove opening code fence (```markdown, ```md, or just ```)
  const openFenceMatch = result.match(/^```(?:markdown|md)?\s*\n?/i);
  if (openFenceMatch) {
    result = result.slice(openFenceMatch[0].length);
  }

  // Remove closing code fence
  const closeFenceMatch = result.match(/\n?```\s*$/);
  if (closeFenceMatch) {
    result = result.slice(0, -closeFenceMatch[0].length);
  }

  return result.trim();
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateSkillRequest = await request.json();
    const {
      sourcePromptIds = [],
      sourceKnowledgeIds = [],
      title,
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

    // Load generation templates from database
    const generationTemplates = await getAllPromptTemplates({ category: 'skill-generation' });

    // Find templates by template_type
    const findTemplate = (templateType: string) =>
      generationTemplates.find(t => t.templateType === templateType);

    const skillMdTemplate = findTemplate('skill-md');
    const skillPromptsTemplate = findTemplate('skill-prompts');
    const skillExamplesTemplate = findTemplate('skill-examples');
    const skillTestsTemplate = findTemplate('skill-tests');

    // Build source context
    const sourceContext = buildSourceContext(prompts, knowledge);

    // User request context
    const userRequestContext = `
# User Request
Title: ${title.trim()}
Description: ${description?.trim() || 'None provided'}
Additional Instructions: ${instructions?.trim() || 'None provided'}

# Source Materials
${sourceContext}
`;

    // Generate skill-md content
    console.log('[Skills Generate] Generating SKILL.md content...');
    let skillMd = '';
    if (skillMdTemplate) {
      const skillMdPrompt = `${skillMdTemplate.content}

${userRequestContext}

Generate the SKILL.md content now:`;

      const rawSkillMd = await chatCompletion(
        [{ role: 'user', content: skillMdPrompt }],
        { temperature: 0.7, maxTokens: 4000 }
      );
      // Strip any code fences the AI may have added
      skillMd = stripMarkdownCodeFence(rawSkillMd);
    } else {
      // Fallback if no template exists
      skillMd = `# ${title.trim()}

${description || 'A skill generated from expert knowledge.'}

## Purpose
This skill was generated from ${prompts.length} prompts and ${knowledge.length} knowledge entries.

## Instructions
${instructions || 'Follow the guidance provided in the source materials.'}
`;
    }

    // Generate skill-prompts JSON
    console.log('[Skills Generate] Generating prompts...');
    let skillPrompts: Record<string, string> = {};
    if (skillPromptsTemplate) {
      const promptsPrompt = `${skillPromptsTemplate.content}

${userRequestContext}

Generate the prompts JSON object now. Return ONLY valid JSON:`;

      const promptsResponse = await chatCompletion(
        [{ role: 'user', content: promptsPrompt }],
        { temperature: 0.7, maxTokens: 3000 }
      );
      skillPrompts = safeParseJson(promptsResponse);
    }

    // Generate skill-examples JSON
    console.log('[Skills Generate] Generating examples...');
    let skillExamples: Record<string, string> = {};
    if (skillExamplesTemplate) {
      const examplesPrompt = `${skillExamplesTemplate.content}

${userRequestContext}

Generate the examples JSON object now. Return ONLY valid JSON:`;

      const examplesResponse = await chatCompletion(
        [{ role: 'user', content: examplesPrompt }],
        { temperature: 0.7, maxTokens: 3000 }
      );
      skillExamples = safeParseJson(examplesResponse);
    }

    // Generate skill-tests JSON
    console.log('[Skills Generate] Generating tests...');
    let skillTests: Record<string, string> = {};
    if (skillTestsTemplate) {
      const testsPrompt = `${skillTestsTemplate.content}

${userRequestContext}

Generate the tests JSON object now. Return ONLY valid JSON:`;

      const testsResponse = await chatCompletion(
        [{ role: 'user', content: testsPrompt }],
        { temperature: 0.7, maxTokens: 3000 }
      );
      skillTests = safeParseJson(testsResponse);
    }

    // Build the generated plan
    const plan: GeneratedPlan = {
      skillMd,
      prompts: skillPrompts,
      examples: skillExamples,
      tests: skillTests,
    };

    console.log('[Skills Generate] Generation complete:', {
      skillMdLength: skillMd.length,
      promptsCount: Object.keys(skillPrompts).length,
      examplesCount: Object.keys(skillExamples).length,
      testsCount: Object.keys(skillTests).length,
    });

    return NextResponse.json({
      success: true,
      plan,
      meta: {
        sourcePromptCount: prompts.length,
        sourceKnowledgeCount: knowledge.length,
        templatesUsed: {
          skillMd: !!skillMdTemplate,
          prompts: !!skillPromptsTemplate,
          examples: !!skillExamplesTemplate,
          tests: !!skillTestsTemplate,
        },
      },
    });
  } catch (error) {
    return handleApiError(error, 'generate skill');
  }
}

/**
 * GET: Return available template types for skill generation
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch skill generation templates from database
    const templates = await getAllPromptTemplates({ category: 'skill-generation' });

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
    console.error('[API] GET /skills/generate error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
