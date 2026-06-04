---
name: claude-code-expert:cc-help
intent: Plugin help — task-routing table that maps "I want to X" to the right command, skill, or agent in the claude-code-expert plugin.
tags:
  - claude-code-expert
  - command
  - cc-help
inputs: []
risk: medium
cost: medium
description: Plugin help — task-routing table that maps "I want to X" to the right command, skill, or agent in the claude-code-expert plugin.
---

# /cc-help — Plugin Routing

Which `/cc-*` command, skill, or agent to use.

## By task

| I want to... | Run this |
|---|---|
| Set up Claude Code on a new repo | `/cc-setup` (add `--auto` for non-interactive) |
| Audit an existing Claude Code setup | `/cc-setup --audit` |
| Update an existing setup | `/cc-sync` (add `--fix-drift` to repair drift) |
| Analyze a hard coding problem | `/cc-intel <question>` |
| Run multi-agent review (PR, architecture) | `/cc-council <topic>` |
| Launch a multi-agent workflow by pattern | `/cc-orchestrate <task>` |
| Enable autonomous execution | `/cc-autonomy enable <profile>` |
| Install / list / debug hooks | `/cc-hooks` |
| Install event-driven channels | `/cc-channels` |
| Search / consolidate / export memory | `/cc-memory` |
| Diagnose a CC setup issue | `/cc-debug` |

## By problem

| Symptom | Starting point |
|---|---|
| "I don't know where to start" | `/cc-setup --dry-run` |
| "Claude keeps making the same mistake" | `/cc-memory edit-always` to add a rule |
| "My plugin/hook/MCP isn't working" | `/cc-debug` |
| "I'm burning too many tokens" | [`skills-v8/context-budgeting`](../skills-v8/context-budgeting/SKILL.md) + [`skills-v8/model-routing`](../skills-v8/model-routing/SKILL.md) |
| "Security review before this PR lands" | `/cc-council --scope security` |
| "Want to scale agents for a big task" | `/cc-orchestrate --pattern orchestrator-workers` |
| "Need to consolidate memory" | `/cc-memory consolidate` |

## By concept (skills)

| Concept | Skill |
|---|---|
| Claude Code stack deploy | `claude-code-setup` |
| Idempotent updates | `claude-code-sync` |
| Three-tier memory (engram + Obsidian + plugin rules) | `cc-second-brain` |
| Evidence-driven deep analysis | `deep-code-intelligence` |
| Agentic design patterns | `agentic-patterns` |
| Multi-agent teams | `agent-teams` |
| Hooks system | `hooks` |
| MCP servers + channels | `mcp` |
| Autonomy + gates | `autonomy` |
| Model + cost | `model-routing` |
| Context discipline | `context-budgeting` |
| Permissions + compliance | `security-compliance` |
| Plugin authoring | `plugin-development` |
| Prompt/CLAUDE.md/rules | `prompt-engineering` |

## By role (agents)

| Role | Agent | Model |
|---|---|---|
| Deep analysis, architecture | `principal-engineer-strategist` | Opus |
| Evaluator-optimizer loop | `evaluator-optimizer` | Opus |
| Pattern selector | `pattern-router` | Sonnet |
| Council coordinator | `council-coordinator` | Opus |
| Team orchestrator | `team-orchestrator` | Opus |
| Memory consolidator | `memory-consolidator` | Opus |
| Auditor (second-round) | `audit-reviewer` | Opus |
| Security + compliance | `security-compliance-advisor` | Opus |
| Debugger | `debugger` | Opus |
| Implementer | `implementer` | Sonnet |
| Migration lead | `migration-lead` | Opus |
| Dependency auditor | `dependency-auditor` | Haiku |
| Release coordinator | `release-coordinator` | Sonnet |
| Research orchestrator | `research-orchestrator` | Sonnet |
| Plugin architect | `plugin-architect` | Sonnet |
| Autonomy planner/verifier/reviewer | `autonomy-*` | Opus / Sonnet / Opus |

## Deprecated commands (shims until v8.1)

If you remember a command that no longer exists, run it anyway — a shim will redirect you:

- `/cc-bootstrap` → `/cc-setup --audit`
- `/cc-config` → `/cc-sync --fix-drift`
- `/cc-troubleshoot` → `/cc-debug`
- `/cc-budget` → `/cc-intel` + `cc_docs_compare`
- `/cc-cicd` → `cc_kb_workflow_pack`
- `/cc-learn` → `cc_kb_workflow_pack`
- `/cc-mcp` → `/cc-setup --mcp-only`
- `/cc-perf` → `/cc-intel`
- `/cc-schedule` → native `schedule` skill + `cc_docs_schedule_recommend`
- `/cc-agent` → `Agent` tool + `/cc-council`
