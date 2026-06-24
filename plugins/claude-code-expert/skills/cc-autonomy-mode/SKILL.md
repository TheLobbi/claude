---
name: cc-autonomy-mode
description: Configure Claude Code's autonomous operating mode — profile selection (conservative, balanced, aggressive, unattended-review), permission blocks, and the three gate agents (planner, verifier, reviewer). Use this skill whenever enabling autonomous mode, switching profiles, tightening permissions for production branches, or setting up unattended execution. Triggers on: "autonomy", "unattended mode", "auto-approve", "permission mode", "autonomy profile", "gates", "/cc-autonomy", "planner verifier reviewer", "let claude run on its own".
---

# Autonomy

Autonomous mode lets Claude Code execute tasks end-to-end with minimal human-in-the-loop. Safety comes from two things:

1. **Profile-scoped permissions** — the allow/deny/ask lists match the profile's risk tolerance.
2. **Gate agents** — planner writes an explicit plan before code, verifier runs checks after implementation, reviewer blocks merge on 10 criteria.

## Four profiles

Fetch full profile via `cc_kb_autonomy_profile(profile)`. Summary:

| Profile | Risk | Permissions shape | Gates |
|---|---|---|---|
| `conservative` | Minimal | Read-only default; ask on any write | planner + verifier + reviewer (all enabled, 10 block criteria) |
| `balanced` | Default | Free writes in project; ask on network/publish/push | planner + verifier; reviewer optional |
| `aggressive` | High trust | Most tools allowed; deny only destructive | planner only |
| `unattended-review` | Hybrid | Same as aggressive at runtime; reviewer gates commit/push | planner + reviewer |

## Three gate agents

All three are installed as regular agents — autonomous mode just wires them into the flow.

### 1. `autonomy-planner` (Opus)

**When**: runs first, before any implementation.
**Writes**: `.claude/active-task.md` — explicit plan with:
- Constraints and invariants
- Phase breakdown with exit criteria per phase
- Risk assessment and rollback plan
- Verification checks the verifier will run

**Hard rule**: no code touches disk until `.claude/active-task.md` exists.

### 2. `autonomy-verifier` (Sonnet)

**When**: runs after each implementation phase.
**Reads**: `.claude/active-task.md` verification block.
**Runs**: 5 built-in checks (configurable via profile):
- `tsc --noEmit` (TypeScript projects)
- `eslint` (JS/TS projects)
- `pytest` / `jest` / project test runner
- `git diff --stat` sanity check
- Secret scanner (`trufflehog`, `gitleaks`)

**Output**: `{ pass: boolean, failures: [...] }`. If `pass: false`, halt and surface to caller.

### 3. `autonomy-reviewer` (Opus)

**When**: runs before commit/push in conservative and unattended-review profiles.
**Checks 10 block criteria**:
1. Any hardcoded secret
2. Any `.env` or credential file added
3. SQL injection vector (string-concat queries)
4. XSS / unescaped output in web code
5. Deleted test without replacement
6. Commented-out code larger than 20 lines
7. Dependency added with no justification in commit message
8. Breaking API change without `BREAKING CHANGE:` footer
9. `TODO` or `FIXME` on a security-relevant line
10. `console.log` / `print` of sensitive variables

**Output**: `{ approve: boolean, blocks: [...] }`. Any block = stop.

## Session init command

Each profile provides a `session_init_command`. Example for balanced:

```
claude --permission-mode acceptEdits --dangerously-skip-permissions=false
```

For unattended-review:

```
claude --permission-mode acceptEdits --enable-reviewer-gate
```

## Permission block generation

`/cc-autonomy enable <profile>` generates a settings.json block:

```json
{
  "permissions": {
    "allow": [ /* from profile */ ],
    "deny":  [ /* from profile */ ],
    "ask":   [ /* from profile */ ]
  }
}
```

Merges into existing settings.json without overwriting unrelated sections.

## Memory rules

Each profile includes memory discipline. Conservative requires saving every decision (including rejected options). Balanced is lighter. Aggressive is the standard engram protocol.

## MCP delegation

| Need | Tool |
|---|---|
| Fetch profile details | `cc_kb_autonomy_profile(profile)` |
| Plan for an unattended task | `cc_docs_autonomy_plan(task, repo_signals)` |
| Model for gate agents | `cc_docs_model_recommend(task, budget)` |

## Anti-patterns

- Running aggressive profile on an unfamiliar codebase → first session should always be conservative.
- Disabling the verifier to "move faster" → regressions ship silently.
- Letting planner skip the risk section → rollback becomes guesswork.
- Custom profile without any gates → not autonomous, just unsupervised.
