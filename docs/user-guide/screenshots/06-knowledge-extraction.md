# Knowledge Extraction

## Overview
Knowledge Extraction transforms your document annotations into structured, searchable knowledge entries in the Knowledge Base. This AI-powered process uses your macro, meso, and micro annotations combined with an extraction guide to generate clean, reusable knowledge.

## The Extraction Dialog

### Components

#### 1. Modal Title
"Extract Knowledge" - Clearly indicates the current operation

#### 2. Status Message
"Extract knowledge from 0 annotations in this document."
- Shows how many annotations are available for extraction
- Updates as you add/remove annotations from the document
- If count is 0, extraction will have limited output

#### 3. Custom Instructions Field (Optional)
A text area for providing additional guidance to the AI:

**When to Use Custom Instructions:**
- Add domain-specific context or terminology
- Specify extraction focus or priorities
- Request particular formatting or structure
- Provide clarifications on ambiguous content

**Example Custom Instructions:**
```
Focus on machine learning principles.
Emphasize practical applications over theory.
Use technical terminology from the ML domain.
```

**Placeholder Suggestions:**
The field includes helpful examples:
- Focus on generalizing principles for academic writing
- Preserve domain-specific terminology
- Keep examples concrete but transferable

**Important Notes:**
- These instructions are appended to the system prompt
- They customize extraction behavior for your needs
- Should be concise and specific
- Clear instructions lead to better results

#### 4. Action Buttons

**Cancel Button:**
- Closes the extraction dialog
- Returns to document editor
- No changes are made

**Extract Button (Blue):**
- Initiates the knowledge extraction process
- Sends annotations + guide + instructions to AI
- Creates new entries in the Knowledge Base
- Takes 5-30 seconds depending on annotation volume
- Shows progress feedback during processing

## Using the Extraction Guide Selector

Before extracting, you can choose which guide to use (see Document Editor screenshot for selector):

**Default Knowledge Extraction (Default):**
- General-purpose extraction for broad domains
- Works well for most content types
- Produces structured knowledge entries
- Handles all annotation types

**Custom Guides:**
- Organization-specific extraction patterns
- Optimized for particular domains or use cases
- Can be managed in Settings > Prompts
- Created by admins for team use

**How to Select a Guide:**
1. In the Document Editor sidebar under "Actions"
2. Click the "Extraction Guide" dropdown
3. Choose from available guides
4. Selected guide is used when extraction begins
5. Can be changed before each extraction

## Knowledge Extraction Workflow

### Step 1: Annotate Your Document
Before extracting, ensure you have:
- **Macro annotations** (red) - Major concepts
- **Meso annotations** (yellow) - Supporting ideas
- **Micro annotations** (green) - Specific facts
- **Tags** - Document categorization

**Best Practice:** Have at least 5-10 annotations for good extraction results.

### Step 2: Open Extraction Dialog
1. In the Document Editor
2. Click **"Extract Knowledge"** button (blue) in the right sidebar
3. Extraction dialog opens

### Step 3: Review Annotation Count
- Check the status message for annotation count
- If count is 0 or very low, consider adding more annotations first
- More annotations = richer knowledge extraction

### Step 4: Add Custom Instructions (Optional)
1. Click in the Custom Instructions field
2. Type specific guidance for extraction
3. Examples provided in placeholder text
4. Keep instructions focused and clear

**Tips for Effective Instructions:**
- Be specific about what you want to emphasize
- Mention domain-specific terms to preserve
- Note any special handling needed
- Keep to 1-3 sentences typically

### Step 5: Verify Extraction Guide
1. Ensure correct guide is selected in Document Editor
2. Review guide description if unsure
3. Different guides optimize for different outputs
4. Change guide if needed before extracting

### Step 6: Initiate Extraction
1. Click **"Extract"** button
2. System processes annotations + guide + instructions
3. Progress indicator shows processing status
4. Process takes 5-30 seconds

### Step 7: View Results
1. Extraction completes
2. New knowledge entries created in Knowledge Base
3. Entries appear under their respective tags
4. Each entry shows:
   - Title/topic
   - Extracted knowledge content
   - Source document reference
   - Creation timestamp
   - Associated tags

## Knowledge Base Integration

After extraction, entries appear in:
- **Knowledge Base** > Browse knowledge entries
- Searchable by content and tags
- Filterable by knowledge categories
- Reusable across projects and documents
- Can be edited and refined after creation

**Finding Extracted Knowledge:**
1. Go to Knowledge Base (main navigation)
2. Use Search to find by keyword
3. Use Tag filter to find by document tag
4. View entry metadata and source document

## What Gets Extracted

The extraction process creates knowledge entries that include:

**From Macro Annotations:**
- Core concepts and main themes
- Principal ideas and overarching frameworks
- Foundational knowledge pieces

**From Meso Annotations:**
- Explanations and supporting context
- Relationships between concepts
- Methodologies and processes

**From Micro Annotations:**
- Specific facts and examples
- Concrete data and evidence
- Detailed supporting information

## Customizing Extraction

### Changing the Extraction Guide
1. Document Editor sidebar > Actions > Extraction Guide
2. Select different guide from dropdown
3. Different guides produce different knowledge structures
4. Guides can be customized by admins

### Adding Custom Instructions
1. In extraction dialog, enter Custom Instructions
2. Provide domain-specific guidance
3. Examples:
   - "Focus on business applications"
   - "Preserve scientific terminology"
   - "Extract metrics and benchmarks"

### Refining Results
After extraction:
1. Review generated entries in Knowledge Base
2. Edit entries if needed (creator can edit)
3. Add additional tags or metadata
4. Re-extract if results need improvement

## Best Practices for Extraction

**Before Extracting:**
- Annotate thoroughly with all three levels
- Organize annotations logically
- Add meaningful tags to document
- Select appropriate extraction guide

**During Extraction:**
- Provide clear custom instructions if needed
- Use domain-specific language in instructions
- Reference terminology important to your field

**After Extraction:**
- Review generated entries quality
- Refine or edit if needed
- Add additional metadata
- Tag knowledge entries for discovery

## Troubleshooting

**"Extract knowledge from 0 annotations"**
- Add annotations to your document first
- At least 5-10 annotations recommended
- Try extraction with existing annotations

**"Extracted content seems incorrect"**
- Review custom instructions for clarity
- Check annotation accuracy and placement
- Try different extraction guide
- Edit extracted entry to correct

**"Nothing extracted"**
- Ensure annotations exist in document
- Verify extraction guide is appropriate
- Check that custom instructions are valid
- Try simpler instructions if complex

---

**Next Steps:**
- Browse extracted knowledge in [Knowledge Base](../knowledge-base.md)
- Learn about organizing knowledge with [Tags](../tags.md)
- Create new extraction guides in [Settings > Prompts](../settings/prompts.md)
