#!/usr/bin/env node
/**
 * `promote-release.mjs`'s own tests — every way the gate closes, exercised against real repositories.
 *
 * The plan that ordered this tool says why in one sentence: "a gate that has only ever been exercised
 * on its happy path is a gate nobody has seen close." Each case here is named after the GUARANTEE a
 * consumer relies on, and asserts the exit code AND the words a workflow log would show, because a
 * refusal that exits 1 with the wrong reason sends the operator to fix the wrong thing.
 *
 * Real git, no fixtures: the thing under test is a statement about a remote — *is this commit on main,
 * does release move forward to it* — and a directory of files cannot express "a branch tip beside main".
 * So each case builds a bare remote with a `main`, a merged history, an unmerged `topic` and a `stray`
 * branch off an older commit, then clones it the way the workflow's checkout would.
 *
 * GitHub is a scripted double, injected as a FUNCTION. Each case spawns a tiny entry script that
 * imports the tool's own `main` — real argv parsing, real git, real judgement — and hands it a `gh`
 * that answers from a JSON file the test wrote and records every argv it was given. So the happy path
 * asserts not only that release moved but that GitHub was asked about EXACTLY that sha, and the
 * refusals assert GitHub was never asked at all when ancestry already settled it. Production has no
 * environment variable naming the `gh` executable: three reviewers called that a way to forge the
 * very evidence this gate checks, and a function parameter is not something an environment can set.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { EXIT, RELEASE_REF, ciRunsFor, judgeRuns, repositorySlug } from "./promote-release.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const tool = path.join(here, "promote-release.mjs");

/** The repository the double answers for; GITHUB_REPOSITORY carries it into the tool, as Actions would. */
const SLUG = "example/conventions";

const git = (cwd, ...args) =>
  execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", timeout: 20000, windowsHide: true }).trim();

const commit = (work, message) =>
  git(work, "-c", "user.name=Release test", "-c", "user.email=release@example.invalid", "-c", "commit.gpgsign=false",
    "commit", "-q", "--allow-empty", "-m", message);

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "promote-release-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

/**
 * A bare remote shaped like the conventions repository on a promotion day: `main` two commits deep,
 * `topic` one commit past main that never merged, and `stray` one commit off the OLDER main commit —
 * so there is a sha behind main's tip, one beside it, and one that reaches neither.
 */
function remote(root, name) {
  // Forward slashes: the url is spawned as an argument here, never written into a config file, but
  // `file://` (used by the shallow case) needs them either way.
  const url = path.join(root, `${name}.git`).replaceAll("\\", "/");
  execFileSync("git", ["init", "-q", "--bare", "--initial-branch=main", url], { timeout: 20000 });
  const work = path.join(root, `${name}-work`);
  execFileSync("git", ["clone", "-q", url, work], { timeout: 20000 });
  commit(work, "first — the published version");
  const first = git(work, "rev-parse", "HEAD");
  commit(work, "second — written since");
  const second = git(work, "rev-parse", "HEAD");
  git(work, "checkout", "-q", "-b", "topic");
  commit(work, "on a branch, never merged");
  const topic = git(work, "rev-parse", "HEAD");
  git(work, "checkout", "-q", "-b", "stray", first);
  commit(work, "beside main — shares only the first commit with it");
  const stray = git(work, "rev-parse", "HEAD");
  git(work, "checkout", "-q", "main");
  git(work, "push", "-q", "origin", "main", "topic", "stray");
  const release = (sha) => git(work, "push", "-q", "origin", `${sha}:${RELEASE_REF}`);
  const releaseAt = () => git(work, "ls-remote", url, RELEASE_REF).split(/\s+/)[0] ?? "";
  const refs = () => git(work, "ls-remote", "--refs", url).split("\n").filter(Boolean).map((l) => l.split(/\s+/)[1]).sort();
  return { url, work, first, second, topic, stray, release, releaseAt, refs };
}

/** The workflow's checkout: a full clone of the remote, which is what the tool runs in. */
function checkout(root, url, ...cloneFlags) {
  const dir = path.join(root, `runner-${cloneFlags.length}`);
  execFileSync("git", ["clone", "-q", ...cloneFlags, url, dir], { timeout: 20000 });
  return dir;
}

/**
 * The entry the tests spawn instead of the tool itself.
 *
 * It is a real process running real argv parsing, real git and the tool's own `main` — but it passes
 * `gh` as a FUNCTION. That matters: the tool used to read an environment variable naming the `gh`
 * executable, and three reviewers called it what it was, a way for an inherited or injected variable
 * on a self-hosted runner to forge the CI evidence the gate exists to check. A function parameter
 * cannot be set by an environment, so the seam the tests need does not exist in production at all.
 */
const ENTRY = (tool) => [
  'import * as fs from "node:fs";',
  `import { main } from ${JSON.stringify(pathToFileURL(tool).href)};`,
  'const gh = async (...args) => {',
  '  fs.appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify(args) + "\\n");',
  '  const answer = JSON.parse(fs.readFileSync(process.env.FAKE_GH_ANSWER, "utf8"));',
  '  if ((answer.exitCode ?? 0) !== 0) throw new Error(answer.stderr ?? `gh exited ${answer.exitCode}`);',
  '  return answer.stdout ?? "";',
  '};',
  'process.exitCode = await main(process.argv.slice(2), process.env, console.log, console.error, gh);',
  "",
].join("\n");

function fakeGitHub(root) {
  const entry = path.join(root, "entry.mjs");
  fs.writeFileSync(entry, ENTRY(tool));
  const answerFile = path.join(root, "gh-answer.json");
  const logFile = path.join(root, "gh-calls.log");
  const github = {
    env: { FAKE_GH_ENTRY: entry, FAKE_GH_ANSWER: answerFile, FAKE_GH_LOG: logFile },
    answers(spec) { fs.writeFileSync(answerFile, JSON.stringify(spec)); },
    lists(runs) { github.answers({ stdout: JSON.stringify({ total_count: runs.length, workflow_runs: runs }) }); },
    calls() {
      return fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
    },
  };
  github.lists([]);
  return github;
}

/** A run as the REST listing describes one; overrides make it the in-progress / failed / foreign case. */
const ciRun = (sha, overrides = {}) => ({
  id: 4242,
  name: "ci",
  path: ".github/workflows/ci.yml",
  head_sha: sha,
  event: "push",
  status: "completed",
  conclusion: "success",
  html_url: "https://github.com/example/conventions/actions/runs/4242",
  ...overrides,
});

/** Run the real tool in a checkout, the way the workflow's step runs it. */
function run(cwd, args, env) {
  const result = spawnSync(process.execPath, [env.FAKE_GH_ENTRY, ...args], { cwd, encoding: "utf8", timeout: 60000, env });
  return { code: result.status, out: `${result.stdout}${result.stderr}` };
}

/** Remote + double + checkout, and one function that runs the tool in it. */
function scene(t) {
  const root = workspace(t);
  const rules = remote(root, "conventions");
  const github = fakeGitHub(root);
  const runner = checkout(root, rules.url);
  const env = { ...process.env, GITHUB_REPOSITORY: SLUG, ...github.env };
  return { root, rules, github, runner, env, promote: (args, extra = {}) => run(runner, args, { ...env, ...extra }) };
}

const runsQuery = (sha) => ["api", `repos/${SLUG}/actions/runs?head_sha=${sha}&per_page=100`];

// ── the shape of the argument ─────────────────────────────────────────────────────────────────────

test("a sha that is not a full 40-character hex is refused before anything is asked", (t) => {
  const s = scene(t);
  s.github.lists([ciRun(s.rules.first)]);
  for (const named of ["main", s.rules.first.slice(0, 7), "v1.0", `${s.rules.first}0`, "refs/heads/main"]) {
    const { code, out } = s.promote([named]);
    assert.equal(code, EXIT.REFUSED, out);
    assert.match(out, /REFUSED — NOT A SHA/, out);
    assert.match(out, /not a full 40-character commit id/, out);
    assert.match(out, /Nothing was pushed/, out);
  }
  assert.deepEqual(s.github.calls(), [], "GitHub is never asked about something that is not a commit id");
  assert.equal(s.rules.releaseAt(), "");
});

test("an upper-case sha names the same commit and is not malformed", (t) => {
  const s = scene(t);
  s.github.lists([ciRun(s.rules.first)]);
  const { code, out } = s.promote([s.rules.first.toUpperCase(), "--dry-run"]);
  assert.equal(code, EXIT.PROMOTED, out);
  assert.match(out, /DRY RUN/, out);
  assert.deepEqual(s.github.calls(), [runsQuery(s.rules.first)], "the API is asked with the lower-cased sha GitHub stores");
});

test("the command takes exactly one sha, and an option that would rewind does not exist", (t) => {
  const s = scene(t);
  const none = s.promote([]);
  assert.equal(none.code, EXIT.USAGE, none.out);
  assert.match(none.out, /no sha was given/, none.out);

  const two = s.promote([s.rules.first, s.rules.second]);
  assert.equal(two.code, EXIT.USAGE, two.out);
  assert.match(two.out, /one sha, not 2/, two.out);

  for (const flag of ["--force", "--rewind", "--allow-backwards"]) {
    const { code, out } = s.promote([s.rules.first, flag]);
    assert.equal(code, EXIT.USAGE, out);
    assert.match(out, /Unknown option/, out);
    assert.match(out, /no --force and no rewind: release moves forward only/, out);
  }
  assert.deepEqual(s.github.calls(), []);
  assert.equal(s.rules.releaseAt(), "");
});

// ── ancestry: a release is a commit that merged ───────────────────────────────────────────────────

test("a commit main does not reach is refused as not on main, however green its own ci run is", (t) => {
  // The guarantee the plan states first: "a release is a commit that merged, never a branch tip". The
  // double is primed with a GREEN run for the branch tip, so if this ever passes, ancestry is not
  // being checked — CI alone would have let it through.
  const s = scene(t);
  s.github.lists([ciRun(s.rules.topic)]);
  const { code, out } = s.promote([s.rules.topic]);
  assert.equal(code, EXIT.REFUSED, out);
  assert.match(out, /REFUSED — NOT ON MAIN/, out);
  assert.match(out, new RegExp(`main is ${s.rules.second}, and it does not reach ${s.rules.topic}`), out);
  assert.match(out, /never a branch tip/, out);
  assert.deepEqual(s.github.calls(), [], "ancestry is settled locally; GitHub is not asked about a commit that never merged");
  assert.equal(s.rules.releaseAt(), "");
});

test("a sha this checkout has never seen is not on main — a refusal with a cure, not a crash", (t) => {
  const s = scene(t);
  const unknown = "b".repeat(40);
  const { code, out } = s.promote([unknown]);
  assert.equal(code, EXIT.REFUSED, out);
  assert.match(out, /REFUSED — NOT ON MAIN/, out);
  assert.match(out, new RegExp(`no commit ${unknown} at all`), out);
  assert.match(out, /fix: {3}check the sha against `git log origin\/main`/, out);
  assert.doesNotMatch(out, /at file:/, "a stack trace is not a finding");
});

// ── the ci run: the single most important behaviour ───────────────────────────────────────────────

test("a sha with no ci run at all is refused, never passed as harmless", (t) => {
  const s = scene(t);
  s.github.lists([]);
  const { code, out } = s.promote([s.rules.first]);
  assert.equal(code, EXIT.REFUSED, out);
  assert.match(out, /REFUSED — NO CI RUN/, out);
  assert.match(out, new RegExp(`no run of the \`ci\` workflow for ${s.rules.first} in ${SLUG}`), out);
  assert.match(out, /An absent run is not a pass/, out);
  assert.deepEqual(s.github.calls(), [runsQuery(s.rules.first)]);
  assert.equal(s.rules.releaseAt(), "", "nothing moved");
});

test("a ci run still in progress is refused, and the refusal says so rather than waiting", (t) => {
  const s = scene(t);
  for (const status of ["in_progress", "queued", "waiting"]) {
    s.github.lists([ciRun(s.rules.first, { status, conclusion: null })]);
    const { code, out } = s.promote([s.rules.first]);
    assert.equal(code, EXIT.REFUSED, out);
    assert.match(out, /REFUSED — CI NOT FINISHED/, out);
    assert.match(out, new RegExp(`run for ${s.rules.first} is ${status} \\(https://github\\.com/`), out);
    assert.match(out, /has verified nothing yet/, out);
  }
  assert.equal(s.rules.releaseAt(), "");
});

test("a ci run that completed without success is refused by its conclusion", (t) => {
  const s = scene(t);
  for (const conclusion of ["failure", "cancelled", "timed_out", "startup_failure"]) {
    s.github.lists([ciRun(s.rules.first, { conclusion })]);
    const { code, out } = s.promote([s.rules.first]);
    assert.equal(code, EXIT.REFUSED, out);
    assert.match(out, /REFUSED — CI NOT GREEN/, out);
    assert.match(out, new RegExp(`completed with conclusion ${conclusion} \\(https://github\\.com/`), out);
  }
  assert.equal(s.rules.releaseAt(), "");
});

test("a green run of another workflow for the same sha does not count as ci", (t) => {
  // `head_sha=` returns EVERY workflow's runs for the commit. A green release-distance report, or a
  // docs-only job, verifies nothing about the tools six repositories run.
  const s = scene(t);
  s.github.lists([ciRun(s.rules.first, { name: "release-distance", path: ".github/workflows/release-distance.yml" })]);
  const { code, out } = s.promote([s.rules.first]);
  assert.equal(code, EXIT.REFUSED, out);
  assert.match(out, /REFUSED — NO CI RUN/, out);
});

test("a green ci run for a different sha does not vouch for this one", (t) => {
  // The filter is GitHub's; the check is ours. An answer that lists main's tip while the question was
  // about an older commit — a misrouted query, a lying double — must not read as evidence.
  const s = scene(t);
  s.github.lists([ciRun(s.rules.second)]);
  const { code, out } = s.promote([s.rules.first]);
  assert.equal(code, EXIT.REFUSED, out);
  assert.match(out, /REFUSED — NO CI RUN/, out);
});

test("two ci runs for one sha must both be green — a failed twin is not outvoted", (t) => {
  const s = scene(t);
  s.github.lists([ciRun(s.rules.first), ciRun(s.rules.first, { id: 4243, event: "workflow_dispatch", conclusion: "failure" })]);
  const { code, out } = s.promote([s.rules.first]);
  assert.equal(code, EXIT.REFUSED, out);
  assert.match(out, /REFUSED — CI NOT GREEN/, out);
  assert.match(out, /2 run\(s\) listed; every one must be completed and successful/, out);
});

// ── the push ──────────────────────────────────────────────────────────────────────────────────────

test("the happy path pushes exactly refs/heads/release at the promoted sha, and asks GitHub about exactly that sha", (t) => {
  const s = scene(t);
  s.github.lists([ciRun(s.rules.first)]);
  const before = s.rules.refs();
  const { code, out } = s.promote([s.rules.first]);
  assert.equal(code, EXIT.PROMOTED, out);
  assert.match(out, new RegExp(`PROMOTED — origin/release is ${s.rules.first}`), out);
  assert.equal(s.rules.releaseAt(), s.rules.first, "release is the promoted commit");
  assert.deepEqual(s.rules.refs(), [...before, RELEASE_REF].sort(), "one branch appeared and nothing else moved — no tag, no main, no topic");
  assert.equal(git(s.rules.work, "ls-remote", s.rules.url, "refs/heads/main").split(/\s+/)[0], s.rules.second, "main is untouched");
  assert.deepEqual(s.github.calls(), [runsQuery(s.rules.first)], "one question, about this sha, in this repository");
});

test("--dry-run pushes nothing, and says what it would have pushed", (t) => {
  const s = scene(t);
  s.github.lists([ciRun(s.rules.first)]);
  const { code, out } = s.promote([s.rules.first, "--dry-run"]);
  assert.equal(code, EXIT.PROMOTED, out);
  assert.match(out, new RegExp(`DRY RUN — would push ${s.rules.first}:refs/heads/release to origin: release does not exist yet`), out);
  assert.match(out, /Nothing pushed\./, out);
  assert.doesNotMatch(out, /PROMOTED/, out);
  assert.equal(s.rules.releaseAt(), "", "a dry run creates no ref");
  assert.deepEqual(s.github.calls(), [runsQuery(s.rules.first)], "the judgement still ran in full");
});

test("a dry run of a sha that would be refused reports the refusal, not a would-push", (t) => {
  // The flag suppresses the push, never the judgement — otherwise a dry run could only ever say yes.
  const s = scene(t);
  s.github.lists([ciRun(s.rules.first, { conclusion: "failure" })]);
  const { code, out } = s.promote([s.rules.first, "--dry-run"]);
  assert.equal(code, EXIT.REFUSED, out);
  assert.match(out, /REFUSED — CI NOT GREEN/, out);
  assert.doesNotMatch(out, /DRY RUN|would push/, out);
});

test("release advances forward from the old commit to the new one, and says by how much", (t) => {
  const s = scene(t);
  s.rules.release(s.rules.first);
  s.github.lists([ciRun(s.rules.second)]);
  const { code, out } = s.promote([s.rules.second]);
  assert.equal(code, EXIT.PROMOTED, out);
  assert.match(out, new RegExp(`release ${s.rules.first} → ${s.rules.second} \\(\\+1 commit\\(s\\)\\)`), out);
  assert.equal(s.rules.releaseAt(), s.rules.second);
});

test("release never moves backwards: an older sha is refused, and the refusal names the forward-release rollback", (t) => {
  // The commit is on main and its run is GREEN — everything but the direction is in order — so the
  // only thing that can refuse it is the rule that release moves forward.
  const s = scene(t);
  s.rules.release(s.rules.second);
  s.github.lists([ciRun(s.rules.first)]);
  const { code, out } = s.promote([s.rules.first]);
  assert.equal(code, EXIT.REFUSED, out);
  assert.match(out, /REFUSED — NOT A FORWARD MOVE/, out);
  assert.match(out, new RegExp(`release is ${s.rules.second}, and ${s.rules.first} is BEHIND it by 1 commit`), out);
  assert.match(out, /revert the content on main, merge, and promote the NEW commit/, out);
  assert.equal(s.rules.releaseAt(), s.rules.second, "release did not move");
  assert.deepEqual(s.github.calls(), [], "the direction is settled before GitHub is asked");
});

test("a commit beside release — neither reaches the other — is not a forward move either", (t) => {
  // release was hand-pushed to a commit that is not on main (the ruleset exists to prevent exactly
  // this; the tool must still cope). main's tip does not descend from it, so promoting main's tip
  // would be a sideways rewrite of the ref, and the tool has no way to do one.
  const s = scene(t);
  s.rules.release(s.rules.stray);
  s.github.lists([ciRun(s.rules.second)]);
  const { code, out } = s.promote([s.rules.second]);
  assert.equal(code, EXIT.REFUSED, out);
  assert.match(out, /REFUSED — NOT A FORWARD MOVE/, out);
  assert.match(out, /is beside it — neither reaches the other/, out);
  assert.equal(s.rules.releaseAt(), s.rules.stray);
});

test("promoting the commit release already points at moves nothing and exits 0, so the workflow can be re-run", (t) => {
  const s = scene(t);
  s.rules.release(s.rules.first);
  s.github.lists([ciRun(s.rules.first)]);
  const { code, out } = s.promote([s.rules.first]);
  assert.equal(code, EXIT.PROMOTED, out);
  assert.match(out, new RegExp(`release is already ${s.rules.first} — nothing to move`), out);
  assert.deepEqual(s.github.calls(), [runsQuery(s.rules.first)], "still verified — an idempotent re-run is not an unchecked one");
});

test("a sha release already points at is still refused when its ci run is not green", (t) => {
  // Nothing would move, and the tool still says no: it never exits 0 for a commit it could not
  // verify, because "already there" would otherwise launder a hand-pushed ref into a pass.
  const s = scene(t);
  s.rules.release(s.rules.first);
  s.github.lists([ciRun(s.rules.first, { conclusion: "failure" })]);
  const { code, out } = s.promote([s.rules.first]);
  assert.equal(code, EXIT.REFUSED, out);
  assert.match(out, /REFUSED — CI NOT GREEN/, out);
});

// ── evidence that could not be gathered is not evidence ───────────────────────────────────────────

test("an unreadable answer from GitHub is no answer, not an absence of runs", (t) => {
  const s = scene(t);
  s.github.answers({ stdout: "<html><body>rate limited</body></html>" });
  const { code, out } = s.promote([s.rules.first]);
  assert.equal(code, EXIT.UNDECIDED, out);
  assert.match(out, /UNDECIDED — UNREADABLE ANSWER/, out);
  assert.match(out, /the answer is not JSON: <html>/, out);
  assert.doesNotMatch(out, /NO CI RUN/, "garbage must not be read as an empty listing");
  assert.equal(s.rules.releaseAt(), "");
});

test("gh failing is a refusal to decide, and the refusal carries gh's own words", (t) => {
  const s = scene(t);
  s.github.answers({ exitCode: 1, stderr: "gh: Bad credentials (HTTP 401)\n" });
  const { code, out } = s.promote([s.rules.first]);
  assert.equal(code, EXIT.UNDECIDED, out);
  assert.match(out, /UNDECIDED — GITHUB NOT ASKED/, out);
  assert.match(out, /Bad credentials \(HTTP 401\)/, out);
  assert.match(out, /no evidence is a refusal/, out);
  assert.equal(s.rules.releaseAt(), "");
});

test("a shallow checkout cannot judge ancestry, and says so instead of guessing", (t) => {
  // A local-path clone silently ignores --depth ("--depth is ignored in local clones"), so the remote
  // is re-addressed as file:// — the same trap the plan's G1 measurement walked into.
  const s = scene(t);
  const fileUrl = s.rules.url.startsWith("/") ? `file://${s.rules.url}` : `file:///${s.rules.url}`;
  const shallow = checkout(s.root, fileUrl, "--depth", "1");
  assert.equal(git(shallow, "rev-parse", "--is-shallow-repository"), "true", "the fixture must actually be shallow");
  s.github.lists([ciRun(s.rules.second)]);
  const { code, out } = run(shallow, [s.rules.second], s.env);
  assert.equal(code, EXIT.UNDECIDED, out);
  assert.match(out, /UNDECIDED — SHALLOW CHECKOUT/, out);
  assert.match(out, /fetch-depth: 0/, out);
  assert.equal(s.rules.releaseAt(), "");
});

test("when it cannot tell which GitHub repository to ask, it stops rather than asking the wrong one", (t) => {
  // origin here is a local path, not github.com, and GITHUB_REPOSITORY is removed — including the one
  // the runner itself carries when this suite runs under Actions.
  const s = scene(t);
  const env = { ...s.env };
  delete env.GITHUB_REPOSITORY;
  s.github.lists([ciRun(s.rules.first)]);
  const { code, out } = run(s.runner, [s.rules.first], env);
  assert.equal(code, EXIT.UNDECIDED, out);
  assert.match(out, /UNDECIDED — WHICH REPOSITORY/, out);
  assert.match(out, /set GITHUB_REPOSITORY=owner\/name/, out);
  assert.deepEqual(s.github.calls(), []);
});

// ── the parsers, as units ─────────────────────────────────────────────────────────────────────────

test("repositorySlug refuses when GITHUB_REPOSITORY names a repository origin does not", () => {
  // The variable decides WHOSE ci runs vouch for the sha; the push always goes to origin. Letting
  // them disagree lets a fork's or mirror's green run authorise a ref on this remote — so a mismatch
  // is not resolved in either direction, it returns nothing and the caller's WHICH REPOSITORY branch
  // stops the run.
  const origin = (url) => (...args) => {
    assert.deepEqual(args, ["remote", "get-url", "origin"]);
    return url;
  };
  assert.equal(repositorySlug({ GITHUB_REPOSITORY: "acme/rules" }, origin("https://github.com/acme/rules.git")), "acme/rules",
    "agreeing is the only way through");
  assert.equal(repositorySlug({ GITHUB_REPOSITORY: "ACME/Rules" }, origin("https://github.com/acme/rules.git")), "ACME/Rules",
    "GitHub owners and names are case-insensitive");
  assert.equal(repositorySlug({ GITHUB_REPOSITORY: "attacker/fork" }, origin("https://github.com/acme/rules.git")), "",
    "a fork's runs may not vouch for a sha pushed to this origin");

  assert.equal(repositorySlug({}, origin("https://github.com/acme/rules.git")), "acme/rules");
  assert.equal(repositorySlug({}, origin("https://github.com/acme/rules")), "acme/rules");
  assert.equal(repositorySlug({}, origin("git@github.com:acme/rules.git")), "acme/rules");
  assert.equal(repositorySlug({}, origin("ssh://git@github.com/acme/rules.git")), "acme/rules");
  assert.equal(repositorySlug({}, origin("D:/rsd/conventions.git")), "", "a local path names no GitHub repository");

  // Origin unparseable as GitHub — a local bare remote, as every test here uses — leaves the variable
  // as the only statement about which repository this is, and nothing to contradict it.
  assert.equal(repositorySlug({ GITHUB_REPOSITORY: "acme/rules" }, origin("D:/rsd/conventions.git")), "acme/rules");
  assert.equal(repositorySlug({ GITHUB_REPOSITORY: "not a slug" }, origin("D:/rsd/conventions.git")), "");
  assert.equal(repositorySlug({}, () => { throw new Error("fatal: No such remote 'origin'"); }), "");
});

test("ciRunsFor keeps only ci runs for the sha, and names why an answer could not be read", () => {
  const sha = "a".repeat(40);
  assert.deepEqual(ciRunsFor("", sha), { error: "the answer is not JSON" });
  assert.deepEqual(ciRunsFor('{"message":"Not Found"}', sha), { error: "the answer carries no workflow_runs list" });
  const listing = JSON.stringify({ total_count: 3, workflow_runs: [
    ciRun(sha),
    ciRun(sha, { name: "other", path: ".github/workflows/other.yml" }),
    ciRun("b".repeat(40)),
    ciRun(sha.toUpperCase(), { name: "renamed", path: ".github/workflows/ci.yml", id: 7 }),
  ] });
  const { runs } = ciRunsFor(listing, sha);
  assert.deepEqual(runs.map((r) => r.id), [4242, 7], "matched by name OR by path; the sha is compared case-insensitively");
});

test("judgeRuns passes only when every run is completed and successful", () => {
  const sha = "a".repeat(40);
  assert.equal(judgeRuns([], sha, SLUG).headline, "NO CI RUN");
  assert.equal(judgeRuns([ciRun(sha, { status: "in_progress", conclusion: null })], sha, SLUG).headline, "CI NOT FINISHED");
  assert.equal(judgeRuns([ciRun(sha), ciRun(sha, { status: "queued" })], sha, SLUG).headline, "CI NOT FINISHED");
  assert.equal(judgeRuns([ciRun(sha), ciRun(sha, { conclusion: "skipped" })], sha, SLUG).headline, "CI NOT GREEN");
  const pass = judgeRuns([ciRun(sha), ciRun(sha, { id: 1, html_url: undefined })], sha, SLUG);
  assert.equal(pass.ok, true);
  assert.deepEqual(pass.urls, ["https://github.com/example/conventions/actions/runs/4242", "run 1"]);
  for (const refusal of [judgeRuns([], sha, SLUG), judgeRuns([ciRun(sha, { conclusion: "failure" })], sha, SLUG)]) {
    assert.equal(refusal.ok, false);
    assert.equal(refusal.code, EXIT.REFUSED);
    assert.ok(refusal.lines.some((l) => l.startsWith("fix:")), "every refusal carries a cure");
  }
});

test("importing the module moves nothing and sets no exit code", () => {
  // The entry guard: `node --test` loaded this file, which imported the tool. Had the tool run its
  // main on import it would have printed usage and left EXIT.USAGE in process.exitCode.
  assert.ok(process.exitCode === undefined || process.exitCode === 0, `process.exitCode is ${process.exitCode}`);
});

// ── what the code round of 2026-09-14 added ──────────────────────────────────────────────────────

test("an answer that lists fewer runs than it counts is UNDECIDED, never a clean sha", () => {
  // One page is asked for. If GitHub says there are more runs than it returned, the ones it did not
  // return could include the failed twin this gate refuses on — and a page of successes would read
  // as clean. An answer that might be missing the disqualifying run is no answer.
  const sha = "a".repeat(40);
  const truncated = JSON.stringify({ total_count: 140, workflow_runs: [ciRun(sha)] });
  assert.deepEqual(ciRunsFor(truncated, sha),
    { error: "GitHub lists 140 run(s) for this sha but returned 1; a later page could hold a failed run" });

  const exact = JSON.stringify({ total_count: 1, workflow_runs: [ciRun(sha)] });
  assert.equal(ciRunsFor(exact, sha).error, undefined, "a complete page is readable");
  assert.equal(ciRunsFor(exact, sha).runs.length, 1);
});

test("a truncated listing refuses the promotion rather than passing it", (t) => {
  const s = scene(t);
  s.github.answers({ stdout: JSON.stringify({ total_count: 200, workflow_runs: [ciRun(s.rules.second)] }) });
  const { code, out } = s.promote([s.rules.second]);
  assert.equal(code, EXIT.UNDECIDED, out);
  assert.match(out, /UNDECIDED — UNREADABLE ANSWER/, out);
  assert.match(out, /a later page could hold a failed run/, out);
  assert.equal(s.rules.releaseAt(), "", "nothing was pushed");
});

test("a refused push says where release actually is, instead of only that nothing moved", (t) => {
  // The new read-back in the catch path. Its real purpose is the race where the remote ACCEPTED the
  // update and the connection dropped before the answer arrived \u— reporting that as "nothing was
  // pushed" sends an operator to repair a state that is already correct. That race cannot be staged
  // deterministically against a local bare remote (see research/module_tests.md), so what is asserted
  // here is the half that can be: after a push the remote genuinely refuses, the tool asks where
  // release is and says so, rather than leaving the reader to guess.
  const s = scene(t);
  s.github.lists([ciRun(s.rules.second)]);
  s.rules.release(s.rules.first);             // release exists, one commit behind \u— a forward move
  const hook = path.join(s.rules.url, "hooks", "pre-receive");
  fs.writeFileSync(hook, ["#!/bin/sh", "exit 1", ""].join("\n"));
  fs.chmodSync(hook, 0o755);

  const { code, out } = s.promote([s.rules.second]);
  assert.equal(code, EXIT.UNDECIDED, out);
  assert.match(out, /PUSH REFUSED/, out);
  assert.match(out, new RegExp(`release is still ${s.rules.first}`), out);
  assert.equal(s.rules.releaseAt(), s.rules.first, "the ref really did not move");
});
