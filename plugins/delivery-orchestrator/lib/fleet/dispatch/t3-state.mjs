/**
 * Read-only adapter over T3's statev2.sqlite.
 *
 * Opens the database with { readOnly: true } and issues SELECTs only. It never
 * writes, never sets pragmas that write, and never opens `immutable` (the DB
 * is live and WAL-backed). `node:sqlite` is imported lazily so the pure
 * modules — and their tests — run on Node 20, where it does not exist.
 *
 * Tables used (T3 server 0.0.46, schema observed 2026-10-08):
 *   orchestration_v2_projection_runs        run_id, thread_id, status, payload_json
 *   orchestration_v2_projection_messages    message_id, thread_id, payload_json.text
 *   orchestration_v2_projection_turn_items  type 'assistant_message' | 'error'
 *   orchestration_command_receipts          command_id ends with ":<clientRequestId>"
 */

import os from 'node:os';
import path from 'node:path';
import { inKeyFamily } from './retry-policy.mjs';
import { keyOf } from './queue-coalesce.mjs';

export const DEFAULT_DB = path.join(os.homedir(), '.t3', 'userdata', 'statev2.sqlite');

export async function openStateDb(file = DEFAULT_DB) {
  let mod;
  try {
    mod = await import('node:sqlite');
  } catch {
    throw new Error('node:sqlite is unavailable (needs Node >= 22.5); pass JSON snapshots instead');
  }
  return new mod.DatabaseSync(file, { readOnly: true });
}

const RUN_SQL = `
  SELECT r.run_id, r.thread_id, r.status, r.requested_at,
         json_extract(r.payload_json, '$.startedAt') AS started_at,
         json_extract(r.payload_json, '$.userMessageId') AS message_id,
         json_extract(r.payload_json, '$.modelSelection.model') AS model,
         r.provider_instance_id AS provider,
         json_extract(m.payload_json, '$.text') AS text
    FROM orchestration_v2_projection_runs r
    LEFT JOIN orchestration_v2_projection_messages m
      ON m.message_id = json_extract(r.payload_json, '$.userMessageId')
   WHERE r.status IN (SELECT value FROM json_each(?))
   ORDER BY r.requested_at`;

function runs(db, statuses) {
  return db.prepare(RUN_SQL).all(JSON.stringify(statuses));
}

/**
 * Queued runs. queuedRunId is T3's run_id — confirmed 2026-10-08 against
 * t3_queue_list, which returned queuedRunId
 * "run:thread:<threadId>:ordinal:<n>" for the same row.
 */
export function readQueued(db) {
  return runs(db, ['queued', 'waiting']).map((r) => ({
    queuedRunId: r.run_id, threadId: r.thread_id, requestedAt: r.requested_at,
    messageId: r.message_id, text: r.text || '', model: r.model, provider: r.provider, status: r.status,
  }));
}

export function readActive(db) {
  return runs(db, ['running', 'starting']).map((r) => ({
    runId: r.run_id, threadId: r.thread_id, startedAt: r.started_at, model: r.model, provider: r.provider,
  }));
}

const LIMIT_SQL = `
  SELECT i.thread_id, i.run_id, i.type, i.updated_at AS at,
         COALESCE(json_extract(i.payload_json, '$.text'), json_extract(i.payload_json, '$.failure.message')) AS text,
         r.provider_instance_id AS provider,
         json_extract(r.payload_json, '$.modelSelection.model') AS model
    FROM orchestration_v2_projection_turn_items i
    LEFT JOIN orchestration_v2_projection_runs r ON r.run_id = i.run_id
   WHERE i.updated_at >= ?
     AND ((i.type = 'assistant_message' AND json_extract(i.payload_json, '$.text') LIKE 'You%hit your%limit%')
       OR (i.type = 'error' AND json_extract(i.payload_json, '$.failure.class') = 'usage_limit'))
   ORDER BY i.updated_at`;

/** Usage/session-limit events since `sinceIso`, attributed to provider via the run. */
export function readLimitEvents(db, sinceIso) {
  return db.prepare(LIMIT_SQL).all(sinceIso).map((r) => ({
    provider: r.provider || 'unknown', model: r.model, threadId: r.thread_id, runId: r.run_id,
    at: r.at, kind: r.type === 'error' ? 'usage_limit' : 'session_limit', text: r.text || '',
  }));
}

/** Accepted command_ids for a clientRequestId family (key, key-a2, key-a3 …). */
export function readReceipts(db, key) {
  const rows = db.prepare(
    "SELECT command_id FROM orchestration_command_receipts WHERE instr(command_id, ?) > 0 AND status = 'accepted'",
  ).all(`:${key}`);
  return rows.map((r) => r.command_id).filter((c) => inKeyFamily(c, key));
}

/** Status of the run a keyed message produced, if any. */
export function readRunStatusForKey(db, key) {
  const row = db.prepare(
    `SELECT r.status FROM orchestration_v2_projection_runs r
      WHERE json_extract(r.payload_json, '$.userMessageId') LIKE '%:' || ? ORDER BY r.requested_at DESC LIMIT 1`,
  ).get(key);
  return row?.status || null;
}

/**
 * Evidence that a key was already delivered: a keyed message in one of
 * `threadIds` whose own run completed. A queued message carrying the same
 * key is then a resend of something the thread already processed.
 */
export function readDeliveredEvidence(db, threadIds) {
  if (!threadIds.length) return [];
  const rows = db.prepare(
    `SELECT m.message_id, m.thread_id, m.created_at FROM orchestration_v2_projection_messages m
       JOIN orchestration_v2_projection_runs r ON r.run_id = m.run_id
      WHERE m.thread_id IN (SELECT value FROM json_each(?)) AND r.status = 'completed' AND m.role = 'user'`,
  ).all(JSON.stringify(threadIds));
  return rows
    .map((r) => ({ key: keyOf({ messageId: r.message_id }), state: 'done', source: `completed run in ${r.thread_id}`, at: r.created_at }))
    .filter((e) => e.key);
}
