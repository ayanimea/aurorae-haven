# Scripts Directory

This directory contains utility scripts for development, building, and testing.

## Pre-commit Hook

### `pre-commit-schedule-guardrails.sh`

A pre-commit hook that enforces Schedule UI design rules and prevents known regressions.

**Installation:**

```bash
cp scripts/pre-commit-schedule-guardrails.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**What it does:**

- Blocks commits that apply background colors to hour rows
- Blocks hardcoded pixel heights (e.g., `height: 64px`) using portable POSIX regex
- Blocks single global gradients in schedule-specific files (per-band gradients are allowed)
- Ensures `--minute-unit` CSS variable is used when modifying schedule UI implementation files with positioning/sizing changes

**References:**

- `docs/schedule-ui-spec.md` - Schedule UI specification
- `COPILOT_SCHEDULE_ONLY.md` - AI/Copilot guidelines for Schedule UI

**Testing the hook:**

```bash
# Test that it blocks violations
echo ".event { height: 64px; }" > test.css
git add test.css
git commit -m "test"  # Should be blocked
git reset HEAD test.css && rm test.css

# Test that it allows valid changes
echo ".event { height: calc(var(--minute-unit) * 60); }" > test.css
git add test.css
git commit -m "test"  # Should succeed
```

## Other Scripts

- `buildConstants.js` - Build-time constants
- `create-offline-package.js` - Creates offline distribution package
- `embedded-server.js` / `embedded-server.py` - Local server implementations
- `prepare-dist.sh` - Prepares distribution files
- `test-offline-package.js` - Tests offline package
- `test-security-check.sh` - Security validation
- `test-spa-routing.js` - SPA routing tests
- `validate-pwa.cjs` - PWA validation
