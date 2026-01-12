# DocumentSwitcher Component Usage Guide

## Overview

The `DocumentSwitcher` component provides a polished dropdown UI for quickly switching between documents without leaving the editor. It features search, recent documents tracking, and visual indicators for document status and annotation counts.

---

## Features

- **Quick Search**: Filter documents by filename with debounced search
- **Recent Documents**: Shows last 5 recently accessed documents (persisted in localStorage)
- **Current Document Highlight**: Visual indicator (✓) for the active document
- **Annotation Counts**: Color-coded counts (MACRO/MESO/MICRO) for each document
- **Status Badges**: Shows document status (raw/annotated/refined)
- **Keyboard Support**: ESC to close, auto-focus on search
- **Click Outside to Close**: Smooth UX with automatic close behavior
- **Empty State**: Helpful message when no documents match search

---

## Component Props

```typescript
interface DocumentSwitcherProps {
  documents: Document[];           // Array of all documents
  currentDocumentId: string;       // ID of currently open document
  onDocumentSwitch: (id: string) => void;  // Callback when user switches
  isOpen: boolean;                 // Controls dropdown visibility
  onClose: () => void;             // Callback to close dropdown
}
```

---

## Integration Example

### 1. Add State to Parent Component

```tsx
'use client';

import { useState } from 'react';
import DocumentSwitcher from '@/components/documents/DocumentSwitcher';
import { Document } from '@/types';

export default function DocumentEditor() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocumentId, setCurrentDocumentId] = useState<string>('');
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // ... load documents logic
}
```

### 2. Add Button to Toggle Switcher

```tsx
<div className="flex items-center gap-2">
  {/* Document Switcher Toggle Button */}
  <div className="relative">
    <button
      onClick={() => setSwitcherOpen(!switcherOpen)}
      className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
      title="Switch Document (Cmd+K)"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span>Switch Document</span>
      <svg className={`w-4 h-4 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {/* Document Switcher Dropdown */}
    <DocumentSwitcher
      documents={documents}
      currentDocumentId={currentDocumentId}
      onDocumentSwitch={handleDocumentSwitch}
      isOpen={switcherOpen}
      onClose={() => setSwitcherOpen(false)}
    />
  </div>
</div>
```

### 3. Implement Document Switch Handler

```tsx
const handleDocumentSwitch = async (docId: string) => {
  // Save current document before switching (if dirty)
  if (hasUnsavedChanges) {
    await saveCurrentDocument();
  }

  // Load new document
  const newDoc = documents.find(d => d.id === docId);
  if (newDoc) {
    setCurrentDocumentId(docId);
    setContent(newDoc.content);
    // ... other state updates
  }
};
```

### 4. (Optional) Add Keyboard Shortcut

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd+K or Ctrl+K to toggle switcher
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSwitcherOpen(prev => !prev);
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Recent Documents Persistence

The component automatically tracks and persists recent documents using localStorage:

- **Key**: `recentDocuments`
- **Format**: `string[]` (array of document IDs)
- **Max Items**: 10 (displays 5)
- **Logic**: Most recent first, duplicates removed

No manual management needed - the component handles everything!

---

## Styling & Customization

### Status Badge Colors

```tsx
// Default status colors (can be customized)
{
  raw: 'bg-gray-100 text-gray-600',
  annotated: 'bg-green-100 text-green-700',
  refined: 'bg-blue-100 text-blue-700'
}
```

### Annotation Count Colors

- **MACRO**: Red (`text-red-600`)
- **MESO**: Yellow (`text-yellow-600`)
- **MICRO**: Green (`text-green-600`)

### Dropdown Dimensions

- **Width**: `384px` (w-96)
- **Max Height**: `600px`
- **Recent Docs Section**: `200px` max height
- **Scrollable**: All Documents section

---

## Example Document Data Structure

```typescript
const exampleDocuments: Document[] = [
  {
    id: '123',
    filename: 'research-notes.md',
    content: '...',
    status: 'annotated',
    annotationCounts: {
      macro: 5,
      meso: 12,
      micro: 23
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    // ... other fields
  }
];
```

---

## Complete Integration Example

```tsx
'use client';

import { useState, useEffect } from 'react';
import DocumentSwitcher from '@/components/documents/DocumentSwitcher';
import { Document } from '@/types';

export default function DocumentEditorPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocumentId, setCurrentDocumentId] = useState<string>('');
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [content, setContent] = useState('');

  // Load documents on mount
  useEffect(() => {
    async function loadDocuments() {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
        if (data.data.length > 0) {
          setCurrentDocumentId(data.data[0].id);
          setContent(data.data[0].content);
        }
      }
    }
    loadDocuments();
  }, []);

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSwitcherOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDocumentSwitch = async (docId: string) => {
    // Find new document
    const newDoc = documents.find(d => d.id === docId);
    if (!newDoc) return;

    // Update state
    setCurrentDocumentId(docId);
    setContent(newDoc.content);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Document Editor</h1>

          {/* Document Switcher */}
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{documents.find(d => d.id === currentDocumentId)?.filename || 'Select Document'}</span>
              <kbd className="px-2 py-0.5 text-xs bg-gray-100 rounded">⌘K</kbd>
            </button>

            <DocumentSwitcher
              documents={documents}
              currentDocumentId={currentDocumentId}
              onDocumentSwitch={handleDocumentSwitch}
              isOpen={switcherOpen}
              onClose={() => setSwitcherOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[600px] p-4 border rounded-lg"
        />
      </div>
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Component renders without errors
- [ ] Search filters documents correctly
- [ ] Recent documents section appears when available
- [ ] Recent documents persist across page reloads
- [ ] Current document shows checkmark (✓)
- [ ] Annotation counts display correctly
- [ ] Status badges show correct colors
- [ ] Click on document switches to it
- [ ] Click outside closes dropdown
- [ ] ESC key closes dropdown
- [ ] Empty state shows when no matches
- [ ] Dropdown doesn't overflow viewport
- [ ] Scrolling works in both sections
- [ ] TypeScript types are correct
- [ ] No console errors

---

## Performance Considerations

- **Search Debounce**: 150ms (configurable via SearchBox component)
- **Recent Docs Limit**: Only stores 10 IDs in localStorage
- **Render Optimization**: Only renders visible items (natural scrolling)
- **Event Cleanup**: All event listeners properly cleaned up

---

## Troubleshooting

### Documents not appearing in recent list

**Cause**: Recent docs are filtered by documents prop
**Fix**: Ensure deleted documents are filtered out before passing to component

### Dropdown not closing on click outside

**Cause**: Container ref not properly attached
**Fix**: Ensure containerRef is on the root div with class `document-switcher-container`

### Search not working

**Cause**: SearchBox onChange not triggering
**Fix**: Check SearchBox component is imported correctly

### TypeScript errors

**Cause**: Document type mismatch
**Fix**: Ensure Document type includes `annotationCounts` field with structure:
```typescript
annotationCounts: {
  macro: number;
  meso: number;
  micro: number;
}
```

---

## Future Enhancements

- [ ] Add document preview on hover
- [ ] Sort options (name, date, annotations)
- [ ] Filter by status/tags
- [ ] Keyboard navigation (arrow keys)
- [ ] Bulk actions (select multiple)
- [ ] Drag to reorder recent docs
- [ ] Pin favorite documents
- [ ] Show last modified date

---

**Created**: January 2026
**Component Location**: `/src/components/documents/DocumentSwitcher.tsx`
**Dependencies**: SearchBox, Document type from @/types
