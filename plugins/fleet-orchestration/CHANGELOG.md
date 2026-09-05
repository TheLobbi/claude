# Changelog

All notable changes to the `fleet-orchestration` plugin.

## 1.1.0

The protocol as a tool. Discipline that costs turns slows a fleet down; this
release removes the turns.

### `scripts/fleet.mjs`

A zero-dependency CLI, eleven subcommands, each replacing a ritual a session
used to spend several turns on by hand, with the governing evidence rule
built in so it cannot be skipped:

- `hb` — heartbeat validated on write; refuses the malformations that
  produced a false "alive", including the two observed only at compose time
  (an interpolated newline splitting an entry; a CRLF tail). **Prints on every
  branch and reads the line back before reporting success.** A shared helper
  that no-ops quietly is worse than twenty lanes appending by hand, because
  it fails them all in the same silent way — and a heartbeat fails in the
  direction that gets a producing lane replaced. "Not written", "denied" and
  "skipped" leave identical bytes; only the read-back distinguishes them.
  Self-test includes a mutation showing an append that leaves nothing behind
  is caught only by the read-back.
- `register` — registry row and first heartbeat in one action, each read
  back; a half-landed registration is reported as PARTIAL, naming which half.
- `census` — every lane's age, state and class; malformed lines counted;
  candidates get the artifact-read command printed beside them.
- `blockers` — **the waiter's check**: reads a lane's `waiting` heartbeats,
  asks the forge whether each named PR/issue has cleared, exits 1 when the
  lane can move. Against the source run's live data it found 8 of 11 refs
  already cleared for the lane that idled 68 minutes on a merged PR.
- `checks` — head read fresh; rollup grouped by run id, newest wins; entries
  read by `__typename` (`CheckRun.conclusion` vs `StatusContext.state`); a
  second reading via `gh pr checks`; skipped lanes named; `mergeStateStatus`
  printed and labelled never-readiness. Exit 0 only on GREEN with both
  readings agreeing.
- `verdicts` — posted APPROVE/BLOCK comments whose head has moved.
- `unblocks` — after a merge, both audiences: lanes waiting on it, and open
  PRs whose files it touched.
- `queue-depth` — CI load in **jobs**, not runs.
- `digest` — the router's digest from the logs, watermark-based.
- `init`, `doctor`.

`--self-test` proves the pure logic on fixtures — the double-run rollup, the
mixed-type rollup, the empty-string conclusion — with two mutations showing
grouping and the type switch are each load-bearing.

### Commands

Three added, all thin wrappers: `fleet-blockers`, `fleet-checks`,
`fleet-unblocks`. `fleet-start` now runs `doctor` and `init`; `fleet-census`
runs `census` then `blockers`; `fleet-decisions` gathers via `digest`.

### Roles and config

`fleet-roles` gains *Where the velocity comes from*: a table of measured
losses in the source run and the mechanism that removes each. Config gains a
`review` block — `parallelReviewers` (two from the start above four lanes)
and `peerRoutableGlobs` (mechanical PRs to a peer lane that has run the same
gate). Every agent file names the commands it runs.

## 1.0.0

First release. Packages the multi-session orchestration system from a
continuous multi-repository run, as configuration-driven components that name
no repository, lane, path, organisation or person.

### Skills

- **`fleet-protocol`** — the contract: session-mode topology, registration and
  addressing through a dispatch router, heartbeats and standby, ASSERTED vs
  DELIVERED, git discipline, review routing, the four-part PR body, merge
  readiness, escalation. Four references: configuration, git discipline
  (each rule with the incident behind it), merge discipline, run directory.
- **`evidence-rules`** — one central claim with ten sightings, not a list:
  *a wrong predicate and a missing notification both produce a plausible,
  quiet, checkable-looking state; neither raises an error; and the only
  defence in both is a second reading through a different mechanism.* Two
  media (tooling: the raw print through a different field; coordination:
  measuring the thing you wait on), the auditable/unauditable asymmetry that
  says which half of a paired rule to invest in, and every rule carrying the
  incident that produced it **and its "does not bite" clause**.
- **`heartbeat-monitor`** — staleness thresholds, the three silence classes,
  the artifact-before-silence rule, and the replacement handover.
- **`fleet-roles`** — role catalogue, RACI, and the descending-model rule.

### Agents

Ten role definitions, each naming its model: `fleet-planner`,
`fleet-reviewer`, `fleet-gitops`, `fleet-conflicts`, `fleet-dispatch`,
`fleet-release`, `fleet-brainstorm` (management), `fleet-lane` (repo lane
template), `fleet-worker` and `fleet-verifier` (dispatchable subagents).

Every management and lane file states in its own body that the role normally
runs as **its own session**, because it must heartbeat and be woken by
messages — a foreground subagent call blocks the caller's turn entirely.

### Commands

`fleet-start`, `fleet-census`, `fleet-decisions`.

### Configuration

`config/fleet.config.example.json` and `config/fleet.schema.json`. Repository
list, lane names, bases, model tiers, hands-off sets, founder-class decision
list, heartbeat thresholds.

### Scripts and docs

`scripts/heartbeat.ps1` and `scripts/heartbeat.sh` **removed in 1.1.0**.
Neither read its line back, the PowerShell one wrote CRLF by construction —
the tail defect in `hb`'s own fixture set — and since only one shim runs per
machine the divergence was invisible from any single host. Claude Code is a
Node application, so every host running a lane has Node; `fleet hb` is the
one writer. (1.0.0 shipped them as concurrent-safe appends per host.) `scripts/validate-heartbeat.mjs` — a gate for the heartbeat line
format, with `--self-test` proving six red inputs, six spare inputs and two
mutations each breaking exactly its own case. It exists because three
sessions produced three different malformations of that one format in one
evening; a convention needing three manual repairs should have shipped with a
gate. `docs/platform-notes.md` — host-specific traps, kept as documented
guidance rather than protocol assumptions. `docs/optional-hooks.md` —
copy-paste hooks; **the plugin ships none active**, because a plugin hook is
live the moment the plugin is enabled.

### Corrected before release

The check-state predicate shipped in `merge-discipline.md` and
`fleet-gitops.md` was replaced twice during authoring, as two successive
"fixes" for the same question each turned out to be defective. The final text
ships the current best predicate while stating that the predicate is not the
defence — the raw print beside the decision is.
