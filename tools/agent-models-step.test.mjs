/**
 * The agent-models step of the session self-install (`ensureAgentModelsMod` and its place in `main` of
 * `settings/hooks/ensure-user-guard.mjs`): what it skips, what it prints, how often it prints it, and that a throw in it
 * costs the guard and effort lines nothing. The installer core has its own files (`tools/agent-models-install.test.mjs`
 * and the others of the family).
 *
 * The project of every case is consumer-shaped: `<project>/.claude/hooks/` is a copy of this repository's `settings/hooks/`
 * (the real released guard included) and `<project>/.agents/conventions/mods/agent-models/` is a copy of `mods/agent-models/`.
 * The spawned run is the project's own `.claude/hooks/ensure-user-guard.mjs`, as a session start runs it. Temporary homes and
 * projects are made by `ownedDir` only — never `os.homedir()`, never the real ~/.claude.
 *
 * The step is skipped on win32, so a case that spawns the hook and expects the mod's line skips there.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ensureAgentModelsMod } from '../settings/hooks/ensure-user-guard.mjs';
import { RELEASED_MOD, MOD_FILES } from '../settings/hooks/lib/agent-models-decide.mjs';
import { RELEASED_GUARD } from '../settings/hooks/lib/user-guard-install.mjs';
import {
  D, carriedText, editedLine, installedLine, notInstalled, registeredLine, sha, snapshot,
} from './lib/agent-models-fixtures.mjs';
import { ownedDir } from './lib/owned.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOOKS_SOURCE = path.join(REPO, 'settings', 'hooks');
const MOD_SOURCE = path.join(REPO, 'mods', 'agent-models');
const GUARD_LINE = `subagent-model guard installed into ~/.claude (version ${RELEASED_GUARD.version})`;
const EFFORT_LINE = 'effort set to high for every model (was: effortLevel unset, sonnet unset, opus unset, fable unset) — takes effect from the next session; restart this one to run at high now';
const MOD_VERSION = RELEASED_MOD.version;
const MOD_LINE = installedLine(MOD_VERSION);
const ADVICE = ' — the .agents/conventions submodule does not hold the pinned release; run git submodule update (said once)';
const PLUGIN_JSON = '.claude-plugin/plugin.json';

const onlyWhereTheStepRuns = t => {
  if (process.platform !== 'win32') return true;
  t.skip('the step is skipped on win32');
  return false;
};

/** A temporary home plus a consumer-shaped project; `mod: false` leaves out `.agents/conventions/mods`. Never os.homedir(). */
function sandbox(t, { mod = true } = {}) {
  const root = ownedDir(t, 'agent-models-step');
  const home = path.join(root, 'home');
  const project = path.join(root, 'project');
  fs.mkdirSync(home);
  const hooks = path.join(project, '.claude', 'hooks');
  fs.cpSync(HOOKS_SOURCE, hooks, { recursive: true, filter: p => !p.endsWith('.test.mjs') });
  const modDir = path.join(project, '.agents', 'conventions', 'mods', 'agent-models');
  if (mod) fs.cpSync(MOD_SOURCE, modDir, { recursive: true, filter: p => !p.includes(`${path.sep}.claude-plugin${path.sep}types`) });
  const entry = path.join(hooks, 'ensure-user-guard.mjs');
  const source = path.join(hooks, 'subagent-model.mjs');
  const claude = path.join(home, '.claude');
  const installed = path.join(claude, 'mods', 'agent-models');
  const settings = path.join(claude, 'settings.json');
  const optout = path.join(claude, 'mods', 'agent-models.optout');
  const reported = path.join(claude, 'mods', 'agent-models.reported.json');
  const run = (extra = {}) => spawnSync(process.execPath, [entry], {
    encoding: 'utf8', input: '{}',
    env: { ...process.env, HOME: home, USERPROFILE: home, CLAUDE_PROJECT_DIR: project, SUBAGENT_MODEL_GUARD: '', AGENT_MODELS_MOD: '', CLAUDE_CODE_PLUGIN_DIRS: '', ...extra },
  });
  const seedSettings = (value = {}) => {
    fs.mkdirSync(claude, { recursive: true });
    fs.writeFileSync(settings, `${JSON.stringify(value)}\n`);
  };
  const readSettings = () => JSON.parse(fs.readFileSync(settings, 'utf8'));
  const lines = result => (result.stdout === '' ? [] : JSON.parse(result.stdout).systemMessage.split('\n'));
  const step = async (env = {}, platform) => ensureAgentModelsMod({ home, source, env, ...(platform === undefined ? {} : { platform }) });
  return { root, home, project, hooks, modDir, entry, source, claude, installed, settings, optout, reported, run, seedSettings, readSettings, lines, step };
}

test('3.1: a fresh home gets the guard, effort and the mod in one run, one line each, guard first', t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const s = sandbox(t);
  const result = s.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.split('\n').filter(Boolean).length, 1);
  assert.deepEqual(s.lines(result), [GUARD_LINE, EFFORT_LINE, MOD_LINE]);
  assert.equal(fs.existsSync(path.join(s.installed, PLUGIN_JSON)), true);
  assert.ok(s.readSettings().env.CLAUDE_CODE_PLUGIN_DIRS.split(D).includes(s.installed));
});

test('3.2: the second run prints nothing', t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const s = sandbox(t);
  assert.equal(s.run().status, 0);
  const second = s.run();
  assert.equal(second.status, 0);
  assert.equal(second.stdout, '');
});

test('3.3: a project with the conventions repository\'s own layout at its root never installs the mod, even with the mod folder beside it', async t => {
  const s = sandbox(t);
  fs.mkdirSync(path.join(s.project, 'tools'), { recursive: true });
  fs.mkdirSync(path.join(s.project, 'settings', 'hooks'), { recursive: true });
  fs.writeFileSync(path.join(s.project, 'tools', 'rules.mjs'), '// reference\n');
  fs.writeFileSync(path.join(s.project, 'settings', 'hooks', 'subagent-model.mjs'), '// reference\n');
  s.seedSettings({});
  const before = snapshot(s.home);
  const result = await s.step();
  assert.equal(result.action, 'skipped');
  assert.deepEqual(snapshot(s.home), before);
  assert.equal(fs.existsSync(s.installed), false);
});

test('3.4: a consumer whose .agents/conventions holds the full layout is NOT taken for the reference repository: the mod installs', async t => {
  const s = sandbox(t);
  const mount = path.join(s.project, '.agents', 'conventions');
  fs.mkdirSync(path.join(mount, 'tools'), { recursive: true });
  fs.mkdirSync(path.join(mount, 'settings', 'hooks'), { recursive: true });
  fs.writeFileSync(path.join(mount, 'tools', 'rules.mjs'), '// mount\n');
  fs.writeFileSync(path.join(mount, 'settings', 'hooks', 'subagent-model.mjs'), '// mount\n');
  s.seedSettings({});
  const result = await s.step();
  assert.equal(result.action, 'installed', result.line);
  assert.equal(result.line, MOD_LINE);
});

test('3.5: AGENT_MODELS_MOD=off leaves the home byte-identical, whatever its case or spaces', async t => {
  const s = sandbox(t);
  s.seedSettings({});
  const before = snapshot(s.home);
  for (const value of ['off', 'OFF', ' off ']) {
    assert.equal((await s.step({ AGENT_MODELS_MOD: value })).action, 'skipped', `value ${JSON.stringify(value)}`);
    assert.deepEqual(snapshot(s.home), before, `value ${JSON.stringify(value)}`);
  }
});

test('3.6: the opt-out marker leaves the home byte-identical and the spawned run says nothing about the mod', async t => {
  const s = sandbox(t);
  s.seedSettings({});
  fs.mkdirSync(path.dirname(s.optout), { recursive: true });
  fs.writeFileSync(s.optout, '');
  const before = snapshot(s.home);
  assert.equal((await s.step()).action, 'skipped');
  assert.deepEqual(snapshot(s.home), before);
  assert.equal(s.run().stdout.includes('agent-models'), false);
  assert.equal(fs.existsSync(s.installed), false);
});

test('3.7: win32 is skipped and writes nothing, not even a folder', async t => {
  const s = sandbox(t);
  const result = await s.step({}, 'win32');
  assert.equal(result.action, 'skipped');
  assert.deepEqual(fs.readdirSync(s.home), []);
});

test('3.8: SUBAGENT_MODEL_GUARD=off still installs the mod and creates settings.json holding only the registration; no guard or effort line', t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const s = sandbox(t);
  const result = s.run({ SUBAGENT_MODEL_GUARD: 'off' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(s.lines(result), [MOD_LINE]);
  assert.equal(fs.existsSync(path.join(s.installed, PLUGIN_JSON)), true);
  assert.deepEqual(s.readSettings(), { env: { CLAUDE_CODE_PLUGIN_DIRS: s.installed } });
  assert.equal(fs.existsSync(path.join(s.claude, 'hooks', 'subagent-model.mjs')), false);
});

test('3.9: a throw in the mod step leaves the guard and effort lines, and no mod folder', t => {
  const s = sandbox(t);
  const lib = path.join(s.hooks, 'lib');
  fs.copyFileSync(path.join(lib, 'agent-models-install.mjs'), path.join(lib, 'agent-models-install.real.mjs'));
  fs.writeFileSync(path.join(lib, 'agent-models-install.mjs'),
    "export * from './agent-models-install.real.mjs';\nexport function ensureAgentModels() { throw new Error('boom'); }\n");
  const result = s.run();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(s.lines(result), [GUARD_LINE, EFFORT_LINE]);
  assert.equal(fs.existsSync(path.join(s.claude, 'mods')), false);
});

test('3.10: a project without .agents/conventions/mods is silent about the mod: guard and effort lines only', t => {
  const s = sandbox(t, { mod: false });
  const result = s.run();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(s.lines(result), [GUARD_LINE, EFFORT_LINE]);
  assert.equal(fs.existsSync(path.join(s.claude, 'mods')), false);
});

test('3.11: an edited copy through main() prints its line on the first run and nothing on the second', t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const s = sandbox(t);
  s.seedSettings({});
  assert.deepEqual(s.lines(s.run({ SUBAGENT_MODEL_GUARD: 'off' })), [MOD_LINE]);
  fs.appendFileSync(path.join(s.installed, 'types', 'index.d.ts'), '// mine\n');
  const first = s.run({ SUBAGENT_MODEL_GUARD: 'off' });
  assert.equal(first.status, 0, first.stderr);
  assert.deepEqual(s.lines(first), [editedLine(MOD_VERSION)]);
  const second = s.run({ SUBAGENT_MODEL_GUARD: 'off' });
  assert.equal(second.status, 0, second.stderr);
  assert.equal(second.stdout, '');
});

/** The released copy and a record that vouches for it, in the home; the record names a source that is not this project's. */
function seedInstalledCopy(s) {
  const files = Object.fromEntries(MOD_FILES.map(rel => [rel, fs.readFileSync(path.join(MOD_SOURCE, rel))]));
  for (const rel of MOD_FILES) {
    fs.mkdirSync(path.dirname(path.join(s.installed, rel)), { recursive: true });
    fs.writeFileSync(path.join(s.installed, rel), files[rel]);
  }
  const record = {
    version: MOD_VERSION, source: '/elsewhere', sha256: Object.fromEntries(MOD_FILES.map(rel => [rel, sha(files[rel])])),
    installedAt: '2026-01-01T00:00:00.000Z', by: 'self-install',
  };
  fs.writeFileSync(path.join(s.claude, 'mods', 'agent-models.installed.json'), `${JSON.stringify(record, null, 2)}\n`);
}

test('3.12: the released copy installed but not registered is registered, and the line says so', t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const s = sandbox(t);
  s.seedSettings({});
  seedInstalledCopy(s);
  const result = s.run({ SUBAGENT_MODEL_GUARD: 'off' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(s.lines(result), [registeredLine]);
});

test('3.13: the hook passes its own CLAUDE_CODE_PLUGIN_DIRS to the installer: the first registration is /a:<installed> and the line says one entry was carried over', t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const s = sandbox(t);
  s.seedSettings({});
  const result = s.run({ SUBAGENT_MODEL_GUARD: 'off', CLAUDE_CODE_PLUGIN_DIRS: '/a' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(s.lines(result), [MOD_LINE + carriedText(1)]);
  assert.equal(s.readSettings().env.CLAUDE_CODE_PLUGIN_DIRS, `/a${D}${s.installed}`);
});

test('3.14: a copy another installer left (a record that names another source) with its registration gives none: no line, the home byte-identical', async t => {
  const s = sandbox(t);
  s.seedSettings({ env: { CLAUDE_CODE_PLUGIN_DIRS: s.installed } });
  seedInstalledCopy(s);
  const before = snapshot(s.home);
  const result = await s.step();
  assert.deepEqual([result.action, result.line], ['none', '']);
  assert.deepEqual(snapshot(s.home), before);
});

/** The project's copy of the mod with its plugin.json at another version: what a submodule that was not updated holds. */
function staleCopy(s, version) {
  const file = path.join(s.modDir, PLUGIN_JSON);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(MOD_VERSION, version));
}

test('3.15: a stale submodule is refused with the advice to update it, said once: the second run is silent and the mods folder holds only the reported record', t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const s = sandbox(t);
  s.seedSettings({});
  staleCopy(s, '0.0.1');
  const reason = `source ${s.modDir} is not the released mod ${MOD_VERSION}: ${PLUGIN_JSON} is version 0.0.1, released ${MOD_VERSION}`;
  const first = s.run({ SUBAGENT_MODEL_GUARD: 'off' });
  assert.equal(first.status, 0, first.stderr);
  assert.deepEqual(s.lines(first), [notInstalled(reason) + ADVICE]);
  const second = s.run({ SUBAGENT_MODEL_GUARD: 'off' });
  assert.equal(second.status, 0, second.stderr);
  assert.equal(second.stdout, '');
  assert.deepEqual(fs.readdirSync(path.join(s.claude, 'mods')), ['agent-models.reported.json']);
});

test('3.16: an edited file of the project copy is named with both digests once; a further change is a new line, once', t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const s = sandbox(t);
  s.seedSettings({});
  const file = path.join(s.modDir, 'hooks', 'prompts.ts');
  const refusal = () => notInstalled(`source ${s.modDir} is not the released mod ${MOD_VERSION}: hooks/prompts.ts differs `
    + `(sha256 ${sha(fs.readFileSync(file)).slice(0, 12)}, released ${RELEASED_MOD.sha256['hooks/prompts.ts'].slice(0, 12)})`) + ADVICE;
  for (const edit of ['// one\n', '// two\n']) {
    fs.appendFileSync(file, edit);
    const first = s.run({ SUBAGENT_MODEL_GUARD: 'off' });
    assert.deepEqual(s.lines(first), [refusal()], `after ${JSON.stringify(edit)}`);
    assert.equal(s.run({ SUBAGENT_MODEL_GUARD: 'off' }).stdout, '', `the repeat after ${JSON.stringify(edit)}`);
  }
});

/** What a load failure of the mod's modules looks like in a consumer: a sibling that is gone, and one that does not parse. */
const LOAD_FAILURES = [
  ['a missing sibling module', lib => fs.rmSync(path.join(lib, 'agent-models-swap.mjs'))],
  ['a sibling module with a syntax error', lib => fs.writeFileSync(path.join(lib, 'agent-models-read.mjs'), 'export const broken = ;\n')],
];

for (const [name, damage] of LOAD_FAILURES) {
  test(`3.17: ${name} in the mod's modules is a silent skip of the mod step: the hook exits 0, prints the guard and effort lines and installs the guard`, t => {
    const s = sandbox(t);
    damage(path.join(s.hooks, 'lib'));
    const result = s.run();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(s.lines(result), [GUARD_LINE, EFFORT_LINE]);
    assert.equal(fs.existsSync(path.join(s.claude, 'hooks', 'subagent-model.mjs')), true, 'the guard was installed');
    assert.equal(fs.existsSync(path.join(s.claude, 'mods')), false, 'the mod step wrote nothing');
  });
}
