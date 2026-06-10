---
paths:
  - "**/Dockerfile*"
  - "**/docker-compose*.yml"
  - "**/docker-compose*.yaml"
  - "**/.github/workflows/*.yml"
  - "**/.github/workflows/*.yaml"
  - "**/*.yaml"
  - "**/*.yml"
  - ".mcp.json"
  - "**/mcp-server/**"
  - "**/hooks/**"
---

# Infrastructure Rules

## Docker

- Never use `:latest` as the sole image tag — always pin a specific version (e.g., `node:20-alpine`)
- Use multi-stage builds to minimize image size
- Add `--no-cache` flag for production builds
- Set `imagePullPolicy: Always` in Kubernetes manifests
- Include `.dockerignore` to exclude `node_modules`, `.git`, `.env`, and build artifacts

## Docker Compose

- Use named volumes for persistent data — never bind-mount production data directories
- Define explicit networks for service isolation
- Pin image versions in `docker-compose.yml` — no floating tags
- Use `depends_on` with health checks where available

## GitHub Actions

- Pin action versions with full SHA, not just major version (e.g., `actions/checkout@abc123` not `actions/checkout@v4`)
- Use OIDC for cloud authentication (Azure, AWS) — never store long-lived cloud credentials as secrets
- Set minimum required permissions with `permissions:` block
- Use `concurrency` groups to prevent duplicate workflow runs

## MCP Servers

- Project-scoped MCP config (`.mcp.json` at project root) takes priority over global (`~/.claude/mcp.json`)
- Plugin MCP servers run as child processes via `stdio` transport — not HTTP
- MCP server definitions must include `command`, `args`, and optionally `env`
- Environment variables for MCP servers should reference system env vars, not hardcoded values

## Hooks

- Hook scripts must return valid JSON to stdout: `{"decision": "approve"}` or `{"decision": "block", "reason": "..."}`
- Hooks read context from stdin as JSON — parse with `jq`, not string matching
- Hook exit code 0 means the JSON response is authoritative; non-zero is treated as an error
- Register hooks in `.claude/settings.json` under the `hooks` key with the correct event name
- Valid hook events: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `UserPromptSubmit`, `Notification`, `Stop`, `SessionStart`, `SessionEnd`, `PreCompact`, `SubagentStart`, `SubagentStop`, `TeammateIdle`, `PermissionRequest`, `Setup`

## Helm / Kubernetes

- Always use `--atomic` flag with `helm upgrade --install` to auto-rollback on failure
- Never deploy to production without a rollback plan documented
- Use resource limits (`requests` and `limits`) on all containers
- Store sensitive values in Kubernetes Secrets, not ConfigMaps
