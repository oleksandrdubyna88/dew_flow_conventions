/**
 * The agent-models mod's installer end to end (`ensureAgentModels` in `settings/hooks/lib/agent-models-install.mjs`):
 * install, upgrade, no-op, edited, newer, the source and target refusals, the registration in settings.json and the reuse
 * of the guard installer's helpers, all on disk in TEMPORARY HOMES made by `ownedDir` — never `os.homedir()`, never the
 * real ~/.claude. The pure decisions are in `agent-models-decide.test.mjs`, the swap and leftovers in
 * `agent-models-swap.test.mjs`; the shared builders are `tools/lib/agent-models-fixtures.mjs`.
 *
 * Every test builds its own source folder, so none depends on `mods/agent-models/`.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import * as mod from '../settings/hooks/lib/agent-models-install.mjs';
import { serialise } from '../settings/hooks/lib/user-guard-install.mjs';
import {
  T, S, NOW, IS_ROOT, EMPTY_REC, sha, installedLine, upgradedLine, registeredLine, notRegistered, notInstalled, escaped,
  replacedName, editedLine, newerLine, symlinkLine, RETRY_TAIL, HAND_TAIL, carriedText, renameSeam,
  fixtureBytes, writeTree, snapshot, treeFiles, goodManifest, sandbox, symlinkOrSkip, FILES, D, fixtureReleased,
} from './lib/agent-models-fixtures.mjs';

/** Runs `run` with the process umask set to `mask`, and restores it. */
function withUmask(mask, run) {
  const before = process.umask(mask);
  try {
    return run();
  } finally {
    process.umask(before);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// 4.2 install, upgrade, no-op, edited, newer
// ---------------------------------------------------------------------------------------------------------------------

test('a fresh home installs the seven files, writes the manifest last, registers the target and backs settings up once', t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  const r = s.ensure();
  assert.deepEqual(r, { action: 'installed', line: installedLine('1.2.3'), copy: 'install', registration: 'append', reconcile: EMPTY_REC });
  assert.deepEqual(treeFiles(s.t_.target), [...FILES].sort());
  for (const rel of FILES) assert.deepEqual(s.installedBytes(rel), fs.readFileSync(s.sourceFile(rel)), rel);
  assert.deepEqual(s.manifest(), {
    version: '1.2.3',
    source: path.resolve(s.source),
    sha256: Object.fromEntries(FILES.map(rel => [rel, sha(fs.readFileSync(s.sourceFile(rel)))])),
    installedAt: '2026-11-10T00:00:00.000Z',
    by: 'test',
  });
  assert.deepEqual(Object.keys(s.manifest().sha256), FILES, 'MOD_FILES order');
  const settings = JSON.parse(s.readSettings());
  assert.deepEqual(settings, { model: 'opus', env: { CLAUDE_CODE_PLUGIN_DIRS: s.t_.target } });
  assert.deepEqual(Object.keys(settings), ['model', 'env']);
  assert.equal(s.backups().length, 1);
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json']);
});

test('a second run is a true no-op: no byte, no mtime, no backup changes', async t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  s.ensure();
  const before = { settings: s.readSettings(), tree: snapshot(s.t_.mods), backups: s.backups(), manifestStat: fs.statSync(s.t_.manifest).mtimeMs };
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.deepEqual(s.ensure(), { action: 'none', line: '', copy: 'none', registration: 'none', reconcile: EMPTY_REC });
  assert.equal(s.readSettings(), before.settings);
  assert.deepEqual(snapshot(s.t_.mods), before.tree);
  assert.deepEqual(s.backups(), before.backups);
  assert.equal(fs.statSync(s.t_.manifest).mtimeMs, before.manifestStat);
});

test('an older copy is replaced whole: extra files go with the old folder, the manifest says the new version, no leftover', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0' });
  fs.mkdirSync(path.join(s.t_.target, '.claude-plugin', 'types', 'claude-code'), { recursive: true });
  fs.writeFileSync(path.join(s.t_.target, '.claude-plugin', 'types', 'claude-code', 'index.d.ts'), 'engine');
  fs.writeFileSync(path.join(s.t_.target, 'tsconfig.json'), '{}');
  const settingsBefore = s.readSettings();
  const r = s.ensure();
  assert.deepEqual(r, { action: 'upgraded', line: upgradedLine('1.0.0', '1.2.3'), copy: 'upgrade', registration: 'none', reconcile: EMPTY_REC });
  assert.deepEqual(treeFiles(s.t_.target), [...FILES].sort());
  for (const rel of FILES) assert.deepEqual(s.installedBytes(rel), fs.readFileSync(s.sourceFile(rel)), rel);
  assert.equal(s.manifest().version, '1.2.3');
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json']);
  assert.equal(s.readSettings(), settingsBefore);
});

test('I6: a 1.2.2 install written the five-file way (five files, five-key manifest) upgrades whole: not kept, no replaced- folder, seven files, a seven-key manifest', t => {
  const s = sandbox(t, { version: '1.3.0' });
  s.writeSettings(s.registered());
  const files = s.seedTarget({ version: '1.2.2' });
  const later = ['hooks/tasks.tsx', 'hooks/limits.tsx'];
  for (const rel of later) {
    fs.rmSync(path.join(s.t_.target, rel));
    delete files[rel];
  }
  const five = FILES.filter(rel => !later.includes(rel));
  fs.writeFileSync(s.t_.manifest, `${JSON.stringify({
    version: '1.2.2', source: '/somewhere', sha256: Object.fromEntries(five.map(rel => [rel, sha(files[rel])])), installedAt: '2026-01-01T00:00:00.000Z', by: 'seed',
  }, null, 2)}\n`);
  assert.deepEqual(treeFiles(s.t_.target), [...five].sort(), 'the seed holds exactly the five older files');
  const r = s.ensure();
  assert.equal(r.action, 'upgraded');
  assert.match(r.line, /upgraded/);
  assert.doesNotMatch(r.line, /was kept as/);
  assert.equal(r.line, upgradedLine('1.2.2', '1.3.0'));
  assert.deepEqual(s.listMods().filter(name => name.includes('agent-models.replaced-')), []);
  assert.deepEqual(treeFiles(s.t_.target), [...FILES].sort());
  assert.deepEqual(Object.keys(s.manifest().sha256), FILES);
  assert.equal(s.manifest().version, '1.3.0');
});

test('an older AND edited copy is replaced, and the line says where the differing copy was kept (A3)', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '1.0.0' });
  fs.writeFileSync(path.join(s.t_.target, 'hooks', 'register.tsx'), 'edited by hand');
  const r = s.ensure();
  assert.equal(r.action, 'upgraded');
  assert.equal(r.line, upgradedLine('1.0.0', '1.2.3', replacedName()));
  assert.deepEqual(s.installedBytes('hooks/register.tsx'), fs.readFileSync(s.sourceFile('hooks/register.tsx')));
});

for (const [name, pluginJson] of [['missing', null], ['unparsable', '{ not json'], ['carrying version "x"', '{"name":"agent-models","version":"x"}']]) {
  test(`a target plugin.json that is ${name} counts as version 0.0.0 and is upgraded`, t => {
    const s = sandbox(t);
    s.writeSettings(s.registered());
    s.seedTarget({ version: '1.0.0' });
    const pj = path.join(s.t_.target, '.claude-plugin', 'plugin.json');
    if (pluginJson === null) fs.rmSync(pj);
    else fs.writeFileSync(pj, pluginJson);
    const r = s.ensure();
    assert.equal(r.action, 'upgraded');
    assert.equal(r.line, upgradedLine('0.0.0', '1.2.3', replacedName()));
    assert.deepEqual(s.installedBytes('.claude-plugin/plugin.json'), fs.readFileSync(s.sourceFile('.claude-plugin/plugin.json')));
  });
}

test('an equal copy whose bytes were edited is left exactly as it is; the line is said once and the only new file is the reported record', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget();
  fs.appendFileSync(path.join(s.t_.target, 'types', 'index.d.ts'), '// mine\n');
  const before = { tree: snapshot(s.t_.mods), settings: s.readSettings() };
  const r = s.ensure();
  assert.deepEqual(r, { action: 'edited', line: editedLine('1.2.3'), copy: 'edited', registration: 'none', reconcile: EMPTY_REC });
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json', 'agent-models.reported.json']);
  const after = snapshot(s.t_.mods);
  delete after['agent-models.reported.json'];
  assert.deepEqual(after, before.tree);
  assert.equal(s.readSettings(), before.settings);
  assert.equal(s.backups().length, 0);
  assert.match(s.reported().key, /^edited:[0-9a-f]{64}:1\.2\.3$/);
  assert.equal(s.reported().at, NOW.toISOString());
});

for (const [name, manifest] of [
  ['missing (an install interrupted after the swap)', null],
  ['stale (one hash is wrong)', (() => { const m = goodManifest('1.2.3', Object.fromEntries(FILES.map(rel => [rel, fixtureBytes(rel, '1.2.3')]))); m.sha256['hooks/hooks.json'] = '0'.repeat(64); return m; })()],
  ['stale (an extra key)', (() => { const m = goodManifest('1.2.3', Object.fromEntries(FILES.map(rel => [rel, fixtureBytes(rel, '1.2.3')]))); m.sha256['extra'] = 'x'; return m; })()],
]) {
  test(`an equal copy with its manifest ${name} gets the manifest written and nothing else`, t => {
    const s = sandbox(t);
    s.writeSettings(s.registered());
    s.seedTarget({ manifest });
    const treeBefore = snapshot(s.t_.target);
    const settingsBefore = s.readSettings();
    const r = s.ensure();
    assert.deepEqual(r, { action: 'none', line: '', copy: 'manifest', registration: 'none', reconcile: EMPTY_REC });
    assert.deepEqual(snapshot(s.t_.target), treeBefore, 'the target is untouched, mtimes included');
    assert.equal(s.manifest().version, '1.2.3');
    assert.deepEqual(Object.keys(s.manifest().sha256), FILES);
    assert.equal(s.readSettings(), settingsBefore);
    assert.equal(s.ensure().copy, 'none', 'and the next run finds it matching');
  });
}

test('a newer copy is left alone and nothing is written anywhere but the said-once record', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget({ version: '2.0.0' });
  const before = { tree: snapshot(s.t_.mods), settings: s.readSettings() };
  const r = s.ensure();
  assert.deepEqual(r, {
    action: 'newer', line: newerLine('2.0.0', '1.2.3'),
    copy: 'newer', registration: 'none', reconcile: EMPTY_REC,
  });
  const after = snapshot(s.t_.mods);
  delete after['agent-models.reported.json'];
  assert.deepEqual(after, before.tree);
  assert.equal(s.readSettings(), before.settings);
  assert.equal(s.backups().length, 0);
});

test('files the engine or the operator left in the target never make an equal copy look edited', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget();
  fs.writeFileSync(path.join(s.t_.target, 'tsconfig.json'), '{}');
  fs.mkdirSync(path.join(s.t_.target, '.claude-plugin', 'types'), { recursive: true });
  fs.writeFileSync(path.join(s.t_.target, '.claude-plugin', 'types', 'x.d.ts'), 'x');
  const r = s.ensure();
  assert.equal(r.action, 'none');
  assert.equal(r.copy, 'none');
});

// ---------------------------------------------------------------------------------------------------------------------
// 4.3 source refusals
// ---------------------------------------------------------------------------------------------------------------------

function sourceRefusal(name, arrange, expectedReason) {
  test(`source refusal: ${name} — nothing written, settings byte-identical, no mods folder made`, t => {
    const s = sandbox(t);
    s.writeSettings({ model: 'opus' });
    if (arrange(s, t) === false) return;
    const before = s.readSettings();
    const r = s.ensure();
    assert.equal(r.action, 'refused');
    assert.equal(r.copy, 'refuse');
    assert.equal(r.registration, 'none');
    assert.match(r.line, new RegExp(`^${escaped(notInstalled(''))}${expectedReason(s)}$`));
    assert.equal(s.readSettings(), before);
    assert.equal(fs.existsSync(s.t_.mods), false);
    assert.equal(s.backups().length, 0);
  });
}
const pjPath = s => escaped(s.sourceFile('.claude-plugin/plugin.json'));
sourceRefusal('a version of "1.2"', s => fs.writeFileSync(s.sourceFile('.claude-plugin/plugin.json'), '{"version":"1.2"}'),
  s => `source plugin\\.json ${pjPath(s)} has no MAJOR\\.MINOR\\.PATCH version \\(got "1\\.2"\\)`);
sourceRefusal('an unparsable plugin.json', s => fs.writeFileSync(s.sourceFile('.claude-plugin/plugin.json'), '{ nope'),
  s => `source plugin\\.json ${pjPath(s)} does not parse \\(.+\\)`);
sourceRefusal('a plugin.json that is not an object', s => fs.writeFileSync(s.sourceFile('.claude-plugin/plugin.json'), '[]'),
  s => `source plugin\\.json ${pjPath(s)} is not a JSON object`);
sourceRefusal('hooks/prompts.ts missing', s => fs.rmSync(s.sourceFile('hooks/prompts.ts')),
  s => `source file ${escaped(s.sourceFile('hooks/prompts.ts'))} is missing`);
sourceRefusal('hooks/prompts.ts a symlink to a real file', (s, t) => {
  const real = path.join(s.root, 'real-prompts.ts');
  fs.writeFileSync(real, 'real');
  fs.rmSync(s.sourceFile('hooks/prompts.ts'));
  return symlinkOrSkip(t, real, s.sourceFile('hooks/prompts.ts'));
}, s => `source file ${escaped(s.sourceFile('hooks/prompts.ts'))} is not a regular file`);

test('a file outside MOD_FILES in the source is not copied: MOD_FILES is the only list', t => {
  const s = sandbox(t);
  s.writeSettings({});
  fs.writeFileSync(path.join(s.source, 'README.md'), 'not part of the mod');
  fs.mkdirSync(path.join(s.source, 'tests'));
  fs.writeFileSync(path.join(s.source, 'tests', 'a.test.ts'), 'x');
  assert.equal(s.ensure().action, 'installed');
  assert.deepEqual(treeFiles(s.t_.target), [...FILES].sort());
});

// ---------------------------------------------------------------------------------------------------------------------
// 4.4 target refusals
// ---------------------------------------------------------------------------------------------------------------------

test('a symlinked target is refused and neither the link nor what it points at is touched', t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  const real = path.join(s.root, 'real-mod');
  writeTree(real, '1.0.0');
  fs.mkdirSync(s.t_.mods, { recursive: true });
  if (!symlinkOrSkip(t, real, s.t_.target)) return;
  const before = { real: snapshot(real), settings: s.readSettings() };
  const r = s.ensure();
  assert.deepEqual(r, {
    action: 'refused', line: symlinkLine(s.t_.target),
    copy: 'refuse', registration: 'none', reconcile: EMPTY_REC,
  });
  assert.equal(fs.readlinkSync(s.t_.target), real);
  assert.deepEqual(snapshot(real), before.real);
  assert.equal(s.readSettings(), before.settings);
  assert.equal(mod.readTarget({ ...s.t_ }).kind, 'symlink');
});

test('a target that is a regular file is refused as not a directory', t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  fs.mkdirSync(s.t_.mods, { recursive: true });
  fs.writeFileSync(s.t_.target, 'a file');
  const r = s.ensure();
  assert.equal(r.action, 'refused');
  assert.equal(r.line, notInstalled(`${s.t_.target} is not a directory`));
  assert.equal(fs.readFileSync(s.t_.target, 'utf8'), 'a file');
});

test('a mods folder that is a symlink is refused and nothing is written behind it', t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  const behind = path.join(s.root, 'elsewhere');
  fs.mkdirSync(behind);
  fs.mkdirSync(s.claude, { recursive: true });
  if (!symlinkOrSkip(t, behind, s.t_.mods)) return;
  const r = s.ensure();
  assert.equal(r.action, 'refused');
  assert.equal(r.line, notInstalled(`${s.t_.mods} is a symlink`));
  assert.deepEqual(fs.readdirSync(behind), []);
});

test('a mods path that is a regular file is refused as not a directory', t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  fs.writeFileSync(s.t_.mods, 'x');
  assert.equal(s.ensure().line, notInstalled(`${s.t_.mods} is not a directory`));
});

test('a target owned by another user is refused and never touched (the uid is injectable)', t => {
  if (process.platform === 'win32' || process.getuid === undefined) return t.skip('no uid on this platform');
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  s.seedTarget({ version: '1.0.0' });
  const realUid = process.getuid();
  assert.deepEqual(mod.readTarget(s.t_, { uid: () => 999999 }), { kind: 'foreign', path: s.t_.target, uid: realUid });
  const before = { tree: snapshot(s.t_.mods), settings: s.readSettings() };
  const r = s.ensure({ uid: () => 999999 });
  assert.equal(r.action, 'refused');
  assert.equal(r.line, notInstalled(`${s.t_.target} is owned by another user (uid ${realUid})`));
  assert.deepEqual(snapshot(s.t_.mods), before.tree);
  assert.equal(s.readSettings(), before.settings);
});

// ---------------------------------------------------------------------------------------------------------------------
// 4.5 registration
// ---------------------------------------------------------------------------------------------------------------------

test('registration keeps the other plugin dirs in their order and the other env keys', t => {
  const s = sandbox(t);
  s.seedTarget();
  s.writeSettings({ env: { CLAUDE_CODE_PLUGIN_DIRS: `/a${D}/b`, OTHER: '1' } });
  const r = s.ensure();
  assert.deepEqual(r, { action: 'registered', line: registeredLine, copy: 'none', registration: 'append', reconcile: EMPTY_REC });
  assert.deepEqual(JSON.parse(s.readSettings()), { env: { CLAUDE_CODE_PLUGIN_DIRS: `/a${D}/b${D}${s.t_.target}`, OTHER: '1' } });
  assert.equal(s.backups().length, 1);
});

for (const [name, spelled] of [
  ['as the target path', t_ => t_.target],
  ['as ~/.claude/mods/agent-models', () => '~/.claude/mods/agent-models'],
  ['with a trailing separator', t_ => t_.target + path.sep],
]) {
  test(`a target already listed ${name} is none: no write, no backup`, t => {
    const s = sandbox(t);
    s.seedTarget();
    s.writeSettings({ env: { CLAUDE_CODE_PLUGIN_DIRS: `/a${D}${spelled(s.t_)}` } });
    const before = s.readSettings();
    const r = s.ensure();
    assert.equal(r.action, 'none');
    assert.equal(r.registration, 'none');
    assert.equal(s.readSettings(), before);
    assert.equal(s.backups().length, 0);
  });
}

test('registration puts a new env key last among the top-level keys, and keeps an existing env where it is', t => {
  const s = sandbox(t);
  s.seedTarget();
  s.writeSettings({ model: 'x', hooks: {} });
  s.ensure();
  assert.deepEqual(Object.keys(JSON.parse(s.readSettings())), ['model', 'hooks', 'env']);
  s.writeSettings({ env: { A: '1' }, model: 'x' });
  s.ensure();
  const settings = JSON.parse(s.readSettings());
  assert.deepEqual(Object.keys(settings), ['env', 'model']);
  assert.deepEqual(Object.keys(settings.env), ['A', 'CLAUDE_CODE_PLUGIN_DIRS']);
});

for (const [name, content, reason] of [
  ['unparsable settings', '{ nope', /^(.+) does not parse \(.+\)$/],
  ['settings that are an array', '[]', /^(.+) is not a JSON object$/],
  ['env that is an array', { env: [] }, /^(.+): env is not an object$/],
  ['env that is a string', { env: 'x' }, /^(.+): env is not an object$/],
  ['a plugin dirs value that is not a string', { env: { CLAUDE_CODE_PLUGIN_DIRS: ['/a'] } }, /^(.+): env\.CLAUDE_CODE_PLUGIN_DIRS is not a string$/],
]) {
  test(`registration refusal, ${name}: the file is byte-identical, there is no backup, and the line says what is on disk`, t => {
    const s = sandbox(t);
    s.seedTarget();
    s.writeSettings(content);
    const before = s.readSettings();
    const r = s.ensure();
    assert.equal(r.action, 'refused');
    assert.equal(r.copy, 'none');
    assert.equal(r.registration, 'refuse');
    const prefix = `agent-models mod 1.2.3 installed into ${T} but NOT registered in ${S}: `;
    const suffix = HAND_TAIL; // every case here is a shape refusal: nothing changes until the file is fixed
    assert.ok(r.line.startsWith(prefix) && r.line.endsWith(suffix), r.line);
    const reason_ = r.line.slice(prefix.length, -suffix.length);
    assert.match(reason_, reason);
    assert.equal(reason_.match(reason)[1], s.t_.settings);
    assert.equal(s.readSettings(), before);
    assert.equal(s.backups().length, 0);
  });
}

test('a missing settings.json is created holding only the registration, with the mode of the umask and no backup; the second run is silent', { skip: process.platform === 'win32' }, t => {
  const s = sandbox(t);
  const r = withUmask(0o022, () => s.ensure());
  assert.deepEqual([r.action, r.line, r.copy, r.registration], ['installed', installedLine('1.2.3'), 'install', 'append']);
  assert.equal(s.readSettings(), serialise({ env: { CLAUDE_CODE_PLUGIN_DIRS: s.t_.target } }));
  assert.equal(fs.statSync(s.t_.settings).mode & 0o777, 0o644, 'the mode the guard gives a file it creates under the same umask');
  assert.deepEqual(s.backups(), []);
  assert.deepEqual(fs.readdirSync(s.claude).filter(f => f.includes('.tmp-')), []);
  const again = s.ensure();
  assert.deepEqual([again.action, again.line, again.copy, again.registration], ['none', '', 'none', 'none']);
});

test('settings changed between the read and the write: refused, the other writer\'s bytes stay, no backup', t => {
  const s = sandbox(t);
  s.seedTarget();
  s.writeSettings({});
  const r = s.ensure({ beforeWrite: () => s.writeSettings({ model: 'x' }) });
  assert.equal(r.action, 'refused');
  assert.equal(r.registration, 'refuse');
  assert.ok(r.line.startsWith(`agent-models mod 1.2.3 installed into ${T} but NOT registered in ${S}: settings.json changed while registering`), r.line);
  assert.ok(r.line.endsWith(`settings.json changed while registering the agent-models mod; nothing written to it${RETRY_TAIL}`), r.line);
  assert.deepEqual(JSON.parse(s.readSettings()), { model: 'x' });
  assert.equal(s.backups().length, 0);
});

test('another session registered first: settled, not an error, no write and no backup', t => {
  const withTarget = s => `${JSON.stringify(s.registered({ model: 'other' }), null, 2)}\n`;
  const a = sandbox(t);
  a.seedTarget();
  a.writeSettings({});
  let wrote;
  const none = a.ensure({ beforeWrite: () => { wrote = withTarget(a); a.writeSettings(wrote); } });
  assert.deepEqual([none.action, none.line, none.copy, none.registration], ['none', '', 'none', 'settled']);
  assert.equal(a.readSettings(), wrote);
  assert.equal(a.backups().length, 0);

  const b = sandbox(t);
  b.writeSettings({});
  let wroteB;
  const installed = b.ensure({ beforeWrite: () => { wroteB = withTarget(b); b.writeSettings(wroteB); } });
  assert.deepEqual([installed.action, installed.line, installed.copy, installed.registration], ['installed', installedLine('1.2.3'), 'install', 'settled']);
  assert.equal(b.readSettings(), wroteB);
  assert.equal(b.backups().length, 0);
});

test('a read-only settings.json is refused as not writable, three runs leave no backup and no temp file', t => {
  if (IS_ROOT || process.platform === 'win32') return t.skip('permissions do not bind root / Windows');
  const s = sandbox(t);
  s.seedTarget();
  s.writeSettings({ model: 'x' });
  fs.chmodSync(s.t_.settings, 0o444);
  try {
    const before = s.readSettings();
    for (let run = 0; run < 3; run += 1) {
      const r = s.ensure();
      assert.equal(r.action, 'refused');
      assert.match(r.line, /is not writable \(EACCES\)/);
    }
    assert.equal(s.backups().length, 0);
    assert.deepEqual(fs.readdirSync(s.claude).filter(f => f.includes('.tmp-')), []);
    assert.equal(s.readSettings(), before);
  } finally {
    fs.chmodSync(s.t_.settings, 0o666);
  }
});

test('a write that fails after the backup is a refusal, and repeated runs add no further backup', t => {
  const s = sandbox(t);
  s.seedTarget();
  s.writeSettings({ model: 'x' });
  const before = s.readSettings();
  fs.mkdirSync(`${fs.realpathSync(s.t_.settings)}.tmp-${process.pid}`); // makes the temp-file write fail
  for (let run = 0; run < 3; run += 1) {
    const r = s.ensure();
    assert.equal(r.action, 'refused');
    assert.match(r.line, /could not be written/);
  }
  assert.equal(s.backups().length, 1);
  assert.equal(s.readSettings(), before);
});

test('a symlinked settings.json stays a symlink, its target gains the key, and the mode is kept on file and backup', t => {
  if (process.platform === 'win32') return t.skip('POSIX modes do not exist on Windows');
  const s = sandbox(t);
  s.seedTarget();
  const real = path.join(s.root, 'real-settings.json');
  fs.writeFileSync(real, `${JSON.stringify({ model: 'x' })}\n`, { mode: 0o600 });
  fs.chmodSync(real, 0o600);
  fs.mkdirSync(s.claude, { recursive: true });
  if (!symlinkOrSkip(t, real, s.t_.settings)) return;
  assert.equal(s.ensure().action, 'registered');
  assert.equal(fs.lstatSync(s.t_.settings).isSymbolicLink(), true);
  assert.deepEqual(JSON.parse(fs.readFileSync(real, 'utf8')), { model: 'x', env: { CLAUDE_CODE_PLUGIN_DIRS: s.t_.target } });
  assert.equal(fs.statSync(real).mode & 0o777, 0o600);
  const [backup] = s.backups(s.root);
  assert.ok(backup, 'the backup sits beside the real file');
  assert.equal(fs.statSync(path.join(s.root, backup)).mode & 0o777, 0o600);
});

test('a copy done and a registration refused is repaired later by registering only: the target and manifest are not rewritten', t => {
  const s = sandbox(t);
  s.writeSettings('{ nope');
  const first = s.ensure();
  assert.equal(first.action, 'refused');
  assert.equal(first.copy, 'install');
  assert.deepEqual(s.listMods(), ['agent-models', 'agent-models.installed.json']);
  const before = snapshot(s.t_.mods);
  s.writeSettings({ model: 'x' });
  const second = s.ensure();
  assert.deepEqual([second.action, second.copy, second.registration], ['registered', 'none', 'append']);
  assert.deepEqual(snapshot(s.t_.mods), before, 'bytes and mtimes of the target and the manifest');
});

// ---------------------------------------------------------------------------------------------------------------------
// 4.12 the copy writes only the bytes the released check saw
// ---------------------------------------------------------------------------------------------------------------------

test('the now seam: a source file that changes after the read is never copied — the installed bytes and the record hash to the released identity', t => {
  const s = sandbox(t);
  s.writeSettings({ model: 'opus' });
  const changed = '// changed after the read\n';
  let calls = 0;
  const now = () => {
    if (calls++ === 0) fs.appendFileSync(s.sourceFile('hooks/prompts.ts'), changed); // the first clock read comes after readSource
    return NOW;
  };
  const r = s.ensure({ now });
  assert.equal(r.action, 'installed');
  assert.ok(fs.readFileSync(s.sourceFile('hooks/prompts.ts'), 'utf8').endsWith(changed), 'the seam fired: the source on disk is no longer the released one');
  const released = fixtureReleased('1.2.3');
  for (const rel of FILES) {
    assert.equal(sha(s.installedBytes(rel)), released.sha256[rel], `installed ${rel}`);
    assert.equal(s.manifest().sha256[rel], released.sha256[rel], `recorded ${rel}`);
  }
});
