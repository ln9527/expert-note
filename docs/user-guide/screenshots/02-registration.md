# Registration Screen - Expert Note

## Screenshot Title
**Expert Note Registration Form**

## Overview
This screenshot displays the Expert Note registration page, which allows new users to create an account. The page features a comprehensive form with both required and optional fields, designed to capture essential user information while minimizing friction.

## Page Layout
- **Main Title**: "Expert Note" displayed at the top
- **Subtitle**: "Create your account" - indicates purpose
- **Helper Text**: "Enter your invitation code to register"
- **Form Container**: White card on light gray background
- **Form Structure**: Vertical layout with all fields stacked for mobile responsiveness

## Annotated Elements

### 1. Invitation Code Field (Annotation #1 - Orange Circle - REQUIRED)
- **Label**: "Invitation Code" (with red asterisk * indicating required)
- **Type**: Text input field
- **Placeholder Text**: "ENTER YOUR INVITATION CODE"
- **Required**: Yes (mandatory for registration)
- **Helper Text**: "Get your code from your organization admin or system administrator"
- **Purpose**: Validates that user has authorization to join the system
- **Validation**:
  - Must be a valid, unused invitation code
  - Code format: Alphanumeric (e.g., "Y9FTA765")
  - Shows error if code is already used or invalid
- **Security**: Invitation codes are one-time use or limited-use

### 2. Username Field (Annotation #2 - Orange Circle - REQUIRED)
- **Label**: "Username" (with red asterisk * indicating required)
- **Type**: Text input field
- **Placeholder Text**: "Choose a username"
- **Required**: Yes (mandatory for login)
- **Purpose**: Unique identifier used during login
- **Validation**:
  - Must be 3-32 characters long
  - Can contain letters, numbers, underscores, hyphens
  - Must be unique across the system
  - No spaces allowed
  - Shows error if username already taken
- **Constraints**: Case-insensitive for login purposes

### 3. Display Name Field (Annotation #3 - Teal Circle - OPTIONAL)
- **Label**: "Display Name" (no asterisk, indicating optional)
- **Type**: Text input field
- **Placeholder Text**: "How should we call you? (optional)"
- **Required**: No (can be filled later)
- **Purpose**: User's friendly name shown to other team members
- **Validation**:
  - Maximum 64 characters
  - Can include spaces and special characters
  - Defaults to username if left blank
- **Impact**: Used in UI to personalize the experience and shown to collaborators

### 4. Phone Number Field (Annotation #4 - Teal Circle - OPTIONAL)
- **Label**: "Phone Number" (with "(optional)" text)
- **Type**: Text input field
- **Placeholder Text**: "Your phone number"
- **Required**: No (can be skipped)
- **Purpose**: Contact information for account recovery
- **Validation**:
  - International format accepted
  - No strict format enforcement
  - Can be added/updated in settings later
- **Format Examples**: "+1-555-123-4567", "(555) 123-4567", "555-123-4567"

### 5. Email Field (Annotation #5 - Teal Circle - OPTIONAL)
- **Label**: "Email" (with "(optional)" text)
- **Type**: Email input field
- **Placeholder Text**: "your@email.com"
- **Required**: No (can be skipped)
- **Purpose**: Email address for notifications and account recovery
- **Validation**:
  - Must be valid email format if provided
  - Should be unique (recommended but not enforced)
  - Used for password reset and notifications
- **Notifications**: Once verified, can receive system notifications

### 6. Password Field (Annotation #6 - Orange Circle - REQUIRED)
- **Label**: "Password" (with red asterisk * indicating required)
- **Type**: Password input field (masked characters)
- **Placeholder Text**: "Create a password"
- **Required**: Yes (mandatory)
- **Helper Text**: "At least 8 characters"
- **Purpose**: Secure authentication credential
- **Validation Rules**:
  - Minimum 8 characters required
  - Recommended: Mix of uppercase, lowercase, numbers, special characters
  - No common passwords allowed
  - Cannot reuse previous passwords
- **Security Features**:
  - Characters masked during entry
  - Toggle visibility option available (eye icon)
  - Real-time strength indicator (often shown below field)

### 7. Confirm Password Field (Not shown in first view - scroll down)
- **Label**: "Confirm Password" (with red asterisk *)
- **Type**: Password input field (masked)
- **Placeholder Text**: "Confirm your password"
- **Required**: Yes
- **Purpose**: Verify password was entered correctly
- **Validation**: Must match the password field exactly
- **Error**: Shows error if passwords don't match

### 8. Create Account Button (Not shown in first view - scroll down)
- **Label**: "Create Account"
- **Type**: Primary action button
- **Styling**: Solid blue background, white text, full width
- **Purpose**: Submits the registration form
- **Behavior**:
  - Disabled if required fields are empty
  - Shows loading state during processing
  - Validates all fields before submission
  - Creates account and redirects to login on success

## Field Status Indicators

### Required Fields (Orange annotation circles)
- Invitation Code
- Username
- Password
- Confirm Password (below fold)

### Optional Fields (Teal annotation circles)
- Display Name
- Phone Number
- Email

### Visual Indicators
- Red asterisk (*) = Required field
- "(optional)" text = Optional field
- Helper text below field = Additional context or requirements

## Step-by-Step Registration Instructions

### Step 1: Obtain Invitation Code
- Contact your organization administrator
- Request an invitation code for registration
- Codes are typically provided via email

### Step 2: Navigate to Registration
- Click "Register with invitation code" from the login page
- Or navigate directly to https://spansurvey.net/annote/register

### Step 3: Fill Required Fields
1. **Invitation Code** (Required)
   - Copy and paste your invitation code
   - Verify no extra spaces are included
   - Code is case-insensitive

2. **Username** (Required)
   - Choose a unique, memorable username
   - Use 3-32 characters
   - Cannot contain spaces
   - Recommended: lowercase letters and numbers
   - Example: "john.smith" or "john_smith"

3. **Password** (Required)
   - Create a strong password (8+ characters)
   - Mix uppercase, lowercase, numbers, symbols
   - Avoid common words or personal information
   - Example: "MyP@ssw0rd2024"

### Step 4: Verify Password
- Enter the same password again to confirm
- Ensure both fields match exactly
- Case-sensitive

### Step 5: Add Optional Information (Recommended)
1. **Display Name**: Your full name or preferred name
2. **Email**: Your email address (for notifications)
3. **Phone**: Your contact number

### Step 6: Review and Submit
- Review all information for accuracy
- Click "Create Account" button
- Wait for account creation to complete

### Step 7: Login to Your Account
- You'll be redirected to login page
- Use your username and password to login
- You'll be directed to the main dashboard

## Password Requirements Summary
- Minimum 8 characters
- Recommended 12+ characters for security
- Include uppercase letters (A-Z)
- Include lowercase letters (a-z)
- Include numbers (0-9)
- Include special characters (!@#$%^&*)
- Avoid dictionary words
- Avoid repeating characters (aaa, 111)
- Avoid sequential characters (abc, 123)

## Common Registration Errors

### Invalid Invitation Code
- **Message**: "Invitation code is invalid or already used"
- **Solution**: Verify code from administrator, ensure no extra spaces

### Username Already Taken
- **Message**: "This username is already in use"
- **Solution**: Choose a different username

### Passwords Don't Match
- **Message**: "Passwords do not match"
- **Solution**: Re-enter both password fields carefully

### Weak Password
- **Message**: "Password does not meet security requirements"
- **Solution**: Use 8+ characters with mix of types

### Invalid Email Format
- **Message**: "Please enter a valid email address"
- **Solution**: Use proper email format (example@domain.com)

## Visual Annotation Guide for Screenshots

### Color Coding
- **Orange Circles (#FF6B35)**: Required fields (Invitation Code, Username, Password)
- **Teal Circles (#4ECDC4)**: Optional fields (Display Name, Phone, Email)
- **Numbers**: 1-6+ in circles, arranged by field order
- **Circle Radius**: ~10px beyond field boundary
- **Arrows**: Connect number to corresponding field

### Annotation Placement
- Number circles positioned to the upper-left of each field
- Thin connecting lines from number to field
- Clear spacing to avoid overlapping annotations
- Consistent color and styling throughout

## Best Practices for Registration

### Username Selection
- Use lowercase letters and numbers
- Avoid spaces and special characters
- Make it memorable but professional
- Consider future use in team collaborations

### Password Security
- Never share your password with anyone
- Don't reuse passwords from other sites
- Use a password manager to store securely
- Change password if compromised

### Email Best Practices
- Use your primary work email
- Ensure email is monitored regularly
- Verify email to receive notifications
- Keep email information current

## After Registration

### Immediate Next Steps
1. Login with your new username and password
2. Complete your profile (optional)
3. Join or create an organization
4. Set up your workspace
5. Invite team members

### Account Recovery
- If you forget password: Contact administrator (no self-serve reset)
- If account locked: Contact administrator
- If email needs update: Update in account settings

## Related Documentation
- [Login Instructions](./01-login.md)
- [Getting Started Guide](../01-getting-started.md)
- [Organization Setup](../02-owner-features.md)
- [Security Best Practices](../security-guidelines.md)

## Support Resources
- Organization Administrator: Your primary support contact
- System Administrator: For technical issues
- Help Documentation: Available in-app via ? icon
- FAQ: Check common questions in help section
