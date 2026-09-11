import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildFlagsRefusal } from '../settings/hooks/build-flags.mjs';

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'settings', 'hooks', 'build-flags.mjs');

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

// --- findings from the code round, each one a case before it was a fix ---

test('the executable is recognised however it is spelled', () => {
  for (const command of [
    'dotnet.exe build App.slnx',
    '"C:/Program Files/dotnet/dotnet.exe" build App.slnx',
    '& "C:/Program Files/dotnet/dotnet.exe" build App.slnx',
    'msbuild.exe App.slnx',
  ]) assert.equal(refused(command), true, command);
});

test('a switch that only looks like -m inside a quoted path does not count', () => {
  // `dotnet build "src/My -m 4.sln"` carries no max-cpu switch at all: the text is part of a path.
  assert.equal(refused('dotnet build "src/My -m 4.sln"'), true);
  assert.equal(refused("dotnet build 'a -m 4 b.slnx'"), true);
});

test('a malformed value is not a bounded build', () => {
  for (const command of ['dotnet build -m:4foo', 'dotnet build -maxcpucount:0invalid']) {
    assert.equal(refused(command), true, command);
  }
});

test('talking about a build is not running one', () => {
  // The guard must not stand between anyone and their own repository's text.
  for (const command of [
    'grep -n "dotnet build" README.md',
    "git grep -n 'dotnet build' .",
    'echo "dotnet build src/App.slnx"',
    'rg "msbuild App.slnx" docs/',
  ]) assert.equal(refused(command), false, command);
});

test('a build hidden in a substitution or a subshell is still a build', () => {
  for (const command of [
    'VAR=$(dotnet build src/App.slnx)',
    '(dotnet build src/App.slnx)',
    'eval "dotnet build src/App.slnx"',
  ]) assert.equal(refused(command), true, command);
});

test('the hook answers even when its stdin is never closed', async () => {
  // The failure this prevents: `for await (const chunk of process.stdin)` waits for EOF, so a caller
  // that writes the payload and holds the pipe open leaves the session's tool call pending forever.
  // Fail-open means answering, not waiting.
  const { spawn } = await import('node:child_process');
  const child = spawn(process.execPath, [HOOK], { stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdin.write(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'dotnet build x.slnx' } }));
  // deliberately NOT closing stdin
  let out = '';
  child.stdout.on('data', d => { out += d; });
  const code = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('the hook never exited')); }, 15_000);
    child.on('exit', c => { clearTimeout(timer); resolve(c); });
  });
  assert.equal(code, 0);
  assert.match(out, /permissionDecision/);
  assert.ok(out.endsWith('\n'), 'the decision must end with a newline');
});


test('a build behind a shell wrapper is still a build, with or without quotes', () => {
  // Round 2 finding. `bash -c "dotnet build x"` was caught because the inner command is one quoted
  // token; `cmd /c dotnet build x` was not, because the wrapper branch judged each remaining token
  // on its own and `dotnet` alone is not a build.
  for (const command of [
    'cmd /c dotnet build src/App.slnx',
    'cmd.exe /c dotnet build x.slnx',
    'sh -lc dotnet build x.slnx',
    'pwsh -NoProfile -Command dotnet build x.slnx',
  ]) assert.equal(refused(command), true, command);
});

test("a wrapper does not swallow the inner command's own -m", () => {
  // The obvious fix — drop every token starting with a dash before looking inside — would throw
  // away the very switch being looked for, and refuse a correctly bounded build.
  for (const command of [
    'cmd /c dotnet build src/App.slnx -m:4',
    'bash -c "dotnet build src/App.slnx -m:4"',
    'sh -lc dotnet restore x.slnx -m 2',
  ]) assert.equal(refused(command), false, command);
});

test('a command that is not a string is allowed, not a crash', () => {
  for (const value of [123, { a: 1 }, null, undefined, []]) {
    assert.equal(buildFlagsRefusal(value), '', String(value));
  }
});

test('an environment assignment in front of the command does not hide it', () => {
  // CodeRabbit, PR #21. `VAR=value cmd` is ordinary shell, and this family's own CLAUDE.md documents
  // builds written exactly that way, so the first token is often not the executable at all.
  for (const command of [
    'CI=1 dotnet build App.slnx',
    'Agent__AiRuntime__Provider=Codex dotnet build src/App.slnx',
    'DOTNET_CLI_TELEMETRY_OPTOUT=1 msbuild App.slnx',
  ]) assert.equal(refused(command), true, command);
  for (const command of [
    'CI=1 dotnet build App.slnx -m:4',
    'CI=1 npm test',
  ]) assert.equal(refused(command), false, command);
});
