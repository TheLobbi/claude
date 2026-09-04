# Changelog

All notable changes to the `fleet-orchestration` plugin.

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
- **`evidence-rules`** — ten rules for claims that survive being checked,
  each carrying the incident that produced it **and its "does not bite"
  clause. Includes the two shapes that catch what the other eight miss:
  *what does this artifact sit on, and did that move* and *where a predicate
  decides whether to stop, print the raw state beside the decision*.
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

`scripts/heartbeat.ps1` and `scripts/heartbeat.sh` — concurrent-safe append
per host. `scripts/validate-heartbeat.mjs` — a gate for the heartbeat line
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
