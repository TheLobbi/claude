---
name: cc-prompt-budget-preflight
description: Pre-flight check to run before any Agent-tool spawn. Prevents the "Prompt is too long" rejection class by enforcing a 5-section minimum-viable-prompt template and estimating forwarded context cost. Use whenever you are about to call the Agent tool with more than a one-paragraph prompt.
allowed-tools:
  - Read
  - Grep
triggers:
  - spawn agent
  - subagent prompt
  - prompt is too long
  - prompt budget
  - agent rejection
---

# Prompt Budget Preflight

Run this **before** calling the Agent tool. It takes under 30 seconds and prevents the most
common subagent failure mode: rejection with "Prompt is too long".

## Why this exists

Subagents inherit a large base context before your prompt is even appended:

- Global `~/.claude/CLAUDE.md`
- Project `.claude/CLAUDE.md` chain (including any rules files referenced via `@`)
- Any auto-loaded plugin `CLAUDE.md` in the subagent's `cwd`
- `MEMORY.md` and auto-memory entries
- System prompts for the selected `subagent_type`
- Tool definitions for tools the subagent can see

In our own telemetry from one 9-spawn session:

| Spawn type | Prompt size | Result |
|---|---|---|
| `Explore` × 2 (generic) | ~900 words each | Both **rejected** — "Prompt is too long", 0 tokens used, 2.3-2.7s round-trip |
| Named specialists × 7 (architecture / perf / security / dx / ux / researcher / code-reviewer) | ~200-400 words each | **All 7 succeeded** |

Reject rate: 22%. Every rejection is a wasted ~3 seconds and a wasted decision cycle.

## The 5-section minimum-viable prompt

Target **~300 words total**. If you exceed 800 words you almost certainly have dead weight.

```
1. TARGET
   - Absolute file paths or directory scope
   - Clear in/out-of-scope boundaries

2. TASK
   - One sentence: what to produce
   - Read-only vs write explicitly stated

3. FORMAT
   - Output shape (YAML, table, bullets)
   - Word ceiling or row cap
   - Any required fields / schema

4. CONSTRAINTS
   - What NOT to do
   - Paths / patterns / subdirectories to avoid
   - Word-limit enforcement hint

5. RULES (optional, only when applicable)
   - Plugin-specific guardrails
   - "Do not follow interview-first workflow — this is an audit"
   - "Do not write files — this is analysis only"
```

## Preflight checklist

Before each `Agent` call, answer:

1. **Subagent type**: am I using a named specialist that already has the relevant system prompt, or a generic (`Explore`, `general-purpose`)? **Prefer specialists** — see `skills/cc-agentic-patterns/SKILL.md` Part 4.
2. **Prompt length**: is my prompt under 500 words? If over 800, trim.
3. **Enumeration test**: am I re-listing facts the agent can grep? If yes, drop them — say "grep for X" instead of pasting X.
4. **Context inheritance**: will the agent spawn inside a directory whose `CLAUDE.md` is large (>4KB) and unrelated to the task? If yes, include a `RULES` line telling it to ignore that file's workflow prescriptions.
5. **Output ceiling**: did I specify a word ceiling and/or row cap? If no, add one.

## Failure-mode playbook

| If agent rejects with… | Do this |
|---|---|
| "Prompt is too long" | Cut enumerated facts; swap generic subagent for a named specialist; add RULES line telling it to skip directory CLAUDE.md workflows |
| Empty or stub output | Prompt was too vague — add concrete file:line references and one worked example of the output shape |
| Off-topic ramble | Missing CONSTRAINTS section — add explicit "do NOT explore X / Y / Z" |
| Timeout (>5min on simple task) | Missing word ceiling + missing scope boundary — add both |

## Template — copy-paste to start

```
You are analyzing <SCOPE>.

TARGET: <absolute paths>
TASK: <one sentence; read-only or write>
FORMAT:
  <schema / shape>
  Keep under <N> words.
CONSTRAINTS:
  - Do not <X>
  - Do not explore <Y>
RULES (if applicable):
  - Ignore the <plugin-name> CLAUDE.md's interview-first workflow;
    this is an audit, not a setup run.
```

## When to skip the preflight

- Prompt is under 2 paragraphs AND the subagent type matches a named specialist.
- The task is so scoped a wrong output won't cost a retry (e.g., "find all files matching X").

Everything else: run the 5-question checklist above. It's cheaper than a rejected spawn.
