# Template Update Debugging Guide

## Issue: Templates Cannot Be Updated

User reported that templates in the Library cannot be updated.

## Changes Made

### 1. Diagnostic Logging (Commit 31da54b)

Added comprehensive logging to track the entire update flow:

**In `templatesManager.js` - `updateTemplate()` function:**

- Logs when update starts (template ID and update data)
- Logs existing template retrieved from IndexedDB
- Logs merged template data before validation
- Logs validation results (pass/fail with specific errors)
- Logs IndexedDB save operation results

**In `TemplateEditor.jsx`:**

- Logs when editor opens with full template object
- Logs form data when submit button clicked
- Logs validation failures
- Logs template data passed to onSave callback

### 2. Bug Fix: convertToNumberOrNull (Commit faafcc5)

Fixed a bug where the number `0` was being converted to `null`:

**Problem:**

```javascript
// Old code
if (value && value !== '') {
  // BUG: 0 is falsy!
  return Number(value)
}
return null
```

When `value` is `0`, the condition `value && value !== ''` is false because `0` is falsy in JavaScript. This would incorrectly convert:

- `dueOffset: 0` → `null`
- `duration: 0` → `null`

**Solution:**

```javascript
// New code
if (value === undefined || value === null || value === '') {
  return null
}
if (typeof value === 'number') {
  return Number.isNaN(value) ? null : value
}
return Number(value)
```

Now explicitly checks for truly empty values and handles existing numbers correctly.

## How to Diagnose the Issue

### Step 1: Open Browser Console

1. Open the application in your browser
2. Press F12 (or Cmd+Option+I on Mac) to open Developer Tools
3. Go to the Console tab
4. Clear existing logs

### Step 2: Try to Edit a Template

1. Open **Settings** from the main navigation
2. Go to the **Template Library** section (or navigate to `/library` directly)
3. Click "Edit" on any template
4. Observe console output - should see:

   ```text
   [TemplateEditor] TemplateEditor opened with template: {id: '...', type: '...', ...}
   ```

### Step 3: Save Changes

1. Make any change to the template (e.g., change title)
2. Click "Save"
3. Watch the console for the update flow

### Expected Success Flow

If the update works correctly, you should see:

```text
[TemplateEditor] Form submitted with data: {...}
[TemplateEditor] Calling onSave with template data: {...}
[TemplatesManager] Updating template routine-morning-launch {updates...}
[TemplatesManager] Existing template: {full template object}
[TemplatesManager] Updated template (before validation): {merged object}
[TemplatesManager] Validation passed, saving template routine-morning-launch
[TemplatesManager] Successfully updated template routine-morning-launch
```

Then you should see a toast notification: "Template updated"

### Failure Scenarios

#### Scenario 1: Validation Failure

If validation fails, you'll see:

```text
[TemplatesManager] Validation failed for template X: ["error message 1", "error message 2"]
[TemplatesManager] Template data that failed validation: {problematic object}
```

**What to check:**

- Look at the validation error messages
- Compare the "Template data that failed validation" object with the expected structure
- Common issues:
  - `type` field missing or invalid
  - `title` field missing or empty
  - For routines: `steps` must be an array with valid step objects
  - Numeric fields must be numbers (not strings)

#### Scenario 2: Template Not Found

If the template doesn't exist in IndexedDB:

```text
[TemplatesManager] Template routine-XXX not found in IndexedDB
```

**What this means:**

- The template ID in the editor doesn't match any template in storage
- Possible after data corruption or migration issues

#### Scenario 3: IndexedDB Failure

If IndexedDB save fails:

```text
[TemplatesManager] Failed to save template X: {error object}
```

**What to check:**

- Browser IndexedDB quota/permissions
- IndexedDB database corruption
- Browser compatibility issues

#### Scenario 4: Form Doesn't Submit

If clicking "Save" doesn't trigger any logs:

```text
[TemplateEditor] Form submitted with data: {...}
[TemplateEditor] Form validation failed  // <-- Stops here
```

**What this means:**

- Client-side form validation is rejecting the input
- Check the UI for red error messages under form fields
- Common issues:
  - Title is empty
  - Required fields are missing
  - For routines: No steps added

## Common Issues and Solutions

### Issue: "Template type is required" or "Template type must be one of: task, routine"

**Cause:** The `type` field is missing or has an invalid value.

**Solution:**

1. Check the console log: "TemplateEditor opened with template"
2. Verify the template object has a `type` field
3. Verify `type` is either `"task"` or `"routine"`
4. If corrupted, use the migration utility (already implemented) to fix

### Issue: Numeric validation errors

**Cause:** Numeric fields like `estimatedDuration` or `step.duration` are strings instead of numbers.

**Solution:**

- The `convertToNumberOrNull` fix should handle this
- If still failing, check the "Template data that failed validation" log
- Look for fields that should be numbers but are shown as strings

### Issue: Steps validation failure for routines

**Cause:** Routine templates must have at least one step, and each step must have a `label`.

**Solution:**

1. Check if `steps` is an empty array
2. Check if any step is missing the `label` field
3. Ensure step `duration` values are numbers (or null)

## Testing Checklist

Please test the following scenarios and report results:

### Test 1: Edit Task Template

- [ ] Open Library tab
- [ ] Click "Edit" on any task template
- [ ] Change the title
- [ ] Click "Save"
- [ ] Share console logs
- [ ] Verify: Does it show "Template updated" toast?
- [ ] Verify: Is the title changed when you re-open the editor?

### Test 2: Edit Routine Template

- [ ] Open Library tab
- [ ] Click "Edit" on any routine template
- [ ] Change the title
- [ ] Click "Save"
- [ ] Share console logs
- [ ] Verify: Does it show "Template updated" toast?
- [ ] Verify: Is the title changed when you re-open the editor?

### Test 3: Edit Routine Steps

- [ ] Open Library tab
- [ ] Click "Edit" on routine template
- [ ] Modify a step (change label or duration)
- [ ] Click "Save"
- [ ] Share console logs
- [ ] Verify: Are changes saved?

### Test 4: Edit with Zero Values

- [ ] Open Library tab
- [ ] Click "Edit" on task template
- [ ] Set "Due date offset (days)" to 0
- [ ] Click "Save"
- [ ] Share console logs
- [ ] Verify: Is it saved as 0 (not null)?

## Next Steps

1. Run the tests above
2. Share the console logs from the update attempts
3. Report which specific scenario is failing
4. Include any error messages from the console or UI

The diagnostic logging will reveal exactly where and why the update is failing, allowing us to implement a targeted fix.
