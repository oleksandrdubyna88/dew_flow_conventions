#!/usr/bin/env node
// release-distance.mjs — `release` is still being moved, and has not quietly stopped.
//
// This check exists because the mechanism it watches CREATES the failure it looks for. Before
// consumers followed `release`, a pin that lagged was loud: pin-check went red in six repositories
// until somebody bumped it. That was the whole complaint — 95 commits in 29 days, 317 pin-touching
// commits downstream — and freezing the ref is what fixed it.
//
// But the cure has a silent failure of its own. Once every consumer pins `release` and `release`
// stops moving, every pin equals its tracked tip and every check is green — while the rules the
// family actually reads get older every week. That is exactly the state the 2026-08-19 audit found by
// hand (three consumers behind, one missing a whole rule), recreated by design and with the alarm
// switched off. common/reliability.md rules on this shape directly: an unbounded wait is legal only
// as a documented pair, the reason AND a detector that can tell "slow but alive" from "wedged".
// This file is that detector.
//
// It answers two questions, and FAILS rather than merely reporting, because a weekly summary nobody
// reads is the same as no detector at all:
//   - how many commits `main` is ahead of `release` — work written and not published;
//   - how old the commit `release` points at is — publishing that has stopped.
//
// Distance alone is not a fault: a quiet week is a quiet week, and a release that is behind by a
// few documentation commits is a deliberate state, not drift. So the thresholds are generous and
// the AGE is the one that fails on its own.
//
// Run:    node tools/release-distance.mjs [--max-commits N] [--max-days N] [--warn]
// Exit:   0 within bounds, or --warn
//         1 past a bound
//         3 UNDECIDED — the refs could not be read, which is not the same as "no distance"
//
// `measure` is the judgement and takes `git` as a function, so the tests drive it against real
// repositories without a network.

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { git as gitIn } from "./lib/git.mjs";

const REMOTE = "origin";
const MAIN_REF = "refs/heads/main";
const RELEASE_REF = "refs/heads/release";

/**
 * Generous on purpose. The point is to catch publishing that has STOPPED, not to nag about a week
 * where nothing needed publishing — a check that fires on ordinary quiet is a check people disable,
 * and this repository has written that lesson down once already about `--warn`.
 */
const MAX_COMMITS = 40;
const MAX_DAYS = 30;

export const EXIT = Object.freeze({ WITHIN: 0, PAST: 1, UNDECIDED: 3 });

const firstLine = (text) => String(text ?? "").trim().split("\n")[0];

/**
 * How far `release` is behind `main`, and how old it is.
 *
 * Both refs are read from the REMOTE rather than from local branches: this runs on a schedule in a
 * checkout nobody has touched, and a stale local pointer would answer a question about this clone
 * instead of about what consumers load.
 */
export function measure(git, { maxCommits = MAX_COMMITS, maxDays = MAX_DAYS } = {}) {
  let tips;
  try {
    tips = new Map(
      git("ls-remote", REMOTE, MAIN_REF, RELEASE_REF)
        .split("\n")
        .filter(Boolean)
        .map((line) => line.split(/\s+/))
        .map(([sha, ref]) => [ref, sha]),
    );
  } catch (error) {
    return { code: EXIT.UNDECIDED, headline: `cannot reach ${REMOTE}`, lines: [firstLine(error.stderr) || firstLine(error.message)] };
  }

  const main = tips.get(MAIN_REF) ?? "";
  const release = tips.get(RELEASE_REF) ?? "";
  if (main === "") {
    return { code: EXIT.UNDECIDED, headline: `${REMOTE} advertises no ${MAIN_REF}`, lines: ["This does not look like the conventions repository."] };
  }
  if (release === "") {
    // Before the first promotion this is the expected state, not a fault — there is nothing to be
    // behind. It is still worth saying out loud, because "no release yet" and "release has stopped"
    // look identical from a consumer's side and only one of them is fine.
    return {
      code: EXIT.WITHIN,
      headline: "release does not exist yet",
      lines: [`${REMOTE} has no ${RELEASE_REF}. Nothing has been published, so nothing can be stale.`,
        "The first promotion creates it — see the promote-release workflow."],
      release, main, commits: 0, days: 0,
    };
  }

  try {
    git("fetch", "--quiet", REMOTE, MAIN_REF, RELEASE_REF);
  } catch (error) {
    return { code: EXIT.UNDECIDED, headline: "fetch failed", lines: [firstLine(error.stderr) || firstLine(error.message)] };
  }

  const commits = Number(git("rev-list", "--count", `${release}..${main}`));
  const committedAt = Number(git("show", "-s", "--format=%ct", release)) * 1000;
  const days = Math.floor((Date.now() - committedAt) / 86_400_000);

  const over = [
    commits > maxCommits ? `main is ${commits} commits ahead of release (limit ${maxCommits})` : "",
    days > maxDays ? `the commit release points at is ${days} days old (limit ${maxDays})` : "",
  ].filter(Boolean);

  if (over.length === 0) {
    return { code: EXIT.WITHIN, headline: `release is ${commits} commit(s) behind main, published ${days} day(s) ago`, lines: [], release, main, commits, days };
  }
  return {
    code: EXIT.PAST,
    headline: "release has stopped moving",
    lines: [...over,
      "Every consumer pin equals its tracked tip, so every pin-check is green — and the rules the",
      "family reads are this far behind the ones it has written. That is the 2026-08-19 audit state",
      "with the alarm switched off, which is why this is a failure and not a summary.",
      "fix:   promote a reviewed commit through the promote-release workflow, or say in the plan why not."],
    release, main, commits, days,
  };
}

export async function main(argv, log = console.log, fail = console.error, git = (...args) => gitIn(process.cwd(), ...args)) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        "max-commits": { type: "string" },
        "max-days": { type: "string" },
        warn: { type: "boolean", default: false },
      },
      strict: true,
    });
  } catch (error) {
    fail(`release-distance: ${error.message}`);
    return EXIT.PAST;
  }

  const bounds = {};
  if (parsed.values["max-commits"] !== undefined) bounds.maxCommits = Number(parsed.values["max-commits"]);
  if (parsed.values["max-days"] !== undefined) bounds.maxDays = Number(parsed.values["max-days"]);

  const verdict = measure(git, bounds);
  if (verdict.code === EXIT.WITHIN) {
    log(`release-distance: OK — ${verdict.headline}.`);
    for (const line of verdict.lines) log(`  ${line}`);
    return EXIT.WITHIN;
  }

  const kind = verdict.code === EXIT.PAST ? "STALE" : "UNDECIDED";
  fail(`release-distance: ${kind} — ${verdict.headline}.`);
  for (const line of verdict.lines) fail(`  ${line}`);
  if (parsed.values.warn) {
    log("release-distance: --warn — reported, not failed.");
    return EXIT.WITHIN;
  }
  return verdict.code;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
      console.error(`release-distance: UNDECIDED — ${firstLine(error.message)}`);
      process.exitCode = EXIT.UNDECIDED;
    });
}
