# Common Features & Quick Reference

This section covers the features and concepts you will use throughout Expert Note.

---

## Understanding Annotations

Annotations are the core of Expert Note. They help you structure your reading by categorizing highlighted text into three levels:

| Level | Color | Purpose | Examples |
|-------|-------|---------|----------|
| **MACRO** | Red | Theme-level annotations | Main arguments, conclusions, key themes, thesis statements |
| **MESO** | Yellow | Evidence-level annotations | Supporting points, examples, data, case studies |
| **MICRO** | Green | Detail-level annotations | Specific quotes, definitions, technical terms, fine details |

### How Annotations Work

1. **Select text** in your document
2. **Choose a category** (MACRO, MESO, or MICRO)
3. **Add optional notes** to capture your thoughts
4. **Save** to preserve your annotations

Annotations serve two purposes:
- **Structure your reading**: Organize content by importance and type
- **Enable knowledge extraction**: Generate structured knowledge entries from your annotations using AI

---

## Search and Filtering

All list views (Documents, Knowledge Entries, Generation Guides) support search and filtering.

### Search Box
- Type in the search box to find items by title
- Search updates results as you type
- Clear the search box to show all items

### Status Filter
Filter documents by their current state:
- **Raw**: Newly uploaded, not yet annotated
- **Annotated**: Has annotations but not refined
- **Refined**: Fully processed with knowledge extracted

### Tag Filter
- Click a tag to filter by that tag
- Click multiple tags to combine filters (shows items matching ALL selected tags)
- Click a selected tag again to remove it from the filter

### Creator Filter
For shared content within your organization:
- Filter to see only your own content
- Filter to see content from specific team members

---

## Tag Management

Access tag management from **Settings > Tags**.

### Viewing Tags
- All tags are displayed with their assigned colors
- Tags show a usage count (how many items use each tag)

### Creating Tags
1. Click the **"+ Create Tag"** button
2. Enter a tag name
3. Select a color from 10 available options:
   - Red, Orange, Yellow, Green, Teal
   - Blue, Indigo, Purple, Pink, Gray
4. Click **Create** to save

### Tag Ownership
Tags display badges indicating who created them:
- **System**: Default tags that cannot be deleted
- **Yours**: Tags you created (you can delete these)
- **Shared**: Tags created by others in your organization (only super admins can delete)

### Deleting Tags
- Click the delete icon next to a tag you own
- System tags cannot be deleted
- Deleting a tag removes it from all associated items

---

## Trash & Recovery

Access trash from **Settings > Trash**.

### How Trash Works
- Deleted items go to trash first (soft delete)
- Items remain in trash until permanently deleted
- You can recover items from trash at any time

### Filtering Trash
Filter by item type:
- **Documents**: Deleted text documents
- **Prompts**: Deleted generation guides
- **Knowledge**: Deleted knowledge entries

### Recovering Items
1. Find the item in trash
2. Click the **"Restore"** button
3. Item returns to its original location

### Permanent Deletion
- **Single item**: Click "Permanently Delete" next to an item
- **All items**: Click "Empty Trash" to remove everything at once

**Warning**: Permanent deletion cannot be undone. Data is removed from the database entirely.

---

## Account Settings

Access your account from **Settings > Account**.

### Edit Display Name
1. Enter your new display name in the field
2. Click **Save Changes**
3. Your name updates across the application

### Change Password
1. Enter your **current password**
2. Enter your **new password**
3. Enter your new password again to **confirm**
4. Click **Change Password**

Password requirements:
- Minimum 8 characters
- Must differ from current password

---

## Keyboard Shortcuts

Use these shortcuts to work faster in the document editor:

| Shortcut | Action |
|----------|--------|
| `Cmd + K` | Open document switcher |
| `Cmd + S` | Save current document |
| `Cmd + 1` | Add MACRO annotation (red) |
| `Cmd + 2` | Add MESO annotation (yellow) |
| `Cmd + 3` | Add MICRO annotation (green) |

**Note**: On Windows/Linux, use `Ctrl` instead of `Cmd`.

---

## Glossary

| Term | Definition |
|------|------------|
| **Document** | A text file you upload and annotate. Supports plain text, PDF, and DOCX formats. |
| **Annotation** | Highlighted text with a category (MACRO, MESO, or MICRO) and optional notes. |
| **Knowledge Entry** | Structured information extracted from your annotations, organized with background context, key points, and tags. |
| **Generation Guide** | A template for AI prompt generation. Defines how to convert annotations into useful output (called "Prompt Template" in code). |
| **Organization** | A group of users working together who can share documents, knowledge entries, and generation guides. |
| **Tag** | A label applied to documents, knowledge entries, or generation guides for organization and filtering. |
| **Soft Delete** | Moving an item to trash without permanently removing it. Can be restored. |
| **Hard Delete** | Permanently removing an item from the database. Cannot be undone. |

---

## Tips for Effective Use

1. **Start with MACRO annotations**: Identify the main themes before drilling into details
2. **Use consistent tagging**: Create a tag system and apply it uniformly
3. **Extract knowledge early**: Generate knowledge entries while the content is fresh
4. **Review trash regularly**: Permanently delete items you no longer need to keep your workspace clean
5. **Use keyboard shortcuts**: Speed up annotation with Cmd+1/2/3 shortcuts
