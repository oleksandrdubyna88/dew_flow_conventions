import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  ALLOWED_MODELS, DENY_MARKER, DENY_TEXT, FREEZE_VARIABLES, ROLE_DIGEST, TEACH_TEXT,
  hookOutput, hookResponse, roleLine, subagentModelVerdict,
} from '../settings/hooks/subagent-model.mjs';
import { digestMismatches, parseRoleTable } from './lib/role-table.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOOK = path.join(HERE, '..', 'settings', 'hooks', 'subagent-model.mjs');
const OPT_OUT = 'SUBAGENT_MODEL_GUARD';
const SIX = new Set([OPT_OUT, ...FREEZE_VARIABLES]);

/** The recorded PreToolUse shape (S1.0), with placeholder values and the given `tool_input`. */
const REAL_PAYLOAD = toolInput => ({
  session_id: 'test',
  transcript_path: '/tmp/t.jsonl',
  cwd: '/tmp',
  scratchpad_dir: '/tmp/s',
  prompt_id: 'p1',
  permission_mode: 'default',
  effort: { level: 'high' },
  hook_event_name: 'PreToolUse',
  tool_name: 'Agent',
  tool_input: toolInput,
  tool_use_id: 'toolu_1',
});
const BASE_INPUT = { description: 'd', prompt: 'p', subagent_type: 'general-purpose', run_in_background: false };
const noModel = () => REAL_PAYLOAD({ ...BASE_INPUT });
const withModel = model => REAL_PAYLOAD({ ...BASE_INPUT, model });

const DENY_JSON = hookOutput({ kind: 'deny', text: DENY_TEXT, warnings: [] });
const TEACH_JSON = hookOutput({ kind: 'teach', text: TEACH_TEXT, warnings: [] });

const wFreeze = names => `Model guard: alias-freezing variable(s) set: ${names.join(', ')}. The rule wants bare aliases that follow the newest model — unset them (common/subagent-models.md).`;
const wOptOut = value => `Model guard: SUBAGENT_MODEL_GUARD=${value.slice(0, 40)} is not an opt-out, the guard stays on; the only opt-out is SUBAGENT_MODEL_GUARD=off.`;

/** The process environment minus the six variables the hook reads (Windows folds case), plus overrides. */
function cleanEnv(overrides = {}) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !SIX.has(key.toUpperCase())));

  return { ...env, ...overrides };
}

const spawnHook = (input, env = {}) => spawnSync(process.execPath, [HOOK], {
  input, env: cleanEnv(env), encoding: 'utf8', timeout: 30_000, windowsHide: true,
});

function oneLine(out) {
  assert.ok(out.endsWith('\n'), 'the output must end with a newline');
  assert.ok(!out.slice(0, -1).includes('\n'), 'the output must be one line');

  return JSON.parse(out);
}

const verdict = (payload, env = {}) => subagentModelVerdict(payload, env);
const DENY = { kind: 'deny', text: DENY_TEXT, warnings: [] };
const TEACH = { kind: 'teach', text: TEACH_TEXT, warnings: [] };
const SILENT = { kind: 'silent', text: '', warnings: [] };

// --- 1-9: the model decides ---

test('1. each allowed alias teaches, and says nothing else', () => {
  for (const model of ALLOWED_MODELS) {
    assert.deepEqual(verdict(withModel(model)), TEACH, model);
    assert.deepEqual(oneLine(hookOutput(verdict(withModel(model)))), {
      hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: TEACH_TEXT },
    });
  }
});

test('2. a missing model is denied, with the fixed reason', () => {
  assert.deepEqual(verdict(noModel()), DENY);
  assert.deepEqual(oneLine(hookOutput(verdict(noModel()))), {
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: DENY_TEXT },
  });
});

test('3. empty, blank and padded models are denied', () => {
  for (const model of ['', ' ', '\t', 'sonnet ', ' opus']) assert.deepEqual(verdict(withModel(model)), DENY, JSON.stringify(model));
});

test('4. haiku is denied', () => {
  assert.deepEqual(verdict(withModel('haiku')), DENY);
});

test('5. inherit is denied', () => {
  assert.deepEqual(verdict(withModel('inherit')), DENY);
});

test('6. a versioned id is denied', () => {
  for (const model of ['claude-opus-5-5', 'claude-sonnet-4-5-20250929', 'claude-fable-5-1', 'opus-5']) {
    assert.deepEqual(verdict(withModel(model)), DENY, model);
  }
});

test('7. another case or spelling is denied, never corrected', () => {
  for (const model of ['Opus', 'SONNET', 'Fable', 'sonnet,opus']) assert.deepEqual(verdict(withModel(model)), DENY, model);
});

test('8. a model that is not a string is denied', () => {
  for (const model of [null, 123, true, {}, [], ['sonnet'], { alias: 'sonnet' }]) {
    assert.deepEqual(verdict(withModel(model)), DENY, JSON.stringify(model));
  }
});

test('9. the older tool name Task is judged the same way', () => {
  assert.deepEqual(verdict({ ...withModel('sonnet'), tool_name: 'Task' }), TEACH);
  assert.deepEqual(verdict({ ...noModel(), tool_name: 'Task' }), DENY);
});

// --- 10-13: the envelope ---

test('10. a tool that is not Agent or Task is none of this hook\'s business', () => {
  for (const name of ['Bash', '', 42, undefined]) {
    for (const payload of [withModel('haiku'), noModel()]) {
      const shaped = { ...payload, tool_name: name };
      assert.deepEqual(verdict(shaped), SILENT, String(name));
      assert.equal(hookOutput(verdict(shaped)), '');
    }
  }
  const absent = noModel();
  delete absent.tool_name;
  assert.deepEqual(verdict(absent), SILENT);
});

test('11. a tool_input that is not a plain object is silent', () => {
  const absent = noModel();
  delete absent.tool_input;
  assert.deepEqual(verdict(absent), SILENT);
  for (const input of [null, [], 'x', 7]) assert.deepEqual(verdict({ ...noModel(), tool_input: input }), SILENT, JSON.stringify(input));
});

test('12. a payload that is not a plain object is silent', () => {
  for (const payload of [null, [], 'x', 7, true]) assert.deepEqual(subagentModelVerdict(payload, {}), SILENT, JSON.stringify(payload));
});

test('13. only PreToolUse is judged; an absent event name is judged too', () => {
  assert.deepEqual(verdict({ ...noModel(), hook_event_name: 'PostToolUse' }), SILENT);
  const absent = noModel();
  delete absent.hook_event_name;
  assert.deepEqual(verdict(absent), DENY);
});

// --- 14-19: the environment ---

test('14. the opt-out silences everything, warnings included', () => {
  for (const value of ['off', 'OFF', ' off ']) {
    const env = { [OPT_OUT]: value };
    assert.deepEqual(verdict(withModel('sonnet'), env), SILENT, value);
    assert.deepEqual(verdict(noModel(), env), SILENT, value);
    assert.deepEqual(verdict({ ...noModel(), tool_name: 'Bash' }, env), SILENT, value);
    assert.deepEqual(verdict(noModel(), { ...env, ANTHROPIC_DEFAULT_OPUS_MODEL: 'x' }), SILENT, value);
  }
  assert.equal(hookResponse('not json', { [OPT_OUT]: 'off' }), '');
});

test('15. guard on says nothing; a misspelt opt-out is named and does not switch the guard off', () => {
  for (const value of [undefined, '', 'on', 'ON']) {
    const env = value === undefined ? {} : { [OPT_OUT]: value };
    assert.deepEqual(verdict(noModel(), env), DENY, String(value));
    assert.deepEqual(verdict(withModel('sonnet'), env), TEACH, String(value));
  }
  for (const value of ['false', '0', 'no', 'disabled']) {
    const env = { [OPT_OUT]: value };
    assert.deepEqual(verdict(noModel(), env), { ...DENY, warnings: [wOptOut(value)] }, value);
    assert.deepEqual(verdict(withModel('sonnet'), env), { ...TEACH, warnings: [wOptOut(value)] }, value);
  }
  const long = 'x'.repeat(60);
  assert.deepEqual(verdict(noModel(), { [OPT_OUT]: long }).warnings, [wOptOut('x'.repeat(40))]);
});

test('16. an alias-freezing variable is named; one that is empty or not read is not', () => {
  for (const name of FREEZE_VARIABLES) {
    const value = name === 'CLAUDE_CODE_SUBAGENT_MODEL_FORCE' ? '1' : 'claude-x';
    assert.deepEqual(verdict(withModel('sonnet'), { [name]: value }), { ...TEACH, warnings: [wFreeze([name])] }, name);
  }
  const pair = { ANTHROPIC_DEFAULT_OPUS_MODEL: 'claude-opus-5-5', CLAUDE_CODE_SUBAGENT_MODEL_FORCE: '1' };
  const both = [wFreeze(['ANTHROPIC_DEFAULT_OPUS_MODEL', 'CLAUDE_CODE_SUBAGENT_MODEL_FORCE'])];
  assert.deepEqual(verdict(withModel('sonnet'), pair).warnings, both);
  assert.deepEqual(verdict(noModel(), pair), { ...DENY, warnings: both });
  for (const value of ['', '  ']) {
    assert.deepEqual(verdict(withModel('sonnet'), { ANTHROPIC_DEFAULT_OPUS_MODEL: value }).warnings, [], JSON.stringify(value));
  }
  assert.deepEqual(verdict(withModel('sonnet'), { CLAUDE_CODE_SUBAGENT_MODEL: 'haiku' }).warnings, []);
});

test('17. both warnings travel in one systemMessage, freeze first', () => {
  const env = { ANTHROPIC_DEFAULT_FABLE_MODEL: 'x', [OPT_OUT]: 'false' };
  const result = verdict(withModel('sonnet'), env);
  const warnings = [wFreeze(['ANTHROPIC_DEFAULT_FABLE_MODEL']), wOptOut('false')];
  assert.deepEqual(result.warnings, warnings);
  const parsed = oneLine(hookOutput(result));
  assert.equal(parsed.systemMessage, `${warnings[0]} ${warnings[1]}`);
  assert.deepEqual(Object.keys(parsed), ['hookSpecificOutput', 'systemMessage']);
});

test('18. a warning never changes the verdict and never rides a fail-open', () => {
  const env = { ANTHROPIC_DEFAULT_FABLE_MODEL: 'x', [OPT_OUT]: 'false' };
  assert.equal(verdict(noModel(), env).kind, 'deny');
  assert.equal(verdict(withModel('opus'), env).kind, 'teach');
  assert.deepEqual(verdict({ ...noModel(), tool_name: 'Bash' }, { ANTHROPIC_DEFAULT_OPUS_MODEL: 'x' }), SILENT);
});

test('19. the marker appears in the deny reason and nowhere else', () => {
  assert.ok(DENY_TEXT.startsWith(DENY_MARKER));
  assert.ok(!TEACH_TEXT.includes(DENY_MARKER));
  const env = { ANTHROPIC_DEFAULT_OPUS_MODEL: 'x', [OPT_OUT]: 'false' };
  for (const warning of verdict(noModel(), env).warnings) assert.ok(!warning.includes(DENY_MARKER), warning);
  assert.ok(!wFreeze(['A']).includes(DENY_MARKER));
  assert.ok(!hookOutput(verdict(withModel('sonnet'), env)).includes(DENY_MARKER));
});

// --- 20-23: texts, digest, output ---

test('20. the texts are bounded, one line, and derived from the one digest', () => {
  assert.ok(Buffer.byteLength(DENY_TEXT, 'utf8') <= 600);
  assert.ok(Buffer.byteLength(TEACH_TEXT, 'utf8') <= 300);
  for (const text of [DENY_TEXT, TEACH_TEXT]) {
    assert.ok(!/[\r\n]/.test(text));
    assert.ok(text.includes(roleLine(ROLE_DIGEST)));
  }
  const line = roleLine(ROLE_DIGEST);
  for (const { role, model } of ROLE_DIGEST) {
    assert.ok(line.includes(role.toLowerCase()), role);
    assert.ok(line.includes(model), model);
  }
  assert.ok(line.indexOf('sonnet:') < line.indexOf('opus:'));
  assert.ok(line.indexOf('opus:') < line.indexOf('fable:'));
  assert.ok(line.indexOf('fable:') < line.indexOf('main session or sonnet:'));
  const odd = roleLine([{ role: 'Zed', model: 'zzz' }, { role: 'Ann', model: 'fable' }, { role: 'Bob', model: 'sonnet' }]);
  assert.equal(odd, 'sonnet: bob · fable: ann · zzz: zed');
});

test('21. the digest is frozen and consistent', () => {
  assert.ok(Object.isFrozen(ROLE_DIGEST));
  for (const entry of ROLE_DIGEST) {
    assert.ok(Object.isFrozen(entry), entry.role);
    assert.ok(ALLOWED_MODELS.includes(entry.model) || entry.model === 'main session or sonnet', entry.model);
  }
  const roles = ROLE_DIGEST.map(entry => entry.role.toLowerCase());
  assert.equal(new Set(roles).size, roles.length);
});

test('22. hookOutput is exact: nothing for silent, one compact line otherwise', () => {
  assert.equal(hookOutput(SILENT), '');
  for (const out of [DENY_JSON, TEACH_JSON]) {
    const parsed = oneLine(out);
    assert.equal(JSON.stringify(parsed), out.slice(0, -1));
  }
});

test('23. hookResponse fails open on anything it cannot judge', () => {
  for (const text of ['not json at all', '', 'null', '[]', '"x"', '7']) assert.equal(hookResponse(text, {}), '', JSON.stringify(text));
  assert.equal(hookResponse(JSON.stringify(noModel()), {}), DENY_JSON);
  assert.equal(hookResponse(JSON.stringify(withModel('sonnet')), {}), TEACH_JSON);
  const throwing = new Proxy({}, { get() { throw new Error('boom'); } });
  assert.equal(hookResponse(JSON.stringify(noModel()), throwing), '');
});

// --- 24-30: the real process ---

test('24. the process teaches on a named model', () => {
  const run = spawnHook(JSON.stringify(withModel('sonnet')));
  assert.equal(run.stdout, TEACH_JSON);
  assert.equal(run.status, 0);
  assert.equal(run.stderr, '');
});

test('25. the process denies a missing model in the PreToolUse protocol', () => {
  const run = spawnHook(JSON.stringify(noModel()));
  assert.equal(run.stdout, DENY_JSON);
  assert.equal(run.status, 0);
  assert.equal(run.stderr, '');
  assert.ok(oneLine(run.stdout).hookSpecificOutput.permissionDecisionReason.startsWith('subagent-models.md:'));
});

test('26. the process allows rather than blocks the session on garbage or nothing', () => {
  for (const input of ['not json at all', '']) {
    const run = spawnHook(input);
    assert.equal(run.stdout, '', JSON.stringify(input));
    assert.equal(run.status, 0);
  }
});

test('27. the process honours the opt-out', () => {
  const run = spawnHook(JSON.stringify(noModel()), { [OPT_OUT]: 'off' });
  assert.equal(run.stdout, '');
  assert.equal(run.status, 0);
});

test('28. the process carries the warning in systemMessage beside the teach', () => {
  const run = spawnHook(JSON.stringify(withModel('sonnet')), { ANTHROPIC_DEFAULT_OPUS_MODEL: 'claude-opus-5-5' });
  const parsed = oneLine(run.stdout);
  assert.equal(parsed.hookSpecificOutput.additionalContext, TEACH_TEXT);
  assert.equal(parsed.systemMessage, wFreeze(['ANTHROPIC_DEFAULT_OPUS_MODEL']));
});

/** Write the payload, never close stdin, and wait for the hook to exit by itself. */
async function openStdin(payload) {
  const child = spawn(process.execPath, [HOOK], { stdio: ['pipe', 'pipe', 'pipe'], env: cleanEnv(), windowsHide: true });
  child.stdin.write(JSON.stringify(payload));
  let out = '';
  child.stdout.on('data', data => { out += data; });
  const code = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('the hook never exited')); }, 15_000);
    child.on('exit', c => { clearTimeout(timer); resolve(c); });
  });

  return { code, out };
}

test('29. the process answers even when its stdin is never closed — deny and teach alike', async () => {
  const denied = await openStdin(noModel());
  assert.equal(denied.code, 0);
  assert.equal(denied.out, DENY_JSON);
  const taught = await openStdin(withModel('sonnet'));
  assert.equal(taught.code, 0);
  assert.equal(taught.out, TEACH_JSON);
});

test('30. a payload over 256 KiB is not judged', () => {
  const big = kib => REAL_PAYLOAD({ ...BASE_INPUT, prompt: 'x'.repeat(kib * 1024) });
  const within = spawnHook(JSON.stringify(big(200)));
  assert.equal(within.stdout, DENY_JSON);
  const over = spawnHook(JSON.stringify(big(300)));
  assert.equal(over.stdout, '');
  assert.equal(over.status, 0);
});

// --- 31-34: the digest against the rule, and the parser ---

const RULE = process.env.SUBAGENT_MODEL_RULE_PATH ?? path.join(HERE, '..', 'common', 'subagent-models.md');

test('31. the hook\'s digest is the rule\'s table', () => {
  assert.deepEqual(digestMismatches(ROLE_DIGEST, parseRoleTable(fs.readFileSync(RULE, 'utf8'))), []);
});

test('32. changing one role\'s model in the rule is caught — permanent break-it', () => {
  const lines = fs.readFileSync(RULE, 'utf8').replaceAll('\r\n', '\n').split('\n');
  const header = lines.findIndex(line => /^\|\s*Role\s*\|\s*Model\s*\|/.test(line));
  assert.ok(header >= 0, 'the rule has a role table');
  const cells = lines[header + 2].split('|');
  const current = cells[2].trim();
  const other = ['sonnet', 'opus', 'fable', 'main session or sonnet'].find(model => model !== current);
  cells[2] = ` ${other} `;
  lines[header + 2] = cells.join('|');

  const found = digestMismatches(ROLE_DIGEST, parseRoleTable(lines.join('\n')));

  assert.equal(found.length, 1, found.join('; '));
  assert.ok(found[0].toLowerCase().includes(`"${cells[1].trim().toLowerCase()}"`), found[0]);
});

test('33. parseRoleTable finds the table by its Model header and reads it plainly', () => {
  assert.throws(() => parseRoleTable('# nothing\n\ntext\n'), /no role table/);
  assert.throws(() => parseRoleTable('| Role | Owner |\n|---|---|\n| a | b |\n'), /no role table/);
  assert.deepEqual(parseRoleTable('| Role | Model |\n|---|---|\n| Scout | sonnet |\n'), [{ role: 'scout', model: 'sonnet' }]);
  assert.deepEqual(
    parseRoleTable('| Role | Model | What |\r\n|:--|:-:|---|\r\n| **Judge** | `opus` | a \\| b |\r\n| [Plan](x.md) | fable | y |\r\n'),
    [{ role: 'judge', model: 'opus' }, { role: 'plan', model: 'fable' }],
  );
  assert.throws(() => parseRoleTable('| Role | Model |\n|---|---|\n| lonely |\n'), /fewer than two cells/);
});

test('34. digestMismatches names each kind of difference', () => {
  const rule = [{ role: 'a', model: 'sonnet' }, { role: 'b', model: 'opus' }, { role: 'c', model: 'gpt' }];
  const hook = [{ role: 'A ', model: 'sonnet' }, { role: 'b', model: 'fable' }, { role: 'd', model: 'opus' }];
  const found = digestMismatches(hook, rule);
  assert.deepEqual(found, [
    '"b": rule says opus, hook says fable',
    'rule row "c": model "gpt" is not one of sonnet, opus, fable, main session or sonnet',
    'rule row "c" (gpt) is missing from the hook\'s ROLE_DIGEST',
    'hook entry "d" is not in the rule\'s table',
  ]);
  assert.deepEqual(digestMismatches([{ role: 'a', model: 'opus' }, { role: 'A', model: 'opus' }], [{ role: 'a', model: 'opus' }]), ['duplicate role "a" in the hook']);
  assert.deepEqual(digestMismatches([{ role: 'a', model: 'opus' }], [{ role: 'a', model: 'opus' }, { role: 'a', model: 'opus' }]), ['duplicate role "a" in the rule']);
  assert.deepEqual(digestMismatches([{ role: ' JUDGE ', model: 'opus' }], [{ role: 'judge', model: 'opus' }]), []);
});
