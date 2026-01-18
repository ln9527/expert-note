# Login Screen - Expert Note

## Screenshot Title
**Expert Note Login Interface**

## Overview
This screenshot displays the Expert Note login page, which is the first access point for existing users to authenticate into the system. The page features a clean, centered form design on a light gray background with a white card container.

## Page Layout
- **Title**: "Expert Note" displayed prominently at the top
- **Subtitle**: "Sign in to continue" - provides clear context for the page purpose
- **Form Container**: White card with rounded corners and subtle shadow, centered on the page
- **Background**: Light gray (neutral, distraction-free)

## Annotated Elements

### 1. Username Field (Annotation #1 - Orange Circle)
- **Label**: "Username"
- **Type**: Text input field
- **Placeholder Text**: "Enter username"
- **Required**: Yes
- **Purpose**: User enters their registered username to identify their account
- **Validation**: Must match a registered username in the system

### 2. Password Field (Annotation #2 - Orange Circle)
- **Label**: "Password"
- **Type**: Password input field (masked characters)
- **Placeholder Text**: "Enter password"
- **Required**: Yes
- **Purpose**: User enters their account password for authentication
- **Validation**: Must match the password associated with the username
- **Security Note**: Characters are masked for security

### 3. Sign In Button (Annotation #3 - Orange Circle)
- **Label**: "Sign In"
- **Type**: Primary action button
- **Styling**: Solid blue background (#0052CC or similar), white text, full width
- **Purpose**: Submits the login form to authenticate the user
- **Behavior**:
  - Disabled state if form is incomplete
  - Shows loading state during authentication
  - Navigates to dashboard on successful login
  - Displays error message on failed authentication

### 4. Register Link (Annotation #4 - Orange Circle)
- **Text**: "Don't have an account? Register with invitation code"
- **Type**: Hyperlink (blue text)
- **Location**: Below the Sign In button
- **Purpose**: Directs new users to the registration page
- **Navigation**: Links to https://spansurvey.net/annote/register

## Step-by-Step Login Instructions

### For New Users
1. If you don't have an account, click the "Register with invitation code" link
2. Follow the registration process to create your account
3. Return to the login page once registration is complete

### For Existing Users
1. **Enter Username**: Click the username field and enter your registered username
2. **Enter Password**: Click the password field and enter your account password
3. **Sign In**: Click the blue "Sign In" button
4. **Wait for Authentication**: The system validates your credentials
5. **Success**: Upon successful login, you'll be redirected to the main dashboard

## Error Handling
- **Invalid Credentials**: If username/password is incorrect, error message displays
- **Missing Fields**: If either field is empty, the button remains disabled
- **Account Status**:
  - Disabled accounts show specific error message
  - Soft-deleted accounts cannot login
  - Super admin accounts can always login

## Keyboard Shortcuts
- **Tab**: Move between form fields (Username → Password → Sign In button)
- **Enter**: Submit the form (when focus is in password field or button)

## Accessibility Features
- Form fields have clear labels
- Error messages announce via screen readers
- Sufficient color contrast for readability
- Focus states clearly visible for keyboard navigation
- Password field masked for security but can be toggled with proper accessibility settings

## Visual Annotation Guide for Screenshots
When adding annotations to screenshots:
- **Orange Circles (#FF6B35)**: Mark numbered callouts (1, 2, 3, 4)
- **Circle Radius**: Extends ~10px beyond the element boundary
- **Number Position**: Placed to the upper-left of the element
- **Arrow Style**: Thin line connecting number to element
- **Text Labels**: Clear, concise descriptions of each numbered element

## Related Pages
- [Registration Screen](./02-registration.md)
- [Dashboard](./03-dashboard.md)
- [Getting Started Guide](../01-getting-started.md)

## Notes for Users
- Login credentials are case-sensitive
- Session expires after 30 minutes of inactivity
- Password must be at least 8 characters long (set during registration)
- If you forget your password, contact your organization administrator
