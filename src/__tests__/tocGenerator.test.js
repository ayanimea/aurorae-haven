import { describe, expect, test } from 'vitest'
import {
  slugify,
  extractHeadings,
  buildTocMarkdown,
  buildHtmlTocList,
  injectToc,
  injectTocHtml
} from '../utils/notes/tocGenerator'

describe('slugify', () => {
  test('lowercases text', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  test('replaces spaces with hyphens', () => {
    expect(slugify('foo bar baz')).toBe('foo-bar-baz')
  })

  test('strips markdown formatting characters', () => {
    expect(slugify('**Bold** and _italic_')).toBe('bold-and-italic')
  })

  test('removes non-alphanumeric characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  test('collapses multiple hyphens', () => {
    expect(slugify('a  b')).toBe('a-b')
  })

  test('trims leading/trailing whitespace', () => {
    expect(slugify('  title  ')).toBe('title')
  })

  test('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })
})

describe('extractHeadings', () => {
  test('returns empty array for empty string', () => {
    expect(extractHeadings('')).toEqual([])
  })

  test('returns empty array for null/undefined', () => {
    expect(extractHeadings(null)).toEqual([])
    expect(extractHeadings(undefined)).toEqual([])
  })

  test('extracts h1 heading', () => {
    const result = extractHeadings('# Hello')
    expect(result).toEqual([{ level: 1, text: 'Hello', slug: 'hello' }])
  })

  test('extracts multiple headings at different levels', () => {
    const md = `# Title\n## Section\n### Subsection`
    const result = extractHeadings(md)
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ level: 1, text: 'Title' })
    expect(result[1]).toMatchObject({ level: 2, text: 'Section' })
    expect(result[2]).toMatchObject({ level: 3, text: 'Subsection' })
  })

  test('does not extract headings inside fenced code blocks', () => {
    const md = '# Real Heading\n\n```\n# Not a heading\n```'
    const result = extractHeadings(md)
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Real Heading')
  })

  test('deduplicates slug collisions by appending counter', () => {
    const md = '# Foo\n## Foo\n### Foo'
    const result = extractHeadings(md)
    expect(result[0].slug).toBe('foo')
    expect(result[1].slug).toBe('foo-1')
    expect(result[2].slug).toBe('foo-2')
  })

  test('ignores lines that are not headings', () => {
    const md = 'Plain paragraph\n- list item\n# Real Heading'
    const result = extractHeadings(md)
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Real Heading')
  })
})

describe('buildTocMarkdown', () => {
  test('returns empty string for empty headings array', () => {
    expect(buildTocMarkdown([])).toBe('')
  })

  test('builds a flat list for same-level headings', () => {
    const headings = [
      { level: 2, text: 'Alpha', slug: 'alpha' },
      { level: 2, text: 'Beta', slug: 'beta' }
    ]
    const result = buildTocMarkdown(headings)
    expect(result).toBe('- [Alpha](#alpha)\n- [Beta](#beta)')
  })

  test('indents nested headings relative to minimum level', () => {
    const headings = [
      { level: 1, text: 'Top', slug: 'top' },
      { level: 2, text: 'Child', slug: 'child' },
      { level: 3, text: 'Grandchild', slug: 'grandchild' }
    ]
    const result = buildTocMarkdown(headings)
    const lines = result.split('\n')
    expect(lines[0]).toBe('- [Top](#top)')
    expect(lines[1]).toBe('  - [Child](#child)')
    expect(lines[2]).toBe('    - [Grandchild](#grandchild)')
  })

  test('normalises indent when minimum level is > 1', () => {
    const headings = [
      { level: 2, text: 'A', slug: 'a' },
      { level: 3, text: 'B', slug: 'b' }
    ]
    const result = buildTocMarkdown(headings)
    const lines = result.split('\n')
    expect(lines[0]).toBe('- [A](#a)')
    expect(lines[1]).toBe('  - [B](#b)')
  })
})

describe('injectToc', () => {
  test('returns content unchanged when no [TOC] present', () => {
    const md = '# Heading\n\nSome content.'
    expect(injectToc(md)).toBe(md)
  })

  test('returns empty string for falsy input', () => {
    expect(injectToc('')).toBe('')
    expect(injectToc(null)).toBe('')
  })

  test('replaces [TOC] with generated TOC', () => {
    const md = '[TOC]\n\n# Hello\n\n## World'
    const result = injectToc(md)
    expect(result).not.toContain('[TOC]')
    expect(result).toContain('[Hello](#hello)')
    expect(result).toContain('[World](#world)')
  })

  test('replaces [TOC] case-insensitively', () => {
    const md = '[toc]\n\n# Heading'
    const result = injectToc(md)
    expect(result).not.toContain('[toc]')
    expect(result).toContain('[Heading](#heading)')
  })

  test('replaces multiple [TOC] markers', () => {
    const md = '[TOC]\n\n# Heading\n\n[TOC]'
    const result = injectToc(md)
    expect(result.match(/\[TOC\]/gi)).toBeNull()
    const tocOccurrences = (result.match(/\[Heading\]/g) || []).length
    expect(tocOccurrences).toBe(2)
  })

  test('outputs fallback message when content has no headings', () => {
    const md = '[TOC]\n\nJust a paragraph.'
    const result = injectToc(md)
    expect(result).toContain('No headings found')
  })
})

describe('buildHtmlTocList', () => {
  test('returns empty string for empty headings array', () => {
    expect(buildHtmlTocList([])).toBe('')
  })

  test('wraps entries in a <ul> element', () => {
    const headings = [{ level: 1, text: 'Intro', slug: 'intro' }]
    const result = buildHtmlTocList(headings)
    expect(result).toMatch(/^<ul>/)
    expect(result).toMatch(/<\/ul>$/)
  })

  test('generates <li> with toc-level class and anchor link', () => {
    const headings = [{ level: 2, text: 'Section', slug: 'section' }]
    const result = buildHtmlTocList(headings)
    expect(result).toContain('class="toc-level-2"')
    expect(result).toContain('<a href="#section">Section</a>')
  })

  test('escapes HTML special characters in heading text', () => {
    const headings = [{ level: 1, text: 'A & B <tag>', slug: 'a-b-tag' }]
    const result = buildHtmlTocList(headings)
    expect(result).toContain('A &amp; B &lt;tag&gt;')
    expect(result).not.toContain('<tag>')
  })

  test('assigns correct toc-level class per heading level', () => {
    const headings = [
      { level: 1, text: 'H1', slug: 'h1' },
      { level: 3, text: 'H3', slug: 'h3' }
    ]
    const result = buildHtmlTocList(headings)
    expect(result).toContain('class="toc-level-1"')
    expect(result).toContain('class="toc-level-3"')
  })
})

describe('injectTocHtml', () => {
  test('returns content unchanged when no [TOC] present', () => {
    const md = '# Heading\n\nSome content.'
    expect(injectTocHtml(md)).toBe(md)
  })

  test('returns empty string for falsy input', () => {
    expect(injectTocHtml('')).toBe('')
    expect(injectTocHtml(null)).toBe('')
  })

  test('replaces [TOC] with a <nav class="note-toc"> block', () => {
    const md = '[TOC]\n\n# Hello\n\n## World'
    const result = injectTocHtml(md)
    expect(result).not.toContain('[TOC]')
    expect(result).toContain('<nav class="note-toc"')
    expect(result).toContain('</nav>')
  })

  test('includes anchor links to headings', () => {
    const md = '[TOC]\n\n# Hello\n\n## World'
    const result = injectTocHtml(md)
    expect(result).toContain('href="#hello"')
    expect(result).toContain('href="#world"')
  })

  test('replaces [TOC] case-insensitively', () => {
    const md = '[toc]\n\n# Heading'
    const result = injectTocHtml(md)
    expect(result).not.toContain('[toc]')
    expect(result).toContain('<nav class="note-toc"')
  })

  test('outputs fallback message when no headings found', () => {
    const md = '[TOC]\n\nJust a paragraph.'
    const result = injectTocHtml(md)
    expect(result).toContain('No headings found')
  })

  test('replaces multiple [TOC] markers', () => {
    const md = '[TOC]\n\n# Heading\n\n[TOC]'
    const result = injectTocHtml(md)
    expect(result.match(/\[TOC\]/gi)).toBeNull()
    const navCount = (result.match(/<nav /g) || []).length
    expect(navCount).toBe(2)
  })
})
