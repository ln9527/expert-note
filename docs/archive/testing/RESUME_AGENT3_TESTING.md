# How to Resume Agent 3 Testing

**Current Status:** 2 critical bugs fixed, testing blocked by session timeout
**Next Tester:** Follow these steps to complete Phase 5 and Phase 6

---

## Quick Start

### Step 1: Fix Session Timeout (REQUIRED)

**File:** `/Users/ningli/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note/src/lib/auth/session.ts`

**Change this line:**
```typescript
ttl: 60 * 3, // 3 minutes (TOO SHORT)
```

**To this:**
```typescript
ttl: 60 * 30, // 30 minutes
```

**Why:** Current 3-minute timeout makes multi-step testing impossible.

### Step 2: Restart Dev Server

```bash
cd /Users/ningli/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note
npm run dev
```

### Step 3: Verify Fixes Applied

Check that previous Agent 3 fixes are present:

1. **JSX Fix:** Verify line 468 in `src/app/knowledge/[id]/page.tsx` has NO comment
2. **Database Fix:** Verify prompt_tags table exists:
   ```bash
   psql -U ningli -d annotservice -c "\dt prompt_tags"
   ```

### Step 4: Run Tests

**Test Credentials:**
- URL: http://localhost:3000
- Username: `ning`
- Password: `password123`

---

## Phase 5: Prompt Generation Tests

### Test 5.1: Default Template Generation

1. Navigate to http://localhost:3000/prompts/generate
2. Fill in form:
   - **Purpose:** "Academic writing review assistant"
   - **Template:** Select "Default Prompt Generation"
   - **Knowledge Entries:** Select 3 entries (any)
3. Click "Generate Prompt"
4. **CRITICAL VERIFICATIONS:**
   - Check server logs: `tail -f /tmp/claude/nextjs-dev3.log`
   - Look for: `"✓ Using database template"`
   - Should NOT see: `"⚠ No database template found"`
5. Verify generated prompt structure:
   - Has role definition
   - Has core principles (MACRO annotations)
   - Has patterns (MESO annotations)
   - Has techniques (MICRO annotations)
6. Save the prompt
7. Verify it appears in `/prompts` list

**Expected Server Logs:**
```
[Generation] ✓ Using database template (type: default)
[Generation] Processing 3 knowledge entries...
[Generation] ✓ AI generation successful
```

### Test 5.2: Introduction Review Template

1. Navigate to /prompts/generate
2. Fill in form:
   - **Purpose:** "Review paper introductions"
   - **Template:** "Introduction Review Template"
   - **Knowledge:** Select entries tagged "introduction"
3. Generate and verify template-specific focus
4. Verify different output than Test 5.1

### Test 5.3: Custom Instructions

1. Navigate to /prompts/generate
2. Fill form as in Test 5.1
3. **Add to "Additional Instructions":**
   ```
   Focus on clarity and conciseness. Prioritize actionable feedback.
   ```
4. Generate
5. **Verify custom instructions reflected in output**
6. Check server logs show custom instructions included

### Test 5.4: Download Prompt

1. From `/prompts` list, click any generated prompt
2. Click "Download" button
3. **Verify downloaded file:**
   - Filename format: `prompt-[id].md`
   - Contains complete prompt content
   - Contains source knowledge IDs
   - Markdown formatting preserved

### Test 5.5: Multiple Knowledge Sources

1. Navigate to /prompts/generate
2. **Select 5+ knowledge entries** from different documents
3. Fill form and generate
4. **Verify:**
   - All entries processed (check annotation count)
   - No duplicates in output
   - Annotations properly grouped by level
   - Source traceability maintained

---

## Phase 6: Trash System Tests

### Prerequisite: Create Deletable Items

Before testing trash, you need items in the trash:

```bash
# Option 1: Use items from Agent 1 testing (may already exist)
# Option 2: Create new test items:
# - Create a test document
# - Extract knowledge from it
# - Generate a prompt
# - Delete all three
```

### Test 6.1: View Trash Page

1. Navigate to http://localhost:3000/trash
2. **Verify page shows:**
   - All deleted items (documents, knowledge, prompts)
   - Type filter buttons work
   - Deletion timestamps displayed
   - Empty state if no items

### Test 6.2: Restore Document

1. From dashboard, delete a test document
2. Go to /trash
3. Find the deleted document
4. Click "Restore"
5. **Verify:**
   - Document returns to dashboard
   - All content intact
   - Annotations preserved
   - Database: `is_deleted = FALSE`

### Test 6.3: Restore Knowledge Entry

1. From /knowledge, delete an entry
2. Go to /trash
3. Click "Restore" on knowledge entry
4. **Verify:**
   - Entry returns to knowledge base
   - Annotations intact
   - Tags preserved
   - Database updated correctly

### Test 6.4: Restore Prompt

1. From /prompts, delete a generated prompt
2. Go to /trash
3. Restore the prompt
4. **Verify:**
   - Prompt returns to list
   - Content unchanged
   - Source knowledge links intact

### Test 6.5: Permanent Delete

1. Delete any item (send to trash)
2. Go to /trash
3. Click "Permanent Delete" on that item
4. **VERIFY STRONG WARNING MODAL:**
   - Clear message about permanent deletion
   - "Are you sure?" confirmation
   - Cannot be undone warning
5. Confirm deletion
6. **Verify:**
   - Item removed from trash
   - Item removed from database (hard DELETE)
   - Cannot be restored

### Test 6.6: Empty Trash

1. Ensure multiple items in trash (3+)
2. Click "Empty Trash" button
3. **VERIFY:**
   - Confirmation modal shows item count
   - Warning about permanent deletion
4. Confirm
5. **Verify:**
   - All items permanently deleted
   - Trash shows empty state
   - Database rows removed

---

## Critical Checks for AI Features

### For EVERY Prompt Generation Test

**Check Server Logs:**
```bash
tail -50 /tmp/claude/nextjs-dev3.log | grep -A5 -B5 "Generation\|template"
```

**Must See:**
- ✅ `"✓ Using database template"`
- ✅ `"✓ AI generation successful"`

**Must NOT See:**
- ❌ `"⚠ No database template found"`
- ❌ `"⚠ AI generation failed, using fallback"`

### Verify Generated Content Quality

**Good Output (AI worked):**
```
# Role
You are an expert academic writing reviewer...

# Core Principles
1. [Expert emphasizes clarity...]  ← REFINED text
2. [Prioritize reader comprehension...]

# Patterns
- When reviewing abstracts... ← MESO guidance
...
```

**Bad Output (Fallback used):**
```
MACRO: Use clear language  ← Just repeating original
MESO: Check structure
MICRO: Fix typos
```

---

## Success Criteria

### Phase 5 (Prompt Generation)
- [ ] 5/5 tests passed
- [ ] Server logs confirm database templates used
- [ ] All generated prompts have proper structure
- [ ] Download functionality works
- [ ] Multiple knowledge sources handled correctly

### Phase 6 (Trash System)
- [ ] 6/6 tests passed
- [ ] Restore works for all entity types
- [ ] Permanent delete shows strong warnings
- [ ] Data integrity maintained throughout
- [ ] Empty trash works correctly

---

## If You Encounter Issues

### Session Still Timing Out?
- Check you actually saved the session.ts file
- Verify server was restarted after the change
- Check session cookie in browser dev tools

### Server Logs Not Showing Template Usage?
- Verify `002_prompt_tags.sql` migration was applied
- Check `/api/prompt-templates?category=generation` returns data
- Verify OpenRouter API key is valid

### Generate Button Not Working?
- Check browser console for errors
- Verify at least 1 knowledge entry selected
- Verify template selected from dropdown

---

## Documentation Requirements

After completing tests, update:

1. **TESTING_ISSUES.md** - Add any new issues found
2. **AGENT3_TEST_RESULTS.md** - Update with actual test results
3. Create **PHASE5_VERIFICATION.md** - Screenshots of server logs showing template usage
4. Create **PHASE6_VERIFICATION.md** - Evidence of successful restore operations

---

## Estimated Time

- Session fix: 5 minutes
- Phase 5 tests: 20 minutes
- Phase 6 tests: 15 minutes
- Documentation: 10 minutes
- **Total: ~50 minutes**

---

## Contact

If you find new issues:
1. Add to `TESTING_ISSUES.md`
2. Include reproduction steps
3. Capture server logs
4. Take screenshots

**Previous Work:**
- Agent 1: Completed Phase 1-2
- Agent 2: Completed Phase 3-4
- Agent 3: Fixed 2 critical bugs, testing blocked

**Your Mission:**
Complete Phase 5 and Phase 6 with full verification of AI template usage and trash system data integrity.

Good luck! 🚀
