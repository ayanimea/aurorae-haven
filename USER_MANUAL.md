# 🌌 Aurorae Haven User Manual

> **Complete guide to using Aurorae Haven's markdown features, including LaTeX equations and images**

---

## Table of Contents

- [Introduction](#introduction)
- [LaTeX and Mathematical Equations](#latex-and-mathematical-equations)
- [Displaying Images](#displaying-images)
- [Complete Markdown Reference](#complete-markdown-reference)
- [Accessibility Best Practices](#accessibility-best-practices)
- [Accessing This Manual in the App](#accessing-this-manual-in-the-app)
- [Automatic Save Feature](#automatic-save-feature)
  - [Requirements](#requirements)
  - [Setting Up Automatic Save](#setting-up-automatic-save)
  - [Configuration Options](#configuration-options)
  - [Using Auto-Save Features](#using-auto-save-features)
  - [Save File Format](#save-file-format)
  - [Browser Compatibility](#browser-compatibility)
  - [Troubleshooting](#troubleshooting)
  - [Security & Privacy](#security--privacy)

---

## Introduction

Aurorae Haven's Brain Dump feature supports rich markdown formatting, including:

- **LaTeX mathematical equations** using KaTeX
- **Image embedding** from local and external sources
- **GitHub Flavored Markdown** (GFM) for comprehensive text formatting
- **Accessible content** following WCAG 2.2 AA standards

This manual provides complete documentation on these features with practical examples.

---

## LaTeX and Mathematical Equations

Aurorae Haven uses **KaTeX** to render mathematical equations and scientific notation in markdown. This allows you to write beautiful, professional-looking formulas directly in your notes.

### Inline Math

Use **single dollar signs** `$...$` for inline equations that appear within text.

**Syntax:**

```markdown
The quadratic formula is $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$ where $a \neq 0$.
```

**Result:**

The quadratic formula is $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$ where $a \neq 0$.

**More Examples:**

```markdown
- Einstein's famous equation: $E = mc^2$
- Pythagorean theorem: $a^2 + b^2 = c^2$
- Greek letters: $\alpha, \beta, \gamma, \Delta, \Sigma$
- Subscripts and superscripts: $x_1, x_2, x^2, x^{10}$
```

### Display Math (Block Equations)

Use **double dollar signs** `$$...$$` on separate lines for centered, larger equations.

**Syntax:**

```markdown
The normal distribution probability density function:

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}
$$

Where $\mu$ is the mean and $\sigma$ is the standard deviation.
```

**Result:**

The normal distribution probability density function:

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}
$$

Where $\mu$ is the mean and $\sigma$ is the standard deviation.

### Common LaTeX Symbols and Commands

#### Greek Letters

```markdown
$\alpha, \beta, \gamma, \delta, \epsilon, \zeta, \eta, \theta$
$\Alpha, \Beta, \Gamma, \Delta, \Theta, \Lambda, \Sigma, \Omega$
```

#### Mathematical Operators

```markdown
$\sum_{i=1}^{n} x_i$ — Summation
$\prod_{i=1}^{n} x_i$ — Product
$\int_{a}^{b} f(x) \, dx$ — Integral
$\frac{\partial f}{\partial x}$ — Partial derivative
$\lim_{x \to \infty} f(x)$ — Limit
$\sqrt{x}$ or $\sqrt[n]{x}$ — Square root or nth root
```

#### Relations and Logic

```markdown
$a = b$ — Equals
$a \neq b$ — Not equal
$a \approx b$ — Approximately equal
$a > b, a < b, a \geq b, a \leq b$ — Comparisons
$a \in A$ — Element of
$A \subseteq B$ — Subset
$\forall, \exists, \neg, \land, \lor, \implies, \iff$ — Logic symbols
```

#### Matrices and Vectors

```markdown
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$

$$
\vec{v} = \begin{bmatrix}
x \\
y \\
z
\end{bmatrix}
$$
```

### Practical Examples

#### Physics Equations

```markdown
**Newton's Second Law:**

$$
\vec{F} = m\vec{a}
$$

**Kinetic Energy:**

$$
E_k = \frac{1}{2}mv^2
$$

**Wave Equation:**

$$
\frac{\partial^2 u}{\partial t^2} = c^2 \frac{\partial^2 u}{\partial x^2}
$$
```

#### Statistics and Probability

```markdown
**Sample Mean:**

$$
\bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i
$$

**Standard Deviation:**

$$
\sigma = \sqrt{\frac{1}{n}\sum_{i=1}^{n}(x_i - \mu)^2}
$$

**Bayes' Theorem:**

$$
P(A|B) = \frac{P(B|A)P(A)}{P(B)}
$$
```

#### Computer Science

```markdown
**Big O Notation:**

- $O(1)$ — Constant time
- $O(\log n)$ — Logarithmic time
- $O(n)$ — Linear time
- $O(n \log n)$ — Linearithmic time
- $O(n^2)$ — Quadratic time

**Recursive Complexity:**

$$
T(n) = T(n-1) + O(1)
$$
```

### LaTeX Tips and Best Practices

1. **Test your equations**: Preview your markdown to ensure equations render correctly
2. **Use escape characters**: If you need literal dollar signs, escape them: `\$10.00`
3. **Keep it simple**: Complex nested equations may not render well; break them into smaller parts
4. **Multi-line equations**: Natural newlines within math blocks are automatically converted to LaTeX line breaks
   - In `$...$` blocks: newlines become `\\` for inline multi-line equations
   - In `$$...$$` blocks: newlines become `\\` for display multi-line equations
   - Example: `$\n\phi = x\n\alpha = y\n$` renders as two lines
5. **Error handling**: If an equation fails to render, check for:
   - Unmatched braces `{}`
   - Missing backslashes before commands
   - Unsupported LaTeX commands (KaTeX supports most common commands)

### Supported KaTeX Features

Aurorae Haven's KaTeX integration supports:

- ✅ All standard LaTeX math commands
- ✅ Greek letters and mathematical symbols
- ✅ Fractions, roots, and exponents
- ✅ Matrices and arrays
- ✅ Summations, products, integrals
- ✅ Custom spacing and alignment
- ⚠️ **Not supported**: Advanced LaTeX packages, custom macros, or TikZ diagrams

For a complete list of supported commands, see the [KaTeX Support Table](https://katex.org/docs/support_table.html).

---

## Displaying Images

Aurorae Haven supports embedding images in your markdown notes using standard markdown syntax. Images enhance your documentation and help visualize concepts.

### Basic Image Syntax

```markdown
![Alt text description](image-url-or-path)
```

- **Alt text**: Describes the image for screen readers and appears if image fails to load
- **URL or path**: Location of the image file

### Local Images (Recommended)

For privacy and offline use, store images locally and reference them using relative paths.

#### Option 1: Using File Attachments (OPFS)

The Brain Dump feature supports attaching files directly to notes:

1. Click **"📎 Attach"** button in the toolbar
2. Select your image file
3. The file reference is automatically inserted:

   ```text
   📎 Attachment: diagram.png (125.4 KB)
   ```

4. Files are stored securely in the browser's Origin Private File System (OPFS)

**Supported Browsers:**

- Chrome 86+ ✅
- Edge 86+ ✅
- Opera 72+ ✅
- Firefox (partial support) ⚠️
- Safari (partial support) ⚠️

#### Option 2: Markdown Image Syntax

If you have images in your project directory:

```markdown
![Project architecture diagram](./assets/images/architecture.png)
![Screenshot of UI](../screenshots/ui-mockup.png)
```

### External Images

You can also link to images hosted online:

```markdown
![Mountain landscape](https://example.com/images/mountain.jpg)
```

**Security Note:** Aurorae Haven has a strict Content Security Policy (CSP). External images must come from trusted sources. Images are sanitized through DOMPurify for security.

### Image with Link

Make an image clickable by wrapping it in a link:

```markdown
[![Project Logo](./logo.png)](https://project-website.com)
```

### Image Sizing

Markdown doesn't natively support sizing, but you can use HTML when needed:

```html
<img src="./diagram.png" alt="System diagram" width="600" />
```

**Note:** Keep accessibility in mind — always include descriptive `alt` attributes.

### Image Best Practices

#### 1. Always Provide Alt Text

Alt text is essential for:

- **Screen readers**: Users with visual impairments rely on alt text
- **Failed loads**: Shows when image can't be displayed
- **SEO**: Helps with searchability

**Good alt text examples:**

```markdown
![Bar chart showing quarterly sales growth from Q1 to Q4 2024](./charts/sales-q4.png)
![Screenshot of the Brain Dump editor with markdown preview](./screenshots/braindump.png)
![Photograph of team members collaborating in a meeting room](./photos/team-meeting.jpg)
```

**Avoid generic descriptions:**

```markdown
<!-- ❌ Bad -->

![image](./photo.jpg)
![picture](./diagram.png)

<!-- ✅ Good -->

![Network topology diagram with three servers and load balancer](./diagram.png)
```

#### 2. Optimize File Sizes

- **Compress images**: Use tools like TinyPNG or ImageOptim
- **Choose appropriate formats**:
  - `.jpg` for photos
  - `.png` for diagrams, screenshots, or images with transparency
  - `.svg` for vector graphics (scalable, small file size)
  - `.webp` for modern browsers (best compression)
- **Resize before uploading**: Don't use 4K images if display size is 800px

#### 3. Use Descriptive Filenames

```markdown
<!-- ❌ Avoid -->

![Diagram](./img1.png)

<!-- ✅ Better -->

![Database schema diagram](./database-schema-diagram.png)
```

#### 4. Organize Images

Create a clear folder structure:

```text
/assets/
  /images/
    /diagrams/
    /screenshots/
    /photos/
    /icons/
```

#### 5. Privacy and Security

- **Avoid personal information**: Don't include sensitive data in screenshots
- **Check licenses**: Ensure you have rights to use external images
- **Local storage**: For maximum privacy, use OPFS file attachments instead of external links

#### 6. Accessibility Considerations

- **Decorative images**: Use empty alt text `alt=""` for purely decorative images
- **Complex images**: Provide detailed descriptions or link to full description
- **Color contrast**: Ensure text in images has sufficient contrast
- **Don't rely on color alone**: Use patterns or labels in charts

**Example with detailed description:**

```markdown
![Complex flowchart showing the user authentication process](./auth-flow.png)

The flowchart above illustrates the authentication flow:

1. User enters credentials
2. System validates against database
3. If valid, generate JWT token
4. Return token to client
5. Client stores token in secure storage
```

### Image Examples

#### Diagram with Caption

```markdown
![System architecture diagram showing frontend, API, and database layers](./architecture.png)

**Figure 1:** High-level system architecture
```

#### Multiple Images in a Grid

```markdown
## UI Mockups

![Homepage design](./mockups/home.png)
![Dashboard design](./mockups/dashboard.png)
![Settings page design](./mockups/settings.png)
```

#### Image in a List

```markdown
## Setup Steps

1. Install dependencies
2. Configure environment
   ![Sample .env file configuration](./config-example.png)
3. Run the application
```

### Troubleshooting Images

**Image not displaying?**

1. **Check the path**: Ensure the file path is correct and relative to your note
2. **Check file permissions**: Ensure the file is readable
3. **Check CSP**: Browser console may show Content Security Policy errors
4. **Verify file format**: Use common formats (jpg, png, gif, svg, webp)
5. **Check file size**: Very large files may fail to load

**OPFS not working?**

- Update to a modern browser (Chrome 86+, Edge 86+)
- Check browser console for errors
- Verify that OPFS is supported in your browser

---

## Complete Markdown Reference

In addition to LaTeX and images, Aurorae Haven supports full GitHub Flavored Markdown (GFM).

### Text Formatting

```markdown
**Bold text** or **bold text**
_Italic text_ or _italic text_
**_Bold and italic_**
~~Strikethrough~~
`Inline code`
```

### Headings

```markdown
# H1 Heading

## H2 Heading

### H3 Heading

#### H4 Heading

##### H5 Heading

###### H6 Heading
```

### Lists

```markdown
- Unordered list item 1
- Unordered list item 2
  - Nested item
  - Another nested item

1. Ordered list item 1
2. Ordered list item 2
   1. Nested numbered item
   2. Another nested item

- [ ] Task list item (unchecked)
- [x] Task list item (checked)
```

### Links

```markdown
[Link text](https://example.com)
[Link with title](https://example.com 'Hover text')
<https://example.com> — Automatic link
```

### Backlinks (Wiki-style)

```markdown
[[Note Title]] — Creates a backlink to another note
[[Project Planning]] — Link to "Project Planning" note
```

### Code Blocks

````markdown
```javascript
// Syntax highlighted code
const greeting = 'Hello, world!'
console.log(greeting)
```

```python
# Python example
def factorial(n):
    return 1 if n <= 1 else n * factorial(n-1)
```
````

### Blockquotes

```markdown
> This is a blockquote
>
> > Nested blockquote
```

### Horizontal Rules

```markdown
---
---

---
```

### Tables

```markdown
| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

| Left-aligned | Center-aligned | Right-aligned |
| :----------- | :------------: | ------------: |
| Left         |     Center     |         Right |
```

### Auto-List Continuation

When editing in Brain Dump:

- Press **Enter** on a list item to automatically create the next item
- Press **Enter** twice to exit the list
- Works with bullet lists, numbered lists, and task lists

---

## Accessibility Best Practices

Aurorae Haven is designed with accessibility as a priority, following WCAG 2.2 AA standards.

### Writing Accessible Markdown

1. **Use semantic headings**: Start with H1, then H2, H3 in hierarchical order
2. **Provide alt text for all images**: Describe the content and purpose
3. **Write descriptive link text**: Avoid "click here" or "read more"
4. **Use sufficient color contrast**: Ensure text is readable
5. **Structure content logically**: Use lists, headings, and paragraphs
6. **Avoid relying on color alone**: Use labels and patterns
7. **Keep equations readable**: Break complex formulas into smaller parts

### Keyboard Shortcuts

- **Ctrl/Cmd + S**: Export all notes as markdown (single `.md` for one note, `.zip` for multiple)
- **Ctrl/Cmd + H**: Open version history
- **Escape**: Close modals
- **Enter**: Auto-continue lists
- **Tab**: Navigate between elements

### Screen Reader Support

All Brain Dump features include:

- Descriptive ARIA labels
- Live region announcements for state changes
- Semantic HTML structure
- Keyboard navigation support

---

## Accessing This Manual in the App

### Option 1: Help Button (Recommended)

Add a **"Help"** or **"?"** button to the Brain Dump toolbar:

- **Placement**: Right side of toolbar, next to Export/Import buttons
- **Icon**: `?` or `📖` or `ℹ️`
- **Behavior**: Opens a modal with quick reference or links to full documentation
- **Minimal UX impact**: Collapses on mobile, icon-only with tooltip on desktop

**Example Implementation:**

```javascript
// Add to toolbar:
;<button
  className='toolbar-button'
  onClick={handleHelpClick}
  aria-label='Open user manual and help documentation'
  title='Help'
>
  <span aria-hidden='true'>?</span>
</button>
```

### Option 2: Footer Link

Add a footer link to the navigation:

- **Placement**: Bottom of sidebar navigation
- **Label**: "User Manual" or "Help & Documentation"
- **Target**: Opens this manual in a new tab or modal

### Option 3: First-Time User Tooltip

Show a brief tooltip on first visit:

- **Trigger**: First time user opens Brain Dump
- **Content**: "💡 Tip: Click ? for LaTeX and image help"
- **Dismissible**: User can close and won't see again
- **Minimal disruption**: Small, non-blocking notification

### Option 4: Context Menu

Add a context menu item when right-clicking in the editor:

- **Option**: "Show formatting help"
- **Content**: Quick reference card with LaTeX and markdown examples

### Recommended Approach (Minimal UX Impact)

**Combine Options 1 and 3:**

1. Add a small **"?"** icon button to the toolbar (Option 1)
2. Show a one-time dismissible tooltip on first visit (Option 3)
3. Tooltip points to the "?" button: "Need help with LaTeX or images? Click here!"

**Benefits:**

- ✅ Always accessible but not intrusive
- ✅ Educates new users without overwhelming them
- ✅ Respects experienced users (dismissible, icon-only)
- ✅ Maintains minimalist aesthetic
- ✅ Accessible via keyboard (Tab to button, Enter to open)

**Implementation Sketch:**

```jsx
// Modal content can be a scrollable panel with sections
<Modal title='Brain Dump Help'>
  <Tabs>
    <Tab label='Quick Reference'>
      {/* Cheat sheet with common markdown, LaTeX, images */}
    </Tab>
    <Tab label='LaTeX Examples'>{/* Common equations and symbols */}</Tab>
    <Tab label='Images'>{/* How to embed and attach images */}</Tab>
    <Tab label='Full Manual'>
      {/* Link to USER_MANUAL.md or embedded view */}
    </Tab>
  </Tabs>
</Modal>
```

---

## Additional Resources

- **[Notes Specifications](./docs/NOTES_SPECS.md)**: Technical implementation details
- **[Notes Usage Guide](./docs/NOTES_USAGE.md)**: Feature walkthrough
- **[KaTeX Documentation](https://katex.org/docs/supported.html)**: Full LaTeX command reference
- **[GitHub Flavored Markdown Spec](https://github.github.com/gfm/)**: Complete GFM specification
- **[WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)**: Web accessibility standards

---

## License

This manual is part of the Aurorae Haven project and follows the same [MIT License](./LICENSE).

---

**Last Updated**: 2025-01-15  
**Maintained By**: Aurorae Haven Development Team

---

## Automatic Save Feature

Aurorae Haven includes an automatic save feature that periodically saves all your data to a local directory of your choice. This provides an additional backup layer beyond the built-in IndexedDB storage and manual export/import functionality.

### Requirements

The automatic save feature requires:

- A modern browser that supports the **File System Access API** (Chrome 86+, Edge 86+)
- User permission to access a local directory

### Setting Up Automatic Save

1. **Navigate to Settings**
   - Click the **Settings** link in the navigation menu
   - Or press the keyboard shortcut (if configured)

2. **Select Save Directory**
   - Click the **"Select Directory"** button in the Automatic Save section
   - Choose a folder where you want your automatic saves to be stored
   - Recommended: Create a dedicated "saves" folder in your Documents or project root

3. **Enable Automatic Save**
   - Check the **"Enable Automatic Save"** checkbox
   - The app will now automatically save your data at regular intervals

### Configuration Options

#### Save Interval

- **Default**: 5 minutes
- **Range**: 1-60 minutes
- **Description**: How often the app automatically saves your data
- **Tip**: Shorter intervals provide more frequent backups but create more files

#### Keep Recent Files

- **Default**: 10 files
- **Range**: 1-100 files
- **Description**: Number of most recent save files to keep (older files are automatically deleted)
- **Tip**: Higher values keep more history but use more disk space

### Using Auto-Save Features

#### Manual Save

Click the **"Save Now"** button to immediately save your current data without waiting for the next automatic save interval.

#### Load Last Save

Click the **"Load Last Save"** button to restore your data from the most recent save file. This will:

1. Find the most recently saved file in your configured directory
2. Load and validate the data
3. Import it into the app (replacing current data)
4. Reload the page to apply the changes

**⚠️ Warning**: Loading a save file will replace all current data. Make sure to export your current data first if you want to keep it.

#### Clean Old Files

Click the **"Clean Old Files"** button to manually remove save files that exceed the "Keep Recent Files" limit. This happens automatically during each save, but you can trigger it manually if needed.

### Save File Format

Auto-save files are stored with the following naming convention:

```text
aurorae_save_YYYY-MM-DD_HHMMSS_<uuid>.json
```

Example: `aurorae_save_2026-01-08_143025_a1b2c3d4.json`

The files are standard JSON format and can be:

- Opened with any text editor
- Imported using the Import button in the app
- Shared with other Aurorae Haven users
- Manually copied to cloud storage or backup services

### Browser Compatibility

| Browser      | Support          | Notes                                                                                |
| ------------ | ---------------- | ------------------------------------------------------------------------------------ |
| Chrome 86+   | ✅ Full          | Recommended                                                                          |
| Edge 86+     | ✅ Full          | Recommended                                                                          |
| Firefox      | ❌ Not supported | Use manual Export instead                                                            |
| Safari 15.2+ | ⚠️ Partial       | Enable **Develop → Experimental Features → "File System Access API"** (if available) |

**Note for Safari users**: If you do **not** see a "File System Access API" option under **Develop → Experimental Features**, your Safari version does not support directory-based auto-save. You can still use manual Export/Import as described below.

**Fallback**: If your browser doesn't support the File System Access API, you can still use:

- Manual Export/Import buttons (always available)
- Built-in IndexedDB automatic backups (every 24 hours)

### Troubleshooting

#### "No directory configured" Error

- Solution: Click "Select Directory" to choose a save location

#### "Directory access expired" Error

- Solution: Browser permissions may have been revoked. Click "Select Directory" again to re-grant access

#### "No save files found" Error

- Solution: No save files exist yet in the selected directory. Use "Save Now" to create the first save file

#### Auto-save not working

- Check that auto-save is enabled in Settings
- Verify that you've selected a directory
- Check browser console for error messages
- Try clicking "Save Now" to test manually

### Security & Privacy

- All save files are stored **locally** on your device
- No data is sent to external servers
- The File System Access API requires explicit user permission
- Files are saved with full read/write permissions for your user account
- Save files can be encrypted at rest using your operating system's disk encryption features

---

## Need Help?

- **GitHub Issues**: Tag with `documentation` or `brain-dump` label
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines
- **Community**: Join discussions in GitHub Discussions

---

_Aurorae Haven: Calm productivity for neurodivergent minds_ 🌌
