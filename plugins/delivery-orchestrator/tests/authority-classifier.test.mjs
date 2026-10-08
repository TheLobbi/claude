// Tests for lib/fleet/classify-authority.mjs.
// Fixtures are the real blockers and run states from the 2026-10-08 MCP Apps
// run (see tests/fixtures/*-20261008.json for provenance).

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

import {
  CLASSES,
  classifyBlocker,
  validateReceipt,
  reconcileReceipts,
} from '../lib/fleet/classify-authority.mjs';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const BLOCKERS = fixture('authority-blockers-20261008.json').blockers;
const RUNS = fixture('receipt-runs-20261008.json');

const validEscalation = () => ({
  threadId: 'mcp:6e390e8a-3031-4fa9-9f0c-8ebf76d2c2ac',
  runId: 'ordinal:1',
  kind: 'escalation',
  postedAt: '2026-10-08T07:54:02Z',
  exactText: 'Teams Developer Portal Entra SSO client ID registration',
  evidence: ['https://github.com/TheLobbi/wagonworks-bots/pull/2'],
  blockerClass: CLASSES.MISSING_CAPABILITY,
  missingCapability: 'Delegated M365 token for the Developer Portal API',
  requestedDecision: 'Provision a delegated service sign-in, or register once',
  defaultIfNoAnswer: 'Placeholder stays; other work proceeds',
  escalateTo: 'coordinator',
});

test('should classify every audited 2026-10-08 blocker into its expected class', () => {
  assert.ok(BLOCKERS.length >= 10, `fixture set too small: ${BLOCKERS.length}`);
  for (const b of BLOCKERS) {
    assert.equal(classifyBlocker(b).class, b.expected, b.action);
  }
});

test('should route only IRREVERSIBLE/FOUNDER to the founder, and only via the parent', () => {
  for (const b of BLOCKERS) {
    const { class: cls, route } = classifyBlocker(b);
    const reachesFounder = route.includes('founder');
    assert.equal(reachesFounder, cls === CLASSES.IRREVERSIBLE_FOUNDER, b.action);
    if (reachesFounder) assert.deepEqual(route, ['coordinator', 'parent', 'founder']);
  }
});

test('should let a reversible action delegated by the brief proceed without sign-off', () => {
  const r = classifyBlocker({ action: 'Entra identifierUris edit', reversible: true, capability: { available: true }, grant: 'brief' });
  assert.equal(r.class, CLASSES.AGENT_AUTHORIZED);
  assert.deepEqual(r.route, ['proceed']);
});

test('should rank irreversibility above a missing capability', () => {
  const r = classifyBlocker({ action: 'publish', irreversibleKind: 'publish', capability: { available: false, missing: 'x' } });
  assert.equal(r.class, CLASSES.IRREVERSIBLE_FOUNDER);
});

test('should flag a MISSING-CAPABILITY that does not name the capability', () => {
  const r = classifyBlocker({ action: 'browser step', reversible: true, capability: { available: false } });
  assert.equal(r.class, CLASSES.MISSING_CAPABILITY);
  assert.match(r.error, /exact permission or capability/);
});

test('should accept a complete escalation receipt', () => {
  assert.deepEqual(validateReceipt(validEscalation()), []);
});

// RED cases: each mutation must be rejected, and must be rejected for its own reason.
const RED = [
  ['no default', (r) => { delete r.defaultIfNoAnswer; }, /defaultIfNoAnswer/],
  ['no evidence', (r) => { r.evidence = []; }, /evidence/],
  ['founder addressed directly', (r) => { r.escalateTo = 'Markus'; }, /through the parent/],
  ['parent for a non-founder class', (r) => { r.escalateTo = 'parent'; }, /escalateTo must be one of coordinator/],
  ['unnamed capability', (r) => { r.missingCapability = ' '; }, /missingCapability/],
  ['agent-authorized filed as blocker', (r) => { r.blockerClass = CLASSES.AGENT_AUTHORIZED; }, /not a blocker/],
  ['unknown class', (r) => { r.blockerClass = 'MARKUS-ONLY'; }, /blockerClass/],
  ['local timestamp', (r) => { r.postedAt = '2026-10-08 07:54'; }, /postedAt/],
  ['no thread id', (r) => { r.threadId = ''; }, /threadId/],
];

for (const [name, mutate, reason] of RED) {
  test(`should reject an escalation receipt with ${name}`, () => {
    const r = validEscalation();
    mutate(r);
    const reasons = validateReceipt(r);
    assert.ok(reasons.some((x) => reason.test(x)), `${name}: got ${JSON.stringify(reasons)}`);
  });
}

test('should allow parent as the escalation target only for IRREVERSIBLE/FOUNDER', () => {
  const r = { ...validEscalation(), blockerClass: CLASSES.IRREVERSIBLE_FOUNDER, escalateTo: 'parent' };
  delete r.missingCapability;
  assert.deepEqual(validateReceipt(r), []);
});

test('should report missing receipts and claim mismatches against T3 run state', () => {
  const { checked, findings } = reconcileReceipts(RUNS.runs, RUNS.receipts);
  assert.equal(checked, 7, 'running runs are not terminal and are not checked');
  const byKey = Object.fromEntries(findings.map((f) => [`${f.threadId.slice(4, 12)}/${f.runId}`, f.finding]));
  assert.equal(findings.length, 6, JSON.stringify(findings, null, 2));
  assert.match(byKey['6e390e8a/ordinal:2'], /missing receipt: run is cancelled/);
  assert.match(byKey['915f71bb/ordinal:1'], /missing receipt/);
  assert.match(byKey['cb273f19/ordinal:2'], /claim mismatch: receipt says completion but T3 run status is cancelled/);
  assert.equal(byKey['6e390e8a/ordinal:1'], undefined, 'a completed run with a completion receipt is clean');
});

test('should treat a failure receipt as closing a cancelled run', () => {
  const runs = [{ threadId: 't', runId: 'r', status: 'cancelled' }];
  const receipts = [{ threadId: 't', runId: 'r', kind: 'failure' }];
  assert.deepEqual(reconcileReceipts(runs, receipts), { checked: 1, findings: [] });
});
