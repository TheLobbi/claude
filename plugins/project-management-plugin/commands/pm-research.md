---
name: project-management-plugin:pm-research
intent: Run deep research protocol for a specific task using codebase, Perplexity, Context7, and Firecrawl sources
tags:
  - project-management-plugin
  - command
  - pm-research
inputs: []
risk: medium
cost: medium
description: Run deep research protocol for a specific task using codebase, Perplexity, Context7, and Firecrawl sources
---

# /pm:research — Manual Deep Research

**Usage**: `/pm:research {project-id} T-001 [--force-refresh] [--topic "custom query"] [--save]`

## Purpose

Manually triggers deep research for a specific task or an exploratory topic, bypassing the automatic 24-hour cache check. Use this command when:
- A task changed scope after the last research run and the cached brief is stale
- The initial automated research ran without MCP tools available (codebase-only) and you now want external documentation included
- You want to investigate a specific topic before deciding how to structure tasks
- A blocked task needs new information to become unblocked

## When a Task ID is Provided

1. Load `project.json` and the task record for T-{n} from `tasks.json`. If the task does not exist: error.
2. Check for an existing research brief at `research/{task-id}.md`. If it exists and `--force-refresh` is not set, warn: "A research brief already exists for T-{n} (cached {age}). Pass `--force-refresh` to overwrite." Stop.
3. If `--force-refresh` is set or no cache exists: proceed.

Invoke the `deep-researcher` agent directly with the full 4-source research protocol:

**Source 1 — Codebase and Artifacts**: Search `artifacts/` for outputs from completed tasks in the same story and epic. Extract patterns, decisions, and conventions already established. List all relevant files found.

**Source 2 — Project Documentation**: Read `plan.md`, the task's parent epic description, and the tech stack section of `project.json`. Extract constraints and context that affect implementation approach.

**Source 3 — Cross-Task Learning**: Search `research/` for existing briefs from tasks in the same story. Identify previously resolved questions that apply to this task. Extract any "watch out for" notes from prior execution notes.

**Source 4 — External Documentation (if MCP available)**: For each external library, API, or service mentioned in the task description or tech stack:
- Use Context7 MCP for library/framework documentation queries
- Use Perplexity MCP for knowledge queries about patterns, best practices, or error resolution
- Record the exact query used and the source URL for the research trail

Compile the research brief in this structure:
```markdown
# Research Brief: {task-title}

**Task**: T-{n}
**Cached at**: {iso-timestamp}
**Sources consulted**: {list}

## Relevant Context from Completed Work
{findings from artifacts and prior tasks}

## Technical Constraints and Conventions
{findings from project docs and tech stack}

## External Documentation
{findings from MCP queries, with source attribution}

## Key Decisions to Make
{open questions the task executor will need to resolve}

## Watch-Out Items
{known pitfalls, edge cases, or conflict areas}

## Suggested Implementation Approach
{brief 3-5 step plan the executor should follow}
```

After generating the brief: display it inline in the conversation so the user can review it.

If `--save` is set (or not explicitly declined): save to `research/{task-id}.md`. Set task `status: RESEARCHED` in tasks.json.

Announce: "Research complete for T-{n}. Brief saved to research/{task-id}.md."

## When --topic is Provided (No Task ID or Alongside Task ID)

`/pm:research {project-id} --topic "how to implement distributed rate limiting with Redis"`

Run exploratory research on the given topic without linking to a specific task. This is for pre-planning, architectural investigation, or answering open questions before task creation.

Invoke the `deep-researcher` agent with the topic as the primary query. Use Sources 3 and 4 from the standard protocol (skip codebase artifact search unless the topic is clearly codebase-specific). Display the research output inline.

If `--save` is set: save to `research/exploratory-{slugified-topic}-{date}.md`.

## --force-refresh Behavior

When `--force-refresh` is set and an existing brief is present: read the old brief first, then run new research. If the new research finds information that contradicts the old brief, explicitly call out the contradiction in the "Watch-Out Items" section of the new brief. Overwrite the old file.

## Research Quality Notes

The `deep-researcher` must follow these quality rules:
- Every external claim must cite a source (MCP query result, URL, or file path)
- If Context7 or Perplexity is unavailable, note it and proceed with sources 1–3 only
- The "Suggested Implementation Approach" must be specific to this task, not generic advice
- Research briefs must be self-contained — the executor should be able to implement the task reading only the brief and the task record, without needing to re-read the full project context
- Maximum brief length: 500 lines. If research produces more, summarize and link to raw notes in a separate file at `research/{task-id}-raw.md`
