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
  target_file=$(echo "$input_payload" | jq -r '.toolCall.args.TargetFile // empty')
else
  target_file=$(echo "$input_payload" | grep -oE '"TargetFile"\s*:\s*"[^"]*"' | head -n 1 | cut -d'"' -f4)
fi
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_ROOT="$DIR/../.."

if [[ "$target_file" == *"REQUIREMENTS.md"* ]]; then
  if command -v jq >/dev/null 2>&1; then
    code_content=$(echo "$input_payload" | jq -r '.toolCall.args.CodeContent // empty')
  else
    code_content=$(echo "$input_payload" | grep -oE '"CodeContent"\s*:\s*"[^"]*"' | head -n 1)
  fi
  if [[ "$code_content" != *"[ ]"* ]]; then
    echo '{"allow_tool": false, "deny_reason": "FORMAT ERROR: Your REQUIREMENTS.md MUST be a markdown checklist containing unchecked boxes (e.g. `- [ ] Task`). Please rewrite it with checkboxes."}'
    exit 0
  fi
  if [[ ! -f "$WORKSPACE_ROOT/REQUIREMENTS.md" ]]; then
    touch "$WORKSPACE_ROOT/.req_lock"
    echo "# Loop Debug" > "$WORKSPACE_ROOT/loop-debug.md"
  fi
fi

if [[ -f "$WORKSPACE_ROOT/.req_lock" && "$target_file" != *"REQUIREMENTS.md"* && "$target_file" != *"loop-debug.md"* ]]; then
  LOCK_TIME=$(stat -c %Y "$WORKSPACE_ROOT/.req_lock" 2>/dev/null || stat -f %m "$WORKSPACE_ROOT/.req_lock" 2>/dev/null)
  CURRENT_TIME=$(date +%s)
  DIFF=$((CURRENT_TIME - LOCK_TIME))
  if [ "$DIFF" -lt 60 ]; then
    echo '{"allow_tool": false, "deny_reason": "REQUIREMENTS.md was just created. SYSTEM LOCK ENGAGED for 60s to allow user review. You MUST STOP YOUR TURN IMMEDIATELY. Do not run any other tools."}'
    exit 0
  fi
fi

if [[ ! -f "$WORKSPACE_ROOT/REQUIREMENTS.md" ]]; then
  if [[ "$target_file" != *"REQUIREMENTS.md"* && "$target_file" != *".goal_achieved"* && "$target_file" != *".loop_attempts"* && "$target_file" != *"loop-debug.md"* ]]; then
    echo '{"allow_tool": false, "deny_reason": "You CANNOT write code or edit files yet. You MUST interview the user and write REQUIREMENTS.md first."}'
    exit 0
  fi
fi
echo '{"allow_tool": true}'
exit 0
exit 0
