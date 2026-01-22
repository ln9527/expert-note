# Phase 4: MCP Builder Wizard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a 4-step wizard UI for building MCP prompts with AI assistance, including auto-deploy option and connection config display.

**Architecture:** Reuse patterns from Skills Builder Wizard (Phase 3). Main differences: single content output instead of file structure, namespace field, auto-deploy option, connection panel.

**Tech Stack:** Next.js 16 App Router, React 19, TailwindCSS 4, OpenRouter AI (Grok 4.1 Fast)

---

## Task 1: Create MCP Wizard Page Layout

**Files:**
- Create: `src/app/mcp/build/page.tsx`

**Step 1: Create the page with state management**

Reuse the structure from `/src/app/skills/build/page.tsx` but adapt for MCP:
- Add `namespace` state
- Add `autoDeploy` checkbox state
- Add `deployedMcp` state for showing connection panel
- Change `generatedPlan` to hold single content string instead of file structure

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/i18n';
import { buildApiPath } from '@/lib/utils/pathHelper';

type WizardStep = 'sources' | 'instructions' | 'preview' | 'build';

interface GeneratedMcpPlan {
  content: string;
  namespace: string;
}

interface DeployedMcp {
  id: string;
  title: string;
  namespace: string;
  accessToken: string | null;
  deploymentStatus: string;
}

export default function McpBuilderPage() {
  const { t } = useTranslation();

  // Wizard step state
  const [currentStep, setCurrentStep] = useState<WizardStep>('sources');

  // Source selection state
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);

  // Instructions state
  const [title, setTitle] = useState('');
  const [namespace, setNamespace] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');

  // Build options
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [isPublic, setIsPublic] = useState(false);

  // Generated plan state
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMcpPlan | null>(null);

  // Built MCP state
  const [deployedMcp, setDeployedMcp] = useState<DeployedMcp | null>(null);

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState('');

  // ... navigation helpers and handlers
}
```

**Step 2: Add namespace auto-generation from title**

```tsx
const generateNamespace = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
};

const handleTitleChange = (value: string) => {
  setTitle(value);
  if (!namespace || namespace === generateNamespace(title)) {
    setNamespace(generateNamespace(value));
  }
};
```

**Step 3: Commit**

```bash
git add src/app/mcp/build/page.tsx
git commit -m "feat: Add MCP builder wizard page layout"
```

---

## Task 2: Create MCP-Specific Wizard Components

**Files:**
- Create: `src/components/mcp/McpWizardInstructionsStep.tsx`
- Create: `src/components/mcp/McpWizardPreviewStep.tsx`
- Create: `src/components/mcp/McpWizardBuildStep.tsx`
- Create: `src/components/mcp/McpConnectionPanel.tsx`
- Create: `src/components/mcp/index.ts`

**Step 1: Create McpWizardInstructionsStep**

Similar to skills but adds namespace field:

```tsx
interface McpWizardInstructionsStepProps {
  title: string;
  namespace: string;
  description: string;
  instructions: string;
  onTitleChange: (value: string) => void;
  onNamespaceChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onInstructionsChange: (value: string) => void;
}
```

Include namespace validation (lowercase alphanumeric with hyphens).

**Step 2: Create McpWizardPreviewStep**

Shows the generated MCP prompt content with syntax highlighting.

**Step 3: Create McpWizardBuildStep**

Shows:
- Auto-deploy checkbox
- Public access checkbox
- Build button
- On success: Connection panel with endpoint URL and config snippets

**Step 4: Create McpConnectionPanel**

Shows connection details after build/deploy:
- Access URL
- Claude Code config snippet (JSON)
- Cursor config snippet (JSON)
- Copy buttons

```tsx
interface McpConnectionPanelProps {
  mcp: {
    id: string;
    namespace: string;
    accessToken: string | null;
    deploymentStatus: string;
  };
}
```

**Step 5: Commit**

```bash
git add src/components/mcp/
git commit -m "feat: Add MCP-specific wizard components"
```

---

## Task 3: Create MCP Generate API Endpoint

**Files:**
- Create: `src/app/api/mcp/generate/route.ts`

**Step 1: Write the generate endpoint**

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getDefaultTemplate } from '@/lib/db/queries/promptTemplates';
import { chatCompletion } from '@/lib/ai/openrouter';
import { getPromptById } from '@/lib/db/queries/prompts';
import { getKnowledgeEntryById } from '@/lib/db/queries/knowledge';

interface GenerateRequest {
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  title: string;
  namespace: string;
  description?: string;
  instructions?: string;
}

export async function POST(request: NextRequest) {
  // 1. Validate user and request
  // 2. Load sources
  // 3. Load mcp-generation template (template_type: 'mcp-prompt')
  // 4. Build prompt with template + sources
  // 5. Call AI
  // 6. Return generated content
}
```

**Step 2: Load mcp-prompt template**

```tsx
const mcpTemplate = await getDefaultTemplate('mcp-generation', 'mcp-prompt');
```

**Step 3: Build AI prompt**

```tsx
const prompt = `${mcpTemplate.content}

# User Request
Title: ${title}
Namespace: ${namespace}
Description: ${description || 'None provided'}
Additional Instructions: ${instructions || 'None provided'}

# Source Materials
${sourceContext}

Generate the MCP prompt content now:`;
```

**Step 4: Return response**

```tsx
return NextResponse.json({
  success: true,
  plan: {
    content: generatedContent,
    namespace,
  },
});
```

**Step 5: Commit**

```bash
git add src/app/api/mcp/generate/route.ts
git commit -m "feat: Add MCP generate API endpoint"
```

---

## Task 4: Create MCP Build API Endpoint

**Files:**
- Create: `src/app/api/mcp/build/route.ts`

**Step 1: Write the build endpoint**

```tsx
interface BuildRequest {
  plan: {
    content: string;
    namespace: string;
  };
  title: string;
  description?: string;
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  isShared?: boolean;
  allowEdit?: boolean;
  isPublic?: boolean;
  autoDeploy?: boolean;
}

export async function POST(request: NextRequest) {
  // 1. Validate user and request
  // 2. Create MCP prompt record using existing createMcpPrompt function
  // 3. If autoDeploy, call deploy logic
  // 4. Return created MCP with access token if deployed
}
```

**Step 2: Handle auto-deploy**

```tsx
if (autoDeploy) {
  // Generate access token
  const accessToken = crypto.randomBytes(32).toString('hex');

  // Update MCP with token and deployed status
  await updateMcpPrompt(mcp.id, {
    accessToken,
    deploymentStatus: 'deployed',
  });

  mcp.accessToken = accessToken;
  mcp.deploymentStatus = 'deployed';
}
```

**Step 3: Return response**

```tsx
return NextResponse.json({
  success: true,
  mcpPrompt: mcp,
}, { status: 201 });
```

**Step 4: Commit**

```bash
git add src/app/api/mcp/build/route.ts
git commit -m "feat: Add MCP build API endpoint with auto-deploy"
```

---

## Task 5: Integrate Wizard Components

**Files:**
- Modify: `src/app/mcp/build/page.tsx`

**Step 1: Import components**

Reuse WizardStepIndicator and WizardSourcesStep from skills wizard.
Import MCP-specific components.

**Step 2: Wire up API calls**

```tsx
const handleGenerate = async () => {
  setIsGenerating(true);
  setError('');

  try {
    const response = await fetch(buildApiPath('mcp/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourcePromptIds: selectedPromptIds,
        sourceKnowledgeIds: selectedKnowledgeIds,
        title,
        namespace,
        description,
        instructions,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      setError(data.error || 'Generation failed');
      return;
    }

    setGeneratedPlan(data.plan);
    setCurrentStep('preview');
  } catch (err) {
    setError('Failed to generate MCP prompt');
  } finally {
    setIsGenerating(false);
  }
};

const handleBuild = async () => {
  if (!generatedPlan) return;

  setIsBuilding(true);
  setError('');

  try {
    const response = await fetch(buildApiPath('mcp/build'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: generatedPlan,
        title,
        description,
        sourcePromptIds: selectedPromptIds,
        sourceKnowledgeIds: selectedKnowledgeIds,
        isPublic,
        autoDeploy,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      setError(data.error || 'Build failed');
      return;
    }

    setDeployedMcp(data.mcpPrompt);
    setCurrentStep('build');
  } catch (err) {
    setError('Failed to build MCP prompt');
  } finally {
    setIsBuilding(false);
  }
};
```

**Step 3: Render step content**

**Step 4: Commit**

```bash
git add src/app/mcp/build/page.tsx
git commit -m "feat: Integrate MCP wizard with generate and build APIs"
```

---

## Task 6: Add i18n Translations

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/zh.json`

**Step 1: Add mcpBuilder keys**

```json
{
  "mcpBuilder": {
    "title": "Build an MCP Prompt",
    "subtitle": "Create a deployable MCP prompt from your knowledge",
    "steps": {
      "sources": "Select Sources",
      "instructions": "Instructions",
      "preview": "Preview",
      "build": "Build & Deploy"
    },
    "instructions": {
      "namespace": "Namespace",
      "namespaceHelp": "Unique identifier for your MCP prompt (auto-generated from title)",
      "namespaceInvalid": "Namespace must be lowercase alphanumeric with hyphens"
    },
    "preview": {
      "generating": "Generating MCP prompt...",
      "title": "Review Generated Prompt"
    },
    "build": {
      "autoDeploy": "Auto-deploy after build",
      "autoDeployHelp": "Immediately deploy and get connection details",
      "isPublic": "Public access",
      "isPublicHelp": "Allow anyone with the URL to use this prompt",
      "building": "Building and deploying...",
      "success": "MCP prompt deployed successfully!",
      "viewMcp": "View MCP Details"
    },
    "connection": {
      "title": "Connection Details",
      "accessUrl": "Access URL",
      "claudeCode": "Claude Code Config",
      "cursor": "Cursor Config",
      "copy": "Copy",
      "copied": "Copied!"
    }
  }
}
```

**Step 2: Add Chinese translations**

**Step 3: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat: Add i18n translations for MCP builder wizard"
```

---

## Task 7: Integration Test

**Files:**
- Create: `test-reports/phase4-mcp-builder-test.md`

**Step 1: Test full wizard flow**

1. Navigate to /mcp/build
2. Select prompts and knowledge sources
3. Enter title, verify namespace auto-generates
4. Enter description and instructions
5. Generate preview
6. Verify generated content looks correct
7. Enable auto-deploy
8. Build
9. Verify connection panel shows
10. Copy Claude Code config
11. Verify MCP appears in /mcp list

**Step 2: Document results**

**Step 3: Commit**

```bash
git add test-reports/phase4-mcp-builder-test.md
git commit -m "test: Add Phase 4 MCP builder test report"
```

---

## Task 8: Update Master Plan

**Files:**
- Modify: `docs/plans/MASTER-PLAN-skills-mcp-export.md`

**Step 1: Mark Phase 4 complete**

**Step 2: Add commits and test report reference**

**Step 3: Update next actions for Phase 5**

**Step 4: Commit**

```bash
git add docs/plans/MASTER-PLAN-skills-mcp-export.md
git commit -m "docs: Mark Phase 4 complete in master plan"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | MCP wizard page layout | src/app/mcp/build/page.tsx |
| 2 | MCP-specific components | src/components/mcp/*.tsx |
| 3 | MCP generate API | src/app/api/mcp/generate/route.ts |
| 4 | MCP build API | src/app/api/mcp/build/route.ts |
| 5 | Integrate components | src/app/mcp/build/page.tsx |
| 6 | i18n translations | src/i18n/locales/ |
| 7 | Integration test | test-reports/ |
| 8 | Update master plan | docs/plans/ |

**Key Differences from Skills Wizard:**
- Single content output (not file structure)
- Namespace field with auto-generation
- Auto-deploy option
- Connection panel with config snippets
- Reuses WizardSourcesStep and WizardStepIndicator from skills
