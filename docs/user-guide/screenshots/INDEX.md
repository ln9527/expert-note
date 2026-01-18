# Complete User Guide Screenshots

This directory contains annotated screenshots and documentation for all Expert Note pages, including admin, settings, and member features.

---

## Screenshot Documentation

### Core Application Pages (Member Views)

| # | Page | File | Purpose |
|---|------|------|---------|
| 12 | **Knowledge Base View** | [12-knowledge-base.md](./12-knowledge-base.md) | Browse, search, and filter captured knowledge entries |
| 13 | **Prompts / Generation Guides** | [13-prompts.md](./13-prompts.md) | Create and manage AI-powered generation guides |

### Common Features (Available to All Users)

| # | Page | File | Purpose |
|---|------|------|---------|
| 14 | **Trash / Recovery** | [14-trash.md](./14-trash.md) | Recover or permanently delete soft-deleted items |
| 15 | **Account Settings** | [15-account-settings.md](./15-account-settings.md) | Manage profile and password settings |

### Admin & Settings Pages

| # | Page | File | Purpose |
|---|------|------|---------|
| 08 | **Admin Organizations** | [08-admin-organizations.md](./08-admin-organizations.md) | Manage organizations and auto-generated owner codes |
| 09 | **Invitation Codes** | [09-invitation-codes.md](./09-invitation-codes.md) | Create and manage user registration codes |
| 10 | **User Management** | [10-user-management.md](./10-user-management.md) | Manage users, reset passwords, enable/disable accounts |
| 11 | **Tag Management** | [11-tag-management.md](./11-tag-management.md) | Create and manage tags with color-coding and ownership |

---

## Quick Access by Role

### Super Administrators
- [User Management (10)](./10-user-management.md): Full user control
- [Admin Organizations (08)](./08-admin-organizations.md): Organization management
- [Invitation Codes (09)](./09-invitation-codes.md): Code generation and tracking
- [Tag Management (11)](./11-tag-management.md): System-wide tag configuration

### Organization Owners & Members
- [Knowledge Base (12)](./12-knowledge-base.md): Browse and search captured knowledge
- [Prompts (13)](./13-prompts.md): Create and manage generation guides
- [Tag Management (11)](./11-tag-management.md): Organization tags
- [Trash (14)](./14-trash.md): Recover deleted items
- [Account Settings (15)](./15-account-settings.md): Personal preferences

### All Users
- [Knowledge Base (12)](./12-knowledge-base.md): Core knowledge management
- [Prompts (13)](./13-prompts.md): Generation guide templates
- [Trash (14)](./14-trash.md): Recovery and cleanup
- [Account Settings (15)](./15-account-settings.md): Profile and password management

---

## Page Navigation Structure

```
Settings (Main Menu)
├── User Settings (Non-Admin)
│   ├── Generation Guides
│   ├── Tag Management
│   ├── ORGANIZATION
│   │   ├── Members
│   │   └── Invitations
│   └── Account Settings
│
└── Admin Settings (Super Admin Only)
    ├── Generation Guides
    ├── Tag Management
    ├── ADMIN
    │   ├── User Management        ← [Document 10]
    │   ├── Invitation Codes       ← [Document 09]
    │   └── Trash
    ├── Account Settings
    └── Organizations              ← [Documents 08 & 09]
```

---

## Feature Summary

### Organization Management (Document 08)
- Create organizations
- Auto-generate owner invitation codes
- View organization member counts
- Track invitation code usage
- Manage organization lifecycle

### Invitation Codes (Document 09)
- Create owner and member registration codes
- Set usage limits (unlimited, single-use, multi-use)
- Filter codes by type and status
- Copy codes for sharing
- Track code usage
- Delete unused codes

### User Management (Document 10)
- View all system users
- Search by username or display name
- Filter by role (super_admin, owner, member, individual)
- Filter by status (active, inactive, deleted)
- Reset user passwords
- Enable/disable user accounts
- Soft-delete users
- View user statistics (total, by role, active count)

### Tag Management (Document 11)
- Create tags with custom colors
- Edit tag properties (name, color, description)
- Delete tags (with soft delete for recovery)
- View tag ownership badges (System, Yours, Shared)
- Filter and organize tags
- Use tags across documents, knowledge entries, and prompts

---

## Common Admin Tasks

### Onboard New Organization
1. Go to Admin Organizations (Doc 08)
2. Click "Create Organization"
3. Get auto-generated owner code
4. Share code with designated owner
5. Owner registers using code

### Create Member Registration Code
1. Go to Invitation Codes section (Doc 09)
2. Click "Create Code"
3. Select organization
4. Choose "org member" type
5. Set usage limit (or leave unlimited)
6. Share code with members

### Reset User Password
1. Go to User Management (Doc 10)
2. Find user in table
3. Click "Reset Password"
4. Copy temporary password from modal
5. Share with user securely
6. User changes password on login

### Setup Organization Tags
1. Go to Tag Management (Doc 11)
2. Create tags for org workflow
3. Assign distinct colors for clarity
4. Share tag guide with team
5. Team uses tags for content organization

---

## Annotation Key

Each screenshot includes visual annotations with orange boxes and labels:

- **Numbered boxes (1-6)**: Key UI components
- **Orange outlines**: Interactive elements and sections
- **Labels above boxes**: Feature names and purposes
- **Color coding**: Standard UI patterns (blue=actions, green=success, red=delete)

---

## Glossary

| Term | Definition |
|------|-----------|
| **Organization** | Team workspace with members and shared resources |
| **Owner Code** | Single-use invitation code that grants org ownership |
| **Member Code** | Registration code for standard organization members |
| **Super Admin** | System administrator with full access |
| **Soft Delete** | Non-permanent deletion; data preserved, recoverable |
| **Status Filter** | Active/Inactive/Deleted user states |
| **Tag Ownership** | System/Yours/Shared badge indicating tag creator |
| **Usage Limit** | How many times an invitation code can be used |

---

## Related Documentation

- [HANDOFF.md](../../HANDOFF.md): System overview
- [RECENT_WORK_2026-01.md](../../RECENT_WORK_2026-01.md): Recent changes
- [docs/INDEX.md](../INDEX.md): Full documentation index
- [DEPLOYMENT.md](../../DEPLOYMENT.md): Production deployment

---

## Notes for Developers

- Screenshots capture default state (no errors, standard data)
- Annotations use browser DevTools overlay technique
- Color picker accessible from tag color circles
- Modals documented in individual files
- API endpoints documented in each feature section
- Responsive design adapts to mobile/tablet/desktop

---

**Last Updated:** 2026-01-15

**Created by:** Claude Code (Sessions 3-4)

**Annotated Screenshots:** 08-admin-organizations, 09-invitation-codes, 10-user-management, 11-tag-management, 12-knowledge-base, 13-prompts, 14-trash, 15-account-settings
