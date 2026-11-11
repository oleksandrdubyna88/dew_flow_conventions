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
  return [...text.matchAll(/^import\s*\{([^}]*)\}\s*from\s*'([^']+)'/gm)].map(m => ({
    names: m[1].split(',').map(part => part.trim().split(/\s+as\s+/)[0]).filter(Boolean),
    from: m[2],
  }));
}

/** Every module specifier of a text: `import … from`, `export … from`, a bare `import '…'`, and `import('…')`. */
function specifiersOf(text) {
  const found = [
    ...text.matchAll(/^(?:import|export)\b[^;]*?\bfrom\s+'([^']+)'/gm),
    ...text.matchAll(/^import\s+'([^']+)'/gm),
    ...text.matchAll(/\bimport\(\s*'([^']+)'\s*\)/g),
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
