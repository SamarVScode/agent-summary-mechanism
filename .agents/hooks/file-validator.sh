#!/bin/bash
# =============================================================================
# file-validator.sh — Tier 3 Safety Gate for write_to_file / replace_file_content
# =============================================================================
input_payload=$(cat)

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_ROOT="$DIR/../.."

# -- Bypass extra workflow checks if not in autonomous mode -------------------
LATEST_TRANSCRIPT=$(ls -t ~/.gemini/antigravity-cli/brain/*/.system_generated/logs/transcript.jsonl 2>/dev/null | head -n 1)
if [ -n "$LATEST_TRANSCRIPT" ]; then
  LAST_USER_MSG=$(grep '"type":"USER_INPUT"' "$LATEST_TRANSCRIPT" | tail -n 1)
  if [[ "$LAST_USER_MSG" != *"/autonomous-fixer"* && "$LAST_USER_MSG" != *"/goal"* && "$LAST_USER_MSG" != *"/grill-me"* ]]; then
    echo '{"allow_tool": true}'
    exit 0
  fi
fi

# -- Extract target file ------------------------------------------------------
target_file=$(echo "$input_payload" | python -c "import sys, json; print(json.load(sys.stdin).get('toolCall', {}).get('args', {}).get('TargetFile', ''))")

# -- REQUIREMENTS.md format enforcement ---------------------------------------
if [[ "$target_file" == *"REQUIREMENTS.md"* ]]; then
  # Only enforce checklist format on creation of REQUIREMENTS.md
  if [[ ! -f "$WORKSPACE_ROOT/REQUIREMENTS.md" ]]; then
    code_content=$(echo "$input_payload" | python -c "import sys, json; args = json.load(sys.stdin).get('toolCall', {}).get('args', {}); print(args.get('CodeContent') or args.get('ReplacementContent') or '')")
    if [[ "$code_content" != *"[ ]"* ]]; then
      echo '{"allow_tool": false, "deny_reason": "FORMAT ERROR: New REQUIREMENTS.md MUST contain unchecked boxes (e.g. `- [ ] Task`). Please initialize it with checkboxes."}'
      exit 0
    fi
    touch "$WORKSPACE_ROOT/.req_lock"
    echo "# Loop Debug" > "$WORKSPACE_ROOT/loop-debug.md"
    echo "" >> "$WORKSPACE_ROOT/loop-debug.md"
    echo "| # | Time | Phase | Status | Notes |" >> "$WORKSPACE_ROOT/loop-debug.md"
    echo "|---|------|-------|--------|-------|" >> "$WORKSPACE_ROOT/loop-debug.md"
  fi
fi

# -- Build exclusion list -----------------------------------------------------
EXCLUDED_FILES=("REQUIREMENTS.md" "loop-debug.md" ".goal_achieved" ".loop_attempts" "STATE.md")
IS_EXCLUDED=false
for excl in "${EXCLUDED_FILES[@]}"; do
  if [[ "$target_file" == *"$excl"* ]]; then
    IS_EXCLUDED=true
    break
  fi
done

# -- Temporal lock: block all writes for 60s after REQUIREMENTS.md created ----
if [[ -f "$WORKSPACE_ROOT/.req_lock" && "$IS_EXCLUDED" == "false" ]]; then
  LOCK_TIME=$(stat -c %Y "$WORKSPACE_ROOT/.req_lock" 2>/dev/null || stat -f %m "$WORKSPACE_ROOT/.req_lock" 2>/dev/null)
  CURRENT_TIME=$(date +%s)
  DIFF=$((CURRENT_TIME - LOCK_TIME))
  if [ "$DIFF" -lt 60 ]; then
    echo '{"allow_tool": false, "deny_reason": "REQUIREMENTS.md was just created. SYSTEM LOCK for 60s. Stop your turn and wait for user review."}'
    exit 0
  fi
fi

# -- Block all file writes before REQUIREMENTS.md exists ----------------------
if [[ ! -f "$WORKSPACE_ROOT/REQUIREMENTS.md" && "$IS_EXCLUDED" == "false" ]]; then
  echo '{"allow_tool": false, "deny_reason": "You CANNOT write code yet. Interview the user and write REQUIREMENTS.md first."}'
  exit 0
fi

echo '{"allow_tool": true}'
exit 0
