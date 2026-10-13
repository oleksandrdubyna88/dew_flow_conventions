import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ensureUserGuard } from '../settings/hooks/ensure-user-guard.mjs';
import { drift, findEntries, install, mergeEntry, removeEntry, targets } from '../settings/hooks/lib/user-guard-install.mjs';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'install-user-hook.mjs');

/** A fresh home plus a fixture source hook; removed when the test ends. Never os.homedir(). */
function sandbox(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'install-user-hook-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const home = path.join(root, 'home');
  fs.mkdirSync(home);
  const source = path.join(root, 'subagent-model.mjs');
  fs.writeFileSync(source, '// fixture hook\nprocess.exit(0);\n');
  const t_ = targets(home);
  const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args, '--home', home, '--source', source], { encoding: 'utf8' });
  const writeSettings = value => {
    fs.mkdirSync(t_.dir, { recursive: true });
    fs.writeFileSync(t_.settings, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
  };
  const readSettings = () => fs.readFileSync(t_.settings, 'utf8');
  const backups = () => (fs.existsSync(t_.dir) ? fs.readdirSync(t_.dir).filter(f => f.includes('.bak-subagent-model-')) : []);
  return { home, source, paths: t_, run, writeSettings, readSettings, backups };
}

const ours = hook => ({ matcher: 'Agent|Task', hooks: [{ type: 'command', command: 'node', args: [hook] }] });
const bash = { matcher: 'Bash', hooks: [{ type: 'command', command: 'node', args: ['/x/build-flags.mjs'] }] };

test('a fresh install creates settings.json with exactly our entry and copies the hook', t => {
  const s = sandbox(t);
  const r = s.run('--install');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(s.readSettings()), { hooks: { PreToolUse: [ours(s.paths.hook)] } });
  assert.equal(fs.readFileSync(s.paths.hook, 'utf8'), fs.readFileSync(s.source, 'utf8'));
});

test('installing twice leaves settings.json byte-identical', t => {
  const s = sandbox(t);
  s.run();
  const first = fs.readFileSync(s.paths.settings);
  assert.equal(s.run().status, 0);
  assert.ok(fs.readFileSync(s.paths.settings).equals(first));
});

test('a second install is a true no-op: no new backup, hook file untouched', t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  s.run();
  const old = new Date('2020-01-01T00:00:00Z');
  fs.utimesSync(s.paths.hook, old, old);
  const backupsBefore = s.backups();
  const r = s.run();
  assert.equal(r.status, 0);
  assert.match(r.stderr, /already installed/);
  assert.deepEqual(s.backups(), backupsBefore);
  assert.equal(fs.statSync(s.paths.hook).mtimeMs, old.getTime());
});

test('an existing entry of ours with another matcher is replaced in place, never twinned', t => {
  const s = sandbox(t);
  s.writeSettings({ hooks: { PreToolUse: [bash, { ...ours(s.paths.hook), matcher: 'Task' }, bash] } });
  assert.equal(s.run().status, 0);
  const list = JSON.parse(s.readSettings()).hooks.PreToolUse;
  assert.deepEqual(list, [bash, ours(s.paths.hook), bash]);
});

test('unrelated PreToolUse entries and top-level keys survive in value and order', t => {
  const s = sandbox(t);
  const original = { permissions: { allow: ['Bash(ls)'] }, model: 'opus', hooks: { PreToolUse: [bash], Stop: [{ hooks: [] }] }, env: { A: '1' } };
  s.writeSettings(original);
  assert.equal(s.run().status, 0);
  const after = JSON.parse(s.readSettings());
  assert.deepEqual(Object.keys(after), ['permissions', 'model', 'hooks', 'env']);
  assert.deepEqual(Object.keys(after.hooks), ['PreToolUse', 'Stop']);
  assert.deepEqual(after.permissions, original.permissions);
  assert.deepEqual(after.env, original.env);
  assert.deepEqual(after.hooks.PreToolUse, [bash, ours(s.paths.hook)]);
});

test('an unparsable settings.json is refused with exit 1, left byte-identical, and the hook is not copied', t => {
  const s = sandbox(t);
  s.writeSettings('{ "hooks": ');
  const before = fs.readFileSync(s.paths.settings);
  const r = s.run('--install');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /nothing changed/);
  assert.ok(fs.readFileSync(s.paths.settings).equals(before));
  assert.equal(fs.existsSync(s.paths.hook), false);
  assert.deepEqual(s.backups(), []);
});

test('a settings.json that is valid JSON but not an object is refused too', t => {
  const s = sandbox(t);
  s.writeSettings('[]\n');
  assert.equal(s.run().status, 1);
  assert.equal(fs.existsSync(s.paths.hook), false);
});

test('settings changed between read and write are refused and the concurrent edit survives', t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  const concurrent = '{"model":"sonnet"}\n';
  const r = install({ home: s.home, source: s.source, beforeWrite: () => fs.writeFileSync(s.paths.settings, concurrent) });
  assert.equal(r.code, 1);
  assert.match(r.lines.at(-1), /changed while installing/);
  assert.equal(s.readSettings(), concurrent);
});

test('a backup carries the original bytes when settings existed, and none is made when it did not', t => {
  const withFile = sandbox(t);
  const original = '{\n  "model": "opus"\n}\n';
  withFile.writeSettings(original);
  withFile.run();
  const [name] = withFile.backups();
  assert.match(name, /^settings\.json\.bak-subagent-model-\d{8}T\d{6}Z/);
  assert.equal(fs.readFileSync(path.join(withFile.paths.dir, name), 'utf8'), original);

  const without = sandbox(t);
  without.run();
  assert.deepEqual(without.backups(), []);
});

test('uninstall after install restores the original bytes and deletes the hook file', t => {
  const s = sandbox(t);
  const original = `${JSON.stringify({ permissions: { allow: ['Bash(ls)'] }, hooks: { PreToolUse: [bash] }, env: { A: '1' } }, null, 2)}\n`;
  s.writeSettings(original);
  s.run('--install');
  assert.notEqual(s.readSettings(), original);
  const r = s.run('--uninstall');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(s.readSettings(), original);
  assert.equal(fs.existsSync(s.paths.hook), false);
  assert.equal(s.backups().length, 2, 'install and uninstall each take a backup');
});

test('uninstall from a settings file with no other hooks drops the emptied containers', t => {
  const s = sandbox(t);
  const original = '{\n  "model": "opus"\n}\n';
  s.writeSettings(original);
  s.run();
  s.run('--uninstall');
  assert.equal(s.readSettings(), original);
});

test('uninstall keeps an unrelated change made after install', t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  s.run();
  const edited = JSON.parse(s.readSettings());
  edited.env = { LATER: 'yes' };
  edited.hooks.PreToolUse.unshift(bash);
  s.writeSettings(edited);
  assert.equal(s.run('--uninstall').status, 0);
  assert.deepEqual(JSON.parse(s.readSettings()), { model: 'opus', hooks: { PreToolUse: [bash] }, env: { LATER: 'yes' } });
});

test('uninstalling when nothing of ours is present says so and exits 0', t => {
  const s = sandbox(t);
  const r = s.run('--uninstall');
  assert.equal(r.status, 0);
  assert.match(r.stderr, /not installed/);
});

test('--check is clean after install and lists each drift afterwards', t => {
  const s = sandbox(t);
  s.run();
  assert.equal(s.run('--check').status, 0);

  fs.writeFileSync(s.paths.hook, '// tampered\n');
  let r = s.run('--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /differs from the source/);
  fs.copyFileSync(s.source, s.paths.hook);

  const doc = JSON.parse(s.readSettings());
  doc.hooks.PreToolUse.push(ours(s.paths.hook));
  s.writeSettings(doc);
  r = s.run('--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /2 PreToolUse entries/);

  doc.hooks.PreToolUse = [{ ...ours(s.paths.hook), matcher: 'Bash' }];
  s.writeSettings(doc);
  assert.match(s.run('--check').stderr, /matcher is "Bash"/);

  fs.rmSync(s.paths.hook);
  fs.rmSync(s.paths.settings);
  r = s.run('--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /hook file missing/);
  assert.match(r.stderr, /no PreToolUse entry/);
});

test('bad arguments exit 2 and change nothing', t => {
  const s = sandbox(t);
  for (const args of [['--bogus'], ['--install', '--uninstall'], ['--home'], ['--source', '--check']]) {
    const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
    assert.equal(r.status, 2, args.join(' '));
  }
  assert.equal(fs.existsSync(s.paths.dir), false);
});

test('the pure helpers never mutate their input', () => {
  const hook = path.resolve('/h/.claude/hooks/subagent-model.mjs');
  const input = { hooks: { PreToolUse: [bash] } };
  const frozen = structuredClone(input);
  const merged = mergeEntry(input, hook);
  assert.deepEqual(input, frozen);
  assert.equal(findEntries(merged, hook).length, 1);
  const removed = removeEntry(merged, hook);
  assert.deepEqual(removed, frozen);
  assert.deepEqual(drift(merged, hook, Buffer.from('a'), Buffer.from('a')), []);
});

test('--uninstall writes the opt-out marker, even when nothing was installed', t => {
  const s = sandbox(t);
  const r = s.run('--uninstall');
  assert.equal(r.status, 0, r.stderr);
  assert.match(fs.readFileSync(s.paths.optout, 'utf8'), /--install/);
  s.run('--install');
  s.run('--uninstall');
  assert.ok(fs.existsSync(s.paths.optout));
  assert.equal(fs.existsSync(s.paths.hook), false);
});

test('an explicit --install deletes the opt-out marker', t => {
  const s = sandbox(t);
  s.run('--uninstall');
  assert.ok(fs.existsSync(s.paths.optout));
  const r = s.run('--install');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.existsSync(s.paths.optout), false);
  assert.ok(fs.existsSync(s.paths.hook));
});

test('--install also withdraws the marker when the installation was already current', t => {
  const s = sandbox(t);
  s.run('--install');
  fs.writeFileSync(s.paths.optout, 'x\n');
  assert.equal(s.run('--install').status, 0);
  assert.equal(fs.existsSync(s.paths.optout), false);
});

test('install writes a provenance manifest; --check prints it and --uninstall removes it', t => {
  const s = sandbox(t);
  s.run('--install');
  const m = JSON.parse(fs.readFileSync(s.paths.manifest, 'utf8'));
  assert.equal(m.by, 'cli');
  assert.equal(m.source, s.source);
  const ok = s.run('--check');
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stderr, /provenance: /);
  s.run('--uninstall');
  assert.equal(fs.existsSync(s.paths.manifest), false);
});

test('--check reports drift when the installed bytes no longer match the manifest hash', t => {
  const s = sandbox(t);
  s.run('--install');
  fs.writeFileSync(s.paths.hook, 'tampered\n');
  const r = s.run('--check');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /sha256/);
});

test('installing over a NEWER guard is refused without --force and goes through with it', t => {
  const s = sandbox(t);
  fs.mkdirSync(path.dirname(s.paths.hook), { recursive: true });
  fs.writeFileSync(s.paths.hook, 'export const GUARD_VERSION = 9;\n');
  fs.writeFileSync(s.source, 'export const GUARD_VERSION = 3;\n');
  const refused = s.run('--install');
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /--force/);
  assert.match(fs.readFileSync(s.paths.hook, 'utf8'), /= 9;/);
  const forced = s.run('--install', '--force');
  assert.equal(forced.status, 0, forced.stderr);
  assert.match(fs.readFileSync(s.paths.hook, 'utf8'), /= 3;/);
});

const theirs = { type: 'command', command: 'node', args: ['/x/their-hook.mjs'] };

test('a group shared with another handler survives install, re-install and uninstall intact', t => {
  const s = sandbox(t);
  const shared = { matcher: 'Bash|Edit', hooks: [{ type: 'command', command: 'node', args: [s.paths.hook] }, theirs] };
  s.writeSettings({ hooks: { PreToolUse: [shared] } });
  assert.equal(s.run('--install').status, 0);
  const foreign = { matcher: 'Bash|Edit', hooks: [theirs] };
  const afterInstall = JSON.parse(s.readSettings()).hooks.PreToolUse;
  assert.deepEqual(afterInstall.filter(e => e.matcher === 'Bash|Edit'), [foreign]);
  assert.equal(findEntries(JSON.parse(s.readSettings()), s.paths.hook).length, 1);
  assert.equal(s.run('--install').status, 0);
  assert.deepEqual(JSON.parse(s.readSettings()).hooks.PreToolUse, afterInstall);
  assert.equal(s.run('--uninstall').status, 0);
  assert.deepEqual(JSON.parse(s.readSettings()).hooks.PreToolUse, [foreign]);
});

test('two duplicate groups of ours plus a foreign handler collapse to one handler of ours', t => {
  const s = sandbox(t);
  const mine = { type: 'command', command: 'node', args: [s.paths.hook] };
  s.writeSettings({ hooks: { PreToolUse: [{ matcher: 'Task', hooks: [mine] }, { matcher: 'Bash', hooks: [mine, theirs] }] } });
  assert.equal(s.run('--install').status, 0);
  const list = JSON.parse(s.readSettings()).hooks.PreToolUse;
  const handlers = list.flatMap(e => e.hooks);
  assert.equal(handlers.filter(h => h.args[0] === s.paths.hook).length, 1);
  assert.deepEqual(list.find(e => e.matcher === 'Bash'), { matcher: 'Bash', hooks: [theirs] });
});

test('a refused install does not leave the hook file or manifest behind', t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  const r = install({ home: s.home, source: s.source, beforeWrite: () => fs.writeFileSync(s.paths.settings, '{"model":"x"}\n') });
  assert.equal(r.code, 1);
  assert.equal(fs.existsSync(s.paths.hook), false);
  assert.equal(fs.existsSync(s.paths.manifest), false);
});

for (const [what, tamper] of [
  ['the matcher is changed to Bash', e => { e.matcher = 'Bash'; }],
  ['the command is changed to nodejs', e => { e.hooks[0].command = 'nodejs'; }],
]) {
  test(`ensureUserGuard repairs an installation where ${what}, leaving one valid registration`, t => {
    const s = sandbox(t);
    assert.equal(s.run('--install').status, 0);
    const doc = JSON.parse(s.readSettings());
    tamper(doc.hooks.PreToolUse[0]);
    s.writeSettings(doc);
    assert.equal(s.run('--check').status, 1);
    const r = ensureUserGuard({ home: s.home, source: s.source, env: {} });
    assert.match(r.action, /^(installed|upgraded)$/);
    assert.match(r.line, /installed|upgraded/);
    const after = JSON.parse(s.readSettings());
    assert.deepEqual(after.hooks.PreToolUse, [ours(s.paths.hook)]);
    assert.equal(s.run('--check').status, 0);
  });
}
