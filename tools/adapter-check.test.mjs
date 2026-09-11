import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { adapterFindings, sessionStartCommands } from './adapter-check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const REFERENCE = path.join(ROOT, 'settings');

/**
 * A real repository, because the checker resolves a root the way the entry procedure does.
 *
 * <p>`git init` rather than a bare directory: a fixture that is not a repository would test a code
 * path no consumer has.</p>
 */
function repository(t, prefix = 'adapter-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  execFileSync('git', ['-C', dir, 'init', '-q'], { timeout: 30_000, windowsHide: true });

  // macOS puts temp dirs under a symlink, and git answers with the resolved path; the checker
  // compares what git said against what it builds, so the fixture must use git's answer too.
  return execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'],
    { encoding: 'utf8', timeout: 30_000, windowsHide: true }).trim();
}

/** A repository with the adapter copied correctly, so each test can break exactly one thing. */
function whole(t) {
  const repo = repository(t);
  fs.mkdirSync(path.join(repo, '.claude/hooks'), { recursive: true });
  fs.copyFileSync(path.join(REFERENCE, 'settings.json'), path.join(repo, '.claude/settings.json'));
  for (const hook of ['load-instructions.mjs', 'build-flags.mjs']) {
    fs.copyFileSync(path.join(REFERENCE, 'hooks', hook), path.join(repo, '.claude/hooks', hook));
  }
  fs.writeFileSync(path.join(repo, 'CLAUDE.md'), '@AGENTS.md\n');

  return repo;
}

test('a repository that copied the adapter correctly has nothing to report', (t) => {
  assert.deepEqual(adapterFindings(whole(t)), []);
});

test('this repository hosts the adapter on itself, which is the only test the mechanism cannot fake', () => {
  // A checker that passes only where it is not used is a checker nobody has run.
  assert.deepEqual(adapterFindings(ROOT), []);
});

test('a missing hook and missing settings are both named, with what to do', (t) => {
  const findings = adapterFindings(repository(t, 'adapter-bare-'));

  assert.equal(findings.length, 3);
  assert.match(findings.join('\n'), /\.claude\/settings\.json is missing/);
  assert.match(findings.join('\n'), /\.claude\/hooks\/load-instructions\.mjs is missing/);
  assert.match(findings.join('\n'), /\.claude\/hooks\/build-flags\.mjs is missing/);
});

test('a hook copy that has drifted is caught — that is the whole reason this tool exists', (t) => {
  const repo = whole(t);
  const copy = path.join(repo, '.claude/hooks/load-instructions.mjs');
  fs.writeFileSync(copy, `${fs.readFileSync(copy, 'utf8')}\n// a local tweak nobody told the family about\n`);

  const findings = adapterFindings(repo);

  assert.equal(findings.length, 1);
  assert.match(findings[0], /drifted/);
  assert.match(findings[0], /never the copy alone/);
});

test('line endings are not drift', (t) => {
  // Windows checkouts of this family are normal; a CRLF copy is the same file.
  const repo = whole(t);
  const copy = path.join(repo, '.claude/hooks/load-instructions.mjs');
  // Normalised BEFORE converting: this repository is itself checked out with CRLF on Windows, and
  // the first version of this line turned every CR-LF into CR-CR-LF — real drift, which passed only
  // where the file happened to have LF endings.
  const asIs = fs.readFileSync(copy, 'utf8').replaceAll('\r\n', '\n');
  fs.writeFileSync(copy, asIs.replaceAll('\n', '\r\n'));

  assert.deepEqual(adapterFindings(repo), []);
});

test('settings without the SessionStart command are named, and other permissions are left alone', (t) => {
  const repo = whole(t);
  const settingsPath = path.join(repo, '.claude/settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  delete settings.hooks;
  settings.permissions.allow.push('WebFetch'); // a repository's own choice, not the family's
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);

  const findings = adapterFindings(repo);

  // Deleting `hooks` unwires BOTH adapters, and each is named on its own: the rules door and the
  // build-flags refusal fail for different reasons and are fixed by different lines.
  assert.equal(findings.length, 2);
  assert.match(findings.join('\n'), /declares no SessionStart command/);
  assert.match(findings.join('\n'), /starts without this repository’s rules/);
  assert.match(findings.join('\n'), /declares no PreToolUse command/);
  assert.match(findings.join('\n'), /what it enforces is not enforced there/);
});

test('the build-flags adapter is checked too, copy and wiring alike', (t) => {
  // Added when the second hook arrived: a checker that only ever looked at the first one would have
  // reported OK for a repository whose MSBuild worker pool was bounded by nothing.
  const drifted = whole(t);
  const copy = path.join(drifted, '.claude/hooks/build-flags.mjs');
  fs.writeFileSync(copy, `${fs.readFileSync(copy, 'utf8')}\n// a local tweak\n`);
  const driftFindings = adapterFindings(drifted);

  assert.equal(driftFindings.length, 1);
  assert.match(driftFindings[0], /build-flags\.mjs has drifted/);

  const unwired = whole(t);
  const settingsPath = path.join(unwired, '.claude/settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  delete settings.hooks.PreToolUse;
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  const wiringFindings = adapterFindings(unwired);

  assert.equal(wiringFindings.length, 1);
  assert.match(wiringFindings[0], /declares no PreToolUse command/);
});

test('the two doors the resolver refuses are reported here too, because this is where people look', (t) => {
  const repo = whole(t);
  fs.mkdirSync(path.join(repo, '.claude/rules'), { recursive: true });
  fs.writeFileSync(path.join(repo, '.claude/rules/stray.md'), '# a second source\n');
  fs.writeFileSync(path.join(repo, 'CLAUDE.md'), '@AGENTS.md\n@.agents/rules/common/local.md\n');

  const findings = adapterFindings(repo).join('\n');

  assert.match(findings, /\.claude\/rules is populated/);
  assert.match(findings, /policy belongs in \.agents\/rules/);
  assert.match(findings, /CLAUDE\.md is not exactly/);
});

test('malformed settings are a finding, not a crash', (t) => {
  const repo = whole(t);
  fs.writeFileSync(path.join(repo, '.claude/settings.json'), '{ not json');

  const findings = adapterFindings(repo);

  assert.equal(findings.length, 1);
  assert.match(findings[0], /does not parse/);
});

test('sessionStartCommands reads every entry and ignores what is not a command', () => {
  assert.deepEqual(sessionStartCommands(undefined), []);
  assert.deepEqual(sessionStartCommands({ hooks: {} }), []);
  assert.deepEqual(
    sessionStartCommands({
      hooks: {
        SessionStart: [
          { hooks: [{ type: 'command', command: 'one' }, { type: 'prompt', prompt: 'ignored' }] },
          { hooks: [{ type: 'command', command: 'two' }] },
        ],
      },
    }),
    ['one', 'two'],
  );
});

test('a directory that is not a repository is refused, not checked', (t) => {
  // The checker builds every path from git's answer rather than from what a caller typed, so there
  // is nothing sensible to report about a directory git does not know.
  const loose = fs.mkdtempSync(path.join(os.tmpdir(), 'adapter-loose-'));
  t.after(() => fs.rmSync(loose, { recursive: true, force: true }));

  assert.throws(() => adapterFindings(loose), /is not inside a git repository/);
});
