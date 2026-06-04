# Project Management Plugin

Universal project manager. Interview-first initialization, micro-task decomposition (5-15 min),
deep research before every task, autonomous execution loop with HITL triggers, 9 PM platform integrations.

**Commands (20)**: /pm:init (interview), /pm:plan (decompose), /pm:work (execute cycle),
/pm:auto (loop), /pm:status (dashboard), /pm:task (CRUD), /pm:research, /pm:review,
/pm:checkpoint, /pm:focus, /pm:report, /pm:risk, /pm:integrate, /pm:sync, /pm:next,
/pm:delegate, /pm:retrospective, /pm:template, /pm:backlog, /pm:debug

**Agents (16)**: project-orchestrator (opus), project-interviewer (opus), scope-architect (opus),
task-decomposer (sonnet), dependency-resolver (sonnet), research-dispatcher (sonnet),
deep-researcher (sonnet), task-executor (sonnet), progress-monitor (haiku), quality-reviewer (sonnet),
risk-assessor (sonnet), context-guardian (haiku), pm-integrator (sonnet), pattern-recognizer (haiku),
council-reviewer (opus), checkpoint-manager (haiku)

**Skills (7)**: project-decomposition, research-protocol, task-state-management,
quality-gates, progress-visualization, project-templates, pm-integrations

**State**: .claude/projects/{id}/ — project.json, tasks.json, research/, checkpoints/, artifacts/
**Credentials**: PM tokens via CLAUDE_PLUGIN_OPTION_* env vars (set at /plugin enable time)

## When to open deeper docs
| Signal | Open docs | Why |
| --- | --- | --- |
| You need setup or usage details | README.md | Install steps and command/usage reference. |
| You are changing plugin behavior | the relevant commands/, agents/, or skills/ file | Source of truth for behavior. |
| You need the full inventory | commands/, agents/, skills/ directories | Complete list beyond this summary. |
