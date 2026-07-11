/**
 * Security tests for markdown sanitization
 * Tests DOMPurify configuration, XSS prevention, and safe rendering
 */

import { configureSanitization } from '../utils/sanitization'

// Mock DOMPurify
const mockDOMPurify = {
  addHook: jest.fn(),
  sanitize: jest.fn((html) => html)
}

describe('Security: configureSanitization', () => {
  beforeEach(() => {
    window.DOMPurify = mockDOMPurify
    mockDOMPurify.addHook.mockClear()
    // Clear idempotency flags for fresh test
    delete mockDOMPurify[Symbol.for('aurorae_haven_sanitization_hook')]
    delete mockDOMPurify[Symbol.for('aurorae_haven_sanitization_config')]
  })

  afterEach(() => {
    delete window.DOMPurify
  })

  test('returns null when DOMPurify is not loaded', () => {
    delete window.DOMPurify
    const config = configureSanitization()
    expect(config).toBeNull()
  })

  test('configures allowed HTML tags for markdown', () => {
    const config = configureSanitization()
    expect(config.ALLOWED_TAGS).toContain('h1')
    expect(config.ALLOWED_TAGS).toContain('p')
    expect(config.ALLOWED_TAGS).toContain('a')
    expect(config.ALLOWED_TAGS).toContain('code')
    expect(config.ALLOWED_TAGS).toContain('input') // for checkboxes
  })

  test('forbids dangerous HTML tags', () => {
    const config = configureSanitization()
    expect(config.FORBID_TAGS).toContain('script')
    expect(config.FORBID_TAGS).toContain('iframe')
    expect(config.FORBID_TAGS).toContain('object')
    expect(config.FORBID_TAGS).toContain('embed')
    expect(config.FORBID_TAGS).toContain('style')
  })

  test('forbids dangerous HTML attributes', () => {
    const config = configureSanitization()
    expect(config.FORBID_ATTR).toContain('onerror')
    expect(config.FORBID_ATTR).toContain('onload')
    expect(config.FORBID_ATTR).toContain('onclick')
    expect(config.FORBID_ATTR).toContain('onmouseover')
  })

  test('configures safe URI protocols', () => {
    const config = configureSanitization()
    expect(config.ALLOWED_URI_REGEXP).toBeInstanceOf(RegExp)
    // Test that it allows safe protocols
    expect('https://example.com').toMatch(config.ALLOWED_URI_REGEXP)
    expect('http://example.com').toMatch(config.ALLOWED_URI_REGEXP)
    expect('mailto:test@example.com').toMatch(config.ALLOWED_URI_REGEXP)
    expect('#anchor').toMatch(config.ALLOWED_URI_REGEXP)
  })

  test('blocks dangerous URI schemes (XSS prevention)', () => {
    const config = configureSanitization()
    // eslint-disable-next-line no-script-url
    expect('javascript:alert(1)').not.toMatch(config.ALLOWED_URI_REGEXP)
    // eslint-disable-next-line no-script-url
    expect('JavaScript:alert(1)').not.toMatch(config.ALLOWED_URI_REGEXP)
    expect('vbscript:msgbox').not.toMatch(config.ALLOWED_URI_REGEXP)
    expect('data:text/html,<script>alert(1)</script>').not.toMatch(
      config.ALLOWED_URI_REGEXP
    )
  })

  test('registers afterSanitizeAttributes hook', () => {
    configureSanitization()
    expect(mockDOMPurify.addHook).toHaveBeenCalledWith(
      'afterSanitizeAttributes',
      expect.any(Function)
    )
  })
})

describe('Security: Link sanitization hook', () => {
  let hookCallback

  beforeEach(() => {
    window.DOMPurify = mockDOMPurify
    mockDOMPurify.addHook.mockClear()
    // Clear idempotency flags for fresh test
    delete mockDOMPurify[Symbol.for('aurorae_haven_sanitization_hook')]
    delete mockDOMPurify[Symbol.for('aurorae_haven_sanitization_config')]
    configureSanitization()
    hookCallback = mockDOMPurify.addHook.mock.calls[0][1]
  })

  afterEach(() => {
    delete window.DOMPurify
  })

  test('adds target=_blank to external links', () => {
    const mockNode = {
      tagName: 'A',
      getAttribute: jest.fn(() => 'https://example.com'),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.setAttribute).toHaveBeenCalledWith('target', '_blank')
    expect(mockNode.setAttribute).toHaveBeenCalledWith(
      'rel',
      'noopener noreferrer'
    )
  })

  test('does not modify internal anchor links', () => {
    const mockNode = {
      tagName: 'A',
      getAttribute: jest.fn(() => '#section'),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.removeAttribute).not.toHaveBeenCalled()
  })

  test('blocks javascript: protocol (XSS prevention)', () => {
    const mockNode = {
      tagName: 'A',
      // eslint-disable-next-line no-script-url
      getAttribute: jest.fn(() => 'javascript:alert(1)'),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.removeAttribute).toHaveBeenCalledWith('href')
  })

  test('blocks JavaScript: protocol with mixed case', () => {
    const mockNode = {
      tagName: 'A',
      // eslint-disable-next-line no-script-url
      getAttribute: jest.fn(() => 'JavaScript:alert(1)'),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.removeAttribute).toHaveBeenCalledWith('href')
  })

  test('blocks vbscript: protocol (XSS prevention)', () => {
    const mockNode = {
      tagName: 'A',
      getAttribute: jest.fn(() => 'vbscript:msgbox'),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.removeAttribute).toHaveBeenCalledWith('href')
  })

  test('blocks data: URIs in links (XSS prevention)', () => {
    const mockNode = {
      tagName: 'A',
      getAttribute: jest.fn(() => 'data:text/html,<script>alert(1)</script>'),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.removeAttribute).toHaveBeenCalledWith('href')
  })

  test('handles links with whitespace padding', () => {
    const mockNode = {
      tagName: 'A',
      getAttribute: jest.fn(() => '  javascript:alert(1)  '),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.removeAttribute).toHaveBeenCalledWith('href')
  })

  test('does not affect non-link elements', () => {
    const mockNode = {
      tagName: 'P',
      getAttribute: jest.fn(),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.getAttribute).not.toHaveBeenCalled()
  })

  // IMG tag security tests
  test('blocks javascript: URIs in image sources (XSS prevention)', () => {
    const mockNode = {
      tagName: 'IMG',
      getAttribute: jest.fn(() => 'javascript:alert(1)'),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.removeAttribute).toHaveBeenCalledWith('src')
    expect(mockNode.setAttribute).toHaveBeenCalledWith(
      'alt',
      'Blocked: Unsafe image source'
    )
  })

  test('blocks data: URIs in image sources (XSS prevention)', () => {
    const mockNode = {
      tagName: 'IMG',
      getAttribute: jest.fn(() => 'data:text/html,<script>alert(1)</script>'),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.removeAttribute).toHaveBeenCalledWith('src')
    expect(mockNode.setAttribute).toHaveBeenCalledWith(
      'alt',
      'Blocked: Unsafe image source'
    )
  })

  test('blocks vbscript: URIs in image sources (XSS prevention)', () => {
    const mockNode = {
      tagName: 'IMG',
      getAttribute: jest.fn(() => 'vbscript:msgbox'),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.removeAttribute).toHaveBeenCalledWith('src')
    expect(mockNode.setAttribute).toHaveBeenCalledWith(
      'alt',
      'Blocked: Unsafe image source'
    )
  })

  test('allows safe image sources (http/https)', () => {
    const mockNode = {
      tagName: 'IMG',
      getAttribute: jest.fn(() => 'https://example.com/image.png'),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.removeAttribute).not.toHaveBeenCalled()
  })

  test('handles IMG tags with whitespace in src', () => {
    const mockNode = {
      tagName: 'IMG',
      getAttribute: jest.fn(() => '  data:text/html,<script>  '),
      setAttribute: jest.fn(),
      removeAttribute: jest.fn()
    }

    hookCallback(mockNode)

    expect(mockNode.removeAttribute).toHaveBeenCalledWith('src')
    expect(mockNode.setAttribute).toHaveBeenCalledWith(
      'alt',
      'Blocked: Unsafe image source'
    )
  })
})
