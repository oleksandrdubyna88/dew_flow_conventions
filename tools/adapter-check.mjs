#!/usr/bin/env node
/**
 * The Claude host adapter is present, wired, and identical to the family reference.
 *
 * <p>Run it from a consumer: `node .agents/conventions/tools/adapter-check.mjs`. It compares that
 * repository's `.claude/settings.json` and `.claude/hooks/load-instructions.mjs` against
 * `settings/settings.json` and `settings/hooks/load-instructions.mjs` here.</p>
 *
 * <p><b>Why a checker rather than a sentence in the README.</b> This family already learned it
 * twice. `common/planning-docs.md` described plan promotion for as long as it existed, and by the
 * time anyone counted, twelve implemented plans sat unpromoted. `settings/settings.json` was
 * declared the reference and nothing ever compared a copy to it. A copied file with no comparison
 * drifts, and this one drifts SILENTLY: a session that never received the rules is indistinguishable
 * from a session that received them and chose badly.</p>
 *
 * <p>Every path derived from the argument goes through `within` — the same door every tool here uses
 * since S8707, because an agent is the usual caller and a faulty argument must stop the tool rather
 * than read something outside the repository.</p>
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { within } from './lib/paths.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE = path.resolve(HERE, '..', 'settings');
const HOOK = '.claude/hooks/load-instructions.mjs';
const SETTINGS = '.claude/settings.json';
const ADAPTER = 'CLAUDE.md';
const LEGACY = '.claude/rules';

/** Every `SessionStart` command a settings file declares, in order. */
export function sessionStartCommands(settings) {
  return (settings?.hooks?.SessionStart ?? [])
    .flatMap((entry) => entry?.hooks ?? [])
    .filter((hook) => hook?.type === 'command')
    .map((hook) => hook.command);
}

/** One file's text with line endings normalised — a CRLF checkout is not drift. */
function text(file) {
  return fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
}

/** The settings file declares every SessionStart command the reference declares. */
function settingsFindings(repo, wanted) {
  const file = within(repo, SETTINGS, 'settings');
  if (!fs.existsSync(file)) {
    return [`${SETTINGS} is missing — copy settings/settings.json and keep your own permissions`];
  }

  let declared;
  try {
    declared = sessionStartCommands(JSON.parse(text(file)));
  } catch (error) {
    return [`${SETTINGS} does not parse: ${error.message}`];
  }

  return wanted
    .filter((command) => !declared.includes(command))
    .map((command) => `${SETTINGS} declares no SessionStart command \`${command}\` — `
      + 'a Claude session there starts without this repository’s rules');
}

/** The hook is there, and byte-for-byte what this repository publishes. */
function hookFindings(repo, reference) {
  const file = within(repo, HOOK, 'hook');
  if (!fs.existsSync(file)) {
    return [`${HOOK} is missing — copy settings/hooks/load-instructions.mjs verbatim`];
  }
  if (text(file) !== reference) {
    return [`${HOOK} has drifted from settings/hooks/load-instructions.mjs — `
      + 'change the reference and re-copy, never the copy alone'];
  }

  return [];
}

/**
 * The two doors `rule-cli.mjs` refuses.
 *
 * <p>Reported here as well because THIS is the tool somebody runs when they wonder why a session has
 * no rules, and taking either door is the tempting wrong fix — it looks like it works, and it makes
 * the resolver call the whole repository incomplete.</p>
 */
function refusedDoorFindings(repo) {
  const findings = [];
  const legacy = within(repo, LEGACY, 'legacy rules');
  if (fs.existsSync(legacy) && fs.readdirSync(legacy).length > 0) {
    findings.push(`${LEGACY} is populated — the resolver refuses that as a second source; `
      + 'policy belongs in .agents/rules');
  }
  const adapter = within(repo, ADAPTER, 'adapter');
  if (fs.existsSync(adapter) && text(adapter).trim() !== '@AGENTS.md') {
    findings.push(`${ADAPTER} is not exactly \`@AGENTS.md\` — the resolver refuses that; `
      + 'the hook is how Claude loads instructions here');
  }

  return findings;
}

/** The findings for one repository — empty when its adapter is whole. */
export function adapterFindings(repo, reference = REFERENCE) {
  const root = path.resolve(repo);
  const hook = text(path.join(reference, 'hooks/load-instructions.mjs'));
  const wanted = sessionStartCommands(JSON.parse(text(path.join(reference, 'settings.json'))));

  return [
    ...settingsFindings(root, wanted),
    ...hookFindings(root, hook),
    ...refusedDoorFindings(root),
  ];
}

function report(repo) {
  const findings = adapterFindings(path.resolve(repo));
  if (findings.length === 0) {
    process.stdout.write('adapter-check: OK — the Claude adapter is wired and matches the reference.\n');

    return 0;
  }
  process.stdout.write(`adapter-check: ${findings.length} finding(s)\n\n`);
  for (const finding of findings) {
    process.stdout.write(`  ${finding}\n`);
  }
  process.stdout.write('\nThe reference lives in settings/ of the conventions repository.\n');

  return 1;
}

if (process.argv[1]?.endsWith('adapter-check.mjs')) {
  process.exit(report(process.argv[2] ?? process.cwd()));
}
