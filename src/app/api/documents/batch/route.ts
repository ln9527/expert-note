/**
 * Batch Document Upload API Endpoint
 *
 * Handles bulk upload of multiple markdown files from a folder.
 * Files are processed individually with partial success support.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDocument } from '@/lib/db/queries/documents';
import { getSessionUser } from '@/lib/auth/session';
import { BulkUploadResult } from '@/types';

const MAX_FILES = 100;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB per file

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const paths = formData.getAll('paths') as string[];

    // Validation: No files provided
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validation: Too many files
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_FILES} files allowed per batch` },
        { status: 400 }
      );
    }

    const results: BulkUploadResult['results'] = {
      successful: [],
      failed: [],
      skipped: [],
    };

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = paths[i] || file.name;

      try {
        // Check if it's a markdown file
        if (!file.name.toLowerCase().endsWith('.md')) {
          results.skipped.push({
            filename: file.name,
            reason: 'Not a markdown file',
            relativePath,
          });
          continue;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          results.failed.push({
            filename: file.name,
            error: 'File exceeds 1MB limit',
            relativePath,
          });
          continue;
        }

        // Check for empty files
        if (file.size === 0) {
          results.skipped.push({
            filename: file.name,
            reason: 'Empty file',
            relativePath,
          });
          continue;
        }

        // Read file content
        const content = await file.text();

        // Derive title from filename (without .md extension)
        const title = file.name.replace(/\.md$/i, '');

        // Create document
        const document = await createDocument({
          filename: title,
          content: content,
          createdBy: user.userId,
          tagIds: [], // No tags for bulk upload
        });

        results.successful.push({
          filename: file.name,
          documentId: document.id,
          relativePath,
        });
      } catch (error) {
        console.error(`[API] Batch upload error for ${file.name}:`, error);
        results.failed.push({
          filename: file.name,
          error: 'Database error',
          relativePath,
        });
      }
    }

    const response: BulkUploadResult = {
      success: true,
      results,
      summary: {
        total: files.length,
        succeeded: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
      },
    };

    console.log(
      `[API] Batch upload complete: ${response.summary.succeeded} succeeded, ` +
      `${response.summary.failed} failed, ${response.summary.skipped} skipped`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] POST /documents/batch error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
