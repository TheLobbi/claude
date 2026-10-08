#!/usr/bin/env node
/**
 * Authority classifier, escalation-receipt validator and receipt reconciler.
 *
 * Decision table and receipt schema:
 *   skills/fleet-protocol/references/authority-and-receipts.md
 *
 * WHY THIS EXISTS. In the 2026-10-08 MCP Apps run, eight lanes listed every
 * step after "open the PR" under a "Markus-only steps" header. The list
 * included Entra Graph edits that the lane rules delegated and that the
 * `claude-tenant-admin` app could perform, and Doppler dev writes. It also
 * included the Teams Developer Portal registration, which no agent could do
 * because no automated path existed. Nothing separated "an agent must not"
 * from "an agent cannot yet" from "the brief did not say". Six runs were also
 * cancelled at the same moment and left no failure receipt, so the coordinator
 * learned of the stall only when a human typed "Resume".
 *
 * The rules are a table, not judgement, so this file classifies FACTS a lane
 * can state (is it reversible, does a capability exist, which grant covers
 * it). It never decides what is irreversible on the lane's behalf.
 *
 * USAGE
 *   node classify-authority.mjs --receipts <receipts.json>
 *   node classify-authority.mjs --reconcile <runs.json> <receipts.json>
 *
 * Exit 0 = valid / reconciled. Exit 1 = findings. Exit 2 = bad invocation.
 */

import fs from 'node:fs';

export const CLASSES = Object.freeze({
  AGENT_AUTHORIZED: 'AGENT-AUTHORIZED',
  COORDINATOR_DECISION: 'COORDINATOR-DECISION',
  MISSING_CAPABILITY: 'MISSING-CAPABILITY',
  IRREVERSIBLE_FOUNDER: 'IRREVERSIBLE/FOUNDER',
});

/** The only decisions that may reach the founder, and only through the parent. */
export const IRREVERSIBLE_KINDS = Object.freeze([
  'merge-to-default-branch',
  'publish',
  'tenant-wide-grant',
  'production-access-grant',
  'billing',
  'delete-customer-data',
  'production-cutover',
]);

export const GRANTS = Object.freeze(['brief', 'existing-grant']);
export const RECEIPT_KINDS = Object.freeze(['completion', 'failure', 'escalation']);
export const TERMINAL_RUN_STATES = Object.freeze(['completed', 'failed', 'cancelled', 'interrupted']);

const ROUTES = Object.freeze({
  [CLASSES.AGENT_AUTHORIZED]: ['proceed'],
  [CLASSES.COORDINATOR_DECISION]: ['coordinator'],
  [CLASSES.MISSING_CAPABILITY]: ['coordinator'],
  [CLASSES.IRREVERSIBLE_FOUNDER]: ['coordinator', 'parent', 'founder'],
});

const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const DIRECT_HUMAN_TARGETS = ['founder', 'user', 'human', 'markus'];

function isIrreversible(blocker) {
  return blocker.reversible === false || IRREVERSIBLE_KINDS.includes(blocker.irreversibleKind);
}

function result(cls, extra = {}) {
  return { class: cls, route: ROUTES[cls], ...extra };
}

/**
 * Classify one blocker from stated facts.
 *
 * @param {{action:string, reversible?:boolean, irreversibleKind?:string,
 *          capability?:{available:boolean, missing?:string}, grant?:string|null}} blocker
 * @returns {{class:string, route:string[], missing?:string, error?:string}}
 */
export function classifyBlocker(blocker) {
  if (isIrreversible(blocker)) return result(CLASSES.IRREVERSIBLE_FOUNDER);
  // Fail closed: only an explicitly AVAILABLE capability counts. An absent or
  // unstated capability is a missing one, and must be named.
  if (blocker.capability?.available !== true) {
    const missing = (blocker.capability?.missing ?? '').trim();
    if (missing === '') {
      return result(CLASSES.MISSING_CAPABILITY, { error: 'MISSING-CAPABILITY must name the exact permission or capability' });
    }
    return result(CLASSES.MISSING_CAPABILITY, { missing });
  }
  // Proceeding without sign-off needs BOTH an explicit reversible=true and a
  // covering grant. Unknown reversibility is the coordinator's call.
  if (blocker.reversible === true && GRANTS.includes(blocker.grant)) return result(CLASSES.AGENT_AUTHORIZED);
  return result(CLASSES.COORDINATOR_DECISION);
}

function requireText(receipt, field, reasons) {
  const v = receipt[field];
  if (typeof v !== 'string' || v.trim() === '') reasons.push(`${field} is required and must be non-empty text`);
}

function checkEvidence(receipt, reasons) {
  const ev = receipt.evidence;
  if (!Array.isArray(ev) || ev.length === 0) {
    reasons.push('evidence must list at least one link (PR URL, thread id, run id, file path, command + exit code)');
    return;
  }
  const blank = ev.filter((e) => typeof e !== 'string' || e.trim() === '').length;
  if (blank > 0) reasons.push(`evidence has ${blank} empty or non-text entr${blank === 1 ? 'y' : 'ies'}; every entry must be a non-empty link`);
}

function checkRoute(receipt, reasons) {
  const target = String(receipt.escalateTo ?? '').toLowerCase();
  if (DIRECT_HUMAN_TARGETS.includes(target)) {
    reasons.push(`escalateTo "${receipt.escalateTo}" addresses a human directly; the founder is reached only through the parent`);
    return;
  }
  const allowed = receipt.blockerClass === CLASSES.IRREVERSIBLE_FOUNDER ? ['coordinator', 'parent'] : ['coordinator'];
  if (!allowed.includes(target)) {
    reasons.push(`escalateTo must be one of ${allowed.join(', ')} for ${receipt.blockerClass}`);
  }
}

function checkEscalation(receipt, reasons) {
  if (!Object.values(CLASSES).includes(receipt.blockerClass)) {
    reasons.push(`blockerClass must be one of: ${Object.values(CLASSES).join(', ')}`);
    return;
  }
  if (receipt.blockerClass === CLASSES.AGENT_AUTHORIZED) {
    reasons.push('AGENT-AUTHORIZED is not a blocker: proceed and post a completion receipt instead');
    return;
  }
  requireText(receipt, 'requestedDecision', reasons);
  requireText(receipt, 'defaultIfNoAnswer', reasons);
  if (receipt.blockerClass === CLASSES.MISSING_CAPABILITY) requireText(receipt, 'missingCapability', reasons);
  checkRoute(receipt, reasons);
}

/**
 * Validate one receipt. Returns [] when valid, else the reasons it is not.
 */
export function validateReceipt(receipt) {
  if (receipt === null || typeof receipt !== 'object') return ['receipt must be an object'];
  const reasons = [];
  for (const field of ['threadId', 'runId', 'exactText']) requireText(receipt, field, reasons);
  if (!RECEIPT_KINDS.includes(receipt.kind)) reasons.push(`kind must be one of: ${RECEIPT_KINDS.join(', ')}`);
  if (!UTC.test(String(receipt.postedAt ?? ''))) reasons.push('postedAt must be a UTC timestamp YYYY-MM-DDTHH:MM:SSZ');
  checkEvidence(receipt, reasons);
  if (receipt.kind === 'escalation') checkEscalation(receipt, reasons);
  return reasons;
}

const runKey = (threadId, runId) => `${threadId}\u0000${runId}`;

const CLOSING_KINDS = ['completion', 'failure'];

/** A receipt closes a run only if it is a completion/failure AND schema-valid. */
function isClosingReceipt(r) {
  return CLOSING_KINDS.includes(r?.kind) && validateReceipt(r).length === 0;
}

/** Every valid closing receipt per run, in order — never last-write-wins. */
function closingReceipts(receipts) {
  const byRun = new Map();
  for (const r of receipts.filter(isClosingReceipt)) {
    const key = runKey(r.threadId, r.runId);
    if (!byRun.has(key)) byRun.set(key, []);
    byRun.get(key).push(r);
  }
  return byRun;
}

function reconcileRun(run, closing = []) {
  const at = { threadId: run.threadId, runId: run.runId };
  if (closing.length === 0) return { ...at, finding: `missing receipt: run is ${run.status} and posted no valid completion or failure receipt` };
  const claimsCompletion = closing.some((r) => r.kind === 'completion');
  if (claimsCompletion && run.status !== 'completed') {
    return { ...at, finding: `claim mismatch: a receipt says completion but T3 run status is ${run.status}` };
  }
  return null;
}

/**
 * Reconcile T3 run state against posted receipts.
 *
 * @param {{threadId:string, runId:string, status:string}[]} runs
 * @param {object[]} receipts
 * @returns {{checked:number, findings:{threadId:string, runId:string, finding:string}[]}}
 */
export function reconcileReceipts(runs, receipts) {
  const invalid = runs.flatMap((r, i) => (isValidRun(r) ? [] : [invalidRunFinding(r, i)]));
  const terminal = runs.filter((r) => isValidRun(r) && TERMINAL_RUN_STATES.includes(r.status));
  const byRun = closingReceipts(receipts);
  const findings = terminal
    .map((run) => reconcileRun(run, byRun.get(runKey(run.threadId, run.runId))))
    .filter(Boolean);
  return { checked: terminal.length, findings: [...invalid, ...findings] };
}

const nonEmptyText = (v) => typeof v === 'string' && v.trim() !== '';

/** A run entry is usable only if it is an object with text threadId, runId and status. */
function isValidRun(r) {
  return r !== null && typeof r === 'object' && nonEmptyText(r.threadId) && nonEmptyText(r.runId) && nonEmptyText(r.status);
}

/** Malformed run entries are skipped and reported, never dereferenced. */
function invalidRunFinding(r, i) {
  const shape = r === null ? 'null' : typeof r;
  return { threadId: '(invalid run entry)', runId: `runs[${i}]`, finding: `invalid run entry: expected an object with non-empty threadId, runId and status, got ${shape}` };
}

function parseLine(line, i, label) {
  try {
    return JSON.parse(line);
  } catch (err) {
    throw new Error(`${label}:${i + 1}: not a JSON object (${err.message})`);
  }
}

/**
 * Parse receipts or runs from either a JSON array or JSON Lines (the
 * protocol's `receipts.jsonl`: one object per line, blank lines ignored).
 */
export function parseRecords(text, label = 'input') {
  const trimmed = text.trim();
  if (trimmed === '') return [];
  if (trimmed.startsWith('[')) return JSON.parse(trimmed);
  return text
    .split(/\r?\n/)
    .map((line, i) => [line.trim(), i])
    .filter(([line]) => line !== '')
    .map(([line, i]) => parseLine(line, i, label));
}

function readRecords(file) {
  return parseRecords(fs.readFileSync(file, 'utf8'), file);
}

function runReceipts(file) {
  const receipts = readRecords(file);
  let bad = 0;
  receipts.forEach((r, i) => {
    for (const reason of validateReceipt(r)) {
      console.error(`${file}[${i}]: ${reason}`);
      bad++;
    }
  });
  console.log(`checked ${receipts.length} receipt(s); ${bad} problem(s)`);
  return bad === 0 ? 0 : 1;
}

function runReconcile(runsFile, receiptsFile) {
  const { checked, findings } = reconcileReceipts(readRecords(runsFile), readRecords(receiptsFile));
  for (const f of findings) console.error(`${f.threadId} ${f.runId}: ${f.finding}`);
  console.log(`checked ${checked} terminal run(s); ${findings.length} finding(s)`);
  return findings.length === 0 ? 0 : 1;
}

function main(args) {
  if (args[0] === '--receipts' && args.length === 2) return runReceipts(args[1]);
  if (args[0] === '--reconcile' && args.length === 3) return runReconcile(args[1], args[2]);
  console.error('usage: classify-authority.mjs --receipts <receipts.jsonl|.json> | --reconcile <runs.json> <receipts.jsonl|.json>');
  return 2;
}

if (process.argv[1]?.endsWith('classify-authority.mjs')) {
  process.exit(main(process.argv.slice(2)));
}
