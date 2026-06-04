---
name: linear:harness-platform
intent: Harness Platform automation — API keys/JWT, custom approvals, tags, triggers, variables/expressions, connectors (YAML), authentication
tags:
  - linear-orchestrator
  - command
  - harness
  - harness-platform
  - api-keys
  - triggers
  - approvals
  - connectors
inputs:
  - action
risk: high
cost: medium
description: Advanced Harness platform features wired to Linear (https://apidocs.harness.io/, developer.harness.io)
---

# /linear:harness-platform

Coverage of advanced Harness Platform topics, all integrated with the Linear bridge so platform-level events surface back as Linear issue activity.

References:
- API root: https://apidocs.harness.io/
- API quickstart: https://developer.harness.io/docs/platform/automation/api/api-quickstart/
- Add/manage API keys: https://developer.harness.io/docs/platform/automation/api/add-and-manage-api-keys/
- JWT default settings: https://developer.harness.io/docs/platform/automation/api/default-settings-for-jwt-token/
- API permissions reference: https://developer.harness.io/docs/platform/automation/api/api-permissions-reference/
- Custom approvals: https://developer.harness.io/docs/platform/approvals/custom-approvals/
- Tags: https://developer.harness.io/docs/platform/tags/
- Triggers overview: https://developer.harness.io/docs/platform/triggers/triggers-overview/
- Harness variables: https://developer.harness.io/docs/platform/variables-and-expressions/harness-variables/
- Connectors via YAML: https://developer.harness.io/docs/platform/connectors/create-a-connector-using-yaml/
- Authentication overview: https://developer.harness.io/docs/platform/authentication/authentication-overview/

## Actions

### `api-keys [--list | --create | --rotate | --revoke]`
- `--create --name <str> --scope account|org|project --ttl <duration>` → POST `/ng/api/api-keys`
- `--rotate <id>` → revoke + re-issue (downtime-free if you stage the new key first)
- `--revoke <id>` → DELETE
- Stores new keys in your secret store; never echoes to terminal
- Reference: https://developer.harness.io/docs/platform/automation/api/add-and-manage-api-keys/

### `jwt [--inspect <token> | --defaults]`
- `--defaults` shows the configured JWT defaults for the account (audience, expiry, signing algo)
- `--inspect` decodes a token and validates its claims locally (no network call)
- Reference: https://developer.harness.io/docs/platform/automation/api/default-settings-for-jwt-token/

### `api-perms [--for <role> | --check <action>]`
- Looks up permissions for a Harness role; or checks whether the active token can perform a given action
- Lists scopes (e.g. `core_pipeline_execute`, `core_secret_view`)
- Reference: https://developer.harness.io/docs/platform/automation/api/api-permissions-reference/

### `quickstart`
- Walks a new user through API onboarding: create key → set up org/project → run sample pipeline
- Reference: https://developer.harness.io/docs/platform/automation/api/api-quickstart/

### `approvals --kind custom`
- Creates / inspects custom approval steps (https://developer.harness.io/docs/platform/approvals/custom-approvals/)
- The bridge wires custom approvals to Linear: when a pipeline hits a custom approval gate referencing a Linear issue, the issue's reviewers are notified via comment, and approval/rejection on the Linear comment proceeds the pipeline
- `approvals --linear-gate --issue <id>` registers an active gate

### `tags [--list | --apply <entity> --tags <k=v,k=v>]`
- Manages tags across Harness entities (pipelines, services, environments, connectors)
- Bridge maps Linear issue labels → Harness tags (1:1) so deploy timelines can be filtered by Linear label
- Reference: https://developer.harness.io/docs/platform/tags/

### `triggers [--list | --create | --on-linear-event]`
- `--create` from a YAML file → POST `/ng/api/triggers`
- `--on-linear-event <kind>` registers a Linear-driven trigger:
  - `issue.done` → trigger pipeline tagged with that issue's repo
  - `cycle.completed` → trigger release pipeline
  - `sla.breach.p1` → trigger rollback pipeline
- Reference: https://developer.harness.io/docs/platform/triggers/triggers-overview/

### `variables [--list | --resolve <expr>]`
- Lists Harness variables / expressions in scope
- `--resolve` evaluates an expression against the current execution context (sandboxed)
- Reference: https://developer.harness.io/docs/platform/variables-and-expressions/harness-variables/

### `connectors [--create-yaml <file> | --list | --validate]`
- Creates connectors from YAML files (https://developer.harness.io/docs/platform/connectors/create-a-connector-using-yaml/)
- `--validate` runs the Harness connector test before commit
- The bridge auto-injects a "Linear" connector when the workspace is set up — it wires Linear API key as a Harness Secret and exposes it to pipelines as `<+secrets.getValue("linear_api_key")>`

### `auth [--mode | --rotate | --status]`
- Shows / updates platform authentication settings (SAML/OIDC/SCIM/LDAP)
- `--rotate` rotates SAML signing certs with a 24h dual-validity window
- Reference: https://developer.harness.io/docs/platform/authentication/authentication-overview/

## Why route through Linear
Treating Linear as the source of truth for "what work is being deployed":
- Tags propagate so dashboards filter cleanly
- Custom approvals require a human Linear review
- API keys / JWT rotations are tracked as Linear issues for audit
- Triggers respond to Linear lifecycle events (cycle complete → release)

## Security
- API keys + JWT secrets handled by Harness Secrets, never written to plugin state
- Custom-approval bridge verifies the Linear actor token corresponds to a workspace member with the required role
- All auth changes are gated on `harness-linear-bridge` agent's Opus-level reasoning
