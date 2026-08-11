---
name: github-agents
description: This skill should be used when delegating work to agents that run inside GitHub — Copilot cloud agent, custom agents, Copilot code review, and GitHub Agentic Workflows — including when delegation beats doing the work directly.
version: 1.0.0
trigger_phrases: [copilot coding agent, copilot cloud agent, assign to copilot, custom agent, AGENTS.md, agentic workflows, gh aw, copilot code review, delegate to agent]
categories: [github, agents, automation, delegation]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# Agents Inside GitHub

GitHub hosts its own agents. Knowing when to hand work to one — instead of doing
it in-session — is the difference between an orchestrator and a bottleneck.

## The surfaces

| Surface | What it is | Good for |
| --- | --- | --- |
| **Copilot cloud agent** | An agent you assign an issue or task to; it works in its own environment and opens a PR | Well-scoped, independently verifiable changes |
| **Custom agents** | Specialized configurations of the cloud agent, selectable at assignment | Repeated task shapes with house conventions |
| **Copilot code review** | Automated review on a PR, requestable or automatic | A cheap first pass before human review |
| **GitHub Agentic Workflows (`gh-aw`)** | Markdown workflows compiled to hardened Actions runs, driving an AI agent | Scheduled and event-driven agentic automation |
| **This plugin** | Claude Code orchestrating from a session | Judgment, coordination, multi-repo, anything needing a conversation |

## Delegating to the Copilot cloud agent

```
mcp__github__assign_copilot_to_issue          # hand off an existing issue
mcp__github__create_pull_request_with_copilot # hand off a described task
mcp__github__get_copilot_job_status           # poll progress
mcp__github__request_copilot_review           # review pass on a PR
```

**Treat the issue as the prompt.** An issue assigned to an agent gets exactly
the context written in it — no follow-up conversation. Before delegating,
confirm the issue states: what to change, where, what "done" looks like, and how
to verify. A vague issue produces a vague PR and costs more than doing it
yourself.

### When delegation wins

| Delegate | Keep in-session |
| --- | --- |
| Well-scoped, independently testable | Requires judgment or design decisions |
| Mechanical breadth — rename across 40 files | Touches `humanReviewPaths` |
| Parallel with work you are already doing | Needs conversation to pin down |
| Clear acceptance criteria | Spans repositories or systems |
| Low blast radius | Security-sensitive or irreversible |

Delegation is **parallelism**, not abdication. The resulting PR is a normal PR:
it goes through the same review board, the same CI drive-to-green, and the same
merge gates. Never merge an agent's PR on lighter evidence than a human's — the
gates exist because the author's identity is not what makes a change safe.

### `AGENTS.md`

The repository-level instruction file agents read for house conventions —
build commands, test commands, style, architectural constraints. Nested
`**/AGENTS.md` files scope instructions to a subtree.

A repo with a good `AGENTS.md` gets materially better output from **every**
agent, including this one. If a repo lacks it and is being worked on repeatedly,
writing one is high-leverage.

## GitHub Agentic Workflows (`gh-aw`)

A CLI extension that compiles a Markdown workflow into a hardened GitHub Actions
workflow running an AI agent (Copilot, Claude Code, Codex, or Gemini) with
sandboxed execution and **read-only defaults**.

```bash
gh extension install github/gh-aw
gh aw init
gh aw compile                      # .md → .lock.yml
gh aw compile --actionlint --zizmor --poutine   # with security scanners
gh aw run <name>
gh aw logs                         # recent run logs
gh aw audit <run-id>               # prompts and outputs for one run
gh aw status
```

### The lock file is the contract

`gh aw compile` produces `<name>.lock.yml` next to the `.md`. **The lock file is
what Actions executes.** Commit both — the Markdown for readability, the lock
file for execution, like a manifest and its lockfile.

The failure mode to watch for: editing the Markdown, forgetting to recompile,
and shipping the old compiled behavior. Treat a `.md` change without a matching
`.lock.yml` change as an incomplete commit, the same as a `package.json` change
without a lockfile update.

Add a Dependabot ignore for the compiler-managed action, or you will get PRs
trying to bump something `gh aw compile` owns:

```yaml
- package-ecosystem: github-actions
  directory: "/.github/workflows"
  ignore:
    - dependency-name: "github/gh-aw-actions"   # version-locked to the compiler
```

### Safe outputs

Writes back to GitHub go through **safe outputs** — declared, sanitized
operations applied in a separate job — rather than granting the agent write
permissions. Granting general `write` instead is possible and is the wrong
choice: it converts a sandboxed agent into an unsandboxed one.

This is the same principle as this plugin's write guard: constrain at the
boundary, not by trusting the agent's intentions.

### Good agentic workflow shapes

Scheduled triage of new issues · daily activity digest as an issue · dependency
update triage · PR labelling from the diff · stale-work sweeps · docs drift
checks. All read-heavy, all with a small, declared write surface.

## Copilot code review

A cheap automated pass on every PR. It does **not** replace the review board —
the board's value is adversarial verification, and a single-pass reviewer has no
refutation stage. Run it as an extra lens whose findings enter the same
verification pipeline, not as an authority.

## Choosing where work runs

```
Is it a conversation, a decision, or coordination?      → this session
Is it scoped, mechanical, and independently verifiable? → Copilot cloud agent
Is it recurring on a schedule or an event?              → agentic workflow
Is it deterministic with no judgment at all?            → a plain Actions workflow
```

The last line matters. An agent that reformats a file on a schedule is a worse,
slower, less predictable `prettier --write` in a cron job. **Do not delegate to
an agent what a deterministic workflow already does correctly** — see
`actions-automation`, and check whether a built-in Projects workflow covers it
before writing anything at all.

## See also

- `actions-automation` — the deterministic alternative, and the trigger surface
- `../commands/delegate.md` · `../agents/agent-delegator.md`
