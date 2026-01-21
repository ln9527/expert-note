# Phase 2: Skills & MCP Export Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete remaining Phase 2 functionality: skill download (ZIP), edit pages, and MCP endpoint handler.

**Architecture:** Three main components: (1) Skill download API creates ZIP files with skill structure, (2) Edit pages follow create page patterns with pre-populated data, (3) MCP endpoint handler serves prompts via signed URLs.

**Tech Stack:** Next.js 16 App Router, JSZip for ZIP creation, PostgreSQL UUID arrays, TypeScript

---

## Context

Phase 1 is complete with:
- Database migrations (skills, mcp_prompts tables)
- Basic CRUD API endpoints
- List, detail, and create pages for both Skills and MCP
- MCP deploy/disable/regenerate-token functionality

Remaining from test report:
- Skill download functionality (disabled button)
- Edit pages for skills and MCP
- MCP endpoint handler (`/annote/mcp/[token]`)

---

## Task 1: Skill Download API Endpoint

**Files:**
- Create: `src/app/api/skills/[id]/download/route.ts`
- Modify: `src/app/skills/[id]/page.tsx:124-133`
- Install: `jszip` package

**Step 1: Install JSZip package**

Run: `npm install jszip`
Expected: Package added to package.json

**Step 2: Create download API endpoint**

Create file `src/app/api/skills/[id]/download/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { pool } from '@/lib/db/pool';
import JSZip from 'jszip';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check authentication
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch skill with permission check
    const result = await pool.query(
      `SELECT s.*, u.org_id as creator_org_id
       FROM skills s
       LEFT JOIN users u ON s.created_by = u.id
       WHERE s.id = $1 AND s.is_deleted = false`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 });
    }

    const skill = result.rows[0];

    // Check access permission
    const userResult = await pool.query('SELECT org_id, role FROM users WHERE id = $1', [session.userId]);
    const user = userResult.rows[0];

    const canAccess =
      skill.created_by === session.userId ||
      user.role === 'super_admin' ||
      (skill.is_shared && user.org_id && user.org_id === skill.creator_org_id);

    if (!canAccess) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Parse content JSON
    const content = skill.content || {};
    const skillMd = content.skill_md || `# ${skill.title}\n\n${skill.description || ''}`;
    const prompts = content.prompts || {};
    const examples = content.examples || {};
    const tests = content.tests || {};

    // Create ZIP file
    const zip = new JSZip();
    const folderName = skill.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Add SKILL.md
    zip.file(`${folderName}/SKILL.md`, skillMd);

    // Add prompts folder
    if (Object.keys(prompts).length > 0) {
      for (const [name, promptContent] of Object.entries(prompts)) {
        zip.file(`${folderName}/prompts/${name}.md`, promptContent as string);
      }
    }

    // Add examples folder
    if (Object.keys(examples).length > 0) {
      for (const [name, exampleContent] of Object.entries(examples)) {
        zip.file(`${folderName}/examples/${name}.md`, exampleContent as string);
      }
    }

    // Add tests folder
    if (Object.keys(tests).length > 0) {
      for (const [name, testContent] of Object.entries(tests)) {
        zip.file(`${folderName}/tests/${name}.md`, testContent as string);
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Increment download count
    await pool.query(
      'UPDATE skills SET download_count = COALESCE(download_count, 0) + 1 WHERE id = $1',
      [id]
    );

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${folderName}.zip"`,
      },
    });
  } catch (error) {
    console.error('Download skill error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate download' },
      { status: 500 }
    );
  }
}
```

**Step 3: Run to verify route compiles**

Run: `npm run build 2>&1 | head -50`
Expected: No TypeScript errors for the new route

**Step 4: Update skill detail page download button**

Modify `src/app/skills/[id]/page.tsx` lines 122-133. Replace the disabled download button:

```typescript
{/* Download button */}
<a
  href={buildApiPath(`skills/${skill.id}/download`)}
  download
  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
>
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
  {t('skills.download')}
</a>
```

**Step 5: Run build to verify changes**

Run: `npm run build 2>&1 | head -50`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/app/api/skills/[id]/download/route.ts src/app/skills/[id]/page.tsx package.json package-lock.json
git commit -m "feat: Add skill download as ZIP functionality"
```

---

## Task 2: Create Skill Edit Page

**Files:**
- Create: `src/app/skills/[id]/edit/page.tsx`

**Step 1: Create skill edit page**

Create file `src/app/skills/[id]/edit/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { useTranslation } from '@/i18n';
import { Skill } from '@/types';

export default function EditSkillPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const skillId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillMd, setSkillMd] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [allowEdit, setAllowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        const response = await fetch(buildApiPath(`skills/${skillId}`));
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to load skill');
          return;
        }

        const skill: Skill = data.skill;
        setTitle(skill.title);
        setDescription(skill.description || '');
        setSkillMd(skill.content?.skill_md || '');
        setIsShared(skill.isShared || false);
        setAllowEdit(skill.allowEdit || false);
      } catch (err) {
        console.error('Failed to fetch skill:', err);
        setError(t('errors.networkError'));
      } finally {
        setLoading(false);
      }
    };

    if (skillId) {
      fetchSkill();
    }
  }, [skillId, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError(t('errors.titleRequired'));
      return;
    }

    if (!skillMd.trim()) {
      setError(t('skills.contentRequired'));
      return;
    }

    setSaving(true);
    try {
      const content = {
        skill_md: skillMd,
        prompts: {},
        examples: {},
        tests: {}
      };

      const response = await fetch(buildApiPath(`skills/${skillId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          content,
          isShared,
          allowEdit: isShared ? allowEdit : false,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || t('errors.updateFailed'));
        return;
      }

      router.push(`/skills/${skillId}`);
    } catch (err) {
      console.error('Update skill error:', err);
      setError(t('errors.networkError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/skills/${skillId}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('common.back')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('skills.editSkill')}</h1>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {t('prompts.tableHeaders.title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('skills.titlePlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('prompts.tableHeaders.description')} <span className="text-gray-400">({t('common.optional')})</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={t('skills.descriptionPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Skill Markdown Content */}
          <div>
            <label htmlFor="skillMd" className="block text-sm font-medium text-gray-700 mb-2">
              {t('skills.skillMarkdown')} <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">{t('skills.skillMarkdownHelp')}</p>
            <textarea
              id="skillMd"
              value={skillMd}
              onChange={(e) => setSkillMd(e.target.value)}
              rows={15}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Sharing options */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('skills.sharing')}</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{t('common.shared')}</span>
                <span className="text-xs text-gray-400">({t('skills.sharedHelp')})</span>
              </label>

              {isShared && (
                <label className="flex items-center gap-3 ml-7">
                  <input
                    type="checkbox"
                    checked={allowEdit}
                    onChange={(e) => setAllowEdit(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t('common.allowEdit')}</span>
                  <span className="text-xs text-gray-400">({t('skills.allowEditHelp')})</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <Link
            href={`/skills/${skillId}`}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
```

**Step 2: Add missing translation keys**

Add to `src/i18n/locales/en.json` in the "skills" section:
```json
"editSkill": "Edit Skill"
```

Add to `src/i18n/locales/zh.json` in the "skills" section:
```json
"editSkill": "编辑技能"
```

**Step 3: Run build to verify**

Run: `npm run build 2>&1 | head -50`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/skills/[id]/edit/page.tsx src/i18n/locales/en.json src/i18n/locales/zh.json
git commit -m "feat: Add skill edit page"
```

---

## Task 3: Create MCP Edit Page

**Files:**
- Create: `src/app/mcp/[id]/edit/page.tsx`

**Step 1: Create MCP edit page**

Create file `src/app/mcp/[id]/edit/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { useTranslation } from '@/i18n';
import { McpPrompt } from '@/types';

export default function EditMcpPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const mcpId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [namespace, setNamespace] = useState('');
  const [content, setContent] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [allowEdit, setAllowEdit] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMcp = async () => {
      try {
        const response = await fetch(buildApiPath(`mcp/${mcpId}`));
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to load MCP prompt');
          return;
        }

        const mcp: McpPrompt = data.mcpPrompt;
        setTitle(mcp.title);
        setDescription(mcp.description || '');
        setNamespace(mcp.namespace);
        setContent(mcp.content);
        setIsShared(mcp.isShared || false);
        setAllowEdit(mcp.allowEdit || false);
        setIsPublic(mcp.isPublic || false);
      } catch (err) {
        console.error('Failed to fetch MCP prompt:', err);
        setError(t('errors.networkError'));
      } finally {
        setLoading(false);
      }
    };

    if (mcpId) {
      fetchMcp();
    }
  }, [mcpId, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError(t('errors.titleRequired'));
      return;
    }

    if (!namespace.trim()) {
      setError(t('mcp.namespaceRequired'));
      return;
    }

    // Validate namespace format
    const namespaceRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
    if (!namespaceRegex.test(namespace)) {
      setError(t('mcp.namespaceInvalid'));
      return;
    }

    if (!content.trim()) {
      setError(t('mcp.contentRequired'));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(buildApiPath(`mcp/${mcpId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          namespace: namespace.trim(),
          content: content.trim(),
          isShared,
          allowEdit: isShared ? allowEdit : false,
          isPublic,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || t('errors.updateFailed'));
        return;
      }

      router.push(`/mcp/${mcpId}`);
    } catch (err) {
      console.error('Update MCP error:', err);
      setError(t('errors.networkError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/mcp/${mcpId}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('common.back')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('mcp.editMcp')}</h1>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {t('prompts.tableHeaders.title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('mcp.titlePlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Namespace */}
          <div>
            <label htmlFor="namespace" className="block text-sm font-medium text-gray-700 mb-2">
              {t('mcp.namespace')} <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">{t('mcp.namespaceHelp')}</p>
            <input
              type="text"
              id="namespace"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value.toLowerCase())}
              placeholder="my-prompt"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('prompts.tableHeaders.description')} <span className="text-gray-400">({t('common.optional')})</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={t('mcp.descriptionPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              {t('mcp.promptContent')} <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">{t('mcp.promptContentHelp')}</p>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Sharing options */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('mcp.sharing')}</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{t('common.shared')}</span>
                <span className="text-xs text-gray-400">({t('mcp.sharedHelp')})</span>
              </label>

              {isShared && (
                <label className="flex items-center gap-3 ml-7">
                  <input
                    type="checkbox"
                    checked={allowEdit}
                    onChange={(e) => setAllowEdit(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t('common.allowEdit')}</span>
                  <span className="text-xs text-gray-400">({t('mcp.allowEditHelp')})</span>
                </label>
              )}

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{t('mcp.public')}</span>
                <span className="text-xs text-gray-400">({t('mcp.publicHelp')})</span>
              </label>
            </div>
          </div>
        </div>

        {/* Form actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <Link
            href={`/mcp/${mcpId}`}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
```

**Step 2: Add missing translation key**

Add to `src/i18n/locales/en.json` in the "mcp" section:
```json
"editMcp": "Edit MCP"
```

Add to `src/i18n/locales/zh.json` in the "mcp" section:
```json
"editMcp": "编辑 MCP"
```

**Step 3: Run build to verify**

Run: `npm run build 2>&1 | head -50`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/app/mcp/[id]/edit/page.tsx src/i18n/locales/en.json src/i18n/locales/zh.json
git commit -m "feat: Add MCP edit page"
```

---

## Task 4: Create MCP Server Endpoint Handler

**Files:**
- Create: `src/app/annote/mcp/[token]/route.ts`

This endpoint serves MCP prompts via signed URLs. It implements the MCP protocol.

**Step 1: Create MCP server endpoint**

Create file `src/app/annote/mcp/[token]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db/pool';

// MCP Server endpoint - serves prompts via signed URL tokens
// GET /annote/mcp/[token] - Returns MCP manifest
// POST /annote/mcp/[token] - Handles MCP protocol requests

interface McpRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

async function getMcpByToken(token: string) {
  const result = await pool.query(
    `SELECT * FROM mcp_prompts
     WHERE access_token = $1
     AND deployment_status = 'deployed'
     AND is_deleted = false`,
    [token]
  );
  return result.rows[0] || null;
}

// GET handler - returns server info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const mcp = await getMcpByToken(token);
  if (!mcp) {
    return NextResponse.json(
      { error: 'MCP not found or not deployed' },
      { status: 404 }
    );
  }

  // Return MCP server manifest
  return NextResponse.json({
    name: mcp.namespace,
    version: '1.0.0',
    description: mcp.description || mcp.title,
    protocol_version: '2024-11-05',
    capabilities: {
      prompts: {
        listChanged: false
      }
    }
  });
}

// POST handler - handles MCP JSON-RPC requests
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const mcp = await getMcpByToken(token);
  if (!mcp) {
    return NextResponse.json(
      { error: 'MCP not found or not deployed' },
      { status: 404 }
    );
  }

  let body: McpRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      createErrorResponse(null, -32700, 'Parse error'),
      { status: 400 }
    );
  }

  // Validate JSON-RPC format
  if (body.jsonrpc !== '2.0' || !body.method) {
    return NextResponse.json(
      createErrorResponse(body.id, -32600, 'Invalid Request'),
      { status: 400 }
    );
  }

  // Handle MCP methods
  switch (body.method) {
    case 'initialize':
      return NextResponse.json(createSuccessResponse(body.id, {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: mcp.namespace,
          version: '1.0.0'
        },
        capabilities: {
          prompts: {
            listChanged: false
          }
        }
      }));

    case 'prompts/list':
      return NextResponse.json(createSuccessResponse(body.id, {
        prompts: [{
          name: mcp.namespace,
          description: mcp.description || mcp.title,
          arguments: []
        }]
      }));

    case 'prompts/get':
      const promptName = (body.params as { name?: string })?.name;
      if (promptName !== mcp.namespace) {
        return NextResponse.json(
          createErrorResponse(body.id, -32602, `Prompt not found: ${promptName}`),
          { status: 404 }
        );
      }
      return NextResponse.json(createSuccessResponse(body.id, {
        description: mcp.description || mcp.title,
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: mcp.content
          }
        }]
      }));

    case 'notifications/initialized':
      // Notification - no response needed
      return new NextResponse(null, { status: 204 });

    default:
      return NextResponse.json(
        createErrorResponse(body.id, -32601, `Method not found: ${body.method}`),
        { status: 404 }
      );
  }
}

function createSuccessResponse(id: string | number | null, result: unknown): McpResponse {
  return {
    jsonrpc: '2.0',
    id: id ?? 0,
    result
  };
}

function createErrorResponse(id: string | number | null, code: number, message: string): McpResponse {
  return {
    jsonrpc: '2.0',
    id: id ?? 0,
    error: { code, message }
  };
}
```

**Step 2: Run build to verify**

Run: `npm run build 2>&1 | head -50`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/annote/mcp/[token]/route.ts
git commit -m "feat: Add MCP server endpoint handler for serving prompts"
```

---

## Task 5: Test All Phase 2 Features

**Step 1: Start dev server**

Run: `npm run dev`
Expected: Server starts at http://localhost:3000

**Step 2: Test skill download**

1. Navigate to http://localhost:3000/skills
2. Click on an existing skill
3. Click Download button
4. Verify ZIP file downloads with correct structure

**Step 3: Test skill edit**

1. From skill detail page, click Edit
2. Modify title and content
3. Save and verify changes persist

**Step 4: Test MCP edit**

1. Navigate to http://localhost:3000/mcp
2. Click on an existing MCP
3. Click Edit
4. Modify content
5. Save and verify changes persist

**Step 5: Test MCP endpoint**

Using curl or browser:
```bash
curl http://localhost:3000/annote/mcp/[ACCESS_TOKEN]
```
Expected: Returns MCP manifest JSON

```bash
curl -X POST http://localhost:3000/annote/mcp/[ACCESS_TOKEN] \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"prompts/list"}'
```
Expected: Returns prompts list

**Step 6: Commit test report**

```bash
git add test-reports/
git commit -m "test: Add Phase 2 test results"
```

---

## Summary

Phase 2 delivers:
1. **Skill Download** - ZIP files with SKILL.md, prompts/, examples/, tests/ structure
2. **Skill Edit Page** - Full edit form at `/skills/[id]/edit`
3. **MCP Edit Page** - Full edit form at `/mcp/[id]/edit`
4. **MCP Endpoint Handler** - Serves prompts via MCP protocol at `/annote/mcp/[token]`

Total: 4 tasks, ~600 lines of code
