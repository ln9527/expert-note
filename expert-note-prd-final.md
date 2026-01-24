# Expert Note System - PRD (Final)

## 1. Overview

Expert Note is a system for capturing, extracting, and reusing expert knowledge through document annotation. Experts annotate Markdown documents with their judgments and insights, AI extracts and organizes these annotations into a structured knowledge base, and the system generates reusable System Prompts based on the accumulated knowledge.

**Core Flow:**

```
Upload/Create Document → Expert Annotation → AI Knowledge Extraction → System Prompt Generation
```

**Context Example:**

This system is designed for scenarios like the attached paper (`AI coaching NLv3.md`), where an expert reviews academic writing and adds inline annotations such as:

- "this feels a bit too context specific, we want to make this more general..."
- "some more expressive phrasing like 'breaking down expertise barriers'..."
- "how to add that GenAI possesses abilities that when designed with knowledge can provide personalized conversations..."

These annotations capture tacit expert knowledge that can be extracted, generalized, and reused for future AI-assisted reviews.

---

## 2. Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript |
| Backend | Next.js (API Routes) |
| Storage | Aliyun (阿里云 OSS) |
| AI Model | Qwen via OpenRouter API |
| Data Format | Markdown files |

---

## 3. Annotation Format

### 3.1 Syntax

Annotations use `[[ ]]` markers inserted inline within Markdown text:

```
[[LEVEL: annotation content]]
```

### 3.2 Annotation Levels

| Level | Purpose | Example |
|-------|---------|---------|
| **MACRO** | High-level, transferable principles or judgment logic | `[[MACRO: Introduction should establish research importance before identifying gaps]]` |
| **MESO** | Pattern-level guidance for specific types of problems or writing structures | `[[MESO: Literature review should be organized thematically, not chronologically]]` |
| **MICRO** | Specific edits or suggestions for particular sentences/paragraphs | `[[MICRO: This sentence is too long; split into two]]` |

### 3.3 Example: Annotated Document

```markdown
Organizations face a persistent dilemma in human capital development: expertise 
in customer-facing roles requires personalized guidance. [[MACRO: Opening should 
establish the core tension/tradeoff that motivates the research]]

This tension has historically confined complex interpersonal skills to those who 
receive intensive one-on-one coaching. [[MESO: When contextualizing, balance 
specificity with generalizability so examples remain representative]]

We investigate whether AI coaching can resolve this scalability-personalization 
trade-off. [[MICRO: Consider stronger verb than "investigate" - perhaps "examine" 
or "test"]]
```

---

## 4. Core Features

### 4.1 Document Management

- Upload Markdown files (raw or pre-annotated)
- Create blank documents
- Copy/paste content fragments between documents
- **Tag-based organization**
- Delete to trash / restore / permanent delete
- Cloud storage (Aliyun) with local download option

### 4.2 Annotation Interface

**Layout: Side-by-side panels**

| Left Panel | Right Panel |
|------------|-------------|
| Markdown editor with live preview | Annotation toolbar |
| Toggle between edit/preview mode | Level selector (Macro/Meso/Micro) |
| Highlighted annotations with colors | Annotation input field |

**Key UX Requirement: No Manual Typing of `[[]]`**

Users should NOT need to manually type `[[MACRO:`, `[[MESO:`, or `[[MICRO:` markers. Instead:

1. **Selection-based insertion:**
   - User selects text or places cursor in left panel
   - User clicks annotation level button (Macro/Meso/Micro) in right panel
   - Annotation input field appears
   - User types only the annotation content
   - System automatically wraps with `[[LEVEL: content]]` and inserts at cursor

2. **Toolbar buttons:**
   ```
   [📕 Macro] [📙 Meso] [📗 Micro]
   ```
   - Each button opens annotation input modal
   - Keyboard shortcuts: `Cmd+1` (Macro), `Cmd+2` (Meso), `Cmd+3` (Micro)

3. **Right-click context menu:**
   - Select text → Right-click → "Add Annotation" → Choose level

4. **Visual rendering:**
   - `[[MACRO: ...]]` → 🔴 Red highlight/tag
   - `[[MESO: ...]]` → 🟡 Yellow highlight/tag
   - `[[MICRO: ...]]` → 🟢 Green highlight/tag

**Insertion Flow Example:**

```
1. User selects: "expertise in customer-facing roles"
2. User clicks [📕 Macro] button
3. Modal appears: "Enter MACRO annotation:"
4. User types: "Opening should establish core tension"
5. User clicks "Insert"
6. Result in Markdown: 
   "expertise in customer-facing roles [[MACRO: Opening should establish core tension]]"
```

### 4.3 AI Knowledge Processing Agent

**Input:**
- Annotated Markdown file(s)

**Processing:**
- Extract all annotations from document
- Remove context-specific dependencies
- Generalize into reusable judgment patterns
- Distinguish universal vs. situational knowledge
- Preserve necessary examples for understanding
- Optimize language while maintaining original meaning

**Output:**
- Structured knowledge entries (document-level grouping)

### 4.4 System Prompt Generation Agent

**Input:**
- Structured knowledge base
- User-selected document scope (e.g., based on N annotated documents)
- Generation configuration (purpose, style, constraints)

**Output:**
- Ready-to-use System Prompts

**Initial Templates (Paper Writing Domain):**
- Introduction review
- Methods/methodology review
- Discussion section review
- Academic writing coach
- (Expandable to other domains later)

---

## 5. Data Structures

### 5.1 Knowledge Entry Schema (Document-Level)

```json
{
  "id": "doc-uuid",
  "source_file": "AI_coaching_paper_v3.md",
  "background": "Research paper on AI coaching effects on employee performance...",
  "tags": ["academic-writing", "introduction", "AI-research"],
  "created_at": "2026-01-05T10:00:00Z",
  "updated_at": "2026-01-05T12:00:00Z",
  "annotations": [
    {
      "id": "ann-001",
      "level": "macro",
      "original_text": "expertise in customer-facing roles requires personalized guidance",
      "comment": "Opening should establish core tension that motivates research",
      "refined_comment": "AI-optimized version preserving original meaning",
      "position": { "line": 3, "char": 45 }
    },
    {
      "id": "ann-002",
      "level": "meso",
      "original_text": "...",
      "comment": "...",
      "refined_comment": "...",
      "position": { "line": 7, "char": 20 }
    }
  ]
}
```

### 5.2 Document Metadata

```json
{
  "id": "file-uuid",
  "filename": "AI_coaching_paper_v3.md",
  "status": "annotated | raw | processing",
  "tags": ["academic-writing", "introduction"],
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "annotation_count": {
    "macro": 5,
    "meso": 12,
    "micro": 23
  }
}
```

---

## 6. Storage & File Management

### 6.1 Cloud Storage (Aliyun OSS)

- All documents stored in cloud by default
- Accessible from any device
- Download to local for backup

### 6.2 File Operations

| Operation | Description |
|-----------|-------------|
| Upload | Support .md file upload |
| Create | Create blank Markdown document |
| Edit | Online editing and annotation |
| Download | Export to local |
| Delete | Move to trash |
| Restore | Recover from trash |
| Permanent Delete | Remove from trash permanently |

---

## 7. Authentication (MVP)

**MVP Phase:**
- Hardcoded user list
- Simple login validation

**Future Iteration:**
- User management system
- Permission controls
- Multi-user data isolation

---

## 8. System Outputs

### 8.1 Annotated Markdown Files

- Contains all expert annotations with original content
- Exportable for use with Cursor, Claude Code, or other AI tools
- Human-readable in raw format

### 8.2 Structured Knowledge Base

- Document-level knowledge entries
- Contains background, annotations, refined expressions
- Tag-based organization
- Cross-document search and reuse

### 8.3 System Prompts

- Generated from knowledge base
- Configurable scope (select which documents to include)
- Versioned and reusable
- Example: "Paper introduction reviewer" prompt based on 10 annotated introduction sections

---

## 9. Design Principles

1. **Markdown as single source of truth** - No complex database structures
2. **AI handles abstraction and synthesis** - System focuses on interaction, LLM does heavy lifting
3. **Clear interaction, unified flow** - Avoid over-engineering
4. **Low barrier to use** - Students and non-technical users can adopt easily
5. **Progressive enhancement** - MVP first, iterate based on usage

---

## 10. MVP Scope

### Phase 1: Core MVP

- [ ] Document upload & management (Aliyun storage)
- [ ] Annotation interface (side-by-side panels)
- [ ] **Button-based annotation insertion** (no manual `[[]]` typing)
- [ ] Annotation levels (Macro/Meso/Micro) with color coding
- [ ] Knowledge extraction Agent (Qwen via OpenRouter)
- [ ] Knowledge base storage & display
- [ ] System Prompt generation (paper writing templates)
- [ ] Hardcoded user authentication
- [ ] Tag-based document organization

### Phase 2: Enhancement

- [ ] User management system
- [ ] Additional prompt templates (other domains)
- [ ] Knowledge base search & filtering
- [ ] Version history
- [ ] Collaborative annotation

---

## 11. API Configuration

### OpenRouter API (Qwen)

```javascript
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "qwen/qwen-xxx"; // To be specified

const headers = {
  "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
  "Content-Type": "application/json"
};
```

### Aliyun OSS

```javascript
const ossConfig = {
  region: "oss-cn-xxx",
  bucket: "expert-note-storage",
  accessKeyId: "xxx",
  accessKeySecret: "xxx"
};
```

---

## 12. Technical Notes

### Annotation Parsing Regex

```javascript
const ANNOTATION_REGEX = /\[\[(MACRO|MESO|MICRO):\s*(.+?)\]\]/g;

// Example
const text = "This is text. [[MACRO: This is a comment]]";
const matches = [...text.matchAll(ANNOTATION_REGEX)];
// matches[0] = ["[[MACRO: This is a comment]]", "MACRO", "This is a comment"]
```

### Annotation Insertion (Pseudocode)

```javascript
function insertAnnotation(level, content, cursorPosition) {
  const annotation = `[[${level}: ${content}]]`;
  // Insert at cursor position in editor
  editor.insertTextAt(cursorPosition, annotation);
}

// Called when user clicks Macro/Meso/Micro button
onAnnotationButtonClick(level) {
  openAnnotationModal(level);
}

onAnnotationSubmit(level, content) {
  const position = editor.getCursorPosition();
  insertAnnotation(level, content, position);
  closeModal();
}
```

---

## Summary

| Item | Decision |
|------|----------|
| Annotation Format | `[[MACRO/MESO/MICRO: content]]` |
| Annotation Input | **UI buttons, not manual typing** |
| Knowledge Base | Document-level grouping |
| Storage | Aliyun OSS |
| AI Model | Qwen via OpenRouter |
| Auth (MVP) | Hardcoded users |
| Doc Organization | Tag-based |
| Initial Focus | Paper writing domain |


## additional features
1. voice based annotation - expert speak and ai process voice to add note to documents - agents that work as a flow to use annotation label to make judgement and added to source documents 
  keep raw as well as ai procssed voice
  insert voice anytime anyplace to the note
2. annotation label management - beyond macro meso micro which is paper based but later can be more finer grained
  annotation template - create different types of annotation template with extraction guide template - that it is a pre-set skills that have annotation systems and how to extract those annotations into knowledge
  template include annotation template, extraction template, prompt generation template

**extraction prompt** rules - extractiong - *high level principles*, *thinking and reasoning*, *rules*, *examples and tips*, *edge cases*

3. beyond text - code, image, production plan etc
4. mcp server that list prompt guide created and under what situations it used 
5. create skills for claude code to download

essentially it connects to knowledge into ai systems for production - create guide - that can be used in workflow, agent design etc - fit with current framework - like claude-skill, mcp, and any future tools vs knowledge

backend agent systems to automate the process - combine ai general knowledge with specific knowledge extracted from the expert to do so


6. barriers - agents to extract knowledge that allow users to provide their raw inputs that ai take care of knowledge extraction, create prompts, fine tune Q-A pairs... data for reinforce learning from human feedback - such as annotation based on ratings - ai automatically create data for different purpose of use
7. agents that scan entire knowledge base to get workflow - or suggest workflows
8. integrate with other ai tools - we only be part of the workflow
9. situations - teacher - train teaching feedback, mba thesis feedback, doctoral thesis feedback... targeted user - teacher, grading, thesis etc.. that create prompts to grade students etc or provide checklists and comments to the users

10. Build entry home page to indicate the value of expert note - shift from generation to evaluation - in unverifiable domains - it becomes extreme value and previous evaluation effort has been waisted becomes one time dispensiable ouptuts - but in accumulation can make great value to ai powered organizations

11. Directly call llm to refine the md




