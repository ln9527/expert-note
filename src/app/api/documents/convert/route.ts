/**
 * Document Convert API Endpoint (Convert Only, No Creation)
 *
 * Converts PDF/DOCX files to markdown WITHOUT creating a document.
 * This allows users to preview and edit the content before saving.
 *
 * Use /api/documents/upload if you want to convert AND create in one step.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  validateUploadFile,
  convertFileToMarkdown,
  deriveTitle,
  getFileExtension,
} from '@/lib/utils/fileConverter';

// Conversion timeout in milliseconds (30 seconds)
const CONVERSION_TIMEOUT = 30000;

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file presence
    if (!file) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
    }

    // Read file as ArrayBuffer for validation and conversion
    const buffer = await file.arrayBuffer();

    // Validate file (type, size, magic bytes)
    const validation = await validateUploadFile(file, buffer);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Convert file to markdown with timeout protection
    let conversionResult;
    try {
      conversionResult = await Promise.race([
        convertFileToMarkdown(file, buffer),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), CONVERSION_TIMEOUT)
        ),
      ]);
    } catch {
      console.error('[API] Document conversion timeout:', file.name);
      return NextResponse.json(
        { success: false, error: 'File conversion timed out. Try a smaller file.' },
        { status: 408 }
      );
    }

    if (!conversionResult.success || !conversionResult.markdown) {
      return NextResponse.json(
        { success: false, error: conversionResult.error || 'Failed to convert file' },
        { status: 400 }
      );
    }

    // Derive suggested title from filename
    const suggestedTitle = deriveTitle(file.name);
    const ext = getFileExtension(file.name);

    console.log(`[API] Document converted: ${file.name} (${ext}) - ${conversionResult.markdown.length} chars`);

    // Return the converted content WITHOUT creating a document
    return NextResponse.json({
      success: true,
      content: conversionResult.markdown,
      suggestedTitle,
      originalFilename: file.name,
    });
  } catch (error) {
    console.error('[API] POST /documents/convert error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
