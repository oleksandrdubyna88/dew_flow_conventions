/**
 * The agent-models installer's refusals and carry-over (`settings/hooks/lib/agent-models-install.mjs`): the typed retry tail of
 * a refused registration, the session's own plugin dirs carried into a first registration, a target file that cannot be read,
 * an unexpected throw, and a lost race with a refused registration. Temporary homes only, never the real ~/.claude.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  S, IS_ROOT, installedLine, notRegistered, notInstalled, writeTree, snapshot, sandbox, renameSeam, D, RETRY_TAIL,
  HAND_TAIL, carriedText,
} from './lib/agent-models-fixtures.mjs';

test('1i: a settings env that is an array is told as "fix it by hand", never as "the next session start registers it"', t => {
  const s = sandbox(t);
  s.seedTarget();
  s.writeSettings({ env: [] });
  const r = s.ensure();
  assert.equal(r.line, notRegistered('1.2.3', `${s.t_.settings}: env is not an object`, HAND_TAIL));
  assert.equal(r.line.includes('next session start'), false);
});

test('1j: a settings file whose creation or write fails keeps the tail "the next session start registers it"', t => {
  const created = sandbox(t);
  created.seedTarget();
  fs.mkdirSync(`${created.t_.settings}.tmp-${process.pid}`); // makes the temp-file write fail: there is no settings.json to create
  const first = created.ensure();
  assert.match(first.line, /could not be written \(\w+\)/);
  assert.ok(first.line.endsWith(RETRY_TAIL), first.line);
  assert.equal(fs.existsSync(created.t_.settings), false);
  const failing_ = sandbox(t);
  failing_.seedTarget();
  failing_.writeSettings({ model: 'x' });
  fs.mkdirSync(`${fs.realpathSync(failing_.t_.settings)}.tmp-${process.pid}`);
  const r = failing_.ensure();
  assert.match(r.line, /could not be written/);
  assert.ok(r.line.endsWith(RETRY_TAIL), r.line);
});

test('A4: the first registration into an empty value carries the session\'s own plugin dirs before ours, and the line says so', t => {
  const s = sandbox(t);
  s.writeSettings({});
  const r = s.ensure({ inheritedPluginDirs: `/a${D}/b${D}/a` });
  assert.equal(r.line, installedLine('1.2.3') + carriedText(2));
  assert.equal(JSON.parse(s.readSettings()).env.CLAUDE_CODE_PLUGIN_DIRS, ['/a', '/b', s.t_.target].join(D));
});

test('A4: a settings value that is not empty gets only ours appended and the line carries no carry-over text', t => {
  const s = sandbox(t);
  s.writeSettings({ env: { CLAUDE_CODE_PLUGIN_DIRS: '/x' } });
  const r = s.ensure({ inheritedPluginDirs: '/a' });
  assert.equal(r.line, installedLine('1.2.3'));
  assert.equal(JSON.parse(s.readSettings()).env.CLAUDE_CODE_PLUGIN_DIRS, `/x${D}${s.t_.target}`);
});

test('A4: the module reads no environment variable: with no inheritedPluginDirs nothing is carried, whatever the process holds', t => {
  const s = sandbox(t);
  s.writeSettings({});
  const saved = process.env.CLAUDE_CODE_PLUGIN_DIRS;
  process.env.CLAUDE_CODE_PLUGIN_DIRS = '/from/the/process';
  try {
    s.ensure();
  } finally {
    if (saved === undefined) delete process.env.CLAUDE_CODE_PLUGIN_DIRS;
    else process.env.CLAUDE_CODE_PLUGIN_DIRS = saved;
  }
  assert.equal(JSON.parse(s.readSettings()).env.CLAUDE_CODE_PLUGIN_DIRS, s.t_.target);
});

test('A6: a target file that cannot be read is a refusal naming that file and the code, and the target is untouched', t => {
  if (IS_ROOT || process.platform === 'win32') return t.skip('permissions do not bind root / Windows');
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget();
  const before = snapshot(s.t_.mods);
  const file = path.join(s.t_.target, 'hooks', 'register.tsx');
  fs.chmodSync(file, 0o000);
  try {
    const r = s.ensure();
    assert.equal(r.action, 'refused');
    assert.equal(r.line, notInstalled(`${file} could not be read (EACCES)`));
  } finally {
    fs.chmodSync(file, 0o644);
  }
  const after = snapshot(s.t_.mods);
  assert.notEqual(after['agent-models.reported.json'], undefined, 'the refusal is recorded, so it is said once');
  delete after['agent-models.reported.json'];
  assert.deepEqual(after, before);
});

test('A6: an unexpected throw is told with its name and message, not a bare code', t => {
  const s = sandbox(t);
  s.writeSettings({});
  const r = s.ensure({ now: () => { throw new TypeError('boom'); } });
  assert.equal(r.action, 'refused');
  assert.equal(r.line, notInstalled('unexpected TypeError: boom'));
});

test('A6: an unexpected throw is told once: the same throw at the next start is silent', t => {
  const s = sandbox(t);
  s.writeSettings(s.registered());
  s.seedTarget();
  const boom = () => { throw new TypeError('boom'); };
  const first = s.ensure({ uid: boom });
  assert.deepEqual([first.action, first.line], ['refused', notInstalled('unexpected TypeError: boom')]);
  const second = s.ensure({ uid: boom });
  assert.deepEqual([second.action, second.line, second.repeated], ['refused', '', true]);
});

test('A6: another session installed it at the same moment AND settings cannot take it: the line says both', t => {
  const s = sandbox(t);
  s.writeSettings({ env: [] });
  s.seedTarget({ version: '1.0.0', manifest: null });
  const { seam } = renameSeam((n) => { if (n === 2) writeTree(s.t_.target, '1.2.3'); });
  const r = s.ensure({ rename: seam });
  assert.equal(r.copy, 'lost');
  assert.equal(r.line, `agent-models mod: another session installed it at the same moment, but it is NOT registered in ${S}: ${s.t_.settings}: env is not an object${HAND_TAIL}`);
});

