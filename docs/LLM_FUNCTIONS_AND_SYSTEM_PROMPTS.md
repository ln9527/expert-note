# LLM Functions and System Prompts Documentation

This document provides a comprehensive reference of all LLM-calling functions in the Expert Note system, their system prompts, and how prompts are currently managed.

---

## Overview

| Function | File Location | System Prompt Source | Used By API |
|----------|---------------|---------------------|-------------|
| `chatCompletion()` | `src/lib/ai/openrouter.ts:35-92` | N/A (core client) | All LLM calls |
| `extractKnowledge()` | `src/lib/ai/extraction.ts:250-300` | Hardcoded constant | `/api/knowledge/extract` |
| `generateSystemPrompt()` | `src/lib/ai/generation.ts:73-139` | Hardcoded constant | `/api/prompts/generate` |
| `refineAnnotation()` | `src/lib/ai/extraction.ts:306-347` | Inline hardcoded | **Not used** |

---

## 1. `chatCompletion()` — Core LLM Client

**File:** `src/lib/ai/openrouter.ts:35-92`

**Purpose:** Low-level function that sends chat completion requests to OpenRouter API. All other LLM functions use this internally.

**Configuration:**
- API Provider: OpenRouter
- Default Model: `qwen/qwen3-235b-a22b-2507`
- API Key: `process.env.OPENROUTER_API_KEY`

**Related Functions:**
- `chatCompletionStream()` — Streaming variant
- `parseJsonResponse()` — JSON parsing helper
- `parseMarkdownExtractionResponse()` — Extraction output parser

---

## 2. `extractKnowledge()` — Knowledge Extraction

**File:** `src/lib/ai/extraction.ts:250-300`

**Called By:** `/api/knowledge/extract` POST endpoint

### System Prompt Location

**Hardcoded Constant:** `KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT`
**File:** `src/lib/ai/extraction.ts:14-117`
**Length:** ~117 lines

### Full System Prompt

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

**Document Type**: [e.g., Academic paper introduction, Research proposal, Literature review, etc.]

**Summary**: [2-3 sentences explaining what this document is about, its main argument/purpose]

**Structure**: [Brief outline of how the document flows - what comes first, second, etc.]

**Key Themes**: [List the main themes/topics discussed]

---

## 🔴 MACRO Annotations

### 1. [Brief title describing what this comment addresses]

**Text referred to**:
> [Actual quoted text from document that the expert is commenting on - sufficient context to understand the comment, typically 1-3 sentences]

**Expert comment**:
> [The original annotation text]

**Contextualized**: [1-2 sentences interpreting what the expert means, staying close to their words]

---

## 🟡 MESO Annotations

### 1. [Brief title]

**Text referred to**:
> [Quoted text from document]

**Expert comment**:
> [Original annotation]

**Contextualized**: [Interpretation]

---

## 🟢 MICRO Annotations

### 1. [Brief title]

**Text referred to**:
> [Quoted text from document]

**Expert comment**:
> [Original annotation]

**Contextualized**: [Interpretation]

---

## CRITICAL REQUIREMENTS

1. **Document Context MUST be detailed** - Explain what the document is actually about, not generic descriptions
2. **"Text referred to" MUST quote ACTUAL text** from the document, not generic descriptions like "the introduction section"
3. **Quoted text must be SUFFICIENT** to understand the comment (typically 1-3 sentences)
4. **"Contextualized" stays close to expert's words** - Brief interpretation only, do not over-explain
5. **Use proper markdown**: `>` for blockquotes, `**` for bold, `---` for separators
6. **Group annotations by level** (MACRO first, then MESO, then MICRO)
7. **Number annotations within each level** starting from 1
8. **Include ALL annotations** - do not skip any

## ANNOTATION LEVELS

- **MACRO (🔴)**: High-level principles affecting document structure, argumentation, or overall approach
- **MESO (🟡)**: Pattern-level guidance about sections, paragraphs, or methodological elements
- **MICRO (🟢)**: Specific edits, word choices, sentence-level improvements
```

### Current Prompt Loading Logic

**File:** `src/lib/ai/extraction.ts:153-179` (`getExtractionSystemPrompt()`)

```typescript
async function getExtractionSystemPrompt(customInstructions?: string): Promise<string> {
  // Use the knowledge extraction prompt as the base
  let basePrompt = KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT;  // ← Hardcoded default

  // Try to get custom template from database (if user has customized it)
  try {
    const template = await getDefaultTemplate('extraction');
    if (template && template.content.includes('## Document Context')) {
      // Only use database template if it's compatible with new format
      basePrompt = template.content;
    }
  } catch (error) {
    console.warn('[Extraction] Failed to load template from database, using default:', error);
  }

  // Append custom instructions if provided
  if (customInstructions?.trim()) {
    return `${basePrompt}\n\n---\nADDITIONAL INSTRUCTIONS FROM USER:\n${customInstructions.trim()}\n---`;
  }

  return basePrompt;
}
```

### Issue: Hardcoded Prompt Priority

The hardcoded `KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT` is the de facto source of truth. The database template is only used if:
1. It exists in the database
2. It contains the string `## Document Context` (compatibility check at line 160)

This means even if users edit the template in Settings UI, the hardcoded version may still be used.

---

## 3. `generateSystemPrompt()` — Prompt Generation

**File:** `src/lib/ai/generation.ts:73-139`

**Called By:** `/api/prompts/generate` POST endpoint

### System Prompt Location

**Hardcoded Constant:** `GENERATION_SYSTEM_PROMPT`
**File:** `src/lib/ai/generation.ts:6-25`
**Length:** ~20 lines

### Full System Prompt

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

### Additional Hardcoded Templates

**Constant:** `PROMPT_TEMPLATES`
**File:** `src/lib/ai/generation.ts:40-66`

```typescript
export const PROMPT_TEMPLATES = {
  introduction: {
    name: 'Introduction Review',
    description: 'Review and improve paper introductions',
    baseInstructions: 'Focus on establishing research importance, identifying gaps, and articulating contributions clearly.',
  },
  methodology: {
    name: 'Methodology Review',
    description: 'Review research methodology sections',
    baseInstructions: 'Focus on method clarity, reproducibility, and alignment with research questions.',
  },
  discussion: {
    name: 'Discussion Review',
    description: 'Review discussion and interpretation sections',
    baseInstructions: 'Focus on interpretation depth, limitations acknowledgment, and implications.',
  },
  academicCoach: {
    name: 'Academic Writing Coach',
    description: 'General academic writing improvement',
    baseInstructions: 'Provide comprehensive writing guidance across all aspects of academic papers.',
  },
  custom: {
    name: 'Custom Prompt',
    description: 'Create a custom system prompt',
    baseInstructions: '',
  },
} as const;
```

### Issue: No Database Lookup

Unlike `extractKnowledge()`, the `generateSystemPrompt()` function does NOT check the database for templates. It always uses the hardcoded `GENERATION_SYSTEM_PROMPT` constant.

The `PROMPT_TEMPLATES` object provides template types for the UI but these are also hardcoded, not loaded from the database.

---

## 4. `refineAnnotation()` — Single Annotation Refinement

**File:** `src/lib/ai/extraction.ts:306-347`

**Called By:** **No API endpoint currently uses this function**

### System Prompt Location

**Inline Hardcoded String**
**File:** `src/lib/ai/extraction.ts:330`
**Length:** 1 line

### Full System Prompt

```
You are a knowledge refinement specialist. Improve annotations while preserving their original insight and expert voice.
```

### User Prompt Template (Lines 311-325)

```
Refine this [LEVEL] annotation into a clearer, more actionable knowledge entry.

Original annotation: [content]
[Document context if provided]

Provide:
1. A refined version that preserves the original meaning but is clearer and more broadly applicable
2. A brief background describing when/where this insight applies

Output in this format:
### Background
[Brief context about when this knowledge applies]

### Refined Comment
[Your improved version]
```

### Issue: Unused Function

This function is exported but not called by any API endpoint. The `extractKnowledge()` function already produces refined comments as part of its batch processing, making this function potentially redundant.

---

## Settings UI for Prompt Templates

**Location:** `/settings/prompts` (`src/app/settings/prompts/page.tsx`)

### What the UI Does

The Settings UI allows users to:
- View all prompt templates from the database
- Create new templates (extraction or generation category)
- Edit existing templates
- Duplicate templates
- Delete non-default templates

### Database Storage

**Table:** `prompt_templates`
**Schema:** `sql/schema.sql:110-136`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | Template name |
| `description` | TEXT | Optional description |
| `category` | VARCHAR(50) | `extraction` or `generation` |
| `template_type` | VARCHAR(100) | Sub-type identifier |
| `content` | TEXT | The actual prompt content |
| `is_default` | BOOLEAN | Whether this is a default template |
| `is_active` | BOOLEAN | Whether this template is active |
| `version` | INTEGER | Version number |

### Seed Data

**File:** `sql/seed.sql:34-102`

The seed data inserts default templates for both extraction and generation categories.

---

## Issue Summary: Hardcoded System Prompts

### Current Architecture Issues

| Issue | Location | Description |
|-------|----------|-------------|
| Hardcoded extraction prompt | `extraction.ts:14-117` | 117-line prompt constant that requires code deployment to change |
| Hardcoded generation prompt | `generation.ts:6-25` | 20-line prompt constant always used (ignores database) |
| Hardcoded template types | `generation.ts:40-66` | `PROMPT_TEMPLATES` object is hardcoded, not loaded from DB |
| Inline prompt | `extraction.ts:330` | 1-line prompt embedded in function |
| Conditional DB override | `extraction.ts:160-163` | Database template only used if it contains specific string |
| Generation ignores DB | `generation.ts:132` | Always uses hardcoded `GENERATION_SYSTEM_PROMPT` |
| Unused function | `extraction.ts:306-347` | `refineAnnotation()` is exported but never called |

### Settings UI vs Actual Behavior Gap

Users can create and edit templates in `/settings/prompts`, but:
1. **Extraction:** DB template only used if it passes compatibility check (contains `## Document Context`)
2. **Generation:** DB templates are completely ignored; hardcoded prompt always used
3. **Refine:** No UI or API access; prompt is inline in source code

---

## File References

| File | Purpose |
|------|---------|
| `src/lib/ai/openrouter.ts` | OpenRouter API client |
| `src/lib/ai/extraction.ts` | Knowledge extraction with hardcoded prompts |
| `src/lib/ai/generation.ts` | Prompt generation with hardcoded prompts |
| `src/app/settings/prompts/page.tsx` | Settings UI for managing templates |
| `src/app/api/prompt-templates/route.ts` | API for template CRUD |
| `src/lib/db/queries/promptTemplates.ts` | Database queries for templates |
| `sql/schema.sql` | Database schema including `prompt_templates` table |
| `sql/seed.sql` | Default template seed data |
