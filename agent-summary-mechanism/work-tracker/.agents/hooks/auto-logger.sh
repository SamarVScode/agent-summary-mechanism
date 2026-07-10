#!/bin/bash
input_payload=$(cat)

# Extract conversationId
if command -v jq >/dev/null 2>&1; then
  conv_id=$(echo "$input_payload" | jq -r '.conversationId // empty')
else
  conv_id=$(echo "$input_payload" | grep -oE '"conversationId"\s*:\s*"[^"]*"' | head -n 1 | cut -d'"' -f4)
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_ROOT="$DIR/../.."

TRANSCRIPT="$HOME/.gemini/antigravity-cli/brain/$conv_id/.system_generated/logs/transcript.jsonl"
if [ -f "$TRANSCRIPT" ]; then
  LAST_RESPONSE=$(grep '"type":"PLANNER_RESPONSE"' "$TRANSCRIPT" | tail -n 1)
  
  if [ -n "$LAST_RESPONSE" ]; then
    if command -v jq >/dev/null 2>&1; then
      THINKING=$(echo "$LAST_RESPONSE" | jq -r '.thinking // empty')
    else
      THINKING=$(echo "$LAST_RESPONSE" | grep -oP '"thinking":"\K(.*?)(?=","tool_calls")' | sed 's/\\n/\n/g')
    fi
    
    if [ -n "$THINKING" ] && [ "$THINKING" != "null" ]; then
      THINKING_HASH=$(echo "$THINKING" | md5sum | awk '{print $1}')
      LAST_HASH=""
      if [ -f "$WORKSPACE_ROOT/.agents/.last_thinking" ]; then
        LAST_HASH=$(cat "$WORKSPACE_ROOT/.agents/.last_thinking")
      fi
      
      if [ "$THINKING_HASH" != "$LAST_HASH" ]; then
        echo -e "\n### 🔄 Loop Iteration Log ($(date +%H:%M:%S))\n$THINKING\n---" >> "$WORKSPACE_ROOT/loop-debug.md"
        echo "$THINKING_HASH" > "$WORKSPACE_ROOT/.agents/.last_thinking"
      fi
    fi
  fi
fi

# PreToolUse / PostInvocation expects this JSON response schema
echo '{"allow_tool": true, "injectSteps": []}'
exit 0
