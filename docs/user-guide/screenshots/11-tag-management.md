# Tag Management Page

## Overview

The **Tag Management** page allows administrators to create, edit, and delete tags that are used throughout the system for organizing documents, knowledge entries, and prompts. Tags help users categorize and discover content efficiently.

**Access:** Settings > Tag Management (appears in both user and admin settings)

---

## Key Features

### 1. Create Tag Button

**Location:** Top-right corner, blue button with "+" icon

**Purpose:** Launch modal to create a new tag

**Modal Fields:**
- **Tag Name** (required): Short, descriptive name (e.g., "methodology", "results")
- **Color** (color picker): Choose tag color from palette
- **Description** (optional): Additional context for tag usage

**Features:**
- Creates tag immediately upon submission
- New tag appears in list with specified color
- Ownership auto-assigned based on creator
- Color picker with predefined palette:
  - Cyan, Red, Orange, Yellow, Green, Purple, etc.

---

### 2. Tag List with Ownership Badges

**Display:** Below the Create Tag button, list of all tags

**List Features:**
- **Tag Color Circle**: Visual indicator (left side of each tag)
  - Each tag has distinct color for quick recognition
  - Color can be edited by tag owner
  - Used consistently across entire system

- **Tag Name**: Main label for the tag
  - Clickable for editing
  - Searchable in knowledge base and document tagging

- **Ownership Badge**: Right side of tag item
  - **"System"** (gray badge): Global tag created by admin, available to all users
  - **"Yours"** (blue badge): Tag you created, only you can delete
  - **"Shared"** (purple badge): Tag from another organization member
  - Shows creator and ownership status

**Tags in Example:**
- discussion (cyan) - System
- introduction (red) - System
- literature-review (orange) - System
- methodology (yellow) - System
- results (green) - System
- theory (purple) - Shared

---

### 3. Tag Item with Color, Badge, Edit & Delete

**Components per Tag Row:**

| Element | Purpose | Details |
|---------|---------|---------|
| **Color Circle** | Visual tag identifier | Clickable to edit color (picker modal) |
| **Tag Name** | Tag label | Clickable to edit name and description |
| **Ownership Badge** | Creator indicator | System/Yours/Shared; determines permissions |
| **Edit Button** | Modify tag | Opens edit modal for name, description, color |
| **Delete Button** | Remove tag | Red lock icon; only works if "Yours" tag |

**Permission Logic:**
- **Your Tags**: Can edit name, color, description; can delete
- **System Tags**: Read-only; cannot delete (super_admin only)
- **Shared Tags**: Read-only; cannot modify
- **Other Users' Tags**: Cannot edit or delete

**Delete Behavior:**
- Soft delete: Tag marked as deleted, hides from list
- Cascading: Removes tag associations from documents, entries, prompts
- Recoverable: Soft-deleted tags appear in Trash for recovery
- Permission: Only creator or super_admin can delete

---

## Detailed Workflows

### Creating a System Tag
1. Click **Create Tag** button
2. Enter tag name (e.g., "methodology")
3. Select color from palette
4. Add optional description
5. Submit
6. Tag appears in list marked as "System" (if super_admin)
7. Tag available to all users system-wide

### Creating Organization Tag
1. Click **Create Tag** button
2. Enter organization-specific name (e.g., "project-alpha")
3. Choose distinctive color
4. Add description of usage
5. Submit
6. Tag shows as "Yours" if non-admin, "Shared" for org members
7. Only organization members see the tag

### Editing Tag Properties
1. Click tag name or **Edit** button
2. Modal opens with current values:
   - Tag name field
   - Color picker (shows current color)
   - Description field
3. Modify values
4. Click Save
5. Changes apply immediately across system

### Changing Tag Color
1. Click the color circle
2. Color picker modal appears
3. Select new color from palette
4. Color updates immediately
5. All associated items update to show new color

### Deleting Personal Tag
1. Locate tag marked as "Yours"
2. Click **Delete** button (red lock icon)
3. Confirmation dialog appears
4. Click Confirm Delete
5. Tag soft-deleted and moved to Trash
6. Tag associations removed from all items
7. Can recover via Trash for 30 days

### Deleting System Tag (Admin Only)
1. Only super_admin can delete system tags
2. Navigate to tag
3. Click Delete button (if visible)
4. Confirmation appears
5. System tag soft-deleted with cascade to all items

---

## Tag Usage Across System

Tags appear in these locations:

| Location | Usage | Example |
|----------|-------|---------|
| **Documents** | Document categorization | "methodology" tag on research document |
| **Knowledge Base** | Entry organization | "results" tag on extracted knowledge |
| **Prompts** | Prompt categorization | "generation" tag on writing prompt |
| **Search/Filter** | Finding related content | Filter documents by tag |
| **Bulk Operations** | Tag management | Add/remove tags from multiple items |

---

## Tag Management Best Practices

### Naming Conventions
- Use lowercase, hyphen-separated for multi-word tags
  - Good: "literature-review", "methodology-notes"
  - Avoid: "Literature Review", "Methodology_Notes"
- Keep names concise (2-3 words maximum)
- Use descriptive names for clarity

### Color Organization
- **System categories** (methodology, results, discussion) → Different colors
- **Project types** (case-study, experiment) → Consistent palette
- **Status tags** (draft, review, final) → Intuitive colors (yellow=draft, green=final)

### Ownership Strategy
- **System tags**: Standardized, used across all organizations
- **Shared tags**: Collaborate with team on common tags
- **Personal tags**: Experiment with organizational schemes
- Clean up personal tags regularly

### Deletion Strategy
- Soft delete (no data loss) for tags no longer needed
- Check Trash periodically for recovery
- Archive old system tags before deletion
- Document tag deprecation in release notes

---

## Technical Details

### Tag Properties
- **ID**: Unique identifier (UUID)
- **Name**: User-provided text label
- **Color**: Hex color code or named color
- **Created By**: User ID of creator
- **Created At**: Timestamp of creation
- **Is Deleted**: Boolean flag (soft delete)
- **Deleted At**: Timestamp of deletion (if deleted)
- **Organization ID**: Owner org (if org-scoped)

### Tag Associations
- Tags link to documents via many-to-many relationship
- Tags link to knowledge entries via many-to-many relationship
- Tags link to prompts via many-to-many relationship
- Deletion cascades: Removes all associations

### Performance
- Tag list cached in local state
- Search filters client-side for speed
- Color picker uses CSS custom properties
- Tag counts updated in real-time

---

## Troubleshooting

**Tag not appearing after creation:**
- Refresh page or wait 2-3 seconds
- Check if tag is soft-deleted (view Trash)
- Verify organization scope (shared tags only in org)

**Cannot delete tag:**
- Tag must be marked "Yours" (not System or Shared)
- Check user permissions (must be creator or admin)
- Try from Tag Management, not from document tagging interface

**Color not updating:**
- Clear browser cache and refresh
- Try different browser if issue persists
- Check for JavaScript errors in console

**Tag not showing in document tagger:**
- Tag may be soft-deleted (check Trash)
- Tag may be from different organization
- Refresh document to see new tags

---

## Notes

- **Soft Delete**: Tags are soft-deleted and recoverable via Trash for 30 days
- **Cascading**: Deleting a tag removes it from all associated items
- **Real-time**: Changes apply immediately without page reload
- **Permissions**: Only creator or super_admin can modify tags
- **Organization-Scoped**: Tags can be limited to specific organizations

---

**Last Updated:** 2026-01-15
