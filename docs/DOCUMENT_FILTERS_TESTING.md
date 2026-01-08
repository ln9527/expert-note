# Document Search & Filters - Testing Guide

**Status:** Implementation Complete
**Date:** 2026-01-08
**Agent:** Agent 2

---

## What Was Implemented

### 1. SearchBox Component (Reusable)
**File:** `/src/components/common/SearchBox.tsx`

**Features:**
- Debounced input (default 300ms, configurable)
- Search icon on the left
- Clear button (X) on the right when text is entered
- Syncs with external value changes
- Clean, minimal design

**Props:**
```typescript
{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounce?: number;
  className?: string;
}
```

---

### 2. DocumentFilters Component
**File:** `/src/components/documents/DocumentFilters.tsx`

**Features:**
- Search box (fuzzy search on filename and content)
- Status dropdown (All Status, Raw, Annotated, Refined)
- Tag multi-select filter (reuses existing TagFilter component)
- User dropdown (filter by document creator)
- Active filter badges showing current filters
- Clear all filters button
- Responsive grid layout (4 columns on desktop, stacks on mobile)

**Props:**
```typescript
{
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedTagIds: number[];
  onTagsChange: (ids: number[]) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  userFilter: number | null;
  onUserChange: (userId: number | null) => void;
  availableTags: Tag[];
  availableUsers: User[];
  onClearAll: () => void;
}
```

---

### 3. Users API Endpoint
**File:** `/src/app/api/users/route.ts`

**Endpoint:** `GET /api/users`

**Returns:**
```json
{
  "success": true,
  "users": [
    {
      "userId": 1,
      "username": "ning",
      "displayName": "Ning Li",
      "isActive": true,
      "lastLogin": "...",
      "createdAt": "..."
    }
  ]
}
```

**Features:**
- Only returns active users
- Sorted by display name
- Requires authentication

---

### 4. Enhanced Documents Query
**File:** `/src/lib/db/queries/documents.ts`

**New Options:**
```typescript
{
  includeDeleted?: boolean;
  status?: string;
  tagIds?: number[];
  search?: string;        // NEW: Fuzzy search
  createdBy?: number;     // NEW: Filter by creator
}
```

**Search Behavior:**
- Uses PostgreSQL `ILIKE` for case-insensitive search
- Searches across both `filename` and `content` columns
- Pattern: `%search_term%` (matches anywhere in text)

---

### 5. Enhanced Documents API
**File:** `/src/app/api/documents/route.ts`

**Query Parameters:**
```
GET /api/documents?search=term&tags=1,2,3&status=annotated&createdBy=5
```

**All parameters are optional and can be combined.**

---

### 6. Updated Dashboard
**File:** `/src/app/page.tsx`

**New Features:**
- Loads tags and users on mount
- Filter state management (4 filter states)
- Real-time document filtering (reactive to filter changes)
- Shows result count with "(filtered)" indicator
- Smart empty state (different messages for filtered vs no documents)
- Loading state only on initial load (filters apply instantly)
- Clear all filters handler

**Filter State:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
const [statusFilter, setStatusFilter] = useState('all');
const [userFilter, setUserFilter] = useState<number | null>(null);
```

---

## Testing Checklist

### Individual Filters

#### Search Box
- [ ] Type in search box
- [ ] Verify 300ms debounce (no immediate search)
- [ ] Search by document filename
- [ ] Search by document content
- [ ] Clear search with X button
- [ ] Verify case-insensitive search
- [ ] Search with special characters

#### Status Filter
- [ ] Filter by "Raw" status
- [ ] Filter by "Annotated" status
- [ ] Filter by "Refined" status
- [ ] Select "All Status" (should show all)
- [ ] Verify correct documents shown for each status

#### Tag Filter
- [ ] Open tag dropdown
- [ ] Select single tag
- [ ] Select multiple tags
- [ ] Remove tag from selection
- [ ] Clear all tags with clear button
- [ ] Verify documents with ANY of selected tags are shown

#### User Filter
- [ ] Select different users from dropdown
- [ ] Verify only documents by that user shown
- [ ] Select "All Users" (should show all)
- [ ] Verify user names display correctly

### Combined Filters

- [ ] Search + Status filter
- [ ] Search + Tag filter
- [ ] Search + User filter
- [ ] Status + Tag filter
- [ ] Status + User filter
- [ ] Tag + User filter
- [ ] All 4 filters combined
- [ ] Verify filters combine with AND logic

### UI/UX

- [ ] Active filter badges appear when filters applied
- [ ] Badge shows correct filter type and value
- [ ] Remove individual filter by clicking badge X
- [ ] "Clear all filters" button appears when any filter active
- [ ] "Clear all filters" button removes all filters
- [ ] Result count shows correct number
- [ ] "(filtered)" indicator shows when filters active
- [ ] Empty state shows correct message for no results
- [ ] Empty state shows "Clear Filters" button when filtered
- [ ] Filter controls are responsive (mobile/tablet/desktop)

### Performance

- [ ] Search debounce works (no lag while typing)
- [ ] Filter changes apply quickly (<500ms)
- [ ] No unnecessary re-renders
- [ ] Multiple filters combine efficiently
- [ ] Large result sets render smoothly

### Edge Cases

- [ ] No documents in system (empty state)
- [ ] All documents filtered out (filtered empty state)
- [ ] Search with no matches
- [ ] Tag filter with no matching documents
- [ ] User with no documents
- [ ] Special characters in search (quotes, apostrophes, etc.)
- [ ] Very long search terms
- [ ] Rapid filter changes
- [ ] Clear filters, then reapply

---

## Known Issues

None currently. All TypeScript compilation passes with no errors.

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/documents` | GET | Fetch documents with filters |
| `/api/users` | GET | Fetch all active users |
| `/api/tags` | GET | Fetch all tags (existing) |

---

## Database Queries

### Documents Query with Filters
```sql
SELECT d.*,
  COALESCE(tags_json, '[]') as tags,
  annotation_counts,
  creator_info
FROM documents d
WHERE d.is_deleted = FALSE
  AND (d.filename ILIKE '%search%' OR d.content ILIKE '%search%')
  AND d.status = 'annotated'
  AND d.created_by = 5
  AND d.id IN (SELECT document_id FROM document_tags WHERE tag_id = ANY(ARRAY[1,2,3]))
ORDER BY d.updated_at DESC;
```

**Notes:**
- All WHERE conditions are optional
- Multiple tag IDs use OR logic (document must have at least one)
- Search uses OR logic across filename and content
- Case-insensitive search with ILIKE

---

## Component Hierarchy

```
Dashboard (page.tsx)
├── AppHeader
├── DocumentFilters
│   ├── SearchBox (custom component)
│   ├── Status Dropdown (native select)
│   ├── TagFilter (existing component)
│   ├── User Dropdown (native select)
│   └── FilterBadge components
└── Documents Table
    └── Document Rows
```

---

## File Changes Summary

### New Files
1. `/src/components/common/SearchBox.tsx`
2. `/src/components/documents/DocumentFilters.tsx`
3. `/src/app/api/users/route.ts`
4. `/docs/DOCUMENT_FILTERS_TESTING.md` (this file)

### Modified Files
1. `/src/app/page.tsx` - Added filter state and DocumentFilters component
2. `/src/app/api/documents/route.ts` - Added search and createdBy params
3. `/src/lib/db/queries/documents.ts` - Added search and createdBy filter logic

---

## Success Criteria (All Met)

- [x] SearchBox component created with debounce
- [x] DocumentFilters component created with all controls
- [x] Documents API updated with search and filter parameters
- [x] getDocuments query function updated with filter logic
- [x] Users API endpoint created
- [x] Dashboard page integrated with filters
- [x] TypeScript compilation passes with no errors
- [x] All imports and exports correct
- [x] Responsive design implemented
- [x] Active filter badges implemented
- [x] Clear all functionality implemented
- [x] Result count indicator implemented
- [x] Smart empty states implemented

---

## Next Steps (Manual Testing Required)

1. Start dev server: `npm run dev`
2. Login with test credentials (username: `ning`, password: `password123`)
3. Navigate to dashboard (should be default page)
4. Follow testing checklist above
5. Report any issues or unexpected behavior

---

## Notes for Reviewers

- All components follow existing project patterns
- TagFilter component is reused (no duplication)
- Filter state is managed at dashboard level
- API queries are optimized (single query with multiple filters)
- Debounced search prevents excessive API calls
- No breaking changes to existing functionality
- TypeScript types are fully specified
- Code follows project style guidelines

---

**Implementation Time:** ~2 hours
**Lines of Code Added:** ~450
**Files Created:** 4
**Files Modified:** 3
