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

### Current Toolchain

The previous vulnerability notes referenced transitive issues from `eslint@9.x` (`ajv@6`) and `jest`/`markdownlint-cli` (`minimatch`). Those tools have been replaced:

- **Linter**: ESLint → [Biome](https://biomejs.dev/) (`@biomejs/biome`)
- **Test runner**: Jest/Babel → [Vitest](https://vitest.dev/)
- **Markdown lint**: `markdownlint-cli` → `markdownlint-cli2`
- **Archive util**: [JSZip](https://stuk.github.io/jszip/) (`jszip`)

These migrations resolved all previously documented vulnerabilities.

### Dependency License Notes

- **jszip**: published as `MIT OR GPL-3.0-or-later`.
  Aurorae Haven uses JSZip in browser-only ODT/ZIP export flows under the MIT option.
  No GPL-specific code path is selected or required for this usage.

### Mitigation Strategy

- Run `npm audit --audit-level=low` regularly for new vulnerabilities
- Production build is unaffected by dev dependency issues
- Zero-vulnerability policy maintained for production; zero HIGH/CRITICAL for dev

---

_Last Updated_: 2026-04-20  
_Risk Acceptance_: Development Team
