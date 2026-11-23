/**
 * The marketplace step of the session self-install: `ensureModsMarketplaceStep` and its place in `main` of
 * `settings/hooks/ensure-user-guard.mjs`, the spawned runs, and the FROZEN old installer
 * (`tools/fixtures/retired-installer/`, the six files of `c598a11`) played against the same home (E3, story 3.1; the
 * scenario ids R7, M5*, S1, S2, W2, W3, T1(c) are those of `todo/PLAN_dew_flow_mods_E3.md`). The lib's own scenarios are in
 * `tools/mods-marketplace.test.mjs`.
 *
 * The frozen step is the second implementation of the marker contract (`common/testing.md`): it stands for a consumer on an
 * old pin. It is the only code that imports from the fixture. The control M5p reads the seven 1.4.0 mod files from git history
 * (`git show c598a11:mods/agent-models/<file>`) at test time, so the clone that runs this file must hold `c598a11`.
 *
 * Every home and project is made by `ownedDir`; a spawned hook gets HOME, USERPROFILE and CLAUDE_CONFIG_DIR pointed into the
 * temp folder, and every spawned home is asserted not to be the real one. The step is skipped on win32.
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ensureModsMarketplaceStep, modsStepRefusal } from '../settings/hooks/ensure-user-guard.mjs';
import { LINES, INLINE_ID, MARKETPLACE, PLUGIN_ID } from '../settings/hooks/lib/mods-marketplace.mjs';
import { RELEASED_GUARD } from '../settings/hooks/lib/user-guard-install.mjs';
import { ensureAgentModelsMod as frozenStep } from './fixtures/retired-installer/hooks/ensure-user-guard.mjs';
import { MOD_FILES as FROZEN_MOD_FILES, RELEASED_MOD as FROZEN_RELEASED } from './fixtures/retired-installer/hooks/lib/agent-models-decide.mjs';
import { at, names, sandbox, snapshot, symlinkOrSkip } from './lib/mods-marketplace-fixtures.mjs';
import { ownedDir } from './lib/owned.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOOKS_SOURCE = path.join(REPO, 'settings', 'hooks');
const FROZEN_COMMIT = 'c598a11';
const GUARD_LINE = `subagent-model guard installed into ~/.claude (version ${RELEASED_GUARD.version})`;
const EFFORT_LINE = 'effort set to high for every model (was: effortLevel unset, sonnet unset, opus unset, fable unset) — takes effect from the next session; restart this one to run at high now';
const ANCIENT = '2020-01-01T00:00:00.000Z';

const onlyWhereTheStepRuns = t => {
  if (process.platform !== 'win32') return true;
  t.skip('the step is skipped on win32');
  return false;
};

/**
 * A consumer-shaped project beside the home of `h`: `.claude/hooks` is a copy of this repository's `settings/hooks/`
 * (no tests), so the hook that runs is the project's own, as a session start runs it.
 */
function consumer(h, { reference = false } = {}) {
  const project = path.join(h.root, 'project');
  const hooks = path.join(project, '.claude', 'hooks');
  fs.cpSync(HOOKS_SOURCE, hooks, { recursive: true, filter: p => !p.endsWith('.test.mjs') });
  if (reference) {
    fs.mkdirSync(path.join(project, 'tools'), { recursive: true });
    fs.mkdirSync(path.join(project, 'settings', 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(project, 'tools', 'rules.mjs'), '// reference\n');
    fs.writeFileSync(path.join(project, 'settings', 'hooks', 'subagent-model.mjs'), '// reference\n');
  }
  assert.notEqual(path.resolve(h.home), path.resolve(os.homedir()), 'a spawned hook never runs on the real home');
  const entry = path.join(hooks, 'ensure-user-guard.mjs');
  const source = path.join(hooks, 'subagent-model.mjs');
  const run = (extra = {}, { input = '{}', stdio } = {}) => spawnSync(process.execPath, [entry], {
    encoding: 'utf8', ...(stdio === undefined ? { input } : { stdio }),
    env: {
      ...process.env, HOME: h.home, USERPROFILE: h.home, CLAUDE_CONFIG_DIR: h.claude, CLAUDE_PROJECT_DIR: project,
      SUBAGENT_MODEL_GUARD: '', AGENT_MODELS_MOD: '', CLAUDE_CODE_PLUGIN_DIRS: '', CLAUDE_CODE_PLUGIN_CACHE_DIR: '', ...extra,
    },
  });
  const lines = result => (result.stdout === '' ? [] : JSON.parse(result.stdout).systemMessage.split('\n'));
  return { project, hooks, entry, source, run, lines, lib: path.join(hooks, 'lib', 'mods-marketplace.mjs') };
}

// ---------------------------------------------------------------------------------------------------------------------
// R7: what the step skips
// ---------------------------------------------------------------------------------------------------------------------

/** Old copy + engine, no registration: what the step would act on if it ran. */
const loaded = (h) => {
  h.old('1.4.0');
  h.engine('1.6.0');
};

test('R7: AGENT_MODELS_MOD off, in any case or with spaces: skipped, the home untouched', async t => {
  const h = sandbox(t, 'mods-step');
  const c = consumer(h);
  loaded(h);
  const before = snapshot(h.home);
  for (const value of ['off', 'OFF', ' off ']) {
    const result = await ensureModsMarketplaceStep({ home: h.home, source: c.source, env: { AGENT_MODELS_MOD: value } });
    assert.deepEqual([result.action, result.line], ['skipped', ''], JSON.stringify(value));
    assert.deepEqual(snapshot(h.home), before, JSON.stringify(value));
  }
  assert.equal(fs.existsSync(h.state), false);
});

test('R7: win32 is skipped and writes nothing, not even a folder', async t => {
  const h = sandbox(t, 'mods-step');
  const c = consumer(h);
  const result = await ensureModsMarketplaceStep({ home: h.home, source: c.source, env: {}, platform: 'win32' });
  assert.deepEqual([result.action, result.line], ['skipped', '']);
  assert.deepEqual(fs.readdirSync(h.home), []);
});

test('R7: a project with the conventions repository\'s own layout never registers, whatever the home holds', async t => {
  const h = sandbox(t, 'mods-step');
  const c = consumer(h, { reference: true });
  loaded(h);
  const before = snapshot(h.home);
  const result = await ensureModsMarketplaceStep({ home: h.home, source: c.source, env: {} });
  assert.deepEqual([result.action, result.line], ['skipped', '']);
  assert.deepEqual(snapshot(h.home), before);
});

test('R7: a consumer whose .agents/conventions holds the full layout is not taken for the reference repository: the step runs', async t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const h = sandbox(t, 'mods-step');
  const c = consumer(h);
  const mount = path.join(c.project, '.agents', 'conventions');
  fs.mkdirSync(path.join(mount, 'tools'), { recursive: true });
  fs.mkdirSync(path.join(mount, 'settings', 'hooks'), { recursive: true });
  fs.writeFileSync(path.join(mount, 'tools', 'rules.mjs'), '// mount\n');
  fs.writeFileSync(path.join(mount, 'settings', 'hooks', 'subagent-model.mjs'), '// mount\n');
  const result = await ensureModsMarketplaceStep({ home: h.home, source: c.source, env: {} });
  assert.equal(result.action, 'registered', result.line);
});

const PERSON_MARKERS = [
  ['an empty file', h => fs.writeFileSync(h.optout, '')],
  ['a folder', h => fs.mkdirSync(h.optout)],
  ['a link', (h, t) => symlinkOrSkip(t, path.join(h.root, 'elsewhere'), h.optout)],
  ['other JSON', h => fs.writeFileSync(h.optout, '{}')],
];

for (const [name, make] of PERSON_MARKERS) {
  test(`R7: a marker that is ${name} is the person's opt-out: skipped, nothing written, with the old copy and the engine in place`, async t => {
    if (!onlyWhereTheStepRuns(t)) return;
    const h = sandbox(t, 'mods-step');
    const c = consumer(h);
    loaded(h);
    fs.mkdirSync(h.mods, { recursive: true });
    if (make(h, t) === false) return;
    const before = snapshot(h.home);
    for (let n = 0; n < 2; n += 1) {
      const result = await ensureModsMarketplaceStep({ home: h.home, source: c.source, env: {} });
      assert.deepEqual([result.action, result.line], ['skipped', ''], name);
    }
    assert.deepEqual(snapshot(h.home), before);
    assert.equal(fs.existsSync(h.state), false, 'no state file');
    assert.equal(h.readSettings().enabledPlugins?.[PLUGIN_ID], undefined, 'not even the registration');
  });
}

test('the step in the hook calls the lib with the home and the env it was given, and returns what the lib returns', async t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const h = sandbox(t, 'mods-step');
  const c = consumer(h);
  const result = await ensureModsMarketplaceStep({ home: h.home, source: c.source, env: {} });
  assert.deepEqual([result.action, result.line], ['registered', LINES.registered()]);
  assert.deepEqual(h.readSettings().extraKnownMarketplaces[MARKETPLACE].source.ref, 'release');
});

test('M9c: the shell line follows the SessionStart source of the payload: said at startup, never at resume, clear, compact, an unknown source or no payload source', t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const h = sandbox(t, 'mods-spawn');
  const c = consumer(h);
  h.reg();
  h.engine('1.6.0');
  h.retired(at(-48), '1.6.0');
  const stale = { CLAUDE_CODE_PLUGIN_DIRS: h.oldFolder };
  for (const input of ['{"source":"resume"}', '{"source":"clear"}', '{"source":"compact"}', '{"source":7}', '{}', 'not json']) {
    const result = c.run(stale, { input });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(!c.lines(result).includes(LINES.shell()), input);
  }
  const startup = c.run(stale, { input: '{"source":"startup"}' });
  assert.equal(startup.status, 0, startup.stderr);
  assert.deepEqual(c.lines(startup).filter(line => line === LINES.shell()), [LINES.shell()]);
  assert.ok(!c.lines(c.run(stale, { input: '{"source":"startup"}' })).includes(LINES.shell()), 'said once');
});

test('the hook and the lib are byte-identical in .claude/hooks (adapter-check demands the copies)', () => {
  for (const rel of ['ensure-user-guard.mjs', path.join('lib', 'mods-marketplace.mjs'), path.join('lib', 'user-guard-install.mjs')]) {
    assert.deepEqual(fs.readFileSync(path.join(REPO, '.claude', 'hooks', rel)), fs.readFileSync(path.join(HOOKS_SOURCE, rel)), rel);
  }
});

// ---------------------------------------------------------------------------------------------------------------------
// the frozen old installer: the second implementation of the marker contract
// ---------------------------------------------------------------------------------------------------------------------

/** The seven 1.4.0 mod files, read from git history (the fixture holds none of the bytes). A missing commit is a failure, never a skip. */
function frozenModBytes() {
  try {
    return new Map(FROZEN_MOD_FILES.map(rel => [rel, execFileSync('git', ['show', `${FROZEN_COMMIT}:mods/agent-models/${rel}`], { cwd: REPO, maxBuffer: 1 << 24, stdio: ['ignore', 'pipe', 'pipe'] })]));
  } catch (error) {
    throw new Error(`the control needs ${FROZEN_COMMIT} in the clone's history (git show ${FROZEN_COMMIT}:mods/agent-models/…): ${error.stderr ?? error.message}`, { cause: error });
  }
}

/** A consumer-shaped project holding the frozen project layout and the 1.4.0 mod in its submodule folder; the frozen step is run on `source`. */
function frozenProject(h) {
  const project = path.join(h.root, 'frozen-project');
  const modDir = path.join(project, '.agents', 'conventions', 'mods', 'agent-models');
  for (const [rel, bytes] of frozenModBytes()) {
    fs.mkdirSync(path.dirname(path.join(modDir, rel)), { recursive: true });
    fs.writeFileSync(path.join(modDir, rel), bytes);
  }
  const source = path.join(project, '.claude', 'hooks', 'subagent-model.mjs');
  return { project, modDir, source, step: (env = {}) => frozenStep({ home: h.home, source, env }) };
}

test('M5p (the control): the frozen step on an empty home with no marker installs 1.4.0 and registers the folder — the fixture is not rejected', async t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const h = sandbox(t, 'mods-frozen');
  const f = frozenProject(h);
  const result = await f.step();
  assert.equal(result.action, 'installed', result.line);
  assert.ok(result.line.includes(FROZEN_RELEASED.version), result.line);
  assert.equal(fs.existsSync(path.join(h.oldFolder, '.claude-plugin', 'plugin.json')), true);
  assert.equal(h.readSettings().env.CLAUDE_CODE_PLUGIN_DIRS, h.oldFolder);
  assert.equal(FROZEN_RELEASED.version, '1.4.0');
  assert.equal(FROZEN_MOD_FILES.length, 7);
});

/** M4's start state: registered, the old copy, the engine. */
const m4 = h => {
  h.reg();
  h.old('1.4.0');
  h.engine('1.6.0');
};

test('M5a: the step cut off right after the tombstone: the frozen step skips and leaves the home untouched; the next run of the step writes INLINE_ID false and says retired once', async t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const h = sandbox(t, 'mods-frozen');
  const f = frozenProject(h);
  m4(h);
  assert.deepEqual([h.step({ stopAfter: 'tombstone' }).action, h.readSettings().enabledPlugins[INLINE_ID]], ['none', undefined]);
  const before = snapshot(h.home);
  const result = await f.step({ CLAUDE_CODE_PLUGIN_DIRS: h.oldFolder });
  assert.deepEqual([result.action, result.line], ['skipped', '']);
  assert.deepEqual(snapshot(h.home), before, 'the frozen step touched nothing');
  const next = h.step();
  assert.deepEqual([next.action, h.linesOf(next)], ['retired', [LINES.retired('1.6.0', true)]]);
  assert.equal(h.readSettings().enabledPlugins[INLINE_ID], false);
});

test('M5b: the step cut off right after INLINE_ID false: the frozen step leaves the home untouched; at +1 h retiredAt is stored in silence; at +25 h step 2 runs', async t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const h = sandbox(t, 'mods-frozen');
  const f = frozenProject(h);
  m4(h);
  assert.equal(h.step({ stopAfter: 'inline' }).action, 'none');
  const before = snapshot(h.home);
  assert.deepEqual([(await f.step()).action, (await f.step()).line], ['skipped', '']);
  assert.deepEqual(snapshot(h.home), before);
  const early = h.step({ now: () => at(1) });
  assert.deepEqual([early.action, early.line], ['none', '']);
  assert.equal(h.readState().retiredAt, at(1).toISOString());
  const later = h.step({ now: () => at(25) });
  assert.deepEqual([later.action, h.linesOf(later)], ['removed', [LINES.removed()]]);
  assert.equal(fs.existsSync(h.oldFolder), false);
});

for (const stopAfter of ['variable', 'rename', 'folder']) {
  test(`M5c-e: step 2 cut off after ${stopAfter}: the frozen step leaves the home untouched and no folder comes back; the step finishes it; removed is said once`, async t => {
    if (!onlyWhereTheStepRuns(t)) return;
    const h = sandbox(t, 'mods-frozen');
    const f = frozenProject(h);
    h.reg();
    h.old('1.4.0');
    fs.writeFileSync(h.oldReported, '{"key":"x"}');
    h.engine('1.6.0');
    h.retired(at(-25), '1.6.0');
    assert.equal(h.step({ stopAfter }).action, 'none');
    const before = snapshot(h.home);
    const frozen = await f.step({ CLAUDE_CODE_PLUGIN_DIRS: '' });
    assert.deepEqual([frozen.action, frozen.line], ['skipped', '']);
    assert.deepEqual(snapshot(h.home), before, 'untouched');
    const done = h.step();
    assert.deepEqual([done.action, h.linesOf(done)], ['removed', [LINES.removed()]]);
    assert.equal(Object.hasOwn(h.readSettings().env ?? {}, 'CLAUDE_CODE_PLUGIN_DIRS'), false);
    assert.equal(fs.existsSync(h.oldFolder), false);
    assert.deepEqual(names(h.mods).filter(n => n.includes('retired')), []);
    assert.equal(fs.existsSync(h.oldManifest), false);
    assert.equal(fs.existsSync(h.oldReported), false);
    assert.equal((await f.step()).action, 'skipped', 'and it never installs again: the tombstone stays');
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// S1, S2: the whole hook, spawned, as a session start runs it
// ---------------------------------------------------------------------------------------------------------------------

test('S1: this machine\'s state (other plugins and runpod, the old 1.4.0 copy, no keys): five starts of the spawned hook: registered, retired, silent, removed after 25 h, silent', t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const h = sandbox(t, 'mods-spawn');
  const c = consumer(h);
  const others = { 'runpod@runpod-plugins': true, 'other@x': false };
  h.writeSettings({ effortLevel: 'high', enabledPlugins: others, theme: 'dark' });
  h.old('1.4.0');
  const folderBefore = snapshot(h.oldFolder);
  const base = h.readSettings();
  const env = { SUBAGENT_MODEL_GUARD: 'off' };

  const one = c.run(env);
  assert.equal(one.status, 0, one.stderr);
  assert.deepEqual(c.lines(one), [LINES.registered()]);
  const afterOne = h.readSettings();
  assert.deepEqual(afterOne.enabledPlugins, { ...others, [PLUGIN_ID]: true });
  assert.equal(afterOne.enabledPlugins[INLINE_ID], undefined, 'INLINE_ID untouched');
  assert.equal(afterOne.env.CLAUDE_CODE_PLUGIN_DIRS, h.oldFolder, 'the variable untouched');
  assert.deepEqual(snapshot(h.oldFolder), folderBefore);
  assert.equal(fs.existsSync(h.optout), false, 'no marker');
  assert.equal(afterOne.theme, base.theme);

  h.engine('1.6.0');
  const two = c.run(env);
  assert.equal(two.status, 0, two.stderr);
  assert.deepEqual(c.lines(two), [LINES.retired('1.6.0', true)]);
  assert.equal(h.readSettings().enabledPlugins[INLINE_ID], false);
  assert.equal(JSON.parse(fs.readFileSync(h.optout, 'utf8')).tombstone, 'dew-flow-mods');

  const settingsAfterTwo = fs.readFileSync(h.settings);
  const three = c.run(env);
  assert.equal(three.status, 0, three.stderr);
  assert.equal(three.stdout, '');
  assert.deepEqual(fs.readFileSync(h.settings), settingsAfterTwo);
  assert.deepEqual(snapshot(h.oldFolder), folderBefore);

  h.writeState({ ...h.readState(), retiredAt: ANCIENT });
  const started = performance.now();
  const four = c.run(env, { stdio: ['ignore', 'pipe', 'pipe'] });
  const elapsed = performance.now() - started;
  assert.equal(four.status, 0, four.stderr);
  assert.deepEqual(c.lines(four), [LINES.removed()]);
  assert.ok(elapsed < 3000, `T1 (c): start 4 took ${elapsed.toFixed(0)} ms with stdin closed`);
  const final = h.readSettings();
  assert.deepEqual(final.enabledPlugins, { ...others, [PLUGIN_ID]: true, [INLINE_ID]: false }, 'other plugins and runpod are deep-equal');
  assert.equal(Object.hasOwn(final.env ?? {}, 'CLAUDE_CODE_PLUGIN_DIRS'), false);
  assert.equal(fs.existsSync(h.oldFolder), false);

  const five = c.run(env);
  assert.equal(five.status, 0, five.stderr);
  assert.equal(five.stdout, '');
});

test('S2: an empty home: the guard, effort and registered lines in that order; then the engine and a start: tombstone and false; nothing to remove later', t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const h = sandbox(t, 'mods-spawn');
  const c = consumer(h);
  const first = c.run();
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout.split('\n').filter(Boolean).length, 1, 'one systemMessage');
  assert.deepEqual(c.lines(first), [GUARD_LINE, EFFORT_LINE, LINES.registered()]);
  h.engine('1.6.0');
  const second = c.run();
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(c.lines(second), [LINES.retired('1.6.0', false)]);
  assert.equal(JSON.parse(fs.readFileSync(h.optout, 'utf8')).tombstone, 'dew-flow-mods');
  assert.equal(h.readSettings().enabledPlugins[INLINE_ID], false);
  h.writeState({ ...h.readState(), retiredAt: ANCIENT });
  const third = c.run();
  assert.equal(third.status, 0, third.stderr);
  assert.equal(third.stdout, '', 'nothing to remove: no old folder, no entry');
  assert.equal(c.run().stdout, '');
});

test('W2: SUBAGENT_MODEL_GUARD=off does not skip the step: the registration is written and said, with no guard or effort line', t => {
  if (!onlyWhereTheStepRuns(t)) return;
  const h = sandbox(t, 'mods-spawn');
  const c = consumer(h);
  const result = c.run({ SUBAGENT_MODEL_GUARD: 'off' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(c.lines(result), [LINES.registered()]);
  assert.deepEqual(h.readSettings(), { extraKnownMarketplaces: h.readSettings().extraKnownMarketplaces, enabledPlugins: { [PLUGIN_ID]: true } });
  assert.equal(fs.existsSync(path.join(h.claude, 'hooks', 'subagent-model.mjs')), false, 'no guard');
});

/** [name, how the project's lib is damaged, the reason the hook names]. */
const LIB_FAILURES = [
  ['a lib that throws at import', lib => fs.writeFileSync(lib, "throw new Error('boom at import');\n"), 'Error'],
  ['a lib with a syntax error', lib => fs.writeFileSync(lib, 'export const broken = ;\n'), 'SyntaxError'],
  ['a lib that is missing', lib => fs.rmSync(lib), 'ERR_MODULE_NOT_FOUND'],
  ['a lib whose function throws inside', lib => {
    fs.copyFileSync(lib, lib.replace('.mjs', '.real.mjs'));
    fs.writeFileSync(lib, "export * from './mods-marketplace.real.mjs';\nexport function ensureModsMarketplace() { throw new Error('boom inside'); }\n");
  }, 'Error'],
];

for (const [name, damage, reason] of LIB_FAILURES) {
  test(`W3: ${name}: the hook exits 0, the guard and effort lines print, the step turns the failure into a refusal with the reason, and the home holds nothing of the step`, t => {
    if (!onlyWhereTheStepRuns(t)) return;
    const h = sandbox(t, 'mods-spawn');
    const c = consumer(h);
    damage(c.lib);
    const result = c.run();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(c.lines(result), [GUARD_LINE, EFFORT_LINE, modsStepRefusal(reason)]);
    assert.ok(modsStepRefusal(reason).includes(reason));
    assert.equal(fs.existsSync(h.mods), false, 'no folder of the step');
    assert.equal(fs.existsSync(path.join(h.claude, 'hooks', 'subagent-model.mjs')), true, 'the guard was installed');
    const settings = h.readSettings();
    assert.equal(settings.extraKnownMarketplaces, undefined);
    assert.equal(settings.enabledPlugins?.[PLUGIN_ID], undefined);
    const again = c.run();
    assert.deepEqual(c.lines(again), [modsStepRefusal(reason)], 'nothing can record it without the lib: the line stands at every start');
  });
}

test('W3: the refusal line says the step could not run, with the code, and never that the marketplace is not registered (it may be, on a machine registered before)', () => {
  assert.equal(modsStepRefusal('ERR_MODULE_NOT_FOUND'), 'agent-models: the dew-flow-mods step could not run (ERR_MODULE_NOT_FOUND) — the old copy is left as it is; copy the hook files of the release again');
  assert.ok(!modsStepRefusal('x').includes('NOT registered'));
});

test('the refusal line for a lib that cannot load names no path of the user and starts like the other lines of the step', () => {
  assert.ok(!modsStepRefusal('ERR_MODULE_NOT_FOUND').includes(os.homedir()));
  assert.ok(modsStepRefusal('x').startsWith('agent-models'));
});
