# Security Notes

## Known Dev Dependency Vulnerabilities (Accepted Risk)

All vulnerabilities are in **development dependencies only**. Production build has **zero vulnerabilities**.

### Summary

- **Production**: ✅ **0 vulnerabilities**
- **Dev dependencies**: 33 vulnerabilities (2 moderate, 31 high)
- **Risk Level**: LOW (dev-only, no production impact)
- **Status**: Documented and accepted

### 1. ajv < 8.18.0 (Moderate Severity)

**CVE**: GHSA-2g4f-4pwh-qvx6  
**Affected**: `ajv@6.12.6` (transitive dependency of `eslint@9.39.2`)  
**Vulnerability**: ReDoS when using `$data` option

**Note**: This project has `ajv@8.18.0` as a direct dev dependency (secure, no vulnerabilities). The vulnerability only affects the transitive `ajv@6.12.6` from ESLint.

**Why not fixed**:

- Requires downgrading ESLint from v9.39.2 to v4.1.1 (5 major versions)
- Would break entire linting configuration
- ajv 8.x incompatible with ESLint 9.x internals

**Risk assessment**:

- Dev dependency only (not in production)
- Requires `$data` option to exploit (not used)
- ESLint doesn't process untrusted schemas
- ReDoS not applicable to local development

### 2. minimatch < 10.2.1 (High Severity)

**CVE**: GHSA-3ppc-4f35-3m26  
**Affected**: `minimatch` (transitive in eslint-plugin-jsx-a11y, markdownlint-cli, jest, etc.)  
**Vulnerability**: ReDoS via repeated wildcards

**Why not fixed**:

- 31 packages depend on older minimatch versions
- Forcing `minimatch@10.2.1` breaks eslint-plugin-jsx-a11y (API incompatibility)
- Packages need upstream updates to support new minimatch API

**Risk assessment**:

- Dev dependencies only (linting, testing, building)
- No user input processed by minimatch in our workflow
- Pattern matching only on known file structures
- ReDoS not exploitable in CI/local development context

### Verification

```bash
# Production dependencies - ZERO vulnerabilities
npm audit --omit=dev --audit-level=low
# Output: found 0 vulnerabilities ✅

# All dependencies
npm audit --audit-level=moderate
# Output: 33 vulnerabilities (2 moderate, 31 high) in dev dependencies only
```

### Mitigation Strategy

- Monitor for upstream fixes in ESLint and plugins
- Run `npm audit` regularly for new vulnerabilities
- Production build unaffected (dependencies not included)
- All dev vulnerabilities documented here

---

_Last Updated_: 2026-02-19  
_Risk Acceptance_: Development Team
