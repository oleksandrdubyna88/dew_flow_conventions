#!/usr/bin/env node
/**
 * The Claude host adapter is present, wired, and identical to the family reference.
 *
 * <p>Run it from a consumer: `node .agents/conventions/tools/adapter-check.mjs`. It compares that
 * repository's `.claude/settings.json` and `.claude/hooks/load-instructions.mjs` against
 * `settings/settings.json` and `settings/hooks/load-instructions.mjs` here.</p>
 *
 * <p><b>Why a checker rather than a sentence in the README.</b> This family already learned it
 * twice. `common/planning-docs.md` described plan promotion for as long as it existed and by the
 * time anyone counted, twelve implemented plans sat unpromoted. `settings/settings.json` was
 * declared the reference and nothing ever compared a copy to it. A copied file with no comparison
 * is a file that drifts, and this one drifts SILENTLY: a session that never received the rules is
 * indistinguishable from a session that received them and chose badly.</p>
 *
 * <p>Failure is by exit code, and every finding names the file and what to do. The settings check is
 * deliberately not byte-equality on the whole file — a repository may hold permissions of its own —
 * but the hook entry must match exactly, because that entry IS the mechanism.</p>
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE = path.resolve(HERE, '..', 'settings');
const HOOK = '.claude/hooks/load-instructions.mjs';
const SETTINGS = '.claude/settings.json';

/** Every `SessionStart` command a settings file declares, in order. */
export function sessionStartCommands(settings) {
  return (settings?.hooks?.SessionStart ?? [])
    .flatMap((entry) => entry?.hooks ?? [])
    .filter((hook) => hook?.type === 'command')
    .map((hook) => hook.command);
}

/** The findings for one repository — empty when its adapter is whole. */
export function adapterFindings(repo, reference = REFERENCE) {
  const findings = [];
  const referenceHook = fs.readFileSync(path.join(reference, 'hooks/load-instructions.mjs'), 'utf8');
  const wanted = sessionStartCommands(
    JSON.parse(fs.readFileSync(path.join(reference, 'settings.json'), 'utf8')),
  );

  const settingsPath = path.join(repo, SETTINGS);
  if (!fs.existsSync(settingsPath)) {
    findings.push(`${SETTINGS} is missing — copy settings/settings.json and keep your own permissions`);
  } else {
    let settings;
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (error) {
      findings.push(`${SETTINGS} does not parse: ${error.message}`);
    }
    if (settings !== undefined) {
      const found = sessionStartCommands(settings);
      for (const command of wanted) {
        if (!found.includes(command)) {
          findings.push(`${SETTINGS} declares no SessionStart command \`${command}\` — `
            + 'a Claude session there starts without this repository’s rules');
        }
      }
    }
  }

  const hookPath = path.join(repo, HOOK);
  if (!fs.existsSync(hookPath)) {
    findings.push(`${HOOK} is missing — copy settings/hooks/load-instructions.mjs verbatim`);
  } else if (fs.readFileSync(hookPath, 'utf8').replace(/\r\n/g, '\n') !== referenceHook.replace(/\r\n/g, '\n')) {
    findings.push(`${HOOK} has drifted from settings/hooks/load-instructions.mjs — `
      + 'change the reference and re-copy, never the copy alone');
  }

  // The two doors the resolver refuses. Reported here as well because THIS is the tool somebody runs
  // when they wonder why a session has no rules, and taking either door is the tempting wrong fix.
  const legacy = path.join(repo, '.claude/rules');
  if (fs.existsSync(legacy) && fs.readdirSync(legacy).length > 0) {
    findings.push('.claude/rules is populated — the resolver refuses that as a second source; '
      + 'policy belongs in .agents/rules');
  }
  const adapter = path.join(repo, 'CLAUDE.md');
  if (fs.existsSync(adapter) && fs.readFileSync(adapter, 'utf8').trim() !== '@AGENTS.md') {
    findings.push('CLAUDE.md is not exactly `@AGENTS.md` — the resolver refuses that; '
      + 'the hook is how Claude loads instructions here');
  }

  return findings;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('adapter-check.mjs')) {
  const repo = process.argv[2] ?? process.cwd();
  const findings = adapterFindings(path.resolve(repo));
  if (findings.length === 0) {
    process.stdout.write('adapter-check: OK — the Claude adapter is wired and matches the reference.\n');
    process.exit(0);
  }
  process.stdout.write(`adapter-check: ${findings.length} finding(s)\n\n`);
  for (const finding of findings) {
    process.stdout.write(`  ${finding}\n`);
  }
  process.stdout.write('\nThe reference lives in settings/ of the conventions repository.\n');
  process.exit(1);
}
