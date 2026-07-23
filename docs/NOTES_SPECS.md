# Brain Dump Specifications (TAB-BDP)

This document describes the implementation of Brain Dump specifications for Aurorae Haven.

## Overview

The Brain Dump feature provides a Markdown-based note-taking interface with advanced features for managing thoughts,
ideas, and notes. All features are designed with neurodivergent users in mind, maintaining a calm interface while
providing powerful functionality.

## Implemented Specifications

### TAB-BDP-TOC-01: Table of Contents

**Requirement**: Brain Dump notes shall support an auto-generated table of contents (TOC) that links to headings.

**Implementation**:

- Place a `[TOC]` marker anywhere in a note to have a TOC inserted at that position
- The TOC is generated from all `#`–`######` headings in the note
- In the live preview the TOC renders as a styled `<nav class="note-toc">` block with clickable anchor links
- Each heading in the preview gets a matching `id` attribute so the links resolve correctly
- When exporting to ODT, the `[TOC]` marker is converted to a native
  `<text:table-of-content>` element that word processors (LibreOffice Writer, MS Word)
  can update automatically
- Duplicate heading slugs are disambiguated (e.g. `intro`, `intro-1`, `intro-2`)
- Headings inside fenced code blocks are ignored

**Usage**:

1. When creating a new note, click **+** in the toolbar or sidebar
2. Select a template (the template picker opens automatically)
3. Enable **Include Table of Contents** — a `[TOC]` marker is prepended to the content
4. Alternatively, type `[TOC]` anywhere in an existing note

**Template picker**:

- Five built-in templates: Blank, Daily Journal, Meeting Notes, Project Planning, Brainstorm
- The **Include Table of Contents** checkbox is available for all templates, including Blank
  (it prepends a `[TOC]` marker; in a blank note the TOC will show "No headings found" until
  headings are added)

**Files**:

- `src/utils/notes/tocGenerator.js` — `slugify`, `extractHeadings`, `buildHtmlTocList`, `injectTocHtml`, `injectToc`
- `src/data/noteTemplates.js` — built-in template definitions
- `src/components/Notes/NewNoteModal.jsx` — template selection modal

### TAB-BDP-FIL-01: File Management

**Requirement**: Brain Dump entries shall support local attachments stored in OPFS.

**Implementation**:

- Uses Origin Private File System (OPFS) for secure, private file storage
- Files are stored directly in the browser's private file system
- Supports attachment via file picker
- Files are referenced in the markdown content with size information
- Graceful fallback for browsers without OPFS support

**Usage**:

1. Click the "📎 Attach" button in the toolbar
2. Select a file from your device
3. File is stored in OPFS and reference is inserted into the editor
4. Format: `📎 Attachment: filename.ext (size KB)`

**Browser Support**: Chrome 86+, Edge 86+, Opera 72+ (OPFS-enabled browsers)

### TAB-BDP-BLK-01: Backlinks

**Requirement**: The Brain Dump tab shall provide backlinks and a backlinks panel.

**Implementation**:

- Wiki-style link syntax: `[[link text]]`
- Links are automatically converted to clickable elements in preview
- Backlinks panel shows all links in current document
- Visual styling distinguishes backlinks from regular links
- Keyboard accessible with proper ARIA labels

**Usage**:

1. Use `[[link text]]` syntax in your markdown
2. Links appear as clickable elements in preview
3. Click "🔗 Backlinks" button to view all links in current document
4. Links are styled with dashed underline and hover effects

**Example**:

```markdown
This relates to [[Project Alpha]] and [[Meeting Notes 2024-01]]
```

### TAB-BDP-VSH-01: Version History

**Requirement**: Brain Dump entries shall support version history with diffs and restore.

**Implementation**:

- Automatic version snapshots saved every 5 seconds of inactivity
- Stores last 50 versions in localStorage
- Version history panel shows all saved versions with timestamps
- Diff viewer displays line-by-line changes between versions
- One-click restore to any previous version
- Visual diff with color coding (green for additions, red for removals)

**Usage**:

1. Click "📜 History" button to open version history
2. View list of all saved versions with timestamps and previews
3. Click "View Diff" to see changes between selected version and current
4. Click "Restore" to revert to a previous version
5. Press Escape to close modals

**Keyboard Shortcuts**:

- `Ctrl/Cmd + H`: Open version history

**Storage**: Versions stored in `localStorage` key: `brainDumpVersions`

### TAB-BDP-SAN-01: Sanitisation

**Requirement**: The Markdown renderer shall enforce sanitisation rules and safe links.

**Implementation**:

- Enhanced DOMPurify configuration with strict allow-lists
- Only safe HTML tags and attributes permitted
- External links automatically open in new tab with `rel="noopener noreferrer"`
- JavaScript and data URIs blocked in links
- XSS prevention through sanitization hooks
- Safe handling of user-generated content

**Allowed Tags**:

- Headings: h1, h2, h3, h4, h5, h6
- Text: p, br, hr, strong, em, code, pre, blockquote
- Lists: ul, ol, li
- Links and media: a, img
- Tables: table, thead, tbody, tr, th, td
- Interactive: input (for checkboxes only)

**Forbidden**:

- Scripts: script, style, iframe, object, embed
- Event handlers: onerror, onload, onclick, onmouseover, etc.
- Unsafe URIs: javascript:, data: (in links)

**Link Safety**:

- External HTTP/HTTPS links: Open in new tab with security attributes
- Internal anchors (#): Safe, allowed
- Other protocols: Blocked

### TAB-BDP-ACC-01: Accessibility

**Requirement**: The Brain Dump editor and preview shall include accessibility enhancements.

**Implementation**:

#### Screen Reader Support

- Live region announcements for important state changes
- Descriptive ARIA labels on all interactive elements
- Screen reader-only text for context where needed
- Semantic HTML structure

#### Keyboard Navigation

- Full keyboard support for all features
- Focus management in modals
- Escape key closes modals
- Keyboard shortcuts for common actions

#### Focus Indicators

- Visible focus outlines on all focusable elements
- High contrast focus indicators
- Consistent focus styling across components

#### Semantic Structure

- Proper ARIA roles (dialog, status, article, textbox)
- Multi-line textbox for editor
- Article role for preview with live updates
- Status announcements for operations

#### Keyboard Shortcuts

- `Ctrl/Cmd + S`: Export all notes as markdown (single `.md` for one note, `.zip` for multiple)
- `Ctrl/Cmd + H`: Open version history
- `Escape`: Close modals

#### Screen Reader Announcements

- "Preview updated" when content changes
- "Task marked complete/incomplete" for checkbox changes
- "File [name] attached" when file is attached
- "Version restored" when restoring from history
- "All content cleared" when clearing content
- "Markdown exported" when exporting

#### Accessibility Labels

- Editor: "Markdown editor for brain dump notes"
- Preview: "Markdown preview"
- Each checkbox: "Task checkbox [number]"
- Buttons: Descriptive labels for all toolbar buttons

## Technical Details

### File Structure

```text
src/
├── braindump-enhanced.js     # Core functionality modules
│   ├── configureSanitization()
│   ├── VersionHistory class
│   ├── Backlinks class
│   ├── FileAttachments class
│   └── AccessibilityHelper class
├── braindump-ui.js           # UI integration and event handlers
└── assets/styles/
    └── brain_dump.css        # Styling for new features
```

### Storage Keys

- `brainDumpContent`: Current editor content
- `brainDumpTags`: Tag palette HTML
- `brainDumpVersions`: Version history array
- `brainDumpEntries`: Structured entries (future use)

### Browser Compatibility

- **Core Features**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **OPFS File Attachments**: Chrome 86+, Edge 86+, Opera 72+
- **Graceful Degradation**: Features degrade gracefully when not supported

### Security Considerations

- Content Security Policy (CSP) compliant
- No inline scripts or styles
- DOMPurify sanitization for all user content
- OPFS provides isolated storage
- Safe link handling prevents XSS
- External scripts loaded from CDN with HTTPS

## Testing Recommendations

### Manual Testing Checklist

- [ ] Create notes with various markdown syntax
- [ ] Test backlinks with `[[link]]` syntax
- [ ] Save and restore versions
- [ ] View diffs between versions
- [ ] Attach files (if OPFS supported)
- [ ] Test keyboard navigation
- [ ] Verify screen reader announcements
- [ ] Test with keyboard only (no mouse)
- [ ] Check focus indicators visibility
- [ ] Test modal escape key handling
- [ ] Verify external links open safely
- [ ] Test checkbox interaction
- [ ] Verify content sanitization

### Browser Testing

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Test with OPFS disabled (Firefox)

### Accessibility Testing

- Use screen reader (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- Check color contrast ratios
- Verify focus order
- Test with high contrast mode

## TAB-BDP-IO-01: Import/Export Functionality

**Requirement**: Brain Dump shall support importing and exporting data for backup, transfer, and restore purposes.

**Implementation**:

- Export functionality via "Export" button in application header
- Import functionality via "Import" button with file picker
- Data format: JSON with comprehensive Brain Dump data structure
- Exports include:
  - Current brain dump content (Markdown)
  - Tag palette HTML
  - Version history (all saved versions)
  - Brain dump entries
- Import validates data structure and restores all components
- Page automatically reloads after successful import to reflect changes
- Error handling with user-friendly messages

**Usage**:

1. **Export**: Click "Export" button in header → JSON file downloads automatically
2. **Import**: Click "Import" button → Select previously exported JSON file → Data restores and page reloads

**Data Structure**:

```json
{
  "version": 1,
  "exportedAt": "2025-01-15T12:00:00Z",
  "brainDump": {
    "content": "# Brain Dump Markdown content",
    "tags": "<span class=\"tag\">#idea</span>",
    "versions": [...],
    "entries": [...]
  },
  "tasks": [...],
  "sequences": [...],
  "habits": [...],
  "schedule": [...]
}
```

**Error Handling**:

- Invalid JSON format: "Import failed: Unexpected token..."
- Missing version field: "Import failed: Invalid schema: missing version"
- Corrupt data: Uses defaults for missing/invalid fields

**Security Considerations**:

- No external API calls - all data stays local
- LocalStorage for persistence (respects browser storage limits)
- User explicitly triggers import/export
- No automatic cloud sync

## TAB-BDP-UI-01: Split-Pane Editor Layout

**Requirement**: The Brain Dump editor shall display the markdown editor and preview side-by-side in desktop mode with resizable panes.

**Implementation**:

- **Split-Pane Layout**: Editor and preview displayed side-by-side on desktop (≥768px width)
- **Resizable Divider**: 4px draggable handle between editor and preview panes
- **Width Constraints**: Editor can be resized between 20% and 80% of available width
- **Keyboard Resize**: Arrow Left/Right keys adjust pane width by 5% increments
- **Independent Scrolling**: Both editor and preview scroll independently
- **Scroll Synchronization**: Editor scroll position syncs with preview automatically
- **Smooth Transitions**: Layout changes animate smoothly (0.3s ease transitions)

**Usage**:

1. Editor appears on left, preview on right in desktop mode
2. Drag the resize handle between panes to adjust widths
3. Focus the resize handle (Tab key) and use Arrow Left/Right to adjust
4. Both panes scroll independently with mouse/keyboard
5. Editor scroll automatically syncs preview scroll position

**CSS Classes**:

- `.note-editor-split`: Main container with CSS Grid (3 columns: editor | handle | preview)
- `.editor-pane`: Contains the markdown textarea
- `.preview-pane`: Contains the rendered preview
- `.resize-handle`: Interactive button for resizing panes

**Accessibility**:

- Resize handle is a focusable button with ARIA label
- Keyboard navigation fully supported (Arrow keys for resize)
- Focus outline: 3px solid mint (WCAG 2.2 AA compliant)
- All standard textarea keyboard navigation preserved (arrows, Home, End, PageUp/Down)

**Responsive Behavior**:

- Desktop (≥768px): Side-by-side split view with resizable divider
- Mobile (<768px): Stacked layout (editor above preview)

## TAB-BDP-UI-02: Context Menu

**Requirement**: Notes in the sidebar shall support right-click context menu for quick actions.

**Implementation**:

- Right-click on any note in the sidebar opens context menu
- Context menu displays at cursor position
- Available actions: Export, Lock/Unlock, Delete
- Click outside or press Escape to close menu
- Locked notes cannot be deleted (menu item disabled)

**CSS Classes**:

- `.note-list-sidebar`: Sidebar container for notes list
- `.context-menu`: Right-click menu container
- `.context-menu-item`: Individual menu action buttons

**Accessibility**:

- Proper ARIA roles and labels
- Keyboard accessible (Escape to close)
- Focus management when menu opens/closes

## TAB-BDP-UI-03: Smooth Navigation Transitions

**Requirement**: Navigation between pages shall be smooth without jarring layout shifts.

**Implementation**:

- Container max-width changes smoothly when navigating to/from Brain Dump page
- Brain Dump page uses wider layout (1600px) to accommodate split-pane editor
- Other pages use standard layout (1240px)
- CSS transitions (0.3s ease) on width properties prevent sudden jumps
- Applies to `.shell`, `.card`, and `.brain-dump-container` elements

**Technical Details**:

- Transition duration: 0.3s
- Transition timing: ease function
- Properties transitioned: width, max-width
- No performance impact (GPU-accelerated CSS transitions)

## TAB-BDP-UI-04: CSS Architecture

**Requirement**: Styling shall use consistent, maintainable class-based selectors.

**Implementation**:

- Class-based selectors used throughout (`.preview`, `.editor`, `.note-*`)
- ID selectors removed from styling (kept only for JavaScript references if needed)
- Consistent naming convention: `note-*` prefix for note-related classes
- Scoped styles prevent conflicts with other components

**CSS Selector Pattern**:

```css
/* Container */
.note-editor-split {
  /* Grid layout */
}

/* Editor pane */
.editor-pane {
  /* Flex container */
}
.editor-pane .editor {
  /* Textarea styling */
}

/* Preview pane */
.preview-pane {
  /* Flex container */
}
.preview-pane .preview {
  /* Content container */
}
.preview a {
  /* Link styling */
}
.preview img {
  /* Image styling */
}
.preview .katex {
  /* Math rendering */
}
```

## Future Enhancements

Potential improvements for future versions:

1. Search across all brain dump entries
2. Tag-based filtering and organization
3. ~~Export entire history as archive~~ (✓ Implemented in TAB-BDP-IO-01)
4. ~~Import/merge from multiple sources~~ (✓ Implemented in TAB-BDP-IO-01)
5. Collaborative editing (if cloud sync added)
6. Rich media preview for attachments
7. Bi-directional backlinks (show where current note is referenced)
8. Auto-save to cloud backup (optional)
9. Export to multiple formats (Markdown, PDF, HTML)
10. Selective import/export (choose specific data components)
11. Persist resize preference to localStorage
12. Double-click resize handle to reset to 50/50
13. Touch drag support for mobile resize

## Performance Notes

- Version history limited to 50 entries to manage localStorage size
- Debounced auto-save (5 seconds) reduces localStorage writes
- Efficient diff algorithm for version comparison
- Lazy loading of OPFS initialization
- Minimal DOM manipulation for performance

## Support and Feedback

For issues or feature requests related to Brain Dump specifications, please open an issue on the GitHub repository
with the `brain-dump` label.
