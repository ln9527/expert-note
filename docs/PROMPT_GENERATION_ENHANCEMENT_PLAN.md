# Prompt Generation Enhancement - Implementation Plan

**Date:** January 8, 2026
**Requirements:** Enhanced source selection, tag system consistency, prompt versioning
**Estimated Effort:** 6-8 hours
**Priority:** High (improves core workflow significantly)

---

## 🎯 Requirements Summary (Confirmed)

### Issue 1: Upload Click Not Working ✅
**Problem:** "Click to upload" does nothing, only drag-and-drop works
**Fix:** Ensure click handler triggers file input

### Issue 2: Tag System Inconsistency ✅
**Current:** Prompt generation has no tag selection
**Desired:** Use same checkbox tag selector as upload modal (TagFilter component)
**Goal:** Consistent UX across all tag selection

### Issue 3: Enhanced Source Selection ✅
**Current:** Only knowledge entries can be selected
**New:** Three optional source types:
1. **Knowledge Entries** (existing) - Extracted, refined knowledge
2. **Annotated Documents** (NEW) - Direct from documents with annotations
3. **Base Prompt** (NEW) - Update existing prompt to create new version

**All three are OPTIONAL and can be mixed:**
- Create from knowledge only (current behavior)
- Create from documents only (bypass knowledge extraction)
- Create from mix of knowledge + documents
- Update existing prompt with new knowledge/documents
- Any combination!

### Issue 4: Search & Filter for Sources ✅
**Problem:** When many knowledge entries/documents exist, hard to find the right ones
**Solution:** Search box + tag filter for both knowledge and document selectors

---

## 🏗️ Architecture Changes Required

### Database Schema Changes

#### Migration: `006_prompt_enhancements.sql`

```sql
-- 1. Create prompt_tags junction table (CRITICAL - currently missing!)
CREATE TABLE IF NOT EXISTS prompt_tags (
  prompt_id UUID REFERENCES system_prompts(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, tag_id)
);

CREATE INDEX idx_prompt_tags_prompt_id ON prompt_tags(prompt_id);
CREATE INDEX idx_prompt_tags_tag_id ON prompt_tags(tag_id);

-- 2. Add source document IDs to prompts
ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS source_document_ids UUID[] DEFAULT '{}';

-- 3. Add base prompt for versioning
ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS base_prompt_id UUID REFERENCES system_prompts(id);

CREATE INDEX idx_prompts_base_prompt_id ON system_prompts(base_prompt_id);

-- 4. Add soft delete to prompts (if not already present)
ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE system_prompts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX idx_prompts_not_deleted ON system_prompts(is_deleted) WHERE is_deleted = FALSE;

-- Verification query
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'system_prompts'
ORDER BY ordinal_position;
```

---

### TypeScript Type Updates

#### File: `/src/types/index.ts`

```typescript
export interface SystemPrompt {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  content: string;
  templateType: string | null;
  sourceKnowledgeIds: string[];      // Existing
  sourceDocumentIds: string[];       // NEW - documents used as source
  basePromptId: string | null;       // NEW - if this is an update of another prompt
  version: number;
  tags: Tag[];
  isDeleted: boolean;                // NEW - soft delete
  deletedAt: Date | null;            // NEW - soft delete
  createdAt: Date;
  updatedAt: Date;
}

// Helper type for version chain display
export interface SystemPromptWithVersionInfo extends SystemPrompt {
  basePrompt?: {                     // If this is v2+
    id: string;
    title: string;
    version: number;
  };
  childPrompts?: SystemPrompt[];     // If this has been updated (v1 → v2 → v3)
}
```

---

### API Interface Changes

#### POST /api/prompts/generate

**Current Request:**
```typescript
{
  knowledgeIds: string[];
  templateType: string;
  purpose: string;
  customInstructions?: string;
  saveToDatabase: boolean;
}
```

**New Request:**
```typescript
{
  // Source selection (all optional, but at least one required)
  knowledgeIds?: string[];           // Existing
  documentIds?: string[];            // NEW - annotated documents
  basePromptId?: string;             // NEW - base prompt to update

  // Configuration
  templateType: string;
  purpose: string;
  customInstructions?: string;

  // Metadata for saving
  saveToDatabase: boolean;
  title?: string;
  description?: string;
  tagIds?: number[];                 // NEW - tags for the prompt
}
```

**New Response:**
```typescript
{
  success: true;
  generatedContent: string;
  metadata: {
    sources: {
      knowledgeEntries: number;
      documents: number;
      basePrompt: boolean;
    };
    annotations: {
      macro: number;
      meso: number;
      micro: number;
    };
    isUpdate: boolean;                // True if basePromptId provided
  };
  prompt?: SystemPrompt;              // If saveToDatabase = true
}
```

---

## 📐 Component Architecture

### Enhanced /prompts/generate Page Structure

```
GeneratePromptPage
│
├── Configuration Panel (Left Side)
│   │
│   ├── Purpose Input (required)
│   │   └── Text input: "What should this prompt do?"
│   │
│   ├── Template Type Selector (required)
│   │   └── Dropdown: Default / Introduction / Methodology / etc.
│   │
│   ├── **Base Prompt Selector (NEW, optional)**
│   │   ├── Dropdown: "Update existing prompt (optional)"
│   │   ├── Shows: Prompt titles from user's prompts
│   │   └── When selected: Display what it used (greyed out section)
│   │       ├── "Original sources from v1:"
│   │       ├── - 3 knowledge entries (locked, greyed)
│   │       └── - 2 documents (locked, greyed)
│   │
│   ├── **Source Selection Tabs (NEW)**
│   │   │
│   │   ├── Tab 1: Knowledge Entries
│   │   │   ├── Search box: "Search knowledge..."
│   │   │   ├── Tag filter dropdown: Multi-select tags
│   │   │   ├── Level filter: All / MACRO / MESO / MICRO
│   │   │   └── Checkbox list of entries
│   │   │
│   │   └── Tab 2: Annotated Documents (NEW)
│   │       ├── Search box: "Search documents..."
│   │       ├── Tag filter dropdown: Multi-select tags
│   │       ├── Status filter: Show only "annotated"
│   │       └── Checkbox list of documents
│   │           ├── Shows annotation counts (3 macro, 2 meso, 1 micro)
│   │           └── Only shows documents with status="annotated"
│   │
│   ├── **Tags for Generated Prompt (NEW)**
│   │   ├── Label: "Tags for this prompt (optional)"
│   │   └── TagFilter component (checkbox style)
│   │       ├── Checkboxes for existing tags
│   │       └── "+ Create new tag" button
│   │
│   ├── Custom Instructions (existing)
│   │   └── Textarea: Optional additional guidance
│   │
│   └── Generate Button
│       └── Disabled if: No sources selected AND no base prompt
│
└── Preview Panel (Right Side)
    ├── Shows source count summary
    │   ├── "3 knowledge entries selected"
    │   ├── "2 annotated documents selected"
    │   └── "Based on: Introduction Review v1"
    │
    └── Generated preview (after clicking Generate)
```

---

## 🔄 Data Flow: Enhanced Generation

### Scenario A: New Prompt from Knowledge + Documents

```
User Input:
  → Selects 3 knowledge entries
  → Selects 2 annotated documents
  → Selects tags: "methodology", "academic-writing"
  → Purpose: "Review methodology sections"
  → Template: "Methodology Review"
  → Custom instructions: "Focus on reproducibility"

Backend Processing:
  1. Fetch 3 knowledge entries with annotations
     → Total: 15 annotations (5 MACRO, 6 MESO, 4 MICRO)

  2. Fetch 2 annotated documents
     → Parse annotations using extractAnnotations()
     → Extract: 8 annotations (2 MACRO, 3 MESO, 3 MICRO)

  3. Merge all annotations
     → Total: 23 annotations (7 MACRO, 9 MESO, 7 MICRO)

  4. Call generateSystemPrompt() with merged annotations

  5. Save prompt:
     → source_knowledge_ids: [id1, id2, id3]
     → source_document_ids: [id4, id5]
     → base_prompt_id: NULL
     → tags: [methodology, academic-writing]

Output:
  → New prompt created
  → Saved with full source traceability
  → Tagged for organization
```

---

### Scenario B: Update Existing Prompt with New Sources

```
User Input:
  → Base prompt: "Methodology Review v1" (id: prompt-abc)
  → Add 2 NEW knowledge entries
  → Add 1 NEW annotated document
  → Keep same tags (inherited from v1)
  → Purpose: Updated from base
  → Custom instructions: "Now also focus on ethics"

Backend Processing:
  1. Fetch base prompt (prompt-abc)
     → Get source_knowledge_ids: [id1, id2, id3]
     → Get source_document_ids: [id4]

  2. Fetch base prompt's knowledge entries (3 entries)
     → 15 annotations

  3. Fetch base prompt's documents (1 document)
     → Parse and get 5 annotations

  4. Fetch NEW knowledge entries (2 entries)
     → 8 annotations

  5. Fetch NEW documents (1 document)
     → Parse and get 3 annotations

  6. Merge ALL annotations
     → Total: 31 annotations (from old + new sources)

  7. Call generateSystemPrompt() with ALL annotations + new instructions

  8. Save new prompt:
     → source_knowledge_ids: [id1, id2, id3, id5, id6] (old + new)
     → source_document_ids: [id4, id7] (old + new)
     → base_prompt_id: prompt-abc (tracks this is v2)
     → tags: Inherited or user-modified
     → title: "Methodology Review v2" (auto or manual)

Output:
  → New prompt created (new UUID)
  → Linked to base via base_prompt_id
  → Includes all sources (old + new)
  → Version chain: v1 → v2
```

---

### Scenario C: Just Refine Existing Prompt (No New Sources)

```
User Input:
  → Base prompt: "Methodology Review v1"
  → NO new knowledge entries
  → NO new documents
  → Modified instructions: "Be more concise"

Backend Processing:
  1. Fetch base prompt's sources
     → Knowledge: [id1, id2, id3]
     → Documents: [id4]

  2. Fetch annotations from base sources (reuse same data)

  3. Call generateSystemPrompt() with SAME sources + NEW instructions

  4. Save new prompt:
     → source_knowledge_ids: [id1, id2, id3] (same as v1)
     → source_document_ids: [id4] (same as v1)
     → base_prompt_id: prompt-abc
     → Different content (due to new instructions)

Output:
  → New prompt with same sources, different output
  → Useful for iterating on instructions without changing knowledge base
```

---

## 🗂️ File Modifications Required

### Database (1 file)
1. **`sql/migrations/006_prompt_enhancements.sql`** (NEW)
   - Create prompt_tags junction table
   - Add source_document_ids column
   - Add base_prompt_id column
   - Add soft delete columns
   - Add indexes

### Backend API (4 files)
1. **`src/app/api/prompts/generate/route.ts`**
   - Accept documentIds, basePromptId, tagIds
   - Process document annotations
   - Merge base prompt sources with new sources
   - Save with tags

2. **`src/app/api/prompts/route.ts`**
   - Update POST: Handle tagIds
   - Update GET: JOIN with prompt_tags to return tags

3. **`src/app/api/prompts/[id]/route.ts`**
   - Update GET: Include tags, base prompt info, version chain
   - Update PUT: Handle tag updates

4. **`src/lib/db/queries/prompts.ts`** (NEW or update existing)
   - `createPrompt()` - Handle tags, source_document_ids
   - `getPromptById()` - JOIN tags, load base prompt info
   - `updatePromptTags()` - Manage prompt_tags junction table

### Frontend Components (8 files)

1. **`src/components/prompts/PromptUpload.tsx`**
   - FIX: Click handler (verify it works)

2. **`src/components/prompts/BasePromptSelector.tsx`** (NEW)
   - Dropdown to select existing prompt
   - Display base prompt's sources (greyed out)

3. **`src/components/prompts/DocumentSelector.tsx`** (NEW)
   - Similar to KnowledgeSelector
   - Search + tag filter + checkboxes
   - Only show documents with status="annotated"
   - Show annotation counts per document

4. **`src/components/prompts/SourceTabs.tsx`** (NEW)
   - Tab container for Knowledge / Documents
   - Manages active tab state

5. **`src/app/prompts/generate/page.tsx`**
   - Add base prompt selection
   - Add document selector
   - Replace tag filter with TagFilter component
   - Add tag selector for generated prompt
   - Update state management
   - Update generate handler

6. **`src/app/prompts/[id]/page.tsx`**
   - Display tags
   - Show version chain (v1 → v2 → v3)
   - Show all sources (knowledge + documents)
   - "Update this prompt" button

7. **`src/app/prompts/page.tsx`**
   - Filter by tags
   - Display tags on prompt cards

8. **`src/components/prompts/PromptCard.tsx`**
   - Show tags
   - Show version indicator (v2, v3, etc.)

### Types (1 file)
1. **`src/types/index.ts`**
   - Update SystemPrompt interface
   - Add source_document_ids
   - Add base_prompt_id
   - Add version chain types

---

## 📋 Implementation Phases (Detailed)

### **Phase 1: Quick Fixes & Database** (1 hour)

#### Tasks:
1. ✅ Fix upload click handler
2. ✅ Create database migration (006_prompt_enhancements.sql)
3. ✅ Run migration locally
4. ✅ Update TypeScript types
5. ✅ Test database changes

#### Files:
- `src/components/prompts/PromptUpload.tsx` (verify click handler)
- `sql/migrations/006_prompt_enhancements.sql` (NEW)
- `src/types/index.ts` (update SystemPrompt)

#### Success Criteria:
- [ ] Click triggers file input
- [ ] prompt_tags table exists
- [ ] source_document_ids column exists
- [ ] base_prompt_id column exists
- [ ] Types updated without compilation errors

---

### **Phase 2: Backend API Enhancements** (2.5 hours)

#### Tasks:
1. ✅ Create/update `src/lib/db/queries/prompts.ts`
   - `createPrompt()` - Accept tagIds, documentIds, basePromptId
   - `getPromptById()` - JOIN tags, documents, base prompt
   - `getPromptWithVersionChain()` - Fetch v1→v2→v3 chain
   - `updatePromptTags()` - Manage tag associations

2. ✅ Update `/api/prompts/generate/route.ts`
   - Accept documentIds, basePromptId, tagIds
   - Process document annotations (use extractAnnotations)
   - Merge base prompt sources with new sources
   - Call enhanced generateSystemPrompt()

3. ✅ Update `/api/prompts/route.ts`
   - POST: Handle tagIds
   - GET: Return prompts with tags

4. ✅ Update `/api/prompts/[id]/route.ts`
   - GET: Return full prompt with version chain
   - PUT: Handle tag updates

#### Success Criteria:
- [ ] API accepts all new parameters
- [ ] Document annotations processed correctly
- [ ] Base prompt sources merged correctly
- [ ] Tags saved to junction table
- [ ] Version chain tracked properly

---

### **Phase 3: New UI Components** (2 hours)

#### Task 3.1: BasePromptSelector Component (30 min)

**File:** `src/components/prompts/BasePromptSelector.tsx` (NEW)

**Features:**
- Dropdown listing user's existing prompts
- "None (create new)" option as default
- When selected: Show base prompt details
  - Title, version
  - Sources used (greyed out, locked)
  - Collapsible detail view

**Props:**
```typescript
interface BasePromptSelectorProps {
  prompts: SystemPrompt[];           // All user's prompts
  selectedPromptId: string | null;
  onChange: (promptId: string | null) => void;
  onPromptLoaded: (prompt: SystemPromptWithVersionInfo) => void;
}
```

---

#### Task 3.2: DocumentSelector Component (1 hour)

**File:** `src/components/prompts/DocumentSelector.tsx` (NEW)

**Features:**
- Search box
- Tag filter (multi-select)
- Status filter (only show "annotated")
- Checkbox list of documents
- Show annotation counts per document
- "Select All" / "Clear All" buttons

**Similar to:** `src/components/prompts/KnowledgeSelector.tsx` (use as template)

**Props:**
```typescript
interface DocumentSelectorProps {
  documents: DocumentWithAnnotationCount[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;               // When base prompt sources are locked
}
```

---

#### Task 3.3: SourceTabs Component (30 min)

**File:** `src/components/prompts/SourceTabs.tsx` (NEW)

**Features:**
- Two tabs: "Knowledge Entries" | "Annotated Documents"
- Badge showing count (e.g., "3 selected")
- Tab content containers

**Usage:**
```typescript
<SourceTabs
  knowledgeTab={<KnowledgeSelector {...} />}
  documentsTab={<DocumentSelector {...} />}
  selectedKnowledgeCount={selectedKnowledgeIds.length}
  selectedDocumentCount={selectedDocumentIds.length}
/>
```

---

### **Phase 4: Update Main Generation Page** (1.5 hours)

#### File: `/src/app/prompts/generate/page.tsx`

**Changes:**

1. **Add State (lines 13-18):**
```typescript
const [templateType, setTemplateType] = useState('');
const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);
const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);  // NEW
const [basePromptId, setBasePromptId] = useState<string | null>(null);         // NEW
const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);            // NEW
const [lockedSourceIds, setLockedSourceIds] = useState<{                      // NEW
  knowledge: string[];
  documents: string[];
}>({ knowledge: [], documents: [] });
const [additionalInstructions, setAdditionalInstructions] = useState('');
const [promptTitle, setPromptTitle] = useState('');
const [promptDescription, setPromptDescription] = useState('');
const [purpose, setPurpose] = useState('');
```

2. **Add Data Fetching:**
```typescript
// Fetch user's prompts for base selector
const [userPrompts, setUserPrompts] = useState<SystemPrompt[]>([]);

useEffect(() => {
  // ... existing data fetching

  // NEW: Fetch user's existing prompts
  fetch(buildApiPath('prompts'))
    .then(res => res.json())
    .then(data => setUserPrompts(data.prompts || []));
}, []);
```

3. **Add Base Prompt Handler:**
```typescript
const handleBasePromptSelected = async (promptId: string | null) => {
  setBasePromptId(promptId);

  if (!promptId) {
    setLockedSourceIds({ knowledge: [], documents: [] });
    return;
  }

  // Fetch base prompt details
  const res = await fetch(buildApiPath(`prompts/${promptId}`));
  const data = await res.json();

  if (data.success) {
    setLockedSourceIds({
      knowledge: data.prompt.sourceKnowledgeIds || [],
      documents: data.prompt.sourceDocumentIds || []
    });

    // Pre-fill title/purpose from base
    setPurpose(data.prompt.purpose || '');
    setPromptTitle(`${data.prompt.title} v${data.prompt.version + 1}`);
  }
};
```

4. **Update Generate Handler (lines 70-124):**
```typescript
const handleGenerate = async () => {
  // Validation
  const totalSources = selectedKnowledgeIds.length + selectedDocumentIds.length;
  if (totalSources === 0 && !basePromptId) {
    alert('Please select at least one knowledge entry or annotated document');
    return;
  }

  // ... existing code

  const response = await fetch(buildApiPath('prompts/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      knowledgeIds: selectedKnowledgeIds,
      documentIds: selectedDocumentIds,          // NEW
      basePromptId: basePromptId,               // NEW
      templateType,
      purpose,
      customInstructions: additionalInstructions,
      saveToDatabase: false
    }),
  });

  // ... handle response
};
```

5. **Update Save Handler (lines 126-168):**
```typescript
const response = await fetch(buildApiPath('prompts'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: promptTitle.trim(),
    description: promptDescription.trim(),
    content: generatedContent,
    templateType,
    sourceKnowledgeIds: [...lockedSourceIds.knowledge, ...selectedKnowledgeIds],  // Merge old + new
    sourceDocumentIds: [...lockedSourceIds.documents, ...selectedDocumentIds],    // Merge old + new
    basePromptId,                                                                  // NEW
    tagIds: selectedTagIds,                                                        // NEW
  }),
});
```

6. **Add UI Components in Render:**
```typescript
return (
  <div className="max-w-7xl mx-auto px-4 py-8">
    <h1>Generate System Prompt</h1>

    {/* Base Prompt Selector - NEW */}
    <BasePromptSelector
      prompts={userPrompts}
      selectedPromptId={basePromptId}
      onChange={handleBasePromptSelected}
      onPromptLoaded={(prompt) => {/* set locked sources */}}
    />

    {/* Source Selection Tabs - NEW */}
    <SourceTabs
      knowledgeTab={
        <KnowledgeSelector
          entries={knowledgeEntries}
          selectedIds={selectedKnowledgeIds}
          onChange={setSelectedKnowledgeIds}
          lockedIds={lockedSourceIds.knowledge}  // Greyed out from base prompt
        />
      }
      documentsTab={
        <DocumentSelector
          documents={annotatedDocuments}  // Filter: status="annotated"
          selectedIds={selectedDocumentIds}
          onChange={setSelectedDocumentIds}
          lockedIds={lockedSourceIds.documents}  // Greyed out from base prompt
        />
      }
    />

    {/* Tags for Generated Prompt - NEW */}
    <div>
      <label>Tags for this prompt (optional)</label>
      <TagFilter
        tags={availableTags}
        selectedTags={selectedTagIds}
        onChange={setSelectedTagIds}
        onTagCreated={(newTag) => setAvailableTags(prev => [...prev, newTag])}
        placeholder="Select or create tags..."
        allowCreate={true}
        dropdownPosition="auto"
      />
    </div>

    {/* Template Type - Existing */}
    <TemplateSelector ... />

    {/* Purpose - Existing */}
    <PurposeInput ... />

    {/* Custom Instructions - Existing */}
    <CustomInstructionsTextarea ... />

    {/* Generate Button - Existing */}
    <button onClick={handleGenerate}>Generate</button>
  </div>
);
```

---

### **Phase 5: Backend Logic Enhancements** (1.5 hours)

#### File: `/src/lib/ai/generation.ts`

**No changes needed!** The `generateSystemPrompt()` function already accepts `KnowledgeEntryWithAnnotations[]`.

**Strategy:**
- Process documents → extract annotations → create pseudo-knowledge entries
- Merge all sources into single array
- Pass to existing `generateSystemPrompt()` function

---

#### File: `/src/app/api/prompts/generate/route.ts`

**New Processing Logic:**

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    knowledgeIds = [],
    documentIds = [],
    basePromptId,
    templateType,
    purpose,
    customInstructions,
    saveToDatabase,
    title,
    description,
    tagIds = []
  } = body;

  let allAnnotations: KnowledgeAnnotation[] = [];
  let allKnowledgeEntries: KnowledgeEntryWithAnnotations[] = [];

  // 1. If base prompt provided, get its sources
  if (basePromptId) {
    const basePrompt = await getPromptById(basePromptId);
    if (basePrompt) {
      knowledgeIds.unshift(...basePrompt.sourceKnowledgeIds);
      documentIds.unshift(...basePrompt.sourceDocumentIds || []);
    }
  }

  // 2. Fetch knowledge entries
  for (const id of knowledgeIds) {
    const entry = await getKnowledgeEntryWithAnnotations(id);
    if (entry) {
      allKnowledgeEntries.push(entry);
    }
  }

  // 3. Process documents directly (NEW!)
  for (const docId of documentIds) {
    const document = await getDocumentById(docId);
    if (document && document.status === 'annotated') {
      // Parse annotations
      const annotations = extractAnnotations(document.content);

      // Create pseudo-knowledge entry (not saved to DB)
      const pseudoEntry: KnowledgeEntryWithAnnotations = {
        id: docId,
        background: `Document: ${document.filename}`,
        sourceDocumentId: docId,
        annotations: annotations.map((a, index) => ({
          id: `temp-${docId}-${index}`,
          level: a.level,
          originalText: a.rawText,
          comment: a.content,
          refinedComment: null,  // No AI refinement for direct processing
          location: `Line ${a.line}`,
          backgroundContext: a.surroundingContext,
          positionLine: a.line,
          positionChar: a.char,
          createdAt: new Date()
        })),
        tags: document.tags,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      };

      allKnowledgeEntries.push(pseudoEntry);
    }
  }

  // 4. Generate prompt (existing logic)
  const content = await generateSystemPrompt({
    purpose,
    templateType,
    knowledgeEntries: allKnowledgeEntries,
    customInstructions
  });

  // 5. Save if requested
  if (saveToDatabase) {
    const prompt = await createPrompt({
      userId: user.userId,
      title,
      description,
      content,
      templateType,
      sourceKnowledgeIds: knowledgeIds,
      sourceDocumentIds: documentIds,  // NEW
      basePromptId,                    // NEW
      tagIds                           // NEW
    });

    return NextResponse.json({
      success: true,
      prompt,
      metadata: {
        sources: {
          knowledgeEntries: knowledgeIds.length,
          documents: documentIds.length,
          basePrompt: !!basePromptId
        },
        annotations: {
          total: allKnowledgeEntries.flatMap(e => e.annotations).length,
          macro: ...,
          meso: ...,
          micro: ...
        },
        isUpdate: !!basePromptId
      }
    });
  }

  // Return preview only
  return NextResponse.json({
    success: true,
    generatedContent: content,
    metadata: { ... }
  });
}
```

---

### **Phase 6: UI Polish & Consistency** (1 hour)

#### Tasks:
1. ✅ Add search to KnowledgeSelector (if not present)
2. ✅ Ensure DocumentSelector matches KnowledgeSelector style
3. ✅ Add loading states during generation
4. ✅ Show source summary in preview panel
5. ✅ Display version badges (v1, v2, v3) on prompt cards

#### Visual Improvements:
- Grey out locked sources from base prompt
- Show "Added in v2" badge for new sources
- Clear visual distinction between inherited and new sources

---

### **Phase 7: Testing** (1.5 hours)

#### Test Scenarios:
1. **Upload click handler** works
2. **Create prompt from knowledge only** (current behavior)
3. **Create prompt from documents only** (NEW)
4. **Create prompt from knowledge + documents** (NEW)
5. **Update existing prompt with new knowledge** (NEW)
6. **Update existing prompt with new documents** (NEW)
7. **Create prompt with tags** (NEW)
8. **Tag filtering in prompt list** (NEW)
9. **Version chain display** (NEW)

---

## 🔗 Component Interdependencies

```
GeneratePromptPage
  ├─┬ Depends on: BasePromptSelector
  │ └→ Which loads: SystemPrompt data
  │
  ├─┬ Depends on: DocumentSelector
  │ ├→ Which fetches: Documents with status="annotated"
  │ └→ Which uses: extractAnnotations() utility
  │
  ├─┬ Depends on: TagFilter
  │ ├→ Which fetches: All available tags
  │ └→ Which creates: New tags via API
  │
  ├─┬ Depends on: KnowledgeSelector (existing)
  │ └→ Which fetches: Knowledge entries
  │
  └─┬ Calls: /api/prompts/generate
    ├→ Which calls: generateSystemPrompt()
    ├→ Which calls: getDocumentById() + extractAnnotations()
    └→ Which saves: To system_prompts + prompt_tags
```

---

## ⚠️ Potential Breaking Changes

### 1. Database Schema
- ✅ **NON-BREAKING:** New columns have defaults
- ✅ **NON-BREAKING:** New table (prompt_tags) is additive
- ✅ **NON-BREAKING:** Existing queries still work

### 2. API Routes
- ⚠️ **POTENTIALLY BREAKING:** If external clients call `/api/prompts/generate`
- ✅ **SAFE:** All new parameters are optional
- ✅ **BACKWARD COMPATIBLE:** Old requests still work

### 3. TypeScript Types
- ⚠️ **REQUIRES RECOMPILE:** Adding fields to SystemPrompt
- ✅ **SAFE:** New fields are optional (? or default values)

### 4. UI Components
- ✅ **NON-BREAKING:** Adding new components doesn't affect existing ones
- ✅ **SAFE:** TagFilter already used in other modals

---

## 📊 Estimated Effort by Phase

| Phase | Tasks | Time | Difficulty |
|-------|-------|------|------------|
| 1: Quick Fixes + DB | 5 tasks | 1h | Low |
| 2: Backend APIs | 4 endpoints | 2.5h | Medium |
| 3: New Components | 3 components | 2h | Medium |
| 4: Main Page Update | 1 large file | 1.5h | High |
| 5: Logic Enhancements | Backend processing | 1.5h | Medium |
| 6: Testing | 9 test scenarios | 1.5h | Medium |

**Total: 10 hours** (6-8 hours coding, 2-4 hours testing)

---

## 🎯 Implementation Order (Recommended)

### Order 1: Bottom-Up (Safest)
1. Phase 1: Database + Types
2. Phase 2: Backend APIs
3. Phase 3: New Components
4. Phase 4: Main Page Integration
5. Phase 6: Testing

### Order 2: Top-Down (Faster Feedback)
1. Phase 1: Database + Types
2. Phase 3: New Components (mock data)
3. Phase 4: Main Page Integration (UI only)
4. Phase 2: Backend APIs (connect to real data)
5. Phase 6: Testing

**Recommendation:** **Bottom-Up** (safer, less refactoring)

---

## 🚨 Critical Decisions Needed

### Decision 1: Document Annotation Processing

**Question:** When user selects "annotated document", should we:
- **Option A:** Use RAW annotations (fast, simple)
- **Option B:** Run AI refinement (slower, better quality)

**My Recommendation:** **Option A** (raw annotations)
- Faster (no AI call)
- User chose document directly (wants speed)
- Can always extract to knowledge first if they want AI refinement
- Consistent with "bypass extraction" use case

---

### Decision 2: Base Prompt Title Auto-Increment

**Question:** When updating base prompt, how to handle title?

**Option A:** Auto-increment version
```
"Methodology Review v1" → "Methodology Review v2"
```

**Option B:** User manually edits
```
User decides: "Methodology Review v2" or "Methodology Review - Ethics Focus"
```

**My Recommendation:** **Option A** with ability to override
- Auto-fill: `${basePrompt.title} v${basePrompt.version + 1}`
- User can edit in title field

---

### Decision 3: Locked Sources Display

**Question:** When base prompt selected, should original sources be:
- **Option A:** Greyed out and always included (cannot uncheck)
- **Option B:** Shown but can be unchecked

**My Recommendation:** **Option B** (flexible)
- User might want to REMOVE some sources from v1
- Better UX - full control
- Can still see what base used (visual indicator)

---

## 📁 Implementation File Checklist

### NEW Files (5)
- [ ] `sql/migrations/006_prompt_enhancements.sql`
- [ ] `src/components/prompts/BasePromptSelector.tsx`
- [ ] `src/components/prompts/DocumentSelector.tsx`
- [ ] `src/components/prompts/SourceTabs.tsx`
- [ ] `src/lib/db/queries/prompts.ts` (if doesn't exist)

### MODIFIED Files (10)
- [ ] `src/types/index.ts`
- [ ] `src/components/prompts/PromptUpload.tsx` (fix click)
- [ ] `src/app/prompts/generate/page.tsx` (major updates)
- [ ] `src/app/api/prompts/generate/route.ts` (major updates)
- [ ] `src/app/api/prompts/route.ts` (add tag support)
- [ ] `src/app/api/prompts/[id]/route.ts` (add version chain)
- [ ] `src/app/prompts/page.tsx` (show tags, filter by tags)
- [ ] `src/app/prompts/[id]/page.tsx` (show tags, version chain, sources)
- [ ] `src/components/prompts/PromptCard.tsx` (show tags)
- [ ] `src/lib/db/queries/prompts.ts` (or create if missing)

### REFERENCE Files (No changes)
- `src/components/knowledge/TagFilter.tsx` (reuse as-is)
- `src/lib/utils/annotation.ts` (reuse extractAnnotations)
- `src/components/prompts/KnowledgeSelector.tsx` (template for DocumentSelector)

---

## 🧪 Testing Strategy

### Unit Tests
1. `extractAnnotations()` with document content
2. Tag junction table CRUD operations
3. Version chain query logic
4. Source merging (base + new)

### Integration Tests
1. Generate prompt from knowledge only
2. Generate prompt from documents only
3. Generate prompt from mixed sources
4. Update existing prompt (v1 → v2)
5. Update again (v2 → v3) - verify chain
6. Tags save and load correctly

### UI Tests
1. Base prompt selector loads and filters
2. Document selector shows only annotated docs
3. Tag creation works inline
4. Locked sources display correctly (greyed out)
5. Search/filter works for all selectors

---

## ✅ Success Criteria

### Must Have:
- [ ] Click upload triggers file input
- [ ] Prompt generation has tag selector (TagFilter component)
- [ ] Can select documents as sources
- [ ] Can select base prompt to update
- [ ] Tags save to database
- [ ] Version chain tracked (base_prompt_id)
- [ ] All sources save correctly (knowledge + documents)

### Nice to Have:
- [ ] Search works for all selectors
- [ ] Tag filtering in prompt list
- [ ] Version badges (v1, v2, v3)
- [ ] "Update this prompt" button on detail page

---

## 📄 Documentation to Create

1. **PROMPT_GENERATION_V2_SPEC.md** - Feature specification
2. **VERSION_CHAIN_GUIDE.md** - How versioning works
3. **MIGRATION_006_NOTES.md** - Database changes explained
4. **TESTING_PROMPTS_V2.md** - Test plan for new features

---

## 🤝 Interdependency Map

```
Database Migration (006)
  ↓ Required by ↓
TypeScript Types Update
  ↓ Required by ↓
Backend API Changes
  ↓ Required by ↓
New UI Components
  ↓ Required by ↓
Main Page Integration
  ↓ Validated by ↓
Comprehensive Testing
```

**Bottom-up implementation ensures each layer is stable before building on it.**

---

**Ready for implementation approval!**
