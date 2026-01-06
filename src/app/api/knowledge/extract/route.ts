import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getDocumentById } from '@/lib/db/queries/documents';
import { createKnowledgeEntry, getKnowledgeEntryWithAnnotations } from '@/lib/db/queries/knowledge';
import { extractKnowledge, ExtractionResult } from '@/lib/ai/extraction';
import { extractAnnotations } from '@/lib/utils/annotation';
import { AnnotationLevel } from '@/types';

/**
 * POST /api/knowledge/extract
 * Extract knowledge from an annotated document using AI
 *
 * Request body:
 * {
 *   documentId: string,          // Required: ID of the document to extract from
 *   tagIds?: number[],           // Optional: Tags to assign to the knowledge entry
 *   background?: string,         // Optional: Custom background, defaults to document filename
 *   refineAnnotations?: boolean  // Optional: Whether to refine annotations with AI (default: true)
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

    // Check document has annotations
    if (document.status !== 'annotated' && document.status !== 'refined') {
      return NextResponse.json(
        { success: false, error: 'Document has no annotations to extract' },
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

    // Prepare the background text
    const background = customBackground?.trim() || `Extracted from: ${document.filename}`;

    // Use document tags if no custom tags provided
    const entryTagIds: number[] = tagIds || document.tags.map(t => t.id);

    let annotations: {
      level: AnnotationLevel;
      originalText: string;
      comment: string;
      refinedComment?: string;
      positionLine?: number;
      positionChar?: number;
    }[];

    if (refineAnnotations) {
      // Use AI to refine annotations
      const extractionInput = {
        documentBackground: background,
        annotations: parsedAnnotations.map(a => ({
          level: a.level,
          content: a.content,
        })),
      };

      let extractionResults: ExtractionResult[];
      try {
        extractionResults = await extractKnowledge(extractionInput);
      } catch (aiError) {
        console.error('[Extract API] AI extraction failed:', aiError);
        // Fall back to unrefined annotations
        extractionResults = parsedAnnotations.map(a => ({
          original: a.content,
          refined: a.content,
          isUniversal: false,
          reasoning: 'AI extraction unavailable',
        }));
      }

      // Map extraction results to annotation data
      annotations = parsedAnnotations.map((ann, index) => {
        const result = extractionResults[index];
        return {
          level: ann.level,
          originalText: result?.original || ann.content,
          comment: ann.content,
          refinedComment: result?.refined,
          positionLine: undefined, // Position in original doc, not needed in knowledge entry
          positionChar: undefined,
        };
      });
    } else {
      // Use annotations as-is without AI refinement
      annotations = parsedAnnotations.map(ann => ({
        level: ann.level,
        originalText: ann.content,
        comment: ann.content,
        refinedComment: undefined,
        positionLine: undefined,
        positionChar: undefined,
      }));
    }

    // Create the knowledge entry
    const entry = await createKnowledgeEntry({
      sourceDocumentId: documentId,
      background,
      tagIds: entryTagIds,
      annotations,
    });

    // Fetch the complete entry with annotations
    const completeEntry = await getKnowledgeEntryWithAnnotations(entry.id);

    return NextResponse.json(
      {
        success: true,
        entry: completeEntry,
        extractionSummary: {
          documentId,
          documentFilename: document.filename,
          annotationsExtracted: annotations.length,
          refined: refineAnnotations,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] POST /knowledge/extract error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
