// Unit tests for plugins/project-management-plugin/lib/pm-state.mjs.
// Uses node:test + node:assert (no third-party deps).
//
// Each test points CLAUDE_PROJECT_DIR at an isolated temp dir so state
// writes never touch the developer's real .claude/projects tree.

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  projectsRoot,
  listProjects,
  readProject,
  readTasks,
  writeProject,
  writeTasks,
  mutateTasks,
  nextTask,
  unblockedTasks,
  withLock,
  loadValidators,
  validateProject,
  validateTasks,
  writeCheckpoint,
} from '../lib/pm-state.mjs';

const FIXTURES = new URL('./fixtures/', import.meta.url);
const validProject = JSON.parse(readFileSync(new URL('valid-project.json', FIXTURES), 'utf8'));
const validTasks = JSON.parse(readFileSync(new URL('valid-tasks.json', FIXTURES), 'utf8'));

function setupTempProject() {
  const tmp = mkdtempSync(join(tmpdir(), 'pm-state-test-'));
  process.env.CLAUDE_PROJECT_DIR = tmp;
  const projectId = validProject.id;
  const projectDir = join(tmp, '.claude', 'projects', projectId);
  mkdirSync(projectDir, { recursive: true });
  writeFileSync(join(projectDir, 'project.json'), JSON.stringify(validProject, null, 2));
  writeFileSync(join(projectDir, 'tasks.json'), JSON.stringify(validTasks, null, 2));
  return { tmp, projectId, projectDir };
}

function teardown(tmp) {
  try { rmSync(tmp, { recursive: true, force: true }); } catch {}
}

await loadValidators();

test('projectsRoot() honors CLAUDE_PROJECT_DIR', () => {
  const base = join(tmpdir(), 'pm-projects-root-fixture');
  process.env.CLAUDE_PROJECT_DIR = base;
  // Build the expectation with join() too: projectsRoot() uses path.join, which
  // emits "\" on Windows, so a hardcoded POSIX string fails there even though
  // the implementation is correct.
  assert.equal(projectsRoot(), join(base, '.claude', 'projects'));
});

test('listProjects + readProject + readTasks find the fixture', () => {
  const { tmp, projectId } = setupTempProject();
  try {
    const all = listProjects();
    assert.equal(all.length, 1);
    assert.equal(all[0].id, projectId);
    const project = readProject(projectId);
    assert.equal(project.name, 'Fixture Alpha');
    const tasks = readTasks(projectId);
    assert.equal(tasks.tasks.length, 3);
  } finally { teardown(tmp); }
});

test('readTasks() normalizes a bare-array legacy tasks.json', () => {
  const { tmp, projectId, projectDir } = setupTempProject();
  try {
    writeFileSync(join(projectDir, 'tasks.json'), JSON.stringify(validTasks.tasks, null, 2));
    const tasks = readTasks(projectId);
    assert.equal(tasks.version, 1);
    assert.equal(tasks.tasks.length, 3);
  } finally { teardown(tmp); }
});

test('validateProject accepts fixture, rejects bad status', () => {
  assert.deepEqual(validateProject(validProject), []);
  const bad = { ...validProject, status: 'WAT' };
  const errors = validateProject(bad);
  assert.ok(errors.length > 0, 'should flag bad status enum');
  assert.ok(errors.join('\n').toLowerCase().includes('status') || errors.join('\n').includes('enum'),
    `expected status/enum error, got: ${errors.join('\n')}`);
});

test('validateTasks rejects task with missing required fields', () => {
  const bad = { tasks: [{ id: 'T-999' }] };
  const errors = validateTasks(bad);
  assert.ok(errors.length > 0, 'should flag missing required fields');
});

test('writeProject writes + validates + reads back', async () => {
  const { tmp, projectId } = setupTempProject();
  try {
    const updated = { ...validProject, name: 'Fixture Alpha v2' };
    await writeProject(projectId, updated);
    assert.equal(readProject(projectId).name, 'Fixture Alpha v2');
  } finally { teardown(tmp); }
});

test('writeProject throws on schema-invalid input', async () => {
  const { tmp, projectId } = setupTempProject();
  try {
    const bad = { ...validProject, status: 'NOT_A_STATUS' };
    await assert.rejects(() => writeProject(projectId, bad), /validation/i);
    // original file should be untouched
    assert.equal(readProject(projectId).status, 'PLANNED');
  } finally { teardown(tmp); }
});

test('mutateTasks applies a transform atomically', async () => {
  const { tmp, projectId } = setupTempProject();
  try {
    await mutateTasks(projectId, (tasks) => {
      const t = tasks.tasks.find((x) => x.id === 'T-002');
      t.status = 'IN_PROGRESS';
      return tasks;
    });
    assert.equal(readTasks(projectId).tasks.find((t) => t.id === 'T-002').status, 'IN_PROGRESS');
  } finally { teardown(tmp); }
});

test('nextTask prefers CRITICAL on critical path', () => {
  const pick = nextTask(validTasks);
  // T-002 is CRITICAL + on_critical_path but depends on T-001 (COMPLETE),
  // so it should be unblocked and picked over T-003 (LOW, off-path).
  assert.equal(pick.id, 'T-002');
});

test('unblockedTasks excludes tasks whose deps are not COMPLETE', () => {
  const ready = unblockedTasks(validTasks);
  const ids = ready.map((t) => t.id).sort();
  assert.deepEqual(ids, ['T-002', 'T-003']);
});

test('withLock serializes concurrent writers', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'pm-lock-test-'));
  try {
    const lockPath = join(tmp, '.lock');
    let inFlight = 0;
    let maxSeen = 0;
    const work = async () => withLock(lockPath, async () => {
      inFlight += 1;
      maxSeen = Math.max(maxSeen, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight -= 1;
    });
    await Promise.all([work(), work(), work(), work()]);
    assert.equal(maxSeen, 1, 'at most one critical section should run at a time');
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test('writeCheckpoint produces a snapshot file', () => {
  const { tmp, projectId, projectDir } = setupTempProject();
  try {
    const file = writeCheckpoint(projectId);
    assert.ok(file && existsSync(file), 'checkpoint file should exist');
    const snap = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(snap.project_snapshot.id, projectId);
    assert.equal(snap.task_statuses.length, 3);
  } finally { teardown(tmp); }
});

test('writeTasks rejects tasks.json with a disallowed status', async () => {
  const { tmp, projectId } = setupTempProject();
  try {
    const bad = { ...validTasks };
    bad.tasks = bad.tasks.map((t) => (t.id === 'T-002' ? { ...t, status: 'GOING_GREAT' } : t));
    await assert.rejects(() => writeTasks(projectId, bad), /validation/i);
  } finally { teardown(tmp); }
});
