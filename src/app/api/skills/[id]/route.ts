import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import {
  getSkillById,
  updateSkill,
  deleteSkill,
  canUserEditSkill,
} from '@/lib/db/queries/skills';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * GET /api/skills/[id] - Get skill by ID
 * Returns: { success, skill }
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate UUID format to prevent database errors
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid skill ID format' }, { status: 400 });
    }

    const skill = await getSkillById(id);
    if (!skill) {
      return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 });
    }

    // Check visibility: user must be creator, or skill must be shared in same org,
    // or user is org owner in same org, or user is super_admin
    const canView = await canUserViewSkill(skill, user);
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view this skill' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, skill });
  } catch (error) {
    console.error('[API] GET /skills/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/skills/[id] - Update skill
 * Body: { title?, description?, content?, isShared?, allowEdit? }
 * Returns: { success, skill }
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate UUID format to prevent database errors
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid skill ID format' }, { status: 400 });
    }

    // Check if skill exists
    const existingSkill = await getSkillById(id);
    if (!existingSkill) {
      return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 });
    }

    // Check edit permission
    const canEdit = await canUserEditSkill(id, String(user.userId), user.orgId, user.role);
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit this skill' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, content, isShared, allowEdit } = body;

    // Validate content if provided
    if (content !== undefined && (typeof content !== 'object' || content === null)) {
      return NextResponse.json(
        { success: false, error: 'Content must be an object' },
        { status: 400 }
      );
    }

    const skill = await updateSkill(id, {
      title: title?.trim(),
      description: description !== undefined ? (description?.trim() || null) : undefined,
      content,
      isShared,
      allowEdit,
    });

    if (!skill) {
      return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, skill });
  } catch (error) {
    console.error('[API] PUT /skills/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/skills/[id] - Soft delete skill
 * Returns: { success: true }
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Validate UUID format to prevent database errors
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid skill ID format' }, { status: 400 });
    }

    // Check if skill exists
    const existingSkill = await getSkillById(id);
    if (!existingSkill) {
      return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 });
    }

    // Check edit permission (same rules as update)
    const canEdit = await canUserEditSkill(id, String(user.userId), user.orgId, user.role);
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this skill' },
        { status: 403 }
      );
    }

    await deleteSkill(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /skills/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Check if user can view a skill
 *
 * View rules:
 * - super_admin can view any skill
 * - Skill creator can view their own skill
 * - Org owner can view all skills from same org
 * - Member can view own + shared skills from same org
 * - Individual can only view own skills
 */
async function canUserViewSkill(
  skill: { createdBy: number; isShared: boolean; creator?: { orgId: number | null } | null },
  user: { userId: number; orgId: number | null; role: string }
): Promise<boolean> {
  // super_admin can view anything
  if (user.role === 'super_admin') {
    return true;
  }

  // Creator can always view
  if (skill.createdBy === user.userId) {
    return true;
  }

  // Check org-based visibility
  const creatorOrgId = skill.creator?.orgId;

  if (user.role === 'owner' && user.orgId && creatorOrgId === user.orgId) {
    // Org owner can view all skills from same org
    return true;
  }

  if (user.role === 'member' && user.orgId && skill.isShared && creatorOrgId === user.orgId) {
    // Member can view shared skills from same org
    return true;
  }

  return false;
}
