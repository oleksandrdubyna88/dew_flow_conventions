/**
 * The agent-models installer's pure decisions (`settings/hooks/lib/agent-models-decide.mjs`, imported from it
 * directly): the version arithmetic, `decideCopy`, `manifestMatches`, `decideRegistration`,
 * `withPluginDir`. No file is read; the on-disk tests are in `agent-models-swap.test.mjs` and
 * `agent-models-install.test.mjs`, which share `tools/lib/agent-models-fixtures.mjs`.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import * as mod from '../settings/hooks/lib/agent-models-decide.mjs';
import * as guard from '../settings/hooks/lib/user-guard-install.mjs';
import {
  fixtureBytes, goodManifest, FILES, D, sha,
} from './lib/agent-models-fixtures.mjs';

/** The files a 1.2.x install did not have: the ones introduced at 1.3.0. */
const LATER = ['hooks/tasks.tsx', 'hooks/limits.tsx'];

// ---------------------------------------------------------------------------------------------------------------------
// 4.1 pure decisions
// ---------------------------------------------------------------------------------------------------------------------

test('modTargets names every path the module may touch, the manifest a sibling of the target; MOD_FILES is the seven files, INTRODUCED names the release of the sixth and the seventh', () => {
  const home = path.resolve('/h');
  const t = mod.modTargets(home);
  assert.deepEqual(t, {
    mods: path.join(home, '.claude', 'mods'),
    target: path.join(home, '.claude', 'mods', 'agent-models'),
    manifest: path.join(home, '.claude', 'mods', 'agent-models.installed.json'),
    optout: path.join(home, '.claude', 'mods', 'agent-models.optout'),
    settings: path.join(home, '.claude', 'settings.json'),
  });
  assert.equal(t.settings, guard.targets(home).settings);
  assert.deepEqual([...mod.MOD_FILES], FILES);
  assert.equal(Object.isFrozen(mod.MOD_FILES), true);
  assert.equal(FILES.length, 7);
  assert.equal(FILES[FILES.indexOf('hooks/prompts.ts') + 1], 'hooks/tasks.tsx');
  assert.equal(FILES[FILES.indexOf('hooks/tasks.tsx') + 1], 'hooks/limits.tsx');
  assert.deepEqual(mod.INTRODUCED, { 'hooks/tasks.tsx': [1, 3, 0], 'hooks/limits.tsx': [1, 3, 0] });
  assert.equal(Object.isFrozen(mod.INTRODUCED), true);
  for (const rel of LATER) assert.equal(Object.isFrozen(mod.INTRODUCED[rel]), true);
});

test('parseVersion reads MAJOR.MINOR.PATCH digits only and nothing else', () => {
  assert.deepEqual(mod.parseVersion('1.2.3'), [1, 2, 3]);
  assert.deepEqual(mod.parseVersion('01.2.3'), [1, 2, 3]);
  for (const bad of ['1.2', '1.2.3-beta', 'v1.2.3', ' 1.2.3', '1.2.3.4', '', null, 12, undefined]) {
    assert.equal(mod.parseVersion(bad), null, `parseVersion(${JSON.stringify(bad)})`);
  }
});

test('compareVersions is numeric, not lexical', () => {
  assert.equal(mod.compareVersions([1, 10, 0], [1, 9, 9]), 1);
  assert.equal(mod.compareVersions([1, 10, 0], [1, 9, 0]), 1);
  assert.equal(mod.compareVersions([0, 0, 0], [0, 0, 1]), -1);
  assert.equal(mod.compareVersions([2, 0, 0], [2, 0, 0]), 0);
});

test('versionOf parses plugin.json as JSON and falls back to 0.0.0 for everything unusable', () => {
  assert.deepEqual(mod.versionOf(null), [0, 0, 0]);
  assert.deepEqual(mod.versionOf(Buffer.from('{')), [0, 0, 0]);
  assert.deepEqual(mod.versionOf(Buffer.from('[]')), [0, 0, 0]);
  assert.deepEqual(mod.versionOf(Buffer.from('{"version":"x"}')), [0, 0, 0]);
  assert.deepEqual(mod.versionOf(Buffer.from('{"version":2}')), [0, 0, 0]);
  assert.deepEqual(mod.versionOf(Buffer.from('{"version":"2.0.0"}')), [2, 0, 0]);
});

const srcOk = (version = [1, 2, 3]) => ({
  version,
  files: new Map(FILES.map(rel => [rel, fixtureBytes(rel, version.join('.'))])),
});
const dirState = ({ version = [1, 2, 3], files, manifest = undefined } = {}) => {
  const map = files ?? srcOk(version).files;
  return {
    kind: 'dir', path: '/t', version, files: map,
    manifest: manifest === undefined ? goodManifest(version.join('.'), Object.fromEntries(srcOk(version).files)) : manifest,
  };
};

test('decideCopy: a bad source refuses before the target is looked at', () => {
  const poisoned = { get kind() { throw new Error('the target was read'); } };
  assert.deepEqual(mod.decideCopy({ error: 'source is bad' }, poisoned), { action: 'refuse', reason: 'source is bad' });
});

test('decideCopy: a missing target installs; a symlink, a non-directory and a foreign one refuse with their exact reason', () => {
  assert.equal(mod.decideCopy(srcOk(), { kind: 'missing', path: '/t' }).action, 'install');
  assert.deepEqual(mod.decideCopy(srcOk(), { kind: 'symlink', path: '/t' }),
    { action: 'refuse', reason: '/t is a symlink; it is never renamed aside or deleted through' });
  assert.deepEqual(mod.decideCopy(srcOk(), { kind: 'other', path: '/t' }), { action: 'refuse', reason: '/t is not a directory' });
  assert.deepEqual(mod.decideCopy(srcOk(), { kind: 'foreign', path: '/t', uid: 7 }),
    { action: 'refuse', reason: '/t is owned by another user (uid 7)' });
});

test('decideCopy: an older copy upgrades, and `keep` is set whenever its manifest is missing or no longer matches (A3)', () => {
  const old = [1, 0, 0];
  assert.deepEqual(mod.decideCopy(srcOk(), dirState({ version: old })), { action: 'upgrade', keep: false });
  const changed = new Map(srcOk(old).files).set('hooks/register.tsx', Buffer.from('edited'));
  const stale = dirState({ version: old, files: changed, manifest: goodManifest('1.0.0', Object.fromEntries(srcOk(old).files)) });
  assert.deepEqual(mod.decideCopy(srcOk(), stale), { action: 'upgrade', keep: true });
  assert.deepEqual(mod.decideCopy(srcOk(), dirState({ version: old, manifest: null })), { action: 'upgrade', keep: true });
});

test('decideCopy: an equal copy is none, manifest (repair) or edited; a newer one is left', () => {
  assert.equal(mod.decideCopy(srcOk(), dirState()).action, 'none');
  assert.equal(mod.decideCopy(srcOk(), dirState({ manifest: null })).action, 'manifest');
  const extraKey = goodManifest('1.2.3', Object.fromEntries(srcOk().files));
  extraKey.sha256['extra.txt'] = 'abc';
  assert.equal(mod.decideCopy(srcOk(), dirState({ manifest: extraKey })).action, 'manifest');
  const oneByte = new Map(srcOk().files).set('hooks/prompts.ts', Buffer.from('different'));
  assert.equal(mod.decideCopy(srcOk(), dirState({ files: oneByte })).action, 'edited');
  const gone = new Map(srcOk().files).set('types/index.d.ts', null);
  assert.equal(mod.decideCopy(srcOk(), dirState({ files: gone })).action, 'edited');
  assert.equal(mod.decideCopy(srcOk(), dirState({ version: [2, 0, 0] })).action, 'newer');
});

test('decideCopy: an equal copy that differs from the source but matches its own manifest is `other-checkout`, never `edited` (A1.1)', () => {
  const otherBytes = new Map(srcOk().files).set('hooks/prompts.ts', Buffer.from('another checkout at the same version'));
  const own = goodManifest('1.2.3', Object.fromEntries(otherBytes));
  assert.deepEqual(mod.decideCopy(srcOk(), dirState({ files: otherBytes, manifest: own })), { action: 'other-checkout' });
  assert.equal(mod.decideCopy(srcOk(), dirState({ files: otherBytes, manifest: null })).action, 'edited', 'no record: edited');
  const staleRecord = goodManifest('1.2.3', Object.fromEntries(srcOk().files));
  assert.equal(mod.decideCopy(srcOk(), dirState({ files: otherBytes, manifest: staleRecord })).action, 'edited', 'a record of other bytes: edited');
});

/** What a 1.2.x install wrote: the five older files, a five-key manifest. */
const fiveOf = version => {
  const files = srcOk(version).files;
  const manifest = goodManifest(version.join('.'), Object.fromEntries(files));
  for (const rel of LATER) {
    delete manifest.sha256[rel];
    files.set(rel, null);
  }
  return { files, manifest };
};

test('I2: a 1.2.2 copy of the five older files with a manifest naming those five upgrades without `keep` (the sixth and seventh files did not exist yet)', () => {
  const old = fiveOf([1, 2, 2]);
  assert.deepEqual(Object.keys(old.manifest.sha256), FILES.filter(rel => !LATER.includes(rel)));
  assert.deepEqual(mod.decideCopy(srcOk([1, 3, 0]), dirState({ version: [1, 2, 2], ...old })), { action: 'upgrade', keep: false });
});

for (const rel of LATER) {
  test(`I3: the same five-key manifest while the target ALSO holds a regular ${rel} is not vouched for: \`keep\``, () => {
    const old = fiveOf([1, 2, 2]);
    old.files.set(rel, Buffer.from('somebody put this here'));
    assert.deepEqual(mod.decideCopy(srcOk([1, 3, 0]), dirState({ version: [1, 2, 2], ...old })), { action: 'upgrade', keep: true });
  });
}

test('I4: a 1.3.0 manifest that lacks the files introduced AT 1.3.0 does not vouch for a 1.3.0 target that lacks them either', () => {
  const lacking = fiveOf([1, 3, 0]);
  assert.equal(mod.manifestMatches(lacking.manifest, lacking.files, [1, 3, 0]), false);
  const action = mod.decideCopy(srcOk([1, 3, 0]), dirState({ version: [1, 3, 0], ...lacking })).action;
  assert.ok(action !== 'none' && action !== 'other-checkout', `got ${action}`);
});

test('manifestMatches: a five-key manifest vouches below the release that introduced the later files and only while the target lacks them', () => {
  const old = fiveOf([1, 2, 2]);
  assert.equal(mod.manifestMatches(old.manifest, old.files, [1, 2, 2]), true);
  for (const rel of LATER) {
    const held = new Map(old.files).set(rel, Buffer.from('x'));
    assert.equal(mod.manifestMatches(old.manifest, held, [1, 2, 2]), false, `the target holds ${rel}, which the manifest does not name`);
  }
  const alien = structuredClone(old.manifest);
  alien.sha256['somewhere/else.txt'] = 'x';
  assert.equal(mod.manifestMatches(alien, old.files, [1, 2, 2]), false, 'a key outside MOD_FILES');
  const atRelease = fiveOf([1, 3, 0]);
  assert.equal(mod.manifestMatches(atRelease.manifest, atRelease.files, [1, 3, 0]), false, 'at the release, five keys no longer suffice');
});

test('manifestMatches vouches for exactly these files at exactly this version', () => {
  const files = srcOk().files;
  const good = goodManifest('1.2.3', Object.fromEntries(files));
  const v = [1, 2, 3];
  assert.equal(mod.manifestMatches(good, files, v), true);
  assert.equal(mod.manifestMatches({ ...good, version: '1.2.4' }, files, v), false, 'version differs');
  const missing = structuredClone(good);
  delete missing.sha256['hooks/hooks.json'];
  assert.equal(mod.manifestMatches(missing, files, v), false, 'a key is missing');
  const extra = structuredClone(good);
  extra.sha256['extra'] = 'x';
  assert.equal(mod.manifestMatches(extra, files, v), false, 'a key is extra');
  const wrongHash = structuredClone(good);
  wrongHash.sha256['hooks/hooks.json'] = '0'.repeat(64);
  assert.equal(mod.manifestMatches(wrongHash, files, v), false, 'a hash differs');
  assert.equal(mod.manifestMatches({ ...good, sha256: [] }, files, v), false, 'sha256 is an array');
  assert.equal(mod.manifestMatches(null, files, v), false, 'no manifest');
  const nulled = new Map(files).set('hooks/hooks.json', null);
  assert.equal(mod.manifestMatches(good, nulled, v), false, 'a file read as null');
});

const HOME = path.resolve('/home/x');
const TARGET = path.join(HOME, '.claude', 'mods', 'agent-models');
const SETTINGS = path.join(HOME, '.claude', 'settings.json');
const parsed = settings => ({ settings });

test('decideRegistration: refusals name the settings path and the shape problem', () => {
  assert.deepEqual(mod.decideRegistration({ error: 'is not a JSON object' }, TARGET, HOME), { action: 'refuse', reason: `${SETTINGS} is not a JSON object`, retry: false });
  for (const env of [[], 'x', null]) {
    assert.deepEqual(mod.decideRegistration(parsed({ env }), TARGET, HOME), { action: 'refuse', reason: `${SETTINGS}: env is not an object`, retry: false }, JSON.stringify(env));
  }
  assert.deepEqual(mod.decideRegistration(parsed({ env: { CLAUDE_CODE_PLUGIN_DIRS: ['/a'] } }), TARGET, HOME),
    { action: 'refuse', reason: `${SETTINGS}: env.CLAUDE_CODE_PLUGIN_DIRS is not a string`, retry: false });
});

test('decideRegistration: a missing file is parseSettings(null), and is decided exactly as the file {} — the session entries first, then the target', () => {
  const missing = mod.decideRegistration(guard.parseSettings(null), TARGET, HOME, `/a${D}/b`);
  assert.deepEqual(missing, { action: 'append', next: { env: { CLAUDE_CODE_PLUGIN_DIRS: `/a${D}/b${D}${TARGET}` } }, carried: 2 });
  assert.deepEqual(missing, mod.decideRegistration(parsed({}), TARGET, HOME, `/a${D}/b`));
});

test('decideRegistration: appends when the entry is absent, keeps the other entries verbatim, and finds ours in every spelling', () => {
  const absent = mod.decideRegistration(parsed({ model: 'm' }), TARGET, HOME);
  assert.equal(absent.action, 'append');
  assert.deepEqual(absent.next, { model: 'm', env: { CLAUDE_CODE_PLUGIN_DIRS: TARGET } });
  assert.deepEqual(mod.decideRegistration(parsed({ env: {} }), TARGET, HOME).next, { env: { CLAUDE_CODE_PLUGIN_DIRS: TARGET } });
  assert.deepEqual(mod.decideRegistration(parsed({ env: { CLAUDE_CODE_PLUGIN_DIRS: '' } }), TARGET, HOME).next, { env: { CLAUDE_CODE_PLUGIN_DIRS: TARGET } });
  const others = ` /a/${D}/b `;
  assert.deepEqual(mod.decideRegistration(parsed({ env: { CLAUDE_CODE_PLUGIN_DIRS: others } }), TARGET, HOME).next,
    { env: { CLAUDE_CODE_PLUGIN_DIRS: others + D + TARGET } }, 'other entries stay byte-for-byte, trimming included');
  assert.equal(mod.decideRegistration(parsed({ env: { CLAUDE_CODE_PLUGIN_DIRS: '/other/agent-models' } }), TARGET, HOME).action, 'append');
  for (const spelled of [TARGET, `/a${D}${TARGET}`, `${TARGET}${D}/b`, '~/.claude/mods/agent-models', TARGET + path.sep]) {
    assert.deepEqual(mod.decideRegistration(parsed({ env: { CLAUDE_CODE_PLUGIN_DIRS: spelled } }), TARGET, HOME), { action: 'none' }, spelled);
  }
});

test('withPluginDir never mutates its input, keeps key order, and its output re-decides as none', () => {
  const input = { model: 'm', env: { A: '1' }, hooks: {} };
  const before = structuredClone(input);
  const out = mod.withPluginDir(input, TARGET);
  assert.deepEqual(input, before);
  assert.deepEqual(Object.keys(out), ['model', 'env', 'hooks']);
  assert.deepEqual(Object.keys(out.env), ['A', 'CLAUDE_CODE_PLUGIN_DIRS']);
  assert.deepEqual(Object.keys(mod.withPluginDir({ model: 'm' }, TARGET)), ['model', 'env']);
  assert.deepEqual(mod.decideRegistration(parsed(out), TARGET, HOME), { action: 'none' });
});

// 4.1b the carry-over of the session's own plugin dirs (A4)

const carried = (settings, inherited) => mod.decideRegistration(parsed(settings), TARGET, HOME, inherited);
const dirsOf = decision => decision.next.env.CLAUDE_CODE_PLUGIN_DIRS;

test('4a: with no settings value the inherited entries come first, deduplicated, `~/x` verbatim, empties dropped, and are counted', () => {
  const decision = carried({}, `/a${D}/b${D}/a${D}~/c${D}`);
  assert.equal(decision.action, 'append');
  assert.equal(dirsOf(decision), ['/a', '/b', '~/c', TARGET].join(D));
  assert.equal(decision.carried, 3);
});

test('4a: an inherited entry that is our target (in any spelling) is dropped, not carried', () => {
  const decision = carried({}, `/a${D}~/.claude/mods/agent-models${D}${TARGET}`);
  assert.equal(dirsOf(decision), `/a${D}${TARGET}`);
  assert.equal(decision.carried, 1);
});

test('4b: a non-empty settings value is only appended to; the inherited entries are not read', () => {
  const decision = carried({ env: { CLAUDE_CODE_PLUGIN_DIRS: '/x' } }, '/a');
  assert.equal(dirsOf(decision), `/x${D}${TARGET}`);
  assert.equal(decision.carried ?? 0, 0);
});

test('4c: a settings key of "" carries the inherited entries', () => {
  const decision = carried({ env: { CLAUDE_CODE_PLUGIN_DIRS: '' } }, '/a');
  assert.equal(dirsOf(decision), `/a${D}${TARGET}`);
  assert.equal(decision.carried, 1);
});

test('4d: no inherited value is today\'s behaviour: the target alone, nothing carried', () => {
  for (const inherited of [undefined, '', `${D}${D}`]) {
    const decision = carried({ env: {} }, inherited);
    assert.equal(dirsOf(decision), TARGET, JSON.stringify(inherited));
    assert.equal(decision.carried ?? 0, 0);
  }
});

test('4e: an inherited path that does not exist is kept: the engine skips a missing entry, and the path may only be absent now', () => {
  assert.equal(dirsOf(carried({}, '/does/not/exist')), `/does/not/exist${D}${TARGET}`);
});

test('the carried value re-decides as `none`, and the decision does not mutate its input', () => {
  const input = { model: 'm' };
  const before = structuredClone(input);
  const decision = carried(input, '/a');
  assert.deepEqual(input, before);
  assert.deepEqual(mod.decideRegistration(parsed(decision.next), TARGET, HOME, '/zzz'), { action: 'none' });
});

// 4.1c the report key, the leftover stamp, the replaced-folder stamp (A1.2, A2, A3)

test('reportKey: <action>:<digest of the MOD_FILES files>:<source version>; a missing file is "-"; a symlink keys on its link text', () => {
  const files = srcOk().files;
  const key = mod.reportKey('edited', { kind: 'dir', files }, [1, 2, 3]);
  const digest = sha(FILES.map(rel => sha(files.get(rel))).join('\n'));
  assert.equal(key, `edited:${digest}:1.2.3`);
  const gone = new Map(files).set('types/index.d.ts', null);
  assert.equal(mod.reportKey('edited', { kind: 'dir', files: gone }, [1, 2, 3]), `edited:${sha([...FILES.slice(0, -1).map(rel => sha(files.get(rel))), '-'].join('\n'))}:1.2.3`);
  assert.notEqual(mod.reportKey('newer', { kind: 'dir', files }, [1, 2, 3]), key, 'the action is part of the key');
  assert.notEqual(mod.reportKey('edited', { kind: 'dir', files }, [1, 2, 4]), key, 'the source version is part of the key');
  assert.equal(mod.reportKey('refuse', { kind: 'symlink', link: '/real' }, [1, 2, 3]), 'symlink:/real:1.2.3');
});

test('leftoverStamp reads the clock out of a staging or aside name, and answers null for every other spelling', () => {
  assert.equal(mod.leftoverStamp('agent-models.staging-1762732800000-4242-a1b2c3d4'), 1762732800000);
  assert.equal(mod.leftoverStamp('agent-models.aside-1762732800000-4242-a1b2c3d4'), 1762732800000);
  for (const name of ['agent-models.aside-x', 'agent-models.aside-1-deadbeef', 'agent-models.staging-', 'other.aside-1-2-ab', 'agent-models.replaced-20261110T000000000Z']) {
    assert.equal(mod.leftoverStamp(name), null, name);
  }
});

test('replacedStamp is UTC YYYYMMDDTHHmmssSSSZ', () => {
  assert.equal(mod.replacedStamp(new Date('2026-11-10T01:02:03.004Z')), '20261110T010203004Z');
});

test('parseJsonObject drops one leading byte order mark and parses the object, and answers null for a JSON value that is not an object', () => {
  assert.deepEqual(mod.parseJsonObject(Buffer.from('\uFEFF{"a":1}')), { a: 1 });
  assert.deepEqual(mod.parseJsonObject(Buffer.from('{"a":1}')), { a: 1 });
  assert.equal(mod.parseJsonObject(Buffer.from('\uFEFF[1]')), null);
});
