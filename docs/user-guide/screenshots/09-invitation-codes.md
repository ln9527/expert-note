# Invitation Codes Page

## Overview

The **Invitation Codes** section is part of the Admin Organizations page and provides comprehensive management of user registration codes. This section allows administrators to create, filter, and manage codes for different organization roles.

**Access:** Settings > Admin > Organizations (scroll to Invitation Codes section)

---

## Key Features

### 1. Create Code Button

**Location:** Top-right of Invitation Codes section, blue button with "+" icon

**Purpose:** Launch modal to create a new invitation code

**Modal Fields:**
- **Organization** (dropdown): Select which organization the code belongs to
- **Code Type** (radio or dropdown):
  - **org owner**: User registering with this code becomes organization owner
  - **org member**: User registering with this code joins as a member
- **Usage Limit** (optional number field):
  - Leave blank or enter 0 for unlimited usage
  - Enter 1 for single-use code (first user to register claims it)
  - Enter any number for multi-use up to that limit

**Features:**
- Code generated automatically (unique alphanumeric string)
- Code appears in the table immediately
- Default status is "Not used" (0/limit)

---

### 2. Code Type Badges

**Display:** In the TYPE column of the Invitation Codes table

**Badge Styles:**
- **Blue badge** "org owner": Owner registration codes
  - Grants ownership role on first use
  - Typically created to assign org owner
  - Usually single-use or limited use

- **Green badge** "org member": Member registration codes
  - Standard membership access
  - Most common code type
  - Usually unlimited use for organization growth

**Color Coding:**
- Blue = Elevated privileges (owner)
- Green = Standard access (member)

---

### 3. Usage Limit Field

**Purpose:** Control how many users can register with each code

**Display Format:** "used/limit"
- Examples:
  - "0/∞" = Unlimited usage (most common)
  - "0/1" = Single-use code
  - "0/10" = Can be used by up to 10 users
  - "2/5" = Already used by 2 users, 3 remaining uses

**Status Badge Colors:**
- **Green**: Code still has available uses
- **Gray**: Code fully used (no longer available)

**Behavior:**
- Each registration consumes one use
- Once limit reached, code cannot be used
- Used codes can be deleted or kept for audit trail

---

### 4. Invitation Codes Table

**Columns:**

| Column | Description |
|--------|-------------|
| **CODE** | Unique invitation code (e.g., K6HZKOPR) with copy icon |
| **TYPE** | Role-specific badge (org owner / org member) |
| **DETAILS** | Context info (e.g., "Owner of: ning-2", "Member of: Test Organization") |
| **STATUS** | Usage indicator (e.g., "0/1", "0/∞") |
| **CREATED** | Date code was generated (e.g., "1/14/2026") |
| **ACTIONS** | Delete button (red, available only for unused codes) |

**Table Features:**
- Sortable by clicking column headers
- Scrollable horizontally on small screens
- Shows pagination if many codes exist
- Codes remain in table even after use (for audit trail)
- Used codes cannot be deleted (actions disabled)

**Example Rows:**
```
K6HZKOPR  │ org member  │ Member of: Test Organization  │ 0/1   │ 1/14/2026 │ Delete
X8M9EZGB  │ org owner   │ Owner of: ning-3              │ 0/∞   │ 1/14/2026 │ Delete
5CSS5K29  │ org member  │ Member of: ning-2             │ 0/1   │ 1/14/2026 │ Delete
Y9FTA765  │ org owner   │ Owner of: ning-2              │ 0/∞   │ 1/14/2026 │ Delete
```

---

### 5. Filters and Controls

**Location:** Below "Invitation Codes" heading, above the table

**Controls:**

- **Show used codes** (checkbox):
  - Unchecked: Only shows unused codes (default)
  - Checked: Shows all codes including those that have been used

- **Type** (dropdown filter):
  - "All Types" (default): Shows all code types
  - "org owner": Shows only owner registration codes
  - "org member": Shows only member registration codes

**Filter Behavior:**
- Filters apply immediately without page reload
- Multiple filters work together (AND logic)
- Table updates to show only matching codes
- Count indicator updates with filtered results

---

## Workflows

### Creating an Owner Code for New Organization
1. Click **Create Code** button
2. Select organization from dropdown
3. Select **org owner** as code type
4. Set Usage Limit to 1 (single-use)
5. Click Create
6. Share the generated code with designated owner
7. Owner registers using the code to claim ownership

### Bulk Inviting Members
1. Click **Create Code** button
2. Select organization
3. Select **org member** as code type
4. Leave Usage Limit blank for unlimited
5. Create code
6. Share code with all potential members
7. Members register anytime using the same code

### Filtering Unused Owner Codes
1. Uncheck "Show used codes"
2. Select "org owner" from Type dropdown
3. View only active owner codes waiting for registration
4. Share with pending owners

### Cleanup
1. Filter for "Show used codes"
2. Select "Type: org member"
3. Review fully-used member codes
4. Delete old codes no longer needed (deletes only from display, keeps audit trail if soft-delete enabled)

---

## Technical Details

### Code Format
- Alphanumeric strings (typically 8 characters)
- Unique per system
- Case-insensitive for user input
- Copyable to clipboard for easy sharing

### Status Logic
- **Unused** (0/limit): Available for registration
- **Partially Used** (x/limit where x < limit): Some uses remaining
- **Fully Used** (x/limit where x = limit): Cannot be used again
- **Unlimited** (0/∞): Always available unless manually deleted

### Permissions
- Only super_admin can create/manage codes
- Org owners can view codes for their organization (if feature enabled)
- Code visibility is organization-scoped

---

## Security Notes

- Codes are unique and cannot be guessed
- Share codes via secure channels (email, messages, not in logs)
- Delete unused codes after reasonable period
- Monitor "used codes" for unusual registration patterns
- Each code generation creates an audit trail

---

**Last Updated:** 2026-01-15
