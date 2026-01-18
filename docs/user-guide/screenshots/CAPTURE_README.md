# Screenshot Capture Guide

This directory contains tools to capture annotated screenshots for the Expert Note user guide.

## Quick Start (Recommended)

### Option 1: Open HTML Files and Manual Screenshot

1. Open each HTML file in Chrome:
   - `capture-12-knowledge-base.html` → Save as `images/12-knowledge-base.png`
   - `capture-13-prompts.html` → Save as `images/13-prompts.png`
   - `capture-14-trash.html` → Save as `images/14-trash.png`
   - `capture-15-account-settings.html` → Save as `images/15-account-settings.png`

2. Wait for the page to load (iframe content + annotations)

3. Take screenshot:
   - **Method A** (macOS): Press `Cmd+Shift+4`, then `Space`, click the white container
   - **Method B** (Chrome DevTools): F12 → Cmd+Shift+P → type "screenshot" → "Capture node screenshot" → select container

4. Save with the suggested filename in `images/` folder

### Option 2: Use Existing Screenshots + Python Annotation

If you already have base screenshots saved:

```bash
python3 annotate_screenshots.py
```

This will add orange numbered annotations to existing images in the `images/` directory.

## Files in This Directory

- **generate_capture_pages.py** - Generates HTML pages with embedded site + annotations
- **capture-*.html** - Generated HTML files ready to screenshot
- **annotate_screenshots.py** - Adds annotations to existing screenshots
- **capture_with_selenium.py** - Automated capture (requires ChromeDriver)
- **CAPTURE_README.md** - This file

## Annotation Legend

### 12-knowledge-base.png
1. Search box
2. Tag filter
3. Table/Card view toggle
4. Statistics (entries/annotations count)

### 13-prompts.png
1. Generate button
2. Guide selector dropdown
3. Prompts table

### 14-trash.png
1. Category tabs (Documents/Knowledge/Prompts/Tags)
2. Deleted items list
3. Restore/Delete action buttons

### 15-account-settings.png
1. Display name field
2. Password change section

## Troubleshooting

**Issue**: iFrame not loading
- Solution: Make sure you're connected to the internet and can access https://spansurvey.net/annote

**Issue**: Annotations not visible
- Solution: Check that the HTML file loaded correctly. Annotations use orange (#ff6600) circles with white numbers.

**Issue**: Screenshot wrong size
- Solution: The container is exactly 1486x827px. Use Chrome DevTools to select the exact div.

## Technical Details

- **Page Size**: 1486x827 pixels
- **Annotation Color**: #ff6600 (orange)
- **Circle Size**: 30px diameter
- **Font**: System default (-apple-system, BlinkMacSystemFont, Arial)
- **z-index**: 999999 (ensures annotations appear on top)

## Regenerating HTML Files

If you need to update annotation positions or add new pages:

```bash
python3 generate_capture_pages.py
```

Edit the `PAGES` array in `generate_capture_pages.py` to modify configurations.
