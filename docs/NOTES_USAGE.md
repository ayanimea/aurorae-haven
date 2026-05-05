# Brain Dump Usage Guide

This guide explains how to use the enhanced Brain Dump features in Aurorae Haven.

## Quick Start

1. Navigate to the Brain Dump tab in the app
2. Start typing your thoughts in the markdown editor
3. See live preview below with rendered markdown
4. Use the toolbar buttons to access advanced features

## Basic Features

### Markdown Editing

The Brain Dump editor supports full GitHub Flavored Markdown (GFM):

````markdown
# Headings

## Second level

### Third level

**Bold text** and _italic text_

- Bullet lists
- Another item

1. Numbered lists
2. Second item

- [ ] Task lists (checkboxes)
- [x] Completed task

`inline code` and:

```javascript
// Code blocks
console.log('Hello')
```
````

> Blockquotes for important notes

[Links](https://example.com)

````markdown
### Auto-List Continuation

When you press Enter on a list item:

- Bullet and numbered lists automatically continue
- Task lists create a new unchecked item
- Empty list items are removed (press Enter twice to exit list)

### LaTeX Mathematical Equations

Brain Dump supports LaTeX equations using KaTeX for professional mathematical notation.

**Inline Math:**

Use single dollar signs for inline equations:

```markdown
The quadratic formula is $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$ in standard form.
Einstein's equation: $E = mc^2$
```

**Display Math:**

Use double dollar signs for centered block equations:

```markdown
$$
\int_{a}^{b} f(x) \, dx = F(b) - F(a)
$$
```

**Common Examples:**

- Greek letters: `$\alpha, \beta, \gamma, \Delta, \Sigma$`
- Fractions: `$\frac{a}{b}$`
- Square roots: `$\sqrt{x}$ or $\sqrt[n]{x}$`
- Summations: `$\sum_{i=1}^{n} x_i$`
- Integrals: `$\int_{0}^{\infty} e^{-x} dx$`

**Tips:**

- Preview your equations to ensure they render correctly
- For literal dollar signs, escape them: `\$10.00`
- Multi-line equations: Natural newlines within `$...$` or `$$...$$` blocks are automatically converted to LaTeX line breaks (`\\`)
- See [USER_MANUAL.md](../USER_MANUAL.md) for complete LaTeX reference

### Embedding Images

Display images in your notes using markdown syntax:

**Basic syntax:**

```markdown
![Alt text description](image-url-or-path)
```

**Using File Attachments:**

1. Click "📎 Attach" button
2. Select your image file
3. Reference is inserted automatically

**External images:**

```markdown
![Mountain landscape](https://example.com/images/mountain.jpg)
```

**Best practices:**

- Always include descriptive alt text for accessibility
- Use local file attachments for privacy and offline access
- Optimize image sizes for better performance
- See [USER_MANUAL.md](../USER_MANUAL.md) for detailed image guide

## Advanced Features

### 📤 ODT Export

Brain Dump supports OpenDocument Text (`.odt`) export for compatibility with LibreOffice Writer and other ODT editors.

- **Export ODT**: exports the currently selected note as a single `.odt` file.
- **Export all ODT**: exports all notes through a single browser download (`.zip` when multiple notes are present).
- **Export all ODT as zip**: exports all notes into one `.zip` archive containing `.odt` files.

### 🔗 Backlinks (TAB-BDP-BLK-01)

Create wiki-style links between notes using double brackets:

```markdown
This note relates to [[Project Alpha]] and [[Meeting Notes 2024-01]].

I should also check [[Resources]] and [[Ideas for Q2]].
```
````

**Features:**

- Links appear as clickable elements in preview
- Click a backlink to navigate (future: will jump to that note)
- View all backlinks in current document with "🔗 Backlinks" button
- Links styled with dashed underline for visual distinction

**Usage:**

1. Type `[[` to start a link
2. Enter the link text
3. Type `]]` to close
4. Link becomes clickable in preview
5. Click "🔗 Backlinks" to see all links

### 📜 Version History (TAB-BDP-VSH-01)

Automatic version control for your notes:

**Auto-Save:**

- Versions saved every 5 seconds of inactivity
- Last 50 versions kept automatically
- Each version includes timestamp and preview

**View History:**

1. Click "📜 History" button
2. See list of all saved versions with dates
3. Preview shows first 100 characters of each version

**Restore Version:**

1. In version history, find the version you want
2. Click "Restore" to revert to that version
3. Current content is replaced with selected version

**View Diff:**

1. Click "View Diff" on any version
2. See line-by-line comparison
3. Green lines = additions
4. Red lines = removals
5. White lines = unchanged

**Keyboard Shortcut:** `Ctrl/Cmd + H` opens version history

### 📎 File Attachments (TAB-BDP-FIL-01)

Attach files directly to your brain dump notes:

**Supported:**

- Any file type
- Files stored securely in browser's Origin Private File System (OPFS)
- Files never leave your device
- Private, sandboxed storage

**How to Attach:**

1. Click "📎 Attach" button
2. Select file from your device
3. File is stored in OPFS
4. Reference automatically inserted in editor

**File Reference Format:**

```text
📎 Attachment: document.pdf (152.34 KB)
```

**Browser Support:**

- Chrome 86+ ✓
- Edge 86+ ✓
- Opera 72+ ✓
- Firefox (partial - fallback mode)
- Safari (partial - fallback mode)

**Note:** In browsers without OPFS, you'll see a warning but can still continue editing.

### 🛡️ Enhanced Security (TAB-BDP-SAN-01)

All content is sanitized for safety:

**Protections:**

- XSS prevention (malicious scripts blocked)
- Safe link handling (no javascript: or data: URIs)
- External links open in new tab automatically
- Only safe HTML tags allowed
- Event handlers stripped

**What's Allowed:**

- Standard markdown formatting
- Images from safe sources
- Links to HTTP/HTTPS URLs
- Internal anchor links (#)

**What's Blocked:**

- Script tags
- Inline JavaScript
- Event handlers (onclick, etc.)
- Unsafe iframes
- Object/embed elements

### ♿ Accessibility Features (TAB-BDP-ACC-01)

Full keyboard and screen reader support:

**Keyboard Shortcuts:**

- `Ctrl/Cmd + S`: Export markdown
- `Ctrl/Cmd + H`: Open version history
- `Escape`: Close modals
- `Enter`: Auto-continue lists
- `Tab`: Navigate between elements

**Screen Reader Support:**

- All buttons have descriptive labels
- Live region announcements for state changes
- Semantic HTML structure
- ARIA roles for complex widgets

**Announcements:**

- "Preview updated" when content changes
- "Task marked complete/incomplete" for checkboxes
- "File [name] attached" when attaching files
- "Version restored" after restoring
- "All content cleared" when clearing

**Focus Management:**

- Visible focus indicators
- Proper focus order
- Modal focus trap
- Return focus after modal close

## Additional Features

### 🧹 Clear All

Remove all content and tags:

1. Click "🧹 Clear All"
2. Confirm in dialog
3. All content removed from localStorage
4. Fresh start

**Warning:** This cannot be undone (unless you have version history)

### 📤 Export

Save your markdown as a file:

1. Click "📤 Export"
2. File downloads as a `.md` file
3. Import into other markdown editors
4. Backup your work

**Keyboard Shortcut:** `Ctrl/Cmd + S` — exports **all notes**

- **Single note:** downloads one `.md` file directly
- **Multiple notes:** downloads a `.zip` archive containing one `.md` file per note

### 🖨️ Print Formatted Preview

Print the rendered Markdown (or save as PDF):

1. Click the "🖨️ Print" button in the Brain Dump toolbar
2. The browser print dialog opens
3. Print output uses a clean, print-focused layout of the formatted preview

### Tags

Quick tag palette for categorization:

- Click existing tag to add to note
- Tags styled as pills
- Auto-saved with content

## Tips and Best Practices

### 1. Use Backlinks for Structure

```markdown
# Project Planning

Key areas:

- [[Requirements]]
- [[Architecture]]
- [[Testing Strategy]]

Related: [[Previous Projects]]
```

### 2. Regular Exports

- Export weekly as backup
- Keep important versions
- Share with team if needed

### 3. Organize with Tags

```markdown
Ideas for new feature #idea #priority-high
Bug found in login #bug #critical
```

### 4. Use Version History

- Review changes over time
- Recover accidentally deleted content
- Compare different approaches

### 5. File Attachments

- Attach related documents
- Keep everything in one place
- Reference files in notes

### 6. Accessibility

- Use heading hierarchy (H1 → H2 → H3)
- Provide alt text for images: `![Description](url)`
- Write descriptive link text

## Troubleshooting

### Preview Not Updating

**Cause:** External libraries (marked.js, DOMPurify) not loaded
**Solution:**

- Check browser console for errors
- Ensure CDN is accessible
- Check Content Security Policy

### OPFS Not Working

**Cause:** Browser doesn't support OPFS
**Solution:**

- Use Chrome 86+, Edge 86+, or Opera 72+
- Feature gracefully degrades
- Can still use all other features

### Version History Too Large

**Cause:** 50 versions \* large documents = lots of storage
**Solution:**

- Export important versions
- Clear version history (manual cleanup)
- Automatic cleanup keeps only 50 versions

### Performance Issues

**Cause:** Very large documents (>10,000 lines)
**Solution:**

- Split into multiple notes
- Use backlinks to connect them
- Export and start fresh section

## Keyboard Reference Card

| Shortcut        | Action               |
| --------------- | -------------------- |
| `Ctrl/Cmd + S`  | Export all notes as markdown (ZIP if multiple) |
| `Ctrl/Cmd + H`  | View version history |
| `Escape`        | Close modal          |
| `Enter`         | Continue list        |
| `Enter` (twice) | Exit list            |
| `Tab`           | Next element         |
| `Shift + Tab`   | Previous element     |

## Examples

### Daily Journal Entry

```markdown
# 2024-10-02

## Morning Thoughts

- Need to finish [[Project Alpha]] by Friday
- Review [[Meeting Notes - Client XYZ]]
- Follow up on [[Bug Reports]]

## Ideas

💡 What if we [[Automated Testing]] for the new feature?

See also: [[Tomorrow's Plan]]

## Attachments

📎 Attachment: screenshot.png (45.23 KB)
📎 Attachment: requirements.pdf (234.56 KB)
```

### Project Planning

```markdown
# Website Redesign Project

## Goals

- [ ] New landing page
- [ ] Updated branding
- [x] Stakeholder approval

## References

- [[Brand Guidelines]]
- [[Previous Design]]
- [[User Research]]

## Resources

📎 Attachment: mockup-v2.fig (1.2 MB)
```

### Meeting Notes

```markdown
# Team Meeting 2024-10-02

## Attendees

- Alice, Bob, Carol

## Topics

1. [[Q4 Planning]]
2. [[Budget Review]]
3. [[Hiring Update]]

## Action Items

- [ ] Alice: Review [[Architecture Proposal]]
- [ ] Bob: Schedule [[Design Review]]
- [x] Carol: Send [[Status Report]]

## Next Meeting

[[2024-10-09 Team Meeting]]
```

## Support

For issues or questions:

1. Check this guide first
2. Review [NOTES_SPECS.md](./NOTES_SPECS.md) for technical details
3. Open issue on GitHub with `notes` label
