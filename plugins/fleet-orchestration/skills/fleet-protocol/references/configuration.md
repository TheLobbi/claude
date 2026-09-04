# Configuration

This plugin names no repository, no lane, no path and no person. Everything
fleet-specific lives in one JSON file. A copy with commentary ships as
`config/fleet.config.example.json`; the JSON Schema is
`config/fleet.schema.json`.

## Where the file lives

Resolution order, first hit wins:

1. `$FLEET_CONFIG` — an explicit path, if set.
2. `./fleet.config.json` at the working root.
3. `./.fleet/fleet.config.json`.

If none exists, the `/fleet-orchestration:fleet-start` command writes one
from your answers before anything else happens. **Never proceed on guessed
repo names**: a lane pointed at the wrong repository is the single most
expensive misconfiguration in this system, and it is silent — the lane will
find *something* to do.

## Fields

| Field | Meaning |
|---|---|
| `runId` | Names this run. Used for the run directory name. |
| `logRoot` | Run directory, relative to the config file. Machine-local, never committed. |
| `repoRoot` | Directory holding the sibling repositories, relative to the config file. |
| `worktreeRoot` | Where lanes create per-task worktrees, relative to `repoRoot`. |
| `forge.kind` | `github` today; the CLI verbs live in one place so another forge is a config change. |
| `forge.owner` | Organisation or user that owns the repositories. |
| `defaultBase` | Branch lanes branch from and target, unless a lane overrides it. |
| `lanes[]` | `name`, `repo`, `base?`, `model`, `notes?`. One entry per repo lane. |
| `management[]` | `role`, `model`, `enabled`. The tier-1 roles you are actually running. |
| `models` | Tier defaults: `orchestrator`, `judgement`, `mechanical`, `lane`, `worker`, `verifier`. |
| `heartbeat.intervalMinutes` | How often an active session must append (default 15). |
| `heartbeat.staleMinutes` | Past this, an active session is treated as hung (default 25). |
| `handsOff.repos[]` | Repositories no session touches, for any reason. |
| `handsOff.authors[]` | Authors whose PRs are report-only. |
| `handsOff.pullRequests[]` | Specific PRs excluded for this run (`repo#number`). |
| `founderClass[]` | Decision classes that must escalate rather than proceed. |
| `sharedIdentity` | `true` when every session authenticates as one account — changes how attribution works. |

## `sharedIdentity`

Set this honestly. When it is `true`:

- The `author` field on a PR **cannot** discriminate between lanes. It answers
  "is this ours", never "which lane".
- Approval badges are structurally unavailable — a session cannot approve a PR
  its own credential authored. Verdicts are posted as PR **comments**, and the
  merge gate reads the comment, not the badge.
- Ownership is **not derivable** from git or forge state. It must be recorded
  at the moment it is created: the planner writes issue → lane when it
  assigns, and the lane writes branch → issue in the same action as opening
  the PR. Two independent parties write the record at the two moments that
  matter, so a double assignment is visible when the second claim is made
  rather than discovered once two worktrees exist.

A later self-report cannot substitute for that record. It has a hole exactly
where you need it most: at a collision, the losing lane reverted with zero
commits and has nothing to point at.

## Adding a second lane to one repo

A repo whose admissible queue is long may get a second lane. The split is by
**file space**, named and confirmed by the planner **before** the second
lane's first edit. Agent teams lock task claims, not file edits — two
sessions editing one file overwrite each other silently.

## Changing the config mid-run

Append the change to the run's queue log with a number, the way every other
ruling in the run is recorded. A configuration that changes without a record
makes every earlier claim unscoped, because nobody can tell which config a
past measurement was taken under.
