#!/usr/bin/env python3
"""
developer_knowledge_mcp — MCP Server for the agy Agentic Development System.

Serves as the Tier 2 (Context Layer) knowledge base for the autonomous-fixer
agent. Provides on-demand retrieval of:
  - Developer coding guidelines and patterns
  - Hook schema references (PreToolUse, PostToolUse, Stop, etc.)
  - Skill documentation and slash command references
  - Architecture decision records for this workspace
  - Antigravity CLI configuration documentation

Transport: stdio (local server, launched by agy CLI via mcp_config.json)
"""

import json
import os
from pathlib import Path
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from mcp.server.fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Server Initialization
# ---------------------------------------------------------------------------

mcp = FastMCP("developer_knowledge_mcp")

# ---------------------------------------------------------------------------
# Constants — Workspace Knowledge Base
# ---------------------------------------------------------------------------

WORKSPACE_ROOT = Path(os.environ.get("WORKSPACE_ROOT", "."))

HOOK_SCHEMAS = {
    "PreInvocation": {
        "description": "Fires before the constructed context is sent to the LLM API.",
        "stdin_fields": ["invocationNum (int)", "initialNumSteps (int)", "conversationId", "workspacePaths"],
        "stdout_format": '{"injectSteps": [{"userMessage": "string"}]}',
        "use_case": "Inject additional context or guardrails before each agent turn begins."
    },
    "PreToolUse": {
        "description": "Triggers after model requests a tool but before it executes on the host system.",
        "stdin_fields": ["toolCall.name (str)", "toolCall.args (object, e.g. CommandLine)", "stepIdx (int)"],
        "stdout_format": '{"allow_tool": boolean, "deny_reason": "string"}',
        "use_case": "Validate and block risky tool calls. Used by cmd-validator.sh in this workspace."
    },
    "PostToolUse": {
        "description": "Fires immediately after a tool finishes execution.",
        "stdin_fields": ["stepIdx (int)", "error (str or empty)", "conversationId", "workspacePaths"],
        "stdout_format": '{"injectSteps": [{"ephemeralMessage": "string"}]}',
        "use_case": "Capture stdout/stderr and inject post-execution context back into agent memory."
    },
    "PostInvocation": {
        "description": "Fires after model execution finishes and before returning output to terminal.",
        "stdin_fields": ["conversationId", "workspacePaths", "stepIdx (int)"],
        "stdout_format": '{"injectSteps": [{"userMessage": "string"}]}',
        "use_case": "Run post-processing or logging after each completed agent turn."
    },
    "Stop": {
        "description": "Triggers when the model attempts to terminate its execution cycle.",
        "stdin_fields": ["conversationId", "workspacePaths", "transcriptPath", "artifactDirectoryPath"],
        "stdout_format": '{"decision": "stop"} or {"decision": "continue", "reason": "string"}',
        "use_case": "Gate the agent exit on passing tests. Used by loop-termination-verifier.sh in this workspace."
    }
}

SKILL_REFERENCE = {
    "autonomous-fixer": {
        "location": ".agents/skills/autonomous-fixer.md",
        "command": "/autonomous-fixer",
        "description": "TDD-focused autonomous agent skill. Analyzes, retrieves, plans, executes, and verifies code changes.",
        "allowed_tools": ["run_command", "view_file", "write_to_file", "replace_file_content"],
        "constraints": [
            "Only use Awesome Antigravity Skills for general engineering tasks.",
            "For UI/frontend work, strictly follow Impeccable skill guidelines."
        ]
    }
}

ARCHITECTURE_DECISIONS = [
    {
        "tier": "Tier 1 — Prompt",
        "pattern": "Declarative Markdown Skills",
        "rationale": "Skills are .md files with YAML frontmatter that register as TUI slash commands. "
                     "This externalizes prompting structures so they are reusable, versioned, and workspace-scoped.",
        "files": [".agents/skills/autonomous-fixer.md"]
    },
    {
        "tier": "Tier 2 — Context",
        "pattern": "Model Context Protocol (MCP)",
        "rationale": "MCP allows the agent to query on-demand knowledge (schemas, docs, guidelines) "
                     "without bloating the context window with static file dumps.",
        "files": [".agents/mcp_config.json"]
    },
    {
        "tier": "Tier 3 — Harness",
        "pattern": "Lifecycle Hook Interception",
        "rationale": "PreToolUse hooks intercept every shell command before execution, blocking unsafe patterns "
                     "(rm -rf, curl). Stop hooks gate loop termination on pytest passing.",
        "files": [".agents/hooks.json", ".agents/hooks/cmd-validator.sh", ".agents/hooks/loop-termination-verifier.sh"]
    },
    {
        "tier": "Tier 4 — Loop",
        "pattern": "Coder-Verifier Retry Loop",
        "rationale": "The loop-termination-verifier.sh runs pytest on every Stop event. If tests fail, "
                     "the hook returns decision=continue and injects the error trace back into the agent context, "
                     "forcing self-correction before exit is allowed.",
        "files": [".agents/hooks/loop-termination-verifier.sh", "tests/test_stub.py"]
    }
]

CODING_GUIDELINES = {
    "general": [
        "Use patterns from the Awesome Antigravity Skills repository for all engineering tasks.",
        "Always write tests before implementation (TDD).",
        "Document reasoning inside <thinking> XML tags before generating code.",
        "Never write placeholder code or empty implementations.",
        "All new files must include correct licensing headers."
    ],
    "frontend_ui": [
        "Use the Impeccable skill guidelines for all UI/frontend work.",
        "Color system: OKLCH only — no hex, no hsl.",
        "Line length: 65-75 characters maximum.",
        "Animations: exponential easing curves only.",
        "BANNED: side-stripe borders, gradient text, glassmorphic cards, parent-hover animated images."
    ],
    "hooks": [
        "Hook scripts must be Bash-compatible (#!/bin/bash shebang).",
        "Read structured JSON from stdin using $(cat) pattern.",
        "Parse JSON fields using jq with grep/cut fallback for portability.",
        "Return JSON to stdout with correct schema per lifecycle event.",
        "Always exit with code 0 to indicate successful hook execution."
    ],
    "testing": [
        "Use pytest for all Python tests.",
        "Test files go in the tests/ directory.",
        "Run pytest tests/ before committing changes.",
        "Test output is the exit gate for the loop-termination-verifier hook."
    ]
}

# ---------------------------------------------------------------------------
# Input Models
# ---------------------------------------------------------------------------

class SearchInput(BaseModel):
    """Input for keyword-based knowledge search."""
    model_config = ConfigDict(str_strip_whitespace=True, validate_assignment=True, extra="forbid")

    query: str = Field(
        ...,
        description="Search query string (e.g. 'PreToolUse hook', 'impeccable colors', 'tier 3 harness')",
        min_length=2,
        max_length=200
    )

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Query cannot be empty or whitespace only.")
        return v.strip()


class HookLookupInput(BaseModel):
    """Input for looking up a specific lifecycle hook schema."""
    model_config = ConfigDict(str_strip_whitespace=True, validate_assignment=True, extra="forbid")

    hook_name: str = Field(
        ...,
        description="Name of the lifecycle hook event. One of: PreInvocation, PreToolUse, PostToolUse, PostInvocation, Stop",
        min_length=1
    )

    @field_validator("hook_name")
    @classmethod
    def validate_hook_name(cls, v: str) -> str:
        valid = list(HOOK_SCHEMAS.keys())
        if v not in valid:
            raise ValueError(f"Unknown hook '{v}'. Valid hooks: {', '.join(valid)}")
        return v


class TierInput(BaseModel):
    """Input for retrieving architecture tier documentation."""
    model_config = ConfigDict(str_strip_whitespace=True, validate_assignment=True, extra="forbid")

    tier_number: int = Field(
        ...,
        description="Tier number to retrieve (1=Prompt, 2=Context, 3=Harness, 4=Loop)",
        ge=1,
        le=4
    )


# ---------------------------------------------------------------------------
# Shared Utilities
# ---------------------------------------------------------------------------

def _format_error(msg: str) -> str:
    return f"Error: {msg}. Try narrowing your query or use dk_list_topics to see available topics."


def _read_workspace_file(relative_path: str) -> Optional[str]:
    """Safely read a file from the workspace. Returns None if not found."""
    try:
        full_path = WORKSPACE_ROOT / relative_path
        if full_path.exists():
            return full_path.read_text(encoding="utf-8")
        return None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@mcp.tool(
    name="dk_search_guidelines",
    annotations={
        "title": "Search Developer Guidelines",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False
    }
)
async def dk_search_guidelines(params: SearchInput) -> str:
    """Search the developer knowledge base for coding guidelines matching a query.

    Searches across general engineering rules, frontend/UI constraints (Impeccable),
    hook scripting patterns, and testing conventions.

    Args:
        params (SearchInput): Validated input containing:
            - query (str): Search term (e.g. 'colors', 'pytest', 'bash hook', 'animation')

    Returns:
        str: JSON string with matched guidelines grouped by category.

    Examples:
        - "What are the UI color rules?" -> query="OKLCH colors impeccable"
        - "How should hooks be written?" -> query="hook bash script"
        - "What testing conventions apply?" -> query="pytest testing"
    """
    query_lower = params.query.lower()
    matches: dict = {}

    for category, rules in CODING_GUIDELINES.items():
        matched = [r for r in rules if any(word in r.lower() for word in query_lower.split())]
        if matched:
            matches[category] = matched

    if not matches:
        return _format_error(f"No guidelines found matching '{params.query}'")

    return json.dumps({"query": params.query, "results": matches}, indent=2)


@mcp.tool(
    name="dk_get_hook_schema",
    annotations={
        "title": "Get Lifecycle Hook Schema",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False
    }
)
async def dk_get_hook_schema(params: HookLookupInput) -> str:
    """Retrieve the full stdin/stdout schema for a specific agy lifecycle hook event.

    Returns the exact JSON format the agy CLI engine sends to hook scripts (stdin)
    and the required response format (stdout) for the specified hook event.

    Args:
        params (HookLookupInput): Validated input containing:
            - hook_name (str): One of PreInvocation, PreToolUse, PostToolUse, PostInvocation, Stop

    Returns:
        str: JSON string with the hook's description, stdin fields, stdout format, and use case.

    Examples:
        - "What does PreToolUse send?" -> hook_name="PreToolUse"
        - "How do I write a Stop hook?" -> hook_name="Stop"
    """
    schema = HOOK_SCHEMAS.get(params.hook_name)
    if not schema:
        return _format_error(f"Hook '{params.hook_name}' not found")

    return json.dumps({"hook": params.hook_name, **schema}, indent=2)


@mcp.tool(
    name="dk_get_tier_architecture",
    annotations={
        "title": "Get Architecture Tier Documentation",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False
    }
)
async def dk_get_tier_architecture(params: TierInput) -> str:
    """Retrieve the architecture decision record and rationale for a specific engineering tier.

    Returns the pattern used, design rationale, and which workspace files implement that tier.

    Args:
        params (TierInput): Validated input containing:
            - tier_number (int): 1 (Prompt), 2 (Context), 3 (Harness), or 4 (Loop)

    Returns:
        str: JSON string with tier name, pattern, rationale, and implementing files.

    Examples:
        - "How does the loop work?" -> tier_number=4
        - "What is Tier 3 harness?" -> tier_number=3
    """
    tier = ARCHITECTURE_DECISIONS[params.tier_number - 1]
    return json.dumps(tier, indent=2)


@mcp.tool(
    name="dk_get_skill_reference",
    annotations={
        "title": "Get Skill Reference",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False
    }
)
async def dk_get_skill_reference(skill_name: str) -> str:
    """Get the reference documentation for a registered workspace skill.

    Returns the skill's slash command, description, allowed tools, and constraints.

    Args:
        skill_name (str): Name of the skill (e.g. 'autonomous-fixer')

    Returns:
        str: JSON string with full skill metadata and constraint rules.

    Examples:
        - "What tools does autonomous-fixer use?" -> skill_name="autonomous-fixer"
    """
    ref = SKILL_REFERENCE.get(skill_name)
    if not ref:
        available = list(SKILL_REFERENCE.keys())
        return _format_error(f"Skill '{skill_name}' not found. Available: {', '.join(available)}")

    return json.dumps({"skill": skill_name, **ref}, indent=2)


@mcp.tool(
    name="dk_read_workspace_file",
    annotations={
        "title": "Read Workspace File Content",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False
    }
)
async def dk_read_workspace_file(relative_path: str) -> str:
    """Read the raw contents of a file in the agy workspace.

    Useful for retrieving the actual STATE.md, hook scripts, or skill definitions.

    Args:
        relative_path (str): Path relative to workspace root
            (e.g. 'STATE.md', '.agents/skills/autonomous-fixer.md', '.agents/hooks.json')

    Returns:
        str: Raw file content, or an error message if the file does not exist.

    Examples:
        - "Show me STATE.md" -> relative_path="STATE.md"
        - "Read the hook config" -> relative_path=".agents/hooks.json"
    """
    content = _read_workspace_file(relative_path)
    if content is None:
        return _format_error(f"File '{relative_path}' not found in workspace root {WORKSPACE_ROOT}")
    return content


@mcp.tool(
    name="dk_list_topics",
    annotations={
        "title": "List Available Knowledge Topics",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False
    }
)
async def dk_list_topics() -> str:
    """List all available knowledge topics and tools in this MCP server.

    Use this first to discover what information is available before querying specific tools.

    Returns:
        str: JSON string with all topics, tool names, and brief descriptions.
    """
    topics = {
        "tools": [
            {"name": "dk_search_guidelines", "description": "Search coding guidelines by keyword (UI, testing, hooks, general)"},
            {"name": "dk_get_hook_schema", "description": "Get stdin/stdout schema for any agy lifecycle hook event"},
            {"name": "dk_get_tier_architecture", "description": "Get architecture decisions for Tier 1-4"},
            {"name": "dk_get_skill_reference", "description": "Get reference docs for a registered workspace skill"},
            {"name": "dk_read_workspace_file", "description": "Read raw content of any workspace file by relative path"},
            {"name": "dk_list_topics", "description": "List all tools and topics (this tool)"}
        ],
        "available_hooks": list(HOOK_SCHEMAS.keys()),
        "available_skills": list(SKILL_REFERENCE.keys()),
        "available_tiers": [adr["tier"] for adr in ARCHITECTURE_DECISIONS],
        "guideline_categories": list(CODING_GUIDELINES.keys())
    }
    return json.dumps(topics, indent=2)


if __name__ == "__main__":
    mcp.run()
