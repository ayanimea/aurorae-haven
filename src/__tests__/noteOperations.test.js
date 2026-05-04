import { afterEach, describe, expect, test, vi } from 'vitest'
import JSZip from 'jszip'
import {
  exportAllNotesToOdtZip,
  exportAllNotesToCombinedOdt,
  exportNoteToOdtFile
} from '../utils/notes/noteOperations'

let originalCreateElement = null
let originalCreateObjectURL = null
let originalRevokeObjectURL = null
let shouldRestoreCreateElement = false
let shouldRestoreCreateObjectURL = false
let shouldRestoreRevokeObjectURL = false
let setTimeoutSpy = null
let pendingTimerIds = []

function setupDownloadMocks() {
  // Intercept setTimeout to capture timer IDs so afterEach can cancel them before
  // they fire. This prevents the deferred URL.revokeObjectURL in downloadBlob()
  // from leaving pending timers between tests without affecting jsdom internals.
  const origSetTimeout = global.setTimeout
  setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((fn, delay, ...args) => {
    const id = origSetTimeout.call(global, fn, delay, ...args)
    pendingTimerIds.push(id)
    return id
  })

  const downloadedBlobs = []
  const downloadFilenames = []
  const mockClick = vi.fn()

  originalCreateObjectURL = global.URL.createObjectURL
  originalRevokeObjectURL = global.URL.revokeObjectURL
  shouldRestoreCreateObjectURL = true
  shouldRestoreRevokeObjectURL = true
  global.URL.createObjectURL = vi.fn((blob) => {
    downloadedBlobs.push(blob)
    return `blob:mock-${downloadedBlobs.length}`
  })
  global.URL.revokeObjectURL = vi.fn()

  originalCreateElement = document.createElement
  shouldRestoreCreateElement = true
  document.createElement = vi.fn((tag) => {
    if (tag === 'a') {
      const element = originalCreateElement.call(document, tag)
      element.click = mockClick
      Object.defineProperty(element, 'download', {
        set: (value) => { downloadFilenames.push(value) },
        get: () => downloadFilenames[downloadFilenames.length - 1] || ''
      })
      return element
    }
    return originalCreateElement.call(document, tag)
  })

  return { downloadedBlobs, mockClick, downloadFilenames }
}

afterEach(() => {
  // Cancel any pending timers (e.g. deferred URL.revokeObjectURL from downloadBlob)
  // before restoring the spy, so they don't fire after mock cleanup.
  pendingTimerIds.forEach((id) => clearTimeout(id))
  pendingTimerIds = []
  setTimeoutSpy?.mockRestore()
  setTimeoutSpy = null

  if (shouldRestoreCreateElement) {
    document.createElement = originalCreateElement
    shouldRestoreCreateElement = false
  }
  if (shouldRestoreCreateObjectURL) {
    global.URL.createObjectURL = originalCreateObjectURL
    shouldRestoreCreateObjectURL = false
  }
  if (shouldRestoreRevokeObjectURL) {
    global.URL.revokeObjectURL = originalRevokeObjectURL
    shouldRestoreRevokeObjectURL = false
  }
})

describe('noteOperations ODT inline formatting', () => {
  test('exports bold text with Bold_Char span', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Bold Test', 'Hello **world** end')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('text:style-name="Bold_Char"')
    expect(contentXml).toContain('>world<')
  })

  test('exports italic text with Italic_Char span', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Italic Test', 'Hello *world* end')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('text:style-name="Italic_Char"')
    expect(contentXml).toContain('>world<')
  })

  test('does not treat intraword underscores as italic (word-boundary guard)', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Intraword', 'a_b_c and SOME_CONST_NAME')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).not.toContain('text:style-name="Italic_Char"')
    expect(contentXml).toContain('a_b_c')
  })

  test('exports bold-italic text with Bold_Italic_Char span', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('BoldItalic Test', 'Hello ***world*** end')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('text:style-name="Bold_Italic_Char"')
    expect(contentXml).toContain('>world<')
  })

  test('exports inline code with Code_Char span', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Code Test', 'Use `console.log` here')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('text:style-name="Code_Char"')
    expect(contentXml).toContain('>console.log<')
  })

  test('exports strikethrough text with Strikethrough_Char span', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Strike Test', 'Remove ~~this~~ please')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('text:style-name="Strikethrough_Char"')
    expect(contentXml).toContain('>this<')
  })

  test('exports hyperlinks with text:a, xlink:href, and Internet_Link style for safe http URLs', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Link Test', 'Visit [example](https://example.com) site')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('<text:a')
    expect(contentXml).toContain('xlink:href="https://example.com"')
    expect(contentXml).toContain('text:style-name="Internet_Link"')
    expect(contentXml).toContain('>example<')
  })

  test('allows mailto: links as safe URLs', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Mail Link', '[contact](mailto:hello@example.com)')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('<text:a')
    expect(contentXml).toContain('xlink:href="mailto:hello@example.com"')
  })

  test('allows fragment # links as safe URLs', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Anchor Link', '[section](#section-1)')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('<text:a')
    expect(contentXml).toContain('xlink:href="#section-1"')
  })

  test('blocks javascript: URLs and renders link text only', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('XSS Link', '[click](javascript:alert(1))')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).not.toContain('<text:a')
    expect(contentXml).not.toContain('javascript:')
    expect(contentXml).toContain('click')
  })

  test('blocks data: URLs and renders link text only', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Data Link', '[x](data:text/html,<h1>hi</h1>)')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).not.toContain('<text:a')
    expect(contentXml).not.toContain('xlink:href')
    expect(contentXml).toContain('>x<')
  })

  test('blocks vbscript: URLs and renders link text only', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('VB Link', '[run](vbscript:MsgBox(1))')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).not.toContain('<text:a')
    expect(contentXml).not.toContain('vbscript:')
    expect(contentXml).toContain('run')
  })

  test('blocks http: URL with no host (malformed)', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Bad URL', '[bad](http:)')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).not.toContain('<text:a')
    expect(contentXml).toContain('bad')
  })

  test('blocks http:// URL with empty host', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Empty Host URL', '[bad](http://)')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).not.toContain('<text:a')
    expect(contentXml).toContain('bad')
  })

  test('blocks URL with embedded control character', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    // U+0001 (SOH) is a C0 control character that must be rejected
    await exportNoteToOdtFile('Control URL', '[x](https://example.com/\x01path)')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).not.toContain('<text:a')
    expect(contentXml).not.toContain('xlink:href')
  })

  test('preserves Wikipedia-style URLs with parentheses', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile(
      'Wiki Link',
      '[disambiguation](https://en.wikipedia.org/wiki/Mathematics_(disambiguation))'
    )
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('<text:a')
    expect(contentXml).toContain(
      'xlink:href="https://en.wikipedia.org/wiki/Mathematics_(disambiguation)"'
    )
    expect(contentXml).toContain('>disambiguation<')
  })
  test('normalizes whitespace-padded URLs: trims before safety check and href attribute', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Padded URL', '[link]( https://example.com )')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('<text:a')
    expect(contentXml).toContain('xlink:href="https://example.com"')
    expect(contentXml).not.toContain('xlink:href=" https://example.com ')
  })

  test('exports images as bracketed alt text', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Image Test', 'See ![a cat](cat.png) here')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('[a cat]')
  })

  test('applies inline formatting inside headings', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Heading Format', '## My **bold** heading')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('<text:h text:style-name="Heading_2" text:outline-level="2">')
    expect(contentXml).toContain('text:style-name="Bold_Char"')
  })

  test('applies inline formatting inside list items', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('List Format', '- Item with **bold** text')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('text:style-name="Bold_Char"')
  })

  test('includes xlink namespace declaration in content.xml for links', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('NS Test', '[click](https://x.com)')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"')
  })

  test('includes table namespace declaration in content.xml', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('NS Table', '| a | b |\n|---|---|\n| 1 | 2 |')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain(
      'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"'
    )
  })
})

describe('noteOperations ODT table export', () => {
  test('exports GFM pipes-optional table (no leading/trailing pipe characters)', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile(
      'Pipeless Table',
      'Name | Age\n-----|-----\nAlice | 30\nBob | 25'
    )
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).toContain('<table:table')
    expect(contentXml).toContain('<table:table-header-rows>')
    expect(contentXml).toContain('>Name<')
    expect(contentXml).toContain('>Age<')
    expect(contentXml).toContain('>Alice<')
    expect(contentXml).toContain('>Bob<')
  })

  test('single pipe-starting line with no following pipe is not treated as a table', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Lone Pipe', '| just one line\nNormal paragraph after.')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).not.toContain('<table:table')
    expect(contentXml).toContain('just one line')
  })

  test('plain text containing a pipe but no separator row is not treated as a table', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Pipe in text', 'The price | cost is 10\nNext sentence.')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).not.toContain('<table:table')
    expect(contentXml).toContain('The price')
  })

  test('exports markdown table with header and body rows', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile(
      'Table Note',
      '| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |'
    )
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).toContain('<table:table')
    expect(contentXml).toContain('<table:table-header-rows>')
    expect(contentXml).toContain('Table_Header_Contents')
    expect(contentXml).toContain('>Name<')
    expect(contentXml).toContain('>Age<')
    expect(contentXml).toContain('>Alice<')
    expect(contentXml).toContain('>Bob<')
    expect(contentXml).toContain('>30<')
    expect(contentXml).toContain('>25<')
  })

  test('two pipe-lines without a separator row are not treated as a table', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('NoHeader Table', '| foo | bar |\n| baz | qux |')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).not.toContain('<table:table')
    expect(contentXml).toContain('foo')
    expect(contentXml).toContain('baz')
  })

  test('exports multiple tables with distinct names', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile(
      'Two Tables',
      '| A |\n|---|\n| 1 |\n\n| B |\n|---|\n| 2 |'
    )
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).toContain('table:name="Table1"')
    expect(contentXml).toContain('table:name="Table2"')
  })

  test('applies inline formatting inside table cells', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile(
      'Bold Cell',
      '| **Header** |\n|---|\n| *italic* |'
    )
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).toContain('text:style-name="Bold_Char"')
    expect(contentXml).toContain('text:style-name="Italic_Char"')
  })

  test('table at end of content is flushed correctly', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('End Table', '| X | Y |\n|---|---|\n| 1 | 2 |')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).toContain('<table:table')
    expect(contentXml).toContain('</table:table>')
  })
})

describe('noteOperations ODT blockquote and horizontal rule', () => {
  test('exports blockquote with Quotations paragraph style', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Quote Note', '> This is a quote')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).toContain('text:style-name="Quotations"')
    expect(contentXml).toContain('>This is a quote<')
  })

  test('exports horizontal rule --- with Horizontal_Line paragraph style', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Rule Note', 'Above\n---\nBelow')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).toContain('text:style-name="Horizontal_Line"')
    expect(contentXml).toContain('>Above<')
    expect(contentXml).toContain('>Below<')
  })

  test('exports horizontal rule *** with Horizontal_Line paragraph style', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Rule Note 2', 'A\n***\nB')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).toContain('text:style-name="Horizontal_Line"')
  })
})

describe('noteOperations ODT styles.xml', () => {
  test('styles.xml includes character and paragraph style definitions', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Styles Test', 'text')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const stylesXml = await odtZip.file('styles.xml').async('string')

    expect(stylesXml).toContain('style:name="Bold_Char"')
    expect(stylesXml).toContain('style:name="Italic_Char"')
    expect(stylesXml).toContain('style:name="Bold_Italic_Char"')
    expect(stylesXml).toContain('style:name="Code_Char"')
    expect(stylesXml).toContain('style:name="Strikethrough_Char"')
    expect(stylesXml).toContain('style:name="Internet_Link"')
    expect(stylesXml).toContain('style:name="Quotations"')
    expect(stylesXml).toContain('style:name="Horizontal_Line"')
    expect(stylesXml).toContain('style:name="Table_Contents"')
    expect(stylesXml).toContain('style:name="Table_Header_Contents"')
    expect(stylesXml).toContain('style:name="Heading_1"')
    expect(stylesXml).toContain('style:name="Heading_2"')
    expect(stylesXml).toContain('style:name="Heading_3"')
    expect(stylesXml).toContain('style:name="Heading_4"')
    expect(stylesXml).toContain('style:name="Heading_5"')
    expect(stylesXml).toContain('style:name="Heading_6"')
  })

  test('styles.xml uses AH-style Space Grotesk font and pt sizes for headings', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('AH Style Test', 'text')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const stylesXml = await odtZip.file('styles.xml').async('string')

    expect(stylesXml).toContain('Space Grotesk')
    expect(stylesXml).toContain('fo:font-size="24pt"')
    expect(stylesXml).toContain('fo:color="#0f1535"')
    expect(stylesXml).toContain('fo:color="#007b6b"')
    expect(stylesXml).toContain('style:default-style')
  })
})

describe('noteOperations ODT heading export', () => {
  test('exports H1-H6 with text:style-name and text:outline-level', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile(
      'Heading Note',
      '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6'
    )
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).toContain(
      'text:style-name="Heading_1" text:outline-level="1"'
    )
    expect(contentXml).toContain(
      'text:style-name="Heading_2" text:outline-level="2"'
    )
    expect(contentXml).toContain(
      'text:style-name="Heading_3" text:outline-level="3"'
    )
    expect(contentXml).toContain(
      'text:style-name="Heading_4" text:outline-level="4"'
    )
    expect(contentXml).toContain(
      'text:style-name="Heading_5" text:outline-level="5"'
    )
    expect(contentXml).toContain(
      'text:style-name="Heading_6" text:outline-level="6"'
    )
    expect(contentXml).toContain('>H1<')
    expect(contentXml).toContain('>H6<')
  })

  test('heading text passes through inlineToOdt (bold inside heading)', async () => {
    const { downloadedBlobs } = setupDownloadMocks()
    await exportNoteToOdtFile('Heading Bold', '## Hello **world**')
    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).toContain('text:style-name="Heading_2"')
    expect(contentXml).toContain('text:style-name="Bold_Char"')
  })
})

describe('noteOperations ODT export', () => {
  test('includes nested-list structure and complete manifest entries in exported ODT', async () => {
    const { downloadedBlobs, mockClick } = setupDownloadMocks()

    await exportNoteToOdtFile(
      'Nested List Note',
      '- Parent item\n  - Child item\n1. Ordered root\n  1. Ordered child'
    )

    expect(mockClick).toHaveBeenCalledTimes(1)
    expect(downloadedBlobs).toHaveLength(1)

    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    const manifestXml = await odtZip.file('META-INF/manifest.xml').async('string')

    expect(contentXml).toContain(
      '<text:list-item><text:p>Parent item</text:p><text:list'
    )
    expect(contentXml).toContain(
      '<text:list-item><text:p>Ordered root</text:p><text:list'
    )
    expect(manifestXml).toContain('manifest:full-path="META-INF/"')
    expect(manifestXml).toContain('manifest:full-path="META-INF/manifest.xml"')
  })

  test('supports nested list detection for 4-space and tab indentation', async () => {
    const { downloadedBlobs, mockClick } = setupDownloadMocks()

    await exportNoteToOdtFile(
      'Mixed Indent Note',
      '- Parent\n    - Four-space child\n\t- Tab child'
    )

    expect(mockClick).toHaveBeenCalledTimes(1)
    expect(downloadedBlobs).toHaveLength(1)

    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).toContain(
      '<text:list-item><text:p>Parent</text:p><text:list'
    )
    expect(contentXml).toContain('<text:p>Four-space child</text:p>')
    expect(contentXml).toContain('<text:p>Tab child</text:p>')
  })

  test('returns early for invalid ZIP bulk export input', async () => {
    const { downloadedBlobs, mockClick } = setupDownloadMocks()

    await exportAllNotesToOdtZip()
    await exportAllNotesToOdtZip([])

    expect(mockClick).not.toHaveBeenCalled()
    expect(downloadedBlobs).toHaveLength(0)
  })

  test('removes XML 1.0-invalid control characters from exported ODT content', async () => {
    const { downloadedBlobs, mockClick } = setupDownloadMocks()

    await exportNoteToOdtFile(
      'Invalid\u0001Title',
      'Safe line\u0000\u0007\u000b\u000e\uD800\n\tAnother\u0002 line'
    )

    expect(mockClick).toHaveBeenCalledTimes(1)
    expect(downloadedBlobs).toHaveLength(1)

    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).not.toContain('\u0000')
    expect(contentXml).not.toContain('\u0001')
    expect(contentXml).not.toContain('\u0002')
    expect(contentXml).not.toContain('\u0007')
    expect(contentXml).not.toContain('\u000b')
    expect(contentXml).not.toContain('\u000e')
    expect(contentXml).not.toContain('\uD800')
    expect(contentXml).toContain('InvalidTitle')
    expect(contentXml).toContain('Safe line')
    expect(contentXml).toContain('\tAnother line')
  })

  test('preserves all notes by generating unique ODT names in bulk ZIP', async () => {
    const { downloadedBlobs, mockClick } = setupDownloadMocks()

    await exportAllNotesToOdtZip([
      {
        id: 'duplicate-a',
        title: 'Shared Title',
        content: 'First',
        createdAt: '2026-04-19T00:00:00.000Z'
      },
      {
        id: 'duplicate-b',
        title: 'Shared Title',
        content: 'Second',
        createdAt: '2026-04-20T00:00:00.000Z'
      }
    ])

    expect(mockClick).toHaveBeenCalledTimes(1)
    expect(downloadedBlobs).toHaveLength(1)

    const bulkZip = await JSZip.loadAsync(downloadedBlobs[0])
    const odtEntries = Object.keys(bulkZip.files).filter((name) =>
      name.endsWith('.odt')
    )

    expect(odtEntries).toHaveLength(2)
    expect(new Set(odtEntries).size).toBe(2)
    expect(odtEntries).toContain('shared_title.odt')
    expect(odtEntries.some((name) => name !== 'shared_title.odt')).toBe(true)
  })
})

describe('exportAllNotesToCombinedOdt', () => {
  test('returns early for empty/invalid input', async () => {
    const { downloadedBlobs, mockClick } = setupDownloadMocks()

    await exportAllNotesToCombinedOdt()
    await exportAllNotesToCombinedOdt([])

    expect(mockClick).not.toHaveBeenCalled()
    expect(downloadedBlobs).toHaveLength(0)
  })

  test('downloads single note as individual .odt when only one note is provided', async () => {
    const { downloadedBlobs, mockClick, downloadFilenames } = setupDownloadMocks()

    await exportAllNotesToCombinedOdt([
      { title: 'Solo Note', content: 'Only child' }
    ])

    expect(mockClick).toHaveBeenCalledTimes(1)
    expect(downloadedBlobs).toHaveLength(1)
    expect(downloadFilenames[0]).toMatch(/\.odt$/)

    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')
    expect(contentXml).toContain('Solo Note')
    expect(contentXml).toContain('Only child')
  })

  test('combines multiple notes into one .odt file with page breaks between them', async () => {
    const { downloadedBlobs, mockClick, downloadFilenames } = setupDownloadMocks()

    await exportAllNotesToCombinedOdt([
      { title: 'Alpha', content: 'First content' },
      { title: 'Beta', content: 'Second content' },
      { title: 'Gamma', content: 'Third content' }
    ])

    expect(mockClick).toHaveBeenCalledTimes(1)
    expect(downloadedBlobs).toHaveLength(1)
    expect(downloadFilenames[0]).toMatch(/^braindump_notes_combined_\d{4}-\d{2}-\d{2}\.odt$/)

    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    expect(contentXml).toContain('Alpha')
    expect(contentXml).toContain('Beta')
    expect(contentXml).toContain('Gamma')
    expect(contentXml).toContain('First content')
    expect(contentXml).toContain('Second content')
    expect(contentXml).toContain('Third content')

    // Two page breaks expected (before Beta and before Gamma)
    const pageBreakCount = (contentXml.match(/Page_Break/g) || []).length
    expect(pageBreakCount).toBe(2)
  })

  test('styles.xml contains Page_Break paragraph style', async () => {
    const { downloadedBlobs } = setupDownloadMocks()

    await exportAllNotesToCombinedOdt([
      { title: 'A', content: 'a' },
      { title: 'B', content: 'b' }
    ])

    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const stylesXml = await odtZip.file('styles.xml').async('string')
    expect(stylesXml).toContain('style:name="Page_Break"')
    expect(stylesXml).toContain('fo:break-before="page"')
  })

  test('first note has no leading page break', async () => {
    const { downloadedBlobs } = setupDownloadMocks()

    await exportAllNotesToCombinedOdt([
      { title: 'First', content: 'content a' },
      { title: 'Second', content: 'content b' }
    ])

    const odtZip = await JSZip.loadAsync(downloadedBlobs[0])
    const contentXml = await odtZip.file('content.xml').async('string')

    // Page_Break should appear exactly once (only before the second note)
    const pageBreakCount = (contentXml.match(/Page_Break/g) || []).length
    expect(pageBreakCount).toBe(1)

    // The first heading should appear before the page break paragraph
    const firstHeadingPos = contentXml.indexOf('First')
    const pageBreakPos = contentXml.indexOf('Page_Break')
    expect(firstHeadingPos).toBeLessThan(pageBreakPos)
  })
})
