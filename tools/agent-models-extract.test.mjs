/**
 * The session-log extractor of the agent-models mod (`EXTRACT` in `mods/agent-models/hooks/prompts.ts`), run for real
 * with node over fixture logs. The mod's own tests (`claude plugin test`) cannot start a process and this file cannot
 * import a `.ts` module, so the script is read as TEXT: it is a `String.raw` template with no substitution, between two
 * marker lines, and such a template's value is its source text. X1 fails when that stops being true.
 *
 * Fixtures are built here from the measured record shapes (2026-11-11); no text of a real session is in this file.
 * Temporary folders are made by `ownedDir` only — never the real ~/.claude.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { ownedDir } from './lib/owned.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_FILE = path.join(REPO, 'mods', 'agent-models', 'hooks', 'prompts.ts');
const BEGIN = '// EXTRACT:BEGIN';
const END = '// EXTRACT:END';
const OPEN = 'export const EXTRACT = String.raw`';

/** The script's text, or an assertion naming what moved. */
function readExtract(source = fs.readFileSync(SOURCE_FILE, 'utf8')) {
  const text = source.replace(/\r\n/g, '\n');
  const count = needle => text.split(needle).length - 1;
  assert.equal(count(BEGIN), 1, `${BEGIN} must be in hooks/prompts.ts exactly once`);
  assert.equal(count(END), 1, `${END} must be in hooks/prompts.ts exactly once`);
  const between = text.slice(text.indexOf(BEGIN) + BEGIN.length, text.indexOf(END));
  assert.equal(between.split(OPEN).length - 1, 1, `between the markers there must be exactly one \`${OPEN}\``);
  assert.equal(between.slice(0, between.indexOf(OPEN)).trim(), '', 'nothing but the declaration may follow the BEGIN marker');
  const rest = between.slice(between.indexOf(OPEN) + OPEN.length);
  const close = rest.indexOf('`');
  assert.notEqual(close, -1, 'the template is not closed before the END marker');
  assert.equal(rest.slice(close + 1).trim(), '', 'nothing may stand between the closing backtick and the END marker');
  const body = rest.slice(0, close);
  assert.ok(!body.includes('${'), 'the template must have no ${ substitution: its value would no longer be its text');
  assert.ok(body.trim().length > 0, 'the script is empty');
  return body;
}

const EXTRACT = readExtract();
const SID = '0f0e0d0c-aaaa-4bbb-8ccc-123456789abc';

/** Runs the script as the mod does: node -e EXTRACT -- <arg>. `env` replaces the whole environment but PATH. */
function run(arg, { env = {}, flags = [], args, cwd } = {}) {
  const result = spawnSync(process.execPath, [...flags, '-e', EXTRACT, ...(args ?? ['--', arg])], {
    env: { PATH: process.env.PATH, ...env },
    cwd,
    encoding: 'utf8',
    timeout: 60_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}
const prompts = out => {
  assert.equal(out.code, 0, `exit ${out.code}: ${out.stderr}`);
  return JSON.parse(out.stdout);
};
const refused = (out, code = 2) => {
  assert.equal(out.code, code);
  assert.equal(out.stdout, '', 'a failure prints nothing on stdout');
};

// --- the record shapes, as the engine wrote them on 2026-11-11 (keys measured; values made up) ---
const base = { cwd: '/work', sessionId: SID, isSidechain: false, userType: 'external', version: '2.1.322', timestamp: '2026-11-11T08:00:00.000Z' };
const typed = (content, over = {}) => ({ ...base, type: 'user', origin: { kind: 'human' }, promptSource: 'user', message: { role: 'user', content }, uuid: 'u', ...over });
const queued = (prompt, over = {}, attachment = {}) => ({ ...base, type: 'attachment', uuid: 'q', attachment: { type: 'queued_command', commandMode: 'prompt', origin: { kind: 'human' }, prompt, ...attachment }, ...over });
const toolResult = text => ({ ...base, type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't', content: text }] }, toolUseResult: { stdout: text } });
const assistant = text => ({ ...base, type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text }] } });
const lines = rows => rows.map(row => (typeof row === 'string' ? row : JSON.stringify(row))).join('\n') + '\n';
const logIn = (t, rows, name = `${SID}.jsonl`) => {
  const file = path.join(ownedDir(t, 'am-extract'), name);
  fs.writeFileSync(file, Array.isArray(rows) ? lines(rows) : rows); // a string or a Buffer is written as it is
  return file;
};

test('X1: the script is found in hooks/prompts.ts, and a moved marker, a second template or a substitution is refused', () => {
  assert.match(EXTRACT, /process\.argv\[1\]/); // the scan still finds the known instance
  assert.match(EXTRACT, /"human"/);
  const good = `a\n${BEGIN}\n${OPEN}\nbody\n\`\n${END}\nb\n`;
  assert.equal(readExtract(good), '\nbody\n');
  assert.equal(readExtract(good.replace(/\n/g, '\r\n')), '\nbody\n');
  for (const [bad, message] of [
    [good.replace(BEGIN, '// moved'), /BEGIN must be in hooks\/prompts\.ts exactly once/],
    [good + `${END}\n`, /END must be in hooks\/prompts\.ts exactly once/],
    [good.replace(OPEN, 'export const EXTRACT = `'), /exactly one/],
    [good.replace('body', 'a${b}c'), /substitution/],
    [good.replace(`\`\n${END}`, `\` + more\n${END}`), /closing backtick/],
    [good.replace('body\n', ''), /empty/],
    [good.replace('\nbody\n`', '\nbody\n'), /not closed/],
  ]) assert.throws(() => readExtract(bad), message);
});

test('X2: typed prompts and prompts queued while a turn ran come out in file order; everything else stays out', t => {
  const file = logIn(t, [
    typed('first typed'),
    assistant('an answer that says "human" in its text'),
    toolResult('a tool result'),
    queued('queued while the turn ran'),
    { ...typed('the compaction summary', { isCompactSummary: true }), origin: undefined },
    typed('a compaction summary with a human origin', { isCompactSummary: true }),
    typed('meta row', { isMeta: true }),
    typed('<command-name>/x</command-name>', { origin: { kind: 'plugin' } }),
    typed('<task-notification>done</task-notification>', { origin: { kind: 'task-notification' } }),
    typed('from another session', { origin: { kind: 'peer' }, isMeta: true }),
    typed('a plugin row that says human elsewhere', { origin: { kind: 'plugin' }, turnOrigin: 'human' }),
    { ...typed('no origin, human elsewhere', { turnOrigin: 'human' }), origin: undefined },
    typed('an origin that is a string', { origin: 'human' }),
    typed('a sidechain row', { isSidechain: true }),
    typed([{ type: 'tool_result', tool_use_id: 't', content: 'a tool result with a human origin' }]),
    queued('<task-notification>done</task-notification>', {}, { origin: { kind: 'task-notification' }, commandMode: 'task-notification' }),
    queued('a queued message of a peer', {}, { origin: { kind: 'peer' }, source: 'human' }),
    queued('a human bash line', {}, { commandMode: 'bash' }),
    queued('a sidechain queued prompt', { isSidechain: true }),
    { ...base, type: 'attachment', attachment: { type: 'hook_success', commandMode: 'prompt', origin: { kind: 'human' }, prompt: 'not a queued command' } },
    { ...base, type: 'system', origin: { kind: 'human' }, message: { content: 'a system row' } },
    '{"type":"user","origin":{"kind":"human"},"message":{"content":"a broken line"',
    '"human"',
    'null "human"',
    typed({ text: 'content of another shape' }),
    typed('second typed'),
    queued('last queued'),
  ]);
  assert.deepEqual(prompts(run(file)), ['first typed', 'queued while the turn ran', 'second typed', 'last queued']);
});

test('X3: a prompt with an image keeps its text blocks, joined by a line break; the script cleans nothing', t => {
  const image = { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } };
  const file = logIn(t, [
    typed([{ type: 'text', text: 'look at this' }, image, { type: 'text', text: 'and at that' }]),
    typed([image]),
    typed('  spaces and <system-reminder>r</system-reminder> stay  '),
    queued([{ type: 'text', text: 'queued with an image' }, image]),
  ]);
  assert.deepEqual(prompts(run(file)), ['look at this\nand at that', '', '  spaces and <system-reminder>r</system-reminder> stay  ', 'queued with an image']);
});

test('X4: a half-written last line is skipped; a whole last line without a line end is kept; CRLF ends are read', t => {
  const whole = JSON.stringify(typed('whole'));
  const half = JSON.stringify(typed('half written')).slice(0, 60);
  assert.deepEqual(prompts(run(logIn(t, `${whole}\n${half}`, 'a.jsonl'))), ['whole']);
  assert.deepEqual(prompts(run(logIn(t, `${whole}\n${JSON.stringify(typed('no line end'))}`, 'b.jsonl'))), ['whole', 'no line end']);
  assert.deepEqual(prompts(run(logIn(t, `${whole}\r\n${JSON.stringify(queued('crlf'))}\r\n`, 'c.jsonl'))), ['whole', 'crlf']);
  assert.deepEqual(prompts(run(logIn(t, '', 'd.jsonl'))), []);
  assert.deepEqual(prompts(run(logIn(t, [assistant('no prompt here'), toolResult('x')], 'e.jsonl'))), []);
});

test('X5: bytes that are not UTF-8 become U+FFFD and the line is judged as any other; a character cut by a read chunk is whole', t => {
  const marker = 'BADBYTES';
  const row = Buffer.from(JSON.stringify(typed(`before ${marker} after`)) + '\n');
  const at = row.indexOf(marker);
  const bad = Buffer.concat([row.subarray(0, at), Buffer.from([0xff, 0xfe, 0xc3]), row.subarray(at + marker.length)]);
  const CHUNK = 64 * 1024; // fs.createReadStream's default highWaterMark
  const head = Buffer.from(JSON.stringify(typed('x')) + '\n');
  const euro = Buffer.from(JSON.stringify(typed('€ cut by the chunk')) + '\n');
  const open = '{"type":"assistant","pad":"';
  const close = '"}\n';
  const fill = CHUNK - 1 - euro.indexOf(Buffer.from('€')) - head.length - open.length - close.length; // the euro sign's first byte lands on byte CHUNK - 1
  const padding = Buffer.from(open + 'p'.repeat(fill) + close);
  const start = head.length + padding.length + euro.indexOf(Buffer.from('€'));
  assert.ok(start < CHUNK && start + 3 > CHUNK, `the three bytes of the euro sign must straddle byte ${CHUNK}; they start at ${start}`);
  const file = logIn(t, Buffer.concat([head, padding, euro, bad, Buffer.from(JSON.stringify(queued('after the bad bytes')) + '\n')]));
  assert.deepEqual(prompts(run(file)), ['x', '€ cut by the chunk', 'before ��� after', 'after the bad bytes']);
});

test('X6: prompts at both ends and in the middle of a log over 4 MiB come out in order', t => {
  const filler = JSON.stringify(toolResult('r'.repeat(500_000))); // the longest measured line was 500 143 bytes
  const rows = [typed('at the first line'), ...Array(6).fill(filler), queued('in the middle'), ...Array(6).fill(filler), typed('at the last line')];
  const file = logIn(t, rows);
  assert.ok(fs.statSync(file).size > 5 * 1024 * 1024, 'the fixture must be larger than the 4 MiB fs.read limit');
  const out = run(file);
  assert.deepEqual(prompts(out), ['at the first line', 'in the middle', 'at the last line']);
  assert.equal(out.stderr, '');
});

test('X7: a line is parsed only when it holds the text "human"', t => {
  const escaped = JSON.stringify(typed('kept only by a parser that reads every line')).replace('"human"', '"hum\\u0061n"');
  assert.equal(JSON.parse(escaped).origin.kind, 'human'); // the fixture IS a human row once parsed
  assert.ok(!escaped.includes('"human"'));
  const spaced = JSON.stringify(typed('a space after the colon')).replace('"kind":"human"', '"kind": "human"');
  assert.deepEqual(prompts(run(logIn(t, [escaped, spaced]))), ['a space after the colon']);
});

test('X15: a note sent with Apply (a user row whose origin is this mod) is a prompt; another plugin, a command of this mod and a meta row are not', t => {
  const own = { kind: 'plugin', name: 'agent-models' };
  const file = logIn(t, [
    typed('typed by hand'),
    typed('a note sent with the Apply button', { origin: own }),
    typed('a row of another plugin', { origin: { kind: 'plugin', name: 'other-plugin' } }),
    typed('a plugin row with no name', { origin: { kind: 'plugin' } }),
    typed('a row that only mentions agent-models', { origin: { kind: 'peer' }, turnOrigin: 'agent-models' }),
    typed('a meta row of this mod', { origin: own, isMeta: true }),
    typed('a summary of this mod', { origin: own, isCompactSummary: true }),
    typed('a sidechain row of this mod', { origin: own, isSidechain: true }),
    typed([{ type: 'tool_result', tool_use_id: 't', content: 'x' }], { origin: own }),
    typed('<command-name>/login</command-name>', { origin: own }), // the mod's own /login: the mod's clean-up drops it (cleanPrompts)
    queued('queued by another plugin', {}, { origin: { kind: 'plugin', name: 'agent-models' } }),
    typed('last typed'),
  ]);
  assert.deepEqual(prompts(run(file)), ['typed by hand', 'a note sent with the Apply button', '<command-name>/login</command-name>', 'last typed']);
});

test('X16: a line is parsed only when it holds "human" or "agent-models"; an escaped spelling of either is never read', t => {
  const own = { kind: 'plugin', name: 'agent-models' };
  const escaped = JSON.stringify(typed('kept only by a parser that reads every line', { origin: own })).replace('"agent-models"', '"agent-m\\u006fdels"');
  assert.equal(JSON.parse(escaped).origin.name, 'agent-models'); // the fixture IS this mod's row once parsed
  assert.ok(!escaped.includes('"agent-models"'));
  const spaced = JSON.stringify(typed('a space after the colon', { origin: own })).replace('"name":"agent-models"', '"name": "agent-models"');
  assert.deepEqual(prompts(run(logIn(t, [escaped, spaced]))), ['a space after the colon']);
});

/** A config folder with `projects/<name>/<file>` for each entry; returns the config folder. */
const configWith = (t, entries) => {
  const config = path.join(ownedDir(t, 'am-extract'), 'config');
  fs.mkdirSync(path.join(config, 'projects'), { recursive: true });
  for (const [rel, rows] of Object.entries(entries)) {
    const file = path.join(config, 'projects', rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (rows === 'dir') fs.mkdirSync(file);
    else fs.writeFileSync(file, lines(rows));
  }
  return config;
};

test('X8: a session id finds <id>.jsonl in exactly one folder of $CLAUDE_CONFIG_DIR/projects, one level down, by its exact name', t => {
  const config = configWith(t, {
    [`-work/${SID}.jsonl`]: [typed('found by id')],
    [`-work/${SID}.jsonl.bak`]: [typed('a backup')],
    [`-work/x${SID}.jsonl`]: [typed('a longer name')],
    [`-other/another-session.jsonl`]: [typed('another session')],
    [`-deep/sub/${SID}.jsonl`]: [typed('two levels down')],
    [`-dir/${SID}.jsonl`]: 'dir',
    'a-file-not-a-folder': [typed('a stray file')],
  });
  assert.deepEqual(prompts(run(SID, { env: { CLAUDE_CONFIG_DIR: config, HOME: '/nonexistent' } })), ['found by id']);
});

test('X9: no match and two matches both exit 2 and print nothing', t => {
  const none = configWith(t, { '-work/another-session.jsonl': [typed('x')] });
  refused(run(SID, { env: { CLAUDE_CONFIG_DIR: none } }));
  const two = configWith(t, { [`-work/${SID}.jsonl`]: [typed('one')], [`-copy/${SID}.jsonl`]: [typed('two')] });
  refused(run(SID, { env: { CLAUDE_CONFIG_DIR: two } }));
  refused(run(SID, { env: { CLAUDE_CONFIG_DIR: path.join(none, 'no-such-folder') } }));
});

test('X10: without CLAUDE_CONFIG_DIR the search is under ~/.claude/projects; with it, ~/.claude is not searched', t => {
  const home = ownedDir(t, 'am-extract');
  const file = path.join(home, '.claude', 'projects', '-work', `${SID}.jsonl`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, lines([typed('under the home folder')]));
  const homeEnv = { HOME: home, USERPROFILE: home };
  assert.deepEqual(prompts(run(SID, { env: homeEnv })), ['under the home folder']);
  assert.deepEqual(prompts(run(SID, { env: { ...homeEnv, CLAUDE_CONFIG_DIR: '' } })), ['under the home folder']);
  const empty = configWith(t, {});
  refused(run(SID, { env: { ...homeEnv, CLAUDE_CONFIG_DIR: empty } }));
});

test('X11: an argument that is neither an absolute .jsonl path nor an id of 8 to 64 letters, digits and hyphens exits 2', t => {
  const config = configWith(t, { '-work/short.jsonl': [typed('x')], '-work/has_under_score.jsonl': [typed('x')], [`-work/${'a'.repeat(65)}.jsonl`]: [typed('x')] });
  const env = { CLAUDE_CONFIG_DIR: config };
  for (const bad of ['short', 'has_under_score', 'a'.repeat(65), '../-work/short', `${SID}.jsonl`, 'relative/x.jsonl', './x.jsonl', '']) refused(run(bad, { env }));
  refused(run(undefined, { env, args: [] })); // no argument at all
  refused(run(undefined, { env, args: ['--'] }));
  const folder = ownedDir(t, 'am-extract');
  refused(run(path.join(folder, 'missing.jsonl')));
  fs.mkdirSync(path.join(folder, 'folder.jsonl'));
  refused(run(path.join(folder, 'folder.jsonl')));
  refused(run(folder));
  fs.writeFileSync(path.join(folder, 'here.jsonl'), lines([typed('a relative path is never read')]));
  for (const relative of ['here.jsonl', './here.jsonl']) refused(run(relative, { cwd: folder }));
  assert.deepEqual(prompts(run(path.join(folder, 'here.jsonl'), { cwd: folder })), ['a relative path is never read']); // the same file, by its absolute path
});

test('X12: an id that starts with a hyphen is data after --, never a node option', t => {
  const id = '--inspect-brk';
  const config = configWith(t, { [`-work/${id}.jsonl`]: [typed('found behind the double hyphen')] });
  const out = run(id, { env: { CLAUDE_CONFIG_DIR: config } });
  assert.deepEqual(prompts(out), ['found behind the double hyphen']);
  assert.equal(out.stderr, '', 'node must not have read the id as its own option');
});

test('X13: the script runs the same when node evaluates -e as a module', t => {
  const file = logIn(t, [typed('typed'), queued('queued')]);
  assert.deepEqual(prompts(run(file, { flags: ['--input-type=module'] })), ['typed', 'queued']);
  refused(run('short', { flags: ['--input-type=module'] }));
});

test('X14: a file that cannot be read exits 1, prints nothing and leaves no stack trace', { skip: process.getuid?.() === 0 || process.platform === 'win32' ? 'root and Windows read a mode-000 file' : false }, t => {
  const file = logIn(t, [typed('unreadable')]);
  fs.chmodSync(file, 0o000); // the folder's removal needs no read permission on the file
  const out = run(file);
  refused(out, 1);
  assert.equal(out.stderr, '', 'the read error must be caught by the script, not thrown by node');
});

/**
 * X17: the mod registers no `classic.*` hook. Measured live 2026-11-11 (claude 2.1.322): another plugin answers the classic
 * events first and the engine printed "agent-models: its classic.SessionStart hook was skipped" at every session start and
 * every prompt. The viewer finds the log by the session id instead (`$.session.id()`). A scan over the text of every file in
 * hooks/, matching across lines; the companion test proves the scan still finds a known hook.
 */
const HOOKS_DIR = path.join(REPO, 'mods', 'agent-models', 'hooks');
const ON_CALL = /\bon\(\s*(['"`])([A-Za-z.]+)\1/g;

/** Every `on('<event>'` call in hooks/, as `{ file, line, event }`. The line is that of the call, however it is wrapped. */
function hookRegistrations() {
  const found = [];
  for (const name of fs.readdirSync(HOOKS_DIR).sort()) {
    const text = fs.readFileSync(path.join(HOOKS_DIR, name), 'utf8').replace(/\r\n/g, '\n');
    for (const match of text.matchAll(ON_CALL)) {
      found.push({ file: `hooks/${name}`, line: text.slice(0, match.index).split('\n').length, event: match[2] });
    }
  }
  return found;
}

test('X17: no hook of the mod is registered on a classic.* event', () => {
  const classic = hookRegistrations().filter(h => h.event.startsWith('classic.'));
  assert.deepEqual(
    classic.map(h => `${h.file}:${h.line} ${h.event}`),
    [],
    'a classic.* hook is skipped when another plugin answers the event first, and the person sees a warning line per prompt',
  );
});

test('X17b: the scan of X17 still finds the known ui.render and session.start hooks (it cannot match nothing)', () => {
  const events = hookRegistrations().map(h => h.event);
  assert.ok(events.includes('ui.render'), 'the scan found no on(\'ui.render\' in hooks/: its pattern no longer matches');
  assert.ok(events.includes('session.start'), 'the scan found no on(\'session.start\' in hooks/: its pattern no longer matches');
  ON_CALL.lastIndex = 0;
  assert.ok(ON_CALL.test("on('classic.SessionStart', async () => {}"), 'the pattern must match a classic registration');
});
