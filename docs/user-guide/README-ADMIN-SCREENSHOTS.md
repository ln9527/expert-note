# Admin Screenshots - Quick Start

## 🎯 Goal
Capture 4 admin/settings screenshots as PNG files with orange annotations.

## 📁 Required Files
```
screenshots/images/
├── 08-admin-organizations.png
├── 09-invitation-codes.png
├── 10-user-management.png
└── 11-tag-management.png
```

## ⚡ Quickest Method (5 minutes)

### Step 1: Open the Annotator Tool

```bash
cd /Users/ningli/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/docs/user-guide

# Option A: Direct open
open -a "Google Chrome" screenshot-annotator.html

# Option B: Via local server
python3 -m http.server 8080
# Then visit: http://localhost:8080/screenshot-annotator.html
```

### Step 2: Login to Admin Panel

1. Open: https://spansurvey.net/annote/login
2. Login with:
   - Username: `admin`
   - Password: `password123`

### Step 3: Capture Each Screenshot

For each of the 4 pages:

#### **Screenshot 08: Admin Organizations**
1. Navigate to: https://spansurvey.net/annote/settings/admin
2. Take screenshot (Cmd+Shift+4, then drag)
3. In annotator tool:
   - Click "08 - Admin Organizations" preset button
   - Click "Choose File" and upload your screenshot
   - Annotations appear automatically
   - Click "Download PNG"
   - Save as: `08-admin-organizations.png`

#### **Screenshot 09: Invitation Codes**
1. Same URL: https://spansurvey.net/annote/settings/admin
2. Scroll down to "Invitation Codes" section
3. Take screenshot
4. In annotator:
   - Click "09 - Invitation Codes" preset
   - Upload screenshot
   - Download as: `09-invitation-codes.png`

#### **Screenshot 10: User Management**
1. Navigate to: https://spansurvey.net/annote/settings/admin/users
2. Take screenshot
3. In annotator:
   - Click "10 - User Management" preset
   - Upload screenshot
   - Download as: `10-user-management.png`

#### **Screenshot 11: Tag Management**
1. Navigate to: https://spansurvey.net/annote/settings/tags
2. Take screenshot
3. In annotator:
   - Click "11 - Tag Management" preset
   - Upload screenshot
   - Download as: `11-tag-management.png`

### Step 4: Move Files

```bash
mv ~/Downloads/08-admin-organizations.png screenshots/images/
mv ~/Downloads/09-invitation-codes.png screenshots/images/
mv ~/Downloads/10-user-management.png screenshots/images/
mv ~/Downloads/11-tag-management.png screenshots/images/
```

### Step 5: Verify

```bash
ls -lh screenshots/images/{08,09,10,11}*.png
```

You should see all 4 files with reasonable sizes (~60-130 KB each).

## 📚 Documentation

- **ADMIN-SCREENSHOTS-GUIDE.md** - Complete specifications with coordinates
- **CAPTURE-STATUS.md** - Detailed status report and alternatives
- **screenshot-annotator.html** - Interactive annotation tool

## 🔧 Alternative: Automated Capture

If you can fix the npm permissions:

```bash
# Fix npm (requires sudo)
sudo chown -R 501:20 "/Users/ningli/.npm"

# Install puppeteer
cd /Users/ningli/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/docs/user-guide
npm install puppeteer

# Run automated capture
node capture-admin-pages.js
```

This will automatically login, navigate to each page, add annotations, and save all 4 PNGs.

## ✅ Success Criteria

- [  ] 4 PNG files in `screenshots/images/`
- [ ] Correct filenames (08, 09, 10, 11)
- [ ] Orange annotations visible
- [ ] All labels readable
- [ ] File sizes < 200 KB each

---

**Estimated Time:** 5-10 minutes (manual) or 2 minutes (automated)
**Status:** Tools ready, manual capture recommended due to system permissions
