# Bug Report: Template Selector State Not Persisting

**Bug ID:** BUG-001
**Severity:** 🔴 CRITICAL
**Priority:** P0 (Blocks entire workflow)
**Status:** 🔴 OPEN
**Reported:** January 8, 2026
**Reporter:** Agent 3 (Comprehensive Testing)

---

## Summary

The TemplateSelector component in the prompt generation page does not persist user selections. When a user selects a template from the dropdown, the selection immediately reverts to "Select a template...", preventing the Generate button from being enabled and blocking the entire prompt generation workflow.

---

## Impact

### User Impact
- ❌ Users cannot generate prompts from knowledge entries
- ❌ Users cannot generate prompts from documents
- ❌ Users cannot create or update system prompts
- ❌ Entire prompt generation feature is unusable

### Business Impact
- 🔴 **CRITICAL:** Core feature completely broken
- 📉 **Adoption:** Users cannot use primary workflow
- ⏱️ **Time Loss:** All testing blocked

---

## Environment

- **URL:** http://localhost:3000/prompts/generate
- **Component:** `/src/components/prompts/TemplateSelector.tsx`
- **Parent:** `/src/app/prompts/generate/page.tsx`
- **Node.js:** v22.19.0
- **Next.js:** 16 (development mode)
- **Browser:** Chrome (via automation)

---

## Reproduction Steps

### Minimal Reproduction

1. Navigate to `http://localhost:3000/prompts/generate`
2. Scroll to "Template Type" dropdown
3. Click on the dropdown
4. Select "Default Prompt Generation"
5. **Observe:** Dropdown immediately reverts to "Select a template..."
6. **Result:** Generate button remains disabled

### Expected Behavior
- Template selection should persist
- Dropdown should show "Default Prompt Generation"
- Generate button should become enabled (along with other requirements)

### Actual Behavior
- Template selection does not persist
- Dropdown reverts to "Select a template..."
- Generate button remains disabled
- No error messages displayed to user

---

## Technical Analysis

### Component Code

**TemplateSelector.tsx (lines 43-55):**
```typescript
<select
  value={value}                              // ✅ Correct: controlled component
  onChange={(e) => onChange(e.target.value)} // ✅ Correct: calls parent handler
  disabled={disabled || loading}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg..."
>
  <option value="">
    {loading ? 'Loading templates...' : 'Select a template...'}
  </option>
  {templates.map((template) => (
    <option key={template.id} value={template.templateType || template.name}>
      {template.name}
    </option>
  ))}
</select>
```

**Parent Component (page.tsx):**
```typescript
// Line 15: State definition
const [templateType, setTemplateType] = useState('');

// Lines 298-301: Component usage
<TemplateSelector
  value={templateType}           // ✅ Correct: passes state
  onChange={setTemplateType}     // ✅ Correct: passes setter
/>

// Lines 144-147: Validation (blocks generation)
if (!templateType) {
  setError('Please select a template type');
  return;
}
```

### Root Cause Hypotheses

#### Hypothesis 1: Fast Refresh State Reset ⭐ MOST LIKELY
**Evidence:**
- Console logs show frequent Fast Refresh events:
  ```
  [Fast Refresh] rebuilding
  [Fast Refresh] done in 641ms
  ```
- Dev server is hot-reloading components repeatedly
- State may be resetting on each reload

**Test:** Run production build to isolate dev-only issues
```bash
npm run build
npm start
```

#### Hypothesis 2: React State Update Not Triggering
**Evidence:**
- JavaScript workaround successfully set DOM value
- React onChange events were dispatched
- But React state (`templateType`) was not updated

**Possible Causes:**
- Parent component remounting
- useState setter being overwritten
- Stale closure capturing old state

**Test:** Add debug logging:
```typescript
const [templateType, setTemplateType] = useState('');

const handleTemplateChange = (value: string) => {
  console.log('[Template] onChange called with:', value);
  setTemplateType(value);
  console.log('[Template] setState called, value should be:', value);
};

// In render:
useEffect(() => {
  console.log('[Template] templateType state is now:', templateType);
}, [templateType]);
```

#### Hypothesis 3: TemplateSelector Internal State Conflict
**Evidence:**
- TemplateSelector has its own `templates` state (line 15)
- Fetches templates independently via useEffect (lines 18-34)

**Possible Issue:**
- Race condition between parent state and child fetch
- Template value mismatch (templateType vs name)

**Test:** Log template options:
```typescript
useEffect(() => {
  console.log('[TemplateSelector] Templates loaded:', templates);
  console.log('[TemplateSelector] Current value:', value);
  const match = templates.find(t => (t.templateType || t.name) === value);
  console.log('[TemplateSelector] Matched template:', match);
}, [templates, value]);
```

#### Hypothesis 4: Database Template Type Mismatch
**Evidence:**
```sql
SELECT name, template_type FROM prompt_templates WHERE category = 'generation';
-- Result: "Default Prompt Generation" has empty template_type
```

**Issue:**
- Option value uses: `template.templateType || template.name`
- For "Default Prompt Generation": value = "Default Prompt Generation" (name)
- Parent state expects: ??? (unclear if using name or templateType)

**Test:** Verify what value is expected:
```typescript
// In handleGenerate
console.log('[Generate] templateType state:', templateType);
console.log('[Generate] Looking for template with:', templateType);
```

---

## Debugging Steps

### Step 1: Enable Verbose Logging

Add to `/src/app/prompts/generate/page.tsx`:
```typescript
// After line 15
const [templateType, setTemplateType] = useState('');

useEffect(() => {
  console.log('[Prompt Gen] templateType changed to:', templateType);
}, [templateType]);

const handleTemplateChange = useCallback((value: string) => {
  console.log('[Prompt Gen] handleTemplateChange called with:', value);
  setTemplateType(value);
  console.log('[Prompt Gen] setTemplateType called');
}, []);
```

Update TemplateSelector call:
```typescript
<TemplateSelector
  value={templateType}
  onChange={handleTemplateChange} // Use the debug wrapper
/>
```

### Step 2: Test in Production Build

```bash
# Build production version
npm run build

# Start production server
npm start

# Test at http://localhost:3000/prompts/generate
```

If it works in production:
- Issue is dev-only (Fast Refresh)
- Consider disabling Fast Refresh for this page

If it still fails in production:
- Issue is in component logic
- Proceed to Step 3

### Step 3: Verify Template Value Matching

```typescript
// In TemplateSelector.tsx after line 36
const selectedTemplate = templates.find(t => (t.templateType || t.name) === value);

useEffect(() => {
  console.log('[TemplateSelector] Debug Info:', {
    currentValue: value,
    templates: templates.map(t => ({
      name: t.name,
      templateType: t.templateType,
      optionValue: t.templateType || t.name
    })),
    selectedTemplate,
    isSelected: selectedTemplate !== undefined
  });
}, [value, templates, selectedTemplate]);
```

### Step 4: Check Component Mounting

```typescript
// In page.tsx
useEffect(() => {
  console.log('[Prompt Gen] Component mounted');
  return () => {
    console.log('[Prompt Gen] Component unmounting!');
  };
}, []);
```

If you see frequent unmount/remount:
- Parent is causing unnecessary rerenders
- Use React.memo or useMemo

---

## Potential Fixes

### Fix 1: Use useCallback for onChange (Recommended)

```typescript
// In page.tsx, replace line 15-16 with:
const [templateType, setTemplateType] = useState('');

const handleTemplateChange = useCallback((value: string) => {
  console.log('[Template] Setting to:', value); // Debug log
  setTemplateType(value);
}, []);

// Update TemplateSelector call:
<TemplateSelector
  value={templateType}
  onChange={handleTemplateChange}
/>
```

### Fix 2: Ensure Template Type Consistency

```sql
-- Update database to ensure all templates have template_type
UPDATE prompt_templates
SET template_type = 'default'
WHERE name = 'Default Prompt Generation' AND template_type IS NULL;
```

Then update component to always use `template_type`:
```typescript
<option key={template.id} value={template.templateType}>
  {template.name}
</option>
```

### Fix 3: Add Error Boundary

```typescript
// Wrap TemplateSelector in error boundary
<ErrorBoundary fallback={<div>Template selector error. Please refresh.</div>}>
  <TemplateSelector
    value={templateType}
    onChange={setTemplateType}
  />
</ErrorBoundary>
```

### Fix 4: Disable Fast Refresh for This Page

```typescript
// At top of page.tsx
// @refresh reset

export default function PromptGeneratePage() {
  // ... rest of code
}
```

---

## Workaround (Temporary)

Until fixed, developers can set the template programmatically:

```javascript
// In browser console
const selects = document.querySelectorAll('select');
const templateSelect = selects[1];
templateSelect.value = "Default Prompt Generation";

// Trigger React events
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLSelectElement.prototype, "value"
).set;
nativeInputValueSetter.call(templateSelect, "Default Prompt Generation");

const inputEvent = new Event('input', { bubbles: true });
templateSelect.dispatchEvent(inputEvent);
const changeEvent = new Event('change', { bubbles: true });
templateSelect.dispatchEvent(changeEvent);
```

**Note:** This workaround does NOT work - React state still not updated.

---

## Testing Checklist

After implementing fix:

- [ ] Template selection persists after clicking
- [ ] Generate button becomes enabled (with other requirements)
- [ ] Selection survives page scroll
- [ ] Selection survives tab switching (Knowledge ↔ Documents)
- [ ] Works in development mode
- [ ] Works in production build
- [ ] Works with all 5 templates
- [ ] Works when updating existing prompts
- [ ] No console errors
- [ ] No React warnings

---

## Related Files

**Primary:**
- `/src/components/prompts/TemplateSelector.tsx`
- `/src/app/prompts/generate/page.tsx`

**Database:**
- Table: `prompt_templates`
- Column: `template_type` (some values are NULL)

**Testing:**
- `/docs/AGENT3_PROMPT_TESTING_RESULTS.md`

---

## References

- React Controlled Components: https://react.dev/reference/react-dom/components/select
- Fast Refresh: https://nextjs.org/docs/architecture/fast-refresh
- useState Hook: https://react.dev/reference/react/useState
- useCallback Hook: https://react.dev/reference/react/useCallback

---

**Status:** 🔴 OPEN - Awaiting fix
**Next Action:** Developer to debug with logging (Step 1)
**ETA:** Unknown (requires debugging session)

---

## Update Log

| Date | Update |
|------|--------|
| 2026-01-08 | Bug reported by Agent 3 during comprehensive testing |
