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
  # Temporarily disable set -e for grep
  set +e
  git diff --cached --no-color | grep -E "^\+" | grep -v "^\+\+\+[[:space:]]" | grep -E "$1" > /dev/null
  local result=$?
  set -e
  
  if [ $result -eq 2 ]; then
    echo "❌ Error: Invalid regex pattern in guardrail check: $1"
    echo "   Please verify the pattern syntax in scripts/pre-commit-schedule-guardrails.sh"
    exit 1
  elif [ $result -eq 0 ]; then
    echo "❌ Forbidden pattern in staged changes: $1"
    FAIL=1
  fi
}

# Helper to check patterns in added lines of specific files only
check_in_files() {
  local pattern="$1"
  shift
  
  # Temporarily disable set -e for grep
  set +e
  git diff --cached --no-color -- "$@" | grep -E "^\+" | grep -v "^\+\+\+[[:space:]]" | grep -E "$pattern" > /dev/null
  local result=$?
  set -e
  
  if [ $result -eq 2 ]; then
    echo "❌ Error: Invalid regex pattern in guardrail check: $pattern"
    echo "   Please verify the pattern syntax in scripts/pre-commit-schedule-guardrails.sh"
    exit 1
  elif [ $result -eq 0 ]; then
    echo "❌ Forbidden pattern in staged changes: $pattern"
    FAIL=1
  fi
}

# Helper to check patterns while excluding certain files
check_in_files_exclude() {
  local pattern="$1"
  local exclude_pattern="$2"
  shift 2
  # Get diff for all paths, then filter out excluded files from the file markers (+++/---)
  local awk_output
  awk_output=$(git diff --cached --no-color -- "$@" | awk -v exclude="$exclude_pattern" '
    /^\+\+\+ / {
      if ($0 !~ exclude) {
        include_file = 1
      } else {
        include_file = 0
      }
    }
    /^---/ { next }
    include_file && /^\+/ && !/^\+\+\+/ { print }
  ')
  
  if [ -n "$awk_output" ]; then
    # Temporarily disable set -e for grep
    set +e
    # Use printf instead of echo to avoid flag/backslash interpretation issues
    printf '%s\n' "$awk_output" | grep -E "$pattern" > /dev/null
    local result=$?
    set -e
    
    if [ $result -eq 2 ]; then
      echo "❌ Error: Invalid regex pattern in guardrail check: $pattern"
      echo "   Please verify the pattern syntax in scripts/pre-commit-schedule-guardrails.sh"
      exit 1
    elif [ $result -eq 0 ]; then
      echo "❌ Forbidden pattern in staged changes: $pattern"
      FAIL=1
    fi
  fi
}

# 1. Row background colouring (semantic violation)
check "hour[-_ ]row.*background"
check "background-color.*hour"

# 2. Hardcoded pixel heights (time scaling violation) — scoped to Schedule UI files
# Exclude dev tools (FloatingDevButtons) which intentionally use fixed pixel sizes
set +e
git diff --cached --no-color --name-only | grep -E "src/pages/Schedule\.jsx|src/components/Schedule/|src/assets/styles/schedule\.css|src/assets/styles/fullcalendar-custom\.css" > /dev/null
schedule_files_changed=$?
set -e

if [ $schedule_files_changed -eq 2 ]; then
  echo "❌ Error: grep failed while detecting schedule-related files."
  echo "   Please verify the regex and file paths in scripts/pre-commit-schedule-guardrails.sh."
  exit 1
fi

if [ $schedule_files_changed -eq 0 ]; then
  # Use word boundaries to match CSS properties precisely and avoid false positives
  # Pattern matches: height:, min-height:, max-height: followed by pixel values
  # [^[:alnum:]-] ensures we don't match CSS custom properties (--height) or hyphenated properties
  # This pattern allows matching at the start of a line (^) or after non-alphanumeric/non-hyphen chars
  # Note: CSS property names use hyphens but not underscores, so this pattern correctly identifies
  # property boundaries while excluding custom properties that start with -- (double hyphen)
  check_in_files_exclude "(^|[^[:alnum:]-])(min-height|max-height|height)[[:space:]]*:[[:space:]]*[0-9]+px" "FloatingDevButtons" "${SCHEDULE_PATHS[@]}"
  check_in_files_exclude "(^|[^[:alnum:]-])top[[:space:]]*:[[:space:]]*[0-9]+px" "FloatingDevButtons" "${SCHEDULE_PATHS[@]}"
fi

# 3. Single global gradient misuse (only in schedule-related files)
# This check targets only global/container gradients applied to schedule wrapper/calendar.
# Per-band gradients (e.g., .time-period-morning, .schedule-band) are allowed per spec.
# Check for gradients on schedule container selectors: .schedule-wrapper, .fc, .calendar
if [ $schedule_files_changed -eq 0 ]; then
  # Use awk to properly parse CSS blocks and detect gradients in container selectors
  # This captures multi-line CSS blocks and checks if background: linear-gradient appears within them
  # Matches selectors on both added (+) and context (space) lines to catch modifications to existing blocks
  set +e
  git diff --cached --no-color -- "${SCHEDULE_PATHS[@]}" | awk '
    # Enter a block when we see a relevant selector on either an added or context line
    /^[ +].*\.(schedule-wrapper|fc|calendar)[[:space:]]*\{/ {
      in_block = 1
      block = ""
      has_added_gradient = 0
    }

    # While inside a block, accumulate all diff lines for context
    in_block {
      block = block $0 "\n"
      # Track only added gradient lines as violations
      if ($0 ~ /^\+.*background:[[:space:]]*linear-gradient/) {
        has_added_gradient = 1
      }
    }

    # Close the block on a matching closing brace from either an added or context line
    /^[ +].*\}/ && in_block {
      if (has_added_gradient) {
        print block
        exit 1
      }
      in_block = 0
      block = ""
      has_added_gradient = 0
    }

    # Handle case where diff ends while still in a block (closing brace not in diff context)
    # This catches gradients added to large CSS blocks where the closing brace is outside the diff hunk
    END {
      if (in_block && has_added_gradient) {
        print block
        exit 1
      }
    }
  '
  gradient_result=$?
  set -e
  
  if [ $gradient_result -eq 1 ]; then
    echo "⚠️  Gradient guardrail triggered: global gradient detected on schedule container."
    echo "   This pre-commit hook blocks gradients on .schedule-wrapper, .fc, or .calendar selectors."
    echo "   The Schedule spec prohibits a single global gradient but allows per-band gradients."
    echo "   If this is a legitimate per-band gradient (not on container), this is a false positive."
    echo "   Re-run your commit with:"
    echo "     git commit --no-verify   # temporarily bypasses this guardrail"
    FAIL=1
  elif [ $gradient_result -gt 1 ]; then
    echo "❌ Error: awk script failed while checking for gradient violations."
    echo "   Please verify the gradient detection logic in scripts/pre-commit-schedule-guardrails.sh."
    exit 1
  fi
fi

# 4. Missing minute-based scaling when touching schedule UI implementation files
# Exclude dev tools (FloatingDevButtons) which don't need minute-based scaling
set +e
git diff --cached --no-color --name-only | grep -E "src/pages/Schedule\.jsx|src/components/Schedule/|src/assets/styles/schedule\.css|src/assets/styles/fullcalendar-custom\.css" | grep -v "FloatingDevButtons" > /dev/null
non_dev_schedule_changed=$?
set -e

if [ $non_dev_schedule_changed -eq 2 ]; then
  echo "❌ Error: grep failed while detecting non-dev schedule files."
  echo "   Please verify the grep pattern in scripts/pre-commit-schedule-guardrails.sh."
  exit 1
fi

if [ $non_dev_schedule_changed -eq 0 ]; then
  # Only check if CSS-related changes are made in schedule files that affect vertical sizing/offsets
  # Include height, min-height, max-height, top, bottom; exclude line-height
  # Require at least one non-zero numeric value (exempt 0, auto, etc.)
  # Use word boundaries to match CSS properties precisely
  awk_result=$(git diff --cached --no-color -- "${SCHEDULE_PATHS[@]}" | awk -v exclude="FloatingDevButtons" '
    /^\+\+\+ / {
      if ($0 !~ exclude) {
        include_file = 1
      } else {
        include_file = 0
      }
    }
    /^---/ { next }
    include_file && /^\+/ && !/^\+\+\+/ { print }
  ')
  
  if [ -n "$awk_result" ]; then
    set +e
    # Use [^[:alnum:]-] to match property boundaries while excluding CSS custom properties (--property)
    # This ensures we don't match --height or --min-height (custom properties) but do match height:
    # Use printf instead of echo to avoid flag/backslash interpretation issues
    printf '%s\n' "$awk_result" | grep -E "(^|[^[:alnum:]-])(min-height|max-height|height|top|bottom)[[:space:]]*:[[:space:]]*.*[1-9][0-9]*" > /dev/null
    sizing_found=$?
    set -e
    
    if [ $sizing_found -eq 2 ]; then
      echo "❌ Error: Invalid regex pattern in vertical sizing check."
      echo "   Please verify the pattern syntax in scripts/pre-commit-schedule-guardrails.sh."
      exit 1
    elif [ $sizing_found -eq 0 ]; then
      # Require minute-based scaling via --minute-unit or derived variables like --hour-height
      # (direct use or via var(--minute-unit) / var(--hour-height))
      scaling_check=$(git diff --cached --no-color -- "${SCHEDULE_PATHS[@]}" | awk -v exclude="FloatingDevButtons" '
        /^\+\+\+ / {
          if ($0 !~ exclude) {
            include_file = 1
          } else {
            include_file = 0
          }
        }
        /^---/ { next }
        include_file && /^\+/ && !/^\+\+\+/ { print }
      ')
      
      if [ -n "$scaling_check" ]; then
        set +e
        # Use printf instead of echo to avoid flag/backslash interpretation issues
        printf '%s\n' "$scaling_check" | grep -E "(\-\-minute-unit|\-\-hour-height|var\(\-\-hour-height\)|var\(\-\-minute-unit\))" > /dev/null
        scaling_found=$?
        set -e
        
        if [ $scaling_found -eq 2 ]; then
          echo "❌ Error: Invalid regex pattern in minute-based scaling check."
          echo "   Please verify the pattern syntax in scripts/pre-commit-schedule-guardrails.sh."
          exit 1
        elif [ $scaling_found -ne 0 ]; then
          echo "❌ Schedule UI implementation modified with vertical sizing/offsets but minute-based scaling not used"
          echo "   Required: --minute-unit, --hour-height, var(--hour-height), or var(--minute-unit)"
          FAIL=1
        fi
      fi
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
