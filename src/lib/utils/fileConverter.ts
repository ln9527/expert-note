/**
 * File converter utilities for PDF and DOCX to Markdown conversion
 *
 * Key features:
 * - PDF conversion with two-column academic paper layout detection
 * - DOCX conversion with heading structure preservation
 * - Image stripping from converted content
 * - File validation with magic byte checks
 */

// pdf-parse is a CommonJS module
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import { PDFExtract } from 'pdf.js-extract';
import type { PDFExtractPage, PDFExtractText } from 'pdf.js-extract';
import mammoth from 'mammoth';
import TurndownService from 'turndown';

// File size limits in bytes
export const FILE_SIZE_LIMITS: Record<string, number> = {
  '.md': 5 * 1024 * 1024,     // 5 MB
  '.txt': 5 * 1024 * 1024,    // 5 MB
  '.pdf': 20 * 1024 * 1024,   // 20 MB
  '.docx': 10 * 1024 * 1024,  // 10 MB
};

// Allowed MIME types for each extension
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.md': ['text/markdown', 'text/plain', 'application/octet-stream'],
  '.txt': ['text/plain', 'application/octet-stream'],
};

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ConversionResult {
  success: boolean;
  markdown?: string;
  error?: string;
}

/**
 * Get file extension from filename (lowercase, with dot)
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Derive document title from filename (without extension)
 */
export function deriveTitle(filename: string): string {
  const ext = getFileExtension(filename);
  return filename.slice(0, filename.length - ext.length).trim() || 'Untitled';
}

/**
 * Validate magic bytes for binary files
 */
async function validateMagicBytes(buffer: ArrayBuffer, ext: string): Promise<boolean> {
  const bytes = new Uint8Array(buffer.slice(0, 4));

  if (ext === '.pdf') {
    // PDF files start with %PDF (0x25, 0x50, 0x44, 0x46)
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }

  if (ext === '.docx') {
    // DOCX files are ZIP archives starting with PK (0x50, 0x4B)
    return bytes[0] === 0x50 && bytes[1] === 0x4B;
  }

  // Text files don't need magic byte validation
  return true;
}

/**
 * Validate an uploaded file
 */
export async function validateUploadFile(
  file: File,
  buffer?: ArrayBuffer
): Promise<ValidationResult> {
  const ext = getFileExtension(file.name);

  // Check extension is allowed
  if (!FILE_SIZE_LIMITS[ext]) {
    return {
      valid: false,
      error: 'Please upload a .md, .txt, .pdf, or .docx file',
    };
  }

  // Check file size
  const maxSize = FILE_SIZE_LIMITS[ext];
  if (file.size > maxSize) {
    const sizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File exceeds maximum size of ${sizeMB} MB`,
    };
  }

  // Check MIME type (allow empty MIME type as some browsers don't set it)
  if (file.type && !ALLOWED_MIME_TYPES[ext]?.includes(file.type)) {
    console.warn(`[FileConverter] Unexpected MIME type: ${file.type} for extension ${ext}`);
    // Don't reject based on MIME type alone - some browsers report wrong types
  }

  // Validate magic bytes for binary files
  if ((ext === '.pdf' || ext === '.docx') && buffer) {
    const validMagic = await validateMagicBytes(buffer, ext);
    if (!validMagic) {
      return {
        valid: false,
        error: 'Unable to read file. It may be corrupted.',
      };
    }
  }

  return { valid: true };
}

/**
 * Strip image markdown and HTML img tags from content
 */
export function stripImageMarkdown(markdown: string): string {
  return markdown
    // Remove markdown images: ![alt](url) or ![alt](url "title")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    // Remove HTML img tags
    .replace(/<img[^>]*\/?>/gi, '')
    // Remove base64 data URIs that might remain
    .replace(/data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+/g, '')
    // Clean up excessive blank lines (3+ newlines → 2)
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .trim();
}

/**
 * Convert PDF to Markdown
 *
 * Uses pdf-parse as primary method (handles most PDFs well),
 * falls back to coordinate-based extraction for two-column layouts
 */
export async function convertPdfToMarkdown(buffer: ArrayBuffer): Promise<ConversionResult> {
  try {
    // First try pdf-parse - it handles most PDFs well and preserves reading order
    console.log('[FileConverter] Attempting pdf-parse extraction...');
    const pdfBuffer = Buffer.from(buffer);
    const pdfData = await pdfParse(pdfBuffer);
    console.log('[FileConverter] pdf-parse succeeded, text length:', pdfData.text?.length || 0);

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      console.log('[FileConverter] pdf-parse returned empty text, trying fallback...');
      return convertPdfWithCoordinates(buffer);
    }

    // Clean up the extracted text
    let markdown = pdfData.text
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      // Fix common PDF artifacts: spaces within words
      .replace(/(\w)\s{2,}(\w)/g, '$1 $2')
      // Handle hyphenated words at line breaks
      .replace(/(\w)-\n(\w)/g, (_match: string, p1: string, p2: string) => {
        // Check if lowercase continuation - likely word break
        if (p2 === p2.toLowerCase()) {
          return p1 + p2; // Remove hyphen, join
        }
        return p1 + '-' + p2; // Keep hyphen
      })
      // Convert multiple newlines to paragraph breaks
      .replace(/\n{3,}/g, '\n\n')
      // Single newlines within paragraphs → space (for flowing text)
      .replace(/([^\n])\n([^\n])/g, (_match: string, p1: string, p2: string) => {
        // Don't join if looks like a heading or list
        if (/^[A-Z#\-\*\d]/.test(p2) && /[.!?:]$/.test(p1)) {
          return p1 + '\n\n' + p2; // Keep as separate paragraphs
        }
        return p1 + ' ' + p2; // Join with space
      })
      .trim();

    console.log('[FileConverter] pdf-parse extraction complete, markdown length:', markdown.length);
    return {
      success: true,
      markdown: stripImageMarkdown(markdown),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[FileConverter] pdf-parse failed:', errorMessage);
    console.error('[FileConverter] Error stack:', errorStack);

    if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
      return { success: false, error: 'Password-protected PDFs are not supported' };
    }

    // Try fallback with coordinate-based extraction
    console.log('[FileConverter] Trying coordinate-based fallback extraction...');
    return convertPdfWithCoordinates(buffer);
  }
}

/**
 * Fallback: Convert PDF using coordinate-based extraction
 * Better for two-column academic papers
 */
async function convertPdfWithCoordinates(buffer: ArrayBuffer): Promise<ConversionResult> {
  try {
    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extractBuffer(Buffer.from(buffer));

    if (!data.pages || data.pages.length === 0) {
      return { success: false, error: 'PDF appears to be empty' };
    }

    const pageTexts: string[] = [];

    for (const page of data.pages) {
      const pageText = processPageLayout(page);
      if (pageText.trim()) {
        pageTexts.push(pageText);
      }
    }

    if (pageTexts.length === 0) {
      return {
        success: false,
        error: 'No text could be extracted from PDF. It may be a scanned document.',
      };
    }

    const markdown = pageTexts.join('\n\n---\n\n');

    return {
      success: true,
      markdown: stripImageMarkdown(markdown),
    };
  } catch (error) {
    console.error('[FileConverter] Fallback PDF conversion error:', error);
    return { success: false, error: 'Failed to convert PDF. It may be corrupted.' };
  }
}

/**
 * Process a single PDF page, handling two-column layouts
 */
function processPageLayout(page: PDFExtractPage): string {
  if (!page.content || page.content.length === 0) {
    return '';
  }

  const items = page.content.filter(
    (item): item is PDFExtractText => 'str' in item && typeof item.str === 'string' && item.str.trim().length > 0
  );

  if (items.length === 0) {
    return '';
  }

  // Get page width from first item or use default
  const pageWidth = page.pageInfo?.width || 612; // Standard letter width in points
  const midpoint = pageWidth / 2;

  // Separate items into left and right columns based on x position
  const leftColumn: PDFExtractText[] = [];
  const rightColumn: PDFExtractText[] = [];

  for (const item of items) {
    const centerX = item.x + (item.width || 0) / 2;
    if (centerX < midpoint) {
      leftColumn.push(item);
    } else {
      rightColumn.push(item);
    }
  }

  // Determine if this is a two-column layout
  // Heuristic: significant content in both columns (>20% of items each)
  const minItemsForColumn = Math.max(10, items.length * 0.2);
  const isTwoColumn = leftColumn.length >= minItemsForColumn &&
                      rightColumn.length >= minItemsForColumn;

  if (isTwoColumn) {
    // Process columns separately: left first, then right
    const leftText = reconstructColumnText(leftColumn);
    const rightText = reconstructColumnText(rightColumn);
    return `${leftText}\n\n${rightText}`;
  } else {
    // Single column: process all items together
    return reconstructColumnText(items);
  }
}

/**
 * Reconstruct text from a column of PDF text items
 * Groups items by approximate Y position (lines) and sorts
 *
 * Key improvements:
 * - Conservative spacing: only add space when gap is clearly a word boundary
 * - Hyphenation handling: rejoin words split across lines
 * - Handles PDFs that store text character-by-character
 */
function reconstructColumnText(items: PDFExtractText[]): string {
  if (items.length === 0) return '';

  // Calculate average font height for dynamic thresholds
  const avgHeight = items.reduce((sum, item) => sum + (item.height || 10), 0) / items.length;
  const lineThreshold = Math.max(avgHeight * 0.6, 8); // Same line if within 60% of font height
  const paragraphThreshold = avgHeight * 1.8; // Paragraph break if > 1.8x font height gap

  // Sort by Y position (top to bottom), then X (left to right)
  const sortedItems = [...items].sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) < lineThreshold) {
      return a.x - b.x;
    }
    return yDiff;
  });

  // Group items into lines based on Y position
  const lines: PDFExtractText[][] = [];
  let currentLine: PDFExtractText[] = [];
  let lastY = sortedItems[0]?.y ?? 0;

  for (const item of sortedItems) {
    if (Math.abs(item.y - lastY) > lineThreshold) {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = [];
    }
    currentLine.push(item);
    lastY = item.y;
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  // Build text from lines with smart spacing
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];
  let lastLineY = 0;

  for (const line of lines) {
    // Sort items in line by X position
    line.sort((a, b) => a.x - b.x);

    // Smart join: very conservative about adding spaces
    // Many PDFs store text with separate items for kerning purposes
    let lineText = '';
    for (let i = 0; i < line.length; i++) {
      const item = line[i];
      const text = item.str;
      const prevItem = line[i - 1];

      if (prevItem) {
        const prevText = prevItem.str;
        const prevEnd = prevItem.x + (prevItem.width || 0);
        const gap = item.x - prevEnd;

        // Calculate expected space width based on font size
        // A typical space is about 25-30% of the em-width (font height)
        const fontSize = item.height || avgHeight || 10;
        const expectedSpaceWidth = fontSize * 0.25;

        // Also calculate average character width for this item
        const avgCharWidth = (prevItem.width || 0) / Math.max(prevText.length, 1);

        // Conditions to add a space:
        // 1. Previous item ends with a space already
        // 2. Gap is >= expected space width (0.25 * font size)
        // 3. Gap is > full average character width (clearly separated)
        const prevEndsWithSpace = prevText.endsWith(' ');
        const currentStartsWithSpace = text.startsWith(' ');
        const hasWordBoundaryGap = gap >= expectedSpaceWidth || gap > avgCharWidth;

        // Don't add space if either side already has one
        if (!prevEndsWithSpace && !currentStartsWithSpace && hasWordBoundaryGap) {
          lineText += ' ';
        }
      }
      // Add the text, trimming any excessive internal spaces
      lineText += text;
    }

    lineText = lineText.trim();
    if (!lineText) continue;

    // Detect paragraph breaks
    const lineY = line[0]?.y ?? 0;
    const yGap = Math.abs(lineY - lastLineY);

    if (lastLineY > 0 && yGap > paragraphThreshold) {
      if (currentParagraph.length > 0) {
        paragraphs.push(joinLinesWithHyphenation(currentParagraph));
        currentParagraph = [];
      }
    }

    currentParagraph.push(lineText);
    lastLineY = lineY;
  }

  if (currentParagraph.length > 0) {
    paragraphs.push(joinLinesWithHyphenation(currentParagraph));
  }

  // Post-process to clean up common PDF extraction issues
  return postProcessPdfText(paragraphs.join('\n\n'));
}

/**
 * Join lines handling hyphenation at line endings
 * Distinguishes between:
 * - Word-break hyphens: "experi-" + "ence" → "experience" (remove hyphen)
 * - Compound words: "experience-" + "based" → "experience-based" (keep hyphen)
 */
function joinLinesWithHyphenation(lines: string[]): string {
  if (lines.length === 0) return '';

  let result = lines[0];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    if (!currentLine) continue;

    // Check if previous line ends with hyphen
    if (result.endsWith('-')) {
      const firstWord = currentLine.split(/\s/)[0] || '';

      // A word-break hyphen is when:
      // 1. The continuation is ONLY a suffix (not a standalone word)
      // 2. Pure suffixes are short fragments that complete a word
      //
      // Examples of word-break: "experi-" + "ence", "personal-" + "ized"
      // Examples of compound: "experience-" + "based", "one-" + "on-one"
      //
      // Key insight: if firstWord is a real English word, it's probably a compound
      const pureSuffixes = /^(tion|tions|ing|ings|ed|ly|ment|ments|ness|ive|ance|ence|ity|ous|ful|less|ward|wise|ship|hood|dom|ism|ize|ise|fy|en|ure|ice|age|ery|ry|cy|ty|able|ible|ary|ory|ian|an|al)$/i;

      const isWordBreak = pureSuffixes.test(firstWord);

      if (isWordBreak) {
        // Remove hyphen and join without space
        result = result.slice(0, -1) + currentLine;
      } else {
        // Keep hyphen (compound word or just add space)
        result += ' ' + currentLine;
      }
    } else {
      result += ' ' + currentLine;
    }
  }

  return result;
}

/**
 * Post-process extracted PDF text to fix common issues
 * Handles common PDF extraction artifacts while preserving valid text
 */
function postProcessPdfText(text: string): string {
  return text
    // Fix spaces around hyphens in compound words
    .replace(/(\w)- (\w)/g, '$1-$2') // "one- on" → "one-on"
    .replace(/(\w) - (\w)/g, '$1-$2') // "one - on" → "one-on"

    // Fix orphan hyphens at line breaks that weren't caught
    .replace(/(\w)-\s*\n\s*([a-z])/g, (_match: string, p1: string, p2: string) => {
      return p1 + p2;
    })

    // Fix single-character word fragments (common PDF artifact)
    // Pattern: lowercase letter + space + lowercase letters
    // "d ialogue" → "dialogue", "cust omer" → "customer"
    .replace(/\b([a-z])\s+([a-z]{3,})\b/g, (_match: string, p1: string, p2: string) => {
      // Only join if the combined word is likely correct (starts with a common prefix)
      // This prevents breaking valid patterns like "a house"
      const combined = p1 + p2;
      // Check if this looks like a real word (common starting patterns)
      const commonPrefixes = /^(dia|cust|prod|cons|comp|cont|comm|conf|conv|corr|coll|conc|conn)/i;
      if (commonPrefixes.test(combined)) {
        return combined;
      }
      return p1 + ' ' + p2; // Keep original
    })

    // Fix fragments where a word is split like "custo mer"
    .replace(/\b([a-z]{2,})\s([a-z]{2,3})\b/g, (_match: string, p1: string, p2: string) => {
      // Common word endings that should be joined
      const wordEndings = /^(er|ed|ing|tion|sion|ment|ness|ity|ous|ive|ary|ory|al|ly|ty)$/i;
      if (wordEndings.test(p2)) {
        return p1 + p2;
      }
      return p1 + ' ' + p2; // Keep original
    })

    // Normalize multiple spaces to single space
    .replace(/  +/g, ' ')

    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')

    .trim();
}

/**
 * Convert DOCX to Markdown with heading preservation
 */
export async function convertDocxToMarkdown(buffer: ArrayBuffer): Promise<ConversionResult> {
  try {
    // Configure mammoth to ignore images
    const result = await mammoth.convertToHtml(
      { buffer: Buffer.from(buffer) },
      {
        convertImage: mammoth.images.imgElement(() => {
          // Return empty image to effectively strip them
          return Promise.resolve({ src: '' });
        }),
      }
    );

    if (!result.value || result.value.trim().length === 0) {
      return { success: false, error: 'DOCX appears to be empty' };
    }

    // Convert HTML to Markdown using Turndown
    const turndownService = new TurndownService({
      headingStyle: 'atx', // Use # style headings
      codeBlockStyle: 'fenced', // Use ``` for code blocks
      bulletListMarker: '-',
    });

    // Add rule to completely remove empty images
    turndownService.addRule('removeEmptyImages', {
      filter: (node) => {
        return node.nodeName === 'IMG' && (!node.getAttribute('src') || node.getAttribute('src') === '');
      },
      replacement: () => '',
    });

    const markdown = turndownService.turndown(result.value);

    // Log any conversion warnings
    if (result.messages && result.messages.length > 0) {
      console.warn('[FileConverter] DOCX conversion warnings:', result.messages);
    }

    return {
      success: true,
      markdown: stripImageMarkdown(markdown),
    };
  } catch (error) {
    console.error('[FileConverter] DOCX conversion error:', error);
    return { success: false, error: 'Failed to convert DOCX. It may be corrupted.' };
  }
}

/**
 * Convert any supported file to markdown
 */
export async function convertFileToMarkdown(
  file: File,
  buffer: ArrayBuffer
): Promise<ConversionResult> {
  const ext = getFileExtension(file.name);

  switch (ext) {
    case '.pdf':
      return convertPdfToMarkdown(buffer);

    case '.docx':
      return convertDocxToMarkdown(buffer);

    case '.md':
    case '.txt':
      // Text files: just decode as UTF-8
      try {
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(buffer);
        return { success: true, markdown: text };
      } catch (error) {
        return { success: false, error: 'Failed to read text file' };
      }

    default:
      return { success: false, error: 'Unsupported file type' };
  }
}
