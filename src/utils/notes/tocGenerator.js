/**
 * Table of Contents (TOC) generator for Brain Dump notes
 *
 * Generates an in-page TOC from markdown headings and replaces the [TOC]
 * placeholder marker in markdown content.
 */

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
      const text = match[2].trim()
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
 * Replace every [TOC] marker in the markdown with a generated table of contents.
 * The TOC is formatted as a fenced block so it renders distinctly in the preview.
 *
 * @param {string} markdown - Raw markdown content
 * @returns {string} Markdown with [TOC] markers replaced
 */
export function injectToc(markdown) {
  if (!markdown || typeof markdown !== 'string') return markdown || ''

  // Only process if there is at least one [TOC] marker
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
