import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getDocumentById } from '@/lib/db/queries/documents';
import { createKnowledgeEntry, getKnowledgeEntryById } from '@/lib/db/queries/knowledge';
import { extractKnowledge, ExtractionResponse } from '@/lib/ai/extraction';
import { extractAnnotations } from '@/lib/utils/annotation';
import { OpenRouterError } from '@/lib/ai/openrouter';

/**
 * POST /api/knowledge/extract
 * Extract knowledge from an annotated document using AI
 *
 * The AI returns raw markdown which is stored directly in the knowledge entry's
 * `content` field. This preserves the full LLM output without lossy parsing.
 *
 * Request body:
 * {
 *   documentId: string,          // Required: ID of the document to extract from
 *   tagIds?: number[],           // Optional: Tags to assign to the knowledge entry
 *   background?: string,         // Optional: Custom background, defaults to document filename
 *   customInstructions?: string, // Optional: Custom instructions to guide the AI extraction
 *   templateId?: string          // Optional: Extraction guide/template ID to use
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
      customInstructions,
      templateId,
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

    // Use AI to extract knowledge - returns raw markdown content
    const extractionInput = {
      documentContent: document.content,
      documentBackground: entryBackground,
      annotations: parsedAnnotations.map(a => ({
        level: a.level,
        content: a.content,
        surroundingContext: a.surroundingContext,
        lineNumber: a.line,
      })),
      customInstructions: customInstructions?.trim() || undefined,
      templateId: templateId || undefined,
    };

    const extractionResponse: ExtractionResponse = await extractKnowledge(extractionInput);
    const { rawContent, metadata } = extractionResponse;

    console.log(`[Extract API] AI generated ${rawContent.length} chars of markdown content`);

    // Log template usage
    if (metadata.usedFallback) {
      console.warn(`[Extract API] ⚠ AI extraction failed, using fallback. Reason: ${metadata.fallbackReason}`);
    } else if (metadata.usedDatabaseTemplate) {
      console.log('[Extract API] ✓ Used database template (user-configured)');
    }

    // Create knowledge entry with raw markdown content (no annotation parsing)
    const entry = await createKnowledgeEntry({
      sourceDocumentId: documentId,
      background: entryBackground,
      content: rawContent,  // Store raw LLM markdown
      tagIds: entryTagIds,
      createdBy: user.userId,
    });

    // Fetch the complete entry
    const completeEntry = await getKnowledgeEntryById(entry.id);

    // Prepare response
    const response: {
      success: boolean;
      entry: typeof completeEntry;
      extractionSummary: {
        documentId: string;
        documentFilename: string;
        annotationCount: number;
        contentLength: number;
      };
      warning?: string;
      metadata?: { usedFallback: boolean; fallbackReason?: string };
    } = {
      success: true,
      entry: completeEntry,
      extractionSummary: {
        documentId,
        documentFilename: document.filename,
        annotationCount: parsedAnnotations.length,
        contentLength: rawContent.length,
      },
    };

    // Add warning if AI fallback was used
    if (metadata.usedFallback) {
      response.warning = 'AI extraction failed - using fallback markdown';
      response.metadata = {
        usedFallback: true,
        fallbackReason: metadata.fallbackReason,
      };
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[API] POST /knowledge/extract error:', error);

    // Handle OpenRouter API errors with specific messages
    if (error instanceof OpenRouterError) {
      console.error('[API] OpenRouter error code:', error.code);
      console.error('[API] OpenRouter error details:', error.details);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorCode: error.code,
          errorType: 'ai_service_error',
        },
        { status: 502 } // Bad Gateway for external service errors
      );
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes('database')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database error: ' + error.message,
          errorType: 'database_error',
        },
        { status: 500 }
      );
    }

    // Generic error with message preservation
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to extract knowledge: ' + errorMessage,
        errorType: 'internal_error',
      },
      { status: 500 }
    );
  }
}
