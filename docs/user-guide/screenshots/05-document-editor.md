# Document Editor - Annotation Interface

## Overview
The Document Editor is where you capture expert knowledge through structured annotations. This is the core workspace for transforming unstructured content into organized, extractable knowledge using three annotation levels.

## Key Components

### 1. Document Title Section (Top Left)
Displays the document name with a dropdown arrow for additional options:
- Click to switch between documents
- Shows current document status (Saved/Unsaved)
- Breadcrumb-style navigation when multiple docs are open
- Quick document switching with Cmd+K keyboard shortcut

### 2. Annotation Buttons (Center Toolbar)
Three colored buttons for adding different levels of annotations:

**Macro Annotation (Red Button)**
- Highest level of abstraction
- For broad concepts, major themes, or key principles
- Use when capturing overarching ideas
- Keyboard shortcut: `Cmd+1`

**Meso Annotation (Yellow Button)**
- Middle level of detail
- For supporting ideas, explanations, or related concepts
- Use for detailed but still conceptual content
- Keyboard shortcut: `Cmd+2`

**Micro Annotation (Green Button)**
- Lowest level of abstraction
- For specific facts, examples, or data points
- Use for granular details and evidence
- Keyboard shortcut: `Cmd+3`

**Shortcuts Reminder:** Listed in the toolbar for quick reference
- Cmd+1 = Macro
- Cmd+2 = Meso
- Cmd+3 = Micro

### 3. Main Document Content Area
The large text editing area where document content is displayed:
- Click to position cursor for annotations
- Text is fully editable
- Displays markdown content
- Scroll to navigate long documents
- Select text to annotate sections

**How to Annotate:**
1. **Select text** in the document
2. **Click annotation button** (Macro/Meso/Micro) or use keyboard shortcut
3. Selected text is **highlighted with a colored circle**
4. Annotation is **counted and tracked** in the sidebar

### 4. Show Preview Button (Top Right)
Toggles between edit and preview modes:
- **Edit Mode**: See raw content with annotation markers
- **Preview Mode**: See formatted markdown rendering
- Useful for seeing how content will appear when exported

## Right Sidebar: Document Information Panel

### Document Status
Shows the current processing state of the document:
- **raw**: Document created but not yet processed
- **processed**: Document analyzed and ready
- **completed**: Document fully annotated

### Annotations Section
Real-time counter showing your annotation activity:
- **0 macro** - Number of macro-level annotations
- **0 meso** - Number of meso-level annotations
- **0 micro** - Number of micro-level annotations

Click on any annotation count to filter and view all annotations of that type.

### Tags Section
Manage tags assigned to this document:
- Click "Select tags..." dropdown to add tags
- Tags organize documents by project, category, or status
- Can add new tags on-the-fly
- Tags are organization-wide and searchable

### Actions Section

#### Extraction Guide Selector
Choose which AI-powered generation guide to use:
- **Default Knowledge Extraction (Default)**: General-purpose extraction guide
- Select from custom guides created by your organization
- Different guides may optimize for different knowledge types
- Dropdown shows "Choose which guide to use for extracting knowledge"

#### Extract Knowledge Button (Blue)
Triggers the knowledge extraction process:
- Uses AI and your annotations to generate structured knowledge entries
- Requires at least some annotations in the document
- Opens an extraction dialog with options for custom instructions
- Creates searchable entries in the Knowledge Base

**Before Extracting:**
- Add annotations (macro/meso/micro) to your content
- Ensure content is well-organized and clear
- Add relevant tags for context

#### Download Button
Export the document and its annotations:
- Downloads as markdown file
- Includes all annotations and metadata
- Useful for backup or external sharing
- Preserves document structure and formatting

#### Delete Document Button (Red)
Permanently removes this document:
- Only available to document creator
- Cannot be undone (uses soft delete)
- Document owner information is preserved in system logs
- Use with caution

### Shortcuts Reference (Bottom)
Quick keyboard shortcut guide:
- **Switch document**: Cmd+K
- **Save**: Cmd+S
- **Macro annotation**: Cmd+1
- **Meso annotation**: Cmd+2
- **Micro annotation**: Cmd+3

## Workflow: Annotating a Document

### Step 1: Review Content
1. Read through the document carefully
2. Identify key concepts and information hierarchy
3. Plan which parts need macro, meso, or micro annotations

### Step 2: Add Macro Annotations (Red)
1. Select text containing a broad concept or major theme
2. Click the **Macro** button or press `Cmd+1`
3. Text is highlighted in red with a circle marker
4. Count increases in the sidebar
5. Continue for all major concepts

### Step 3: Add Meso Annotations (Yellow)
1. Select text with supporting ideas or detailed explanations
2. Click the **Meso** button or press `Cmd+2`
3. Text is highlighted in yellow
4. These provide mid-level detail and context
5. Continue throughout the document

### Step 4: Add Micro Annotations (Green)
1. Select specific facts, examples, or data points
2. Click the **Micro** button or press `Cmd+3`
3. Text is highlighted in green
4. Capture granular details and evidence
5. Build a comprehensive annotation map

### Step 5: Save Your Work
- Click **Save** button or press `Cmd+S`
- Status shows as "Saved" at the top
- Auto-save is enabled; changes are persisted

### Step 6: Extract Knowledge
1. Ensure you have annotations in the document
2. Click **Extract Knowledge** button
3. Select which guide to use (or accept default)
4. (Optional) Add custom instructions for extraction
5. Click **Extract** to generate knowledge entries
6. Knowledge entries appear in the Knowledge Base

## Annotation Best Practices

### Macro-Level (Red Annotations)
- Represent core concepts or main ideas
- Answer "What is this about?" at the highest level
- Should be relatively few in number
- Example: "Machine learning fundamentals"

### Meso-Level (Yellow Annotations)
- Explain or support macro-level concepts
- Answer "How does this work?" or "Why is this important?"
- Provide context and relationships
- Example: "Supervised vs. unsupervised learning types"

### Micro-Level (Green Annotations)
- Concrete facts, examples, or measurements
- Answer "What specifically?" or "How much?"
- Support meso and macro annotations
- Example: "Decision trees use information gain metric"

## Document Editor Tips

**Efficient Annotation:**
- Use keyboard shortcuts for speed (Cmd+1, Cmd+2, Cmd+3)
- Annotate in passes by level: first all macros, then mesos, then micros
- Keep annotations focused and concise

**Organization:**
- Add tags as you work to mark document status
- Use extraction guides tailored to your domain
- Document status stays in sync with your work

**Collaboration:**
- Share documents with organization members
- View who created annotations
- Track changes through document history

**Quality:**
- Balance coverage with specificity
- Ensure annotations have clear relationships
- Use consistent terminology across documents

---

**Next Steps:** Once you've annotated your document, proceed to [Knowledge Extraction](06-knowledge-extraction.md) to learn how to transform annotations into structured knowledge.
