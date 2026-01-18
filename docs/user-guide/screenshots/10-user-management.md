# User Management Page

## Overview

The **User Management** page is an administrative interface for managing all users across the system. Only super administrators can access this page and perform actions like resetting passwords, enabling/disabling users, and soft-deleting accounts.

**Access:** Settings > Admin > User Management

**Required Role:** super_admin

---

## Key Features

### 1. Statistics Cards

**Location:** Below page header, displaying 6 key metrics

**Metrics Displayed:**

| Metric | Color | Purpose |
|--------|-------|---------|
| **Total Orgs** | Gray | Total number of organizations in system |
| **Total Users** | Gray | All users across all organizations |
| **Active Users** | Green | Users with active status (isActive=true) |
| **Super Admins** | Purple | Users with super_admin role |
| **Owners** | Blue | Users with owner role (org owners) |
| **Members** | Gray | Users with member role |

**Updates:**
- Stats refresh automatically after user actions (password reset, status change, delete)
- Real-time count of active/inactive users
- Role distribution visible at a glance

---

### 2. Search Bar

**Location:** Left side of filter section

**Features:**
- Real-time search as you type
- Search fields:
  - Username (exact or partial match)
  - Display name (if stored)
- Case-insensitive search
- Placeholder text: "Search by username or display name..."

**Example Searches:**
- `admin` → finds all users with "admin" in username
- `john` → finds users named "john"
- `@` → finds any user (if using email-based usernames)

---

### 3. Role Filter Dropdown

**Location:** Middle of filter section, labeled "Role:"

**Options:**
- **All Roles** (default): Shows all users regardless of role
- **Super Admin**: System administrators with full access
- **Owner**: Organization owners with org-level admin privileges
- **Member**: Standard members with basic access
- **Individual**: Single-user accounts (non-org affiliated)

**Behavior:**
- Single-select dropdown
- Changes apply immediately
- Updates table to show only matching roles

---

### 4. Status Filter Dropdown

**Location:** Right side of filter section, labeled "Status:"

**Options:**
- **All**: Shows all users regardless of status
- **Active**: Users with active status (can log in)
- **Inactive**: Disabled users (cannot log in)
- **Deleted**: Soft-deleted users (recoverable)

**Status Logic:**
- **Active**: isActive=true, can authenticate
- **Inactive**: isActive=false, login blocked
- **Deleted**: deletedAt is not null, not shown by default
- Check "Deleted" filter to see soft-deleted users

---

### 5. User Management Table

**Location:** Below filters, spanning full width

**Table Columns:**

| Column | Data | Sortable | Purpose |
|--------|------|----------|---------|
| **USERNAME** | Unique login name | Yes | Primary user identifier |
| **DISPLAY NAME** | Full name or nickname | No | User's display name |
| **ROLE** | super_admin / owner / member / individual | No | User's role and permissions |
| **ORGANIZATION** | Organization name | No | Which org user belongs to |
| **CREATED** | Date created | Yes | Account creation timestamp |
| **STATUS** | Active / Inactive / Deleted | No | Current user status |
| **ACTIONS** | Buttons | N/A | Reset Password / Toggle Status / Delete |

**Sorting:**
- Click column header to sort (username, created date)
- Click again to reverse sort direction
- Sort indicator shows direction (arrow up/down)

---

### 6. Reset Password Button

**Location:** Actions column, per user row

**Purpose:** Generate temporary password for user login

**Workflow:**
1. Click "Reset Password" button for user
2. Confirmation dialog appears: "Are you sure you want to reset the password for 'username'?"
3. Click Confirm
4. Temporary password modal displays with:
   - Username
   - One-time temporary password
   - Copy button
   - Message: "Share this password with the user. They must change it on first login."
5. User uses temp password to log in
6. System forces password change on login

**Security Notes:**
- Temporary password shown only once
- Cannot be retrieved after modal closes
- Share securely (email, message, not chat logs)
- User must change password on first login

---

### 7. Enable/Disable Toggle (Status Toggle)

**Location:** Actions column, per user row (button text varies)

**Display:**
- **Active users** show "Disable" button
- **Inactive users** show "Enable" button

**Workflow:**
1. Click "Disable" or "Enable" button
2. Confirmation dialog: "Are you sure you want to disable/enable 'username'?"
3. Click Confirm
4. User status updates immediately
5. Disabled users cannot log in
6. Stats automatically refresh

**Effects of Disabling:**
- User cannot authenticate
- Sessions may be revoked
- Previous roles/permissions preserved
- Can be re-enabled later
- Useful for temporary access suspension

---

### 8. Delete User Button

**Location:** Actions column, per user row

**Purpose:** Soft-delete user (recoverable)

**Workflow:**
1. Click "Delete" button (red text)
2. Confirmation dialog: "Are you sure you want to delete 'username'? This action cannot be undone."
3. Click Confirm
4. User soft-deleted:
   - deletedAt timestamp set
   - User hidden from active list
   - Can be recovered via Trash
   - User data preserved in database

**Soft Delete Behavior:**
- Not truly deleted (data preserved)
- User filtered out of normal views
- Shown only when "Status: Deleted" selected
- Can be recovered from Trash for 30 days
- Message says "cannot be undone" but actually recoverable

**User Data Preserved:**
- All documents owned by user remain
- All knowledge entries remain
- All prompts remain
- Associated permissions remain

---

## Filter Combinations

### Examples of Common Filters

**Find all org owners in a specific org:**
1. Role filter: Select "Owner"
2. Status filter: Select "Active"
3. Organization: (if per-org filter available)
4. Search: (leave empty or enter org name)

**Find disabled accounts:**
1. Status filter: Select "Inactive"
2. Role filter: Leave as "All Roles"
3. View all users currently disabled

**Search for recent admin:**
1. Role filter: Select "Super Admin"
2. Sort: Click "Created" column (descending)
3. Top results are newest admins

**Audit deleted users:**
1. Status filter: Select "Deleted"
2. Created sort: Click to see deletion order
3. Review soft-deleted accounts for recovery

---

## Admin Workflows

### Onboarding New User
1. User registers or is invited
2. Admin views User Management
3. Locate user in list
4. Status should show "Active"
5. Share organization details

### Resetting Forgotten Password
1. User requests password reset
2. Admin opens User Management
3. Search for user by username
4. Click "Reset Password"
5. Copy temporary password from modal
6. Share temp password securely
7. User logs in and changes password

### Disabling Former Employee
1. Admin opens User Management
2. Search for user name
3. Click "Disable" button
4. Confirm action
5. User status changes to "Inactive"
6. User cannot log in
7. Account can be re-enabled later if needed

### Auditing Role Distribution
1. Open User Management page
2. Review statistics cards:
   - Check Super Admins count
   - Check Owners vs Members balance
3. Use role filter to drill down
4. Verify role assignments are appropriate

### Cleaning Up Test Accounts
1. Admin opens User Management
2. Click Status filter: "Active"
3. Search for test account pattern (e.g., "test_")
4. Click "Disable" for test accounts first
5. Later, click "Delete" to soft-delete
6. Can recover from Trash if needed

---

## Permissions and Access

### Super Admin Only
- View all users
- Reset any user's password
- Enable/disable any user
- Delete any user
- View user statistics
- Filter and search across entire system

### Cannot Be Modified
- Own account status (cannot disable yourself)
- Other super_admin accounts (without special confirmation)
- System audit trail

---

## User Table Details

### Table Features
- **Pagination**: Shows limited users per page, navigate with buttons
- **Empty State**: "No users found" message when filters match no users
- **Loading**: Spinner appears while data loads
- **Error Messages**: Red banner if actions fail
- **Responsive**: Table adapts to screen size
- **Sortable Headers**: Click to sort by that column

### Status Indicators
- **Green checkmark** or "Active": User can log in
- **Gray X** or "Inactive": User cannot log in
- **Trash icon** or "Deleted": User soft-deleted, recoverable

---

## Technical Details

### Data Loaded
- All users from database with roles and organizations
- Filtered by search term, role, and status
- Sorted by selected column and direction
- Includes created date, org affiliation, current status

### API Endpoints Used
- `GET /api/admin/users/stats`: Load statistics
- `GET /api/admin/users?search=&role=&status=`: Fetch filtered users
- `PATCH /api/admin/users/{userId}/password`: Reset password
- `PATCH /api/admin/users/{userId}/status`: Toggle enable/disable
- `DELETE /api/admin/users/{userId}`: Soft-delete user

### Real-Time Updates
- Stats refresh after any user action
- Table updates immediately
- No page reload needed
- Action loading indicators show pending operations

---

## Troubleshooting

**Cannot find user:**
- Check spelling in search
- Try partial name/username
- Try different status filter (user might be inactive/deleted)
- Try "All Roles" if role filter is too specific

**Reset password modal won't appear:**
- Click "Reset Password" again
- Check browser console for errors
- Refresh page and try again
- Try with different user first

**Actions disabled/grayed out:**
- May indicate loading (spinning icon shows)
- May indicate insufficient permissions (not super_admin)
- Try refreshing page
- Check network connection

**Status doesn't change:**
- Click button again (may need double-click)
- Check for error message below filters
- Refresh page to see updated status
- Check if user is super_admin (cannot disable self)

---

## Notes

- **Soft Delete**: All user deletions are soft deletes (recoverable via Trash)
- **Passwords**: Only admins can reset; users can self-reset if feature enabled
- **Status**: Disabling user is safer than deleting; data preserved
- **Audit Trail**: All admin actions logged (if audit logging enabled)
- **Performance**: Large user lists load paginated (20-50 users per page)

---

**Last Updated:** 2026-01-15
