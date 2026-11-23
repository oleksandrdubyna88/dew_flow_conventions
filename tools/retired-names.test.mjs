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

test('A4: only the new step\'s control test may name RELEASED_MOD, and only that name: it imports the frozen constant', () => {
  const step = 'tools/mods-marketplace-step.test.mjs';
  assert.deepEqual(where(scanFiles(files({ [step]: 'import { RELEASED_MOD as FROZEN_RELEASED } from "./fixtures/x.mjs";\n' }))), []);
  assert.deepEqual(where(scanFiles(files({ [step]: 'mods/agent-models-pins and agent-models-pins\n' }))), [`${step}:1 mods/agent-models`, `${step}:1 agent-models-pins`]);
  assert.deepEqual(where(scanFiles(files({ 'tools/other.test.mjs': 'import { RELEASED_MOD } from "x";\n' }))), ['tools/other.test.mjs:1 RELEASED_MOD']);
});

test('A4: a file git lists but that is gone from the disk is skipped, and the real listing is not empty', () => {
  const real = trackedFiles();
  assert.ok(real.size > 100, `the listing holds ${real.size} files`);
  assert.ok(real.has('tools/retired-names.test.mjs'), 'this test is in it');
  assert.ok([...real.keys()].some(file => file.startsWith('tools/fixtures/retired-installer/')), 'the fixture is in it (it is scanned and allowed)');
});
