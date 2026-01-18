# Screenshot Capture - Final Solution

## Summary

I've created multiple tools to help capture annotated PNG screenshots for pages 12-15 of the user guide.

## Files Created

### Ready-to-Use HTML Pages
These files load the production site in an iframe with pre-positioned orange annotations:

1. **capture-12-knowledge-base.html** - Knowledge Base page
2. **capture-13-prompts.html** - Prompts page
3. **capture-14-trash.html** - Trash page
4. **capture-15-account-settings.html** - Account Settings page

### Python Scripts
- **generate_capture_pages.py** - Regenerate HTML capture pages
- **annotate_screenshots.py** - Add annotations to existing screenshots
- **capture_with_selenium.py** - Automated capture (requires ChromeDriver setup)

### Documentation
- **CAPTURE_README.md** - Detailed instructions
- **README_SCREENSHOTS.md** - This file

## Recommended Approach

### Method 1: Manual Screenshot (Easiest)

1. **Open HTML file** in any browser:
   ```bash
   open capture-12-knowledge-base.html
   ```

2. **Wait** for the iframe to load (shows production site + orange numbered circles)

3. **Screenshot the white container**:
   - macOS: `Cmd+Shift+4` → `Space` → Click window
   - Or use browser DevTools screenshot feature

4. **Save** as `images/12-knowledge-base.png`

5. **Repeat** for all 4 pages

### Method 2: Browser DevTools (Most Precise)

1. Open HTML file in Chrome
2. Right-click white container → "Inspect"
3. In DevTools, right-click the `.container` element → "Capture node screenshot"
4. Save with correct filename

### Method 3: Automated (Requires Setup)

If you have ChromeDriver installed:
```bash
python3 capture_with_selenium.py
```

## Expected Output

All files should be saved in `images/` directory:

- `12-knowledge-base.png` (1486x827px)
- `13-prompts.png` (1486x827px)
- `14-trash.png` (1486x827px)
- `15-account-settings.png` (1486x827px)

## Annotation Details

All annotations use:
- **Color**: #ff6600 (orange)
- **Shape**: 30px circles
- **Text**: White numbers
- **Position**: Precisely placed over key UI elements

### Page-specific annotations:

**12-knowledge-base.png**
1. Search box (left side)
2. Tag filter (center)
3. Table/Card toggle (top right)
4. Statistics display (right side)

**13-prompts.png**
1. Generate button (top right)
2. Guide selector (left side)
3. Prompts table (center)

**14-trash.png**
1. Category tabs (top left)
2. Deleted items list (center)
3. Restore/Delete buttons (right side)

**15-account-settings.png**
1. Display name field (top)
2. Password change section (below)

## Next Steps

After capturing all 4 screenshots:

1. Verify all files exist in `images/` directory
2. Check that annotations are visible and correctly positioned
3. Confirm file sizes are reasonable (~50-150KB each for PNG)
4. Update the main user guide markdown files to reference these images

## Troubleshooting

**Problem**: HTML page shows empty iframe
- **Solution**: Check internet connection, verify you can access https://spansurvey.net/annote

**Problem**: Annotations not visible
- **Solution**: Check browser console for errors, try refreshing the page

**Problem**: Screenshot wrong dimensions
- **Solution**: Use DevTools method to capture exact container size

**Problem**: Want to adjust annotation positions
- **Solution**: Edit `generate_capture_pages.py` and regenerate HTML files

## Technical Notes

- Production URL: `https://spansurvey.net/annote`
- Target dimensions: 1486x827 pixels
- Image format: PNG (lossless)
- Annotation z-index: 999999 (ensures visibility over all content)
- Annotations are non-interactive (pointer-events: none)
