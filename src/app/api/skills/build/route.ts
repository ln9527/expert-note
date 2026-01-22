/**
 * Skills Build API Endpoint
 *
 * POST /api/skills/build
 * Creates a skill record in the database from a generated plan.
 *
 * This endpoint receives the plan output from /api/skills/generate
 * and persists it as a skill that can be downloaded/exported.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createSkill } from '@/lib/db/queries/skills';
import { handleApiError } from '@/lib/api/errors';

/**
 * Generated plan structure from the generate endpoint
 */
interface GeneratedPlan {
  skillMd: string;
  prompts: Record<string, string>;
  examples: Record<string, string>;
  tests: Record<string, string>;
}

/**
 * Request body for building a skill
 */
interface BuildRequest {
  plan: GeneratedPlan;
  title: string;
  description?: string;
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  isShared?: boolean;
  allowEdit?: boolean;
}

/**
 * Validate that the plan object has the required structure
 */
function isValidPlan(plan: unknown): plan is GeneratedPlan {
  if (!plan || typeof plan !== 'object') {
    return false;
  }

  const p = plan as Record<string, unknown>;

  // skillMd is required and must be a non-empty string
  if (typeof p.skillMd !== 'string' || p.skillMd.trim().length === 0) {
    return false;
  }

  // prompts, examples, and tests should be objects (can be empty)
  if (p.prompts !== undefined && (typeof p.prompts !== 'object' || p.prompts === null)) {
    return false;
  }

  if (p.examples !== undefined && (typeof p.examples !== 'object' || p.examples === null)) {
    return false;
  }

  if (p.tests !== undefined && (typeof p.tests !== 'object' || p.tests === null)) {
    return false;
  }

  return true;
}

/**
 * POST /api/skills/build
 *
 * Creates a skill record from a generated plan.
 *
 * Request body:
 * - plan: { skillMd, prompts, examples, tests } - The generated plan
 * - title: string - Skill title
 * - description?: string - Optional description
 * - sourcePromptIds?: string[] - IDs of source prompts
 * - sourceKnowledgeIds?: string[] - IDs of source knowledge entries
 * - isShared?: boolean - Whether to share with org
 * - allowEdit?: boolean - Whether org members can edit
 *
 * Response:
 * - success: boolean
 * - skill: Skill object
 * - downloadUrl: string - URL to download the skill
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
    } = body;

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate plan
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan is required' },
        { status: 400 }
      );
    }

    if (!isValidPlan(plan)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan structure. Plan must include skillMd (non-empty string) and optionally prompts, examples, tests (objects).' },
        { status: 400 }
      );
    }

    // Build the content object that will be stored as JSONB
    // This structure mirrors what the download endpoint expects
    const content: Record<string, unknown> = {
      skillMd: plan.skillMd,
      prompts: plan.prompts || {},
      examples: plan.examples || {},
      tests: plan.tests || {},
    };

    // Create the skill record
    console.log('[Skills Build] Creating skill:', {
      title: title.trim(),
      userId: user.userId,
      sourcePromptIds: sourcePromptIds.length,
      sourceKnowledgeIds: sourceKnowledgeIds.length,
      isShared,
    });

    const skill = await createSkill({
      userId: String(user.userId),
      title: title.trim(),
      description: description?.trim() || undefined,
      content,
      sourcePromptIds: sourcePromptIds.length > 0 ? sourcePromptIds : undefined,
      sourceKnowledgeIds: sourceKnowledgeIds.length > 0 ? sourceKnowledgeIds : undefined,
      isShared,
      allowEdit,
    });

    console.log('[Skills Build] Skill created:', skill.id);

    // Build the download URL
    const downloadUrl = `/api/skills/${skill.id}/download`;

    return NextResponse.json({
      success: true,
      skill,
      downloadUrl,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'build skill');
  }
}
