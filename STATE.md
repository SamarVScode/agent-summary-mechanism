# Orchestrator Loop State & Project Architecture

This file documents the system architecture, registered files, and loop execution state of the 4-Tier Agentic Development System.

## 🗺️ System Architecture Blueprint

```
+--------------------------------------------------------+
|  TIER 4: LOOP ENGINEERING (Continuous Verification)    |
|  - verifier hook runs pytest and npm run build         |
|  - checks off REQUIREMENTS.md, updates loop-debug.md   |
|  +--------------------------------------------------+  |
|  |  TIER 3: HARNESS ENGINEERING (Safety Gates)      |  |
|  |  - cmd-validator.sh (blocks rm -rf, curl, etc.)  |  |
|  |  - file-validator.sh (enforces REQUIREMENTS)     |  |
|  |  +--------------------------------------------+  |  |
|  |  |  TIER 2: CONTEXT ENGINEERING (MCP Server)  |  |  |
|  |  |  - developer-knowledge MCP (FastMCP Python) |  |  |
|  |  |  +--------------------------------------+  |  |  |
|  |  |  |  TIER 1: PROMPT ENGINEERING (Skills) |  |  |  |
|  |  |  |  - /autonomous-fixer ( TDD coder )   |  |  |  |
|  |  |  |  - /status ( TUI state dashboard )   |  |  |  |
|  |  |  +--------------------------------------+  |  |  |
|  |  +--------------------------------------------+  |  |
|  +--------------------------------------------------+  |
+--------------------------------------------------------+
```

---

## 📂 Active System Files Mapping

| Tier | Component | File Path | Purpose |
|---|---|---|---|
| **Tier 1** | Developer Skill | [.agents/skills/autonomous-fixer.md](file:///.agents/skills/autonomous-fixer.md) | Enforces TDD loop steps and constraints. |
| **Tier 1** | Status Skill | [.agents/skills/status.md](file:///.agents/skills/status.md) | Formats and outputs the status dashboard. |
| **Tier 2** | MCP Server | [.agents/developer_knowledge_mcp.py](file:///.agents/developer_knowledge_mcp.py) | Connects tools to project specifications. |
| **Tier 2** | MCP Config | [.agents/mcp.json](file:///.agents/mcp.json) | Configures stdio launch settings for MCP. |
| **Tier 3** | Hooks Config | [.agents/hooks.json](file:///.agents/hooks.json) | Binds regex patterns to safety check scripts. |
| **Tier 3** | Command Gate | [.agents/hooks/cmd-validator.sh](file:///.agents/hooks/cmd-validator.sh) | Intercepts commands to prevent destructive shell calls. |
| **Tier 3** | Write Gate | [.agents/hooks/file-validator.sh](file:///.agents/hooks/file-validator.sh) | Restricts code writes until REQUIREMENTS.md is ready. |
| **Tier 4** | Verification | [.agents/hooks/loop-termination-verifier.sh](file:///.agents/hooks/loop-termination-verifier.sh) | Enforces unit testing and npm compilation. |

---

## 🛠️ Loop Execution & Verifier Instructions

### 🔒 Enforced Safety & Quality Constraints
1. **No Destructive Shells:** Any command invoking `rm -rf`, `Remove-Item -Recurse`, `del`, or `format` is immediately rejected.
2. **Design System Guidelines:** The app must follow the `Impeccable` design guidelines:
   - Must use the OKLCH color space for custom styling variables.
   - Banned elements: side-stripe borders, text gradients, glassmorphism, parent-hover animated images.
3. **Double Verification:** Before the loop terminates, the verifier script runs `pytest tests/` and, if a `package.json` exists, compiles the codebase via `npm run build`.

---

## 📊 Live Loop State

- **Current Goal:** Align Admin UI with Agent UI
- **Loop Status:** ✅ COMPLETED
- **Active Requirements Checklist:** [REQUIREMENTS.md](file:///REQUIREMENTS.md)
- **Iteration Log:** [loop-debug.md](file:///loop-debug.md)
