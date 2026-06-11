---
intent: "Validate task completion against acceptance criteria with per-type automated checks"
description: "Validating task completion against acceptance criteria with per-type automated checks"
---

# Quality Gates Skill

## The Binary Validation Protocol

Every task completion passes through a quality gate before its status transitions to COMPLETE. The gate is not advisory — a task that fails its gate is immediately moved to VALIDATING status (if it was IN_PROGRESS) and the autonomous loop treats it as incomplete. The executor must address every failed criterion before re-submitting for validation.

The foundational rule is binary evaluation: each acceptance criterion is either PASS or FAIL. There is no partial credit, no "mostly done," and no subjective judgment. If a criterion cannot be evaluated with a definitive PASS or FAIL, the criterion itself is malformed and must be rewritten before the task can proceed. The quality gate skill includes a criterion linter that flags vague language — any criterion containing the words "appropriate," "reasonable," "good," "better," "clean," "proper," "sufficient," or "correct" (without a specific measurement) is rejected as unevaluable.

The gate evaluates criteria in the order they are listed in the task's `completion_criteria` array. Evaluation stops at the first FAIL and the failing criterion is recorded. This is not because subsequent criteria don't matter — they do — but because a failing criterion often indicates a fundamental problem that makes subsequent criteria meaningless to evaluate. Once the failing criterion is reported and remediated, the full gate runs again from the beginning.

## Per-Task-Type Automated Checks

Different task types trigger different automated check suites. The task `level` and `tags` fields together determine which suite applies.

**Code implementation tasks** (tagged `code` or `implementation`) trigger the code quality suite. The suite runs in this order: TypeScript compilation (`npx tsc --noEmit` from the project root), ESLint (`npx eslint` on the modified files), and the test suite filtered to files related to the changed modules (`pnpm test --related` or equivalent). All three must exit with code 0. A compilation error is a hard FAIL that prevents lint and test from running — fixing type errors first is required. A lint warning that is not configured as an error does not constitute a FAIL, but lint errors do. Test failures are FAIL regardless of the number of passing tests — a partially passing test suite is not acceptable.

**Documentation tasks** (tagged `docs`) trigger the documentation completeness suite. The suite checks that each required file exists at the expected path, that each required section heading is present in the document (using a case-insensitive grep), and that the document's word count meets the minimum specified in the criterion (if one is given). Documentation tasks do not run tsc or eslint unless they involve code samples embedded in markdown that are explicitly marked as runnable.

**Test tasks** (tagged `test`) trigger the test-focused suite. The suite runs the specific test file(s) created or modified by the task in isolation (`pnpm test path/to/test.ts`), checks that the new test names match the names specified in the completion criteria, and checks that the test file does not have any `it.only`, `describe.only`, or `test.only` calls (which would make the rest of the test suite silently skip). Coverage thresholds specified in the criteria are validated using the `--coverage` flag if available.

**Configuration tasks** (tagged `config`) trigger the configuration validation suite. JSON configuration files are validated with `python3 -m json.tool` or equivalent. YAML files are validated with a YAML parser. Environment variable files (`.env.*`) are checked to ensure no actual secret values are present — only placeholder strings. Kubernetes manifests are validated with `kubectl --dry-run=client -f` if kubectl is available.

**Design tasks** (tagged `design` or `ui`) trigger the design consistency suite. Token references are verified against the project's design token file (typically `tokens.json` or the Tailwind config). Component prop types are checked against the established component API patterns. Accessibility attributes (`aria-*`, `role`, `tabIndex`) required by the criterion are verified to be present in the rendered output or component source.

**Research tasks** (tagged `research`) trigger the research completeness suite. The research brief file must exist at the expected path. The brief must contain each of the question strings listed in the completion criteria. Each question must have at least one paragraph of substantive answer following it (not just a restatement of the question).

**DevOps and infrastructure tasks** (tagged `devops` or `infra`) trigger the infrastructure validation suite. Terraform plans are validated with `terraform validate`. Helm charts are validated with `helm lint`. Shell scripts are checked with `shellcheck` if installed. All infrastructure change scripts must be idempotent — the criterion "running the script twice produces the same end state" is automatically added to any infra task that does not already include it.

## Evidence Requirement Per Criterion

Each criterion evaluation must produce evidence — a recorded output that demonstrates how the PASS or FAIL determination was made. For automated checks, the evidence is the command output (stdout + stderr + exit code). For manual checks, the evidence is a one-sentence description of what was observed and where.

Evidence is appended to the task's entry in `progress/log.md` as a `VALIDATION` event. The evidence record includes: the criterion text, the verdict (PASS/FAIL), the check type (automated/manual), the command run (for automated checks), and the observed output (truncated to 500 characters if longer). This creates an auditable record that enables post-mortem analysis of why tasks were re-executed.

Evidence is never fabricated. If an automated check cannot be run (e.g., the required tool is not installed), the criterion is marked INDETERMINATE rather than PASS or FAIL. An INDETERMINATE criterion prevents task completion — the missing tool must be installed or the criterion must be replaced with one that can be evaluated with available tools.

## BLOCKED State Protocol

A task transitions to BLOCKED when a quality gate failure reveals a dependency or constraint that cannot be resolved by the executor alone. The distinction between a regular FAIL (executor can fix it) and a BLOCKED transition (human intervention required) depends on the nature of the failure.

Regular failures — compilation errors, failing tests, missing files, malformed JSON — are within the executor's ability to fix. The executor should address them and re-run the gate without escalating.

BLOCKED conditions include: a completion criterion that requires access to an external system that is unavailable (e.g., a staging environment that is down), a design decision that contradicts an architectural constraint not previously surfaced (e.g., "add caching" when the architecture explicitly prohibits caching in this service), a security concern that requires human sign-off (e.g., a criterion involving cryptographic key generation where the key material must be reviewed by a human), or a dependency on another BLOCKED task.

When a task is moved to BLOCKED, the `blocked_reason` field must be populated with a complete explanation that a human can act on without additional context. A good blocked reason names the specific obstacle, explains why the executor cannot resolve it autonomously, and suggests what the human should do. A blocked reason of "needs help" is not acceptable.

## Forbidden Vague Criteria Phrases

The quality gate enforces a blocklist of criterion language that has been found consistently unevaluable in practice. Any criterion containing the following phrases (case-insensitive) is flagged during the criterion linter step, which runs at task creation time (not just at validation time):

"looks good," "works correctly," "is properly," "is handled," "is improved," "is updated" (without specifics), "is tested" (without naming specific tests), "is documented" (without naming specific documents and sections), "as expected" (without stating what the expectation is), "no errors" (without specifying which error type or tool), "runs successfully" (without specifying the exact command and expected output), "is complete" (as a criterion itself — circular), and "all edge cases" (without enumerating the edge cases).

When the linter detects a forbidden phrase, it does not block task creation — it adds a `criteria_warning` annotation to the task and appends a warning to the progress log. The warning names the specific criterion and the specific phrase, and suggests a rewrite template. The human or the decomposition skill must revise the criterion before the task enters the execution loop; tasks with `criteria_warning` annotations are deprioritized in scheduling.
