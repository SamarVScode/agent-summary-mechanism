#!/bin/bash
# =============================================================================
# cmd-validator.sh — Tier 3 Safety Gate for run_command tool calls
# =============================================================================
input_payload=$(cat)

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_ROOT="$DIR/../.."

# -- ALWAYS enforce hard safety rules -----------------------------------------
proposed_command=$(echo "$input_payload" | python -c "import sys, json; print(json.load(sys.stdin).get('toolCall', {}).get('args', {}).get('CommandLine', ''))")

if [[ "$proposed_command" =~ rm[[:space:]]+-rf ]] || \
   [[ "$proposed_command" =~ Remove-Item.*-Recurse ]] || \
   [[ "$proposed_command" =~ ^del[[:space:]] ]] || \
   [[ "$proposed_command" =~ ^format[[:space:]] ]]; then
  echo '{"allow_tool": false, "deny_reason": "SAFETY: Destructive delete commands are permanently blocked."}'
  exit 0
fi

# -- Bypass extra workflow checks if not in autonomous mode -------------------
LATEST_TRANSCRIPT=$(ls -t ~/.gemini/antigravity-cli/brain/*/.system_generated/logs/transcript.jsonl 2>/dev/null | head -n 1)
if [ -n "$LATEST_TRANSCRIPT" ]; then
  LAST_USER_MSG=$(grep '"type":"USER_INPUT"' "$LATEST_TRANSCRIPT" | tail -n 1)
  if [[ "$LAST_USER_MSG" != *"/autonomous-fixer"* && "$LAST_USER_MSG" != *"/goal"* && "$LAST_USER_MSG" != *"/grill-me"* ]]; then
    echo '{"allow_tool": true}'
    exit 0
  fi
fi

# -- Autonomous mode: enforce REQUIREMENTS.md workflow -----------------------
if [[ -f "$WORKSPACE_ROOT/.req_lock" ]]; then
  LOCK_TIME=$(stat -c %Y "$WORKSPACE_ROOT/.req_lock" 2>/dev/null || stat -f %m "$WORKSPACE_ROOT/.req_lock" 2>/dev/null)
  CURRENT_TIME=$(date +%s)
  DIFF=$((CURRENT_TIME - LOCK_TIME))
  if [ "$DIFF" -lt 60 ]; then
    echo '{"allow_tool": false, "deny_reason": "REQUIREMENTS.md was just created. SYSTEM LOCK for 60s. Stop your turn immediately."}'
    exit 0
  fi
fi

if [[ ! -f "$WORKSPACE_ROOT/REQUIREMENTS.md" ]] && \
   [[ "$proposed_command" =~ (npx|npm|yarn|pnpm|pip|cargo|go[[:space:]]mod|dotnet) ]]; then
  echo '{"allow_tool": false, "deny_reason": "You CANNOT scaffold or install yet. Interview the user and write REQUIREMENTS.md first."}'
  exit 0
fi

echo '{"allow_tool": true}'
exit 0
