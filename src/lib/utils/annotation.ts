import { AnnotationLevel, LEVEL_CONFIG, ParsedAnnotation } from '@/types';

/**
 * Parse annotation markers from document content for database storage
 *
 * Annotation format: [[LEVEL: content]]
 * Levels: MACRO, MESO, MICRO
 *
 * Example: [[MACRO: This is a high-level observation]]
 */
export function parseAnnotations(content: string): ParsedAnnotation[] {
  const annotations: ParsedAnnotation[] = [];

  // Regular expression to match annotation markers
  // Format: [[LEVEL: content]]
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    let match;
    // Create a new regex instance for each line to avoid state issues
    const lineRegex = /\[\[(MACRO|MESO|MICRO):\s*(.+?)\]\]/gi;

    while ((match = lineRegex.exec(line)) !== null) {
      const level = match[1].toUpperCase() as 'MACRO' | 'MESO' | 'MICRO';
      const annotationContent = match[2].trim();
      const rawText = match[0];
      const charPosition = match.index;

      annotations.push({
        level,
        content: annotationContent,
        line: lineIndex + 1, // 1-indexed
        char: charPosition + 1, // 1-indexed
        rawText,
      });
    }
  });

  return annotations;
}

/**
 * Validate annotation content
 */
export function validateAnnotationContent(content: string): { valid: boolean; error?: string } {
  const trimmed = content.trim();

  if (!trimmed) {
    return { valid: false, error: 'Annotation content cannot be empty' };
  }

  if (trimmed.length < 3) {
    return { valid: false, error: 'Annotation must be at least 3 characters' };
  }

  if (trimmed.length > 2000) {
    return { valid: false, error: 'Annotation must be less than 2000 characters' };
  }

  return { valid: true };
}

/**
 * Format annotation with proper prefix
 */
export function formatAnnotation(level: AnnotationLevel, content: string): string {
  const trimmedContent = content.trim();
  // Format: [[LEVEL: content]]
  return ` [[${level}: ${trimmedContent}]]`;
}

/**
 * Insert annotation at cursor position (inline, right after cursor)
 */
export function insertAnnotation(
  text: string,
  cursorPosition: number,
  level: AnnotationLevel,
  annotationContent: string
): { newText: string; newCursorPosition: number } {
  const formattedAnnotation = formatAnnotation(level, annotationContent);

  // Insert annotation right at cursor position (inline)
  const newText = text.substring(0, cursorPosition) + formattedAnnotation + text.substring(cursorPosition);
  const newCursorPosition = cursorPosition + formattedAnnotation.length;

  return { newText, newCursorPosition };
}

/**
 * Count annotations by level in the document
 */
export function countAnnotations(text: string): { macro: number; meso: number; micro: number } {
  const macroRegex = /\[\[MACRO:/gi;
  const mesoRegex = /\[\[MESO:/gi;
  const microRegex = /\[\[MICRO:/gi;

  return {
    macro: (text.match(macroRegex) || []).length,
    meso: (text.match(mesoRegex) || []).length,
    micro: (text.match(microRegex) || []).length,
  };
}

/**
 * Extract surrounding context for an annotation based on its level
 * - MACRO: Gets broader context (more lines before/after)
 * - MESO: Gets medium context (a paragraph or section)
 * - MICRO: Gets immediate context (surrounding sentences)
 */
function extractSurroundingContext(
  lines: string[],
  lineIndex: number,
  level: AnnotationLevel
): string {
  // Define context window based on level
  const contextWindow = {
    MACRO: { before: 10, after: 10 },  // Broad document context
    MESO: { before: 5, after: 5 },     // Section/paragraph context
    MICRO: { before: 2, after: 2 },    // Immediate sentence context
  };

  const window = contextWindow[level];
  const startLine = Math.max(0, lineIndex - window.before);
  const endLine = Math.min(lines.length - 1, lineIndex + window.after);

  // Extract the context lines, removing annotation markers for cleaner context
  const contextLines = lines
    .slice(startLine, endLine + 1)
    .map(line => line.replace(/\[\[(MACRO|MESO|MICRO):\s*(.+?)\]\]/gi, '[ANNOTATION]'))
    .filter(line => line.trim());

  return contextLines.join('\n');
}

/**
 * Extract all annotations from document content
 * Returns level, content, position, line/char information, and surrounding context
 */
export function extractAnnotations(text: string): Array<{
  level: AnnotationLevel;
  content: string;
  position: number;
  line: number;
  char: number;
  rawText: string;
  surroundingContext: string;
}> {
  const annotations: Array<{
    level: AnnotationLevel;
    content: string;
    position: number;
    line: number;
    char: number;
    rawText: string;
    surroundingContext: string;
  }> = [];

  // Split into lines and track line numbers
  const lines = text.split('\n');
  let currentPosition = 0;

  lines.forEach((line, lineIndex) => {
    // Match annotation pattern [[LEVEL: content]]
    const regex = /\[\[(MACRO|MESO|MICRO):\s*(.+?)\]\]/gi;
    let match;

    while ((match = regex.exec(line)) !== null) {
      const level = match[1].toUpperCase() as AnnotationLevel;
      annotations.push({
        level,
        content: match[2].trim(),
        position: currentPosition + match.index,
        line: lineIndex + 1, // 1-indexed
        char: match.index + 1, // 1-indexed
        rawText: match[0],
        surroundingContext: extractSurroundingContext(lines, lineIndex, level),
      });
    }

    // Add line length plus newline character
    currentPosition += line.length + 1;
  });

  return annotations;
}

/**
 * Remove an annotation from the document
 */
export function removeAnnotation(text: string, position: number): string {
  const regex = /\s*\[\[(MACRO|MESO|MICRO):\s*(.+?)\]\]/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index === position || match.index === position - 1) {
      return text.substring(0, match.index) + text.substring(match.index + match[0].length);
    }
  }

  return text;
}

/**
 * Get annotation at a specific position
 */
export function getAnnotationAtPosition(text: string, position: number): {
  level: AnnotationLevel;
  content: string;
  start: number;
  end: number;
} | null {
  const regex = /\[\[(MACRO|MESO|MICRO):\s*(.+?)\]\]/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;

    if (position >= start && position <= end) {
      return {
        level: match[1].toUpperCase() as AnnotationLevel,
        content: match[2].trim(),
        start,
        end,
      };
    }
  }

  return null;
}
