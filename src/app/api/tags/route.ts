import { NextRequest, NextResponse } from 'next/server';
import { createTag, getTagsWithFilter } from '@/lib/db/queries/tags';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tags = await getTagsWithFilter({
      userId: user.userId,
      orgId: user.orgId,
      role: user.role,
    });
    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error('[API] GET /tags error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Tag name is required' }, { status: 400 });
    }

    const tag = await createTag(name.trim(), color, user.userId);
    return NextResponse.json({ success: true, tag }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /tags error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
