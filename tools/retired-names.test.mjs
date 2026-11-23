/**
 * A4: the names of the retired agent-models installer and mod are named nowhere in the tree but where they are history.
 * `mods/agent-models` (the folder that moved to the `dew_flow_mods` repository), `RELEASED_MOD` (the old installer's table of
 * the released version) and `agent-models-pins` (its pins table) must not come back as code, docs or comments here.
 *
 * Where they may stay is `ALLOWED` in `tools/lib/retired-names.mjs`, each place with its reason. The scan reads every tracked
 * file and every untracked file git does not ignore, so a hit in a file nobody committed yet is found too. Its first run
 * (`common/security.md`: a scan is trusted only when it is seen to find something) is the planted hits below.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { scanFiles, trackedFiles } from './lib/retired-names.mjs';

const files = entries => new Map(Object.entries(entries));
const where = hits => hits.map(h => `${h.file}:${h.line} ${h.name}`);

test('A4: no tracked or new file names a retired name outside the plan files, the frozen fixture and the places listed with a reason', () => {
  const hits = where(scanFiles(trackedFiles()));
  assert.deepEqual(hits, [], 'a retired name came back: say it by the new words, or add the place to ALLOWED with its reason');
});

test('A4: the scan finds a planted hit of each name, in code, in a doc and in a comment, with its line', () => {
  const planted = files({
    'tools/x.mjs': 'const a = 1;\nconst p = "mods/agent-models/hooks";\n',
    'research/y.md': 'text\ntext\nsee `RELEASED_MOD` here\n',
    'settings/z.mjs': '// the table is tools/agent-models-pins.json\n',
  });
  assert.deepEqual(where(scanFiles(planted)), [
    'research/y.md:3 RELEASED_MOD',
    'settings/z.mjs:1 agent-models-pins',
    'tools/x.mjs:2 mods/agent-models',
  ]);
});

test('A4: the places where a name is history or data are not hits, and a place beside them is', () => {
  const text = 'mods/agent-models RELEASED_MOD agent-models-pins\n';
  const exempt = files({
    'todo/PLAN_x.md': text,
    'research/PLAN_agent_models_mod.md': text,
    'tools/fixtures/retired-installer/README.md': text,
    'tools/fixtures/retired-installer/hooks/lib/agent-models-decide.mjs': text,
    'research/dew_flow_mods_probe_E1.md': text,
  });
  assert.deepEqual(where(scanFiles(exempt)), []);
  const beside = files({
    'todo/README.md': text,
    'research/module_rules.md': text,
    'tools/fixtures/other/README.md': text,
    'research/dew_flow_mods_probe_notes.md': text,
  });
  assert.equal(scanFiles(beside).length, 12, 'three names in each of the four files');
});

test('A4: the person\'s own old folder (~/.claude/mods/agent-models) and a commit-qualified path are data of the new step, not the retired name', () => {
  const data = files({
    'settings/hooks/lib/mods-marketplace.mjs': "const SHOWN_OLD = '~/.claude/mods/agent-models';\nconst O = '~/.claude/mods/agent-models.optout';\n",
    '.github/workflows/ci.yml': '# by `git show c598a11:mods/agent-models/<file>`\n',
  });
  assert.deepEqual(where(scanFiles(data)), []);
  assert.deepEqual(where(scanFiles(files({ 'tools/q.mjs': 'path.join(root, "mods/agent-models")\n.agents/conventions/mods/agent-models\n' }))), ['tools/q.mjs:1 mods/agent-models', 'tools/q.mjs:2 mods/agent-models']);
});

test('A4: the split form over two or three lines is a hit, with the line where it starts', () => {
  const planted = files({
    'tools/m.mjs': "const a = 1;\nconst p = path.join(home, '.claude', 'mods',\n  'agent-models');\n",
    'tools/n.mjs': "x\nx\npath.join(\n  \"mods\"\n  ,\n  \"agent-models\");\n",
  });
  assert.deepEqual(where(scanFiles(planted)), ['tools/m.mjs:2 mods, agent-models', 'tools/n.mjs:4 mods, agent-models']);
});

test('A4: the split form of the folder, backslashes and other letter cases are hits, in both kinds of quote', () => {
  const planted = files({
    'tools/a.mjs': "const p = path.join(root, 'mods', 'agent-models', 'hooks');\n",
    'tools/b.mjs': 'const p = path.join(root, "mods" , "agent-models");\n',
    'tools/c.mjs': 'const p = path.join(root, `mods`,`agent-models`);\n',
    'tools/d.mjs': 'const p = "mods\\\\agent-models\\\\hooks";\nconst q = "mods\\agent-models";\n',
    'tools/e.mjs': '// see Mods/Agent-Models and MODS/AGENT-MODELS\n',
    'tools/f.mjs': "const p = path.join(root, 'Mods', 'agent-Models');\n",
  });
  assert.deepEqual(where(scanFiles(planted)), [
    'tools/a.mjs:1 mods, agent-models',
    'tools/b.mjs:1 mods, agent-models',
    'tools/c.mjs:1 mods, agent-models',
    'tools/d.mjs:1 mods/agent-models',
    'tools/d.mjs:2 mods/agent-models',
    'tools/e.mjs:1 mods/agent-models',
    'tools/f.mjs:1 mods, agent-models',
  ]);
  assert.deepEqual(where(scanFiles(files({ 'tools/ok.mjs': "path.join(mods, 'agent-models'); path.join(home, '.claude', 'mods');\n" }))), [], 'a variable named mods is not the folder');
});

test('A4: only a commit hash of 7 to 40 hex digits before the colon makes a path a read from history; any other qualifier is a hit', () => {
  const ok = files({
    'tools/h.mjs': '# git show c598a11:mods/agent-models/x and C598A11F:mods/agent-models and ' + 'a'.repeat(40) + ':mods/agent-models\n',
  });
  assert.deepEqual(where(scanFiles(ok)), []);
  const planted = files({
    'tools/g.mjs': '# git show HEAD:mods/agent-models/x\n',
    'tools/h.mjs': '# main:mods/agent-models and origin/main:mods/agent-models\n',
    'tools/i.mjs': '# c598a1:mods/agent-models (six digits) and ' + 'a'.repeat(41) + ':mods/agent-models and xyzc598a11:mods/agent-models\n',
    'tools/j.mjs': '# C:mods/agent-models and abc:mods/agent-models\n',
  });
  assert.deepEqual(where(scanFiles(planted)), [
    'tools/g.mjs:1 mods/agent-models',
    'tools/h.mjs:1 mods/agent-models',
    'tools/i.mjs:1 mods/agent-models',
    'tools/j.mjs:1 mods/agent-models',
  ]);
});

test('A4: only the person\'s home spelling ~/.claude/mods/agent-models is exempt, with either separator; $HOME, a bare .claude and a repository path are hits', () => {
  assert.deepEqual(where(scanFiles(files({ 'tools/k.mjs': "'~/.claude/mods/agent-models' and '~\\.claude\\mods\\agent-models'\n" }))), []);
  assert.deepEqual(where(scanFiles(files({
    'tools/l.mjs': 'rm -r $HOME/.claude/mods/agent-models\n',
    'tools/m.mjs': 'cp .claude/mods/agent-models x\n',
    'tools/n.mjs': 'rm ~/mods/agent-models and /home/u/.claude/mods/agent-models\n',
  }))), ['tools/l.mjs:1 mods/agent-models', 'tools/m.mjs:1 mods/agent-models', 'tools/n.mjs:1 mods/agent-models']);
});

test('A4: only the new step\'s control test may name RELEASED_MOD and the folder (it reads the frozen mod from history), and no other name', () => {
  const step = 'tools/mods-marketplace-step.test.mjs';
  assert.deepEqual(where(scanFiles(files({ [step]: 'import { RELEASED_MOD as FROZEN_RELEASED } from "./fixtures/x.mjs";\n' }))), []);
  assert.deepEqual(where(scanFiles(files({ [step]: "git show ${C}:mods/agent-models/x; path.join(p, 'mods', 'agent-models');\n" }))), []);
  assert.deepEqual(where(scanFiles(files({ [step]: 'mods/agent-models-pins and agent-models-pins\n' }))), [`${step}:1 agent-models-pins`]);
  assert.deepEqual(where(scanFiles(files({ 'tools/other.test.mjs': 'import { RELEASED_MOD } from "x";\n' }))), ['tools/other.test.mjs:1 RELEASED_MOD']);
  assert.deepEqual(where(scanFiles(files({ 'tools/other.test.mjs': "git show ${C}:mods/agent-models/x; path.join(p, 'mods', 'agent-models');\n" }))), ['tools/other.test.mjs:1 mods/agent-models', 'tools/other.test.mjs:1 mods, agent-models']);
});

test('A4: a file git lists but that is gone from the disk is skipped, and the real listing is not empty', () => {
  const real = trackedFiles();
  assert.ok(real.size > 100, `the listing holds ${real.size} files`);
  assert.ok(real.has('tools/retired-names.test.mjs'), 'this test is in it');
  assert.ok([...real.keys()].some(file => file.startsWith('tools/fixtures/retired-installer/')), 'the fixture is in it (it is scanned and allowed)');
});
