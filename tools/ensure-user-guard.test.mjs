import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ensureUserGuard, guardVersion } from '../settings/hooks/ensure-user-guard.mjs';
import { OPTOUT_FILE, findEntries, install, targets } from '../settings/hooks/lib/user-guard-install.mjs';

const ENTRY = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'settings', 'hooks', 'ensure-user-guard.mjs');
const hookText = version => (version === null ? '// unversioned\n' : `export const GUARD_VERSION = ${version};\n`);

/** A temporary home plus a project carrying a source hook of `sourceVersion`. Never os.homedir(). */
function sandbox(t, sourceVersion = 2) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ensure-user-guard-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const home = path.join(root, 'home');
  const project = path.join(root, 'project');
  fs.mkdirSync(home);
  fs.mkdirSync(path.join(project, '.claude', 'hooks'), { recursive: true });
  const source = path.join(project, '.claude', 'hooks', 'subagent-model.mjs');
  fs.writeFileSync(source, hookText(sourceVersion));
  const paths = targets(home);
  const seedInstalled = version => {
    fs.mkdirSync(path.dirname(paths.hook), { recursive: true });
    fs.writeFileSync(paths.hook, hookText(version));
  };
  const run = (env = {}, input = '{}') => spawnSync(process.execPath, [ENTRY], {
    encoding: 'utf8', input,
    env: { ...process.env, HOME: home, USERPROFILE: home, CLAUDE_PROJECT_DIR: project, SUBAGENT_MODEL_GUARD: '', ...env },
  });
  const ensure = (env = {}) => ensureUserGuard({ home, source, env });
  return { home, project, source, paths, seedInstalled, run, ensure };
}

const HIGH_EFFORT = { effortLevel: 'high', modelSettings: { sonnet: { effortLevel: 'high' }, opus: { effortLevel: 'high' }, fable: { effortLevel: 'high' } } };

/** Writes the exact registration the installer writes, around whatever hook is already seeded. */
function registerValidly(s) {
  fs.mkdirSync(s.paths.dir, { recursive: true });
  fs.writeFileSync(s.paths.settings, JSON.stringify({ ...HIGH_EFFORT, hooks: { PreToolUse: [{ matcher: 'Agent|Task', hooks: [{ type: 'command', command: 'node', args: [s.paths.hook] }] }] } }));
}

const stat = file => ({ bytes: fs.readFileSync(file), mtime: fs.statSync(file).mtimeMs });

test('guardVersion reads the integer, and 0 for an unversioned text', () => {
  assert.equal(guardVersion('// x\nexport const GUARD_VERSION = 7;\n'), 7);
  assert.equal(guardVersion('// nothing here\n'), 0);
});

test('a missing installed copy is installed, with the entry in settings.json', t => {
  const s = sandbox(t);
  const r = s.ensure();
  assert.equal(r.action, 'installed');
  assert.equal(r.line, 'subagent-model guard installed into ~/.claude (version 2)');
  assert.equal(fs.readFileSync(s.paths.hook, 'utf8'), hookText(2));
  assert.equal(JSON.parse(fs.readFileSync(s.paths.settings, 'utf8')).hooks.PreToolUse.length, 1);
});

test('an older installed copy is upgraded', t => {
  const s = sandbox(t);
  s.seedInstalled(1);
  const r = s.ensure();
  assert.equal(r.action, 'upgraded');
  assert.equal(r.line, 'subagent-model guard upgraded in ~/.claude (version 1 → 2)');
  assert.equal(fs.readFileSync(s.paths.hook, 'utf8'), hookText(2));
});

test('an unversioned installed copy counts as version 0 and is upgraded', t => {
  const s = sandbox(t);
  s.seedInstalled(null);
  const r = s.ensure();
  assert.equal(r.action, 'upgraded');
  assert.match(r.line, /version 0 → 2/);
});

test('an equal version writes nothing: bytes and mtime of both files are untouched', async t => {
  const s = sandbox(t);
  assert.equal(s.ensure().action, 'installed');
  const before = { hook: stat(s.paths.hook), settings: stat(s.paths.settings) };
  const entriesBefore = fs.readdirSync(s.paths.dir).sort();
  await new Promise(resolve => setTimeout(resolve, 30));
  const r = s.ensure();
  assert.deepEqual(r, { action: 'none', line: '' });
  assert.deepEqual({ hook: stat(s.paths.hook), settings: stat(s.paths.settings) }, before);
  assert.deepEqual(fs.readdirSync(s.paths.dir).sort(), entriesBefore);
});

test('a newer installed copy that is validly registered is never downgraded, and never silent about it', t => {
  const s = sandbox(t, 2);
  s.seedInstalled(5);
  registerValidly(s);
  const settingsBefore = fs.readFileSync(s.paths.settings, 'utf8');
  const r = s.ensure();
  assert.equal(r.action, 'newer');
  assert.equal(r.line, "subagent-model guard in ~/.claude is version 5, newer than this repository's 2 — run node <conventions>/tools/install-user-hook.mjs --force to replace it");
  assert.deepEqual(JSON.parse(s.run().stdout), { systemMessage: r.line });
  assert.equal(fs.readFileSync(s.paths.hook, 'utf8'), hookText(5));
  assert.equal(fs.readFileSync(s.paths.settings, 'utf8'), settingsBefore);
});

test('a newer installed copy that is NOT validly registered gets only its registration repaired', t => {
  const s = sandbox(t, 2);
  s.seedInstalled(5);
  fs.mkdirSync(s.paths.dir, { recursive: true });
  fs.writeFileSync(s.paths.settings, JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node', args: [s.paths.hook] }] }] } }));
  const hookBefore = stat(s.paths.hook);
  const r = s.ensure();
  assert.equal(r.line, "subagent-model guard version 5 in ~/.claude (newer than this repository's 2) was not registered — registration repaired");
  assert.equal(r.action, 'repaired');
  assert.deepEqual(stat(s.paths.hook), hookBefore);
  assert.equal(fs.existsSync(s.paths.manifest), false);
  const entries = findEntries(JSON.parse(fs.readFileSync(s.paths.settings, 'utf8')), s.paths.hook);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].matcher, 'Agent|Task');
  assert.equal(s.ensure().action, 'newer');
});

test('SUBAGENT_MODEL_GUARD=off (any case, padded) skips and writes nothing', t => {
  const s = sandbox(t);
  assert.deepEqual(s.ensure({ SUBAGENT_MODEL_GUARD: ' OFF ' }), { action: 'skipped', line: '' });
  assert.equal(fs.existsSync(s.paths.dir), false);
});

test('the opt-out marker skips and writes nothing', t => {
  const s = sandbox(t);
  fs.mkdirSync(path.dirname(s.paths.hook), { recursive: true });
  fs.writeFileSync(path.join(path.dirname(s.paths.hook), OPTOUT_FILE), 'off\n');
  assert.equal(s.ensure().action, 'skipped');
  assert.equal(fs.existsSync(s.paths.hook), false);
  assert.equal(fs.existsSync(s.paths.settings), false);
});

test('a missing source skips', t => {
  const s = sandbox(t);
  fs.rmSync(s.source);
  assert.equal(s.ensure().action, 'skipped');
  assert.equal(fs.existsSync(s.paths.dir), false);
});

test('an unparsable settings.json is refused and stays byte-identical', t => {
  const s = sandbox(t);
  fs.mkdirSync(s.paths.dir, { recursive: true });
  fs.writeFileSync(s.paths.settings, '{ not json');
  const r = s.ensure();
  assert.equal(r.action, 'refused');
  assert.match(r.line, /^subagent-model guard NOT installed into ~\/\.claude: .*does not parse.*; run node <conventions>\/tools\/install-user-hook\.mjs by hand$/);
  assert.equal(fs.readFileSync(s.paths.settings, 'utf8'), '{ not json');
  assert.equal(fs.existsSync(s.paths.hook), false);
});

test('the entry point prints one systemMessage on the first run and nothing on the second', t => {
  const s = sandbox(t);
  const first = s.run();
  assert.equal(first.status, 0, first.stderr);
  const lines = first.stdout.split('\n').filter(Boolean);
  assert.equal(lines.length, 1);
  // Fresh machine: the guard creates settings.json, and effort is converged in the SAME session, guard line first.
  assert.deepEqual(JSON.parse(lines[0]), { systemMessage: 'subagent-model guard installed into ~/.claude (version 2)\neffort set to high for every model (was: effortLevel unset, sonnet unset, opus unset, fable unset) — takes effect from the next session; restart this one to run at high now' });
  const second = s.run();
  assert.equal(second.status, 0);
  assert.equal(second.stdout, '');
});

test('garbage stdin still works and exits 0; the payload cwd stands in for CLAUDE_PROJECT_DIR', t => {
  const s = sandbox(t);
  const garbage = s.run({}, '\u0000not json{{');
  assert.equal(garbage.status, 0);
  assert.match(garbage.stdout, /installed into/);
  const s2 = sandbox(t);
  const viaCwd = s2.run({ CLAUDE_PROJECT_DIR: '' }, JSON.stringify({ cwd: s2.project }));
  assert.equal(viaCwd.status, 0);
  assert.match(viaCwd.stdout, /installed into/);
  const s3 = sandbox(t);
  const none = s3.run({ CLAUDE_PROJECT_DIR: '' }, 'garbage');
  assert.equal(none.status, 0);
  assert.equal(none.stdout, '');
});

test('every self-install writes a provenance manifest with the hash of the installed bytes', t => {
  const s = sandbox(t);
  s.ensure();
  const m = JSON.parse(fs.readFileSync(s.paths.manifest, 'utf8'));
  assert.equal(m.by, 'self-install');
  assert.equal(m.version, 2);
  assert.equal(m.source, path.resolve(s.source));
  assert.equal(m.sha256, createHash('sha256').update(fs.readFileSync(s.paths.hook)).digest('hex'));
  assert.ok(!Number.isNaN(Date.parse(m.installedAt)) && m.installedAt.endsWith('Z'));
});

test('a project hook with uncommitted changes is refused and nothing is written', t => {
  const s = sandbox(t);
  const git = spawnSync('git', ['init', '-q'], { cwd: s.project });
  if (git.status !== 0) return t.skip('git unavailable');
  const r = s.ensure();
  assert.equal(r.action, 'refused');
  assert.match(r.line, /uncommitted changes/);
  assert.equal(fs.existsSync(s.paths.hook), false);
  assert.equal(fs.existsSync(s.paths.settings), false);
});

test('a refused install is repaired by the next session even though no version differs', t => {
  const s = sandbox(t);
  fs.mkdirSync(path.dirname(s.paths.settings), { recursive: true });
  fs.writeFileSync(s.paths.settings, '{"model":"opus"}\n');
  const refused = install({ home: s.home, source: s.source, beforeWrite: () => fs.writeFileSync(s.paths.settings, '{"model":"opus","injected":true}\n') });
  assert.equal(refused.code, 1);
  const r = s.ensure();
  assert.equal(r.action, 'installed');
  const settings = JSON.parse(fs.readFileSync(s.paths.settings, 'utf8'));
  assert.equal(settings.injected, true);
  assert.equal(findEntries(settings, s.paths.hook).length, 1);
  assert.equal(s.ensure().action, 'none');
});

test('a current version with a missing registration or manifest is repaired, not skipped', t => {
  const s = sandbox(t);
  s.seedInstalled(2);
  const r = s.ensure();
  assert.equal(r.action, 'installed');
  assert.equal(findEntries(JSON.parse(fs.readFileSync(s.paths.settings, 'utf8')), s.paths.hook).length, 1);
  fs.rmSync(s.paths.manifest);
  assert.equal(s.ensure().action, 'installed');
  assert.equal(s.ensure().action, 'none');
});

/** What a repaired installation must look like: valid registration, manifest vouching for the source bytes. */
function assertCurrent(s) {
  assert.equal(findEntries(JSON.parse(fs.readFileSync(s.paths.settings, 'utf8')), s.paths.hook).length, 1);
  assert.deepEqual(fs.readFileSync(s.paths.hook), fs.readFileSync(s.source));
  const manifest = JSON.parse(fs.readFileSync(s.paths.manifest, 'utf8'));
  assert.equal(manifest.sha256, createHash('sha256').update(fs.readFileSync(s.source)).digest('hex'));
  assert.equal(s.ensure().action, 'none');
}

test('interrupted after settings.json, before the hook copy: the next session start installs the hook', t => {
  const s = sandbox(t);
  registerValidly(s);
  assert.equal(fs.existsSync(s.paths.hook), false);
  assert.equal(s.ensure().action, 'installed');
  assertCurrent(s);
});

test('interrupted after the hook copy, before the manifest: the next session start writes the manifest', t => {
  const s = sandbox(t);
  s.seedInstalled(2);
  registerValidly(s);
  assert.equal(fs.existsSync(s.paths.manifest), false);
  assert.equal(s.ensure().action, 'installed');
  assertCurrent(s);
});

test('a leftover temp file from an interrupted atomic copy is ignored, and the hook is installed beside it', t => {
  const s = sandbox(t);
  registerValidly(s);
  fs.mkdirSync(path.dirname(s.paths.hook), { recursive: true });
  const stale = `${s.paths.hook}.tmp-424242`;
  fs.writeFileSync(stale, 'half-written');
  assert.equal(s.ensure().action, 'installed');
  assertCurrent(s);
  // Documented behaviour: a temp file of another pid is left alone (ignored), never promoted to the hook.
  assert.equal(fs.readFileSync(stale, 'utf8'), 'half-written');
});

test('a leftover temp file of the SAME pid is overwritten by the next atomic copy', t => {
  const s = sandbox(t);
  registerValidly(s);
  fs.mkdirSync(path.dirname(s.paths.hook), { recursive: true });
  fs.writeFileSync(`${s.paths.hook}.tmp-${process.pid}`, 'half-written');
  assert.equal(s.ensure().action, 'installed');
  assertCurrent(s);
  assert.equal(fs.existsSync(`${s.paths.hook}.tmp-${process.pid}`), false);
});

/** Gives the sandbox project the conventions repository's reference layout. */
function makeReferenceLayout(s) {
  fs.mkdirSync(path.join(s.project, 'tools'), { recursive: true });
  fs.mkdirSync(path.join(s.project, 'settings', 'hooks'), { recursive: true });
  fs.writeFileSync(path.join(s.project, 'tools', 'rules.mjs'), '// reference\n');
  fs.writeFileSync(path.join(s.project, 'settings', 'hooks', 'subagent-model.mjs'), hookText(2));
}

test('the conventions repository itself (reference layout) is never installed from: skipped, home untouched', t => {
  const s = sandbox(t);
  makeReferenceLayout(s);
  const r = s.ensure();
  assert.equal(r.action, 'skipped');
  assert.equal(fs.existsSync(path.join(s.home, '.claude')), false);
  assert.deepEqual(fs.readdirSync(s.home), []);
});

test('a consumer (conventions mounted under .agents/, no tools/rules.mjs at the root) still installs', t => {
  const s = sandbox(t);
  const mount = path.join(s.project, '.agents', 'conventions');
  fs.mkdirSync(path.join(mount, 'tools'), { recursive: true });
  fs.mkdirSync(path.join(mount, 'settings', 'hooks'), { recursive: true });
  fs.writeFileSync(path.join(mount, 'tools', 'rules.mjs'), '// mount\n');
  fs.writeFileSync(path.join(mount, 'settings', 'hooks', 'subagent-model.mjs'), hookText(2));
  assert.equal(s.ensure().action, 'installed');
});
