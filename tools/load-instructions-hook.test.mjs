import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { RESOLVER_TIMEOUT_MS, sessionInstructions } from '../settings/hooks/load-instructions.mjs';
import { ownedDir } from './lib/owned.mjs';

/** A self-hosted layout (ENTRY.md + tools/rules.mjs) whose resolver runs `body`. */
function fakeRoot(t, what, body) {
  const root = ownedDir(t, what);
  fs.mkdirSync(path.join(root, 'tools'));
  fs.writeFileSync(path.join(root, 'ENTRY.md'), '# entry\n');
  fs.writeFileSync(path.join(root, 'tools', 'rules.mjs'), body);
  return root;
}

// The coai code gate on dew_flow_creds_for_devs #328 (2026-11-10): the resolver call waited up to 120 s, so a stuck
// resolver held the session start for two minutes with nothing on screen. The host's default for a command hook is 600 s.
test('the resolver bound at a session start is under a minute', () => {
  assert.ok(RESOLVER_TIMEOUT_MS <= 30_000, `the bound is ${RESOLVER_TIMEOUT_MS} ms`);
});

test('a resolver that does not answer in time gives the INCOMPLETE notice, naming the bound', t => {
  const root = fakeRoot(t, 'load-instructions-stuck', 'setTimeout(() => {}, 20000);\n');
  const started = Date.now();
  const text = sessionInstructions({ root, timeoutMs: 500 });
  assert.ok(Date.now() - started < 10_000, 'the call returned soon after its bound');
  assert.match(text, /^Instruction loading is INCOMPLETE/);
  assert.match(text, /The resolver did not answer within 0\.5 s\./);
});

test('a resolver that answers is passed through under the session-start header', t => {
  const root = fakeRoot(t, 'load-instructions-ok', 'process.stdout.write("BEGIN RULE sample\\n");\n');
  const text = sessionInstructions({ root });
  assert.match(text, /^Project instructions for this repository/);
  assert.match(text, /BEGIN RULE sample\n$/);
});

test('no resolver at all gives the INCOMPLETE notice with the restore commands', t => {
  const root = ownedDir(t, 'load-instructions-none');
  const text = sessionInstructions({ root });
  assert.match(text, /No resolver under .* — the conventions submodule is not checked out\./);
  assert.match(text, /git submodule update --init \.agents\/conventions/);
});
