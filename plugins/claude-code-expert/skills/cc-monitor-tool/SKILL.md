---
name: cc-monitor-tool
description: Monitor tool for streaming background process events into conversations — tail logs, watch CI, auto-fix dev server crashes, and /loop self-pacing without Bash sleep loops
allowed-tools:
  - Read
  - Write
  - Bash
triggers:
  - Monitor tool
  - monitor
  - tail log
  - watch CI
  - /loop
  - self-pacing
  - background watcher
  - stream events
---

# Monitor Tool

The Monitor tool spawns a background watcher and streams its events into the conversation as new transcript messages. Each event lands immediately and Claude reacts to it — no polling loop, no holding the turn open with a `sleep`.

Available since v2.1.98.

## What It Does

```
Bash (sleep loop, polling)          Monitor tool
━━━━━━━━━━━━━━━━━━━━━━━           ━━━━━━━━━━━━━━━━━━━━━━
while true; do                     # Claude spawns a watcher
  check_ci_status                  # Watcher runs in background
  sleep 30                         # Each event → new message
done                               # Claude reacts immediately
```

The conversation stays open. Events arrive asynchronously. Claude processes each one and decides whether to act.

## Common Use Cases

### Tail a log file
```
> Tail server.log in the background and tell me the moment a 5xx shows up
```
Claude spawns a watcher on `server.log`. Each new log line arrives as a transcript message. When a 5xx pattern matches, Claude reacts immediately — describe the error, suggest a fix, or apply one automatically.

### Watch CI on a PR
```
> Watch CI on my current branch and fix any failures as they come in
```
Claude monitors the CI status. When a check fails, it reads the failure output, writes a fix, and pushes — all without you sitting at the terminal.

### Auto-fix dev server crashes
```
> Start the dev server in the background, watch for crashes, and restart and fix when it crashes
```
Claude starts the server, monitors its output, and when a crash appears, reads the traceback, patches the code, and restarts.

### Training run progress
```
> Kick off training and summarize progress every epoch without keeping the session idle
```
Claude monitors training output and sends epoch summaries as events arrive.

## /loop Self-Pacing

`/loop` now self-paces: if you omit the interval, Claude picks the next tick based on what it's waiting for. When the Monitor tool is available, Claude reaches for it instead of polling.

```
> /loop check CI on my PR
```

Claude will:
1. Use the Monitor tool to watch CI (not poll with sleep)
2. React the moment a result arrives
3. Schedule the next check only if the Monitor can't be used

### Explicit interval (still works)
```
> /loop --interval 60 run the dependency audit
```

### Dynamic (recommended)
```
> /loop check CI on my PR
```

## Pairing Monitor with PreToolUse hooks

If you want to gate what Monitor can watch (e.g., only internal hosts):

```json
{
  "hooks": {
    "PreToolUse": [{
      "hooks": [{
        "if": "Monitor(*)",
        "type": "command",
        "command": ".claude/hooks/monitor-allowlist.sh"
      }]
    }]
  }
}
```

```bash
#!/usr/bin/env bash
# monitor-allowlist.sh — only allow monitoring local files and localhost
set -euo pipefail
INPUT=$(cat)
TARGET=$(echo "$INPUT" | jq -r '.tool_input.target // ""')

case "$TARGET" in
  *.log|localhost:*|/tmp/*)
    echo '{"decision": "approve"}'
    ;;
  *)
    jq -n --arg t "$TARGET" '{"decision":"block","reason":("Monitor target not allowed: "+$t)}'
    ;;
esac
```

## Decision: Monitor vs Bash Loop vs ScheduleWakeup

| Scenario | Best Tool |
|----------|-----------|
| React to log events in real time | Monitor tool |
| Wait for a known-duration process (8-min build) | ScheduleWakeup (~270s, stays in cache) |
| Poll a REST endpoint every minute | Monitor tool (wrap in a watcher script) |
| Long-idle background check (>30 min) | ScheduleWakeup (1200s+) |
| One-shot process check on demand | Bash |

## Available in

- CLI (v2.1.98+)
- Desktop app
- Not available in `-p` (print/pipe) headless mode
