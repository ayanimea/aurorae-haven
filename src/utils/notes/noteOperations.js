import { v4 as generateSecureUUID } from 'uuid'
import JSZip from 'jszip'
import {
  generateBrainDumpFilename,
  extractTitleFromFilename,
  sanitizeFilename
} from '../fileHelpers'
import { createLogger } from '../logger'

const logger = createLogger('NoteOperations')
const ODT_MIME_TYPE = 'application/vnd.oasis.opendocument.text'
// Keeps bulk ZIP generation responsive while avoiding large in-memory spikes.
const MAX_CONCURRENT_ODT_GENERATION = 4

function filterInvalidXmlChars(text) {
  const validChars = []

  for (const char of String(text)) {
    const codePoint = char.codePointAt(0)
    const isValidXmlChar =
      codePoint === 0x9 ||
      codePoint === 0xa ||
      codePoint === 0xd ||
      (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
      (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
      (codePoint >= 0x10000 && codePoint <= 0x10ffff)

    if (isValidXmlChar) {
      validChars.push(char)
    }
  }

  return validChars.join('')
}

function escapeXml(text) {
  return filterInvalidXmlChars(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Validate a URL for use as an ODT xlink:href.
// Allowed schemes: https, http, mailto, and fragment (#).
// Rejects any URL containing whitespace or control characters, and requires
// http/https URLs to parse correctly (e.g. rejects "http:" with no host).
function isSafeOdtUrl(url) {
  if (!url) return false
  const s = url.trim()
  // Reject anything with embedded ASCII control characters or literal space.
  // Percent-encoded equivalents (e.g. %20) are safe and not affected by this check.
  if (/[\x00-\x20\x7f]/.test(s)) return false
  if (s.startsWith('#')) return true
  if (/^mailto:/i.test(s)) return true
  if (/^https?:/i.test(s)) {
    try {
      const parsed = new URL(s)
      return (
        (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
        parsed.hostname !== ''
      )
    } catch {
      return false
    }
  }
  return false
}

// Inline Markdown patterns in priority order (longest/most-specific first).
// Sticky flag (y) lets us match at a specific position without string slicing,
// keeping inlineToOdt() O(n) rather than O(n²) on large inputs.
// lastIndex is reset to the current position before every exec() call so
// module-level state is safe even under recursive inlineToOdt() calls.
const INLINE_PATTERNS = [
  { re: /`([^`]+)`/y, type: 'code' },
  { re: /\*\*\*(.+?)\*\*\*/y, type: 'bold-italic' },
  // wordBoundary: true — word-boundary guard is applied in JS (text[pos-1] / text[lastIndex])
  // rather than regex negative lookbehind (?<!\w) / lookahead (?!\w), which are
  // not supported in Safari 14/15 (causes a parse-time SyntaxError).
  { re: /___(.+?)___/y, type: 'bold-italic', wordBoundary: true },
  { re: /\*\*([^*].*?)\*\*/y, type: 'bold' },
  { re: /__([^_].*?)__/y, type: 'bold', wordBoundary: true },
  { re: /\*([^*\n]+?)\*/y, type: 'italic' },
  { re: /_([^_\n]+?)_/y, type: 'italic', wordBoundary: true },
  { re: /~~(.+?)~~/y, type: 'strikethrough' },
  // Link/image URL: supports one level of balanced parentheses in the URL
  // (e.g. Wikipedia links like "Mathematics_(disambiguation)").
  // Pattern: [^()]* matches non-paren chars; (?:\([^()]*\)[^()]*)* matches
  // zero or more "(...non-parens...)" groups interspersed with non-paren chars.
  { re: /!\[([^\]]*)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/y, type: 'image' },
  { re: /\[([^\]]+)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/y, type: 'link' },
]

// Tokenise inline markdown and convert to ODT XML.
// Handles: bold, italic, bold-italic, inline code, strikethrough, links, images.
function inlineToOdt(text) {
  if (!text) return ''

  const tokens = []
  let pos = 0

  while (pos < text.length) {
    let matched = false
    for (const { re, type, wordBoundary } of INLINE_PATTERNS) {
      re.lastIndex = pos
      const m = re.exec(text)
      if (!m) continue
      // For underscore-based patterns, guard against intraword matches (e.g. a_b_c).
      // This check replaces regex lookbehind/lookahead which is unsupported in Safari 14/15.
      if (wordBoundary) {
        const before = pos > 0 ? text[pos - 1] : ' '
        const after = re.lastIndex < text.length ? text[re.lastIndex] : ' '
        if (/\w/.test(before) || /\w/.test(after)) continue
      }
      tokens.push({ type, content: m[1], url: m[2] || null })
      pos = re.lastIndex
      matched = true
      break
    }
    if (!matched) {
      const last = tokens[tokens.length - 1]
      if (last?.type === 'text') {
        last.content += text[pos]
      } else {
        tokens.push({ type: 'text', content: text[pos] })
      }
      pos++
    }
  }

  return tokens
    .map(({ type, content, url }) => {
      switch (type) {
        case 'code':
          return `<text:span text:style-name="Code_Char">${escapeXml(content)}</text:span>`
        case 'bold-italic':
          return `<text:span text:style-name="Bold_Italic_Char">${inlineToOdt(content)}</text:span>`
        case 'bold':
          return `<text:span text:style-name="Bold_Char">${inlineToOdt(content)}</text:span>`
        case 'italic':
          return `<text:span text:style-name="Italic_Char">${inlineToOdt(content)}</text:span>`
        case 'strikethrough':
          return `<text:span text:style-name="Strikethrough_Char">${inlineToOdt(content)}</text:span>`
        case 'image':
          return `[${escapeXml(content)}]`
        case 'link': {
          const href = url ? url.trim() : ''
          if (isSafeOdtUrl(href)) {
            return `<text:a xlink:type="simple" xlink:href="${escapeXml(href)}" text:style-name="Internet_Link">${inlineToOdt(content)}</text:a>`
          }
          return inlineToOdt(content)
        }
        default:
          return escapeXml(content)
      }
    })
    .join('')
}

function markdownToOdtElements(markdown) {
  if (!markdown) return '<text:p></text:p>'

  const lines = markdown.split('\n')
  const elements = []
  let inCodeBlock = false
  const listStack = []
  let listIndentUnit = null

  // --- Table state ---
  let inTable = false
  let tableLines = []
  let tableIndex = 0

  const parseTableRow = (line) =>
    line
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((cell) => cell.trim())

  // A table separator row: every non-empty cell (split on |) must be at least
  // three dashes with optional leading/trailing colon for column alignment
  // (e.g. "---", ":---", "---:", ":---:"). Matches GFM/marked behaviour.
  // A line with no pipe at all (e.g. bare "---") is NOT a valid separator —
  // that is a thematic break (horizontal rule) instead.
  const isTableSeparatorLine = (line) => {
    const t = line.trim()
    if (!t.includes('|')) return false
    const cells = t
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c !== '')
    return cells.length >= 1 && cells.every((c) => /^:?-{3,}:?$/.test(c))
  }

  // Returns true when the line starts with a blockquote (>) or list (-/*/+/1.)
  // marker — such lines must never be mis-parsed as table rows.
  const hasBlockquoteOrListPrefix = (line) =>
    /^>/.test(line) || /^\s*([-*+]|\d+\.)\s/.test(line)

  const flushTable = () => {
    if (!inTable) return
    const captured = tableLines
    tableLines = []
    inTable = false
    if (captured.length === 0) return

    tableIndex += 1
    const parsedRows = captured.map(parseTableRow)

    let headerRow = null
    let bodyRows = parsedRows

    if (captured.length >= 2 && isTableSeparatorLine(captured[1])) {
      headerRow = parsedRows[0]
      bodyRows = parsedRows.slice(2)
    }

    const numCols = Math.max(
      headerRow ? headerRow.length : 0,
      ...bodyRows.map((r) => r.length),
      1
    )

    let xml = `<table:table table:name="Table${tableIndex}">`
    for (let i = 0; i < numCols; i++) {
      xml += `<table:table-column/>`
    }

    if (headerRow) {
      xml += `<table:table-header-rows><table:table-row>`
      for (let i = 0; i < numCols; i++) {
        xml += `<table:table-cell><text:p text:style-name="Table_Header_Contents">${inlineToOdt(headerRow[i] || '')}</text:p></table:table-cell>`
      }
      xml += `</table:table-row></table:table-header-rows>`
    }

    for (const row of bodyRows) {
      xml += `<table:table-row>`
      for (let i = 0; i < numCols; i++) {
        xml += `<table:table-cell><text:p text:style-name="Table_Contents">${inlineToOdt(row[i] || '')}</text:p></table:table-cell>`
      }
      xml += `</table:table-row>`
    }

    xml += `</table:table>`
    elements.push(xml)
  }

  // Normalize tabs to 4 spaces to keep nested list depth consistent.
  const normalizeIndentWidth = (indent) =>
    Array.from(indent).reduce((total, char) => total + (char === '\t' ? 4 : 1), 0)
  const detectListIndentUnit = (indentWidth) => {
    if (indentWidth > 0 && listIndentUnit === null) {
      listIndentUnit = indentWidth
    }
  }

  const openList = (ordered) => {
    elements.push(
      `<text:list text:style-name="${ordered ? 'Numbering_20_1' : 'List_20_1'}">`
    )
    listStack.push({ ordered, itemOpen: false })
  }

  const closeOpenItem = () => {
    const current = listStack[listStack.length - 1]
    if (!current?.itemOpen) return
    elements.push('</text:list-item>')
    current.itemOpen = false
  }

  const closeList = () => {
    if (listStack.length === 0) return
    closeOpenItem()
    elements.push('</text:list>')
    listStack.pop()
  }

  const closeAllLists = () => {
    while (listStack.length > 0) {
      closeList()
    }
  }

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]
    const nextLine = lineIdx + 1 < lines.length ? lines[lineIdx + 1] : ''
    if (/^```/.test(line.trim())) {
      if (inTable) flushTable()
      closeAllLists()
      inCodeBlock = !inCodeBlock
      continue
    }

    if (inCodeBlock) {
      elements.push(
        `<text:p text:style-name="Preformatted_Text">${escapeXml(line)}</text:p>`
      )
      continue
    }

    if (!line.trim()) {
      if (inTable) flushTable()
      closeAllLists()
      elements.push('<text:p></text:p>')
      continue
    }

    // Table rows: lines containing '|'.
    // A new table is only started when the next line is a valid GFM separator row
    // (e.g. |---|---|). This matches how the app's marked preview handles tables
    // and prevents false positives for normal text that happens to contain pipes.
    // Once already inside a table, any line with '|' continues the table.
    // Lines that begin with a blockquote (>) or list (- / * / + / 1.) prefix are
    // excluded — they must be parsed by the blockquote/list handlers further down.
    if (
      !hasBlockquoteOrListPrefix(line) &&
      ((inTable && line.includes('|')) ||
        (!inTable && line.includes('|') && isTableSeparatorLine(nextLine)))
    ) {
      closeAllLists()
      inTable = true
      tableLines.push(line)
      continue
    }

    // Flush any accumulated table before processing non-table content.
    if (inTable) flushTable()

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      closeAllLists()
      const level = headingMatch[1].length
      elements.push(
        `<text:h text:style-name="Heading ${level}" text:outline-level="${level}">${inlineToOdt(headingMatch[2])}</text:h>`
      )
      continue
    }

    // Horizontal rule: three or more -, *, or _ with optional surrounding spaces.
    if (/^(\s*[-*_]\s*){3,}$/.test(line.trim())) {
      closeAllLists()
      elements.push('<text:p text:style-name="Horizontal_Line"></text:p>')
      continue
    }

    // Blockquote.
    const blockquoteMatch = line.match(/^>\s?(.*)$/)
    if (blockquoteMatch) {
      closeAllLists()
      elements.push(
        `<text:p text:style-name="Quotations">${inlineToOdt(blockquoteMatch[1])}</text:p>`
      )
      continue
    }

    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/)
    if (listMatch) {
      const indentWidth = normalizeIndentWidth(listMatch[1])
      detectListIndentUnit(indentWidth)
      const indentLevel = Math.floor(indentWidth / (listIndentUnit || 2)) + 1
      const ordered = /\d+\./.test(listMatch[2])

      while (listStack.length > indentLevel) {
        closeList()
      }

      if (listStack.length === indentLevel) {
        const current = listStack[listStack.length - 1]
        if (current?.ordered !== ordered) {
          closeList()
        } else {
          closeOpenItem()
        }
      }

      while (listStack.length < indentLevel) {
        if (listStack.length > 0 && !listStack[listStack.length - 1].itemOpen) {
          elements.push('<text:list-item>')
          listStack[listStack.length - 1].itemOpen = true
        }
        openList(ordered)
      }

      elements.push(
        `<text:list-item><text:p>${inlineToOdt(listMatch[3])}</text:p>`
      )
      listStack[listStack.length - 1].itemOpen = true
      continue
    }

    closeAllLists()
    elements.push(`<text:p>${inlineToOdt(line)}</text:p>`)
  }

  if (inTable) flushTable()
  closeAllLists()
  return elements.join('')
}

// Maximum length for auto-generated ODT document description (Summary) text.
const MAX_DESCRIPTION_LENGTH = 300

// Truncate text to maxLen characters at a word boundary to avoid mid-word cuts.
function truncateAtWord(text, maxLen) {
  if (text.length <= maxLen) return text
  const cut = text.slice(0, maxLen)
  const lastSpace = cut.lastIndexOf(' ')
  return lastSpace > 0 ? cut.slice(0, lastSpace) : cut
}

// Strip markdown syntax and return the first MAX_DESCRIPTION_LENGTH characters of plain text.
// Used to populate the ODT document description (Summary) in meta.xml so that
// word processors like LibreOffice Writer and Microsoft Word auto-populate the
// "Summary" / "Description" field in File → Properties without any extra steps.
function extractTextSummary(markdown, maxLen = MAX_DESCRIPTION_LENGTH) {
  if (!markdown) return ''
  const plain = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    // Underscore emphasis: require a non-word char (or line start) before the
    // opener so that identifiers like SOME_CONST_NAME are not stripped.
    // Lookahead is used on the closing side (supported in Safari 14+);
    // the leading non-word char is captured and re-emitted as $1.
    .replace(/(^|[^a-zA-Z0-9])___(.+?)___(?=[^a-zA-Z0-9]|$)/g, '$1$2')
    .replace(/(^|[^a-zA-Z0-9])__(.+?)__(?=[^a-zA-Z0-9]|$)/g, '$1$2')
    .replace(/(^|[^a-zA-Z0-9])_(.+?)_(?=[^a-zA-Z0-9]|$)/g, '$1$2')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Strip GFM table separator rows in both piped (|---|---|) and
    // pipeless (---|---) forms: a line consisting only of -, :, |, and spaces.
    .replace(/^[ \t]*\|?[ \t]*:?-+:?(?:[ \t]*[|+][ \t]*:?-+:?)+[ \t]*\|?[ \t]*$/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
  return truncateAtWord(plain, maxLen)
}

// Coerce a value to a valid ISO 8601 date string.
// Returns null if the value is absent or not a valid date.
function toIsoDate(value) {
  if (!value) return null
  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

// Build an ODT meta.xml string with document properties.
// <dc:description> is the "Summary/Comments" field shown in
// LibreOffice File → Properties → Description and
// MS Word File → Info → Properties → Comments.
function buildMetaXml(title, description, createdAt, modifiedAt) {
  const now = new Date().toISOString()
  const created = toIsoDate(createdAt) || now
  const modified = toIsoDate(modifiedAt) || now
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  office:version="1.2">
  <office:meta>
    <dc:title>${escapeXml(title || '')}</dc:title>
    <dc:description>${escapeXml(description || '')}</dc:description>
    <meta:creation-date>${created}</meta:creation-date>
    <dc:date>${modified}</dc:date>
  </office:meta>
</office:document-meta>`
}

const ODT_STYLES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
  office:version="1.2">
  <office:font-face-decls>
    <style:font-face style:name="Space Grotesk" svg:font-family="'Space Grotesk'" style:font-family-generic="swiss" style:font-pitch="variable"/>
    <style:font-face style:name="Inter" svg:font-family="Inter" style:font-family-generic="swiss" style:font-pitch="variable"/>
    <style:font-face style:name="Courier New" svg:font-family="'Courier New'" style:font-family-generic="modern" style:font-pitch="fixed"/>
  </office:font-face-decls>
  <office:styles>
    <style:default-style style:family="paragraph">
      <style:paragraph-properties fo:line-height="155%" fo:margin-bottom="0.2cm"/>
      <style:text-properties style:font-name="Inter" fo:font-family="Inter, system-ui, sans-serif" fo:font-size="11pt" fo:color="#1a1d2e" fo:language="en" fo:country="US"/>
    </style:default-style>
    <style:style style:name="Title" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0" fo:margin-bottom="0.4cm" fo:keep-with-next="always"/>
      <style:text-properties style:font-name="Space Grotesk" fo:font-family="'Space Grotesk', Inter, system-ui, sans-serif" fo:font-weight="bold" fo:font-size="28pt" fo:color="#0f1535"/>
    </style:style>
    <style:style style:name="Heading 1" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.5cm" fo:margin-bottom="0.2cm" fo:keep-with-next="always"/>
      <style:text-properties style:font-name="Space Grotesk" fo:font-family="'Space Grotesk', Inter, system-ui, sans-serif" fo:font-weight="bold" fo:font-size="24pt" fo:color="#0f1535"/>
    </style:style>
    <style:style style:name="Heading 2" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.4cm" fo:margin-bottom="0.15cm" fo:keep-with-next="always"/>
      <style:text-properties style:font-name="Space Grotesk" fo:font-family="'Space Grotesk', Inter, system-ui, sans-serif" fo:font-weight="bold" fo:font-size="18pt" fo:color="#1a1d2e"/>
    </style:style>
    <style:style style:name="Heading 3" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.35cm" fo:margin-bottom="0.12cm" fo:keep-with-next="always"/>
      <style:text-properties style:font-name="Space Grotesk" fo:font-family="'Space Grotesk', Inter, system-ui, sans-serif" fo:font-weight="bold" fo:font-size="14pt" fo:color="#2a2e52"/>
    </style:style>
    <style:style style:name="Heading 4" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.3cm" fo:margin-bottom="0.1cm" fo:keep-with-next="always"/>
      <style:text-properties style:font-name="Inter" fo:font-family="Inter, system-ui, sans-serif" fo:font-weight="bold" fo:font-size="12pt" fo:color="#1a1d2e"/>
    </style:style>
    <style:style style:name="Heading 5" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.25cm" fo:margin-bottom="0.08cm" fo:keep-with-next="always"/>
      <style:text-properties style:font-name="Inter" fo:font-family="Inter, system-ui, sans-serif" fo:font-weight="bold" fo:font-size="11pt" fo:color="#1a1d2e"/>
    </style:style>
    <style:style style:name="Heading 6" style:family="paragraph">
      <style:paragraph-properties fo:margin-top="0.2cm" fo:margin-bottom="0.06cm" fo:keep-with-next="always"/>
      <style:text-properties style:font-name="Inter" fo:font-family="Inter, system-ui, sans-serif" fo:font-weight="bold" fo:font-style="italic" fo:font-size="10pt" fo:color="#2a2e52"/>
    </style:style>
    <style:style style:name="Preformatted_Text" style:family="paragraph">
      <style:paragraph-properties fo:background-color="#f4f5f9" fo:padding="0.2cm" fo:margin-top="0.2cm" fo:margin-bottom="0.2cm"/>
      <style:text-properties style:font-name="Courier New" fo:font-family="'Courier New', Courier, monospace" fo:font-size="10pt" fo:color="#1a1d2e"/>
    </style:style>
    <style:style style:name="Quotations" style:family="paragraph">
      <style:paragraph-properties fo:border-left="3pt solid #2a8f84" fo:padding-left="0.5cm" fo:padding-top="0.15cm" fo:padding-bottom="0.15cm" fo:margin-left="0.5cm" fo:margin-right="0.5cm" fo:background-color="#f4f5fa" fo:margin-top="0.2cm" fo:margin-bottom="0.2cm"/>
      <style:text-properties fo:font-style="italic" fo:color="#2a2e52"/>
    </style:style>
    <style:style style:name="Horizontal_Line" style:family="paragraph">
      <style:paragraph-properties fo:border-bottom="1pt solid #2a8f84" fo:padding-bottom="0.1cm" fo:margin-top="0.3cm" fo:margin-bottom="0.3cm"/>
    </style:style>
    <style:style style:name="Page_Break" style:family="paragraph">
      <style:paragraph-properties fo:break-before="page"/>
    </style:style>
    <style:style style:name="Table_Contents" style:family="paragraph">
      <style:text-properties style:font-name="Inter" fo:font-size="11pt"/>
    </style:style>
    <style:style style:name="Table_Header_Contents" style:family="paragraph">
      <style:paragraph-properties fo:background-color="#eef0ff"/>
      <style:text-properties style:font-name="Inter" fo:font-weight="bold" fo:font-size="11pt" fo:color="#0f1535"/>
    </style:style>
    <style:style style:name="Bold_Char" style:family="text">
      <style:text-properties fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Italic_Char" style:family="text">
      <style:text-properties fo:font-style="italic"/>
    </style:style>
    <style:style style:name="Bold_Italic_Char" style:family="text">
      <style:text-properties fo:font-weight="bold" fo:font-style="italic"/>
    </style:style>
    <style:style style:name="Code_Char" style:family="text">
      <style:text-properties style:font-name="Courier New" fo:font-size="10pt" fo:background-color="#eef0f4"/>
    </style:style>
    <style:style style:name="Strikethrough_Char" style:family="text">
      <style:text-properties style:text-line-through-style="solid"/>
    </style:style>
    <style:style style:name="Internet_Link" style:family="text">
      <style:text-properties fo:color="#007b6b" style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"/>
    </style:style>
    <text:list-style style:name="List_20_1">
      <text:list-level-style-bullet text:level="1" text:bullet-char="•"/>
    </text:list-style>
    <text:list-style style:name="Numbering_20_1">
      <text:list-level-style-number text:level="1" style:num-format="1"/>
    </text:list-style>
  </office:styles>
</office:document-styles>`

const ODT_MANIFEST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:media-type="${ODT_MIME_TYPE}" manifest:full-path="/"/>
  <manifest:file-entry manifest:media-type="" manifest:full-path="META-INF/"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="META-INF/manifest.xml"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="meta.xml"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="content.xml"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="styles.xml"/>
</manifest:manifest>`

const ODT_CONTENT_WRAPPER_OPEN = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  office:version="1.2">
  <office:body>
    <office:text>`

const ODT_CONTENT_WRAPPER_CLOSE = `    </office:text>
  </office:body>
</office:document-content>`

function buildOdtZip(contentXml, metaXml) {
  const zip = new JSZip()
  zip.file('mimetype', ODT_MIME_TYPE, { compression: 'STORE' })
  zip.file('META-INF/manifest.xml', ODT_MANIFEST_XML)
  zip.file('styles.xml', ODT_STYLES_XML)
  zip.file('meta.xml', metaXml)
  zip.file('content.xml', contentXml)
  return zip
}

async function createOdtBlob(title, content, meta = {}) {
  const resolvedTitle = title || 'Untitled Note'
  const titleXml = escapeXml(resolvedTitle)
  const bodyXml = markdownToOdtElements(content)
  const contentXml = `${ODT_CONTENT_WRAPPER_OPEN}
      <text:p text:style-name="Title">${titleXml}</text:p>
      ${bodyXml}
${ODT_CONTENT_WRAPPER_CLOSE}`
  const metaXml = buildMetaXml(resolvedTitle, extractTextSummary(content), meta.createdAt, meta.updatedAt)
  return buildOdtZip(contentXml, metaXml).generateAsync({ type: 'blob', mimeType: ODT_MIME_TYPE })
}

async function createCombinedOdtBlob(notes) {
  const noteParts = notes.map((note, index) => {
    const pageBreak = index === 0 ? '' : '<text:p text:style-name="Page_Break"/>'
    const titleXml = escapeXml(note?.title || 'Untitled Note')
    const bodyXml = markdownToOdtElements(note?.content ?? '')
    return `${pageBreak}<text:p text:style-name="Title">${titleXml}</text:p>${bodyXml}`
  })
  const contentXml = `${ODT_CONTENT_WRAPPER_OPEN}
      ${noteParts.join('\n      ')}
${ODT_CONTENT_WRAPPER_CLOSE}`
  const combinedTitle = notes.length === 1
    ? (notes[0]?.title || 'Untitled Note')
    : 'Combined Notes Export'
  const combinedDescription = notes.length === 1
    ? extractTextSummary(notes[0]?.content || '')
    : truncateAtWord(
        `Contains ${notes.length} notes: ${notes.map((n) => n?.title || 'Untitled').join(', ')}`,
        MAX_DESCRIPTION_LENGTH
      )
  // Use the earliest createdAt and latest updatedAt across all notes so the
  // timestamps reflect the actual range of the exported content regardless of
  // note ordering.
  const validDates = notes
    .map((n) => ({ c: toIsoDate(n?.createdAt), u: toIsoDate(n?.updatedAt) }))
    .filter((d) => d.c || d.u)
  const earliestCreated = validDates.length
    ? validDates.reduce((min, d) => (d.c && (!min || d.c < min) ? d.c : min), null)
    : null
  const latestUpdated = validDates.length
    ? validDates.reduce((max, d) => (d.u && (!max || d.u > max) ? d.u : max), null)
    : null
  const metaXml = buildMetaXml(combinedTitle, combinedDescription, earliestCreated, latestUpdated)
  return buildOdtZip(contentXml, metaXml).generateAsync({ type: 'blob', mimeType: ODT_MIME_TYPE })
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.setAttribute('aria-hidden', 'true')
  a.tabIndex = -1
  a.hidden = true
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => {
    if (typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(url)
    }
  }, 250)
}

function generateOdtFilename(title) {
  return generateBrainDumpFilename(title).replace(/\.md$/i, '.odt')
}

/**
 * Create a new note object
 * @returns {Object} - New note object with default properties
 */
export function createNewNote() {
  return {
    id: generateSecureUUID(),
    title: 'Untitled Note',
    content: '',
    category: '',
    locked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Create a note from imported markdown content
 * @param {string} filename - Original filename
 * @param {string} content - File content
 * @returns {Object} - New note object
 */
export function createNoteFromImport(filename, content) {
  const noteTitle = extractTitleFromFilename(filename)
  return {
    id: generateSecureUUID(),
    title: noteTitle,
    content,
    category: '',
    locked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Toggle lock status of a note
 * @param {Array} notes - Array of notes
 * @param {string} noteId - ID of note to toggle
 * @returns {Array} - Updated notes array
 */
export function toggleNoteLock(notes, noteId) {
  return notes.map((note) =>
    note.id === noteId ? { ...note, locked: !note.locked } : note
  )
}

/**
 * Update note content
 * @param {Array} notes - Array of notes
 * @param {string} noteId - ID of note to update
 * @param {Object} updates - Object with title, content, category
 * @returns {Array} - Updated notes array
 */
export function updateNote(notes, noteId, updates) {
  return notes.map((note) =>
    note.id === noteId
      ? { ...note, ...updates, updatedAt: new Date().toISOString() }
      : note
  )
}

/**
 * Delete a note from array
 * @param {Array} notes - Array of notes
 * @param {string} noteId - ID of note to delete
 * @returns {Array} - Updated notes array
 */
export function deleteNote(notes, noteId) {
  return notes.filter((n) => n.id !== noteId)
}

/**
 * Migrate notes to add missing fields
 * @param {Array} notes - Array of notes
 * @returns {Object} - { migratedNotes, needsMigration }
 */
export function migrateNotes(notes) {
  const needsMigration = notes.some(
    (note) => note.category === undefined || note.locked === undefined
  )
  const migratedNotes = notes.map((note) => ({
    ...note,
    category: note.category ?? '',
    locked: note.locked ?? false
  }))
  return { migratedNotes, needsMigration }
}

/**
 * Export note to markdown file
 * Security: Uses Blob API and programmatic download to export user content safely
 * @param {string} title - Note title
 * @param {string} content - Note content
 */
export function exportNoteToFile(title, content) {
  if (!content) return

  // Create blob from user content (plain text markdown)
  const blob = new Blob([content], { type: 'text/markdown' })
  downloadBlob(blob, generateBrainDumpFilename(title))
}

/**
 * Export a single note to ODT format
 * @param {string} title - Note title
 * @param {string} content - Note content
 * @param {Object} [meta] - Optional note metadata ({ createdAt, updatedAt })
 * @returns {Promise<void>}
 */
export async function exportNoteToOdtFile(title, content, meta = {}) {
  const blob = await createOdtBlob(title, content, meta)
  downloadBlob(blob, generateOdtFilename(title))
}

/**
 * Export all notes as ODT content using a single browser download.
 * For multiple notes, bulk export is delivered as a ZIP archive.
 * @param {Array} notes - Notes to export
 * @returns {Promise<void>}
 */
export async function exportAllNotesToSingleOdtDownload(notes) {
  if (!Array.isArray(notes) || notes.length === 0) return

  if (notes.length === 1) {
    const [note] = notes
    await exportNoteToOdtFile(note.title, note.content, { createdAt: note.createdAt, updatedAt: note.updatedAt })
    return
  }

  await exportAllNotesToOdtZip(notes)
}

/**
 * Export all notes as a single ODT document with each note on its own page.
 * @param {Array} notes - Notes to export
 * @returns {Promise<void>}
 */
export async function exportAllNotesToCombinedOdt(notes) {
  if (!Array.isArray(notes) || notes.length === 0) return

  if (notes.length === 1) {
    const [note] = notes
    await exportNoteToOdtFile(note.title, note.content, { createdAt: note.createdAt, updatedAt: note.updatedAt })
    return
  }

  const blob = await createCombinedOdtBlob(notes)
  downloadBlob(blob, `braindump_notes_combined_${new Date().toISOString().slice(0, 10)}.odt`)
}

/**
 * Export all notes as individual ODT files packaged in a ZIP archive.
 * @param {Array} notes - Notes to export
 * @returns {Promise<void>}
 */
export async function exportAllNotesToOdtZip(notes) {
  if (!Array.isArray(notes) || notes.length === 0) return

  const zip = new JSZip()
  const usedEntryNames = new Set()

  const getUniqueEntryName = (note, index) => {
    const baseName = sanitizeFilename(note?.title || 'untitled')
    const defaultEntryName = `${baseName}.odt`
    if (!usedEntryNames.has(defaultEntryName)) {
      usedEntryNames.add(defaultEntryName)
      return defaultEntryName
    }

    const suffixCandidates = [note?.id, note?.createdAt, index + 1]
      .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
      .map((value) => sanitizeFilename(String(value)))
      .filter(Boolean)

    for (const suffix of suffixCandidates) {
      const entryName = `${baseName}-${suffix}.odt`
      if (!usedEntryNames.has(entryName)) {
        usedEntryNames.add(entryName)
        return entryName
      }
    }

    let duplicateIndex = 2
    let fallbackEntryName = `${baseName}-${duplicateIndex}.odt`
    while (usedEntryNames.has(fallbackEntryName)) {
      duplicateIndex += 1
      fallbackEntryName = `${baseName}-${duplicateIndex}.odt`
    }
    usedEntryNames.add(fallbackEntryName)
    return fallbackEntryName
  }

  const zipEntries = notes.map((note, index) => ({
    note,
    entryName: getUniqueEntryName(note, index)
  }))
  const odtBlobs = new Array(zipEntries.length)
  const concurrencyLimit = Math.min(MAX_CONCURRENT_ODT_GENERATION, zipEntries.length)

  // Deterministic round-robin partitioning avoids shared mutable queue state.
  const workers = Array.from({ length: concurrencyLimit }, (_, workerIndex) => {
    return (async () => {
      for (
        let currentIndex = workerIndex;
        currentIndex < zipEntries.length;
        currentIndex += concurrencyLimit
      ) {
        const { note } = zipEntries[currentIndex]
        odtBlobs[currentIndex] = await createOdtBlob(note.title, note.content, { createdAt: note.createdAt, updatedAt: note.updatedAt })
      }
    })()
  })

  await Promise.all(workers)

  for (const [index, zipEntry] of zipEntries.entries()) {
    zip.file(
      zipEntry.entryName,
      odtBlobs[index],
      { binary: true }
    )
  }
 
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, `braindump_odt_export_${new Date().toISOString().slice(0, 10)}.zip`)
}

/**
 * Save notes to localStorage
 * @param {Array} notes - Array of notes to save
 */
export function saveNotesToStorage(notes) {
  localStorage.setItem('brainDumpEntries', JSON.stringify(notes))
}

/**
 * Load notes from localStorage
 * Security: Uses try-catch to handle JSON.parse safely, returns empty array on error
 * @returns {Array} - Array of notes
 */
export function loadNotesFromStorage() {
  try {
    const entriesData = localStorage.getItem('brainDumpEntries')
    // JSON.parse with error handling to prevent injection attacks
    return entriesData ? JSON.parse(entriesData) : []
  } catch (e) {
    logger.warn('Failed to parse brainDumpEntries:', e)
    return []
  }
}
