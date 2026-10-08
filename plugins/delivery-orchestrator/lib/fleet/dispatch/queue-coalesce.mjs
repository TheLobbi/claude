/**
 * Queue coalescing — read-only detector over T3 queued runs.
 *
 * For each queued message it recommends `cancel` or `keep`, with the rule
 * that fired and the evidence. It NEVER cancels; a coordinator acts on the
 * recommendation with t3_queue_cancel after reading it.
 *
 * Rules, each explicit and evidence-cited:
 *   duplicate   same thread, same normalised text as an earlier queued message
 *               (keep the earliest)
 *   superseded  same thread, same clientRequestId base with a higher round
 *               ("…-r1" queued, "…-r2" queued later), or a later message that
 *               names this one's key after "supersedes"
 *   satisfied   evidence (a receipt or status) for this message's key or ref,
 *               marked done, exists
 * Messages queued behind an active turn are annotated, not cancelled.
 *
 * queued:   [{ queuedRunId, threadId, requestedAt, text, messageId }]
 * active:   [{ threadId, runId, startedAt }]
 * evidence: [{ key, state: 'done'|'open', source, at }]  key = clientRequestId, PR ref (#123) or thread id
 */

const ROUND_RE = /^(.*)-r(\d+)$/;
const KEY_IN_ID_RE = /:(?:thread-send|delegate-task|thread-launch):([^:]+)$/;
const REF_RE = /(?:[\w.-]+)?#\d+\b/g;
const KEY_TOKEN_RE = /\b[a-z0-9]+(?:-[a-z0-9]+){2,}\b/g;

/** clientRequestId from T3's message id ("message:mcp:<s>:thread-send:<key>"), else null. */
export function keyOf(item) {
  return String(item.messageId || '').match(KEY_IN_ID_RE)?.[1] || item.clientRequestId || null;
}

/** "abc-report-r2" -> { base: "abc-report", round: 2 } | null */
export function roundOf(key) {
  const m = String(key || '').match(ROUND_RE);
  return m ? { base: m[1], round: Number(m[2]) } : null;
}

export function normalise(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Keys a message points at: its own key, PR refs, and key-like tokens. */
export function refsOf(item) {
  const text = String(item.text || '');
  const refs = new Set(text.match(REF_RE) || []);
  for (const t of text.match(KEY_TOKEN_RE) || []) if (roundOf(t)) refs.add(t);
  const own = keyOf(item);
  if (own) refs.add(own);
  return [...refs];
}

function byTime(a, b) {
  return String(a.requestedAt).localeCompare(String(b.requestedAt));
}

function duplicateOf(item, earlier) {
  const n = normalise(item.text);
  return n ? earlier.find((e) => normalise(e.text) === n) : undefined;
}

function supersededBy(item, later) {
  const key = keyOf(item);
  const r = roundOf(key);
  return later.find((l) => {
    const lr = roundOf(keyOf(l));
    if (r && lr && lr.base === r.base && lr.round > r.round) return true;
    return Boolean(key) && new RegExp(`supersed\\w*[^\\n]{0,80}${escapeRe(key)}`, 'i').test(String(l.text || ''));
  });
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function satisfiedBy(item, evidence) {
  const refs = new Set(refsOf(item));
  return evidence.find((e) => e.state === 'done' && refs.has(e.key));
}

function judge(item, peers, evidence) {
  const earlier = peers.filter((p) => byTime(p, item) < 0);
  const later = peers.filter((p) => byTime(p, item) > 0);
  const dup = duplicateOf(item, earlier);
  if (dup) return { recommend: 'cancel', rule: 'duplicate', evidence: `same text as ${dup.queuedRunId}` };
  const sup = supersededBy(item, later);
  if (sup) return { recommend: 'cancel', rule: 'superseded', evidence: `superseded by ${sup.queuedRunId} (${keyOf(sup) || 'text'})` };
  const sat = satisfiedBy(item, evidence);
  if (sat) return { recommend: 'cancel', rule: 'satisfied', evidence: `${sat.key} done per ${sat.source}${sat.at ? ` at ${sat.at}` : ''}` };
  return { recommend: 'keep', rule: 'none', evidence: null };
}

/** Recommendations for every queued item. Pure; never mutates its inputs. */
export function coalesce({ queued = [], active = [], evidence = [] }) {
  const activeByThread = new Map(active.map((a) => [a.threadId, a]));
  return [...queued].sort(byTime).map((item) => {
    const peers = queued.filter((q) => q.threadId === item.threadId && q.queuedRunId !== item.queuedRunId);
    const verdict = judge(item, peers, evidence);
    const behind = activeByThread.get(item.threadId);
    return {
      queuedRunId: item.queuedRunId,
      threadId: item.threadId,
      requestedAt: item.requestedAt,
      key: keyOf(item),
      behindActiveRun: behind ? behind.runId : null,
      ...verdict,
    };
  });
}
