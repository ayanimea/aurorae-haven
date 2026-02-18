# Template Type Migration - Testing Guide

## What Was Fixed

**Issue**: All routine templates were appearing as "tasks" in the Library UI and could not be updated properly.

**Root Cause**: IndexedDB contained corrupted template data - routine templates were stored with `type: "task"` instead of `type: "routine"`.

**Solution**: Automatic migration utility that detects and fixes corrupted template types on Library page load.

## How to Test

### 1. Open the Application

Navigate to the Library tab in your browser.

### 2. Check the Browser Console

Open Developer Tools (F12) and look for migration logs:

**If templates were corrupted, you'll see:**
```
[TemplateMigration] Diagnosing 22 templates...
[TemplateMigration] Corrupted: routine-morning-launch - stored as "task", should be "routine"
[TemplateMigration] Corrupted: routine-pomodoro - stored as "task", should be "routine"
...
[TemplateMigration] Diagnostic complete: 12 correct, 10 corrupted, 0 missing
[TemplateMigration] Fixing 10 corrupted templates...
[TemplateMigration] Fixed: Morning Launch Routine (task → routine)
[TemplateMigration] Fixed: Pomodoro Work Session (task → routine)
...
[TemplateMigration] Fix complete: 10 fixed, 0 errors
[Library] Fixed 10 corrupted templates
```

**If no corruption, you'll see:**
```
[TemplateMigration] Diagnosing 22 templates...
[TemplateMigration] Diagnostic complete: 22 correct, 0 corrupted, 0 missing
```

### 3. Check the Toast Notification

If templates were fixed, you should see a toast notification:
```
Fixed 10 templates with incorrect types
```

### 4. Verify Routines Section

In the Library page, you should now see:

**Routines Section:**
- Morning Launch Routine
- Deep Focus Work Session
- Pomodoro Work Session
- Evening Wind Down
- Quick Reset
- Creative Warm-Up
- Weekly Review
- Cleaning Routine
- Litter Boxes Routine
- Work Review

**Tasks Section:**
- Morning Review
- 30-Minute Exercise
- Meal Prep
- Code Review
- Journal Entry
- Reading Session
- Water Plants
- File Papers
- Do Laundry
- Wash Dishes
- Pet Care
- Make Calls

### 5. Test Editing a Routine

1. Click "Edit" on any routine template
2. The Template Editor should open with all routine fields visible (steps, duration, etc.)
3. Make a change and save
4. Template should update successfully

### 6. Test Using a Routine

1. Click "Use" on any routine template
2. You should see toast: "Template applied — Routine created"
3. Navigate to the Routines tab
4. The routine should appear in your routines list (not in Tasks)

## What the Migration Does

### Diagnostic Phase
1. Loads all templates from IndexedDB
2. Compares each against predefined templates
3. Identifies mismatches in `type` field
4. Reports: correct count, corrupted count, missing count

### Fix Phase
1. For each corrupted template:
   - Look up the correct type from predefined template
   - Update the template in IndexedDB with correct type
   - Log the fix (old type → new type)
2. Report success/error counts

### Safety Features
- **Idempotent**: Safe to run multiple times
- **Non-destructive**: Only updates the `type` field
- **Preserves data**: All other template fields remain unchanged
- **Automatic**: Runs on Library page load when needed
- **User-friendly**: Shows toast notification when fix is applied

## Troubleshooting

### Migration doesn't run
- Check console for errors
- Verify IndexedDB is available in browser
- Try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### Templates still appear in wrong section
- Check console logs - migration may have failed
- Clear IndexedDB: Dev Tools → Application → IndexedDB → Delete database
- Refresh page to reseed templates

### "Failed to fix X templates" in console
- Check console for specific error messages
- Some templates may have been manually created with invalid data
- Report the error for investigation

## Technical Details

### Files Modified
- `src/utils/templateMigration.js` - New migration utility
- `src/pages/Library.jsx` - Integrated auto-migration on load

### Migration Sequence
```
Library.jsx load:
  1. Check IndexedDB available
  2. Seed predefined templates (if needed)
  3. Run template type migration (if needed) ← NEW
  4. Load all templates
  5. Display templates
```

### Migration Functions

**`diagnoseTemplateTypes()`**
- Returns: `{ total, correct, corrupted[], missing[] }`
- Compares stored vs predefined template types

**`fixCorruptedTemplateTypes()`**
- Returns: `{ fixed, errors[], details[] }`
- Updates corrupted templates with correct types

**`needsTemplateMigration()`**
- Returns: `boolean`
- Quick check to avoid unnecessary work
