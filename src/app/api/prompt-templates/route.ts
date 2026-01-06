import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  getAllPromptTemplates,
  createPromptTemplate,
} from '@/lib/db/queries/promptTemplates';

/**
 * GET /api/prompt-templates
 * Get all prompt templates with optional filtering
 *
 * Query params:
 * - category: 'extraction' | 'generation'
 * - templateType: string (e.g., 'introduction', 'methodology')
 * - active: 'true' | 'false' (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as 'extraction' | 'generation' | null;
    const templateType = searchParams.get('templateType') || undefined;
    const activeParam = searchParams.get('active');
    const isActive = activeParam === null ? true : activeParam === 'true';

    const templates = await getAllPromptTemplates({
      category: category || undefined,
      templateType,
      isActive,
      includeDefaults: true,
    });

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('[API] GET /prompt-templates error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/prompt-templates
 * Create a new prompt template
 *
 * Request body:
 * {
 *   name: string,
 *   description?: string,
 *   category: 'extraction' | 'generation',
 *   templateType?: string,
 *   content: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, category, templateType, content } = body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    if (!category || !['extraction', 'generation'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Category must be "extraction" or "generation"' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    const template = await createPromptTemplate({
      name: name.trim(),
      description: description?.trim() || undefined,
      category,
      templateType: templateType || undefined,
      content: content.trim(),
      isDefault: false,
      createdBy: user.userId,
    });

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /prompt-templates error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
