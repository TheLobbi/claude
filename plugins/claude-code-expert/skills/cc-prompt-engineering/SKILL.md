---
name: cc-prompt-engineering
description: Craft effective CLAUDE.md routing, agent system prompts, skill descriptions, rule files, and task framings. Use this skill whenever writing a CLAUDE.md, authoring a subagent, writing a skill description, crafting a /command prompt, framing an ambiguous task for Claude, or debugging why Claude isn't picking up guidance. Triggers on: "write a CLAUDE.md", "agent prompt", "skill description", "pushy description", "task framing", "claude isn't following", "make claude do X", "rules not loading".
---

# Prompt Engineering

Instructions that make Claude Code do the right thing consistently. Everything below is a prompt — just scoped differently.

## The four surfaces

| Surface | Loaded | Use for |
|---|---|---|
| CLAUDE.md | always | Routing, build commands, conventions, hard rules |
| Skill description (frontmatter) | always | Trigger conditions, what/when |
| Skill body | on activation | Workflow, decision trees, MCP delegation |
| Agent system prompt | on invocation | Role, approach, output format |

## CLAUDE.md

Target: ≤120 lines, routing-only, no reference material.

Structure:

```markdown
# {Project Name}

## Build & Test
- Install: `pnpm install`
- Build: `pnpm build`
- Test: `pnpm test`
- Lint: `pnpm lint`

## Tech Stack
{one line per layer: runtime, framework, DB, infra, CI/CD}

## Key Paths
- Source: {src}
- Tests: {tests}
- Docs: {docs}

## Decision trees
- Auth tasks → check {auth-dir} first
- DB migrations → check {migrations-dir} first

## Conventions
- {convention 1}
- {convention 2}

## Don't touch
- {auto-generated files}
```

**Rules:**
1. No skill-body content in CLAUDE.md — route to skill via frontmatter trigger.
2. Hard rules (invariants) in a top-level section.
3. Each bullet under 2 lines.
4. If a section exceeds 20 lines, move it to `.claude/rules/{topic}.md` and reference it.

## Skill descriptions — be "pushy"

Per skill-creator guidance, Claude undertriggers skills by default. Counteract by making descriptions specific and forceful.

**Bad:**
```
description: How to build dashboards.
```

**Good:**
```
description: How to build a simple fast dashboard to display internal Anthropic data. Make sure to use this skill whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of company data, even if they don't explicitly ask for a "dashboard".
```

Include:
- What the skill does (action-oriented verb)
- ≥3 specific trigger contexts
- Phrases users might say ("whenever X", "even when Y")

## Agent system prompts

Three-section structure:

```markdown
## Role
{Single-sentence role statement}

## Approach
1. {Step 1}
2. {Step 2}
3. {Step 3}

## Output format
{Exact shape of the return value}
```

**Rules:**
1. No trailing "be helpful" filler — agents do what you tell them, not what you imply.
2. Specify tool restrictions in `allowed-tools` frontmatter, not in prose.
3. Give the output format as a template, not a description.

## Task framing

When invoking an agent or /command, frame the task so it stands alone:

```markdown
Task: {one-sentence what}
Context: {what matters and why}
Already tried: {what's been ruled out}
Constraints: {what must hold}
Out of scope: {what not to touch}
Expected output: {specific shape}
```

Missing any of these → agent invents answers or goes off-scope.

## Rules files (`.claude/rules/*.md`)

`.claude/rules/*.md` files auto-load alongside CLAUDE.md. Use for:
- Long hard-rule lists (too much for CLAUDE.md)
- Technology-specific conventions (`typescript.md`, `python.md`)
- Workflow-specific rules (`git-workflow.md`, `testing.md`)

Each rules file ≤ 150 lines. Reference from CLAUDE.md: `@.claude/rules/typescript.md`.

## Common failures

| Symptom | Likely cause |
|---|---|
| "Claude isn't following this rule" | Rule is in a skill body but skill isn't triggering — move to CLAUDE.md |
| "Claude invokes skill at wrong times" | Description too broad; narrow the triggers |
| "Claude never picks up skill" | Description too abstract; make pushy |
| "Claude ignores agent output format" | Format described in prose, not as a template |
| "CLAUDE.md is huge and ignored" | Move content to references; keep CLAUDE.md as routing |

## MCP delegation

| Need | Tool |
|---|---|
| Starting templates | `cc_docs_full_reference("prompt-engineering")` |
| Validate skill quality | run `plugin-validator` or `skill-reviewer` agent |

## Anti-patterns

- CLAUDE.md as a knowledge dump → budget explosion + routing fails.
- Skill description with template tokens (`{stack_name}`) → rot.
- Agent prompt without output format → inconsistent returns.
- Rules files loaded but never referenced → dead weight.
- Multiple sources of truth for the same rule → drift.

## Reference

- [claude-md-patterns.md](references/claude-md-patterns.md) — CLAUDE.md templates for common stacks
