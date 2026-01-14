/**
 * Document Upload API Endpoint
 *
 * Handles file uploads with automatic conversion:
 * - PDF files: Converted to markdown with two-column layout detection
 * - DOCX files: Converted to markdown with heading preservation
 * - MD/TXT files: Stored as-is
 *
 * All files have images stripped during processing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDocument } from '@/lib/db/queries/documents';
import { getSessionUser } from '@/lib/auth/session';
import {
  validateUploadFile,
  convertFileToMarkdown,
  deriveTitle,
  getFileExtension,
  FILE_SIZE_LIMITS,
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
    const title = formData.get('title') as string | null;
    const tagIdsStr = formData.get('tagIds') as string | null;

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
    } catch (timeoutError) {
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

    // Parse tagIds from comma-separated string
    const tagIds = tagIdsStr
      ? tagIdsStr.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
      : [];

    // Derive title from filename if not provided
    const documentTitle = title?.trim() || deriveTitle(file.name);

    // Create document in database
    const document = await createDocument({
      filename: documentTitle,
      content: conversionResult.markdown,
      createdBy: user.userId,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
    });

    const ext = getFileExtension(file.name);
    console.log(`[API] Document uploaded: ${file.name} (${ext}) -> ${document.id}`);

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /documents/upload error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
