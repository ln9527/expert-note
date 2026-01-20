import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createPrompt, getPromptById } from '@/lib/db/queries/prompts';
import {
  getKnowledgeEntryById,
  getKnowledgeEntryWithAnnotations,
  KnowledgeEntryWithAnnotations,
} from '@/lib/db/queries/knowledge';
import { getDocumentById } from '@/lib/db/queries/documents';
import { getAllPromptTemplates } from '@/lib/db/queries/promptTemplates';
import { generateSystemPrompt } from '@/lib/ai/generation';
import { extractAnnotations } from '@/lib/utils/annotation';
import { KnowledgeAnnotation, Session, Document } from '@/types';
import { handleApiError } from '@/lib/api/errors';
import { KnowledgeEntry } from '@/lib/db/queries/knowledge';

/**
 * Check if user can view a document based on permission rules:
 * - super_admin: Can access all
 * - owner: Can access docs in their org
 * - member: Can access own docs + shared docs from same org
 * - individual: Can only access own docs
 */
function canViewDocument(user: Session, document: Document): boolean {
  if (user.role === 'super_admin') {
    return true;
  }

  const isOwner = document.createdBy === user.userId;
  if (isOwner) {
    return true;
  }

  if (user.role === 'owner' && user.orgId) {
    const creatorOrgId = document.creator?.orgId;
    return creatorOrgId === user.orgId;
  }

  if (user.role === 'member' && user.orgId) {
    const creatorOrgId = document.creator?.orgId;
    return document.isShared && creatorOrgId === user.orgId;
  }

  return false;
}

/**
 * Check if user can view a knowledge entry based on permission rules:
 * - super_admin: Can access all
 * - owner: Can access knowledge in their org
 * - member: Can access own knowledge + shared knowledge from same org
 * - individual: Can only access own knowledge
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

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      knowledgeIds = [],
      documentIds = [],
      basePromptId,
      templateType,
      purpose,
      customInstructions,
      title,
      description,
      tagIds = [],
      saveToDatabase = true,
    } = body;

    // Validate that at least one source is provided (knowledge or documents or base prompt)
    if (
      (!knowledgeIds || knowledgeIds.length === 0) &&
      (!documentIds || documentIds.length === 0) &&
      !basePromptId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one knowledge ID, document ID, or base prompt ID is required',
        },
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

    // Collect all annotation sources
    const entriesWithAnnotations: KnowledgeEntryWithAnnotations[] = [];
    const documentBackgrounds: string[] = [];
    let mergedSourceKnowledgeIds = [...knowledgeIds];
    let mergedSourceDocumentIds = [...documentIds];

    // 1. If base prompt is provided, merge its sources
    if (basePromptId) {
      const basePrompt = await getPromptById(basePromptId);
      if (basePrompt) {
        mergedSourceKnowledgeIds = [
          ...new Set([...mergedSourceKnowledgeIds, ...basePrompt.sourceKnowledgeIds]),
        ];
        mergedSourceDocumentIds = [
          ...new Set([...mergedSourceDocumentIds, ...basePrompt.sourceDocumentIds]),
        ];
      }
    }

    // 2. Validate user has access to all knowledge entries
    for (const knowledgeId of mergedSourceKnowledgeIds) {
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

    // 3. Validate user has access to all documents
    for (const documentId of mergedSourceDocumentIds) {
      const document = await getDocumentById(documentId);
      if (!document) {
        return NextResponse.json(
          { success: false, error: `Document not found: ${documentId}` },
          { status: 404 }
        );
      }
      if (!canViewDocument(user, document)) {
        return NextResponse.json(
          { success: false, error: `Access denied to document: ${documentId}` },
          { status: 403 }
        );
      }
    }

    // 4. Process knowledge entries (access already validated)
    for (const knowledgeId of mergedSourceKnowledgeIds) {
      const entry = await getKnowledgeEntryWithAnnotations(knowledgeId);
      if (entry) {
        entriesWithAnnotations.push(entry);
        if (entry.background) {
          documentBackgrounds.push(entry.background);
        }
      }
    }

    // 5. Process documents directly (access already validated)
    for (const documentId of mergedSourceDocumentIds) {
      const document = await getDocumentById(documentId);
      if (document) {
        // Extract annotations from document content
        const annotations = extractAnnotations(document.content);

        // Create a pseudo-knowledge entry for compatibility with generation
        const pseudoEntry: KnowledgeEntryWithAnnotations = {
          id: `doc-${documentId}`,
          sourceDocumentId: documentId,
          background: `Document: ${document.filename}`,
          content: null,  // No raw content for pseudo-entries from documents
          createdBy: document.createdBy,  // Inherit from document
          isShared: document.isShared,    // Inherit from document
          allowEdit: document.allowEdit,  // Inherit from document
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          tags: document.tags,
          annotationCount: annotations.length,
          annotations: annotations.map((ann, idx) => ({
            id: `doc-${documentId}-ann-${idx}`,
            knowledgeId: `doc-${documentId}`,
            level: ann.level,
            originalText: ann.content,
            comment: ann.content,
            refinedComment: null,
            location: `Line ${ann.line}`,
            backgroundContext: ann.surroundingContext,
            positionLine: ann.line,
            positionChar: ann.char,
            createdAt: document.createdAt,
          })) as KnowledgeAnnotation[],
        };

        entriesWithAnnotations.push(pseudoEntry);
        documentBackgrounds.push(`Document: ${document.filename}`);
      }
    }

    if (entriesWithAnnotations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid knowledge entries or documents found' },
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
        `Generated from ${entriesWithAnnotations.length} sources using ${validTemplateType} template`;

      const prompt = await createPrompt({
        userId: String(user.userId),
        title: promptTitle,
        description: promptDescription,
        content: generatedContent,
        templateType: validTemplateType,
        sourceKnowledgeIds: mergedSourceKnowledgeIds,
        sourceDocumentIds: mergedSourceDocumentIds,
        basePromptId: basePromptId || undefined,
        tagIds,
      });

      result.prompt = prompt;
    }

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'generate prompt');
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
