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
import { git } from './lib/git.mjs';
import { within } from './lib/paths.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE = path.resolve(HERE, '..', 'settings');
const SETTINGS = '.claude/settings.json';
const ADAPTER = 'CLAUDE.md';
const LEGACY = '.claude/rules';

const hookPath = (file) => `.claude/hooks/${file}`;

/**
 * The hook scripts the reference publishes — derived, never listed here.
 *
 * <p>The adapter grew a second hook (`build-flags.mjs`, which refuses a `dotnet build` that does not
 * bound its MSBuild worker pool) and a hard-coded inventory was the first version of this. The code
 * round named the cost: a third hook added to `settings/hooks/` would be checked in no consumer
 * until somebody remembered to edit this file, which is the failure this tool exists to prevent, one
 * level up. Tests live beside their subject here, so `*.test.mjs` is not part of the adapter.</p>
 */
function referenceHookFiles(reference, relative = 'hooks', prefix = '') {
  return listIn(reference, relative, 'reference hooks').flatMap((entry) => {
    const next = `${relative}/${entry}`;
    // Recursive, because a hook in a subdirectory would otherwise be published and checked nowhere
    // (CodeRabbit, PR #21). The relative name is what a consumer copies, so `shared/third.mjs`
    // stays `shared/third.mjs` under `.claude/hooks/`.
    if (fs.statSync(within(reference, next, 'reference hooks')).isDirectory()) {
      return referenceHookFiles(reference, next, `${prefix}${entry}/`);
    }

    return entry.endsWith('.mjs') && !entry.endsWith('.test.mjs') ? [`${prefix}${entry}`] : [];
  }).sort();
}

/**
 * Every command a settings file declares for one hook event, with the matcher that decides whether
 * it ever runs.
 *
 * <p>Command AND arguments, because the reference is in exec form: `command` is `node` and the
 * script is an argument. Comparing only `command` would call every settings file that runs node at
 * session start a match. <b>And matcher</b>, because the code round found the gap that leaves: a
 * consumer that narrows `Bash|PowerShell` to `Bash` keeps the identical command while the guard
 * stops running for PowerShell entirely, and the checker called that clean.</p>
 */
export function hookEntries(settings, event) {
  return (settings?.hooks?.[event] ?? []).flatMap((entry) => (entry?.hooks ?? [])
    .filter((hook) => hook?.type === 'command')
    .map((hook) => ({
      matcher: entry?.matcher ?? '',
      command: [hook.command, ...(hook.args ?? [])].join(' '),
    })));
}

/** Just the command strings for one event. */
export function hookCommands(settings, event) {
  return hookEntries(settings, event).map((entry) => entry.command);
}

/** The `SessionStart` commands, kept as its own name because that event is the rules door. */
export function sessionStartCommands(settings) {
  return hookCommands(settings, 'SessionStart');
}

/**
 * The three filesystem doors, each validating the path it is about to use.
 *
 * <p>`within` is called HERE rather than in the callers, and that is the whole point: S8707 follows
 * the CLI argument to the call that reads, and a check one frame up is a check its taint tracker
 * cannot see. Putting the two together also removes the way this goes wrong for a reader — a caller
 * that resolves a path and forgets to validate it looks exactly like one that did.</p>
 *
 * <p>Line endings are normalised on read, because a CRLF checkout of a copied file is not drift.</p>
 */
function readIn(root, relative, what) {
  return fs.readFileSync(within(root, relative, what), 'utf8').replaceAll('\r\n', '\n');
}

function existsIn(root, relative, what) {
  return fs.existsSync(within(root, relative, what));
}

function listIn(root, relative, what) {
  const dir = within(root, relative, what);

  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
}

/** The settings file declares every hook command the reference declares, for every event. */
function settingsFindings(repo, wanted) {
  if (!existsIn(repo, SETTINGS, 'settings')) {
    return [`${SETTINGS} is missing — copy settings/settings.json and keep your own permissions`];
  }

  let settings;
  try {
    settings = JSON.parse(readIn(repo, SETTINGS, 'settings'));
  } catch (error) {
    return [`${SETTINGS} does not parse: ${error.message}`];
  }

  return wanted.flatMap(({ event, matcher, command }) => {
    const declared = hookEntries(settings, event);
    const sameCommand = declared.filter((entry) => entry.command === command);
    if (sameCommand.length === 0) {
      return [`${SETTINGS} declares no ${event} command \`${command}\` — `
        + (event === 'SessionStart'
          ? 'a Claude session there starts without this repository’s rules'
          : 'that adapter is not wired, so what it enforces is not enforced there')];
    }
    if (!sameCommand.some((entry) => entry.matcher === matcher)) {
      return [`${SETTINGS} wires ${event} \`${command}\` with matcher `
        + `\`${sameCommand[0].matcher}\`, not \`${matcher}\` — it then never runs for the tools the `
        + 'reference covers, which is drift that looks like a copy'];
    }

    return [];
  });
}

/** Every hook is there, and byte-for-byte what this repository publishes. */
function hookFindings(repo, reference, files) {
  return files.flatMap((file) => {
    const relative = hookPath(file);
    if (!existsIn(repo, relative, 'hook')) {
      return [`${relative} is missing — copy settings/hooks/${file} verbatim`];
    }
    if (readIn(repo, relative, 'hook') !== reference.get(file)) {
      return [`${relative} has drifted from settings/hooks/${file} — `
        + 'change the reference and re-copy, never the copy alone'];
    }

    return [];
  });
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
  if (listIn(repo, LEGACY, 'legacy rules').length > 0) {
    findings.push(`${LEGACY} is populated — the resolver refuses that as a second source; `
      + 'policy belongs in .agents/rules');
  }
  if (existsIn(repo, ADAPTER, 'adapter') && readIn(repo, ADAPTER, 'adapter').trim() !== '@AGENTS.md') {
    findings.push(`${ADAPTER} is not exactly \`@AGENTS.md\` — the resolver refuses that; `
      + 'the hook is how Claude loads instructions here');
  }

  return findings;
}

/**
 * The repository root of whatever directory was named.
 *
 * <p>`ENTRY.md` step 1 resolves a root exactly this way, and the reasons are the same three: a
 * nested start is normal, a worktree's `.git` is a file rather than a directory, and a directory
 * that is not in a repository at all should be refused rather than checked. It also means the path
 * every read is built from comes from git's own answer, not from the string a caller typed.</p>
 */
function rootOf(directory) {
  try {
    return git(path.resolve(directory), 'rev-parse', '--show-toplevel');
  } catch {
    throw new Error(`${path.resolve(directory)} is not inside a git repository`);
  }
}

/** The findings for one repository — empty when its adapter is whole. */
export function adapterFindings(repo, reference = REFERENCE) {
  const root = rootOf(repo);
  // The reference is this repository's own files, not anything a caller named — and its inventory
  // of hooks and events is READ from it, so a future adapter is checked the day it is added.
  const files = referenceHookFiles(reference);
  const hooks = new Map(files.map((file) => [file, readIn(reference, `hooks/${file}`, 'reference hook')]));
  const referenceSettings = JSON.parse(readIn(reference, 'settings.json', 'reference settings'));
  const wanted = Object.keys(referenceSettings?.hooks ?? {}).flatMap(
    (event) => hookEntries(referenceSettings, event).map((entry) => ({ event, ...entry })),
  );

  return [
    ...settingsFindings(root, wanted),
    ...hookFindings(root, hooks, files),
    ...refusedDoorFindings(root),
  ];
}

function report(repo) {
  const findings = adapterFindings(repo);
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
