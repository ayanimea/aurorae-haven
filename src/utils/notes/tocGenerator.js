/**
 * Table of Contents (TOC) generator for Brain Dump notes
 *
 * Generates an in-page TOC from markdown headings and replaces the [TOC]
 * placeholder marker in markdown content.
 */
import { marked } from 'marked'

// Minimal HTML entity escaping for text inserted into HTML attributes / content.
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function tokensToPlainText(tokens) {
  if (!Array.isArray(tokens)) return ''
  return tokens
    .map((token) => {
      if (token.type === 'html') return ''
      if (token.tokens) return tokensToPlainText(token.tokens)
      return token.text ?? token.raw ?? ''
    })
    .join('')
}

function inlineMarkdownToPlainText(text) {
  try {
    if (marked?.Lexer?.lexInline) {
      return tokensToPlainText(marked.Lexer.lexInline(text))
    }
  } catch {
    // Fall through to regex fallback
  }

  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
}

function replaceTocMarkersOutsideCodeFences(markdown, replacement) {
  const lines = markdown.split('\n')
  let inCodeBlock = false

  return lines
    .map((line) => {
      if (/^(`{3,}|~{3,})/.test(line)) {
        inCodeBlock = !inCodeBlock
        return line
      }
      if (inCodeBlock) return line
      return line.replace(/\[TOC\]/gi, replacement)
    })
    .join('\n')
}

/**
 * Convert a heading text to an anchor-safe slug
 * @param {string} text - Raw heading text (may contain markdown)
 * @returns {string} Slug suitable for use as an anchor id
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[*_`[\]()#]+/g, '') // strip markdown formatting characters
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric (keep spaces and hyphens)
    .trim()
    .replace(/\s+/g, '-') // spaces → hyphens
    .replace(/-+/g, '-') // collapse multiple hyphens
}

/**
 * Extract headings from raw markdown content
 * @param {string} markdown - Raw markdown string
 * @returns {Array<{level: number, text: string, slug: string}>} Array of heading objects
 */
export function extractHeadings(markdown) {
  if (!markdown || typeof markdown !== 'string') return []

  const headings = []
  const slugCounts = {}
  const lines = markdown.split('\n')

  let inCodeBlock = false

  for (const line of lines) {
    // Track fenced code blocks so we don't parse headings inside them
    if (/^(`{3,}|~{3,})/.test(line)) {
      inCodeBlock = !inCodeBlock
    }
    if (inCodeBlock) continue

    const match = /^(#{1,6})\s+(.+)$/.exec(line)
    if (match) {
      const level = match[1].length
      const text = inlineMarkdownToPlainText(match[2].trim()).trim()
      let slug = slugify(text)

      // Ensure unique slugs by appending a counter when there are collisions
      if (slugCounts[slug] !== undefined) {
        slugCounts[slug] += 1
        slug = `${slug}-${slugCounts[slug]}`
      } else {
        slugCounts[slug] = 0
      }

      headings.push({ level, text, slug })
    }
  }

  return headings
}

/**
 * Build TOC markdown from an array of heading objects
 * @param {Array<{level: number, text: string, slug: string}>} headings
 * @returns {string} Markdown-formatted TOC list
 */
export function buildTocMarkdown(headings) {
  if (!headings || headings.length === 0) return ''

  const minLevel = Math.min(...headings.map((h) => h.level))

  const lines = headings.map((h) => {
    const indent = '  '.repeat(h.level - minLevel)
    return `${indent}- [${h.text}](#${h.slug})`
  })

  return lines.join('\n')
}

/**
 * Build an HTML list for the TOC.
 * Each entry is a flat <li> with a class encoding its depth level,
 * so CSS can apply indentation without inline styles.
 *
 * @param {Array<{level: number, text: string, slug: string}>} headings
 * @returns {string} HTML string (<ul>…</ul>)
 */
export function buildHtmlTocList(headings) {
  if (!headings || headings.length === 0) return ''

  const items = headings.map(({ level, text, slug }) => {
    const escaped = escapeHtml(text)
    return `<li class="toc-level-${level}"><a href="#${slug}">${escaped}</a></li>`
  })

  return `<ul>\n${items.join('\n')}\n</ul>`
}

/**
 * Replace every [TOC] marker in the markdown with a rendered HTML
 * table of contents wrapped in a <nav class="note-toc"> element.
 * The nav block is treated as raw HTML by marked and passes through
 * DOMPurify unmodified (nav + id + class are in the allow-lists).
 *
 * Heading IDs in the rendered preview are added by the custom marked
 * heading renderer in Notes.jsx and match the slugs generated here.
 *
 * @param {string} markdown - Raw markdown content
 * @returns {string} Markdown with [TOC] markers replaced by HTML nav blocks
 */
export function injectTocHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') return markdown || ''

  // Only process if there is at least one [TOC] marker
  if (!/\[TOC\]/i.test(markdown)) return markdown

  const headings = extractHeadings(markdown)

  let inner
  if (headings.length === 0) {
    inner = '<p><em>No headings found.</em></p>'
  } else {
    inner = buildHtmlTocList(headings)
  }

  const navBlock = `<nav class="note-toc" aria-label="Table of Contents">\n${inner}\n</nav>`

  return replaceTocMarkersOutsideCodeFences(markdown, navBlock)
}

/**
 * Replace every [TOC] marker in the markdown with a plain-markdown list.
 * This variant is intended for ODT export pipelines that process
 * the markdown themselves (see noteOperations.js).
 *
 * @param {string} markdown - Raw markdown content
 * @returns {string} Markdown with [TOC] markers replaced
 */
export function injectToc(markdown) {
  if (!markdown || typeof markdown !== 'string') return markdown || ''

  if (!/\[TOC\]/i.test(markdown)) return markdown

  const headings = extractHeadings(markdown)

  let tocBlock
  if (headings.length === 0) {
    tocBlock = '*No headings found.*'
  } else {
    tocBlock = buildTocMarkdown(headings)
  }

  return markdown.replace(/\[TOC\]/gi, tocBlock)
}
