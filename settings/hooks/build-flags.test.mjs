import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildFlagsRefusal } from './build-flags.mjs';

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), 'build-flags.mjs');

const refused = command => buildFlagsRefusal(command) !== '';

test('a build that bounds its pool is left alone', () => {
  for (const command of [
    'dotnet build src/App.slnx -c Release -m:4',
    'dotnet build src/App.slnx -m 4',
    'dotnet build --maxcpucount:8 src/App.slnx',
    'dotnet publish -c Release /m:2',
    'msbuild App.slnx -m:4',
  ]) assert.equal(refused(command), false, command);
});

test('a build that does not bound its pool is refused, and told what to type', () => {
  for (const command of [
    'dotnet build src/App.slnx -c Release',
    'dotnet build',
    'dotnet msbuild App.slnx -t:Restore',
    'dotnet publish -c Release',
    'msbuild App.slnx',
    // Measured 2026-09-11: restore with no flags peaks at 11 workers and retains all 11 on the same
    // solution a full build does. It does not compile; it opens the pool anyway.
    'dotnet restore src/App.slnx',
  ]) assert.equal(refused(command), true, command);
  const reason = buildFlagsRefusal('dotnet build src/App.slnx -c Release');
  assert.match(reason, /-m:4/);
  assert.match(reason, /dotnet build src\/App\.slnx -c Release -m:4/);
});

test("another command's -m does not satisfy the check", () => {
  // The trap this exists for: `git commit -m` is run all day, and a naive whole-command search for
  // "-m" would let every build that followed one through.
  assert.equal(refused('git commit -m "a message" && dotnet build src/App.slnx'), true);
  assert.equal(refused('dotnet build src/App.slnx -m:4 && git commit -m "a message"'), false);
});

test('commands that open no worker pool are not this hook\'s business', () => {
  for (const command of [
    'git commit -m "a message"',
    'dotnet restore src/App.slnx -m:4',
    'dotnet --version',
    'npm test',
    './tests/v2.Tests/bin/Debug/net10.0/v2.Tests.exe',
  ]) assert.equal(refused(command), false, command);
});

test('the hook speaks the PreToolUse protocol on stdin and stdout', t => {
  // The pure function above can be right while the wiring is wrong — a hook that emits the wrong
  // shape denies nothing and says nothing, which is the failure nobody notices.
  const run = command => spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ session_id: 'test', tool_name: 'Bash', tool_input: { command } }),
    encoding: 'utf8', timeout: 30_000, windowsHide: true,
  });

  const denied = run('dotnet build src/App.slnx -c Release');
  assert.equal(denied.status, 0);
  const decision = JSON.parse(denied.stdout);
  assert.equal(decision.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(decision.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(decision.hookSpecificOutput.permissionDecisionReason, /-m:4/);

  const allowed = run('dotnet build src/App.slnx -c Release -m:4');
  assert.equal(allowed.status, 0);
  assert.equal(allowed.stdout.trim(), '', 'an allowed command must produce no decision at all');
});

test('a malformed payload allows the command rather than blocking the session', t => {
  const broken = spawnSync(process.execPath, [HOOK], {
    input: 'not json at all', encoding: 'utf8', timeout: 30_000, windowsHide: true,
  });
  assert.equal(broken.status, 0);
  assert.equal(broken.stdout.trim(), '');
});
