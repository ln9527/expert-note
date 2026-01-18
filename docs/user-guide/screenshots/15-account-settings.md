# Account Settings

The Account Settings page allows you to manage your personal profile and security settings, including your display name and password.

## Overview

**Location:** Settings → Account Settings (accessible from the Settings menu)

The Account Settings page is where you manage personal account information and security. This is distinct from organizational settings - these changes only affect your individual account.

## Key Sections

### Profile Settings Section

#### Username
**Field:** Read-only text input showing "ning" (or your username)

The username is your unique account identifier used for login.

**Important Note:** "Username cannot be changed" - Your username is permanent and cannot be modified after account creation. If you need a different username, you'll need to contact an administrator.

#### Display Name Field (1)
**Field:** Editable text input

This is the name shown throughout the application to other users and in your profile. This is different from your login username.

**Usage:**
- Click the Display Name field
- Enter or modify your preferred display name
- The field accepts any text (names, initials, etc.)
- Helper text indicates: "This name will be shown throughout the application"
- Changes take effect after clicking "Save Changes"

**Examples:**
- Full legal name: "Ning Li"
- Casual name: "Ning"
- Professional name: "Dr. Ning Li, PhD"
- Initials: "NL"

### Save Changes Button (2)
**Location:** Below the Display Name field, blue primary button

Persists any changes you've made in the Profile Settings section.

**Usage:**
- Make edits to your Display Name
- Click "Save Changes" to persist the changes
- You'll see a confirmation message (typically a toast notification)
- The changes are immediately reflected throughout the application

**Note:** You must click this button to save. Simply typing text doesn't automatically save - you must explicitly submit the form.

## Change Password Section (3)

This section allows you to update your account password for security purposes.

### Current Password Field
**Field:** Password input (masked)

Enter your existing password to verify your identity before allowing a password change.

**Usage:**
- Click "Enter your current password"
- Type your current password
- Password is masked for security (dots/asterisks shown instead of actual characters)
- Required to proceed with password change

### New Password Field
**Field:** Password input (masked)

Enter your new password that you want to use going forward.

**Requirements:**
- Must be at least 8 characters long
- Helper text: "Must be at least 8 characters"
- Password is masked for security
- Should be strong (mix of uppercase, lowercase, numbers, symbols)

**Usage:**
- Click "Enter your new password"
- Type your desired new password
- Ensure it meets the minimum 8 character requirement
- Use a strong password combining different character types

### Confirm New Password Field
**Field:** Password input (masked)

Confirm your new password by entering it again. This prevents typos.

**Usage:**
- Re-enter your new password exactly as typed above
- Must match the "New Password" field exactly
- If they don't match, you'll see a validation error
- Both password fields must be completed and match

### Change Password Button
**Button:** Located below password fields

Submits the password change request.

**Usage:**
1. Fill in all three password fields
2. Ensure passwords meet requirements
3. Ensure new password confirmation matches
4. Click the submit button
5. You'll see confirmation (password changed successfully)
6. Your account is now secured with the new password

## Workflow Examples

### Changing Your Display Name

1. Navigate to **Settings** → **Account Settings**
2. Find the **Display Name** field (currently shows "Ning" or your current name)
3. Click the field to focus it
4. Clear the current text and enter your new display name
5. Click **"Save Changes"** button (blue button below)
6. See confirmation that changes were saved
7. Your new display name is now shown throughout the application

### Changing Your Password

1. Go to **Settings** → **Account Settings**
2. Scroll to **Change Password** section
3. Fill in **Current Password** field with your existing password
4. Enter your new password in **New Password** field (minimum 8 characters)
5. Re-enter the new password in **Confirm New Password** field
6. Click **"Change Password"** button
7. Confirm the change was successful
8. Log back in with your new password on next session (if needed)

## Important Security Information

### Password Security

- **Minimum length:** 8 characters
- **Best practice:** Use a mix of:
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special characters (!@#$%^&*)
- **Unique passwords:** Don't reuse passwords from other accounts
- **Frequency:** Change your password periodically (every 3-6 months)
- **After breach:** If you suspect your account is compromised, change immediately

### Username Security

- Your username cannot be changed
- It's visible to other users in your organization
- Don't share your password based on your username

### Display Name Visibility

- Your display name is visible to:
  - All members of your organization
  - Other organization members you collaborate with
  - In shared documents and comments
- Keep it professional or use your preference

## What You Cannot Change

- **Username:** Permanently set at account creation
- **Email:** Typically managed through admin panel (contact administrator)
- **Account creation date:** Fixed metadata
- **Organization assignment:** May require administrator to change

## Related Features

- **Settings Menu:** Access other settings pages
- **Organization Settings:** Manage org-level features (admin only)
- **User Management:** Admin panel for managing other users
- **Security:** Password policy information
- **Profile:** Your public profile information

## Tips and Best Practices

- **Strong passwords:** Use complex passwords combining character types
- **Regular updates:** Change password every 3-6 months
- **Memorable display name:** Use a name colleagues will recognize
- **Secure storage:** Use a password manager to store your password securely
- **Don't share credentials:** Never share your username/password with others
- **Enable MFA:** If available, enable multi-factor authentication
- **Verify URLs:** Always go to the correct domain before entering credentials
- **Update after breach:** If any service you use is breached, change your password

## Troubleshooting

### "Username cannot be changed"
This is expected behavior. Usernames are permanent and set by administrators. Contact your organization administrator if you need to change your username.

### "Passwords do not match"
The new password and confirmation password must be identical. Re-check your typing in both fields.

### "Password too short"
Passwords must be at least 8 characters. Add more characters to your password.

### "Current password incorrect"
You may have typed your current password incorrectly. Ensure Caps Lock is off and try again. If you've forgotten your password, contact your administrator.

### "Changes not saved"
Make sure you clicked the "Save Changes" button. Simply editing the field and moving away doesn't save - you must explicitly submit.

## Security Reminders

- This page is HTTPS encrypted - your data is secure in transit
- Never enter your password on unsecured (HTTP) sites
- Be cautious of phishing attempts - always verify the URL
- Your password is hashed and not stored in plain text
- Session timeout: You may be logged out after inactivity for security

## Session Management

- Changing your password doesn't immediately log you out
- Your current session remains active
- On next login (in a new browser/device), use your new password
- For security, consider logging out and logging back in after password change
