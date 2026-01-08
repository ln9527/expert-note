import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  getPromptTemplateById,
  updatePromptTemplate,
  deletePromptTemplate,
  duplicatePromptTemplate,
} from '@/lib/db/queries/promptTemplates';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/prompt-templates/[id]
 * Get a single generation guide (code: prompt template) by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const template = await getPromptTemplateById(id);

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('[API] GET /prompt-templates/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/prompt-templates/[id]
 * Update a generation guide (code: prompt template)
 *
 * Request body:
 * {
 *   name?: string,
 *   description?: string,
 *   content?: string,
 *   templateType?: string,
 *   isActive?: boolean
 * }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, content, templateType, isActive } = body;

    // Check if template exists
    const existing = await getPromptTemplateById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const template = await updatePromptTemplate(id, {
      name: name?.trim(),
      description: description?.trim(),
      content: content?.trim(),
      templateType,
      isActive,
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error('[API] PUT /prompt-templates/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/prompt-templates/[id]
 * Delete a generation guide (code: prompt template) - only non-default guides can be deleted
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
      await deletePromptTemplate(id);
      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === 'Cannot delete default templates') {
        return NextResponse.json(
          { success: false, error: 'Cannot delete default templates' },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('[API] DELETE /prompt-templates/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/prompt-templates/[id]
 * Duplicate a template (action=duplicate in body)
 *
 * Request body:
 * {
 *   action: 'duplicate',
 *   name: string
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, name } = body;

    if (action !== 'duplicate') {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Name is required for duplication' }, { status: 400 });
    }

    try {
      const template = await duplicatePromptTemplate(id, name.trim(), user.userId);
      return NextResponse.json({ success: true, template }, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.message === 'Template not found') {
        return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    console.error('[API] POST /prompt-templates/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
