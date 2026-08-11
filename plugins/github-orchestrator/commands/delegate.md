---
name: gh:delegate
intent: Hand well-scoped work to agents that run inside GitHub and track the pull requests they produce
tags:
  - github-orchestrator
  - command
  - agents
inputs:
  - target
  - flags
risk: high
cost: medium
description: Delegate an issue or task to the Copilot cloud agent, request an automated review, or scaffold a GitHub Agentic Workflow — then track the resulting PR through the same gates as any other
---

# /gh:delegate

Parallelism, not abdication. Work handed to an in-GitHub agent comes back as a
normal PR and goes through the same review board, the same drive-to-green, and
the same merge gates.

## Usage

```
/gh:delegate issue 214                  # assign issue #214 to the Copilot cloud agent
/gh:delegate task "add retry to the webhook client"
/gh:delegate review 482                 # request an automated review pass on a PR
/gh:delegate status                     # what is delegated and where it stands
/gh:delegate workflow triage            # scaffold an agentic workflow
/gh:delegate --check 214                # is this issue actually delegable?
```

## `--check` first

Delegation fails on under-specified issues far more often than on hard ones. The
issue **is** the prompt — the agent gets exactly what is written and no
follow-up conversation.

```
/gh:delegate --check 214

NOT READY
  ✗ No acceptance criteria — "improve error handling" has no done condition
  ✗ No file or module named; the agent has to guess scope
  ✓ Reproduction present
  ✓ Not in humanReviewPaths

  Fix: /gh:issue update 214 --enrich   then re-check
```

`--enrich` rewrites the issue into a delegable prompt: what to change, where,
what done looks like, how to verify.

## When to delegate

| Delegate | Keep in-session |
| --- | --- |
| Well-scoped and independently testable | Needs judgment or a design decision |
| Mechanical breadth — a rename across 40 files | Touches `humanReviewPaths` |
| Parallel with work already in flight | Needs conversation to pin down |
| Clear acceptance criteria | Spans repositories or systems |
| Low blast radius | Security-sensitive or irreversible |

`/gh:delegate` **refuses** to delegate anything matching
`config/policies.json:humanReviewPaths` — migrations, auth, billing, workflows,
infrastructure — and says which path matched.

## Tracking what comes back

Delegated work is tracked, not fired and forgotten:

```
/gh:delegate status

#214  retry on webhook client      → PR #497   in progress
#219  rename LegacyClient          → PR #495   ready — review board not yet run
#221  add pagination to /users     → failed    agent could not run the test suite
                                                (missing AGENTS.md build command)
```

When a delegated PR appears, it enters the normal loop: `/gh:review` for the
board, `/gh:ci` for green, `merge-marshal` for the gates. **Never merge an
agent's PR on lighter evidence than a human's** — the gates exist because the
author's identity is not what makes a change safe.

## `AGENTS.md`

The repository instruction file every in-GitHub agent reads: build command, test
command, conventions, architectural constraints. Nested `**/AGENTS.md` scope
instructions to a subtree.

The third failure line in the example above is the common one — the agent could
not verify its own work because nothing told it how to run the tests. If a repo
is delegated to repeatedly and has no `AGENTS.md`, writing one is the highest-
leverage fix available:

```
/gh:delegate --scaffold-agents-md
```

## `workflow` — agentic workflows

Scaffolds a [GitHub Agentic Workflow](../skills/github-agents/SKILL.md): a
Markdown workflow compiled by `gh aw compile` into a hardened Actions run with
sandboxed execution and read-only defaults.

```
/gh:delegate workflow triage --schedule "0 9 * * 1-5"
```

Two rules this command enforces:

1. **Commit the `.lock.yml` with the `.md`.** The lock file is what Actions
   executes. A `.md` change without a matching `.lock.yml` change ships the old
   compiled behavior — treated here as an incomplete commit, exactly like a
   `package.json` change with no lockfile update.
2. **Writes go through safe outputs**, never a general `write` permission.
   Granting `write` converts a sandboxed agent into an unsandboxed one.

It also adds the Dependabot ignore for `github/gh-aw-actions`, which is
compiler-managed and should not be bumped independently.

## Do not delegate what a workflow already does

```
Conversation, decision, or coordination?         → this session
Scoped, mechanical, independently verifiable?    → Copilot cloud agent
Recurring on a schedule or event?                → agentic workflow
Deterministic, no judgment at all?               → a plain Actions workflow
```

An agent that reformats files on a schedule is a slower, less predictable
`prettier --write` in a cron job. `/gh:delegate` checks the deterministic
options — and whether a built-in Projects workflow already covers it — before
proposing an agent.

## Related

- [`github-agents`](../skills/github-agents/SKILL.md) — the surfaces and their limits
- [`actions-automation`](../skills/actions-automation/SKILL.md) — the deterministic alternative
- [`agent-delegator`](../agents/agent-delegator.md)
