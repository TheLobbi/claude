# Architecture

How the orchestrator, teams, workflows, and gates fit together.

## Layers

```
  /gh:* commands          ← what a human or another agent invokes
        │
        ▼
  workflows/*.json        ← declarative, schema-validated coordination
        │
        ▼
  gh-orchestrator         ← coordinator; holds the blackboard, owns the outcome
        │
        ├── delivery       branch · author · stack · conflicts · merge
        ├── review-board   6 lenses → verifiers → synthesis
        ├── ci             classify → fix → quarantine → re-run
        ├── intel          advise · map · DORA · hotspots · ownership
        ├── supply-chain   dependencies · reachability · secrets
        ├── release        semver · changelog · rollback
        └── issues         triage · dedup · decompose
        │
        ▼
  skills/*/SKILL.md       ← domain knowledge the agents share
        │
        ▼
  mcp__github__*          ← the only path to GitHub
```

Commands are thin. They resolve arguments, pick a workflow or an agent, and
report. The behavior lives in the agents; the knowledge lives in the skills.
This is deliberate — a fact about merge queues should exist once, in
`skills/merge-queue`, not restated in four command files that drift apart.

## Why teams

An agent with a narrow mandate produces sharper output than one with a broad
one. "Review this PR" yields commentary; "find correctness defects, return
file/line/failure-scenario" yields findings.

Teams group narrow agents so the coordinator can dispatch by capability without
knowing every agent. `config/teams.json` is the roster;
`config/model-routing.json` sets the model and effort per team, with per-agent
overrides where a role is unusually hard.

## The blackboard

Agents write findings to a shared structure; the coordinator reads it and
decides. Three rules make this work:

1. **Contradiction is information.** Two agents disagreeing means one has
   context the other lacks. Investigate — do not average their confidence.
2. **Deduplicate by root cause, not text.** Two lenses describing one defect
   from different angles is one finding.
3. **Record what was dropped.** A board reporting only survivors is
   indistinguishable from one that found nothing.

## Parallel vs sequential

Default to the least synchronized shape that works.

| Genuinely parallel | Genuinely sequential |
| --- | --- |
| Review lenses over one diff | Branch → implement → PR |
| Security scans across alert classes | Landing a stack (each merge changes the next base) |
| Metric collection across dimensions | Migration → code → cleanup |
| Per-PR triage across open PRs | Semver → gates → tag |

A barrier (collect *all* results before continuing) is justified only when a
later step needs cross-item context — deduplicating across scanners, or an early
exit on zero findings. "I need to flatten the array first" is not a
justification; do the transform inside a stage.

## The gate model

Merging is the only irreversible step in the loop, so it has its own agent.
`merge-marshal` runs last and **re-fetches every gate against live state** —
everything upstream may have been correct ten minutes ago.

| Gate | Source of truth |
| --- | --- |
| Required checks green at the current head sha | `actions_list` → `list_workflow_runs` |
| Clean mergeability | `pull_request_read` → `mergeable_state` |
| Review quorum, no outstanding changes-requested | `pull_request_read` → `get_reviews` |
| No unresolved threads | `pull_request_read` → `get_review_comments` |
| Human approval for `humanReviewPaths` | Session state |
| No protection bypass | Merge succeeds without admin override |

Refusing a merge is a **successful** outcome for `merge-marshal`. Merging
something that should not have merged is the only failure mode that matters.

A second layer sits below it: `hooks/scripts/guard-github-writes.sh` blocks
force-pushes to protected branches, plain `--force`, history rewrites on shared
branches, bypass flags, and credential-shaped strings in PR and issue bodies —
at the tool-call boundary, regardless of which agent asked.

## Telemetry

| Hook | Event | Output |
| --- | --- | --- |
| `capture-agent-telemetry.sh` | `SubagentStop` | `gh-agent-runs.jsonl` — agent, status, turns, duration |
| `lessons-capture.sh` | `PostToolUseFailure` | `gh-failures.jsonl`, plus `gh-failures-skipped.jsonl` for filtered false positives |

Both write under `.claude/orchestration/telemetry/`. Every field is built with
`jq`, never string concatenation, so agent output cannot break a record or
inject fields.

The skip file matters as much as the capture file: grep zero-match, `tsc` exit-2
during an in-progress edit, and red-green test iteration are normal working
signals. Capturing them buries the failures that deserve a fix, and the skip log
keeps the filter auditable.

## Extending

| Adding | Steps |
| --- | --- |
| An agent | `agents/<name>.md` with the required frontmatter → add to `config/teams.json` → `pnpm generate:plugin-indexes` |
| A command | `commands/<name>.md` → add to `CLAUDE.md` and `README.md` → regenerate indexes |
| A skill | `skills/<name>/SKILL.md` → reference it from the agents that need it |
| A workflow | `workflows/<name>.json` → `node workflows/validate.mjs` → document in three places |

Frontmatter must carry `name`, `intent`, `tags`, `inputs`, `risk`, `cost` in
that order; `pnpm check:plugin-indexes` fails otherwise.
