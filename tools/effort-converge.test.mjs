import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ensureEffort } from '../settings/hooks/ensure-user-guard.mjs';
import { applyEffort, convergeEffort, effortProblems, targets } from '../settings/hooks/lib/user-guard-install.mjs';
import { ownedDir } from './lib/owned.mjs';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const ENTRY = path.join(TOOLS, '..', 'settings', 'hooks', 'ensure-user-guard.mjs');
const INSTALL = path.join(TOOLS, 'install-user-hook.mjs');
const HIGH = { effortLevel: 'high' };

/** A temporary home plus a project carrying a source hook. Never os.homedir(). */
function sandbox(t) {
  const root = ownedDir(t, 'effort-converge');
  const home = path.join(root, 'home');
  const project = path.join(root, 'project');
  fs.mkdirSync(home);
  fs.mkdirSync(path.join(project, '.claude', 'hooks'), { recursive: true });
  const source = path.join(project, '.claude', 'hooks', 'subagent-model.mjs');
  fs.writeFileSync(source, 'export const GUARD_VERSION = 2;\n');
  const paths = targets(home);
  const write = value => {
    fs.mkdirSync(paths.dir, { recursive: true });
    fs.writeFileSync(paths.settings, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
  };
  const read = () => fs.readFileSync(paths.settings, 'utf8');
  const backups = () => (fs.existsSync(paths.dir) ? fs.readdirSync(paths.dir).filter(f => f.includes('.bak-subagent-model-')) : []);
  const ensure = (env = {}) => ensureEffort({ home, source, env });
  const run = (env = {}) => spawnSync(process.execPath, [ENTRY], {
    encoding: 'utf8', input: '{}',
    env: { ...process.env, HOME: home, USERPROFILE: home, CLAUDE_PROJECT_DIR: project, SUBAGENT_MODEL_GUARD: '', ...env },
  });
  return { home, project, source, paths, write, read, backups, ensure, run };
}

const converged = { effortLevel: 'high', modelSettings: { sonnet: HIGH, opus: HIGH, fable: HIGH } };

test('effortProblems names every setting that is not high, and is empty when all are', () => {
  assert.deepEqual(effortProblems(converged), []);
  assert.deepEqual(effortProblems({ effortLevel: 'xhigh', modelSettings: { opus: HIGH } }), ['effortLevel xhigh', 'sonnet unset', 'fable unset']);
  assert.deepEqual(effortProblems({}), ['effortLevel unset', 'sonnet unset', 'opus unset', 'fable unset']);
  assert.deepEqual(effortProblems({ ...converged, modelSettings: { ...converged.modelSettings, 'claude-opus-5': { effortLevel: 'low' } } }), ['claude-opus-5 low']);
});

test('convergeEffort never mutates its input, keeps other keys in order, and is idempotent', () => {
  const input = { model: 'opus', effortLevel: 'xhigh', hooks: { a: 1 }, modelSettings: { opus: { effortLevel: 'high', note: 'x' }, sonnet: { note: 'y' } }, theme: 'dark' };
  const before = structuredClone(input);
  const out = convergeEffort(input);
  assert.deepEqual(input, before);
  assert.deepEqual(Object.keys(out), ['model', 'effortLevel', 'hooks', 'modelSettings', 'theme']);
  assert.deepEqual(out.modelSettings, { opus: { effortLevel: 'high', note: 'x' }, sonnet: { note: 'y', effortLevel: 'high' }, fable: HIGH });
  assert.equal(out.effortLevel, 'high');
  assert.deepEqual(convergeEffort(out), out);
});

test('an existing settings.json is converged: all keys, other keys kept, one line, one backup', t => {
  const s = sandbox(t);
  s.write({ model: 'opus', effortLevel: 'xhigh', env: { A: '1' }, modelSettings: { opus: HIGH } });
  const r = s.ensure();
  assert.equal(r.action, 'converged');
  assert.equal(r.line, 'effort set to high for every model (was: effortLevel xhigh, sonnet unset, fable unset) — takes effect from the next session; restart this one to run at high now');
  const after = JSON.parse(s.read());
  assert.deepEqual(after, { model: 'opus', effortLevel: 'high', env: { A: '1' }, modelSettings: { opus: HIGH, sonnet: HIGH, fable: HIGH } });
  assert.deepEqual(Object.keys(after), ['model', 'effortLevel', 'env', 'modelSettings']);
  assert.equal(s.backups().length, 1);
});

test('another existing modelSettings key (claude-opus-5) is set to high too', t => {
  const s = sandbox(t);
  s.write({ ...converged, modelSettings: { ...converged.modelSettings, 'claude-opus-5': { effortLevel: 'xhigh' } } });
  assert.equal(s.ensure().action, 'converged');
  assert.equal(JSON.parse(s.read()).modelSettings['claude-opus-5'].effortLevel, 'high');
});

test('already converged: no write, no backup, no output', async t => {
  const s = sandbox(t);
  s.write({ effortLevel: 'xhigh' });
  s.ensure();
  const bytes = s.read();
  const mtime = fs.statSync(s.paths.settings).mtimeMs;
  const backups = s.backups();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.deepEqual(s.ensure(), { action: 'none', line: '' });
  assert.equal(s.read(), bytes);
  assert.equal(fs.statSync(s.paths.settings).mtimeMs, mtime);
  assert.deepEqual(s.backups(), backups);
  assert.equal(s.run().stdout.includes('effort'), false);
});

test('SUBAGENT_MODEL_GUARD=off skips and leaves the file byte-identical', t => {
  const s = sandbox(t);
  s.write({ effortLevel: 'xhigh' });
  const bytes = s.read();
  assert.equal(s.ensure({ SUBAGENT_MODEL_GUARD: ' OFF ' }).action, 'skipped');
  assert.equal(s.read(), bytes);
  assert.equal(s.backups().length, 0);
});

test('malformed settings.json: no write, one warning, never a throw', t => {
  const s = sandbox(t);
  s.write('{ not json');
  const r = s.ensure();
  assert.equal(r.action, 'refused');
  assert.match(r.line, /^effort NOT converged: .*does not parse/);
  assert.equal(s.read(), '{ not json');
  assert.equal(s.backups().length, 0);
});

test('a missing settings.json is not created', t => {
  const s = sandbox(t);
  assert.deepEqual(s.ensure(), { action: 'none', line: '' });
  assert.equal(fs.existsSync(s.paths.dir), false);
});

test('the conventions repository itself (reference layout) is skipped', t => {
  const s = sandbox(t);
  fs.mkdirSync(path.join(s.project, 'tools'), { recursive: true });
  fs.mkdirSync(path.join(s.project, 'settings', 'hooks'), { recursive: true });
  fs.writeFileSync(path.join(s.project, 'tools', 'rules.mjs'), '// reference\n');
  fs.writeFileSync(path.join(s.project, 'settings', 'hooks', 'subagent-model.mjs'), '// ref\n');
  s.write({ effortLevel: 'xhigh' });
  const bytes = s.read();
  assert.equal(s.ensure().action, 'skipped');
  assert.equal(s.read(), bytes);
});

test('the entry point converges at EVERY session start, even when the guard is current, and prints one systemMessage', t => {
  const s = sandbox(t);
  s.write({ effortLevel: 'xhigh' });
  const first = s.run();
  assert.equal(first.status, 0, first.stderr);
  const lines = first.stdout.split('\n').filter(Boolean);
  assert.equal(lines.length, 1);
  const { systemMessage } = JSON.parse(lines[0]);
  assert.match(systemMessage, /guard installed into ~\/\.claude/);
  assert.match(systemMessage, /effort set to high for every model \(was: effortLevel xhigh, sonnet unset, opus unset, fable unset\) — takes effect from the next session; restart this one to run at high now/);
  // Guard now current; someone sets xhigh again: the next start still converges, alone.
  const edited = JSON.parse(s.read());
  fs.writeFileSync(s.paths.settings, `${JSON.stringify({ ...edited, effortLevel: 'xhigh' }, null, 2)}\n`);
  const second = s.run();
  assert.equal(JSON.parse(second.stdout).systemMessage, 'effort set to high for every model (was: effortLevel xhigh) — takes effect from the next session; restart this one to run at high now');
  assert.equal(s.run().stdout, '');
});

test('install-user-hook --check reports the effort status without changing the exit code', t => {
  const s = sandbox(t);
  const run = (...args) => spawnSync(process.execPath, [INSTALL, ...args, '--home', s.home, '--source', s.source], { encoding: 'utf8' });
  assert.equal(run('--install').status, 0);
  const bad = run('--check');
  assert.equal(bad.status, 0, bad.stderr);
  assert.match(bad.stderr, /effort: effortLevel unset, sonnet unset, opus unset, fable unset/);
  s.write({ ...JSON.parse(s.read()), ...converged });
  const good = run('--check');
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stderr, /effort: high for every model/);
});

const dirFiles = (s, part) => (fs.existsSync(s.paths.dir) ? fs.readdirSync(s.paths.dir).filter(f => f.includes(part)) : []);

// root passes W_OK whatever the mode bits say, so the file is not read-only to it.
const RUNS_AS_ROOT = process.getuid?.() === 0;

test('a read-only settings.json: one refusal line, no backup, no temp file, and nothing accumulates', { skip: RUNS_AS_ROOT && 'root ignores mode bits' }, t => {
  const s = sandbox(t);
  s.write({ effortLevel: 'xhigh' });
  const bytes = s.read();
  fs.chmodSync(s.paths.settings, 0o444);
  try {
    for (let run = 0; run < 3; run += 1) {
      const r = s.ensure();
      assert.equal(r.action, 'refused');
      assert.match(r.line, /^effort NOT converged: .*not writable/);
    }
    assert.equal(s.backups().length, 0);
    assert.deepEqual(dirFiles(s, '.tmp-'), []);
    assert.equal(s.read(), bytes);
  } finally {
    fs.chmodSync(s.paths.settings, 0o666);
  }
});

test('a write that fails after the backup is a refusal, and repeated runs add no further backup', t => {
  const s = sandbox(t);
  s.write({ effortLevel: 'xhigh' });
  const bytes = s.read();
  fs.mkdirSync(`${s.paths.settings}.tmp-${process.pid}`); // makes the temp-file write fail
  for (let run = 0; run < 3; run += 1) {
    const r = s.ensure();
    assert.equal(r.action, 'refused');
    assert.match(r.line, /^effort NOT converged: .*could not be written/);
  }
  assert.equal(s.backups().length, 1);
  assert.equal(s.read(), bytes);
});

test('another session converging at the same moment: nothing printed, no extra backup', t => {
  const s = sandbox(t);
  s.write({ effortLevel: 'xhigh' });
  const r = applyEffort({ home: s.home, beforeWrite: () => s.write(converged) });
  assert.equal(r.code, 0);
  assert.deepEqual(r.lines, []);
  assert.equal(r.changed, false);
  assert.equal(s.backups().length, 0);
});

test('a concurrent change that leaves effort unconverged is refused with the effort wording', t => {
  const s = sandbox(t);
  s.write({ effortLevel: 'xhigh' });
  const r = applyEffort({ home: s.home, beforeWrite: () => s.write({ effortLevel: 'max' }) });
  assert.equal(r.code, 1);
  assert.match(r.lines.at(-1), /changed while converging effort/);
  assert.equal(s.backups().length, 0);
});

for (const [name, settings, phrase] of [
  ['modelSettings is an array', { modelSettings: ['x'] }, /modelSettings is not an object/],
  ['modelSettings is a string', { modelSettings: 'x' }, /modelSettings is not an object/],
  ['a per-model value is a string', { modelSettings: { opus: 'x' } }, /modelSettings\.opus is not an object/],
]) {
  test(`${name}: refused, nothing written (user data is never replaced)`, t => {
    const s = sandbox(t);
    s.write(settings);
    const bytes = s.read();
    const r = s.ensure();
    assert.equal(r.action, 'refused');
    assert.match(r.line, phrase);
    assert.equal(s.read(), bytes);
    assert.equal(s.backups().length, 0);
  });
}

test('a symlinked settings.json stays a symlink and its target is converged', t => {
  const s = sandbox(t);
  const target = path.join(path.dirname(s.home), 'real-settings.json');
  fs.writeFileSync(target, `${JSON.stringify({ effortLevel: 'xhigh' })}\n`);
  fs.mkdirSync(s.paths.dir, { recursive: true });
  try {
    fs.symlinkSync(target, s.paths.settings);
  } catch (e) {
    return t.skip(`symlinks are not permitted here (${e.code})`);
  }
  assert.equal(s.ensure().action, 'converged');
  assert.equal(fs.lstatSync(s.paths.settings).isSymbolicLink(), true);
  assert.equal(JSON.parse(fs.readFileSync(target, 'utf8')).effortLevel, 'high');
});

test('the original file mode is kept on the new file and on the backup', t => {
  if (process.platform === 'win32') return t.skip('POSIX modes do not exist on Windows');
  const s = sandbox(t);
  s.write({ effortLevel: 'xhigh', env: { TOKEN: 'x' } });
  fs.chmodSync(s.paths.settings, 0o600);
  assert.equal(s.ensure().action, 'converged');
  assert.equal(fs.statSync(s.paths.settings).mode & 0o777, 0o600);
  assert.equal(fs.statSync(path.join(s.paths.dir, s.backups()[0])).mode & 0o777, 0o600);
});
