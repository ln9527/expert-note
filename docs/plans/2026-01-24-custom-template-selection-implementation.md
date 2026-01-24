# Custom Template Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to select which generation templates to use (and which components to skip) during Skills/MCP wizard flows.

**Architecture:** Add template selection UI to WizardInstructionsStep, pass template IDs to generate APIs, APIs use specified templates instead of first-match defaults.

**Tech Stack:** React, TypeScript, Next.js API Routes, PostgreSQL

---

## Task 1: Add Type Definitions

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add TemplateConfig interface**

Add after line 434 (after PromptTemplate interface):

```typescript
// Template selection configuration for wizards
export interface TemplateConfig {
  id: string;        // Template UUID to use
  enabled: boolean;  // Whether to generate this component
}

export interface SkillTemplateSelection {
  skillMd: TemplateConfig;       // Required - always enabled
  prompts?: TemplateConfig;      // Optional
  examples?: TemplateConfig;     // Optional
  tests?: TemplateConfig;        // Optional
}

export interface McpTemplateSelection {
  mcpPrompt: TemplateConfig;     // Required - always enabled
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TemplateConfig types for wizard template selection"
```

---

## Task 2: Create TemplateSelector Component

**Files:**
- Create: `src/components/shared/TemplateSelector.tsx`

**Step 1: Create the component**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { buildApiPath } from '@/lib/utils/pathHelper';

interface Template {
  id: string;
  name: string;
  description: string | null;
  templateType: string | null;
}

interface TemplateSelectorItemProps {
  label: string;
  templateType: string;
  templates: Template[];
  selectedId: string;
  enabled: boolean;
  required?: boolean;
  onTemplateChange: (id: string) => void;
  onEnabledChange: (enabled: boolean) => void;
}

function TemplateSelectorItem({
  label,
  templateType,
  templates,
  selectedId,
  enabled,
  required = false,
  onTemplateChange,
  onEnabledChange,
}: TemplateSelectorItemProps) {
  const filteredTemplates = templates.filter(t => t.templateType === templateType);

  return (
    <div className="flex items-center gap-3 py-2">
      <input
        type="checkbox"
        checked={enabled}
        disabled={required}
        onChange={(e) => onEnabledChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
      />
      <label className={`w-24 text-sm font-medium ${enabled ? 'text-gray-700' : 'text-gray-400'}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={selectedId}
        onChange={(e) => onTemplateChange(e.target.value)}
        disabled={!enabled}
        className={`flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          !enabled ? 'bg-gray-100 text-gray-400' : ''
        }`}
      >
        {filteredTemplates.map(t => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
        {filteredTemplates.length === 0 && (
          <option value="">No templates available</option>
        )}
      </select>
    </div>
  );
}

export interface SkillTemplateSelectionState {
  skillMd: { id: string; enabled: boolean };
  prompts: { id: string; enabled: boolean };
  examples: { id: string; enabled: boolean };
  tests: { id: string; enabled: boolean };
}

export interface McpTemplateSelectionState {
  mcpPrompt: { id: string; enabled: boolean };
}

interface SkillTemplateSelectorProps {
  category: 'skill-generation';
  selection: SkillTemplateSelectionState;
  onChange: (selection: SkillTemplateSelectionState) => void;
}

interface McpTemplateSelectorProps {
  category: 'mcp-generation';
  selection: McpTemplateSelectionState;
  onChange: (selection: McpTemplateSelectionState) => void;
}

type TemplateSelectorProps = SkillTemplateSelectorProps | McpTemplateSelectorProps;

export function TemplateSelector(props: TemplateSelectorProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const endpoint = props.category === 'skill-generation'
          ? 'skills/generate'
          : 'mcp/generate';
        const response = await fetch(buildApiPath(endpoint));
        const data = await response.json();
        if (data.success && data.templates) {
          setTemplates(data.templates);

          // Set initial selection to first template of each type
          if (props.category === 'skill-generation') {
            const skillProps = props as SkillTemplateSelectorProps;
            const findDefault = (type: string) =>
              data.templates.find((t: Template) => t.templateType === type)?.id || '';

            if (!skillProps.selection.skillMd.id) {
              skillProps.onChange({
                skillMd: { id: findDefault('skill-md'), enabled: true },
                prompts: { id: findDefault('skill-prompts'), enabled: true },
                examples: { id: findDefault('skill-examples'), enabled: true },
                tests: { id: findDefault('skill-tests'), enabled: true },
              });
            }
          } else {
            const mcpProps = props as McpTemplateSelectorProps;
            const findDefault = (type: string) =>
              data.templates.find((t: Template) => t.templateType === type)?.id || '';

            if (!mcpProps.selection.mcpPrompt.id) {
              mcpProps.onChange({
                mcpPrompt: { id: findDefault('mcp-prompt'), enabled: true },
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [props.category]);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (props.category === 'skill-generation') {
    const { selection, onChange } = props as SkillTemplateSelectorProps;

    return (
      <div className="mt-6 border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg"
        >
          <span className="text-sm font-medium text-gray-700">
            {expanded ? '▼' : '▶'} Advanced: Generation Templates
          </span>
          <span className="text-xs text-gray-500">
            {[selection.prompts?.enabled, selection.examples?.enabled, selection.tests?.enabled].filter(Boolean).length + 1}/4 components enabled
          </span>
        </button>

        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mt-3 mb-2">
              Select which templates to use for generation. Uncheck optional components to skip them.
            </p>

            <TemplateSelectorItem
              label="SKILL.md"
              templateType="skill-md"
              templates={templates}
              selectedId={selection.skillMd.id}
              enabled={true}
              required={true}
              onTemplateChange={(id) => onChange({ ...selection, skillMd: { ...selection.skillMd, id } })}
              onEnabledChange={() => {}} // Required, can't disable
            />

            <TemplateSelectorItem
              label="Prompts"
              templateType="skill-prompts"
              templates={templates}
              selectedId={selection.prompts?.id || ''}
              enabled={selection.prompts?.enabled ?? true}
              onTemplateChange={(id) => onChange({ ...selection, prompts: { ...selection.prompts!, id } })}
              onEnabledChange={(enabled) => onChange({ ...selection, prompts: { ...selection.prompts!, enabled } })}
            />

            <TemplateSelectorItem
              label="Examples"
              templateType="skill-examples"
              templates={templates}
              selectedId={selection.examples?.id || ''}
              enabled={selection.examples?.enabled ?? true}
              onTemplateChange={(id) => onChange({ ...selection, examples: { ...selection.examples!, id } })}
              onEnabledChange={(enabled) => onChange({ ...selection, examples: { ...selection.examples!, enabled } })}
            />

            <TemplateSelectorItem
              label="Tests"
              templateType="skill-tests"
              templates={templates}
              selectedId={selection.tests?.id || ''}
              enabled={selection.tests?.enabled ?? true}
              onTemplateChange={(id) => onChange({ ...selection, tests: { ...selection.tests!, id } })}
              onEnabledChange={(enabled) => onChange({ ...selection, tests: { ...selection.tests!, enabled } })}
            />
          </div>
        )}
      </div>
    );
  } else {
    const { selection, onChange } = props as McpTemplateSelectorProps;

    return (
      <div className="mt-6 border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-lg"
        >
          <span className="text-sm font-medium text-gray-700">
            {expanded ? '▼' : '▶'} Advanced: Generation Template
          </span>
        </button>

        {expanded && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mt-3 mb-2">
              Select which template to use for MCP prompt generation.
            </p>

            <TemplateSelectorItem
              label="MCP Prompt"
              templateType="mcp-prompt"
              templates={templates}
              selectedId={selection.mcpPrompt.id}
              enabled={true}
              required={true}
              onTemplateChange={(id) => onChange({ mcpPrompt: { ...selection.mcpPrompt, id } })}
              onEnabledChange={() => {}}
            />
          </div>
        )}
      </div>
    );
  }
}
```

**Step 2: Create barrel export**

Create `src/components/shared/index.ts`:

```typescript
export { TemplateSelector } from './TemplateSelector';
export type {
  SkillTemplateSelectionState,
  McpTemplateSelectionState
} from './TemplateSelector';
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/shared/
git commit -m "feat: add TemplateSelector component for wizard template selection"
```

---

## Task 3: Update Skills Generate API

**Files:**
- Modify: `src/app/api/skills/generate/route.ts`

**Step 1: Update request interface (around line 39)**

Replace:
```typescript
interface GenerateSkillRequest {
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  title: string;
  description?: string;
  instructions?: string;
}
```

With:
```typescript
interface TemplateConfig {
  id: string;
  enabled: boolean;
}

interface GenerateSkillRequest {
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  title: string;
  description?: string;
  instructions?: string;
  templates?: {
    skillMd?: TemplateConfig;
    prompts?: TemplateConfig;
    examples?: TemplateConfig;
    tests?: TemplateConfig;
  };
}
```

**Step 2: Add helper function to get template by ID or fallback (after buildSourceContext function, around line 117)**

Add:
```typescript
/**
 * Get template by ID or fall back to first matching templateType
 */
async function getTemplateByIdOrDefault(
  templateId: string | undefined,
  templateType: string,
  allTemplates: { id: string; templateType: string | null }[]
): Promise<{ id: string; content: string } | null> {
  // If specific ID provided, fetch it
  if (templateId) {
    const { getPromptTemplateById } = await import('@/lib/db/queries/promptTemplates');
    const template = await getPromptTemplateById(templateId);
    if (template) {
      return { id: template.id, content: template.content };
    }
  }

  // Fall back to first matching template
  const fallback = allTemplates.find(t => t.templateType === templateType);
  if (fallback) {
    const { getPromptTemplateById } = await import('@/lib/db/queries/promptTemplates');
    const template = await getPromptTemplateById(fallback.id);
    if (template) {
      return { id: template.id, content: template.content };
    }
  }

  return null;
}
```

**Step 3: Update POST handler to use template selection (in POST function, around line 160-165)**

After parsing body, extract templates:
```typescript
    const {
      sourcePromptIds = [],
      sourceKnowledgeIds = [],
      title,
      description,
      instructions,
      templates: templateSelection,  // NEW
    } = body;
```

**Step 4: Replace template finding logic (around lines 229-239)**

Replace:
```typescript
    // Load generation templates from database
    const generationTemplates = await getAllPromptTemplates({ category: 'skill-generation' });

    // Find templates by template_type
    const findTemplate = (templateType: string) =>
      generationTemplates.find(t => t.templateType === templateType);

    const skillMdTemplate = findTemplate('skill-md');
    const skillPromptsTemplate = findTemplate('skill-prompts');
    const skillExamplesTemplate = findTemplate('skill-examples');
    const skillTestsTemplate = findTemplate('skill-tests');
```

With:
```typescript
    // Load generation templates from database
    const generationTemplates = await getAllPromptTemplates({ category: 'skill-generation' });
    const templateList = generationTemplates.map(t => ({ id: t.id, templateType: t.templateType }));

    // Get templates - use selected IDs or fall back to defaults
    const skillMdTemplate = await getTemplateByIdOrDefault(
      templateSelection?.skillMd?.id,
      'skill-md',
      templateList
    );

    // Check if optional components are enabled (default: true)
    const promptsEnabled = templateSelection?.prompts?.enabled !== false;
    const examplesEnabled = templateSelection?.examples?.enabled !== false;
    const testsEnabled = templateSelection?.tests?.enabled !== false;

    const skillPromptsTemplate = promptsEnabled
      ? await getTemplateByIdOrDefault(templateSelection?.prompts?.id, 'skill-prompts', templateList)
      : null;
    const skillExamplesTemplate = examplesEnabled
      ? await getTemplateByIdOrDefault(templateSelection?.examples?.id, 'skill-examples', templateList)
      : null;
    const skillTestsTemplate = testsEnabled
      ? await getTemplateByIdOrDefault(templateSelection?.tests?.id, 'skill-tests', templateList)
      : null;
```

**Step 5: Update template usage to use .content (around lines 255-283)**

Change all `skillMdTemplate.content` to `skillMdTemplate?.content` and wrap with null checks.

Replace generation block:
```typescript
    // Generate skill-md content
    console.log('[Skills Generate] Generating SKILL.md content...');
    let skillMd = '';
    if (skillMdTemplate) {
      const skillMdPrompt = `${skillMdTemplate.content}
```

With:
```typescript
    // Generate skill-md content
    console.log('[Skills Generate] Generating SKILL.md content...');
    let skillMd = '';
    if (skillMdTemplate?.content) {
      const skillMdPrompt = `${skillMdTemplate.content}
```

Apply similar pattern to prompts, examples, tests blocks.

**Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/app/api/skills/generate/route.ts
git commit -m "feat: skills generate API accepts template selection with enable/disable"
```

---

## Task 4: Update MCP Generate API

**Files:**
- Modify: `src/app/api/mcp/generate/route.ts`

**Step 1: Update request interface (around line 26)**

Replace:
```typescript
interface GenerateMcpRequest {
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  title: string;
  namespace: string;
  description?: string;
  instructions?: string;
}
```

With:
```typescript
interface GenerateMcpRequest {
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  title: string;
  namespace: string;
  description?: string;
  instructions?: string;
  template?: {
    id: string;
  };
}
```

**Step 2: Extract template selection in POST handler (around line 115)**

Add after parsing body:
```typescript
    const {
      sourcePromptIds = [],
      sourceKnowledgeIds = [],
      title,
      namespace,
      description,
      instructions,
      template: templateSelection,  // NEW
    } = body;
```

**Step 3: Update template loading (around lines 191-193)**

Replace:
```typescript
    // Load MCP generation template from database
    const mcpTemplates = await getAllPromptTemplates({ category: 'mcp-generation' });
    const promptTemplate = mcpTemplates.find(t => t.templateType === 'mcp-prompt');
```

With:
```typescript
    // Load MCP generation template from database
    const mcpTemplates = await getAllPromptTemplates({ category: 'mcp-generation' });

    // Use selected template ID or fall back to first match
    let promptTemplate = null;
    if (templateSelection?.id) {
      const { getPromptTemplateById } = await import('@/lib/db/queries/promptTemplates');
      promptTemplate = await getPromptTemplateById(templateSelection.id);
    }
    if (!promptTemplate) {
      promptTemplate = mcpTemplates.find(t => t.templateType === 'mcp-prompt') || null;
    }
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/app/api/mcp/generate/route.ts
git commit -m "feat: MCP generate API accepts template selection"
```

---

## Task 5: Update Skills Wizard UI

**Files:**
- Modify: `src/components/skills/WizardInstructionsStep.tsx`
- Modify: `src/app/skills/build/page.tsx`

**Step 1: Update WizardInstructionsStep to accept template selection props**

Replace entire file `src/components/skills/WizardInstructionsStep.tsx`:

```typescript
'use client';

import { useTranslation } from '@/i18n';
import { TemplateSelector, SkillTemplateSelectionState } from '@/components/shared';

export interface WizardInstructionsStepProps {
  title: string;
  description: string;
  instructions: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onInstructionsChange: (value: string) => void;
  // NEW: Template selection
  templateSelection: SkillTemplateSelectionState;
  onTemplateSelectionChange: (selection: SkillTemplateSelectionState) => void;
}

export function WizardInstructionsStep({
  title,
  description,
  instructions,
  onTitleChange,
  onDescriptionChange,
  onInstructionsChange,
  templateSelection,
  onTemplateSelectionChange,
}: WizardInstructionsStepProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('skillsBuilder.instructions.title')}
      </h3>
      <p className="text-gray-500 mb-4">
        {t('skillsBuilder.instructions.description')}
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('skillsBuilder.instructions.skillTitle')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('skillsBuilder.instructions.titlePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('skillsBuilder.instructions.skillDescription')}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={t('skillsBuilder.instructions.descriptionPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('skillsBuilder.instructions.buildInstructions')} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={instructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            rows={6}
            placeholder={t('skillsBuilder.instructions.instructionsPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>
      </div>

      {/* Template Selection */}
      <TemplateSelector
        category="skill-generation"
        selection={templateSelection}
        onChange={onTemplateSelectionChange}
      />
    </div>
  );
}
```

**Step 2: Update skills barrel export**

In `src/components/skills/index.ts`, ensure WizardInstructionsStep is exported.

**Step 3: Update skills/build/page.tsx to manage template selection state**

Add import at top:
```typescript
import type { SkillTemplateSelectionState } from '@/components/shared';
```

Add state after line 31:
```typescript
  // Template selection state
  const [templateSelection, setTemplateSelection] = useState<SkillTemplateSelectionState>({
    skillMd: { id: '', enabled: true },
    prompts: { id: '', enabled: true },
    examples: { id: '', enabled: true },
    tests: { id: '', enabled: true },
  });
```

Update handleGenerate to include templates (around line 112):
```typescript
        body: JSON.stringify({
          sourcePromptIds: selectedPromptIds,
          sourceKnowledgeIds: selectedKnowledgeIds,
          title,
          description,
          instructions,
          templates: templateSelection,  // NEW
        }),
```

Update WizardInstructionsStep usage in JSX:
```typescript
            <WizardInstructionsStep
              title={title}
              description={description}
              instructions={instructions}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onInstructionsChange={setInstructions}
              templateSelection={templateSelection}
              onTemplateSelectionChange={setTemplateSelection}
            />
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/components/skills/ src/app/skills/build/page.tsx src/components/shared/
git commit -m "feat: add template selector to Skills wizard instructions step"
```

---

## Task 6: Update MCP Wizard UI

**Files:**
- Create: `src/components/mcp/McpWizardInstructionsStep.tsx` (if separate) or modify existing
- Modify: `src/app/mcp/build/page.tsx`

**Step 1: Check existing MCP instructions component**

Read `src/components/mcp/index.ts` to see current structure.

**Step 2: Add template selection state to MCP build page**

Add import:
```typescript
import type { McpTemplateSelectionState } from '@/components/shared';
```

Add state:
```typescript
  const [templateSelection, setTemplateSelection] = useState<McpTemplateSelectionState>({
    mcpPrompt: { id: '', enabled: true },
  });
```

Update handleGenerate:
```typescript
        body: JSON.stringify({
          sourcePromptIds: selectedPromptIds,
          sourceKnowledgeIds: selectedKnowledgeIds,
          title,
          description,
          instructions,
          namespace,
          template: templateSelection.mcpPrompt.id ? { id: templateSelection.mcpPrompt.id } : undefined,
        }),
```

**Step 3: Add TemplateSelector to MCP instructions step**

Update McpWizardInstructionsStep component to include TemplateSelector with category="mcp-generation".

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/components/mcp/ src/app/mcp/build/page.tsx
git commit -m "feat: add template selector to MCP wizard instructions step"
```

---

## Task 7: Manual Testing

**Step 1: Test Skills wizard with default templates**

1. Navigate to /skills/build
2. Select sources, fill details
3. DO NOT expand Advanced Templates
4. Generate → should use defaults
5. Verify skill generates correctly

**Step 2: Test Skills wizard with custom template selection**

1. Navigate to /skills/build
2. Select sources, fill details
3. Expand Advanced Templates
4. Uncheck "Prompts" and "Tests"
5. Generate → should only generate SKILL.md and Examples
6. Verify ZIP only contains skill.md and examples/

**Step 3: Test MCP wizard**

1. Navigate to /mcp/build
2. Select sources, fill details
3. Expand Advanced Template
4. Generate → should use selected template
5. Verify MCP generates correctly

**Step 4: Verify backward compatibility**

1. Make API call without templates param
2. Verify still works with defaults

---

## Task 8: Final Commit and Documentation

**Step 1: Update CLAUDE.md with session notes**

Add Session 18 entry documenting this feature.

**Step 2: Final commit**

```bash
git add -A
git commit -m "docs: add Session 18 - custom template selection for wizards"
```

---

## Verification Checklist

- [ ] TypeScript compiles with no errors
- [ ] Skills wizard: default templates work
- [ ] Skills wizard: custom template selection works
- [ ] Skills wizard: disabling components skips generation
- [ ] MCP wizard: default template works
- [ ] MCP wizard: custom template selection works
- [ ] API backward compatibility maintained
- [ ] Downloaded skill ZIP reflects enabled/disabled components
