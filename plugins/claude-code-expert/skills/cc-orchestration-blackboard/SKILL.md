---
name: cc-orchestration-blackboard
description: Shared filesystem-backed blackboard for multi-agent runs. Parallel subagents append findings for a given run-id; subsequent-round subagents read them via MCP tools without the orchestrator having to paste everything into their prompts. Use for any fan-out pattern with more than one round of deliberation.
allowed-tools:
  - mcp__cc_docs__cc_blackboard_append
  - mcp__cc_docs__cc_blackboard_read
  - Read
  - Bash
triggers:
  - blackboard
  - multi-round orchestration
  - shared findings
  - fan-out synthesis
  - round 2 agent
---

# Orchestration Blackboard

A filesystem-backed blackboard that makes real multi-round orchestration possible without
Claude Code CLI changes.

## The problem it solves

Parallel subagents can't see each other. In one observed 7-agent council run, Rounds 2 and 3
("cross-critique" and "consensus synthesis") had to be faked by the orchestrator reading all
7 Round-1 outputs and synthesizing in-context. Real multi-round deliberation — where Round-2
agents read Round-1 outputs and critique — was impossible without a shared store.

## The primitive

Two MCP tools exposed by the claude-code-expert MCP server:

- `cc_blackboard_append({ run_id, round, role, findings })` — append-only per triple
- `cc_blackboard_read({ run_id, round?, role? })` — read with optional filters

And one resource:

- `cc://blackboard/<run_id>` — full read as a YAML blob

Storage lives at `.claude/orchestration/blackboard/<run_id>/<round>-<role>.yaml`, one file
per (round, role). Files are write-once; a second append for the same triple fails — rounds
are auditable and non-overwritable.

## Usage pattern: fan-out with real Round 2

### Round 1 — parallel fan-out

Spawn N specialists in one message with prompts that end with:

```
When you have your findings, call cc_blackboard_append with:
  run_id: "<RUN_ID>"
  round: 1
  role: "<YOUR_ROLE>"
  findings: <structured summary>
```

Each agent appends its own finding. They do not block on each other.

### Round 2 — cross-critique

After all Round-1 agents complete, spawn the same specialists (or a subset) with prompts
that start:

```
Read round-1 findings via:
  cc_blackboard_read({ run_id: "<RUN_ID>", round: 1 })

Produce your round-2 critique. Focus on:
  - Where you agree / disagree with other roles
  - What other roles missed that your lens would catch
  - What you change your mind on given their evidence

Append your round-2 result via cc_blackboard_append with round=2.
```

Now the orchestrator reads round 2 to drive synthesis.

### Round 3 — synthesis

Either the orchestrator does this in-context (reads the full run via the resource URI), or
spawns one Opus "synthesizer" agent with access to the full blackboard.

## run_id naming convention

Pick something stable and descriptive:

```
<yyyymmdd>-<kind>-<short-slug>

Examples:
  20260417-council-scrapin-upgrades
  20260417-refactor-security-pass
  20260417-debug-stdio-contamination
```

Only `[A-Za-z0-9_.-]` is allowed (the tool enforces this as a path-traversal guard).

## Example orchestrator prompt snippet

```
You are running a 7-agent council over target X. Run ID: 20260417-council-X.

Round 1 (parallel, all 7 agents):
  <list specialist types + their scoped prompts, each ending with the append instruction>

Wait for all 7 to complete. Verify all 7 blackboard entries exist:
  cc_blackboard_read({ run_id: "20260417-council-X", round: 1 })

Round 2 (parallel, same 7 roles, new prompts that START with the read):
  <each prompt begins with `cc_blackboard_read(...)` and ends with `cc_blackboard_append(... round: 2 ...)`>

Round 3 (single synthesis, orchestrator in-context):
  Read the full run via cc://blackboard/20260417-council-X and produce the final catalog.
```

## Failure modes & how to handle them

| Symptom | Likely cause | Fix |
|---|---|---|
| Append raises "entry already exists" | Agent was re-invoked with the same (round, role) | Pick a distinct role (e.g., `performance-2`), or bump the round counter. Entries are append-only by design. |
| Read returns empty | Agents haven't written yet, or run_id mismatch | Verify the run_id string is identical across all participants. Don't derive it separately in each agent. |
| Path-traversal rejection | Non-`[A-Za-z0-9_.-]` char in run_id or role | Rename. The guard is there to prevent `../../../../tmp/...` escape attempts. |

## Anti-patterns

- Using the blackboard for very large outputs. Entries are human-readable YAML blocks; if
  an agent produces 100KB, use a resource URI in the finding and store the bulk elsewhere.
- Treating the blackboard as transient. Don't rm entries mid-run; later rounds depend on
  them. Clean up by removing the whole `<run_id>/` directory after the run.
- Skipping the run_id convention. The sorting and filter guarantees depend on predictable
  filenames; don't creative-interpret.

## Cross-references

- `commands/cc-orchestrate.md` Template 11 (Blackboard Council) — the canonical multi-agent
  pattern that uses this primitive.
- `commands/cc-orchestrate.md` Template 13 (Specialist Fan-Out) — the simpler pattern that
  gets real multi-round capability via this skill.
- `skills/cc-agentic-patterns/SKILL.md` — the agentic-pattern taxonomy. Blackboard is
  "Supporting Pattern: Shared Working Memory".
