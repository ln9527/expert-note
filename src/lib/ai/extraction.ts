// Knowledge extraction agent

import { chatCompletion, parseJsonResponse } from './openrouter';
import { AnnotationLevel } from '@/types';

const EXTRACTION_SYSTEM_PROMPT = `You are a knowledge extraction specialist. Your task is to transform expert annotations from documents into structured, reusable knowledge entries.

For each annotation, you will:
1. Preserve the original meaning and intent
2. Remove context-specific dependencies (names, specific examples that are too narrow)
3. Generalize the insight into a reusable principle
4. Classify whether the knowledge is universal (applies broadly) or situational (applies to specific contexts)
5. Optimize the language for clarity while maintaining the expert's voice

Output a JSON array with one object per annotation:
[
  {
    "original": "the original annotation text",
    "refined": "the refined, generalized version",
    "isUniversal": true or false,
    "reasoning": "brief explanation of refinement decisions"
  }
]

Guidelines by level:
- MACRO: Extract high-level, transferable principles. Remove specific domain references where possible.
- MESO: Identify pattern-level guidance. Generalize the structure while preserving the insight.
- MICRO: Convert specific edits to generalizable suggestions. Keep actionable but broaden applicability.

IMPORTANT: Return ONLY valid JSON, no additional text.`;

export interface ExtractionInput {
  documentBackground: string;
  annotations: {
    level: AnnotationLevel;
    content: string;
    contextText?: string;
  }[];
}

export interface ExtractionResult {
  original: string;
  refined: string;
  isUniversal: boolean;
  reasoning: string;
}

/**
 * Extract knowledge from annotations using AI
 */
export async function extractKnowledge(input: ExtractionInput): Promise<ExtractionResult[]> {
  if (input.annotations.length === 0) {
    return [];
  }

  const userPrompt = `Document Background:
${input.documentBackground}

Annotations to process (${input.annotations.length} total):
${input.annotations.map((a, i) => `
${i + 1}. [${a.level}]
Content: ${a.content}
${a.contextText ? `Context: "${a.contextText}"` : ''}
`).join('\n')}

Process each annotation and return a JSON array of extraction results.`;

  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3 } // Lower temperature for consistency
    );

    return parseJsonResponse<ExtractionResult[]>(response);
  } catch (error) {
    console.error('[Extraction] Failed to extract knowledge:', error);

    // Return original annotations as fallback
    return input.annotations.map(a => ({
      original: a.content,
      refined: a.content,
      isUniversal: false,
      reasoning: 'Extraction failed - using original content',
    }));
  }
}

/**
 * Refine a single annotation (for real-time use)
 */
export async function refineAnnotation(
  content: string,
  level: AnnotationLevel,
  context?: string
): Promise<{ refined: string; isUniversal: boolean }> {
  const prompt = `Refine this ${level} annotation into a reusable knowledge entry.

Original: ${content}
${context ? `Context: "${context}"` : ''}

Return JSON: {"refined": "...", "isUniversal": true/false}`;

  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.3, maxTokens: 500 }
    );

    return parseJsonResponse<{ refined: string; isUniversal: boolean }>(response);
  } catch {
    return { refined: content, isUniversal: false };
  }
}
