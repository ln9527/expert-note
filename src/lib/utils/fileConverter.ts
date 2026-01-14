/**
 * File converter utilities for PDF and DOCX to Markdown conversion
 *
 * Key features:
 * - PDF conversion using pdfjs-dist with proper text joining
 * - DOCX conversion with heading structure preservation
 * - Image stripping from converted content
 * - File validation with magic byte checks
 */

// @ts-expect-error - pdfjs-dist ESM build works at runtime
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
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

// Type for pdfjs text items
interface TextItem {
  str: string;
  hasEOL?: boolean;
  dir?: string;
  transform?: number[];
  width?: number;
  height?: number;
}

/**
 * Convert PDF to Markdown using pdfjs-dist
 *
 * Simple approach: extract text using getTextContent() and join properly
 * using the hasEOL property for line breaks.
 */
export async function convertPdfToMarkdown(buffer: ArrayBuffer): Promise<ConversionResult> {
  try {
    // Load the PDF document
    const typedArray = new Uint8Array(buffer);
    const loadingTask = pdfjs.getDocument({ data: typedArray });
    const pdf = await loadingTask.promise;

    if (pdf.numPages === 0) {
      return { success: false, error: 'PDF appears to be empty' };
    }

    const pageTexts: string[] = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Join text items properly using hasEOL for line breaks
      let pageText = '';
      for (const item of textContent.items) {
        const textItem = item as TextItem;
        if (textItem.str) {
          pageText += textItem.str;
          // Add newline if this item ends a line
          if (textItem.hasEOL) {
            pageText += '\n';
          }
        }
      }

      if (pageText.trim()) {
        pageTexts.push(pageText.trim());
      }
    }

    if (pageTexts.length === 0) {
      return {
        success: false,
        error: 'No text could be extracted from PDF. It may be a scanned document.',
      };
    }

    // Join pages with page separator
    let markdown = pageTexts.join('\n\n---\n\n');

    // Post-process to clean up common issues
    markdown = postProcessPdfText(markdown);

    return {
      success: true,
      markdown: stripImageMarkdown(markdown),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[FileConverter] PDF conversion error:', errorMessage);

    if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
      return { success: false, error: 'Password-protected PDFs are not supported' };
    }

    return { success: false, error: 'Failed to convert PDF. It may be corrupted.' };
  }
}

/**
 * Post-process extracted PDF text to fix common issues
 */
function postProcessPdfText(text: string): string {
  return text
    // Fix hyphenated words at line breaks (word- + continuation → word + continuation)
    .replace(/(\w)-\n(\w)/g, (_match: string, p1: string, p2: string) => {
      // Only join if continuation starts with lowercase (likely word break)
      if (p2 === p2.toLowerCase()) {
        return p1 + p2;
      }
      return p1 + '-\n' + p2;
    })
    // Convert single line breaks within paragraphs to spaces
    // (double line breaks = paragraph breaks, keep those)
    .replace(/([^\n])\n([^\n])/g, (_match: string, p1: string, p2: string) => {
      // Don't join if looks like a heading or list item
      if (/^[A-Z#\-\*\d•]/.test(p2) && /[.!?:]$/.test(p1)) {
        return p1 + '\n\n' + p2;
      }
      return p1 + ' ' + p2;
    })
    // Normalize multiple spaces
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
      } catch {
        return { success: false, error: 'Failed to read text file' };
      }

    default:
      return { success: false, error: 'Unsupported file type' };
  }
}
