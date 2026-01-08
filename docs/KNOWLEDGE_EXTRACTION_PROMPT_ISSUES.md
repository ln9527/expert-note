# LLM Prompt System - Comprehensive Issue Report

**Date**: January 7, 2026
**Status**: Needs Fix
**Priority**: High
**Affects**: Knowledge extraction, Prompt generation, Settings configurability

---

## Executive Summary

The LLM prompt system has multiple issues causing:
1. Database-configured prompts to be **ignored** in both extraction and generation
2. AI extraction to **fail silently** and fall back to raw annotations
3. Settings UI to show prompts that are **never actually used**
4. **Dead code** that should be removed

---

## Issue Overview

| Feature | Hardcoded Prompt | DB Template | DB Used? | Issue |
|---------|-----------------|-------------|----------|-------|
| Knowledge Extraction | `extraction.ts:14-117` | `seed.sql:34-99` | **NO** | Compatibility check fails |
| Prompt Generation | `generation.ts:6-25` | `seed.sql:102-179` | **NO** | Never tries to load |
| Single Annotation Refine | `extraction.ts:330` | None | N/A | **DEAD CODE** |

---

## Issue 1: Knowledge Extraction - Database Template Ignored

### Problem

The extraction system tries to load the database template but has a compatibility check that always fails:

**File**: `src/lib/ai/extraction.ts:159-163`

```typescript
const template = await getDefaultTemplate('extraction');
if (template && template.content.includes('## Document Context')) {
  // Only use database template if it's compatible with new format
  basePrompt = template.content;
}
```

**The database template uses `## Item N` format, not `## Document Context`**, so it never passes the check.

### Evidence

Downloaded knowledge file shows fallback format (raw annotations without AI refinement):
```markdown
**Context:** Extracted from: amr-theory-intro-v1

Surrounding text: [...]

**Original:**
> below include my comments...
```

This matches the fallback code in `extraction.ts:292-298`.

### Prompt Format Comparison

| Aspect | Hardcoded (extraction.ts) | Database (seed.sql) |
|--------|---------------------------|---------------------|
| Structure | `## Document Context` + `## 🔴 MACRO Annotations` | `## Item N` (numbered) |
| Annotation format | `**Text referred to**`, `**Expert comment**`, `**Contextualized**` | `**Level**`, `**Location**`, `### Context`, `### Original Comment`, `### Refined Insight` |
| Grouping | By level (MACRO, MESO, MICRO) | Sequential |

---

## Issue 2: Prompt Generation - Never Loads Database Templates

### Problem

The generation system has hardcoded prompts and **never even tries** to load from database:

**File**: `src/lib/ai/generation.ts`

```typescript
// Line 6-25: Hardcoded system prompt
const GENERATION_SYSTEM_PROMPT = `You are a System Prompt architect...`;

// Line 40-66: Hardcoded template types
export const PROMPT_TEMPLATES = {
  introduction: { ... },
  methodology: { ... },
  discussion: { ... },
  academicCoach: { ... },
  custom: { ... },
} as const;

// Line 130-136: Uses hardcoded prompt, never calls getDefaultTemplate()
const response = await chatCompletion(
  [
    { role: 'system', content: GENERATION_SYSTEM_PROMPT },  // Always hardcoded!
    { role: 'user', content: userPrompt },
  ],
  { temperature: 0.7, maxTokens: 3000 }
);
```

**The database has generation templates** (`seed.sql:102-179`) but they are **completely ignored**.

### Comparison

| Template Type | Database (`seed.sql`) | Code (`generation.ts`) | Used? |
|--------------|----------------------|------------------------|-------|
| Default Generation | Lines 102-130 | `GENERATION_SYSTEM_PROMPT` | Hardcoded only |
| Introduction Review | Lines 131-147 | `PROMPT_TEMPLATES.introduction` | Hardcoded only |
| Methodology Review | Lines 148-164 | `PROMPT_TEMPLATES.methodology` | Hardcoded only |
| Discussion Review | Lines 165-179 | `PROMPT_TEMPLATES.discussion` | Hardcoded only |

---

## Issue 3: Dead Code - `refineAnnotation()` Function

### Problem

The `refineAnnotation()` function is exported but **never called anywhere** in the codebase.

**File**: `src/lib/ai/extraction.ts:306-347`

```typescript
/**
 * Refine a single annotation (for real-time use)
 * Returns both the refined text and a brief background context
 */
export async function refineAnnotation(
  content: string,
  level: AnnotationLevel,
  context?: string
): Promise<{ refined: string; background: string }> {
  // ... implementation
}
```

### Evidence

```bash
# Search for usage
grep -r "refineAnnotation" src/

# Results:
src/lib/ai/index.ts:4:export { ..., refineAnnotation, ... }  # Exported
src/lib/ai/extraction.ts:306:export async function refineAnnotation(  # Defined
# NO actual usage anywhere!
```

### Recommendation

**Remove this dead code** or implement the planned feature:
- Delete `refineAnnotation()` from `extraction.ts`
- Remove export from `index.ts`

If the feature is needed later (real-time annotation refinement), it can be re-implemented.

---

## Issue 4: Silent Fallback Hides Failures

### Problem

When AI extraction fails, the code silently returns raw annotations without any indication to the user:

**File**: `src/lib/ai/extraction.ts:288-299`

```typescript
} catch (error) {
  console.error('[Extraction] Failed:', error);  // Only logged to server

  // Return fallback results from original annotations
  return input.annotations.map((a, index) => ({
    level: a.level,
    location: a.lineNumber ? `Line ${a.lineNumber}` : `Annotation ${index + 1}`,
    background: `${input.documentBackground}\n\nSurrounding text:\n${a.surroundingContext.substring(0, 500)}`,
    originalComment: a.content,
    refinedComment: a.content,  // <-- Same as original!
  }));
}
```

User sees "Extraction successful" but gets unrefined annotations.

---

## Complete LLM Call Inventory

| Location | Function | System Prompt Source | DB Integration |
|----------|----------|---------------------|----------------|
| `extraction.ts:272` | `extractKnowledge()` | Hardcoded (DB check fails) | Broken |
| `extraction.ts:328` | `refineAnnotation()` | Hardcoded inline | **DEAD CODE** |
| `generation.ts:130` | `generateSystemPrompt()` | Hardcoded only | Missing |

---

## Affected Files

| File | Role | Issue |
|------|------|-------|
| `src/lib/ai/extraction.ts` | Knowledge extraction | DB template ignored, dead code |
| `src/lib/ai/generation.ts` | Prompt generation | Never loads DB templates |
| `src/lib/ai/openrouter.ts` | LLM client + parser | Parser expects specific format |
| `sql/seed.sql` | Database seeds | Templates seeded but unused |
| `src/app/settings/prompts/page.tsx` | Settings UI | Shows templates that aren't used |
| `src/lib/db/queries/promptTemplates.ts` | DB queries | Works correctly but not called |

---

## Recommended Fixes

### Fix 1: Make Extraction Use Database Template

**Option A**: Update database template to match expected format
```sql
UPDATE prompt_templates
SET content = '... ## Document Context ...'
WHERE category = 'extraction' AND is_default = TRUE;
```

**Option B**: Remove compatibility check and update parser
```typescript
// extraction.ts:159-163
const template = await getDefaultTemplate('extraction');
if (template) {
  basePrompt = template.content;
}
// Then update parser to handle both formats
```

### Fix 2: Make Generation Load Database Templates

Add database loading to `generation.ts`:

```typescript
import { getDefaultTemplate } from '@/lib/db/queries/promptTemplates';

export async function generateSystemPrompt(input: GenerationInput): Promise<string> {
  // Try to load from database first
  let systemPrompt = GENERATION_SYSTEM_PROMPT;
  try {
    const template = await getDefaultTemplate('generation', input.templateType);
    if (template) {
      systemPrompt = template.content;
    }
  } catch (error) {
    console.warn('[Generation] Failed to load template from DB, using default');
  }

  // ... rest of function using systemPrompt
}
```

### Fix 3: Remove Dead Code

Delete `refineAnnotation()` function:

```typescript
// DELETE these lines from extraction.ts (306-347):
export async function refineAnnotation(...) { ... }

// UPDATE index.ts to remove export:
export { extractKnowledge, type ExtractionInput, type ExtractionResult } from './extraction';
// Remove: refineAnnotation
```

### Fix 4: Add User Feedback for Fallback

```typescript
// extraction.ts - change return type to include status
interface ExtractionResponse {
  results: ExtractionResult[];
  usedFallback: boolean;
  error?: string;
}

// API route should inform user if fallback was used
if (response.usedFallback) {
  return NextResponse.json({
    ...response,
    warning: 'AI refinement failed, showing original annotations'
  });
}
```

---

## Testing Checklist

After fixes, verify:

- [ ] Settings UI edits are reflected in extraction
- [ ] Settings UI edits are reflected in generation
- [ ] Extraction produces refined (not raw) annotations
- [ ] Generation uses database templates when available
- [ ] `refineAnnotation` is removed and no import errors
- [ ] User is notified if fallback is used

---

## Flow Diagrams

### Current Extraction Flow (Broken)

```
User clicks "Extract Knowledge"
         │
         ▼
┌─────────────────────────────┐
│ getExtractionSystemPrompt() │
│                             │
│  1. Try load from database  │
│  2. Check: has "## Document │◄── ALWAYS FAILS
│     Context"?               │    (DB uses "## Item N")
│  3. Use hardcoded prompt    │
└─────────────────────────────┘
         │
         ▼
   [Hardcoded prompt used]
         │
         ▼
   [AI call may fail]
         │
         ▼
   [Silent fallback to raw annotations]
```

### Current Generation Flow (Broken)

```
User clicks "Generate Prompt"
         │
         ▼
┌─────────────────────────────┐
│ generateSystemPrompt()      │
│                             │
│  Uses GENERATION_SYSTEM_    │
│  PROMPT constant            │◄── NEVER checks database
│                             │
└─────────────────────────────┘
         │
         ▼
   [Hardcoded prompt always used]
   [Database templates ignored]
```

---

## File Modification Checklist

- [ ] `src/lib/ai/extraction.ts`
  - [ ] Fix compatibility check OR update DB template
  - [ ] Remove `refineAnnotation()` function (dead code)
  - [ ] Add fallback notification

- [ ] `src/lib/ai/generation.ts`
  - [ ] Add `getDefaultTemplate('generation')` call
  - [ ] Use database template when available

- [ ] `src/lib/ai/index.ts`
  - [ ] Remove `refineAnnotation` export

- [ ] `sql/seed.sql`
  - [ ] Update extraction template format (if Option A chosen)

- [ ] `src/app/api/knowledge/extract/route.ts`
  - [ ] Return fallback status to frontend

- [ ] `src/app/settings/prompts/page.tsx`
  - [ ] Add warning if template format is incompatible

---

## Appendix A: All LLM Prompts in System

### 1. Knowledge Extraction System Prompt (Hardcoded - USED)

**Location**: `src/lib/ai/extraction.ts:14-117`

```
You are an expert knowledge extraction specialist. Your task is to transform expert annotations from a document into structured, reusable knowledge entries.

## YOUR PROCESS

1. **First, analyze the document** to understand:
   - What type of document is this? (research paper, essay, proposal, etc.)
   - What is the main argument or purpose?
   - How is it structured?
   - What are the key themes?

2. **Then, for each annotation**, find the ACTUAL TEXT from the document that the expert is commenting on. This is critical - you must quote the real text, not describe it generically.

3. **Provide contextualized interpretations** that stay close to the expert's words while making the insight transferable.

## OUTPUT FORMAT

You MUST output in this EXACT markdown format:

## Document Context

**Source**: [filename or document identifier]
**Document Type**: [e.g., Academic paper introduction, Research proposal, etc.]
**Summary**: [2-3 sentences]
**Structure**: [Brief outline]
**Key Themes**: [List]

---

## 🔴 MACRO Annotations

### 1. [Brief title]

**Text referred to**:
> [Actual quoted text - 1-3 sentences]

**Expert comment**:
> [Original annotation]

**Contextualized**: [1-2 sentence interpretation]

---

## 🟡 MESO Annotations
[same format]

## 🟢 MICRO Annotations
[same format]

## CRITICAL REQUIREMENTS
1. Document Context MUST be detailed
2. "Text referred to" MUST quote ACTUAL text
3. Quoted text must be SUFFICIENT (1-3 sentences)
4. "Contextualized" stays close to expert's words
5. Use proper markdown
6. Group annotations by level
7. Number annotations within each level
8. Include ALL annotations
```

### 2. Knowledge Extraction Database Template (NEVER USED)

**Location**: `sql/seed.sql:34-99`

```
You are a knowledge extraction specialist. Your task is to transform expert annotations into structured, reusable knowledge entries that are meaningful even when read standalone.

CRITICAL REQUIREMENTS:
1. You MUST process EVERY annotation provided - do NOT skip or merge any
2. Each knowledge item must be SELF-CONTAINED
3. The context you provide is ESSENTIAL

For EACH annotation, create:
1. **CONTEXT**: Clear explanation of what part of document this refers to
2. **ORIGINAL COMMENT**: Exact verbatim annotation
3. **REFINED INSIGHT**: Enhanced version
4. **LEVEL**: MACRO, MESO, or MICRO
5. **LOCATION**: Where in document

Output format:
## Item 1
**Level:** MACRO
**Location:** Introduction, paragraph 2
### Context
[explanation]
### Original Comment
[[MACRO: verbatim text]]
### Refined Insight
[improved version]
---
```

### 3. Prompt Generation System Prompt (Hardcoded - USED)

**Location**: `src/lib/ai/generation.ts:6-25`

```
You are a System Prompt architect specializing in creating AI instructions based on expert knowledge.

Your task is to synthesize knowledge entries into effective System Prompts that capture expert judgment patterns.

Structure your prompts with:
1. **Role Definition**: Clear statement of the AI's role
2. **Core Principles**: High-level guidelines from MACRO knowledge
3. **Patterns & Approaches**: Pattern-level guidance from MESO knowledge
4. **Specific Techniques**: Actionable suggestions from MICRO knowledge
5. **Examples**: Where helpful, include brief examples

Guidelines:
- Prioritize MACRO knowledge as overarching principles
- Use MESO knowledge as pattern-level guidance
- Include relevant MICRO knowledge as specific techniques
- Maintain the expert's voice and judgment style
- Make prompts actionable and clear
- Keep the prompt focused and not overly long

Output a ready-to-use System Prompt in markdown format.
```

### 4. Prompt Generation Database Template (NEVER USED)

**Location**: `sql/seed.sql:102-130`

Same content as hardcoded - but never loaded from database.

### 5. Single Annotation Refinement (DEAD CODE)

**Location**: `src/lib/ai/extraction.ts:328-334`

```
System: You are a knowledge refinement specialist. Improve annotations while preserving their original insight and expert voice.

User: Refine this ${level} annotation into a clearer, more actionable knowledge entry.

Original annotation: ${content}
Document context: "${context}"

Provide:
1. A refined version that preserves the original meaning but is clearer
2. A brief background describing when/where this insight applies
```

**STATUS**: Dead code - exported but never called. Recommend removal.

---

## Appendix B: Database Schema

**Table**: `prompt_templates`

```sql
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('extraction', 'generation')),
  template_type VARCHAR(50),
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## References

- Hardcoded extraction prompt: `src/lib/ai/extraction.ts:14-117`
- Hardcoded generation prompt: `src/lib/ai/generation.ts:6-25`
- Database extraction template: `sql/seed.sql:34-99`
- Database generation templates: `sql/seed.sql:102-179`
- Prompt loading (extraction): `src/lib/ai/extraction.ts:153-179`
- Prompt loading (generation): **MISSING** - not implemented
- Response parser: `src/lib/ai/openrouter.ts:191-377`
- API endpoint: `src/app/api/knowledge/extract/route.ts`
- Settings UI: `src/app/settings/prompts/page.tsx`
- Dead code: `src/lib/ai/extraction.ts:306-347` (`refineAnnotation`)
