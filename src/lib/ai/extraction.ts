// Knowledge extraction agent - Context-aware extraction system

import { chatCompletion, parseMarkdownExtractionResponse } from './openrouter';
import { AnnotationLevel } from '@/types';
import { getDefaultTemplate } from '@/lib/db/queries/promptTemplates';

/**
 * System prompt for knowledge extraction.
 * Uses chain-of-thought: first analyze document, then for each annotation find the relevant text.
 *
 * IMPORTANT: This prompt is designed to produce a specific markdown output structure
 * that can be parsed for web display.
 */
const KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT = `You are an expert knowledge extraction specialist. Your task is to transform expert annotations from a document into structured, reusable knowledge entries.

## YOUR PROCESS

1. **First, analyze the document** to understand:
   - What type of document is this? (research paper, essay, proposal, etc.)
   - What is the main argument or purpose?
   - How is it structured?
   - What are the key themes?

2. **Then, for each annotation**, find the ACTUAL TEXT from the document that the expert is commenting on. This is critical - you must quote the real text, not describe it generically.

3. **Provide contextualized interpretations** that stay close to the expert's words while making the insight transferable.

## OUTPUT FORMAT

You MUST output in this EXACT markdown format:

\`\`\`markdown
## Document Context

**Source**: [filename or document identifier]

**Document Type**: [e.g., Academic paper introduction, Research proposal, Literature review, etc.]

**Summary**: [2-3 sentences explaining what this document is about, its main argument/purpose]

**Structure**: [Brief outline of how the document flows - what comes first, second, etc.]

**Key Themes**: [List the main themes/topics discussed]

---

## 🔴 MACRO Annotations

### 1. [Brief title describing what this comment addresses]

**Text referred to**:
> [Actual quoted text from document that the expert is commenting on - sufficient context to understand the comment, typically 1-3 sentences]

**Expert comment**:
> [The original annotation text]

**Contextualized**: [1-2 sentences interpreting what the expert means, staying close to their words]

---

### 2. [Next MACRO annotation title]

**Text referred to**:
> [Quoted text]

**Expert comment**:
> [Original annotation]

**Contextualized**: [Interpretation]

---

## 🟡 MESO Annotations

### 1. [Brief title]

**Text referred to**:
> [Quoted text from document]

**Expert comment**:
> [Original annotation]

**Contextualized**: [Interpretation]

---

## 🟢 MICRO Annotations

### 1. [Brief title]

**Text referred to**:
> [Quoted text from document]

**Expert comment**:
> [Original annotation]

**Contextualized**: [Interpretation]

---
\`\`\`

## CRITICAL REQUIREMENTS

1. **Document Context MUST be detailed** - Explain what the document is actually about, not generic descriptions
2. **"Text referred to" MUST quote ACTUAL text** from the document, not generic descriptions like "the introduction section"
3. **Quoted text must be SUFFICIENT** to understand the comment (typically 1-3 sentences)
4. **"Contextualized" stays close to expert's words** - Brief interpretation only, do not over-explain
5. **Use proper markdown**: \`>\` for blockquotes, \`**\` for bold, \`---\` for separators
6. **Group annotations by level** (MACRO first, then MESO, then MICRO)
7. **Number annotations within each level** starting from 1
8. **Include ALL annotations** - do not skip any

## ANNOTATION LEVELS

- **MACRO (🔴)**: High-level principles affecting document structure, argumentation, or overall approach
- **MESO (🟡)**: Pattern-level guidance about sections, paragraphs, or methodological elements
- **MICRO (🟢)**: Specific edits, word choices, sentence-level improvements`;

export interface ExtractionInput {
  documentContent: string;           // Full document content for analysis
  documentBackground: string;        // User-provided background or filename
  annotations: {
    level: AnnotationLevel;
    content: string;
    surroundingContext: string;      // Text around the annotation
    lineNumber?: number;
  }[];
  customInstructions?: string;
  templateId?: string;
}

// Result from AI extraction (parsed from Markdown)
export interface ExtractionResult {
  level: AnnotationLevel;
  location: string;
  background: string;
  originalComment: string;
  refinedComment: string;
}

// Legacy result format for backward compatibility
export interface LegacyExtractionResult {
  original: string;
  refined: string;
  isUniversal: boolean;
  reasoning: string;
}

/**
 * Get the system prompt for extraction
 * Uses the knowledge extraction prompt, optionally with custom instructions
 */
async function getExtractionSystemPrompt(customInstructions?: string): Promise<string> {
  // Use the knowledge extraction prompt as the base
  let basePrompt = KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT;

  // Try to get custom template from database (if user has customized it)
  try {
    const template = await getDefaultTemplate('extraction');
    if (template && template.content.includes('## Document Context')) {
      // Only use database template if it's compatible with new format
      basePrompt = template.content;
    }
  } catch (error) {
    console.warn('[Extraction] Failed to load template from database, using default:', error);
  }

  // Append custom instructions if provided
  if (customInstructions?.trim()) {
    return `${basePrompt}

---
ADDITIONAL INSTRUCTIONS FROM USER:
${customInstructions.trim()}
---`;
  }

  return basePrompt;
}

/**
 * Build the user prompt with full document content and annotations
 */
function buildUserPrompt(input: ExtractionInput): string {
  // Group annotations by level for the prompt
  const macroAnnotations = input.annotations.filter(a => a.level === 'MACRO');
  const mesoAnnotations = input.annotations.filter(a => a.level === 'MESO');
  const microAnnotations = input.annotations.filter(a => a.level === 'MICRO');

  const formatAnnotationList = (annotations: typeof input.annotations, level: string) => {
    if (annotations.length === 0) return `No ${level} annotations.`;
    return annotations.map((a, i) => `
${i + 1}. **Line ${a.lineNumber || 'unknown'}**: "${a.content}"
   Surrounding text: "${a.surroundingContext.substring(0, 200)}..."`).join('\n');
  };

  return `## DOCUMENT TO ANALYZE

### Source Information
${input.documentBackground}

### Full Document Content
\`\`\`
${input.documentContent}
\`\`\`

---

## ANNOTATIONS TO PROCESS

### MACRO Annotations (${macroAnnotations.length} total)
${formatAnnotationList(macroAnnotations, 'MACRO')}

### MESO Annotations (${mesoAnnotations.length} total)
${formatAnnotationList(mesoAnnotations, 'MESO')}

### MICRO Annotations (${microAnnotations.length} total)
${formatAnnotationList(microAnnotations, 'MICRO')}

---

## YOUR TASK

1. First, read the FULL document carefully to understand its content, structure, and purpose.

2. Create a detailed Document Context section that explains what this document is actually about.

3. For EACH annotation:
   - Find the ACTUAL TEXT from the document that the expert is commenting on
   - Quote that text in the "Text referred to" field (1-3 sentences typically)
   - Include the original expert comment
   - Provide a brief contextualized interpretation

4. Output in the exact markdown format specified in the system prompt.

IMPORTANT:
- Quote REAL text from the document, not generic descriptions
- Include ALL ${input.annotations.length} annotations
- Group by level: MACRO first, then MESO, then MICRO`;
}

/**
 * Extract knowledge from annotations using AI
 *
 * Single-pass extraction process:
 * - Send the full document content to the LLM
 * - LLM analyzes document and finds actual text for each annotation
 * - Returns structured markdown with document context and annotated insights
 */
export async function extractKnowledge(input: ExtractionInput): Promise<ExtractionResult[]> {
  if (input.annotations.length === 0) {
    return [];
  }

  console.log(`[Extraction] Starting knowledge extraction for ${input.annotations.length} annotations`);

  // Get the system prompt (with optional custom instructions)
  const systemPrompt = await getExtractionSystemPrompt(input.customInstructions);

  // Build the user prompt with full document content
  const userPrompt = buildUserPrompt(input);

  // Calculate token budget based on document and annotation count
  // Longer documents and more annotations need more output tokens
  const estimatedInputTokens = (input.documentContent.length + userPrompt.length) / 4;
  const annotationCount = input.annotations.length;
  const maxTokens = Math.min(16000, Math.max(4000, 2000 + annotationCount * 500));

  console.log(`[Extraction] Estimated input tokens: ${Math.round(estimatedInputTokens)}, max output tokens: ${maxTokens}`);

  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, maxTokens }
    );

    console.log(`[Extraction] Response received: ${response.length} chars`);

    // Parse the markdown response into structured results
    const results = parseMarkdownExtractionResponse(response, input.annotations);

    console.log(`[Extraction] Parsed ${results.length} knowledge items`);

    return results;
  } catch (error) {
    console.error('[Extraction] Failed:', error);

    // Return fallback results from original annotations
    return input.annotations.map((a, index) => ({
      level: a.level,
      location: a.lineNumber ? `Line ${a.lineNumber}` : `Annotation ${index + 1}`,
      background: `${input.documentBackground}\n\nSurrounding text:\n${a.surroundingContext.substring(0, 500)}`,
      originalComment: a.content,
      refinedComment: a.content,
    }));
  }
}

/**
 * Refine a single annotation (for real-time use)
 * Returns both the refined text and a brief background context
 */
export async function refineAnnotation(
  content: string,
  level: AnnotationLevel,
  context?: string
): Promise<{ refined: string; background: string }> {
  const prompt = `Refine this ${level} annotation into a clearer, more actionable knowledge entry.

Original annotation: ${content}
${context ? `Document context: "${context}"` : ''}

Provide:
1. A refined version that preserves the original meaning but is clearer and more broadly applicable
2. A brief background describing when/where this insight applies

Output in this format:
### Background
[Brief context about when this knowledge applies]

### Refined Comment
[Your improved version]`;

  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: 'You are a knowledge refinement specialist. Improve annotations while preserving their original insight and expert voice.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.3, maxTokens: 500 }
    );

    // Parse the simple markdown response
    const backgroundMatch = response.match(/###\s*Background\s*\n([\s\S]*?)(?=###|$)/i);
    const refinedMatch = response.match(/###\s*Refined Comment\s*\n([\s\S]*?)(?=###|$)/i);

    return {
      refined: refinedMatch ? refinedMatch[1].trim() : content,
      background: backgroundMatch ? backgroundMatch[1].trim() : context || '',
    };
  } catch {
    return { refined: content, background: context || '' };
  }
}
