/**
 * The version pin of the agent-models mod (`tools/lib/agent-models-pin.mjs`, rows in `tools/agent-models-pins.json`): a
 * change to one of the mod's installed files (`MOD_FILES`) must come with a new `plugin.json` version, because the session self-install
 * upgrades by version alone — a changed file under an unchanged version would reach nobody.
 *
 * `1l` checks the LIVE folder `mods/agent-models` against the committed rows. It is red whenever the mod changed and its row
 * was not added: after a version bump, add the row with `node tools/lib/agent-models-pin.mjs --print`.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import * as decide from '../settings/hooks/lib/agent-models-decide.mjs';
import { readSource } from '../settings/hooks/lib/agent-models-read.mjs';
import { PINS, checkPin, printRow } from './lib/agent-models-pin.mjs';
import { fixtureBytes, fixtureReleased, sha, writeTree } from './lib/agent-models-fixtures.mjs';
import { ownedDir } from './lib/owned.mjs';

const { MOD_FILES } = decide;
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = path.join(REPO, 'mods', 'agent-models');
const PIN_FILE = path.join(REPO, 'tools', 'lib', 'agent-models-pin.mjs');
const PLUGIN_JSON = '.claude-plugin/plugin.json';

/** A temporary mod at 1.0.0 and the pin table that vouches for exactly its bytes. */
function pinned(t) {
  const dir = path.join(ownedDir(t, 'agent-models-pin'), 'mod');
  writeTree(dir, '1.0.0');
  const pins = { '1.0.0': Object.fromEntries(MOD_FILES.map(rel => [rel, sha(fixtureBytes(rel, '1.0.0'))])) };
  return { dir, pins };
}

test('1k: an unchanged mod is ok', t => {
  const { dir, pins } = pinned(t);
  assert.deepEqual(checkPin(dir, pins), { ok: true });
});

test('1k: one byte appended to hooks/prompts.ts is a problem naming that file and saying to bump the version', t => {
  const { dir, pins } = pinned(t);
  fs.appendFileSync(path.join(dir, 'hooks', 'prompts.ts'), '\n');
  assert.deepEqual(checkPin(dir, pins), {
    problem: 'mods/agent-models/hooks/prompts.ts changed but plugin.json still says 1.0.0 — bump the version in mods/agent-models/.claude-plugin/plugin.json and add its row',
  });
});

test('1k: a version with no row is a problem naming the command that prints the row', t => {
  const { dir, pins } = pinned(t);
  fs.writeFileSync(path.join(dir, PLUGIN_JSON), fixtureBytes(PLUGIN_JSON, '1.1.0'));
  assert.deepEqual(checkPin(dir, pins), {
    problem: 'version 1.1.0 of mods/agent-models has no row in tools/agent-models-pins.json — add it with node tools/lib/agent-models-pin.mjs --print',
  });
});

test('1k: a missing file counts as changed, and an unreadable plugin.json is a problem too', t => {
  const { dir, pins } = pinned(t);
  fs.rmSync(path.join(dir, 'types', 'index.d.ts'));
  assert.match(checkPin(dir, pins).problem, /^mods\/agent-models\/types\/index\.d\.ts changed but plugin\.json still says 1\.0\.0/);
  fs.writeFileSync(path.join(dir, PLUGIN_JSON), '{ nope');
  assert.match(checkPin(dir, pins).problem, /plugin\.json/);
});

test('--print prints the row of the folder it is given as JSON, and the live folder through the CLI', t => {
  const { dir, pins } = pinned(t);
  assert.deepEqual(printRow(dir), { '1.0.0': Object.fromEntries(filesOf('1.0.0').map(rel => [rel, pins['1.0.0'][rel]])) });
  const out = spawnSync(process.execPath, [PIN_FILE, '--print'], { encoding: 'utf8' });
  assert.equal(out.status, 0, out.stderr);
  assert.deepEqual(JSON.parse(out.stdout), printRow(LIVE));
});

test('--print of a 1.2.x folder prints the five files that release held, not the two introduced later', t => {
  const dir = path.join(ownedDir(t, 'agent-models-pin-old'), 'mod');
  writeTree(dir, '1.2.1');
  const row = printRow(dir)['1.2.1'];
  assert.equal(Object.keys(row).length, 5);
  assert.deepEqual(Object.keys(row), MOD_FILES.filter(rel => decide.INTRODUCED[rel] === undefined));
  assert.equal(Object.hasOwn(row, 'hooks/tasks.tsx'), false);
  assert.equal(Object.hasOwn(row, 'hooks/limits.tsx'), false);
});

/** The files a release of `version` holds: MOD_FILES minus those introduced after it (derived, never retyped). */
const filesOf = version => MOD_FILES.filter(rel => {
  const introduced = decide.INTRODUCED[rel];
  return introduced === undefined || decide.compareVersions(decide.parseVersion(version), introduced) >= 0;
});

test('I7: the committed table: every row is the files its release held, with a sha256 each; the first release and 1.3.0 are there', () => {
  assert.ok(Object.hasOwn(PINS, '1.0.0'), 'rows are only ever added');
  for (const [version, row] of Object.entries(PINS)) {
    assert.match(version, /^\d+\.\d+\.\d+$/);
    assert.deepEqual(Object.keys(row), filesOf(version), version);
    for (const hash of Object.values(row)) assert.match(hash, /^[0-9a-f]{64}$/);
  }
  assert.ok(Object.hasOwn(PINS, '1.3.0'), 'the release that introduced hooks/tasks.tsx has its row');
});

test('1l: the live folder mods/agent-models matches its committed row (red after a change until its row is added)', () => {
  assert.deepEqual(checkPin(LIVE, PINS), { ok: true });
});

/** The newest version of a pin table: the highest by `compareVersions`, never the last key. */
const newestVersion = pins => Object.keys(pins).map(decide.parseVersion).sort(decide.compareVersions).at(-1).join('.');

test('3.2 the newest row is the highest version by compareVersions, not the last key and not the highest by text', () => {
  const row = {};
  assert.equal(newestVersion({ '1.9.0': row, '1.10.0': row, '1.2.0': row }), '1.10.0');
});

test('3.3 RELEASED_MOD is the newest row of the committed pin table: its version, its seven digests, in MOD_FILES order', () => {
  assert.ok(decide.RELEASED_MOD, 'agent-models-decide.mjs exports RELEASED_MOD');
  const { RELEASED_MOD } = decide;
  assert.equal(RELEASED_MOD.version, newestVersion(PINS));
  assert.deepEqual({ ...RELEASED_MOD.sha256 }, PINS[RELEASED_MOD.version]);
  assert.deepEqual(Object.keys(RELEASED_MOD.sha256), [...MOD_FILES]);
});

test('3.4 RELEASED_MOD is frozen at both levels, and an assignment into its digests throws', () => {
  assert.ok(decide.RELEASED_MOD, 'agent-models-decide.mjs exports RELEASED_MOD');
  const { RELEASED_MOD } = decide;
  assert.equal(Object.isFrozen(RELEASED_MOD), true);
  assert.equal(Object.isFrozen(RELEASED_MOD.sha256), true);
  assert.throws(() => { RELEASED_MOD.sha256['hooks/hooks.json'] = '0'.repeat(64); }, TypeError);
});

test('3.5 the real road on the real folder: readSource of mods/agent-models with no identity holds exactly the released bytes, and ignores tests/, tsconfig.json and .gitignore', () => {
  assert.ok(decide.RELEASED_MOD, 'agent-models-decide.mjs exports RELEASED_MOD');
  const { RELEASED_MOD } = decide;
  for (const extra of ['tests', 'tsconfig.json', '.gitignore']) assert.ok(fs.existsSync(path.join(LIVE, extra)), `${extra} is in the live folder, so ignoring it is observed`);
  const read = readSource(LIVE);
  assert.equal(read.error, undefined);
  assert.deepEqual(read.version, decide.parseVersion(RELEASED_MOD.version));
  assert.deepEqual([...read.files.keys()], [...MOD_FILES]);
  for (const rel of MOD_FILES) assert.equal(sha(read.files.get(rel)), RELEASED_MOD.sha256[rel], rel);
});

test('3.6 the pure check: the fixture and its own identity pass; a missing file is named with sha256 none; a missing identity cannot be checked', t => {
  assert.ok(decide.releasedModRefusal, 'agent-models-decide.mjs exports releasedModRefusal');
  const dir = path.join(ownedDir(t, 'agent-models-pin-check'), 'mod');
  writeTree(dir, '1.2.3');
  const files = new Map(MOD_FILES.map(rel => [rel, fs.readFileSync(path.join(dir, rel))]));
  const released = fixtureReleased('1.2.3');
  assert.equal(decide.releasedModRefusal({ version: [1, 2, 3], files }, released), '');
  const lacking = new Map(files).set('hooks/tasks.tsx', null);
  assert.equal(
    decide.releasedModRefusal({ version: [1, 2, 3], files: lacking }, released),
    `is not the released mod 1.2.3: hooks/tasks.tsx differs (sha256 none, released ${released.sha256['hooks/tasks.tsx'].slice(0, 12)})`,
  );
  assert.equal(decide.releasedModRefusal({ version: [1, 2, 3], files }, undefined), 'cannot be checked: there is no valid released identity');
});

test('3.6b the pure check on a read with no version (null) answers a refusal and never throws', () => {
  let refusal;
  assert.doesNotThrow(() => { refusal = decide.releasedModRefusal({ version: null, files: new Map() }, fixtureReleased('1.2.3')); });
  assert.equal(typeof refusal, 'string');
  assert.notEqual(refusal, '');
});
