#!/usr/bin/env node
/**
 * dispatch-check — read-only pre-dispatch checks for a fleet coordinator.
 *
 *   router     Codex router account health + the dispatch gate (OPEN|FLAG|REFUSE)
 *   capacity   provider limits from T3 state + router gate + the lane routing table
 *   queue      queued-run coalescing: cancel/keep recommendations (never cancels)
 *   retry      may this dispatch be retried, on which model, with which key?
 *
 * Read-only by construction: GET on the router management API, SELECT on T3's
 * statev2.sqlite opened readOnly. The management password comes from the
 * MANAGEMENT_PASSWORD env var only (e.g. `doppler run -p dev-workstation -c dev
 * --only-secrets MANAGEMENT_PASSWORD -- node …`) and is never printed.
 *
 * Exit codes follow fleet.mjs: 0 ok, 1 finding (FLAG/REFUSE, a limited
 * provider, a cancel recommendation, a non-retry decision), 2 usage/instrument.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from './fleet.mjs';
import { summarizeRouter, gateDecision, VERDICT } from './dispatch/router-health.mjs';
import { capacitySnapshot, routeLane } from './dispatch/capacity.mjs';
import { coalesce } from './dispatch/queue-coalesce.mjs';
import { decideRetry } from './dispatch/retry-policy.mjs';
import * as t3 from './dispatch/t3-state.mjs';

const DEFAULT_ROUTER = 'http://127.0.0.1:8317';
const out = (s = '') => process.stdout.write(`${s}\n`);
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

class UsageError extends Error {}

/** Router auth-files body: from --auth-files, else a live GET. */
export async function loadAuthFiles(flags, env = process.env) {
  if (flags['auth-files']) return readJson(flags['auth-files']);
  if (!env.MANAGEMENT_PASSWORD) throw new UsageError('MANAGEMENT_PASSWORD not set — run under doppler, or pass --auth-files FILE');
  const url = `${flags.url || DEFAULT_ROUTER}/v0/management/auth-files`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${env.MANAGEMENT_PASSWORD}` }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new UsageError(`GET ${url} -> HTTP ${res.status}`);
  return res.json();
}

async function routerGate(flags, env) {
  const summary = summarizeRouter(await loadAuthFiles(flags, env));
  return { summary, gate: gateDecision(summary) };
}

function emit(flags, data, lines) {
  if (flags.json) out(JSON.stringify(data, null, 2));
  else lines.forEach((l) => out(l));
}

async function cmdRouter(flags, env) {
  const { summary, gate } = await routerGate(flags, env);
  const lines = [
    `router gate: ${gate.verdict}  (healthy ${summary.counts.healthy}/${summary.total}, verified by recent success ${summary.counts.verified}, transient ${summary.counts.transient}, auth_invalid ${summary.counts.auth_invalid}, disabled ${summary.counts.disabled})`,
    `recent traffic: ${summary.traffic.success} ok / ${summary.traffic.failed} failed`,
    ...gate.reasons.map((r) => `  reason: ${r}`),
    ...(gate.fallback ? [`  route Codex-bound lanes to ${gate.fallback}`] : []),
    ...summary.accounts.map((a) => `  ${a.account}  ${a.plan || '-'}  ${a.class}  ${a.status}  ${a.message}`),
  ];
  emit(flags, { at: new Date().toISOString(), summary, gate }, lines);
  return gate.verdict === VERDICT.OPEN ? 0 : 1;
}

async function withDb(flags, fn) {
  const db = await t3.openStateDb(flags.db || t3.DEFAULT_DB);
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

async function optionalGate(flags, env) {
  if (flags['no-router']) return null;
  try {
    return (await routerGate(flags, env)).gate;
  } catch (e) {
    return { verdict: 'UNKNOWN', reasons: [`router not read: ${e.message}`] };
  }
}

async function cmdCapacity(flags, env) {
  const now = flags.now || new Date().toISOString();
  const since = flags.since || new Date(Date.parse(now) - 12 * 3600_000).toISOString();
  const events = flags['events-json'] ? readJson(flags['events-json']) : await withDb(flags, (db) => t3.readLimitEvents(db, since));
  const gate = await optionalGate(flags, env);
  const snapshot = capacitySnapshot({ events, gate, now, cooldownMin: Number(flags.cooldown || 60) });
  const routes = { lane: routeLane({ snapshot }), coordinator: routeLane({ role: 'coordinator', requestedModel: 'claude-fable-5-1', snapshot }) };
  const lines = [`capacity at ${now} (limit events since ${since}: ${events.length})`];
  for (const [p, s] of Object.entries(snapshot.providers)) {
    lines.push(`  ${p}: ${s.limited ? `LIMITED until ${s.until}` : 'available'}  events ${s.events}${s.router ? `  router ${s.router.verdict}` : ''}${s.last ? `  last ${s.last.at} ${s.last.threadId}` : ''}`);
  }
  lines.push(`  ordinary lane -> ${routes.lane.route ? routes.lane.route.model : 'HOLD'} (${routes.lane.reason})`);
  emit(flags, { snapshot, routes, since }, lines);
  return Object.values(snapshot.providers).some((s) => s.limited) ? 1 : 0;
}

async function queueInputs(flags) {
  const evidence = flags['evidence-json'] ? readJson(flags['evidence-json']) : [];
  if (flags['queue-json']) return { queued: readJson(flags['queue-json']), active: [], evidence };
  return withDb(flags, (db) => {
    const queued = t3.readQueued(db);
    const delivered = t3.readDeliveredEvidence(db, [...new Set(queued.map((q) => q.threadId))]);
    return { queued, active: t3.readActive(db), evidence: [...evidence, ...delivered] };
  });
}

async function cmdQueue(flags) {
  const input = await queueInputs(flags);
  const recs = coalesce(input);
  const lines = [`queued runs: ${recs.length}; active runs: ${input.active.length}; cancel recommended: ${recs.filter((r) => r.recommend === 'cancel').length}`];
  for (const r of recs) {
    lines.push(`  ${r.recommend.toUpperCase().padEnd(6)} ${r.queuedRunId}  rule=${r.rule}${r.evidence ? `  (${r.evidence})` : ''}${r.behindActiveRun ? `  behind ${r.behindActiveRun}` : ''}`);
  }
  lines.push('  (recommendation only — this tool never cancels; act with t3_queue_cancel after review)');
  emit(flags, { at: new Date().toISOString(), active: input.active, recommendations: recs }, lines);
  return recs.some((r) => r.recommend === 'cancel') ? 1 : 0;
}

async function retryReceipts(flags) {
  if (flags['receipts-json']) return { receipts: readJson(flags['receipts-json']), runStatus: flags['run-status'] || null };
  return withDb(flags, (db) => ({ receipts: t3.readReceipts(db, flags.key), runStatus: flags['run-status'] || t3.readRunStatusForKey(db, flags.key) }));
}

async function cmdRetry(flags) {
  if (!flags.key) throw new UsageError('retry needs --key <clientRequestId>');
  const { receipts, runStatus } = await retryReceipts(flags);
  const failure = flags['failure-class'] ? { class: flags['failure-class'], message: flags['failure-message'] || '' } : null;
  const decision = decideRetry({
    key: flags.key, attempt: Number(flags.attempt || 1), receipts, runStatus, failure,
    model: flags.model, routerVerdict: flags['router-verdict'] || 'OPEN',
  });
  emit(flags, { receipts, runStatus, decision }, [
    `retry decision: ${decision.action}${decision.clientRequestId ? `  key=${decision.clientRequestId}` : ''}${decision.model ? `  model=${decision.model}` : ''}${decision.delayMs ? `  after ${decision.delayMs} ms` : ''}`,
    `  ${decision.reason}`,
    `  receipts: ${receipts.length ? receipts.join(', ') : 'none'}; run status: ${runStatus || 'none'}`,
  ]);
  return decision.retry ? 0 : 1;
}

const COMMANDS = { router: cmdRouter, capacity: cmdCapacity, queue: cmdQueue, retry: cmdRetry };

function usage() {
  out('dispatch-check <router|capacity|queue|retry> [--json]');
  out('  router   [--auth-files FILE | --url URL]                       Codex router gate');
  out('  capacity [--db FILE] [--since ISO] [--events-json FILE] [--no-router] [--cooldown MIN]');
  out('  queue    [--db FILE] [--queue-json FILE] [--evidence-json FILE]   cancel/keep, never cancels');
  out('  retry    --key ID [--attempt N] [--failure-class C] [--failure-message M] [--model M]');
  out('           [--router-verdict V] [--run-status S] [--receipts-json FILE] [--db FILE]');
}

export async function main(argv, env = process.env) {
  const { flags, positional } = parseArgs(argv);
  const cmd = COMMANDS[positional[0]];
  if (!cmd || flags.help) {
    usage();
    return positional[0] && !cmd ? 2 : 0;
  }
  try {
    return await cmd(flags, env);
  } catch (e) {
    process.stderr.write(`dispatch-check: ${e.message}\n`);
    return 2;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exitCode = await main(process.argv.slice(2));
