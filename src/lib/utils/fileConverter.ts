/**
 * File converter utilities for PDF and DOCX to Markdown conversion
 *
 * Key features:
 * - PDF conversion with two-column academic paper layout detection
 * - DOCX conversion with heading structure preservation
 * - Image stripping from converted content
 * - File validation with magic byte checks
 */

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
 * Convert PDF to Markdown with two-column layout detection
 */
export async function convertPdfToMarkdown(buffer: ArrayBuffer): Promise<ConversionResult> {
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

    // Join pages with double newlines
    const markdown = pageTexts.join('\n\n---\n\n');

    return {
      success: true,
      markdown: stripImageMarkdown(markdown),
    };
  } catch (error) {
    console.error('[FileConverter] PDF conversion error:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
      return { success: false, error: 'Password-protected PDFs are not supported' };
    }

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
 */
function reconstructColumnText(items: PDFExtractText[]): string {
  if (items.length === 0) return '';

  // Sort by Y position (top to bottom), then X (left to right)
  const sortedItems = [...items].sort((a, b) => {
    const yDiff = a.y - b.y;
    // Group items within 5 points vertically as same line
    if (Math.abs(yDiff) < 5) {
      return a.x - b.x;
    }
    return yDiff;
  });

  // Group items into lines based on Y position
  const lines: PDFExtractText[][] = [];
  let currentLine: PDFExtractText[] = [];
  let lastY = sortedItems[0]?.y ?? 0;

  for (const item of sortedItems) {
    // New line if Y position differs by more than line height threshold
    if (Math.abs(item.y - lastY) > 5) {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = [];
    }
    currentLine.push(item);
    lastY = item.y;
  }

  // Don't forget the last line
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  // Build text from lines
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];
  let lastLineY = 0;

  for (const line of lines) {
    // Sort items in line by X position
    line.sort((a, b) => a.x - b.x);
    const lineText = line.map(item => item.str).join(' ').trim();

    if (!lineText) continue;

    // Detect paragraph breaks (larger Y gap between lines)
    const lineY = line[0]?.y ?? 0;
    const yGap = Math.abs(lineY - lastLineY);

    if (lastLineY > 0 && yGap > 15) {
      // Paragraph break detected
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
    }

    currentParagraph.push(lineText);
    lastLineY = lineY;
  }

  // Don't forget the last paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' '));
  }

  return paragraphs.join('\n\n');
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
