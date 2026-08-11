---
name: gh:project
intent: Read and update GitHub Projects boards, fields, and items across the REST and GraphQL surfaces
tags:
  - github-orchestrator
  - command
  - projects
inputs:
  - action
  - project
  - flags
risk: medium
cost: medium
description: Inspect a Projects board, add and update items, resolve field and option IDs, and audit board hygiene — choosing the REST or GraphQL surface per operation and reporting token-type limits
---

# /gh:project

## Usage

```
/gh:project list                          # projects for the org or user
/gh:project show 5                        # fields, views, item counts
/gh:project fields 5                      # field + option IDs (what automation needs)
/gh:project add 5 --issue 214             # add an issue or PR to the board
/gh:project set 5 --item <id> --field Status --value "In Progress"
/gh:project sync 5                        # add anything tracked but missing
/gh:project audit 5                       # board hygiene
```

## Which API surface

Projects was GraphQL-only for years and much published advice still says so.
It is not: there is now a REST surface at `/orgs/{org}/projectsV2/...` and
`/users/{username}/projectsV2/...` (API version `2026-03-10`).

| Operation | Surface used |
| --- | --- |
| List fields, list items | REST — plain JSON, no fragments |
| Update an item field value | GraphQL — `updateProjectV2ItemFieldValue` |
| Add an item | GraphQL — `addProjectV2ItemById` |
| One round trip across project + items + content | GraphQL |

REST responses carry `node_id` (`PVT_…`, `PVTF_…`), which is the GraphQL ID —
read with REST, mutate with GraphQL using the ID it returned.

## The token trap

This command checks credential type **before** reporting a permission problem,
because the most confusing Projects failure is not about permissions:

| Endpoint family | Fine-grained PAT | App user token | Installation token |
| --- | --- | --- | --- |
| `/orgs/{org}/projectsV2/…` | Yes, with `Projects` org permission | Yes | Yes |
| `/users/{user}/projectsV2/…` | **No** | **No** | **No** |

User-owned project endpoints reject all three. A 403 on a user-owned project is
a *credential-type* failure — no amount of re-scoping fixes it. Org-owned
projects are the only ones automation can drive with modern tokens, and
`/gh:project` says so explicitly rather than suggesting you widen a token that
will never work.

## `fields` — the step everything else needs

Single-select options and iterations have their own IDs. You cannot set a status
by name; the option ID must be resolved first. `fields` is therefore the first
call in nearly every Projects automation:

```
/gh:project fields 5

Status            single_select   PVTSSF_lADO…
  Todo            option_4
  In Progress     option_5
  Done            option_6
Sprint            iteration       PVTIF_lADO…
  Sprint 24       iter_11   2026-08-04  14d   ← current
Story points      number          PVTF_lADO…
Parent issue      (built-in)
Sub-issue progress (built-in)
```

## `audit`

Board hygiene, ranked by what actually causes bad planning data:

- Items with no `Status` — invisible to every view filtered on status
- Items in a terminal status whose issue is still open, and the reverse
- Draft issues older than `staleAfter` that were never converted
- Closed issues still sitting in an active column
- Items whose repository is no longer accessible
- Fields defined but never populated on any item
- **Automation that duplicates a built-in workflow**

That last one pays for the command. Projects has built-in workflows — auto-add
matching items, set status on close, auto-archive, add sub-issues to the
parent's project. A large share of hand-written Actions project automation
reimplements "set Status to Done when the issue closes", which is a checkbox
that needs no token, no minutes, and no maintenance. The audit names those and
points at the checkbox.

## Prefer configuration over automation

Before writing anything:

1. **Issue forms** can set the type and add to boards with two keys —
   `type: bug` and `projects: ["octo-org/1"]`. No workflow needed.
2. **Built-in project workflows** cover most status transitions.
3. Only then reach for Actions — and authenticate with a **GitHub App**
   installation token, since `GITHUB_TOKEN` cannot write to org projects at all.

## Pagination

Projects endpoints use **cursor** pagination (`before`/`after` from the `Link`
header), not `page`. Code that increments a page number returns page one
forever, which reads as "the board only has 30 items".

## Related

- [`github-projects`](../skills/github-projects/SKILL.md) — the API knowledge
- [`github-issue-model`](../skills/github-issue-model/SKILL.md) — what the board tracks
- [`/gh:backlog`](backlog.md) — prioritization over the same items
