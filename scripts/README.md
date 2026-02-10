# Scripts Directory

This directory contains utility scripts for development, building, and testing.

## Pre-commit Hook

### `pre-commit-schedule-guardrails.sh`

A pre-commit hook that enforces Schedule UI design rules and prevents known regressions.

**Runtime requirements:**

- POSIX-like environment with `bash` available (the hook is a Bash script)
- Standard command-line tools including `grep` on the `PATH`

**Windows notes:**

- Run Git and these hooks from **Git Bash** or a **WSL** (Windows Subsystem for Linux) shell.
- Running Git from plain `cmd.exe` or PowerShell without a POSIX layer may cause the hook to be skipped or fail.

**Installation:**

```bash
cp scripts/pre-commit-schedule-guardrails.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**What it does:**

- Blocks commits that apply background colors to hour rows
- Blocks hardcoded pixel heights in Schedule UI files (e.g., `height: 64px`) using portable POSIX regex
- Blocks commits that introduce `background: linear-gradient` in guarded schedule files (emits a warning-style message; may have false positives with per-band gradients—use `--no-verify` if the gradient is legitimate)
- Ensures minute-based scaling (`--minute-unit`, `--hour-height`, or derived variables) is used when modifying schedule UI implementation files with positioning/sizing changes

**References:**

- `docs/schedule-ui-spec.md` - Schedule UI specification
- `COPILOT_SCHEDULE_ONLY.md` - AI/Copilot guidelines for Schedule UI

**Testing the hook:**

```bash
# Note: The hook scopes checks to specific Schedule UI paths.
# Use an actual schedule file for testing:

# Test that it blocks hardcoded pixel heights in schedule files
echo ".schedule-event { height: 64px; }" >> src/assets/styles/schedule.css
git add src/assets/styles/schedule.css
git commit -m "test"  # Should be blocked
git restore --staged src/assets/styles/schedule.css
git restore src/assets/styles/schedule.css

# Test that it allows valid changes with minute-based scaling
echo ".schedule-event { height: calc(var(--minute-unit) * 60); }" >> src/assets/styles/schedule.css
git add src/assets/styles/schedule.css
git commit -m "test"  # Should succeed
git restore src/assets/styles/schedule.css

# Non-schedule files are not affected by pixel height checks
echo ".other-component { height: 64px; }" > src/assets/styles/other.css
git add src/assets/styles/other.css
git commit -m "test"  # Should succeed (not a schedule file)
git reset HEAD src/assets/styles/other.css && rm src/assets/styles/other.css
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
