---
intent: "Decompose projects into granular micro-tasks using a 5-level hierarchy and INVEST principles"
description: "Decomposing projects into granular micro-tasks using 5-level hierarchy and INVEST principles"
---

# Project Decomposition Skill

## The 5-Level Hierarchy

Every project is decomposed through five progressively finer levels of granularity. Each level has a well-defined purpose, ownership boundary, and time budget. The hierarchy is not merely organizational — it drives the autonomous loop's scheduling, parallelism analysis, and research sequencing.

**Phase** represents a major, time-boxed milestone that a stakeholder could recognizably point to as "done." A phase might be "Authentication System" or "Data Pipeline Foundation." Phases are sequential by default and should map to natural delivery checkpoints where the project could theoretically pause and still leave something useful in a deployable state. Phases carry no estimate themselves; their duration is derived from the sum of their children.

**Epic** sits inside a phase and represents a coherent capability or functional slice — something a product team would put on a quarterly roadmap. An epic groups stories that share a common user-facing goal, a shared subsystem, or a shared delivery risk. Epics should be completable within a single sprint cycle (roughly 1–2 weeks of focused effort). If an epic would outlast a sprint, it needs to be split along a seam that preserves independent deployability.

**Story** is the unit of team-level planning. It answers "as a [role], I need [capability] so that [outcome]." Stories must be independently testable: when a story is complete, someone can verify it without finishing adjacent stories. Target range for a story is 2–8 hours. Stories crossing this boundary are consistently underestimated and should be split at the first natural decision point in the implementation.

**Task** is the unit of individual execution — a single, focused work session. Tasks should be completable by one person in one sitting without context-switching. Target range is 30–90 minutes. A task has a clear start state, a clear end state, and produces a single artifact (a file, a passing test suite, a merged PR, a configuration entry). Tasks with fuzzy end states are not tasks — they are stories masquerading at the wrong level.

**Micro-task** is the smallest executable unit, targeted at 5–30 minutes. Micro-tasks are generated just-in-time as the autonomous loop enters a task, not during initial decomposition. They represent the literal sequence of tool calls and file edits needed to satisfy one completion criterion on the parent task. Not all tasks require explicit micro-task expansion; straightforward tasks may be executed directly.

## Recursive Decomposition Threshold

The rule is simple: any item estimated above 30 minutes must be decomposed further before it is scheduled for execution. The only exception is a micro-task that cannot be meaningfully subdivided (e.g., "run tsc --noEmit and capture output"). When the autonomous loop encounters a task node above the threshold, it pauses execution, decomposes, writes the child nodes to tasks.json, and then re-enters the scheduling loop with the new children.

Decomposition is never purely mechanical. Before splitting a task, consider whether the split creates an artificial dependency. If sub-items A and B can only be verified together, they are not two tasks — they are one task with two acceptance criteria. Splitting them creates overhead without enabling parallelism.

## INVEST Criteria Applied Per Level

The INVEST mnemonic (Independent, Negotiable, Valuable, Estimable, Small, Testable) was designed for stories but the underlying principles apply at every level of the hierarchy with different emphasis.

At the Epic level, **Independence** means the epic does not require another epic to be in progress simultaneously to deliver value. Two epics that must always ship together are actually one epic. **Value** at the epic level means a stakeholder can articulate why this capability matters without reference to implementation details.

At the Story level, **Testability** is paramount. Every story must have at least one acceptance criterion that can be evaluated by someone who did not write the code. Vague criteria like "the page looks good" or "performance is acceptable" disqualify a story from being considered well-formed. Stories must be revised until every criterion is binary — it either passes or it does not.

At the Task level, **Estimability** becomes critical. A task that cannot be estimated within a factor of two is not well-understood. Before estimating, the executor should be able to name the primary file(s) to be modified, the inputs and outputs of the change, and the test that will confirm success. If any of these are unknown, the task requires a research micro-task first.

At the Micro-task level, **Smallness** dominates. A micro-task that cannot be described in a single sentence is too large. The description should name the exact tool or command, the exact file or endpoint, and the exact observable output.

## Completion Criteria Patterns by Task Type

Different task types have recognizable patterns for strong versus weak acceptance criteria.

For code implementation tasks, strong criteria name specific functions, modules, or API endpoints and state their expected behavior in terms of inputs and outputs. "The `createUser` function returns a 409 status when called with an email that already exists in the database" is strong. "User creation handles duplicates" is weak.

For documentation tasks, criteria should specify the document structure and minimum information content. "The README includes a Prerequisites section listing Node 18+, pnpm 8+, and PostgreSQL 15+" is strong. "The README is updated" is weak.

For test tasks, criteria specify coverage thresholds, the names of test cases added, or the regression scenario covered. "A test named 'rejects expired JWT tokens' exists in auth.test.ts and passes" is strong. "Tests are written for auth" is weak.

For design tasks, criteria reference specific design decisions captured in files or comments. "The component uses the `surface-2` token for its background color as defined in tokens.json" is strong. "The design is consistent with the system" is weak.

For DevOps and infrastructure tasks, criteria reference specific configuration state. "The Kubernetes deployment manifest sets `replicas: 3` and the pod anti-affinity rule prevents two replicas on the same node" is strong.

For research tasks, criteria specify the questions that must be answered. "The research brief answers: which pagination strategy the existing API uses, what the maximum page size limit is, and whether cursor-based pagination is supported" is strong.

For business process tasks, criteria specify the decision or artifact produced. "A Go/No-Go decision is recorded in decisions/vendor-selection.md with rationale covering cost, API rate limits, and SLA terms" is strong.

## Dependency Minimization

During decomposition, the default posture is to minimize dependencies. A dependency should be recorded only when the downstream task cannot begin without a specific artifact produced by the upstream task. Temporal preferences ("I'd like to do A before B") are not dependencies. Aesthetic preferences ("B would be cleaner with A done first") are not dependencies. Only hard data or artifact requirements qualify.

When a set of tasks has no dependencies between them, they form a parallelizable group. The decomposition output should explicitly annotate parallelizable groups because the autonomous loop uses this annotation to decide whether to attempt concurrent execution or sequential scheduling. Groups where tasks share a file as output should not be parallelized even if they have no formal dependency — concurrent writes to the same file will produce conflicts.

## Parallelization Analysis

After the initial decomposition pass, the skill performs a second pass specifically to identify parallelism opportunities. For each leaf task, it computes the set of files it reads and the set of files it writes. Two tasks are parallelizable only if their write sets do not intersect and neither task's read set contains a file in the other's write set. This analysis is conservative by design. When uncertain, tasks are placed in sequence.

The parallelism annotation is recorded in tasks.json as a `parallel_group` string. Tasks sharing the same group identifier may be dispatched concurrently. The autonomous loop respects this annotation but may choose sequential execution if the runtime context (e.g., rate limits, token budget) makes parallelism impractical.
