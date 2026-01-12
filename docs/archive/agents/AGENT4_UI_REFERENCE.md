# Agent 4 UI Reference

Visual reference for the Organization Creation feature in the Super Admin panel.

---

## Page Structure: `/settings/admin`

```
┌─────────────────────────────────────────────────────────────┐
│  Super Admin Panel                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Organizations                           [+ Create Org]     │
│  Create and manage organizations. Each gets an owner code.  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Organization Name │ Description │ Owner Code │ Members │ Created │
│  ─────────────────────────────────────────────────────────  │
│  Research Lab      │ University  │ ✓ Used     │    5    │ Jan 10  │
│  Marketing Team    │ Department  │ ⏳ Pending │    0    │ Jan 11  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Invitation Codes                        [+ Create Code]    │
│  Manage invitation codes for user registration.             │
├─────────────────────────────────────────────────────────────┤
│  [✓] Show used codes    Type: [All Types ▼]                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Code      │ Type       │ Details            │ Status       │
│  ──────────────────────────────────────────────────────────  │
│  A3BK7X9M  │ org_owner  │ Owner of: Lab      │ Available    │
│  P2QR5M3N  │ org_member │ Member of: Lab     │ Available    │
│  X7KL4P9W  │ individual │ -                  │ Used         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Modal 1: Create Organization

```
┌─────────────────────────────────────────────────┐
│  Create Organization                      [X]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Organization Name *                            │
│  ┌─────────────────────────────────────────┐   │
│  │ Enter organization name...              │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Description (optional)                         │
│  ┌─────────────────────────────────────────┐   │
│  │ Brief description of the organization...│   │
│  │                                         │   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌───────────────────────────────────────┐     │
│  │ ℹ️ An owner invitation code will be    │     │
│  │   automatically generated for this org │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│                       [Cancel] [Create Org]    │
└─────────────────────────────────────────────────┘
```

**Behavior:**
- Name field is required (validation on submit)
- Description is optional
- Info box explains auto-generation
- Cancel closes modal
- Create Organization button:
  - Shows "Creating..." during API call
  - Disabled while creating
  - On success: shows Modal 2
  - On error: shows error message above form

---

## Modal 2: Success with Owner Code

```
┌─────────────────────────────────────────────────┐
│  Organization Created!                          │
├─────────────────────────────────────────────────┤
│                                                 │
│  Owner invitation code generated:               │
│                                                 │
│  ┌─────────────────────────────────────┐       │
│  │  A3BK7X9M                    📋    │       │
│  └─────────────────────────────────────┘       │
│                                                 │
│  ┌───────────────────────────────────────┐     │
│  │ ⚠️ Important: Give this code to the    │     │
│  │   person who will manage this org.    │     │
│  │   This code can only be used once.    │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│                                    [Done]      │
└─────────────────────────────────────────────────┘
```

**Behavior:**
- Code shown in large, bold monospace font
- Copy button (📋 icon) copies code to clipboard
- Warning message emphasizes one-time use
- Done button:
  - Closes this modal
  - Closes create org modal
  - Refreshes organizations table
  - New org appears with "Pending" owner code status

---

## Invitation Code Modal (Updated)

```
┌─────────────────────────────────────────────────┐
│  Create Invitation Code                  [X]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Code Type *                                    │
│                                                 │
│  ┌──────────────────────────────────────┐      │
│  │ ○ Individual                          │      │
│  │   Creates a standalone user with      │      │
│  │   no organization                     │      │
│  └──────────────────────────────────────┘      │
│                                                 │
│  ┌──────────────────────────────────────┐      │
│  │ ● Organization Member                 │      │
│  │   Adds the user to an existing org    │      │
│  │   as a member                         │      │
│  └──────────────────────────────────────┘      │
│                                                 │
│  Organization *                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Research Lab                         ▼ │   │
│  ├────────────────────────────────────────┤   │
│  │ Research Lab                           │   │
│  │ Marketing Team                         │   │
│  │ Engineering Dept                       │   │
│  └────────────────────────────────────────┘   │
│                                                 │
│                       [Cancel] [Create Code]   │
└─────────────────────────────────────────────────┘
```

**Changes from Previous Version:**
- ❌ Removed: "Organization Creator" option
- ✅ Changed: "Organization Invite" → "Organization Member"
- ✅ Dropdown now includes newly created organizations
- ✅ No more "org_name" input field

---

## Organizations Table - Status Indicators

### Owner Code Status Column:

**Used (Green Badge):**
```
┌──────────┐
│ ✓ Used   │  (green background, dark green text)
└──────────┘
```
- Means: Owner invitation code has been used
- Indicates: Organization has an owner
- Appearance: Green badge, checkmark icon

**Pending (Amber Badge):**
```
┌──────────┐
│ ⏳ Pending │  (amber background, dark amber text)
└──────────┘
```
- Means: Owner invitation code not yet used
- Indicates: Waiting for owner to register
- Appearance: Amber badge, hourglass icon

### Member Count Display:
```
┌───┐
│ 5 │  (plain number)
└───┘
```
- Shows total users in organization
- Includes owner + members
- Shows "0" if no users yet (owner code pending)

---

## Invitation Codes Table - Updated Display

### Type Column:

**Individual:**
```
┌────────────┐
│ individual │  (gray badge)
└────────────┘
```

**Org Owner:**
```
┌───────────┐
│ org owner │  (blue badge)
└───────────┘
```
- New type for owner codes
- Created automatically when org is created
- Only one per organization

**Org Member:**
```
┌────────────┐
│ org member │  (green badge)
└────────────┘
```
- Renamed from "org invite"
- Can create multiple per organization
- Adds users as members (not owners)

### Details Column:

**For org_owner codes:**
```
Owner of: Research Lab
```

**For org_member codes:**
```
Member of: Marketing Team
```

**For individual codes:**
```
-
```

---

## Color Scheme

### Buttons:
- **Create Organization:** Green (#059669)
  - Hover: Darker green (#047857)
- **Create Code:** Blue (#2563eb)
  - Hover: Darker blue (#1d4ed8)

### Badges:
- **Used Status:** Green bg (#d1fae5), Green text (#065f46)
- **Pending Status:** Amber bg (#fef3c7), Amber text (#92400e)
- **Individual Type:** Gray bg (#f3f4f6), Gray text (#374151)
- **Org Owner Type:** Blue bg (#dbeafe), Blue text (#1e40af)
- **Org Member Type:** Green bg (#d1fae5), Green text (#065f46)

### Modals:
- **Success Header:** Green text (#059669)
- **Warning Box:** Amber bg (#fef3c7), Amber border (#fde68a), Amber text (#92400e)
- **Info Box:** Blue bg (#dbeafe), Blue border (#bfdbfe), Blue text (#1e3a8a)

---

## User Flow Diagram

```
Super Admin
    │
    ├─> Clicks "+ Create Organization"
    │       │
    │       ├─> Fills in org name
    │       ├─> (Optional) Fills in description
    │       └─> Clicks "Create Organization"
    │               │
    │               ├─> [API Call] POST /api/admin/organizations
    │               │       │
    │               │       ├─> Creates organization
    │               │       ├─> Generates 8-char owner code
    │               │       └─> Inserts invitation_codes row
    │               │
    │               └─> Success modal appears
    │                       │
    │                       ├─> Shows owner code (e.g., "A3BK7X9M")
    │                       ├─> Admin copies code
    │                       └─> Clicks "Done"
    │                               │
    │                               └─> Orgs table refreshes
    │                                       │
    │                                       └─> New org shows "Pending"
    │
    ├─> Shares owner code with org owner
    │       │
    │       └─> Owner registers using code
    │               │
    │               ├─> Becomes user with role='owner'
    │               └─> Org status changes to "Used"
    │
    └─> Creates member codes for the org
            │
            └─> Members join as role='member'
```

---

## Responsive Behavior

### Desktop (> 768px):
- Full table layout
- Side-by-side header with button
- All columns visible

### Tablet (640px - 768px):
- Table scrolls horizontally if needed
- Header stacks vertically
- Button moves below title

### Mobile (< 640px):
- Consider card layout for orgs (future improvement)
- Table may scroll horizontally
- Modal takes full width with padding

---

## Accessibility

- ✅ All inputs have labels
- ✅ Required fields marked with asterisk
- ✅ Color is not the only indicator (text + icons)
- ✅ Modals can be closed with X button
- ✅ Buttons have hover states
- ✅ Loading states show "Creating..." text
- ✅ Error messages are descriptive

---

## Empty States

### Organizations Table (No Orgs):
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  No organizations yet. Create one to get        │
│  started.                                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Organization Dropdown (No Orgs):
```
┌─────────────────────────────────────────────────┐
│  Organization *                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Select organization...              ▼ │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ⚠️ No organizations available. Create an       │
│     organization first.                         │
└─────────────────────────────────────────────────┘
```

---

This UI reference provides a complete visual guide for the organization creation feature implemented in Agent 4.
