# Document Properties & Management

## Overview
Document Properties allow you to manage metadata, permissions, and sharing for individual documents. This interface appears in the Document Editor sidebar under "Document Info" and provides access to all document management features.

## Document Information Sidebar

### 1. Status Field
Displays and manages the document's processing status:

**Available Status Values:**
- **raw** - Document created but not yet processed or annotated
- **processed** - Document has been analyzed and is ready for work
- **completed** - Document fully annotated and processed

**Changing Status:**
- Click the Status field
- Select new status from dropdown
- Status automatically updates
- Useful for workflow tracking

**Use Cases:**
- Mark documents as "In Progress" by changing to "processed"
- Set to "completed" when annotation is finished
- Use status filters on dashboard to focus work

### 2. Annotations Summary
Shows current annotation counts:
- **0 macro** - Red-level annotations
- **0 meso** - Yellow-level annotations
- **0 micro** - Green-level annotations

**Information Only:**
- Read-only display of annotation counts
- Click to filter and view specific annotation types
- Updates in real-time as you annotate

### 3. Tags Management
Organize and categorize the document:

**Adding Tags:**
1. Click "Select tags..." dropdown
2. Choose from existing tags
3. Or type to create new tag
4. Multiple tags can be applied

**Tag Organization:**
- Use tags for project identification
- Tag by document type or category
- Tag for workflow status
- Use consistent naming across team

**Creating New Tags:**
- Type tag name that doesn't exist
- Press Enter to create
- New tag is available for all documents
- Can be managed in Settings > Tag Management

**Tag Permissions:**
- Tags you create show as "Yours"
- System tags show as "System"
- Shared tags show as "Shared" (if in organization)
- Only creator can delete own tags
- Admins can delete any tag

**Tag Examples:**
- Project tags: "Q1-2024", "Client-ABC"
- Type tags: "Report", "Research", "Minutes"
- Status tags: "Review-Needed", "Approved", "Draft"

### 4. Actions Section

#### Extraction Guide Selector
Choose the AI guide for knowledge extraction:
- **Default Knowledge Extraction (Default)** - General-purpose guide
- Click dropdown to see custom guides
- Guides can be created/managed by admins
- Selected guide is used when extracting knowledge

#### Extract Knowledge Button (Blue)
Initiates AI-powered knowledge extraction:
- Uses annotations + guide + custom instructions
- Creates searchable entries in Knowledge Base
- Requires at least some annotations
- Opens extraction dialog with options

**Before Extracting:**
- Ensure document has annotations
- Review and finalize annotations
- Add relevant tags
- Consider custom instructions needed

**After Extracting:**
- Knowledge entries appear in Knowledge Base
- Entries are tagged and searchable
- Can be refined or re-extracted

#### Download Button
Export the document for backup or sharing:
- Downloads as markdown file (.md)
- Includes all content and annotations
- Preserves document structure
- Useful for external sharing or archival

**Download Contents:**
- Document title and metadata
- Complete content with markdown formatting
- All annotations with their levels
- Associated tags
- Creation and modification dates

#### Delete Document Button (Red)
Remove the document permanently:

**Important Details:**
- Only available to document creator
- Uses soft delete (document marked deleted but retained in logs)
- Cannot be undone (requires admin restore)
- Removes document from all views
- Preserves audit trail

**Before Deleting:**
- Ensure this is the right document
- Consider downloading first if needed
- Extraction should be complete if knowledge extraction planned
- Verify no team members are actively using

## Permission Model

### Document Creator
Only the person who created the document has full control:
- **Edit**: Can modify content, annotations, tags, status
- **Delete**: Can permanently delete document
- **Share**: Can share with team/organization
- **Rename**: Can change document title
- **Extract**: Can extract knowledge

### Organization Team Members
Other members of your organization:
- **View**: Can see documents shared with the organization
- **Edit**: Depends on document sharing settings
- **Annotate**: Can add/modify their own annotations
- **Extract**: Permitted for shared documents

### Admins
Organization administrators:
- **Full Access**: Can view, edit, delete any document
- **Management**: Can manage tags, guides, users
- **Restore**: Can recover soft-deleted documents
- **Audit**: Can view document change history

## Workflow: Managing Document Properties

### Scenario 1: Set Up a New Document
1. Create document (see Create Document guide)
2. Add **descriptive title**
3. Add relevant **tags** for your project
4. Set initial **status** to "processed"
5. Begin annotating (see Document Editor guide)
6. Change status to "completed" when done

### Scenario 2: Prepare for Knowledge Extraction
1. Review document **annotations** - ensure adequate coverage
2. Add **tags** for knowledge categorization
3. Select appropriate **extraction guide**
4. Click **Extract Knowledge**
5. Add optional **custom instructions**
6. Click **Extract** in dialog
7. Generated entries appear in Knowledge Base

### Scenario 3: Archive or Remove Document
1. **Download** document for backup if needed
2. Confirm no other team members need it
3. Click **Delete Document** button
4. Confirm deletion in dialog
5. Document removed from view
6. (Admin can restore if needed)

## Document Metadata

Each document maintains the following metadata:

**Created:**
- Document creator (user who made it)
- Creation timestamp
- Cannot be changed

**Modified:**
- Last modification timestamp
- Updated when annotations added
- Updated when tags changed

**Status:**
- Current workflow status
- Can be changed anytime
- Used for filtering and organization

**Tags:**
- One or more categorization tags
- Can be added/removed anytime
- Searchable and filterable

**Annotations:**
- Count by level (macro/meso/micro)
- Updated in real-time
- Enables extraction

## Best Practices

### Document Organization
- **Consistent Naming**: Use clear, descriptive titles
- **Systematic Tagging**: Establish team tagging conventions
- **Regular Status Updates**: Keep status reflecting current work
- **Timely Deletion**: Remove documents no longer needed

### For Organization Owners
- **Establish Tagging System**: Work with team on consistent tags
- **Monitor Progress**: Use status field to track workflow
- **Archive Old Documents**: Remove completed or obsolete documents
- **Guide Selection**: Recommend extraction guides for document types

### For Document Creators
- **Complete Annotations**: Ensure thorough annotation before extraction
- **Thoughtful Tags**: Use tags that help team find related documents
- **Status Tracking**: Update status as document progresses
- **Knowledge Quality**: Review extracted knowledge and refine as needed

## Permission Examples

### Organization Owner Access
- Create new documents
- Annotate and extract knowledge
- See team members' documents
- Manage tags and extraction guides
- Delete own documents
- Cannot delete others' documents

### Team Member Access
- Create documents for self
- View and annotate shared documents
- Extract knowledge from own documents
- See organization documents (view-only by default)
- Annotate in documents shared for collaboration

### Admin Access
- Full access to all documents
- Can edit/delete any document
- Manage users and permissions
- Configure extraction guides
- Restore deleted documents
- View audit logs

---

**Related Guides:**
- [Document Editor](05-document-editor.md) - How to annotate documents
- [Knowledge Extraction](06-knowledge-extraction.md) - Transform annotations to knowledge
- [Settings > Tags](../settings/tags.md) - Manage organization tags
- [Settings > Extraction Guides](../settings/prompts.md) - Create custom guides
