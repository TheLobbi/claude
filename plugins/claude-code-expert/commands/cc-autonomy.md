---
name: claude-code-expert:cc-autonomy
intent: Configure Claude Code autonomous operating mode — profile selection (conservative, balanced, aggressive, unattended-review), permission block generation, gate agent wiring.
tags:
  - claude-code-expert
  - command
  - cc-autonomy
inputs: []
risk: medium
cost: medium
description: Configure Claude Code autonomous operating mode — profile selection (conservative, balanced, aggressive, unattended-review), permission block generation, gate agent wiring.
---

# /cc-autonomy — Configure Autonomous Mode

Enable Claude Code to execute tasks end-to-end with calibrated safety.

## Usage

```bash
/cc-autonomy enable <profile>   # Enable profile in this repo
/cc-autonomy disable            # Return to standard interactive mode
/cc-autonomy status             # Show current profile + gate status
/cc-autonomy show <profile>     # Show what a profile would install (dry-run)
/cc-autonomy plan <task>        # Generate a pre-execution plan for a task
```

## Profiles

Full details in [`skills-v8/autonomy`](../skills-v8/autonomy/SKILL.md) and `cc_kb_autonomy_profile(profile)`:

| Profile | Risk | Gates |
|---|---|---|
| `conservative` | Minimal; ask on every write | planner + verifier + reviewer (10 block criteria) |
| `balanced` (default) | Free writes in project | planner + verifier |
| `aggressive` | High trust; deny only destructive | planner |
| `unattended-review` | Aggressive runtime; reviewer gates commit | planner + reviewer |

## What `enable` generates

1. Merges profile's permission block into `.claude/settings.json`:
   ```json
   { "permissions": { "allow": [...], "deny": [...], "ask": [...] } }
   ```
2. Copies profile's session init command into `.claude/autonomy-init.sh` for user launch.
3. Enables the relevant gate agents in `.claude/agents/` (planner, verifier, reviewer as per profile).
4. Installs hooks wiring the gates into the workflow (`plan-required`, `post-implement-verify`, `pre-commit-review`).
5. Writes `.claude/rules/cc-autonomy.md` with the active profile name + memory rules.

## Gate agents

| Agent | Model | When |
|---|---|---|
| `autonomy-planner` | Opus | Before any implementation — writes `.claude/active-task.md` |
| `autonomy-verifier` | Sonnet | After each phase — 5 checks (tsc, eslint, tests, diff-sanity, secrets) |
| `autonomy-reviewer` | Opus | Before commit/push in conservative + unattended-review — 10 block criteria |

## Safety

- No code touches disk until `.claude/active-task.md` exists (planner gate).
- Verifier halts on any check failure.
- Reviewer blocks on any of 10 criteria (secrets, test deletion, breaking change without footer, etc.).
- `disable` restores pre-autonomy settings (snapshot kept at `.claude/pre-autonomy-settings.json`).

## `plan <task>`

Generates a pre-execution plan without running. Uses `cc_docs_autonomy_plan` MCP tool. Returns:
- Task decomposition
- Risk assessment
- Rollback plan
- Verification checks
- Cost estimate
