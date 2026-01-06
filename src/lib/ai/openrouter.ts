// OpenRouter API client using official SDK

import { OpenRouter } from '@openrouter/sdk';
import { AnnotationLevel } from '@/types';

const DEFAULT_MODEL = 'qwen/qwen3-235b-a22b-2507';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// Create OpenRouter client singleton
function getOpenRouterClient(): OpenRouter {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  return new OpenRouter({
    apiKey,
  });
}

/**
 * Send a chat completion request to OpenRouter using official SDK
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const openrouter = getOpenRouterClient();

  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 2000;

  console.log(`[OpenRouter] Sending request to ${model}...`);

  try {
    const response = await openrouter.chat.send({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      maxTokens,
    });

    console.log(`[OpenRouter] Response received. Tokens: ${response.usage?.totalTokens || 'unknown'}`);

    // Extract content from response
    const choice = response.choices?.[0];
    if (!choice) {
      throw new Error('No choices in OpenRouter response');
    }

    const content = choice.message?.content;

    if (!content) {
      throw new Error('No content in OpenRouter response');
    }

    // Handle content that could be string or array
    if (typeof content === 'string') {
      return content;
    }

    // If content is an array, extract text from each item
    if (Array.isArray(content)) {
      return content
        .filter((item): item is { type: 'text'; text: string } =>
          item && typeof item === 'object' && 'type' in item && item.type === 'text' && 'text' in item
        )
        .map(item => item.text)
        .join('');
    }

    throw new Error('Unexpected content format in OpenRouter response');
  } catch (error) {
    console.error('[OpenRouter] API error:', error);
    throw error;
  }
}

/**
 * Send a streaming chat completion request to OpenRouter
 * Returns an async generator that yields content chunks
 */
export async function* chatCompletionStream(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): AsyncGenerator<string, void, unknown> {
  const openrouter = getOpenRouterClient();

  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 2000;

  console.log(`[OpenRouter] Starting stream request to ${model}...`);

  const stream = await openrouter.chat.send({
    model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature,
    maxTokens,
    stream: true,
  });

  // Handle streaming response
  // The SDK returns an async iterator for streaming
  if (Symbol.asyncIterator in stream) {
    for await (const chunk of stream as AsyncIterable<{ choices?: { delta?: { content?: string } }[] }>) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } else {
    // Fallback if it's not a stream (shouldn't happen with stream: true)
    const response = stream as { choices?: { message?: { content?: string | unknown[] } }[] };
    const content = response.choices?.[0]?.message?.content;
    if (typeof content === 'string') {
      yield content;
    }
  }

  console.log('[OpenRouter] Stream completed');
}

/**
 * Parse JSON from a potentially markdown-wrapped response
 */
export function parseJsonResponse<T>(response: string): T {
  // Try to extract JSON from markdown code blocks
  const jsonBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    return JSON.parse(jsonBlockMatch[1].trim());
  }

  // Try to find a JSON array or object
  const jsonMatch = response.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // Try parsing the whole response
  return JSON.parse(response);
}

/**
 * Parsed knowledge item from Markdown extraction response
 */
export interface ParsedMarkdownItem {
  level: AnnotationLevel;
  location: string;
  background: string;
  originalComment: string;
  refinedComment: string;
}

/**
 * Parse Markdown extraction response into structured knowledge items
 *
 * Expected format:
 * ## Document Context
 * ...
 * ---
 * ## MACRO Annotations
 * ### 1. [Title]
 * **Text referred to**:
 * > [quoted text]
 * **Expert comment**:
 * > [original annotation]
 * **Contextualized**: [interpretation]
 * ---
 *
 * This parser handles the new annotation-by-level format.
 */
export function parseMarkdownExtractionResponse(
  response: string,
  originalAnnotations: { level: AnnotationLevel; content: string; lineNumber?: number }[]
): ParsedMarkdownItem[] {
  const results: ParsedMarkdownItem[] = [];

  console.log(`[Markdown Parser] Parsing response of ${response.length} chars`);

  // Extract Document Context section for background info
  const documentContextMatch = response.match(/## Document Context\s*\n([\s\S]*?)(?=\n---|\n## 🔴|\n## 🟡|\n## 🟢|$)/i);
  const documentContext = documentContextMatch ? documentContextMatch[1].trim() : '';

  // Parse each level section
  const levels: { marker: string; level: AnnotationLevel }[] = [
    { marker: '🔴 MACRO', level: 'MACRO' },
    { marker: '🟡 MESO', level: 'MESO' },
    { marker: '🟢 MICRO', level: 'MICRO' },
  ];

  for (const { marker, level } of levels) {
    // Find the section for this level
    const sectionPattern = new RegExp(`## ${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} Annotations\\s*\\n([\\s\\S]*?)(?=\\n## 🔴|\\n## 🟡|\\n## 🟢|$)`, 'i');
    const sectionMatch = response.match(sectionPattern);

    if (!sectionMatch) {
      // Try without emoji
      const plainPattern = new RegExp(`## ${level} Annotations\\s*\\n([\\s\\S]*?)(?=\\n## MACRO|\\n## MESO|\\n## MICRO|$)`, 'i');
      const plainMatch = response.match(plainPattern);
      if (plainMatch) {
        parseAnnotationSection(plainMatch[1], level, documentContext, results);
      }
      continue;
    }

    parseAnnotationSection(sectionMatch[1], level, documentContext, results);
  }

  console.log(`[Markdown Parser] Parsed ${results.length} items from response`);

  // If parsing failed to produce results, try legacy format
  if (results.length === 0) {
    console.log('[Markdown Parser] Trying legacy format...');
    return parseLegacyFormat(response, originalAnnotations);
  }

  // If we got fewer results than annotations, supplement with fallbacks
  if (results.length < originalAnnotations.length) {
    console.warn(`[Markdown Parser] Only ${results.length} of ${originalAnnotations.length} annotations were parsed`);

    // Find which annotations weren't parsed and add fallbacks
    const parsedCount = results.length;
    for (let i = parsedCount; i < originalAnnotations.length; i++) {
      const ann = originalAnnotations[i];
      results.push({
        level: ann.level,
        location: ann.lineNumber ? `Line ${ann.lineNumber}` : `Annotation ${i + 1}`,
        background: documentContext || 'Context not available from AI response',
        originalComment: ann.content,
        refinedComment: ann.content,
      });
    }
  }

  return results;
}

/**
 * Parse a single level section (MACRO, MESO, or MICRO)
 */
function parseAnnotationSection(
  sectionText: string,
  level: AnnotationLevel,
  documentContext: string,
  results: ParsedMarkdownItem[]
): void {
  // Split by ### N. pattern to get individual annotations
  const annotationBlocks = sectionText.split(/(?=### \d+\.)/).filter(block => block.trim());

  for (const block of annotationBlocks) {
    // Extract title from ### N. [title]
    const titleMatch = block.match(/### \d+\.\s*(.+?)(?=\n|$)/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract "Text referred to" - the quoted document text
    const textReferredMatch = block.match(/\*\*Text referred to\*\*:\s*\n?>?\s*([\s\S]*?)(?=\*\*Expert comment\*\*|\*\*Contextualized\*\*|$)/i);
    let textReferred = '';
    if (textReferredMatch) {
      textReferred = textReferredMatch[1].trim()
        .replace(/^>\s*/gm, '') // Remove blockquote markers
        .trim();
    }

    // Extract "Expert comment" - the original annotation
    const expertCommentMatch = block.match(/\*\*Expert comment\*\*:\s*\n?>?\s*([\s\S]*?)(?=\*\*Contextualized\*\*|---|$)/i);
    let expertComment = '';
    if (expertCommentMatch) {
      expertComment = expertCommentMatch[1].trim()
        .replace(/^>\s*/gm, '') // Remove blockquote markers
        .trim();
    }

    // Extract "Contextualized" - the interpretation
    const contextualizedMatch = block.match(/\*\*Contextualized\*\*:\s*([\s\S]*?)(?=---|### \d+\.|$)/i);
    let contextualized = '';
    if (contextualizedMatch) {
      contextualized = contextualizedMatch[1].trim();
    }

    // Only add if we have meaningful content
    if (expertComment || textReferred) {
      // Build background from document context + specific text referred to
      let background = '';
      if (documentContext) {
        background = documentContext + '\n\n';
      }
      if (title) {
        background += `**Topic**: ${title}\n\n`;
      }
      if (textReferred) {
        background += `**Text referred to**:\n> ${textReferred}`;
      }

      results.push({
        level,
        location: title || `${level} annotation`,
        background: background.trim() || 'No context available',
        originalComment: expertComment || textReferred,
        refinedComment: contextualized || expertComment || textReferred,
      });
    }
  }
}

/**
 * Parse legacy format (## Item N structure)
 */
function parseLegacyFormat(
  response: string,
  originalAnnotations: { level: AnnotationLevel; content: string; lineNumber?: number }[]
): ParsedMarkdownItem[] {
  const results: ParsedMarkdownItem[] = [];

  // Strategy 1: Split by ## Item N or ## Knowledge Item N headers
  const headerPattern = /(?=\n##\s*(?:Knowledge\s*)?Item\s*\d+)|(?=^##\s*(?:Knowledge\s*)?Item\s*\d+)/gim;
  let items = response.split(headerPattern).filter(item => item.trim());

  console.log(`[Markdown Parser] Legacy Strategy 1 (## Item N): found ${items.length} items`);

  // Strategy 2: If still not enough, try splitting by --- separators
  if (items.length < originalAnnotations.length) {
    const separatorItems = response.split(/\n---+\n/).filter(item => item.trim());
    if (separatorItems.length > items.length) {
      items = separatorItems;
      console.log(`[Markdown Parser] Legacy Strategy 2 (---): found ${items.length} items`);
    }
  }

  // If still no items, treat the entire response as a single item
  if (items.length === 0 && response.trim()) {
    items = [response];
    console.log(`[Markdown Parser] Legacy Fallback: treating entire response as 1 item`);
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const parsed = parseLegacyMarkdownItem(item, i, originalAnnotations);
    if (parsed) {
      results.push(parsed);
    }
  }

  console.log(`[Markdown Parser] Legacy format: parsed ${results.length} items`);

  // If parsing failed to produce results, create fallback items from original annotations
  if (results.length === 0 && originalAnnotations.length > 0) {
    console.warn('[Markdown Parser] No items parsed, using fallback from original annotations');
    return originalAnnotations.map((ann, index) => ({
      level: ann.level,
      location: ann.lineNumber ? `Line ${ann.lineNumber}` : `Annotation ${index + 1}`,
      background: 'Context not available from AI response',
      originalComment: ann.content,
      refinedComment: ann.content,
    }));
  }

  return results;
}

/**
 * Parse a single legacy markdown item block
 */
function parseLegacyMarkdownItem(
  itemText: string,
  index: number,
  originalAnnotations: { level: AnnotationLevel; content: string; lineNumber?: number }[]
): ParsedMarkdownItem | null {
  if (!itemText.trim()) {
    return null;
  }

  // Extract Level - try multiple patterns for flexibility
  const levelPatterns = [
    /\*\*Level:\*\*\s*(MACRO|MESO|MICRO)/i,
    /Level:\s*(MACRO|MESO|MICRO)/i,
    /\[?(MACRO|MESO|MICRO)\]?/i,
  ];

  let level: AnnotationLevel = 'MACRO';
  for (const pattern of levelPatterns) {
    const match = itemText.match(pattern);
    if (match) {
      level = match[1].toUpperCase() as AnnotationLevel;
      break;
    }
  }

  // If no level found but we have original annotation, use that
  if (originalAnnotations[index]) {
    level = originalAnnotations[index].level;
  }

  // Extract Location
  const locationPatterns = [
    /\*\*Location:\*\*\s*(.+?)(?=\n|$)/i,
    /Location:\s*(.+?)(?=\n|$)/i,
  ];

  let location = `Annotation ${index + 1}`;
  for (const pattern of locationPatterns) {
    const match = itemText.match(pattern);
    if (match) {
      location = match[1].trim();
      break;
    }
  }

  // If we have original annotation with line number, use that as fallback
  if (location === `Annotation ${index + 1}` && originalAnnotations[index]?.lineNumber) {
    location = `Line ${originalAnnotations[index].lineNumber}`;
  }

  // Extract Context/Background section (prefer Context for new format)
  const background = extractSection(itemText, 'Context') ||
                     extractSection(itemText, 'Background') ||
                     'No context provided';

  // Extract Original Comment section
  let originalComment = extractSection(itemText, 'Original Comment') ||
                        extractSection(itemText, 'Original') ||
                        '';

  // If no original comment found, use the original annotation content
  if (!originalComment && originalAnnotations[index]) {
    originalComment = originalAnnotations[index].content;
  }

  // Extract Refined Comment/Insight section (support both old and new format)
  const refinedComment = extractSection(itemText, 'Refined Insight') ||
                         extractSection(itemText, 'Refined Comment') ||
                         extractSection(itemText, 'Refined') ||
                         extractSection(itemText, 'Improved') ||
                         originalComment; // Fallback to original if no refined found

  // Only return if we have meaningful content
  if (!originalComment && !refinedComment) {
    return null;
  }

  return {
    level,
    location,
    background,
    originalComment,
    refinedComment,
  };
}

/**
 * Extract content from a markdown section
 * Handles both ### Section and **Section:** formats
 */
function extractSection(text: string, sectionName: string): string | null {
  // Try ### Section format first
  const headerPattern = new RegExp(
    `###\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=###|\\*\\*[A-Z]|\\n---+|$)`,
    'i'
  );
  const headerMatch = text.match(headerPattern);
  if (headerMatch && headerMatch[1].trim()) {
    return cleanSectionContent(headerMatch[1]);
  }

  // Try **Section:** format
  const boldPattern = new RegExp(
    `\\*\\*${sectionName}:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[A-Z]|###|\\n---+|$)`,
    'i'
  );
  const boldMatch = text.match(boldPattern);
  if (boldMatch && boldMatch[1].trim()) {
    return cleanSectionContent(boldMatch[1]);
  }

  // Try plain Section: format
  const plainPattern = new RegExp(
    `${sectionName}:\\s*([\\s\\S]*?)(?=\\n[A-Z][a-z]+:|###|\\n---+|$)`,
    'i'
  );
  const plainMatch = text.match(plainPattern);
  if (plainMatch && plainMatch[1].trim()) {
    return cleanSectionContent(plainMatch[1]);
  }

  return null;
}

/**
 * Clean up section content by removing leading/trailing whitespace
 * and normalizing line breaks
 */
function cleanSectionContent(content: string): string {
  return content
    .trim()
    .replace(/^\n+/, '')  // Remove leading newlines
    .replace(/\n+$/, '')  // Remove trailing newlines
    .replace(/\n{3,}/g, '\n\n');  // Normalize multiple newlines
}

/**
 * Get available models info (for debugging)
 */
export async function getModels(): Promise<unknown[]> {
  const openrouter = getOpenRouterClient();

  try {
    const response = await openrouter.models.list();
    return response.data || [];
  } catch (error) {
    console.error('[OpenRouter] Failed to fetch models:', error);
    throw error;
  }
}
