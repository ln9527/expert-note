# Trash / Recovery Page

The Trash section allows you to recover accidentally deleted items or permanently remove them from the system. This acts as a safety net for accidental deletions.

## Overview

**Location:** Settings → Trash (accessible from the Settings menu)

The Trash page displays all items you've deleted. Deleted items are not permanently removed immediately - they're marked as deleted and moved to the trash. This gives you a grace period to recover items if you deleted them by mistake.

## Key Components

### 1. Category Tabs (Item Type Filter)
**Location:** Top of the Trash section, horizontal tab buttons

Allows you to filter deleted items by type. Shows the count of deleted items in each category:

- **All (0):** Shows all deleted items regardless of type
- **Document (0):** Deleted documents only
- **Prompt (0):** Deleted Generation Guides/Prompts only
- **Knowledge (0):** Deleted knowledge entries only

The numbers in parentheses show how many items of each type are in the trash.

**Usage:**
- Click on a category tab to filter
- Click "All" to see all deleted items at once
- Use specific categories to find the item you're looking for
- Numbers update as you restore or permanently delete items

### 2. Deleted Items List
**Location:** Main content area, below the category tabs

Displays the table or list of deleted items. When items are in the trash, each row shows:

- **Item Name/Title:** The name of the deleted item
- **Type:** Icon or label indicating item type (Document, Prompt, Knowledge Entry)
- **Deleted Date:** When the item was deleted
- **Deleted By:** Who deleted the item
- **Actions:** Buttons for restore and permanent delete

**Columns (typical):**
- NAME/TITLE
- TYPE
- DELETED DATE
- ACTIONS (Restore, Permanently Delete)

**Usage:**
- Review items in trash
- Click on an item to see more details
- Use the category tabs to narrow your view
- Look for recently deleted items at the top

### 3. Empty State Message
**Location:** Center of the list area, when no items are in trash

Shows when the trash is empty: "Trash is empty" with a trash can icon

This indicates that:
- No items have been deleted recently
- All previously deleted items have been permanently deleted
- Your trash has been emptied

## Workflow Examples

### Recovering a Deleted Document

1. Navigate to **Settings** → **Trash**
2. Click the **Document** tab to show only deleted documents
3. Find the document you want to recover in the list
4. Click the **Restore** button (or restore icon) in the Actions column
5. The document will be recovered and moved back to your Documents section
6. You'll see a confirmation message

### Permanently Deleting Items

1. Go to **Settings** → **Trash**
2. Select items to delete or filter by type using the category tabs
3. Click the **Permanently Delete** button (or delete icon)
4. Confirm the action in the modal dialog that appears
5. The item will be permanently removed from the system
6. **Note:** This action cannot be undone

### Emptying the Entire Trash

1. Navigate to **Settings** → **Trash**
2. Click **Empty Trash** button (if available)
3. Confirm you want to permanently delete all items in trash
4. All deleted items will be permanently removed
5. The trash will show the empty state message

## Item Recovery Timeline

Items deleted in Expert Note follow this lifecycle:

1. **Item Created:** Normal item in system
2. **Delete Requested:** User clicks delete
3. **Soft Delete:** Item moved to trash (marked as deleted but still in database)
4. **Grace Period:** Item remains in trash for a configurable period (default: 30 days)
5. **User Recovery:** User can restore item during this period
6. **Auto-Purge:** After grace period, item is automatically permanently deleted
7. **Permanent Delete:** Item completely removed from database

## Important Notes

### Soft Delete vs. Permanent Delete

- **Soft Delete (Trash):** Items are marked as deleted but still in the database. They don't appear in normal views but are recoverable from the trash.
- **Permanent Delete:** Items are completely removed from the database. This action cannot be undone.

### Permissions

- Users can delete their own items (soft delete)
- Users can restore their own deleted items
- Admins can permanently delete any items
- Organization owners can manage items within their organization

### Recovery Window

Deleted items typically remain recoverable for 30 days by default. After this period, they're automatically permanently deleted and cannot be recovered.

## Column Details

When items are in the trash, you'll see these details:

- **Item Name:** Title or name of the deleted item
- **Type:** Category badge (Document, Prompt, Knowledge)
- **Deleted Date:** Date and time when item was deleted
- **Deleted By:** Username of the person who deleted it
- **Size:** File size (for documents with attachments)
- **Original Location:** Where the item was stored before deletion

## Actions Available

For each deleted item, you can:

- **Restore:** Recover the item and return it to its original location
- **View Details:** Click to see more information about the deleted item
- **Permanently Delete:** Irreversibly remove the item from the system
- **Preview:** Some items can be previewed before restoration

## Best Practices

- **Review before permanent delete:** Check item details before clicking "Permanently Delete"
- **Restore important items promptly:** Don't wait until the grace period expires
- **Empty trash periodically:** Remove items you know you won't need to free up space
- **Check trash before recreating:** If something went wrong, check trash before recreating from scratch
- **Understand the grace period:** Know that auto-purge happens after the grace period

## Related Features

- **Documents:** Source of deleted documents
- **Prompts:** Source of deleted Generation Guides
- **Knowledge Base:** Source of deleted knowledge entries
- **Settings:** Central location for all account settings
- **Account Settings:** Adjacent page for personal account configuration

## Tips and Best Practices

- Use trash as a safety mechanism, not primary storage
- Regularly review and empty trash to keep the system clean
- Be intentional about permanent deletions
- For important items, export before deleting
- Archive old items instead of deleting if you might need them later
- Document deletion reasons in item descriptions before deleting
- Consider creating a "Archive" tag for items before soft deletion

## Automated Cleanup

The system automatically:
- Marks items as deleted without immediately removing them
- Keeps deleted items recoverable for 30 days
- Permanently removes expired items after the grace period
- Maintains audit logs of deletions (for admins)
- Logs who deleted each item and when
