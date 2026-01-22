# Phase 5: Polish & Production Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Skills & MCP Export feature production-ready with CORS, rate limiting, public sharing, and download tracking.

**Architecture:** Add middleware for CORS/rate limiting, wire up is_public field for MCP access control, add download tracking to MCP prompts, create user documentation.

**Tech Stack:** Next.js 16 App Router, PostgreSQL, TailwindCSS

---

## Task 1: Add CORS Headers to MCP Endpoint

**Files:**
- Modify: `src/app/annote/mcp/[token]/route.ts`

**Step 1: Create CORS headers helper**

Add a helper function to create CORS headers:

```typescript
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
```

**Step 2: Add OPTIONS handler for CORS preflight**

```typescript
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
```

**Step 3: Update GET and POST to include CORS headers**

Modify all `NextResponse.json()` calls to include headers:

```typescript
return NextResponse.json(data, { headers: corsHeaders() });
```

**Step 4: Commit**

```bash
git add src/app/annote/mcp/[token]/route.ts
git commit -m "feat: Add CORS headers to MCP endpoint"
```

---

## Task 2: Add Rate Limiting to MCP Endpoint

**Files:**
- Create: `src/lib/rateLimit.ts`
- Modify: `src/app/annote/mcp/[token]/route.ts`

**Step 1: Create simple in-memory rate limiter**

```typescript
// src/lib/rateLimit.ts
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 60 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);
```

**Step 2: Apply rate limiting to MCP endpoint**

In the GET and POST handlers, add at the start:

```typescript
import { checkRateLimit } from '@/lib/rateLimit';

// Get client IP for rate limiting
const forwardedFor = request.headers.get('x-forwarded-for');
const clientIp = forwardedFor?.split(',')[0] || 'unknown';
const rateLimitKey = `mcp:${clientIp}:${token}`;

const rateLimit = checkRateLimit(rateLimitKey, { windowMs: 60000, maxRequests: 100 });

if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded. Please try again later.' },
    {
      status: 429,
      headers: {
        ...corsHeaders(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(rateLimit.resetTime),
        'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
      }
    }
  );
}
```

**Step 3: Add rate limit headers to all responses**

```typescript
headers: {
  ...corsHeaders(),
  'X-RateLimit-Remaining': String(rateLimit.remaining),
  'X-RateLimit-Reset': String(rateLimit.resetTime),
}
```

**Step 4: Commit**

```bash
git add src/lib/rateLimit.ts src/app/annote/mcp/[token]/route.ts
git commit -m "feat: Add rate limiting to MCP endpoint"
```

---

## Task 3: Add Access Tracking to MCP Prompts

**Files:**
- Create: `sql/migrations/014_mcp_access_tracking.sql`
- Modify: `src/lib/db/queries/mcpPrompts.ts`
- Modify: `src/app/annote/mcp/[token]/route.ts`

**Step 1: Create migration for access_count column**

```sql
-- 014_mcp_access_tracking.sql
-- Add access_count column to mcp_prompts table

ALTER TABLE mcp_prompts
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- Add index for frequently accessed MCPs
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_access_count
ON mcp_prompts(access_count DESC)
WHERE is_deleted = FALSE;
```

**Step 2: Add incrementAccessCount function to mcpPrompts.ts**

```typescript
export async function incrementAccessCount(id: string): Promise<void> {
  await query(
    `UPDATE mcp_prompts
     SET access_count = access_count + 1
     WHERE id = $1`,
    [id]
  );
}
```

**Step 3: Call incrementAccessCount in MCP endpoint**

In the POST handler, after successfully handling a request:

```typescript
// Track access
incrementAccessCount(mcp.id).catch(err =>
  console.error('[MCP] Failed to increment access count:', err)
);
```

**Step 4: Apply migration**

```bash
psql -h localhost -U ningli -d annotservice -f sql/migrations/014_mcp_access_tracking.sql
```

**Step 5: Commit**

```bash
git add sql/migrations/014_mcp_access_tracking.sql src/lib/db/queries/mcpPrompts.ts src/app/annote/mcp/[token]/route.ts
git commit -m "feat: Add access tracking to MCP prompts"
```

---

## Task 4: Wire Up is_public Field for MCP Access

**Files:**
- Modify: `src/app/annote/mcp/[token]/route.ts`
- Modify: `src/app/mcp/[id]/page.tsx` (show public badge)

**Step 1: Update getMcpPromptByAccessToken to check is_public**

The current implementation already works for deployed MCPs. The is_public field should control whether the MCP appears in public listings, not token-based access. Token-based access is inherently "public" if you have the token.

No change needed for token access - having the token IS the authorization.

**Step 2: Add public badge to MCP detail page**

In `src/app/mcp/[id]/page.tsx`, show a badge when is_public is true:

```tsx
{mcp.isPublic && (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
    {t('mcp.publicBadge')}
  </span>
)}
```

**Step 3: Commit**

```bash
git add src/app/mcp/[id]/page.tsx
git commit -m "feat: Show public badge on MCP detail page"
```

---

## Task 5: Add Multi-Tool Config Support

**Files:**
- Modify: `src/components/mcp/McpConnectionPanel.tsx`

**Step 1: Add config generators for additional tools**

Add support for Windsurf and generic MCP client:

```typescript
const getWindsurfConfig = () => {
  const url = getAccessUrl();
  return JSON.stringify({
    mcpServers: {
      [mcp.namespace]: {
        serverUrl: url
      }
    }
  }, null, 2);
};

const getGenericConfig = () => {
  const url = getAccessUrl();
  return `Server URL: ${url}
Namespace: ${mcp.namespace}
Protocol: MCP (Model Context Protocol)
Transport: HTTP/SSE`;
};
```

**Step 2: Add tabs for different tools**

Add a simple tab interface to switch between config formats:

```tsx
const [activeTab, setActiveTab] = useState<'claude' | 'cursor' | 'windsurf' | 'generic'>('claude');

// Tab buttons
<div className="flex space-x-2 mb-4">
  {['claude', 'cursor', 'windsurf', 'generic'].map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab as typeof activeTab)}
      className={`px-3 py-1 text-sm rounded ${
        activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {tab === 'claude' ? 'Claude Code' : tab === 'cursor' ? 'Cursor' : tab === 'windsurf' ? 'Windsurf' : 'Generic'}
    </button>
  ))}
</div>
```

**Step 3: Commit**

```bash
git add src/components/mcp/McpConnectionPanel.tsx
git commit -m "feat: Add multi-tool config support (Windsurf, generic)"
```

---

## Task 6: Add i18n Keys for New Features

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/zh.json`

**Step 1: Add new translation keys**

```json
{
  "mcp": {
    "publicBadge": "Public",
    "accessCount": "Access Count",
    "rateLimited": "Rate limited. Please try again later.",
    "configTabs": {
      "claudeCode": "Claude Code",
      "cursor": "Cursor",
      "windsurf": "Windsurf",
      "generic": "Generic"
    }
  }
}
```

**Step 2: Add Chinese translations**

**Step 3: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat: Add i18n keys for Phase 5 features"
```

---

## Task 7: Create User Documentation

**Files:**
- Create: `docs/user-guide/07-skills-export.md`
- Create: `docs/user-guide/08-mcp-endpoints.md`

**Step 1: Write Skills Export guide**

```markdown
# Skills Export Guide

## What are Skills?

Skills are packaged AI prompts that can be installed in Claude Code...

## Building a Skill

1. Navigate to Skills > Build Skill
2. Select source prompts and knowledge entries
3. Enter title and instructions
4. Review generated content
5. Download ZIP package

## Installing in Claude Code

1. Extract the ZIP file
2. Copy to your Claude Code skills directory
3. Restart Claude Code
```

**Step 2: Write MCP Endpoints guide**

```markdown
# MCP Endpoints Guide

## What are MCP Prompts?

MCP (Model Context Protocol) prompts are deployable AI prompts...

## Building an MCP Prompt

1. Navigate to MCP > Build MCP
2. Select sources
3. Enter title and namespace
4. Enable auto-deploy
5. Copy connection config

## Connecting to Your MCP

### Claude Code
Add to your settings...

### Cursor
Add to your settings...
```

**Step 3: Commit**

```bash
git add docs/user-guide/
git commit -m "docs: Add user guides for Skills and MCP features"
```

---

## Task 8: Integration Test and Final Polish

**Files:**
- Create: `test-reports/phase5-polish-production-test.md`

**Step 1: Test CORS headers**

Use curl to verify CORS:
```bash
curl -X OPTIONS https://localhost:3000/annote/mcp/testtoken -H "Origin: https://example.com" -v
```

Verify response includes:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`

**Step 2: Test rate limiting**

Make 100+ rapid requests and verify 429 response.

**Step 3: Test access tracking**

Make MCP API calls and verify access_count increments.

**Step 4: Document results**

Create test report with all findings.

**Step 5: Commit**

```bash
git add test-reports/phase5-polish-production-test.md
git commit -m "test: Add Phase 5 polish and production test report"
```

---

## Task 9: Update Master Plan

**Files:**
- Modify: `docs/plans/MASTER-PLAN-skills-mcp-export.md`

**Step 1: Mark Phase 5 complete**

**Step 2: Add commits and test report reference**

**Step 3: Commit**

```bash
git add docs/plans/MASTER-PLAN-skills-mcp-export.md
git commit -m "docs: Mark Phase 5 complete in master plan"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | CORS headers | src/app/annote/mcp/[token]/route.ts |
| 2 | Rate limiting | src/lib/rateLimit.ts, route.ts |
| 3 | Access tracking | migration, mcpPrompts.ts, route.ts |
| 4 | Public badge | src/app/mcp/[id]/page.tsx |
| 5 | Multi-tool config | McpConnectionPanel.tsx |
| 6 | i18n keys | locales/en.json, zh.json |
| 7 | User documentation | docs/user-guide/*.md |
| 8 | Integration test | test-reports/ |
| 9 | Update master plan | MASTER-PLAN.md |

**Note:** Production deployment to spansurvey.net is a manual process documented in DEPLOYMENT.md and should be done after all code changes are verified.
