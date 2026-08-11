---
name: gh:workflow
intent: List, inspect, validate, and run the declarative multi-agent workflow definitions bundled with this plugin
tags:
  - github-orchestrator
  - command
  - workflow
inputs:
  - action
  - name
  - flags
risk: medium
cost: high
description: Run schema-validated declarative workflows that coordinate multiple agents — sequential, parallel, hierarchical, conditional, and adaptive execution patterns
---

# /gh:workflow

Workflow definitions live in [`workflows/*.json`](../workflows/) and are
validated against
[`workflows/schema/workflow.schema.json`](../workflows/schema/workflow.schema.json).

## Usage

```
/gh:workflow list                              # all available workflows
/gh:workflow show review-board                 # steps, inputs, outputs, agents
/gh:workflow validate                          # validate every definition
/gh:workflow run review-board --input prNumber=482
/gh:workflow run ci-drive-to-green --input prNumber=482 --input maxRounds=5
/gh:workflow run release-train --dry-run       # plan only, no side effects
```

## Bundled workflows

| Name | Type | Inputs | What it does |
| --- | --- | --- | --- |
| `pr-delivery` | sequential | `goal`, `baseBranch` | Branch → implement → PR → review → green → merge |
| `review-board` | parallel | `prNumber` | Six review lenses, adversarial verify, synthesize verdict |
| `ci-drive-to-green` | adaptive | `prNumber`, `maxRounds` | Loop: triage → classify → fix → push → re-check |
| `issue-triage` | conditional | `issueNumber` | Dedup → classify → label → route or decompose |
| `merge-train` | hierarchical | `rootPr` | Order a stack, land, rebase descendants |
| `security-sweep` | parallel | `severityFloor` | CodeQL + Dependabot + secrets, ranked by reachability |
| `release-train` | sequential | `bump`, `prerelease` | Semver → changelog → notes → tag → publish |

## Execution patterns

| Type | Semantics |
| --- | --- |
| `sequential` | Steps run in order; a failed step aborts unless `continueOnError` |
| `parallel` | Steps run concurrently; results are collected at a barrier |
| `hierarchical` | A coordinator agent delegates to workers and owns synthesis |
| `conditional` | Branch on a condition expression; `if`/`else` step lists |
| `adaptive` | Loop with a convergence condition — used by drive-to-green |
| `mesh` | Peer-to-peer, every agent sees every other's output |
| `group-chat` | Shared transcript, agents respond in turn |

## Running

`run` resolves inputs, then executes steps according to the workflow `type`.
Each step's outputs are addressable by later steps as `$.steps.<id>.<output>`;
workflow inputs are `$.input.<name>`.

- `--dry-run` prints the resolved execution plan — every step, agent, and input
  binding — without invoking a single agent.
- `--from <stepId>` resumes from a step, reusing prior checkpoint outputs.
- Checkpoints are written after each step when `monitoring.checkpoints` is true,
  so a long workflow can be resumed rather than restarted.
- `errorHandling.strategy` controls failure behavior: `abort` (default),
  `continue`, or `rollback` (runs `rollbackSteps` in reverse).

## Validation

```bash
node plugins/github-orchestrator/workflows/validate.mjs
```

Every definition must satisfy the bundled schema: `name` in kebab-case,
`description` 10–500 characters, a valid `type`, and at least one step. CI runs
this alongside `pnpm check:marketplace`.

## Adding a workflow

1. Create `workflows/<name>.json`.
2. Reference agents by their bare file name (`review-synthesizer`), not the
   namespaced frontmatter name.
3. Run `node workflows/validate.mjs`.
4. Add a row to the table above and in `README.md`.

## Related

- [`workflows/README.md`](../workflows/README.md) — authoring guide
- [`/gh:advise`](advise.md) — recommends which workflow to launch
