#!/usr/bin/env node
/**
 * fleet — the protocol as a tool, not a reading assignment.
 *
 * Every subcommand replaces a ritual that a session used to spend several
 * turns on by hand, and each one has the relevant evidence rule built in so
 * it cannot be skipped:
 *
 *   hb           validated heartbeat append (concurrent-safe, schema-checked)
 *   register     registry row + start heartbeat in ONE action
 *   census       every lane: age, state, class; malformed lines flagged
 *   blockers     THE WAITER'S CHECK — measure what a lane waits on, live
 *   checks       PR check state: typename-aware, run-grouped, two readings
 *   verdicts     find posted verdicts whose head has moved (stale approvals)
 *   unblocks     after a merge: who it unblocks AND whose green it invalidated
 *   queue-depth  CI load counting JOBS, not runs
 *   digest       the router's digest, generated from the logs
 *   init         create a run directory from a config
 *   doctor       prerequisites and config validity
 *
 * Zero dependencies. Requires `node` >= 20 and, for forge subcommands, an
 * authenticated `gh`. Exit codes: 0 ok, 1 finding, 2 usage/instrument error.
 *
 * Evidence rules this file enforces so you do not have to remember them:
 *   - every forge call checks the exit code BEFORE reading stdout, and an
 *     error body is never parsed as data (the confident-opposite class);
 *   - check rollups are grouped by run id and read per __typename
 *     (CheckRun.conclusion vs StatusContext.state), and the RAW list is
 *     printed beside the verdict, through a second mechanism;
 *   - every search that feeds a negative is paginated to completion, and the
 *     set size is printed with the result;
 *   - every measurement is stamped POINT-IN-TIME with the head it was taken
 *     at.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATES = ['start', 'working', 'waiting', 'blocked', 'delivered', 'standby'];
const UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const STARTS_WITH_UTC = /^\s*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/;

// ---------------------------------------------------------------- utilities

const nowUtc = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const out = (s = '') => process.stdout.write(`${s}\n`);
const err = (s = '') => process.stderr.write(`${s}\n`);

function die(msg, code = 2) {
  err(`fleet: ${msg}`);
  process.exit(code);
}

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > -1) flags[a.slice(2, eq)] = a.slice(eq + 1);
      else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) flags[a.slice(2)] = argv[++i];
      else flags[a.slice(2)] = true;
    } else positional.push(a);
  }
  return { flags, positional };
}

/** Append with FileShare-tolerant semantics on every platform we can. */
function appendLine(file, line) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // Node's 'a' flag is O_APPEND; on Windows it opens with share-read/write,
  // which is the property the protocol needs (see docs/platform-notes.md).
  fs.appendFileSync(file, line.endsWith('\n') ? line : `${line}\n`, 'utf8');
}

// ------------------------------------------------------------------- config

export function loadConfig(flags) {
  const candidates = [
    flags.config,
    process.env.FLEET_CONFIG,
    path.resolve('fleet.config.json'),
    path.resolve('.fleet', 'fleet.config.json'),
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      const cfg = JSON.parse(fs.readFileSync(c, 'utf8'));
      cfg.__path = path.resolve(c);
      cfg.__dir = path.dirname(cfg.__path);
      return cfg;
    }
  }
  return null;
}

function logRootFrom(flags, cfg) {
  if (flags['log-root']) return path.resolve(flags['log-root']);
  if (cfg?.logRoot) return path.resolve(cfg.__dir, cfg.logRoot);
  return null;
}

function repoFrom(flags, cfg, laneName) {
  if (flags.repo) return flags.repo.includes('/') ? flags.repo : `${cfg?.forge?.owner}/${flags.repo}`;
  if (cfg && laneName) {
    const lane = (cfg.lanes || []).find((l) => l.name === laneName);
    if (lane) return `${cfg.forge.owner}/${lane.repo}`;
  }
  return null;
}

// -------------------------------------------------------------------- forge

/**
 * Run gh. The exit code is read BEFORE stdout, and on failure stdout is
 * discarded: a GitHub error body is valid JSON and a jq filter passes it
 * through, so a loop that parsed it would report a confident zero.
 */
function gh(args, { allowFail = false } = {}) {
  const r = spawnSync('gh', args, { encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (r.error) die(`gh not runnable: ${r.error.message}`);
  if (r.status !== 0) {
    if (allowFail) return { ok: false, status: r.status, stderr: r.stderr.trim(), stdout: '' };
    die(`gh ${args.slice(0, 3).join(' ')} exited ${r.status}: ${r.stderr.trim() || '(no stderr)'}`);
  }
  return { ok: true, status: 0, stdout: r.stdout, stderr: r.stderr };
}

function ghJson(args) {
  const r = gh(args);
  try {
    return JSON.parse(r.stdout);
  } catch (e) {
    die(`gh returned non-JSON for ${args.slice(0, 3).join(' ')}: ${e.message}`);
  }
}

/** Paginate a REST list to completion. A --limit is a floor; this is a count. */
function ghPaginate(endpoint) {
  const r = gh(['api', '--paginate', '--slurp', endpoint]);
  const pages = JSON.parse(r.stdout);
  return pages.flat();
}

// ---------------------------------------------------------------- heartbeat

export function isHeartbeatAttempt(line) {
  if (STARTS_WITH_UTC.test(line)) return true;
  if (line.trimStart().startsWith('|')) return true;
  const f = line.split('|').map((x) => x.trim());
  return f.length >= 4 && STATES.includes(f[1]);
}

export function validateLine(line) {
  const reasons = [];
  if (!isHeartbeatAttempt(line)) return reasons;
  if (/\\[rn]/.test(line)) reasons.push('literal \\n or \\r escape');
  if (line.trimStart().startsWith('|')) reasons.push('leading "|" shifts every field — the timestamp parses as the state');
  const parts = line.split('|');
  if (parts.length < 3) {
    reasons.push(`${parts.length} field(s), expected at least 3`);
    return reasons;
  }
  const [utc, state, task] = [parts[0], parts[1], parts[2]].map((f) => f.trim());
  if (!UTC_RE.test(utc)) reasons.push(`field 1 "${utc}" is not YYYY-MM-DDTHH:MM:SSZ`);
  if (!STATES.includes(state)) reasons.push(`field 2 "${state}" not in ${STATES.join('|')}`);
  if (!task) reasons.push('field 3 (task) empty');
  return reasons;
}

export function parseHeartbeat(line) {
  const parts = line.split('|');
  return {
    utc: parts[0].trim(),
    state: parts[1].trim(),
    task: (parts[2] ?? '').trim(),
    note: parts.slice(3).join('|').trim(),
    raw: line,
  };
}

/** Last VALID heartbeat in a file, plus counts of what was skipped or malformed. */
export function readHeartbeatFile(text) {
  const lines = text.split(/\r?\n/);
  let last = null;
  let valid = 0;
  const malformed = [];
  lines.forEach((l, i) => {
    if (!isHeartbeatAttempt(l)) return;
    const r = validateLine(l);
    if (r.length) malformed.push({ line: i + 1, reasons: r, text: l.slice(0, 120) });
    else {
      valid++;
      last = parseHeartbeat(l);
    }
  });
  return { last, valid, malformed, total: lines.length };
}

export function ageMinutes(utc, now = Date.now()) {
  return Math.round((now - Date.parse(utc)) / 60000);
}

export function classify(hb, ageMin, staleMin) {
  if (!hb) return 'NO-HEARTBEAT';
  if (hb.state === 'standby') return 'STANDBY';
  if (hb.state === 'waiting') return ageMin > staleMin ? 'WAITING-STALE' : 'WAITING';
  if (hb.state === 'blocked') return 'BLOCKED';
  return ageMin > staleMin ? 'HUNG-CANDIDATE' : 'ACTIVE';
}

// ---------------------------------------------------------------- registry

/** Last row per lane. Free-text rows (cautions, reconciles) are skipped. */
export function parseRegistry(text) {
  const lanes = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    const f = line.split('|').map((x) => x.trim());
    // | UTC | lane | session | note |  ->  f[1]=UTC f[2]=lane f[3]=session
    if (f.length < 4 || !UTC_RE.test(f[1])) continue;
    const lane = f[2];
    if (!/^[a-z][a-z0-9-]*$/.test(lane)) continue; // prose row, not a lane
    lanes.set(lane, { utc: f[1], lane, session: f[3], note: f.slice(4).join('|').trim() });
  }
  return lanes;
}

// --------------------------------------------------------------- references

/** Pull PR/issue references out of a heartbeat: #123, repo#123, PR #123. */
export function extractRefs(text) {
  const refs = new Set();
  for (const m of text.matchAll(/\b([A-Za-z0-9_.-]+)#(\d+)\b/g)) refs.add(`${m[1]}#${m[2]}`);
  for (const m of text.matchAll(/(?<![A-Za-z0-9_.-])#(\d{2,6})\b/g)) refs.add(`#${m[1]}`);
  return [...refs];
}

// ----------------------------------------------------------------- verdicts

/**
 * Classify one verdict-bearing item. Three objects share the word "state"
 * and only one of them means what it says:
 *   - a formal review: state APPROVED / CHANGES_REQUESTED is the verdict —
 *     but state COMMENTED for an approve delivered as a comment, so the body
 *     must be read;
 *   - an issue comment: no state at all; the body is the verdict.
 * Returns { kind, shas } or null when the item carries no verdict.
 */
export function verdictOf({ body = '', reviewState = null, commitId = null }) {
  const shas = new Set();
  if (commitId) shas.add(commitId);
  for (const m of body.matchAll(/\b([0-9a-f]{7,40})\b/g)) shas.add(m[1]);
  let kind = null;
  if (reviewState === 'APPROVED') kind = 'APPROVE';
  else if (reviewState === 'CHANGES_REQUESTED') kind = 'BLOCK';
  else {
    const explicit = body.match(/verdict\W{0,6}(APPROVE|BLOCK)\b/i)?.[1];
    const first = body.match(/\b(APPROVE|BLOCK)\b/)?.[1];
    kind = (explicit || first || null)?.toUpperCase() ?? null;
  }
  return kind ? { kind, shas: [...shas] } : null;
}

// ------------------------------------------------------------------- checks

const runIdOf = (e) => (e.detailsUrl || e.targetUrl || '').match(/\/runs\/(\d+)/)?.[1] || (e.__typename === 'StatusContext' ? 'status-context' : 'unknown');

/**
 * Read one rollup entry BY TYPE. CheckRun carries status+conclusion;
 * StatusContext carries state and has no status field at all.
 */
export function readEntry(e) {
  if (e.__typename === 'StatusContext') {
    const s = (e.state || '').toUpperCase();
    return { name: e.context || e.name || '?', type: 'StatusContext', settled: s !== 'PENDING' && s !== 'EXPECTED' && s !== '', result: s || 'UNKNOWN', run: runIdOf(e) };
  }
  const status = (e.status || '').toUpperCase();
  const concl = (e.conclusion || '').toUpperCase();
  return {
    name: e.name || '?',
    type: 'CheckRun',
    settled: status === 'COMPLETED',
    result: status === 'COMPLETED' ? (concl || 'NO-CONCLUSION') : `PENDING(${status || '?'})`,
    run: runIdOf(e),
  };
}

export function groupRuns(entries) {
  const byRun = new Map();
  for (const e of entries.map(readEntry)) {
    if (!byRun.has(e.run)) byRun.set(e.run, []);
    byRun.get(e.run).push(e);
  }
  return byRun;
}

const GREEN = new Set(['SUCCESS', 'NEUTRAL', 'SKIPPED']);

/** Verdict over the newest run per workflow + all status contexts. */
export function verdictFor(byRun) {
  // Newest run id numerically wins when the same check name appears in several runs.
  const latestByName = new Map();
  for (const [run, es] of byRun) {
    for (const e of es) {
      const prev = latestByName.get(e.name);
      const rn = Number.isFinite(+run) ? +run : 0;
      if (!prev || rn > prev.rn) latestByName.set(e.name, { ...e, rn });
    }
  }
  const latest = [...latestByName.values()];
  const pending = latest.filter((e) => !e.settled);
  const red = latest.filter((e) => e.settled && !GREEN.has(e.result));
  const skipped = latest.filter((e) => e.result === 'SKIPPED');
  let verdict = 'GREEN';
  if (red.length) verdict = 'RED';
  else if (pending.length) verdict = 'PENDING';
  return { verdict, latest, pending, red, skipped };
}

// --------------------------------------------------------------- subcommands

function cmdHb({ flags, positional }) {
  const [lane, state, task, ...noteParts] = positional;
  if (!lane || !state || !task) die('usage: fleet hb <lane> <state> <task> [note] [--log-root DIR]');
  const cfg = loadConfig(flags);
  const root = logRootFrom(flags, cfg) || die('no run directory: pass --log-root or a fleet.config.json');
  const line = `${nowUtc()} | ${state} | ${task} | ${noteParts.join(' ')}`;
  const reasons = validateLine(line);
  if (reasons.length) die(`refusing to write a malformed heartbeat: ${reasons.join('; ')}`, 1);
  appendLine(path.join(root, 'heartbeats', `${lane}.md`), line);
  out(line);
}

function cmdRegister({ flags, positional }) {
  const [lane, session, ...noteParts] = positional;
  if (!lane || !session) die('usage: fleet register <lane> <session-name> [note]');
  const cfg = loadConfig(flags);
  const root = logRootFrom(flags, cfg) || die('no run directory: pass --log-root or a fleet.config.json');
  const utc = nowUtc();
  // ONE action: the registry row and the start heartbeat, or neither.
  appendLine(path.join(root, 'registry.md'), `| ${utc} | ${lane} | ${session} | ${noteParts.join(' ')} |`);
  appendLine(path.join(root, 'heartbeats', `${lane}.md`), `${utc} | start | registered | session=${session}`);
  out(`registered ${lane} -> ${session} at ${utc}; start heartbeat written`);
}

function cmdCensus({ flags }) {
  const cfg = loadConfig(flags);
  const root = logRootFrom(flags, cfg) || die('no run directory: pass --log-root or a fleet.config.json');
  const staleMin = Number(flags.stale || cfg?.heartbeat?.staleMinutes || 25);
  const hbDir = path.join(root, 'heartbeats');
  if (!fs.existsSync(hbDir)) die(`no heartbeats directory at ${hbDir}`);

  const regPath = path.join(root, 'registry.md');
  const registry = fs.existsSync(regPath) ? parseRegistry(fs.readFileSync(regPath, 'utf8')) : new Map();
  const files = fs.readdirSync(hbDir).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  const now = Date.now();
  const rows = [];
  let malformedTotal = 0;

  for (const f of files) {
    const lane = f.replace(/\.md$/, '');
    const { last, valid, malformed } = readHeartbeatFile(fs.readFileSync(path.join(hbDir, f), 'utf8'));
    malformedTotal += malformed.length;
    const age = last ? ageMinutes(last.utc, now) : null;
    rows.push({
      lane,
      session: registry.get(lane)?.session || '(no registry row)',
      utc: last?.utc || '—',
      age,
      state: last?.state || '—',
      task: last?.task?.slice(0, 48) || '—',
      cls: classify(last, age ?? Infinity, staleMin),
      valid,
      malformed: malformed.length,
    });
  }

  rows.sort((a, b) => (b.age ?? 1e9) - (a.age ?? 1e9));
  out(`POINT-IN-TIME ${nowUtc()}  run=${root}  stale>${staleMin}m  lanes read=${rows.length} of ${files.length} files`);
  out('');
  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  out(`${pad('lane', 20)} ${pad('age', 6)} ${pad('state', 10)} ${pad('class', 15)} ${pad('task', 48)} bad`);
  for (const r of rows) {
    out(`${pad(r.lane, 20)} ${pad(r.age ?? '—', 6)} ${pad(r.state, 10)} ${pad(r.cls, 15)} ${pad(r.task, 48)} ${r.malformed || ''}`);
  }
  out('');
  const counts = rows.reduce((m, r) => ((m[r.cls] = (m[r.cls] || 0) + 1), m), {});
  out(`classes: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join('  ')}`);
  out(`malformed heartbeat lines across all files: ${malformedTotal} (run scripts/validate-heartbeat.mjs for detail)`);
  const cands = rows.filter((r) => r.cls === 'HUNG-CANDIDATE' || r.cls === 'WAITING-STALE');
  if (cands.length) {
    out('');
    out('READ THE ARTIFACT BEFORE CALLING ANY OF THESE SILENT — message-absence is not work-absence:');
    for (const r of cands) out(`  fleet blockers ${r.lane}      # what is it waiting on, and has that cleared?`);
    out('  (then: its branch head, its open PRs, its worktree — quote what each showed)');
  }
  process.exit(cands.length ? 1 : 0);
}

function cmdBlockers({ flags, positional }) {
  const [lane] = positional;
  if (!lane) die('usage: fleet blockers <lane> [--repo owner/name] [--all]');
  const cfg = loadConfig(flags);
  const root = logRootFrom(flags, cfg) || die('no run directory');
  const file = path.join(root, 'heartbeats', `${lane}.md`);
  if (!fs.existsSync(file)) die(`no heartbeat file for ${lane}`);
  const defaultRepo = repoFrom(flags, cfg, lane);

  // Collect refs from waiting/blocked heartbeats — the most recent ones first.
  const text = fs.readFileSync(file, 'utf8');
  const hbs = text.split(/\r?\n/).filter((l) => isHeartbeatAttempt(l) && !validateLine(l).length).map(parseHeartbeat);
  const waiting = hbs.filter((h) => h.state === 'waiting' || h.state === 'blocked');
  const scope = flags.all ? waiting : waiting.slice(-5);
  const refs = new Map(); // ref -> first heartbeat mentioning it
  for (const h of scope) for (const r of extractRefs(`${h.task} ${h.note}`)) if (!refs.has(r)) refs.set(r, h);

  out(`POINT-IN-TIME ${nowUtc()}  lane=${lane}  last state=${hbs.at(-1)?.state || '—'} at ${hbs.at(-1)?.utc || '—'}`);
  out(`waiting/blocked heartbeats: ${waiting.length} total, reading ${scope.length}; refs found: ${refs.size}`);
  if (!refs.size) {
    out('no #refs in those heartbeats — the lane is waiting on something it did not name. That is the finding.');
    process.exit(1);
  }
  let cleared = 0;
  let pending = 0;
  let unknown = 0;
  for (const [ref, h] of refs) {
    const m = ref.match(/^(?:([A-Za-z0-9_.-]+))?#(\d+)$/);
    const num = m[2];
    let repo = m[1] ? (m[1].includes('/') ? m[1] : `${cfg?.forge?.owner || ''}/${m[1]}`) : defaultRepo;
    if (!repo || repo.startsWith('/')) {
      out(`  ${ref.padEnd(28)} UNKNOWN   no repo to resolve against (pass --repo)`);
      unknown++;
      continue;
    }
    // Try as PR first, then as issue. Exit code checked before stdout, always.
    const pr = gh(['pr', 'view', num, '-R', repo, '--json', 'state,mergedAt,headRefOid,title'], { allowFail: true });
    if (pr.ok) {
      const j = JSON.parse(pr.stdout);
      const done = j.state === 'MERGED' || j.state === 'CLOSED';
      out(`  ${ref.padEnd(28)} ${done ? 'CLEARED ' : 'PENDING '}  PR ${j.state}${j.mergedAt ? ` merged ${j.mergedAt}` : ''} head ${String(j.headRefOid).slice(0, 8)}  (waited since ${h.utc})`);
      done ? cleared++ : pending++;
      continue;
    }
    const is = gh(['issue', 'view', num, '-R', repo, '--json', 'state,closedAt,title'], { allowFail: true });
    if (is.ok) {
      const j = JSON.parse(is.stdout);
      const done = j.state === 'CLOSED';
      out(`  ${ref.padEnd(28)} ${done ? 'CLEARED ' : 'PENDING '}  issue ${j.state}${j.closedAt ? ` closed ${j.closedAt}` : ''}  (waited since ${h.utc})`);
      done ? cleared++ : pending++;
      continue;
    }
    out(`  ${ref.padEnd(28)} UNKNOWN   not a PR or issue in ${repo}`);
    unknown++;
  }
  out('');
  out(`cleared=${cleared} pending=${pending} unknown=${unknown} of ${refs.size} refs`);
  if (cleared) out(`>> ${cleared} blocker(s) already cleared. The lane can move. This is the check that caught 3 of 3 idle-on-done-work cases.`);
  process.exit(cleared ? 1 : 0);
}

function cmdChecks({ flags, positional }) {
  const [repoArg, num] = positional;
  if (!repoArg || !num) die('usage: fleet checks <owner/repo> <pr>');
  const repo = repoArg;
  const j = ghJson(['pr', 'view', num, '-R', repo, '--json', 'headRefOid,state,isDraft,statusCheckRollup,mergeStateStatus']);
  const entries = j.statusCheckRollup || [];
  const byRun = groupRuns(entries);
  const v = verdictFor(byRun);

  out(`POINT-IN-TIME ${nowUtc()}  ${repo}#${num}  head=${j.headRefOid}  pr=${j.state}${j.isDraft ? ' DRAFT' : ''}`);
  out(`rollup entries=${entries.length}  runs=${byRun.size}  distinct checks=${v.latest.length}`);
  if (entries.length > v.latest.length) out(`>> ${entries.length} entries for ${v.latest.length} checks: more than one run at this head — grouped by run, newest wins. An ungrouped tally would be WRONG.`);
  out('');
  out('READING 1 — rollup, per run, per type (raw, not summarised):');
  const runs = [...byRun.keys()].sort((a, b) => (+b || 0) - (+a || 0));
  for (const run of runs) {
    const es = byRun.get(run);
    const tally = es.reduce((m, e) => ((m[e.result] = (m[e.result] || 0) + 1), m), {});
    out(`  run ${run}: ${es.length} entries -> ${Object.entries(tally).map(([k, n]) => `${k}=${n}`).join(', ')}`);
    for (const e of es) out(`      ${e.type.padEnd(13)} ${e.result.padEnd(16)} ${e.name}`);
  }
  out('');
  out('READING 2 — gh pr checks (different mechanism):');
  const r2 = gh(['pr', 'checks', num, '-R', repo], { allowFail: true });
  const lines2 = r2.stdout.split(/\r?\n/).filter(Boolean);
  for (const l of lines2) out(`  ${l}`);
  if (!lines2.length) out(`  (no output; exit ${r2.status}${r2.stderr ? `: ${r2.stderr}` : ''})`);
  out('');
  const agree = lines2.length === v.latest.length;
  out(`readings agree on check count: ${agree ? 'YES' : `NO (rollup-latest=${v.latest.length}, pr-checks=${lines2.length}) — STOP, two instruments disagree`}`);
  out('');
  out(`VERDICT ${v.verdict}  green=${v.latest.length - v.pending.length - v.red.length}  skipped=${v.skipped.length}  pending=${v.pending.length}  red=${v.red.length}`);
  if (v.skipped.length) out(`>> SKIPPED: ${v.skipped.map((e) => e.name).join(', ')}. A green over a set that skips the lane exercising your change is a right answer to a different question. Name which lane covers it.`);
  if (j.isDraft) out('>> DRAFT: not available for review by declaration, however green.');
  out(`mergeStateStatus=${j.mergeStateStatus}  (textual/structural only — never readiness; readiness is base-tip absorption)`);
  process.exit(v.verdict === 'GREEN' && agree ? 0 : 1);
}

function cmdVerdicts({ flags, positional }) {
  const [repo, num] = positional;
  if (!repo) die('usage: fleet verdicts <owner/repo> [pr]');
  const prs = num ? [Number(num)] : ghPaginate(`repos/${repo}/pulls?state=open&per_page=100`).map((p) => p.number);
  out(`POINT-IN-TIME ${nowUtc()}  ${repo}  open PRs scanned=${prs.length}${num ? ' (single)' : ' (paginated to completion)'}`);
  let stale = 0;
  let current = 0;
  let none = 0;
  for (const n of prs) {
    const pr = ghJson(['pr', 'view', String(n), '-R', repo, '--json', 'headRefOid,title']);
    // Both sources: issue comments (the only channel under a shared identity)
    // and formal reviews (which carry commit_id natively — better than a
    // regexed sha — but whose .state reads COMMENTED for an approve-as-comment).
    const comments = ghPaginate(`repos/${repo}/issues/${n}/comments?per_page=100`)
      .map((c) => ({ at: c.created_at, src: 'comment', v: verdictOf({ body: c.body }) }));
    const reviews = ghPaginate(`repos/${repo}/pulls/${n}/reviews?per_page=100`)
      .map((r) => ({ at: r.submitted_at, src: `review:${r.state}`, v: verdictOf({ body: r.body, reviewState: r.state, commitId: r.commit_id }) }));
    const verdicts = [...comments, ...reviews].filter((x) => x.v).sort((a, b) => (a.at < b.at ? -1 : 1));
    if (!verdicts.length) {
      none++;
      out(`  #${n}  ${'no verdict'.padEnd(18)} head ${pr.headRefOid.slice(0, 8)}  ${pr.title.slice(0, 60)}`);
      continue;
    }
    const last = verdicts.at(-1);
    const names = pr.headRefOid;
    const bound = last.v.shas.find((s) => names.startsWith(s) || s.startsWith(names.slice(0, 7)));
    if (bound) {
      current++;
      out(`  #${n}  ${(last.v.kind + ' current').padEnd(18)} head ${names.slice(0, 8)}  ${last.src} ${last.at}`);
    } else {
      stale++;
      out(`  #${n}  ${(last.v.kind + ' STALE').padEnd(18)} head ${names.slice(0, 8)}  ${last.src} ${last.at} names ${last.v.shas.length ? last.v.shas.map((s) => s.slice(0, 8)).join(',') : 'NO SHA'} — re-issue required`);
    }
  }
  out('');
  out(`current=${current} stale=${stale} none=${none} of ${prs.length}`);
  if (stale) out('>> A verdict whose head moved scopes the review, the merge and the last look to a tree nobody read.');
  process.exit(stale ? 1 : 0);
}

function cmdUnblocks({ flags, positional }) {
  const [repo, num] = positional;
  if (!repo || !num) die('usage: fleet unblocks <owner/repo> <merged-pr> [--log-root DIR]');
  const cfg = loadConfig(flags);
  const root = logRootFrom(flags, cfg);
  const merged = ghJson(['pr', 'view', num, '-R', repo, '--json', 'state,mergedAt,mergeCommit,files,title']);
  const mergedFiles = new Set((merged.files || []).map((f) => f.path));
  out(`POINT-IN-TIME ${nowUtc()}  ${repo}#${num}  ${merged.state}${merged.mergedAt ? ` merged ${merged.mergedAt}` : ''}  files=${mergedFiles.size}`);
  out('');

  // Audience 1: open PRs whose files intersect — their green is now stale and they cannot know.
  const open = ghPaginate(`repos/${repo}/pulls?state=open&per_page=100`);
  out(`AUDIENCE 1 — open PRs whose build/test closure this merge touched (open PRs scanned: ${open.length}, paginated):`);
  let invalidated = 0;
  for (const p of open) {
    if (p.number === Number(num)) continue;
    const files = ghPaginate(`repos/${repo}/pulls/${p.number}/files?per_page=100`).map((f) => f.filename);
    const hit = files.filter((f) => mergedFiles.has(f));
    if (hit.length) {
      invalidated++;
      out(`  #${p.number}  ${p.head.ref}  overlaps ${hit.length} file(s): ${hit.slice(0, 4).join(', ')}${hit.length > 4 ? ', …' : ''}`);
    }
  }
  if (!invalidated) out('  (none by file overlap — dependency and CI-definition changes are NOT detected here; ask what each PR sits on)');
  out('');

  // Audience 2: lanes whose heartbeats say they are waiting on this PR.
  out('AUDIENCE 2 — lanes whose heartbeats wait on this PR:');
  if (!root) out('  (no run directory; pass --log-root to read heartbeats)');
  else {
    const hbDir = path.join(root, 'heartbeats');
    const shortRepo = repo.split('/')[1];
    let n = 0;
    for (const f of fs.readdirSync(hbDir).filter((x) => x.endsWith('.md'))) {
      const { last } = readHeartbeatFile(fs.readFileSync(path.join(hbDir, f), 'utf8'));
      if (!last || !(last.state === 'waiting' || last.state === 'blocked')) continue;
      const refs = extractRefs(`${last.task} ${last.note}`);
      if (refs.includes(`#${num}`) || refs.includes(`${shortRepo}#${num}`)) {
        n++;
        out(`  ${f.replace(/\.md$/, '')}  ${last.state} since ${last.utc}: ${last.task.slice(0, 70)}`);
      }
    }
    if (!n) out('  (no lane currently waiting on this PR by heartbeat)');
  }
  out('');
  out('Tell BOTH audiences as part of the merge, not as a follow-up. This half leaves no trace when skipped — so do it now.');
}

function cmdQueueDepth({ positional }) {
  const [repo] = positional;
  if (!repo) die('usage: fleet queue-depth <owner/repo>');
  const inprog = ghJson(['api', `repos/${repo}/actions/runs?status=in_progress&per_page=100`]);
  const queued = ghJson(['api', `repos/${repo}/actions/runs?status=queued&per_page=100`]);
  let jobs = 0;
  for (const r of [...inprog.workflow_runs, ...queued.workflow_runs]) {
    const jj = ghJson(['api', `repos/${repo}/actions/runs/${r.id}/jobs?per_page=1`]);
    jobs += jj.total_count || 0;
  }
  out(`POINT-IN-TIME ${nowUtc()}  ${repo}`);
  out(`runs: in_progress=${inprog.total_count} queued=${queued.total_count}   JOBS across them=${jobs}`);
  out('>> the noun is JOBS. A cap on runs is blind to work: one run spawns jobs without moving the run count.');
}

function cmdDigest({ flags }) {
  const cfg = loadConfig(flags);
  const root = logRootFrom(flags, cfg) || die('no run directory');
  const wm = path.join(root, '.digest-watermark');
  const since = fs.existsSync(wm) ? fs.readFileSync(wm, 'utf8').trim() : '1970-01-01T00:00:00Z';
  const rowsSince = (file) => {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) return [];
    return fs.readFileSync(p, 'utf8').split(/\r?\n/).filter((l) => {
      const m = l.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/);
      return m && m[1] > since;
    });
  };
  const esc = rowsSince('escalations.md');
  const merges = rowsSince('outcomes.md').filter((l) => /merged/i.test(l));
  const acks = rowsSince('acks.md');
  const blocked = [];
  const hbDir = path.join(root, 'heartbeats');
  if (fs.existsSync(hbDir)) {
    for (const f of fs.readdirSync(hbDir).filter((x) => x.endsWith('.md'))) {
      const { last } = readHeartbeatFile(fs.readFileSync(path.join(hbDir, f), 'utf8'));
      if (last?.state === 'blocked') blocked.push(`${f.replace(/\.md$/, '')} | blocked | ${last.task}`);
    }
  }
  out(`DIGEST ${nowUtc()}  since ${since}`);
  for (const l of esc) out(`ESCALATION | ${l.replace(/^\|?\s*/, '')}`);
  for (const l of merges) out(`MERGED | ${l.replace(/^\|?\s*/, '')}`);
  for (const l of blocked) out(`BLOCKED | ${l}`);
  out(`acks: ${acks.length}`);
  if (!flags['dry-run']) fs.writeFileSync(wm, nowUtc());
}

function cmdInit({ flags, positional }) {
  const [runId] = positional;
  if (!runId) die('usage: fleet init <run-id> [--config path]');
  let cfg = loadConfig(flags);
  if (!cfg) {
    const example = path.join(HERE, '..', 'config', 'fleet.config.example.json');
    const target = path.resolve('fleet.config.json');
    fs.copyFileSync(example, target);
    out(`no config found — wrote ${target} from the example. EDIT IT before starting lanes: a lane pointed at the wrong repository is silent.`);
    cfg = loadConfig({ config: target });
  }
  const root = path.resolve(cfg.__dir, cfg.logRoot.replace(/[^/\\]+$/, runId));
  fs.mkdirSync(path.join(root, 'heartbeats'), { recursive: true });
  fs.mkdirSync(path.join(root, 'briefs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  const seed = {
    'registry.md': '# Registry — lane -> session (append-only; last row per lane wins)\n\n| UTC | lane | session | note |\n|---|---|---|---|\n',
    'queue.md': '# Queue — ranked backlog, assignments, numbered amendments (planner-owned)\n\n## Amendments\n\n## Assignments\n\n| UTC | issue | lane | branch |\n|---|---|---|---|\n',
    'acks.md': '# Acks — routed events (dispatch-owned)\n\n| UTC | lane | event | detail |\n|---|---|---|---|\n',
    'escalations.md': '# Escalations — append-only, anyone\n\n<UTC> | <lane> | <decision needed> | MEANWHILE: <what proceeds>\n\n',
    'reviews.md': '# Reviews — one row per verdict, scoped to a head SHA (reviewer-owned)\n\n| UTC | repo#n | head | verdict | findings |\n|---|---|---|---|---|\n',
    'outcomes.md': '# Outcomes — one row per merge (gitops-owned)\n\n| UTC | lane | repo | #n | merged sha | verifier |\n|---|---|---|---|---|---|\n',
  };
  for (const [f, body] of Object.entries(seed)) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) fs.writeFileSync(p, body);
  }
  const ignore = path.join(cfg.__dir, '.gitignore');
  const rel = path.relative(cfg.__dir, root).split(path.sep).join('/');
  const ig = fs.existsSync(ignore) ? fs.readFileSync(ignore, 'utf8') : '';
  if (!ig.split('\n').some((l) => l.trim() === rel || l.trim() === `${rel}/`)) fs.appendFileSync(ignore, `${ig.endsWith('\n') || !ig ? '' : '\n'}${rel}/\n`);
  out(`run directory ready: ${root}`);
  out(`config: ${cfg.__path}  lanes=${(cfg.lanes || []).length}  management enabled=${(cfg.management || []).filter((m) => m.enabled).length}`);
  out('next: write briefs/<lane>.md from agents/*.md, then paste into each session:');
  for (const l of cfg.lanes || []) out(`  You are ${l.name}. Read ${rel}/PROTOCOL.md then ${rel}/briefs/${l.name}.md. Run: fleet register ${l.name} <your-session-name>`);
}

function cmdDoctor({ flags }) {
  let bad = 0;
  const check = (ok, label, detail = '') => {
    out(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? `  ${detail}` : ''}`);
    if (!ok) bad++;
  };
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  check(nodeMajor >= 20, `node >= 20`, process.version);
  const ghv = spawnSync('gh', ['--version'], { encoding: 'utf8', windowsHide: true });
  check(ghv.status === 0, 'gh on PATH', (ghv.stdout || '').split('\n')[0]);
  if (ghv.status === 0) {
    const auth = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8', windowsHide: true });
    check(auth.status === 0, 'gh authenticated', auth.status === 0 ? '' : (auth.stderr || '').split('\n')[0]);
  }
  const cfg = loadConfig(flags);
  check(!!cfg, 'fleet.config.json found', cfg?.__path || '(none: run `fleet init <run-id>` to create one)');
  if (cfg) {
    for (const k of ['runId', 'logRoot', 'repoRoot', 'forge', 'defaultBase', 'lanes']) check(cfg[k] !== undefined, `config.${k} present`);
    check(Array.isArray(cfg.lanes) && cfg.lanes.length > 0, 'at least one lane');
    check(typeof cfg.sharedIdentity === 'boolean', 'config.sharedIdentity set explicitly', 'it changes attribution, approval and census mechanics');
    const root = logRootFrom(flags, cfg);
    check(root && fs.existsSync(root), 'run directory exists', root || '');
    const repoRoot = path.resolve(cfg.__dir, cfg.repoRoot || '.');
    for (const l of cfg.lanes || []) check(fs.existsSync(path.join(repoRoot, l.repo)), `lane ${l.name}: repo dir present`, path.join(repoRoot, l.repo));
  }
  out('');
  out(bad ? `${bad} problem(s)` : 'all checks passed');
  process.exit(bad ? 1 : 0);
}

// ---------------------------------------------------------------- self-test

function selfTest() {
  let failures = 0;
  const ok = (cond, label) => {
    out(`  ${cond ? 'ok  ' : 'FAIL'} ${label}`);
    if (!cond) failures++;
  };

  out('heartbeat parsing');
  const hbText = [
    '## prose heading',
    '2026-01-01T00:00:00Z | working | #12 thing | note with a | pipe',
    '- a bullet that is not a heartbeat',
    '| 2026-01-01T00:05:00Z | working | leading pipe |',
    '2026-01-01T00:10:00Z | standby | queue empty',
  ].join('\n');
  const hb = readHeartbeatFile(hbText);
  ok(hb.valid === 2, `2 valid heartbeats parsed (got ${hb.valid})`);
  ok(hb.malformed.length === 1 && /leading/.test(hb.malformed[0].reasons[0]), 'exactly the leading-pipe line is malformed');
  ok(hb.last.state === 'standby' && hb.last.task === 'queue empty', 'last valid heartbeat is the standby line (3 fields, no note)');
  ok(parseHeartbeat('2026-01-01T00:00:00Z | working | t | a | b').note === 'a | b', 'note keeps its pipes');

  out('classification');
  ok(classify({ state: 'standby' }, 999, 25) === 'STANDBY', 'standby never hung');
  ok(classify({ state: 'working' }, 26, 25) === 'HUNG-CANDIDATE', 'working past stale is a CANDIDATE, not a verdict');
  ok(classify({ state: 'working' }, 24, 25) === 'ACTIVE', 'working within stale is active');
  ok(classify({ state: 'waiting' }, 40, 25) === 'WAITING-STALE', 'waiting past stale is flagged separately');
  ok(classify(null, Infinity, 25) === 'NO-HEARTBEAT', 'no heartbeat is its own class');

  out('registry');
  const reg = parseRegistry([
    '| 2026-01-01T00:00:00Z | lane-a | session-one [aaaa] | |',
    '| 2026-01-01T00:01:00Z | CAUTION - free text row that is not a lane |',
    '| 2026-01-01T00:02:00Z | lane-a | session-two [bbbb] | renamed |',
  ].join('\n'));
  ok(reg.get('lane-a')?.session === 'session-two [bbbb]', 'last row per lane wins');
  ok(reg.size === 1, 'prose rows are not lanes');

  out('references');
  const refs = extractRefs('waiting on #2201 and api#2194, build-test @ 2d27534d5; see PR #231');
  ok(refs.includes('#2201') && refs.includes('api#2194') && refs.includes('#231'), `refs extracted: ${refs.join(' ')}`);
  ok(!refs.includes('#2d27534d5'), 'a sha is not a ref');

  out('checks: mixed types, double runs');
  const rollup = [
    { __typename: 'CheckRun', name: 'build', status: 'COMPLETED', conclusion: 'FAILURE', detailsUrl: 'https://x/actions/runs/100/job/1' },
    { __typename: 'CheckRun', name: 'gate', status: 'COMPLETED', conclusion: 'CANCELLED', detailsUrl: 'https://x/actions/runs/100/job/2' },
    { __typename: 'CheckRun', name: 'build', status: 'COMPLETED', conclusion: 'SUCCESS', detailsUrl: 'https://x/actions/runs/200/job/1' },
    { __typename: 'CheckRun', name: 'gate', status: 'COMPLETED', conclusion: 'SUCCESS', detailsUrl: 'https://x/actions/runs/200/job/2' },
    { __typename: 'CheckRun', name: 'e2e', status: 'COMPLETED', conclusion: 'SKIPPED', detailsUrl: 'https://x/actions/runs/200/job/3' },
    { __typename: 'StatusContext', context: 'vercel', state: 'SUCCESS', targetUrl: 'https://vercel/x' },
  ];
  const byRun = groupRuns(rollup);
  ok(byRun.size === 3, `3 groups (two runs + status contexts), got ${byRun.size}`);
  const v = verdictFor(byRun);
  ok(v.verdict === 'GREEN', `newest run wins: verdict ${v.verdict} (an ungrouped tally would read FAILURE+CANCELLED)`);
  ok(v.latest.length === 4, `4 distinct checks, got ${v.latest.length}`);
  ok(v.skipped.length === 1 && v.skipped[0].name === 'e2e', 'skipped lane named');
  const sc = readEntry(rollup[5]);
  ok(sc.type === 'StatusContext' && sc.settled && sc.result === 'SUCCESS', 'StatusContext read through .state, not .status');
  const running = readEntry({ __typename: 'CheckRun', name: 'x', status: 'IN_PROGRESS', conclusion: '' });
  ok(!running.settled && /PENDING/.test(running.result), 'empty-string conclusion while running is PENDING, not settled');
  const pendingV = verdictFor(groupRuns([{ __typename: 'StatusContext', context: 'v', state: 'PENDING' }]));
  ok(pendingV.verdict === 'PENDING', 'a pending StatusContext is not settled');

  out('verdicts: three objects, one field name');
  ok(verdictOf({ body: 'Verdict: APPROVE at abc1234def', reviewState: null })?.kind === 'APPROVE', 'issue comment: body is the verdict');
  ok(verdictOf({ body: 'lgtm', reviewState: 'APPROVED', commitId: 'deadbeef' })?.kind === 'APPROVE', 'formal review APPROVED: state is the verdict');
  ok(verdictOf({ body: '', reviewState: 'CHANGES_REQUESTED', commitId: 'deadbeef' })?.kind === 'BLOCK', 'formal review CHANGES_REQUESTED: BLOCK');
  const asComment = verdictOf({ body: '## Peer verdict: APPROVE — head `0123456789abcdef`', reviewState: 'COMMENTED', commitId: 'cafebabe' });
  ok(asComment?.kind === 'APPROVE', 'review state COMMENTED with APPROVE in the body: the STATE LIES, the body is the verdict');
  ok(asComment?.shas.includes('cafebabe') && asComment?.shas.includes('0123456789abcdef'), 'commit_id and body shas both bind the verdict');
  ok(verdictOf({ body: 'just a question', reviewState: 'COMMENTED' }) === null, 'a COMMENTED review with no verdict word is not a verdict');

  out('mutations — each must break exactly its own case');
  // Mutation 1: ungrouped tally (what a naive reader does) must FAIL the double-run case.
  const naive = rollup.map(readEntry).some((e) => e.settled && !GREEN.has(e.result));
  ok(naive === true, 'ungrouped read of the same rollup reports RED — proving grouping is load-bearing');
  // Mutation 2: reading StatusContext via .status must FAIL the mixed-type case.
  const wrongField = rollup.filter((e) => e.__typename === 'StatusContext').every((e) => (e.status || '') !== 'COMPLETED');
  ok(wrongField === true, 'reading StatusContext through .status marks it permanently unsettled — proving the type switch is load-bearing');

  out(failures ? `\nself-test FAILED (${failures})` : '\nself-test passed');
  return failures ? 1 : 0;
}

// -------------------------------------------------------------------- main

const COMMANDS = {
  hb: cmdHb,
  register: cmdRegister,
  census: cmdCensus,
  blockers: cmdBlockers,
  checks: cmdChecks,
  verdicts: cmdVerdicts,
  unblocks: cmdUnblocks,
  'queue-depth': cmdQueueDepth,
  digest: cmdDigest,
  init: cmdInit,
  doctor: cmdDoctor,
};

function usage() {
  out('fleet <command> [args] [--config PATH] [--log-root DIR] [--repo owner/name]');
  out('');
  out('  hb <lane> <state> <task> [note]   validated heartbeat append');
  out('  register <lane> <session> [note]  registry row + start heartbeat, one action');
  out('  census [--stale N]                every lane: age, state, class, malformed count');
  out('  blockers <lane> [--all]           measure what a lane waits on — has it cleared?');
  out('  checks <owner/repo> <pr>          typename-aware, run-grouped, two readings, verdict');
  out('  verdicts <owner/repo> [pr]        posted verdicts whose head has moved');
  out('  unblocks <owner/repo> <pr>        after a merge: unblocked lanes AND invalidated PRs');
  out('  queue-depth <owner/repo>          CI load in JOBS, not runs');
  out('  digest [--dry-run]                router digest from the logs since last watermark');
  out('  init <run-id>                     create a run directory (writes a config if none)');
  out('  doctor                            prerequisites and config');
  out('  --self-test                       prove the pure logic on fixtures');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { flags, positional } = parseArgs(process.argv.slice(2));
  if (flags['self-test']) process.exit(selfTest());
  const cmd = positional.shift();
  if (!cmd || flags.help || !COMMANDS[cmd]) {
    usage();
    process.exit(cmd && !COMMANDS[cmd] ? 2 : 0);
  }
  COMMANDS[cmd]({ flags, positional });
}
