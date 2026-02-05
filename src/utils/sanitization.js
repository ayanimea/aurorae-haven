// Markdown Sanitization Configuration for Brain Dump
// Configures DOMPurify to safely render user-generated markdown content
// Prevents XSS attacks while allowing safe HTML and KaTeX math rendering
import { createLogger } from './logger'

const logger = createLogger('Sanitization')

// Track if hooks have been registered to prevent duplicate registration
const HOOK_REGISTERED = Symbol.for('aurorae_haven_sanitization_hook')
const STORED_CONFIG = Symbol.for('aurorae_haven_sanitization_config')

/**
 * Configure DOMPurify for safe markdown rendering
 * @param {Object} DOMPurifyInstance - DOMPurify instance to configure
 * @returns {Object} Sanitization configuration object
 */
export function configureSanitization(DOMPurifyInstance) {
  const DOMPurify = DOMPurifyInstance || window.DOMPurify

  if (!DOMPurify) {
    logger.error('DOMPurify not loaded')
    return null
  }

  // Check if hooks have already been registered (idempotency guard)
  if (DOMPurify[HOOK_REGISTERED]) {
    return DOMPurify[STORED_CONFIG]
  }

  const config = {
    ALLOWED_TAGS: [
      // Basic text formatting
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'hr',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      'code',
      'pre',
      'a',
      'img',
      'blockquote',
      // Tables
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      // Task lists
      'input', // for checkboxes
      // KaTeX math rendering tags
      'span',
      'div',
      'annotation',
      'semantics',
      'mrow',
      'mi',
      'mo',
      'mn',
      'ms',
      'mtext',
      'math',
      'svg',
      'path',
      'g',
      'use',
      'defs'
    ],
    ALLOWED_ATTR: [
      // Basic attributes
      'href',
      'src',
      'alt',
      'title',
      'type',
      'checked',
      'disabled',
      'class',
      'id',
      'data-backlink', // for backlinks
      // KaTeX attributes
      'style',
      'aria-hidden',
      'focusable',
      'role',
      'xmlns',
      'width',
      'height',
      'viewBox',
      'd',
      'transform',
      'fill',
      'stroke'
    ],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel):|#|[^a-z]|[a-z+.-]+(?:[^a-z+.-]|$))/i,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    FORCE_BODY: false,
    SANITIZE_DOM: true,
    ADD_ATTR: ['target'],
    ADD_URI_SAFE_ATTR: []
  }

  // Store config and mark hooks as registered to prevent duplicate registration
  DOMPurify[STORED_CONFIG] = config

  // Add hook to sanitize links and images (only if addHook method exists)
  if (typeof DOMPurify.addHook === 'function') {
    DOMPurify[HOOK_REGISTERED] = true

    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      // Sanitize anchor tags
      if (node.tagName === 'A') {
        const href = node.getAttribute('href')
        if (href) {
          const normalizedHref = href.trim().toLowerCase()

          // Open external links in new tab (use normalized for consistent check)
          if (
            normalizedHref.startsWith('http://') ||
            normalizedHref.startsWith('https://')
          ) {
            node.setAttribute('target', '_blank')
            node.setAttribute('rel', 'noopener noreferrer')
          }

          // Validate internal links (use normalized for consistent check)
          if (normalizedHref.startsWith('#')) {
            // Internal anchor link - safe
          }

          // Block javascript:, data:, and vbscript: URIs for links (XSS prevention)
          if (
            normalizedHref.startsWith('javascript:') ||
            normalizedHref.startsWith('data:') ||
            normalizedHref.startsWith('vbscript:')
          ) {
            node.removeAttribute('href')
          }
        }
      }

      // Sanitize image tags to prevent data: URI XSS attacks
      if (node.tagName === 'IMG') {
        const src = node.getAttribute('src')
        // Block javascript:, data:, and vbscript: URIs in image sources (XSS prevention)
        if (src) {
          const normalizedSrc = src.trim().toLowerCase()
          if (
            normalizedSrc.startsWith('javascript:') ||
            normalizedSrc.startsWith('data:') ||
            normalizedSrc.startsWith('vbscript:')
          ) {
            node.removeAttribute('src')
            // Optionally set a placeholder or remove the element entirely
            node.setAttribute('alt', 'Blocked: Unsafe image source')
          }
        }
      }
    })
  }

  return config
}

/**
 * Sanitize plain text to prevent XSS attacks
 * Escapes HTML special characters
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // Escape HTML special characters
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}
