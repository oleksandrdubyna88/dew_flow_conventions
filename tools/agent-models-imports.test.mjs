/**
 * What the agent-models installer's modules (`settings/hooks/lib/agent-models-*.mjs`) may import, and what they may not
 * define again. A consumer runs each module from its verbatim copy in `.claude/hooks/lib/` with nothing installed
 * beside it, so a module reaches only `node:` builtins, `./user-guard-install.mjs` and EARLIER installer modules; and the
 * helpers `user-guard-install.mjs` exports are imported, never written a second time (reuse-first).
 *
 * The modules are found by listing the folder and the exports by importing `user-guard-install.mjs`: nothing is typed
 * twice. Each scan has a companion test that it still finds a known instance, because a scan that matches nothing
 * passes forever.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const LIB = fileURLToPath(new URL('../settings/hooks/lib/', import.meta.url));
const GUARD = 'user-guard-install.mjs';
/** The layers, earliest first: a module imports only the modules before it. */
const LAYERS = ['agent-models-decide.mjs', 'agent-models-read.mjs', 'agent-models-swap.mjs', 'agent-models-install.mjs'];

const guardValues = await import(new URL(GUARD, new URL('../settings/hooks/lib/', import.meta.url)));
const guardExports = Object.keys(guardValues);
/** The exports that are functions: `OPTOUT_FILE` and `MANIFEST_FILE` share their names with the mod's own constants on purpose. */
const guardFunctions = new Set(guardExports.filter(name => typeof guardValues[name] === 'function'));

/** The installer's modules found in the folder, sorted: `{ name, text }`. */
const modules = () => fs.readdirSync(LIB)
  .filter(name => /^agent-models-.*\.mjs$/.test(name))
  .sort()
  .map(name => ({ name, text: fs.readFileSync(path.join(LIB, name), 'utf8') }));

/** Every `import { a, b as c } from '…'` of a text, across lines: `{ names, from }` (the names as exported by the source). */
function namedImports(text) {
  return [...text.matchAll(/^import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/gm)].map(m => ({
    names: m[1].split(',').map(part => part.trim().split(/\s+as\s+/)[0]).filter(Boolean),
    from: m[2],
  }));
}

/** Every module specifier of a text: `import … from`, `export … from`, a bare `import '…'`, and `import('…')`. */
function specifiersOf(text) {
  const found = [
    ...text.matchAll(/^(?:import|export)\b[^;]*?\bfrom\s+['"]([^'"]+)['"]/gm),
    ...text.matchAll(/^import\s+['"]([^'"]+)['"]/gm),
    ...text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g),
  ];
  return found.map(m => m[1]);
}

/** The names a text DECLARES as a function: `function f`, or `const f =` assigned an arrow or a function expression. */
function declaredFunctions(text) {
  return [
    ...[...text.matchAll(/^(?:export\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/gm)].map(m => m[1]),
    ...[...text.matchAll(/^(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\b|[A-Za-z_$][\w$]*\s*=>|\()/gm)].map(m => m[1]),
  ];
}

const siblingOf = spec => (/^\.\/(agent-models-[\w-]+\.mjs)$/.exec(spec) ?? [])[1];

/** 1.9: every name imported from the guard installer is an export of it. */
function missingGuardExports(all) {
  const findings = [];
  for (const { name, text } of all) {
    for (const { names, from } of namedImports(text)) {
      if (from !== `./${GUARD}`) continue;
      for (const imported of names) if (!guardExports.includes(imported)) findings.push(`${name} imports ${imported} from ./${GUARD}, which does not export it`);
    }
  }
  return findings;
}

/** 1.10: a module imports only siblings that come EARLIER in the layer order. */
function layerFindings(all) {
  const findings = [];
  for (const { name, text } of all) {
    const own = LAYERS.indexOf(name);
    if (own === -1) {
      findings.push(`${name} is not in the layer order (${LAYERS.join(', ')})`);
      continue;
    }
    for (const sibling of specifiersOf(text).map(siblingOf).filter(Boolean)) {
      if (LAYERS.indexOf(sibling) === -1 || LAYERS.indexOf(sibling) >= own) findings.push(`${name} imports ${sibling}, which is not earlier in the layer order`);
    }
  }
  return findings;
}

/** 1.12: no module declares a function under the name of a function the guard installer exports. */
function duplicateBodies(all) {
  const findings = [];
  for (const { name, text } of all) {
    for (const fn of declaredFunctions(text)) if (guardFunctions.has(fn)) findings.push(`${name} declares ${fn}, a second body of the helper ${GUARD} exports`);
  }
  return findings;
}

test('every name an installer module imports from user-guard-install.mjs is an export of it', () => {
  assert.deepEqual(missingGuardExports(modules()), []);
});

test('an installer module imports only installer modules that come earlier in the order decide, read, swap, install', () => {
  const all = modules();
  assert.deepEqual(layerFindings(all), []);
  const read = all.find(m => m.name === 'agent-models-read.mjs');
  assert.ok(specifiersOf(read.text).includes('./agent-models-decide.mjs'), 'the scan still finds the one sibling import of read');
});

for (const { name, text } of modules()) {
  test(`${name} imports nothing outside node: builtins, ./user-guard-install.mjs and its agent-models siblings, because a consumer runs it from its .claude/hooks/lib/ copy`, () => {
    const specifiers = specifiersOf(text);
    assert.ok(specifiers.some(spec => spec.startsWith('node:')), 'the scan still finds a node: import');
    for (const spec of specifiers) assert.match(spec, /^node:|^\.\/user-guard-install\.mjs$|^\.\/agent-models-(decide|read|swap|install)\.mjs$/, spec);
    assert.doesNotMatch(text, /process\.env/, 'the module never reads the environment');
  });
}

test('no installer module declares a function the guard installer already exports (one body per helper)', () => {
  assert.deepEqual(duplicateBodies(modules()), []);
});

test('the scans still find their known instances: the folder lists decide and read, the parser reads isObject in decide, the declaration scan reads lstatOrNull in the guard installer', () => {
  const all = modules();
  const names = all.map(m => m.name);
  assert.ok(names.includes('agent-models-decide.mjs'), 'decide is listed');
  assert.ok(names.includes('agent-models-read.mjs'), 'read is listed');
  const decide = all.find(m => m.name === 'agent-models-decide.mjs');
  assert.ok(namedImports(decide.text).some(i => i.from === `./${GUARD}` && i.names.includes('isObject')), 'the import parser finds isObject in decide');
  assert.ok(declaredFunctions(fs.readFileSync(path.join(LIB, GUARD), 'utf8')).includes('lstatOrNull'), 'the declaration scan finds const lstatOrNull in the guard installer');
});

test('the parsers read a double-quoted specifier like a single-quoted one: named imports with their names, export-from, a bare import and a dynamic import', () => {
  const text = [
    'import { a, b as c } from "./x.mjs";',
    'export { z } from "./y.mjs";',
    'import "./side.mjs";',
    'const late = await import("./dyn.mjs");',
    "import { d } from './single.mjs';",
  ].join('\n');
  assert.deepEqual(specifiersOf(text), ['./x.mjs', './y.mjs', './single.mjs', './side.mjs', './dyn.mjs']);
  assert.deepEqual(namedImports(text), [{ names: ['a', 'b'], from: './x.mjs' }, { names: ['d'], from: './single.mjs' }]);
});

// ---------------------------------------------------------------------------------------------------------------------
// the copy reads no byte of the source itself: only the Map `readSource` returned is written (E1.S3's rule, scanned)
// ---------------------------------------------------------------------------------------------------------------------

/** The two modules that copy: they hold the Map of `readSource` and never a path under the source. */
const COPY_MODULES = ['agent-models-swap.mjs', 'agent-models-install.mjs'];
/** The reads that take a path: the target reader, the guard's file reader and any `fs.<name>(`. */
const READ_CALLS = /(?<![\w$])(?:readTarget|readOrNull|fs\.[A-Za-z]+)\(/g;
const SOURCE_WORD = /\b(?:source|src)\b/;

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

/** The calls of `text` that read a path and name the source in their arguments. */
const sourceReads = (name, text) => callsOf(text, READ_CALLS)
  .filter(call => SOURCE_WORD.test(call.args))
  .map(call => `${name}:${call.line} ${call.name}(${call.args.replace(/\s+/g, ' ').trim()}) names the source`);

const copyModules = () => modules().filter(m => COPY_MODULES.includes(m.name));
const readSourceCalls = text => callsOf(text, /(?<![\w$.])readSource\(/g);

test('the swap and the installer read no file under the source: no read call takes an argument that names it, so only the bytes readSource checked are written', () => {
  const found = copyModules();
  assert.deepEqual(found.map(m => m.name), [...COPY_MODULES].sort(), 'both modules are scanned');
  assert.deepEqual(found.flatMap(({ name, text }) => sourceReads(name, text)), []);
});

test('the installer calls readSource exactly once, with the source folder first, and the swap never calls it', () => {
  const [swap, install] = COPY_MODULES.map(name => copyModules().find(m => m.name === name));
  const calls = readSourceCalls(install.text);
  assert.equal(calls.length, 1, 'one read of the source per run');
  assert.equal(calls[0].args.split(',')[0].trim(), 'source');
  assert.deepEqual(readSourceCalls(swap.text), []);
});

test('the source-read scan still finds its known instances: the released read in the installer, an allowed file read in the swap, and a planted read over several lines', () => {
  const [swap, install] = COPY_MODULES.map(name => copyModules().find(m => m.name === name));
  assert.deepEqual(readSourceCalls(install.text).map(c => c.args.replace(/\s+/g, ' ')), ['source, { released }']);
  assert.ok(callsOf(swap.text, READ_CALLS).some(c => c.name === 'fs.readFileSync' && c.args === 'file'), 'the scan finds fs.readFileSync(file) in the swap, a read of the target');
  assert.deepEqual(sourceReads('planted.mjs', 'const x = fs.readFileSync(\n  path.join(source, rel));\n'), ['planted.mjs:1 fs.readFileSync(path.join(source, rel)) names the source']);
});

// ---------------------------------------------------------------------------------------------------------------------
// ONE road to settings.json: `commitSettings` (E2.S2)
// ---------------------------------------------------------------------------------------------------------------------

const GUARD_TEXT = fs.readFileSync(path.join(LIB, GUARD), 'utf8');

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

test('the registration reaches settings.json only through commitSettings: it imports commitSettings and settingsFileOf, never writeAtomic, effortTarget or sameBytes, and calls the road once with replace: false', () => {
  const install = modules().find(m => m.name === 'agent-models-install.mjs');
  const names = namedImports(install.text).filter(i => i.from === `./${GUARD}`).flatMap(i => i.names);
  for (const wanted of ['commitSettings', 'settingsFileOf']) assert.ok(names.includes(wanted), `${wanted} is imported from the guard installer`);
  for (const gone of ['writeAtomic', 'effortTarget', 'sameBytes']) assert.equal(names.includes(gone), false, `${gone} is not imported: the registration has no road of its own`);
  const calls = commitCalls(install.text);
  assert.equal(calls.length, 1, 'one call of the road');
  assert.match(calls[0].args, /\breplace: false\b/, 'the mod\'s creation never replaces a file that appeared');
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

test('the U+FEFF scan still finds its known instances: it lists the installer modules and the guard installer under lib/, and names a line that holds the character', () => {
  const files = mjsUnder(HOOKS);
  for (const known of ['lib/agent-models-decide.mjs', 'lib/agent-models-read.mjs', 'lib/user-guard-install.mjs', 'subagent-model.mjs']) assert.ok(files.includes(known), `${known} is scanned`);
  assert.deepEqual(bomLines('f.mjs', `one\nvalue.replace(/^${BOM}/, '')\nthree`), ['f.mjs:2']);
});
