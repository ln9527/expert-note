# Knowledge Extraction Prompt System - Issue Report

**Date**: January 7, 2026
**Status**: Needs Fix
**Priority**: High
**Affects**: Knowledge extraction quality, Settings configurability

---

## Executive Summary

The knowledge extraction feature has a **prompt mismatch issue** that causes:
1. Database-configured prompts to be **ignored**
2. AI extraction to **fail silently** and fall back to raw annotations
3. Settings UI to show a prompt that is **never actually used**

---

## Issue Description

When a user clicks "Extract Knowledge" on an annotated document, the system should:
1. Send the document + annotations to an AI (Qwen via OpenRouter)
2. AI refines annotations with context and interpretation
3. Save refined knowledge entries

**Actual behavior**: Extraction often falls back to raw annotations without AI refinement.

---

## Root Cause Analysis

### Problem 1: Prompt Format Mismatch

There are **two different prompt formats** that don't match:

| Location | File | Format |
|----------|------|--------|
| Hardcoded | `src/lib/ai/extraction.ts:14-117` | `## Document Context` + `## 🔴 MACRO Annotations` |
| Database | `sql/seed.sql:34-99` | `## Item N` (numbered sequentially) |

### Problem 2: Database Prompt Never Used

The code in `extraction.ts:159-163` has a compatibility check:

```typescript
const template = await getDefaultTemplate('extraction');
if (template && template.content.includes('## Document Context')) {
  // Only use database template if it's compatible with new format
  basePrompt = template.content;
}
```

**The database template does NOT contain `"## Document Context"`**, so it **always fails** this check.

**Result**: The hardcoded prompt is ALWAYS used, making the Settings UI ineffective.

### Problem 3: Parser Expects Specific Format

The response parser in `openrouter.ts:191-255` expects:
- `## 🔴 MACRO Annotations` section header
- `### N. [title]` format for each annotation
- `**Text referred to**:`, `**Expert comment**:`, `**Contextualized**:` fields

If the AI doesn't output this exact format, parsing fails and falls back to raw annotations.

### Problem 4: Silent Fallback Hides Failures

When AI extraction fails, the code silently falls back to raw annotations (`extraction.ts:292-298`):

```typescript
// Return fallback results from original annotations
return input.annotations.map((a, index) => ({
  level: a.level,
  location: a.lineNumber ? `Line ${a.lineNumber}` : `Annotation ${index + 1}`,
  background: `${input.documentBackground}\n\nSurrounding text:\n${a.surroundingContext.substring(0, 500)}`,
  originalComment: a.content,
  refinedComment: a.content,  // <-- Same as original, no refinement!
}));
```

Users see "extraction succeeded" but get unrefined annotations.

---

## Evidence

### Downloaded Knowledge Entry Shows Fallback Format

File: `/Users/ningli/Downloads/knowledge-entry-a0158398.md`

```markdown
### 🔴 Macro (High-level) (1)

#### 1. Line 2

**Context:** Extracted from: amr-theory-intro-v1

Surrounding text:
## A Contingent Theory of Human-AI Creative Collaboration...

**Original:**
> below include my comments, which is a bit ai feel like...
```

**Notice**:
- `**Context:**` shows the fallback format (`Extracted from: X\n\nSurrounding text:`)
- No `**Refined:**` section (because `refinedComment === originalComment`)
- This matches the fallback code, NOT the AI output format

---

## Affected Files

| File | Role | Issue |
|------|------|-------|
| `src/lib/ai/extraction.ts` | Extraction logic + hardcoded prompt | Compatibility check ignores DB template |
| `src/lib/ai/openrouter.ts` | Response parser | Expects specific markdown format |
| `sql/seed.sql` | Database seed | Template format doesn't match hardcoded |
| `src/app/settings/prompts/page.tsx` | Settings UI | Shows/edits unused template |
| `src/lib/db/queries/promptTemplates.ts` | DB queries | Works correctly but template unused |

---

## Recommended Fixes

### Option A: Align Database Template with Hardcoded Format (Recommended)

Update `sql/seed.sql` to use the same format as the hardcoded prompt:

```sql
UPDATE prompt_templates
SET content = 'You are an expert knowledge extraction specialist...

## OUTPUT FORMAT

## Document Context
...

## 🔴 MACRO Annotations
...'
WHERE category = 'extraction' AND is_default = TRUE;
```

**Pros**: Minimal code changes, Settings UI becomes functional
**Cons**: Existing custom templates won't work

### Option B: Remove Compatibility Check

Change `extraction.ts:159-163` to always use database template if available:

```typescript
const template = await getDefaultTemplate('extraction');
if (template) {
  basePrompt = template.content;
}
```

Then update the parser to handle multiple formats.

**Pros**: More flexible
**Cons**: Requires significant parser changes

### Option C: Add Format Selection to Settings

Let users choose between "Document Context" format and "Item N" format in Settings.

**Pros**: Maximum flexibility
**Cons**: More complex UI/UX

---

## Additional Improvements Needed

### 1. Better Error Visibility

Add logging or UI feedback when AI extraction fails:

```typescript
// In extraction.ts, catch block
console.error('[Extraction] AI call failed, using fallback:', error);
// Consider: return { success: false, usedFallback: true, results: [...] }
```

### 2. Validate AI Response Before Parsing

Check if response contains expected markers before attempting to parse:

```typescript
if (!response.includes('## Document Context') && !response.includes('## 🔴')) {
  console.warn('[Extraction] AI response format unexpected, trying legacy parser');
}
```

### 3. Test with Actual Documents

Create integration tests that verify:
- AI is called with correct prompt
- Response is parsed correctly
- Refined comments differ from originals

---

## Testing Steps

1. **Verify current behavior**:
   ```bash
   # Check server logs during extraction
   pm2 logs expert-note --lines 100 | grep -i extraction
   ```

2. **Test database template**:
   ```sql
   SELECT name, content FROM prompt_templates
   WHERE category = 'extraction' AND is_default = TRUE;
   ```

3. **Test extraction with logging**:
   - Add document with annotations
   - Click "Extract Knowledge"
   - Check server logs for `[Extraction]` and `[OpenRouter]` messages
   - Verify if AI was called and response was parsed

---

## Flow Diagram

```
User clicks "Extract Knowledge"
         │
         ▼
┌─────────────────────────────┐
│ POST /api/knowledge/extract │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ getExtractionSystemPrompt() │
│                             │
│  1. Try load from database  │
│  2. Check: has "## Document │◄── FAILS because DB template
│     Context"?               │    uses "## Item N" format
│  3. If no, use hardcoded    │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Call OpenRouter (Qwen)      │
│ with hardcoded prompt       │
└─────────────────────────────┘
         │
         ├──── SUCCESS ────┐
         │                 │
         ▼                 ▼
┌─────────────┐   ┌─────────────────────┐
│ API Error   │   │ parseMarkdown...()  │
│ or Timeout  │   │                     │
└─────────────┘   │ Expects:            │
         │        │ - ## 🔴 MACRO       │
         │        │ - ### N. [title]    │
         │        │ - **Text referred** │
         │        └─────────────────────┘
         │                 │
         │                 ├── FORMAT MATCH ──► Refined results
         │                 │
         │                 ▼
         │        ┌─────────────────────┐
         │        │ Try legacy parser   │
         │        │ (## Item N format)  │
         │        └─────────────────────┘
         │                 │
         │                 ├── FORMAT MATCH ──► Refined results
         │                 │
         ▼                 ▼
┌─────────────────────────────────────────┐
│ FALLBACK: Return raw annotations        │
│                                         │
│ refinedComment = originalComment        │◄── USER SEES THIS
│ background = "Extracted from: X\n..."   │    (No actual refinement)
└─────────────────────────────────────────┘
```

---

## Files to Modify (Fix Checklist)

- [ ] `src/lib/ai/extraction.ts` - Fix compatibility check or update hardcoded prompt
- [ ] `sql/seed.sql` - Update database template to match expected format
- [ ] `src/lib/ai/openrouter.ts` - Improve parser robustness or add format detection
- [ ] `src/app/api/knowledge/extract/route.ts` - Add better error reporting
- [ ] `src/app/settings/prompts/page.tsx` - Show warning if template format incompatible

---

## References

- Hardcoded prompt: `src/lib/ai/extraction.ts:14-117`
- Database template: `sql/seed.sql:34-99`
- Prompt loading: `src/lib/ai/extraction.ts:153-179`
- Response parser: `src/lib/ai/openrouter.ts:191-377`
- API endpoint: `src/app/api/knowledge/extract/route.ts`
- Settings UI: `src/app/settings/prompts/page.tsx`

---

## Appendix: Full Prompts

### A. Hardcoded Prompt (Currently Used)

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

### B. Database Template (Never Used)

```
You are a knowledge extraction specialist. Your task is to transform expert annotations into structured, reusable knowledge entries that are meaningful even when read standalone.

CRITICAL REQUIREMENTS:
1. You MUST process EVERY annotation provided - do NOT skip or merge any
2. Each knowledge item must be SELF-CONTAINED and understandable without the original document
3. The context you provide is ESSENTIAL - it explains what the annotation refers to

For EACH annotation, you will create a knowledge item with:

1. **CONTEXT**: A clear explanation of what part of the document this annotation refers to.
   - For MACRO annotations: Describe the overall document section or theme being addressed
   - For MESO annotations: Describe the specific paragraph(s) or pattern being discussed
   - For MICRO annotations: Quote or describe the specific sentence(s) being commented on
   The reader should understand WHAT is being annotated without seeing the original document.

2. **ORIGINAL COMMENT**: The exact verbatim annotation text (preserve [[LEVEL: content]] format)

3. **REFINED INSIGHT**: An enhanced version that:
   - Preserves the original meaning and expert judgment
   - Is clearer, more actionable, and broadly applicable
   - Can stand alone as useful guidance
   - Maintains the expert's voice and expertise

4. **LEVEL**: MACRO, MESO, or MICRO

5. **LOCATION**: Where in the document this annotation appears

Output in Markdown format using this EXACT structure for EACH annotation:

## Item 1

**Level:** MACRO
**Location:** Introduction, paragraph 2

### Context
This annotation appears in the introduction where the author is establishing the research gap...

### Original Comment
[[MACRO: The exact verbatim text from the annotation]]

### Refined Insight
The improved, clearer, self-contained version of the insight that can be applied broadly.

---

LEVEL GUIDELINES:
- MACRO: High-level principles affecting document structure, argumentation, or overall approach
- MESO: Pattern-level guidance about sections, paragraphs, or methodological elements
- MICRO: Specific edits, word choices, sentence-level improvements

MANDATORY OUTPUT RULES:
1. Output ONE Item per input annotation (same count as input)
2. Use ## Item N format (numbered sequentially starting at 1)
3. Include --- separator between items
4. Process annotations in the order given
5. NEVER skip, merge, or summarize multiple annotations into one
6. The ### Context section is REQUIRED and must explain what is being annotated
```
