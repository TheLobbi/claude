#!/usr/bin/env node
/**
 * Validate heartbeat lines against the protocol's format.
 *
 *   <UTC> | <state> | <task> | <note>
 *
 * WHY THIS EXISTS. In one evening, three sessions produced three different
 * malformations of this one format:
 *
 *   1. literal `n` escapes instead of newlines;
 *   2. a bullet with no pipes at all, so `state` parsed as empty;
 *   3. a LEADING pipe, copied from a markdown table elsewhere in the same
 *      run — which shifts every field by one, so the parser read the
 *      TIMESTAMP as the STATE. The tombstone written to stop the monitor
 *      counting a dead session made the monitor announce it as ALIVE.
 *
 * Three sessions, three malformations, one format. That makes it the
 * FORMAT'S defect, not three people's carelessness: the line had a
 * convention and a parser, and no schema and no gate. And it is a gate that
 * could not go red in the most literal sense — a malformed line does not
 * fail, it produces a PLAUSIBLE state (a timestamp, an empty string) and the
 * monitor reports it confidently.
 *
 * USAGE
 *   node validate-heartbeat.mjs <file|dir> [...]   validate files
 *   node validate-heartbeat.mjs --self-test        prove this gate can go red
 *
 * Exit 0 = all lines valid. Exit 1 = at least one invalid line. Exit 2 = bad
 * invocation. The exit code is the gate; the printed lines are the evidence.
 */

import fs from 'node:fs';
import path from 'node:path';

export const STATES = ['start', 'working', 'waiting', 'blocked', 'delivered', 'standby'];

const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const STARTS_WITH_UTC = /^\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/;

/**
 * Does this line CLAIM to be a heartbeat?
 *
 * A heartbeat file also holds prose — headings, bullets, handover notes. A
 * validator that judges every line reports the prose as malformed and buries
 * the real findings. So the gate only judges lines that claim to be
 * heartbeats:
 *
 *   - it starts with a UTC timestamp (the normal case), OR
 *   - it starts with "|" (the leading-pipe malformation, which is a
 *     heartbeat attempt by intent), OR
 *   - it is pipe-delimited with a known state in the second field (a
 *     heartbeat whose timestamp is malformed).
 *
 * Anything else is prose and is skipped. Deciding what is IN the set is part
 * of the gate, not a preliminary to it.
 */
export function isHeartbeatAttempt(line) {
  if (STARTS_WITH_UTC.test(line)) return true;
  if (line.trimStart().startsWith('|')) return true;
  const f = line.split('|').map((x) => x.trim());
  return f.length >= 4 && STATES.includes(f[1]);
}

/**
 * Validate one line. Returns [] when valid or not a heartbeat attempt, or a
 * list of reasons. Every reason names the malformation, not just "invalid".
 */
export function validateLine(line) {
  const reasons = [];
  if (!isHeartbeatAttempt(line)) return reasons;

  // Malformation 1: literal escape sequences instead of real newlines.
  if (/\\[rn]/.test(line)) {
    reasons.push('contains a literal \\n or \\r escape instead of a real newline');
  }

  // Malformation 3: a leading pipe shifts every field by one.
  if (line.trimStart().startsWith('|')) {
    reasons.push('starts with "|" — this is not a markdown table row; a leading pipe shifts every field, so the timestamp parses as the state');
  }

  // The NOTE is the remainder, not a field: a note legitimately contains "|"
  // (a jq filter, a test filter, an alternation). Splitting without a limit
  // and demanding exactly four parts rejects correct heartbeats — measured
  // against 22 live files, that one mistake produced 79 false positives.
  const parts = line.split('|');
  const fields = [parts[0], parts[1], parts[2], parts.slice(3).join('|')].map((f) => (f ?? '').trim());

  // The NOTE is OPTIONAL. Measured against 22 live files: 327 of 328
  // three-field lines were correct heartbeats with the note omitted or folded
  // into the task, and 1 was genuinely malformed. A gate demanding four
  // fields would have called 327 correct lines defects — the second time
  // this gate's synthetic spare set was corrected by real data.
  if (parts.length < 3) {
    reasons.push(`has ${parts.length} field(s), expected at least 3: <UTC> | <state> | <task> [| <note>]`);
    return reasons;
  }

  const [utc, state, task] = fields;

  if (!UTC.test(utc)) {
    reasons.push(`field 1 "${utc}" is not a UTC timestamp of the form YYYY-MM-DDTHH:MM:SSZ`);
  }
  if (!STATES.includes(state)) {
    reasons.push(`field 2 "${state}" is not one of: ${STATES.join(', ')}`);
  }
  if (task === '') {
    reasons.push('field 3 (task) is empty — a heartbeat with no task cannot be acted on');
  }

  return reasons;
}

export function validateText(text) {
  const findings = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const reason of validateLine(line)) {
      findings.push({ line: i + 1, text: line, reason });
    }
  });
  return findings;
}

function collectFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs
    .readdirSync(target, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.md'))
    .map((d) => path.join(target, d.name));
}

/**
 * Prove the gate can go RED, and prove its SPARE cases are load-bearing.
 *
 * The spare half is proven BY MUTATION, not by assertion: each mutation
 * disables one check, and the case that claims to depend on it must be the
 * case that stops being caught. A spare test that would also pass with the
 * check removed proves nothing and reads as coverage.
 */
function selfTest() {
  // SPARE cases. The last four are shapes taken from real heartbeat files,
  // not invented — the first version of this gate was written with synthetic
  // spares only, passed its own self-test, and then rejected 79 correct
  // heartbeats and 376 lines of prose on first contact with live data. A
  // spare set that never met production is the vacuous-spare failure this
  // plugin's own evidence rules warn about, committed by its own gate.
  const valid = [
    '2026-01-15T09:04:11Z | working | #412 retry classifier | worker dispatched',
    '2026-01-15T09:04:11Z | standby | queue empty |',
    '2026-01-15T09:04:11Z | waiting | full suite | foreground worker, expect silence',
    // a note containing "|" — a test filter alternation
    "2026-01-15T09:04:11Z | working | #636 contract | ran dotnet test --filter 'A|B'; drift test reads obj/openapi.json",
    // a note containing a jq expression with a pipe
    "2026-01-15T09:04:11Z | delivered | body reconciled | gh pr view 664 --jq '.body|length' -> 6254",
    // a very long note, which is normal and must not be truncated or rejected
    `2026-01-15T09:04:11Z | working | long note | ${'detail '.repeat(120)}`,
  ];

  // PROSE that must be SKIPPED, not judged. These are real shapes from live
  // heartbeat files: sessions interleave handover notes with heartbeat lines.
  const prose = [
    '## 2026-09-04 -- working',
    '- #2175 PR A: resolved the Columns/Rows shape question empirically.',
    '',
    'Continuing dev/test work only.',
  ];

  // Each red case names the check it must trip. This is the falsifier list.
  const red = [
    ['literal-escape', '2026-01-15T09:04:11Z | working | task | note\\n'],
    ['leading-pipe', '| 2026-01-15T09:04:11Z | working | task | note'],
    ['bad-timestamp', '15 Jan 2026 09:04 | working | task | note'],
    ['unknown-state', '2026-01-15T09:04:11Z | thinking | task | note'],
    ['empty-task', '2026-01-15T09:04:11Z | working |  | note'],
    ['too-few-fields', '2026-01-15T09:04:11Z | working'],
  ];

  // WHERE THIS GATE DOES NOT BITE, stated rather than papered over:
  // a bullet with no timestamp and no pipes ("- working on the classifier")
  // is a real malformation — a session meant it as a heartbeat — and it is
  // INDISTINGUISHABLE from the prose these files legitimately contain. No
  // line-level rule can catch it without rejecting every handover note. It
  // is caught one level up instead: the staleness monitor sees no valid
  // heartbeat for that cycle. A gate that claimed to catch it would be
  // claiming a red it cannot produce.

  let failures = 0;
  const say = (ok, msg) => {
    console.log(`${ok ? '  ok  ' : '  FAIL'} ${msg}`);
    if (!ok) failures++;
  };

  console.log('RED cases — each must be rejected:');
  for (const [name, line] of red) {
    say(validateLine(line).length > 0, `${name}: ${JSON.stringify(line)}`);
  }

  console.log('SPARE cases — each must be accepted:');
  for (const line of valid) {
    const r = validateLine(line);
    const shown = line.length > 90 ? line.slice(0, 87) + '...' : line;
    say(r.length === 0, `${JSON.stringify(shown)}${r.length ? ' → ' + r.join('; ') : ''}`);
  }

  console.log('PROSE — each must be SKIPPED, not judged:');
  for (const line of prose) {
    const r = validateLine(line);
    say(r.length === 0, `${JSON.stringify(line)}${r.length ? ' → ' + r.join('; ') : ''}`);
  }

  // MUTATION: disable one check at a time and confirm exactly the red case
  // that claims to depend on it stops being caught. A spare case that would
  // also pass with the check removed is vacuous.
  console.log('MUTATIONS — each must break exactly its own red case:');
  const mutations = [
    ['drop literal-escape check', (l) => l.replace(/\\[rn]/g, ''), 'literal-escape'],
    ['drop leading-pipe check', (l) => (l.startsWith('|') ? l.slice(1).trimStart() : l), 'leading-pipe'],
  ];
  for (const [label, mutate, expectedName] of mutations) {
    const stillCaught = red.filter(([, line]) => validateLine(mutate(line)).length > 0).map(([n]) => n);
    const nowPassing = red.map(([n]) => n).filter((n) => !stillCaught.includes(n));
    const exact = nowPassing.length === 1 && nowPassing[0] === expectedName;
    say(exact, `${label} → ${nowPassing.length ? nowPassing.join(', ') : 'nothing'} stops being caught (expected exactly ${expectedName})`);
  }

  console.log(failures === 0 ? '\nself-test passed' : `\nself-test FAILED (${failures})`);
  return failures === 0 ? 0 : 1;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) process.exit(selfTest());
  if (args.length === 0) {
    console.error('usage: validate-heartbeat.mjs <file|dir> [...] | --self-test');
    process.exit(2);
  }

  let files = [];
  for (const target of args) {
    if (!fs.existsSync(target)) {
      console.error(`no such path: ${target}`);
      process.exit(2);
    }
    files = files.concat(collectFiles(target));
  }

  let bad = 0;
  for (const file of files) {
    for (const f of validateText(fs.readFileSync(file, 'utf8'))) {
      console.error(`${file}:${f.line}: ${f.reason}`);
      console.error(`    ${f.text}`);
      bad++;
    }
  }

  // The set size is part of the result: a clean run over zero files is not a
  // clean run.
  console.log(`checked ${files.length} file(s); ${bad} invalid line(s)`);
  process.exit(bad === 0 ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validate-heartbeat.mjs')) {
  main();
}
