---
name: claude-code-expert:cc-debug
intent: Diagnose Claude Code issues — plugin load failures, MCP connection problems, hook misfiring, permission denials, skill/agent not triggering. Absorbs legacy cc-troubleshoot.
tags:
  - claude-code-expert
  - command
  - cc-debug
inputs: []
risk: medium
cost: medium
description: Diagnose Claude Code issues — plugin load failures, MCP connection problems, hook misfiring, permission denials, skill/agent not triggering. Absorbs legacy cc-troubleshoot.
---

# /cc-debug — Diagnose CC Setup Issues

Systematic diagnostics for the Claude Code stack itself (not for debugging application code — for that, use `/cc-intel` or the `debugger` agent).

## Usage

```bash
/cc-debug                     # Interactive: ask what's wrong
/cc-debug plugin <name>       # Plugin load/runtime issues
/cc-debug mcp <server>        # MCP server connection or tool calls
/cc-debug hook <event>        # Hook not firing, wrong matcher
/cc-debug perm                # Permission denied errors
/cc-debug skill <name>        # Skill not triggering on expected phrases
/cc-debug agent <name>        # Agent not invoking or wrong output
```

## Approach

Runs the `debugger` agent (Opus) with the CC-setup playbook. Hypothesis-driven:

1. **Frame** the symptom: what was expected vs observed.
2. **Locate** the likely layer: plugin manifest, settings.json, MCP config, skill frontmatter, agent system prompt.
3. **Hypothesize** 2–3 causes with verification steps (read files, run tests).
4. **Verify** cheapest first.
5. **Fix** the confirmed cause; write regression check if applicable.
6. **Report** with: root cause, fix applied, how to prevent.

## Common diagnostic paths

| Symptom | First check |
|---|---|
| Plugin not loading | `plugin.json` schema valid? Referenced files exist? |
| Skill not triggering | Frontmatter description too vague — use `skill-reviewer` agent |
| Hook blocking unexpectedly | `bash .claude/hooks/X.sh < fixture.json` — read stderr |
| MCP tool missing | Server running? `capabilities.tools` declared? |
| Permission denied | `.claude/settings.json` → permissions section |
| Agent invokes but wrong output | Agent system prompt missing output format template |
| After /compact everything forgotten | `post-compact-context-restoration` hook installed? |

## MCP support

Uses `cc_docs_troubleshoot(issue)` for symptom → section lookup. Uses `cc_docs_full_reference(topic)` for authoritative config syntax.
