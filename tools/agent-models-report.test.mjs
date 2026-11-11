/**
 * The agent-models installer's said-once lines (`settings/hooks/lib/agent-models-install.mjs`, `saidOnce`): an edited copy, a
 * newer copy and a symlinked target are told once per target state and per repository version, `other-checkout` is silent, and
 * the record (`agent-models.reported.json`) is forgotten by an install. Temporary homes only (`ownedDir` through the shared
 * fixtures), never the real ~/.claude.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  IS_ROOT, EMPTY_REC, registeredLine, writeTree, snapshot, sandbox, symlinkOrSkip, editedLine, newerLine,
  symlinkLine, fixtureReleased,
} from './lib/agent-models-fixtures.mjs';

test('1a: an equal copy that differs from the source but matches its OWN manifest (another checkout installed it) is silent and not "edited"', t => {
  const s = sandbox(t);
  s.writeSettings({});
  s.seedTarget({ overrides: { 'hooks/prompts.ts': Buffer.from('// the other checkout at the same version\n') } });
  const before = snapshot(s.t_.mods);
  const r = s.ensure();
  assert.deepEqual(r, { action: 'registered', line: registeredLine, copy: 'other-checkout', registration: 'append', reconcile: EMPTY_REC });
  assert.deepEqual(snapshot(s.t_.mods), before, 'target and manifest byte-identical, no reported file');
  assert.equal(s.reported(), null);
});

test('1b: as 1a with the path already registered: nothing changes anywhere under the home', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ overrides: { 'hooks/prompts.ts': Buffer.from('// the other checkout at the same version\n') } });
  const before = snapshot(s.home);
  assert.deepEqual(s.ensure(), { action: 'none', line: '', copy: 'other-checkout', registration: 'none', reconcile: EMPTY_REC });
  assert.deepEqual(snapshot(s.home), before);
});

/** An installed, registered copy whose `types/index.d.ts` was then edited by hand (the manifest is stale). */
function editedSandbox(t) {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget();
  fs.appendFileSync(path.join(s.t_.target, 'types', 'index.d.ts'), '// mine\n');
  return s;
}

test('1c: an edited copy is said on the first run only: the second keeps the action, prints nothing, flags repeated, and changes nothing', t => {
  const s = editedSandbox(t);
  const first = s.ensure();
  assert.deepEqual([first.action, first.line], ['edited', editedLine('1.2.3')]);
  const after = snapshot(s.home);
  const second = s.ensure();
  assert.deepEqual(second, { action: 'edited', line: '', copy: 'edited', registration: 'none', reconcile: EMPTY_REC, repeated: true });
  assert.deepEqual(snapshot(s.home), after, 'not even the reported file was rewritten');
});

test('1d: editing the copy AGAIN is new information: the third run speaks, the fourth is silent', t => {
  const s = editedSandbox(t);
  s.ensure();
  assert.equal(s.ensure().line, '');
  const key = s.reported().key;
  fs.appendFileSync(path.join(s.t_.target, 'types', 'index.d.ts'), '// and more\n');
  assert.equal(s.ensure().line, editedLine('1.2.3'));
  assert.notEqual(s.reported().key, key);
  assert.equal(s.ensure().line, '');
});

test('1e: a newer copy is said once per repository version: a source of another version speaks once more', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '2.0.0' });
  assert.equal(s.ensure().line, newerLine('2.0.0', '1.2.3'));
  const second = s.ensure();
  assert.deepEqual([second.action, second.line, second.repeated], ['newer', '', true]);
  writeTree(s.source, '1.1.0');
  assert.equal(s.ensure({ released: fixtureReleased('1.1.0') }).line, newerLine('2.0.0', '1.1.0'));
  assert.equal(s.ensure({ released: fixtureReleased('1.1.0') }).line, '');
});

test('1f: a symlinked target is refused once with the once-suffix, then silently; the link and what it points at are untouched', t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  const real = path.join(s.root, 'real-mod');
  writeTree(real, '1.0.0');
  fs.mkdirSync(s.t_.mods, { recursive: true });
  if (!symlinkOrSkip(t, real, s.t_.target)) return;
  const before = snapshot(real);
  const first = s.ensure();
  assert.deepEqual([first.action, first.line, first.copy], ['refused', symlinkLine(s.t_.target), 'refuse']);
  const second = s.ensure();
  assert.deepEqual([second.action, second.line, second.repeated], ['refused', '', true]);
  assert.equal(fs.readlinkSync(s.t_.target), real);
  assert.deepEqual(snapshot(real), before);
  assert.equal(s.reported().key, `symlink:${real}:1.2.3`);
});

test('1g: after an install the said-once record is gone, so a later edit of the new copy is said again', t => {
  const s = editedSandbox(t);
  assert.equal(s.ensure().line, editedLine('1.2.3'));
  assert.notEqual(s.reported(), null);
  fs.rmSync(s.t_.target, { recursive: true });
  fs.rmSync(s.t_.manifest);
  assert.equal(s.ensure().action, 'installed');
  assert.equal(s.reported(), null, 'an install forgets what was said about the old copy');
  fs.appendFileSync(path.join(s.t_.target, 'types', 'index.d.ts'), '// mine\n'); // the very same edit as before
  assert.equal(s.ensure().line, editedLine('1.2.3'));
});

test('1h: a reported file that cannot be written is tolerated: the line repeats each run, nothing throws, no temp file is left', t => {
  if (IS_ROOT || process.platform === 'win32') return t.skip('permissions do not bind root / Windows');
  const s = editedSandbox(t);
  fs.chmodSync(s.t_.mods, 0o555);
  try {
    for (let run = 0; run < 3; run += 1) {
      const r = s.ensure();
      assert.equal(r.line, editedLine('1.2.3'), `run ${run}`);
      assert.equal(r.repeated, undefined);
    }
    assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json']);
  } finally {
    fs.chmodSync(s.t_.mods, 0o755);
  }
});

