---
name: ultraplan
description: Ultraplan cloud planning — kick off a plan in the cloud from your terminal, review and revise in the browser, then execute remotely or send back to CLI
allowed-tools:
  - Read
  - Bash
triggers:
  - ultraplan
  - /ultraplan
  - cloud plan
  - plan mode cloud
  - remote plan
  - cloud planning
---

# Ultraplan

Ultraplan offloads plan mode to the cloud. Claude drafts the plan in a Claude Code web session while your terminal stays free. You review sections in your browser, comment, request revisions, then choose to execute remotely or send it back to your CLI.

Available since v2.1.92 (research preview). As of v2.1.101, the first run auto-creates a default cloud environment — no web setup step required.

## When to Use Ultraplan

| Scenario | Use Ultraplan | Use Local Plan Mode |
|----------|:---:|:---:|
| Complex multi-service migration | ✓ | |
| Need to share plan with teammates | ✓ | |
| Terminal must stay free during planning | ✓ | |
| Quick single-file refactor | | ✓ |
| No internet / air-gapped environment | | ✓ |
| Iterating rapidly on small tasks | | ✓ |

## Usage

### Via slash command
```
/ultraplan migrate the auth service from sessions to JWTs
```

### Via natural language
Include the keyword "ultraplan" in any prompt:
```
> ultraplan: design the database migration strategy for the multi-tenant switch
```

### What happens
1. Claude Code sends the task to a cloud session
2. Your terminal shows a link and returns immediately
3. In your browser: Claude drafts the plan with sections, code snippets, and decision points
4. You comment on individual sections, ask for revisions, accept or reject sub-plans
5. Choose **Execute in cloud** or **Send to CLI** when satisfied

## Reviewing and Revising

The browser interface shows the plan as structured sections:
- Comment on a specific section to request a change
- Ask for a complete alternative approach
- Accept sections one-by-one or all at once

Plan history is preserved — you can compare revisions and revert.

## Execution Options

### Execute in cloud (remote)
Claude Code on the web runs the implementation. Results and changed files are available in the session. Push from the web session or download a patch.

### Send to CLI
The approved plan is serialized and sent back to your local terminal session. Claude continues from there with the agreed plan as context.

## /autofix-pr Integration

After executing in the cloud and pushing a branch, use `/autofix-pr` to hand the PR over to Claude:

```
> /autofix-pr
```

Claude detects the open PR for your current branch and enables auto-fix — watches CI, fixes failures, handles review comments, pushes until green.

## Cost and Model

Ultraplan uses Opus (`opus` → latest `claude-opus-4-8`) by default for the planning phase — the reasoning depth justifies the cost for complex migrations and architectural decisions. Pair it with a high `effort` level (`xhigh`/`max` on Opus 4.8) for the hardest plans. For plans above Opus's ceiling — multi-day migrations, problems Opus has already failed on — escalate planning to Fable 5 (`fable` → `claude-fable-5`); state the goal and constraints rather than enumerating steps, since over-prescriptive scaffolding reduces Fable output quality. The execution phase uses the model appropriate to the task.

Estimated cost for a complex plan: ~$0.50–$2.00 depending on context volume. Simple plans use fewer tokens and run faster.

## Pairing with /team-onboarding

Use ultraplan to design a feature, then run `/team-onboarding` to generate a ramp-up guide that explains the resulting architecture to new teammates:

```
> /team-onboarding
```

This generates a guide from your local Claude Code usage patterns and the project structure — useful after landing a large feature.
