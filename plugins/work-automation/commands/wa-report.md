---
name: wa-report
intent: Generate an ULTRA §13-compliant Work Unit Report from the current session.
tags:
  - ultra
  - work-unit
  - reporting
inputs: []
risk: low
cost: low
description: Produce the Work Unit Report per ULTRA §13. Reads session artifacts (files written, test outputs, git status) and fills in all seven sections.
flags:
  - name: save
    type: boolean
    description: Persist to docs/WORK-UNIT-<NN>-<slug>.md (default true)
---

# /wa-report

Produce the Work Unit Report per ULTRA §13. Reads session artifacts (files written, test outputs, git status) and fills in all seven sections.

## Sections (all required)

1. **What was implemented** — bullet list, each with `path — one-line purpose`.
2. **Test totals** — per-suite PASS counts + total + duration.
3. **Why** — ULTRA self-check answers (7 questions).
4. **What's COMPLETE** — Section 20 table (Artifact / Status / Evidence).
5. **What's INCOMPLETE** — explicit follow-up list with per-item estimate.
6. **Risks flagged** — unmitigated risks, observability gaps, untested paths.
7. **Awaiting decision** — blocking user decisions (options a/b/c).

## Flow

1. Collect evidence: `git status`, `git log --oneline -20`, last test-run output, files newer than session start.
2. Cross-check each artifact exists at its reported path.
3. Verify test counts against `tools/run-all-tests.ps1` output (or project equivalent).
4. Emit report; save to `docs/WORK-UNIT-<NN>-<title>.md` unless `--save=false`.
5. Append audit entry to `state/change-log.jsonl`: `{ts, actor, component: "work-unit", action: "closed", work-unit: <NN>}`.

## Truth discipline

- **No** claims of "done" without an evidence path.
- **No** test counts pulled from memory — re-verify.
- **No** "complete" row in Section 20 without a green test or a re-run log.

## See also

- `skill: work-unit-protocol`
- `/wa-work-unit` — open the unit.
- `rules/ultra-mode.md` §13, §20.
