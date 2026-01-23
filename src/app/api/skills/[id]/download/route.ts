import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getSessionUser } from '@/lib/auth/session';
import { getSkillById, incrementDownloadCount } from '@/lib/db/queries/skills';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Content structure expected in skill.content
 */
interface SkillContent {
  skill_md?: string;
  prompts?: Array<{ name: string; content: string }>;
  examples?: Array<{ name: string; content: string }>;
  tests?: Array<{ name: string; content: string }>;
}

/**
 * GET /api/skills/[id]/download - Download skill as ZIP file
 *
 * Creates a ZIP with structure:
 * - {folder-name}/SKILL.md
 * - {folder-name}/prompts/*.md
 * - {folder-name}/examples/*.md
 * - {folder-name}/tests/*.md
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
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

    // Fetch skill
    const skill = await getSkillById(id);
    if (!skill) {
      return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 });
    }

    // Check visibility permissions
    const canView = await canUserViewSkill(skill, user);
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to download this skill' },
        { status: 403 }
      );
    }

    // Create ZIP file
    const zip = new JSZip();
    const content = skill.content as SkillContent;

    // Create folder name from skill title (sanitize for filesystem)
    const folderName = sanitizeFolderName(skill.title);
    const folder = zip.folder(folderName);

    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'Failed to create ZIP folder' },
        { status: 500 }
      );
    }

    // Add SKILL.md (main skill definition)
    if (content.skill_md) {
      folder.file('SKILL.md', content.skill_md);
    }

    // Add prompts
    if (content.prompts && Array.isArray(content.prompts)) {
      const promptsFolder = folder.folder('prompts');
      if (promptsFolder) {
        for (const prompt of content.prompts) {
          const filename = sanitizeFilename(prompt.name);
          promptsFolder.file(`${filename}.md`, prompt.content || '');
        }
      }
    }

    // Add examples
    if (content.examples && Array.isArray(content.examples)) {
      const examplesFolder = folder.folder('examples');
      if (examplesFolder) {
        for (const example of content.examples) {
          const filename = sanitizeFilename(example.name);
          examplesFolder.file(`${filename}.md`, example.content || '');
        }
      }
    }

    // Add tests
    if (content.tests && Array.isArray(content.tests)) {
      const testsFolder = folder.folder('tests');
      if (testsFolder) {
        for (const test of content.tests) {
          const filename = sanitizeFilename(test.name);
          testsFolder.file(`${filename}.md`, test.content || '');
        }
      }
    }

    // Generate ZIP as ArrayBuffer
    const zipArrayBuffer = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Increment download count
    await incrementDownloadCount(id);

    // Return ZIP as downloadable file
    const zipFilename = `${folderName}.zip`;

    return new Response(zipArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(zipFilename)}"`,
        'Content-Length': String(zipArrayBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error('[API] GET /skills/[id]/download error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Sanitize folder name for filesystem compatibility
 */
function sanitizeFolderName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '-')  // Replace invalid chars
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .replace(/^-|-$/g, '')          // Remove leading/trailing hyphens
    .substring(0, 100)              // Limit length
    || 'skill';                     // Fallback if empty
}

/**
 * Sanitize filename for filesystem compatibility
 */
function sanitizeFilename(name: string): string {
  const sanitized = name
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/\.md$/i, '')          // Remove .md extension if present
    .substring(0, 100)
    || 'file';
  return sanitized;
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
