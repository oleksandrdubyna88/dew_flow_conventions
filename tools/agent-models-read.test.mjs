/**
 * The agent-models installer's reads (`settings/hooks/lib/agent-models-read.mjs`), called directly: `readSource` reads the
 * source folder once, `readTarget` reads the target folder once and names what it found. Every tree is built by
 * `tools/lib/agent-models-fixtures.mjs` in a folder made by `ownedDir`; the installer itself (E2) is not needed.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { readSource, readTarget } from '../settings/hooks/lib/agent-models-read.mjs';
import { FILES, sandbox, symlinkOrSkip, writeTree } from './lib/agent-models-fixtures.mjs';

test('readSource reads the seven files once and keeps the plugin.json bytes it parsed', t => {
  const s = sandbox(t);
  const read = readSource(s.source);
  assert.deepEqual(read.version, [1, 2, 3]);
  assert.deepEqual([...read.files.keys()], FILES);
  assert.deepEqual(read.files.get('hooks/hooks.json'), fs.readFileSync(s.sourceFile('hooks/hooks.json')));
});

test('readSource of a path that is not there answers an error that says it is not a directory', t => {
  const s = sandbox(t);
  assert.match(readSource(path.join(s.root, 'nowhere')).error, /not a directory/);
});

test('readTarget of a missing target answers kind missing with its path, and of a seeded tree answers the files, the version and the manifest', t => {
  const s = sandbox(t);
  assert.deepEqual(readTarget(s.t_), { kind: 'missing', path: s.t_.target });
  const files = s.seedTarget({ version: '1.2.3' });
  const read = readTarget(s.t_);
  assert.equal(read.kind, 'dir');
  assert.deepEqual(read.version, [1, 2, 3]);
  assert.deepEqual(read.files.get('hooks/hooks.json'), files['hooks/hooks.json']);
  assert.equal(read.manifest.version, '1.2.3');
});

test('readTarget names a symlinked target as a symlink with its link text and never follows it', t => {
  const s = sandbox(t);
  const real = path.join(s.root, 'real-mod');
  writeTree(real, '1.0.0');
  fs.mkdirSync(s.t_.mods, { recursive: true });
  if (!symlinkOrSkip(t, real, s.t_.target)) return;
  assert.deepEqual(readTarget(s.t_), { kind: 'symlink', path: s.t_.target, link: real });
});

test('readTarget names a regular file in the target place as other', t => {
  const s = sandbox(t);
  fs.mkdirSync(s.t_.mods, { recursive: true });
  fs.writeFileSync(s.t_.target, 'a file');
  assert.deepEqual(readTarget(s.t_), { kind: 'other', path: s.t_.target });
});

test('readTarget names a target folder owned by another user as foreign with that uid, and reads none of its files (the uid is injectable)', t => {
  if (process.platform === 'win32' || process.getuid === undefined) return t.skip('no uid on this platform');
  const s = sandbox(t);
  s.seedTarget({ version: '1.2.3' });
  assert.deepEqual(readTarget(s.t_, { uid: () => 999999 }), { kind: 'foreign', path: s.t_.target, uid: process.getuid() });
});
