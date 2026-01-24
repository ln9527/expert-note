# Custom Template Selection for Skills/MCP Wizards

**Date**: 2026-01-24
**Status**: Design Complete - Ready for Implementation

---

## Problem Statement

Currently, the Skills and MCP wizards always use the default generation templates. Users cannot:
1. Select alternative templates for different output styles
2. Use domain-specific templates (e.g., security-focused)
3. Disable optional components (prompts, examples, tests)

## Solution Overview

Add template selection UI to the wizard Details step, pass selected template IDs to the API, and ensure the API uses the specified templates during generation.

---

## Detailed Design

### UI Changes

**Location**: Wizard Details Step (Step 2) - collapsible "Advanced: Generation Templates" section

**Skills Wizard Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ ▼ Advanced: Generation Templates                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ☑ SKILL.md        [Skill MD Generator      ▼]      │ │
│ │ ☐ Prompts         [Skill Prompts Generator ▼] (off)│ │
│ │ ☑ Examples        [Skill Examples Generator ▼]     │ │
│ │ ☐ Tests           [Skill Tests Generator   ▼] (off)│ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Tip: Uncheck components you don't need. Only SKILL.md  │
│ is required.                                            │
└─────────────────────────────────────────────────────────┘
```

**MCP Wizard Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ ▼ Advanced: Generation Templates                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ☑ MCP Prompt      [MCP Prompt Generator    ▼]      │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Behavior**:
- Collapsed by default (most users use defaults)
- Each component has checkbox (enable/disable) + dropdown (select template)
- SKILL.md / MCP Prompt is always required (checkbox disabled)
- Prompts, Examples, Tests are optional (default: all checked)
- Dropdown shows all templates matching that templateType
- Default template is pre-selected
- When unchecked, dropdown is grayed out, component skipped during generation

---

### API Changes

**Endpoint**: `POST /api/skills/generate`

**New Request Body**:
```typescript
interface GenerateSkillRequest {
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  title: string;
  description?: string;
  instructions?: string;
  // NEW: Template selection
  templates?: {
    skillMd?: TemplateConfig;    // required, always enabled
    prompts?: TemplateConfig;    // optional
    examples?: TemplateConfig;   // optional
    tests?: TemplateConfig;      // optional
  };
}

interface TemplateConfig {
  id: string;        // Template UUID to use
  enabled: boolean;  // Whether to generate this component
}
```

**API Logic**:
```typescript
const getTemplate = async (
  templateType: string,
  config?: TemplateConfig,
  allTemplates: PromptTemplate[]
) => {
  // If explicitly disabled, skip
  if (config && !config.enabled) {
    return null;
  }
  // If specific ID provided, use it
  if (config?.id) {
    const template = await getPromptTemplateById(config.id);
    if (template) return template;
  }
  // Fallback to first matching template (default)
  return allTemplates.find(t => t.templateType === templateType) || null;
};
```

**Response**: Same structure, but skipped components return empty objects:
```typescript
{
  success: true,
  plan: {
    skillMd: "# my-skill\n...",
    prompts: {},      // empty if disabled
    examples: {...},  // generated if enabled
    tests: {},        // empty if disabled
  }
}
```

---

### MCP API Changes

**Endpoint**: `POST /api/mcp/generate`

**New Request Body**:
```typescript
interface GenerateMcpRequest {
  sourcePromptIds?: string[];
  sourceKnowledgeIds?: string[];
  title: string;
  namespace: string;
  description?: string;
  instructions?: string;
  // NEW: Template selection
  template?: {
    id: string;      // MCP template UUID to use
  };
}
```

---

### Type Definitions

**File**: `src/types/index.ts`

```typescript
// Template selection for wizard
export interface TemplateConfig {
  id: string;
  enabled: boolean;
}

export interface SkillTemplateSelection {
  skillMd: TemplateConfig;      // required
  prompts?: TemplateConfig;     // optional
  examples?: TemplateConfig;    // optional
  tests?: TemplateConfig;       // optional
}

export interface McpTemplateSelection {
  mcpPrompt: TemplateConfig;    // required
}
```

---

## Files to Change

| File | Change Type | Description |
|------|-------------|-------------|
| `src/types/index.ts` | Modify | Add TemplateConfig, SkillTemplateSelection, McpTemplateSelection |
| `src/app/api/skills/generate/route.ts` | Modify | Accept templates param, use specified IDs, skip disabled |
| `src/app/api/mcp/generate/route.ts` | Modify | Accept template param, use specified ID |
| `src/components/skills/WizardDetailsStep.tsx` | Modify | Add template selector UI |
| `src/components/mcp/WizardDetailsStep.tsx` | Modify | Add template selector UI |
| `src/components/shared/TemplateSelector.tsx` | Create | Reusable checkbox + dropdown component |

---

## Implementation Order

1. **Phase 1: Types**
   - Add type definitions to `src/types/index.ts`

2. **Phase 2: Shared Component**
   - Create `TemplateSelector.tsx` component

3. **Phase 3: Skills API**
   - Update `/api/skills/generate` to accept and use template selections
   - Maintain backward compatibility (templates param is optional)

4. **Phase 4: Skills UI**
   - Add template selector to `WizardDetailsStep.tsx`
   - Fetch available templates on mount
   - Pass selections to generate API

5. **Phase 5: MCP API**
   - Update `/api/mcp/generate` with same pattern

6. **Phase 6: MCP UI**
   - Add template selector to MCP `WizardDetailsStep.tsx`

7. **Phase 7: Testing**
   - Test with default templates (backward compat)
   - Test with custom template selection
   - Test with disabled components

---

## Verification Checklist

- [ ] Creating skill with default templates works (backward compat)
- [ ] Creating skill with custom template selection uses correct templates
- [ ] Disabling prompts/examples/tests skips those components
- [ ] Downloaded skill ZIP only contains enabled components
- [ ] Creating MCP with default template works
- [ ] Creating MCP with custom template selection works
- [ ] UI shows all available templates per type in dropdowns
- [ ] Default template is pre-selected in each dropdown

---

## Future Enhancements (Out of Scope)

- Template versioning (use specific version)
- Template preview in dropdown
- "Create new template" link from dropdown
- Per-org default template settings
