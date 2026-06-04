---
name: linear:harness-git
intent: Harness Git Experience integration — bidirectional repo sync, signed commits, OAuth, auto-creation, rate-limit best practices, git cache, environments-as-code
tags:
  - linear-orchestrator
  - command
  - harness
  - harness-git-experience
  - git-experience
  - bidir-sync
  - signed-commits
inputs:
  - action
risk: high
cost: medium
description: Harness Git Experience advanced features integrated with Linear sync
---

# /linear:harness-git

Wrapper around Harness **Git Experience** — the GitOps layer that stores Harness entities (pipelines, services, environments, infra) in git and keeps them bidirectionally synced. This command extends `/linear:harness-sync` with the advanced git-side features.

References:
- Overview: https://developer.harness.io/docs/platform/git-experience/git-experience-overview/
- Bidir sync: https://developer.harness.io/docs/platform/git-experience/gitexp-bidir-sync-setup/
- Auto-creation: https://developer.harness.io/docs/platform/git-experience/autocreation-of-entities/
- Signed commits: https://developer.harness.io/docs/platform/git-experience/signed-commits-harness/
- Rate-limit best practice: https://developer.harness.io/docs/platform/git-experience/git-ratelimit-bestpractice/
- Git settings: https://developer.harness.io/docs/platform/git-experience/git-settings/
- OAuth integration: https://developer.harness.io/docs/platform/git-experience/oauth-integration/
- Manage envs/infra: https://developer.harness.io/docs/platform/git-experience/manage-environments-infra-definitions/
- Manage pipeline repo: https://developer.harness.io/docs/platform/git-experience/manage-a-harness-pipeline-repo-using-git-experience/
- Git cache: https://developer.harness.io/docs/platform/git-experience/harness-git-cache/

## Actions

### `enable --account <id> --org <id> --project <id>`
- Turns on Git Experience for the project
- Asks for default repo and branch
- Creates Linear ↔ Harness repo binding so issue-driven changes (via `/linear:harness-sync branch`) flow into the Git Experience pipeline

### `configure --settings-file <yaml>`
Persists project-level git settings via Harness API:
- Default branch / target branch
- Allow direct push vs. PR-only
- Commit message templates (link to Linear issue automatically)
- Harness git settings: https://developer.harness.io/docs/platform/git-experience/git-settings/

### `bidir [--enable | --disable | --status]`
- Enables bidirectional sync (Harness UI ↔ git) so changes from either side reconcile
- The plugin's webhook handler observes git pushes and posts a Linear comment on the linked issue summarising the change
- Reference: https://developer.harness.io/docs/platform/git-experience/gitexp-bidir-sync-setup/

### `autocreate [--scope service|env|infra|pipeline] [--from-issue <id>]`
- Triggers Harness's auto-creation of entities from existing manifests/configs in git
- When `--from-issue <id>` is given, prefills metadata from the Linear issue (description → service description, labels → tags)
- Reference: https://developer.harness.io/docs/platform/git-experience/autocreation-of-entities/

### `sign [--enable | --keys list | --keys add <gpg-key>]`
- Manages Harness signed commits (https://developer.harness.io/docs/platform/git-experience/signed-commits-harness/)
- All commits made by Harness on behalf of Linear-driven actions can be GPG-signed using the configured key
- The plugin records the signing key fingerprint in the Linear issue when signed-commits-only mode is on

### `cache [--prime <repo> | --invalidate <repo> | --status]`
- Operates Harness Git Cache (https://developer.harness.io/docs/platform/git-experience/harness-git-cache/)
- Prime cache before bulk operations to avoid rate-limit hits on the upstream provider
- Reference: https://developer.harness.io/docs/platform/git-experience/git-ratelimit-bestpractice/

### `settings [--get | --set <key=value>]`
- Read/write Harness git settings at account/org/project scope

### `oauth [--connect github|gitlab|bitbucket]`
- Walks through Git Experience OAuth integration flow (https://developer.harness.io/docs/platform/git-experience/oauth-integration/)
- Stores token mapping; rotates on detection of revocation

### `environments [--export | --import] [--scope account|org|project]`
- Manage environment + infra definitions as code via git
- Reference: https://developer.harness.io/docs/platform/git-experience/manage-environments-infra-definitions/

### `pipelines [--repo-link | --repo-unlink | --branch <name>]`
- Manage a Harness pipeline repo using Git Experience
- Reference: https://developer.harness.io/docs/platform/git-experience/manage-a-harness-pipeline-repo-using-git-experience/

### `overview`
- Prints status: Git Experience enabled?, bidir sync active?, signed commits enabled?, cache hit rate, OAuth connectors

## Linear-side fan-out
Every Git Experience event (entity created, signed commit, bidir reconcile) emits a Linear comment on any issue referenced in the commit message (via `ENG-123` smart links). The `harness-linear-bridge` agent owns this fan-out.

## Rate-limit awareness
- Honors the upstream provider's rate limits (GitHub 5K/h, GitLab 600/min) in addition to Harness's own
- Reference: https://developer.harness.io/docs/platform/git-experience/git-ratelimit-bestpractice/
- `lib/harness-bridge.ts` exposes `getGitRateLimit()` and queues writes when budget < 10%

## Security
- All git OAuth tokens stored in Harness Secrets (NEVER in plugin state)
- Signed-commits mode is enforced at the bridge level — bridge refuses to push if signing key is missing
