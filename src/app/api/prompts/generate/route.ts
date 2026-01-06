import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createPrompt } from '@/lib/db/queries/prompts';
import {
  getKnowledgeEntryWithAnnotations,
  KnowledgeEntryWithAnnotations,
} from '@/lib/db/queries/knowledge';
import {
  getAllPromptTemplates,
} from '@/lib/db/queries/promptTemplates';
import {
  generateSystemPrompt,
} from '@/lib/ai/generation';

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

    // Fetch generation templates from database
    const generationTemplates = await getAllPromptTemplates({ category: 'generation' });

    // Find the matching template (by templateType field or by name)
    const matchedTemplate = generationTemplates.find(
      t => (t.templateType || t.name) === templateType
    );

    // Use the provided templateType as-is (it's user-defined now)
    const validTemplateType = templateType || 'custom';

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

    // Count total annotations for summary
    const totalAnnotations = entriesWithAnnotations.reduce(
      (sum, entry) => sum + (entry.annotations?.length || 0), 0
    );

    // Generate the system prompt (pass entries with nested annotations)
    // Include template info if a matching template was found
    const generatedContent = await generateSystemPrompt({
      purpose: purpose.trim(),
      templateType: validTemplateType,
      templateName: matchedTemplate?.name,
      templateBaseInstructions: matchedTemplate?.content,
      knowledgeEntries: entriesWithAnnotations,
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
      annotationCount: totalAnnotations,
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
 * GET: Return available template types from database
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch generation templates from database
    const templates = await getAllPromptTemplates({ category: 'generation' });

    return NextResponse.json({
      success: true,
      templates: templates.map(t => ({
        id: t.templateType || t.name,
        name: t.name,
        description: t.description,
      })),
    });
  } catch (error) {
    console.error('[API] GET /prompts/generate error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
