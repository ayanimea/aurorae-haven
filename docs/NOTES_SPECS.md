# Notes and Brain Dump

This page describes the current Notes features. It is a concise guide for using and maintaining them.

## Quick use

1. Choose **All** or a category in the workspace navigation.
2. Create a note or select one from the note list.
3. Write in the Markdown editor. The preview shows formatted content.
4. Use **New sub-note** to create a note linked to the current note.

You can also drag one note onto another to nest it. Deleting a parent note moves its direct sub-notes to the parent's level.

## Categories and sub-notes

- Notes use the same categories as Tasks, Habits, Routines, Schedule, Stats, and Library.
- Create and rename categories in **Settings**. Up to six custom categories can be created.
- A note can have several categories.
- **Uncategorised** is the default and must be selected on its own.
- Notes without a category remain visible in every category workspace.
- A legacy backup imported without category data is updated with the **Unassigned** category.
- Sub-notes inherit the parent note's categories.

## Writing and organizing

- The editor supports Markdown, a live preview, and LaTeX math.
- Use a `[TOC]` marker to show a table of contents for note headings.
- Use `[[Note title]]` syntax for wiki-style links.
- Notes support attachments, version history, and templates.
- Use the note actions to lock, delete, export, or view details.

## Import and export

- Import or export one note as Markdown from the Notes interface.
- Export notes to OpenDocument Text (ODT); multiple notes can be exported together.
- Use the app-wide JSON backup controls to move or restore all app data, including categories.
- Imported notes are stored in the browser. The app does not upload them to a cloud service.

## Accessibility and ease of use

- Use the editor, preview, note list, and category controls with the keyboard.
- Note controls provide text labels for assistive technology.
- Include descriptive alternative text for images and meaningful link text.
- Notes can be categorized from the editor; sub-notes follow their parent's categories.

This guide does not claim that every app flow has been independently certified against WCAG. Report any barrier that makes the editor difficult to use.

## Code and tests

- Notes page and editor: `src/pages/Notes.jsx`, `src/components/Notes/NoteEditor.jsx`
- Note state and storage: `src/hooks/useNotesState.js`, `src/utils/notes/noteOperations.js`
- Shared category logic: `src/utils/itemCategories.js`
- Tests: `src/__tests__/Notes.test.js`, `src/__tests__/categoryImport.test.js`, `src/__tests__/dataManager.test.js`
