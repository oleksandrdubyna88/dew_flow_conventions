/**
 * The ONE settings.json road of the guard core (`commitSettings`, `settingsFileOf`, `writeAtomic` of
 * `settings/hooks/lib/user-guard-install.mjs`), and who may use it. Moved from the retired installer's tests
 * (`agent-models-register` and `agent-models-imports`), pointed at `mods-marketplace.mjs`, the one caller besides the guard:
 *
 * - the road called directly in a folder made by `ownedDir`: a created file, a file that appears in the gap, a link that
 *   appears in the gap, a filesystem without hard links, the re-check of the bytes and of the resolved target, and the
 *   guard's own `install`, which must do what it did before the road existed;
 * - the same refusal one level up, in the registration of the dew-flow-mods marketplace;
 * - the scans: only `commitSettings` calls the road's two parts, the registration reaches settings.json only through it,
 *   no second `writeAtomic` names settings but the effort write, and no hook module holds U+FEFF. Each scan has a companion
 *   test that it still finds a known instance, because a scan that matches nothing passes forever.
 *
 * Temporary homes only, never the real ~/.claude. `fs.linkSync` is replaced for one call and restored in `finally`. A mode
 * case skips on win32; a link case skips where a symlink cannot be made.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import * as guard from '../settings/hooks/lib/user-guard-install.mjs';
import { sandbox, symlinkOrSkip } from './lib/mods-marketplace-fixtures.mjs';
import { ownedDir } from './lib/owned.mjs';

const POSIX = process.platform !== 'win32';
const modeOf = file => fs.statSync(file).mode & 0o777;
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const tmpFiles = dir => fs.readdirSync(dir).filter(name => name.includes('.tmp-'));

/** Runs `run` with the process umask set to `mask`, and restores it. */
function withUmask(mask, run) {
  const before = process.umask(mask);
  try {
    return run();
  } finally {
    process.umask(before);
  }
}

/** Runs `run` with `fs.linkSync` replaced by `replacement(real)`; restored in `finally`. */
function withLinkSync(replacement, run) {
  const real = fs.linkSync;
  fs.linkSync = replacement(real);
  try {
    return run();
  } finally {
    fs.linkSync = real;
  }
}

const eperm = () => Object.assign(new Error('EPERM: injected'), { code: 'EPERM', syscall: 'link' });

/** A filesystem without hard links: every call is counted and fails with EPERM, after `before(dest)` when given. */
function noHardLinks(counter, before = () => {}) {
  return () => (from, to) => {
    counter.calls += 1;
    before(to);
    throw eperm();
  };
}


// ---------------------------------------------------------------------------------------------------------------------
// the road
// ---------------------------------------------------------------------------------------------------------------------

/** A folder for the road's own cases; `open()` is what a caller holds before it computes its data. */
function road(t) {
  const root = ownedDir(t, 'settings-road');
  const dir = path.join(root, 'home', '.claude');
  fs.mkdirSync(dir, { recursive: true });
  const settings = path.join(dir, 'settings.json');
  const open = () => ({ settingsPath: settings, original: guard.readOrNull(settings), target: guard.settingsFileOf(settings) });
  return { root, dir, settings, open };
}

test('2.1 the road creates a missing settings.json complete, with the mode of the umask, and leaves no temp file', { skip: !POSIX }, t => {
  const r = road(t);
  const done = withUmask(0o022, () => guard.commitSettings({ ...r.open(), data: '{"a":1}\n', replace: false }));
  assert.deepEqual(done, { written: true });
  assert.equal(fs.readFileSync(r.settings, 'utf8'), '{"a":1}\n');
  assert.equal(modeOf(r.settings), 0o644);
  assert.deepEqual(tmpFiles(r.dir), []);
});

test('2.2 a file that appears after the re-check is never replaced by a created one: the creation answers not written and the other bytes stay', t => {
  const r = road(t);
  const other = '{"theme":"dark"}\n';
  const done = guard.commitSettings({ ...r.open(), data: '{"a":1}\n', replace: false, prepare: () => fs.writeFileSync(r.settings, other) });
  assert.equal(done.written, false);
  assert.equal(done.now.toString(), other);
  assert.equal(fs.readFileSync(r.settings, 'utf8'), other);
  assert.deepEqual(tmpFiles(r.dir), []);
});

test('2.3 a link that appears at the name after the re-check is not written through: the link stays and its target is not created', t => {
  const r = road(t);
  const elsewhere = path.join(r.root, 'elsewhere.json');
  let linked = true;
  const done = guard.commitSettings({
    ...r.open(),
    data: '{"a":1}\n',
    replace: false,
    prepare: () => {
      try {
        fs.symlinkSync(elsewhere, r.settings);
      } catch {
        linked = false;
      }
    },
  });
  if (!linked) return t.skip('symlinks are not permitted here');
  assert.equal(done.written, false);
  assert.equal(fs.lstatSync(r.settings).isSymbolicLink(), true);
  assert.equal(fs.existsSync(elsewhere), false);
  assert.deepEqual(tmpFiles(r.dir), []);
});

test('2.4 where no hard link can be made nothing is created and nothing is replaced: the error goes up, no look-then-rename', { skip: !POSIX }, t => {
  const none = road(t);
  const first = { calls: 0 };
  assert.throws(() => withLinkSync(noHardLinks(first), () => guard.commitSettings({ ...none.open(), data: '{"a":1}\n', replace: false })), { code: 'EPERM' });
  assert.equal(first.calls, 1);
  assert.equal(fs.existsSync(none.settings), false, 'a file the link could not name is not created by a rename');
  assert.deepEqual(tmpFiles(none.dir), []);

  const gap = road(t);
  const second = { calls: 0 };
  const other = '{"theme":"dark"}\n';
  assert.throws(() => withLinkSync(noHardLinks(second, to => fs.writeFileSync(to, other)), () => guard.commitSettings({ ...gap.open(), data: '{"a":1}\n', replace: false })), { code: 'EPERM' });
  assert.equal(second.calls, 1);
  assert.equal(fs.readFileSync(gap.settings, 'utf8'), other, 'a file a writer just created in the gap is not replaced');
  assert.deepEqual(tmpFiles(gap.dir), []);
});


/** The refusal the registration answers when the filesystem cannot make the hard link the creation needs, with its code. */
const noLinkReason = file => `${file} could not be created (EPERM): this filesystem cannot make the hard link the creation needs`;

test('2.4 at the registration, a filesystem without hard links is a refusal to fix by hand (no later start can clear it), and no settings file is created', { skip: !POSIX }, t => {
  const h = sandbox(t);
  const counter = { calls: 0 };
  const result = withLinkSync(noHardLinks(counter), () => h.step());
  assert.equal(result.action, 'refused');
  assert.equal(result.line.includes(noLinkReason('~/.claude/settings.json')), true, result.line);
  assert.equal(counter.calls, 1);
  assert.equal(fs.existsSync(h.settings), false, 'a file the link could not name is not created by a rename');
  assert.deepEqual(tmpFiles(h.claude), []);
});

test('2.4 at the registration, a settings file that appears in the gap is never replaced when no hard link can be made', { skip: !POSIX }, t => {
  const h = sandbox(t);
  const other = '{\n  "hooks": {}\n}\n';
  const counter = { calls: 0 };
  const result = withLinkSync(noHardLinks(counter, to => fs.writeFileSync(to, other)), () => h.step());
  assert.equal(result.action, 'refused');
  assert.equal(fs.readFileSync(h.settings, 'utf8'), other);
  assert.deepEqual(tmpFiles(h.claude), []);
});

test('2.17 at the registration, a settings file that appears AFTER the re-check, while the step creates its own, is never replaced: the next start registers', { skip: !POSIX }, t => {
  const h = sandbox(t);
  const other = '{\n  "theme": "dark"\n}\n';
  const first = h.step({ beforeWrite: () => { fs.mkdirSync(h.claude, { recursive: true }); fs.writeFileSync(h.settings, other); } });
  assert.notEqual(first.action, 'registered');
  assert.equal(fs.readFileSync(h.settings, 'utf8'), other, 'the other writer\'s bytes stay');
  assert.deepEqual(tmpFiles(h.claude), []);
  assert.equal(h.step().action, 'registered', 'the next start registers into the file that is there');
  assert.equal(h.readSettings().theme, 'dark');
});


test('2.5 an existing file is always replaced, also under replace:false, and keeps its own mode under a strict umask', { skip: !POSIX }, t => {
  const r = road(t);
  fs.writeFileSync(r.settings, '{}\n');
  fs.chmodSync(r.settings, 0o644);
  const done = withUmask(0o077, () => guard.commitSettings({ ...r.open(), data: '{"a":1}\n', replace: false }));
  assert.deepEqual(done, { written: true });
  assert.equal(fs.readFileSync(r.settings, 'utf8'), '{"a":1}\n');
  assert.equal(modeOf(r.settings), 0o644);
});

test('2.6 the road refuses when the bytes changed, and when the link names another file with the same bytes; prepare never runs', t => {
  const r = road(t);
  fs.writeFileSync(r.settings, '{}\n');
  let prepared = 0;
  const prepare = () => { prepared += 1; };
  const bytes = guard.commitSettings({ ...r.open(), data: '{"a":1}\n', beforeWrite: () => fs.writeFileSync(r.settings, '{"x":1}\n'), prepare });
  assert.equal(bytes.written, false);
  assert.equal(bytes.now.toString(), '{"x":1}\n');
  assert.equal(prepared, 0);

  fs.rmSync(r.settings);
  const a = path.join(r.root, 'a.json');
  const b = path.join(r.root, 'b.json');
  fs.writeFileSync(a, '{}\n');
  fs.writeFileSync(b, '{}\n');
  if (!symlinkOrSkip(t, a, r.settings)) return;
  const link = guard.commitSettings({
    ...r.open(),
    data: '{"a":1}\n',
    beforeWrite: () => { fs.rmSync(r.settings); fs.symlinkSync(b, r.settings); },
    prepare,
  });
  assert.equal(link.written, false);
  assert.equal(fs.readFileSync(a, 'utf8'), '{}\n');
  assert.equal(fs.readFileSync(b, 'utf8'), '{}\n');
  assert.equal(prepared, 0);
});

test('2.7 settingsFileOf: a plain missing path, an existing chain, a dangling chain, a loop with its reason apart from its advice', t => {
  const r = road(t);
  assert.deepEqual(guard.settingsFileOf(r.settings), { file: r.settings });
  const mid = path.join(r.root, 'mid.json');
  const real = path.join(r.root, 'real.json');
  if (!symlinkOrSkip(t, real, mid)) return;
  fs.symlinkSync(mid, r.settings);
  assert.deepEqual(guard.settingsFileOf(r.settings), { file: real, dangling: true });
  fs.writeFileSync(real, '{}\n');
  assert.deepEqual(guard.settingsFileOf(r.settings), { file: fs.realpathSync(real) });
  fs.rmSync(mid);
  fs.symlinkSync(r.settings, mid);
  const loop = guard.settingsFileOf(r.settings);
  assert.equal(loop.reason, `${r.settings} has more than 40 links (a loop, or a chain too long to open)`);
  assert.equal(loop.refusal, `${loop.reason}; nothing changed — point it at one file`);
  assert.equal(loop.file, undefined);
});

test('2.8 writeAtomic with replace:false leaves a taken name alone and answers false; the default replaces and answers true', t => {
  const r = road(t);
  fs.writeFileSync(r.settings, 'old');
  assert.equal(guard.writeAtomic(r.settings, 'new', undefined, { replace: false }), false);
  assert.equal(fs.readFileSync(r.settings, 'utf8'), 'old');
  assert.deepEqual(tmpFiles(r.dir), []);
  assert.equal(guard.writeAtomic(r.settings, 'new'), true);
  assert.equal(fs.readFileSync(r.settings, 'utf8'), 'new');
});

test('2.9 the guard as at HEAD: a fresh install creates settings.json by the rename with the mode of the umask, never by a hard link', { skip: !POSIX }, t => {
  const r = road(t);
  const source = path.join(r.root, 'subagent-model.mjs');
  fs.writeFileSync(source, '// fixture hook\n');
  const counter = { calls: 0 };
  const result = withUmask(0o022, () => withLinkSync(noHardLinks(counter), () => guard.install({ home: path.join(r.root, 'home'), source })));
  assert.equal(result.code, 0, result.lines.join('\n'));
  assert.equal(counter.calls, 0, 'the guard never asks for a hard link');
  assert.equal(modeOf(r.settings), 0o644);
  assert.ok(Object.hasOwn(json(r.settings).hooks, 'PreToolUse'), 'the guard entry is registered');
  assert.deepEqual(tmpFiles(r.dir), []);
});



// ---------------------------------------------------------------------------------------------------------------------
// ONE road to settings.json: `commitSettings`
// ---------------------------------------------------------------------------------------------------------------------

const LIB = fileURLToPath(new URL('../settings/hooks/lib/', import.meta.url));
const GUARD = 'user-guard-install.mjs';
const STEP = 'mods-marketplace.mjs';
const GUARD_TEXT = fs.readFileSync(path.join(LIB, GUARD), 'utf8');
const STEP_TEXT = fs.readFileSync(path.join(LIB, STEP), 'utf8');

/** Every `import { a, b as c } from '…'` of a text, across lines: `{ names, from }` (the names as exported by the source). */
function namedImports(text) {
  return [...text.matchAll(/^import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/gm)].map(m => ({
    names: m[1].split(',').map(part => part.trim().split(/\s+as\s+/)[0]).filter(Boolean),
    from: m[2],
  }));
}

/** Every call of a text that `pattern` opens (it ends at the `(`): `{ name, args, line }`, the argument text up to the matching `)`, across lines. */
function callsOf(text, pattern) {
  const calls = [];
  for (const m of text.matchAll(pattern)) {
    const open = m.index + m[0].length;
    let depth = 1;
    let end = open;
    while (end < text.length && depth > 0) {
      if (text[end] === '(') depth++;
      else if (text[end] === ')') depth--;
      end++;
    }
    calls.push({ name: m[0].slice(0, -1), args: text.slice(open, end - 1), line: text.slice(0, m.index).split('\n').length });
  }
  return calls;
}

/** The body of `function <name>(` — with or without `export` — from its line to the first line that is exactly `}`; null when absent. */
function bodyOf(text, name) {
  const lines = text.split('\n');
  const start = lines.findIndex(line => new RegExp(`^(?:export\\s+)?function\\s+${name}\\(`).test(line));
  if (start === -1) return null;
  const end = lines.findIndex((line, i) => i > start && line === '}');
  return end === -1 ? null : lines.slice(start, end + 1).join('\n');
}

/** The calls of `writeSettings(` and `changedUnderUs(`: a declaration (`function writeSettings(`) is not a call. */
const ROAD_PARTS = /(?<![\w$.])(?<!function\s)(?:writeSettings|changedUnderUs)\(/g;
const roadPartCalls = text => callsOf(text, ROAD_PARTS).map(call => call.name);
const commitCalls = text => callsOf(text, /(?<![\w$.])(?<!function\s)commitSettings\(/g);

test('the registration reaches settings.json only through commitSettings: it imports commitSettings and settingsFileOf, never effortTarget or sameBytes, and calls the road once with replace: false', () => {
  const names = namedImports(STEP_TEXT).filter(i => i.from === `./${GUARD}`).flatMap(i => i.names);
  for (const wanted of ['commitSettings', 'settingsFileOf']) assert.ok(names.includes(wanted), `${wanted} is imported from the guard installer`);
  for (const gone of ['effortTarget', 'sameBytes']) assert.equal(names.includes(gone), false, `${gone} is not imported: the registration has no road of its own`);
  const calls = commitCalls(STEP_TEXT);
  assert.equal(calls.length, 1, 'one call of the road');
  assert.match(calls[0].args, /\breplace: false\b/, 'the step\'s creation never replaces a file that appeared');
});

test('in the guard installer only commitSettings calls writeSettings and changedUnderUs, and install, repairRegistration and uninstall each call the road once with its defaults', () => {
  const road = bodyOf(GUARD_TEXT, 'commitSettings');
  const outside = GUARD_TEXT.replace(road, '');
  assert.deepEqual(roadPartCalls(outside), [], 'no other function calls the road\'s parts');
  for (const name of ['install', 'repairRegistration', 'uninstall']) {
    const body = bodyOf(GUARD_TEXT, name);
    assert.equal(commitCalls(body).length, 1, `${name} calls commitSettings once`);
    assert.doesNotMatch(body, /\breplace\b/, `${name} never asks for the creation that does not replace: the guard does what it did`);
  }
});

test('the road scans still find their known instances: the body of commitSettings and of install are found, the road holds both parts, and a declaration is not a call', () => {
  const road = bodyOf(GUARD_TEXT, 'commitSettings');
  assert.ok(road, 'the body of commitSettings is found');
  assert.deepEqual(roadPartCalls(road).sort(), ['changedUnderUs', 'writeSettings']);
  assert.ok(bodyOf(GUARD_TEXT, 'install'), 'the body of install is found');
  assert.ok(bodyOf(GUARD_TEXT, 'writeAtomic')?.includes('fs.renameSync'), 'an exported function with a default parameter object is found');
  assert.deepEqual(roadPartCalls('function writeSettings(file) {\n  return 1;\n}\nconst x = writeSettings(a);\n'), ['writeSettings']);
});

// ---------------------------------------------------------------------------------------------------------------------
// no second writer of settings.json: a `writeAtomic(` call naming settings, anywhere the road could be bypassed
// ---------------------------------------------------------------------------------------------------------------------

/** The calls of `writeAtomic(`, a declaration (`function writeAtomic(`) and a member call (`x.writeAtomic(`) left out. */
const WRITE_ATOMIC = /(?<![\w$.])(?<!function\s)writeAtomic\(/g;

/** `name:line` of every `writeAtomic(` call whose arguments name `settings` (a path, a variable, a helper: any spelling, any case). */
const settingsWrites = (name, text) => callsOf(text, WRITE_ATOMIC)
  .filter(call => /settings/i.test(call.args))
  .map(call => `${name}:${call.line} writeAtomic(${call.args.replace(/\s+/g, ' ').trim()}) names settings`);

/** The step's lib and the guard installer: every file that can write the settings file or import what writes it. */
const settingsScope = () => [{ name: STEP, text: STEP_TEXT }, { name: GUARD, text: GUARD_TEXT }];

test('no function of the step\'s lib and none of the guard installer but the effort write calls writeAtomic with settings in its arguments: settings.json has one road, commitSettings, and the one separate writer', () => {
  const effort = bodyOf(GUARD_TEXT, 'writeConverged');
  assert.ok(effort, 'the effort write is found');
  const scope = settingsScope().map(m => (m.name === GUARD ? { ...m, text: m.text.replace(effort, '') } : m));
  assert.deepEqual(scope.map(m => m.name).sort(), [GUARD, STEP].sort(), 'both files are scanned');
  assert.deepEqual(scope.flatMap(m => settingsWrites(m.name, m.text)), []);
});

test('the settings-write scan still finds its known instances: the effort write in the guard installer, and a planted call in the step\'s lib (one over several lines, one with another spelling)', () => {
  const found = settingsWrites(GUARD, GUARD_TEXT);
  assert.equal(found.length, 1, found.join('\n'));
  assert.ok(bodyOf(GUARD_TEXT, 'writeConverged').includes('writeAtomic('), 'the one instance sits in writeConverged');
  const planted = 'import { writeAtomic } from "./user-guard-install.mjs";\nfunction sneak(t) {\n  writeAtomic(\n    t.settings,\n    bytes);\n}\n';
  assert.deepEqual(settingsWrites(STEP, planted), [`${STEP}:3 writeAtomic(t.settings, bytes) names settings`]);
  assert.equal(settingsWrites('x.mjs', 'writeAtomic(path.join(home, ".claude", "Settings.json"), data);\n').length, 1);
  assert.deepEqual(settingsWrites('x.mjs', 'writeAtomic(t.manifest, bytes);\nexport function writeAtomic(dest, data, settings) {}\nfs.writeAtomic(settings);\n'), []);
});

// ---------------------------------------------------------------------------------------------------------------------
// no invisible character in a hook module
// ---------------------------------------------------------------------------------------------------------------------

const HOOKS = fileURLToPath(new URL('../settings/hooks/', import.meta.url));
/** U+FEFF, written as an escape here so this file holds none itself. */
const BOM = '\uFEFF';

/** Every `*.mjs` under a folder, recursively, as paths relative to it, sorted. */
const mjsUnder = dir => fs.readdirSync(dir, { recursive: true }).filter(rel => rel.endsWith('.mjs')).map(rel => rel.split(path.sep).join('/')).sort();

/** `file:line` of every line of a text that holds U+FEFF. */
const bomLines = (name, text) => text.split('\n').flatMap((line, i) => (line.includes(BOM) ? [`${name}:${i + 1}`] : []));

test('no file under settings/hooks holds the invisible character U+FEFF, which a reader cannot see in a regex or a string', () => {
  const findings = mjsUnder(HOOKS).flatMap(rel => bomLines(rel, fs.readFileSync(path.join(HOOKS, rel), 'utf8')));
  assert.deepEqual(findings, []);
});

test('the U+FEFF scan still finds its known instances: it lists the step\'s lib and the guard installer under lib/, and names a line that holds the character', () => {
  const files = mjsUnder(HOOKS);
  for (const known of ['lib/mods-marketplace.mjs', 'lib/user-guard-install.mjs', 'subagent-model.mjs']) assert.ok(files.includes(known), `${known} is scanned`);
  assert.deepEqual(bomLines('f.mjs', `one\nvalue.replace(/^${BOM}/, '')\nthree`), ['f.mjs:2']);
});
