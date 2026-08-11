# Workflows

Declarative multi-agent workflow definitions for `github-orchestrator`, validated
against [`schema/workflow.schema.json`](schema/workflow.schema.json).

```bash
node plugins/github-orchestrator/workflows/validate.mjs
```

## Definitions

| File | Type | Inputs | Purpose |
| --- | --- | --- | --- |
| `pr-delivery.json` | sequential | `goal`, `baseBranch`, `autoMerge` | Goal → branch → implement → PR → review → green → merge |
| `review-board.json` | parallel | `prNumber`, `quorum`, `post` | Six lenses, adversarial verification, synthesis |
| `ci-drive-to-green.json` | adaptive | `prNumber`, `maxRounds` | Classify → fix → push → re-check, until green |
| `issue-triage.json` | conditional | `issueNumber`, `apply` | Dedup → classify → security gate → route or decompose |
| `merge-train.json` | hierarchical | `rootPr`, `pauseOnRed` | Order a stack, land, retarget and rebase descendants |
| `security-sweep.json` | parallel | `severityFloor`, `fileIssues` | Four scans, then rank by reachability |
| `release-train.json` | sequential | `bump`, `prerelease`, `publish` | Semver → gates → changelog → notes → tag |

## Running

```bash
/gh:workflow list
/gh:workflow show review-board
/gh:workflow run review-board --input prNumber=482
/gh:workflow run release-train --dry-run
```

## Authoring

1. Create `<name>.json` in this directory.
2. `name` must be kebab-case; `description` must be 10–500 characters; `type`
   must be one of `sequential`, `parallel`, `hierarchical`, `mesh`, `adaptive`,
   `group-chat`, `conditional`; there must be at least one step.
3. Reference agents by their **bare file name** (`review-synthesizer`), not the
   namespaced frontmatter name (`github-orchestrator:review-synthesizer`).
4. Run `node workflows/validate.mjs`.
5. Add a row to the table above, to `README.md`, and to `commands/workflow.md`.

### Referencing values

| Expression | Resolves to |
| --- | --- |
| `$.input.<name>` | A workflow input |
| `$.steps.<stepId>.<output>` | A named output of a prior step |
| `$.loop.<variable>` | The current item inside a `loop` step |
| `$.output` | The whole return value of the current step's agent |

### Choosing a type

Default to the least synchronized shape that works.

- **`parallel` with a barrier** only when a later step genuinely needs *all*
  prior results together — deduplicating across scanners, or an early exit on
  zero findings. `security-sweep`'s `rank` step is the intended example, and the
  definition says so in its `description`.
- **`adaptive`** for loops with a convergence condition. Always cap the rounds;
  `ci-drive-to-green` caps at `maxRounds` and additionally stops when the same
  failure survives two consecutive fix attempts, because a third guess at a
  wrong diagnosis will not help either.
- **`hierarchical`** when a coordinator must own ordering and synthesis, as in
  `merge-train`, where each landing changes the next step's inputs.

### Error handling

`errorHandling.strategy` is `abort` (default), `continue`, or `rollback`.

Use `abort` when a failed step makes later steps meaningless — `pr-delivery`
aborts because reviewing an unimplemented change is pointless. Use `continue`
for surveys where partial results still have value. `rollback` runs
`rollbackSteps` in reverse; `release-train` uses it to plan a rollback if
publication fails partway.

## Checkpoints

With `monitoring.checkpoints` true, step outputs are recorded so a long workflow
can resume rather than restart:

```bash
/gh:workflow run merge-train --from land
```
