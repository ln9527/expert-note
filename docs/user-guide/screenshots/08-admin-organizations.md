# Admin Organizations Page

## Overview

The **Organizations** page is the central hub for managing organizations and their invitation codes. Only super administrators can access this page via the Settings menu.

**Access:** Settings > Admin > Organizations (default view for /settings/admin)

---

## Key Features

### 1. Settings Sidebar (Left Panel)

Navigation menu for admin settings:

- **Generation Guides**: Manage prompt templates and extraction guides
- **Tag Management**: Configure system and organization tags
- **ADMIN Section**:
  - User Management: Manage user accounts, roles, and permissions
  - Invitation Codes: Create and manage invitation codes (duplicated below for quick access)
  - Trash: Recover or permanently delete soft-deleted items
- **Account Settings**: Personal account configuration

The sidebar uses orange highlighting to indicate the current section.

---

### 2. Create Organization Button

**Location:** Top-right corner, green button with "+" icon

**Purpose:** Launch modal to create a new organization

**Details:**
- Each new organization receives an auto-generated owner invitation code
- Owner code allows one user to set themselves as the organization owner
- Organizations are essential for team collaboration

**Example Modal Fields:**
- Organization Name (required)
- Created automatically with a "Show deleted organizations" checkbox

---

### 3. Organizations List (Table)

**Columns:**
- **ORGANIZATION NAME**: The name of the organization
- **OWNER CODE**: Auto-generated code for owner registration (with copy icon)
- **USES**: Format "used/limit" showing invitation code usage (e.g., "0/∞" for unlimited)
- **MEMBERS**: Current member count in the organization
- **CREATED**: Organization creation date
- **ACTIONS**: Delete button (red text) to remove the organization

**Table Features:**
- Shows all organizations managed by the system
- Includes "Test Organization" (default org for existing users)
- Owner codes are copyable via icon button
- Organizations with active members display member count
- Soft delete: Deleted organizations can be recovered via Trash

---

## Invitation Codes Section

Directly below the Organizations table, provides quick access to invitation code management without navigating away.

### 4. Create Code Button

**Location:** Top-right of Invitation Codes section, blue button with "+" icon

**Purpose:** Quick button to create a new invitation code

**Features:**
- Opens modal for code creation
- Allows selecting organization and code type (Owner/Member)
- Optionally set usage limits
- Generated codes are automatically copied to clipboard

---

### 5. Invitation Codes Table

**Columns:**
- **CODE**: The unique invitation code (copyable)
- **TYPE**: Badge-styled indicator
  - Blue "org owner": Owner registration code
  - Green "org member": Member registration code
- **DETAILS**: Context about the code
  - "Owner of: [Organization]" for owner codes
  - "Member of: [Organization]" for member codes
- **STATUS**: Usage status
  - Green badge "0/∞": Unlimited usage
  - Green badge "0/1": Single use (one user can register)
- **CREATED**: Date the code was generated
- **ACTIONS**: Delete button (available only for unused codes)

---

### 6. Code Type Filter

**Location:** Left side of Invitation Codes section

**Options:**
- Show used codes (checkbox)
- Type filter dropdown:
  - All Types (default)
  - org owner
  - org member

**Purpose:** Filter codes to quickly find specific code types

---

## Common Workflows

### Creating an Organization
1. Click **Create Organization** button
2. Enter organization name
3. Submit form
4. Auto-generated owner code appears in the Organizations list
5. Share the owner code with the designated owner
6. Owner uses code during registration to claim organization ownership

### Inviting Users to Organization
1. Click **Create Code** button
2. Select organization and code type (Member)
3. Set usage limit if needed
4. Code generates automatically
5. Share code with users for registration

### Managing Organization Codes
1. Use Type filter to show only owner or member codes
2. Use "Show used codes" to see historical codes
3. Copy codes using the icon button
4. Delete unused codes via Actions column

---

## Notes

- **Soft Delete**: Organizations are soft-deleted and can be recovered via Trash
- **Auto-Generated Codes**: Each organization gets a unique owner code
- **Unlimited Usage**: Default invitation codes can be used unlimited times unless limit is set
- **Ownership**: Only one owner code per organization; user who registers with it becomes owner
- **Access Control**: Only super_admin role can access this page

---

**Last Updated:** 2026-01-15
