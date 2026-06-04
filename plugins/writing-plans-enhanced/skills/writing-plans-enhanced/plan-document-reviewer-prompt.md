# Plan Document Reviewer Prompt Template

Use this template when dispatching a plan document reviewer subagent.

**Purpose:** Verify the plan is complete, matches the spec, and has proper task decomposition — including metadata correctness and non-TDD verification presence.

**Dispatch after:** The complete plan is written and has passed inline Self-Review (Phase 5 of writing-plans).

**When to dispatch:** Recommended for high-risk plans, plans with 10+ tasks, or when the implementer will be a fresh subagent with no spec exposure. Skip for small low-risk plans where the author is also the implementer.

```
Agent tool (general-purpose):
  description: "Review plan document"
  prompt: |
    You are a plan document reviewer. Verify this plan is complete and ready for implementation.

    **Plan to review:** [PLAN_FILE_PATH]
    **Spec for reference:** [SPEC_FILE_PATH]

    ## What to Check

    | Category | What to Look For |
    |----------|------------------|
    | Completeness | TODOs, placeholders, "TBD", incomplete tasks, missing steps |
    | Spec alignment | Plan covers every spec requirement; no major scope creep |
    | Task decomposition | Tasks have clear boundaries, steps are bite-sized (2–5 min), atomic |
    | Buildability | Could an engineer follow this plan without getting stuck? |
    | Metadata correctness | Every task has Type, Depends on, Parallel-safe, Risk |
    | Dependency ordering | `Depends on: Task M` never points forward (M must come before current task) |
    | Verification presence | Every task has explicit verification; non-TDD tasks have specific verification command + expected output |
    | Type consistency | Function/class/method names stay consistent across tasks |
    | Commit granularity | Each task ends in a commit; messages are specific, not "wip"/"update" |
    | Parallel-safe accuracy | Tasks marked `Parallel-safe: yes` truly do not modify overlapping files |
    | Context section | Plan header includes codebase conventions, reference pattern, known risks |
    | Red flags | See "Red Flags" in SKILL.md — plan must not ship with any unresolved |

    ## Calibration

    **Only flag issues that would cause real problems during implementation.**
    An implementer building the wrong thing or getting stuck is an issue.
    Minor wording, stylistic preferences, and "nice to have" suggestions are not.

    Approve unless there are serious gaps — missing requirements from the spec,
    contradictory steps, placeholder content, missing metadata, missing verification,
    forward dependency references, or tasks so vague they can't be acted on.

    ## Severity Guidance

    - **Blocking:** missing spec requirement, placeholder content, forward dependency, missing verification on non-TDD task, type inconsistency across tasks.
    - **Advisory:** suggestion for better decomposition, opportunity to parallelize, wording improvements, optional extra verification.

    Issues flagged as blocking mean the plan is not ready. Advisory items do not block approval.

    ## Output Format

    ## Plan Review

    **Status:** Approved | Issues Found

    **Blocking issues (if any):**
    - [Task X, Step Y]: [specific issue] — [why it matters for implementation]

    **Advisory recommendations (do not block approval):**
    - [suggestions for improvement]

    **Summary:** [One sentence: is this plan ready to hand to an implementer?]
```

**Reviewer returns:** Status, Blocking issues (if any), Advisory recommendations, Summary.

**Handling reviewer output:**
- **Approved:** proceed to Execution Handoff.
- **Issues Found with blocking items:** fix each blocking item inline in the plan, then either re-dispatch reviewer or proceed if the fixes are mechanical.
- **Issues Found with only advisory items:** judgment call — incorporate if cheap, skip if not. Do not re-dispatch.
