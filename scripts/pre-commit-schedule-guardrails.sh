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

set -e

echo "🔍 Pre-commit: Schedule UI guardrails"

FAIL=0

check() {
  if git diff --cached | grep -E "$1" > /dev/null; then
    echo "❌ Forbidden pattern in staged changes: $1"
    FAIL=1
  fi
}

# 1. Row background colouring (semantic violation)
check "hour[-_ ]row.*background"
check "background-color.*hour"

# 2. Hardcoded pixel heights (time scaling violation)
check "height:\s*[0-9]+px"
check "top:\s*[0-9]+px"

# 3. Single global gradient misuse
check "background:\s*linear-gradient"

# 4. Missing minute-based scaling when touching schedule files
if git diff --cached --name-only | grep -E "Schedule|schedule|timeline" > /dev/null; then
  if ! git diff --cached | grep -E "\-\-minute-unit" > /dev/null; then
    echo "❌ Schedule modified but --minute-unit not used"
    FAIL=1
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
