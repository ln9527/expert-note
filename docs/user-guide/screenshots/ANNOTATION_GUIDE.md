# Screenshot Annotation Guide

## Visual Annotation Standards for Expert Note Documentation

This guide explains the visual annotation system used across all Expert Note screenshot documentation.

## Annotation Objectives

1. **Clarity**: Clearly identify and label key UI elements
2. **Consistency**: Maintain uniform annotation style across all screenshots
3. **Accessibility**: Make screenshots comprehensible to all users
4. **Professionalism**: Present polished, publication-ready documentation

## Color Coding System

### Orange (#FF6B35) - Required Fields
Used for form fields and actions that are mandatory to complete the workflow.

**Examples**:
- Username field (login form)
- Password field (login form)
- Invitation Code (registration form)
- Password field (registration form)
- Primary action buttons (Sign In, Create Account)

**Rationale**: Orange conveys importance and requirement, drawing user attention to critical fields.

### Teal (#4ECDC4) - Optional Fields
Used for form fields that enhance the user experience but are not required to proceed.

**Examples**:
- Display Name (registration form)
- Phone Number (registration form)
- Email (registration form)

**Rationale**: Teal indicates secondary importance while still calling attention to useful fields.

### Red (Error State) - To be used for error messages
Reserved for future documentation of error states and validation messages.

**Color**: #E74C3C (standard error red)

## Annotation Structure

### 1. Numbered Label Circles

**Visual Properties**:
- **Shape**: Circle
- **Radius**: 20 pixels
- **Background**: Solid color (orange or teal)
- **Border**: None (fully filled)
- **Number Style**: White, bold, 16pt font
- **Positioning**: Upper-left of annotated element

**Number Sequence**:
- Login page: 1-4 (4 elements)
- Registration page: 1-6+ (6 main elements, may extend for additional fields)
- Sequential numbering from top to bottom

**Example Positions**:
```
1. Username field
2. Password field
3. Sign In button
4. Register link
```

### 2. Border Circles (Boundary Markers)

**Visual Properties**:
- **Shape**: Circle
- **Color**: Same as label circle (orange or teal)
- **Stroke Width**: 3 pixels
- **Fill**: None (outline only)
- **Radius**: Dynamic, extends ~10px beyond element boundary

**Calculation**:
```javascript
const rect = element.getBoundingClientRect();
const cx = rect.left + rect.width / 2;
const cy = rect.top + rect.height / 2;
const radius = Math.max(rect.width, rect.height) / 2 + 10;
```

**Purpose**: Visually isolates the annotated element from surrounding content.

### 3. Connecting Lines (Arrow Pointers)

**Visual Properties**:
- **Type**: Straight line (not curved)
- **Color**: Same as element annotation (orange or teal)
- **Stroke Width**: 2 pixels
- **Line Style**: Solid (not dashed)
- **Start Point**: Label circle
- **End Point**: Element boundary

**Start Coordinates** (typical):
- X: rect.left - 10 (approximately label circle edge)
- Y: rect.top - 10 (approximately label circle edge)

**End Coordinates** (typical):
- X: rect.left + 20 (element border)
- Y: rect.top + 20 (element border)

**Purpose**: Creates clear visual connection between number and element.

## Implementation Methods

### Method 1: JavaScript SVG Injection (Recommended)
Create annotations dynamically using SVG elements:

```javascript
// Create SVG canvas
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('width', window.innerWidth);
svg.setAttribute('height', window.innerHeight);

// Get element position
const rect = element.getBoundingClientRect();

// Draw border circle
const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
circle.setAttribute('cx', rect.left + rect.width / 2);
circle.setAttribute('cy', rect.top + rect.height / 2);
circle.setAttribute('r', Math.max(rect.width, rect.height) / 2 + 10);
circle.setAttribute('stroke', '#FF6B35');
circle.setAttribute('stroke-width', '3');
circle.setAttribute('fill', 'none');
svg.appendChild(circle);

// Draw label circle
const labelCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
labelCircle.setAttribute('cx', rect.left - 30);
labelCircle.setAttribute('cy', rect.top - 30);
labelCircle.setAttribute('r', '20');
labelCircle.setAttribute('fill', '#FF6B35');
svg.appendChild(labelCircle);

// Draw label text
const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
text.setAttribute('x', rect.left - 30);
text.setAttribute('y', rect.top - 22);
text.setAttribute('text-anchor', 'middle');
text.setAttribute('font-size', '16');
text.setAttribute('font-weight', 'bold');
text.setAttribute('fill', 'white');
text.textContent = '1';
svg.appendChild(text);

// Draw connecting line
const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
line.setAttribute('x1', rect.left - 10);
line.setAttribute('y1', rect.top - 10);
line.setAttribute('x2', rect.left + 20);
line.setAttribute('y2', rect.top + 20);
line.setAttribute('stroke', '#FF6B35');
line.setAttribute('stroke-width', '2');
svg.appendChild(line);
```

### Method 2: Screenshot Tools
Use screenshot editing tools (Figma, Adobe Markup, etc.):
1. Take screenshot
2. Import into editing tool
3. Add circles, lines, and text
4. Export as PNG/JPG

### Method 3: Browser Extensions
Use Chrome extensions for annotation:
- Markup Hero
- Annotate
- SnagIt
- Greenshot

## Layout Considerations

### Viewport Dimensions
- **Standard Width**: 911px
- **Standard Height**: 717px
- **Aspect Ratio**: Approximately 1.27:1 (wider than tall)

### Element Spacing

**Annotation Circles**:
- Positioned 30px upper-left of element
- Does not overlap other elements when possible
- Automatically adjusts if near page edges

**Border Circles**:
- Extends 10px beyond element boundary
- Positioned at element center
- May overlap with other annotations (intentional cascade effect)

**Connecting Lines**:
- Angled diagonal from label to element
- Approximately 45-degree angle
- Creates clear visual path

## Handling Edge Cases

### Multiple Elements in Close Proximity

**Challenge**: Annotations for nearby elements may overlap.

**Solution Options**:
1. Adjust number position (offset further)
2. Use longer connecting lines
3. Segment annotations across multiple screenshots
4. Document non-overlapping subset in one view

### Elements Near Page Edges

**Challenge**: Label circle may extend beyond viewport.

**Solution Options**:
1. Position label on opposite side of element
2. Use shortened connecting line
3. Place label at alternative position (lower-right instead of upper-left)
4. Document on separate zoomed screenshot

### Form Fields Below Fold

**Challenge**: Not all elements visible in single viewport.

**Solution Options**:
1. Create separate annotated screenshot of scrolled view
2. Document elements in numerical sequence across multiple images
3. Include "scroll to see more" annotation in relevant screenshots
4. Provide composite diagram showing all elements

## Screenshot Capture Specifications

### Browser Settings
- **Browser**: Chrome or Firefox (consistent rendering)
- **Viewport Size**: 911px × 717px
- **Zoom Level**: 100% (no scaling)
- **Display Settings**: Default system settings
- **Device**: Desktop/Laptop (not mobile)

### Timing
- Capture after page fully loads
- Wait for animations to complete
- Ensure no loading spinners visible
- Time-sensitive elements (clock, timers) should be paused

### Quality Standards
- **Format**: PNG preferred (lossless), JPG acceptable
- **Resolution**: Native viewport size
- **Compression**: Optimize for web without quality loss
- **Color Profile**: sRGB (standard web color)

## Accessibility in Annotations

### For Screen Readers
- Annotations are visual only (SVG overlays)
- Include full text descriptions in accompanying markdown
- Provide alt text for screenshot images
- Ensure markdown content is comprehensive

**Alt Text Example**:
```markdown
![Login form with 4 annotated elements: username field, password field, sign in button, and register link](./01-login.png)
```

### For Color Blind Users
- Don't rely solely on color for meaning
- Use number labels as primary identifier
- Include text descriptions in markdown
- Consider additional visual patterns (dashed vs solid lines)

### For Low Vision Users
- Ensure sufficient contrast (orange and teal on white/gray)
- Large numbers (16pt bold) clearly visible
- Clear, thick connecting lines (2-3px stroke)
- Accompanying text descriptions essential

## Documentation Workflow

### Step 1: Capture Screenshot
```bash
1. Navigate to page
2. Take viewport screenshot (911x717)
3. Save with timestamp for version control
```

### Step 2: Add Annotations
```javascript
1. Open browser console
2. Inject annotation script
3. Verify all elements properly annotated
4. Take annotated screenshot
```

### Step 3: Create Markdown Documentation
```markdown
1. Create .md file with standard structure
2. Include detailed descriptions of each element
3. Add step-by-step instructions
4. Include error handling and best practices
5. Add links to related documentation
```

### Step 4: Save Screenshot Image
```bash
1. Export annotated screenshot as PNG
2. Compress for web (optimize-images)
3. Save in screenshots/ directory
4. Update markdown with image reference
```

### Step 5: Review and Publish
```bash
1. Review all markdown content
2. Verify all links are correct
3. Check that descriptions match screenshots
4. Commit to repository
5. Deploy documentation
```

## Version Control and Updates

### File Naming Convention
- Screenshots: `##-descriptive-name.png` (e.g., `01-login.png`)
- Markdown: `##-descriptive-name.md` (e.g., `01-login.md`)
- Both use same two-digit prefix for association

### Change Management
When updating annotations:
1. Take new screenshot of current UI state
2. Re-apply annotations with updated element positions
3. Update markdown if descriptions changed
4. Commit with clear message: "docs: Update login screenshot annotations"
5. Tag version in git if major UI change

### Deprecation Procedure
For obsolete screenshots:
1. Rename to include version: `01-login-v1.md` (archive)
2. Keep in repository for historical reference
3. Update all links to point to current version
4. Document changes in CHANGELOG.md

## Quality Checklist

Before publishing annotated screenshots:

### Visual Quality
- [ ] All elements properly annotated with correct colors
- [ ] Numbers clearly visible (white, bold, 16pt)
- [ ] Border circles extend appropriately beyond elements
- [ ] Connecting lines are straight and properly angled
- [ ] No annotations obscured by other elements (when possible)
- [ ] Overall composition is clean and professional

### Accuracy
- [ ] All relevant elements are annotated
- [ ] Numbering is sequential (1, 2, 3, etc.)
- [ ] Color coding matches field requirements (orange/teal)
- [ ] Positions match actual element locations
- [ ] No extraneous annotations or marks

### Documentation
- [ ] Markdown file created with complete descriptions
- [ ] Each annotated element fully documented
- [ ] Step-by-step instructions are clear and accurate
- [ ] Error handling section included
- [ ] Related documentation linked
- [ ] No broken links or references

### Accessibility
- [ ] Alt text provided for screenshot image
- [ ] Color not sole means of conveying information
- [ ] Number labels clearly identify each element
- [ ] Text descriptions are comprehensive
- [ ] Sufficient color contrast verified

### Technical
- [ ] Screenshot dimensions correct (911x717)
- [ ] File format appropriate (PNG preferred)
- [ ] File size optimized for web
- [ ] Saved in correct directory (/docs/user-guide/screenshots/)
- [ ] Filename follows naming convention

## Tools and Resources

### Recommended Tools
- **SVG Injection**: Browser console (JavaScript)
- **Screenshot Capture**: Chrome DevTools, FireFox Inspector
- **Image Editing**: Figma, Adobe Markup, Preview (Mac)
- **Markdown Editing**: VS Code, Sublime Text
- **Image Optimization**: TinyPNG, ImageMagick

### Browser Extensions
- Markup Hero - Quick annotations
- Annotate - Full-featured markup
- SnagIt - Professional screenshots
- Greenshot - Open-source option

### Online Tools
- Figma - Collaborative design
- Excalidraw - Whiteboard diagrams
- Canva - Design tool
- Pixlr - Online editor

## Examples and Templates

### Login Screenshot Annotations
```
1. Username field (orange) - Required for login
2. Password field (orange) - Required for login
3. Sign In button (orange) - Primary action
4. Register link (orange) - Secondary action link
```

### Registration Screenshot Annotations
```
1. Invitation Code (orange) - Required field
2. Username (orange) - Required field
3. Display Name (teal) - Optional field
4. Phone Number (teal) - Optional field
5. Email (teal) - Optional field
6. Password (orange) - Required field
[7. Confirm Password (orange) - Required field - below fold]
```

## Support and Questions

For questions about:
- **Annotation standards**: See color coding system above
- **Implementation**: Check JavaScript method examples
- **Accessibility**: Review accessibility section
- **Workflow**: See documentation workflow section

---

**Document Version**: 1.0
**Last Updated**: January 15, 2026
**Status**: Complete
**Author**: Expert Note Documentation Team
