import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getDocumentById } from '@/lib/db/queries/documents';
import { createKnowledgeEntry, getKnowledgeEntryWithAnnotations, AnnotationData } from '@/lib/db/queries/knowledge';
import { extractKnowledge, ExtractionResult, ExtractionResponse } from '@/lib/ai/extraction';
import { extractAnnotations } from '@/lib/utils/annotation';

/**
 * POST /api/knowledge/extract
 * Extract knowledge from an annotated document using AI
 *
 * The AI returns results in Markdown format with:
 * - Background: Context around the annotation
 * - Original Comment: Verbatim annotation text
 * - Refined Comment: AI-improved version
 * - Level: MACRO/MESO/MICRO
 * - Location: Where in document this appeared
 *
 * Request body:
 * {
 *   documentId: string,          // Required: ID of the document to extract from
 *   tagIds?: number[],           // Optional: Tags to assign to the knowledge entry
 *   background?: string,         // Optional: Custom background, defaults to document filename
 *   refineAnnotations?: boolean, // Optional: Whether to refine annotations with AI (default: true)
 *   customInstructions?: string  // Optional: Custom instructions to guide the AI extraction
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      documentId,
      tagIds,
      background: customBackground,
      refineAnnotations = true,
      customInstructions,
    } = body;

    // Validate documentId
    if (!documentId || typeof documentId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Get the document
    const document = await getDocumentById(documentId);
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check document has annotations (status should not be 'raw')
    if (document.status === 'raw') {
      return NextResponse.json(
        { success: false, error: 'Document has no annotations to extract. Please add annotations first.' },
        { status: 400 }
      );
    }

    // Extract annotations from document content
    const parsedAnnotations = extractAnnotations(document.content);

    if (parsedAnnotations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No annotations found in document' },
        { status: 400 }
      );
    }

    // Prepare the background text for the knowledge entry
    const entryBackground = customBackground?.trim() || `Extracted from: ${document.filename}`;

    // Use document tags if no custom tags provided
    const entryTagIds: number[] = tagIds || document.tags.map(t => t.id);

    let annotations: AnnotationData[];
    let metadata: ExtractionResponse['metadata'] | undefined;

    if (refineAnnotations) {
      // Use AI to refine annotations with full document context
      // The new extraction system uses two phases:
      // 1. Document analysis to understand overall structure and purpose
      // 2. Context-aware annotation processing with surrounding text
      const extractionInput = {
        documentContent: document.content,  // Full document for analysis
        documentBackground: entryBackground,
        annotations: parsedAnnotations.map(a => ({
          level: a.level,
          content: a.content,
          surroundingContext: a.surroundingContext,  // Context around each annotation
          lineNumber: a.line,
        })),
        customInstructions: customInstructions?.trim() || undefined,
      };

      // Extract knowledge with AI - returns metadata about the extraction process
      const extractionResponse: ExtractionResponse = await extractKnowledge(extractionInput);
      const { results: extractionResults, metadata: extractionMetadata } = extractionResponse;
      metadata = extractionMetadata;

      console.log(`[Extract API] AI returned ${extractionResults.length} refined annotations with context`);

      // Log if fallback was used
      if (extractionMetadata.usedFallback) {
        console.warn(`[Extract API] ⚠ AI refinement failed, using fallback annotations. Reason: ${extractionMetadata.fallbackReason}`);
      } else if (extractionMetadata.usedDatabaseTemplate) {
        console.log('[Extract API] ✓ Used database template (user-configured)');
      }

      // Map extraction results to annotation data
      // The new format includes: level, location, background, originalComment, refinedComment
      annotations = extractionResults.map((result, index) => {
        const originalAnnotation = parsedAnnotations[index];
        return {
          level: result.level || originalAnnotation?.level || 'MACRO',
          originalText: result.originalComment || originalAnnotation?.content || '',
          comment: originalAnnotation?.content || result.originalComment || '',
          refinedComment: result.refinedComment,
          location: result.location,
          backgroundContext: result.background,
          positionLine: originalAnnotation?.line,
          positionChar: originalAnnotation?.char,
        };
      });
    } else {
      // Use annotations as-is without AI refinement
      annotations = parsedAnnotations.map((ann, index) => ({
        level: ann.level,
        originalText: ann.content,
        comment: ann.content,
        refinedComment: undefined,
        location: ann.line ? `Line ${ann.line}` : `Annotation ${index + 1}`,
        backgroundContext: undefined,
        positionLine: ann.line,
        positionChar: ann.char,
      }));
    }

    // Create the knowledge entry
    const entry = await createKnowledgeEntry({
      sourceDocumentId: documentId,
      background: entryBackground,
      tagIds: entryTagIds,
      annotations,
    });

    // Fetch the complete entry with annotations
    const completeEntry = await getKnowledgeEntryWithAnnotations(entry.id);

    // Prepare response with extraction metadata
    const response: any = {
      success: true,
      entry: completeEntry,
      count: annotations.length,
      extractionSummary: {
        documentId,
        documentFilename: document.filename,
        annotationsExtracted: annotations.length,
        refined: refineAnnotations,
      },
    };

    // Add warning if AI fallback was used
    if (refineAnnotations && metadata && metadata.usedFallback) {
      response.warning = 'AI refinement failed - showing original annotations without AI enhancement';
      response.metadata = {
        usedFallback: true,
        fallbackReason: metadata.fallbackReason,
      };
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[API] POST /knowledge/extract error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
