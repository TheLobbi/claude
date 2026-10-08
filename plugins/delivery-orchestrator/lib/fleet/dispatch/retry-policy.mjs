/**
 * Retry / fallback policy for a dispatch (t3_thread_send, delegate_task,
 * t3_thread_launch) whose run failed or whose response was lost.
 *
 * The rule that makes it safe: a retry is allowed ONLY when T3 shows no
 * accepted command for that clientRequestId family. T3 records MCP commands
 * in orchestration_command_receipts with
 *   command_id = "command:mcp:<session>:<op>:<clientRequestId>"
 * so "was it accepted?" is a lookup, not a guess. If it was accepted, a run
 * exists (or existed) — inspect it, never send again.
 *
 * Keys are stable: attempt 1 uses the caller's key; attempt n uses
 * "<key>-a<n>". The same attempt retried after a lost response therefore
 * reuses the same key, and T3's own receipt dedupe absorbs the duplicate.
 */

import { FALLBACK_MODEL } from './router-health.mjs';

export const PRIMARY_MODEL = 'gpt-6.1-sol';

const RETRYABLE_RE = /stream disconnected|stream closed before|connection reset|server_is_overloaded|overloaded|request timed out|error sending request|\b50[234]\b/i;

/** The key for attempt n of a dispatch. Attempt 1 is the key itself. */
export function attemptKey(key, attempt) {
  return attempt <= 1 ? key : `${key}-a${attempt}`;
}

/** Does a receipt command_id belong to this key's family (any attempt)? */
export function inKeyFamily(commandId, key) {
  const tail = String(commandId || '').split(':').pop();
  return tail === key || new RegExp(`^${escapeRe(key)}-a\\d+$`).test(tail);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** transport | usage_limit | provider_overload | permanent */
export function failureKind(failure) {
  if (!failure) return 'permanent';
  if (failure.class === 'usage_limit') return 'usage_limit';
  if (failure.class === 'transport_error') return 'transport';
  return RETRYABLE_RE.test(String(failure.message || '')) ? 'provider_overload' : 'permanent';
}

/** Exponential backoff, capped. attempt is the attempt about to be made (2..n). */
export function backoffMs(attempt, { baseMs = 30_000, capMs = 600_000 } = {}) {
  return Math.min(capMs, baseMs * 2 ** Math.max(0, attempt - 2));
}

function stop(action, reason) {
  return { action, retry: false, reason };
}

const RETRYABLE_RUN_STATUS = new Set(['failed', 'interrupted']);

const tailOf = (commandId) => String(commandId || '').split(':').pop();

/**
 * Gate on T3's receipts. Returns a stop decision, or null when a new attempt
 * cannot duplicate anything:
 *   - a receipt for the NEXT attempt key  -> already retried; inspect it
 *   - a receipt for THIS attempt key and the run is not terminal-failed
 *     (queued, running, completed, cancelled, unknown) -> inspect, never resend
 *   - no receipt for THIS key and no failure -> the dispatch was never
 *     accepted; resend with the SAME key (T3 dedupes a race)
 */
function receiptGate({ key, attempt, receipts, runStatus, failure }) {
  const current = attemptKey(key, attempt);
  const next = attemptKey(key, attempt + 1);
  if (receipts.some((c) => tailOf(c) === next)) return stop('inspect', `T3 already accepted ${next}; read that run`);
  const acceptedNow = receipts.some((c) => tailOf(c) === current);
  if (acceptedNow && !RETRYABLE_RUN_STATUS.has(runStatus)) {
    return stop('inspect', `T3 accepted ${current} and its run is ${runStatus || 'unknown'}; read it, do not resend`);
  }
  if (!acceptedNow && !failure) {
    return { action: 'resend', retry: true, clientRequestId: current, attempt, delayMs: 0, reason: `no receipt for ${current}; never accepted, resend with the same key` };
  }
  return null;
}

/**
 * Decide what to do after a failed or unanswered dispatch.
 *
 * input: {
 *   key            the stable clientRequestId of the original dispatch
 *   attempt        the attempt that just failed or went unanswered (1-based)
 *   receipts       command_ids T3 accepted for this key family (t3-state.readReceipts)
 *   runStatus      status of the run that attempt produced, if any
 *   failure        { class, message } of the failed run, or null
 *   model          the model of that attempt
 *   routerVerdict  OPEN | FLAG | REFUSE from router-health
 *   capacity       capacitySnapshot() result; a next model whose provider is
 *                  limited there makes the decision `hold`
 *   maxAttempts    default 3
 * }
 */
export function decideRetry(input) {
  const { key, attempt = 1, receipts = [], runStatus = null, failure = null, model = PRIMARY_MODEL, routerVerdict = 'OPEN', capacity = null, maxAttempts = 3 } = input;
  if (!key) return stop('refuse', 'no clientRequestId — an unkeyed dispatch can never be retried safely');
  const gated = receiptGate({ key, attempt, receipts, runStatus, failure });
  if (gated) return gated;
  const kind = failureKind(failure);
  if (kind === 'permanent') return stop('escalate', `non-retryable failure: ${String(failure?.message || failure?.class || 'none').slice(0, 120)}`);
  if (attempt >= maxAttempts) return stop('escalate', `attempt ${attempt} of ${maxAttempts} used`);
  return nextAttempt({ key, attempt, kind, model, routerVerdict, capacity });
}

/** usage_limit: switch provider. Codex overload/transport, or a non-OPEN router: fall back to Claude. */
function chooseModel(kind, model, routerVerdict) {
  if (kind === 'usage_limit') return otherModel(model);
  if (model !== PRIMARY_MODEL) return model;
  return routerVerdict !== 'OPEN' || kind === 'provider_overload' || kind === 'transport' ? FALLBACK_MODEL : model;
}

/** Provider that serves a model on the ordinary routes. */
export function providerOf(model) {
  return model === PRIMARY_MODEL ? 'codex' : 'claudeAgent';
}

/** Why the next model cannot run now, or null. */
function blockedReason(nextModel, routerVerdict, capacity) {
  if (nextModel === PRIMARY_MODEL && !['OPEN', 'FLAG'].includes(routerVerdict)) return `the Codex router gate is ${routerVerdict || 'UNKNOWN'}`;
  const p = capacity?.providers?.[providerOf(nextModel)];
  return p?.limited ? `${providerOf(nextModel)} is limited until ${p.until}` : null;
}

function nextAttempt({ key, attempt, kind, model, routerVerdict, capacity }) {
  const next = attempt + 1;
  const nextModel = chooseModel(kind, model, routerVerdict);
  const blocked = blockedReason(nextModel, routerVerdict, capacity);
  if (blocked) return stop('hold', `${kind} on ${model} and ${blocked} — no unlimited route; hold and re-check capacity`);
  return {
    action: nextModel === model ? 'retry' : 'fallback',
    retry: true,
    clientRequestId: attemptKey(key, next),
    attempt: next,
    model: nextModel,
    delayMs: nextModel === model ? backoffMs(next) : 0,
    reason: `${kind} on ${model}; router ${routerVerdict}`,
  };
}

function otherModel(model) {
  return model === PRIMARY_MODEL ? FALLBACK_MODEL : PRIMARY_MODEL;
}
