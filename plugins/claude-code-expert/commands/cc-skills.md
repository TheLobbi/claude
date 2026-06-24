---
name: cc-skills
intent: The claude-code-expert plugin ships 21 skills. Reading CLAUDE.md and hunting for trigger keywords is not a good discovery UX. /cc-skills lists every skill in the plugin, grouped by category, with its trigger phrases and a one-line description so you can find the right one in
tags:
  - claude-code-expert
  - command
  - cc-skills
inputs: []
risk: medium
cost: medium
description: The claude-code-expert plugin ships 21 skills. Reading CLAUDE.md and hunting for trigger keywords is not a good discovery UX. /cc-skills lists every skill in the plugin, grouped by category, with its trigger phrases and a one-line description so you can find the right one in
---

# /cc-skills — Browsable Skill Index

The claude-code-expert plugin ships 21 skills. Reading `CLAUDE.md` and hunting for trigger
keywords is not a good discovery UX. `/cc-skills` lists every skill in the plugin, grouped by
category, with its trigger phrases and a one-line description so you can find the right one in
seconds.

Addresses UX finding C5 from the 7-agent upgrade council ("53 skills are completely invisible
without reading source files").

## Usage

```bash
/cc-skills                       # List all skills, grouped by category
/cc-skills --category memory     # Only skills in a category
/cc-skills --search "context"    # Free-text search across name + description + triggers
/cc-skills --trigger "ultraplan" # Show which skill a trigger phrase activates
/cc-skills --show auto-mode      # Show the full SKILL.md for one skill
/cc-skills --unused              # List skills that have not activated this session
/cc-skills --by-size             # List largest skill bodies (tokens) — perf audit aid
```

## Implementation

This is a prompt-driven command. When the user invokes it, Claude:

1. Reads every `plugins/claude-code-expert/skills/*/SKILL.md` (frontmatter only by default —
   they are progressive-load, full body is loaded on activation).
2. Parses each skill's `name`, `description`, `triggers`, and `allowed-tools` from the YAML
   frontmatter.
3. Groups by inferred category (see category-inference rules below).
4. Renders a compact, scannable listing.

### Category inference

Map skill name prefixes / keywords to categories. Falls back to "general" for unmatched.

| Category | Matches on |
|---|---|
| **Orchestration** | `orchestration-*`, `agent-team-topologies`, `cc-agentic-patterns`, `council-*`, `cc-worktree-management`, `channels-bootstrap`, `hook-policy-engine`, `common-workflows` |
| **Memory & Context** | `cc-context-budgeting`, `checkpointing`, `auto-memory`, `cc-monitor-tool`, `cc-prompt-budget-preflight` |
| **Orchestration primitives** | `cc-orchestration-blackboard`, `cc-verify-between-waves` |
| **Code Intelligence** | `cc-deep-code-intelligence`, `self-healing-advanced`, `research-routing`, `computer-use` |
| **Model & Cost** | `cc-model-routing`, `cc-ultraplan` |
| **CI/CD & Ops** | `cicd-integration`, `scheduled-tasks`, `runtime-selection` |
| **Security & Enterprise** | `enterprise-security`, `cc-auto-mode`, `permissions-*` |
| **Plugin Dev** | `cc-plugin-development`, `mcp-servers`, `hook-script-library` |
| **IDE & SDK** | `ide-integration`, `sdk-*`, `lsp-integration` |
| **Tutorials / Reference** | `worked-examples`, `mcp-prompts`, anything else with no clear grouping |

### Default output format

```
## Orchestration
  orchestration-blackboard        Multi-round blackboard for fan-out runs. Triggers: blackboard, round 2 agent.
  agentic-patterns                Taxonomy + selection decision tree. Triggers: routing, pattern selection.
  agent-team-topologies           5 production-ready team topologies. Triggers: team topology, fan-out.
  verify-between-waves            tsc/test/commit cadence for multi-file refactors. Triggers: wave-by-wave.
  ...

## Memory & Context
  context-budgeting               Token arithmetic, compact strategies. Triggers: context budget, token budget.
  prompt-budget-preflight         5-section MVP prompt template + preflight. Triggers: agent rejection, prompt is too long.
  ...

## Model & Cost
  model-routing                   haiku vs sonnet vs opus decision matrix. Triggers: which model, cost estimate.
  ultraplan                       Cloud planning via /ultraplan. Triggers: cloud planning.
  ...
```

### Output modes in detail

- `--show <name>`: print the entire SKILL.md (full body, not just frontmatter) so the user can
  read the skill without hunting for the file path.
- `--by-size`: read each SKILL.md body, estimate tokens, rank largest first. Flags skills >400
  lines as candidates for the C3 body-extraction upgrade.
- `--unused`: cross-reference with telemetry (when `cc://telemetry/agents` has data) to flag
  skills that have never activated. Read-only diagnostic — does not delete anything.

## Why this is a command, not a skill

Discovery of skills via trigger phrases is the default mode — but when you don't know what
exists, you cannot craft a trigger phrase. A direct slash-command gives you an index without
requiring keyword guessing.

## Cross-references

- UX council finding C5 — "53 skills invisible" — originated this command.
- Perf council finding C3 — large skill bodies — `--by-size` is the diagnostic aid for C3's
  body-extraction cleanup.
- `skills/cc-agentic-patterns/SKILL.md` — the "pattern selection" skill is the second half of
  discoverability; this command is the first half.
