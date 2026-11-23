import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { adapterFindings, sessionStartCommands } from './adapter-check.mjs';
import { ownedDir } from './lib/owned.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const REFERENCE = path.join(ROOT, 'settings');

/**
 * A real repository, because the checker resolves a root the way the entry procedure does.
 *
 * <p>`git init` rather than a bare directory: a fixture that is not a repository would test a code
 * path no consumer has.</p>
 */
function repository(t, what = 'adapter') {
  const dir = ownedDir(t, what);
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
  // Every file under settings/hooks, subdirectories included, exactly as the checker's inventory demands.
  fs.cpSync(path.join(REFERENCE, 'hooks'), path.join(repo, '.claude/hooks'), { recursive: true });
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
  const findings = adapterFindings(repository(t, 'adapter-bare'));
  // One finding per reference hook file plus the settings file. Derived as the check derives its list, so a new hook
  // file is counted without editing this line; the named matches below keep it from passing on a list that is empty.
  const hooks = fs.readdirSync(path.join(REFERENCE, 'hooks'), { recursive: true })
    .filter((file) => file.endsWith('.mjs') && !file.endsWith('.test.mjs'));

  assert.ok(hooks.length >= 6, `the reference lists ${hooks.length} hook files`);
  assert.equal(findings.length, 1 + hooks.length);
  assert.match(findings.join('\n'), /\.claude\/settings\.json is missing/);
  assert.match(findings.join('\n'), /\.claude\/hooks\/load-instructions\.mjs is missing/);
  assert.match(findings.join('\n'), /\.claude\/hooks\/build-flags\.mjs is missing/);
  assert.match(findings.join('\n'), /\.claude\/hooks\/subagent-model\.mjs is missing/);
  assert.match(findings.join('\n'), /\.claude\/hooks\/ensure-user-guard\.mjs is missing/);
  assert.match(findings.join('\n'), /\.claude\/hooks\/lib\/user-guard-install\.mjs is missing/);
  // A2: the step's lib is the one the reference names now, and no retired installer lib is asked for any more.
  assert.match(findings.join('\n'), /\.claude\/hooks\/lib\/mods-marketplace\.mjs is missing/);
  assert.doesNotMatch(findings.join('\n'), /agent-models-/);
});

const RETIRED_LIBS = ['agent-models-decide.mjs', 'agent-models-read.mjs', 'agent-models-swap.mjs', 'agent-models-install.mjs'];

test('A1: a consumer that still holds a retired installer lib is told to delete it; a consumer with none has no such finding', (t) => {
  const repo = whole(t);
  assert.deepEqual(adapterFindings(repo), [], 'none: clean');

  fs.writeFileSync(path.join(repo, '.claude/hooks/lib/agent-models-swap.mjs'), '// the old installer\n');
  const findings = adapterFindings(repo);

  assert.equal(findings.length, 1);
  assert.match(findings[0], /\.claude\/hooks\/lib\/agent-models-swap\.mjs is retired/);
  assert.match(findings[0], /delete it/);
  assert.match(findings[0], /dew-flow-mods/, 'it says what replaced the installer');
});

test('A1: every retired lib is named on its own, a lib of another name is left alone, and a retired name in a subfolder is not a lib', (t) => {
  const repo = whole(t);
  const lib = path.join(repo, '.claude/hooks/lib');
  for (const name of RETIRED_LIBS) fs.writeFileSync(path.join(lib, name), '// old\n');
  fs.writeFileSync(path.join(lib, 'agent-models.md'), 'not a lib\n');
  fs.writeFileSync(path.join(lib, 'my-agent-models-notes.mjs'), '// a consumer\'s own file\n');
  fs.mkdirSync(path.join(lib, 'sub'));
  fs.writeFileSync(path.join(lib, 'sub/agent-models-x.mjs'), '// beyond the lib folder\n');

  const findings = adapterFindings(repo);

  assert.equal(findings.length, RETIRED_LIBS.length);
  for (const name of RETIRED_LIBS) assert.ok(findings.some((finding) => finding.includes(`lib/${name} is retired`)), name);
});

test('A1: a consumer\'s own agent-models-*.mjs is not flagged, and each of the four retired libs, by its exact name, is', (t) => {
  const repo = whole(t);
  const lib = path.join(repo, '.claude/hooks/lib');
  for (const own of ['agent-models-notes.mjs', 'agent-models-install-helper.mjs', 'agent-models-.mjs', 'agent-models-swap.test.mjs', 'agent-models-read.mjs.bak']) {
    fs.writeFileSync(path.join(lib, own), '// a consumer\'s own file\n');
  }
  assert.deepEqual(adapterFindings(repo), [], 'a name that is not one of the four is never a finding');
  for (const name of RETIRED_LIBS) {
    const file = path.join(lib, name);
    fs.writeFileSync(file, '// old\n');
    const findings = adapterFindings(repo);
    assert.equal(findings.length, 1, name);
    assert.match(findings[0], new RegExp(`lib/${name.replace('.', '\\.')} is retired`));
    fs.rmSync(file);
  }
});

test('A1: the command line reports a retired lib and exits 1; a consumer without one exits 0', (t) => {
  const repo = whole(t);
  const run = () => spawnSync(process.execPath, [path.join(HERE, 'adapter-check.mjs'), repo], { encoding: 'utf8', timeout: 60_000, windowsHide: true });

  const clean = run();
  assert.equal(clean.status, 0, clean.stdout);

  fs.writeFileSync(path.join(repo, '.claude/hooks/lib/agent-models-decide.mjs'), '// old\n');
  const dirty = run();
  assert.equal(dirty.status, 1);
  assert.match(dirty.stdout, /1 finding/);
  assert.match(dirty.stdout, /agent-models-decide\.mjs is retired/);
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

test('the reference SessionStart carries the rules door then the bounded self-install, in that order', () => {
  const reference = JSON.parse(fs.readFileSync(path.join(REFERENCE, 'settings.json'), 'utf8'));
  const hooks = reference.hooks.SessionStart.flatMap((entry) => entry.hooks);

  assert.deepEqual(hooks, [
    { type: 'command', command: 'node', args: ['${CLAUDE_PROJECT_DIR}/.claude/hooks/load-instructions.mjs'] },
    { type: 'command', command: 'node', args: ['${CLAUDE_PROJECT_DIR}/.claude/hooks/ensure-user-guard.mjs'], timeout: 5 },
  ]);
});

test('a consumer missing the self-install SessionStart entry is told which one', (t) => {
  const repo = whole(t);
  const settingsPath = path.join(repo, '.claude/settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  settings.hooks.SessionStart[0].hooks.pop();
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}
`);

  const findings = adapterFindings(repo);

  assert.equal(findings.length, 1);
  assert.match(findings[0], /declares no SessionStart command `node .*ensure-user-guard\.mjs`/);
});

test('settings without the SessionStart command are named, and other permissions are left alone', (t) => {
  const repo = whole(t);
  const settingsPath = path.join(repo, '.claude/settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  delete settings.hooks;
  settings.permissions.allow.push('WebFetch'); // a repository's own choice, not the family's
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);

  const findings = adapterFindings(repo);

  // Deleting `hooks` unwires ALL FOUR hook entries, and each is named on its own: the rules door, the
  // build-flags refusal and the subagent-model guard fail for different reasons and are fixed by
  // different lines.
  assert.equal(findings.length, 4);
  assert.match(findings.join('\n'), /subagent-model\.mjs/);
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

  // One finding per PreToolUse adapter: build-flags and subagent-model are wired by separate entries.
  assert.equal(wiringFindings.length, 2);
  assert.match(wiringFindings[0], /declares no PreToolUse command/);
  assert.match(wiringFindings.join('\n'), /subagent-model\.mjs/);
});

test('a narrowed matcher is drift, because the hook then never runs for the other tool', (t) => {
  // Found by the code round: comparing only command and args certified a consumer clean while its
  // PreToolUse matcher had been cut to `Bash`, so every PowerShell build ran unguarded.
  const repo = whole(t);
  const settingsPath = path.join(repo, '.claude/settings.json');
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  settings.hooks.PreToolUse[0].matcher = 'Bash';
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);

  const findings = adapterFindings(repo);

  assert.equal(findings.length, 1);
  assert.match(findings[0], /matcher/);
});

test('a hook added to the reference is checked without editing this file', (t) => {
  // The inventories are derived from settings/, not hard-coded: a third hook must be checked the day
  // it is added, or the next rollout is silently optional.
  const repo = whole(t);
  const reference = ownedDir(t, 'adapter-ref');
  fs.cpSync(REFERENCE, reference, { recursive: true });
  fs.writeFileSync(path.join(reference, 'hooks/third.mjs'), '// a future adapter\n');
  const settings = JSON.parse(fs.readFileSync(path.join(reference, 'settings.json'), 'utf8'));
  settings.hooks.Stop = [{ hooks: [{ type: 'command', command: 'node', args: ['${CLAUDE_PROJECT_DIR}/.claude/hooks/third.mjs'] }] }];
  fs.writeFileSync(path.join(reference, 'settings.json'), `${JSON.stringify(settings, null, 2)}\n`);

  const findings = adapterFindings(repo, reference).join('\n');

  assert.match(findings, /third\.mjs is missing/);
  assert.match(findings, /declares no Stop command/);
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
  const loose = ownedDir(t, 'adapter-loose');

  assert.throws(() => adapterFindings(loose), /is not inside a git repository/);
});
