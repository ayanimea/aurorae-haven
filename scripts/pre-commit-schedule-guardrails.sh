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
SCHEDULE_PATHS=(
  "src/pages/Schedule.jsx"
  "src/components/Schedule/"
  "src/assets/styles/schedule.css"
  "src/assets/styles/fullcalendar-custom.css"
)

# Helper to check patterns in added lines only (not removed lines or diff headers)
check() {
  if git diff --cached --no-color | grep -E "^\+" | grep -v "^\+\+\+[[:space:]]" | grep -E "$1" > /dev/null; then
    echo "❌ Forbidden pattern in staged changes: $1"
    FAIL=1
  fi
}

# Helper to check patterns in added lines of specific files only
check_in_files() {
  local pattern="$1"
  shift
  if git diff --cached --no-color -- "$@" | grep -E "^\+" | grep -v "^\+\+\+[[:space:]]" | grep -E "$pattern" > /dev/null; then
    echo "❌ Forbidden pattern in staged changes: $pattern"
    FAIL=1
  fi
}

# 1. Row background colouring (semantic violation)
check "hour[-_ ]row.*background"
check "background-color.*hour"

# 2. Hardcoded pixel heights (time scaling violation) — scoped to Schedule UI files
if git diff --cached --no-color --name-only | grep -E "src/pages/Schedule\.jsx|src/components/Schedule/|src/assets/styles/schedule\.css|src/assets/styles/fullcalendar-custom\.css" > /dev/null; then
  check_in_files "(^|[^-])(min-height|max-height|height)[[:space:]]*:[[:space:]]*[0-9]+px" "${SCHEDULE_PATHS[@]}"
  check_in_files "(^|[^-])top[[:space:]]*:[[:space:]]*[0-9]+px" "${SCHEDULE_PATHS[@]}"
fi

# 3. Single global gradient misuse (only in schedule-related files)
# Note: This check may flag legitimate per-band gradients (e.g., .time-period-morning).
# If you're adding per-band gradients, verify they follow the spec and use --no-verify if needed.
if git diff --cached --no-color --name-only | grep -E "src/pages/Schedule\.jsx|src/components/Schedule/|src/assets/styles/schedule\.css|src/assets/styles/fullcalendar-custom\.css" > /dev/null; then
  if git diff --cached --no-color -- "${SCHEDULE_PATHS[@]}" | grep -E "^\+" | grep -v "^\+\+\+[[:space:]]" | grep -E "background:[[:space:]]*linear-gradient" > /dev/null; then
    echo "⚠️  Gradient guardrail triggered: linear-gradient detected in schedule files."
    echo "   This pre-commit hook will block the commit when a gradient is detected."
    echo "   The Schedule spec prohibits a single global gradient but allows per-band gradients."
    echo "   If this is a legitimate per-band gradient that follows the spec, re-run your commit with:"
    echo "     git commit --no-verify   # temporarily bypasses this guardrail"
    FAIL=1
  fi
fi

# 4. Missing minute-based scaling when touching schedule UI implementation files
if git diff --cached --no-color --name-only | grep -E "src/pages/Schedule\.jsx|src/components/Schedule/|src/assets/styles/schedule\.css|src/assets/styles/fullcalendar-custom\.css" > /dev/null; then
  # Only check if CSS-related changes are made in schedule files that affect vertical sizing/offsets (height, top, bottom)
  # Exclude line-height by requiring it not to be preceded by "line-"; require at least one numeric value
  if git diff --cached --no-color -- "${SCHEDULE_PATHS[@]}" | grep -E "^\+" | grep -v "^\+\+\+[[:space:]]" | grep -E "(^|[^-])(height|top|bottom)[[:space:]]*:[[:space:]]*.*[0-9]" > /dev/null; then
    # Require minute-based scaling via --minute-unit or derived variables like --hour-height
    # (direct use or via var(--minute-unit) / var(--hour-height))
    if ! git diff --cached --no-color -- "${SCHEDULE_PATHS[@]}" | grep -E "^\+" | grep -v "^\+\+\+[[:space:]]" | grep -E "(\-\-minute-unit|\-\-hour-height|var\(\-\-hour-height\)|var\(\-\-minute-unit\))" > /dev/null; then
      echo "❌ Schedule UI implementation modified with vertical sizing/offsets but minute-based scaling not used"
      echo "   Required: --minute-unit, --hour-height, var(--hour-height), or var(--minute-unit)"
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
