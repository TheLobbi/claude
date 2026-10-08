# Dispatch reliability: router gate, capacity routing, retries, queue coalescing

These rules are for whoever dispatches lanes: coordinators, and lanes that
spawn children. The tool is `lib/fleet/dispatch-check.mjs`. It is read-only:
it makes a GET against the router management API and SELECTs from T3's
`statev2.sqlite`, opened read-only. It never cancels, sends or retries
anything. Its exit codes are 0 for ok, 1 for a finding and 2 for a
usage or instrument error.

```bash
# Router gate. The management password comes from Doppler at call time and is never printed.
doppler run -p dev-workstation -c dev --only-secrets MANAGEMENT_PASSWORD -- \
  node lib/fleet/dispatch-check.mjs router
node lib/fleet/dispatch-check.mjs capacity      # limits from T3 state plus router gate (needs the password for the gate)
node lib/fleet/dispatch-check.mjs queue         # cancel/keep per queuedRunId; never cancels
node lib/fleet/dispatch-check.mjs retry --key <clientRequestId> [--failure-class C --failure-message M --model M]
```

## D1. Run the gate before every Codex dispatch

Run `dispatch-check router` before any dispatch to `gpt-6.1-sol` or another Codex model.

| Verdict | Meaning | Action |
|---|---|---|
| `OPEN` | At least one healthy account; recent traffic is mostly succeeding | Dispatch to Codex |
| `FLAG` | Only one healthy account, at least 50% of the last 10 or more requests failing, or an account needs re-login | Dispatch short or idempotent work only; send long or must-finish work to `claude-opus-5-5` |
| `REFUSE` | No healthy Codex accounts | Do not dispatch to Codex; route to `claude-opus-5-5` |

The router's per-account `status` records the outcome of that account's
**last** request, and a router restart resets it to `active`. That is why the
gate reads three things: the status, the status message (an invalidated OAuth
token always counts as broken), and recent traffic. It also prints
`verified by recent success N`. An `OPEN` with 0 verified accounts means
"nothing has proven it works since the restart", not "proven healthy".

## D2. Route lanes by capacity, never into a limited provider

Run `dispatch-check capacity` before a batch of dispatches.

- Ordinary lanes go to `gpt-6.1-sol` (Codex) or `claude-opus-5-5`, in that
  order, skipping a provider that is limited.
- A provider is limited in two cases:
  - **Claude**: a session-limit banner ("You've hit your session limit ·
    resets 9:10pm (America/Los_Angeles)") counts until the next occurrence of
    that wall-clock time in that zone. A `usage_limit` error item without a
    reset time counts for 60 minutes after the last occurrence. The latest
    end wins, so a cooldown-only event can extend past a stated reset. The
    bias is deliberately toward LIMITED.
  - **Codex**: the router gate says `REFUSE`. A `FLAG` makes Codex the second
    choice.
- **Fable and Hestra are reserved for coordinators.** A lane brief that names
  one is refused. If every ordinary route is limited, **hold** the dispatch.
  Do not promote a lane onto a reserved model to get capacity.

## D3. Retry only what T3 never accepted

Every dispatch carries a stable `clientRequestId`. T3 records every MCP
command it accepts as a command receipt (in its own state DB; these are not
the lane completion receipts of §6b) whose id ends with that key:
`command:mcp:<session>:thread-send:<key>`. Before any retry, run
`dispatch-check retry --key <key>`, which decides from those receipts.

| What T3 shows | Decision |
|---|---|
| No receipt for this attempt's key and no failure (the response was lost) | `resend` with the **same** key. T3's receipt dedupe absorbs a race |
| A receipt, and the run is queued, running, completed, cancelled or unknown | `inspect`: read the run. **Never resend** |
| A receipt for the next attempt's key | `inspect`: that retry already happened |
| A receipt, and the run `failed` or was `interrupted` with a retryable class | New attempt with key `<key>-a<n>` (stable for that attempt) |
| Failure class `usage_limit` | Switch provider (`gpt-6.1-sol` ↔ `claude-opus-5-5`); if the other side is also limited, `hold` |
| A Codex stream disconnect or overload, or a router gate other than `OPEN` | Fall back from `gpt-6.1-sol` to `claude-opus-5-5` immediately |
| Claude transport error | Retry on the same model, backing off 30 s, 60 s and so on up to a 10 min cap |
| Non-retryable class (for example `model_not_found`) | `escalate` |
| After 3 attempts | `escalate` |

Never run an auto-retry loop. Each retry is one decision, made against fresh
receipts.

## D4. Coalesce before you queue

Before queuing a follow-up to a thread with an active turn:

1. Run `t3_queue_list` for that thread, plus `dispatch-check queue`.
2. If a queued message already carries the same ask, **edit it**
   (`t3_queue_edit`) into one combined message rather than adding another.
3. Bump the round suffix (`-r2`) only when the ask itself changed. The
   detector treats a higher round as superseding the lower one.
4. Any cancel goes through `t3_queue_cancel` with the exact `queuedRunId`
   from the detector, after you have read it. The detector only recommends.

The detector recommends `cancel` in three cases:

- **duplicate**: same thread, same normalised text; the earliest copy is kept.
- **superseded**: a higher `-rN` round of the same key, or a later message
  that names this key after the word "supersedes".
- **satisfied**: done-evidence exists for the message's key or PR reference,
  either a completed run of the same key in that thread or caller-supplied
  `--evidence-json` such as a merged PR.

Everything else is `keep`. A message queued behind an active run is
annotated with that run id.

## Proposed router configuration (not applied; owner decision)

These come from the 2026-10-08 router evidence. They need the router owner;
no lane applies them.

- Re-login `development+codex-3` (its OAuth was invalidated and the refresh
  returned 401).
- Shorten the 24 h session affinity, which pins a thread to an overloaded
  account.
- Make the router's own `health.ps1` count rate-limited and overloaded
  accounts as transient rather than invalid.
- Give T3's `usageLimitSources` a real management key; today it holds a
  masked placeholder, so T3 cannot see router quota.
- Evaluate the router upgrade (7.3.7 → 8.0.17) for retrying `response.failed`
  overloads that arrive before any output.
