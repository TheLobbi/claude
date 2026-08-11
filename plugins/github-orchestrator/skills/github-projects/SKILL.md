---
name: github-projects
description: This skill should be used when reading or writing GitHub Projects (v2) — the REST and GraphQL surfaces, field types and their IDs, item lifecycle, built-in workflows, and the token types each endpoint accepts.
version: 1.0.0
trigger_phrases: [github projects, projectsV2, ProjectV2, project board, project field, iteration field, single select, add to project, project automation]
categories: [github, projects, planning, api]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# GitHub Projects (v2)

## There are now two APIs — pick deliberately

For years Projects v2 was **GraphQL only**, and a lot of tooling and advice
still says so. That is no longer true: GitHub shipped a REST surface under
`/orgs/{org}/projectsV2/...` and `/users/{username}/projectsV2/...`
(API version `2026-03-10`).

| Use REST when | Use GraphQL when |
| --- | --- |
| Listing fields or items | Mutating item field values |
| Simple reads from a script or shell | You need one round trip across project + items + content |
| You want plain JSON without fragments | You need types REST has not exposed |

```bash
# REST — list org project fields
curl -L -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  https://api.github.com/orgs/ORG/projectsV2/NUMBER/fields
```

**Verify which surface a given operation supports before assuming.** The REST
surface is newer and does not mirror GraphQL one-for-one.

### The token trap

This is the sharpest edge in the whole Projects API:

| Endpoint family | Fine-grained PAT | App user token | Installation token |
| --- | --- | --- | --- |
| `/orgs/{org}/projectsV2/...` | Yes — needs `Projects` org permission (read or write) | Yes | Yes |
| `/users/{user}/projectsV2/...` | **No** | **No** | **No** |

User-owned project endpoints reject all three fine-grained token types. If a
Projects call fails with 403 and the project is user-owned, the credential type
is the cause — not the permission level. Org-owned projects are the only ones
automation can drive with modern tokens.

## Identifiers

Projects carry three different kinds of ID, and mixing them is the second most
common failure:

| ID | Looks like | Where it works |
| --- | --- | --- |
| Project **number** | `5` | URLs and REST paths (`/projectsV2/5`) |
| **Node ID** | `PVT_kwDOA...`, `PVTF_lADO...` | GraphQL, and returned as `node_id` in REST |
| Field/item integer `id` | `12345` | REST paths only |

REST responses include `node_id`, which is the bridge — read with REST, mutate
with GraphQL using the `node_id` it handed you.

## Field types

`text` · `number` · `date` · `single_select` · `iteration`
(plus the built-in `Title`, `Assignees`, `Status`, `Labels`, `Milestone`,
`Repository`, `Linked pull requests`, and the parent/sub-issue progress fields).

Single-select options and iterations have their **own IDs**. You cannot set a
status by name — you must resolve the option ID first. That two-step is
unavoidable and is why almost every Projects automation starts with a field
query:

```bash
gh api graphql -f query='
  query($org: String!, $number: Int!) {
    organization(login: $org) {
      projectV2(number: $number) {
        id
        fields(first: 20) {
          nodes {
            ... on ProjectV2Field { id name }
            ... on ProjectV2SingleSelectField { id name options { id name } }
            ... on ProjectV2IterationField {
              id name configuration { iterations { id title startDate duration } }
            }
          }
        }
      }
    }
  }' -f org=ORG -F number=NUMBER
```

`fields` returns a **union**, so inline fragments (`... on`) are mandatory.
`ProjectV2FieldCommon` gets you just `id`/`name` across all types when that is
all you need.

## Items

An item's `content` is a `DraftIssue`, an `Issue`, or a `PullRequest` — also a
union, also requiring fragments. Draft issues exist only inside the project and
have no repository; converting one to a real issue changes its content type but
keeps the item.

```graphql
mutation($project: ID!, $content: ID!) {
  addProjectV2ItemById(input: {projectId: $project, contentId: $content}) {
    item { id }
  }
}
```

```graphql
mutation($project: ID!, $item: ID!, $field: ID!, $option: String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $project, itemId: $item, fieldId: $field,
    value: { singleSelectOptionId: $option }
  }) { projectV2Item { id } }
}
```

Multiple field updates can be aliased into **one** mutation — do that rather
than firing N round trips.

## Pagination

Projects endpoints use **cursor** pagination (`before`/`after` from the `Link`
header), not `page`. Code that increments a page number silently returns the
first page forever.

## Built-in workflows before custom automation

Projects have built-in workflows — auto-add items matching a filter, set status
on close, auto-archive, auto-add sub-issues to the parent's project. These need
no token, no Actions minutes, and no maintenance.

**Check whether a built-in workflow already does the job before writing an
Actions workflow to do it.** A large share of hand-written project automation
reimplements "set Status to Done when the issue closes", which is a checkbox.

Reach for Actions when you need cross-project logic, external data, computed
field values, or scheduled rollups.

## Automating with Actions

Authenticate with a **GitHub App** installation token, not a PAT — Projects
automation is exactly the long-lived cross-repo case where a personal token
becomes an offboarding outage. `GITHUB_TOKEN` cannot write to org projects at
all, so this is not optional.

The `projects_v2_item` webhook event fires on item changes and is the trigger
for reacting to board movement.

## Issue-form integration

An issue form can drop new issues straight onto boards with a top-level key —
no automation required:

```yaml
projects: ["octo-org/1", "octo-org/44"]
```

## See also

- `github-issue-model` — issue types, sub-issues, and the fields Projects surfaces from them
- `github-auth` — why the user-owned endpoints reject modern tokens
- `../commands/project.md`
