# Security Notes

## Vulnerability Status

### Summary

- **Production**: ✅ **0 vulnerabilities**
- **Dev dependencies**: ✅ **0 vulnerabilities**
- **Status**: Clean – no known vulnerabilities in current dependency graph

### Verification

```bash
# Production dependencies - ZERO vulnerabilities
npm audit --omit=dev --audit-level=low
# Output: found 0 vulnerabilities ✅

# All dependencies (including dev)
npm audit --audit-level=low
# Output: found 0 vulnerabilities ✅
```

---

## HTTP Security Headers

### Development — Vite dev server (`vite.config.js`)

The dev server sets all non-CSP headers (`X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`). CSP is intentionally omitted from the dev server
because Vite's HMR runtime requires inline scripts; adding a restrictive CSP would break hot
module reload during development.

The `vite preview` server (production-mode local preview) applies a full CSP:

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' https:;
worker-src 'self';
manifest-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
```

**Why `style-src 'unsafe-inline'`**: KaTeX math rendering (via `marked-katex-extension`)
injects inline `style` attributes into the sanitized HTML written into the DOM via
`dangerouslySetInnerHTML`. Removing `'unsafe-inline'` from `style-src` would silently break
math rendering. All user-supplied HTML is still sanitized through DOMPurify before it reaches
the DOM.

**Why `connect-src https:`**: The calendar subscription manager
(`calendarSubscriptionManager.js`) fetches user-provided iCal URLs. Restricting to
`'self'` would block this feature. All calendar URLs are validated by `validateCalendarURL()`
before any fetch is made. `validateCalendarURL()` enforces HTTPS-only — `http://` URLs are
rejected — which aligns with the `connect-src https:` CSP directive in preview/production
builds.

---

## XSS Mitigations

### DOMPurify (`src/utils/sanitization.js`)

All user-supplied Markdown is parsed to HTML and then sanitized with DOMPurify before being
written to the DOM. The sanitizer configuration:

- **Explicit ALLOWED_TAGS / ALLOWED_ATTR allowlist** — only safe HTML elements and attributes
  are retained; everything else is stripped.
- **FORBID_TAGS**: `style`, `script`, `iframe`, `object`, `embed`.
- **URI scheme allowlist** — `ALLOWED_URI_REGEXP` only passes `https?`, `ftp`, `mailto`, `tel`,
  relative paths, and fragment identifiers. The regex excludes `:` from the terminal fallback
  character class to prevent scheme-like strings (e.g. `javascript:`) from matching the
  fallback pattern (mirrors DOMPurify's own default regex).
- **`afterSanitizeAttributes` hook** — explicitly strips `javascript:`, `data:`, and
  `vbscript:` from `href` and `src` attributes; forces `rel="noopener noreferrer"` on
  external links.
- **`SANITIZE_DOM: true`** — protects against DOM-clobbering attacks.

### Calendar URL validation (`src/utils/calendarSubscriptionManager.js`)

`validateCalendarURL()` enforces HTTPS/HTTP only and blocks localhost and private IP ranges
(RFC 1918 / RFC 4193 / link-local) to mitigate SSRF. Known limitation: DNS rebinding is not
addressed at the frontend level; a server-side proxy with DNS resolution checks would be
required for full SSRF protection.

---

## Current Toolchain

The previous vulnerability notes referenced transitive issues from `eslint@9.x` (`ajv@6`) and
`jest`/`markdownlint-cli` (`minimatch`). Those tools have been replaced:

- **Linter**: ESLint → [Biome](https://biomejs.dev/) (`@biomejs/biome`)
- **Test runner**: Jest/Babel → [Vitest](https://vitest.dev/)
- **Markdown lint**: `markdownlint-cli` → `markdownlint-cli2`
- **Browser ODT/ZIP export**: [JSZip](https://stuk.github.io/jszip/) (`jszip`)
  (`adm-zip` remains in use for offline build packaging in `scripts/create-offline-package.js`)

These migrations resolved all previously documented vulnerabilities.

### Dependency License Notes

- **jszip**: published as `MIT OR GPL-3.0-or-later`.
  Aurorae Haven uses JSZip in browser-only ODT/ZIP export flows under the MIT option.
  No GPL-specific code path is selected or required for this usage.

---

## Mitigation Strategy

- Run `npm audit --audit-level=low` regularly for new vulnerabilities
- Production build is unaffected by dev dependency issues
- Zero-vulnerability policy maintained for production; zero HIGH/CRITICAL for dev

---

_Last Updated_: 2026-04-22  
_Risk Acceptance_: Development Team
