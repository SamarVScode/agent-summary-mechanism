#!/bin/bash
input_payload=$(cat)

# Bypass strict checks if user is not using the autonomous-fixer system
LATEST_TRANSCRIPT=$(ls -t ~/.gemini/antigravity-cli/brain/*/.system_generated/logs/transcript.jsonl 2>/dev/null | head -n 1)
if [ -n "$LATEST_TRANSCRIPT" ]; then
  LAST_USER_MSG=$(grep '"type":"USER_INPUT"' "$LATEST_TRANSCRIPT" | tail -n 1)
  if [[ "$LAST_USER_MSG" != *"/autonomous-fixer"* && "$LAST_USER_MSG" != *"/goal"* && "$LAST_USER_MSG" != *"/grill-me"* ]]; then
    echo '{"allow_tool": true}'
    exit 0
  fi
fi

if command -v jq >/dev/null 2>&1; then
  proposed_command=$(echo "$input_payload" | jq -r '.toolCall.args.CommandLine // empty')
else
  proposed_command=$(echo "$input_payload" | grep -oE '"CommandLine"\s*:\s*"[^"]*"' | head -n 1 | cut -d'"' -f4)
fi
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_ROOT="$DIR/../.."

if [[ -f "$WORKSPACE_ROOT/.req_lock" ]]; then
  LOCK_TIME=$(stat -c %Y "$WORKSPACE_ROOT/.req_lock" 2>/dev/null || stat -f %m "$WORKSPACE_ROOT/.req_lock" 2>/dev/null)
  CURRENT_TIME=$(date +%s)
  DIFF=$((CURRENT_TIME - LOCK_TIME))
  if [ "$DIFF" -lt 60 ]; then
    echo '{"allow_tool": false, "deny_reason": "REQUIREMENTS.md was just created. SYSTEM LOCK ENGAGED for 60s to allow user review. You MUST STOP YOUR TURN IMMEDIATELY. Do not run any other tools."}'
    exit 0
  fi
fi

if [[ ! -f "$WORKSPACE_ROOT/REQUIREMENTS.md" && ( "$proposed_command" =~ npx || "$proposed_command" =~ npm || "$proposed_command" =~ yarn || "$proposed_command" =~ pnpm || "$proposed_command" =~ pip || "$proposed_command" =~ cargo || "$proposed_command" =~ go[[:space:]]mod || "$proposed_command" =~ dotnet ) ]]; then
  echo '{"allow_tool": false, "deny_reason": "You CANNOT execute scaffolding or build commands. You MUST interview the user and write REQUIREMENTS.md first."}'
  exit 0
fi
if [[ "$proposed_command" =~ rm[[:space:]]+-rf || "$proposed_command" =~ ^curl[[:space:]] || "$proposed_command" =~ Remove-Item || "$proposed_command" =~ ^del[[:space:]] ]]; then
  echo '{"allow_tool": false, "deny_reason": "Command violates safety policies."}'
else
  echo '{"allow_tool": true}'
fi
exit 0
