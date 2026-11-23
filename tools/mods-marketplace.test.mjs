/**
 * The registration step and the retirement of the old copy: `settings/hooks/lib/mods-marketplace.mjs`, run in process on a
 * temporary home (E3, story 3.1; the scenario ids R*, M*, U1, W1, X*, T1, A3, K1 are those of `todo/PLAN_dew_flow_mods_E3.md`).
 * The hook step, the spawned runs and the frozen old installer are in `tools/mods-marketplace-step.test.mjs`.
 *
 * Every home is made by `ownedDir` (see `tools/lib/mods-marketplace-fixtures.mjs`): never `os.homedir()`, never the real
 * ~/.claude or ~/.claude.json. The lib takes its home as an argument and never names the real one (a scan below holds that).
 * The clock is the `now` seam; no test reads the real one.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import * as lib from '../settings/hooks/lib/mods-marketplace.mjs';
import * as guard from '../settings/hooks/lib/user-guard-install.mjs';
import {
  EXTRAS, HOUR, NOW, OLD_FILES, at, names, sandbox, sha, snapshot, symlinkOrSkip,
} from './lib/mods-marketplace-fixtures.mjs';
import { PREFIX } from './lib/owned.mjs';

const {
  ANCHOR, INLINE_ID, LINES, MARKETPLACE, PLUGIN_ID, anchorEntry, decideRegistration, decideRemoval, decideRetirement, ensureModsMarketplace, paths,
  readMarker, readOldFolder, readProof, tombstoneBytes,
} = lib;

const LIB_FILE = fileURLToPath(new URL('../settings/hooks/lib/mods-marketplace.mjs', import.meta.url));
const LIB_TEXT = fs.readFileSync(LIB_FILE, 'utf8');
const GUARD_FILE = fileURLToPath(new URL('../settings/hooks/lib/user-guard-install.mjs', import.meta.url));
const posixOnly = t => {
  if (process.platform !== 'win32') return true;
  t.skip('POSIX modes, owners or links are needed');
  return false;
};
const asObject = text => JSON.parse(text);
const bytesOf = file => fs.readFileSync(file);
const tempFiles = h => names(h.home).filter(n => /\.tmp-\d+$/.test(n));
const stateOf = h => h.readState();
/** `none`/silent result: the action and no line. */
const silent = result => [result.action, result.line];

test('every test home is a fresh temporary folder that is not the real home', t => {
  const h = sandbox(t);
  assert.notEqual(path.resolve(h.home), path.resolve(os.homedir()));
  assert.ok(path.basename(h.root).startsWith(PREFIX), 'made by ownedDir');
  assert.equal(fs.existsSync(path.join(h.home, '.claude')), false);
});

// ---------------------------------------------------------------------------------------------------------------------
// K1: the trust anchor is typed once here, on purpose
// ---------------------------------------------------------------------------------------------------------------------

test('K1: the anchor, the marketplace and the plugin id are exactly the parent plan\'s section A text', () => {
  assert.equal(MARKETPLACE, 'dew-flow-mods');
  assert.equal(PLUGIN_ID, 'agent-models@dew-flow-mods');
  assert.equal(INLINE_ID, 'agent-models@inline');
  assert.deepEqual({ ...ANCHOR }, { source: 'git', url: 'https://github.com/oleksandrdubyna88/dew_flow_mods.git', ref: 'release' });
  assert.equal(Object.isFrozen(ANCHOR), true);
  assert.deepEqual(anchorEntry(), { source: { source: 'git', url: 'https://github.com/oleksandrdubyna88/dew_flow_mods.git', ref: 'release' }, autoUpdate: true });
  assert.notEqual(anchorEntry().source, anchorEntry().source, 'a builder: every entry is its own object');
  assert.equal(lib.STEP2_DELAY_MS, 24 * HOUR);
  assert.equal(lib.INSTALL_WAIT_MS, 72 * HOUR);
  assert.equal(lib.MAX_RECORD_BYTES, 1 << 20);
  assert.equal(lib.MAX_FOLDER_ENTRIES, 500);
});

test('paths: every path of the lib, spelled out independently; the plugins root follows CLAUDE_CODE_PLUGIN_CACHE_DIR only when it is a non-empty string', t => {
  const h = sandbox(t);
  const p = paths(h.home, {});
  const expected = {
    claude: h.claude, settings: h.settings, mods: h.mods, oldFolder: h.oldFolder, oldManifest: h.oldManifest, oldReported: h.oldReported, optout: h.optout,
    state: h.state, plugins: h.plugins, installed: h.installed, known: h.known, cacheRoot: h.cacheRoot,
  };
  assert.deepEqual(p, expected);
  assert.deepEqual(paths(h.home, { CLAUDE_CODE_PLUGIN_CACHE_DIR: '' }), expected);
  assert.deepEqual(paths(h.home, { CLAUDE_CODE_PLUGIN_CACHE_DIR: 7 }), expected);
  const other = path.join(h.root, 'elsewhere');
  const moved = paths(h.home, { CLAUDE_CODE_PLUGIN_CACHE_DIR: other });
  assert.equal(moved.plugins, other);
  assert.equal(moved.installed, path.join(other, 'installed_plugins.json'));
  assert.equal(moved.known, path.join(other, 'known_marketplaces.json'));
  assert.equal(moved.cacheRoot, path.join(other, 'cache', 'dew-flow-mods', 'agent-models'));
  assert.equal(moved.settings, h.settings, 'only the plugin records move');
});

test('tombstoneBytes is the one builder: a JSON object with the tombstone key, the time and a note', () => {
  const doc = asObject(String(tombstoneBytes(NOW)));
  assert.equal(doc.tombstone, 'dew-flow-mods');
  assert.equal(doc.at, NOW.toISOString());
  assert.equal(typeof doc.note, 'string');
  assert.ok(doc.note.length > 0);
  assert.ok(Buffer.byteLength(tombstoneBytes(NOW)) < 4096, 'under the 4 KB the reader accepts');
});

// ---------------------------------------------------------------------------------------------------------------------
// the pure decisions
// ---------------------------------------------------------------------------------------------------------------------

const parsed = settings => ({ settings });
const reg = () => ({ extraKnownMarketplaces: { [MARKETPLACE]: anchorEntry() }, enabledPlugins: { [PLUGIN_ID]: true } });

test('decideRegistration: the table, first match wins', () => {
  assert.equal(decideRegistration({ error: 'does not parse' }).action, 'refuse');
  for (const bad of [{ env: 'x' }, { env: [] }, { env: null }, { extraKnownMarketplaces: 'x' }, { enabledPlugins: [] }]) {
    assert.equal(decideRegistration(parsed(bad)).action, 'refuse', JSON.stringify(bad));
  }
  assert.equal(decideRegistration(parsed({ enabledPlugins: { [PLUGIN_ID]: false } })).action, 'off');
  assert.equal(decideRegistration(parsed({ enabledPlugins: { [PLUGIN_ID]: 'yes' } })).action, 'off', 'anything but true is the person\'s switch');
  assert.equal(decideRegistration(parsed({ enabledPlugins: { [PLUGIN_ID]: false }, extraKnownMarketplaces: { [MARKETPLACE]: {} } })).action, 'off', 'off before conflict');
  assert.equal(decideRegistration(parsed({ extraKnownMarketplaces: { [MARKETPLACE]: { source: { ...ANCHOR, ref: 'main' } } } })).action, 'conflict');
  assert.equal(decideRegistration(parsed({})).action, 'write');
  assert.equal(decideRegistration(parsed({ enabledPlugins: { [PLUGIN_ID]: true } })).action, 'write');
  assert.equal(decideRegistration(parsed({ extraKnownMarketplaces: { [MARKETPLACE]: anchorEntry() } })).action, 'write');
  assert.equal(decideRegistration(parsed(reg())).action, 'none');
  assert.equal(decideRegistration(parsed(reg())).autoUpdateOff, undefined);
});

test('decideRegistration: an entry equals the anchor only with exactly the keys source, url and ref and those values; other members of the entry do not matter', () => {
  const entryWith = source => parsed({ extraKnownMarketplaces: { [MARKETPLACE]: { source, autoUpdate: true } }, enabledPlugins: { [PLUGIN_ID]: true } });
  assert.equal(decideRegistration(entryWith({ ...ANCHOR })).action, 'none');
  for (const source of [{ ...ANCHOR, url: 'https://github.com/x/y.git' }, { ...ANCHOR, ref: 'main' }, { ...ANCHOR, path: 'plugins' }, { source: 'github', repo: 'a/b' }, 'git', null, { ...ANCHOR, source: 'github' }]) {
    assert.equal(decideRegistration(entryWith(source)).action, 'conflict', JSON.stringify(source));
  }
  const noSource = parsed({ extraKnownMarketplaces: { [MARKETPLACE]: 'x' }, enabledPlugins: { [PLUGIN_ID]: true } });
  assert.equal(decideRegistration(noSource).action, 'conflict');
  const extra = parsed({ extraKnownMarketplaces: { [MARKETPLACE]: { ...anchorEntry(), installLocation: '/x' } }, enabledPlugins: { [PLUGIN_ID]: true } });
  assert.equal(decideRegistration(extra).action, 'none');
});

test('decideRegistration: autoUpdateOff when autoUpdate is not true; the write keeps order and other members, appends new top-level keys last, and does not touch its input', () => {
  const off = decideRegistration(parsed({ extraKnownMarketplaces: { [MARKETPLACE]: { source: { ...ANCHOR }, autoUpdate: false } }, enabledPlugins: { [PLUGIN_ID]: true } }));
  assert.deepEqual([off.action, off.autoUpdateOff], ['none', true]);
  assert.equal(decideRegistration(parsed({ extraKnownMarketplaces: { [MARKETPLACE]: { source: { ...ANCHOR } } }, enabledPlugins: { [PLUGIN_ID]: true } })).autoUpdateOff, true);
  const input = { a: 1, enabledPlugins: { 'x@y': true }, z: { deep: [1] } };
  const before = structuredClone(input);
  const write = decideRegistration(parsed(input));
  assert.deepEqual(input, before, 'the parsed settings are not changed');
  assert.deepEqual(Object.keys(write.next), ['a', 'enabledPlugins', 'z', 'extraKnownMarketplaces']);
  assert.deepEqual(Object.keys(write.next.enabledPlugins), ['x@y', PLUGIN_ID]);
  assert.deepEqual(write.next.extraKnownMarketplaces, { [MARKETPLACE]: anchorEntry() });
  assert.deepEqual(write.next.z, { deep: [1] });
  const onlyPlugin = decideRegistration(parsed({ extraKnownMarketplaces: { [MARKETPLACE]: anchorEntry() } }));
  assert.deepEqual(onlyPlugin.next, reg(), 'only the absent key is written');
});

test('readMarker: absent, ours (a regular file up to 4 KB that parses to an object with the tombstone key) or the person\'s (everything else)', t => {
  if (!posixOnly(t)) return;
  const h = sandbox(t);
  fs.mkdirSync(h.mods, { recursive: true });
  const marker = path.join(h.mods, 'm');
  assert.equal(readMarker(marker), 'absent');
  const cases = [
    ['ours', String(tombstoneBytes(NOW))],
    ['ours', `${JSON.stringify({ tombstone: 'dew-flow-mods' })}`],
    ['person', ''],
    ['person', '{}'],
    ['person', '[]'],
    ['person', 'text'],
    ['person', JSON.stringify({ tombstone: 'other' })],
    ['person', JSON.stringify({ tombstone: 'dew-flow-mods', pad: 'x'.repeat(5000) })],
  ];
  for (const [want, text] of cases) {
    fs.writeFileSync(marker, text);
    assert.equal(readMarker(marker), want, text.slice(0, 40));
  }
  fs.rmSync(marker);
  fs.mkdirSync(marker);
  assert.equal(readMarker(marker), 'person', 'a folder');
  fs.rmdirSync(marker);
  const target = path.join(h.root, 'real');
  fs.writeFileSync(target, String(tombstoneBytes(NOW)));
  if (symlinkOrSkip(t, target, marker)) assert.equal(readMarker(marker), 'person', 'a link is the person\'s even when it points at a tombstone');
});

test('readProof (X4): the engine alone, as the fixture builds it, is whole; every M2 row below changes one thing in a fixture the code accepts', t => {
  const h = sandbox(t);
  h.reg();
  const installPath = h.engine('1.6.0');
  const proof = readProof(paths(h.home, {}), h.readSettings());
  assert.deepEqual({ whole: proof.whole, version: proof.version }, { whole: true, version: '1.6.0' });
  assert.equal(proof.installPath, installPath);
  h.plugin(PLUGIN_ID, false);
  assert.equal(readProof(paths(h.home, {}), h.readSettings()).whole, false, 'a plugin that is not true is no proof');
});

test('readOldFolder: missing, removable (every file is named by the record with its hash, or is one of the engine\'s own), and left with a reason for each way the folder is not what the record says', t => {
  if (!posixOnly(t)) return;
  const h = sandbox(t);
  const p = () => paths(h.home, {});
  const uid = process.getuid();
  assert.deepEqual(readOldFolder(p(), uid), { kind: 'missing' });
  h.old('1.4.0');
  assert.deepEqual(readOldFolder(p(), uid), { kind: 'removable' });
  fs.writeFileSync(path.join(h.oldFolder, 'notes.txt'), 'mine');
  const kept = readOldFolder(p(), uid);
  assert.equal(kept.kind, 'left', 'a file the record does not name and the engine did not make keeps the folder');
  assert.match(kept.reason, /notes\.txt/, 'the first unknown path is named');
  fs.rmSync(path.join(h.oldFolder, 'notes.txt'));
  assert.equal(readOldFolder(p(), uid).kind, 'removable', 'the engine\'s own files (tsconfig.json, .claude-plugin/types/**) are accounted for');
  const reason = (change, pattern) => {
    change();
    const found = readOldFolder(p(), uid);
    assert.equal(found.kind, 'left', pattern.source);
    assert.match(found.reason, pattern);
  };
  const fresh = () => { fs.rmSync(h.oldFolder, { recursive: true, force: true }); h.old('1.4.0'); };
  assert.equal(readOldFolder(p(), uid + 1).kind, 'left', 'another owner');
  assert.match(readOldFolder(p(), uid + 1).reason, /owner|uid|user/i);
  reason(() => fs.rmSync(h.oldManifest), /record/i);
  fresh(); reason(() => fs.writeFileSync(h.oldManifest, '{nope'), /record/i);
  fresh(); reason(() => fs.writeFileSync(h.oldManifest, JSON.stringify({ sha256: {} })), /record/i);
  fresh(); reason(() => fs.writeFileSync(h.oldManifest, JSON.stringify({ sha256: { '../x': sha('x') } })), /\.\./);
  fresh(); reason(() => fs.writeFileSync(path.join(h.oldFolder, OLD_FILES[2]), 'changed'), /changed|differ/i);
  fresh(); reason(() => fs.rmSync(path.join(h.oldFolder, OLD_FILES[2])), /missing/i);
  fresh(); reason(() => { if (!symlinkOrSkip(t, path.join(h.root, 'nowhere'), path.join(h.oldFolder, 'inner-link'))) throw new Error('no symlink'); }, /link/i);
  fresh(); reason(() => { for (let n = 0; n < 520; n += 1) fs.writeFileSync(path.join(h.oldFolder, `many-${n}`), 'x'); }, /entries|many/i);
  fs.rmSync(h.oldFolder, { recursive: true });
  fs.writeFileSync(h.oldFolder, 'a file');
  assert.match(readOldFolder(p(), uid).reason, /folder|directory/i);
  fs.rmSync(h.oldFolder);
  const elsewhere = path.join(h.root, 'target');
  fs.mkdirSync(elsewhere);
  fs.writeFileSync(path.join(elsewhere, 'f'), 'x');
  if (symlinkOrSkip(t, elsewhere, h.oldFolder)) assert.match(readOldFolder(p(), uid).reason, /link/i);
});

test('decideRetirement and decideRemoval: the table of the state machine as pure functions', () => {
  const proof = { whole: true, version: '1.6.0' };
  const base = { marker: 'absent', registration: { action: 'none' }, inline: undefined, proof };
  assert.equal(decideRetirement({ ...base, registration: { action: 'write' } }).action, 'stop', 'S0');
  assert.equal(decideRetirement({ ...base, proof: { whole: false } }).action, 'stop', 'S1');
  assert.equal(decideRetirement({ ...base, proof: { whole: false, say: 'x' } }).action, 'stop');
  for (const action of ['refuse', 'conflict', 'off']) assert.equal(decideRetirement({ ...base, registration: { action } }).action, 'stop', action);
  assert.equal(decideRetirement({ ...base, marker: 'person' }).action, 'stop');
  assert.equal(decideRetirement({ ...base, inline: true }).action, 'stop', 'the person runs the folder copy');
  assert.equal(decideRetirement({ ...base, marker: 'ours', inline: true }).action, 'stop', 'also after step 1');
  assert.equal(decideRetirement(base).action, 'step1', 'S2');
  assert.equal(decideRetirement({ ...base, marker: 'ours' }).action, 'step1', 'tombstone only: the switch is still to write');
  assert.equal(decideRetirement({ ...base, marker: 'ours', inline: false }).action, 'retired', 'S3/S4');

  const retired = { action: 'retired' };
  const days = n => n * 24 * HOUR;
  const now = NOW.getTime();
  const rest = { listed: true, folder: { kind: 'removable' }, leftovers: { retired: [], manifest: true, reported: false } };
  assert.equal(decideRemoval({ retirement: { action: 'stop' }, retiredAt: now - days(2), now, ...rest }).action, 'none');
  for (const retiredAt of [null, now + HOUR, Number.NaN]) assert.equal(decideRemoval({ retirement: retired, retiredAt, now, ...rest }).action, 'stamp', String(retiredAt));
  assert.equal(decideRemoval({ retirement: retired, retiredAt: now - days(1) + 60 * 1000, now, ...rest }).action, 'wait');
  const due = decideRemoval({ retirement: retired, retiredAt: now - days(1), now, ...rest });
  assert.deepEqual([due.action, due.entry, due.folder], ['remove', true, true]);
  const left = decideRemoval({ retirement: retired, retiredAt: now - days(1), now, ...rest, folder: { kind: 'left', reason: 'why' } });
  assert.deepEqual([left.action, left.reason], ['left', 'why']);
  const missing = decideRemoval({ retirement: retired, retiredAt: now - days(1), now, ...rest, folder: { kind: 'missing' }, listed: false });
  assert.deepEqual([missing.action, missing.sweep], ['remove', true], 'a record with no folder is deleted');
  const nothing = { listed: false, folder: { kind: 'missing' }, leftovers: { retired: [], manifest: false, reported: false } };
  assert.equal(decideRemoval({ retirement: retired, retiredAt: now - days(1), now, ...nothing }).action, 'done', 'S5');
  const sweep = decideRemoval({ retirement: retired, retiredAt: now - days(1), now, ...nothing, leftovers: { retired: ['agent-models.retired-1-2'], manifest: false, reported: false } });
  assert.equal(sweep.action, 'remove');
});

// ---------------------------------------------------------------------------------------------------------------------
// R: registration
// ---------------------------------------------------------------------------------------------------------------------

test('R1: no settings.json: the step writes a file with exactly the two keys, no backup, and says so', t => {
  const h = sandbox(t);
  const result = h.step();
  assert.deepEqual(h.readSettings(), reg());
  assert.deepEqual(h.backups(), []);
  assert.deepEqual([result.action, h.linesOf(result)], ['registered', [LINES.registered()]]);
  assert.deepEqual(tempFiles(h), []);
});

test('R2: settings with env, other marketplaces and plugins, hooks and mode 0600: the two keys are added, every other member keeps its value and place, the mode stays, one backup holds the old bytes', t => {
  if (!posixOnly(t)) return;
  const h = sandbox(t);
  const original = {
    env: { FOO: '1' },
    extraKnownMarketplaces: { other: { source: { source: 'github', repo: 'a/b' } } },
    enabledPlugins: { 'x@other': true, 'y@other': false },
    hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'echo' }] }] },
    effortLevel: 'high',
  };
  h.writeSettings(original);
  fs.chmodSync(h.settings, 0o600);
  const oldBytes = bytesOf(h.settings);
  const result = h.step();
  const now = h.readSettings();
  assert.equal(result.action, 'registered');
  assert.deepEqual(Object.keys(now), Object.keys(original), 'no top-level key is added or moved');
  assert.deepEqual(Object.keys(now.extraKnownMarketplaces), ['other', MARKETPLACE]);
  assert.deepEqual(Object.keys(now.enabledPlugins), ['x@other', 'y@other', PLUGIN_ID]);
  for (const key of ['env', 'hooks', 'effortLevel']) assert.deepEqual(now[key], original[key], key);
  assert.deepEqual(now.extraKnownMarketplaces.other, original.extraKnownMarketplaces.other);
  assert.equal(now.extraKnownMarketplaces[MARKETPLACE].autoUpdate, true);
  assert.equal(fs.statSync(h.settings).mode & 0o777, 0o600);
  assert.equal(h.backups().length, 1);
  assert.deepEqual(bytesOf(path.join(h.claude, h.backups()[0])), oldBytes);
  assert.deepEqual(tempFiles(h), []);
});

test('R3: registered and no engine record yet: the step twice leaves the home untouched and says nothing', t => {
  const h = sandbox(t);
  h.reg();
  const before = snapshot(h.home);
  for (let n = 0; n < 2; n += 1) assert.deepEqual(silent(h.step()), ['none', '']);
  assert.deepEqual(snapshot(h.home), before);
});

const CONFLICTS = [
  ['another url', { ...ANCHOR, url: 'https://github.com/someone/else.git' }],
  ['another ref', { ...ANCHOR, ref: 'main' }],
  ['a path key', { ...ANCHOR, path: 'plugins/agent-models' }],
  ['source github', { source: 'github', repo: 'oleksandrdubyna88/dew_flow_mods' }],
];

for (const [name, source] of CONFLICTS) {
  test(`R4: a dew-flow-mods entry with ${name} is named once and never overwritten or retired against; a changed entry is said again`, t => {
    const h = sandbox(t);
    h.writeSettings({ extraKnownMarketplaces: { [MARKETPLACE]: { source, autoUpdate: true } } });
    h.old('1.4.0');
    const before = h.frozen();
    const first = h.step();
    assert.deepEqual([first.action, h.linesOf(first)], ['told', [LINES.conflict()]]);
    assert.deepEqual(silent(h.step()), ['none', ''], 'the second start is silent');
    assert.deepEqual(h.frozen(), before, 'settings, the old copy and the marker: untouched');
    assert.equal(fs.existsSync(h.optout), false, 'no retirement');
    h.mergeSettings({ extraKnownMarketplaces: { [MARKETPLACE]: { source: { ...source, ref: 'other-ref' }, autoUpdate: true } } });
    assert.deepEqual(h.linesOf(h.step()), [LINES.conflict()], 'the changed entry is said again');
    assert.deepEqual(silent(h.step()), ['none', '']);
  });
}

test('R5: the plugin switched off (false) is the person\'s switch: untouched, silent, no tombstone, not even a state file', t => {
  const h = sandbox(t);
  h.reg();
  h.plugin(PLUGIN_ID, false);
  h.old('1.4.0');
  h.engine('1.6.0');
  const before = snapshot(h.home);
  for (let n = 0; n < 2; n += 1) assert.deepEqual(silent(h.step()), ['none', '']);
  assert.deepEqual(snapshot(h.home), before);
  assert.equal(fs.existsSync(h.optout), false);
  assert.equal(fs.existsSync(h.state), false);
});

const UNUSABLE = [
  ['unparsable', '{ not json', /does not parse/],
  ['an array', '[]', /not a JSON object/],
  ['env a string', JSON.stringify({ env: 'x' }), /env is not an object/],
  ['enabledPlugins an array', JSON.stringify({ enabledPlugins: [] }), /enabledPlugins is not an object/],
  ['extraKnownMarketplaces a string', JSON.stringify({ extraKnownMarketplaces: 'x' }), /extraKnownMarketplaces is not an object/],
];

for (const [name, text, reason] of UNUSABLE) {
  test(`R6: settings ${name}: nothing is written but the state file, and the refusal is said once`, t => {
    const h = sandbox(t);
    h.writeSettings(text);
    h.old('1.4.0', { settings: false });
    h.engine('1.6.0');
    const before = h.frozen();
    const first = h.step();
    assert.equal(first.action, 'refused');
    const [line, ...more] = h.linesOf(first);
    assert.equal(more.length, 0);
    assert.ok(line.startsWith(LINES.notRegistered('').replace(/\s+$/, '')), line);
    assert.ok(line.length > LINES.notRegistered('').length, 'the reason follows');
    assert.match(line, reason);
    assert.match(line, /settings\.json/);
    assert.deepEqual(silent(h.step()), ['none', ''], 'said once');
    assert.deepEqual(h.frozen(), before);
    assert.equal(fs.existsSync(h.optout), false, 'no retirement');
    assert.deepEqual(tempFiles(h), []);
  });
}

test('R6c (a): settings changed by beforeWrite to hold the registration already: silent, their bytes kept', t => {
  const h = sandbox(t);
  h.writeSettings({ theme: 'x' });
  const theirs = `${JSON.stringify({ theme: 'x', ...reg() })}\n`;
  const result = h.step({ beforeWrite: () => fs.writeFileSync(h.settings, theirs) });
  assert.deepEqual(silent(result), ['none', '']);
  assert.equal(fs.readFileSync(h.settings, 'utf8'), theirs);
  assert.deepEqual(h.backups(), [], 'no write followed, so no backup');
  assert.deepEqual(tempFiles(h), []);
});

test('R6c (b): settings changed by beforeWrite to other bytes: nothing of ours is written, a refusal with the retry, no temp file', t => {
  const h = sandbox(t);
  h.writeSettings({ theme: 'x' });
  const theirs = `${JSON.stringify({ theme: 'y' })}\n`;
  const result = h.step({ beforeWrite: () => fs.writeFileSync(h.settings, theirs) });
  assert.deepEqual([result.action, h.linesOf(result)], ['refused', [LINES.notRegistered(LINES.changed('registering'))]]);
  assert.equal(fs.readFileSync(h.settings, 'utf8'), theirs);
  assert.deepEqual(tempFiles(h), []);
});

test('R6c (c): no settings.json at the read and one appears before the write: it is never replaced, a refusal with the retry, no temp file', t => {
  const h = sandbox(t);
  const theirs = `${JSON.stringify({ theme: 'z' })}\n`;
  const result = h.step({ beforeWrite: () => { fs.mkdirSync(h.claude, { recursive: true }); fs.writeFileSync(h.settings, theirs); } });
  assert.deepEqual([result.action, h.linesOf(result)], ['refused', [LINES.notRegistered(LINES.changed('registering'))]]);
  assert.equal(fs.readFileSync(h.settings, 'utf8'), theirs);
  assert.deepEqual(tempFiles(h), []);
});

for (const [name, autoUpdate] of [['autoUpdate false', { autoUpdate: false }], ['no autoUpdate key', {}]]) {
  test(`R8: the anchor source with ${name}: the entry stays as it is, it is told once, and the retirement goes on`, t => {
    const h = sandbox(t);
    h.writeSettings({ extraKnownMarketplaces: { [MARKETPLACE]: { source: { ...ANCHOR }, ...autoUpdate } }, enabledPlugins: { [PLUGIN_ID]: true } });
    h.old('1.4.0');
    h.engine('1.6.0');
    const first = h.step();
    assert.deepEqual(h.linesOf(first), [LINES.retired('1.6.0', true), LINES.autoUpdateOff()]);
    assert.equal(first.action, 'retired', 'the first line of the table order');
    assert.deepEqual(h.readSettings().extraKnownMarketplaces[MARKETPLACE], { source: { ...ANCHOR }, ...autoUpdate }, 'the entry is untouched');
    assert.equal(h.readSettings().enabledPlugins[INLINE_ID], false, 'the retirement went on');
    assert.deepEqual(silent(h.step()), ['none', ''], 'said once');
  });
}

test('R9: settings.json a link to a file elsewhere is written through, the link kept; a dangling link is refused and nothing is created', t => {
  const h = sandbox(t);
  fs.mkdirSync(h.claude, { recursive: true });
  const real = path.join(h.root, 'dotfiles', 'settings.json');
  fs.mkdirSync(path.dirname(real));
  fs.writeFileSync(real, `${JSON.stringify({ theme: 'x' })}\n`);
  if (!symlinkOrSkip(t, real, h.settings)) return;
  const result = h.step();
  assert.equal(result.action, 'registered');
  assert.equal(fs.lstatSync(h.settings).isSymbolicLink(), true, 'the link is kept');
  assert.deepEqual(asObject(fs.readFileSync(real, 'utf8')), { theme: 'x', ...reg() });
  assert.deepEqual(tempFiles(h), []);
});

test('R9: a dangling settings.json link is refused and nothing is created behind it', t => {
  const h = sandbox(t);
  fs.mkdirSync(h.claude, { recursive: true });
  const missing = path.join(h.root, 'dotfiles', 'settings.json');
  if (!symlinkOrSkip(t, missing, h.settings)) return;
  const result = h.step();
  assert.equal(result.action, 'refused');
  assert.ok(h.linesOf(result)[0].startsWith(LINES.notRegistered('').trim()));
  assert.equal(fs.existsSync(missing), false);
  assert.equal(fs.existsSync(path.dirname(missing)), false);
  assert.equal(fs.lstatSync(h.settings).isSymbolicLink(), true);
});

// ---------------------------------------------------------------------------------------------------------------------
// M: the proof and the retirement
// ---------------------------------------------------------------------------------------------------------------------

test('M1: registered with the old copy and no installed record, or a file with no record for the id: untouched, silent', t => {
  const h = sandbox(t);
  h.reg();
  h.old('1.4.0');
  const before = snapshot(h.home);
  for (let n = 0; n < 2; n += 1) assert.deepEqual(silent(h.step()), ['none', '']);
  assert.deepEqual(snapshot(h.home), before);
  fs.mkdirSync(h.plugins, { recursive: true });
  fs.writeFileSync(h.installed, JSON.stringify({ version: 2, plugins: { 'other@x': [{ scope: 'user', installPath: '/x', version: '1' }] } }));
  const withFile = snapshot(h.home);
  assert.deepEqual(silent(h.step()), ['none', '']);
  assert.deepEqual(snapshot(h.home), withFile);
  assert.equal(fs.existsSync(h.optout), false);
});

/** The record file's text with `change` applied to the parsed document. */
const editRecord = (h, change) => {
  const doc = asObject(fs.readFileSync(h.installed, 'utf8'));
  change(doc);
  fs.writeFileSync(h.installed, `${JSON.stringify(doc)}\n`);
};
const firstRecord = doc => doc.plugins[PLUGIN_ID][0];

/** [name, change(h, installPath), silent, the word the line names]. */
const PROOF_BREAKS = [
  ['no record for the id', (h) => editRecord(h, doc => { delete doc.plugins[PLUGIN_ID]; }), true],
  ['no cache folder', (h, p) => fs.rmSync(p, { recursive: true }), true],
  ['no plugin.json', (h, p) => fs.rmSync(path.join(p, '.claude-plugin', 'plugin.json')), true],
  ['another version in plugin.json', (h, p) => fs.writeFileSync(path.join(p, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'agent-models', version: '9.9.9' })), false, 'plugin.json'],
  ['another name in plugin.json', (h, p) => fs.writeFileSync(path.join(p, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'other', version: '1.6.0' })), false, 'plugin.json'],
  ['.orphaned_at', (h, p) => fs.writeFileSync(path.join(p, '.orphaned_at'), '1'), false, '.orphaned_at'],
  ['version 3 of the record file', h => editRecord(h, doc => { doc.version = 3; }), false, 'installed_plugins.json'],
  ['plugins an array', h => editRecord(h, doc => { doc.plugins = []; }), false, 'installed_plugins.json'],
  ['two user records', h => editRecord(h, doc => { doc.plugins[PLUGIN_ID].push({ ...firstRecord(doc) }); }), false, 'installed_plugins.json'],
  ['installPath outside cacheRoot', (h, p) => editRecord(h, doc => { firstRecord(doc).installPath = path.join(h.root, 'elsewhere'); }), false, 'installed_plugins.json'],
  ['installPath relative', h => editRecord(h, doc => { firstRecord(doc).installPath = 'cache/x'; }), false, 'installed_plugins.json'],
  ['installPath the cache root itself', h => editRecord(h, doc => { firstRecord(doc).installPath = h.cacheRoot; }), false, 'installed_plugins.json'],
  ['a record file over 1 MB', h => fs.writeFileSync(h.installed, JSON.stringify({ version: 2, plugins: {}, pad: 'x'.repeat((1 << 20) + 10) })), false, 'installed_plugins.json'],
  ['a record file that does not parse', h => fs.writeFileSync(h.installed, '{nope'), false, 'installed_plugins.json'],
  ['a record whose version is a number', h => editRecord(h, doc => { firstRecord(doc).version = 160; }), false, 'installed_plugins.json'],
];

for (const [name, change, silentCase, word] of PROOF_BREAKS) {
  test(`M2: the proof broken in exactly one thing (${name}): no tombstone, the settings untouched; ${silentCase ? 'silent' : 'told once, naming the file'}`, t => {
    const h = sandbox(t);
    h.reg();
    h.old('1.4.0');
    const installPath = h.engine('1.6.0');
    change(h, installPath);
    const before = h.frozen();
    const first = h.step();
    if (silentCase) {
      assert.deepEqual(silent(first), ['none', '']);
    } else {
      assert.equal(first.action, 'told');
      const lines = h.linesOf(first);
      assert.equal(lines.length, 1);
      assert.ok(lines[0].includes(word), `${lines[0]} names ${word}`);
      assert.ok(lines[0].startsWith(LINES.proof('').split(':')[0]), lines[0]);
      assert.deepEqual(silent(h.step()), ['none', ''], 'said once');
    }
    assert.deepEqual(h.frozen(), before);
    assert.equal(fs.existsSync(h.optout), false, 'no tombstone');
  });
}

test('M2: an installPath that is a link to a real folder with a plugin.json is no proof, and is told once', t => {
  const h = sandbox(t);
  h.reg();
  h.old('1.4.0');
  const installPath = h.engine('1.6.0');
  const real = path.join(h.root, 'real-copy');
  fs.renameSync(installPath, real);
  if (!symlinkOrSkip(t, real, installPath)) return;
  const first = h.step();
  assert.equal(first.action, 'told');
  assert.ok(first.line.startsWith(LINES.proof('').split(':')[0]));
  assert.equal(fs.existsSync(h.optout), false);
});

test('M2: a known_marketplaces.json that is too big or does not parse is told once; a symlinked record file is another shape', t => {
  const h = sandbox(t);
  h.reg();
  h.old('1.4.0');
  h.engine('1.6.0');
  fs.writeFileSync(h.known, '{nope');
  const first = h.step();
  assert.equal(first.action, 'told');
  assert.ok(first.line.includes('known_marketplaces.json'));
  assert.equal(fs.existsSync(h.optout), false);
});

const KNOWN_BREAKS = [
  ['another url', known => { known[MARKETPLACE].source.url = 'https://github.com/x/y.git'; }, false],
  ['another ref', known => { known[MARKETPLACE].source.ref = 'main'; }, false],
  ['no entry', known => { delete known[MARKETPLACE]; }, true],
];

for (const [name, change, silentCase] of KNOWN_BREAKS) {
  test(`M3: the engine's own marketplace record with ${name} stops the retirement; ${silentCase ? 'silent' : 'told once'}`, t => {
    const h = sandbox(t);
    h.reg();
    h.old('1.4.0');
    h.engine('1.6.0');
    const known = asObject(fs.readFileSync(h.known, 'utf8'));
    change(known);
    fs.writeFileSync(h.known, JSON.stringify(known));
    const before = h.frozen();
    const first = h.step();
    if (silentCase) assert.deepEqual(silent(first), ['none', '']);
    else assert.deepEqual([first.action, first.line.includes('known_marketplaces.json')], ['told', true]);
    assert.deepEqual(silent(h.step()), ['none', '']);
    assert.deepEqual(h.frozen(), before);
    assert.equal(fs.existsSync(h.optout), false);
  });
}

test('M3: the settings entry differing (with a whole engine record) stops the retirement: conflict, told once', t => {
  const h = sandbox(t);
  h.reg();
  h.mergeSettings({ extraKnownMarketplaces: { [MARKETPLACE]: { source: { ...ANCHOR, ref: 'main' }, autoUpdate: true } } });
  h.old('1.4.0');
  h.engine('1.6.0');
  const first = h.step();
  assert.deepEqual([first.action, h.linesOf(first)], ['told', [LINES.conflict()]]);
  assert.equal(fs.existsSync(h.optout), false);
  assert.equal(h.readSettings().enabledPlugins[INLINE_ID], undefined);
});

test('M4: registered, the old 1.4.0 copy and the engine at 1.6.0: the tombstone is written first, then enabledPlugins[inline] = false; the old folder, its record and the variable stay; one backup; the retired line', t => {
  const h = sandbox(t);
  h.reg({ theme: 'keep' });
  h.old('1.4.0');
  h.engine('1.6.0');
  const folderBefore = snapshot(h.oldFolder);
  const recordBefore = bytesOf(h.oldManifest);
  const before = h.readSettings();
  let seenTomb;
  const result = h.step({ beforeWrite: () => { seenTomb = fs.existsSync(h.optout) ? asObject(fs.readFileSync(h.optout, 'utf8')).tombstone : null; } });
  assert.equal(seenTomb, 'dew-flow-mods', 'the tombstone is on disk before the settings write');
  assert.equal(asObject(fs.readFileSync(h.optout, 'utf8')).tombstone, 'dew-flow-mods');
  assert.equal(h.readSettings().enabledPlugins[INLINE_ID], false);
  assert.deepEqual({ ...h.readSettings(), enabledPlugins: before.enabledPlugins }, before, 'nothing else of the settings changed');
  assert.deepEqual(h.readSettings().enabledPlugins, { ...before.enabledPlugins, [INLINE_ID]: false });
  assert.deepEqual(snapshot(h.oldFolder), folderBefore);
  assert.deepEqual(bytesOf(h.oldManifest), recordBefore);
  assert.equal(h.readSettings().env.CLAUDE_CODE_PLUGIN_DIRS, h.oldFolder);
  assert.equal(h.backups().length, 1);
  assert.deepEqual([result.action, h.linesOf(result)], ['retired', [LINES.retired('1.6.0', true)]]);
  assert.equal(stateOf(h).retiredAt, NOW.toISOString());
  assert.deepEqual(silent(h.step()), ['none', ''], 'the next start in the wait');
  assert.deepEqual(tempFiles(h), []);
});

test('M10: registered and the engine at 1.6.0 with no old folder and no variable: the same retirement, with the short line', t => {
  const h = sandbox(t);
  h.reg();
  h.engine('1.6.0');
  const result = h.step();
  assert.deepEqual([result.action, h.linesOf(result)], ['retired', [LINES.retired('1.6.0', false)]]);
  assert.notEqual(LINES.retired('1.6.0', false), LINES.retired('1.6.0', true));
  assert.equal(asObject(fs.readFileSync(h.optout, 'utf8')).tombstone, 'dew-flow-mods');
  assert.equal(h.readSettings().enabledPlugins[INLINE_ID], false);
  assert.equal(fs.existsSync(h.oldFolder), false);
});

test('M6: S3 with retiredAt 23 h 59 min ago: untouched; at 24 h: the entry leaves the variable (other entries verbatim), the folder, record and reported file go, marker and state stay', t => {
  for (const [variable, expectedEnv] of [[null, null], [`/a${path.delimiter}OLD${path.delimiter}/b`, `/a${path.delimiter}/b`], ['~/.claude/mods/agent-models', undefined]]) {
    const h = sandbox(t, 'mods-marketplace-m6');
    h.reg();
    h.old('1.4.0', { settings: false });
    fs.writeFileSync(h.oldReported, '{"key":"x"}');
    h.mergeSettings({ env: { OTHER: '1', CLAUDE_CODE_PLUGIN_DIRS: (variable ?? h.oldFolder).replace('OLD', h.oldFolder) } });
    h.engine('1.6.0');
    h.retired(new Date(NOW.getTime() - 24 * HOUR + 60 * 1000), '1.6.0');
    const before = snapshot(h.home);
    assert.deepEqual(silent(h.step()), ['none', ''], 'before 24 h');
    assert.deepEqual(snapshot(h.home), before);
    h.writeState({ retiredAt: at(-24).toISOString(), version: '1.6.0' });
    const result = h.step();
    assert.deepEqual([result.action, h.linesOf(result)], ['removed', [LINES.removed()]], String(variable));
    const env = h.readSettings().env;
    assert.equal(env.OTHER, '1', 'env stays');
    if (expectedEnv === null || expectedEnv === undefined) assert.equal(Object.hasOwn(env, 'CLAUDE_CODE_PLUGIN_DIRS'), false, 'the key goes when the value is empty');
    else assert.equal(env.CLAUDE_CODE_PLUGIN_DIRS, expectedEnv);
    assert.equal(fs.existsSync(h.oldFolder), false);
    assert.equal(fs.existsSync(h.oldManifest), false);
    assert.equal(fs.existsSync(h.oldReported), false);
    assert.deepEqual(names(h.mods).filter(n => n.includes('retired')), [], 'no retired-* folder');
    assert.equal(asObject(fs.readFileSync(h.optout, 'utf8')).tombstone, 'dew-flow-mods', 'the marker stays');
    assert.ok(fs.existsSync(h.state), 'the state file stays');
    assert.equal(h.readSettings().enabledPlugins[INLINE_ID], false);
    assert.deepEqual(silent(h.step()), ['none', ''], 'S5 is silent');
  }
});

test('M6: an env with the variable as its only member keeps env (an empty object) when the entry goes', t => {
  const h = sandbox(t);
  h.reg();
  h.old('1.4.0');
  h.engine('1.6.0');
  h.retired(at(-25), '1.6.0');
  assert.equal(h.step().action, 'removed');
  assert.deepEqual(h.readSettings().env, {});
});

for (const [name, retiredAt] of [['absent', undefined], ['unparsable', 'not a time'], ['one hour in the future', at(1).toISOString()]]) {
  test(`M6b: S3 with retiredAt ${name}: the first start only sets retiredAt to now; at +25 h step 2 runs`, t => {
    const h = sandbox(t);
    h.reg();
    h.old('1.4.0');
    h.engine('1.6.0');
    h.tomb(at(-30));
    h.plugin(INLINE_ID, false);
    h.writeState({ ...(retiredAt === undefined ? {} : { retiredAt }), version: '1.6.0' });
    const before = h.frozen();
    const first = h.step();
    assert.deepEqual(silent(first), ['none', '']);
    assert.deepEqual(h.frozen(), before, 'only the state file changed');
    assert.equal(stateOf(h).retiredAt, NOW.toISOString());
    const later = h.step({ now: () => at(25) });
    assert.deepEqual([later.action, h.linesOf(later)], ['removed', [LINES.removed()]]);
    assert.equal(fs.existsSync(h.oldFolder), false);
  });
}

test('M6c: step 2 reads the proof and the switches again: the plugin now false, the known entry changed, INLINE_ID true: nothing is removed', t => {
  const cases = [
    ['plugin false', h => h.plugin(PLUGIN_ID, false)],
    ['known entry changed', h => { const k = asObject(fs.readFileSync(h.known, 'utf8')); k[MARKETPLACE].source.ref = 'main'; fs.writeFileSync(h.known, JSON.stringify(k)); }],
    ['inline true', h => h.plugin(INLINE_ID, true)],
    ['settings entry changed', h => h.mergeSettings({ extraKnownMarketplaces: { [MARKETPLACE]: { source: { ...ANCHOR, ref: 'main' } } } })],
  ];
  for (const [name, change] of cases) {
    const h = sandbox(t, 'mods-marketplace-m6c');
    h.reg();
    h.old('1.4.0');
    h.engine('1.6.0');
    h.retired(at(-25), '1.6.0');
    change(h);
    h.step();
    h.step();
    assert.equal(fs.existsSync(h.oldFolder), true, name);
    assert.equal(fs.existsSync(h.oldManifest), true, name);
    assert.equal(h.readSettings().env.CLAUDE_CODE_PLUGIN_DIRS, h.oldFolder, name);
  }
});

const uidNow = process.getuid?.();
/** [name, change(h) run on a fresh S4 home, options for the step, the settings of the old folder]. */
const LEFT_CASES = [
  ['a link (its target has files)', h => {
    const target = path.join(h.root, 'target');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'f.txt'), 'x');
    fs.rmSync(h.oldFolder, { recursive: true });
    return symlinkOrSkip(h.t, target, h.oldFolder);
  }],
  ['owned by another uid', () => true, { uid: () => uidNow + 1 }],
  ['a file', h => { fs.rmSync(h.oldFolder, { recursive: true }); fs.writeFileSync(h.oldFolder, 'x'); return true; }],
  ['no record', h => { fs.rmSync(h.oldManifest); return true; }],
  ['a record key ../x', h => { fs.writeFileSync(h.oldManifest, JSON.stringify({ sha256: { '../x': sha('x') } })); return true; }],
  ['a named file changed', h => { fs.appendFileSync(path.join(h.oldFolder, OLD_FILES[3]), '// mine\n'); return true; }],
  ['a named file missing', h => { fs.rmSync(path.join(h.oldFolder, OLD_FILES[3])); return true; }],
  ['a link inside', h => {
    const other = path.join(h.root, 'other');
    fs.mkdirSync(other);
    return symlinkOrSkip(h.t, other, path.join(h.oldFolder, 'inner'));
  }],
  ['501 entries', h => { for (let n = 0; n < 520; n += 1) fs.writeFileSync(path.join(h.oldFolder, `many-${n}`), 'x'); return true; }],
  ['a person\'s own file (notes.txt)', h => { fs.writeFileSync(path.join(h.oldFolder, 'notes.txt'), 'mine'); return true; }],
  ['an unknown nested folder', h => { fs.mkdirSync(path.join(h.oldFolder, 'more')); fs.writeFileSync(path.join(h.oldFolder, 'more', 'unnamed.txt'), 'x'); return true; }],
  ['a variable that is a number', h => { h.mergeSettings({ env: { CLAUDE_CODE_PLUGIN_DIRS: 7 } }); return true; }],
];

for (const [name, change, options = {}] of LEFT_CASES) {
  test(`M7: S4 with the old folder ${name}: folder, entry and record stay, told once with the reason, INLINE_ID stays false`, t => {
    if (!posixOnly(t)) return;
    const h = sandbox(t);
    h.t = t;
    h.reg();
    h.old('1.4.0');
    h.engine('1.6.0');
    h.retired(at(-25), '1.6.0');
    if (!change(h)) return;
    const before = h.frozen();
    const targetBefore = fs.existsSync(path.join(h.root, 'target')) ? snapshot(path.join(h.root, 'target')) : null;
    const first = h.step(options);
    assert.equal(first.action, 'told', first.line);
    const lines = h.linesOf(first);
    assert.equal(lines.length, 1);
    assert.ok(lines[0].startsWith(LINES.left('').split(':')[0]), lines[0]);
    assert.ok(lines[0].length > LINES.left('').length, 'the reason follows');
    assert.deepEqual(silent(h.step(options)), ['none', ''], 'said once');
    assert.deepEqual(h.frozen(), before);
    if (targetBefore !== null) assert.deepEqual(snapshot(path.join(h.root, 'target')), targetBefore, 'a link\'s target is never touched');
    assert.equal(h.readSettings().enabledPlugins[INLINE_ID], false);
  });
}

test('M7b: S4 with exactly the recorded files, tsconfig.json and .claude-plugin/types/claude-code/index.d.ts: removed whole; only a fully accounted folder is removed', t => {
  const h = sandbox(t);
  h.reg();
  h.old('1.4.0');
  assert.ok(EXTRAS.includes('tsconfig.json') && EXTRAS.includes('.claude-plugin/types/claude-code/index.d.ts'));
  assert.ok(fs.existsSync(path.join(h.oldFolder, '.claude-plugin', 'types', 'claude-code', 'index.d.ts')));
  h.engine('1.6.0');
  h.retired(at(-25), '1.6.0');
  const result = h.step();
  assert.deepEqual([result.action, h.linesOf(result)], ['removed', [LINES.removed()]]);
  assert.equal(fs.existsSync(h.oldFolder), false);
});

test('M8: the inline plugin set to true (the person runs the folder copy): no tombstone, told once; with a tombstone and 25 h: no removal, told once', t => {
  const a = sandbox(t, 'mods-marketplace-m8a');
  a.reg();
  a.plugin(INLINE_ID, true);
  a.old('1.4.0');
  a.engine('1.6.0');
  const before = a.frozen();
  const first = a.step();
  assert.deepEqual([first.action, a.linesOf(first)], ['told', [LINES.inlineTrue()]]);
  assert.deepEqual(silent(a.step()), ['none', '']);
  assert.deepEqual(a.frozen(), before);
  assert.equal(fs.existsSync(a.optout), false, 'no tombstone');
  const b = sandbox(t, 'mods-marketplace-m8b');
  b.reg();
  b.old('1.4.0');
  b.engine('1.6.0');
  b.retired(at(-25), '1.6.0');
  b.plugin(INLINE_ID, true);
  const frozenB = b.frozen();
  const second = b.step();
  assert.deepEqual([second.action, b.linesOf(second)], ['told', [LINES.inlineTrue()]]);
  assert.deepEqual(silent(b.step()), ['none', '']);
  assert.deepEqual(b.frozen(), frozenB);
});

test('M9: S5 and the shell\'s own variable still lists the old folder: told once; the start that itself did step 2 says only removed', t => {
  const a = sandbox(t, 'mods-marketplace-m9a');
  a.reg();
  a.engine('1.6.0');
  a.retired(at(-48), '1.6.0');
  const env = { CLAUDE_CODE_PLUGIN_DIRS: `/x${path.delimiter}${a.oldFolder}` };
  const first = a.step({ env, sessionSource: 'startup' });
  assert.deepEqual([first.action, a.linesOf(first)], ['told', [LINES.shell()]]);
  assert.deepEqual(silent(a.step({ env, sessionSource: 'startup' })), ['none', '']);
  assert.deepEqual(silent(a.step({ env: {}, sessionSource: 'startup' })), ['none', ''], 'the variable is clean now');
  const b = sandbox(t, 'mods-marketplace-m9b');
  b.reg();
  b.old('1.4.0');
  b.engine('1.6.0');
  b.retired(at(-25), '1.6.0');
  const did = b.step({ env: { CLAUDE_CODE_PLUGIN_DIRS: b.oldFolder }, sessionSource: 'startup' });
  assert.deepEqual([did.action, b.linesOf(did)], ['removed', [LINES.removed()]]);
});

test('M9b: the shell line is said only at a start (source startup): a resumed, cleared or compacted session may run on the old value, and says nothing and keeps the line for the next start', t => {
  const h = sandbox(t, 'mods-marketplace-m9c');
  h.reg();
  h.engine('1.6.0');
  h.retired(at(-48), '1.6.0');
  const env = { CLAUDE_CODE_PLUGIN_DIRS: `/x${path.delimiter}${h.oldFolder}` };
  for (const sessionSource of ['resume', 'clear', 'compact', '', 'other', undefined]) {
    assert.deepEqual(silent(h.step({ env, sessionSource })), ['none', ''], String(sessionSource));
    assert.equal(Object.hasOwn(stateOf(h)?.said ?? {}, 'shell'), false, `not recorded as said: ${sessionSource}`);
  }
  const startup = h.step({ env, sessionSource: 'startup' });
  assert.deepEqual([startup.action, h.linesOf(startup)], ['told', [LINES.shell()]]);
  assert.deepEqual(silent(h.step({ env, sessionSource: 'startup' })), ['none', ''], 'said once');
  assert.deepEqual(silent(h.step({ env, sessionSource: 'resume' })), ['none', '']);
});

test('U1: S5 with the engine at 1.6.0, then 1.6.1, then 1.6.1: silent (stored), updated 1.6.0 -> 1.6.1, silent', t => {
  const h = sandbox(t);
  h.reg();
  h.engine('1.6.0');
  h.retired(at(-48));
  assert.deepEqual(silent(h.step()), ['none', '']);
  assert.equal(stateOf(h).version, '1.6.0');
  h.engine('1.6.1');
  const second = h.step();
  assert.deepEqual([second.action, h.linesOf(second)], ['updated', [LINES.updated('1.6.0', '1.6.1')]]);
  assert.deepEqual(silent(h.step()), ['none', '']);
  assert.equal(stateOf(h).version, '1.6.1');
});

test('W1: registered, no record: at 71 h silent; at 72 h the manual command once; when the engine appears the key is gone and the retirement goes on', t => {
  const h = sandbox(t);
  h.reg();
  h.writeState({ registeredAt: at(-71).toISOString() });
  assert.deepEqual(silent(h.step()), ['none', '']);
  h.writeState({ registeredAt: at(-72).toISOString() });
  const first = h.step();
  assert.deepEqual([first.action, h.linesOf(first)], ['told', [LINES.wait()]]);
  assert.deepEqual(silent(h.step()), ['none', ''], 'said once');
  assert.ok(Object.keys(stateOf(h).said).some(k => k === 'wait'));
  h.engine('1.6.0');
  const retired = h.step();
  assert.deepEqual([retired.action, h.linesOf(retired)], ['retired', [LINES.retired('1.6.0', false)]]);
  assert.equal(Object.hasOwn(stateOf(h).said ?? {}, 'wait'), false, 'the key is gone');
});

test('W1: the registration itself stores registeredAt, so the three days run from our write', t => {
  const h = sandbox(t);
  assert.equal(h.step().action, 'registered');
  assert.equal(stateOf(h).registeredAt, NOW.toISOString());
  assert.deepEqual(silent(h.step({ now: () => at(71) })), ['none', '']);
  assert.equal(h.step({ now: () => at(72) }).action, 'told');
});

test('X1: two told states at once are each said once; one leaves and comes back and is said again', t => {
  const h = sandbox(t);
  h.writeSettings({ extraKnownMarketplaces: { [MARKETPLACE]: { source: { ...ANCHOR }, autoUpdate: false } }, enabledPlugins: { [PLUGIN_ID]: true } });
  const installPath = h.engine('1.6.0');
  fs.writeFileSync(path.join(installPath, '.orphaned_at'), '1');
  const first = h.step();
  const lines = h.linesOf(first);
  assert.equal(first.action, 'told');
  assert.equal(lines.length, 2);
  assert.ok(lines.includes(LINES.autoUpdateOff()));
  assert.deepEqual(silent(h.step()), ['none', '']);
  h.mergeSettings({ extraKnownMarketplaces: { [MARKETPLACE]: anchorEntry() } });
  assert.deepEqual(silent(h.step()), ['none', ''], 'one left');
  h.mergeSettings({ extraKnownMarketplaces: { [MARKETPLACE]: { source: { ...ANCHOR }, autoUpdate: false } } });
  assert.deepEqual(h.linesOf(h.step()), [LINES.autoUpdateOff()], 'and came back: said again');
  assert.deepEqual(silent(h.step()), ['none', '']);
});

test('X1: a state file that is an array, or does not parse, is read as empty; a state file that cannot be written repeats the lines and never throws', t => {
  const h = sandbox(t);
  h.writeSettings({ extraKnownMarketplaces: { [MARKETPLACE]: { source: { ...ANCHOR }, autoUpdate: false } }, enabledPlugins: { [PLUGIN_ID]: true } });
  for (const text of ['[]', '{nope', JSON.stringify({ said: 'x', registeredAt: 5 })]) {
    h.writeState(text);
    assert.deepEqual(h.linesOf(h.step()), [LINES.autoUpdateOff()], text);
    assert.equal(Array.isArray(stateOf(h)), false);
    assert.equal(typeof stateOf(h), 'object');
    fs.rmSync(h.state);
  }
  fs.mkdirSync(h.state);
  for (let n = 0; n < 2; n += 1) assert.deepEqual(h.linesOf(h.step()), [LINES.autoUpdateOff()], 'the line repeats while nothing can record it');
  assert.deepEqual(tempFiles(h), []);
});

for (const kind of ['link', 'file']) {
  test(`X2: mods is a ${kind}: no tombstone through it, the settings untouched, refused`, t => {
    const h = sandbox(t);
    h.reg();
    h.engine('1.6.0');
    fs.mkdirSync(h.claude, { recursive: true });
    const elsewhere = path.join(h.root, 'elsewhere');
    if (kind === 'link') {
      fs.mkdirSync(elsewhere);
      if (!symlinkOrSkip(t, elsewhere, h.mods)) return;
    } else {
      fs.writeFileSync(h.mods, 'x');
    }
    const settingsBefore = bytesOf(h.settings);
    for (let n = 0; n < 2; n += 1) {
      const result = h.step();
      assert.equal(result.action, 'refused');
      assert.ok(h.linesOf(result)[0].startsWith(LINES.notRetired('').trim()));
    }
    assert.deepEqual(bytesOf(h.settings), settingsBefore);
    if (kind === 'link') assert.deepEqual(fs.readdirSync(elsewhere), [], 'nothing was written through the link');
    else assert.equal(fs.readFileSync(h.mods, 'utf8'), 'x');
  });
}

test('X2: mods is a link that holds the person\'s agent-models.optout: skipped, the home untouched (the marker is read through the link)', t => {
  const h = sandbox(t);
  h.reg();
  h.engine('1.6.0');
  const elsewhere = path.join(h.root, 'elsewhere');
  fs.mkdirSync(elsewhere);
  fs.writeFileSync(path.join(elsewhere, 'agent-models.optout'), '{"mine":true}');
  if (!symlinkOrSkip(t, elsewhere, h.mods)) return;
  const before = snapshot(h.home);
  const beforeLinked = snapshot(elsewhere);
  for (let n = 0; n < 2; n += 1) assert.deepEqual(silent(h.step({ now: () => at(25 * n) })), ['skipped', '']);
  assert.deepEqual(snapshot(h.home), before, 'the home is untouched');
  assert.deepEqual(snapshot(elsewhere), beforeLinked, 'nothing was written through the link');
  assert.equal(fs.readFileSync(path.join(elsewhere, 'agent-models.optout'), 'utf8'), '{"mine":true}');
});

test('X3: a person\'s marker appears between the read of the marker and the tombstone: their bytes are kept, the settings untouched, and later starts write nothing', t => {
  const h = sandbox(t);
  h.reg();
  h.old('1.4.0');
  h.engine('1.6.0');
  const settingsBefore = bytesOf(h.settings);
  const result = h.step({ beforeMarker: () => { fs.mkdirSync(h.mods, { recursive: true }); fs.writeFileSync(h.optout, '{"mine":true}'); } });
  assert.deepEqual(silent(result), ['skipped', '']);
  assert.equal(fs.readFileSync(h.optout, 'utf8'), '{"mine":true}');
  assert.deepEqual(bytesOf(h.settings), settingsBefore);
  const after = snapshot(h.home);
  assert.deepEqual(silent(h.step()), ['skipped', '']);
  assert.deepEqual(snapshot(h.home), after);
});

test('a marker that is the person\'s stops the whole step: nothing is written, not even the registration or the state file', t => {
  const h = sandbox(t);
  fs.mkdirSync(h.mods, { recursive: true });
  fs.writeFileSync(h.optout, '');
  const before = snapshot(h.home);
  assert.deepEqual(silent(h.step()), ['skipped', '']);
  assert.deepEqual(snapshot(h.home), before);
  assert.equal(fs.existsSync(h.settings), false);
});

// ---------------------------------------------------------------------------------------------------------------------
// the sub-step seam: the disk state of a process killed after each one, and the finish at the next start
// ---------------------------------------------------------------------------------------------------------------------

test('stopAfter tombstone / inline: the step returns none right after that sub-step and writes nothing more', t => {
  const a = sandbox(t, 'mods-marketplace-stop-a');
  a.reg();
  a.engine('1.6.0');
  assert.deepEqual(silent(a.step({ stopAfter: 'tombstone' })), ['none', '']);
  assert.equal(asObject(fs.readFileSync(a.optout, 'utf8')).tombstone, 'dew-flow-mods');
  assert.equal(a.readSettings().enabledPlugins[INLINE_ID], undefined);
  assert.equal(fs.existsSync(a.state), false);
  const b = sandbox(t, 'mods-marketplace-stop-b');
  b.reg();
  b.engine('1.6.0');
  assert.deepEqual(silent(b.step({ stopAfter: 'inline' })), ['none', '']);
  assert.equal(b.readSettings().enabledPlugins[INLINE_ID], false);
  assert.equal(fs.existsSync(b.state), false, 'retiredAt is not stored yet');
});

for (const stopAfter of ['variable', 'rename', 'folder']) {
  test(`stopAfter ${stopAfter}: a step 2 cut short there is finished by the next start; removed is said once over the two runs`, t => {
    const h = sandbox(t);
    h.reg();
    h.old('1.4.0');
    fs.writeFileSync(h.oldReported, '{}');
    h.engine('1.6.0');
    h.retired(at(-25), '1.6.0');
    const cut = h.step({ stopAfter });
    assert.deepEqual(silent(cut), ['none', '']);
    const done = h.step();
    assert.deepEqual([done.action, h.linesOf(done)], ['removed', [LINES.removed()]]);
    assert.equal(Object.hasOwn(h.readSettings().env ?? {}, 'CLAUDE_CODE_PLUGIN_DIRS'), false);
    assert.equal(fs.existsSync(h.oldFolder), false);
    assert.deepEqual(names(h.mods).filter(n => n.includes('retired')), []);
    assert.equal(fs.existsSync(h.oldManifest), false);
    assert.equal(fs.existsSync(h.oldReported), false);
    assert.deepEqual(silent(h.step()), ['none', '']);
  });
}

test('the sweep: a retired-* real folder of our uid is removed at S4; a link of that name is never touched; a record and a reported file with no old folder are deleted', t => {
  const h = sandbox(t);
  h.reg();
  h.engine('1.6.0');
  h.retired(at(-25), '1.6.0');
  fs.mkdirSync(path.join(h.mods, 'agent-models.retired-1-2'), { recursive: true });
  fs.writeFileSync(path.join(h.mods, 'agent-models.retired-1-2', 'x'), 'x');
  const lookalikes = ['agent-models.retired-manual-backup', 'agent-models.retired-123', 'agent-models.retired-1-2-x'];
  for (const name of lookalikes) {
    fs.mkdirSync(path.join(h.mods, name), { recursive: true });
    fs.writeFileSync(path.join(h.mods, name, 'keep.txt'), 'keep');
  }
  const target = path.join(h.root, 'keep');
  fs.mkdirSync(target);
  fs.writeFileSync(path.join(target, 'f'), 'x');
  const linked = symlinkOrSkip(t, target, path.join(h.mods, 'agent-models.retired-9-9'));
  fs.writeFileSync(h.oldManifest, '{}');
  fs.writeFileSync(h.oldReported, '{}');
  const result = h.step();
  assert.deepEqual([result.action, h.linesOf(result)], ['removed', [LINES.removed()]]);
  assert.equal(fs.existsSync(path.join(h.mods, 'agent-models.retired-1-2')), false);
  for (const name of lookalikes) assert.equal(fs.readFileSync(path.join(h.mods, name, 'keep.txt'), 'utf8'), 'keep', `${name} survives: it is not the step's own aside`);
  assert.equal(fs.existsSync(h.oldManifest), false);
  assert.equal(fs.existsSync(h.oldReported), false);
  if (linked) {
    assert.equal(fs.lstatSync(path.join(h.mods, 'agent-models.retired-9-9')).isSymbolicLink(), true);
    assert.deepEqual(fs.readdirSync(target), ['f']);
  }
});

test('step 2 with the remove seam failing: no throw, the folder stays renamed aside for the sweep, and the next start finishes it', t => {
  const h = sandbox(t);
  h.reg();
  h.old('1.4.0');
  h.engine('1.6.0');
  h.retired(at(-25), '1.6.0');
  const result = h.step({ remove: () => { throw Object.assign(new Error('boom'), { code: 'EBUSY' }); } });
  assert.equal(result.action, 'refused', 'the folder was not deleted: "removed" is not said, the failure is');
  assert.deepEqual(h.linesOf(result), [LINES.notRemoved(LINES.deleteFailed('EBUSY'))]);
  assert.equal(fs.existsSync(h.oldFolder), false, 'renamed aside');
  assert.equal(h.readSettings().env?.CLAUDE_CODE_PLUGIN_DIRS, undefined, 'the entry went');
  assert.equal(names(h.mods).some(n => n.includes('agent-models.retired-')), true);
  const next = h.step();
  assert.deepEqual(names(h.mods).filter(n => n.includes('agent-models.retired-')), []);
  assert.deepEqual([next.action, h.linesOf(next)], ['removed', [LINES.removed()]]);
  assert.equal(fs.existsSync(h.oldManifest), false);
});

test('step 2 with a delete that fails and no entry to remove: only the failure is said, once; the sweep of the next starts retries until it deletes, and then says removed', t => {
  const h = sandbox(t);
  h.reg();
  h.old('1.4.0', { variable: false });
  h.engine('1.6.0');
  h.retired(at(-25), '1.6.0');
  const failing = { remove: () => { throw Object.assign(new Error('boom'), { code: 'EACCES' }); } };
  const first = h.step(failing);
  assert.deepEqual([first.action, h.linesOf(first)], ['refused', [LINES.notRemoved(LINES.deleteFailed('EACCES'))]]);
  assert.ok(!h.linesOf(first).includes(LINES.removed()));
  assert.equal(names(h.mods).some(n => n.includes('agent-models.retired-')), true, 'the folder stays aside');
  assert.deepEqual(silent(h.step(failing)), ['none', ''], 'said once while it holds');
  const done = h.step();
  assert.deepEqual([done.action, h.linesOf(done)], ['removed', [LINES.removed()]]);
  assert.deepEqual(names(h.mods).filter(n => n.includes('agent-models.retired-')), []);
  assert.deepEqual(Object.keys(stateOf(h).said ?? {}), [], 'the failure is no longer live: its record is pruned');
});

test('S4 with two starts at once: the other start took the folder between the read and the rename (ENOENT): no refusal and no line; nothing of the old copy is left', t => {
  const h = sandbox(t);
  h.reg();
  h.old('1.4.0', { variable: false });
  h.engine('1.6.0');
  h.retired(at(-25), '1.6.0');
  const result = h.step({ beforeRename: () => { fs.rmSync(h.oldFolder, { recursive: true }); fs.rmSync(h.oldManifest); } });
  assert.deepEqual(silent(result), ['none', ''], 'no "NOT removed", no "removed"');
  assert.equal(fs.existsSync(h.oldFolder), false);
  assert.deepEqual(names(h.mods).filter(n => n.includes('agent-models.retired-')), []);
  assert.deepEqual(silent(h.step()), ['none', '']);
});

test('ensureModsMarketplace never throws: a home that is a file, or holds an impossible path, answers with a result', t => {
  const h = sandbox(t);
  const file = path.join(h.root, 'a-file');
  fs.writeFileSync(file, 'x');
  for (const home of [file, '\0bad', path.join(file, 'deeper')]) {
    const result = ensureModsMarketplace({ home, env: {} });
    assert.equal(typeof result.action, 'string', home);
    assert.equal(typeof result.line, 'string', home);
  }
  assert.equal(fs.readFileSync(file, 'utf8'), 'x');
  const clock = ensureModsMarketplace({ home: h.home, env: {}, now: () => { throw new Error('the clock failed'); } });
  assert.equal(clock.action, 'refused', 'an error nobody foresaw is a refusal, not a throw');
  assert.equal(fs.existsSync(h.settings), false);
});

test('an error nobody foresaw is the neutral "could not run" line with its code, as the hook says it when the lib does not load; it never says the marketplace is not registered', t => {
  const h = sandbox(t);
  const clock = ensureModsMarketplace({ home: h.home, env: {}, now: () => { throw Object.assign(new Error('the clock failed'), { code: 'EBOOM' }); } });
  assert.deepEqual([clock.action, clock.line, clock.lines], ['refused', 'agent-models: the dew-flow-mods step could not run (EBOOM)', ['agent-models: the dew-flow-mods step could not run (EBOOM)']]);
  assert.equal(clock.line, LINES.couldNotRun('EBOOM'));
  assert.ok(!/NOT registered|unexpected/.test(clock.line), clock.line);
  const noCode = ensureModsMarketplace({ home: h.home, env: {}, now: () => { throw new Error('the clock failed'); } });
  assert.equal(noCode.line, 'agent-models: the dew-flow-mods step could not run (the clock failed)', 'a code-less error names its message');
});

test('the step reads the tombstone by an exclusive create: a taken marker name is never replaced (a person\'s file that appeared with the engine\'s record)', t => {
  const h = sandbox(t);
  h.reg();
  h.engine('1.6.0');
  fs.mkdirSync(h.mods, { recursive: true });
  fs.writeFileSync(h.optout, String(tombstoneBytes(at(-5))));
  const marker = fs.readFileSync(h.optout);
  h.step();
  assert.deepEqual(fs.readFileSync(h.optout), marker, 'our own earlier tombstone is not rewritten');
  assert.equal(h.readSettings().enabledPlugins[INLINE_ID], false, 'the switch is still written (a start after a kill at the tombstone)');
});

// ---------------------------------------------------------------------------------------------------------------------
// T1: no child process, no network, no timer; the work stays small
// ---------------------------------------------------------------------------------------------------------------------

const FORBIDDEN = [/node:child_process/, /node:net\b/, /node:https?\b/, /node:dns/, /node:worker_threads/, /\bfetch\(/, /\bsetTimeout\b/, /\bsetInterval\b/];
const forbiddenIn = text => FORBIDDEN.filter(re => re.test(text)).map(re => re.source);

test('T1 (a): the lib imports no child process, network, worker or timer; the scan finds a planted one of each', () => {
  assert.deepEqual(forbiddenIn(LIB_TEXT), []);
  for (const planted of ["import cp from 'node:child_process';", "import net from 'node:net';", "import h from 'node:https';", "import d from 'node:dns';", "import w from 'node:worker_threads';", 'await fetch(url);', 'setTimeout(f, 1);', 'setInterval(f, 1);']) {
    assert.equal(forbiddenIn(planted).length, 1, planted);
  }
  assert.ok(LIB_TEXT.length > 1000, 'the lib text is real, not a stub');
});

test('T1 (b): step 2 on a folder of 40 files and 400 KB, in process, takes under one second', t => {
  const h = sandbox(t);
  h.reg();
  h.old('1.4.0');
  fs.mkdirSync(path.join(h.oldFolder, '.claude-plugin', 'types'), { recursive: true });
  for (let n = 0; n < 40; n += 1) fs.writeFileSync(path.join(h.oldFolder, '.claude-plugin', 'types', `bulk-${n}.bin`), Buffer.alloc(10 * 1024, n));
  h.engine('1.6.0');
  h.retired(at(-25), '1.6.0');
  const started = performance.now();
  const result = h.step();
  const ms = performance.now() - started;
  assert.equal(result.action, 'removed');
  assert.equal(fs.existsSync(h.oldFolder), false);
  assert.ok(ms < 1000, `${ms.toFixed(0)} ms`);
});

// ---------------------------------------------------------------------------------------------------------------------
// A3: the adapter constraint and the one road to settings.json
// ---------------------------------------------------------------------------------------------------------------------

const specifiersOf = text => [
  ...text.matchAll(/^(?:import|export)\b[^;]*?\bfrom\s+['"]([^'"]+)['"]/gm),
  ...text.matchAll(/^import\s+['"]([^'"]+)['"]/gm),
  ...text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g),
].map(m => m[1]);

const namedImports = text => [...text.matchAll(/^import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/gm)].map(m => ({
  names: m[1].split(',').map(part => part.trim().split(/\s+as\s+/)[0]).filter(Boolean),
  from: m[2],
}));

const declaredFunctions = text => [
  ...[...text.matchAll(/^(?:export\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/gm)].map(m => m[1]),
  ...[...text.matchAll(/^(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\b|[A-Za-z_$][\w$]*\s*=>|\()/gm)].map(m => m[1]),
];

/** Every call a pattern opens (it ends at the `(`): `{ name, args, line }`, the argument text to the matching `)`, across lines. */
function callsOf(text, pattern) {
  const calls = [];
  for (const m of text.matchAll(pattern)) {
    const open = m.index + m[0].length;
    let depth = 1;
    let end = open;
    while (end < text.length && depth > 0) {
      if (text[end] === '(') depth += 1;
      else if (text[end] === ')') depth -= 1;
      end += 1;
    }
    calls.push({ name: m[0].slice(0, -1), args: text.slice(open, end - 1), line: text.slice(0, m.index).split('\n').length });
  }
  return calls;
}

/** The calls that write or remove a file by a node API or the guard's `writeAtomic`, with `settings` in their arguments. */
const WRITERS = /(?<![\w$.])(?<!function\s)(?:writeAtomic|fs\.(?:writeFileSync|appendFileSync|renameSync|rmSync|unlinkSync|copyFileSync|linkSync|writeSync|truncateSync|symlinkSync))\(/g;
const settingsWrites = (name, text) => callsOf(text, WRITERS)
  .filter(call => /settings/i.test(call.args))
  .map(call => `${name}:${call.line} ${call.name}(${call.args.replace(/\s+/g, ' ').trim()}) names settings`);
const commitCalls = text => callsOf(text, /(?<![\w$.])(?<!function\s)commitSettings\(/g);

test('A3 (a): every specifier of the lib is node:* or ./user-guard-install.mjs, every imported name is an export of the guard core, and the lib names no real home or environment of its own', () => {
  const found = specifiersOf(LIB_TEXT);
  assert.ok(found.some(spec => spec.startsWith('node:')), 'the scan finds a node: import');
  assert.ok(found.includes('./user-guard-install.mjs'), 'the scan finds the guard import');
  for (const spec of found) assert.match(spec, /^node:|^\.\/user-guard-install\.mjs$/, spec);
  for (const spec of found.filter(s => s.startsWith('node:'))) assert.ok(['node:crypto', 'node:fs', 'node:path', 'node:process'].includes(spec), spec);
  const guardNames = Object.keys(guard);
  for (const { names: imported, from } of namedImports(LIB_TEXT)) {
    if (from !== './user-guard-install.mjs') continue;
    for (const name of imported) assert.ok(guardNames.includes(name), `${name} is exported by the guard core`);
  }
  assert.doesNotMatch(LIB_TEXT, /process\.env/, 'the environment is a parameter');
  assert.doesNotMatch(LIB_TEXT, /homedir|node:os/, 'the home is a parameter; the lib cannot reach the real one');
  assert.deepEqual(specifiersOf("import a from 'node:fs';\nimport { b } from './x.mjs';\nexport { c } from './y.mjs';\nconst d = await import('./z.mjs');"), ['node:fs', './x.mjs', './y.mjs', './z.mjs']);
});

test('A3 (b): the lib declares no function the guard core exports (one body per helper)', () => {
  const guardFunctions = new Set(Object.keys(guard).filter(name => typeof guard[name] === 'function'));
  assert.deepEqual(declaredFunctions(LIB_TEXT).filter(name => guardFunctions.has(name)), []);
  assert.ok(declaredFunctions(fs.readFileSync(GUARD_FILE, 'utf8')).includes('lstatOrNull'), 'the declaration scan finds a known function of the guard core');
  assert.deepEqual(declaredFunctions('function lstatOrNull() {}\nconst x = 1;'), ['lstatOrNull']);
});

test('A3 (c): settings.json reaches disk only through commitSettings: no write call names settings, the lib imports commitSettings, and the scans find a planted instance', () => {
  assert.deepEqual(settingsWrites('mods-marketplace.mjs', LIB_TEXT), []);
  const imported = namedImports(LIB_TEXT).filter(i => i.from === './user-guard-install.mjs').flatMap(i => i.names);
  assert.ok(imported.includes('commitSettings'));
  assert.ok(imported.includes('settingsFileOf'));
  assert.ok(commitCalls(LIB_TEXT).length >= 1, 'the road is called');
  for (const call of commitCalls(LIB_TEXT)) assert.match(call.args, /\breplace: false\b/, 'a creation never replaces a file that appeared');
  const planted = 'function sneak(p) {\n  writeAtomic(\n    p.settings,\n    bytes);\n  fs.rmSync(settingsFile);\n  fs.writeFileSync(path.join(h, ".claude", "Settings.json"), x);\n}\nwriteAtomic(p.state, y);\n';
  assert.deepEqual(settingsWrites('planted.mjs', planted).length, 3);
  assert.deepEqual(settingsWrites('x.mjs', 'export function writeAtomic(dest, data, settings) {}\nfs.other(settings);\nwriteAtomic(p.optout, z);\n'), []);
  assert.equal(commitCalls('const done = commitSettings({ a, replace: false });').length, 1);
});
