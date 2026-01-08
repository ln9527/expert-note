# Knowledge & Document Management Improvements - Implementation Plan

**Date:** January 8, 2026
**Priority:** HIGH (UX improvements for scaling)
**Estimated Effort:** 4-6 hours
**Complexity:** Medium-High (multiple interconnected features)

---

## 🎯 **Requirements Summary**

### **Issue 1: Tag Inheritance in Knowledge Extraction**
**Problem:** Extracted knowledge entries don't inherit tags from source documents
**Impact:** Users must manually add tags to every knowledge entry
**Solution:** Auto-copy document tags to knowledge entry during extraction

### **Issue 2: Knowledge List View**
**Problem:** Card view doesn't scale well (screenshot shows inefficiency)
**Impact:** Hard to scan/compare when you have 20+ entries
**Solution:** Convert to table view like documents page

### **Issue 3: Document Search & Filters**
**Problem:** Documents table has no search or filters (screenshot shows basic table)
**Impact:** Hard to find specific documents when you have 50+
**Solution:** Add fuzzy search + tag filter + user filter + status filter

---

## 🏗️ **Architecture Changes Required**

### **Part 1: Tag Inheritance (Simplest)**

#### **Backend Change:**
**File:** `/src/app/api/knowledge/extract/route.ts`

**Current (line ~83):**
```typescript
// Use document tags if no custom tags provided
const entryTagIds: number[] = tagIds || document.tags.map(t => t.id);
```

**This already exists!** Check if it's actually working.

**If not working, ensure:**
1. Document tags are fetched with document
2. Tag IDs are passed to `createKnowledgeEntry()`
3. Tags are saved to `knowledge_tags` junction table

**Effort:** 15 minutes (verify + test)

---

### **Part 2: Knowledge List → Table View**

#### **Design Specifications:**

**Current:** Card grid (3 columns, lots of whitespace)

**New:** Responsive table with columns:

| Column | Width | Content | Sortable |
|--------|-------|---------|----------|
| **Source** | 30% | "Extracted from: {document}" + background preview | ✓ |
| **Tags** | 20% | Tag pills (max 3 visible, +N more) | ✓ Filter |
| **Annotations** | 15% | Badge counts (5 macro, 3 meso, 2 micro) | ✓ |
| **Created** | 15% | Date (Jan 8, 2026) | ✓ |
| **Updated** | 15% | Date | ✓ |
| **Actions** | 5% | View, Edit, Delete buttons | - |

**Mobile:** Stack columns, show most important first

#### **Components to Create:**

1. **KnowledgeTable.tsx** (NEW) - Main table component
2. **KnowledgeTableRow.tsx** (NEW) - Individual row
3. **ViewModeToggle.tsx** (NEW) - Switch between table/card view
4. **TableSortHeader.tsx** (REUSABLE) - Sortable column headers

#### **State Management:**

```typescript
const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
const [sortColumn, setSortColumn] = useState<'created' | 'updated' | 'source'>('created');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
```

**Effort:** 3-4 hours

---

### **Part 3: Document Search & Filters**

#### **Filter Specifications:**

**Filters Needed:**
1. **Fuzzy Search** - Search in title, filename, content preview
2. **Tag Filter** - Multi-select tags
3. **Status Filter** - raw, annotated, processed
4. **User Filter** - Uploaded by (for multi-user environments)

**UI Layout:**
```
[Documents Page]

Search: [🔍 Search documents...]  Tags: [Filter by tags ▼]  Status: [All Status ▼]  User: [All Users ▼]

[TABLE]
```

#### **Components Needed:**

1. **DocumentFilters.tsx** (NEW) - Filter bar component
2. **SearchBox.tsx** (REUSABLE) - Fuzzy search input
3. **StatusFilter.tsx** (NEW) - Dropdown for status
4. **UserFilter.tsx** (NEW) - Dropdown for users

#### **Backend Support:**

**Current API:** `GET /api/documents`

**Need to support query params:**
```
GET /api/documents?search=methodology&tags=1,2&status=annotated&userId=5
```

**Database Query Enhancement:**
```sql
SELECT d.* FROM documents d
LEFT JOIN document_tags dt ON d.id = dt.document_id
WHERE
  (d.title ILIKE '%methodology%' OR d.content ILIKE '%methodology%')  -- Fuzzy search
  AND dt.tag_id IN (1, 2)                                             -- Tag filter
  AND d.status = 'annotated'                                          -- Status filter
  AND d.user_id = 5                                                   -- User filter
GROUP BY d.id
ORDER BY d.updated_at DESC;
```

**Effort:** 2-3 hours

---

## 📋 **Implementation Plan - 3 Parallel Agents**

### **Agent 1: Tag Inheritance + Knowledge Table** (3 hours)

**Tasks:**
1. Verify/fix tag inheritance in knowledge extraction
2. Create KnowledgeTable component
3. Create KnowledgeTableRow component
4. Add view mode toggle (table/card)
5. Add sorting functionality
6. Update knowledge list page to use table by default
7. Test with 10+ knowledge entries

**Files:**
- `/src/app/api/knowledge/extract/route.ts` (verify tags)
- `/src/components/knowledge/KnowledgeTable.tsx` (NEW)
- `/src/components/knowledge/KnowledgeTableRow.tsx` (NEW)
- `/src/components/knowledge/ViewModeToggle.tsx` (NEW)
- `/src/app/knowledge/page.tsx` (major update)

---

### **Agent 2: Document Search & Filters** (2.5 hours)

**Tasks:**
1. Create DocumentFilters component
2. Add fuzzy search box
3. Add tag filter (multi-select)
4. Add status filter dropdown
5. Add user filter dropdown
6. Update documents API to support filters
7. Add filter state management to documents page
8. Test all filter combinations

**Files:**
- `/src/components/documents/DocumentFilters.tsx` (NEW)
- `/src/components/common/SearchBox.tsx` (NEW, reusable)
- `/src/app/api/documents/route.ts` (add query params)
- `/src/app/page.tsx` (dashboard - add filters)
- `/src/lib/db/queries/documents.ts` (update query)

---

### **Agent 3: Testing & Verification** (1 hour)

**Tasks:**
1. Test tag inheritance (extract → verify tags copied)
2. Test knowledge table view (sort, view toggle)
3. Test document search (fuzzy matching)
4. Test all filter combinations
5. Test with many entries (20+ documents, 20+ knowledge)
6. Document any issues
7. Create user guide for new features

**Deliverables:**
- Test results document
- Bug report if any
- User guide for filters/search

---

## 🎨 **Detailed UI Specifications**

### **Knowledge List Page - Table View**

```
┌─────────────────────────────────────────────────────────────────────┐
│ Knowledge Entries                                [🃏 Card] [📊 Table*] │
│ Browse and search through your captured knowledge                    │
├─────────────────────────────────────────────────────────────────────┤
│ Search: [🔍 Search in content...]  Tags: [Filter by tags▼]          │
│ Statistics: 9 entries | 67 annotations                               │
├─────────────────────────────────────────────────────────────────────┤
│ SOURCE ▲           │ TAGS     │ ANNOTATIONS │ CREATED    │ ACTIONS  │
├────────────────────┼──────────┼─────────────┼────────────┼──────────┤
│ Extracted from:    │ abstract │ 3 macro     │ Jan 8,2026 │ [View]   │
│ test-paper1        │ academic │ 5 meso      │            │ [Edit]   │
│ "This is a test.." │ +1       │ 4 micro     │            │ [Delete] │
├────────────────────┼──────────┼─────────────┼────────────┼──────────┤
│ Extracted from:    │ intro    │ 1 macro     │ Jan 8,2026 │ [View]   │
│ test-paper4.md     │ method   │ 1 meso      │            │ [Edit]   │
│                    │          │ 1 micro     │            │ [Delete] │
└─────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Compact rows (can see 10+ at once)
- Click row → Go to detail page
- Sort by clicking column headers
- Tag pills with +N overflow
- Annotation counts with color indicators
- Action buttons in dropdown (mobile) or inline (desktop)
- Toggle to card view if preferred

---

### **Documents Page - Enhanced Filters**

```
┌─────────────────────────────────────────────────────────────────────┐
│ Documents                                         [+ New Document]   │
├─────────────────────────────────────────────────────────────────────┤
│ [🔍 Search documents...]  [Tags ▼]  [Status ▼]  [User ▼]  [Clear]  │
├─────────────────────────────────────────────────────────────────────┤
│ TITLE ▼        │ STATUS │ ANNOTATIONS │ TAGS     │ UPLOADED BY│ ... │
├────────────────┼────────┼─────────────┼──────────┼────────────┼─────┤
│ test-paper1    │annotd │ 3/5/4       │abstract  │ Ning Li    │ ... │
│                │        │             │academic  │ Jan 6,2026 │     │
└─────────────────────────────────────────────────────────────────────┘
```

**New Components:**
- Search box with debounce (300ms)
- Tag filter (multi-select dropdown)
- Status filter (All, Raw, Annotated, Processed)
- User filter (All Users, Ning Li, etc.)
- Clear all filters button
- Active filter badges

---

## 🔧 **Technical Implementation Details**

### **1. Tag Inheritance Fix**

**Current Code Analysis:**

**File:** `/src/app/api/knowledge/extract/route.ts` (line 83)
```typescript
const entryTagIds: number[] = tagIds || document.tags.map(t => t.id);
```

**This SHOULD work!** But check:
1. Is `document.tags` populated when fetching? (might need JOIN)
2. Are `entryTagIds` actually passed to `createKnowledgeEntry()`?
3. Does `createKnowledgeEntry()` save to `knowledge_tags` junction table?

**Likely Issue:**
```typescript
// Line 154 in extract/route.ts
const entry = await createKnowledgeEntry({
  sourceDocumentId: documentId,
  background: entryBackground,
  tagIds: entryTagIds,  // ← Is this actually being used?
  annotations,
});
```

**Check:** `src/lib/db/queries/knowledge.ts` - Does `createKnowledgeEntry()` accept and save `tagIds`?

**Fix if needed:**
```typescript
export async function createKnowledgeEntry(data: {
  sourceDocumentId: string;
  background: string;
  tagIds: number[];  // ← Ensure this exists
  annotations: AnnotationData[];
}): Promise<KnowledgeEntry> {
  return transaction(async (client) => {
    // 1. Create knowledge entry
    const entry = await client.query(
      `INSERT INTO knowledge_entries (...) VALUES (...) RETURNING *`,
      [...]
    );

    // 2. Save tags to junction table
    for (const tagId of data.tagIds) {
      await client.query(
        `INSERT INTO knowledge_tags (knowledge_id, tag_id) VALUES ($1, $2)`,
        [entry.rows[0].id, tagId]
      );
    }

    return entry.rows[0];
  });
}
```

---

### **2. Knowledge Table Component**

**Component Architecture:**

```tsx
<KnowledgeListPage>
  <PageHeader>
    <ViewModeToggle mode={viewMode} onChange={setViewMode} />
  </PageHeader>

  <FilterBar>
    <SearchBox value={search} onChange={setSearch} />
    <TagFilter tags={allTags} selected={selectedTags} onChange={setSelectedTags} />
  </FilterBar>

  {viewMode === 'table' ? (
    <KnowledgeTable
      entries={filteredEntries}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={handleSort}
      onView={handleView}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  ) : (
    <KnowledgeCardGrid entries={filteredEntries} />  // Existing
  )}
</KnowledgeListPage>
```

**Table Columns:**
```tsx
<thead>
  <tr>
    <SortableHeader column="source" label="Source" onSort={...} />
    <th>Tags</th>
    <SortableHeader column="annotations" label="Annotations" onSort={...} />
    <SortableHeader column="created" label="Created" onSort={...} />
    <SortableHeader column="updated" label="Updated" onSort={...} />
    <th>Actions</th>
  </tr>
</thead>

<tbody>
  {entries.map(entry => (
    <KnowledgeTableRow
      key={entry.id}
      entry={entry}
      onView={() => router.push(`/knowledge/${entry.id}`)}
      onEdit={() => router.push(`/knowledge/${entry.id}/edit`)}
      onDelete={() => handleDelete(entry.id)}
    />
  ))}
</tbody>
```

**Row Design:**
```tsx
<tr className="hover:bg-gray-50 cursor-pointer">
  <td className="py-3 px-4">
    <div className="font-medium text-gray-900">
      Extracted from: {entry.sourceDocument?.filename}
    </div>
    <div className="text-sm text-gray-500 line-clamp-2">
      {entry.background}
    </div>
  </td>
  <td className="py-3 px-4">
    <div className="flex flex-wrap gap-1">
      {entry.tags.slice(0, 3).map(tag => (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100">
          {tag.name}
        </span>
      ))}
      {entry.tags.length > 3 && (
        <span className="text-xs text-gray-500">+{entry.tags.length - 3}</span>
      )}
    </div>
  </td>
  <td className="py-3 px-4">
    <div className="flex gap-2">
      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
        {entry.macroCount} M
      </span>
      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
        {entry.mesoCount} M
      </span>
      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
        {entry.microCount} M
      </span>
    </div>
  </td>
  <td className="py-3 px-4 text-sm text-gray-500">
    {formatDate(entry.createdAt)}
  </td>
  <td className="py-3 px-4 text-sm text-gray-500">
    {formatDate(entry.updatedAt)}
  </td>
  <td className="py-3 px-4">
    <DropdownMenu>
      <MenuItem onClick={onView}>View</MenuItem>
      <MenuItem onClick={onEdit}>Edit</MenuItem>
      <MenuItem onClick={onDelete}>Delete</MenuItem>
    </DropdownMenu>
  </td>
</tr>
```

---

### **3. Document Filters**

#### **Filter UI Design:**

```tsx
<DocumentFiltersBar>
  {/* Search */}
  <div className="flex-1">
    <SearchBox
      placeholder="Search documents..."
      value={searchTerm}
      onChange={setSearchTerm}
      debounce={300}  // Wait 300ms after typing stops
    />
  </div>

  {/* Tag Filter */}
  <TagMultiSelect
    tags={allTags}
    selected={selectedTagIds}
    onChange={setSelectedTagIds}
    placeholder="Filter by tags..."
  />

  {/* Status Filter */}
  <select value={statusFilter} onChange={...}>
    <option value="all">All Status</option>
    <option value="raw">Raw</option>
    <option value="annotated">Annotated</option>
    <option value="processed">Processed</option>
  </select>

  {/* User Filter */}
  <select value={userFilter} onChange={...}>
    <option value="all">All Users</option>
    {users.map(u => (
      <option value={u.id}>{u.displayName}</option>
    ))}
  </select>

  {/* Clear Filters */}
  {hasActiveFilters && (
    <button onClick={clearAllFilters}>
      Clear All
    </button>
  )}
</DocumentFiltersBar>

{/* Active Filter Badges */}
{hasActiveFilters && (
  <div className="flex gap-2 mb-4">
    {searchTerm && (
      <Badge onRemove={() => setSearchTerm('')}>
        Search: "{searchTerm}"
      </Badge>
    )}
    {selectedTagIds.map(tagId => (
      <Badge onRemove={() => removeTag(tagId)}>
        Tag: {getTagName(tagId)}
      </Badge>
    ))}
    {/* ... other active filters */}
  </div>
)}
```

#### **Backend Filter Logic:**

**File:** `/src/lib/db/queries/documents.ts`

**Update `getDocuments()` function:**

```typescript
export async function getDocuments(
  userId: number,
  filters?: {
    search?: string;
    tagIds?: number[];
    status?: string;
    uploadedBy?: number;
    sortBy?: 'title' | 'created' | 'updated';
    sortDir?: 'asc' | 'desc';
  }
): Promise<Document[]> {
  let sql = `
    SELECT DISTINCT d.*,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color))
        FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) as tags,
      u.display_name as uploaded_by_name
    FROM documents d
    LEFT JOIN document_tags dt ON d.id = dt.document_id
    LEFT JOIN tags t ON dt.tag_id = t.id
    LEFT JOIN users u ON d.user_id = u.id
    WHERE d.is_deleted = FALSE
  `;

  const params: any[] = [];
  let paramCount = 0;

  // Fuzzy search
  if (filters?.search) {
    paramCount++;
    sql += ` AND (d.title ILIKE $${paramCount} OR d.filename ILIKE $${paramCount} OR d.content ILIKE $${paramCount})`;
    params.push(`%${filters.search}%`);
  }

  // Tag filter
  if (filters?.tagIds && filters.tagIds.length > 0) {
    paramCount++;
    sql += ` AND dt.tag_id = ANY($${paramCount})`;
    params.push(filters.tagIds);
  }

  // Status filter
  if (filters?.status && filters.status !== 'all') {
    paramCount++;
    sql += ` AND d.status = $${paramCount}`;
    params.push(filters.status);
  }

  // User filter
  if (filters?.uploadedBy) {
    paramCount++;
    sql += ` AND d.user_id = $${paramCount}`;
    params.push(filters.uploadedBy);
  }

  // Group and sort
  sql += ` GROUP BY d.id, u.display_name ORDER BY d.${filters?.sortBy || 'updated_at'} ${filters?.sortDir || 'DESC'}`;

  const result = await query(sql, params);
  return result.rows.map(mapDocumentRow);
}
```

---

## 🔗 **Component Reusability**

### **Common Components to Create:**

1. **SearchBox.tsx** (Reusable)
```tsx
interface SearchBoxProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  debounce?: number;  // Default 300ms
  icon?: React.ReactNode;
}
```

Used in:
- Knowledge list page
- Document list page
- Prompt list page (future)

---

2. **SortableTableHeader.tsx** (Reusable)
```tsx
interface SortableHeaderProps {
  column: string;
  label: string;
  currentSort: string;
  direction: 'asc' | 'desc';
  onSort: (column: string) => void;
}
```

Used in:
- Knowledge table
- Document table
- Future: Prompts table

---

3. **ViewModeToggle.tsx** (Reusable)
```tsx
interface ViewModeToggleProps {
  mode: 'table' | 'card' | 'list';
  onChange: (mode: string) => void;
  options: Array<{ value: string; icon: ReactNode; label: string }>;
}
```

Used in:
- Knowledge list page
- Future: Document list (add card view)
- Future: Prompt list

---

4. **FilterBadge.tsx** (Reusable)
```tsx
interface FilterBadgeProps {
  label: string;
  value: string;
  onRemove: () => void;
}
```

Used in:
- Document filters
- Knowledge filters
- Prompt filters

---

## 📊 **State Management**

### **Knowledge Page State:**

```typescript
// View & sort
const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
const [sortColumn, setSortColumn] = useState('created');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

// Filters (existing)
const [searchTerm, setSearchTerm] = useState('');
const [selectedTags, setSelectedTags] = useState<number[]>([]);

// Data
const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
const [loading, setLoading] = useState(true);
```

### **Documents Page State:**

```typescript
// Filters
const [searchTerm, setSearchTerm] = useState('');
const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
const [statusFilter, setStatusFilter] = useState<string>('all');
const [userFilter, setUserFilter] = useState<number | null>(null);

// Sort (existing in table)
const [sortColumn, setSortColumn] = useState('updated');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

// Data
const [documents, setDocuments] = useState<Document[]>([]);
const [users, setUsers] = useState<User[]>([]);  // For user filter
const [allTags, setAllTags] = useState<Tag[]>([]);  // For tag filter
```

---

## 🎯 **Success Criteria**

### **Issue 1: Tag Inheritance**
- [ ] Extract knowledge from tagged document
- [ ] Verify knowledge entry has same tags
- [ ] Tags display on knowledge list
- [ ] Tags saved to knowledge_tags table

### **Issue 2: Knowledge Table View**
- [ ] Table view displays all knowledge entries
- [ ] Can sort by source, created, updated
- [ ] Can toggle between table and card view
- [ ] View mode preference persists (localStorage)
- [ ] Table is responsive (mobile-friendly)
- [ ] Action buttons work (view, edit, delete)

### **Issue 3: Document Search & Filters**
- [ ] Search box filters by title/content
- [ ] Fuzzy search works (partial matches)
- [ ] Tag filter shows only docs with selected tags
- [ ] Status filter works (raw, annotated, processed)
- [ ] User filter works (uploaded by)
- [ ] Multiple filters combine (AND logic)
- [ ] Clear all filters works
- [ ] Active filter badges display
- [ ] Fast performance (<200ms)

---

## ⚡ **Performance Considerations**

### **Database Indexes Needed:**

```sql
-- For fuzzy search
CREATE INDEX idx_documents_title_trgm ON documents USING gin(title gin_trgm_ops);
CREATE INDEX idx_documents_content_trgm ON documents USING gin(content gin_trgm_ops);

-- For status filter
CREATE INDEX idx_documents_status ON documents(status) WHERE is_deleted = FALSE;

-- For user filter
CREATE INDEX idx_documents_user_id ON documents(user_id) WHERE is_deleted = FALSE;

-- Combined filtering
CREATE INDEX idx_documents_status_user ON documents(status, user_id) WHERE is_deleted = FALSE;
```

**Note:** `gin_trgm_ops` requires PostgreSQL `pg_trgm` extension for trigram matching (fuzzy search).

---

## 📦 **Deliverables**

### **New Components (8)**
1. KnowledgeTable.tsx
2. KnowledgeTableRow.tsx
3. ViewModeToggle.tsx
4. DocumentFilters.tsx
5. SearchBox.tsx (reusable)
6. SortableTableHeader.tsx (reusable)
7. FilterBadge.tsx (reusable)
8. TagMultiSelect.tsx (variant of TagFilter)

### **Updated Components (3)**
1. `/src/app/knowledge/page.tsx` - Add table view + toggle
2. `/src/app/page.tsx` (dashboard) - Add document filters
3. `/src/lib/db/queries/documents.ts` - Add filter support

### **Updated API (2)**
1. `/src/app/api/knowledge/extract/route.ts` - Verify tag inheritance
2. `/src/app/api/documents/route.ts` - Add filter query params

### **Documentation (2)**
1. KNOWLEDGE_TABLE_VIEW_GUIDE.md - How to use table view
2. DOCUMENT_FILTER_GUIDE.md - How to use filters

---

## 🕐 **Timeline**

**Agent 1:** Tag inheritance + Knowledge table (3 hours)
**Agent 2:** Document search & filters (2.5 hours)
**Agent 3:** Testing (1 hour)

**Total:** ~6.5 hours (parallel: ~3.5 hours)

---

## ⚠️ **Potential Issues to Watch**

1. **Performance:** Fuzzy search on large content fields can be slow
   - Solution: Add full-text search indexes
   - Solution: Search title/filename first, content as secondary

2. **Mobile Responsiveness:** Table view can be hard on mobile
   - Solution: Stack columns on small screens
   - Solution: Horizontal scroll for tables
   - Solution: Card view as default on mobile

3. **Tag Filter Complexity:** Multi-select with many tags
   - Solution: Search within tag list
   - Solution: Show popular tags first
   - Solution: Collapse after 5 tags

4. **State Management:** Many filter states to coordinate
   - Solution: Use URL query params
   - Solution: Persist filters in localStorage
   - Solution: Clear all button

---

## 🎯 **Recommended Implementation Order**

### **Phase 1: Quick Win (15 min)**
Fix tag inheritance - verify it works

### **Phase 2: Knowledge Table (3 hours)**
Convert knowledge list to table view with sorting

### **Phase 3: Document Filters (2.5 hours)**
Add comprehensive search and filters to documents page

### **Phase 4: Testing (1 hour)**
Test all features, verify performance

---

**Ready to proceed with implementation using 3 parallel agents?**
