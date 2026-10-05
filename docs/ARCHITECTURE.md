# Architecture

Aurorae Haven is a client-side React application built with Vite. This page is a short map to the code that is active today; it avoids fixed line counts because those change frequently.

## Application flow

1. `src/index.jsx` creates the browser router and mounts the app.
2. `RoutineRunnerProvider` keeps routine execution state available across routes.
3. `CategoryWorkspaceProvider` shares the selected category workspace with the layout and pages.
4. `Layout` renders app navigation and the workspace navigation.
5. Route components render the feature pages under `src/pages/`.

## Shared category workspaces

- `src/contexts/CategoryWorkspaceContext.jsx` exposes the categories, active workspace, and item-matching function.
- `src/hooks/useCategories.js` manages category creation and rename actions.
- `src/utils/categoryStorage.js` persists category definitions and the default category.
- `src/utils/itemCategories.js` normalizes multi-category assignments and checks whether an item belongs in a workspace.
- `src/utils/categoryManager.js` propagates a rename through browser storage.
- `src/utils/categoryImport.js` migrates legacy imported records without category data.
- `src/utils/categoryThemes.js` validates and persists category-to-built-in-theme IDs; template definitions and original SVG backgrounds ship with the app.
- `src/components/common/CategoryMultiSelect.jsx` provides the shared accessible assignment control.

Categories are shared across Tasks, Notes, Habits, Routines, Schedule, Stats, and Library. **Uncategorised** is the default and exclusive category. Legacy imports with missing categories use **Unassigned**; those items remain visible in every named workspace.

Category themes are presentation-only. The active category selects a built-in theme on the document root; the **All** workspace clears that override. JSON backups contain only category-to-theme IDs, and import ignores unknown IDs.

## Feature code

- Pages: `src/pages/`
- Reusable UI: `src/components/`
- State hooks: `src/hooks/`
- Domain and storage utilities: `src/utils/`
- Tests: `src/__tests__/`

Tasks and Notes persist in local storage. Routines, Habits, Schedule events, Stats, and Library templates use IndexedDB. Shared category definitions and the selected workspace are kept in local storage. The exact storage behavior is owned by the corresponding utilities; do not assume every feature uses the same backend.

## Import and export

- App-wide JSON backup logic is in `src/utils/exportData.js` and `src/utils/importData.js`.
- `src/utils/indexedDBManager.js` exports and imports IndexedDB records and includes browser-local data needed for compatibility.
- `src/utils/categoryImport.js` fills in missing category assignments and collects category names before imported data is saved.
- Notes also support Markdown import/export through the Notes interface.

When adding a stored item type, update its import/export and category-rename paths, and add a regression test for both category preservation and old records with no category.

## Testing

Run the existing checks from the repository root:

```bash
npm test
npm run lint
npm run build
```

For faster feedback, pass a test file path to `npm test -- <path>`.
