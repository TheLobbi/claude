---
name: cc-security-compliance
description: Claude Code security and compliance — permissions model, settings.json allowlists/denylists, enterprise managed settings, audit logging, secrets handling, SOC2/HIPAA/GDPR patterns. Use this skill whenever configuring permissions, auditing a setup for security, handling secrets, preparing for compliance, or tightening access. Triggers on: "permissions", "allowlist", "security audit", "compliance", "SOC2", "HIPAA", "GDPR", "secrets", "enterprise settings", "managed settings", "deny list".
---

# Security & Compliance

Baseline security + enterprise compliance patterns for Claude Code.

## Permission model

Permissions live in `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["Read", "Write", "Edit", "Glob", "Grep", "Bash(npm *)"],
    "deny":  ["Bash(rm -rf /)", "Bash(sudo *)", "Bash(curl * | sh)"],
    "ask":   ["WebFetch", "Bash(git push *)", "Bash(npm publish *)"]
  }
}
```

- `allow` → tool executes without asking
- `deny` → tool never executes
- `ask` → user is prompted each time
- Missing from all lists → falls back to permission mode default

## Permission modes

| Mode | Behavior |
|---|---|
| `ask` | Prompt for every tool use |
| `acceptEdits` | Auto-accept Read/Write/Edit; prompt for others |
| `auto` | Minimal prompting |
| `bypassPermissions` | Skip prompts (dangerous; CI only) |
| `plan` | Plan mode — no file writes |

Set via `claude --permission-mode <mode>` or in `settings.json` → `permissionMode`.

## Secrets handling

**Never in repo:**
- `.env` files (except `.env.example`)
- API keys, tokens, credentials in settings/MCP config
- Passwords, private keys

**Where secrets go:**
- OS keychain (via `secretstorage`, `keyring`, `keychain`)
- Cloud secret manager (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, Vault)
- CI-injected env vars

**Install the `protect-sensitive-files` hook** (via `cc_kb_hook_recipe("protect-sensitive-files")`) to prevent accidental writes to `.env` / credentials.

## Audit logging

Enterprise deployments log all tool calls for compliance:

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "bash .claude/hooks/audit-log.sh" }] }
    ]
  }
}
```

`audit-log.sh` appends JSON lines to a log shipping to SIEM (Splunk, Elastic, Datadog). Key fields: timestamp, session_id, tool_name, tool_input_hash (not raw input if sensitive), decision, duration_ms.

## Enterprise managed settings

For org-wide enforcement, use managed settings at the OS level:
- macOS: `/Library/Application Support/Claude/managed-settings.json`
- Windows: `C:\ProgramData\Claude\managed-settings.json`
- Linux: `/etc/claude/managed-settings.json`

Managed settings override user settings. Use for: denylist of dangerous commands, required hooks (audit), forbidden MCP servers.

## Compliance frameworks

### SOC2 Type II
- Audit logging of all file modifications and tool calls.
- Access control: user-level `allow`/`deny` tied to AD/SSO identity.
- Change management: all `.claude/` edits go through PR review.
- Retention: audit logs kept ≥1 year.

### HIPAA (healthcare)
- PHI never in prompts — scan with `detect-secrets` + custom PHI regex in hook.
- BAA required for any cloud-hosted MCP server handling PHI.
- Encryption at rest for any memory/cache files containing PHI.

### GDPR
- Right-to-erasure: memory stores (engram, Obsidian) must support selective deletion by user identity.
- Data minimization: don't save user PII to memory without a legitimate purpose.
- Portability: export format for user's saved memory (`mem_timeline`, `/cc-memory export`).

## Security audit checklist

Run `security-compliance-advisor` agent for a full audit. Minimum checks:

- [ ] No secrets in `settings.json`, `.mcp.json`, or any committed file
- [ ] `deny` list includes destructive commands (rm -rf, sudo, curl|sh)
- [ ] `protect-sensitive-files` hook installed
- [ ] Permission mode not `bypassPermissions` outside CI
- [ ] MCP servers from trusted sources only
- [ ] Hook scripts pass shellcheck
- [ ] No `--dangerously-skip-permissions` in any committed script

## MCP delegation

| Need | Tool |
|---|---|
| Settings schema | `cc_docs_settings_schema` |
| Audit checklist | `cc_docs_checklist("security")` |
| Model for review | `cc_docs_model_recommend("security review")` → Opus |
| Hook recipe for protection | `cc_kb_hook_recipe("protect-sensitive-files")` |

## Anti-patterns

- `permissions.allow: ["*"]` → defeats the point.
- Secrets in settings.json under `env` → committed to git.
- `bypassPermissions` in developer default → one typo destroys something.
- Audit log writes to same disk as repo → logs vanish with the incident.
- Skipping managed settings for enterprise → one dev disables them all.

## Reference

- [compliance-checklists.md](references/compliance-checklists.md) — SOC2/HIPAA/GDPR control mapping
