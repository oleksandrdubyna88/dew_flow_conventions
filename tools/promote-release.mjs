#!/usr/bin/env node
// promote-release.mjs — `release` moves to the commit a person names, and only to one that has earned it.
//
// `release` is the ref every consumer's .gitmodules follows — pin-check.mjs judges their pins against
// its tip — so whatever this file lets through becomes the policy of six repositories at their next
// pin bump, and a wrong pass ships an unverified commit to all of them at once. That is the failure
// this file exists to make impossible, and it is why the gate is a script rather than a workflow's
// `run:` block: a refusal written in YAML can only be exercised by running the workflow, and a gate
// that has only ever been seen open is a gate nobody has seen close. promote-release.test.mjs closes
// this one every way it can close, against real repositories in a temp directory.
//
// It is FAIL-CLOSED. Every question has one answer that promotes and every other answer refuses:
//   - the sha must be a full 40-hex commit id — a branch name resolves to whatever it points at when
//     the workflow happens to run, and main is a moving target;
//   - the commit must be reachable from origin's main — a release is a commit that merged, never a
//     branch tip;
//   - the `ci` workflow must have run for THAT EXACT sha and be `completed` with `success`. An absent
//     run and a run still in progress are both refusals, never passes: neither has verified anything
//     yet. This is the most important behaviour in the file, and the one a shortcut reaches for first;
//   - release must move FORWARD — the commit it points at today must be an ancestor of the new one.
//
// There is no rewind or force input, deliberately. Rollback is a forward release: revert the content
// on main, merge, promote the new sha. Moving `release` backwards would make every consumer's
// committed pin differ from the tip at once, reddening all of them DURING the incident the rollback
// exists to end, and a non-fast-forward update breaks every cached clone's
// `git submodule update --remote`. The push below carries no --force, so git itself refuses a rewind
// even if the ancestry check above it is ever edited away.
//
// The ref is pushed as `<sha>:refs/heads/release`, spelled in full, so it can only ever be a branch:
// a bare `release` would also match a tag, and a tag is not something `update --remote` can move a
// pin to (todo/PLAN_rule_ownership_and_release_pinning.md, "1. release — a ref that moves when a
// person decides").
//
// Usage:  node tools/promote-release.mjs <sha> [--dry-run]
//   --dry-run   ask every question, print the verdict, push nothing. A sha that would be refused is
//               refused in a dry run too — the flag suppresses the push, never the judgement.
// Exit:   0 promoted — or already there, or a dry run that would promote
//         1 REFUSED — the commit's own standing: shape, ancestry, its ci run, or a backwards move
//         2 usage
//         3 UNDECIDED — the evidence could not be gathered (no network, no gh, a shallow checkout, an
//           unreadable answer), or the push did not land. Nothing is pushed on ANY non-zero exit.
// Needs:  a FULL checkout (actions/checkout with fetch-depth: 0 — a shallow one cannot judge ancestry
//         and is refused as such), an authenticated `gh` (GH_TOKEN in Actions), and the repository
//         slug — GITHUB_REPOSITORY, which Actions sets; outside Actions it is read from origin's url.
//
// `decide` is the judgement and `promote` is the side effect; both take `git` and `gh` as functions.
// That is how the tests drive every refusal with real git repositories and a scripted GitHub answer,
// and no network — and why importing this module runs nothing (the same guard as post-deploy-check).

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { git as gitIn } from "./lib/git.mjs";
import { run } from "./lib/proc.mjs";

/** The remote the workflow's checkout has. The ref is judged and moved THERE, never in a local clone. */
const REMOTE = "origin";

/** Spelled in full: a bare `main` would also match a tag called main. */
const MAIN_REF = "refs/heads/main";

/** Pushed in full so the ref can only ever be a branch — the plan's contract, and pin-check's expectation. */
export const RELEASE_REF = "refs/heads/release";

/**
 * The `name:` line of .github/workflows/ci.yml, and its path — a run counts if it matches either, so
 * renaming one alone does not silently make every run "absent".
 */
const CI_WORKFLOW = "ci";
const CI_WORKFLOW_PATH = ".github/workflows/ci.yml";

/**
 * The file name the runs are asked for BY.
 *
 * Deliberately the workflow-scoped endpoint rather than `actions/runs?head_sha=`: the generic listing
 * returns every workflow's runs for the sha and sets `total_count` across all of them, so on a busy
 * commit a page of ci successes could sit beside a hundred unrelated runs and the count would say the
 * answer was short when it was complete. Asking ci for its own runs makes the count mean what the
 * judgement needs it to mean.
 */
const CI_WORKFLOW_FILE = "ci.yml";

/** A commit id and nothing else. Either case, because both are hex; it is lower-cased before use. */
const FULL_SHA = /^[0-9a-f]{40}$/i;

/** A full page. One sha's ci runs almost never fill it; when they do, the pager below asks for more. */
const RUNS_PER_PAGE = 100;

/**
 * A ceiling on paging, so a remote that keeps claiming more cannot spin here for ever. Ten pages is
 * a thousand ci runs for ONE commit — past that the answer is not a listing, it is a symptom, and
 * UNDECIDED is the honest verdict.
 */
const MAX_RUN_PAGES = 10;

/**
 * Thirty seconds, matching the ceiling lib/git.mjs puts on every git call. An API that accepts the
 * connection and then says nothing is not "slow" — it is endless, and the gate must still answer.
 */
const GH_TIMEOUT_MS = 30_000;

export const EXIT = Object.freeze({ PROMOTED: 0, REFUSED: 1, USAGE: 2, UNDECIDED: 3 });

const firstLine = (text) => String(text ?? "").trim().split("\n")[0];
const refused = (headline, ...lines) => ({ ok: false, code: EXIT.REFUSED, headline, lines });
const undecided = (headline, ...lines) => ({ ok: false, code: EXIT.UNDECIDED, headline, lines });

/**
 * `owner/name` of the GitHub repository whose ci runs are asked for.
 *
 * GITHUB_REPOSITORY and origin must AGREE. The variable decides whose ci runs vouch for the sha and
 * the push always goes to origin, so a disagreement lets a fork authorise a ref here. Outside Actions,
 * origin's url alone — https or ssh, with or without `.git`. Empty when neither says, or when they
 * contradict each other: the caller refuses rather than asking the wrong repository.
 */
export function repositorySlug(env, git) {
  let fromOrigin = "";
  try {
    const match = /github\.com[/:]([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/.exec(git("remote", "get-url", REMOTE));
    if (match !== null) fromOrigin = `${match[1]}/${match[2]}`;
  } catch {
    fromOrigin = "";
  }

  const fromActions = env.GITHUB_REPOSITORY ?? "";
  if (!/^[^\s/]+\/[^\s/]+$/.test(fromActions)) return fromOrigin;

  // GITHUB_REPOSITORY decides WHOSE ci runs vouch for the sha, while the push always goes to origin.
  // Letting them disagree means a fork's or mirror's green run can authorise a ref on this remote, so
  // a mismatch is not resolved in either direction — it is refused by returning nothing, and the
  // caller's WHICH REPOSITORY branch stops the run. Equal, or origin unparseable, is the only way
  // through. Case-insensitive because GitHub owners and names are.
  if (fromOrigin === "" || fromOrigin.toLowerCase() === fromActions.toLowerCase()) return fromActions;
  return "";
}

/**
 * `gh` as a function: argv in, stdout out, a thrown Error for anything that is not exit 0.
 *
 * Always the `gh` on PATH. There is deliberately no environment variable naming the executable:
 * three reviewers on 2026-09-14 called such a seam a way to forge the evidence this gate exists to
 * check, and they were right — an inherited or injected variable on a self-hosted runner could point
 * it at a shim that answers "green" for any sha, after which the gate uses real credentials to move
 * the ref. Tests inject `gh` as a FUNCTION instead (`main` takes it), which no environment can set.
 * Launched through lib/proc.mjs — the family's launcher for everything that is not git — so the
 * ceiling kills the process tree rather than merely stopping the wait.
 */
export function ghLauncher(env = process.env) {
  return async (...args) => {
    const result = await run("gh", args, { env, timeoutMs: GH_TIMEOUT_MS });
    if (result.timedOut) throw new Error(`gh gave no answer within ${GH_TIMEOUT_MS} ms`);
    if (result.spawnFailed) throw new Error(`gh could not be started (${result.spawnError}) — is the GitHub CLI installed and on PATH?`);
    if (result.code !== 0) throw new Error(firstLine(result.err) || `gh exited ${result.code}`);
    return result.out;
  };
}

/** The `ci` runs GitHub lists for exactly this sha, or the reason the answer could not be read. */
export function ciRunsFor(answer, sha) {
  let parsed;
  try {
    parsed = JSON.parse(answer);
  } catch {
    return { error: "the answer is not JSON" };
  }
  if (!Array.isArray(parsed?.workflow_runs)) return { error: "the answer carries no workflow_runs list" };

  // `total_count` is how the pager knows whether it has seen everything, so an answer that does not
  // carry a real count is unreadable rather than complete. Treating a missing or non-numeric count as
  // "nothing more to fetch" would let a page of successes stand in for a listing whose later pages
  // hold the failed run that disqualifies the sha.
  const total = Number(parsed.total_count);
  if (!Number.isInteger(total) || total < 0) {
    return { error: `the answer's total_count is ${JSON.stringify(parsed.total_count)}, which is not a count of runs` };
  }

  const isCi = (r) => r.name === CI_WORKFLOW || r.path === CI_WORKFLOW_PATH;
  return {
    runs: parsed.workflow_runs.filter((r) => isCi(r) && String(r.head_sha).toLowerCase() === sha),
    total,
    listed: parsed.workflow_runs.length,
  };
}

/**
 * Every `ci` run GitHub has for this sha, across as many pages as it takes — or the reason the
 * listing could not be completed.
 *
 * Paging matters because the judgement is "EVERY run is green": a listing that stopped at one page
 * could be missing exactly the failed run that should refuse the promotion, and a sha whose runs
 * merely OUTNUMBER a page must still be promotable. A page that comes back empty ends the loop even
 * if the count disagrees, so a remote that miscounts cannot spin here.
 */
export async function collectCiRuns(gh, repository, sha) {
  const runs = [];
  let seen = 0;
  for (let page = 1; page <= MAX_RUN_PAGES; page += 1) {
    const query = `repos/${repository}/actions/workflows/${CI_WORKFLOW_FILE}/runs?head_sha=${sha}&per_page=${RUNS_PER_PAGE}&page=${page}`;
    let answer;
    try {
      answer = await gh("api", query);
    } catch (error) {
      return { error: `page ${page}: ${firstLine(error.message)}`, asked: true };
    }
    const parsed = ciRunsFor(answer, sha);
    if (parsed.error !== undefined) return { error: parsed.error };
    runs.push(...parsed.runs);
    seen += parsed.listed;
    if (parsed.listed === 0 || seen >= parsed.total) return { runs };
  }
  return { error: `more than ${MAX_RUN_PAGES} pages of ci runs for one commit; that is a symptom, not a listing` };
}

/**
 * The verdict on a sha's ci runs. Every run must be completed AND successful, and there must be one:
 * a failed twin beside a green run is not outvoted — two answers about one commit is a question, and
 * the gate does not guess.
 */
export function judgeRuns(runs, sha, repository) {
  if (runs.length === 0) {
    return refused("NO CI RUN",
      `GitHub lists no run of the \`${CI_WORKFLOW}\` workflow for ${sha} in ${repository}.`,
      "An absent run is not a pass — it means nothing has verified this commit: a push CI skipped, a",
      "workflow renamed, or a sha that was never on GitHub. A run still queued is refused the same way.",
      `fix:   promote a commit \`${CI_WORKFLOW}\` has run for — usually main's tip. A dispatch of \`${CI_WORKFLOW}\` runs at a`,
      "       branch tip, so an older commit it never checked cannot be checked after the fact.");
  }
  const unfinished = runs.find((r) => r.status !== "completed");
  if (unfinished !== undefined) {
    return refused("CI NOT FINISHED",
      `the \`${CI_WORKFLOW}\` run for ${sha} is ${unfinished.status} (${unfinished.html_url ?? "no url"}).`,
      "A run that has not finished has verified nothing yet. The gate does not wait for it, and it",
      "does not extrapolate from a run that is going well.",
      "fix:   re-run this promotion after the run completes with success.");
  }
  const notGreen = runs.find((r) => r.conclusion !== "success");
  if (notGreen !== undefined) {
    return refused("CI NOT GREEN",
      `the \`${CI_WORKFLOW}\` run for ${sha} completed with conclusion ${notGreen.conclusion} (${notGreen.html_url ?? "no url"}).`,
      `${runs.length} run(s) listed; every one must be completed and successful for the sha to be a release.`,
      "fix:   fix main and promote the fixed commit. A re-run of this run that goes green also counts.");
  }
  return { ok: true, urls: runs.map((r) => r.html_url ?? `run ${r.id}`) };
}

/** `sha\tref` lines from ls-remote for the two refs this tool cares about, as ref → sha. */
function remoteTips(git) {
  const tips = new Map();
  for (const line of git("ls-remote", REMOTE, MAIN_REF, RELEASE_REF).split("\n").filter(Boolean)) {
    const [sha, ref] = line.split(/\s+/);
    tips.set(ref, sha);
  }
  return tips;
}

/** `commit`, `tree`, `blob`, `tag` — or empty when this checkout has no such object. */
function objectType(git, sha) {
  try {
    return git("cat-file", "-t", sha);
  } catch {
    return "";
  }
}

/** merge-base --is-ancestor: exit 1 is the answer "no"; anything else is an error worth surfacing. */
function isAncestor(git, ancestor, descendant) {
  try {
    git("merge-base", "--is-ancestor", ancestor, descendant);
    return true;
  } catch (error) {
    if (error.status === 1) return false;
    throw error;
  }
}

/**
 * The local half of the judgement: is this a real commit that merged into main, and does moving
 * release to it go forward. Fetches main (and release, when it exists) first, so the ancestry is
 * judged against what origin has NOW rather than what this clone last saw.
 */
function standing({ sha, git, say }) {
  if (git("rev-parse", "--is-shallow-repository") === "true") {
    return undecided("SHALLOW CHECKOUT",
      "this checkout is shallow, so its history stops at a graft and ancestry cannot be judged from it.",
      "Refusing is the safe direction — a shallow clone would call an old release commit \"not on main\".",
      "fix:   check out with the full history (actions/checkout: fetch-depth: 0) and run again.");
  }

  say(`asking ${REMOTE} where main and release are`);
  let tips;
  try {
    tips = remoteTips(git);
  } catch (error) {
    return undecided(`CANNOT REACH ${REMOTE}`, firstLine(error.stderr) || firstLine(error.message),
      "fix:   this tool judges and moves the ref on the remote; without the remote there is nothing to judge.");
  }
  const main = tips.get(MAIN_REF) ?? "";
  if (main === "") {
    return undecided(`NO main ON ${REMOTE}`, `${REMOTE} advertises no ${MAIN_REF}, and a release is defined as a commit that merged into it.`,
      "fix:   this does not look like the conventions repository — check the checkout and its remote.");
  }
  const release = tips.get(RELEASE_REF) ?? "";

  try {
    git("fetch", "--quiet", REMOTE, MAIN_REF, ...(release === "" ? [] : [RELEASE_REF]));
  } catch (error) {
    return undecided("FETCH FAILED", firstLine(error.stderr) || firstLine(error.message),
      `fix:   the objects behind ${REMOTE}'s main are needed to judge ancestry; fix the fetch and run again.`);
  }

  const onMain = "A release is a commit that merged into main, never a branch tip: what every consumer loads as policy is what main reviewed.";
  if (objectType(git, sha) !== "commit") {
    return refused("NOT ON MAIN",
      `this checkout has no commit ${sha} at all — and it has just fetched main (${main}).`, onMain,
      `fix:   check the sha against \`git log ${REMOTE}/main\`; a commit that exists only on a branch is merged first, then promoted as the sha main shows.`);
  }
  if (!isAncestor(git, sha, main)) {
    return refused("NOT ON MAIN", `main is ${main}, and it does not reach ${sha}.`, onMain,
      "fix:   merge the change, then promote the sha main shows for it.");
  }

  if (release !== "" && release !== sha && !isAncestor(git, release, sha)) {
    const relation = isAncestor(git, sha, release)
      ? `${sha} is BEHIND it by ${git("rev-list", "--count", `${sha}..${release}`)} commit(s)`
      : `${sha} is beside it — neither reaches the other`;
    return refused("NOT A FORWARD MOVE",
      `release is ${release}, and ${relation}.`,
      "release only moves forward. Moving it back would make every consumer's committed pin differ from",
      "the tip at once — every repository red during the incident the rollback exists to end — and a",
      "non-fast-forward update breaks each cached clone's `git submodule update --remote`.",
      "fix:   rollback is a forward release: revert the content on main, merge, and promote the NEW commit.");
  }

  return { ok: true, sha, main, release };
}

/**
 * The whole judgement, and nothing else: no push, no output beyond `say`. Returns
 * `{ ok: true, sha, main, release, ahead, runs }` or `{ ok: false, code, headline, lines }`.
 */
export async function decide({ sha: named, git, gh, repository, say = () => {} }) {
  if (!FULL_SHA.test(named)) {
    return refused("NOT A SHA",
      `"${named}" is not a full 40-character commit id.`,
      "A branch name resolves to whatever it points at when the workflow happens to run, an abbreviation",
      "to whatever it happens to be unique for; a release names ONE commit, in full.",
      `fix:   git rev-parse ${REMOTE}/main — and pass the 40 characters it prints.`);
  }
  const sha = named.toLowerCase();

  if (repository === "") {
    return undecided("WHICH REPOSITORY",
      `neither GITHUB_REPOSITORY nor ${REMOTE}'s url says which GitHub repository's ci runs to ask for.`,
      "Asking the wrong repository would judge the sha by another repository's runs; not asking is the safe direction.",
      "fix:   set GITHUB_REPOSITORY=owner/name (Actions does), or point origin at the GitHub repository.");
  }

  const local = standing({ sha, git, say });
  if (!local.ok) return local;

  say(`asking GitHub for \`${CI_WORKFLOW}\` runs of ${sha} in ${repository}`);
  const listing = await collectCiRuns(gh, repository, sha);
  if (listing.error !== undefined) {
    return listing.asked === true
      ? undecided("GITHUB NOT ASKED", listing.error,
        "Without GitHub's answer there is no evidence either way, and no evidence is a refusal.",
        "fix:   authenticate gh (GH_TOKEN in Actions), check the network, and run again.")
      : undecided("UNREADABLE ANSWER", listing.error,
        "An answer that cannot be read is not an answer of \"no runs\"; it is no answer.",
        "fix:   run the gh api call by hand and look at what came back.");
  }
  const verdict = judgeRuns(listing.runs, sha, repository);
  if (!verdict.ok) return verdict;

  const ahead = local.release === "" || local.release === sha ? 0 : Number(git("rev-list", "--count", `${local.release}..${sha}`));
  return { ok: true, sha, main: local.main, release: local.release, ahead, runs: verdict.urls };
}

/**
 * Print a refusal.
 *
 * The closing line is conditional, and that is the whole point of `afterPush`. Before the push, "no
 * ref was moved" is a fact this tool can state. After one, it is a claim it cannot make: the remote
 * may have accepted the update and lost the response, in which case consumers can already see the
 * new release and an operator told "nothing was pushed" goes off to repair a state that is correct.
 */
function report(decision, fail, afterPush = false) {
  const kind = decision.code === EXIT.REFUSED ? "REFUSED" : "UNDECIDED";
  fail(`promote-release: ${kind} — ${decision.headline}`);
  for (const line of decision.lines) fail(`  ${line}`);
  fail(afterPush
    ? `  The push was attempted, so the state of ${RELEASE_REF} is what the lines above say and no more.`
    : "  No push was attempted; release is where it was.");
  return decision.code;
}

/**
 * The side effect: judge, then push `<sha>:refs/heads/release` and confirm the remote agrees.
 * `--dry-run` stops after the judgement. Resolves to the exit code.
 */
export async function promote({ sha, dryRun = false, git, gh, repository, log = console.log, fail = console.error }) {
  const decision = await decide({ sha, git, gh, repository, say: (m) => log(`promote-release: ${m}`) });
  if (!decision.ok) return report(decision, fail);

  log(`promote-release: ${decision.sha} is on main, and its \`${CI_WORKFLOW}\` run is green (${decision.runs.join(", ")}).`);
  if (decision.release === decision.sha) {
    log(`promote-release: release is already ${decision.sha} — nothing to move, and nothing pushed.`);
    return EXIT.PROMOTED;
  }

  const movement = decision.release === ""
    ? `release does not exist yet; ${decision.sha} creates it`
    : `release ${decision.release} → ${decision.sha} (+${decision.ahead} commit(s))`;
  if (dryRun) {
    log(`promote-release: DRY RUN — would push ${decision.sha}:${RELEASE_REF} to ${REMOTE}: ${movement}. Nothing pushed.`);
    return EXIT.PROMOTED;
  }

  log(`promote-release: pushing ${decision.sha}:${RELEASE_REF} to ${REMOTE} — ${movement}`);
  try {
    git("push", REMOTE, `${decision.sha}:${RELEASE_REF}`);
  } catch (error) {
    // A push that errors has not necessarily failed: if the remote accepted the update and the
    // connection dropped before the response arrived, the ref HAS moved and every consumer can
    // already see it. Reporting that as "nothing was pushed" would send an operator to repair a
    // state that is correct. So ask the remote where release is before concluding anything.
    let landed = "";
    let asked = true;
    try {
      landed = remoteTips(git).get(RELEASE_REF) ?? "";
    } catch {
      asked = false; // the read-back ITSELF failed: nothing below may claim to know where release is.
    }
    if (asked && landed === decision.sha) {
      log(`promote-release: the push reported an error, but ${REMOTE}/release IS ${decision.sha} — it landed before the connection broke.`);
      log(`promote-release: PROMOTED — ${REMOTE}/release is ${decision.sha}. Consumers pick it up with \`git submodule update --remote\`.`);
      return EXIT.PROMOTED;
    }
    return report(undecided("PUSH REFUSED", firstLine(error.stderr) || firstLine(error.message),
      asked
        ? `${REMOTE} did not accept the update, and release is still ${landed || "(no such ref)"}.`
        : `${REMOTE} could not be asked where release is afterwards, so whether the update landed is UNKNOWN.`,
      "A ruleset that denies pushes to release from anything but the workflow refuses exactly like this —",
      "which is the point of the ruleset; run the promotion through the workflow.",
      asked
        ? "fix:   read the line above; this tool never adds --force, so a non-fast-forward refusal means release has moved on."
        : `fix:   git ls-remote ${REMOTE} ${RELEASE_REF} — and compare with ${decision.sha} before doing anything else.`), fail, true);
  }

  let now = "";
  try {
    now = remoteTips(git).get(RELEASE_REF) ?? "";
  } catch (error) {
    return report(undecided("PUSH NOT CONFIRMED", firstLine(error.stderr) || firstLine(error.message),
      `the push returned, but ${REMOTE} could not be asked where release is now.`,
      `fix:   git ls-remote ${REMOTE} ${RELEASE_REF} — and compare with ${decision.sha}.`), fail, true);
  }
  if (now !== decision.sha) {
    return report(undecided("PUSH NOT CONFIRMED",
      `the push returned, but ${REMOTE} reports release at ${now || "(no such ref)"} rather than ${decision.sha}.`,
      "Something else moved the ref in the same moment, or the remote lied; either way this run promoted nothing it can vouch for.",
      `fix:   git ls-remote ${REMOTE} ${RELEASE_REF}, and run the promotion again once it is understood.`), fail, true);
  }

  log(`promote-release: PROMOTED — ${REMOTE}/release is ${decision.sha}. Consumers pick it up with \`git submodule update --remote\`.`);
  return EXIT.PROMOTED;
}

function usage(reason, fail) {
  fail(`promote-release: ${reason}`);
  fail("  usage: node tools/promote-release.mjs <40-hex sha> [--dry-run]");
  fail("  There is no --force and no rewind: release moves forward only. Rollback is a forward release —");
  fail("  revert the content on main, merge, and promote the new sha.");
  return EXIT.USAGE;
}

/**
 * The command: argv → exit code. Real git in the current directory, and the `gh` on PATH.
 *
 * `gh` is a parameter rather than something an environment variable can redirect: a function cannot
 * be supplied by a hostile or inherited environment, so the process-level tests can answer as GitHub
 * without leaving a way to forge CI evidence in production.
 */
export async function main(
  argv,
  env,
  log = console.log,
  fail = console.error,
  gh = ghLauncher(env),
  git = (...args) => gitIn(process.cwd(), ...args),
) {
  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: { "dry-run": { type: "boolean", default: false } }, allowPositionals: true, strict: true });
  } catch (error) {
    return usage(error.message, fail);
  }
  if (parsed.positionals.length !== 1) {
    return usage(parsed.positionals.length === 0 ? "no sha was given." : `one sha, not ${parsed.positionals.length}: ${parsed.positionals.join(" ")}`, fail);
  }
  return promote({
    sha: parsed.positionals[0],
    dryRun: parsed.values["dry-run"],
    git,
    gh,
    repository: repositorySlug(env, git),
    log,
    fail,
  });
}

// Only when run as a command. `decide`, `promote` and the parsers are imported by
// promote-release.test.mjs, and a module that runs its main on import cannot be tested — nor should
// importing it move a ref. A crash is UNDECIDED, never a pass: the gate has no default-open state.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2), process.env)
    .then((code) => { process.exitCode = code; })
    .catch((error) => {
      console.error(`promote-release: UNDECIDED — ${firstLine(error.message)}`);
      console.error(`  ${error.stack ?? error.message}`);
      console.error("  Nothing was pushed; release is where it was.");
      process.exitCode = EXIT.UNDECIDED;
    });
}
