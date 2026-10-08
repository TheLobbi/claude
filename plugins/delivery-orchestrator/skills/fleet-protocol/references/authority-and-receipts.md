# Authority classes, escalation receipts and the done rule

Checker: `lib/fleet/classify-authority.mjs` (`classifyBlocker`, `validateReceipt`,
`reconcileReceipts`). Tests: `tests/authority-classifier.test.mjs`.

## Why

In the 2026-10-08 MCP Apps run, eight lanes each listed every step after
"open the PR" under a "Markus-only steps" header. That list mixed three
different things:

- Entra Graph edits that the lane rules delegated and that the
  `claude-tenant-admin` app had the permission (`Application.ReadWrite.All`)
  to perform;
- a Developer Portal registration that no agent could perform, because no
  automated path existed;
- deploys and publishing, which really are the founder's call.

Six runs were cancelled at the same moment and posted nothing. Their reports
went to a session the coordinator did not read. The founder found the stall
by hand.

A blocker is classified from facts the lane can state. "It touches a tenant"
and "it is a browser step" are not classes.

## Decision table

Evaluate the rows top to bottom. The first row that matches wins.

| # | Fact | Class | Goes to | Founder involved? |
|---|---|---|---|---|
| 1 | Irreversible, or one of: merge into the default branch, publish (store or catalog, including retiring a catalog entry), tenant-wide permission grant, production access grant, billing, deleting customer data, production cutover | **IRREVERSIBLE/FOUNDER** | lane → coordinator → parent → founder | Yes, and **only** through the parent |
| 2 | Reversible, but no automated path or permission exists yet | **MISSING-CAPABILITY** | coordinator, naming the **exact** permission or capability | Never as a question; the coordinator obtains or builds the capability |
| 3 | Reversible, and covered by an existing grant (a permission the identity already holds and the rules allow it to use) or delegated by the brief | **AGENT-AUTHORIZED** | proceed, then post a completion receipt | No |
| 4 | Reversible and capable, but neither the brief nor a grant covers it | **COORDINATOR-DECISION** | coordinator, who extends the brief or denies it | No |

Rules that follow from the table:

- **Agent-initiated reversible actions inside a delegated brief proceed
  without founder sign-off.** A lane that lists an AGENT-AUTHORIZED step as
  "yours to do" has misfiled it.
- **The founder is reached only through the parent, and only for row 1.** A
  lane never addresses the founder or user directly. A coordinator never
  forwards a row 2–4 blocker upward as a founder question.
- **A MISSING-CAPABILITY receipt names the exact permission or capability.**
  Write "Graph application permission `X` on app `Y`" or "a delegated Microsoft
  365 token for the Developer Portal API". "Needs admin" or "browser step" is
  not a name. If the exact scope is unproven, write the capability plus
  `UNKNOWN: <what would settle it>`.
- **A blocker parks a decision, never a lane.** Continue with every step that
  does not depend on its output.
- **"Ask the user" is not a class.** A runtime question to a human about a
  reversible action is a COORDINATOR-DECISION. Post it as a receipt with a
  default, and continue on the default.

## Escalation receipt

One JSON object per blocker. The lane appends it to the run's `receipts.jsonl`
and also sends it, verbatim, as a T3 message to the coordinator's thread. A
message sent to a session the coordinator does not read is not a receipt.

| Field | Required | Meaning |
|---|---|---|
| `threadId` | always | The lane's T3 thread id, in full |
| `runId` | always | The T3 run the receipt closes or escalates from |
| `kind` | always | `completion` · `failure` · `escalation` |
| `postedAt` | always | UTC, `YYYY-MM-DDTHH:MM:SSZ` |
| `exactText` | always | The blocker or outcome, quoted exactly as it appears in the PR body or report |
| `evidence` | always, ≥1 | PR URL + head SHA, file path, command + exit code, Graph read result |
| `blockerClass` | escalation | One of the four classes. AGENT-AUTHORIZED is rejected because it is not a blocker |
| `requestedDecision` | escalation | One decision, answerable yes/no or by choosing one option |
| `defaultIfNoAnswer` | escalation | What happens if nobody answers. Row 1: "do not perform; keep the PR open". Rows 2–4: the reversible default the lane will take |
| `missingCapability` | MISSING-CAPABILITY | The exact permission or capability |
| `escalateTo` | escalation | `coordinator`, or `parent` for row 1 only. Never `founder`, `user` or a person's name |

```json
{"threadId":"mcp:6e390e8a-…","runId":"run:…:ordinal:1","kind":"escalation",
 "postedAt":"2026-10-08T07:54:02Z",
 "exactText":"Teams Developer Portal → Entra SSO client ID registration for 5886a66a-…",
 "evidence":["https://github.com/TheLobbi/wagonworks-bots/pull/2 @ 42ec4d4"],
 "blockerClass":"MISSING-CAPABILITY",
 "missingCapability":"Delegated M365 token for the Teams Developer Portal API (no app-only Graph permission covers OAuth/SSO registration). UNKNOWN: exact scope; settle from the Agents Toolkit oauth/register docs",
 "requestedDecision":"Provision a delegated service sign-in for Dev Portal registration, or perform the registration once",
 "defaultIfNoAnswer":"Placeholder reference_id stays; Entra Graph edits wait on the generated URI; all other work proceeds",
 "escalateTo":"coordinator"}
```

Validate: `node lib/fleet/classify-authority.mjs --receipts receipts.json`.

## The done rule

**A lane is done only when it has posted a completion or failure receipt for
its run.** A PR, a final chat message or a heartbeat of `standby` is not
enough. A run that ends cancelled or interrupted still owes a failure receipt.
If the lane cannot post one, the coordinator records the missing receipt as a
finding. It does not infer success.

## Coordinator rules

1. **Surface missing receipts.** At every census, list the runs that reached
   a terminal T3 state (`completed`, `failed`, `cancelled`, `interrupted`) and
   have no completion or failure receipt. The set size is part of the result:
   "0 missing of N terminal runs".
2. **Reconcile claims against T3 state.** A completion receipt for a run whose
   T3 status is not `completed` is a claim mismatch. Read the thread and do not
   trust the receipt.
3. **Re-route misfiled blockers.** If a lane files a row 3 action as founder
   work, send it back as AGENT-AUTHORIZED. Answer a row 4 blocker yourself.
   Resolve a row 2 blocker by naming who obtains the capability. Forward only
   row 1, and only to the parent.
4. **Briefs grant by action, not by class.** Do not write "Entra / Doppler /
   deploy steps are Markus-only" in a brief. List each action with its row in
   the table above.

Check the run state against the receipts: `node lib/fleet/classify-authority.mjs
--reconcile runs.json receipts.json`. Here `runs.json` is `[{threadId, runId,
status}]` from `t3_thread_list` / `t3_thread_read`.
