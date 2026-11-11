/**
 * The agent-models registration on the ONE settings.json road (E2.S2). Two halves:
 *
 * - the road itself (`commitSettings`, `settingsFileOf`, `writeAtomic` of `settings/hooks/lib/user-guard-install.mjs`),
 *   called directly in a folder made by `ownedDir`: a created file, a file that appears in the gap, a link that appears
 *   in the gap, a filesystem without hard links, the re-check of the bytes and of the resolved target, and the guard's own
 *   `install`, which must do what it did before the road existed;
 * - the registration (`ensureAgentModels`, through `sandbox(t).ensure`): a missing settings.json created, the value rule,
 *   a chain of links, a dangling chain, a loop, the re-pointed link, an unwritable folder, an unreadable file.
 *
 * Temporary homes only, never the real ~/.claude. `fs.linkSync` is replaced for one call and restored in `finally`: the
 * module under test calls it through the same `node:fs` object. A mode case skips on win32; a permission case also skips
 * as root; a link case skips where a symlink cannot be made.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import * as guard from '../settings/hooks/lib/user-guard-install.mjs';
import {
  D, IS_ROOT, RETRY_TAIL, HAND_TAIL, carriedText, installedLine, notRegistered, registeredLine, sandbox, snapshot, symlinkOrSkip,
} from './lib/agent-models-fixtures.mjs';
import { ownedDir } from './lib/owned.mjs';

const POSIX = process.platform !== 'win32';
const modeOf = file => fs.statSync(file).mode & 0o777;
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const tmpFiles = dir => fs.readdirSync(dir).filter(name => name.includes('.tmp-'));
const OTHER = '{\n  "hooks": {}\n}\n';
/** The one line a registration refused as "changed under us" is told with (a constant of the installer, said here in words). */
const CHANGED = 'settings.json changed while registering the agent-models mod; nothing written to it';
const settingsText = value => `${JSON.stringify(value, null, 2)}\n`;

/** Runs `run` with the process umask set to `mask`, and restores it. */
function withUmask(mask, run) {
  const before = process.umask(mask);
  try {
    return run();
  } finally {
    process.umask(before);
  }
}

/** Runs `run` with `fs.linkSync` replaced by `replacement(real)`; restored in `finally`. */
function withLinkSync(replacement, run) {
  const real = fs.linkSync;
  fs.linkSync = replacement(real);
  try {
    return run();
  } finally {
    fs.linkSync = real;
  }
}

const eperm = () => Object.assign(new Error('EPERM: injected'), { code: 'EPERM', syscall: 'link' });

/** A filesystem without hard links: every call is counted and fails with EPERM, after `before(dest)` when given. */
function noHardLinks(counter, before = () => {}) {
  return () => (from, to) => {
    counter.calls += 1;
    before(to);
    throw eperm();
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// the road
// ---------------------------------------------------------------------------------------------------------------------

/** A folder for the road's own cases; `open()` is what a caller holds before it computes its data. */
function road(t) {
  const root = ownedDir(t, 'settings-road');
  const dir = path.join(root, 'home', '.claude');
  fs.mkdirSync(dir, { recursive: true });
  const settings = path.join(dir, 'settings.json');
  const open = () => ({ settingsPath: settings, original: guard.readOrNull(settings), target: guard.settingsFileOf(settings) });
  return { root, dir, settings, open };
}

test('2.1 the road creates a missing settings.json complete, with the mode of the umask, and leaves no temp file', { skip: !POSIX }, t => {
  const r = road(t);
  const done = withUmask(0o022, () => guard.commitSettings({ ...r.open(), data: '{"a":1}\n', replace: false }));
  assert.deepEqual(done, { written: true });
  assert.equal(fs.readFileSync(r.settings, 'utf8'), '{"a":1}\n');
  assert.equal(modeOf(r.settings), 0o644);
  assert.deepEqual(tmpFiles(r.dir), []);
});

test('2.2 a file that appears after the re-check is never replaced by a created one: the creation answers not written and the other bytes stay', t => {
  const r = road(t);
  const other = '{"theme":"dark"}\n';
  const done = guard.commitSettings({ ...r.open(), data: '{"a":1}\n', replace: false, prepare: () => fs.writeFileSync(r.settings, other) });
  assert.equal(done.written, false);
  assert.equal(done.now.toString(), other);
  assert.equal(fs.readFileSync(r.settings, 'utf8'), other);
  assert.deepEqual(tmpFiles(r.dir), []);
});

test('2.3 a link that appears at the name after the re-check is not written through: the link stays and its target is not created', t => {
  const r = road(t);
  const elsewhere = path.join(r.root, 'elsewhere.json');
  let linked = true;
  const done = guard.commitSettings({
    ...r.open(),
    data: '{"a":1}\n',
    replace: false,
    prepare: () => {
      try {
        fs.symlinkSync(elsewhere, r.settings);
      } catch {
        linked = false;
      }
    },
  });
  if (!linked) return t.skip('symlinks are not permitted here');
  assert.equal(done.written, false);
  assert.equal(fs.lstatSync(r.settings).isSymbolicLink(), true);
  assert.equal(fs.existsSync(elsewhere), false);
  assert.deepEqual(tmpFiles(r.dir), []);
});

test('2.4 where no hard link can be made nothing is created and nothing is replaced: the error goes up, no look-then-rename', { skip: !POSIX }, t => {
  const none = road(t);
  const first = { calls: 0 };
  assert.throws(() => withLinkSync(noHardLinks(first), () => guard.commitSettings({ ...none.open(), data: '{"a":1}\n', replace: false })), { code: 'EPERM' });
  assert.equal(first.calls, 1);
  assert.equal(fs.existsSync(none.settings), false, 'a file the link could not name is not created by a rename');
  assert.deepEqual(tmpFiles(none.dir), []);

  const gap = road(t);
  const second = { calls: 0 };
  const other = '{"theme":"dark"}\n';
  assert.throws(() => withLinkSync(noHardLinks(second, to => fs.writeFileSync(to, other)), () => guard.commitSettings({ ...gap.open(), data: '{"a":1}\n', replace: false })), { code: 'EPERM' });
  assert.equal(second.calls, 1);
  assert.equal(fs.readFileSync(gap.settings, 'utf8'), other, 'a file a writer just created in the gap is not replaced');
  assert.deepEqual(tmpFiles(gap.dir), []);
});

test('2.4 at the registration, a filesystem without hard links is a retry refusal, in both halves, and no file is created or replaced', { skip: !POSIX }, t => {
  const s = sandbox(t);
  const counter = { calls: 0 };
  const r = withLinkSync(noHardLinks(counter), () => s.ensure());
  assert.equal(r.line, notRegistered('1.2.3', `${s.t_.settings} could not be written (EPERM)`, RETRY_TAIL));
  assert.equal(counter.calls, 1);
  assert.equal(fs.existsSync(s.t_.settings), false);
  assert.deepEqual(tmpFiles(s.claude), []);

  const g = sandbox(t);
  g.seedTarget();
  const gapCounter = { calls: 0 };
  const written = withLinkSync(noHardLinks(gapCounter, to => fs.writeFileSync(to, OTHER)), () => g.ensure());
  assert.equal(written.line, notRegistered('1.2.3', `${g.t_.settings} could not be written (EPERM)`, RETRY_TAIL));
  assert.equal(g.readSettings(), OTHER);
  assert.deepEqual(tmpFiles(g.claude), []);
});

test('2.5 an existing file is always replaced, also under replace:false, and keeps its own mode under a strict umask', { skip: !POSIX }, t => {
  const r = road(t);
  fs.writeFileSync(r.settings, '{}\n');
  fs.chmodSync(r.settings, 0o644);
  const done = withUmask(0o077, () => guard.commitSettings({ ...r.open(), data: '{"a":1}\n', replace: false }));
  assert.deepEqual(done, { written: true });
  assert.equal(fs.readFileSync(r.settings, 'utf8'), '{"a":1}\n');
  assert.equal(modeOf(r.settings), 0o644);
});

test('2.6 the road refuses when the bytes changed, and when the link names another file with the same bytes; prepare never runs', t => {
  const r = road(t);
  fs.writeFileSync(r.settings, '{}\n');
  let prepared = 0;
  const prepare = () => { prepared += 1; };
  const bytes = guard.commitSettings({ ...r.open(), data: '{"a":1}\n', beforeWrite: () => fs.writeFileSync(r.settings, '{"x":1}\n'), prepare });
  assert.equal(bytes.written, false);
  assert.equal(bytes.now.toString(), '{"x":1}\n');
  assert.equal(prepared, 0);

  fs.rmSync(r.settings);
  const a = path.join(r.root, 'a.json');
  const b = path.join(r.root, 'b.json');
  fs.writeFileSync(a, '{}\n');
  fs.writeFileSync(b, '{}\n');
  if (!symlinkOrSkip(t, a, r.settings)) return;
  const link = guard.commitSettings({
    ...r.open(),
    data: '{"a":1}\n',
    beforeWrite: () => { fs.rmSync(r.settings); fs.symlinkSync(b, r.settings); },
    prepare,
  });
  assert.equal(link.written, false);
  assert.equal(fs.readFileSync(a, 'utf8'), '{}\n');
  assert.equal(fs.readFileSync(b, 'utf8'), '{}\n');
  assert.equal(prepared, 0);
});

test('2.7 settingsFileOf: a plain missing path, an existing chain, a dangling chain, a loop with its reason apart from its advice', t => {
  const r = road(t);
  assert.deepEqual(guard.settingsFileOf(r.settings), { file: r.settings });
  const mid = path.join(r.root, 'mid.json');
  const real = path.join(r.root, 'real.json');
  if (!symlinkOrSkip(t, real, mid)) return;
  fs.symlinkSync(mid, r.settings);
  assert.deepEqual(guard.settingsFileOf(r.settings), { file: real, dangling: true });
  fs.writeFileSync(real, '{}\n');
  assert.deepEqual(guard.settingsFileOf(r.settings), { file: fs.realpathSync(real) });
  fs.rmSync(mid);
  fs.symlinkSync(r.settings, mid);
  const loop = guard.settingsFileOf(r.settings);
  assert.equal(loop.reason, `${r.settings} has more than 40 links (a loop, or a chain too long to open)`);
  assert.equal(loop.refusal, `${loop.reason}; nothing changed — point it at one file`);
  assert.equal(loop.file, undefined);
});

test('2.8 writeAtomic with replace:false leaves a taken name alone and answers false; the default replaces and answers true', t => {
  const r = road(t);
  fs.writeFileSync(r.settings, 'old');
  assert.equal(guard.writeAtomic(r.settings, 'new', undefined, { replace: false }), false);
  assert.equal(fs.readFileSync(r.settings, 'utf8'), 'old');
  assert.deepEqual(tmpFiles(r.dir), []);
  assert.equal(guard.writeAtomic(r.settings, 'new'), true);
  assert.equal(fs.readFileSync(r.settings, 'utf8'), 'new');
});

test('2.9 the guard as at HEAD: a fresh install creates settings.json by the rename with the mode of the umask, never by a hard link', { skip: !POSIX }, t => {
  const r = road(t);
  const source = path.join(r.root, 'subagent-model.mjs');
  fs.writeFileSync(source, '// fixture hook\n');
  const counter = { calls: 0 };
  const result = withUmask(0o022, () => withLinkSync(noHardLinks(counter), () => guard.install({ home: path.join(r.root, 'home'), source })));
  assert.equal(result.code, 0, result.lines.join('\n'));
  assert.equal(counter.calls, 0, 'the guard never asks for a hard link');
  assert.equal(modeOf(r.settings), 0o644);
  assert.ok(Object.hasOwn(json(r.settings).hooks, 'PreToolUse'), 'the guard entry is registered');
  assert.deepEqual(tmpFiles(r.dir), []);
});

// ---------------------------------------------------------------------------------------------------------------------
// the registration: the value rule
// ---------------------------------------------------------------------------------------------------------------------

test('2.11 a created file carries the session entries first: empties, duplicates and our target dropped, the others as written', t => {
  const s = sandbox(t);
  const r = s.ensure({ inheritedPluginDirs: `/a${D}${D}~/c${D}/a${D}~/.claude/mods/agent-models${D}` });
  assert.equal(r.line, installedLine('1.2.3') + carriedText(2));
  assert.deepEqual(json(s.t_.settings), { env: { CLAUDE_CODE_PLUGIN_DIRS: ['/a', '~/c', s.t_.target].join(D) } });
});

for (const [name, settings] of [
  ['no env', { model: 'm' }],
  ['env without the key', { model: 'm', env: { A: '1' } }],
  ['an empty value', { model: 'm', env: { A: '1', CLAUDE_CODE_PLUGIN_DIRS: '' } }],
]) {
  test(`2.12 an existing file with ${name} gets the session entries, then the target; every other key keeps its place; one backup of the old bytes`, t => {
    const s = sandbox(t);
    s.seedTarget();
    s.writeSettings(settings);
    const before = s.readSettings();
    const r = s.ensure({ inheritedPluginDirs: `/a${D}/b` });
    assert.deepEqual([r.action, r.line, r.registration], ['registered', registeredLine + carriedText(2), 'append']);
    const after = json(s.t_.settings);
    assert.deepEqual(after, { model: 'm', env: { ...settings.env, CLAUDE_CODE_PLUGIN_DIRS: ['/a', '/b', s.t_.target].join(D) } });
    assert.deepEqual(Object.keys(after), ['model', 'env']);
    assert.equal(s.backups().length, 1);
    assert.equal(fs.readFileSync(path.join(s.claude, s.backups()[0]), 'utf8'), before);
  });
}

test('2.13 a value with empty entries and a trailing delimiter is kept byte for byte and appended to; nothing is carried into it', t => {
  const s = sandbox(t);
  s.seedTarget();
  const value = `/a${D}${D}/b${D}`;
  s.writeSettings({ env: { CLAUDE_CODE_PLUGIN_DIRS: value } });
  const r = s.ensure({ inheritedPluginDirs: '/zzz' });
  assert.equal(r.line, registeredLine);
  assert.equal(json(s.t_.settings).env.CLAUDE_CODE_PLUGIN_DIRS, value + D + s.t_.target);
});

for (const [name, spelled] of [
  ['with a trailing separator', () => '~/.claude/mods/agent-models/'],
  ['through a .. segment', t_ => path.join(t_.mods, '..', 'mods', 'agent-models')],
]) {
  test(`2.14 a target already listed ${name} is none: no write, no backup, no mtime moved`, t => {
    const s = sandbox(t);
    s.seedTarget();
    s.writeSettings({ env: { CLAUDE_CODE_PLUGIN_DIRS: `/a${D}${spelled(s.t_)}` } });
    const before = snapshot(s.claude);
    const r = s.ensure({ inheritedPluginDirs: '/zzz' });
    assert.deepEqual([r.action, r.registration], ['none', 'none']);
    assert.deepEqual(snapshot(s.claude), before);
  });
}

test('2.15 a value of "~" alone is not our target: it is kept and the target is appended', t => {
  const s = sandbox(t);
  s.seedTarget();
  s.writeSettings({ env: { CLAUDE_CODE_PLUGIN_DIRS: '~' } });
  s.ensure();
  assert.equal(json(s.t_.settings).env.CLAUDE_CODE_PLUGIN_DIRS, `~${D}${s.t_.target}`);
});

// ---------------------------------------------------------------------------------------------------------------------
// the registration: another writer in the gap
// ---------------------------------------------------------------------------------------------------------------------

test('2.17 another start creates settings.json first: one that lists the target is settled; any other is a retry, its bytes stay, and the next start registers', t => {
  const a = sandbox(t);
  let wrote;
  const settled = a.ensure({ beforeWrite: () => { wrote = settingsText(a.registered({ model: 'other' })); a.writeSettings(wrote); } });
  assert.deepEqual([settled.action, settled.line, settled.registration], ['installed', installedLine('1.2.3'), 'settled']);
  assert.equal(a.readSettings(), wrote);

  const b = sandbox(t);
  const refused = b.ensure({ beforeWrite: () => b.writeSettings(OTHER) });
  assert.equal(refused.line, notRegistered('1.2.3', CHANGED, RETRY_TAIL));
  assert.equal(b.readSettings(), OTHER);
  assert.deepEqual(b.backups(), []);
  assert.equal(b.ensure().action, 'registered');
  assert.deepEqual(json(b.t_.settings), { hooks: {}, env: { CLAUDE_CODE_PLUGIN_DIRS: b.t_.target } });
});

test('2.17 a file that appears AFTER the re-check, while the mod creates its own, is never replaced; the line is the changed text and the next start registers', { skip: !POSIX }, t => {
  const s = sandbox(t);
  let calls = 0;
  const r = withLinkSync(real => (from, to) => { calls += 1; fs.writeFileSync(to, OTHER); return real(from, to); }, () => s.ensure());
  assert.equal(calls, 1);
  assert.equal(r.line, notRegistered('1.2.3', CHANGED, RETRY_TAIL));
  assert.equal(s.readSettings(), OTHER);
  assert.deepEqual(tmpFiles(s.claude), []);
  assert.equal(s.ensure().action, 'registered');
  assert.deepEqual(json(s.t_.settings), { hooks: {}, env: { CLAUDE_CODE_PLUGIN_DIRS: s.t_.target } });
});

// ---------------------------------------------------------------------------------------------------------------------
// the registration: links
// ---------------------------------------------------------------------------------------------------------------------

/** `~/.claude/settings.json` → `dotfiles/mid.json` → `dotfiles/settings.json`, where only the links are made here. */
function chain(t) {
  const s = sandbox(t);
  s.seedTarget();
  const dotfiles = path.join(s.root, 'dotfiles');
  fs.mkdirSync(dotfiles);
  fs.mkdirSync(s.claude, { recursive: true });
  return { s, dotfiles, real: path.join(dotfiles, 'settings.json'), mid: path.join(dotfiles, 'mid.json') };
}

test('2.18 a chain of links is registered at its last target: every link stays, the mode and the backup follow the real file', { skip: !POSIX }, t => {
  const c = chain(t);
  fs.writeFileSync(c.real, '{"model":"x"}\n');
  fs.chmodSync(c.real, 0o640);
  if (!symlinkOrSkip(t, c.real, c.mid)) return;
  fs.symlinkSync(c.mid, c.s.t_.settings);
  assert.equal(c.s.ensure().action, 'registered');
  assert.equal(fs.lstatSync(c.s.t_.settings).isSymbolicLink(), true);
  assert.equal(fs.lstatSync(c.mid).isSymbolicLink(), true);
  assert.deepEqual(json(c.real), { model: 'x', env: { CLAUDE_CODE_PLUGIN_DIRS: c.s.t_.target } });
  assert.equal(modeOf(c.real), 0o640);
  const backups = c.s.backups(c.dotfiles);
  assert.equal(backups.length, 1);
  assert.equal(modeOf(path.join(c.dotfiles, backups[0])), 0o640);
  assert.deepEqual(c.s.backups(), []);
});

test('2.19 a dangling chain is a retry: nothing is created at its last target, no link is touched, and the next start registers once the file exists', t => {
  const c = chain(t);
  if (!symlinkOrSkip(t, c.real, c.mid)) return;
  fs.symlinkSync(c.mid, c.s.t_.settings);
  const r = c.s.ensure();
  assert.equal(r.line, notRegistered('1.2.3', `${c.s.t_.settings} is a link to ${c.real}, which does not exist`, RETRY_TAIL));
  assert.equal(fs.existsSync(c.real), false);
  assert.deepEqual(fs.readdirSync(c.dotfiles), ['mid.json']);
  assert.equal(fs.lstatSync(c.s.t_.settings).isSymbolicLink(), true);
  fs.writeFileSync(c.real, '{}\n');
  assert.equal(c.s.ensure().action, 'registered');
});

const LOOP_REASON = settings => `${settings} has more than 40 links (a loop, or a chain too long to open)`;

test('2.20 a link loop is refused by hand and no link is touched', t => {
  const c = chain(t);
  const loop = path.join(c.s.claude, 'loop.json');
  if (!symlinkOrSkip(t, loop, c.s.t_.settings)) return;
  fs.symlinkSync(c.s.t_.settings, loop);
  const r = c.s.ensure();
  assert.equal(r.line, notRegistered('1.2.3', LOOP_REASON(c.s.t_.settings), HAND_TAIL));
  assert.equal(fs.lstatSync(c.s.t_.settings).isSymbolicLink(), true);
  assert.equal(fs.lstatSync(loop).isSymbolicLink(), true);
});

test('2.21 a chain of 41 links that ends in an existing file is refused like a loop and the file is byte-identical', t => {
  const c = chain(t);
  fs.writeFileSync(c.real, '{}\n');
  const hops = Array.from({ length: 41 }, (_, i) => path.join(c.dotfiles, `l${i}`));
  try {
    hops.forEach((hop, i) => fs.symlinkSync(i + 1 < hops.length ? hops[i + 1] : c.real, hop));
    fs.symlinkSync(hops[0], c.s.t_.settings);
  } catch (e) {
    return t.skip(`symlinks are not permitted here (${e.code})`);
  }
  const r = c.s.ensure();
  assert.equal(r.line, notRegistered('1.2.3', LOOP_REASON(c.s.t_.settings), HAND_TAIL));
  assert.equal(fs.readFileSync(c.real, 'utf8'), '{}\n');
});

test('2.22 a link whose target goes through a missing folder and then ".." is refused by hand and a decoy at the lexical place is untouched', t => {
  const c = chain(t);
  const decoy = path.join(c.s.claude, 'real.json');
  fs.writeFileSync(decoy, '{"decoy":true}\n');
  if (!symlinkOrSkip(t, 'missing/../real.json', c.s.t_.settings)) return;
  const r = c.s.ensure();
  assert.equal(r.line, notRegistered('1.2.3', `${c.s.t_.settings} is a link whose target goes through a folder that does not exist and then ".."`, HAND_TAIL));
  assert.equal(fs.readFileSync(decoy, 'utf8'), '{"decoy":true}\n');
});

test('2.23 a link re-pointed to another file with the same bytes between the resolve and the write is refused: neither file is written, no backup, and the next start registers the new one', t => {
  const c = chain(t);
  const a = path.join(c.dotfiles, 'a.json');
  const b = path.join(c.dotfiles, 'b.json');
  fs.writeFileSync(a, '{"model":"opus"}\n');
  fs.writeFileSync(b, '{"model":"opus"}\n');
  if (!symlinkOrSkip(t, a, c.s.t_.settings)) return;
  const r = c.s.ensure({ beforeWrite: () => { fs.rmSync(c.s.t_.settings); fs.symlinkSync(b, c.s.t_.settings); } });
  assert.equal(r.line, notRegistered('1.2.3', CHANGED, RETRY_TAIL));
  assert.equal(fs.readFileSync(a, 'utf8'), '{"model":"opus"}\n', 'the old target was not written');
  assert.equal(fs.readFileSync(b, 'utf8'), '{"model":"opus"}\n');
  assert.deepEqual(c.s.backups(c.dotfiles), []);
  assert.equal(c.s.ensure().action, 'registered');
  assert.deepEqual(json(b).env, { CLAUDE_CODE_PLUGIN_DIRS: c.s.t_.target });
  assert.equal(fs.readFileSync(a, 'utf8'), '{"model":"opus"}\n');
});

// ---------------------------------------------------------------------------------------------------------------------
// the registration: what cannot be written or read
// ---------------------------------------------------------------------------------------------------------------------

test('2.25 a folder that is not writable is refused by hand before anything is written, for a file to create and for an existing one', { skip: IS_ROOT || !POSIX }, t => {
  for (const existing of [false, true]) {
    const s = sandbox(t);
    s.seedTarget();
    if (existing) s.writeSettings({ model: 'x' });
    const before = s.readSettings();
    fs.chmodSync(s.claude, 0o555);
    try {
      const r = s.ensure();
      assert.equal(r.line, notRegistered('1.2.3', `${s.claude} is not writable (EACCES)`, HAND_TAIL), `existing: ${existing}`);
      assert.equal(s.readSettings(), before);
      assert.deepEqual(fs.readdirSync(s.claude).filter(name => name !== 'mods' && name !== 'settings.json'), []);
    } finally {
      fs.chmodSync(s.claude, 0o755);
    }
  }
});

test('2.26 settings.json that is a folder, a link to a folder, or unreadable: one refusal each by hand, nothing written, no backup', { skip: IS_ROOT || !POSIX }, t => {
  const dir = sandbox(t);
  dir.seedTarget();
  fs.mkdirSync(dir.t_.settings);
  assert.equal(dir.ensure().line, notRegistered('1.2.3', `${dir.t_.settings} could not be read (EISDIR)`, HAND_TAIL));
  assert.deepEqual(fs.readdirSync(dir.t_.settings), []);

  const link = sandbox(t);
  link.seedTarget();
  const folder = path.join(link.root, 'folder');
  fs.mkdirSync(folder);
  if (!symlinkOrSkip(t, folder, link.t_.settings)) return;
  assert.equal(link.ensure().line, notRegistered('1.2.3', `${link.t_.settings} could not be read (EISDIR)`, HAND_TAIL));
  assert.deepEqual(fs.readdirSync(folder), []);

  const locked = sandbox(t);
  locked.seedTarget();
  locked.writeSettings({ model: 'x' });
  fs.chmodSync(locked.t_.settings, 0o000);
  try {
    assert.equal(locked.ensure().line, notRegistered('1.2.3', `${locked.t_.settings} could not be read (EACCES)`, HAND_TAIL));
    assert.deepEqual(locked.backups(), []);
  } finally {
    fs.chmodSync(locked.t_.settings, 0o644);
  }
});

test('2.27 a creation whose write fails is a retry: three runs leave no file and no backup, and the next run creates the file', t => {
  const s = sandbox(t);
  s.seedTarget();
  const blocker = `${s.t_.settings}.tmp-${process.pid}`;
  fs.mkdirSync(blocker);
  for (let run = 0; run < 3; run += 1) {
    const r = s.ensure();
    assert.match(r.line, /could not be written \(\w+\)/);
    assert.ok(r.line.endsWith(RETRY_TAIL), r.line);
  }
  assert.equal(fs.existsSync(s.t_.settings), false);
  assert.deepEqual(s.backups(), []);
  fs.rmdirSync(blocker);
  assert.equal(s.ensure().action, 'registered');
});

test('2.27b a folder that takes the settings name in the gap is a refusal, never a throw or an empty file: the folder is untouched, and the next start says it cannot read it', { skip: !POSIX }, t => {
  const s = sandbox(t);
  s.seedTarget();
  let calls = 0;
  const r = withLinkSync(real => (from, to) => { calls += 1; fs.mkdirSync(to); return real(from, to); }, () => s.ensure());
  assert.equal(calls, 1);
  assert.equal(r.action, 'refused');
  assert.ok(r.line.startsWith(notRegistered('1.2.3', `${s.t_.settings} could not be written (`, '')), r.line);
  assert.match(r.line, /could not be written \(\w+\)/);
  assert.ok(r.line.endsWith(RETRY_TAIL), r.line);
  assert.equal(fs.statSync(s.t_.settings).isDirectory(), true);
  assert.deepEqual(fs.readdirSync(s.t_.settings), []);
  assert.deepEqual(tmpFiles(s.claude), []);
  const again = s.ensure();
  assert.equal(again.line, notRegistered('1.2.3', `${s.t_.settings} could not be read (EISDIR)`, HAND_TAIL));
});
