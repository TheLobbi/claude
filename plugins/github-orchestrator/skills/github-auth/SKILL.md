---
name: github-auth
description: This skill should be used when choosing, diagnosing, or configuring how something authenticates to GitHub — personal access tokens, GitHub Apps, OAuth, SSH and deploy keys, GITHUB_TOKEN in Actions, OIDC, and the permission model each one carries.
version: 1.0.0
trigger_phrases: [github auth, personal access token, PAT, github app, installation token, GITHUB_TOKEN, OIDC, deploy key, 403 forbidden, resource not accessible by integration, SAML SSO]
categories: [github, authentication, security, setup]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# GitHub Authentication

Every credential type below carries a different permission model, a different
blast radius, and a different failure message. Picking the wrong one is the most
common reason a working script fails in CI.

## The credential types

| Type | Identity | Expiry | Scope model | Use for |
| --- | --- | --- | --- | --- |
| **Classic PAT** | The user | Optional | Coarse OAuth scopes (`repo` = all repos, read+write) | Legacy, and the few APIs fine-grained tokens still cannot reach |
| **Fine-grained PAT** | The user | Required, max 1 year | Per-repo + per-permission (`contents: read`) | The default for a human or a local agent |
| **GitHub App installation token** | The app, on an installation | 1 hour | Per-permission, per-installation | Automation, bots, anything long-lived |
| **GitHub App user access token** | The user, via the app | 8 hours (refreshable) | Intersection of app permissions and user access | Acting *as the user* through an app |
| **OAuth App token** | The user | None by default | Coarse OAuth scopes | Legacy third-party integrations |
| **`GITHUB_TOKEN`** | `github-actions[bot]` | The job | `permissions:` in the workflow | Anything inside Actions |
| **OIDC (`id-token`)** | The workflow, cryptographically | Per-request | Trust policy on the cloud side | Cloud auth from Actions — no stored secret |
| **SSH key** | The user | None | Full git access as the user | Git transport only, never the API |
| **Deploy key** | One repository | None | Read or read/write, one repo | CI clone of a single repo |

## Choosing

```
Running inside GitHub Actions?
├── Talking to GitHub?          → GITHUB_TOKEN with a narrowed permissions: block
├── Talking to a cloud provider? → OIDC (id-token: write), never a stored cloud key
└── Need cross-repo access?     → GitHub App installation token, not a PAT

Running outside Actions?
├── Long-lived automation / bot → GitHub App installation token
├── Acting as a specific human  → GitHub App user access token
└── Local dev or a local agent  → fine-grained PAT, minimum permissions
```

**Prefer a GitHub App over a PAT for anything that outlives a session.** An
installation token expires in an hour, is scoped per repository, is revocable
without touching a human account, and does not die when its creator leaves the
organization. A PAT in a shared secret is an outage waiting for someone's
offboarding.

## `GITHUB_TOKEN` and `permissions:`

The default token scope is far wider than any single workflow needs. Declare
`permissions:` explicitly — a workflow-level floor, narrowed per job.

```yaml
permissions:
  contents: read          # floor for the whole workflow

jobs:
  release:
    permissions:
      contents: write     # only this job can write
      id-token: write     # OIDC
```

Known behaviors that cause confusion:

- **`GITHUB_TOKEN` cannot trigger further workflows.** A push or PR made with it
  does not fire `push` or `pull_request` events. This is deliberate loop
  protection. If you need the follow-on workflow to run, use a GitHub App token
  or a PAT — and understand you have re-armed the loop.
- **Fork PRs get a read-only token and no secrets** on `pull_request`. That is
  the security boundary, not a bug.
- **`pull_request_target` runs with the base repo's token and secrets.** Never
  combine it with a checkout of the PR head — that hands a fork write-scoped
  secrets. This is the single most exploited Actions misconfiguration.

## Fine-grained tokens: the gaps

Fine-grained PATs are the right default, but they are not a superset of classic:

- Some endpoints still require a classic token — notably parts of the **Projects
  API for user-owned projects**, which reject fine-grained PATs, App user
  tokens, *and* installation tokens outright.
- Organization resources require the org to have **enabled** fine-grained tokens,
  and may require per-token approval by an owner.
- A fine-grained token must be explicitly granted each repository. "It works on
  my repo" and "it works on the org's repo" are different questions.

## Reading the failure

| Error | Almost always means |
| --- | --- |
| `401 Bad credentials` | Token is wrong, revoked, or expired |
| `403 Resource not accessible by integration` | The App/token lacks the *permission*, not the scope. Check the App's permission set |
| `403` with `X-Accepted-GitHub-Permissions` header | The header names exactly what was needed — read it |
| `404` on a repo you know exists | Almost never missing — it is **unauthorized**. GitHub 404s private resources rather than confirming they exist |
| `403 ... SAML enforcement` | The token needs SSO authorization for that org, done in token settings |
| `422` on a write | Payload problem, not auth |
| Works locally, 403 in Actions | `permissions:` block, or the default token, not a credential problem |

**The 404-means-403 behavior matters for agents.** Never conclude a repository
does not exist from a 404 on an unauthenticated or under-scoped request. Attach
the repo properly and retry before reporting it missing.

## SAML SSO and IP allow lists

In an org with SAML enforced, a valid token still fails until it is
**authorized** for that org. In an org with an IP allow list, a token from an
unlisted address fails regardless of permissions — GitHub App installations can
be configured to bypass the list, which is one more reason to prefer them for
automation.

## Git transport vs API

They are separate. An SSH key clones and pushes; it cannot call the API. A PAT
can do both (over HTTPS). A deploy key is scoped to one repository and is the
right answer for a CI clone that should not be able to reach anything else.

Never use a personal SSH key or PAT as a shared CI credential — the audit trail
becomes useless and revocation breaks a human.

## Storage

- Never in source, config, or a PR body. The guard hook blocks credential-shaped
  strings for this reason.
- Actions: repository/environment secrets, or OIDC so there is no secret at all.
- Local: the OS credential helper or `gh auth login`, not `.netrc` in plaintext.
- **A secret that reaches a remote is compromised** — rotate first, clean up
  second. See `supply-chain-security`.

## See also

- `gh-mcp` — how the MCP server authenticates and what it can reach
- `actions-authoring` — `permissions:`, OIDC, and injection
- `../commands/setup.md` — detection and degraded-mode reporting
