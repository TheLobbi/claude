// Fixture tests for lib/fleet/dispatch/* — router gate, capacity routing,
// retry/fallback policy, queue coalescing. node:test + node:assert, no deps.
// Fixtures are synthetic (example.test accounts); shapes mirror the router's
// GET /v0/management/auth-files and T3 statev2 rows observed 2026-10-08.

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { classifyAccount, summarizeRouter, gateDecision, shortMessage, VERDICT } from '../lib/fleet/dispatch/router-health.mjs';
import { parseSessionLimit, nextWallClock, providerLimits, capacitySnapshot, routeLane, isReservedModel } from '../lib/fleet/dispatch/capacity.mjs';
import { decideRetry, attemptKey, inKeyFamily, failureKind, backoffMs } from '../lib/fleet/dispatch/retry-policy.mjs';
import { coalesce, keyOf, roundOf, refsOf } from '../lib/fleet/dispatch/queue-coalesce.mjs';
import { main } from '../lib/fleet/dispatch-check.mjs';

const FIX = new URL('./fixtures/dispatch/', import.meta.url);
const fixture = (name) => JSON.parse(readFileSync(new URL(name, FIX), 'utf8'));
const gateOf = (name) => gateDecision(summarizeRouter(fixture(name)));

// ---------------------------------------------------------------- router gate

test('router: every account last-failed with an in-stream overload -> REFUSE, route to fallback', () => {
  const g = gateOf('auth-files-overloaded.json');
  assert.equal(g.verdict, VERDICT.REFUSE);
  assert.equal(g.dispatchCodex, false);
  assert.equal(g.fallback, 'claude-opus-5-5');
  assert.match(g.reasons[0], /0 healthy Codex accounts \(transient 5/);
});

test('router: overload message is shortened to its error code', () => {
  const f = fixture('auth-files-overloaded.json').files[0];
  assert.equal(shortMessage(f.status_message), 'server_is_overloaded');
});

test('router: post-restart all-active with zero traffic is OPEN but 0 verified', () => {
  const s = summarizeRouter(fixture('auth-files-restart.json'));
  assert.equal(gateDecision(s).verdict, VERDICT.OPEN);
  assert.equal(s.counts.healthy, 5);
  assert.equal(s.counts.verified, 0);
});

test('router: mixed accounts are classified one per class, and auth_invalid is flagged', () => {
  const s = summarizeRouter(fixture('auth-files-mixed.json'));
  assert.deepEqual(s.accounts.map((a) => a.class), ['healthy', 'auth_invalid', 'transient', 'transient', 'disabled']);
  const g = gateDecision(s);
  assert.equal(g.verdict, VERDICT.FLAG);
  assert.ok(g.reasons.some((r) => /only 1 healthy/.test(r)));
  assert.ok(g.reasons.some((r) => /re-login/.test(r)));
});

test('router: healthy accounts but >=50% of recent traffic failing -> FLAG', () => {
  const g = gateOf('auth-files-degraded.json');
  assert.equal(g.verdict, VERDICT.FLAG);
  assert.match(g.reasons[0], /79% failed over 14 requests/);
});

test('router: no accounts, or all auth-invalid -> REFUSE', () => {
  assert.equal(gateDecision(summarizeRouter({ files: [] })).verdict, VERDICT.REFUSE);
  assert.equal(gateOf('auth-files-all-invalid.json').verdict, VERDICT.REFUSE);
  assert.equal(classifyAccount(null), 'disabled');
});

// ---------------------------------------------------------------- capacity

test('capacity: parses the Claude session-limit banner', () => {
  assert.deepEqual(parseSessionLimit("You've hit your session limit · resets 9:10pm (America/Los_Angeles)"), { hour24: 21, minute: 10, tz: 'America/Los_Angeles' });
  assert.deepEqual(parseSessionLimit("You've hit your limit · resets 12am (UTC)"), { hour24: 0, minute: 0, tz: 'UTC' });
  assert.equal(parseSessionLimit('Claude API rate limit reached. Try again later.'), null);
});

test('capacity: reset is the next wall-clock occurrence in the stated zone, DST-aware', () => {
  const spec = { hour24: 21, minute: 10, tz: 'America/Los_Angeles' };
  assert.equal(nextWallClock('2026-10-08T04:09:26.409Z', spec), '2026-10-08T04:10:00.000Z'); // PDT, same evening
  assert.equal(nextWallClock('2026-10-08T04:10:30.000Z', spec), '2026-10-09T04:10:00.000Z'); // just missed -> next day
  assert.equal(nextWallClock('2026-12-01T00:00:00.000Z', spec), '2026-12-01T05:10:00.000Z'); // PST
});

test('capacity: provider limited until the latest reset; cooldown for resetless usage_limit', () => {
  const events = fixture('limit-events.json');
  const during = providerLimits(events, { now: '2026-10-08T04:30:00Z', cooldownMin: 60 });
  assert.equal(during.claudeAgent.limited, true);
  assert.equal(during.claudeAgent.until, '2026-10-08T05:00:09.818Z'); // usage_limit at 04:00:09.818 + 60 min outlasts the 04:10 reset
  assert.equal(during.claudeAgent.events, 2);
  const after = providerLimits(events, { now: '2026-10-08T05:01:00Z', cooldownMin: 60 });
  assert.equal(after.claudeAgent.limited, false);
});

test('routing: ordinary lane prefers gpt-6.1-sol, never a limited provider, never a reserved model', () => {
  const events = fixture('limit-events.json');
  const open = { verdict: VERDICT.OPEN, reasons: [] };
  const refuse = { verdict: VERDICT.REFUSE, reasons: ['0 healthy'] };
  const flag = { verdict: VERDICT.FLAG, reasons: ['degraded'] };
  const claudeLimited = capacitySnapshot({ events, gate: open, now: '2026-10-08T04:30:00Z' });
  assert.equal(routeLane({ snapshot: claudeLimited }).route.model, 'gpt-6.1-sol');
  const codexRefused = capacitySnapshot({ events: [], gate: refuse, now: '2026-10-08T04:30:00Z' });
  assert.equal(routeLane({ snapshot: codexRefused }).route.model, 'claude-opus-5-5');
  const codexFlagged = capacitySnapshot({ events: [], gate: flag, now: '2026-10-08T04:30:00Z' });
  assert.equal(routeLane({ snapshot: codexFlagged }).route.model, 'claude-opus-5-5');
  const both = capacitySnapshot({ events, gate: refuse, now: '2026-10-08T04:30:00Z' });
  assert.equal(routeLane({ snapshot: both }).route, null);
  assert.equal(routeLane({ snapshot: both, role: 'coordinator', requestedModel: 'claude-fable-5-1' }).route, null);
  assert.equal(routeLane({ snapshot: codexRefused, requestedModel: 'claude-fable-5-1' }).route, null);
  assert.equal(routeLane({ snapshot: codexRefused, role: 'coordinator', requestedModel: 'claude-fable-5-1' }).route.model, 'claude-fable-5-1');
  assert.ok(isReservedModel('hestra-1') && isReservedModel('fable-5') && !isReservedModel('claude-opus-5-5'));
});

// ---------------------------------------------------------------- retry policy

test('retry: unkeyed dispatch is refused', () => {
  assert.equal(decideRetry({ key: null }).action, 'refuse');
});

test('retry: lost response with no receipt resends with the SAME key', () => {
  const d = decideRetry({ key: 'lane-x-r1', receipts: [] });
  assert.equal(d.action, 'resend');
  assert.equal(d.clientRequestId, 'lane-x-r1');
});

test('retry: accepted and running/completed -> inspect, never resend (no duplicate run)', () => {
  const receipts = ['command:mcp:sess:thread-send:lane-x-r1'];
  for (const runStatus of ['running', 'queued', 'completed', 'cancelled', null]) {
    assert.equal(decideRetry({ key: 'lane-x-r1', receipts, runStatus, failure: { class: 'transport_error', message: 'stream disconnected' } }).action, 'inspect', String(runStatus));
  }
});

test('retry: next attempt already accepted -> inspect it', () => {
  const receipts = ['command:mcp:s:thread-send:lane-x-r1', 'command:mcp:s:thread-send:lane-x-r1-a2'];
  assert.equal(decideRetry({ key: 'lane-x-r1', receipts, runStatus: 'failed', failure: { class: 'transport_error' } }).action, 'inspect');
});

test('retry: failed Codex run on stream disconnect falls back to claude-opus-5-5 with a derived stable key', () => {
  const d = decideRetry({
    key: 'lane-x-r1', receipts: ['command:mcp:s:thread-send:lane-x-r1'], runStatus: 'failed',
    failure: { class: 'transport_error', message: 'stream disconnected before completion: stream closed before response.completed' }, model: 'gpt-6.1-sol',
  });
  assert.deepEqual({ action: d.action, key: d.clientRequestId, model: d.model, delay: d.delayMs }, { action: 'fallback', key: 'lane-x-r1-a2', model: 'claude-opus-5-5', delay: 0 });
});

test('retry: Claude transport failure retries same model with backoff; usage_limit switches provider', () => {
  const base = { key: 'k-r1', receipts: ['command:mcp:s:thread-send:k-r1'], runStatus: 'failed', model: 'claude-opus-5-5' };
  const t = decideRetry({ ...base, failure: { class: 'transport_error', message: 'request timed out' } });
  assert.equal(t.action, 'retry');
  assert.equal(t.delayMs, 30_000);
  const u = decideRetry({ ...base, failure: { class: 'usage_limit', message: 'Claude API rate limit reached.' } });
  assert.equal(u.model, 'gpt-6.1-sol');
  const held = decideRetry({ ...base, routerVerdict: 'REFUSE', failure: { class: 'usage_limit', message: '' } });
  assert.equal(held.action, 'hold');
});

test('retry: permanent failure and exhausted attempts escalate', () => {
  const base = { key: 'k-r1', receipts: ['command:mcp:s:thread-send:k-r1'], runStatus: 'failed' };
  assert.equal(decideRetry({ ...base, failure: { class: 'provider_error', message: 'model_not_found' } }).action, 'escalate');
  assert.equal(decideRetry({ ...base, receipts: ['command:mcp:s:thread-send:k-r1-a3'], attempt: 3, failure: { class: 'transport_error' } }).action, 'escalate');
});

test('retry: key family and backoff helpers', () => {
  assert.equal(attemptKey('k', 1), 'k');
  assert.equal(attemptKey('k', 3), 'k-a3');
  assert.ok(inKeyFamily('command:mcp:s:delegate-task:k-a2', 'k'));
  assert.ok(!inKeyFamily('command:mcp:s:thread-send:k-other', 'k'));
  assert.equal(failureKind({ class: 'provider_error', message: 'server_is_overloaded' }), 'provider_overload');
  assert.equal(backoffMs(3), 60_000);
  assert.equal(backoffMs(20), 600_000);
});

// ---------------------------------------------------------------- queue coalescing

test('queue: duplicate, superseded and satisfied are cancel; open asks are keep', () => {
  const recs = coalesce(fixture('queue.json'));
  const by = Object.fromEntries(recs.map((r) => [r.queuedRunId.split(':').pop(), r]));
  assert.equal(by['10'].rule, 'superseded');
  assert.match(by['10'].evidence, /ordinal:11 \(lane-a-report-r2\)/);
  assert.equal(by['11'].recommend, 'keep');
  assert.equal(by['12'].recommend, 'keep');
  assert.equal(by['13'].rule, 'duplicate');
  assert.equal(by['14'].rule, 'satisfied');
  assert.match(by['14'].evidence, /iac#380 done per gh pr view: MERGED/);
  assert.equal(by['15'].recommend, 'keep');
  assert.equal(by['20'].rule, 'satisfied');
  assert.equal(by['11'].behindActiveRun, 'run:thread:coord:ordinal:9');
  assert.equal(by['20'].behindActiveRun, null);
});

test('queue: helpers read the clientRequestId out of T3 message ids', () => {
  assert.equal(keyOf({ messageId: 'message:mcp:52f1:thread-send:controller-7958-resume-cb273f19-r2' }), 'controller-7958-resume-cb273f19-r2');
  assert.equal(keyOf({ messageId: 'd1c7d058-4752' }), null);
  assert.deepEqual(roundOf('a-b-r12'), { base: 'a-b', round: 12 });
  assert.ok(refsOf({ text: 'merge iac#380 and #12' }).includes('iac#380'));
});

test('queue: inputs are not mutated and an empty queue yields nothing', () => {
  const input = fixture('queue.json');
  const before = JSON.stringify(input);
  coalesce(input);
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(coalesce({}), []);
});

// ---------------------------------------------------------------- CLI (fixture mode, no network, no DB)

test('cli: exit codes — router REFUSE=1, OPEN=0, queue with cancels=1, retry inspect=1, unknown=2', async (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'dispatch-cli-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const q = join(tmp, 'q.json');
  const receipts = join(tmp, 'r.json');
  writeFileSync(q, JSON.stringify(fixture('queue.json').queued));
  writeFileSync(receipts, JSON.stringify(['command:mcp:s:thread-send:k-r1']));
  const quiet = t.mock.method(process.stdout, 'write', () => true);
  const quietErr = t.mock.method(process.stderr, 'write', () => true);
  try {
    assert.equal(await main(['router', '--auth-files', fileURLToPath(new URL('auth-files-overloaded.json', FIX))]), 1);
    assert.equal(await main(['router', '--json', '--auth-files', fileURLToPath(new URL('auth-files-restart.json', FIX))]), 0);
    assert.equal(await main(['queue', '--queue-json', q]), 1);
    assert.equal(await main(['retry', '--key', 'k-r1', '--receipts-json', receipts, '--run-status', 'running']), 1);
    assert.equal(await main(['nope']), 2);
    assert.equal(await main(['router'], {}), 2);
  } finally {
    quiet.mock.restore();
    quietErr.mock.restore();
  }
});
