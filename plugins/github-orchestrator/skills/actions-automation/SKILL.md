---
name: actions-automation
description: This skill should be used when building automation on GitHub Actions beyond CI — manual and external triggers, scheduled jobs, reusable workflows, composite actions, issue and PR bots, auto-merge, and Dependabot.
version: 1.0.0
trigger_phrases: [workflow_dispatch, repository_dispatch, reusable workflow, composite action, scheduled workflow, cron, auto-merge, dependabot, github-script, label automation, bot workflow]
categories: [github-actions, automation, ci-cd, workflow]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# Actions as an Automation Platform

CI is one use of Actions. The automation surface is much wider, and most of it
replaces work people do by hand.

## Trigger taxonomy

| Trigger | Fires on | Notes |
| --- | --- | --- |
| `workflow_dispatch` | Manual — UI, `gh workflow run`, REST | Typed inputs. **Workflow must be on the default branch** |
| `repository_dispatch` | External POST to the API | Custom `event_type` (≤100 chars) + `client_payload`. **Default branch only** |
| `schedule` | Cron (UTC) | Shortest interval 5 min; disabled after ~60 days of repo inactivity; runs late under load — never assume punctuality |
| `issues`, `issue_comment` | Issue lifecycle | `issue_comment` fires for **PR comments too** — filter on `github.event.issue.pull_request` |
| `pull_request` | PR lifecycle | Fork PRs: read-only token, no secrets |
| `pull_request_target` | Same, in **base** context | Has secrets. Never check out the PR head |
| `workflow_run` | Another workflow finished | The safe way to act on a fork PR's result |
| `merge_group` | Merge queue speculative merge | Required checks must handle this event or the queue stalls |
| `projects_v2_item` | Project item changed | Board-driven automation |
| `release`, `push` (tags) | Publication | |
| `workflow_call` | Invoked by another workflow | Reusable workflows |

### Typed `workflow_dispatch` inputs

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        type: environment        # renders a real picker
        required: true
      logLevel:
        type: choice
        options: [info, warning, debug]
        default: warning
      dryRun:
        type: boolean
        default: true
```

`type: environment` and `type: choice` give a usable UI instead of a free-text
box someone will typo.

### External triggering

```bash
# repository_dispatch — from anything outside GitHub
gh api repos/OWNER/REPO/dispatches \
  -f event_type=deploy_requested \
  -F client_payload='{"env":"staging","sha":"abc123"}'
```

`client_payload` lands in `github.event.client_payload`. It is **untrusted
input** — never interpolate it into a `run:` block.

## The two-workflow pattern for fork PRs

The safe way to run privileged work on a fork PR is not
`pull_request_target` — it is two workflows:

```
workflow A: on: pull_request        → untrusted code, no secrets, uploads an artifact
workflow B: on: workflow_run        → base context, has secrets, downloads the artifact
```

Workflow B never executes fork code; it only reads its output. This is the
pattern that lets a fork PR get a coverage comment without handing it a token.

## Reusable workflows vs composite actions

| | Reusable workflow | Composite action |
| --- | --- | --- |
| Unit | A whole job (or several) | A group of steps |
| Called by | `jobs.<id>.uses:` | `steps.uses:` |
| Runner | Defines its own | Runs on the caller's |
| Secrets | Explicit `secrets:` or `secrets: inherit` | Inherits the step env |
| Nesting | Up to 4 levels | Up to 10 |

Rule of thumb: **a job is a reusable workflow, a step sequence is a composite
action.** Wrapping three steps in a reusable workflow costs a runner spin-up for
nothing.

```yaml
jobs:
  build:
    uses: org/.github/.github/workflows/build.yml@v1
    with: { node-version: '22' }
    secrets: inherit
```

Pin reusable workflows and third-party actions to a **commit SHA**, with the
version in a trailing comment. Tags are mutable.

## Bot workflows

The highest-value automations, in rough order of payoff:

| Automation | Trigger | Replaces |
| --- | --- | --- |
| Label by changed path | `pull_request` | Manual triage |
| Stale issue/PR sweep | `schedule` | Backlog rot |
| Auto-assign reviewers | `pull_request` | CODEOWNERS gaps |
| Add new issues to a project | Issue form `projects:` key first, else `issues` | Manual board grooming |
| Release drafting | `push` to default | Hand-written notes |
| Auto-merge Dependabot patches | `pull_request` + auto-merge | Dependency toil |
| PR size / convention checks | `pull_request` | Review nitpicks |

`actions/github-script` is the right tool for small logic — it gives an
authenticated Octokit without a separate action or a `curl` with a hand-rolled
JSON body.

```yaml
- uses: actions/github-script@<sha>  # v7
  with:
    script: |
      const size = context.payload.pull_request.additions
                 + context.payload.pull_request.deletions;
      if (size > 400) {
        await github.rest.issues.addLabels({
          ...context.repo, issue_number: context.issue.number,
          labels: ['size/L']
        });
      }
```

## Auto-merge

`enable_pr_auto_merge` merges a PR once its gates pass, rather than merging now.
It respects branch protection — auto-merge is not a bypass, and a PR whose
required checks never report will simply sit there.

Pair it with Dependabot for patch and security updates. Do **not** auto-merge
majors: a major that passes CI can still change behavior no test covers.

## Dependabot

`.github/dependabot.yml` handles version and security updates, and also updates
`github-actions` itself — which is how pinned action SHAs stay current instead
of rotting:

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: "/"
    schedule: { interval: weekly }
    groups:
      actions: { patterns: ["*"] }
  - package-ecosystem: npm
    directory: "/"
    schedule: { interval: weekly }
    groups:
      minor-and-patch:
        update-types: [minor, patch]
```

Grouping is what makes Dependabot usable — ungrouped it opens a PR per package
and the team stops reading them.

## Concurrency

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```

Never cancel in progress on the default branch — that kills the run gating
deploys. For deploy workflows, use a shared group with `cancel-in-progress:
false` so deploys queue rather than overlap.

## Debugging

`gh run watch` · `gh run view --log-failed` · re-run failed jobs only · enable
step debug with the `ACTIONS_STEP_DEBUG` secret. From an agent, use
`get_job_logs` with `failed_only` — see `ci-forensics`.

## See also

- `actions-authoring` — security, cost, and caching
- `github-agents` — running AI agents as Actions workflows
- `github-auth` — `GITHUB_TOKEN`, OIDC, and why bot pushes do not retrigger
