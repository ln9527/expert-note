# LLM Prompt Configurability Report

**Date:** January 8, 2026
**Status:** ✅ All prompts now configurable via database
**Model:** Qwen 3 235B Instruct (`qwen/qwen3-235b-a22b-2507`)

---

## Summary

After the Option C refactoring, **ALL LLM system prompts are now user-configurable** via the database and Settings UI.

---

## Complete LLM Call Inventory

| # | Location | Function | System Prompt Source | Configurable? | Status |
|---|----------|----------|---------------------|---------------|--------|
| 1 | `extraction.ts:298` | Knowledge Extraction | `getExtractionSystemPrompt()` | ✅ **YES** | Working |
| 2 | `generation.ts:160` | Prompt Generation | `getGenerationSystemPrompt()` | ✅ **YES** | Working |

**Total LLM Calls:** 2
**Configurable:** 2/2 (100%) ✅

---

## Detailed Analysis

### 1. Knowledge Extraction LLM Call

**File:** `src/lib/ai/extraction.ts:298`

**Call Pattern:**
```typescript
const systemPrompt = await getExtractionSystemPrompt(input.customInstructions);

const response = await chatCompletion(
  [
    { role: 'system', content: systemPrompt },  // ← Configurable via DB
    { role: 'user', content: userPrompt },      // ← Built from document + annotations
  ],
  { temperature: 0.3, maxTokens }
);
```

**System Prompt Loading Priority:**
1. **Database template** (`prompt_templates` where `category='extraction'`)
2. Fallback to hardcoded `KNOWLEDGE_EXTRACTION_SYSTEM_PROMPT` constant

**Configuration Method:**
- Settings UI: `/settings/prompts`
- Template name: "Default Knowledge Extraction"
- Database query: `SELECT content FROM prompt_templates WHERE category='extraction' AND is_default=true`

**Current Format:**
```markdown
## Document Context
...
## 🔴 MACRO Annotations
### 1. [title]
**Text referred to**: ...
**Expert comment**: ...
**Contextualized**: ...
```

**User Prompt Structure:** (NOT configurable - built from data)
```
Document Background: {background}
Document Title: {filename}

Full Document Content:
{documentContent}

MACRO Annotations:
1. Line X: "{content}"
   Surrounding text: "{context}"

[Repeat for MESO, MICRO]
```

**Configurability:** ✅ **FULLY CONFIGURABLE**
- Users can edit template in Settings UI
- Changes take effect immediately (no code deployment needed)
- Hardcoded fallback ensures system never breaks

---

### 2. Prompt Generation LLM Call

**File:** `src/lib/ai/generation.ts:160`

**Call Pattern:**
```typescript
const systemPrompt = await getGenerationSystemPrompt(templateType);

const response = await chatCompletion(
  [
    { role: 'system', content: systemPrompt },  // ← Configurable via DB
    { role: 'user', content: userPrompt },      // ← Built from knowledge entries
  ],
  { temperature: 0.7, maxTokens: 3000 }
);
```

**System Prompt Loading Priority:**
1. **Database template** by `template_type` (e.g., 'introduction', 'methodology')
2. Fallback to hardcoded `GENERATION_SYSTEM_PROMPT` constant

**Configuration Method:**
- Settings UI: `/settings/prompts`
- Multiple templates available:
  - Default Prompt Generation (template_type=NULL)
  - Introduction Review (template_type='introduction')
  - Methodology Review (template_type='methodology')
  - Discussion Review (template_type='discussion')
  - Academic Writing Coach (template_type='academicCoach')

**Current Format:**
```
You are a System Prompt architect specializing in creating AI instructions
based on expert knowledge.

Your task is to synthesize knowledge entries into effective System Prompts
that capture expert judgment patterns.

Structure your prompts with:
1. **Role Definition**: Clear statement of the AI's role
2. **Core Principles**: High-level guidelines from MACRO knowledge
3. **Patterns & Approaches**: Pattern-level guidance from MESO knowledge
4. **Specific Techniques**: Actionable suggestions from MICRO knowledge
5. **Examples**: Where helpful, include brief examples
...
```

**User Prompt Structure:** (NOT configurable - built from data)
```
Generate a System Prompt for the following purpose:

**Purpose**: {purpose}
**Template Type**: {displayName}
**Template Focus**: {baseInstructions}
**Additional Instructions**: {customInstructions}

**Knowledge Base** ({count} total annotations from {n} entries):

MACRO-LEVEL PRINCIPLES ({n} annotations):
• {refinedComment}
...

MESO-LEVEL PATTERNS ({n} annotations):
• {refinedComment}
...

MICRO-LEVEL TECHNIQUES ({n} annotations):
• {refinedComment}
...
```

**Configurability:** ✅ **FULLY CONFIGURABLE**
- Users can edit any template in Settings UI
- Can create custom templates with specific focus areas
- Template type determines which one is used

---

## What IS Configurable

### ✅ System Prompts (2/2)
All LLM system prompts are stored in the database and editable via Settings UI:

| Prompt | Database Table | Editable Fields |
|--------|----------------|-----------------|
| Knowledge Extraction | `prompt_templates.content` | Full prompt text |
| Prompt Generation (Default) | `prompt_templates.content` | Full prompt text |
| Prompt Generation (Introduction) | `prompt_templates.content` | Full prompt text |
| Prompt Generation (Methodology) | `prompt_templates.content` | Full prompt text |
| Prompt Generation (Discussion) | `prompt_templates.content` | Full prompt text |
| Prompt Generation (Academic Coach) | `prompt_templates.content` | Full prompt text |

### ✅ Custom Instructions
Both extraction and generation support optional custom instructions:
- Extraction: `POST /api/knowledge/extract` → `customInstructions` parameter
- Generation: `POST /api/prompts/generate` → `customInstructions` parameter
- These are appended to system prompts at runtime

---

## What is NOT Configurable

### ❌ User Prompts (Built from Data)
The "user" role prompts are constructed programmatically from:
- **Extraction:** Document content + annotations + surrounding context
- **Generation:** Knowledge entries grouped by level (MACRO/MESO/MICRO)

**Reason:** These prompts must match the data structure to work correctly. Making them templatable would introduce complexity without clear benefit.

### ❌ Model Parameters (Hardcoded per use case)
```typescript
// Extraction (conservative)
{ temperature: 0.3, maxTokens: dynamic }

// Generation (creative)
{ temperature: 0.7, maxTokens: 3000 }
```

**Recommendation:** If you need to change these, they should be:
1. Added to `prompt_templates` table as JSON metadata
2. Or exposed in Settings UI as "Advanced Options"

### ❌ Model Selection
Current model: **`qwen/qwen3-235b-a22b-2507`** (Qwen 3 235B Instruct)

**Location:** `src/lib/ai/openrouter.ts:6`
```typescript
const DEFAULT_MODEL = 'qwen/qwen3-235b-a22b-2507';
```

**To Change:**
1. Edit `openrouter.ts` and update `DEFAULT_MODEL`
2. Or add `model` field to `prompt_templates` table for per-template models

---

## Settings UI Access

**URL:** `http://localhost:3000/settings/prompts`

**Features:**
- ✅ View all templates
- ✅ Edit template content
- ✅ Create new templates
- ✅ Duplicate existing templates
- ✅ Delete non-default templates
- ✅ Version tracking (auto-increments on update)

**Templates List:**
```sql
SELECT id, name, category, template_type, is_default, version
FROM prompt_templates
ORDER BY category, is_default DESC;
```

---

## Model Information

**Current Model:** Qwen 3 235B Instruct
**Model ID:** `qwen/qwen3-235b-a22b-2507`
**Provider:** OpenRouter
**Context Window:** ~32K tokens
**Pricing:** See OpenRouter pricing page

**Model Capabilities:**
- Instruction following
- Long context understanding
- Structured output generation
- Markdown formatting

**Why This Model:**
1. Large context window for full document processing
2. Strong instruction following for prompt templates
3. Good at structured markdown output (critical for parsing)
4. Cost-effective compared to GPT-4 class models

---

## Testing Configurability

### Test 1: Edit Extraction Template
```bash
# 1. Go to http://localhost:3000/settings/prompts
# 2. Click "Edit" on "Default Knowledge Extraction"
# 3. Modify the prompt (e.g., add "Be concise" instruction)
# 4. Save
# 5. Extract knowledge from a document
# 6. Check server logs for "Using database template"
# 7. Verify extraction follows new instructions
```

### Test 2: Create Custom Generation Template
```bash
# 1. Go to http://localhost:3000/settings/prompts
# 2. Click "New Template"
# 3. Category: "generation"
# 4. Template Type: "custom-review"
# 5. Content: "You are a specialized code reviewer..."
# 6. Save
# 7. Generate prompt with this template
# 8. Verify custom template is used
```

---

## Database Schema

**Table:** `prompt_templates`

```sql
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('extraction', 'generation')),
  template_type VARCHAR(50),  -- NULL for default, or specific type
  content TEXT NOT NULL,       -- ← The actual LLM system prompt
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  version INTEGER DEFAULT 1,  -- Auto-increments on update
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Migration History

| Migration | Date | Purpose |
|-----------|------|---------|
| `004_soft_delete.sql` | Jan 2026 | Added soft delete columns |
| `005_fix_prompt_templates.sql` | Jan 8, 2026 | Fixed extraction template format |

**Current Template Version:** v2 (after migration 005)

---

## Conclusion

✅ **100% of LLM system prompts are now configurable**

Users can:
1. Edit any prompt template in Settings UI
2. Create custom templates for specific use cases
3. Append custom instructions at runtime
4. Changes take effect immediately (no code deployment)

The system has a robust fallback mechanism:
- If database lookup fails → uses hardcoded constant
- If AI extraction fails → uses raw annotations
- If template is incompatible → uses legacy parser

**Next Enhancement Opportunities:**
1. Make model parameters configurable (temperature, maxTokens)
2. Add model selection per template
3. Add template variables/macros for reusable components
4. Add template testing UI (preview LLM output)
