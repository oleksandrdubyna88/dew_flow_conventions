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

test('the double-dash spellings are read, in both directions', t => {
  // Found by the code round. The hook accepts `--maxcpucount:8` as a real switch and has a test
  // saying so; this checker accepted only a single dash, so the two halves of one rule disagreed:
  // an rsp carrying the inert `--maxcpucount:4` passed as clean, and one correctly saying
  // `--nodereuse:false` was reported as not switching node reuse off at all.
  const inert = repository(t, {
    'src/Thing/Thing.csproj': PROJECT,
    'Directory.Build.rsp': '-nr:false\n--maxcpucount:4\n',
  });
  const inertFindings = buildFlagsFindings(inert).findings;
  assert.equal(inertFindings.length, 1);
  assert.match(inertFindings[0], /measured to do nothing/);

  const spelled = repository(t, {
    'src/Thing/Thing.csproj': PROJECT,
    'Directory.Build.rsp': '--nodeReuse:false\n',
  });
  assert.deepEqual(buildFlagsFindings(spelled).findings, []);
});

test('a directory the checker cannot read does not crash the run', t => {
  // A repository with an unreadable subtree still has an answer about its response file, and a
  // checker that throws EACCES is a red CI step that says nothing about the policy.
  const root = repository(t, { 'src/Thing/Thing.csproj': PROJECT, 'Directory.Build.rsp': '-nr:false\n' });
  const locked = path.join(root, 'src', 'locked');
  fs.mkdirSync(locked);
  try { fs.chmodSync(locked, 0o000); } catch { /* best effort; Windows ignores it */ }
  try {
    assert.deepEqual(buildFlagsFindings(root).findings, []);
  } finally {
    try { fs.chmodSync(locked, 0o700); } catch { /* ignore */ }
  }
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

test('a response file that is not a file at all is a finding, not a crash', t => {
  const root = repository(t, { 'src/Thing/Thing.csproj': PROJECT });
  fs.mkdirSync(path.join(root, 'Directory.Build.rsp'));
  const { findings } = buildFlagsFindings(root);
  assert.equal(findings.length, 1);
  assert.match(findings[0], /is not a file/);
});

test('the suppression scan reaches scripts and package scripts, not only workflows', t => {
  // Round 2 finding: a consumer can keep a correct response file and then discard it from
  // scripts/build.ps1 or an npm script, where the workflow-only scan never looked.
  const viaScript = repository(t, {
    'src/Thing/Thing.csproj': PROJECT,
    'Directory.Build.rsp': '-nr:false\n',
    'scripts/build.ps1': 'dotnet build src/App.slnx -c Release --noAutoResponse -m:24\n',
  });
  const scriptFindings = buildFlagsFindings(viaScript).findings;
  assert.equal(scriptFindings.length, 1);
  assert.ok(scriptFindings[0].includes('build.ps1'), scriptFindings[0]);

  const viaPackage = repository(t, {
    'src/Thing/Thing.csproj': PROJECT,
    'Directory.Build.rsp': '-nr:false\n',
    'package.json': '{"scripts":{"build":"dotnet build -noautorsp"}}\n',
  });
  assert.equal(buildFlagsFindings(viaPackage).findings.length, 1);

  const clean = repository(t, {
    'src/Thing/Thing.csproj': PROJECT,
    'Directory.Build.rsp': '-nr:false\n',
    'scripts/build.ps1': 'dotnet build src/App.slnx -c Release -m:4\n',
    'package.json': '{"scripts":{"build":"dotnet build -m:4"}}\n',
  });
  assert.deepEqual(buildFlagsFindings(clean).findings, []);
});
