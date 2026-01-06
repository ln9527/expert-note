import { NextRequest, NextResponse } from 'next/server';
import { getDocuments, createDocument } from '@/lib/db/queries/documents';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const tagsParam = searchParams.get('tags');
    const tagIds = tagsParam ? tagsParam.split(',').map(Number).filter(Boolean) : undefined;
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const documents = await getDocuments({ status, tagIds, includeDeleted });

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error('[API] GET /documents error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { filename, content, tagIds } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ success: false, error: 'Filename is required' }, { status: 400 });
    }

    const document = await createDocument({
      filename: filename.trim(),
      content: content || '',
      createdBy: user.userId,
      tagIds,
    });

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /documents error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
