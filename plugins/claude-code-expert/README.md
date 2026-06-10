# Claude Code Expert Plugin v8

A modern **Claude Code second brain**: a 5-layer stack deployer, a three-tier memory system
(engram + Obsidian vault + plugin rules), and a 22-tool MCP reference server — plus
**21 behavior-triggering skills**, **12 single-intent commands**, and **18 role-scoped agents**.

It keeps your Claude Code setup current with what the tool can actually do. The authoritative
capability snapshot lives in [`docs/CC-CAPABILITIES-2026-06.md`](docs/CC-CAPABILITIES-2026-06.md)
(models, tools, hooks, agent teams, permissions, web/remote, memory) — when a skill disagrees with
it, the skill gets fixed.

**Current models:** Fable 5 (`claude-fable-5`, Mythos-class tier above Opus) · Opus 4.8
(`claude-opus-4-8`) · Sonnet 4.6 (`claude-sonnet-4-6`) · Haiku 4.5 (`claude-haiku-4-5-20251001`).
Aliases `fable`/`opus`/`sonnet`/`haiku` auto-resolve to the latest; `/fast` keeps Opus reasoning
with faster output (not on Fable); `effort` (`low`→`max`, `xhigh` on Opus 4.7/4.8 and Fable 5)
scales thinking depth without changing model — on Fable 5 it's the only depth control.

## The 5-layer extension stack

| Layer | What | Impact |
|-------|------|--------|
| **CLAUDE.md** | Routing OS — project rules, decision trees, build commands | Agent navigates your codebase correctly |
| **Skills** | Capability packs loaded on demand (descriptions deferred until used) | Big token savings vs. loading everything |
| **Hooks** | Guardrails — auto-format, security, error capture, telemetry | Compliance without asking |
| **Agents** | Specialized workers — review, security, debugging, orchestration | Parallel expert analysis |
| **Memory** | Three tiers — engram (working) + Obsidian vault (durable) + plugin rules (baseline) | Knowledge that survives sessions |

## What's included

### Commands (12)

| Command | Purpose |
|---------|---------|
| `/cc-setup` | Deploy or audit the full 5-layer stack — detect stack, deploy layers, install MCP, configure memory, propagate to sub-repos |
| `/cc-sync` | Idempotent update of an existing setup — re-fingerprint, propagate `.claude/` to sub-repos, fix drift |
| `/cc-memory` | CC-scoped memory ops over engram — search, export, consolidate, edit-always, review, status |
| `/cc-orchestrate` | Launch a multi-agent workflow by agentic pattern (chain, routing, parallelization, eval-optimizer, …) |
| `/cc-council` | Multi-agent council review — security + performance + test + architecture perspectives, scoped scoring |
| `/cc-intel` | Deep evidence-driven analysis for hard problems — architecture decisions, root-cause, option scoring |
| `/cc-autonomy` | Configure autonomous operating mode — profile selection (conservative / balanced / aggressive) |
| `/cc-channels` | Install event-driven channel servers — CI webhook receiver, mobile approval relay, Discord bridge |
| `/cc-hooks` | Install, list, remove, and debug hook packs (8 security-hardened packs) |
| `/cc-skills` | Browsable skill index — every skill grouped by category with trigger phrases |
| `/cc-help` | Task-routing table mapping "I want to X" to the right command, skill, or agent |
| `/cc-debug` | Diagnose CC issues — plugin load failures, MCP connection problems, hook misfires |

### Agents (18)

Role-scoped, model-deliberate, tool-restricted. Opus for reasoning/review gates, Sonnet for
implementation, Haiku for retrieval.

| Agent | Model | Role |
|-------|-------|------|
| `team-orchestrator` | Opus | Master orchestrator — delegates, coordinates teams, audits |
| `principal-engineer-strategist` | Opus | Principal-level analysis, root-cause isolation, tradeoffs |
| `council-coordinator` | Opus | Fan-out/fan-in council with blackboard pattern |
| `audit-reviewer` | Opus | Second-round auditor; validates library usage via Context7 |
| `evaluator-optimizer` | Opus | Evaluator-Optimizer loop — generate, evaluate, refine |
| `debugger` | Opus | Systematic root-cause tracer for code-level bugs |
| `migration-lead` | Opus | Schema/API/framework migration planning and execution |
| `security-compliance-advisor` | Opus | Enterprise security + compliance audit (SOC2/HIPAA/GDPR) |
| `memory-consolidator` | Opus | Bridges engram → Obsidian vault → plugin rules (read-only on engram) |
| `autonomy-planner` | Opus | Decomposes tasks into phased, risk-assessed plans |
| `autonomy-reviewer` | Opus | Final BLOCK/APPROVE review for autonomous work |
| `autonomy-verifier` | Sonnet | Runs the verification suite after each phase |
| `implementer` | Sonnet | Focused code-writing agent (restricted to write tools) |
| `pattern-router` | Sonnet | Selects the optimal agentic design pattern for a task |
| `plugin-architect` | Sonnet | Designs/scaffolds/validates plugin structures |
| `release-coordinator` | Sonnet | Changelogs, version tags, release validation |
| `research-orchestrator` | Sonnet | Routes research to Perplexity / Firecrawl / Context7 |
| `dependency-auditor` | Haiku | Dependency vulnerabilities, outdated packages, licenses |

### Skills (21)

Behavior-triggering, ≤500 lines each, heavy reference content in `references/` or the MCP KB.

| Skill | Coverage |
|-------|----------|
| `claude-code-setup` | Deploy/audit the 5-layer stack |
| `claude-code-sync` | Idempotent setup updates + sub-repo propagation |
| `cc-second-brain` | Three-tier memory (engram + Obsidian + plugin rules) + topic-key taxonomy |
| `model-routing` | Pick Opus/Sonnet/Haiku, effort levels, fast mode, cost tables |
| `context-budgeting` | Token arithmetic, `/compact` strategy, anchor preservation |
| `hooks` | Full hook lifecycle (14 events), JSON contract, security patterns |
| `mcp` | MCP config, transports, Tool Search / deferred tools, channels |
| `agent-teams` | Multi-agent topologies, role squads, lifecycle, worktree coordination |
| `agentic-patterns` | Reflection, chaining, routing, parallelization, eval-optimizer |
| `orchestration-blackboard` | Shared filesystem blackboard for parallel agent runs |
| `prompt-budget-preflight` | Pre-flight before any Agent spawn — avoid prompt-too-long rejects |
| `verify-between-waves` | tsc/test/commit cadence between refactor waves |
| `worktree-management` | Git worktree isolation, parallel tasks, `EnterWorktree`/`ExitWorktree` |
| `monitor-tool` | Stream background process events into the conversation (Monitor tool) |
| `auto-mode` | Auto-mode permission handling — classifier approvals, defer flow |
| `autonomy` | Configure autonomous operating profiles |
| `ultraplan` | Cloud planning — plan in the cloud, review in browser, execute remote or local |
| `deep-code-intelligence` | Evidence-driven workflow for hard bugs and high-stakes decisions |
| `security-compliance` | Permissions model, settings allowlists/denylists, hardening |
| `plugin-development` | Build/validate/publish plugins — manifest schema, authoring |
| `prompt-engineering` | Effective CLAUDE.md routing, agent prompts, skill descriptions |

### MCP reference server (22 tools)

The plugin ships an MCP server so Claude can query its knowledge programmatically instead of
loading heavy reference content into context.

- **`cc_docs_*` (15)** — search, topic lists, full references, settings schema, env vars,
  troubleshooting, task resolution, model recommendation, checklists, comparisons, topology and
  hook-pack recommendation.
- **`cc_kb_*` (7)** — fetch hook recipes, topology kits, workflow packs, channel servers, LSP
  configs, pattern templates, and autonomy profiles. Every KB artifact is ≤2 KB and lazy-loaded.

Full list in [`docs/MCP_TOOLS.md`](docs/MCP_TOOLS.md).

## Installation

```bash
/plugin install claude-code-expert
```

### Enable the MCP server

Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "claude-code-docs": {
      "type": "stdio",
      "command": "node",
      "args": ["plugins/claude-code-expert/mcp-server/src/index.js"]
    }
  }
}
```

Then install dependencies:

```bash
cd plugins/claude-code-expert/mcp-server && npm install
```

> Tool Search is on by default, so the server's tools load on demand via `ToolSearch` rather than
> consuming context every turn. Set `"alwaysLoad": true` on the server entry to force eager loading.

## Quick start

```bash
/cc-setup                      # Deploy or audit the full 5-layer stack
/cc-setup --audit              # Score an existing setup without writing
/cc-sync                       # Idempotently update an existing setup
/cc-memory --status            # Inspect CC-scoped memory
/cc-orchestrate --list         # Browse agentic-pattern workflows
/cc-council                    # Multi-perspective review of a change
/cc-hooks                      # Install/debug hook packs
/cc-help "How do I configure hooks?"
/cc-debug                      # Diagnose a broken setup
```

## Documentation

- [`docs/CC-CAPABILITIES-2026-06.md`](docs/CC-CAPABILITIES-2026-06.md) — authoritative June-2026 capability baseline
- [`docs/MCP_TOOLS.md`](docs/MCP_TOOLS.md) — the 22 MCP tools + KB artifacts
- [`docs/MEMORY_ARCHITECTURE.md`](docs/MEMORY_ARCHITECTURE.md) — three-tier memory design
- [`docs/MIGRATION.md`](docs/MIGRATION.md) — v7 → v8 migration guide
- [`CLAUDE.md`](CLAUDE.md) — plugin routing and operating rules
- [`CHANGELOG.md`](CHANGELOG.md) — version history

`archive/v7.6.0/` preserves the pre-redesign v7 tree; `commands-old/` and `skills-old/` are
historical and not loaded.
