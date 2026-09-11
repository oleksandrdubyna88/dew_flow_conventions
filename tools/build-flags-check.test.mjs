import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { buildFlagsFindings } from './build-flags-check.mjs';

/** A throwaway repository root. Files are given as a path -> contents map. */
function repository(t, files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-flags-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const [relative, contents] of Object.entries(files)) {
    const full = path.join(dir, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  }
  return dir;
}

const PROJECT = '<Project Sdk="Microsoft.NET.Sdk" />';

test('a repository with no C# in it is not this policy\'s business', t => {
  const root = repository(t, { 'src/thing.ts': 'export const x = 1;\n', 'README.md': '#\n' });
  assert.deepEqual(buildFlagsFindings(root), { isDotnet: false, findings: [] });
});

test('a C# repository without the response file fails, naming the line to write', t => {
  const root = repository(t, { 'src/Thing/Thing.csproj': PROJECT });
  const { isDotnet, findings } = buildFlagsFindings(root);
  assert.equal(isDotnet, true);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /Directory\.Build\.rsp is missing/);
  assert.match(findings[0], /-nr:false/);
});

test('the response file present and correct is the passing case', t => {
  const root = repository(t, { 'src/Thing/Thing.csproj': PROJECT, 'Directory.Build.rsp': '-nr:false\n' });
  assert.deepEqual(buildFlagsFindings(root).findings, []);
});

test('a response file that does not switch node reuse off fails', t => {
  // The failure this catches is a file somebody created to satisfy the checklist, with the wrong
  // switch in it — which leaves every worker behind exactly as if the file were absent.
  const root = repository(t, { 'src/Thing/Thing.csproj': PROJECT, 'Directory.Build.rsp': '-v:m\n' });
  const { findings } = buildFlagsFindings(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /does not switch node reuse off/);
});

test('-m in the response file fails, because it is measured to do nothing there', t => {
  const root = repository(t, {
    'src/Thing/Thing.csproj': PROJECT,
    'Directory.Build.rsp': '# our build flags\n-m:4\n-nr:false\n',
  });
  const { findings } = buildFlagsFindings(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /-m:4.*measured to do nothing/s);
});

test('a workflow that suppresses the response file fails, because it discards -nr:false with it', t => {
  const root = repository(t, {
    'src/Thing/Thing.csproj': PROJECT,
    'Directory.Build.rsp': '-nr:false\n',
    '.github/workflows/ci.yml': 'jobs:\n  build:\n    steps:\n      - run: dotnet build -noautorsp -m:24\n',
  });
  const { findings } = buildFlagsFindings(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /suppresses the response file/);
});

test('the workflow scan reads a multi-line run block, not only a one-line step', t => {
  // The companion to the test above, and the one that matters: real workflows put their build in a
  // `run: |` block. A scan that only ever matched the single-line form would pass every workflow
  // anybody actually writes.
  const root = repository(t, {
    'src/Thing/Thing.csproj': PROJECT,
    'Directory.Build.rsp': '-nr:false\n',
    '.github/workflows/ci.yml':
      'jobs:\n  build:\n    steps:\n      - run: |\n'
      + '          dotnet restore src/App.slnx -m:4\n'
      + '          dotnet build src/App.slnx -c Release --noAutoResponse -m:24\n',
  });
  const { findings } = buildFlagsFindings(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /suppresses the response file/);
});

test('comments and spellings are read the way MSBuild reads them', t => {
  const root = repository(t, {
    'src/Thing/Thing.csproj': PROJECT,
    'Directory.Build.rsp': '# why this file exists\n\n/nodeReuse:false\n',
  });
  assert.deepEqual(buildFlagsFindings(root).findings, []);
});

test('build output and submodules do not make a repository a C# one', t => {
  // A stale obj/ or a vendored submodule must not demand a response file from a repository that
  // builds no C# of its own — the checker would then fail every TypeScript consumer that ever
  // restored a tool.
  const root = repository(t, {
    'src/app/obj/Thing.csproj': PROJECT,
    'bin/Other.csproj': PROJECT,
    'external/vendored/.git/HEAD': 'ref: refs/heads/main\n',
    'external/vendored/Lib.csproj': PROJECT,
  });
  assert.equal(buildFlagsFindings(root).isDotnet, false);
});
