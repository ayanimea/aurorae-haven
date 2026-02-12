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
# This check targets only global/container gradients applied to schedule wrapper/calendar.
# Per-band gradients (e.g., .time-period-morning, .schedule-band) are allowed per spec.
# Check for gradients on schedule container selectors: .schedule-wrapper, .fc, .calendar
if git diff --cached --no-color --name-only | grep -E "src/pages/Schedule\.jsx|src/components/Schedule/|src/assets/styles/schedule\.css|src/assets/styles/fullcalendar-custom\.css" > /dev/null; then
  # Use awk to properly parse CSS blocks and detect gradients in container selectors
  # This captures multi-line CSS blocks and checks if background: linear-gradient appears within them
  if git diff --cached --no-color -- "${SCHEDULE_PATHS[@]}" | awk '
    /^\+.*\.(schedule-wrapper|fc|calendar)[[:space:]]*\{/ { in_block=1; block="" }
    in_block { block = block $0 "\n" }
    /^\+.*\}/ && in_block { 
      if (block ~ /background:[[:space:]]*linear-gradient/) {
        print block
        exit 1
      }
      in_block=0
      block=""
    }
  '; then
    : # No gradient found, continue
  else
    echo "⚠️  Gradient guardrail triggered: global gradient detected on schedule container."
    echo "   This pre-commit hook blocks gradients on .schedule-wrapper, .fc, or .calendar selectors."
    echo "   The Schedule spec prohibits a single global gradient but allows per-band gradients."
    echo "   If this is a legitimate per-band gradient (not on container), this is a false positive."
    echo "   Re-run your commit with:"
    echo "     git commit --no-verify   # temporarily bypasses this guardrail"
    FAIL=1
  fi
fi

# 4. Missing minute-based scaling when touching schedule UI implementation files
if git diff --cached --no-color --name-only | grep -E "src/pages/Schedule\.jsx|src/components/Schedule/|src/assets/styles/schedule\.css|src/assets/styles/fullcalendar-custom\.css" > /dev/null; then
  # Only check if CSS-related changes are made in schedule files that affect vertical sizing/offsets
  # Include height, min-height, max-height, top, bottom; exclude line-height
  # Require at least one non-zero numeric value (exempt 0, auto, etc.)
  if git diff --cached --no-color -- "${SCHEDULE_PATHS[@]}" | grep -E "^\+" | grep -v "^\+\+\+[[:space:]]" | grep -E "(^|[^-])(min-height|max-height|height|top|bottom)[[:space:]]*:[[:space:]]*.*[1-9][0-9]*" > /dev/null; then
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
