---
name: cc-auto-mode
description: Auto mode permission handling — classifier-based approvals, PermissionDenied hook, defer permissionDecision, and autonomy profiles for hands-off Claude Code usage
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
triggers:
  - auto mode
  - permission mode
  - automode
  - defaultMode
  - classifier
  - PermissionDenied hook
  - dangerously-skip-permissions
  - permissionDecision
  - defer
---

# Auto Mode

Auto mode is the middle ground between approving every tool call and running with `--dangerously-skip-permissions`. A classifier evaluates each permission prompt and either approves safe operations silently or blocks and surfaces suspicious ones.

Available since v2.1.83 (research preview).

## The Three Permission Modes

Cycle with **Shift+Tab** in the terminal:

| Mode | Behavior |
|------|----------|
| `default` | Claude asks for approval on every sensitive action |
| `auto` | Classifier auto-approves safe actions; blocks/surfaces suspicious ones |
| `bypassPermissions` | All actions run without prompting (dangerous — only in trusted environments) |

## Enabling Auto Mode

### Per-session
Press **Shift+Tab** until you see `auto mode on` in the footer.

### As default (settings.json)
```json
{
  "permissions": {
    "defaultMode": "auto"
  }
}
```

### Command-line flag
```bash
claude --permission-mode auto
```

## How the Classifier Works

The classifier scores each tool call against a risk model. For each action:
- **Low risk** (reading files, running lint, git status) → silently approved
- **Medium risk** (writing files, running tests) → approved with a brief log entry
- **High risk** (deleting files, network calls to unknown hosts, force-pushing) → blocked and surfaced to you

You see the same UI as a manual block, so you can review and override when needed.

## Handling Denials with PermissionDenied Hook

When the classifier blocks an action, a `PermissionDenied` hook fires before Claude has a chance to respond. Use it to:
- Log blocked actions for audit trails
- Return `retry: true` to let Claude try a different approach instead of failing

```json
{
  "hooks": {
    "PermissionDenied": [{
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/permission-denied.sh"
      }]
    }]
  }
}
```

```bash
#!/usr/bin/env bash
# permission-denied.sh
set -euo pipefail
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
REASON=$(echo "$INPUT" | jq -r '.reason // "no reason"')

# Log to audit file
printf '%s\t%s\t%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$TOOL" "$REASON" \
  >> .claude/logs/permission-denied.log

# Return retry: true so Claude tries an alternative approach
echo '{"retry": true}'
```

Alternatively, retry manually from the `/permissions` → **Recent** tab using `r`.

## Deferring Decisions in Headless Mode

For SDK apps and custom UIs that run Claude in `-p` (print/pipe) mode, use `defer` on a `PreToolUse` hook to pause Claude at a tool call and hand the decision to your application:

```json
{
  "hooks": {
    "PreToolUse": [{
      "hooks": [{
        "type": "command",
        "command": ".claude/hooks/pause-for-review.sh"
      }]
    }]
  }
}
```

```bash
#!/usr/bin/env bash
# pause-for-review.sh — returns defer for sensitive tools
set -euo pipefail
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // ""')

case "$TOOL" in
  Bash|Write|Edit)
    echo '{"permissionDecision": "defer"}'
    ;;
  *)
    echo '{"decision": "approve"}'
    ;;
esac
```

When Claude hits a `defer`:
1. Claude Code exits with a `deferred_tool_use` payload
2. Your app surfaces the decision (custom UI, Slack message, approval flow)
3. Your app resumes: `claude --resume <session-id> --permission-decision approve`

## Auto Mode vs Manual Approval vs bypassPermissions

| | Manual | Auto | bypassPermissions |
|--|--------|------|-------------------|
| File reads | Prompt | ✅ Silent | ✅ Silent |
| File writes | Prompt | ✅ Usually silent | ✅ Silent |
| git push | Prompt | ⚠️ Surfaced | ✅ Silent |
| rm -rf | Prompt | 🚫 Blocked | ✅ Silent |
| Network calls | Prompt | ⚠️ Surfaced | ✅ Silent |
| Effort | High friction | Low friction | Zero friction / high risk |

**Recommended for most workflows:** `auto` mode.
**Only use bypassPermissions:** In locked-down CI containers where you control the entire environment.

## Combining with Autonomy Profiles

Auto mode pairs well with the autonomy profiles from `skills/autonomy-profiles/SKILL.md`. Set `defaultMode: "auto"` and then configure the appropriate autonomy profile (conservative, balanced, aggressive) to control task scope and self-correction behavior independently of permission approval.

## Checking Current Mode

```bash
/status    # shows current permission mode in the footer
/permissions   # opens the full permissions panel
```
