# Phase 3: Skills Builder Wizard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a 4-step wizard UI for building Claude Code skills with AI assistance from user's prompts and knowledge.

**Architecture:** Two-column layout (left: wizard steps, right: live preview) following the existing prompt generator pattern at `/src/app/prompts/generate/page.tsx`. Reuse KnowledgeSelector and create new SkillPreview component.

**Tech Stack:** Next.js 16 App Router, React 19, TailwindCSS 4, OpenRouter AI (Grok 4.1 Fast)

---

## Task 1: Create Wizard Page Layout

**Files:**
- Create: `src/app/skills/build/page.tsx`

**Step 1: Write the basic page structure**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/i18n';

type WizardStep = 'sources' | 'instructions' | 'preview' | 'build';

export default function SkillsBuilderPage() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<WizardStep>('sources');

  // Source selection state
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);

  // Instructions state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');

  // Preview/build state
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header with back link */}
      <div className="flex items-center gap-4">
        <Link href="/skills" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('common.back')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('skills.buildSkill')}</h1>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Wizard steps */}
        <div className="space-y-6">
          {/* Step content renders here based on currentStep */}
        </div>

        {/* Right: Preview panel (sticky) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <SkillPreview plan={generatedPlan} />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify page renders**

Run: `curl http://localhost:3000/skills/build` (after starting dev server)
Expected: Page loads without errors

**Step 3: Commit**

```bash
git add src/app/skills/build/page.tsx
git commit -m "feat: Add skills builder wizard page layout"
```

---

## Task 2: Create Step Indicator Component

**Files:**
- Create: `src/components/skills/StepIndicator.tsx`

**Step 1: Write the step indicator component**

```tsx
'use client';

import { useTranslation } from '@/i18n';

type WizardStep = 'sources' | 'instructions' | 'preview' | 'build';

interface StepIndicatorProps {
  currentStep: WizardStep;
  onStepClick?: (step: WizardStep) => void;
}

const STEPS: { key: WizardStep; number: number }[] = [
  { key: 'sources', number: 1 },
  { key: 'instructions', number: 2 },
  { key: 'preview', number: 3 },
  { key: 'build', number: 4 },
];

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  const { t } = useTranslation();

  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <nav className="flex items-center justify-center">
      <ol className="flex items-center space-x-4">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = step.key === currentStep;
          const isClickable = onStepClick && (isComplete || isCurrent);

          return (
            <li key={step.key} className="flex items-center">
              {index > 0 && (
                <div className={`w-12 h-0.5 mr-4 ${isComplete ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
              <button
                onClick={() => isClickable && onStepClick?.(step.key)}
                disabled={!isClickable}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-blue-100 text-blue-700'
                    : isComplete
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-400'
                } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isComplete
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {isComplete ? '✓' : step.number}
                </span>
                <span className="text-sm font-medium">{t(`skills.wizard.${step.key}`)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

**Step 2: Add i18n translations**

Add to `src/i18n/locales/en.json` under skills:
```json
"wizard": {
  "sources": "Select Sources",
  "instructions": "Instructions",
  "preview": "Preview",
  "build": "Build"
}
```

Add corresponding Chinese translations to `zh.json`.

**Step 3: Commit**

```bash
git add src/components/skills/StepIndicator.tsx src/i18n/locales/en.json src/i18n/locales/zh.json
git commit -m "feat: Add wizard step indicator component"
```

---

## Task 3: Create Source Selection Step Component

**Files:**
- Create: `src/components/skills/SourceSelectionStep.tsx`

**Step 1: Write the source selection component**

Reuse existing `KnowledgeSelector` pattern and add prompt selection.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { buildApiPath } from '@/lib/utils/pathHelper';
import { KnowledgeEntryWithAnnotations, SystemPrompt, Tag } from '@/types';

interface SourceSelectionStepProps {
  selectedPromptIds: string[];
  selectedKnowledgeIds: string[];
  onPromptIdsChange: (ids: string[]) => void;
  onKnowledgeIdsChange: (ids: string[]) => void;
  onNext: () => void;
}

export function SourceSelectionStep({
  selectedPromptIds,
  selectedKnowledgeIds,
  onPromptIdsChange,
  onKnowledgeIdsChange,
  onNext,
}: SourceSelectionStepProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'prompts' | 'knowledge'>('prompts');

  // Data loading
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntryWithAnnotations[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [promptsRes, knowledgeRes, tagsRes] = await Promise.all([
        fetch(buildApiPath('prompts')),
        fetch(buildApiPath('knowledge')),
        fetch(buildApiPath('tags')),
      ]);

      const [promptsData, knowledgeData, tagsData] = await Promise.all([
        promptsRes.json(),
        knowledgeRes.json(),
        tagsRes.json(),
      ]);

      if (promptsData.success) setPrompts(promptsData.prompts || []);
      if (knowledgeData.success) setKnowledge(knowledgeData.knowledgeEntries || []);
      if (tagsData.success) setTags(tagsData.tags || []);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = selectedPromptIds.length > 0 || selectedKnowledgeIds.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('skills.wizard.selectSources')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('skills.wizard.selectSourcesHelp')}</p>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'prompts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('skills.wizard.prompts')} ({selectedPromptIds.length})
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'knowledge'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('skills.wizard.knowledge')} ({selectedKnowledgeIds.length})
          </button>
        </div>

        {/* Selection lists */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
        ) : activeTab === 'prompts' ? (
          <PromptList
            prompts={prompts}
            selectedIds={selectedPromptIds}
            onChange={onPromptIdsChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        ) : (
          <KnowledgeList
            entries={knowledge}
            selectedIds={selectedKnowledgeIds}
            onChange={onKnowledgeIdsChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            tags={tags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        )}
      </div>

      {/* Footer with Next button */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {t('skills.wizard.selectedCount', {
            prompts: selectedPromptIds.length,
            knowledge: selectedKnowledgeIds.length
          })}
        </div>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}

// Sub-components for PromptList and KnowledgeList follow similar patterns
// to existing KnowledgeSelector
```

**Step 2: Add i18n keys**

**Step 3: Commit**

```bash
git add src/components/skills/SourceSelectionStep.tsx src/i18n/locales/
git commit -m "feat: Add source selection step component"
```

---

## Task 4: Create Instructions Step Component

**Files:**
- Create: `src/components/skills/InstructionsStep.tsx`

**Step 1: Write the instructions form component**

```tsx
'use client';

import { useTranslation } from '@/i18n';

interface InstructionsStepProps {
  title: string;
  description: string;
  instructions: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onInstructionsChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function InstructionsStep({
  title,
  description,
  instructions,
  onTitleChange,
  onDescriptionChange,
  onInstructionsChange,
  onBack,
  onNext,
}: InstructionsStepProps) {
  const { t } = useTranslation();

  const canProceed = title.trim().length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('skills.wizard.enterInstructions')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('skills.wizard.enterInstructionsHelp')}</p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('prompts.tableHeaders.title')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('skills.titlePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('prompts.tableHeaders.description')} <span className="text-gray-400">({t('common.optional')})</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={2}
            placeholder={t('skills.descriptionPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Additional Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('skills.wizard.additionalInstructions')} <span className="text-gray-400">({t('common.optional')})</span>
          </label>
          <p className="text-sm text-gray-500 mb-2">{t('skills.wizard.additionalInstructionsHelp')}</p>
          <textarea
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            rows={4}
            placeholder={t('skills.wizard.additionalInstructionsPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
        >
          {t('common.back')}
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          {t('skills.wizard.generatePreview')}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Add i18n keys**

**Step 3: Commit**

```bash
git add src/components/skills/InstructionsStep.tsx src/i18n/locales/
git commit -m "feat: Add instructions step component"
```

---

## Task 5: Create Skills Generate API Endpoint

**Files:**
- Create: `src/app/api/skills/generate/route.ts`

**Step 1: Write the generate endpoint**

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getDefaultTemplate } from '@/lib/db/queries/promptTemplates';
import { chatCompletion, parseJsonResponse } from '@/lib/ai/openrouter';
import { getPromptById } from '@/lib/db/queries/prompts';
import { getKnowledgeEntryById } from '@/lib/db/queries/knowledge';

interface GenerateRequest {
  sourcePromptIds: string[];
  sourceKnowledgeIds: string[];
  title: string;
  description?: string;
  instructions?: string;
}

interface GeneratedFile {
  path: string;
  content: string;
}

interface GeneratedPlan {
  skillMd: string;
  prompts: Record<string, string>;
  examples: Record<string, string>;
  tests: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();
    const { sourcePromptIds, sourceKnowledgeIds, title, description, instructions } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    if (sourcePromptIds.length === 0 && sourceKnowledgeIds.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one source is required' }, { status: 400 });
    }

    // Load source content
    const [promptContents, knowledgeContents] = await Promise.all([
      Promise.all(sourcePromptIds.map(id => getPromptById(id))),
      Promise.all(sourceKnowledgeIds.map(id => getKnowledgeEntryById(id))),
    ]);

    // Build context from sources
    const sourceContext = buildSourceContext(promptContents, knowledgeContents);

    // Load generation templates
    const skillMdTemplate = await getDefaultTemplate('skill-generation', 'skill-md');
    const promptsTemplate = await getDefaultTemplate('skill-generation', 'skill-prompts');
    const examplesTemplate = await getDefaultTemplate('skill-generation', 'skill-examples');
    const testsTemplate = await getDefaultTemplate('skill-generation', 'skill-tests');

    // Generate each component
    const plan: GeneratedPlan = {
      skillMd: await generateSkillMd(skillMdTemplate, title, description, instructions, sourceContext),
      prompts: await generatePrompts(promptsTemplate, title, sourceContext),
      examples: await generateExamples(examplesTemplate, title, sourceContext),
      tests: await generateTests(testsTemplate, title, sourceContext),
    };

    return NextResponse.json({
      success: true,
      plan,
      sourceCount: {
        prompts: sourcePromptIds.length,
        knowledge: sourceKnowledgeIds.length,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/skills/generate error:', error);
    return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 });
  }
}

// Helper functions for building context and calling AI
```

**Step 2: Test endpoint**

Run: `curl -X POST http://localhost:3000/api/skills/generate -H "Content-Type: application/json" -d '{"title":"test"}'`
Expected: Returns error about sources (validates correctly)

**Step 3: Commit**

```bash
git add src/app/api/skills/generate/route.ts
git commit -m "feat: Add skills generate API endpoint"
```

---

## Task 6: Create Preview Step Component

**Files:**
- Create: `src/components/skills/PreviewStep.tsx`

**Step 1: Write the preview component**

Shows expandable sections for SKILL.md, prompts, examples, tests with the generated content.

```tsx
'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n';

interface GeneratedPlan {
  skillMd: string;
  prompts: Record<string, string>;
  examples: Record<string, string>;
  tests: Record<string, string>;
}

interface PreviewStepProps {
  plan: GeneratedPlan | null;
  isGenerating: boolean;
  onBack: () => void;
  onBuild: () => void;
  onRegenerate: () => void;
}

export function PreviewStep({ plan, isGenerating, onBack, onBuild, onRegenerate }: PreviewStepProps) {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['skillMd']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (isGenerating) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">{t('skills.wizard.generating')}</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
        {t('skills.wizard.noPlanYet')}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">{t('skills.wizard.reviewPlan')}</h2>
          <button
            onClick={onRegenerate}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {t('skills.wizard.regenerate')}
          </button>
        </div>

        {/* Expandable sections */}
        <FileSection
          title="SKILL.md"
          content={plan.skillMd}
          expanded={expandedSections.has('skillMd')}
          onToggle={() => toggleSection('skillMd')}
        />

        <FolderSection
          title="prompts/"
          files={plan.prompts}
          expanded={expandedSections.has('prompts')}
          onToggle={() => toggleSection('prompts')}
        />

        <FolderSection
          title="examples/"
          files={plan.examples}
          expanded={expandedSections.has('examples')}
          onToggle={() => toggleSection('examples')}
        />

        <FolderSection
          title="tests/"
          files={plan.tests}
          expanded={expandedSections.has('tests')}
          onToggle={() => toggleSection('tests')}
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
        <button onClick={onBack} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm">
          {t('common.back')}
        </button>
        <button onClick={onBuild} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm">
          {t('skills.wizard.buildSkill')}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Add i18n keys**

**Step 3: Commit**

```bash
git add src/components/skills/PreviewStep.tsx src/i18n/locales/
git commit -m "feat: Add preview step component with expandable sections"
```

---

## Task 7: Create Skills Build API Endpoint

**Files:**
- Create: `src/app/api/skills/build/route.ts`

**Step 1: Write the build endpoint**

This creates the skill record in the database from the confirmed plan.

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createSkill } from '@/lib/db/queries/skills';

interface BuildRequest {
  plan: {
    skillMd: string;
    prompts: Record<string, string>;
    examples: Record<string, string>;
    tests: Record<string, string>;
  };
  title: string;
  description?: string;
  sourcePromptIds: string[];
  sourceKnowledgeIds: string[];
  isShared?: boolean;
  allowEdit?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: BuildRequest = await request.json();
    const { plan, title, description, sourcePromptIds, sourceKnowledgeIds, isShared, allowEdit } = body;

    if (!plan || !title?.trim()) {
      return NextResponse.json({ success: false, error: 'Plan and title are required' }, { status: 400 });
    }

    // Create skill with structured content
    const skill = await createSkill({
      title: title.trim(),
      description: description?.trim() || null,
      content: {
        skill_md: plan.skillMd,
        prompts: plan.prompts,
        examples: plan.examples,
        tests: plan.tests,
      },
      sourcePromptIds,
      sourceKnowledgeIds,
      createdBy: user.userId,
      isShared: isShared ?? false,
      allowEdit: allowEdit ?? false,
    });

    return NextResponse.json({
      success: true,
      skill,
      downloadUrl: `/api/skills/${skill.id}/download`,
    });
  } catch (error) {
    console.error('[API] POST /api/skills/build error:', error);
    return NextResponse.json({ success: false, error: 'Build failed' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/skills/build/route.ts
git commit -m "feat: Add skills build API endpoint"
```

---

## Task 8: Create Build Complete Step Component

**Files:**
- Create: `src/components/skills/BuildCompleteStep.tsx`

**Step 1: Write the completion component**

Shows success message with download button and link to skill detail.

```tsx
'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n';

interface BuildCompleteStepProps {
  skill: {
    id: string;
    title: string;
  };
  downloadUrl: string;
  isBuilding: boolean;
  onDownload: () => void;
  onBuildAnother: () => void;
}

export function BuildCompleteStep({
  skill,
  downloadUrl,
  isBuilding,
  onDownload,
  onBuildAnother,
}: BuildCompleteStepProps) {
  const { t } = useTranslation();

  if (isBuilding) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">{t('skills.wizard.building')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('skills.wizard.buildSuccess')}</h2>
      <p className="text-gray-600 mb-6">{t('skills.wizard.buildSuccessHelp', { title: skill.title })}</p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onDownload}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t('skills.wizard.downloadZip')}
        </button>

        <Link
          href={`/skills/${skill.id}`}
          className="inline-flex items-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
        >
          {t('skills.wizard.viewSkill')}
        </Link>
      </div>

      <button
        onClick={onBuildAnother}
        className="mt-6 text-sm text-blue-600 hover:text-blue-700"
      >
        {t('skills.wizard.buildAnother')}
      </button>
    </div>
  );
}
```

**Step 2: Add i18n keys**

**Step 3: Commit**

```bash
git add src/components/skills/BuildCompleteStep.tsx src/i18n/locales/
git commit -m "feat: Add build complete step with download button"
```

---

## Task 9: Create Skill Preview Sidebar Component

**Files:**
- Create: `src/components/skills/SkillPreview.tsx`

**Step 1: Write the sticky preview sidebar**

```tsx
'use client';

import { useTranslation } from '@/i18n';

interface GeneratedPlan {
  skillMd: string;
  prompts: Record<string, string>;
  examples: Record<string, string>;
  tests: Record<string, string>;
}

interface SkillPreviewProps {
  plan: GeneratedPlan | null;
  title?: string;
  sourceCount?: { prompts: number; knowledge: number };
}

export function SkillPreview({ plan, title, sourceCount }: SkillPreviewProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{t('skills.wizard.preview')}</h3>
      </div>

      <div className="p-4 space-y-4">
        {title && (
          <div>
            <span className="text-sm text-gray-500">{t('prompts.tableHeaders.title')}:</span>
            <p className="font-medium text-gray-900">{title}</p>
          </div>
        )}

        {sourceCount && (
          <div>
            <span className="text-sm text-gray-500">{t('skills.wizard.sources')}:</span>
            <p className="text-sm text-gray-700">
              {sourceCount.prompts} {t('skills.wizard.prompts')}, {sourceCount.knowledge} {t('skills.wizard.knowledge')}
            </p>
          </div>
        )}

        {plan ? (
          <div className="space-y-2">
            <span className="text-sm text-gray-500">{t('skills.wizard.files')}:</span>
            <ul className="text-sm font-mono text-gray-700 space-y-1">
              <li>📄 SKILL.md</li>
              {Object.keys(plan.prompts).map(file => (
                <li key={file}>📄 prompts/{file}</li>
              ))}
              {Object.keys(plan.examples).map(file => (
                <li key={file}>📄 examples/{file}</li>
              ))}
              {Object.keys(plan.tests).map(file => (
                <li key={file}>📄 tests/{file}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">{t('skills.wizard.noPreviewYet')}</p>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/skills/SkillPreview.tsx
git commit -m "feat: Add skill preview sidebar component"
```

---

## Task 10: Integrate All Components in Wizard Page

**Files:**
- Modify: `src/app/skills/build/page.tsx`

**Step 1: Import and wire up all components**

Update the wizard page to import all step components and handle state transitions between steps.

**Step 2: Test full wizard flow**

1. Navigate to /skills/build
2. Select at least one source
3. Enter title
4. Generate preview
5. Build and download

**Step 3: Commit**

```bash
git add src/app/skills/build/page.tsx
git commit -m "feat: Integrate all wizard components with state management"
```

---

## Task 11: Add Complete i18n Translations

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/zh.json`

**Step 1: Audit and add all missing translation keys**

Ensure all wizard-related strings are translated.

**Step 2: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat: Add complete i18n translations for skills wizard"
```

---

## Task 12: Integration Test

**Files:**
- Create: `test-reports/phase3-skills-builder-test.md`

**Step 1: Test full wizard flow via browser**

Using Chrome MCP, test:
1. Navigate to /skills/build
2. Select prompts and knowledge
3. Enter title and instructions
4. Generate preview
5. Verify preview shows all files
6. Build skill
7. Download ZIP
8. Verify ZIP contains correct structure

**Step 2: Document results**

**Step 3: Commit**

```bash
git add test-reports/phase3-skills-builder-test.md
git commit -m "test: Add Phase 3 skills builder test report"
```

---

## Task 13: Update Master Plan

**Files:**
- Modify: `docs/plans/MASTER-PLAN-skills-mcp-export.md`

**Step 1: Mark Phase 3 complete**

Update status and add commits.

**Step 2: Commit**

```bash
git add docs/plans/MASTER-PLAN-skills-mcp-export.md
git commit -m "docs: Mark Phase 3 complete in master plan"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Wizard page layout | src/app/skills/build/page.tsx |
| 2 | Step indicator component | src/components/skills/StepIndicator.tsx |
| 3 | Source selection step | src/components/skills/SourceSelectionStep.tsx |
| 4 | Instructions step | src/components/skills/InstructionsStep.tsx |
| 5 | Generate API endpoint | src/app/api/skills/generate/route.ts |
| 6 | Preview step | src/components/skills/PreviewStep.tsx |
| 7 | Build API endpoint | src/app/api/skills/build/route.ts |
| 8 | Build complete step | src/components/skills/BuildCompleteStep.tsx |
| 9 | Preview sidebar | src/components/skills/SkillPreview.tsx |
| 10 | Integrate all components | src/app/skills/build/page.tsx |
| 11 | i18n translations | src/i18n/locales/ |
| 12 | Integration test | test-reports/ |
| 13 | Update master plan | docs/plans/ |
