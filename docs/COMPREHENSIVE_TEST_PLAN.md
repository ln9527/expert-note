# Expert-Note System - Comprehensive Test Plan

**Date:** January 8, 2026
**Test Environment:** Local development (http://localhost:3000)
**Test User:** ning / password123
**Test Data Location:** `/test-data/`

---

## Test Strategy

**Approach:** Systematic sequential testing with parallel agent execution
**Coverage:** All major features + edge cases + data integrity
**Documentation:** All issues tracked in `TESTING_ISSUES.md`

---

## Test Data Files

| File | Purpose | Annotations |
|------|---------|-------------|
| `simple-document.md` | Basic functionality test | 3 (1 MACRO, 1 MESO, 1 MICRO) |
| `complex-document.md` | Batch processing test | 15+ (multiple per level) |
| `edge-case-document.md` | Robustness test | Special chars, unicode, edge cases |

---

## Test Execution Plan (Sequential)

### Phase 1: Authentication & Session Management

**Tests:**
1. **Login with valid credentials**
   - User: ning / password123
   - Expected: Redirect to dashboard
   - Verify: User name displays, session persists

2. **Login with invalid credentials**
   - User: wrong / wrong
   - Expected: Error message displayed
   - Verify: No redirect, session not created

3. **Session persistence**
   - Login → Navigate pages → Refresh browser
   - Expected: User remains logged in
   - Verify: iron-session working

4. **Logout**
   - Click logout button
   - Expected: Redirect to login page
   - Verify: Session cleared, cannot access protected pages

**Success Criteria:**
- [ ] Valid login works
- [ ] Invalid login shows error
- [ ] Session persists across navigation
- [ ] Logout clears session

---

### Phase 2: Document Management

**Test 2.1: Create Simple Document**
1. Navigate to "New Document"
2. Upload `test-data/simple-document.md`
3. Verify:
   - [ ] Document appears in dashboard
   - [ ] Status = "annotated" (3 annotations detected)
   - [ ] Annotation counts shown (1/1/1)
   - [ ] Auto-save indicator works

**Test 2.2: Create Complex Document**
1. Upload `test-data/complex-document.md`
2. Verify:
   - [ ] All 15+ annotations detected
   - [ ] Grouped by level correctly
   - [ ] No annotations lost or duplicated

**Test 2.3: Create Edge Case Document**
1. Upload `test-data/edge-case-document.md`
2. Verify:
   - [ ] Special characters don't break parser
   - [ ] Unicode renders correctly
   - [ ] Empty annotations handled gracefully
   - [ ] Very long annotations accepted

**Test 2.4: Document Editing**
1. Edit existing document
2. Add new annotation: `[[MACRO: New test annotation]]`
3. Verify:
   - [ ] Auto-save works
   - [ ] Annotation count updates
   - [ ] Changes persist on reload

**Test 2.5: Document Soft Delete**
1. Click delete on a document from dashboard
2. Verify:
   - [ ] Confirmation modal appears
   - [ ] Document removed from list
   - [ ] Document appears in Trash
   - [ ] `is_deleted = TRUE` in database

**Test 2.6: Document Restore**
1. Go to Trash page
2. Restore deleted document
3. Verify:
   - [ ] Document returns to dashboard
   - [ ] All data intact (content, annotations)
   - [ ] `is_deleted = FALSE` in database

**Test 2.7: Document Permanent Delete**
1. Delete document → Send to trash
2. Go to Trash → Permanent delete
3. Verify:
   - [ ] Confirmation modal appears
   - [ ] Document removed from database
   - [ ] Cannot be restored

---

### Phase 3: Knowledge Extraction (AI-Powered)

**Test 3.1: Extract from Simple Document**
1. Open simple-document in editor
2. Click "Extract Knowledge"
3. Verify:
   - [ ] Extraction succeeds (no errors)
   - [ ] Server logs show: "✓ Using database template"
   - [ ] Server logs show: "✓ AI refinement successful"
   - [ ] NO fallback warning
   - [ ] 3 knowledge items created (1 per annotation)

**Test 3.2: Verify AI Refinement Quality**
1. View extracted knowledge entry
2. Compare original vs refined comments
3. Verify:
   - [ ] Refined ≠ Original (AI actually processed)
   - [ ] Refined comments are enhanced (more detailed)
   - [ ] Document context extracted
   - [ ] "Text referred to" quotes actual document text
   - [ ] Background context populated

**Test 3.3: Extract from Complex Document**
1. Extract knowledge from complex-document.md
2. Verify:
   - [ ] All 15+ annotations processed
   - [ ] Grouped by level (MACRO/MESO/MICRO)
   - [ ] No annotations skipped or merged
   - [ ] Token budget calculated correctly
   - [ ] Extraction completes without timeout

**Test 3.4: Database Template Verification**
1. Check server logs during extraction
2. Verify exact log message:
   - [ ] "[Extraction] ✓ Using database template (user-configurable)"
   - NOT: "[Extraction] ⚠ No database template found"
3. Confirm database template content used (not hardcoded)

**Test 3.5: Custom Instructions**
1. Extract with custom instructions: "Focus on practical applications"
2. Verify:
   - [ ] Custom instructions appended to system prompt
   - [ ] AI output reflects custom guidance
   - [ ] Log shows custom instructions included

**Test 3.6: Fallback Behavior (Simulated)**
1. Temporarily break OpenRouter API (wrong key)
2. Extract knowledge
3. Verify:
   - [ ] Extraction completes (doesn't crash)
   - [ ] Returns original annotations as fallback
   - [ ] Warning message returned in API response
   - [ ] Server logs show: "⚠ AI extraction failed, using fallback"
4. Restore correct API key

---

### Phase 4: Knowledge Management

**Test 4.1: View Knowledge List**
1. Navigate to Knowledge Base
2. Verify:
   - [ ] All extracted entries shown
   - [ ] Counts accurate (annotations per entry)
   - [ ] Tags displayed
   - [ ] Sort/filter works

**Test 4.2: View Knowledge Detail**
1. Click on knowledge entry
2. Verify:
   - [ ] Background context displayed
   - [ ] All annotations shown
   - [ ] Grouped by level (MACRO/MESO/MICRO)
   - [ ] Collapsible sections work
   - [ ] Document context expandable
   - [ ] Source text expandable

**Test 4.3: Edit Knowledge Entry**
1. Click "Edit" on knowledge entry
2. Modify background text
3. Add/remove tags
4. Verify:
   - [ ] Changes save successfully
   - [ ] Updated_at timestamp updates
   - [ ] Changes visible immediately
   - [ ] Version tracking works

**Test 4.4: Download Knowledge as Markdown**
1. Click "Download" button
2. Verify:
   - [ ] File downloads successfully
   - [ ] Filename format: `knowledge-{id}.md`
   - [ ] Contains background section
   - [ ] Annotations grouped by level
   - [ ] Original and refined comments included
   - [ ] Markdown formatting preserved

**Test 4.5: Tag Filtering**
1. Filter knowledge by specific tag
2. Verify:
   - [ ] Only entries with that tag shown
   - [ ] Count updates correctly
   - [ ] Can select multiple tags
   - [ ] Clear filters works

**Test 4.6: Knowledge Soft Delete**
1. Delete knowledge entry from list
2. Verify:
   - [ ] Confirmation modal
   - [ ] Entry moves to trash
   - [ ] Entry removed from main list
   - [ ] Annotations remain in database (soft delete)

---

### Phase 5: Prompt Generation (AI-Powered)

**Test 5.1: Generate with Default Template**
1. Navigate to Prompts page
2. Click "New Prompt"
3. Select knowledge entries
4. Template: "Default Prompt Generation"
5. Purpose: "Academic writing review assistant"
6. Verify:
   - [ ] Generation succeeds
   - [ ] Server logs show: "✓ Using database template"
   - [ ] Generated prompt has proper structure:
     - Role definition
     - Core principles (from MACRO)
     - Patterns (from MESO)
     - Techniques (from MICRO)
   - [ ] Prompt saved to database

**Test 5.2: Generate with Specialized Template**
1. Select template: "Introduction Review Template"
2. Generate prompt
3. Verify:
   - [ ] Template-specific focus applied
   - [ ] Different from default template output
   - [ ] Introduction-focused guidance

**Test 5.3: Generate with Custom Instructions**
1. Add custom instructions: "Focus on clarity and conciseness"
2. Generate prompt
3. Verify:
   - [ ] Custom instructions reflected in output
   - [ ] Logged in server console

**Test 5.4: Download Generated Prompt**
1. Click download on generated prompt
2. Verify:
   - [ ] File downloads as markdown
   - [ ] Contains complete prompt content
   - [ ] Source knowledge IDs tracked

**Test 5.5: Multiple Knowledge Sources**
1. Select 3+ knowledge entries
2. Generate prompt
3. Verify:
   - [ ] All entries processed
   - [ ] Annotations merged correctly
   - [ ] No duplicates
   - [ ] Source traceability maintained

---

### Phase 6: Trash & Restore System

**Test 6.1: View Trash**
1. Navigate to Trash page
2. Verify:
   - [ ] All deleted items shown (documents, knowledge, prompts)
   - [ ] Type filter works (Documents/Knowledge/Prompts)
   - [ ] Deletion timestamps displayed
   - [ ] Empty state shows when no trash

**Test 6.2: Restore Document**
1. Select deleted document
2. Click "Restore"
3. Verify:
   - [ ] Item returns to dashboard
   - [ ] All content intact
   - [ ] Annotations preserved
   - [ ] `is_deleted = FALSE` in DB

**Test 6.3: Restore Knowledge**
1. Restore deleted knowledge entry
2. Verify:
   - [ ] Entry returns to Knowledge Base
   - [ ] Annotations intact
   - [ ] Tags preserved

**Test 6.4: Restore Prompt**
1. Restore deleted prompt
2. Verify:
   - [ ] Prompt returns to list
   - [ ] Content unchanged
   - [ ] Source knowledge links intact

**Test 6.5: Permanent Delete**
1. Delete item from trash (permanent)
2. Verify:
   - [ ] Strong confirmation modal
   - [ ] Item removed from database (hard DELETE)
   - [ ] Cannot be restored
   - [ ] Related data handled correctly

**Test 6.6: Empty Trash**
1. Have multiple items in trash
2. Click "Empty Trash"
3. Verify:
   - [ ] Confirmation modal shows count
   - [ ] All items permanently deleted
   - [ ] Trash page shows empty state
   - [ ] Database rows removed

---

### Phase 7: Settings & Templates

**Test 7.1: View Templates**
1. Navigate to Settings → Prompts
2. Verify:
   - [ ] All templates listed (extraction + generation)
   - [ ] Version numbers shown
   - [ ] Last updated timestamps
   - [ ] Default vs custom marked clearly

**Test 7.2: Edit Extraction Template**
1. Click "Edit" on "Default Knowledge Extraction"
2. Add instruction: "Always prioritize clarity over brevity"
3. Save
4. Verify:
   - [ ] Version increments (v2 → v3)
   - [ ] Updated_at timestamp changes
   - [ ] Changes persist on reload

**Test 7.3: Verify Template Used After Edit**
1. Extract knowledge from a document
2. Check server logs
3. Verify:
   - [ ] "✓ Using database template" appears
   - [ ] Modified template actually used (check AI output)
   - [ ] Custom instruction reflected in extraction

**Test 7.4: Create New Template**
1. Click "New Template"
2. Category: "generation"
3. Template Type: "code-review"
4. Content: Custom prompt for code review
5. Verify:
   - [ ] Template saved
   - [ ] Appears in template list
   - [ ] Can be selected for prompt generation
   - [ ] is_default = FALSE

**Test 7.5: Duplicate Template**
1. Duplicate existing template
2. Modify duplicated version
3. Verify:
   - [ ] New template created with unique ID
   - [ ] Copy includes "(Copy)" in name
   - [ ] Can edit independently

**Test 7.6: Delete Custom Template**
1. Delete non-default template
2. Verify:
   - [ ] Confirmation modal
   - [ ] Template removed from list
   - [ ] Cannot delete default templates (UI prevents it)

---

### Phase 8: Edge Cases & Error Handling

**Test 8.1: Empty Document**
1. Create document with no annotations
2. Try to extract knowledge
3. Verify:
   - [ ] Error message: "Document has no annotations"
   - [ ] Extraction blocked (validation works)
   - [ ] No empty knowledge entry created

**Test 8.2: Malformed Annotations**
1. Create document with: `[[INVALID: test]]`
2. Verify:
   - [ ] Parser ignores invalid levels
   - [ ] OR shows validation error
   - [ ] No crash

**Test 8.3: Very Large Document**
1. Create document with 1000+ lines
2. Add 50+ annotations
3. Extract knowledge
4. Verify:
   - [ ] Token budget calculated correctly
   - [ ] Doesn't exceed API limits
   - [ ] All annotations processed
   - [ ] Performance acceptable (<30 seconds)

**Test 8.4: Concurrent Extractions**
1. Open 2 browser tabs
2. Extract from same document simultaneously
3. Verify:
   - [ ] No race conditions
   - [ ] Both extractions succeed
   - [ ] Data integrity maintained

**Test 8.5: Network Failure Simulation**
1. Stop internet connection mid-extraction
2. Verify:
   - [ ] Graceful error message
   - [ ] No partial data saved
   - [ ] Can retry after reconnection

---

## Test Execution Order

### Sequential Test Groups (Run in order)

1. **Foundation** (Must pass first)
   - Phase 1: Authentication
   - Phase 2: Document CRUD

2. **Core Features** (After foundation)
   - Phase 3: Knowledge Extraction
   - Phase 4: Knowledge Management
   - Phase 5: Prompt Generation

3. **Supporting Features**
   - Phase 6: Trash System
   - Phase 7: Settings & Templates

4. **Robustness**
   - Phase 8: Edge Cases

---

## Parallel Agent Execution Strategy

**Agent 1: Auth + Documents**
- Phase 1 (Auth)
- Phase 2 (Documents)
- ~10 minutes

**Agent 2: Knowledge Extraction**
- Phase 3 (Extraction)
- Phase 4 (Management)
- ~15 minutes

**Agent 3: Prompts + Trash**
- Phase 5 (Prompts)
- Phase 6 (Trash)
- ~15 minutes

**Agent 4: Settings + Edge Cases**
- Phase 7 (Settings)
- Phase 8 (Edge Cases)
- ~10 minutes

**Total estimated time:** ~15 minutes (parallel execution)

---

## Success Metrics

| Category | Total Tests | Must Pass |
|----------|-------------|-----------|
| Authentication | 4 | 4 (100%) |
| Documents | 7 | 7 (100%) |
| Knowledge Extraction | 6 | 5 (83%) |
| Knowledge Management | 6 | 6 (100%) |
| Prompt Generation | 5 | 5 (100%) |
| Trash System | 6 | 6 (100%) |
| Settings | 6 | 6 (100%) |
| Edge Cases | 5 | 3 (60%) |

**Overall Target:** 90%+ pass rate

---

## Issue Tracking

**Document:** `docs/TESTING_ISSUES.md`

**Issue Format:**
```markdown
### Issue #N: [Short Title]
**Severity:** Critical / High / Medium / Low
**Phase:** [Test phase where found]
**Description:** [What went wrong]
**Steps to Reproduce:**
1. Step 1
2. Step 2
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Stack Trace:** [If applicable]
**Screenshots:** [If applicable]
**Status:** Open / Fixed / Won't Fix
```

---

## Critical Verifications

### Database Template Usage
**Check in every AI call:**
```
[Extraction] ✓ Using database template (user-configurable)
[Generation] ✓ Using database template (type: introduction)
```

**If you see:**
```
[Extraction] ⚠ No database template found, using hardcoded default
```
→ **FAIL** - Database templates should always exist after migration

### AI Refinement Success
**Check that refined ≠ original:**
```typescript
// Bad (fallback used)
originalComment: "This is a test"
refinedComment: "This is a test"  // ← SAME!

// Good (AI worked)
originalComment: "This is a test"
refinedComment: "The expert emphasizes..."  // ← DIFFERENT!
```

### No Silent Failures
**Every error should be visible:**
- Backend: console.error with details
- Frontend: User-facing error message or warning banner
- API: Returns error in response body

---

## Pre-Test Checklist

- [x] Database migrations applied (004, 005)
- [x] OpenRouter API key updated
- [x] Dev server running (http://localhost:3000)
- [x] Test data files created
- [x] Individual annotation delete removed
- [ ] PostgreSQL running and accessible
- [ ] Test user exists (ning/password123)
- [ ] Default tags seeded

---

## Post-Test Deliverables

1. **Test Results Summary** - Pass/fail for each phase
2. **Issue Log** - All bugs found in `TESTING_ISSUES.md`
3. **Performance Metrics** - Response times, token usage
4. **Screenshots** - Evidence of key flows working
5. **Recommendations** - Improvements based on testing

---

## Special Focus Areas

### 1. Template System Verification
**Most Critical:** Ensure database templates are actually used, not hardcoded fallbacks

### 2. AI Quality Assessment
**Measure:** How much do refined comments improve over originals?

### 3. Data Integrity
**Verify:** Soft delete doesn't lose data, restore works perfectly

### 4. User Experience
**Check:** Error messages helpful, flows intuitive, no dead ends

---

## Testing Tools

- **Chrome DevTools** - Network tab, Console
- **PostgreSQL** - Query database state
- **Server Logs** - `/tmp/claude/nextjs-dev3.log`
- **Chrome Automation** - Browser interaction agents

---

## Notes

- Test in order (foundation first)
- Document EVERY issue found
- Take screenshots of unexpected behavior
- Check server logs for each AI call
- Verify database state after mutations
