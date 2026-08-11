# Connectivity

Every way something reaches GitHub, what each path can and cannot do, and how
each one fails. `/gh:setup` detects all of this; this document explains it.

## Two independent channels

The most common diagnostic mistake is treating GitHub access as one boolean.
It is two:

| Channel | Carries | Credentials that work |
| --- | --- | --- |
| **Git transport** | clone, fetch, push | SSH key, deploy key, PAT over HTTPS, credential helper, session proxy |
| **API** | issues, PRs, checks, projects, everything else | PAT, App token, OAuth, `GITHUB_TOKEN` |

A session can clone a repository perfectly and have no API access to it. An SSH
key never grants API access at all. When something works and something else
does not, establish which channel is failing before changing any credential.

## Connection paths

| Path | Endpoint / mechanism | Auth | Notes |
| --- | --- | --- | --- |
| MCP — remote | `https://api.githubcopilot.com/mcp/` | OAuth or PAT | Default in Claude Code on the web. Managed updates |
| MCP — remote, enterprise | `https://copilot-api.<tenant>.ghe.com/mcp` | PAT or OAuth | Data-residency tenants. The public endpoint 404s here |
| MCP — local | Local process | PAT via env | Offline-capable, self-managed, toolset flags available |
| `gh` CLI | Local binary | `gh auth login` | **Not available** in web / remote execution |
| REST API | `api.github.com` | Any API credential | Versioned via `X-GitHub-Api-Version` |
| GraphQL API | `api.github.com/graphql` | Any API credential | Required for some Projects mutations |
| Webhooks | Inbound to you | Signature secret | Push model — events arrive, you do not poll |
| Actions | Inside a run | `GITHUB_TOKEN` / OIDC | Governed by `permissions:` |
| Session git proxy | Remote-execution proxy | Managed | Transport may work while API does not |

### MCP: remote vs local

| | Remote | Local |
| --- | --- | --- |
| Auth | OAuth (scopes approved at sign-in) or PAT | PAT only |
| Scope control | OAuth limits to approved scopes | Whatever the PAT carries |
| Updates | GitHub manages | You manage |
| Toolset narrowing | Per-toolset flags | `--toolsets`, `GITHUB_TOOLSETS` |
| Read-only mode | Built-in switch | `--read-only` |
| Air-gapped | No | Yes |

Prefer **OAuth** where the host supports it — a PAT hands the server everything
the token carries, while OAuth grants only what was approved. Some organizations
disable PAT auth for the MCP server, making OAuth the only path.

`--read-only` is a real capability boundary, not a prompt instruction: write
tools are never exposed. It suits advisory sessions and pairs with `gh-advisor`,
whose disallowed-tools list already forbids mutation.

Narrowing toolsets is also the cheapest way to cut tool-schema context cost.

## Credential capability matrix

| | Classic PAT | Fine-grained PAT | App installation | App user token | `GITHUB_TOKEN` | OAuth (MCP) |
| --- | --- | --- | --- | --- | --- | --- |
| Repo read/write | Yes | Yes | Yes | Yes | Per `permissions:` | Per grant |
| Cross-repo | All in scope | Only granted repos | Per installation | Per user access | This repo | Per grant |
| Org projects (REST) | Yes | Yes, `Projects` perm | Yes | Yes | **No writes** | Per grant |
| **User projects (REST)** | Yes | **No** | **No** | **No** | No | — |
| Triggers further workflows | Yes | Yes | Yes | Yes | **No** | — |
| Expiry | Optional | ≤ 1 year | ~1 hour | ~8 hours | The job | Session |
| Survives offboarding | No | No | **Yes** | No | Yes | No |

Two rows deserve attention:

**User-owned Projects endpoints reject every modern token type.** A 403 there is
a credential-*type* failure; re-scoping will never fix it. Org-owned projects
are the only ones automation can drive.

**`GITHUB_TOKEN` cannot trigger further workflows.** A push or PR made with it
does not fire `push` or `pull_request` events — deliberate loop protection. If a
follow-on workflow must run, use a GitHub App token, and understand you have
re-armed the loop.

## Choosing a credential

```
Inside Actions?
├── Talking to GitHub?     → GITHUB_TOKEN + narrowed permissions:
├── Talking to a cloud?    → OIDC (id-token: write), never a stored cloud key
└── Cross-repo?            → GitHub App installation token

Outside Actions?
├── Long-lived automation  → GitHub App installation token
├── Acting as a human      → App user access token
└── Local dev / agent      → fine-grained PAT, minimum permissions
```

**Prefer a GitHub App for anything outliving a session.** Installation tokens
expire hourly, are scoped per repository, are revocable without touching a human
account, and survive offboarding. A PAT in a shared secret is an outage waiting
for someone's last day.

## Failure decoder

| Symptom | Cause |
| --- | --- |
| `401 Bad credentials` | Wrong, revoked, or expired token |
| `403 Resource not accessible by integration` | Missing *permission*, not scope. Read `X-Accepted-GitHub-Permissions` — it names exactly what was needed |
| `404` on a repo you know exists | Almost always **unauthorized**. GitHub 404s private resources rather than confirming them |
| `403 ... SAML enforcement` | Token needs SSO authorization for that org |
| `403` from an unlisted address | Org IP allow list. App installations can be configured to bypass it |
| 403 on a **user-owned** project | Credential type, not permission level |
| Works locally, 403 in Actions | The `permissions:` block, not the credential |
| Clone works, API 403 | Two channels — transport is fine, API credential is not |
| Enterprise MCP 404 | Pointed at the public endpoint instead of the tenant endpoint |
| Bot push does not trigger CI | `GITHUB_TOKEN` loop protection, working as designed |
| Projects list stuck at 30 items | Cursor pagination treated as page-number pagination |

## Repository scope in this environment

GitHub access is scoped to repositories attached to the session. Calls to
unattached repositories are denied.

Do **not** pre-check a repository with `curl` or `git ls-remote` before
attaching it — unauthenticated requests 404 on private repositories that are
genuinely reachable, and that false negative will lead you to report a real
repository as missing. Attach it, then let the failure (if any) be authoritative.

## See also

- [`github-auth`](../skills/github-auth/SKILL.md) — credential model in depth
- [`gh-mcp`](../skills/gh-mcp/SKILL.md) — tool map and pitfalls
- [`/gh:setup`](../commands/setup.md) — automated detection and capability probe
