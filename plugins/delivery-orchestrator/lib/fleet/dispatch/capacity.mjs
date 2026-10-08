/**
 * Capacity — which providers are usable right now, and where a lane may go.
 *
 * Inputs are plain JSON (limit events read from T3 state, plus the router
 * gate). Pure functions only; the read-only T3 adapter is t3-state.mjs.
 *
 * Limit evidence observed in T3 (2026-10-08):
 *   - Claude assistant text: "You've hit your session limit · resets 9:10pm (America/Los_Angeles)"
 *   - T3 error item: failure.class = "usage_limit", "Claude API rate limit reached. Try again later."
 * The first carries a wall-clock reset; the second does not, so it holds the
 * provider for a fixed cooldown after the last occurrence.
 */

import { VERDICT } from './router-health.mjs';

const LIMIT_RE = /hit your (?:[a-z]+ )?limit\b[^(]*?resets\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*\(([^)]+)\)/i;
const RESERVED_RE = /fable|hestra/i;

/** Ordinary lanes may use these, in preference order. */
export const ORDINARY_ROUTES = Object.freeze([
  { provider: 'codex', model: 'gpt-6.1-sol' },
  { provider: 'claudeAgent', model: 'claude-opus-5-5' },
]);

export const isReservedModel = (model) => RESERVED_RE.test(String(model || ''));

/** "…resets 9:10pm (America/Los_Angeles)" -> { hour24, minute, tz } | null */
export function parseSessionLimit(text) {
  const m = String(text || '').match(LIMIT_RE);
  if (!m) return null;
  const hour12 = Number(m[1]) % 12;
  return { hour24: m[3].toLowerCase() === 'pm' ? hour12 + 12 : hour12, minute: Number(m[2] || 0), tz: m[4].trim() };
}

/** Offset (ms) of `tz` from UTC at instant `epochMs`. */
export function tzOffsetMs(epochMs, tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(epochMs))
      .map((p) => [p.type, Number(p.value)]),
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(epochMs / 1000) * 1000;
}

function zonedToUtc(y, mo, d, h, mi, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = guess - tzOffsetMs(guess, tz);
  return guess - tzOffsetMs(first, tz);
}

function localDate(epochMs, tz) {
  const [y, mo, d] = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(epochMs)).split('-').map(Number);
  return { y, mo, d };
}

/** First instant at or after `afterIso` when the wall clock in tz reads hour24:minute. */
export function nextWallClock(afterIso, { hour24, minute, tz }) {
  const after = Date.parse(afterIso);
  const { y, mo, d } = localDate(after, tz);
  for (let add = 0; add < 3; add++) {
    const at = zonedToUtc(y, mo, d + add, hour24, minute, tz);
    if (at >= after) return new Date(at).toISOString();
  }
  return null;
}

/** When does one limit event stop blocking its provider? */
export function limitedUntil(event, cooldownMin) {
  const reset = parseSessionLimit(event.text);
  if (reset) return nextWallClock(event.at, reset);
  return new Date(Date.parse(event.at) + cooldownMin * 60_000).toISOString();
}

/**
 * Fold limit events into per-provider state at `now`.
 * events: [{ provider, model, threadId, runId, at, kind, text }]
 */
export function providerLimits(events, { now, cooldownMin = 60 }) {
  const out = {};
  for (const e of events) {
    const until = limitedUntil(e, cooldownMin);
    const cur = (out[e.provider] ??= { limited: false, until: null, events: 0, last: null });
    cur.events += 1;
    if (!cur.last || e.at > cur.last.at) cur.last = { at: e.at, threadId: e.threadId, runId: e.runId, kind: e.kind, text: String(e.text).slice(0, 120) };
    if (until && (!cur.until || until > cur.until)) cur.until = until;
  }
  for (const p of Object.values(out)) p.limited = Boolean(p.until && Date.parse(p.until) > Date.parse(now));
  return out;
}

/** One capacity view: Claude-side limits plus the Codex router gate. */
export function capacitySnapshot({ events, gate, now, cooldownMin }) {
  const providers = providerLimits(events, { now, cooldownMin });
  const codex = (providers.codex ??= { limited: false, until: null, events: 0, last: null });
  codex.router = gate ? { verdict: gate.verdict, reasons: gate.reasons } : { verdict: 'UNKNOWN', reasons: ['router not read'] };
  if (gate?.verdict === VERDICT.REFUSE) codex.limited = true;
  providers.claudeAgent ??= { limited: false, until: null, events: 0, last: null };
  return { at: now, providers };
}

function usable(route, snapshot, avoidFlagged) {
  const p = snapshot.providers[route.provider];
  if (!p || p.limited) return false;
  return !(avoidFlagged && p.router?.verdict === VERDICT.FLAG);
}

function routeReserved(role, model, snapshot) {
  if (role !== 'coordinator') {
    return { route: null, reason: `${model} is reserved for coordinators; ordinary lanes use ${ORDINARY_ROUTES.map((r) => r.model).join(' or ')}` };
  }
  if (snapshot.providers.claudeAgent?.limited) return { route: null, reason: `claudeAgent is limited until ${snapshot.providers.claudeAgent.until}` };
  return { route: { provider: 'claudeAgent', model }, reason: 'coordinator on a reserved model' };
}

/**
 * Route a lane. role: 'lane' (default) | 'coordinator'.
 * A requested reserved model (Fable/Hestra) is refused for ordinary lanes.
 * Never returns a provider that is currently limited.
 */
export function routeLane({ role = 'lane', requestedModel = null, snapshot }) {
  if (requestedModel && isReservedModel(requestedModel)) return routeReserved(role, requestedModel, snapshot);
  const pick = ORDINARY_ROUTES.find((r) => usable(r, snapshot, true)) || ORDINARY_ROUTES.find((r) => usable(r, snapshot, false));
  if (!pick) return { route: null, reason: 'every ordinary provider is limited — hold the dispatch, do not fall back to a reserved model' };
  const flagged = snapshot.providers[pick.provider]?.router?.verdict === VERDICT.FLAG;
  return { route: pick, reason: flagged ? 'only usable route is FLAGged by the router gate' : 'first unlimited route in preference order' };
}
