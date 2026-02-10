#!/usr/bin/env bash
# Pre-commit guardrail — Schedule UI
# Blocks known Copilot regressions before commit
#
# INSTALLATION:
# Copy this script to .git/hooks/pre-commit and make it executable:
#   cp scripts/pre-commit-schedule-guardrails.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# REFERENCES:
# - docs/schedule-ui-spec.md
# - COPILOT_SCHEDULE_ONLY.md
#
# REQUIREMENTS:
# - POSIX-like environment with bash and grep
# - On Windows, use Git Bash or WSL

set -e

echo "🔍 Pre-commit: Schedule UI guardrails"

FAIL=0
SCHEDULE_PATHS="src/pages/Schedule.jsx src/components/Schedule/ src/assets/styles/schedule.css"

# Helper to check patterns in added lines only (not removed lines or diff headers)
check() {
  if git diff --cached | grep -E "^\+" | grep -v "^+++" | grep -E "$1" > /dev/null; then
    echo "❌ Forbidden pattern in staged changes: $1"
    FAIL=1
  fi
}

# Helper to check patterns in added lines of specific files only
check_in_files() {
  local pattern="$1"
  shift
  local files="$@"
  if git diff --cached -- $files | grep -E "^\+" | grep -v "^+++" | grep -E "$pattern" > /dev/null; then
    echo "❌ Forbidden pattern in staged changes: $pattern"
    FAIL=1
  fi
}

# 1. Row background colouring (semantic violation)
check "hour[-_ ]row.*background"
check "background-color.*hour"

# 2. Hardcoded pixel heights (time scaling violation) — scoped to Schedule UI files
if git diff --cached --name-only | grep -E "src/pages/Schedule\.jsx|src/components/Schedule/|src/assets/styles/schedule\.css" > /dev/null; then
  check_in_files "height:[[:space:]]*[0-9]+px" $SCHEDULE_PATHS
  check_in_files "top:[[:space:]]*[0-9]+px" $SCHEDULE_PATHS
fi

# 3. Single global gradient misuse (only in schedule-related files)
if git diff --cached --name-only | grep -E "schedule\.css|Schedule\.jsx" > /dev/null; then
  if git diff --cached -- src/pages/Schedule.jsx src/assets/styles/schedule.css | grep -E "^\+" | grep -v "^+++" | grep -E "background:[[:space:]]*linear-gradient" > /dev/null; then
    # Check if it's a single global gradient (not per-band gradients which are allowed)
    echo "❌ Forbidden pattern in staged changes: global background: linear-gradient in schedule files"
    echo "   Note: Per-band gradients are allowed, but not a single global schedule gradient"
    FAIL=1
  fi
fi

# 4. Missing minute-based scaling when touching schedule UI implementation files
if git diff --cached --name-only | grep -E "src/pages/Schedule\.jsx|src/components/Schedule/|src/assets/styles/schedule\.css" > /dev/null; then
  # Only check if CSS-related changes are made in schedule files (height, top, positioning)
  if git diff --cached -- $SCHEDULE_PATHS | grep -E "^\+" | grep -v "^+++" | grep -E "(height:|top:|bottom:|transform:|position:)" > /dev/null; then
    if ! git diff --cached -- $SCHEDULE_PATHS | grep -E "^\+" | grep -v "^+++" | grep -E "\-\-minute-unit" > /dev/null; then
      echo "❌ Schedule UI implementation modified with positioning/sizing but --minute-unit not used"
      FAIL=1
    fi
  fi
fi

if [ "$FAIL" -eq 1 ]; then
  echo ""
  echo "🚫 Commit blocked: Schedule UI rules violated."
  echo "📖 See docs/schedule-ui-spec.md and COPILOT_SCHEDULE_ONLY.md"
  echo ""
  exit 1
fi

echo "✅ Schedule UI guardrails passed."
