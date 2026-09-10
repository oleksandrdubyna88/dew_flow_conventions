import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { adapterFindings, sessionStartCommands } from './adapter-check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const REFERENCE = path.join(ROOT, 'settings');

/** A repository with the adapter copied correctly, so each test can break exactly one thing. */
function whole(t) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'adapter-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  fs.mkdirSync(path.join(repo, '.claude/hooks'), { recursive: true });
  fs.copyFileSync(path.join(REFERENCE, 'settings.json'), path.join(repo, '.claude/settings.json'));
  fs.copyFileSync(
    path.join(REFERENCE, 'hooks/load-instructions.mjs'),
    path.join(repo, '.claude/hooks/load-instructions.mjs'),
  );
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
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'adapter-bare-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));

  const findings = adapterFindings(repo);

  assert.equal(findings.length, 2);
  assert.match(findings.join('\n'), /\.claude\/settings\.json is missing/);
  assert.match(findings.join('\n'), /\.claude\/hooks\/load-instructions\.mjs is missing/);
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
  fs.writeFileSync(copy, fs.readFileSync(copy, 'utf8').replace(/\n/g, '\r\n'));

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

  assert.equal(findings.length, 1);
  assert.match(findings[0], /declares no SessionStart command/);
  assert.match(findings[0], /starts without this repository’s rules/);
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
