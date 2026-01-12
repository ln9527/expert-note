# DocumentSwitcher - Visual Reference

## Component Appearance

### Full View (with Recent Documents)

```
┌──────────────────────────────────────────────────────┐
│  🔍  Search documents...                         ✕   │  ← Search with icon + clear
├──────────────────────────────────────────────────────┤
│  RECENT DOCUMENTS                                    │  ← Gray header bg
│  ┌────────────────────────────────────────────────┐  │
│  │ ✓  current-research.md          [annotated]  → │  │  ← Blue background + border
│  │    5 12 23                                     │  │  ← Red/Yellow/Green counts
│  ├────────────────────────────────────────────────┤  │
│  │    literature-review.md            [refined]  → │  │  ← White background
│  │    10 8 15                                     │  │
│  ├────────────────────────────────────────────────┤  │
│  │    methodology-notes.md         [annotated]  → │  │
│  │    3 7 12                                      │  │
│  ├────────────────────────────────────────────────┤  │
│  │    interview-transcript.md             [raw]  → │  │  ← No counts for raw
│  │                                                │  │
│  ├────────────────────────────────────────────────┤  │
│  │    field-notes-may.md              [annotated] → │  │
│  │    2 4 8                                       │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  ALL DOCUMENTS (42)                                  │  ← Sticky header
│  ┌────────────────────────────────────────────────┐  │
│  │    abstract-draft.md                  [raw]    → │  │  ← Scrollable area
│  ├────────────────────────────────────────────────┤  │
│  │    analysis-chapter3.md          [annotated]   → │  │
│  │    15 20 30                                    │  │
│  ├────────────────────────────────────────────────┤  │
│  │    background-research.md        [annotated]   → │  │
│  │    8 10 12                                     │  │
│  ├────────────────────────────────────────────────┤  │
│  │    bibliography.md                   [raw]     → │  │
│  ├────────────────────────────────────────────────┤  │
│  │    ...                                         │  │
│  │    (37 more documents)                         │  │  ← Scroll indicator
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  Press ESC to close                         42 total │  ← Footer info
└──────────────────────────────────────────────────────┘
```

### With Search Active

```
┌──────────────────────────────────────────────────────┐
│  🔍  interview                                   ✕   │  ← Search term entered
├──────────────────────────────────────────────────────┤
│  SEARCH RESULTS (3)                                  │  ← No recent docs section
│  ┌────────────────────────────────────────────────┐  │
│  │    interview-transcript.md             [raw]   → │  │
│  ├────────────────────────────────────────────────┤  │
│  │    interview-analysis.md          [annotated]  → │  │
│  │    12 15 20                                    │  │
│  ├────────────────────────────────────────────────┤  │
│  │    interview-codes.md             [refined]    → │  │
│  │    8 10 5                                      │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  Press ESC to close                          3 total │
└──────────────────────────────────────────────────────┘
```

### Empty State (No Matches)

```
┌──────────────────────────────────────────────────────┐
│  🔍  xyzabc123                                   ✕   │  ← No results
├──────────────────────────────────────────────────────┤
│  SEARCH RESULTS (0)                                  │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │                      📄                        │  │  ← Document icon
│  │                                                │  │
│  │              No documents found                │  │  ← Main message
│  │         Try a different search term            │  │  ← Help text
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  Press ESC to close                          0 total │
└──────────────────────────────────────────────────────┘
```

---

## Color Reference

### Status Badges

| Status | Background | Text | Sample |
|--------|------------|------|--------|
| raw | `bg-gray-100` | `text-gray-600` | ![gray](https://via.placeholder.com/60x20/f3f4f6/4b5563?text=raw) |
| annotated | `bg-green-100` | `text-green-700` | ![green](https://via.placeholder.com/80x20/dcfce7/15803d?text=annotated) |
| refined | `bg-blue-100` | `text-blue-700` | ![blue](https://via.placeholder.com/70x20/dbeafe/1d4ed8?text=refined) |

### Annotation Counts

| Level | Color | Hex | Sample |
|-------|-------|-----|--------|
| MACRO | Red | `#dc2626` | ![red](https://via.placeholder.com/30x20/dc2626/ffffff?text=5) |
| MESO | Yellow | `#ca8a04` | ![yellow](https://via.placeholder.com/30x20/ca8a04/ffffff?text=12) |
| MICRO | Green | `#16a34a` | ![green](https://via.placeholder.com/30x20/16a34a/ffffff?text=23) |

### Highlight States

| State | Background | Border | Text |
|-------|------------|--------|------|
| Normal | `bg-white` | none | `text-gray-900` |
| Hover | `bg-gray-50` | none | `text-gray-900` |
| Current | `bg-blue-50` | `border-l-2 border-blue-600` | `text-blue-700` |

---

## Icon Legend

| Icon | Meaning | Location |
|------|---------|----------|
| 🔍 | Search | Search box left |
| ✕ | Clear search | Search box right |
| ✓ | Current document | Document item left |
| → | Navigate | Document item right |
| 📄 | Empty state | Center of empty list |

---

## Responsive Behavior

### Desktop (1280px+)
```
┌────────────────────────────────────────┐
│  Button: "Switch Document ▼"          │  ← Full width: 384px
│  ┌──────────────────────────────────┐  │
│  │  [Dropdown Full Width]           │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### Tablet (768px - 1279px)
```
┌──────────────────────────────────┐
│  Button: "Switch Document ▼"    │  ← Still 384px (fixed)
│  ┌────────────────────────────┐  │
│  │  [Dropdown 384px]          │  │  ← May extend beyond button
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────────────┐
│  📄  ▼                   │  ← Icon only button
│  ┌────────────────────┐  │
│  │  [Full viewport]   │  │  ← 100vw - padding
│  │  [adjusted width]  │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

---

## Interaction States

### Button States

**Default:**
```
┌─────────────────────────────────┐
│  📄 Switch Document  ▼          │  ← Gray border
└─────────────────────────────────┘
```

**Hover:**
```
┌─────────────────────────────────┐
│  📄 Switch Document  ▼          │  ← Light gray background
└─────────────────────────────────┘
```

**Active (Dropdown Open):**
```
┌─────────────────────────────────┐
│  📄 Switch Document  ▲          │  ← Arrow up, blue border
└─────────────────────────────────┘
```

### Document Item States

**Default:**
```
│    document-name.md    [status]  →  │  ← White background
```

**Hover:**
```
│    document-name.md    [status]  →  │  ← Gray-50 background
```

**Current:**
```
│ ✓  document-name.md    [status]  →  │  ← Blue-50 bg, blue border
```

**Current + Hover:**
```
│ ✓  document-name.md    [status]  →  │  ← Same as current (no change)
```

---

## Animation Details

### Dropdown Appearance
- **Entry**: Fade in + slide down (200ms ease-out)
- **Exit**: Fade out (150ms ease-in)

### Hover Transitions
- **Background**: 150ms ease-in-out
- **Border**: Instant (no transition)
- **Text**: Instant (no transition)

### Search Clear Button
- **Opacity**: Fade in/out (200ms)
- **Scale**: None
- **Hover**: Color change (100ms)

---

## Accessibility Features

### Keyboard Navigation
```
[Tab]           → Focus toggle button
[Enter/Space]   → Open/close dropdown
[Tab]           → Focus search box (when open)
[Type]          → Filter documents
[Esc]           → Close dropdown
[Tab] (in list) → Focus document items
[Enter] (on doc)→ Switch document
```

### Screen Reader Announcements
- "Document switcher, button, collapsed/expanded"
- "Search documents, edit text"
- "X documents found"
- "Current document: [name]"
- "Switch to [name], button"

### ARIA Attributes
```html
<button aria-expanded="true/false" aria-haspopup="listbox">
<input role="searchbox" aria-label="Search documents">
<div role="listbox" aria-label="Documents">
  <button role="option" aria-selected="true/false">
```

---

## Dimensions Breakdown

### Dropdown
- **Width**: 384px (w-96)
- **Max Height**: 600px
- **Padding**: 0 (sections have own padding)
- **Border**: 1px solid gray-200
- **Border Radius**: 8px (rounded-lg)
- **Shadow**: xl (large shadow)

### Search Box
- **Height**: 40px (py-2 + border)
- **Padding**: 12px (p-3)
- **Icon Size**: 20px (h-5 w-5)

### Section Headers
- **Height**: 32px (py-2 + text)
- **Padding**: 8px 12px
- **Font**: 12px uppercase
- **Background**: gray-50

### Document Items
- **Height**: ~60px (varies with content)
- **Padding**: 8px 12px (py-2 px-3)
- **Gap**: 8px between elements
- **Icon Size**: 16px (w-4 h-4)

### Footer
- **Height**: 36px (py-2 + text)
- **Padding**: 8px 12px
- **Font**: 12px

---

## Z-Index Layers

```
Dropdown (z-50)         ← Switcher dropdown
  Search clear (z-10)   ← Clear button over input
  Sticky header (z-10)  ← Section header over list
Modal backdrop (z-40)   ← (if used)
Navbar (z-30)           ← Main navigation
Content (z-0)           ← Page content
```

---

## Spacing System

### Internal Spacing
```
Search section:     p-3  (12px all sides)
Section headers:    px-3 py-2 (12px horizontal, 8px vertical)
Document items:     px-3 py-2 (12px horizontal, 8px vertical)
Footer:             px-3 py-2 (12px horizontal, 8px vertical)

Gaps within items:  gap-2 (8px)
Icon margins:       mr-2, ml-2 (8px)
Badge spacing:      mt-1 (4px top margin)
```

### External Spacing
```
Dropdown from button:  mt-2 (8px below)
Border thickness:      border (1px)
Left border current:   border-l-2 (2px)
```

---

## Typography

### Search Input
- Font: 14px (text-sm)
- Weight: 400 (regular)
- Color: gray-900
- Placeholder: gray-400

### Section Headers
- Font: 12px (text-xs)
- Weight: 500 (medium)
- Color: gray-500
- Transform: uppercase

### Document Filenames
- Font: 14px (text-sm)
- Weight: 400 (regular) / 500 (current)
- Color: gray-900 / blue-700 (current)
- Truncate: ellipsis

### Status Badges
- Font: 12px (text-xs)
- Weight: 400 (regular)
- Color: varies by status

### Annotation Counts
- Font: 12px (text-xs)
- Weight: 500 (medium)
- Color: red-600 / yellow-600 / green-600

### Footer Text
- Font: 12px (text-xs)
- Weight: 400 (regular)
- Color: gray-500

---

## Visual Hierarchy

### Primary (Most Important)
1. Current document (blue highlight + checkmark)
2. Search box (prominent at top)

### Secondary
1. Document filenames (readable size)
2. Section headers (clear separation)

### Tertiary
1. Status badges (color-coded info)
2. Annotation counts (data at a glance)
3. Footer hints (subtle guidance)

---

## Component Tree

```
DocumentSwitcher (wrapper)
├── SearchBox
│   ├── Input (text)
│   ├── SearchIcon (svg)
│   └── ClearButton (button)
│       └── XIcon (svg)
├── RecentDocuments (section)
│   ├── Header (div)
│   └── List (scrollable div)
│       └── DocumentSwitcherItem × N
│           ├── CheckIcon (if current)
│           ├── Filename (span)
│           ├── StatusBadge (span)
│           ├── AnnotationCounts (span)
│           └── ArrowIcon (svg)
├── AllDocuments (section)
│   ├── Header (sticky div)
│   └── List (scrollable div)
│       ├── DocumentSwitcherItem × N (if results)
│       └── EmptyState (div, if no results)
│           ├── DocumentIcon (svg)
│           └── Text (p × 2)
└── Footer (div)
    ├── HintText (span)
    └── CountText (span)
```

---

**Created**: January 2026
**Purpose**: Visual reference for DocumentSwitcher implementation
**File**: `/docs/DOCUMENT_SWITCHER_VISUAL.md`
