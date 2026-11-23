/**
 * F1: the frozen copy of the old agent-models session step (`tools/fixtures/retired-installer/`) is still, byte for byte,
 * what `c598a11` released (the last release that ships it, the pin every consumer holds).
 *
 * The copy is the second implementation of the marker contract that `tools/mods-marketplace-step.test.mjs` runs the new step
 * against. A byte changed there makes that control prove something about code no consumer ever ran, so the sha256 of each of
 * the six code files is held here. The table is what `git show c598a11:settings/hooks/<file>` gave when the copy was made;
 * a second test reads the same bytes from history, so the table cannot drift from the commit it names.
 *
 * Line endings: the bytes are hashed as they are on disk. `.gitattributes` holds the folder at `eol=lf`, so a Windows checkout
 * does not turn the files into CRLF; a fold of CRLF here would let a changed line ending pass.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { gitOutput } from './lib/git.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = path.join(REPO, 'tools', 'fixtures', 'retired-installer');
const FROZEN_COMMIT = 'c598a11';

/** File under `settings/hooks/` at the frozen commit → the file in the fixture's `hooks/`, and the sha256 of its bytes. */
const FROZEN = {
  'ensure-user-guard.mjs': '640511e2e206750bc8e4dbda4cc5eee402357641374504531015d5f1e41f7822',
  'lib/user-guard-install.mjs': '5f36f1ca92594290b59cdb8e9b27b3e023c16212ae5158ababf05378b69baab2',
  'lib/agent-models-decide.mjs': '25a18c03ebac454de008420f7c2daf274478850d3b7557004d6d51a9e3fad65e',
  'lib/agent-models-read.mjs': 'a782ef4cbe14a00c4a107a2e539e62651534187ddc2394da7d40b2b0f68ac586',
  'lib/agent-models-swap.mjs': '23fb03aad48d3a67c16fb3ef2f690056df54a5eab13beef80279613617a40108',
  'lib/agent-models-install.mjs': 'd53656ba574845d6453b0daac02af49ee7d56c14ba780f05db3de70fa0104932',
};

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

test('F1: the six code files of the fixture have the sha256 of the files released in c598a11, and no other code file is there', () => {
  assert.equal(Object.keys(FROZEN).length, 6, 'the table holds the six files');
  for (const [rel, expected] of Object.entries(FROZEN)) {
    assert.equal(sha256(fs.readFileSync(path.join(FIXTURE, 'hooks', rel))), expected, `hooks/${rel} is not the byte-exact copy of c598a11`);
  }
  const code = fs.readdirSync(FIXTURE, { recursive: true }).map(rel => rel.split(path.sep).join('/')).filter(rel => /\.(?:mjs|js|json|tsx?)$/.test(rel)).sort();
  assert.deepEqual(code, Object.keys(FROZEN).map(rel => `hooks/${rel}`).sort());
});

test('F1: the table is what c598a11 holds (the clone that runs this must have that commit, as the control M5p needs it too)', () => {
  for (const [rel, expected] of Object.entries(FROZEN)) {
    const bytes = Buffer.from(gitOutput(REPO, ['show', `${FROZEN_COMMIT}:settings/hooks/${rel}`], { timeoutMs: 60_000 }), 'utf8');
    assert.equal(sha256(bytes), expected, `${rel} at ${FROZEN_COMMIT}`);
  }
});

test('F1: the hash check sees a changed byte and a changed line ending', () => {
  const real = fs.readFileSync(path.join(FIXTURE, 'hooks', 'ensure-user-guard.mjs'));
  assert.notEqual(sha256(Buffer.concat([real, Buffer.from(' ')])), FROZEN['ensure-user-guard.mjs'], 'one added byte');
  assert.notEqual(sha256(Buffer.from(real.toString('utf8').replaceAll('\n', '\r\n'))), FROZEN['ensure-user-guard.mjs'], 'CRLF');
});
