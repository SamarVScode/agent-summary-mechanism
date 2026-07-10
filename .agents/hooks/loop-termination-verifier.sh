#!/bin/bash
# =============================================================================
# loop-termination-verifier.sh — Tier 4 Stop Hook
# Only enforces the loop gate when running under /goal or /autonomous-fixer.
# For normal conversations, allows termination immediately.
# =============================================================================
PYTHON='C:/Python314/python.exe'
WORKSPACE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$WORKSPACE"

ATTEMPTS_FILE=".loop_attempts"
LOG_FILE="loop-debug.md"

# ── Bypass: if no active loop is in progress, always allow termination ─────────
# .loop_attempts is created ONLY when a /goal loop starts. If it doesn't exist,
# this is a normal conversation — let the agent end its turn freely.
if [ ! -f "$ATTEMPTS_FILE" ]; then
  echo '{"decision": "stop"}'
  exit 0
fi

# ── Active loop detected: enforce the loop gate ────────────────────────────────
ATTEMPTS=$(cat "$ATTEMPTS_FILE")
ATTEMPTS=$((ATTEMPTS + 1))
echo "$ATTEMPTS" > "$ATTEMPTS_FILE"

echo "" >> "$LOG_FILE"
echo "## Attempt $ATTEMPTS/5" >> "$LOG_FILE"
echo "**Timestamp:** $(date)" >> "$LOG_FILE"

if [ "$ATTEMPTS" -gt 5 ]; then
  rm -f "$ATTEMPTS_FILE" .goal_achieved
  echo "**Status:** 🛑 FORCE STOPPED (Max attempts reached)" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  echo '{"decision": "stop"}'
  exit 0
fi

output=$("$PYTHON" -m pytest tests/ 2>&1)
status=$?

if [ -f REQUIREMENTS.md ] && grep -Fq "[ ]" REQUIREMENTS.md; then
  REASON="REQUIREMENTS.md still has unchecked items. Complete all tasks and check them off. Attempt $ATTEMPTS/5."
  echo "**Status:** 🔴 REJECTED" >> "$LOG_FILE"
  echo "**Reason:** REQUIREMENTS.md is not fully checked off." >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  echo '{"decision": "continue", "reason": "'"$REASON"'"}'
elif [ ! -f .goal_achieved ]; then
  REASON="Goal not explicitly marked as achieved. Create the .goal_achieved file when completely finished. Attempt $ATTEMPTS/5."
  echo "**Status:** 🔴 REJECTED" >> "$LOG_FILE"
  echo "**Reason:** .goal_achieved marker is missing." >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  echo '{"decision": "continue", "reason": "'"$REASON"'"}'
elif [ $status -ne 0 ]; then
  rm -f .goal_achieved
  REASON="Tests failed. Fix the errors and try again. Attempt $ATTEMPTS/5."
  echo "**Status:** 🔴 REJECTED" >> "$LOG_FILE"
  echo "**Reason:** Test suite failed." >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  echo '{"decision": "continue", "reason": "'"$REASON"'"}'
elif [ -f package.json ]; then
  # If JS project, run build to verify compile errors
  build_output=$(npm run build 2>&1)
  build_status=$?
  if [ $build_status -ne 0 ]; then
    rm -f .goal_achieved
    REASON="Frontend build failed! Resolve build/compilation errors. Attempt $ATTEMPTS/5."
    echo "**Status:** 🔴 REJECTED" >> "$LOG_FILE"
    echo "**Reason:** Frontend build failed: ${build_output}" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo '{"decision": "continue", "reason": "'"$REASON"'"}'
  else
    rm -f .goal_achieved "$ATTEMPTS_FILE"
    echo "**Status:** ✅ APPROVED (Goal achieved, build succeeded and tests passed)" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo '{"decision": "stop"}'
  fi
else
  rm -f .goal_achieved "$ATTEMPTS_FILE"
  echo "**Status:** ✅ APPROVED (Goal achieved and tests passed)" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  echo '{"decision": "stop"}'
fi
exit 0
