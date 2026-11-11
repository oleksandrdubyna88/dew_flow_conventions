/**
 * The agent-models installer's reads (`settings/hooks/lib/agent-models-read.mjs`), called directly: `readSource` reads the
 * source folder once, `readTarget` reads the target folder once and names what it found. Every tree is built by
 * `tools/lib/agent-models-fixtures.mjs` in a folder made by `ownedDir`; the installer itself (E2) is not needed.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import * as decide from '../settings/hooks/lib/agent-models-decide.mjs';
import { readSource, readTarget } from '../settings/hooks/lib/agent-models-read.mjs';
import { FILES, fixtureBytes, fixtureReleased, sandbox, sha, symlinkOrSkip, writeTree } from './lib/agent-models-fixtures.mjs';

test('readSource reads the seven files once and keeps the plugin.json bytes it parsed, and a read that passed holds only a version and files', t => {
  const s = sandbox(t);
  const read = readSource(s.source, { released: fixtureReleased('1.2.3') });
  assert.deepEqual(Object.keys(read), ['version', 'files']);
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

// ---------------------------------------------------------------------------------------------------------------------
// The released-copy check (E1.S3). A fixture tree is `sandbox(t).source` at 1.2.3; its identity is `fixtureReleased('1.2.3')`.
// A digest in an expected text is computed here from the bytes, never typed.
// ---------------------------------------------------------------------------------------------------------------------

const RELEASED = fixtureReleased('1.2.3');
/** Read through the namespace: a missing export is a failing test, not a file that cannot load. */
const releasedVersion = () => decide.RELEASED_MOD?.version;
const PLUGIN = '.claude-plugin/plugin.json';
const twelve = bytes => sha(bytes).slice(0, 12);
const refusal = (dir, version, detail) => ({ error: `source ${dir} is not the released mod ${version}: ${detail}`, unreleased: true });
const differs = (rel, held, released) => `${rel} differs (sha256 ${twelve(held)}, released ${released.sha256[rel].slice(0, 12)})`;
const crlf = bytes => Buffer.from(bytes.toString('latin1').replaceAll('\n', '\r\n'), 'latin1');
const rewrite = (s, rel, change) => {
  const bytes = change(fs.readFileSync(s.sourceFile(rel)));
  fs.writeFileSync(s.sourceFile(rel), bytes);
  return bytes;
};

test('3.8 readSource reads each of the seven files exactly once, in MOD_FILES order, never lists the folder, and returns the very Buffers it read', t => {
  const s = sandbox(t);
  const reads = t.mock.method(fs, 'readFileSync');
  const lists = t.mock.method(fs, 'readdirSync');
  const read = readSource(s.source, { released: RELEASED });
  const mine = reads.mock.calls.filter(call => String(call.arguments[0]).startsWith(s.source));
  assert.equal(read.error, undefined);
  assert.equal(mine.length, FILES.length, 'seven reads under the source: a spy that saw nothing fails here');
  assert.deepEqual(mine.map(call => call.arguments[0]), FILES.map(rel => s.sourceFile(rel)));
  mine.forEach((call, i) => assert.strictEqual(read.files.get(FILES[i]), call.result, FILES[i]));
  assert.equal(lists.mock.callCount(), 0);
});

test('3.9 extra files in the source folder are never read and do not refuse the release', t => {
  const s = sandbox(t);
  for (const rel of ['tests/a.test.tsx', 'tsconfig.json', '.gitignore', 'README.md', '.claude-plugin/types/x.d.ts']) {
    fs.mkdirSync(path.dirname(s.sourceFile(rel)), { recursive: true });
    fs.writeFileSync(s.sourceFile(rel), `extra ${rel}\n`);
  }
  const read = readSource(s.source, { released: RELEASED });
  assert.equal(read.error, undefined);
  assert.deepEqual([...read.files.keys()], FILES);
});

test('3.10 with no identity the real one is used: the fixture tree is refused as another version and carries no bytes', t => {
  const s = sandbox(t);
  const read = readSource(s.source);
  assert.deepEqual(read, refusal(s.source, releasedVersion(), `${PLUGIN} is version 1.2.3, released ${releasedVersion()}`));
  assert.deepEqual(Object.keys(read).sort(), ['error', 'unreleased']);
});

test('3.11 one byte appended to hooks/prompts.ts is refused naming that file with the 12 hex of both digests', t => {
  const s = sandbox(t);
  const held = rewrite(s, 'hooks/prompts.ts', bytes => Buffer.concat([bytes, Buffer.from('\n')]));
  assert.deepEqual(readSource(s.source, { released: RELEASED }), refusal(s.source, '1.2.3', differs('hooks/prompts.ts', held, RELEASED)));
});

test('3.12 two files that differ are named by the earlier one in MOD_FILES order', t => {
  const s = sandbox(t);
  rewrite(s, 'types/index.d.ts', bytes => Buffer.concat([bytes, Buffer.from('//\n')]));
  const held = rewrite(s, 'hooks/register.tsx', bytes => Buffer.concat([bytes, Buffer.from('//\n')]));
  assert.deepEqual(readSource(s.source, { released: RELEASED }), refusal(s.source, '1.2.3', differs('hooks/register.tsx', held, RELEASED)));
});

test('3.13 another version in plugin.json is named by both versions; the same version with other bytes is named by digests', t => {
  const s = sandbox(t);
  rewrite(s, PLUGIN, () => fixtureBytes(PLUGIN, '1.2.4'));
  assert.deepEqual(readSource(s.source, { released: RELEASED }), refusal(s.source, '1.2.3', `${PLUGIN} is version 1.2.4, released 1.2.3`));
  const held = rewrite(s, PLUGIN, () => Buffer.from(`${JSON.stringify({ name: 'agent-models', version: '1.2.3', description: 'x' })}\n`));
  assert.deepEqual(readSource(s.source, { released: RELEASED }), refusal(s.source, '1.2.3', differs(PLUGIN, held, RELEASED)));
});

test('3.14 an identity of another version refuses a tree whose digests all match, naming both versions', t => {
  const s = sandbox(t);
  const released = { ...RELEASED, version: '1.2.4' };
  assert.deepEqual(readSource(s.source, { released }), refusal(s.source, '1.2.4', `${PLUGIN} is version 1.2.3, released 1.2.4`));
});

test('3.15 CRLF is not folded: a tree with every line end changed is refused at plugin.json, one file at hooks/prompts.ts', t => {
  const s = sandbox(t);
  const held = Object.fromEntries(FILES.map(rel => [rel, rewrite(s, rel, crlf)]));
  assert.deepEqual(readSource(s.source, { released: RELEASED }), refusal(s.source, '1.2.3', differs(PLUGIN, held[PLUGIN], RELEASED)));
  const only = sandbox(t);
  const prompts = rewrite(only, 'hooks/prompts.ts', crlf);
  assert.deepEqual(readSource(only.source, { released: RELEASED }), refusal(only.source, '1.2.3', differs('hooks/prompts.ts', prompts, RELEASED)));
});

test('3.16 a byte order mark before plugin.json still parses to its version, and the digest refuses it', t => {
  const s = sandbox(t);
  const held = rewrite(s, PLUGIN, bytes => Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), bytes]));
  assert.deepEqual(readSource(s.source, { released: RELEASED }), refusal(s.source, '1.2.3', differs(PLUGIN, held, RELEASED)));
});

test('3.17 a missing file is the read error before the check, and is not marked unreleased, even for a version older than the file introduced', t => {
  const s = sandbox(t);
  fs.rmSync(s.sourceFile('hooks/limits.tsx'));
  assert.deepEqual(readSource(s.source, { released: RELEASED }), { error: `source file ${s.sourceFile('hooks/limits.tsx')} is missing` });
});

test('3.18a a MOD_FILES entry that is a link is refused as not a regular file, though its bytes are the released ones', t => {
  const s = sandbox(t);
  const real = path.join(s.root, 'real-index.d.ts');
  fs.writeFileSync(real, fixtureBytes('types/index.d.ts', '1.2.3'));
  fs.rmSync(s.sourceFile('types/index.d.ts'));
  if (!symlinkOrSkip(t, real, s.sourceFile('types/index.d.ts'))) return;
  assert.deepEqual(readSource(s.source, { released: RELEASED }), { error: `source file ${s.sourceFile('types/index.d.ts')} is not a regular file` });
});

test('3.18b a linked folder on the way is read, because the held bytes are the measure; one changed byte behind the link is refused naming the file', t => {
  const s = sandbox(t);
  const real = path.join(s.root, 'real-hooks');
  fs.renameSync(s.sourceFile('hooks'), real);
  if (!symlinkOrSkip(t, real, s.sourceFile('hooks'))) return;
  assert.equal(readSource(s.source, { released: RELEASED }).error, undefined);
  const held = Buffer.concat([fs.readFileSync(path.join(real, 'tasks.tsx')), Buffer.from('\n')]);
  fs.writeFileSync(path.join(real, 'tasks.tsx'), held);
  assert.deepEqual(readSource(s.source, { released: RELEASED }), refusal(s.source, '1.2.3', differs('hooks/tasks.tsx', held, RELEASED)));
});

test('3.18c a linked source root is read, because the held bytes are the measure', t => {
  const s = sandbox(t);
  const real = path.join(s.root, 'real-source');
  fs.renameSync(s.source, real);
  if (!symlinkOrSkip(t, real, s.source)) return;
  const read = readSource(s.source, { released: RELEASED });
  assert.equal(read.error, undefined);
  assert.deepEqual([...read.files.keys()], FILES);
});

test('3.19 an identity that is missing or malformed refuses, it never passes: null, one digest deleted, one digest of 63 hex digits', t => {
  const s = sandbox(t);
  const without = { ...RELEASED, sha256: { ...RELEASED.sha256 } };
  delete without.sha256['hooks/hooks.json'];
  const short = { ...RELEASED, sha256: { ...RELEASED.sha256, 'hooks/hooks.json': RELEASED.sha256['hooks/hooks.json'].slice(1) } };
  for (const released of [null, without, short]) {
    assert.deepEqual(readSource(s.source, { released }), { error: `source ${s.source} cannot be checked: there is no valid released identity`, unreleased: true });
  }
});

test('3.20 the target is never checked against the released identity: seeded bytes that RELEASED_MOD does not name are read as they are', t => {
  const s = sandbox(t);
  const files = s.seedTarget({ version: '1.2.3' });
  const read = readTarget(s.t_);
  assert.equal(read.kind, 'dir');
  assert.deepEqual(read.files.get('hooks/hooks.json'), files['hooks/hooks.json']);
});

test('3.20 companion: the seeded target bytes really are bytes that RELEASED_MOD does not name, so the test above would notice a check on the target', t => {
  assert.ok(decide.RELEASED_MOD, 'agent-models-decide.mjs exports RELEASED_MOD');
  const files = sandbox(t).seedTarget({ version: '1.2.3' });
  for (const rel of FILES) assert.notEqual(sha(files[rel]), decide.RELEASED_MOD.sha256[rel], `${rel}: the seeded bytes are not the released ones`);
});
