# Aurorae Haven - Complete Specifications

This document contains all specifications extracted from the AuroraeHaven_Specs.docx file.

**Generated**: 2025-10-08
**Source**: docs/AuroraeHaven_Specs.docx
**Total Specifications**: 640
**Categories**: 31

---

## Table of Contents

### Architecture (ARC)

- ✅ [ARC-APP](#arcapp) (4 specifications)
- 📋 [ARC-BCK](#arcbck) (5 specifications)
- ✅ [ARC-DAT](#arcdat) (4 specifications)
- 📋 [ARC-FSC](#arcfsc) (4 specifications)
- 📋 [ARC-ONL](#arconl) (5 specifications)
- 📋 [ARC-SEC](#arcsec) (5 specifications)

### Non-Functional Requirements (NFR)

- 📋 [NFR-ACC](#nfracc) (5 specifications)
- 📋 [NFR-PER](#nfrper) (3 specifications)
- 📋 [NFR-SEC](#nfrsec) (4 specifications)

### User Profiles (USR)

- 📋 [USR-ENV](#usrenv) (4 specifications)
- 📋 [USR-PRF](#usrprf) (3 specifications)

### Tabs (TAB)

- ✅ [TAB-BDP](#tabbdp) (61 specifications)
- 📋 [TAB-HAB](#tabhab) (52 specifications)
- 📋 [TAB-IEX](#tabiex) (32 specifications)
- 📋 [TAB-LIB](#tablib) (39 specifications)
- 📋 [TAB-NAV](#tabnav) (29 specifications)
- 📋 [TAB-POP](#tabpop) (30 specifications)
- 📋 [TAB-RTN](#tabrtn) (58 specifications)
- 📋 [TAB-SCH](#tabsch) (52 specifications)
- 📋 [TAB-SEC](#tabsec) (42 specifications)
- 📋 [TAB-SET](#tabset) (44 specifications)
- 📋 [TAB-SPG](#tabspg) (29 specifications)
- 📋 [TAB-STT](#tabstt) (42 specifications)
- ✅ [TAB-TSK](#tabtsk) (62 specifications)

### Security Testing & Protection (STP)

- 📋 [STP-AST](#stpast) (4 specifications)
- 📋 [STP-HDR](#stphdr) (3 specifications)
- 📋 [STP-IEX](#stpiex) (4 specifications)
- 📋 [STP-IRB](#stpirb) (2 specifications)
- 📋 [STP-SUP](#stpsup) (3 specifications)
- 📋 [STP-SWP](#stpswp) (3 specifications)
- 📋 [STP-UIA](#stpuia) (3 specifications)

---

## Detailed Specifications

## Architecture (ARC)

### ARC-APP - ✅ Already Documented

**Total Specifications**: 4

**Category**: Application Architecture

#### ARC-APP-01

**Requirement**: The application shall be implemented as a Progressive Web App (PWA).

_Section_: Architecture Overview (ARC)

#### ARC-APP-02

**Requirement**: The application shall be built with ReactJS, HTML5, CSS/Bootstrap, and JavaScript.

_Section_: Architecture Overview (ARC)

#### ARC-APP-03

**Requirement**: The application shall use modular components to ensure maintainability and scalability.

_Section_: Architecture Overview (ARC)

#### ARC-APP-04

**Requirement**: The application shall be installable as a PWA on supported browsers.

_Section_: Architecture Overview (ARC)

---

### ARC-BCK - 📋 New Specifications

**Total Specifications**: 5

**Category**: 2.4 Back-end

#### ARC-BCK-01

**Requirement**: The application shall function without requiring any back-end server.

_Section_: Architecture Overview (ARC)

#### ARC-BCK-02

**Requirement**: If a back-end service is added, it shall be optional and used only for synchronisation or backup.

_Section_: Architecture Overview (ARC)

#### ARC-BCK-03

**Requirement**: All server communications shall be secured with HTTPS and end-to-end encryption.

_Section_: Architecture Overview (ARC)

#### ARC-BCK-04

**Requirement**: The back-end shall not store personal user content in plain text.

_Section_: Architecture Overview (ARC)

#### ARC-BCK-05

**Requirement**: The back-end shall not include telemetry or analytics features.

_Section_: Architecture Overview (ARC)

---

### ARC-DAT - ✅ Already Documented

**Total Specifications**: 4

**Category**: Data Management

#### ARC-DAT-01

**Requirement**: The application shall store structured data in IndexedDB.

_Section_: Architecture Overview (ARC)

#### ARC-DAT-02

**Requirement**: The application shall store user files and attachments in OPFS.

_Section_: Architecture Overview (ARC)

#### ARC-DAT-03

**Requirement**: The application shall provide local-first data persistence, with no external dependency.

_Section_: Architecture Overview (ARC)

#### ARC-DAT-04

**Requirement**: Data aggregation (for statistics) shall be precomputed and stored to avoid runtime recalculation.

_Section_: Architecture Overview (ARC)

---

### ARC-FSC - 📋 New Specifications

**Total Specifications**: 4

**Category**: Functional Scope

#### ARC-FSC-02

**Requirement**: The application shall provide a Statistics tab showing aggregated metrics and XP.

_Section_: Architecture Overview (ARC)

#### ARC-FSC-03

**Requirement**: The application shall support import/export workflows with validation and conflict resolution.

_Section_: Architecture Overview (ARC)

#### ARC-FSC-04

**Requirement**: The application shall provide Security Settings for passphrase, biometric unlock, wipe, and key export.

_Section_: Architecture Overview (ARC)

#### ARC-FSC-05

**Requirement**: The application shall provide static informational pages: Privacy Policy, Legal Notice, and About.

_Section_: Architecture Overview (ARC)

---

### ARC-ONL - 📋 New Specifications

**Total Specifications**: 5

**Category**: 2.5 Online Mode

#### ARC-ONL-01

**Requirement**: The application shall provide an optional online mode for data synchronisation across devices.

_Section_: Architecture Overview (ARC)

#### ARC-ONL-02

**Requirement**: Synchronisation shall upload and download encrypted data only.

_Section_: Architecture Overview (ARC)

#### ARC-ONL-03

**Requirement**: The user shall remain in control of enabling or disabling synchronisation at any time.

_Section_: Architecture Overview (ARC)

#### ARC-ONL-04

**Requirement**: Synchronisation conflicts shall be resolved locally with user prompts.

_Section_: Architecture Overview (ARC)

#### ARC-ONL-05

**Requirement**: The application shall continue to function offline even when synchronisation is unavailable.

_Section_: Architecture Overview (ARC)

---

### ARC-SEC - 📋 New Specifications

**Total Specifications**: 5

**Category**: Security Architecture

#### ARC-SEC-01

**Requirement**: The application shall not include telemetry, ads, or third-party analytics.

_Section_: Architecture Overview (ARC)

#### ARC-SEC-02

**Requirement**: All exports shall remain under user control and not be transmitted externally.

_Section_: Architecture Overview (ARC)

#### ARC-SEC-03

**Requirement**: Exported data shall support encrypted formats (.sj.enc) using AES-256.

_Section_: Architecture Overview (ARC)

#### ARC-SEC-04

**Requirement**: All data wipe operations shall delete IndexedDB, OPFS, and localStorage content.

_Section_: Architecture Overview (ARC)

#### ARC-SEC-05

**Requirement**: A passphrase shall be required to access encrypted exports.

_Section_: Architecture Overview (ARC)

---

## Non-Functional Requirements (NFR)

### NFR-ACC - 📋 New Specifications

**Total Specifications**: 5

**Category**: Usability & Accessibility

#### NFR-ACC-01

**Requirement**: All interactive elements shall be operable via keyboard navigation.

_Section_: Non-Functional Requirements (NFR)

#### NFR-ACC-02

**Requirement**: The UI shall include ARIA roles and aria-labels for screen readers.

_Section_: Non-Functional Requirements (NFR)

#### NFR-ACC-03

**Requirement**: Reduced motion mode shall replace animations (confetti, shake) with subtle feedback.

_Section_: Non-Functional Requirements (NFR)

#### NFR-ACC-04

**Requirement**: Font scaling (80%–200%) shall be supported via a slider in Settings.

_Section_: Non-Functional Requirements (NFR)

#### NFR-ACC-05

**Requirement**: High contrast and simplified interface modes shall be available.

_Section_: Non-Functional Requirements (NFR)

---

### NFR-PER - 📋 New Specifications

**Total Specifications**: 3

**Category**: Performance

#### NFR-PER-01

**Requirement**: The application shall load the main interface in under 2 seconds on average hardware.

_Section_: Non-Functional Requirements (NFR)

#### NFR-PER-02

**Requirement**: Statistics aggregation shall complete within 200ms for datasets up to 10,000 entities.

_Section_: Non-Functional Requirements (NFR)

#### NFR-PER-03

**Requirement**: Imports and exports shall stream data to avoid UI blocking.

_Section_: Non-Functional Requirements (NFR)

---

### NFR-SEC - 📋 New Specifications

**Total Specifications**: 4

**Category**: Security

#### NFR-SEC-01

**Requirement**: All cryptographic operations shall use standard algorithms (AES-256, SHA-256).

_Section_: Non-Functional Requirements (NFR)

#### NFR-SEC-02

**Requirement**: Session auto-lock shall trigger after configurable inactivity.

_Section_: Non-Functional Requirements (NFR)

#### NFR-SEC-03

**Requirement**: Biometric unlock shall be supported where available.

_Section_: Non-Functional Requirements (NFR)

#### NFR-SEC-04

**Requirement**: All destructive actions (wipe, overwrite) shall require explicit confirmation.

_Section_: Non-Functional Requirements (NFR)

---

## User Profiles (USR)

### USR-ENV - 📋 New Specifications

**Total Specifications**: 4

**Category**: Supported Environments

#### USR-ENV-01

**Requirement**: The application shall run on major browsers (Chrome, Firefox, Safari, Edge).

_Section_: User Profiles & Environment (USR)

#### USR-ENV-02

**Requirement**: The application shall support offline mode for all features.

_Section_: User Profiles & Environment (USR)

#### USR-ENV-03

**Requirement**: The application shall be installable as a PWA on desktop and mobile devices.

_Section_: User Profiles & Environment (USR)

#### USR-ENV-04

**Requirement**: The application shall adapt its UI for mobile, tablet, and desktop layouts.

_Section_: User Profiles & Environment (USR)

---

### USR-PRF - 📋 New Specifications

**Total Specifications**: 3

**Category**: Target Users

#### USR-PRF-01

**Requirement**: The application shall be usable by individuals with ADHD and other neurodivergent profiles.

_Section_: User Profiles & Environment (USR)

#### USR-PRF-02

**Requirement**: The application shall provide forgiving flows (undo, skip) to reduce user anxiety.

_Section_: User Profiles & Environment (USR)

#### USR-PRF-03

**Requirement**: The application shall use positive feedback instead of punitive notifications.

_Section_: User Profiles & Environment (USR)

---

## Tabs (TAB)

### TAB-BDP - ✅ Already Documented

**Total Specifications**: 61

#### TAB-BDP-01

**Requirement**: The Brain Dump screen shall present (top to bottom): a toolbar (Note Management Buttons), a sidebar list of notes (filterable), and a main area with Editor/Preview; on mobile, the list and editor/preview are separate views with a toggle.

_Section_: Tab Appearance

#### TAB-BDP-02

**Requirement**: The visual design shall use frosted glass cards on a cosmic gradient background, thin borders (1px var(--line)), primary text var(--ink), secondary text var(--dim), consistent with styles.css.

_Section_: Tab Appearance

#### TAB-BDP-03

**Requirement**: The toolbar shall include: [New Note], [New Daily], [Import], [Export], [Search], [Filter], [Sort], [Toggle Preview], [Pin/Unpin], [Delete], and a “⋯” overflow for less-used actions (Duplicate, Convert to Template).

_Section_: Tab Appearance

#### TAB-BDP-04

**Requirement**: “Search” shall search titles, body text (Markdown), tags, and refs; results highlight terms within the list and optionally in preview.

_Section_: Tab Appearance

#### TAB-BDP-05

**Requirement**: “Filter” shall include: Tag(s), Date range, Pinned only, Has attachments, Has backlinks, Edited recently.

_Section_: Tab Appearance

#### TAB-BDP-06

**Requirement**: “Sort” shall include: Last edited (desc), Created (desc), Title (A–Z), Most backlinks, Most words.

_Section_: Tab Appearance

#### TAB-BDP-07

**Requirement**: The sidebar shall display note rows with: Title (bold), snippet (first line or H1), tags (chips), last edited timestamp; selected row uses a subtle accent border/indicator.

_Section_: Tab Appearance

#### TAB-BDP-08

**Requirement**: The sidebar shall support infinite/virtualized scrolling for large collections; keyboard up/down navigates notes, Enter opens in editor.

_Section_: Tab Appearance

#### TAB-BDP-09

**Requirement**: Desktop default shall be split view: Editor (left) and Preview (right) with a draggable splitter; toggle allows Editor-only or Preview-only modes.

_Section_: Tab Appearance

#### TAB-BDP-10

**Requirement**: Tablet shall default to Editor with a Preview toggle button; mobile shall switch between List and Editor/Preview via a segmented control at the top of the page.

_Section_: Tab Appearance

#### TAB-BDP-11

**Requirement**: The main area shall use a glass card container with padding 16–24px; focus outlines use the global focus style (3px var(--mint)).

_Section_: Tab Appearance

#### TAB-BDP-12

**Requirement**: The editor shall be a plain-text Markdown editor with monospaced font option, line numbers (optional), soft-wrap, and a large caret; supports indentation with Tab/Shift+Tab for lists.

_Section_: Tab Appearance

#### TAB-BDP-13

**Requirement**: The editor toolbar shall provide: Bold (Ctrl/Cmd+B), Italic (Ctrl/Cmd+I), Link (Ctrl/Cmd+K), Unordered List, Ordered List, Checklist, Blockquote, Inline Code, Code Block (```), Table, Insert Date/Time, Insert Ref (^ref), Undo/Redo.

_Section_: Tab Appearance

#### TAB-BDP-14

**Requirement**: Inserting a link shall open a small inline dialog for URL and text; URLs are validated and normalised; javascript: and data: schemes (except data:image/\* local attachments) are blocked.

_Section_: Tab Appearance

#### TAB-BDP-15

**Requirement**: Inserting a table shall add a 3×3 Markdown table scaffold; Tab navigates cells; Shift+Tab moves reverse; Enter inserts a new row.

_Section_: Tab Appearance

#### TAB-BDP-16

**Requirement**: Insert Date/Time shall insert ISO/local formatted text (configurable) at the caret.

_Section_: Tab Appearance

#### TAB-BDP-17

**Requirement**: Insert Ref (^ref) shall prompt for an entity id (Task/Routine/Habit/Note); accepted values insert ^ref(<id>); invalid ids show inline error.

_Section_: Tab Appearance

#### TAB-BDP-18

**Requirement**: The Preview shall render GitHub-flavoured Markdown (GFM), with raw HTML disabled and sanitised; on\* handlers, scripts, iframes, and javascript: URLs are removed.

_Section_: Tab Appearance

#### TAB-BDP-19

**Requirement**: Headings, lists, code blocks, tables, checklists, links, images, and blockquotes shall style per styles.css (consistent with site typography).

_Section_: Tab Appearance

#### TAB-BDP-20

**Requirement**: Checklists in Preview shall be interactive when “Preview is interactive” setting is on; otherwise, they render read-only.

_Section_: Tab Appearance

#### TAB-BDP-21

**Requirement**: “New Daily” shall create a note titled with the current date (YYYY-MM-DD or localized), pre-seeded with a template (configurable) and tags (#daily).

_Section_: Tab Appearance

#### TAB-BDP-22

**Requirement**: Opening today’s date shall reuse the existing Daily note (if present) rather than creating duplicates; a toast indicates reuse.

_Section_: Tab Appearance

#### TAB-BDP-23

**Requirement**: Tags shall be chips under the title bar; adding a tag via the toolbar or typing #tag in the editor updates metadata.

_Section_: Tab Appearance

#### TAB-BDP-24

**Requirement**: Pinned notes shall appear at the top of the sidebar with a pin icon; Pin/Unpin is available in toolbar and via right-click/context menu.

_Section_: Tab Appearance

#### TAB-BDP-25

**Requirement**: Dragging an image/file into the editor shall prompt to “Attach locally”; upon confirm, the file is saved in OPFS and a Markdown link is inserted (e.g., ![alt](/opfs/notes/<id>/<filename>)).

_Section_: Tab Appearance

#### TAB-BDP-26

**Requirement**: The Insert Image dialog shall enforce alt text; missing alt inserts placeholder “[image]” and flags a warning until edited.

_Section_: Tab Appearance

#### TAB-BDP-27

**Requirement**: Attached files shall be listed in a right-side panel (toggleable), with options to rename, remove, or copy link; deleting a note prompts to also delete its attachments.

_Section_: Tab Appearance

#### TAB-BDP-28

**Requirement**: Typing ^ref(<id>) shall create a cross-reference; valid ids become clickable in Preview (and in Editor via Ctrl/Cmd+Click).

_Section_: Tab Appearance

#### TAB-BDP-29

**Requirement**: Backlinks panel shall list all notes that reference the current note; selecting a backlink navigates to that note and highlights the reference occurrence.

_Section_: Tab Appearance

#### TAB-BDP-30

**Requirement**: Hovering a ^ref link in Preview shall show a small tooltip preview (title + first line) of the referenced entity; keyboard users can open the same preview via a focusable icon.

_Section_: Tab Appearance

#### TAB-BDP-31

**Requirement**: The renderer shall block raw HTML; only Markdown is allowed; embedded links must be https or relative; data: URLs allowed only for local images from OPFS.

_Section_: Tab Appearance

#### TAB-BDP-32

**Requirement**: Pasted content shall be sanitised; if HTML is detected, it shall be converted to Markdown where possible and stripped of active content; a discreet toast states “HTML sanitised”.

_Section_: Tab Appearance

#### TAB-BDP-33

**Requirement**: Brain Dump shall autosave on pause typing (≈500–800 ms) and on blur; a “Saved” indicator appears in the toolbar.

_Section_: Tab Appearance

#### TAB-BDP-34

**Requirement**: Version history shall store lightweight snapshots; “View Changes” shows a side-by-side diff (added/removed lines) with timestamps and an option to restore a version.

_Section_: Tab Appearance

#### TAB-BDP-35

**Requirement**: Restoring a version shall create a new snapshot before replacing the current content, enabling undo.

_Section_: Tab Appearance

#### TAB-BDP-36

**Requirement**: Global Search (toolbar) shall filter the sidebar list live; Enter focuses the first result; Esc clears.

_Section_: Tab Appearance

#### TAB-BDP-37

**Requirement**: Find-in-Note (Ctrl/Cmd+F) shall highlight matches in the editor and optionally in Preview; Find Next/Prev supported; case/regex toggles optional.

_Section_: Tab Appearance

#### TAB-BDP-38

**Requirement**: Mobile default shall show the sidebar list; tapping a note transitions to the Editor; a top segmented control toggles Editor/Preview; back button returns to list.

_Section_: Tab Appearance

#### TAB-BDP-39

**Requirement**: The editor toolbar shall collapse into a scrollable row of icons; less-used actions appear under an overflow (⋯) menu.

_Section_: Tab Appearance

#### TAB-BDP-40

**Requirement**: Long-press on a word/selection shall open a selection menu: Bold, Italic, Link, Checklist item, Code; copy/paste use native system menus.

_Section_: Tab Appearance

#### TAB-BDP-41

**Requirement**: Touch targets (toolbar icons, chips) shall be ≥48×48 px; sticky Save indicator appears at the top when autosave completes.

_Section_: Tab Appearance

#### TAB-BDP-42

**Requirement**: Headings shall scale responsively (H1 > H2 > H3), with comfortable line-height; code blocks use a monospaced font and glass card background with subtle border.

_Section_: Tab Appearance

#### TAB-BDP-43

**Requirement**: Links in Preview shall underline on hover and show a focus outline; external links open in a new tab with rel="noopener".

_Section_: Tab Appearance

#### TAB-BDP-44

**Requirement**: The editor caret and selection colours shall maintain sufficient contrast; focus-visible outlines appear on all inputs and buttons.

_Section_: Tab Appearance

#### TAB-BDP-45

**Requirement**: The editor shall expose role="textbox" with aria-multiline="true"; the Preview region shall be labelled and not steal focus unexpectedly.

_Section_: Tab Appearance

#### TAB-BDP-46

**Requirement**: All toolbar buttons shall have aria-labels and visible text/tooltips; keyboard shortcuts shall be documented in a help tooltip (Shift+/).

_Section_: Tab Appearance

#### TAB-BDP-47

**Requirement**: The attachments panel and backlinks panel shall be navigable via keyboard with logical tab order; dismissable via Esc.

_Section_: Tab Appearance

#### TAB-BDP-48

**Requirement**: Reduced motion shall disable animated transitions for splitter drag, preview fade-ins, and diff animations; rely on static state changes.

_Section_: Tab Appearance

#### TAB-BDP-49

**Requirement**: Export shall support: single note (Markdown), selected notes (zip of .md files + metadata.json), or all notes; attachments export as files in structured folders.

_Section_: Tab Appearance

#### TAB-BDP-50

**Requirement**: Import shall accept: .md files (one per note), .zip (notes + metadata), or .html (converted to Markdown with sanitisation); on ID collision, new IDs are generated but backlinks are remapped.

_Section_: Tab Appearance

#### TAB-BDP-51

**Requirement**: Round-trip import/export shall preserve titles, tags, ^ref links (rewritten if IDs changed), and attachments; a migration report lists any remapped IDs.

_Section_: Tab Appearance

#### TAB-BDP-52

**Requirement**: The sidebar list shall virtualise items for large collections; editing large notes shall avoid layout thrash by batching updates and debouncing preview rendering.

_Section_: Tab Appearance

#### TAB-BDP-53

**Requirement**: Preview rendering shall be incremental: re-render only the changed blocks where possible; show a lightweight skeleton or “Rendering…” chip when needed.

_Section_: Tab Appearance

#### TAB-BDP-54

**Requirement**: Failing to save to OPFS/IndexedDB shall show a persistent warning banner with retry; the system shall buffer edits in memory until storage is available or user exports.

_Section_: Tab Appearance

#### TAB-BDP-55

**Requirement**: If an attachment write fails, the UI shall show a clear error and offer “Retry” and “Save elsewhere” (download file).

_Section_: Tab Appearance

#### TAB-BDP-56

**Requirement**: Quick Brain Dump mode shall allow a small, transient note composer with minimal chrome; promote to full note moves it to the main list with tags.

_Section_: Tab Appearance

#### TAB-BDP-57

**Requirement**: Templates for notes shall be stored in the Library and insertable via toolbar; placeholders like {{date}} and {{title}} auto-resolve on insert.

_Section_: Tab Appearance

#### TAB-BDP-58

**Requirement**: Word count and reading time shall appear in the footer; togglable in Settings.

_Section_: Tab Appearance

#### TAB-BDP-59

**Requirement**: Insert desktop screenshots: split Editor/Preview with toolbar, backlinks panel open, attachments panel open.

_Section_: Tab Appearance

#### TAB-BDP-60

**Requirement**: Insert mobile screenshots: list view, editor view with collapsed toolbar, preview view; show long-press selection menu.

_Section_: Tab Appearance

#### TAB-BDP-61

**Requirement**: Insert version history/diff screenshot and an attachments management screenshot (rename/remove/copy link).

_Section_: Tab Appearance

---

### TAB-HAB - 📋 New Specifications

**Total Specifications**: 52

#### TAB-HAB-01

**Requirement**: The Habits screen shall show (top to bottom): a toolbar (Habit Management Buttons), a “Today” panel with daily check-ins and a streak ring, and a rolling 28–35 day heatmap per habit; an optional details drawer opens on selection.

_Section_: Tab Appearance

#### TAB-HAB-02

**Requirement**: The visual design shall use frosted glass cards with subtle shadows and thin borders (border: 1px var(--line)); primary text uses var(--ink), secondary text var(--dim), consistent with styles.css.

_Section_: Tab Appearance

#### TAB-HAB-03

**Requirement**: The toolbar shall include: [New Habit], [Filter], [Sort], [Toggle Paused], [Import], [Export], [View: Cards/List].

_Section_: Tab Appearance

#### TAB-HAB-04

**Requirement**: Filter shall include: Category, Tag, Status (Active/Paused), Has Streak ≥ N days, Missed today.

_Section_: Tab Appearance

#### TAB-HAB-05

**Requirement**: Sort shall include: Title, Longest streak, Current streak, Last check-in, Created date.

_Section_: Tab Appearance

#### TAB-HAB-06

**Requirement**: “New Habit” opens a create dialog: Title (required), Category (colour), Tags (chips), Schedule (Daily / Custom days), Start date, Optional Brain Dump link.

_Section_: Tab Appearance

#### TAB-HAB-07

**Requirement**: Each habit card shall display: Title (bold), Category colour chip, Current streak count (e.g., “12 days”), and a Today tick control.

_Section_: Tab Appearance

#### TAB-HAB-08

**Requirement**: The Today tick control shall be a large circular checkbox (≥28–32 px on desktop, ≥40–48 px on mobile) with a ring animation on completion.

_Section_: Tab Appearance

#### TAB-HAB-09

**Requirement**: The card shall show a compact heatmap strip (28–35 days) with squares/dots indicating completion; today’s cell is outlined.

_Section_: Tab Appearance

#### TAB-HAB-10

**Requirement**: The “Today” panel shall summarize: total active habits, completed today count, and a circular streak ring that fills proportionally to today’s completions.

_Section_: Tab Appearance

#### TAB-HAB-11

**Requirement**: The streak ring shall display a numeric label at its center (e.g., “7/12 today”); ring uses the app accent colour (e.g., var(--mint)).

_Section_: Tab Appearance

#### TAB-HAB-12

**Requirement**: Tapping a habit’s Today tick in the “Today” panel shall also tick it on its card and update the ring and counters in real time.

_Section_: Tab Appearance

#### TAB-HAB-13

**Requirement**: The heatmap shall show one mark per day, left→right, oldest→newest; today is the rightmost cell with a distinct outline.

_Section_: Tab Appearance

#### TAB-HAB-14

**Requirement**: Completion intensity shall vary by completion streak segments (e.g., 1, 3, 7, 14+) while maintaining WCAG AA contrast; reduced motion users shall see static colours without animated transitions.

_Section_: Tab Appearance

#### TAB-HAB-15

**Requirement**: Vacation days (if enabled) shall render with a hatched/diagonal pattern and do not break streaks.

_Section_: Tab Appearance

#### TAB-HAB-16

**Requirement**: Ticking a habit today shall animate the Today control, update the card state, update the heatmap latest cell, increment streak, and show feedback (see XP logic & toast).

_Section_: Tab Appearance

#### TAB-HAB-17

**Requirement**: Undo shall be available for 5–10 seconds after ticking, via an inline “Undo” chip and a toast action; undo restores prior streak and counters.

_Section_: Tab Appearance

#### TAB-HAB-18

**Requirement**: Pausing a habit shall move it to a Paused section (collapsible) and disable Today tick controls until resumed.

_Section_: Tab Appearance

#### TAB-HAB-19

**Requirement**: Editing a habit opens a side drawer/modal with fields: Title, Category, Tags, Schedule, Start date, Brain Dump; changes apply immediately on save.

_Section_: Tab Appearance

#### TAB-HAB-20

**Requirement**: Base daily completion XP shall be 1 XP per habit checked today.

_Section_: Tab Appearance

#### TAB-HAB-21

**Requirement**: New streak threshold (first time reaching 3 consecutive days) shall award +3 XP once.

_Section_: Tab Appearance

#### TAB-HAB-22

**Requirement**: Milestones shall award +2 XP at streak lengths of 7, 14, 28, 50, 100, 250, 500, 1000 days (each milestone triggers once per threshold).

_Section_: Tab Appearance

#### TAB-HAB-23

**Requirement**: On completion, a toast shall appear: “Habit done. +1 XP”; on milestone days: “Milestone reached! +2 XP”; on new-streak threshold: “Streak started! +3 XP.”

_Section_: Tab Appearance

#### TAB-HAB-24

**Requirement**: Confetti shall trigger on milestone days; reduced motion replaces confetti with a static celebratory outline and toast; no confetti for regular daily ticks.

_Section_: Tab Appearance

#### TAB-HAB-25

**Requirement**: Haptics (mobile): short pulse for daily tick; double pulse for new-streak threshold; strong pulse for milestone.

_Section_: Tab Appearance

#### TAB-HAB-26

**Requirement**: Opening a habit (click/tap title) shall reveal a detail drawer with: full heatmap (up to 90 days), Brain Dump link, Motivation text (optional), Vacation toggle, and a Completion history list (date/time).

_Section_: Tab Appearance

#### TAB-HAB-27

**Requirement**: The Completion history list shall support filters: last 7/30/90 days, and export as CSV/Markdown.

_Section_: Tab Appearance

#### TAB-HAB-28

**Requirement**: The Vacation toggle shall mark selected future dates as vacation (or set a date range); vacation days do not decrement or block streaks.

_Section_: Tab Appearance

#### TAB-HAB-29

**Requirement**: The layout shall default to a vertical list; each card contains the Today tick, streak count, and a compact heatmap; tapping a card expands details inline (accordion).

_Section_: Tab Appearance

#### TAB-HAB-30

**Requirement**: The toolbar actions (Filter/Sort/Import/Export) shall collapse under an overflow menu (⋯); [New Habit] appears as a bottom-right floating action button (FAB).

_Section_: Tab Appearance

#### TAB-HAB-31

**Requirement**: Swipe right on a habit card toggles Today completion; swipe left reveals actions (Edit, Pause/Resume, Delete).

_Section_: Tab Appearance

#### TAB-HAB-32

**Requirement**: Sticky “Today” summary (ring + counts) shall remain visible at the top while scrolling the list; ring updates smoothly after each tick.

_Section_: Tab Appearance

#### TAB-HAB-33

**Requirement**: Touch targets (Today control, Edit, Pause) shall be ≥48×48 px; spacing ensures no accidental taps.

_Section_: Tab Appearance

#### TAB-HAB-34

**Requirement**: Category chips use the shared 10-colour palette; chips appear left of the title on cards; colour variables follow styles.css tokens (e.g., --cat-blue, --cat-violet).

_Section_: Tab Appearance

#### TAB-HAB-35

**Requirement**: The Today tick control, when completed, shall fill with the habit’s category colour; the ring outline uses the app accent; on hover/focus the control shows a clear focus halo.

_Section_: Tab Appearance

#### TAB-HAB-36

**Requirement**: Heatmap cells use a monochrome scale tinted by the habit’s category colour; contrast ratios must meet WCAG; non-colour cues (check marks or dot density) provide redundancy.

_Section_: Tab Appearance

#### TAB-HAB-37

**Requirement**: The Habits list shall use role="list" and each habit card role="listitem"; the Today control is a native checkbox or role="checkbox" with aria-checked.

_Section_: Tab Appearance

#### TAB-HAB-38

**Requirement**: The streak ring shall be labelled with aria-label describing progress (e.g., “Today progress: 7 of 12 habits complete”); avoid rapid aria-live updates that spam screen readers.

_Section_: Tab Appearance

#### TAB-HAB-39

**Requirement**: Keyboard support: Tab focuses a habit’s Today control; Space toggles completion; Enter opens the detail drawer; Arrow keys move between habits; Esc closes the drawer.

_Section_: Tab Appearance

#### TAB-HAB-40

**Requirement**: Screen reader announcements on tick shall say: “<Habit title> completed today. Current streak: X days. +1 XP.”

_Section_: Tab Appearance

#### TAB-HAB-41

**Requirement**: Reduced-motion users shall not see animated heatmap transitions or ring spin; updates shall be instantaneous with text/outline cues.

_Section_: Tab Appearance

#### TAB-HAB-42

**Requirement**: Export shall include: id, title, category, tags, schedule configuration, start date, and a compressed completion log (dates only) for the last N days (configurable), excluding PII.

_Section_: Tab Appearance

#### TAB-HAB-43

**Requirement**: Import shall validate schema; on ID collision, a new id shall be assigned while preserving title and logs; the user is notified via toast.

_Section_: Tab Appearance

#### TAB-HAB-44

**Requirement**: Round-trip import/export shall preserve completion history, streak counts, and schedule configuration without mutation.

_Section_: Tab Appearance

#### TAB-HAB-45

**Requirement**: Offline usage shall be fully supported; all ticks persist locally and any optional sync is queued for later.

_Section_: Tab Appearance

#### TAB-HAB-46

**Requirement**: Initial load shall render skeleton cards and a skeleton ring; hydration fills titles, streaks, and heatmaps; target smooth scrolling at 60 FPS where possible via list virtualisation for long habit lists.

_Section_: Tab Appearance

#### TAB-HAB-47

**Requirement**: Checking a habit shall update only the affected UI elements (Today control, ring, heatmap last cell, counters) to minimize reflow.

_Section_: Tab Appearance

#### TAB-HAB-48

**Requirement**: If the same habit is toggled rapidly, debouncing shall prevent double entries; on conflict, UI shows a non-blocking warning toast and reconciles to the last user intent.

_Section_: Tab Appearance

#### TAB-HAB-49

**Requirement**: Invalid schedule configurations (e.g., empty day set on custom schedule) shall show inline error text in the editor and prevent saving.

_Section_: Tab Appearance

#### TAB-HAB-50

**Requirement**: Insert desktop screenshots: Habits list with Today controls, streak counts, and compact heatmaps; “Today” summary ring at top.

_Section_: Tab Appearance

#### TAB-HAB-51

**Requirement**: Insert mobile screenshots: vertical list with large Today controls, sticky Today ring summary, swipe actions, and expanded accordion detail.

_Section_: Tab Appearance

#### TAB-HAB-52

**Requirement**: Insert detail drawer screenshot showing extended heatmap, vacation toggle, motivation text, and completion history export action.

_Section_: Tab Appearance

---

### TAB-IEX - 📋 New Specifications

**Total Specifications**: 32

#### TAB-IEX-01

**Requirement**: The Import workflow shall follow this sequence:

_Section_: Tab Appearance

#### TAB-IEX-02

**Requirement**: The Export workflow shall follow this sequence:

_Section_: Tab Appearance

#### TAB-IEX-03

**Requirement**: File picker shall accept: .json (data schema), .md (notes), .html (notes/pages), .sj.enc (encrypted backup).

_Section_: Tab Appearance

#### TAB-IEX-04

**Requirement**: Validation modal shall show: number of entities detected (Tasks, Routines, Habits, Brain Dump, Templates), warnings (schema mismatches), and errors (invalid format).

_Section_: Tab Appearance

#### TAB-IEX-05

**Requirement**: Errors shall block import; Warnings allow user to continue. Example: “Unknown field ignored: mood.”

_Section_: Tab Appearance

#### TAB-IEX-06

**Requirement**: User must confirm import before applying changes; destructive actions (overwriting existing entities) shall require explicit confirm checkbox.

_Section_: Tab Appearance

#### TAB-IEX-07

**Requirement**: Progress bar shall display during import with aria-valuenow updates; after completion, a toast appears (“Import complete: 52 Tasks, 4 Routines, 12 Brain Dump”).

_Section_: Tab Appearance

#### TAB-IEX-08

**Requirement**: Export modal shall provide:

_Section_: Tab Appearance

#### TAB-IEX-09

**Requirement**: User shall confirm export scope and format before start.

_Section_: Tab Appearance

#### TAB-IEX-10

**Requirement**: On success, file download begins; toast shows “Export complete: tasks_2025-09-25.sj.enc”.

_Section_: Tab Appearance

#### TAB-IEX-11

**Requirement**: If imported entities have the same IDs as existing ones, the conflict resolution dialog shall appear:

_Section_: Tab Appearance

#### TAB-IEX-12

**Requirement**: Conflict resolution dialog shall display entity diffs in a side-by-side or stacked card view, highlighting differences in title, tags, fields.

_Section_: Tab Appearance

#### TAB-IEX-13

**Requirement**: Import/export modals shall use frosted glass card design with accent headers. Confirm buttons use var(--mint); destructive replace buttons use var(--alert).

_Section_: Tab Appearance

#### TAB-IEX-14

**Requirement**: Progress bars shall use accent gradients (linear-gradient 90deg, var(--quad-u), var(--quad-i)).

_Section_: Tab Appearance

#### TAB-IEX-15

**Requirement**: Validation modal shall use coloured icons: Green check for valid, Orange triangle for warnings, Red circle for errors.

_Section_: Tab Appearance

#### TAB-IEX-16

**Requirement**: On mobile, Import modal shall appear as a bottom sheet with file picker button and validation summary; Confirm and Cancel are sticky at bottom.

_Section_: Tab Appearance

#### TAB-IEX-17

**Requirement**: Export modal shall appear as bottom sheet with stacked controls: Scope selector (dropdown), Format selector (radio list), Encryption toggle (switch).

_Section_: Tab Appearance

#### TAB-IEX-18

**Requirement**: Conflict resolution shall use accordion lists: each conflict expandable to show diffs; batch actions appear as sticky buttons.

_Section_: Tab Appearance

#### TAB-IEX-19

**Requirement**: File picker shall use native input[type=file]; aria-label “Choose file to import”.

_Section_: Tab Appearance

#### TAB-IEX-20

**Requirement**: Validation modal shall use role="dialog", aria-modal="true", and aria-describedby for warnings/errors summary.

_Section_: Tab Appearance

#### TAB-IEX-21

**Requirement**: Progress bar shall expose aria-valuenow, aria-valuemin, aria-valuemax; screen reader announces “Import 42% complete”.

_Section_: Tab Appearance

#### TAB-IEX-22

**Requirement**: Conflict resolution cards shall be focusable with aria-labels summarising the entity and its differences.

_Section_: Tab Appearance

#### TAB-IEX-23

**Requirement**: Reduced motion disables progress bar animation; updates appear as discrete steps.

_Section_: Tab Appearance

#### TAB-IEX-24

**Requirement**: Validation shall parse up to 10,000 entities without blocking UI; large imports stream in chunks with progress updates.

_Section_: Tab Appearance

#### TAB-IEX-25

**Requirement**: Exports shall be generated in worker threads to keep UI responsive; large files stream progressively.

_Section_: Tab Appearance

#### TAB-IEX-26

**Requirement**: Offline state: imports/exports always work locally; if sync enabled, imported data is queued for upload.

_Section_: Tab Appearance

#### TAB-IEX-27

**Requirement**: Invalid files (.exe, .zip without manifest) shall be rejected with toast “Unsupported file type”.

_Section_: Tab Appearance

#### TAB-IEX-28

**Requirement**: Corrupted .sj.enc files shall fail decryption gracefully with clear error “Invalid encryption key or corrupted file”.

_Section_: Tab Appearance

#### TAB-IEX-29

**Requirement**: Partial imports (some entities invalid) shall import valid entities and show warning: “12 imported, 3 skipped”.

_Section_: Tab Appearance

#### TAB-IEX-30

**Requirement**: Insert desktop screenshots: Import validation modal with summary and coloured icons; Export modal with scope/format controls.

_Section_: Tab Appearance

#### TAB-IEX-31

**Requirement**: Insert mobile screenshots: Import bottom sheet with file picker; Export bottom sheet with toggles.

_Section_: Tab Appearance

#### TAB-IEX-32

**Requirement**: Insert conflict resolution screenshot: side-by-side diff cards, batch actions visible.

_Section_: Tab Appearance

---

### TAB-LIB - 📋 New Specifications

**Total Specifications**: 39

**Navigation Update (2026)**: The Library tab has been removed from the main navigation bar. The Library page is now accessible via:

- Settings page (dedicated "Template Library" section with "Open Template Library" button)
- Routines page (inline modal when creating new routines via "Add from Library" option)

This change improves UX by integrating template selection directly into the routine creation workflow while maintaining full library access through Settings for template management.

#### TAB-LIB-01

**Requirement**: The Library screen shall present (top to bottom): a toolbar (Library Management Buttons) and a main panel of Template cards in a grid layout (desktop/tablet) or list layout (mobile).

_Section_: Tab Appearance

#### TAB-LIB-02

**Requirement**: The visual design shall use frosted glass cards (rounded 14–16px corners, 1px var(--line) border, subtle shadow var(--shadow)) over a cosmic gradient background (per styles.css). Primary text uses var(--ink), secondary text var(--dim).

_Section_: Tab Appearance

#### TAB-LIB-03

**Requirement**: The toolbar shall include: [New Template], [Import], [Export], [Search], [Filter], [Sort], [View: Grid/List].

_Section_: Tab Appearance

#### TAB-LIB-04

**Requirement**: “Search” shall filter templates by Title, Tags, Type (Task/Routine).

_Section_: Tab Appearance

#### TAB-LIB-05

**Requirement**: “Filter” shall allow filtering by: Type (Task vs Routine), Tag(s), Duration range (for Routines), Last Used, Recently Added.

_Section_: Tab Appearance

#### TAB-LIB-06

**Requirement**: “Sort” shall support: Title (A–Z), Last Used (desc), Duration, Date Created.

_Section_: Tab Appearance

#### TAB-LIB-07

**Requirement**: “New Template” shall open a creation dialog: select base type (Task/Routine), Title (required), Tags, Category (for Tasks), Steps (for Routines), Duration (for Routines).

_Section_: Tab Appearance

#### TAB-LIB-08

**Requirement**: Each template card shall display: Title (bold), Type icon (Task square / Routine circular arrows), Tags (chips), Version, Duration (for Routines), and Last Used date.

_Section_: Tab Appearance

#### TAB-LIB-09

**Requirement**: Action buttons on each card shall include: [Use], [Edit], [Duplicate], [Delete], and [⋯] overflow for Export.

_Section_: Tab Appearance

#### TAB-LIB-10

**Requirement**: Hovering a card (desktop) or long-pressing (mobile) shall highlight it with a glow accent and reveal secondary buttons.

_Section_: Tab Appearance

#### TAB-LIB-11

**Requirement**: Editing a template shall open a side drawer/modal with structured fields depending on type:

_Section_: Tab Appearance

#### TAB-LIB-12

**Requirement**: Template previews shall sanitise any embedded Markdown before rendering to avoid unsafe HTML or scripts.

_Section_: Tab Appearance

#### TAB-LIB-13

**Requirement**: Selecting [Use] on a template shall spawn a new Task or Routine pre-filled with the template’s fields; the spawned entity is independent from the template thereafter.

_Section_: Tab Appearance

#### TAB-LIB-14

**Requirement**: For Task templates, the new Task shall appear in the selected quadrant or backlog (configurable); for Routine templates, the new Routine appears in the Library with its own ID.

_Section_: Tab Appearance

#### TAB-LIB-15

**Requirement**: A toast shall confirm instantiation: “Template applied — Task created” or “Routine created”.

_Section_: Tab Appearance

#### TAB-LIB-16

**Requirement**: Export shall support single template (.json), multiple selected templates (.zip with JSON files), or all templates. Metadata includes id, type, title, tags, version, and fields.

_Section_: Tab Appearance

#### TAB-LIB-17

**Requirement**: Import shall accept .json or .zip; schema validation required. On ID collision, the imported template shall be re-id’d with a new UUID.

_Section_: Tab Appearance

#### TAB-LIB-18

**Requirement**: Round-trip import/export shall preserve all template fields, tags, and metadata without mutation.

_Section_: Tab Appearance

#### TAB-LIB-19

**Requirement**: Import shall provide a dry-run preview modal showing: number of templates detected, types, titles, and warnings.

_Section_: Tab Appearance

#### TAB-LIB-20

**Requirement**: The layout shall default to a vertical list of templates; toolbar actions collapse into an overflow menu (⋯); [New Template] is exposed as a floating action button (FAB) at bottom-right.

_Section_: Tab Appearance

#### TAB-LIB-21

**Requirement**: Tapping a template opens a detail sheet with [Use], [Edit], [Duplicate], [Delete].

_Section_: Tab Appearance

#### TAB-LIB-22

**Requirement**: Swipe left on a template row reveals quick actions (Use, Edit, Delete); swipe right pins/unpins template.

_Section_: Tab Appearance

#### TAB-LIB-23

**Requirement**: Touch targets for actions shall be ≥48×48 px; cards shall use comfortable spacing to avoid accidental taps.

_Section_: Tab Appearance

#### TAB-LIB-24

**Requirement**: Template type icons shall use consistent accent colours: Tasks use var(--quad-i) mint-tinted; Routines use var(--quad-u) blue-tinted; pinned templates show a gold border.

_Section_: Tab Appearance

#### TAB-LIB-25

**Requirement**: Tags are chips styled with the shared 10-colour palette. Chips shall truncate with ellipsis if overflowing.

_Section_: Tab Appearance

#### TAB-LIB-26

**Requirement**: Version number shall appear as a subtle badge (small font, dim text) at bottom-right of the card.

_Section_: Tab Appearance

#### TAB-LIB-27

**Requirement**: The template grid shall use role="grid" and each template card role="gridcell"; list mode shall use role="list" and role="listitem".

_Section_: Tab Appearance

#### TAB-LIB-28

**Requirement**: Action buttons shall have aria-labels (“Use template”, “Edit template”).

_Section_: Tab Appearance

#### TAB-LIB-29

**Requirement**: Keyboard navigation: Arrow keys move between cards in grid; Enter selects and opens; Esc closes drawers/modals.

_Section_: Tab Appearance

#### TAB-LIB-30

**Requirement**: Screen readers shall announce: Title, Type, Tags, Last Used date, and Version.

_Section_: Tab Appearance

#### TAB-LIB-31

**Requirement**: Reduced motion setting shall disable hover scale/glow animations; highlight via static border colour instead.

_Section_: Tab Appearance

#### TAB-LIB-32

**Requirement**: The template list/grid shall virtualise items for large collections.

_Section_: Tab Appearance

#### TAB-LIB-33

**Requirement**: Editing and saving templates shall persist instantly to IndexedDB/OPFS; a “Saved” toast shall confirm.

_Section_: Tab Appearance

#### TAB-LIB-34

**Requirement**: Offline use: creating, editing, and using templates shall work fully offline; optional sync queues changes.

_Section_: Tab Appearance

#### TAB-LIB-35

**Requirement**: Invalid fields (e.g., negative duration, missing title) shall block save and show inline error messages with aria-describedby.

_Section_: Tab Appearance

#### TAB-LIB-36

**Requirement**: Importing malformed files shall fail gracefully with a toast “Import failed: Invalid schema”; valid templates in the file are still imported.

_Section_: Tab Appearance

#### TAB-LIB-37

**Requirement**: Insert desktop screenshots: template grid with Task and Routine templates; card with hover highlighting actions.

_Section_: Tab Appearance

#### TAB-LIB-38

**Requirement**: Insert mobile screenshots: vertical list with FAB (New Template), swipe actions visible, detail sheet open.

_Section_: Tab Appearance

#### TAB-LIB-39

**Requirement**: Insert template edit modal screenshot: fields for Title, Tags, Quadrant, Steps (for Routines).

_Section_: Tab Appearance

---

### TAB-NAV - 📋 New Specifications

**Total Specifications**: 29

#### TAB-NAV-01

**Requirement**: The Navbar shall display three aligned zones: Left (Logo/Title), Center (Primary Tabs), Right (Global Actions).

_Section_: Tab Appearance

#### TAB-NAV-02

**Requirement**: The Navbar shall be fixed at the top of the viewport, with frosted glass background (rgba(16,20,44,.30)), 1px var(--line) border at bottom, and subtle shadow (var(--shadow)).

_Section_: Tab Appearance

#### TAB-NAV-03

**Requirement**: On desktop, primary tabs shall appear as horizontal text buttons in the center zone; on mobile, they collapse into a hamburger/overflow menu.

_Section_: Tab Appearance

#### TAB-NAV-04

**Requirement**: The left zone shall display the app logo (icon or wordmark “Aurorae Haven”), aligned left with padding 12–16px.

_Section_: Tab Appearance

#### TAB-NAV-05

**Requirement**: Clicking the logo shall return to the default tab (Tasks) without triggering export prompts.

_Section_: Tab Appearance

#### TAB-NAV-06

**Requirement**: Primary tabs shall include: Tasks, Routines, Habits, Schedule, Brain Dump, Library, Settings.

_Section_: Tab Appearance

#### TAB-NAV-07

**Requirement**: Tabs shall be styled as pill-shaped buttons with subtle hover and active states:

_Section_: Tab Appearance

#### TAB-NAV-08

**Requirement**: The active tab shall expose aria-selected="true"; inactive tabs aria-selected="false".

_Section_: Tab Appearance

#### TAB-NAV-09

**Requirement**: Keyboard navigation: Tab cycles through tabs; Arrow keys move left/right; Enter activates.

_Section_: Tab Appearance

#### TAB-NAV-10

**Requirement**: The right zone shall include optional global actions: Search icon (opens overlay), Theme toggle (light/dark/auto), Account/Profile shortcut (if enabled).

_Section_: Tab Appearance

#### TAB-NAV-11

**Requirement**: On mobile, the right zone may collapse into a single overflow menu (⋯) containing Search and Theme toggle.

_Section_: Tab Appearance

#### TAB-NAV-12

**Requirement**: Notifications icon may be displayed if system notifications are enabled in Settings; unread state shall show a small accent badge.

_Section_: Tab Appearance

#### TAB-NAV-13

**Requirement**: On tablet/mobile, the Navbar shall collapse:

_Section_: Tab Appearance

#### TAB-NAV-14

**Requirement**: Hamburger menu shall slide from left with a frosted glass panel containing primary tabs in vertical list; list items have ≥48×48 px touch targets.

_Section_: Tab Appearance

#### TAB-NAV-15

**Requirement**: Active tab in hamburger list shall be bold with accent bar on the left.

_Section_: Tab Appearance

#### TAB-NAV-16

**Requirement**: Navbar background shall be semi-transparent dark (rgba(16,20,44,.30)) with blur; border-bottom uses var(--line).

_Section_: Tab Appearance

#### TAB-NAV-17

**Requirement**: Active tab background uses var(--mint) (accent); inactive uses var(--dim).

_Section_: Tab Appearance

#### TAB-NAV-18

**Requirement**: Hover/focus outlines shall use var(--mint) with ≥3px visible outline.

_Section_: Tab Appearance

#### TAB-NAV-19

**Requirement**: Global actions use consistent icon set (Feather/Lucide); icons are white (var(--ink)) at rest, accent (var(--mint)) on hover.

_Section_: Tab Appearance

#### TAB-NAV-20

**Requirement**: Navbar shall use role="navigation" with aria-label="Main".

_Section_: Tab Appearance

#### TAB-NAV-21

**Requirement**: Tab list shall use role="tablist"; each tab role="tab"; aria-selected reflects active state.

_Section_: Tab Appearance

#### TAB-NAV-22

**Requirement**: Hamburger panel shall be aria-modal when open, with focus trap and Esc to close.

_Section_: Tab Appearance

#### TAB-NAV-23

**Requirement**: Screen readers shall announce “<Tab name>, selected” or “<Tab name>, not selected” when navigating.

_Section_: Tab Appearance

#### TAB-NAV-24

**Requirement**: Reduced motion disables slide-in animation of hamburger menu; replaced with instant panel display.

_Section_: Tab Appearance

#### TAB-NAV-25

**Requirement**: Navbar load shall be instant (<100ms); skeletons are not required.

_Section_: Tab Appearance

#### TAB-NAV-26

**Requirement**: Tabs shall update instantly on selection without layout shifts.

_Section_: Tab Appearance

#### TAB-NAV-27

**Requirement**: Offline state may show a small “Offline” badge in right zone; sync status optional.

_Section_: Tab Appearance

#### TAB-NAV-28

**Requirement**: Insert desktop screenshot: Navbar with logo left, tabs centered, search/theme/profile actions right.

_Section_: Tab Appearance

#### TAB-NAV-29

**Requirement**: Insert mobile screenshots: Navbar with logo left, hamburger menu open showing vertical tab list, overflow menu (⋯) open with Search and Theme toggle.

_Section_: Tab Appearance

---

### TAB-POP - 📋 New Specifications

**Total Specifications**: 30

#### TAB-POP-01

**Requirement**: Popups and dialogs shall be displayed as frosted glass panels with 14–16px rounded corners, 1px var(--line) border, subtle shadow (var(--shadow)), and cosmic gradient dimming overlay behind.

_Section_: Tab Appearance

#### TAB-POP-02

**Requirement**: Dialogs shall be centered on desktop/tablet; on mobile, they may appear as bottom sheets (slide-up panels).

_Section_: Tab Appearance

#### TAB-POP-03

**Requirement**: The background behind a dialog shall dim with a semi-transparent overlay (rgba(0,0,0,.60)); clicking/tapping outside does not close destructive dialogs.

_Section_: Tab Appearance

#### TAB-POP-04

**Requirement**: Confirmation dialogs shall be used for destructive actions (Delete, Wipe, Reset). They shall include: Title (bold), Message text, Confirm button (destructive style, red highlight), Cancel button.

_Section_: Tab Appearance

#### TAB-POP-05

**Requirement**: Input dialogs shall collect small amounts of data (e.g., new passphrase, rename template). They shall include: Labelled input fields, Confirm/Cancel, inline validation.

_Section_: Tab Appearance

#### TAB-POP-06

**Requirement**: Informational dialogs shall provide warnings, status updates, or help. They may include a single [Close] button.

_Section_: Tab Appearance

#### TAB-POP-07

**Requirement**: Action sheets (mobile only) shall slide up from bottom, listing actions with large touch targets (≥48×48 px). Example: Move Task to Quadrant, Edit, Delete, Complete.

_Section_: Tab Appearance

#### TAB-POP-08

**Requirement**: All dialogs shall trap focus inside the modal until closed; Tab/Shift+Tab cycles elements; Esc closes (except destructive confirm, which requires button click).

_Section_: Tab Appearance

#### TAB-POP-09

**Requirement**: Confirm buttons shall require explicit click/tap; pressing Enter in a text input shall trigger confirm only when valid.

_Section_: Tab Appearance

#### TAB-POP-10

**Requirement**: Error messages (e.g., “Invalid passphrase”) shall appear inline beneath the input field and be announced to assistive tech.

_Section_: Tab Appearance

#### TAB-POP-11

**Requirement**: Progress dialogs shall show a progress bar with aria-valuenow; for example, during import/export.

_Section_: Tab Appearance

#### TAB-POP-12

**Requirement**: Dialog headers shall use var(--ink), body text var(--dim); background uses frosted panel (rgba(16,20,44,.30)); destructive confirm buttons use accent red (#ff5555 or var(--alert)); safe buttons use var(--mint).

_Section_: Tab Appearance

#### TAB-POP-13

**Requirement**: Bottom sheets shall have a visible drag handle (small bar at top), indicating swipe-to-close gesture.

_Section_: Tab Appearance

#### TAB-POP-14

**Requirement**: Focus outlines shall use var(--mint) 3px border; hover states shall brighten buttons/icons slightly.

_Section_: Tab Appearance

#### TAB-POP-15

**Requirement**: Animations: desktop dialogs fade/scale in; mobile sheets slide up; reduced motion disables animations, using instant state change.

_Section_: Tab Appearance

#### TAB-POP-16

**Requirement**: All dialogs shall use role="dialog" or role="alertdialog" with aria-modal="true"; titles linked via aria-labelledby; body text via aria-describedby.

_Section_: Tab Appearance

#### TAB-POP-17

**Requirement**: Screen readers shall announce dialog type and focus the first actionable element.

_Section_: Tab Appearance

#### TAB-POP-18

**Requirement**: Esc key closes non-destructive dialogs; destructive dialogs require explicit Cancel/Confirm.

_Section_: Tab Appearance

#### TAB-POP-19

**Requirement**: Action sheet items shall be read as buttons with aria-labels matching the action (“Move task to Important & Urgent”).

_Section_: Tab Appearance

#### TAB-POP-20

**Requirement**: Reduced motion disables scale/slide animations; overlay appears instantly.

_Section_: Tab Appearance

#### TAB-POP-21

**Requirement**: On small screens, most dialogs shall default to bottom sheets; confirm dialogs may still center if short.

_Section_: Tab Appearance

#### TAB-POP-22

**Requirement**: Swipe down on a bottom sheet shall close it, unless destructive; destructive sheets require explicit Cancel.

_Section_: Tab Appearance

#### TAB-POP-23

**Requirement**: Buttons shall be large (≥48×48 px) with comfortable spacing to prevent accidental taps.

_Section_: Tab Appearance

#### TAB-POP-24

**Requirement**: Opening a dialog shall mount it instantly (<100ms); skeleton not required.

_Section_: Tab Appearance

#### TAB-POP-25

**Requirement**: Progress dialogs shall throttle UI updates (max 5/sec) to avoid screen reader spam.

_Section_: Tab Appearance

#### TAB-POP-26

**Requirement**: Invalid input shall block confirmation until corrected; error text inline; confirm button disabled if mandatory field missing.

_Section_: Tab Appearance

#### TAB-POP-27

**Requirement**: Failure states (e.g., import error) shall show persistent warning dialog with actions [Retry], [Export error log], [Dismiss].

_Section_: Tab Appearance

#### TAB-POP-28

**Requirement**: Insert desktop screenshot: centered confirmation dialog with Title, Message, Confirm (red), Cancel.

_Section_: Tab Appearance

#### TAB-POP-29

**Requirement**: Insert mobile screenshots: bottom action sheet with task actions (Move, Edit, Delete, Complete); swipe-to-close visible.

_Section_: Tab Appearance

#### TAB-POP-30

**Requirement**: Insert progress dialog screenshot showing progress bar and Cancel button.

_Section_: Tab Appearance

---

### TAB-RTN - 📋 New Specifications

**Total Specifications**: 58

#### TAB-RTN-01

**Requirement**: The Routines screen shall show (top to bottom): a toolbar (Routine Management Buttons), a “Current Routine” runner panel (if a routine is in progress), and a Library grid/list of saved routines.

_Section_: Tab Appearance

#### TAB-RTN-02

**Requirement**: The visual design shall use frosted glass cards with subtle shadows and thin borders (border: 1px var(--line)), white/ink text (var(--ink)), and dim secondary text (var(--dim)), consistent with styles.css.

_Section_: Tab Appearance

#### TAB-RTN-03

**Requirement**: The “Current Routine” runner shall feature a prominent progress indicator (horizontal progress bar at top of the card) and a step triptych: Previous (dim), Current (enlarged with glow/accent), Next (smaller preview).

_Section_: Tab Appearance

#### TAB-RTN-04

**Requirement**: Routine Library entries shall render as cards showing: Title, Tags, Version, Estimated Duration, and Last Used, with a primary button [Start] and a secondary menu [⋯] for Edit, Duplicate, Delete, Export.

_Section_: Tab Appearance

#### TAB-RTN-05

**Requirement**: The toolbar shall include: [New Routine], [Import], [Export], [Filter], [Sort], [Toggle Completed], [View: Grid/List].

_Section_: Tab Appearance

#### TAB-RTN-06

**Requirement**: Filter shall include by Tag, Duration range, Last Used, and Energy tags (e.g., “low energy”).

_Section_: Tab Appearance

#### TAB-RTN-07

**Requirement**: Sort shall include by Title, Last Used, Duration, Recently Edited.

_Section_: Tab Appearance

#### TAB-RTN-08

**Requirement**: “New Routine” opens a create dialog: Title (required), Tags (chips), Estimated Duration (auto/override), Steps table (label + timer duration), Optional Energy tag, Optional Brain Dump link.

_Section_: Tab Appearance

#### TAB-RTN-09

**Requirement**: The runner card shall present the global progress bar along the top edge; underneath, a 3-panel step triptych
aligned horizontally: Previous (left, 60–70% scale, 50% opacity), Current (center, 100% scale, glow ring),
Next (right, 85% scale, 80% opacity).

_Section_: Tab Appearance

#### TAB-RTN-10

**Requirement**: The Current step panel shall display: Step Title (bold), Countdown timer (mm:ss), Optional Description (sanitised Markdown), and Controls row.

_Section_: Tab Appearance

#### TAB-RTN-11

**Requirement**: Controls row (Current step) shall include: [Complete], [Skip], [Pause/Resume], [Reorder], [Brain Dump], [Cancel], with accessible labels and large touch targets (≥48×48 px).

_Section_: Tab Appearance

#### TAB-RTN-12

**Requirement**: A compact log strip may appear under the controls, appending each completed/skipped step with timestamp and actual duration.

_Section_: Tab Appearance

#### TAB-RTN-13

**Requirement**: Pressing [Complete] shall mark the step done, log the timestamp and duration, award XP per the XP logic, and advance to the next step.

_Section_: Tab Appearance

#### TAB-RTN-14

**Requirement**: Pressing [Skip] shall mark the step skipped (no base XP; see XP logic), and advance; the log notes the skip reason if provided.

_Section_: Tab Appearance

#### TAB-RTN-15

**Requirement**: [Pause/Resume] shall freeze/unfreeze the step countdown and visibly change the timer state; the global progress bar should also pause visually (striped or dimmed).

_Section_: Tab Appearance

#### TAB-RTN-16

**Requirement**: [Reorder] shall enable drag handles on the steps list (drawer or overlay) to move steps; the runner rebinds to the new order without losing history.

_Section_: Tab Appearance

#### TAB-RTN-17

**Requirement**: [Brain Dump] shall open a linked Note (or create a new one) in a side panel or overlay; closing returns to the runner without data loss.

_Section_: Tab Appearance

#### TAB-RTN-18

**Requirement**: [Cancel] shall prompt a confirmation dialog (“Keep partial progress?” Yes/No); Yes preserves logs and partial XP; No discards the in-progress run.

_Section_: Tab Appearance

#### TAB-RTN-19

**Requirement**: Each step shall have attributes: Label (text), Timer (seconds / mm:ss), Optional Description (Markdown), Optional Energy hint (text/chip).

_Section_: Tab Appearance

#### TAB-RTN-20

**Requirement**: The steps list (editor mode) shall support: Add step, Duplicate step, Delete step, and Drag to reorder (desktop/tablet); on mobile, long-press opens a reorder sheet.

_Section_: Tab Appearance

#### TAB-RTN-21

**Requirement**: Step timers shall accept values from 10s to 2h; invalid values show inline error messages and are prevented from saving.

_Section_: Tab Appearance

#### TAB-RTN-22

**Requirement**: Base step XP shall be 1 XP when a step is completed.

_Section_: Tab Appearance

#### TAB-RTN-23

**Requirement**: On-time step bonus shall be +1 XP if the step is completed with time remaining (timer not expired); if paused, only actual active time counts.

_Section_: Tab Appearance

#### TAB-RTN-24

**Requirement**: Skipped steps shall not earn base XP nor on-time bonus; if “Skip with Reason” is used, the log records the reason for later review in Statistics.

_Section_: Tab Appearance

#### TAB-RTN-25

**Requirement**: Routine completion bonus shall be 2 XP plus floor(total_steps / 5), capped at +4 XP; example: 1–5 steps = +2 XP, 6–10 steps = +3 XP, 11–15 steps = +4 XP.

_Section_: Tab Appearance

#### TAB-RTN-26

**Requirement**: Perfect routine bonus shall be +2 XP if all steps in the routine were completed on-time (each step earned its on-time bonus).

_Section_: Tab Appearance

#### TAB-RTN-27

**Requirement**: The runner shall show a small XP tally area near the timer that updates on each completion (“+1 XP”, “+2 XP”), and a total XP counter for the current run (e.g., “Run XP: 9”).

_Section_: Tab Appearance

#### TAB-RTN-28

**Requirement**: On final completion, a summary modal shall display: Steps completed/skipped, On-time percentage, Total XP (sum of step base + step bonuses + routine bonus [+ perfect bonus if any]).

_Section_: Tab Appearance

#### TAB-RTN-29

**Requirement**: Confetti shall trigger on routine completion; confetti density shall scale slightly with On-time percentage; reduced motion replaces confetti with a success glow and toast.

_Section_: Tab Appearance

#### TAB-RTN-30

**Requirement**: Haptics (mobile): Short pulse per completed step; stronger double pulse for on-time bonus; strong triple buzz for final completion and bonus awards.

_Section_: Tab Appearance

#### TAB-RTN-31

**Requirement**: The summary modal shall include: Routine Title, Duration planned vs actual, Steps completed/skipped list,
On-time %, XP breakdown (base steps, on-time bonuses, routine bonus, perfect bonus), and actions [Save as Template],
[View Log], [Close].

_Section_: Tab Appearance

#### TAB-RTN-32

**Requirement**: “Save as Template” shall capture the current routine configuration (including any re-ordered steps) into the Library; logs are not included in templates.

_Section_: Tab Appearance

#### TAB-RTN-33

**Requirement**: The runner’s global progress bar shall use the app accent color (e.g., var(--mint)) and animate smoothly (var(--ease), var(--dur)); background remains glass with blur (var(--glass-hi/lo)).

_Section_: Tab Appearance

#### TAB-RTN-34

**Requirement**: The Current step card shall have a subtle glow ring or 4px left border using the accent color; Previous is dimmed (opacity ~0.5), Next is slightly smaller (85–90% scale).

_Section_: Tab Appearance

#### TAB-RTN-35

**Requirement**: Buttons shall be pill-shaped with hover/active transitions, using the existing button styles in styles.css; destructive actions (Cancel) shall use a caution style (e.g., border with higher contrast).

_Section_: Tab Appearance

#### TAB-RTN-36

**Requirement**: Secondary text (timers, hints) shall use var(--dim); borders use var(--line); primary text uses var(--ink).

_Section_: Tab Appearance

#### TAB-RTN-37

**Requirement**: The runner shall occupy most of the viewport in a single column; the step triptych becomes a horizontal swipe view: (Previous ←) [Current] (→ Next).

_Section_: Tab Appearance

#### TAB-RTN-38

**Requirement**: Controls shall be shown as a sticky bottom bar with large buttons: Complete, Pause/Resume, Skip; overflow menu (⋯) contains Reorder, Brain Dump, Cancel.

_Section_: Tab Appearance

#### TAB-RTN-39

**Requirement**: Swiping shall be disabled while the action sheet is open; gestures shall not interfere with Pause/Resume and Complete buttons (priority capture).

_Section_: Tab Appearance

#### TAB-RTN-40

**Requirement**: Long routines (≥20 steps) shall virtualise the steps list to maintain smooth scrolling in the editor; the runner view always focuses the Current step.

_Section_: Tab Appearance

#### TAB-RTN-41

**Requirement**: Haptics shall fire on key interactions: Complete (short), Skip (short double), Pause/Resume (subtle), Final completion (strong).

_Section_: Tab Appearance

#### TAB-RTN-42

**Requirement**: The global progress bar shall use role="progressbar" with aria-valuenow, aria-valuemin=0, aria-valuemax=100; text label announces “Routine progress X%”.

_Section_: Tab Appearance

#### TAB-RTN-43

**Requirement**: The countdown timer shall update an aria-live="polite" region once per second (or less when reduced motion is enabled); do not spam the live region on every tick when screen readers are active (throttle announcements).

_Section_: Tab Appearance

#### TAB-RTN-44

**Requirement**: All runner controls shall have explicit aria-labels and visible focus outlines; keyboard shortcuts: Space = Complete, P = Pause/Resume, S = Skip, R = Reorder, N = Brain Dump, Esc = Cancel (with confirmation).

_Section_: Tab Appearance

#### TAB-RTN-45

**Requirement**: Reduced motion shall disable animated scale/glow on Current step and replace with a high-contrast border and static state changes; confetti disabled, toast retained.

_Section_: Tab Appearance

#### TAB-RTN-46

**Requirement**: Colour contrast for all text and controls shall meet WCAG 2.1 AA; timers and diminutive labels must remain ≥4.5:1 against the background.

_Section_: Tab Appearance

#### TAB-RTN-47

**Requirement**: Export of a routine shall include: id, title, tags, version, estimated duration, steps (label, seconds, description), and energy tag; export may exclude run logs by default.

_Section_: Tab Appearance

#### TAB-RTN-48

**Requirement**: Import shall validate schema and on success place the routine in the Library; conflicting ids shall be re-id’d while preserving step order.

_Section_: Tab Appearance

#### TAB-RTN-49

**Requirement**: Round-trip import/export shall be lossless for definitions (not logs): IDs may be regenerated on import if collision occurs, but internal step order and fields must be preserved exactly.

_Section_: Tab Appearance

#### TAB-RTN-50

**Requirement**: Starting a run shall persist an in-progress state so that accidental refresh/close will allow “Resume run?” on next open; the in-progress state includes current step index, remaining seconds, and partial logs.

_Section_: Tab Appearance

#### TAB-RTN-51

**Requirement**: Initial Routines load shall show skeleton cards for Library and a skeleton runner if a routine is in progress; hydration fills content once data is ready.

_Section_: Tab Appearance

#### TAB-RTN-52

**Requirement**: The runner shall maintain smooth updates (target 60 FPS where possible) by limiting DOM reflows (e.g., requestAnimationFrame for timer rendering) and throttling aria-live updates.

_Section_: Tab Appearance

#### TAB-RTN-53

**Requirement**: If a timer is invalid or negative, the runner shall refuse to start and show an inline error under the offending step field.

_Section_: Tab Appearance

#### TAB-RTN-54

**Requirement**: If a routine was edited during a run (in another tab), attempting to continue shall prompt to “Reload routine definition” (recommended) or “Continue with cached order” (advanced).

_Section_: Tab Appearance

#### TAB-RTN-55

**Requirement**: Insert desktop runner screenshot showing: global progress bar (accent color), step triptych (Prev dimmed, Current glow, Next preview), and controls row.

_Section_: Tab Appearance

#### TAB-RTN-56

**Requirement**: Insert mobile screenshots showing: full-height runner with horizontal swipe between steps, sticky bottom control bar, and overflow menu (⋯).

_Section_: Tab Appearance

#### TAB-RTN-57

**Requirement**: Insert completion summary modal screenshot showing: steps list with statuses, on-time %, and XP breakdown (step base, step bonuses, routine bonus, perfect bonus).

_Section_: Tab Appearance

#### TAB-RTN-58

**Requirement**: Insert Library grid/list screenshots with routine cards showing Title, Tags, Version, Estimated Duration, Last Used, and [Start] / [⋯] controls.

_Section_: Tab Appearance

---

### TAB-SCH - 📋 New Specifications

**Total Specifications**: 52

#### TAB-SCH-01

**Requirement**: The Schedule screen shall show (left→right): a sidebar (agenda/shortcuts) and a main calendar area; on small screens, the layout stacks vertically (sidebar above calendar).

_Section_: Tab Appearance

#### TAB-SCH-02

**Requirement**: The main calendar shall support Day view (default) and Week view; Month view may be provided as a high-level overview (non-editable).

_Section_: Tab Appearance

#### TAB-SCH-03

**Requirement**: The calendar grid shall render a left time column and a right slots column; hours are divided into fixed rows.

_Section_: Tab Appearance

#### TAB-SCH-04

**Requirement**: The visible hour range shall be 06:00–21:00 by default (as in the mock-up), configurable in Settings.

_Section_: Tab Appearance

#### TAB-SCH-05

**Requirement**: The grid shall use two columns: .hours { grid-template-columns: 80px 1fr } with .hour-col on the right drawing horizontal guides at each time row.

_Section_: Tab Appearance

#### TAB-SCH-06

**Requirement**: Each hour row shall be 46px tall (per styles.css .hour-col rows: repeat(16, 46px)), with a dashed bottom border (var(--line)).

_Section_: Tab Appearance

#### TAB-SCH-07

**Requirement**: Time labels in the left column shall show “06:00, 07:00, … 21:00” in dim text (var(--dim)), aligned to the corresponding row.

_Section_: Tab Appearance

#### TAB-SCH-08

**Requirement**: A “now” marker (thin line) shall be displayed if the current time is within the visible range; scrolled into view on load.

_Section_: Tab Appearance

#### TAB-SCH-09

**Requirement**: Scheduled items shall render as absolutely positioned .block elements inside .slots, with top = pixels from 06:00 and height proportional to duration.

_Section_: Tab Appearance

#### TAB-SCH-10

**Requirement**: Blocks shall show a title (top-left, bold) and a meta line (bottom-left) of either “HH:MM–HH:MM” or a single time for punctual tasks.

_Section_: Tab Appearance

#### TAB-SCH-11

**Requirement**: Routine blocks shall include an internal progress bar near the bottom of the block: .progress { height: 6px } with a gradient fill (.progress i) using #8ec8ff → #86f5e0 as in styles.css.

_Section_: Tab Appearance

#### TAB-SCH-12

**Requirement**: Task blocks shall use the .block.task style (lighter purple-tinted glass with border-color rgba(200,180,255,.24)); other block types use the default .block style (blue-tinted glass).

_Section_: Tab Appearance

#### TAB-SCH-13

**Requirement**: Overlapping blocks shall shift horizontally (smart offset) to keep titles readable; the rightmost block can overlay with increased z-index when hovered/focused.

_Section_: Tab Appearance

#### TAB-SCH-14

**Requirement**: New events shall be created only from existing entities: Task, Routine, Habit (reminder), Note (reference).

_Section_: Tab Appearance

#### TAB-SCH-15

**Requirement**: Users shall be able to create an event by: (a) dragging on the grid to select a time span (desktop/tablet), (b) tapping a “+” in the hour gutter (mobile), or (c) converting an entity via “Schedule” action.

_Section_: Tab Appearance

#### TAB-SCH-16

**Requirement**: Resizing an event shall be done by dragging the bottom edge; moving an event shall be done by dragging the block vertically (and horizontally into another day in Week view).

_Section_: Tab Appearance

#### TAB-SCH-17

**Requirement**: When an event is moved/resized, a snap-to grid of 15 minutes shall apply (configurable), with a visual ghost preview.

_Section_: Tab Appearance

#### TAB-SCH-18

**Requirement**: Clicking a block shall open a compact details popup anchored to the block: title, type (Task/Routine/Habit/Note), category chips, time span, and source link [Open source].

_Section_: Tab Appearance

#### TAB-SCH-19

**Requirement**: The details popup shall provide actions: Edit time, Change day, Duplicate, Delete, and for Routines: [Start in Runner]; for Tasks: [Mark done]; for Habits: [Mark today].

_Section_: Tab Appearance

#### TAB-SCH-20

**Requirement**: The [Open source] action shall navigate to the originating entity in its tab, setting an internal navigation flag that suppresses the beforeunload export prompt (as in schedule.html’s internal-nav logic).

_Section_: Tab Appearance

#### TAB-SCH-21

**Requirement**: The planner shall propose the next free slot for a selected entity, ensuring a default 15-minute break between items; user can override.

_Section_: Tab Appearance

#### TAB-SCH-22

**Requirement**: Conflicting events shall be indicated with a subtle red edge on both blocks and an inline message in the popup, offering “Keep overlap” or “Shift to next free slot”.

_Section_: Tab Appearance

#### TAB-SCH-23

**Requirement**: Starting a Routine from the calendar shall open the Runner overlay (full-screen glass panel) centered on the viewport (per #runner in schedule.html).

_Section_: Tab Appearance

#### TAB-SCH-24

**Requirement**: The Runner overlay shall display the Routine title, elapsed/remaining time, a horizontal progress bar (accent var(--mint)), and controls [Start/Pause/Stop/Skip/Close] with icons (per mock-up).

_Section_: Tab Appearance

#### TAB-SCH-25

**Requirement**: The Runner overlay shall be dismissible via [Close] or Esc; dismissing pauses the routine unless explicitly Stopped.

_Section_: Tab Appearance

#### TAB-SCH-26

**Requirement**: On Runner progress, the corresponding calendar block’s .progress i width shall update (e.g., style="width:30%") live; reduced motion throttles visual updates.

_Section_: Tab Appearance

#### TAB-SCH-27

**Requirement**: The calendar container shall use a glass panel background (rgba(16,20,44,.30)) with a 1px border var(--line) and 14px radius (styles.css .calendar).

_Section_: Tab Appearance

#### TAB-SCH-28

**Requirement**: Blocks (.block) shall use the blue glass background with border rgba(150,200,255,.24); task blocks (.block.task) shall use a purple glass background with border rgba(200,180,255,.24).

_Section_: Tab Appearance

#### TAB-SCH-29

**Requirement**: Titles shall use var(--ink), meta lines use var(--dim); focus outlines shall use var(--mint) on keyboard focus (matching global focus style).

_Section_: Tab Appearance

#### TAB-SCH-30

**Requirement**: The internal progress gradient shall be exactly linear-gradient(90deg, #8ec8ff, #86f5e0) as in styles.css .progress i.

_Section_: Tab Appearance

#### TAB-SCH-31

**Requirement**: The top toolbar shall include: [Today], [Previous], [Next], [View: Day/Week/Month], [Filter], [Export], [Import].

_Section_: Tab Appearance

#### TAB-SCH-32

**Requirement**: [Filter] shall filter by Type (Task/Routine/Habit/Note), Category, Tag, and Status (Completed/Active); filters persist per session.

_Section_: Tab Appearance

#### TAB-SCH-33

**Requirement**: The sidebar shall list the day’s items in chronological order (compact agenda), with quick actions (open source, start runner, mark done); clicking an agenda item scrolls the grid to its block.

_Section_: Tab Appearance

#### TAB-SCH-34

**Requirement**: The layout shall stack vertically: toolbar → agenda (sidebar) → calendar grid; the agenda becomes the default view for narrow screens (< 768px).

_Section_: Tab Appearance

#### TAB-SCH-35

**Requirement**: Creating an event on mobile shall use a “+ Add at…” sheet offering common start times (Now, +30m, +1h, Evening) and an option “Pick time…”.

_Section_: Tab Appearance

#### TAB-SCH-36

**Requirement**: Blocks shall be draggable only vertically on mobile; resizing uses a handle with increased hit area; all controls must meet ≥48×48 px touch targets.

_Section_: Tab Appearance

#### TAB-SCH-37

**Requirement**: The details popup shall present as a bottom sheet with large buttons; swipe down to dismiss; [Start in Runner] is sticky and prominent for Routines.

_Section_: Tab Appearance

#### TAB-SCH-38

**Requirement**: The time grid shall use role="grid"; hour labels act as row headers; blocks are focusable elements with aria-label “<Title>, <Type>, <Start–End>”.

_Section_: Tab Appearance

#### TAB-SCH-39

**Requirement**: Keyboard: Arrow keys move the time focus by 15 minutes; Shift+Arrow extends the selection; Enter opens the details popup; Delete removes the selected event.

_Section_: Tab Appearance

#### TAB-SCH-40

**Requirement**: Focus outlines for blocks and toolbar items shall use the global focus style (outline: 3px var(--mint)); popup sheets shall be aria-modal with focus trap.

_Section_: Tab Appearance

#### TAB-SCH-41

**Requirement**: Reduced motion: disable animated block transitions and progress bar easing; instead, update progress steps discretely; screen readers receive polite announcements for schedule changes.

_Section_: Tab Appearance

#### TAB-SCH-42

**Requirement**: Export shall include a “ScheduleEvent” array with: id, type (task/routine/habit/note), ref (entity id), day (YYYY-MM-DD), start (HH:MM), dur_min, and optional meta; import shall validate schema and re-link to existing entities by id.

_Section_: Tab Appearance

#### TAB-SCH-43

**Requirement**: On import, if a referenced entity is missing, the event is imported in a “detached” state with a warning badge and a toast linking to remediation (“Map to existing…”).

_Section_: Tab Appearance

#### TAB-SCH-44

**Requirement**: Round-trip import/export shall preserve positions, durations, and links to entities; when a collision occurs (same id and time), user chooses Replace, Duplicate, or Skip.

_Section_: Tab Appearance

#### TAB-SCH-45

**Requirement**: Initial load shall render skeleton hours and a skeleton block list; hydration applies .block elements; target smooth scroll/drag at 60 FPS where possible.

_Section_: Tab Appearance

#### TAB-SCH-46

**Requirement**: Virtualize long days (many blocks) to maintain performance; only visible blocks are mounted; off-screen blocks mount on scroll.

_Section_: Tab Appearance

#### TAB-SCH-47

**Requirement**: Offline operation: creating/moving/resizing events shall persist locally; if sync is enabled, changes queue for later; an “Offline” badge appears near the toolbar.

_Section_: Tab Appearance

#### TAB-SCH-48

**Requirement**: Invalid times (end before start) shall be prevented and flagged inline; snapping corrects minor overlaps if user confirms.

_Section_: Tab Appearance

#### TAB-SCH-49

**Requirement**: If an entity is deleted while its event is open, closing the popup shall show a non-blocking toast and remove or detach the block as appropriate.

_Section_: Tab Appearance

#### TAB-SCH-50

**Requirement**: Insert desktop Day view screenshot showing: hour grid (06:00–21:00), a Routine block with internal progress bar, and a Task block; include overlapping example.

_Section_: Tab Appearance

#### TAB-SCH-51

**Requirement**: Insert Runner overlay screenshot showing title, elapsed/remaining, progress, and Start/Pause/Stop/Skip/Close controls.

_Section_: Tab Appearance

#### TAB-SCH-52

**Requirement**: Insert mobile screenshots showing: agenda list (default), bottom-sheet event details with large actions, and drag-resize handles on a block.

_Section_: Tab Appearance

---

### TAB-SEC - 📋 New Specifications

**Total Specifications**: 42

#### TAB-SEC-01

**Requirement**: Security workflows shall be accessible from the Settings tab (Security section). Each workflow opens in a frosted glass modal or drawer, with accent colours for clarity.

_Section_: Tab Appearance

#### TAB-SEC-02

**Requirement**: Passphrase setup shall display fields: New passphrase, Confirm passphrase, and an inline Strength meter.

_Section_: Tab Appearance

#### TAB-SEC-03

**Requirement**: The Strength meter shall classify passphrases as Weak, Medium, Strong based on entropy, updated live as user types.

_Section_: Tab Appearance

#### TAB-SEC-04

**Requirement**: A Save button shall remain disabled until both fields match and meet minimum strength criteria.

_Section_: Tab Appearance

#### TAB-SEC-05

**Requirement**: Error states (mismatch, weak) shall appear inline with aria-describedby; screen readers announce the error immediately.

_Section_: Tab Appearance

#### TAB-SEC-06

**Requirement**: A toast shall confirm successful save: “Passphrase updated”.

_Section_: Tab Appearance

#### TAB-SEC-07

**Requirement**: The Unlock dialog shall appear on app launch or after auto-lock. It shall include: Passphrase field, Show/Hide toggle, and [Unlock] button.

_Section_: Tab Appearance

#### TAB-SEC-08

**Requirement**: Incorrect passphrase shall trigger an inline error “Incorrect passphrase”; the input field shall shake slightly (reduced motion disables the shake).

_Section_: Tab Appearance

#### TAB-SEC-09

**Requirement**: Optional Biometric unlock button shall appear if device supports it; fallback always available via passphrase.

_Section_: Tab Appearance

#### TAB-SEC-10

**Requirement**: Unlock dialog shall trap focus until dismissed; Esc closes only if Unlock is not required (e.g., optional relock).

_Section_: Tab Appearance

#### TAB-SEC-11

**Requirement**: Auto-lock shall trigger after configured inactivity; a modal shall overlay the app with “Session locked” message.

_Section_: Tab Appearance

#### TAB-SEC-12

**Requirement**: Modal shall include [Unlock] and [Cancel session] buttons; [Cancel session] wipes in-memory keys and requires full login.

_Section_: Tab Appearance

#### TAB-SEC-13

**Requirement**: Countdown (optional) may be displayed before auto-lock engages, with toast “Locking in 10s…”.

_Section_: Tab Appearance

#### TAB-SEC-14

**Requirement**: Wipe All Data shall open a destructive confirmation dialog: Title “Delete all data?”, Message “This cannot be undone. Type CONFIRM to proceed.”

_Section_: Tab Appearance

#### TAB-SEC-15

**Requirement**: Confirm button shall remain disabled until the user types CONFIRM in uppercase letters.

_Section_: Tab Appearance

#### TAB-SEC-16

**Requirement**: On confirm, local data (IndexedDB, OPFS, localStorage) shall be deleted; app reloads to onboarding state.

_Section_: Tab Appearance

#### TAB-SEC-17

**Requirement**: A success toast shall appear after reload: “All data wiped”.

_Section_: Tab Appearance

#### TAB-SEC-18

**Requirement**: Export Key shall open a modal showing the encryption key in two forms: Base64 string and QR code.

_Section_: Tab Appearance

#### TAB-SEC-19

**Requirement**: A warning message shall be displayed: “Keep this key private. Anyone with it can read your data.”

_Section_: Tab Appearance

#### TAB-SEC-20

**Requirement**: Buttons: [Copy to clipboard], [Download .key file], [Close]. Copy shows toast “Key copied”.

_Section_: Tab Appearance

#### TAB-SEC-21

**Requirement**: Export key modal shall be aria-modal, with Esc closing and focus returning to Settings.

_Section_: Tab Appearance

#### TAB-SEC-22

**Requirement**: Passphrase fields shall use frosted inputs with accent border (var(--mint)) when focused.

_Section_: Tab Appearance

#### TAB-SEC-23

**Requirement**: Strength meter shall use colours: Weak=var(--alert), Medium=#f2c94c (yellow), Strong=var(--mint).

_Section_: Tab Appearance

#### TAB-SEC-24

**Requirement**: Error messages shall be red (#ff5555), success toasts green (var(--mint)).

_Section_: Tab Appearance

#### TAB-SEC-25

**Requirement**: Wipe confirm dialog shall style Confirm button as red destructive (var(--alert)); Cancel button dim (var(--dim)).

_Section_: Tab Appearance

#### TAB-SEC-26

**Requirement**: Export Key modal QR code shall be displayed in high contrast (black/white only).

_Section_: Tab Appearance

#### TAB-SEC-27

**Requirement**: All security modals shall appear as full-screen sheets on mobile, with sticky action buttons at bottom (Confirm/Cancel).

_Section_: Tab Appearance

#### TAB-SEC-28

**Requirement**: Passphrase fields shall support password managers (autocomplete="current-password/new-password").

_Section_: Tab Appearance

#### TAB-SEC-29

**Requirement**: Typing CONFIRM in wipe dialog shall auto-capitalise input on mobile keyboards for convenience.

_Section_: Tab Appearance

#### TAB-SEC-30

**Requirement**: All dialogs shall use role="dialog" or role="alertdialog" with aria-modal="true"; titles linked via aria-labelledby; error/help text via aria-describedby.

_Section_: Tab Appearance

#### TAB-SEC-31

**Requirement**: Passphrase strength meter shall include a text label for screen readers (e.g., “Strength: Weak”).

_Section_: Tab Appearance

#### TAB-SEC-32

**Requirement**: Unlock errors shall be announced politely but immediately (“Incorrect passphrase”).

_Section_: Tab Appearance

#### TAB-SEC-33

**Requirement**: QR code in Export Key shall be accompanied by a selectable text version for screen readers.

_Section_: Tab Appearance

#### TAB-SEC-34

**Requirement**: Reduced motion disables shaking effect on incorrect passphrase; error feedback remains via text and outline.

_Section_: Tab Appearance

#### TAB-SEC-35

**Requirement**: Unlock modal shall appear instantly (<100ms); biometric prompt defers to device OS timing.

_Section_: Tab Appearance

#### TAB-SEC-36

**Requirement**: Wipe operation shall complete within 2 seconds for typical datasets; a progress spinner appears if longer.

_Section_: Tab Appearance

#### TAB-SEC-37

**Requirement**: Invalid passphrase entries shall not allow unlock until corrected.

_Section_: Tab Appearance

#### TAB-SEC-38

**Requirement**: Export key failures (clipboard denied, file write error) shall show clear inline error with retry.

_Section_: Tab Appearance

#### TAB-SEC-39

**Requirement**: If wipe fails (e.g., storage locked), user shall see persistent banner “Data wipe failed. Please retry.”

_Section_: Tab Appearance

#### TAB-SEC-40

**Requirement**: Insert desktop screenshots: Passphrase setup with strength meter, Unlock dialog with error, Wipe confirmation modal.

_Section_: Tab Appearance

#### TAB-SEC-41

**Requirement**: Insert mobile screenshots: full-screen Unlock sheet with sticky Unlock button, Export Key QR code modal with Copy/Download buttons.

_Section_: Tab Appearance

#### TAB-SEC-42

**Requirement**: Insert data wipe success state screenshot (post-reload onboarding).

_Section_: Tab Appearance

---

### TAB-SET - 📋 New Specifications

**Total Specifications**: 44

#### TAB-SET-01

**Requirement**: The Settings screen shall display grouped categories of options, each within frosted glass cards, separated by headings: General, Security, Accessibility, Data & Storage, Notifications, About.

_Section_: Tab Appearance

#### TAB-SET-02

**Requirement**: On desktop, categories shall be laid out in a tabbed interface (horizontal tab bar or side nav). On mobile, categories shall appear as collapsible accordion sections.

_Section_: Tab Appearance

#### TAB-SET-03

**Requirement**: Visual design: frosted glass panels with 14–16px rounded corners, 1px var(--line) borders, subtle shadows (var(--shadow)), and consistent cosmic gradient background.

_Section_: Tab Appearance

#### TAB-SET-04

**Requirement**: General shall include: Language selector, Theme (Light / Dark / Auto), Date/Time format, First-day-of-week selector, and Time zone (auto/manual).

_Section_: Tab Appearance

#### TAB-SET-05

**Requirement**: Language selector shall use a dropdown with preview text (“Bonjour / Hello”) for clarity.

_Section_: Tab Appearance

#### TAB-SET-06

**Requirement**: Theme selection shall preview the choice in a small swatch or live background.

_Section_: Tab Appearance

#### TAB-SET-07

**Requirement**: Security shall include: Passphrase setup/change, Biometric unlock (if supported), Auto-lock timeout, Export key (QR/Base64), and Wipe all data.

_Section_: Tab Appearance

#### TAB-SET-08

**Requirement**: Passphrase setup shall include fields: New passphrase, Confirm, Strength meter, and Save. Validation prevents weak or mismatched entries.

_Section_: Tab Appearance

#### TAB-SET-09

**Requirement**: Auto-lock timeout shall be a dropdown (e.g., 1 min, 5 min, 15 min, 1h, Never).

_Section_: Tab Appearance

#### TAB-SET-10

**Requirement**: Wipe all data shall require typing CONFIRM and pressing a red destructive button; confirmation dialog is aria-modal with focus trap.

_Section_: Tab Appearance

#### TAB-SET-11

**Requirement**: Accessibility shall include: Reduced motion (toggle), Font scaling (slider 80%–200%), High contrast mode (toggle), Simplified interface (toggle), Sound/haptics (toggles).

_Section_: Tab Appearance

#### TAB-SET-12

**Requirement**: Reduced motion disables animations/confetti and uses static outlines instead.

_Section_: Tab Appearance

#### TAB-SET-13

**Requirement**: Simplified interface hides advanced settings, showing only essentials.

_Section_: Tab Appearance

#### TAB-SET-14

**Requirement**: Font scaling previews the selected scaling immediately in a sample text.

_Section_: Tab Appearance

#### TAB-SET-15

**Requirement**: Data & Storage shall include: Auto-cleanup (toggle), Per-item overrides (checkbox per entity type), Default export format (dropdown: JSON, .sj.enc, Markdown, HTML), Enable SHA256 checksums (toggle).

_Section_: Tab Appearance

#### TAB-SET-16

**Requirement**: Auto-cleanup shall allow specifying retention (7/30/90 days).

_Section_: Tab Appearance

#### TAB-SET-17

**Requirement**: Export defaults shall persist until changed, applied across all tabs.

_Section_: Tab Appearance

#### TAB-SET-18

**Requirement**: Import/Export paths shall be listed, with a [Clear history] button for local storage references.

_Section_: Tab Appearance

#### TAB-SET-19

**Requirement**: Notifications shall include: Quiet hours (time range picker), Snooze (preset intervals: 5m, 10m, 30m, 1h), Per-category toggles (Tasks, Routines, Habits, Brain Dump).

_Section_: Tab Appearance

#### TAB-SET-20

**Requirement**: Notification preview shall allow sending a test notification to confirm system/browser permissions.

_Section_: Tab Appearance

#### TAB-SET-21

**Requirement**: About shall show: Version number, Maintainer info, Project description, License type, Credits (fonts, icons, libraries), and a Support link (to GitHub issues or email).

_Section_: Tab Appearance

#### TAB-SET-22

**Requirement**: Tagline (“Explore your orbit. Follow your path.”) shall be displayed with brand font in accent colour.

_Section_: Tab Appearance

#### TAB-SET-23

**Requirement**: All settings changes shall save immediately on toggle or selection; destructive actions (Wipe all data, Reset to defaults) shall require explicit confirmation.

_Section_: Tab Appearance

#### TAB-SET-24

**Requirement**: A “Reset to default” button shall be available in each category card (optional).

_Section_: Tab Appearance

#### TAB-SET-25

**Requirement**: A search bar shall allow quick filtering of settings by keyword; matches highlight corresponding controls.

_Section_: Tab Appearance

#### TAB-SET-26

**Requirement**: Section headers shall use bold var(--ink) text with accent underline; inactive tabs use var(--dim).

_Section_: Tab Appearance

#### TAB-SET-27

**Requirement**: Toggles shall use accent colours when active (var(--mint)) and muted grey when inactive.

_Section_: Tab Appearance

#### TAB-SET-28

**Requirement**: Sliders (e.g., font scaling) shall show value labels and coloured track (accent for filled, var(--line) for unfilled).

_Section_: Tab Appearance

#### TAB-SET-29

**Requirement**: Layout shall collapse into accordion sections (General, Security, Accessibility, etc.); only one section may expand at a time.

_Section_: Tab Appearance

#### TAB-SET-30

**Requirement**: Floating action buttons are not required; destructive actions appear inline (with red highlight).

_Section_: Tab Appearance

#### TAB-SET-31

**Requirement**: All touch targets (toggles, sliders, dropdowns) shall meet ≥48×48 px minimum.

_Section_: Tab Appearance

#### TAB-SET-32

**Requirement**: All controls shall use native elements (checkbox, radio, select, slider) with appropriate aria roles and labels.

_Section_: Tab Appearance

#### TAB-SET-33

**Requirement**: Keyboard navigation: Tab cycles through controls; Space/Enter toggles; Esc closes modals/drawers.

_Section_: Tab Appearance

#### TAB-SET-34

**Requirement**: Screen reader announcements: each setting’s name, current value, and state (on/off); live region updates for Save confirmation (“Setting updated”).

_Section_: Tab Appearance

#### TAB-SET-35

**Requirement**: Reduced motion disables transitions between tabs/accordions; focus states remain visible and consistent.

_Section_: Tab Appearance

#### TAB-SET-36

**Requirement**: Export/Import shall apply to all settings when selected, storing values in a config.json alongside entity data; import shall validate schema.

_Section_: Tab Appearance

#### TAB-SET-37

**Requirement**: Round-trip import/export shall be lossless; invalid or unknown keys in imported config.json are ignored with a toast warning.

_Section_: Tab Appearance

#### TAB-SET-38

**Requirement**: Settings shall load instantly (<200ms target); skeletons not required due to small dataset.

_Section_: Tab Appearance

#### TAB-SET-39

**Requirement**: State changes (toggles, sliders) shall debounce to avoid rapid re-saves; offline state has no effect (local-only persistence).

_Section_: Tab Appearance

#### TAB-SET-40

**Requirement**: Invalid input (e.g., invalid time format for Quiet hours) shall show inline error messages; input is blocked until corrected.

_Section_: Tab Appearance

#### TAB-SET-41

**Requirement**: Failure to save to storage (rare) shall show a persistent warning banner and retry automatically when possible.

_Section_: Tab Appearance

#### TAB-SET-42

**Requirement**: Insert desktop screenshots: tabbed Settings with General and Security cards open; toggles, sliders, and dropdowns visible.

_Section_: Tab Appearance

#### TAB-SET-43

**Requirement**: Insert mobile screenshots: accordion layout with expanded Security section, showing Passphrase and Auto-lock controls; collapsed others.

_Section_: Tab Appearance

#### TAB-SET-44

**Requirement**: Insert Wipe data confirmation modal screenshot with red destructive button and “CONFIRM” typed.

_Section_: Tab Appearance

---

### TAB-SPG - 📋 New Specifications

**Total Specifications**: 29

#### TAB-SPG-01

**Requirement**: Static pages shall be accessible from the Settings tab (About section) and from the footer of the web app (if enabled).

_Section_: Tab Appearance

#### TAB-SPG-02

**Requirement**: All static pages shall use frosted glass containers with 16px padding, 14–16px rounded corners, subtle shadow (var(--shadow)), and cosmic gradient background.

_Section_: Tab Appearance

#### TAB-SPG-03

**Requirement**: Static pages shall use a simple article layout: Title (H1), Section headers (H2), Body paragraphs, and optional lists.

_Section_: Tab Appearance

#### TAB-SPG-04

**Requirement**: A sticky back button [← Back] shall return to the previous screen or Settings tab.

_Section_: Tab Appearance

#### TAB-SPG-05

**Requirement**: The Privacy Policy page shall include the following sections:

_Section_: Tab Appearance

#### TAB-SPG-06

**Requirement**: Each section shall be collapsible (accordion style) on mobile, expanded by default on desktop.

_Section_: Tab Appearance

#### TAB-SPG-07

**Requirement**: Privacy text shall be written in plain, concise language; font size minimum 16px for readability.

_Section_: Tab Appearance

#### TAB-SPG-08

**Requirement**: The Legal Notice page shall include the following sections:

_Section_: Tab Appearance

#### TAB-SPG-09

**Requirement**: Section headers shall use bold text with small icons (e.g., book for Legal, shield for Privacy).

_Section_: Tab Appearance

#### TAB-SPG-10

**Requirement**: Content shall follow Markdown-like styling: paragraphs, bullet lists, horizontal rules between sections.

_Section_: Tab Appearance

#### TAB-SPG-11

**Requirement**: The About page shall include:

_Section_: Tab Appearance

#### TAB-SPG-12

**Requirement**: About page may include a small section with “Changelog” linking to GitHub releases.

_Section_: Tab Appearance

#### TAB-SPG-13

**Requirement**: Titles (H1) shall use bold var(--ink) at 24–28px; section headers (H2) use accent underline (var(--mint)); body text uses var(--dim).

_Section_: Tab Appearance

#### TAB-SPG-14

**Requirement**: Links shall be accent-coloured (var(--mint)), underlined on hover, with focus outline visible.

_Section_: Tab Appearance

#### TAB-SPG-15

**Requirement**: Icons (Feather/Lucide) shall be used sparingly next to section headers; size 18–20px.

_Section_: Tab Appearance

#### TAB-SPG-16

**Requirement**: Reduced motion disables accordion animation on mobile; expands/collapses instantly.

_Section_: Tab Appearance

#### TAB-SPG-17

**Requirement**: Layout shall collapse into a single vertical scroll with collapsible sections (accordion).

_Section_: Tab Appearance

#### TAB-SPG-18

**Requirement**: The Back button shall appear sticky at top; bottom navigation hidden while static page is active.

_Section_: Tab Appearance

#### TAB-SPG-19

**Requirement**: Links open in new tab (target=\_blank) with rel="noopener"; external links clearly marked.

_Section_: Tab Appearance

#### TAB-SPG-20

**Requirement**: Pages shall use role="document"; each section shall use role="region" with aria-labelledby referencing its header.

_Section_: Tab Appearance

#### TAB-SPG-21

**Requirement**: Accordion sections shall expose aria-expanded states and aria-controls linking to content.

_Section_: Tab Appearance

#### TAB-SPG-22

**Requirement**: Text shall meet WCAG AA minimum font size (≥16px body) and contrast (≥4.5:1).

_Section_: Tab Appearance

#### TAB-SPG-23

**Requirement**: Screen readers shall announce “Section expanded/collapsed” when toggled.

_Section_: Tab Appearance

#### TAB-SPG-24

**Requirement**: Reduced motion disables collapse/expand animations; state change is announced via aria-live.

_Section_: Tab Appearance

#### TAB-SPG-25

**Requirement**: Static pages shall load instantly (<100ms); content is lightweight and text-based.

_Section_: Tab Appearance

#### TAB-SPG-26

**Requirement**: Offline state: all pages shall remain accessible even when offline.

_Section_: Tab Appearance

#### TAB-SPG-27

**Requirement**: Insert Privacy Policy screenshot: collapsible sections visible on mobile, expanded on desktop.

_Section_: Tab Appearance

#### TAB-SPG-28

**Requirement**: Insert Legal Notice screenshot: article-style layout with section headers and small icons.

_Section_: Tab Appearance

#### TAB-SPG-29

**Requirement**: Insert About page screenshot: tagline highlighted, credits list, version number footer.

_Section_: Tab Appearance

---

### TAB-STT - 📋 New Specifications

**Total Specifications**: 42

#### TAB-STT-STR-01

**Requirement**: The Statistics screen shall display frosted glass panels grouped by entity type: Tasks, Routines, Habits, and Global Summary.

_Section_: Tab Appearance

#### TAB-STT-TST-04

**Requirement**: The Tasks panel shall show quadrant throughput: number of tasks completed in each quadrant (IU, I, U, NI/NU).

_Section_: Tab Appearance

#### TAB-STT-05

**Requirement**: A bar chart shall display weekly task completions per quadrant, stacked or grouped by quadrant colour (IU=var(--quad-iu), I=var(--quad-i), U=var(--quad-u), NI/NU=var(--quad-nu)).

_Section_: Tab Appearance

#### TAB-STT-06

**Requirement**: Key metrics shall include: Total tasks completed, % per quadrant, Average time to completion (days).

_Section_: Tab Appearance

#### TAB-STT-07

**Requirement**: Filters: Last 7 days, Last 30 days, Custom date range.

_Section_: Tab Appearance

#### TAB-STT-08

**Requirement**: The Routines panel shall show completion vs skipped rates, and on-time percentage.

_Section_: Tab Appearance

#### TAB-STT-09

**Requirement**: A donut chart shall visualise proportion of completed vs skipped steps, with colours: Completed=var(--mint), Skipped=var(--alert).

_Section_: Tab Appearance

#### TAB-STT-10

**Requirement**: A line chart shall show routine completion times (expected vs actual) across runs.

_Section_: Tab Appearance

#### TAB-STT-11

**Requirement**: Key metrics shall include: Average % on-time, Total routines completed, Average XP per run.

_Section_: Tab Appearance

#### TAB-STT-12

**Requirement**: Filters: Last 10 runs, Last 30 runs, Custom tag filter (energy tags).

_Section_: Tab Appearance

#### TAB-STT-13

**Requirement**: The Habits panel shall show streaks and milestones.

_Section_: Tab Appearance

#### TAB-STT-14

**Requirement**: A heatmap calendar (28–35 days) shall visualise daily completions, tinted by category colours; missed days grey, vacation days hatched.

_Section_: Tab Appearance

#### TAB-STT-15

**Requirement**: Milestone counters shall list milestones achieved (7, 14, 28, 50, 100, etc.) with completion dates.

_Section_: Tab Appearance

#### TAB-STT-16

**Requirement**: Key metrics shall include: Longest streak, Current streak, Total completions, Average daily habits completed.

_Section_: Tab Appearance

#### TAB-STT-17

**Requirement**: Filters: Last 7 days, Last 30 days, Last 90 days.

_Section_: Tab Appearance

#### TAB-STT-18

**Requirement**: The Global Summary panel shall show total XP earned by entity type (Tasks, Routines, Habits).

_Section_: Tab Appearance

#### TAB-STT-19

**Requirement**: A stacked bar or ring chart shall visualise XP distribution across entities.

_Section_: Tab Appearance

#### TAB-STT-20

**Requirement**: Key metrics shall include: Total XP earned, XP this week, XP this month, Average daily XP.

_Section_: Tab Appearance

#### TAB-STT-21

**Requirement**: Filters: This week, This month, All time.

_Section_: Tab Appearance

#### TAB-STT-22

**Requirement**: Each chart shall provide tooltips on hover/tap, displaying exact values and dates.

_Section_: Tab Appearance

#### TAB-STT-23

**Requirement**: A time range picker shall appear at top of screen, applying globally to all panels; individual filters override global range.

_Section_: Tab Appearance

#### TAB-STT-24

**Requirement**: Export buttons shall allow exporting current stats as JSON (raw data) or Markdown (summary report).

_Section_: Tab Appearance

#### TAB-STT-25

**Requirement**: Clicking a bar/point/heatmap cell shall open the underlying entity list (e.g., tasks completed that day).

_Section_: Tab Appearance

#### TAB-STT-26

**Requirement**: Quadrant charts shall use accent colours defined in Tasks tab (IU=--quad-iu, I=--quad-i, U=--quad-u, NI/NU=--quad-nu).

_Section_: Tab Appearance

#### TAB-STT-27

**Requirement**: Completed steps (Routines) shall use var(--mint); Skipped steps shall use var(--alert) (red/pink); neutral values use var(--dim).

_Section_: Tab Appearance

#### TAB-STT-28

**Requirement**: Habits heatmap cells shall use tinted scale of category colour; missed days grey (#888); vacation days hatched overlay.

_Section_: Tab Appearance

#### TAB-STT-29

**Requirement**: XP ring/bars shall use app accent colour (var(--mint)) for earned XP; secondary entities use matching quadrant/habit colours.

_Section_: Tab Appearance

#### TAB-STT-30

**Requirement**: Fonts: Titles bold (var(--ink)), metrics medium weight, tooltips small text with dark background and white text.

_Section_: Tab Appearance

#### TAB-STT-31

**Requirement**: Layout shall stack panels vertically; charts shall switch to compact mode (simplified bars/lines, smaller heatmap cells).

_Section_: Tab Appearance

#### TAB-STT-32

**Requirement**: Filters shall appear as a sticky horizontal scroll row below panel titles.

_Section_: Tab Appearance

#### TAB-STT-33

**Requirement**: Touch tooltips shall activate on tap; tapping outside dismisses.

_Section_: Tab Appearance

#### TAB-STT-34

**Requirement**: All charts shall provide text summaries (e.g., “You completed 24 tasks this week: 10 Important & Urgent, 8 Important, 4 Urgent, 2 Neither”).

_Section_: Tab Appearance

#### TAB-STT-35

**Requirement**: Tooltips shall be accessible via keyboard focus; chart elements shall be focusable with aria-labels (e.g., “Tasks completed: 5 on 2025-09-20”).

_Section_: Tab Appearance

#### TAB-STT-36

**Requirement**: Colour shall never be the sole means of conveying data; icons, patterns, or labels shall accompany colours.

_Section_: Tab Appearance

#### TAB-STT-37

**Requirement**: Reduced motion shall disable animated chart transitions; updates appear instant.

_Section_: Tab Appearance

#### TAB-STT-38

**Requirement**: Statistics shall pre-aggregate data (in IndexedDB or local store) to avoid recomputation; visual updates shall complete within 200ms on average hardware.

_Section_: Tab Appearance

#### TAB-STT-39

**Requirement**: Long ranges (90+ days) shall virtualise heatmap rendering to preserve performance.

_Section_: Tab Appearance

#### TAB-STT-40

**Requirement**: If no data exists, panels shall display an empty state: “No tasks completed in this range” with a suggestion (“Try completing a task to see stats!”).

_Section_: Tab Appearance

#### TAB-STT-41

**Requirement**: Import/export failures shall show non-blocking toast with retry option.

_Section_: Tab Appearance

#### TAB-STT-42

**Requirement**: Insert desktop screenshots: 2×2 grid with Tasks bar chart, Routines donut chart, Habits heatmap, Global XP ring.

_Section_: Tab Appearance

#### TAB-STT-43

**Requirement**: Insert mobile screenshots: stacked panels with compact charts and sticky filter row.

_Section_: Tab Appearance

#### TAB-STT-44

**Requirement**: Insert tooltip screenshot on bar/heatmap cell, showing exact count/date.

_Section_: Tab Appearance

---

### TAB-TSK - ✅ Already Documented

**Total Specifications**: 62

#### TAB-TSK-01

**Requirement**: The Tasks screen shall render a top row of Task Management Buttons, followed by a 2×2 quadrant grid, followed by a Backlog list; there is no backlog cell inside the grid.

_Section_: Tab Appearance

#### TAB-TSK-02

**Requirement**: The 2×2 grid quadrants shall be labelled exactly (top-left → bottom-right): Important & Urgent; Important; Urgent; Neither important nor urgent.

_Section_: Tab Appearance

#### TAB-TSK-03

**Requirement**: The Backlog shall be displayed as a full-width list below the grid, with the header “Backlog”.

_Section_: Tab Appearance

#### TAB-TSK-04

**Requirement**: The visual structure shall follow this order and spacing:

_Section_: Tab Appearance

#### TAB-TSK-05

**Requirement**: The buttons row shall include: [Add Task] [Bulk Edit] [Filter] [Sort] [Import] [Export] [Toggle Completed].

_Section_: Tab Appearance

#### TAB-TSK-06

**Requirement**: The Filter control shall filter by Category, Tag, Quadrant, Due (Today / This Week / Overdue), and Status.

_Section_: Tab Appearance

#### TAB-TSK-07

**Requirement**: The Sort control shall provide: Due date (asc/desc), Quadrant order, Last updated, Title.

_Section_: Tab Appearance

#### TAB-TSK-08

**Requirement**: Bulk Edit mode shall enable multi-select to Move (to quadrant/backlog), Complete, Delete, Tag, or Set Due Date.

_Section_: Tab Appearance

#### TAB-TSK-09

**Requirement**: A search field may be provided to filter tasks by title/description.

_Section_: Tab Appearance

#### TAB-TSK-10

**Requirement**: The Tasks screen shall use frosted glass cards on a cosmic gradient background, matching the mock-up (glass panels, subtle shadows, blur).

_Section_: Tab Appearance

#### TAB-TSK-11

**Requirement**: Each quadrant shall have a distinct accent colour used for its header underline, task card left border (4px), and small chips:

_Section_: Tab Appearance

#### TAB-TSK-12

**Requirement**: The above colours shall be exposed as CSS variables: --quad-iu: #7ea6ff; --quad-i: #86f5e0; --quad-u: #8ec8ff; --quad-nu: #a9b1e0; and applied consistently to headers, borders, and badges.

_Section_: Tab Appearance

#### TAB-TSK-13

**Requirement**: Task cards shall default to a frosted card style (rounded corners, thin 1px border var(--line)); category chips use the task’s category palette; the quadrant accent colour appears as a left border.

_Section_: Tab Appearance

#### TAB-TSK-14

**Requirement**: Overdue tasks shall show a subtle red dot indicator next to the due date; Today shall show a small filled circle in the quadrant accent colour.

_Section_: Tab Appearance

#### TAB-TSK-15

**Requirement**: Each task card shall show: Title (mandatory), Category colour chip, Tags (chips), Due date (optional) aligned to the right.

_Section_: Tab Appearance

#### TAB-TSK-16

**Requirement**: Expanding a task shall reveal: Description (sanitised Markdown), Subtasks (checkbox list), References (linked Brain Dump), History (created/edited/completed), and an XP panel (see XP logic).

_Section_: Tab Appearance

#### TAB-TSK-17

**Requirement**: Subtasks shall be collapsible; completing a parent with outstanding subtasks shall prompt either “Complete all subtasks” or “Complete parent only” (configurable default).

_Section_: Tab Appearance

#### TAB-TSK-18

**Requirement**: Task badges may include: Overdue, Today, Snoozed, Recurring; badges appear as small rounded chips below the title.

_Section_: Tab Appearance

#### TAB-TSK-19

**Requirement**: “Neither important nor urgent” quadrant shall represent tasks expected to be done in the near future, but not currently urgent or important.

_Section_: Tab Appearance

#### TAB-TSK-20

**Requirement**: Backlog shall be strictly for unscheduled/parked ideas and long-term items; moving a task from Backlog into any quadrant marks intent to execute.

_Section_: Tab Appearance

#### TAB-TSK-21

**Requirement**: Users shall be able to move tasks between any quadrant and the Backlog by drag-and-drop (desktop/tablet) or via an action sheet (mobile).

_Section_: Tab Appearance

#### TAB-TSK-22

**Requirement**: Completing a task shall use a checkbox/tap; the card shall animate, fade, and move to a collapsible Done section within its container (quadrant or backlog).

_Section_: Tab Appearance

#### TAB-TSK-23

**Requirement**: Toast feedback shall confirm actions: created, updated, completed, moved, deleted, imported, exported (bottom-center on desktop, bottom-full-width on mobile).

_Section_: Tab Appearance

#### TAB-TSK-24

**Requirement**: Inline validation errors (e.g., invalid date) shall appear under the field with accessible text and shall be announced to assistive tech.

_Section_: Tab Appearance

#### TAB-TSK-25

**Requirement**: Base XP awards on completion shall be:

_Section_: Tab Appearance

#### TAB-TSK-26

**Requirement**: A punctuality bonus of +1 XP shall be awarded when a task with a due date is completed on or before the due date.

_Section_: Tab Appearance

#### TAB-TSK-27

**Requirement**: The XP panel inside an expanded task shall show: Base XP by quadrant, any punctuality bonus, and the total XP awarded for completion.

_Section_: Tab Appearance

#### TAB-TSK-28

**Requirement**: On completion, a toast shall show “+{xp} XP — Task completed!” and the navbar XP counter shall increment with a short pulse animation.

_Section_: Tab Appearance

#### TAB-TSK-29

**Requirement**: Confetti shall trigger on Important and Important & Urgent completions; Important & Urgent shall trigger a denser/longer burst. Reduced motion shall replace confetti with a success outline + toast.

_Section_: Tab Appearance

#### TAB-TSK-30

**Requirement**: Haptics (mobile): light vibration for 1 XP total; medium for 2–3 XP; strong triple buzz for 4+ XP (i.e., IU with punctuality bonus).

_Section_: Tab Appearance

#### TAB-TSK-31

**Requirement**: A small circular XP badge may be displayed on the right edge of a task card immediately after completion for 2 seconds showing the awarded total (e.g., “+3”).

_Section_: Tab Appearance

#### TAB-TSK-32

**Requirement**: Layout shall stack in this order: Buttons row → quadrants (IU, I, U, NI/NU) → Backlog list.

_Section_: Tab Appearance

#### TAB-TSK-33

**Requirement**: A floating action button (FAB) shall appear at bottom-right for [Add Task]; on scroll down it hides; on scroll up it reappears.

_Section_: Tab Appearance

#### TAB-TSK-34

**Requirement**: Toolbar actions (Bulk Edit, Filter, Sort, Import, Export, Toggle Completed) shall collapse into an overflow menu (⋯) anchored under a single toolbar button.

_Section_: Tab Appearance

#### TAB-TSK-35

**Requirement**: Drag-and-drop shall be replaced with long-press (≥350 ms) opening an action sheet with options: Move to [IU | I | U | NI/NU | Backlog], Edit, Complete, Delete.

_Section_: Tab Appearance

#### TAB-TSK-36

**Requirement**: Swipe gestures shall be available on task rows: swipe left reveals quick actions (Edit, Delete, Move); swipe right toggles complete/incomplete with haptic.

_Section_: Tab Appearance

#### TAB-TSK-37

**Requirement**: Touch targets shall be at least 48×48 px; primary buttons and checkboxes shall respect this minimum on all devices.

_Section_: Tab Appearance

#### TAB-TSK-38

**Requirement**: The Backlog header shall be sticky while scrolling the Backlog list; the sticky area shall include a mini Filter + Sort for Backlog-only operations.

_Section_: Tab Appearance

#### TAB-TSK-39

**Requirement**: Completed tasks shall be collapsed by default; a “Show Done” toggle within each quadrant and Backlog expands the list with lazy rendering to preserve performance.

_Section_: Tab Appearance

#### TAB-TSK-40

**Requirement**: Reduced-motion mode shall disable FAB hide/reveal animation and replace panel transitions with instant state changes.

_Section_: Tab Appearance

#### TAB-TSK-41

**Requirement**: The quadrant grid shall use role="grid" with aria-labelledby pointing to each quadrant title; Backlog shall use role="list"; each task card shall use role="listitem".

_Section_: Tab Appearance

#### TAB-TSK-42

**Requirement**: The Done section toggles shall expose aria-expanded (true/false) and aria-controls pointing to the container they reveal/hide.

_Section_: Tab Appearance

#### TAB-TSK-43

**Requirement**: Keyboard navigation shall support: Arrow keys move focus across quadrants; Tab cycles within a quadrant; Enter expands/collapses a task; Space toggles completion on the focused task.

_Section_: Tab Appearance

#### TAB-TSK-44

**Requirement**: Screen reader output shall include title, due date status (overdue/today/none), category, quadrant name, and completion state; on completion it shall announce the XP awarded (e.g., “Task completed. Three XP gained.”).

_Section_: Tab Appearance

#### TAB-TSK-45

**Requirement**: Colour contrast of text, borders, and chips against background shall meet WCAG 2.1 AA (≥4.5:1 for body text, ≥3:1 for large/bold headers); quadrant accent colours shall be paired with sufficient contrast for borders/chips.

_Section_: Tab Appearance

#### TAB-TSK-46

**Requirement**: Reduced motion preference shall disable confetti and non-essential transitions; success feedback shall still include toast and a static success outline for discoverability.

_Section_: Tab Appearance

#### TAB-TSK-47

**Requirement**: Import shall place items into Backlog by default unless a quadrant is specified in the payload; if both quadrant and due date are provided and conflict with filters, the UI shall still respect the stored quadrant and due date.

_Section_: Tab Appearance

#### TAB-TSK-48

**Requirement**: Export shall preserve quadrant placement, position order within each quadrant/backlog, IDs, timestamps, tags, and all metadata; exports shall allow scope selection (All / Visible / Backlog-only / Specific quadrants).

_Section_: Tab Appearance

#### TAB-TSK-49

**Requirement**: Round-trip import/export shall be lossless: IDs, timestamps, tags, quadrants, and subtask relationships shall remain unchanged; a checksum of the exported payload may be generated to verify re-import integrity.

_Section_: Tab Appearance

#### TAB-TSK-50

**Requirement**: Initial load of the Tasks tab shall render the grid skeletons (4 placeholders) and a Backlog skeleton, then hydrate with data; total time-to-interaction shall remain under target defined in performance section of the spec.

_Section_: Tab Appearance

#### TAB-TSK-51

**Requirement**: Infinite lists (Backlog and Done sections) shall virtualise long lists to maintain smooth scrolling on mobile (60 FPS target where possible).

_Section_: Tab Appearance

#### TAB-TSK-52

**Requirement**: Offline state shall be visually indicated (e.g., offline badge in toolbar); all task operations remain available and persist locally; any sync (if enabled) is queued for later.

_Section_: Tab Appearance

#### TAB-TSK-53

**Requirement**: Inline validation shall be placed directly below the offending field, with concise human-readable messages and programmatic error linking via aria-describedby.

_Section_: Tab Appearance

#### TAB-TSK-54

**Requirement**: Conflicting actions (e.g., moving a task that no longer exists) shall show a non-blocking toast error
and auto-refresh the view to reconcile state.

_Section_: Tab Appearance

#### TAB-TSK-55

**Requirement**: Insert desktop screenshot showing: Buttons row; 2×2 quadrants (Important & Urgent, Important, Urgent, Neither important nor urgent) with quadrant accent colours and card borders; Backlog list beneath with columns “task name | tags | due date”.

_Section_: Tab Appearance

#### TAB-TSK-56

**Requirement**: Insert mobile screenshots showing: stacked quadrants with accent colours; FAB (Add Task) visible; overflow toolbar menu (⋯); action sheet after long-press on a task; Backlog with sticky header and mini Filter/Sort.

_Section_: Tab Appearance

#### TAB-TSK-57

**Requirement**: Insert expanded task card screenshot showing: sanitised Markdown description; subtasks with checkboxes; references (linked Brain Dump); history; XP panel displaying base XP by quadrant, punctuality bonus, and total XP awarded.

_Section_: Tab Appearance

#### TAB-TSK-58

**Requirement**: The following CSS variables shall be defined and used consistently across the Tasks tab:

_Section_: Tab Appearance

#### TAB-TSK-59

**Requirement**: Task cards shall display a 4px left border in the quadrant’s accent colour; quadrant headers shall show a matching underline; small chips (counts/badges) shall also use the accent colour background with readable foreground.

_Section_: Tab Appearance

#### TAB-TSK-60

**Requirement**: Base XP on completion shall be: IU=3; I=2; U=1; NI/NU=1; punctuality bonus = +1 XP when completed on or before due date.

_Section_: Tab Appearance

#### TAB-TSK-61

**Requirement**: On completion, toast shall show “+{xp} XP — Task completed!”; navbar XP counter shall increment with a brief pulse; for reduced motion users, only the toast and pulse-less counter increment shall be used.

_Section_: Tab Appearance

#### TAB-TSK-62

**Requirement**: Confetti shall trigger on completion for Important and Important & Urgent; IU uses a denser/longer burst; reduced motion disables confetti automatically; haptics pattern shall be: 1 XP = light pulse; 2–3 XP = medium; 4+ XP = strong triple buzz.

_Section_: Tab Appearance

---

## Security Testing & Protection (STP)

### STP-AST - 📋 New Specifications

**Total Specifications**: 4

#### STP-AST-01

**Requirement**: [Mandatory] CI shall run npm audit (production) and bundler-audit (if Rails backend used); release fails if critical vulns remain.

_Section_: Security Test Plan — Detailed

#### STP-AST-02

**Requirement**: [Mandatory] CI shall run Playwright E2E (Firefox) on core flows (Tasks, Routines, Habits, Brain Dump, Import/Export, Schedule).

_Section_: Security Test Plan — Detailed

#### STP-AST-03

**Requirement**: [Optional] Run OWASP ZAP Baseline locally against the app; log and fix P1/P2 findings if discovered.

_Section_: Security Test Plan — Detailed

#### STP-AST-04

**Requirement**: [Optional] Manually test IDOR by forging UUIDs in API calls (only relevant if backend is enabled).

_Section_: Security Test Plan — Detailed

---

### STP-HDR - 📋 New Specifications

**Total Specifications**: 3

#### STP-HDR-01

**Requirement**: [Mandatory] Verify via curl -I that responses include CSP, HSTS, Referrer-Policy=no-referrer, X-Content-Type-Options=nosniff.

_Section_: Security Test Plan — Detailed

#### STP-HDR-02

**Requirement**: [Mandatory] Check Firefox DevTools Security panel: no CSP violations, no inline/eval scripts, no unsafe sources.

_Section_: Security Test Plan — Detailed

#### STP-HDR-03

**Requirement**: [Optional] Ensure frame-ancestors in CSP restricts embedding to 'self' (prevents clickjacking).

_Section_: Security Test Plan — Detailed

---

### STP-IEX - 📋 New Specifications

**Total Specifications**: 4

#### STP-IEX-01

**Requirement**: [Mandatory] Schema validation: malformed files fail with clear error; unknown fields preserved.

_Section_: Security Test Plan — Detailed

#### STP-IEX-02

**Requirement**: [Mandatory] Markdown rendering tests confirm unsafe HTML neutralised; keep 2–3 malicious test files in repo.

_Section_: Security Test Plan — Detailed

#### STP-IEX-03

**Requirement**: [Mandatory] Exports default to .sj.enc; round-trip re-import restores identical IDs and timestamps.

_Section_: Security Test Plan — Detailed

#### STP-IEX-04

**Requirement**: [Optional] Enable optional .sha256 checksum export; verify manually once per release cycle.

_Section_: Security Test Plan — Detailed

---

### STP-IRB - 📋 New Specifications

**Total Specifications**: 2

#### STP-IRB-01

**Requirement**: [Mandatory] Perform a “restore drill” once per release: export a .sj.enc file, wipe local data, re-import, confirm counts/IDs match.

_Section_: Security Test Plan — Detailed

#### STP-IRB-02

**Requirement**: [Optional] If backend enabled: test a DB dump and restore on staging once per quarter.

_Section_: Security Test Plan — Detailed

---

### STP-SUP - 📋 New Specifications

**Total Specifications**: 3

#### STP-SUP-01

**Requirement**: [Mandatory] Dependencies shall be pinned (package-lock.json / Gemfile.lock); update intentionally.

_Section_: Security Test Plan — Detailed

#### STP-SUP-02

**Requirement**: [Mandatory] Build artifacts shall exclude secrets; CI verifies no .env or private keys are bundled.

_Section_: Security Test Plan — Detailed

#### STP-SUP-03

**Requirement**: [Optional] Check that all external fonts/assets are either self-hosted or loaded with SRI.

_Section_: Security Test Plan — Detailed

---

### STP-SWP - 📋 New Specifications

**Total Specifications**: 3

#### STP-SWP-01

**Requirement**: [Mandatory] Verify cached assets are versioned; no cache poisoning possible by query string.

_Section_: Security Test Plan — Detailed

#### STP-SWP-02

**Requirement**: [Mandatory] Offline fallback page shows only safe static info (never decrypted content if app is locked).

_Section_: Security Test Plan — Detailed

#### STP-SWP-03

**Requirement**: [Optional] Manually test update flow: new SW prompts reload; ensure no mid-session breakage.

_Section_: Security Test Plan — Detailed

---

### STP-UIA - 📋 New Specifications

**Total Specifications**: 3

#### STP-UIA-01

**Requirement**: [Mandatory] All destructive actions (wipe, disable passphrase, export unencrypted) require confirmation; dialogs are aria-modal with focus-trap.

_Section_: Security Test Plan — Detailed

#### STP-UIA-02

**Requirement**: [Mandatory] axe-core automated checks on security dialogs must show no critical violations.

_Section_: Security Test Plan — Detailed

#### STP-UIA-03

**Requirement**: [Optional] Run NVDA/VoiceOver manual pass once per major release on passphrase setup/unlock dialogs.

_Section_: Security Test Plan — Detailed

---

## Summary

### Implementation Status

- **Total Categories**: 31
- **Already Documented**: 4 categories
- **New/Missing**: 27 categories
- **Total Specifications**: 640

### Categories to Document

- **ARC-BCK**: 5 specifications
- **ARC-FSC**: 4 specifications
- **ARC-ONL**: 5 specifications
- **ARC-SEC**: 5 specifications
- **NFR-ACC**: 5 specifications
- **NFR-PER**: 3 specifications
- **NFR-SEC**: 4 specifications
- **STP-AST**: 4 specifications
- **STP-HDR**: 3 specifications
- **STP-IEX**: 4 specifications
- **STP-IRB**: 2 specifications
- **STP-SUP**: 3 specifications
- **STP-SWP**: 3 specifications
- **STP-UIA**: 3 specifications
- **TAB-HAB**: 52 specifications
- **TAB-IEX**: 32 specifications
- **TAB-LIB**: 39 specifications
- **TAB-NAV**: 29 specifications
- **TAB-POP**: 30 specifications
- **TAB-RTN**: 58 specifications
- **TAB-SCH**: 52 specifications
- **TAB-SEC**: 42 specifications
- **TAB-SET**: 44 specifications
- **TAB-SPG**: 29 specifications
- **TAB-STT**: 42 specifications
- **USR-ENV**: 4 specifications
- **USR-PRF**: 3 specifications

### Already Documented Categories

- **ARC-APP**: 4 specifications (see existing docs)
- **ARC-DAT**: 4 specifications (see existing docs)
- **TAB-BDP**: 61 specifications (see existing docs)
- **TAB-TSK**: 62 specifications (see existing docs)

---

This document was automatically generated from AuroraeHaven_Specs.docx
