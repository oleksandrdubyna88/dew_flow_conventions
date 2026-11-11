/**
 * The agent-models installer's said-once lines (`settings/hooks/lib/agent-models-install.mjs`, `saidOnce`): an edited copy, a
 * newer copy and a symlinked target are told once per target state and per repository version, every refusal is told once per
 * line, `other-checkout` is silent, the record (`agent-models.reported.json`) is forgotten by an install, and it stays one
 * file of one `{ key, at }`. Temporary homes only (`ownedDir` through the shared fixtures), never the real ~/.claude.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  IS_ROOT, EMPTY_REC, HAND_TAIL, registeredLine, writeTree, snapshot, sandbox, symlinkOrSkip, editedLine, newerLine,
  symlinkLine, fixtureReleased, notInstalled, notRegistered, renameSeam, failing, escaped,
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


/** What a refused outcome says on a repeat: the action stays, the line is empty and the outcome is flagged. */
const silentRepeat = r => [r.action, r.line, r.repeated];

test('3.17: a refusal of the source is told once: the second run is silent, and the mods folder holds only the reported record', t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  fs.writeFileSync(s.sourceFile('.claude-plugin/plugin.json'), '{');
  const first = s.ensure();
  assert.equal(first.action, 'refused');
  assert.ok(first.line.startsWith(notInstalled(`source plugin.json ${s.sourceFile('.claude-plugin/plugin.json')} does not parse`)), first.line);
  assert.deepEqual(silentRepeat(s.ensure()), ['refused', '', true]);
  assert.deepEqual(s.listMods(), ['agent-models.reported.json']);
});

test('3.17: a refusal of the registration is told once, and the fix of settings.json is told as a registration', t => {
  const s = sandbox(t);
  s.writeSettings({ env: [] });
  const first = s.ensure();
  assert.equal(first.line, notRegistered('1.2.3', `${s.t_.settings}: env is not an object`, HAND_TAIL));
  assert.deepEqual(silentRepeat(s.ensure()), ['refused', '', true]);
  s.writeSettings({});
  const fixed = s.ensure();
  assert.deepEqual([fixed.action, fixed.line], ['registered', registeredLine]);
});

test('3.17: a refusal of the swap is told once although its leftover names carry a random part', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0' });
  const refuse = () => s.ensure({ rename: renameSeam(n => { if (n === 1) throw failing('EPERM'); }).seam });
  const first = refuse();
  assert.equal(first.action, 'refused');
  assert.match(first.line, new RegExp(`^${escaped(notInstalled(`could not rename ${s.t_.target} aside to `))}.*\\(EPERM\\)$`));
  assert.deepEqual(silentRepeat(refuse()), ['refused', '', true]);
});

test('3.18: the reported file never grows: after refusals, an edited copy and a newer copy it is one file of exactly { key, at }, under 1 KB', t => {
  const s = sandbox(t);
  const shape = label => {
    const names = s.listMods().filter(name => name.endsWith('.reported.json'));
    assert.deepEqual(names, ['agent-models.reported.json'], label);
    const bytes = fs.readFileSync(s.t_.reported);
    assert.ok(bytes.length < 1024, `${label}: ${bytes.length} bytes`);
    assert.deepEqual(Object.keys(JSON.parse(bytes)).sort(), ['at', 'key'], label);
  };
  s.writeSettings({ env: [] });
  s.ensure();
  s.ensure();
  shape('after a refused registration');
  s.writeSettings({});
  s.ensure();
  fs.appendFileSync(path.join(s.t_.target, 'types', 'index.d.ts'), '// mine\n');
  s.ensure();
  s.ensure();
  shape('after an edited copy');
  fs.rmSync(s.t_.target, { recursive: true });
  s.seedTarget({ version: '2.0.0' });
  s.ensure();
  s.ensure();
  shape('after a newer copy');
  fs.writeFileSync(s.sourceFile('.claude-plugin/plugin.json'), '{');
  s.ensure();
  s.ensure();
  shape('after a refused source');
});
