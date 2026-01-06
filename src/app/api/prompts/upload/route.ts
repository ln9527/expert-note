import { NextRequest, NextResponse } from 'next/server';
import { createPrompt } from '@/lib/db/queries/prompts';
import { getSessionUser } from '@/lib/auth/session';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const templateType = formData.get('templateType') as string | null;
    const tagIdsStr = formData.get('tagIds') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
    }

    // Validate file extension
    const filename = file.name;
    if (!filename.toLowerCase().endsWith('.md')) {
      return NextResponse.json(
        { success: false, error: 'Only Markdown (.md) files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 1MB' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    if (!content.trim()) {
      return NextResponse.json(
        { success: false, error: 'File is empty' },
        { status: 400 }
      );
    }

    // Parse tagIds from comma-separated string
    const tagIds = tagIdsStr
      ? tagIdsStr.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
      : [];

    // Derive title from filename if not provided
    const promptTitle = title?.trim() || filename.replace(/\.md$/i, '');

    // Create prompt
    const prompt = await createPrompt({
      userId: String(user.userId),
      title: promptTitle,
      description: description?.trim() || undefined,
      content: content,
      templateType: templateType || undefined,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
    });

    return NextResponse.json({ success: true, prompt }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /prompts/upload error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
