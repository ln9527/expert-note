# Organization Owner Features

This guide covers the features available to organization owners in Expert Note. As an owner, you can create and annotate documents, extract knowledge, share content with your team, manage members, and create invitation codes.

---

## Table of Contents

1. [Creating Documents](#creating-documents)
2. [Annotating Documents](#annotating-documents)
3. [Extracting Knowledge](#extracting-knowledge)
4. [Sharing Content](#sharing-content)
5. [Managing Members](#managing-members)
6. [Creating Invitation Codes](#creating-invitation-codes)

---

## Creating Documents

### Single Document

To create a new document:

1. Click **"New Document"** from the dashboard
2. Enter a **Document Title** (required)
3. Optionally select or create **Tags** to categorize your document
4. Choose one of the following methods to add content:
   - **Type directly**: Enter markdown content in the text area
   - **Upload a file**: Click the upload zone to select a file

**Supported file formats:**
- `.md` (Markdown) - loaded directly
- `.txt` (Plain text) - loaded directly
- `.pdf` (PDF document) - automatically converted to markdown
- `.docx` (Word document) - automatically converted to markdown

5. Click **"Create Document"** to save

**Tip:** When uploading PDF or DOCX files, the system converts them to markdown and populates the form. You can edit the title, tags, and content before saving.

### Bulk Upload

To upload multiple documents at once:

1. Click **"New Document"** from the dashboard
2. Click the **"Bulk Upload"** tab at the top
3. Drag and drop a folder or multiple files into the upload zone
   - Or click to browse and select files
4. Review the list of files to be uploaded
   - Remove any unwanted files by clicking the X icon
5. Click **"Upload X Files"** to process all documents

**Limits:**
- Maximum 100 files per batch
- Supported formats: `.md`, `.txt`, `.pdf`, `.docx`

After upload completes, you will see a summary showing successful uploads and any errors.

---

## Annotating Documents

Annotations are the core of Expert Note. They capture your expert insights at three levels of abstraction.

### Annotation Levels

| Level | Color | Shortcut | Purpose |
|-------|-------|----------|---------|
| **MACRO** | Red | Cmd+1 | High-level themes, overarching arguments, strategic principles |
| **MESO** | Yellow | Cmd+2 | Supporting ideas, evidence, section-level patterns |
| **MICRO** | Green | Cmd+3 | Specific details, exact wording, granular techniques |

### How to Annotate

1. Open a document from the dashboard
2. Place your cursor where you want to add an annotation
3. Add an annotation using one of these methods:
   - **Click the toolbar button** for MACRO, MESO, or MICRO
   - **Use keyboard shortcuts**: Cmd+1 (MACRO), Cmd+2 (MESO), Cmd+3 (MICRO)
4. In the modal that appears, enter your annotation text
5. Click **"Add Annotation"** to insert it

**Annotation format in the document:**
```
[[MACRO: Your high-level insight here]]
[[MESO: Your supporting idea here]]
[[MICRO: Your specific detail here]]
```

### Viewing Annotation Counts

The right sidebar shows your annotation statistics:
- Total count for each level (MACRO, MESO, MICRO)
- Document status (draft, annotated, processed)

### Keyboard Shortcuts Reference

| Action | Shortcut |
|--------|----------|
| Add MACRO annotation | Cmd+1 |
| Add MESO annotation | Cmd+2 |
| Add MICRO annotation | Cmd+3 |
| Save document | Cmd+S |
| Switch document | Cmd+K |

---

## Extracting Knowledge

Once you have annotated a document, you can extract structured knowledge entries from your annotations using AI.

### Steps to Extract Knowledge

1. Open an annotated document
2. In the right sidebar, locate the **Actions** section
3. Select an **Extraction Guide** from the dropdown
   - The default guide works for most cases
   - Specialized guides may be available for specific domains
4. Click **"Extract Knowledge"**
5. (Optional) In the modal, add **Custom Instructions** to guide the AI
   - Example: "Focus on generalizing principles for academic writing"
   - Example: "Preserve domain-specific terminology"
6. Click **"Extract"** to begin processing

### What Happens During Extraction

The AI analyzes each annotation in your document and creates knowledge entries that include:
- **Background/Context**: The surrounding text and situation
- **Refined Content**: A generalized, reusable version of your insight
- **Annotation Level**: Preserved from the original (MACRO, MESO, or MICRO)
- **Tags**: Inherited from the source document

After extraction completes, you will see a confirmation showing how many knowledge entries were created. You can view and edit these entries from the Knowledge page.

---

## Sharing Content

Share your documents and knowledge entries with other members of your organization.

### Sharing a Document

1. Open the document you want to share
2. Look for the **sharing toggle** in the document settings
3. Enable sharing by toggling it **ON**
4. Configure edit permissions:
   - **Read-only**: Members can view but not edit
   - **Allow edits**: Members can view and modify the content

### Important Notes About Sharing

- Only the document **owner** (creator) can toggle sharing on/off
- Shared content is visible **only to members of your organization**
- When viewing a shared document you did not create, you will see a banner indicating it is "View only" with the owner's name
- Knowledge entries extracted from shared documents can also be shared

### Who Can See Shared Content?

- All members in your organization can view shared documents
- If "Allow edits" is enabled, members can also modify the content
- Only the owner can delete the document

---

## Managing Members

Organization owners can manage the members of their organization from the Settings page.

### Accessing Member Management

1. Click your profile or navigate to **Settings**
2. Select **"Members"** from the settings menu

### Viewing Members

The Members page displays all organization members in a table with:
- Username
- Display name
- Email
- Account status (Active/Disabled)
- Creation date

Use the search bar to find members by username, display name, or email.

### Resetting a Member's Password

If a member forgets their password:

1. Find the member in the table
2. Click the **"Reset Password"** action button
3. Confirm the action when prompted
4. A modal will display the **temporary password**
   - This password is shown only once
   - Share it securely with the member
5. The member must use this temporary password to log in and should change it afterward

### Enabling/Disabling Member Accounts

To disable a member's access:

1. Find the member in the table
2. Click **"Disable"** in the actions column
3. Confirm the action

Disabled members cannot log in until re-enabled. To re-enable:

1. Find the disabled member
2. Click **"Enable"**
3. The member can now log in again

### Removing Members

To remove a member from your organization:

1. Find the member in the table
2. Click **"Delete"** in the actions column
3. Confirm the deletion

**Note:** This is a soft delete - the user's data is preserved but they can no longer access the organization.

---

## Creating Invitation Codes

Invitation codes allow new users to register and automatically join your organization.

### Accessing Invitation Management

1. Navigate to **Settings**
2. Select **"Invitations"** from the menu

### Creating a New Invitation Code

1. Click the **"Create Member Code"** button
2. Set the **Usage Limit**:
   - Enter a number (e.g., `1` for single-use, `5` for five uses)
   - Enter `0` for unlimited uses
3. Click **"Create Code"**

The new code will appear in your codes table.

### Managing Invitation Codes

The codes table shows:

| Column | Description |
|--------|-------------|
| **Code** | The invitation code string |
| **Type** | Badge showing "Owner" (blue) or "Member" (green) |
| **Usage** | Current uses / Maximum uses (e.g., "2/5" or "3/infinite") |
| **Created** | Date the code was created |
| **Actions** | Delete button (only for unused codes) |

### Copying and Sharing Codes

1. Find an available code in the table
2. Click the **copy icon** next to the code
3. Share the code with the person you want to invite

### Deleting Unused Codes

You can only delete codes that have never been used:

1. Find an unused code (0 uses)
2. Click **"Delete"** in the actions column
3. Confirm the deletion

### How New Members Use Invitation Codes

1. Share the code with the new member
2. They visit the registration page
3. They enter the invitation code during registration
4. Upon successful registration, they automatically join your organization as a member

### Filter Options

Use the checkbox to show or hide fully used codes:
- **Show fully used codes**: See all codes including exhausted ones
- **Hide fully used codes**: Only show codes that can still be used

---

## Summary

As an organization owner, you have full control over:

| Feature | What You Can Do |
|---------|-----------------|
| **Documents** | Create, edit, annotate, share, and delete your documents |
| **Knowledge** | Extract, edit, and share knowledge entries |
| **Members** | View, reset passwords, enable/disable, and remove members |
| **Invitations** | Create and manage invitation codes for new members |

For additional help, consult the other sections of this user guide or contact your system administrator.
