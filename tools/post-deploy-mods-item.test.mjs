/**
 * `POST_DEPLOY.md` item 4 — "the agent-models mod does not load from dew-flow-mods on the owner's machine"
 * (`todo/PLAN_dew_flow_mods_E4.md` story 4.3). The item is a read-only `node -e` over `~/.claude`.
 *
 * The command is read from the real `POST_DEPLOY.md` and run here on a TEMPORARY home (`HOME` and `USERPROFILE`
 * both point at an `ownedDir` folder). Never the real `~/.claude`: this file reads nothing there and writes nothing
 * there. The last test proves the command writes nothing: the temp home is byte-equal before and after.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ownedDir } from './lib/owned.mjs';
import { inspect } from './post-deploy-check.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SYMPTOM = /agent-models mod does not load from dew-flow-mods/;
const KEY = 'agent-models@dew-flow-mods';
const INLINE = 'agent-models@inline';

const { findings, items } = inspect(fs.readFileSync(path.join(ROOT, 'POST_DEPLOY.md'), 'utf8'));
const item = items.find(i => SYMPTOM.test(i.symptom));

/** A temp home holding a whole install and the two settings; `change` edits the parts before they are written. */
function home(t, change = () => {}) {
  const dir = ownedDir(t, 'pdmods');
  const install = path.join(dir, '.claude', 'plugins', 'cache', 'dew-flow-mods', 'agent-models', '1.6.1');
  const parts = {
    record: { scope: 'user', installPath: install, version: '1.6.1' },
    manifest: { name: 'agent-models', version: '1.6.1' },
    enabled: { [INLINE]: false, [KEY]: true },
    installed: null,
    settings: null,
    install,
  };
  change(parts);
  fs.mkdirSync(path.join(install, '.claude-plugin'), { recursive: true });
  if (parts.manifest) fs.writeFileSync(path.join(install, '.claude-plugin', 'plugin.json'), JSON.stringify(parts.manifest));
  parts.installed ??= { version: 2, plugins: parts.record ? { [KEY]: [parts.record] } : {} };
  parts.settings ??= { enabledPlugins: parts.enabled };
  fs.writeFileSync(path.join(dir, '.claude', 'plugins', 'installed_plugins.json'), JSON.stringify(parts.installed));
  fs.writeFileSync(path.join(dir, '.claude', 'settings.json'), JSON.stringify(parts.settings));
  return dir;
}

function runItem(dir) {
  const env = { ...process.env, HOME: dir, USERPROFILE: dir, AGENT_MODELS_MOD: 'off' };
  const r = spawnSync(item.command, { shell: true, env, encoding: 'utf8', timeout: 15000 });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

const tree = dir => fs.readdirSync(dir, { recursive: true }).sort().map(n => {
  const f = path.join(dir, n);
  return fs.statSync(f).isFile() ? `${n}:${fs.readFileSync(f, 'utf8')}` : n;
});

test('POST_DEPLOY.md still has a good shape and stays within its cap with item 4 in', () => {
  assert.deepEqual(findings, []);
  assert.equal(items.length, 4);
  assert.ok(items.length <= 12);
});

test('item 4 exists, is automated and names what a person loses', () => {
  assert.ok(item, 'no item says the agent-models mod does not load from dew-flow-mods');
  assert.equal(item.number, 4);
  assert.equal(item.manual, false);
  assert.ok(item.command.length > 0);
});

test('item 4 passes on a whole install: record, cached manifest of the same version, inline off, dew-flow-mods on', t => {
  const r = runItem(home(t));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /agent-models@dew-flow-mods 1\.6\.1/);
});

const MISSES = [
  ['no install record', p => { p.record = null; }, /no user-scope install record/],
  ['a record of scope project', p => { p.record.scope = 'project'; }, /no user-scope install record/],
  ['a record without a version', p => { delete p.record.version; }, /no version/],
  ['an installPath that does not exist', p => { p.record.installPath = path.join(p.install, 'gone'); }, /installPath/],
  ['no cached plugin.json', p => { p.manifest = null; }, /plugin\.json/],
  ['a cached manifest with another name', p => { p.manifest.name = 'other'; }, /name/],
  ['a cached manifest with another version', p => { p.manifest.version = '1.6.0'; }, /version/],
  ['agent-models@inline not false', p => { p.enabled[INLINE] = true; }, /agent-models@inline/],
  ['agent-models@inline absent', p => { delete p.enabled[INLINE]; }, /agent-models@inline/],
  ['agent-models@dew-flow-mods disabled', p => { p.enabled[KEY] = false; }, /agent-models@dew-flow-mods/],
  ['agent-models@dew-flow-mods absent', p => { delete p.enabled[KEY]; }, /agent-models@dew-flow-mods/],
  ['an installed_plugins.json of version 1', p => { p.installed = { version: 1, plugins: { [KEY]: [p.record] } }; }, /version is not 2/],
  ['a settings.json with no enabledPlugins', p => { p.settings = {}; }, /agent-models@inline/],
];
for (const [name, change, expected] of MISSES) {
  test(`item 4 fails and says what is wrong: ${name}`, t => {
    const r = runItem(home(t, change));
    assert.notEqual(r.code, 0, r.out);
    assert.match(r.out, expected);
  });
}

test('item 4 fails when the home has no ~/.claude at all, and says so', t => {
  const r = runItem(ownedDir(t, 'pdmods'));
  assert.notEqual(r.code, 0);
  assert.match(r.out, /installed_plugins\.json/);
});

test('item 4 writes nothing: the temp home is byte-equal after a pass and after a fail', t => {
  const good = home(t);
  const before = tree(good);
  assert.equal(runItem(good).code, 0);
  assert.deepEqual(tree(good), before);

  const bad = home(t, p => { p.enabled[KEY] = false; });
  const beforeBad = tree(bad);
  assert.notEqual(runItem(bad).code, 0);
  assert.deepEqual(tree(bad), beforeBad);
});
