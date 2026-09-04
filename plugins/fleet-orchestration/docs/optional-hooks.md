# Optional hooks

**This plugin ships no active hooks, on purpose.**

A `hooks/hooks.json` inside a plugin is auto-discovered and active the moment
the plugin is enabled. The protocol's rules are opinionated — "a pushed
branch must have a PR", "heartbeat before a long call" — and enforcing them
in every repository the moment someone installs a plugin is not a decision
the plugin gets to make.

So the hooks are here, as copy-paste, for a fleet that wants them. Put them
in your own `.claude/settings.json`, or in a `hooks/hooks.json` of a private
wrapper plugin.

Verify each against the current hooks reference before relying on it; hook
event names and matcher semantics are a moving target, and a hook that fails
to match is a gate that cannot go red.

## Matcher semantics worth knowing first

- `"*"`, `""`, or an omitted matcher matches everything.
- A matcher containing only letters, digits, `_`, `-`, spaces, `,` or `|` is
  treated as an exact string or a `|`/`,`-separated list.
- A matcher containing **any other character** is an **unanchored JavaScript
  regex**. `Edit.*` therefore also matches `NotebookEdit`. Anchor with
  `^...$` when you mean whole-string.
- `${CLAUDE_PLUGIN_ROOT}` is the plugin's install directory;
  `${CLAUDE_PROJECT_DIR}` is the project root.

## 1. Push must be followed by a PR

The single highest-value rule to automate, because the failure is silent: a
pushed branch with no PR is invisible work.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}\"/scripts/require-pr-after-push.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

The plugin does **not** ship that script, because a correct one has to know
your forge, your base branches and your hands-off set — all of which are in
`fleet.config.json` and none of which the plugin can guess. Write it against
your config, and give it a test that turns it **red**: a branch pushed with
no PR. A hook with no red is decoration.

## 2. Heartbeat on session start

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "pwsh",
            "args": [
              "-NoProfile", "-File",
              "${CLAUDE_PLUGIN_ROOT}/scripts/heartbeat.ps1",
              "-LogRoot", "${CLAUDE_PROJECT_DIR}/.fleet/runs/current",
              "-Lane", "REPLACE-ME",
              "-State", "start",
              "-Task", "session start"
            ]
          }
        ]
      }
    ]
  }
}
```

`-Lane` is per-session, which is exactly why this cannot ship enabled: one
plugin-level hook would write every session's state into one lane's file, and
the monitor would read a fleet of one.

## 3. What not to hook

- **Do not hook the merge.** The merge gate's last look must be a deliberate,
  unfiltered read in the same message as the merge command. A hook makes it
  automatic, and an automatic check is exactly the thing people stop reading.
- **Do not hook a heartbeat onto every tool call.** The heartbeat's value is
  that a human or a monitor can read intent from it. A machine-generated line
  every few seconds is a log, not a signal.
