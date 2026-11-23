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

// ---------------------------------------------------------------------------------------------------------------------
// F2: the fixture has one reader (the README says so)
// ---------------------------------------------------------------------------------------------------------------------

const TOOLS = path.join(REPO, 'tools');
const ONLY_IMPORTER = 'tools/mods-marketplace-step.test.mjs';
/** Every module specifier a text imports: `import … from 'x'`, `export … from 'x'`, `import 'x'`, `import('x')` and `require('x')`. */
const SPECIFIERS = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)(['"`])([^'"`\n]+)\1/g;

/** The files of a Map of repository path → text that import something inside the fixture folder; a specifier is resolved from its own file. */
function importersOfFixture(files) {
  const found = [];
  for (const [file, text] of files) {
    const from = path.dirname(path.join(REPO, file));
    for (const [, , specifier] of text.matchAll(SPECIFIERS)) {
      if (!specifier.startsWith('.')) continue;
      const target = path.resolve(from, specifier);
      if (target === FIXTURE || target.startsWith(`${FIXTURE}${path.sep}`)) found.push(file);
    }
  }
  return [...new Set(found)].sort();
}

/** The script files under `tools/`, the fixture folder itself left out (its files import each other), as repository path → text. */
function toolsScripts() {
  const files = new Map();
  for (const rel of fs.readdirSync(TOOLS, { recursive: true })) {
    const full = path.join(TOOLS, rel);
    if (!/\.(?:mjs|cjs|js|ts)$/.test(rel) || full.startsWith(`${FIXTURE}${path.sep}`) || !fs.statSync(full).isFile()) continue;
    files.set(`tools/${rel.split(path.sep).join('/')}`, fs.readFileSync(full, 'utf8'));
  }
  return files;
}

test('F2: only tools/mods-marketplace-step.test.mjs imports the frozen step (the README says so): no other script under tools/ does', () => {
  const scripts = toolsScripts();
  assert.ok(scripts.size > 50, `the scan reads ${scripts.size} scripts`);
  assert.deepEqual(importersOfFixture(scripts), [ONLY_IMPORTER]);
});

/** One line of source that imports `spec` the way `kind` says; kept apart from the specifiers so that this file holds no import of the fixture itself. */
const RENDER = {
  named: spec => `import { x } from '${spec}';\n`,
  bare: spec => `import '${spec}';\n`,
  dynamic: spec => `const m = await import('${spec}');\n`,
  reexport: spec => `export * from '${spec}';\n`,
  require: spec => `const m = require('${spec}');\n`,
};
const STEP = './fixtures/retired-installer/hooks/ensure-user-guard.mjs';

test('F2: the scan finds the one real importer and every planted way of importing the fixture, and not a look-alike', () => {
  const scripts = toolsScripts();
  assert.deepEqual(importersOfFixture(new Map([[ONLY_IMPORTER, scripts.get(ONLY_IMPORTER)]])), [ONLY_IMPORTER], 'the known instance is found');
  const planted = new Map([
    ['tools/a.test.mjs', RENDER.named(STEP)],
    ['tools/b.test.mjs', RENDER.dynamic('./fixtures/retired-installer/hooks/lib/agent-models-read.mjs')],
    ['tools/lib/c.mjs', RENDER.reexport('../fixtures/retired-installer/hooks/ensure-user-guard.mjs')],
    ['tools/d.test.mjs', RENDER.named('./fixtures/./other/../retired-installer/hooks/ensure-user-guard.mjs')],
    ['tools/e.test.mjs', RENDER.require(STEP)],
    ['tools/f.test.mjs', RENDER.bare('../tools/fixtures/retired-installer/hooks/ensure-user-guard.mjs')],
    ['tools/g.test.mjs', RENDER.named('./fixtures/retired-installer-notes/x.mjs') + RENDER.named('retired-installer') + RENDER.named('./fixtures/other/x.mjs')],
  ]);
  assert.deepEqual(importersOfFixture(planted), ['tools/a.test.mjs', 'tools/b.test.mjs', 'tools/d.test.mjs', 'tools/e.test.mjs', 'tools/f.test.mjs', 'tools/lib/c.mjs']);
});
