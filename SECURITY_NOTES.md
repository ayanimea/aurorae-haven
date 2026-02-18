# Security Notes

## Known Dev Dependency Vulnerabilities

### ajv < 8.18.0 in ESLint (Moderate Severity)

**Status**: Accepted Risk (Dev Dependency Only)

**Description**:

- CVE: GHSA-2g4f-4pwh-qvx6
- Severity: Moderate
- Vulnerability: ReDoS when using `$data` option
- Affected Package: ajv@6.12.6 (transitive dependency of eslint@9.39.2)

**Why Not Fixed**:

- The fix requires `npm audit fix --force` which would downgrade ESLint from v9.39.2 to v4.1.1
- This is a 5-major-version downgrade that would break our entire linting configuration
- ajv 8.x introduces breaking API changes incompatible with ESLint 9.x's internal usage

**Risk Assessment**:

- **Impact**: Negligible
- **Reason**:
  - This is a dev dependency only (not in production build)
  - The vulnerability requires the `$data` option to be exploited
  - ESLint doesn't process untrusted user schemas
  - ReDoS attacks are not applicable to our local development workflow

**Production Build**:

- ✅ Zero vulnerabilities in production dependencies
- ✅ Verified with: `npm audit --audit-level=moderate --omit=dev`

**Mitigation**:

- Monitor for ESLint updates that resolve this dependency issue
- Run `npm audit` regularly to detect any new vulnerabilities
- Production code is not affected as ajv@6.12.6 is not included in the build

**Future Action**:

- Wait for ESLint to update to ajv 8.x internally
- Or migrate to an alternative linting solution if this becomes a blocker

---

_Last Updated_: 2026-02-18
_Reviewed By_: Copilot
