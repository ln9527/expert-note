import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createPrompt } from '@/lib/db/queries/prompts';
import {
  getKnowledgeEntryWithAnnotations,
  KnowledgeEntryWithAnnotations,
} from '@/lib/db/queries/knowledge';
import {
  generateSystemPrompt,
  getTemplateInfo,
  PROMPT_TEMPLATES,
  TemplateType,
} from '@/lib/ai/generation';
import { KnowledgeEntry, AnnotationLevel } from '@/types';

/**
 * Transform knowledge entry with annotations to the format expected by generateSystemPrompt
 */
function transformToKnowledgeEntries(
  entriesWithAnnotations: KnowledgeEntryWithAnnotations[]
): KnowledgeEntry[] {
  const result: KnowledgeEntry[] = [];

  for (const entry of entriesWithAnnotations) {
    for (const annotation of entry.annotations) {
      result.push({
        id: parseInt(annotation.id, 10) || 0,
        userId: 0, // Not needed for generation
        originalContent: annotation.comment,
        refinedContent: annotation.refinedComment,
        level: annotation.level as AnnotationLevel,
        isUniversal: false,
        tags: entry.tags.map((t) => t.name),
        sourceDocumentId: entry.sourceDocumentId,
        sourceAnnotationId: parseInt(annotation.id, 10) || null,
        createdAt: annotation.createdAt,
        updatedAt: entry.updatedAt,
      });
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      knowledgeIds,
      templateType,
      purpose,
      customInstructions,
      title,
      description,
      saveToDatabase = true,
    } = body;

    // Validate required fields
    if (!knowledgeIds || !Array.isArray(knowledgeIds) || knowledgeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one knowledge ID is required' },
        { status: 400 }
      );
    }

    if (!purpose || typeof purpose !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Purpose is required' },
        { status: 400 }
      );
    }

    // Validate template type
    const validTemplateType = templateType && templateType in PROMPT_TEMPLATES
      ? (templateType as TemplateType)
      : 'custom';

    // Fetch all knowledge entries with annotations
    const entriesWithAnnotations: KnowledgeEntryWithAnnotations[] = [];
    const documentBackgrounds: string[] = [];

    for (const knowledgeId of knowledgeIds) {
      const entry = await getKnowledgeEntryWithAnnotations(knowledgeId);
      if (entry) {
        entriesWithAnnotations.push(entry);
        if (entry.background) {
          documentBackgrounds.push(entry.background);
        }
      }
    }

    if (entriesWithAnnotations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid knowledge entries found' },
        { status: 404 }
      );
    }

    // Transform to the format expected by generateSystemPrompt
    const knowledgeEntries = transformToKnowledgeEntries(entriesWithAnnotations);

    // Generate the system prompt
    const generatedContent = await generateSystemPrompt({
      purpose: purpose.trim(),
      templateType: validTemplateType,
      knowledgeEntries,
      documentBackgrounds: documentBackgrounds.length > 0 ? documentBackgrounds : undefined,
      customInstructions: customInstructions?.trim() || undefined,
    });

    // Prepare the response
    const result: {
      generatedContent: string;
      knowledgeCount: number;
      annotationCount: number;
      templateType: string;
      prompt?: unknown;
    } = {
      generatedContent,
      knowledgeCount: entriesWithAnnotations.length,
      annotationCount: knowledgeEntries.length,
      templateType: validTemplateType,
    };

    // Save to database if requested
    if (saveToDatabase) {
      const promptTitle = title?.trim() || `Generated Prompt - ${validTemplateType}`;
      const promptDescription = description?.trim() ||
        `Generated from ${entriesWithAnnotations.length} knowledge entries using ${validTemplateType} template`;

      const prompt = await createPrompt({
        userId: String(user.userId),
        title: promptTitle,
        description: promptDescription,
        content: generatedContent,
        templateType: validTemplateType,
        sourceKnowledgeIds: knowledgeIds,
      });

      result.prompt = prompt;
    }

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /prompts/generate error:', error);

    // Check if it's an AI API error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('OpenRouter') || errorMessage.includes('API')) {
      return NextResponse.json(
        { success: false, error: 'AI service error: ' + errorMessage },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET: Return available template types
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const templates = getTemplateInfo();

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('[API] GET /prompts/generate error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
