/**
 * The agent-models installer's swap and leftovers (`settings/hooks/lib/agent-models-swap.mjs`): the rename swap and its
 * failure points (F1-F3), the manifest write, and `reconcile` alone, all on disk in TEMPORARY HOMES made by `ownedDir`
 * (through `tools/lib/agent-models-fixtures.mjs`) — never `os.homedir()`, never the real ~/.claude.
 *
 * Not tested directly, on purpose: step S4 failing (an aside that cannot be removed). There is no portable way to make a
 * folder undeletable without root. The tolerance is covered by "an old aside beside a current target is reconcile's"
 * (interrupted after the swap, before the aside was dropped).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import * as mod from '../settings/hooks/lib/agent-models-install.mjs';
import { leftoverStamp } from '../settings/hooks/lib/agent-models-decide.mjs';
import {
  IS_ROOT, installedLine, notInstalled, escaped, writeTree, snapshot, treeFiles, sandbox, symlinkOrSkip, renameSeam,
  failing, NOTHING_RAN, FILES, NOW, replacedName, upgradedLine, fixtureBytes, goodManifest,
} from './lib/agent-models-fixtures.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// 4.6 the swap and its failure points
// ---------------------------------------------------------------------------------------------------------------------

test('an upgrade renames the target aside, then the staging copy in, under one pid-and-random suffix', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0' });
  const { calls, seam } = renameSeam();
  assert.equal(s.ensure({ rename: seam }).action, 'upgraded');
  assert.equal(calls.length, 2);
  const [[from1, to1], [from2, to2]] = calls;
  assert.equal(from1, s.t_.target);
  assert.equal(path.dirname(to1), s.t_.mods);
  assert.match(path.basename(to1), /^agent-models\.aside-\d+-\d+-[0-9a-f]{8}$/);
  assert.equal(path.dirname(from2), s.t_.mods);
  assert.match(path.basename(from2), /^agent-models\.staging-\d+-\d+-[0-9a-f]{8}$/);
  assert.equal(to2, s.t_.target);
  assert.equal(path.basename(to1).replace('aside-', ''), path.basename(from2).replace('staging-', ''));
  assert.ok(path.basename(to1).includes(`-${process.pid}-`));
  assert.equal(leftoverStamp(path.basename(to1)), NOW.getTime(), 'the stamp is the injected clock at the start of the swap');
  assert.equal(leftoverStamp(path.basename(from2)), NOW.getTime());
});

test('F1: staging cannot be written — refused, no staging left, settings untouched', t => {
  if (IS_ROOT || process.platform === 'win32') return t.skip('permissions do not bind root / Windows');
  const s = sandbox(t);
  s.writeSettings({ model: 'x' });
  fs.mkdirSync(s.t_.mods, { recursive: true });
  fs.chmodSync(s.t_.mods, 0o555);
  try {
    const before = s.readSettings();
    const r = s.ensure();
    assert.equal(r.action, 'refused');
    assert.equal(r.copy, 'refuse');
    assert.match(r.line, new RegExp(`^${escaped(notInstalled('could not stage the copy in '))}${escaped(s.t_.mods)}[\\\\/]agent-models\\.staging-\\d+-\\d+-[0-9a-f]{8} \\(EACCES\\)$`));
    assert.deepEqual(s.listMods(), []);
    assert.equal(s.readSettings(), before);
  } finally {
    fs.chmodSync(s.t_.mods, 0o755);
  }
});

test('F2: the aside rename fails — refused, the old target, its manifest and settings are untouched, nothing is left over', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  const oldFiles = s.seedTarget({ version: '1.0.0' });
  const before = { manifest: s.manifest(), settings: s.readSettings() };
  const { calls, seam } = renameSeam(n => { if (n === 1) throw failing('EPERM'); });
  const r = s.ensure({ rename: seam });
  assert.equal(r.action, 'refused');
  assert.match(r.line, new RegExp(`^${escaped(notInstalled(`could not rename ${s.t_.target} aside to `))}.*agent-models\\.aside-\\d+-\\d+-[0-9a-f]{8} \\(EPERM\\)$`));
  for (const rel of FILES) assert.deepEqual(s.installedBytes(rel), oldFiles[rel], rel);
  assert.deepEqual(s.manifest(), before.manifest);
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json', 'agent-models.reported.json']);
  assert.equal(s.readSettings(), before.settings);
  assert.equal(calls.length, 1);
});

test('F3b: the rename in fails and the rename back works — refused, the old target is back, nothing is left over', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  const oldFiles = s.seedTarget({ version: '1.0.0' });
  const before = { manifest: s.manifest(), settings: s.readSettings() };
  const { seam } = renameSeam(n => { if (n === 2) throw failing('EPERM'); });
  const r = s.ensure({ rename: seam });
  assert.equal(r.action, 'refused');
  assert.match(r.line, new RegExp(`^${escaped(notInstalled('could not rename '))}.*agent-models\\.staging-\\d+-\\d+-[0-9a-f]{8} into place \\(EPERM\\); .*agent-models\\.aside-\\d+-\\d+-[0-9a-f]{8} was renamed back$`));
  for (const rel of FILES) assert.deepEqual(s.installedBytes(rel), oldFiles[rel], rel);
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json', 'agent-models.reported.json']);
  assert.deepEqual(s.manifest(), before.manifest);
  assert.equal(s.readSettings(), before.settings);
});

test('F3b: the rename in AND the rename back fail — the line says rename it back by hand; a start 5 minutes on leaves both, one 11 minutes on cleans up', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0' });
  const settingsBefore = s.readSettings();
  const { seam } = renameSeam(n => { if (n === 2 || n === 3) throw failing('EPERM'); });
  const r = s.ensure({ rename: seam });
  assert.equal(r.action, 'refused');
  assert.match(r.line, new RegExp(`^${escaped(notInstalled('could not rename '))}.*agent-models\\.staging-\\d+-\\d+-[0-9a-f]{8} into place \\(EPERM\\) AND could not rename .*agent-models\\.aside-\\d+-\\d+-[0-9a-f]{8} back to ${escaped(s.t_.target)} \\(EPERM\\); nothing else was touched — rename it back by hand$`));
  const left = s.listMods();
  const aside = left.find(n => n.startsWith('agent-models.aside-'));
  const staging = left.find(n => n.startsWith('agent-models.staging-'));
  assert.ok(aside && staging && !left.includes('agent-models'), left.join(' '));
  assert.deepEqual(treeFiles(path.join(s.t_.mods, aside)), [...FILES].sort());
  assert.equal(JSON.parse(fs.readFileSync(path.join(s.t_.mods, aside, '.claude-plugin', 'plugin.json'), 'utf8')).version, '1.0.0');
  assert.equal(JSON.parse(fs.readFileSync(path.join(s.t_.mods, staging, '.claude-plugin', 'plugin.json'), 'utf8')).version, '1.2.3');
  assert.equal(s.readSettings(), settingsBefore);

  // the interruption after S2: a crashed swap leaves the mod missing for at most LEFTOVER_MIN_AGE_MS. A run 5 minutes on
  // keeps both leftovers (a live session's swap looks the same) and installs a fresh copy beside them
  const second = s.ensure({ now: () => new Date(NOW.getTime() + 5 * 60_000) });
  assert.equal(second.reconcile.restored, null);
  assert.deepEqual([...second.reconcile.skipped].sort(), [path.join(s.t_.mods, aside), path.join(s.t_.mods, staging)].sort());
  assert.deepEqual(second.reconcile.removed, []);
  assert.equal(second.action, 'installed');
  for (const rel of FILES) assert.deepEqual(s.installedBytes(rel), fs.readFileSync(s.sourceFile(rel)), rel);

  // a later run, 11 minutes on, collects both leftovers
  const third = s.ensure({ now: () => new Date(NOW.getTime() + 11 * 60_000) });
  assert.deepEqual([...third.reconcile.removed].sort(), [path.join(s.t_.mods, aside), path.join(s.t_.mods, staging)].sort());
  assert.equal(third.action, 'none');
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json']);
});

test('F3a: another session won the swap — copy is lost, the winner\'s folder stays, our staging and aside are gone, no manifest from us', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0', manifest: null });
  const { seam } = renameSeam((n, from, to) => {
    if (n !== 2) return;
    writeTree(s.t_.target, '1.2.3'); // the other session's complete current copy appears
    fs.renameSync(from, to); // the real rename then fails: the target exists and is not empty
  });
  const r = s.ensure({ rename: seam });
  assert.deepEqual([r.action, r.line, r.copy, r.registration], ['none', '', 'lost', 'none']);
  // the old copy had no manifest, so it was set aside as the user's (A3) and a lost race does not delete what is not ours to delete
  assert.deepEqual(s.listMods(), ['agent-models', replacedName()]);
  for (const rel of FILES) assert.deepEqual(s.installedBytes(rel), fs.readFileSync(s.sourceFile(rel)), rel);
  assert.equal(s.manifest(), null, 'this run did not install, so it wrote no manifest');
  const next = s.ensure();
  assert.deepEqual([next.action, next.copy], ['none', 'manifest']);
  assert.notEqual(s.manifest(), null);
});

test('an install interrupted after the swap leaves an old aside beside a current target: reconcile removes it and the manifest is repaired', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ manifest: null });
  const aside = path.join(s.t_.mods, 'agent-models.aside-1-deadbeef');
  writeTree(aside, '1.0.0');
  const old = new Date(Date.now() - 11 * 60_000);
  fs.utimesSync(aside, old, old);
  const r = s.ensure({ now: () => new Date() });
  assert.equal(r.copy, 'manifest');
  assert.deepEqual(r.reconcile.removed, [aside]);
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json']);
});

test('S5: the manifest cannot be written — the install still counts, and the next run repairs the manifest silently', t => {
  const s = sandbox(t);
  s.writeSettings({});
  fs.mkdirSync(s.t_.mods, { recursive: true });
  const blocker = `${s.t_.manifest}.tmp-${process.pid}`;
  fs.mkdirSync(blocker);
  const r = s.ensure();
  assert.equal(r.action, 'installed');
  assert.equal(r.line, installedLine('1.2.3'));
  assert.deepEqual(treeFiles(s.t_.target), [...FILES].sort());
  assert.equal(s.manifest(), null);
  fs.rmSync(blocker, { recursive: true });
  const next = s.ensure();
  assert.deepEqual([next.action, next.copy], ['none', 'manifest']);
  assert.equal(s.manifest().version, '1.2.3');
});

// ---------------------------------------------------------------------------------------------------------------------
// 4.7 reconcile alone
// ---------------------------------------------------------------------------------------------------------------------

function leftover(s, name, ageMinutes, now) {
  const dir = path.join(s.t_.mods, name);
  writeTree(dir, '1.0.0');
  const when = new Date(now - ageMinutes * 60_000);
  fs.utimesSync(dir, when, when);
  return dir;
}

test('reconcile restores the newest OLD aside when there is no target, removes old leftovers, skips young ones, and touches nothing else', t => {
  const s = sandbox(t);
  const now = Date.now();
  fs.mkdirSync(s.t_.mods, { recursive: true });
  const newest = leftover(s, 'agent-models.aside-1-aaaaaaaa', 15, now);
  const olderAside = leftover(s, 'agent-models.aside-2-bbbbbbbb', 20, now);
  const youngAside = leftover(s, 'agent-models.aside-5-eeeeeeee', 5, now);
  const oldStaging = leftover(s, 'agent-models.staging-3-cccccccc', 11, now);
  const youngStaging = leftover(s, 'agent-models.staging-4-dddddddd', 1, now);
  fs.mkdirSync(path.join(s.t_.mods, 'other-mod'));
  fs.writeFileSync(path.join(s.t_.mods, 'other-mod', 'a.txt'), 'x');
  fs.writeFileSync(path.join(s.t_.mods, 'notes.txt'), 'n');
  const others = snapshot(s.t_.mods);
  for (const k of Object.keys(others)) if (k.startsWith('agent-models.')) delete others[k];
  const r = mod.reconcile(s.t_, { now });
  assert.equal(r.restored, newest);
  assert.deepEqual([...r.removed].sort(), [olderAside, oldStaging].sort());
  assert.deepEqual([...r.skipped].sort(), [youngAside, youngStaging].sort());
  assert.equal(r.refused, null);
  assert.deepEqual(treeFiles(s.t_.target), [...FILES].sort(), 'the newest OLD aside is now the target');
  assert.equal(fs.existsSync(newest), false);
  assert.equal(fs.existsSync(youngAside), true, 'a young aside is never restored and never deleted');
  assert.equal(fs.existsSync(youngStaging), true);
  const after = snapshot(s.t_.mods);
  for (const [k, v] of Object.entries(others)) assert.deepEqual(after[k], v, k);
});

test('reconcile unlinks a symlinked leftover and never goes through it', t => {
  const s = sandbox(t);
  fs.mkdirSync(s.t_.mods, { recursive: true });
  const real = path.join(s.root, 'precious');
  writeTree(real, '1.0.0');
  const link = path.join(s.t_.mods, 'agent-models.staging-1-aaaaaaaa');
  if (!symlinkOrSkip(t, real, link)) return;
  const before = snapshot(real);
  const r = mod.reconcile(s.t_, {});
  assert.equal(fs.existsSync(link) || fs.lstatSync(link, { throwIfNoEntry: false }) !== undefined, false);
  assert.deepEqual(snapshot(real), before);
  assert.equal(r.refused, null);
});

test('reconcile removes a leftover that is a regular file', t => {
  const s = sandbox(t);
  fs.mkdirSync(s.t_.mods, { recursive: true });
  const file = path.join(s.t_.mods, 'agent-models.aside-1-aaaaaaaa');
  fs.writeFileSync(file, 'x');
  const r = mod.reconcile(s.t_, {});
  assert.equal(fs.existsSync(file), false);
  assert.equal(r.refused, null);
});

test('reconcile on a mods folder that does not exist reports nothing and does not create it', t => {
  const s = sandbox(t);
  assert.deepEqual(mod.reconcile(s.t_, {}), NOTHING_RAN);
  assert.equal(fs.existsSync(s.t_.mods), false);
});

test('reconcile leaves a leftover owned by another uid alone and names it as skipped', t => {
  if (process.platform === 'win32' || process.getuid === undefined) return t.skip('no uid on this platform');
  const s = sandbox(t);
  fs.mkdirSync(s.t_.mods, { recursive: true });
  const now = Date.now();
  const dir = leftover(s, 'agent-models.staging-1-aaaaaaaa', 30, now);
  const r = mod.reconcile(s.t_, { now, uid: () => 999999 });
  assert.deepEqual(r.skipped, [dir]);
  assert.deepEqual(r.removed, []);
  assert.equal(fs.existsSync(dir), true);
});

// ---------------------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------------------------
// 4.9 reconcile never takes another session's swap in flight (A2)
// ---------------------------------------------------------------------------------------------------------------------

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const ageDir = (dir, ms) => {
  const when = new Date(Date.now() - ms);
  fs.utimesSync(dir, when, when);
};

/** A swap leftover whose NAME carries the clock `ageMinutes` before `now` (the way `swap` names them). */
function stamped(s, kind, now, ageMinutes, { valid = true } = {}) {
  const dir = path.join(s.t_.mods, `agent-models.${kind}-${now - ageMinutes * MIN}-4242-aaaaaaaa`);
  writeTree(dir, '1.0.0');
  if (!valid) fs.rmSync(path.join(dir, '.claude-plugin', 'plugin.json'));
  return dir;
}

test('2a: a second session\'s reconcile in the middle of our upgrade skips our aside — whatever the age of the OLD target\'s files — and ours completes', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0' });
  ageDir(s.t_.target, 3 * DAY); // a rename keeps the folder's mtime: the aside of a long-installed mod looks days old
  let other;
  let renames = 0;
  const seam = (from, to) => {
    fs.renameSync(from, to);
    renames += 1;
    if (renames === 2) other = mod.reconcile(s.t_, { now: Date.now() }); // staging is in; our S4 (drop the aside) has not run
  };
  const r = s.ensure({ rename: seam, now: () => new Date() });
  assert.equal(r.action, 'upgraded');
  assert.equal(other.removed.length, 0, `the other session removed ${other.removed.join(', ')}`);
  assert.equal(other.skipped.length, 1);
  assert.match(path.basename(other.skipped[0]), /^agent-models\.aside-/);
  assert.equal(other.restored, null);
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json'], 'afterwards no leftover');
});

test('2b: a second session\'s reconcile while our target is aside restores nothing, and our swap completes', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0' });
  ageDir(s.t_.target, 3 * DAY);
  let other;
  let renames = 0;
  const seam = (from, to) => {
    fs.renameSync(from, to);
    renames += 1;
    if (renames === 1) other = mod.reconcile(s.t_, { now: Date.now() }); // the target is aside, the staging not yet in
  };
  const r = s.ensure({ rename: seam, now: () => new Date() });
  assert.equal(other.restored, null, 'a live session\'s upgrade is not rolled back');
  assert.equal(other.skipped.length, 2, 'the aside and the staging');
  assert.equal(r.action, 'upgraded');
  assert.equal(s.installedBytes('.claude-plugin/plugin.json').toString().includes('1.2.3'), true);
});

test('2c: an aside stamped 11 minutes ago with no target and a valid plugin.json is restored; through the step the upgrade then follows', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  fs.mkdirSync(s.t_.mods, { recursive: true });
  const now = NOW.getTime();
  const aside = stamped(s, 'aside', now, 11);
  const r = mod.reconcile(s.t_, { now });
  assert.equal(r.restored, aside);
  assert.deepEqual(r.skipped, []);
  assert.deepEqual(treeFiles(s.t_.target), [...FILES].sort());
  const step = s.ensure(); // 1.0.0 restored (no manifest), the repository has 1.2.3
  assert.equal(step.action, 'upgraded');
});

test('2d: an aside stamped 9 minutes ago with no target is not restored: skipped, and the target stays missing', t => {
  const s = sandbox(t);
  fs.mkdirSync(s.t_.mods, { recursive: true });
  const now = NOW.getTime();
  const aside = stamped(s, 'aside', now, 9);
  const r = mod.reconcile(s.t_, { now });
  assert.equal(r.restored, null);
  assert.deepEqual(r.skipped, [aside]);
  assert.equal(fs.existsSync(s.t_.target), false);
  assert.equal(fs.existsSync(aside), true);
});

test('a leftover stamped in the future is young: skipped, never removed', t => {
  const s = sandbox(t);
  fs.mkdirSync(s.t_.mods, { recursive: true });
  const now = NOW.getTime();
  const staging = stamped(s, 'staging', now, -30);
  const r = mod.reconcile(s.t_, { now });
  assert.deepEqual(r.skipped, [staging]);
  assert.deepEqual(r.removed, []);
});

test('2e: a leftover that is gone when reconcile deletes it (ENOENT) is a success: listed removed, the step goes on to install', t => {
  const s = sandbox(t);
  s.writeSettings({});
  fs.mkdirSync(s.t_.mods, { recursive: true });
  const old = stamped(s, 'staging', NOW.getTime(), 11);
  const remove = () => { throw failing('ENOENT'); };
  const alone = mod.reconcile(s.t_, { now: NOW.getTime(), remove });
  assert.equal(alone.refused, null);
  assert.deepEqual(alone.removed, [old]);
  const r = s.ensure({ remove });
  assert.equal(r.action, 'installed');
  assert.equal(r.reconcile.refused, null);
});

test('2f: a leftover that cannot be removed (EACCES) is refused, naming it and saying to remove it by hand', t => {
  const s = sandbox(t);
  s.writeSettings({});
  fs.mkdirSync(s.t_.mods, { recursive: true });
  const old = stamped(s, 'staging', NOW.getTime(), 11);
  const r = s.ensure({ remove: () => { throw failing('EACCES'); } });
  assert.equal(r.action, 'refused');
  assert.equal(r.line, notInstalled(`leftover ${old} could not be removed (EACCES); remove it by hand`));
});

test('2g: the restore rename failing because a target appeared (ENOTEMPTY, EEXIST) is not a refusal: the aside is left and skipped', t => {
  for (const code of ['ENOTEMPTY', 'EEXIST']) {
    const s = sandbox(t);
    fs.mkdirSync(s.t_.mods, { recursive: true });
    const aside = stamped(s, 'aside', NOW.getTime(), 11);
    const r = mod.reconcile(s.t_, { now: NOW.getTime(), rename: () => { throw failing(code); } });
    assert.equal(r.refused, null, code);
    assert.equal(r.restored, null, code);
    assert.deepEqual(r.skipped, [aside], code);
    assert.equal(fs.existsSync(aside), true, code);
  }
});

test('2h: a leftover whose name carries no stamp is judged by its mtime, as before: 11 minutes old is deleted beside a current target', t => {
  const s = sandbox(t);
  s.seedTarget({ version: '1.0.0' });
  const dir = path.join(s.t_.mods, 'agent-models.aside-x');
  writeTree(dir, '1.0.0');
  ageDir(dir, 11 * MIN);
  const r = mod.reconcile(s.t_, { now: Date.now() });
  assert.deepEqual(r.removed, [dir]);
  assert.equal(fs.existsSync(dir), false);
});

test('5c: an old aside with no plugin.json is never restored: with no target it is deleted as a leftover', t => {
  const s = sandbox(t);
  fs.mkdirSync(s.t_.mods, { recursive: true });
  const aside = stamped(s, 'aside', NOW.getTime(), 11, { valid: false });
  const r = mod.reconcile(s.t_, { now: NOW.getTime() });
  assert.equal(r.restored, null);
  assert.deepEqual(r.removed, [aside]);
  assert.equal(fs.existsSync(s.t_.target), false);
});

test('reconcile never touches a replaced-<stamp> folder, whatever its age', t => {
  const s = sandbox(t);
  s.seedTarget({ version: '1.0.0' });
  const replaced = path.join(s.t_.mods, replacedName(new Date(NOW.getTime() - 30 * DAY)));
  writeTree(replaced, '0.9.0');
  ageDir(replaced, 30 * DAY);
  const before = snapshot(replaced);
  const r = mod.reconcile(s.t_, { now: Date.now() });
  assert.deepEqual(r, NOTHING_RAN);
  assert.deepEqual(snapshot(replaced), before);
});

// ---------------------------------------------------------------------------------------------------------------------
// 4.10 an upgrade keeps a copy that did not match its record (A3)
// ---------------------------------------------------------------------------------------------------------------------

/** An older target whose register.tsx was edited by hand after install, with its extra files; returns the old bytes. */
function seedEdited(s, { manifest } = {}) {
  s.seedTarget({ version: '1.0.0', manifest });
  fs.writeFileSync(path.join(s.t_.target, 'hooks', 'register.tsx'), 'edited by hand');
  fs.mkdirSync(path.join(s.t_.target, '.claude-plugin', 'types'), { recursive: true });
  fs.writeFileSync(path.join(s.t_.target, '.claude-plugin', 'types', 'engine.d.ts'), 'engine');
  return snapshot(s.t_.target);
}
const bytesOnly = snap => Object.fromEntries(Object.entries(snap).map(([k, v]) => [k, v.bytes]));

for (const [name, manifest] of [['3a: stale manifest', undefined], ['3b: no manifest at all', null]]) {
  test(`${name} — the upgrade keeps the old folder byte for byte as replaced-<stamp>, and the line names it`, t => {
    const s = sandbox(t);
    s.writeSettings(s.registered());
    const old = seedEdited(s, { manifest });
    const r = s.ensure();
    assert.equal(r.action, 'upgraded');
    assert.equal(r.line, upgradedLine('1.0.0', '1.2.3', replacedName()));
    assert.deepEqual(treeFiles(s.t_.target), [...FILES].sort());
    for (const rel of FILES) assert.deepEqual(s.installedBytes(rel), fs.readFileSync(s.sourceFile(rel)), rel);
    assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json', replacedName()]);
    assert.deepEqual(bytesOnly(snapshot(path.join(s.t_.mods, replacedName()))), bytesOnly(old), 'extra files included');
    assert.equal(r.reconcile.refused, null);
    assert.deepEqual(s.ensure({ now: () => new Date(NOW.getTime() + DAY) }).reconcile, NOTHING_RAN, 'reconcile leaves it alone');
    assert.equal(fs.existsSync(path.join(s.t_.mods, replacedName())), true);
  });
}

test('3c: an older copy that matches its manifest leaves no replaced folder, and the line has no "kept as"', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0' });
  const r = s.ensure();
  assert.equal(r.line, upgradedLine('1.0.0', '1.2.3'));
  assert.equal(r.line.includes('kept as'), false);
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json']);
});

test('3d: an earlier replaced folder (a directory, a symlink) is removed after the new one is in place: exactly one remains', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  seedEdited(s);
  const earlier = path.join(s.t_.mods, replacedName(new Date('2026-01-01T00:00:00Z')));
  writeTree(earlier, '0.9.0');
  const precious = path.join(s.root, 'precious');
  writeTree(precious, '0.8.0');
  const link = path.join(s.t_.mods, replacedName(new Date('2026-02-01T00:00:00Z')));
  const linked = symlinkOrSkip(t, precious, link);
  const before = snapshot(precious);
  assert.equal(s.ensure().action, 'upgraded');
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json', replacedName()]);
  if (linked) assert.deepEqual(snapshot(precious), before, 'a link is unlinked, never followed');
});

test('3e: keep, the rename in fails and the rename back works — refused, the edited copy is back from the replaced name, no replaced folder left', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  const old = seedEdited(s);
  const { seam } = renameSeam(n => { if (n === 2) throw failing('EPERM'); });
  const r = s.ensure({ rename: seam });
  assert.equal(r.action, 'refused');
  assert.match(r.line, new RegExp(`^${escaped(notInstalled('could not rename '))}.*agent-models\\.staging-\\d+-\\d+-[0-9a-f]{8} into place \\(EPERM\\); .*${escaped(replacedName())} was renamed back$`));
  assert.deepEqual(bytesOnly(snapshot(s.t_.target)), bytesOnly(old));
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json', 'agent-models.reported.json']);
});

test('3f: a crash after the target went aside (rename in and rename back both fail) leaves the replaced folder; the next start installs fresh and never touches it', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  const old = seedEdited(s);
  const { seam } = renameSeam(n => { if (n === 2 || n === 3) throw failing('EPERM'); });
  assert.equal(s.ensure({ rename: seam }).action, 'refused');
  assert.equal(fs.existsSync(s.t_.target), false);
  const replaced = path.join(s.t_.mods, replacedName());
  assert.deepEqual(bytesOnly(snapshot(replaced)), bytesOnly(old));
  const next = s.ensure({ now: () => new Date(NOW.getTime() + 1000) });
  assert.equal(next.action, 'installed');
  assert.equal(next.reconcile.restored, null);
  assert.deepEqual(bytesOnly(snapshot(replaced)), bytesOnly(old), 'untouched');
  for (const rel of FILES) assert.deepEqual(s.installedBytes(rel), fs.readFileSync(s.sourceFile(rel)), rel);
});

// ---------------------------------------------------------------------------------------------------------------------
// 4.11 a target that appeared during the swap (A5)
// ---------------------------------------------------------------------------------------------------------------------

test('5a: the engine writes .claude-plugin/types into the path during the swap: the junk goes to a young aside and the rename in is retried once', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0' });
  const { seam } = renameSeam((n) => {
    if (n !== 2) return;
    fs.mkdirSync(path.join(s.t_.target, '.claude-plugin', 'types'), { recursive: true });
    fs.writeFileSync(path.join(s.t_.target, '.claude-plugin', 'types', 'x'), 'junk');
  });
  const r = s.ensure({ rename: seam });
  assert.equal(r.action, 'upgraded');
  assert.deepEqual(treeFiles(s.t_.target), [...FILES].sort());
  for (const rel of FILES) assert.deepEqual(s.installedBytes(rel), fs.readFileSync(s.sourceFile(rel)), rel);
  const [junk, ...rest] = s.listMods().filter(n => n.startsWith('agent-models.aside-'));
  assert.deepEqual(rest, [], 'one aside is left: the junk; the old copy is deleted');
  assert.deepEqual(treeFiles(path.join(s.t_.mods, junk)), ['.claude-plugin/types/x']);
  assert.equal(s.manifest().version, '1.2.3');
});

test('5b: a COMPLETE mod appearing at the target during the swap is another session\'s win: lost, as before', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0', manifest: null });
  const { seam } = renameSeam((n) => { if (n === 2) writeTree(s.t_.target, '1.2.3'); });
  const r = s.ensure({ rename: seam });
  assert.deepEqual([r.action, r.line, r.copy], ['none', '', 'lost']);
  assert.deepEqual(s.listMods(), ['agent-models', replacedName()], 'the old copy had no manifest: it stays as replaced-<stamp>');
});

// ---------------------------------------------------------------------------------------------------------------------
// 4.12 a NEWER copy that appears while the swap runs is put back, never replaced (the cadence consultation)
// ---------------------------------------------------------------------------------------------------------------------

/** What another session's complete install at `version` leaves at the target: the seven files and their install record. */
function anotherSessionInstalls(s, version) {
  writeTree(s.t_.target, version);
  const files = Object.fromEntries(FILES.map(rel => [rel, s.installedBytes(rel)]));
  fs.writeFileSync(s.t_.manifest, `${JSON.stringify(goodManifest(version, files), null, 2)}\n`);
}

/** The rename seam of these cases: another session installs `version` just before our first rename (the target going aside). */
function arrivalSeam(s, version, fail = () => {}) {
  return renameSeam((n, from, to) => {
    if (n === 1 && from === s.t_.target) anotherSessionInstalls(s, version);
    fail(n, from, to);
  });
}

test('W3: a newer copy that another session installed just before our aside rename is put back, our staging is dropped, and nothing is downgraded', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0' });
  const before = s.readSettings();
  const { calls, seam } = arrivalSeam(s, '2.0.0');
  const r = s.ensure({ rename: seam });
  assert.deepEqual([r.action, r.line, r.copy], ['none', '', 'lost']);
  for (const rel of FILES) assert.deepEqual(s.installedBytes(rel), fixtureBytes(rel, '2.0.0'), rel);
  assert.equal(s.manifest().version, '2.0.0');
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json'], 'no staging and no aside is left');
  assert.equal(calls.length, 2, 'the target went aside and the aside came back');
  assert.deepEqual(calls[1], [calls[0][1], s.t_.target]);
  assert.equal(s.readSettings(), before);
});

test('W3: the same with the kept-copy name (the old copy had no install record): the newer copy is back at the target and no replaced folder is left', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0', manifest: null });
  const { calls, seam } = arrivalSeam(s, '2.0.0');
  const r = s.ensure({ rename: seam });
  assert.deepEqual([r.action, r.copy], ['none', 'lost']);
  assert.equal(path.basename(calls[0][1]), replacedName(), 'the aside of this case is the replaced-<stamp> folder');
  for (const rel of FILES) assert.deepEqual(s.installedBytes(rel), fixtureBytes(rel, '2.0.0'), rel);
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json']);
});

test('W3: an arriving copy of this repository\'s own version is not put back: only a NEWER one is, so the swap goes on', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0' });
  const { seam } = arrivalSeam(s, '1.2.3');
  const r = s.ensure({ rename: seam });
  assert.equal(r.action, 'upgraded');
  for (const rel of FILES) assert.deepEqual(s.installedBytes(rel), fs.readFileSync(s.sourceFile(rel)), rel);
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json']);
});

test('W3: the rename back fails (EPERM) — refused with the aside named and the hand fix, no staging left, the newer copy still in the aside', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0' });
  const { calls, seam } = arrivalSeam(s, '2.0.0', n => { if (n === 2) throw failing('EPERM'); });
  const r = s.ensure({ rename: seam });
  const aside = calls[0][1];
  assert.equal(r.action, 'refused');
  assert.equal(r.line, notInstalled(`${aside} holds version 2.0.0, newer than this repository's 1.2.3, and could not be renamed back to ${s.t_.target} (EPERM); rename it back by hand`));
  assert.deepEqual(s.listMods().filter(n => n.includes('staging')), []);
  assert.deepEqual(treeFiles(aside), [...FILES].sort());
  assert.deepEqual(fs.readFileSync(path.join(aside, '.claude-plugin', 'plugin.json')), fixtureBytes('.claude-plugin/plugin.json', '2.0.0'));
});
