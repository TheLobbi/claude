/**
 * Router health — classify CLIProxyAPI Codex accounts and decide whether a
 * Codex dispatch may go out.
 *
 * Input is the JSON body of `GET /v0/management/auth-files` (or a fixture of
 * it). Pure functions only; the HTTP read lives in dispatch-check.mjs.
 *
 * Why `status` alone is not health: the router's per-account `status` is the
 * outcome of that account's LAST request, and it resets to `active` on a
 * router restart with zero traffic. Observed 2026-10-08: all 5 accounts
 * `error` (server_is_overloaded) at 09:49Z, all 5 `active` with 0 requests
 * at 10:13Z after a 09:59Z restart. So the gate reads status AND message AND
 * the recent request buckets, and says which one drove the verdict.
 */

const AUTH_INVALID_RE = /invalidated oauth|auth_unavailable|authentication_error|token refresh failed|unauthori[sz]ed|\b401\b/i;

export const VERDICT = Object.freeze({ OPEN: 'OPEN', FLAG: 'FLAG', REFUSE: 'REFUSE' });
export const FALLBACK_MODEL = 'claude-opus-5-5';

/** One account -> healthy | transient | auth_invalid | disabled. */
export function classifyAccount(file) {
  if (!file || file.disabled) return 'disabled';
  if (AUTH_INVALID_RE.test(String(file.status_message || ''))) return 'auth_invalid';
  if (file.status === 'active' && !file.unavailable) return 'healthy';
  return 'transient';
}

/** Sum the recent request buckets the router exposes per account. */
export function trafficOf(file) {
  const buckets = Array.isArray(file?.recent_requests) ? file.recent_requests : [];
  return buckets.reduce(
    (acc, b) => ({ success: acc.success + (Number(b.success) || 0), failed: acc.failed + (Number(b.failed) || 0) }),
    { success: 0, failed: 0 },
  );
}

/** Shorten a router status message to its error code or first 120 chars. */
export function shortMessage(msg) {
  const text = String(msg || '');
  const code = text.match(/"code"\s*:\s*"([^"]+)"/)?.[1];
  return code || text.slice(0, 120);
}

function accountRow(file) {
  return {
    account: file.id_token?.chatgpt_account_id || file.account || file.id || 'unknown',
    plan: file.id_token?.plan_type || null,
    class: classifyAccount(file),
    status: file.status || null,
    message: shortMessage(file.status_message),
    traffic: trafficOf(file),
  };
}

/** Whole-router summary: counts per class plus aggregate recent traffic. */
export function summarizeRouter(body) {
  const files = Array.isArray(body?.files) ? body.files.filter((f) => !f.type || f.type === 'codex') : [];
  const accounts = files.map(accountRow);
  const counts = { healthy: 0, transient: 0, auth_invalid: 0, disabled: 0, verified: 0 };
  const traffic = { success: 0, failed: 0 };
  for (const a of accounts) {
    counts[a.class] += 1;
    if (a.class === 'healthy' && a.traffic.success > 0) counts.verified += 1;
    traffic.success += a.traffic.success;
    traffic.failed += a.traffic.failed;
  }
  const sample = traffic.success + traffic.failed;
  return { total: accounts.length, counts, accounts, traffic: { ...traffic, sample, failRatio: sample ? traffic.failed / sample : 0 } };
}

function refuseReasons(summary) {
  if (summary.total === 0) return ['router reports 0 Codex accounts'];
  if (summary.counts.healthy === 0) {
    const { transient, auth_invalid: invalid, disabled } = summary.counts;
    return [`0 healthy Codex accounts (transient ${transient}, auth_invalid ${invalid}, disabled ${disabled})`];
  }
  return [];
}

function flagReasons(summary, opts) {
  const reasons = [];
  const { traffic, counts } = summary;
  if (traffic.sample >= opts.minSample && traffic.failRatio >= opts.failRatio) {
    reasons.push(`recent router traffic ${Math.round(traffic.failRatio * 100)}% failed over ${traffic.sample} requests`);
  }
  if (counts.healthy === 1) reasons.push('only 1 healthy Codex account — no failover headroom');
  if (counts.auth_invalid > 0) reasons.push(`${counts.auth_invalid} account(s) need re-login (auth_invalid)`);
  return reasons;
}

/**
 * The gate. REFUSE: do not dispatch to Codex; route to the fallback model.
 * FLAG: dispatch allowed, but say why it is risky and prefer the fallback for
 * long or must-finish work. OPEN: dispatch.
 */
export function gateDecision(summary, opts = {}) {
  const o = { minSample: 10, failRatio: 0.5, ...opts };
  const refuse = refuseReasons(summary);
  if (refuse.length) return { verdict: VERDICT.REFUSE, dispatchCodex: false, fallback: FALLBACK_MODEL, reasons: refuse };
  const flag = flagReasons(summary, o);
  if (flag.length) return { verdict: VERDICT.FLAG, dispatchCodex: true, fallback: FALLBACK_MODEL, reasons: flag };
  return { verdict: VERDICT.OPEN, dispatchCodex: true, fallback: null, reasons: [] };
}
