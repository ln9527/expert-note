# Expert-Note System - Terminology Glossary

**Last Updated:** January 8, 2026
**Purpose:** Central reference for all terminology in the system
**Audience:** Future AI agents, developers, maintainers

---

## ⚠️ Critical: UI vs Code Terminology

**This system has terminology that differs between UI and code.**

### Why the Mismatch?

In January 2026, we improved UI clarity by changing user-facing terminology from "template" to "generation guide". However, we kept the database and code names unchanged to avoid:
- Complex database migrations
- Breaking changes across 100+ code locations
- Risk of introducing bugs

**Result:** The UI says "generation guide" but the code says "template" - both refer to the same concept.

---

## 📖 Complete Terminology Reference

### Generation Guide (Code: PromptTemplate)

**What It Is:**
A guide or recipe that instructs the AI on HOW to synthesize knowledge into system prompts.

**User-Facing Terms:**
- "Generation Guide"
- "Guide"
- "Prompt Generation Guide" (full name)

**Code/Database Terms:**
- `PromptTemplate` (TypeScript interface)
- `prompt_templates` (database table)
- `templateType` (variable name for guide type)
- `template` (variable name for guide instance)

**Purpose:**
Contains instructions like:
- "Focus on research importance"
- "Emphasize gap identification"
- "Structure with role definition, principles, patterns"

**Examples:**
- Default Prompt Generation (general guide)
- Introduction Review Guide (specialized for introductions)
- Methodology Review Guide (specialized for methods)

**Where Users See It:**
- `/prompts/generate` page → "Generation Guide" dropdown
- `/settings/prompts` page → "Prompt Generation Guides" list

**Database Schema:**
```sql
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255),           -- e.g., "Introduction Review Guide"
  category VARCHAR(50),        -- 'extraction' or 'generation'
  template_type VARCHAR(50),   -- e.g., 'introduction', 'default'
  content TEXT,                -- The actual guide instructions
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Insight:**
Generation guides are NOT the final prompts. They are meta-instructions that tell the AI HOW to create the final prompts from knowledge entries.

---

### System Prompt (Code: SystemPrompt)

**What It Is:**
The GENERATED prompt that guides LLM behavior in actual use.

**User-Facing Terms:**
- "System Prompt"
- "Prompt" (when context is clear)
- "Generated Prompt"

**Code/Database Terms:**
- `SystemPrompt` (TypeScript interface)
- `system_prompts` (database table)
- `prompt` (variable name)

**Purpose:**
The final output that users apply to their LLMs. Contains:
- Role definition: "You are an expert..."
- Core principles from MACRO knowledge
- Patterns from MESO knowledge
- Techniques from MICRO knowledge
- Examples

**Examples:**
- "You are an expert academic writing reviewer specializing in introduction sections. Focus on establishing research importance and articulating clear contributions..."

**Where Users See It:**
- `/prompts` page → List of all generated prompts
- `/prompts/[id]` page → Full prompt detail with copy/download

**Database Schema:**
```sql
CREATE TABLE system_prompts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  content TEXT,                    -- The actual generated prompt
  source_knowledge_ids UUID[],     -- Knowledge sources used
  source_document_ids UUID[],      -- Documents used
  base_prompt_id UUID,             -- If this is v2 of another prompt
  version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Insight:**
System prompts are the END PRODUCT of the knowledge synthesis process.

---

### Document (Code: Document)

**What It Is:**
A markdown file uploaded by users, containing expert annotations.

**Terms:**
- "Document" (consistent everywhere)
- "Annotated Document" (when status='annotated')

**Code/Database:**
- `Document` (TypeScript interface)
- `documents` (database table)

**Purpose:**
Raw material containing expert knowledge marked with `[[MACRO:...]]`, `[[MESO:...]]`, `[[MICRO:...]]`

**Example:**
```markdown
# Research Paper Introduction

The research gap is crucial. [[MACRO: Always establish the gap before contributions]]

Our study examined... [[MESO: When describing methods, explain integration strategy]]

We used regression analysis [[MICRO: Specify model assumptions explicitly]]
```

**Where Users See It:**
- Dashboard → List of documents
- `/documents/[id]` → Editor view with annotation toolbar

**Database Schema:**
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  content TEXT,
  status VARCHAR(50) DEFAULT 'draft',  -- 'draft', 'annotated', 'processed'
  annotation_count INTEGER DEFAULT 0,
  macro_count INTEGER DEFAULT 0,
  meso_count INTEGER DEFAULT 0,
  micro_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Statuses:**
- **draft:** Just uploaded, no annotations yet
- **annotated:** Contains annotations, ready for extraction
- **processed:** Knowledge has been extracted

---

### Knowledge Entry (Code: KnowledgeEntry)

**What It Is:**
Extracted, AI-refined knowledge from annotated documents.

**Terms:**
- "Knowledge Entry" (UI)
- "Knowledge" (short form)

**Code/Database:**
- `KnowledgeEntry` (TypeScript interface)
- `knowledge_entries` (database table)

**Purpose:**
Refined, reusable insights extracted from document annotations via AI.

**Contains:**
- Background context
- Original annotation text
- AI-refined interpretation
- Surrounding document text
- Tags for categorization

**Where Users See It:**
- `/knowledge` page → Knowledge base list with filters
- `/knowledge/[id]` → Entry detail
- `/knowledge/[id]/edit` → Edit page

**Database Schema:**
```sql
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  document_id UUID REFERENCES documents(id),
  title VARCHAR(255),
  background TEXT,
  refined_content TEXT,
  annotation_level VARCHAR(20),     -- 'MACRO', 'MESO', 'MICRO'
  tags UUID[],
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Insight:**
Knowledge entries bridge raw annotations and usable system prompts.

---

### Annotation (Code: Annotation)

**What It Is:**
Individual expert comment in a document or knowledge entry.

**Terms:**
- "Annotation" (consistent)
- "Comment" (sometimes used interchangeably)

**Code/Database:**
- `Annotation` (TypeScript interface)
- `annotations` (database table)

**Format:**
```
[[LEVEL: content]]

Where LEVEL = MACRO | MESO | MICRO
```

**Types:**
- **MACRO:** High-level principles, overall approach
  - Example: "Always establish research importance before methodology"
- **MESO:** Pattern-level guidance, section-level
  - Example: "When introducing methods, explain integration strategy first"
- **MICRO:** Specific edits, word-level suggestions
  - Example: "Replace 'good' with domain-specific terminology"

**Where Users See It:**
- Document editor (inline in text, color-coded)
- Knowledge detail page (grouped by level)

**Database Schema:**
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  knowledge_id UUID REFERENCES knowledge_entries(id),
  content TEXT,
  level VARCHAR(20),                -- 'MACRO', 'MESO', 'MICRO'
  position_start INTEGER,
  position_end INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Color Coding:**
- MACRO = Red
- MESO = Yellow
- MICRO = Green

---

### Tag (Code: Tag)

**What It Is:**
Category label for organizing knowledge entries.

**Terms:**
- "Tag" (consistent)
- "Category" (sometimes used interchangeably)

**Code/Database:**
- `Tag` (TypeScript interface)
- `tags` (database table)

**Purpose:**
Helps filter and organize knowledge by domain, topic, or type.

**Default Tags:**
- Research Design
- Data Analysis
- Literature Review
- Methodology
- Writing Style
- Argumentation
- Citation Practice
- Structure
- Clarity
- Ethics

**Where Users See It:**
- Knowledge entry detail/edit pages
- Knowledge list page (filter sidebar)
- Settings → Tags (management)

**Database Schema:**
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🗺️ Terminology Map

### Complete Cross-Reference Table

| Concept | UI Term | Code Term | DB Table | Common Variables |
|---------|---------|-----------|----------|------------------|
| Generation guide | "Generation Guide" | `PromptTemplate` | `prompt_templates` | `template`, `templateType`, `guide` |
| Generated prompt | "System Prompt" | `SystemPrompt` | `system_prompts` | `prompt`, `systemPrompt` |
| Uploaded file | "Document" | `Document` | `documents` | `document`, `doc` |
| Extracted knowledge | "Knowledge Entry" | `KnowledgeEntry` | `knowledge_entries` | `entry`, `knowledge` |
| Expert comment | "Annotation" | `Annotation` | `annotations` | `annotation`, `ann` |
| Category | "Tag" | `Tag` | `tags` | `tag`, `tagId` |

---

## 🔍 Context Clues for Future AI

### How to Know What "Template" Means

When you see "template" in code, ask:

**Q1: What table is it querying?**
- `prompt_templates` → It's a Generation Guide
- `system_prompts` → It's NOT about templates (confusingly named variable)

**Q2: What's the category field?**
- `category = 'extraction'` → Knowledge extraction guide
- `category = 'generation'` → Prompt generation guide

**Q3: What does the UI label say in the same component?**
- UI says "Generation Guide" → Code means guide
- UI says "Template" → Probably old code (update it!)

**Q4: Is it about synthesizing/generating prompts?**
- Yes → It's a Generation Guide
- No → Probably something else

### Example Code Analysis

```typescript
// Example 1: This is about Generation Guides
const [selectedTemplate, setSelectedTemplate] = useState<string>('');
const templates = await fetch('/api/prompt-templates?category=generation');
// Clue: prompt-templates table + category=generation → Generation Guides

// Example 2: This is about System Prompts
const prompt = await fetch(`/api/prompts/${id}`);
// Clue: /api/prompts endpoint → System Prompts

// Example 3: Ambiguous without context
const template = data.template;
// Need to check: Where does 'data' come from? What table?
```

---

## 📚 Related Concepts

### Workflow: Document → Knowledge → Prompt

```
1. DOCUMENT (markdown file)
   ↓ User annotates with [[MACRO/MESO/MICRO: ...]]

2. KNOWLEDGE ENTRY (extracted knowledge)
   ↓ AI refines annotations into reusable insights using Extraction Guide

3. SYSTEM PROMPT (generated prompt)
   ↓ AI synthesizes knowledge using a GENERATION GUIDE

4. LLM (Claude, GPT, etc.)
   ↓ Uses the system prompt to guide its behavior
```

**Generation Guide's Role:**
Tells the AI (in step 3) HOW to synthesize knowledge into the system prompt.

**Extraction Guide's Role:**
Tells the AI (in step 2) HOW to refine raw annotations into knowledge entries.

---

### Two Types of Guides (Both in prompt_templates)

| Type | Category Value | Purpose | User Sees |
|------|----------------|---------|-----------|
| **Extraction Guide** | `'extraction'` | How to refine annotations into knowledge | Not directly (used internally) |
| **Generation Guide** | `'generation'` | How to synthesize knowledge into prompts | Settings → Generation Guides |

**Important:** Both are stored in `prompt_templates` table, differentiated by `category` field.

---

## 🎓 Examples in Context

### Example 1: Confusion Avoided

**User asks:** "How do I change the prompt templates?"

**Without glossary:** Ambiguous - templates for what?

**With glossary:**
- If they mean **Generation Guides**: Go to Settings → Prompt Generation Guides
- If they mean **System Prompts**: Go to Prompts page and edit

**Correct answer:** "Do you want to change the generation guides (rules for creating prompts) or the generated prompts themselves?"

---

### Example 2: Code Reading

**AI agent sees:**
```typescript
const [templateType, setTemplateType] = useState('');
const templates = await fetch('/api/prompt-templates');
```

**Without glossary:** "What kind of templates?"

**With glossary:**
1. See `/api/prompt-templates` → queries `prompt_templates` table
2. Glossary says: `prompt_templates` = Generation Guides (or Extraction Guides)
3. Variable name: `templateType` → Selecting which guide type
4. Understand: This is selecting which generation guide to use

---

### Example 3: Database Query

**AI agent sees:**
```sql
SELECT * FROM prompt_templates WHERE category = 'generation';
```

**Without glossary:** "Templates for prompts? Or prompt templates?"

**With glossary:**
1. Table name: `prompt_templates`
2. Glossary maps: `prompt_templates` → Guides (Extraction or Generation)
3. `category = 'generation'` → Generation Guides specifically
4. Understand: Fetching guides for how to generate system prompts

---

### Example 4: API Endpoint Interpretation

**AI agent sees:**
```typescript
POST /api/prompts/generate
Body: {
  templateId: 'uuid-123',
  knowledgeIds: ['uuid-456', 'uuid-789']
}
```

**Analysis:**
1. Endpoint: `/api/prompts/generate` → Creating a System Prompt
2. `templateId` → Refers to a Generation Guide (from `prompt_templates`)
3. `knowledgeIds` → Knowledge entries to synthesize
4. Result: A new System Prompt in `system_prompts` table

---

## 📋 Common Scenarios

### Scenario 1: Adding a New Generation Guide

**User-facing flow:**
1. Settings → Prompt Generation Guides
2. Click "Create Guide"
3. Fill in guide details (name, type, instructions)
4. Save

**Code flow:**
```typescript
// POST /api/prompt-templates
const template: PromptTemplate = {  // Code says "template"
  name: "Custom Review Guide",      // UI says "guide"
  category: 'generation',
  template_type: 'custom',
  content: "You are an expert at synthesizing knowledge..."
};

// Saves to prompt_templates table
await db.query(
  'INSERT INTO prompt_templates (name, category, content) VALUES ($1, $2, $3)',
  [template.name, template.category, template.content]
);
```

**Database result:**
```sql
-- New row in prompt_templates
id: uuid-new
name: 'Custom Review Guide'
category: 'generation'
template_type: 'custom'
content: 'You are an expert at synthesizing knowledge...'
```

---

### Scenario 2: Generating a System Prompt

**User-facing flow:**
1. Prompts → Generate
2. Select "Generation Guide": Introduction Review
3. Select knowledge sources (3 entries)
4. Click "Generate"

**Code flow:**
```typescript
// 1. Fetch the selected guide
const template = await fetch(`/api/prompt-templates/${templateId}`);
// template.category = 'generation'
// template.template_type = 'introduction'

// 2. Fetch selected knowledge entries
const knowledge = await fetch('/api/knowledge', {
  ids: selectedKnowledgeIds
});

// 3. Send to AI for synthesis
const result = await openrouter.generatePrompt({
  systemInstructions: template.content,  // The guide instructions
  knowledge: knowledge,                  // The source material
});

// 4. Save the generated prompt
await fetch('/api/prompts', {
  method: 'POST',
  body: {
    title: 'Introduction Review Prompt',
    content: result.generatedPrompt,
    source_knowledge_ids: selectedKnowledgeIds,
  }
});
```

**Database result:**
```sql
-- New row in system_prompts (NOT prompt_templates!)
id: uuid-new-prompt
title: 'Introduction Review Prompt'
content: 'You are an expert academic writing reviewer...'
source_knowledge_ids: [uuid-k1, uuid-k2, uuid-k3]
```

---

### Scenario 3: Extracting Knowledge from Document

**User-facing flow:**
1. Open document with annotations
2. Click "Extract Knowledge"
3. AI processes annotations → Creates knowledge entries

**Code flow:**
```typescript
// 1. Fetch extraction guide (category = 'extraction')
const extractionTemplate = await fetch(
  '/api/prompt-templates?category=extraction&is_default=true'
);

// 2. Parse annotations from document
const annotations = parseAnnotations(document.content);
// Returns: [
//   { level: 'MACRO', content: 'Always establish gap first' },
//   { level: 'MESO', content: 'Explain integration strategy' }
// ]

// 3. For each annotation, extract knowledge
for (const ann of annotations) {
  const knowledge = await openrouter.extractKnowledge({
    systemInstructions: extractionTemplate.content,  // How to refine
    annotation: ann,
    context: getContextAroundAnnotation(document, ann)
  });

  // Save as knowledge entry
  await db.query(
    'INSERT INTO knowledge_entries (document_id, background, refined_content, annotation_level) VALUES ($1, $2, $3, $4)',
    [document.id, knowledge.background, knowledge.refined, ann.level]
  );
}
```

---

### Scenario 4: Editing a Knowledge Entry

**User-facing flow:**
1. Knowledge → Select entry
2. Click "Edit"
3. Modify background, refined content, or tags
4. Save

**Code flow:**
```typescript
// PATCH /api/knowledge/[id]
const updates = {
  background: "Updated context...",
  refined_content: "Updated insight...",
  tags: ['uuid-tag1', 'uuid-tag2']
};

await db.query(
  'UPDATE knowledge_entries SET background = $1, refined_content = $2, tags = $3, updated_at = NOW() WHERE id = $4',
  [updates.background, updates.refined_content, updates.tags, knowledgeId]
);
```

---

## 🚨 Warning Signs of Confusion

If you see these patterns, check the glossary:

1. **"template" used for generated output** → Wrong! That's a System Prompt
2. **"prompt_templates table stores prompts"** → Wrong! It stores guides (extraction/generation)
3. **"Template is what users apply to LLMs"** → Wrong! That's System Prompt
4. **Code and UI using different terms without explanation** → Check this glossary
5. **"Just the prompt template"** → Which one? Generation guide or system prompt?

### Red Flag Examples

```typescript
// ❌ CONFUSING: What is 'prompt' here?
const prompt = await getTemplate(id);
// Is it a guide or a generated prompt?

// ✅ CLEAR: Explicit naming
const generationGuide = await getPromptTemplate(id, 'generation');
const systemPrompt = await getSystemPrompt(id);
```

---

## 📖 Quick Lookup Table

| I Want To... | User Term | Code Looks For | API Endpoint |
|--------------|-----------|----------------|--------------|
| Change how prompts are generated | Edit generation guide | `prompt_templates` + `category='generation'` | `/api/prompt-templates` |
| Use a different generation strategy | Select different guide | `templateType` variable | `/api/prompt-templates?category=generation` |
| Modify a saved prompt | Edit system prompt | `system_prompts` table | `/api/prompts/[id]` |
| See list of generation rules | View generation guides | Settings → Guides | `/api/prompt-templates?category=generation` |
| See list of generated prompts | View system prompts | Prompts page | `/api/prompts` |
| Change how knowledge is extracted | Edit extraction guide | `prompt_templates` + `category='extraction'` | `/api/prompt-templates` (admin) |
| Add a category | Create tag | `tags` table | `/api/tags` |
| Organize knowledge | Add tags to entry | `knowledge_entries.tags[]` | `/api/knowledge/[id]` |

---

## 🔗 Related Documentation

- [`/src/types/index.ts`](../src/types/index.ts) - TypeScript interfaces with inline comments
- [`/CLAUDE.md`](../CLAUDE.md) - Project overview and terminology section
- [`/sql/schema.sql`](../sql/schema.sql) - Database schema with comments
- [`/docs/PROMPT_GENERATION_ENHANCEMENT_PLAN.md`](./PROMPT_GENERATION_ENHANCEMENT_PLAN.md) - Detailed architecture
- [`/docs/LLM_FUNCTIONS_AND_SYSTEM_PROMPTS.md`](./LLM_FUNCTIONS_AND_SYSTEM_PROMPTS.md) - AI integration details

---

## 📝 For Future Updates

When adding features:

1. **UI text:** Always use clear, user-friendly terms
   - "Generation Guide" not "Template"
   - "System Prompt" not just "Prompt"

2. **Code:** Keep consistent with existing patterns
   - `PromptTemplate` interface for guides
   - `SystemPrompt` interface for generated prompts

3. **Comments:** Explain terminology when it could confuse
   ```typescript
   // Generation guide (NOT the final prompt)
   const template: PromptTemplate = ...;
   ```

4. **Update this glossary** if new terminology is introduced

5. **Database migrations:** Add comments to new tables/columns
   ```sql
   -- Stores generation guides (user-facing: "Generation Guides")
   CREATE TABLE prompt_templates (...);
   ```

---

## ✅ Summary

### The Core Rule

- **UI = "Generation Guide"** (clear for users)
- **Code/DB = "PromptTemplate" / "template"** (legacy, kept for stability)
- **Both refer to:** Guides for HOW to generate system prompts

### Remember

- **Generation Guide (INPUT)** → Tells AI how to synthesize
- **System Prompt (OUTPUT)** → Guides LLM behavior
- **Both live in different tables** → `prompt_templates` vs `system_prompts`

### Key Relationships

```
Document
  ↓ contains
Annotations
  ↓ extracted into
Knowledge Entries
  ↓ synthesized using
Generation Guide
  ↓ produces
System Prompt
  ↓ applied to
LLM (Claude, GPT, etc.)
```

### When in Doubt

1. Check this glossary first
2. Look at the database table being queried
3. Check the `category` field if it's `prompt_templates`
4. Read the UI label in the component
5. Ask: "Is this about HOW to generate (guide) or the RESULT (prompt)?"

---

## 🎯 Quick Decision Tree

**I see the word "template" in code:**

```
Is it querying prompt_templates table?
├─ YES → Is category='generation'?
│   ├─ YES → It's a Generation Guide
│   └─ NO  → Is category='extraction'?
│       ├─ YES → It's an Extraction Guide
│       └─ NO  → Check the code context
└─ NO → Is it querying system_prompts table?
    ├─ YES → It's NOT a template, it's a System Prompt (confusing variable name!)
    └─ NO  → Check what data structure it's working with
```

---

## 💡 Pro Tips for AI Agents

1. **Always check the table name** before assuming what "template" means
2. **Look for the `category` field** when dealing with `prompt_templates`
3. **UI labels are authoritative** for user-facing communication
4. **Code consistency matters** - don't rename legacy variables without good reason
5. **When generating text for users**, use glossary-approved terms
6. **When writing code**, follow existing patterns
7. **Document any new terminology** in this glossary immediately

---

**Document Owner:** Expert-Note Development Team
**Review Cycle:** Update when terminology changes
**Priority:** HIGH - Prevents hours of confusion

**Last Major Update:** January 8, 2026 - Initial comprehensive glossary creation

---

*For questions or suggestions about this glossary, refer to the project maintainers or update this document directly.*
