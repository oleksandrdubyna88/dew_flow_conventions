#!/usr/bin/env node
/**
 * The three rule texts of the merged core — `common/test-leftovers.md` (the core, a self-contained summary that must reach
 * a reviewer on its own), `common/test-leftovers-detail.md` (the full statement, the former text moved whole) and the
 * janitor companion — S1 of the merged-core plan and the split of 2026-11-01: what each text is made of, that a read of it
 * stays under the per-read cap, that the core stays under its own cap, that the split lost no line, and that no line of
 * any of them is a sweeper that cannot tell one user's leftovers from another's.
 *
 * The cap is proven on an INFLATED COPY in a scratch root, never by swapping the real file in place (the real file is
 * shared with every test running beside this one).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { gitWith } from "./lib/git.mjs";
import { ownedDir } from "./lib/owned.mjs";
import { run } from "./lib/rule-cli.mjs";
import { bodyOf } from "./lib/rule-body.mjs";
import { GUARD_MS } from "./lib/startup-ceilings.mjs";
import { broadLines } from "./lib/sweeper-scan.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(here, "..");
const RULE = "common/test-leftovers.md";
const DETAIL = "common/test-leftovers-detail.md";
const COMPANION = "common/test-leftovers-janitor.md";
/** The `raw-temp` baseline's full definition (N1 of `todo/PLAN_raw_temp_baseline.md`): a companion, so the detail keeps headroom under the per-read cap. */
const BASELINE = "common/test-leftovers-baseline.md";
/**
 * The rule as it was before the split (`git show 7852de2:common/test-leftovers.md`), committed so the test needs no history. It PINS
 * the detail to that text: a later edit of the rule text updates the detail AND this fixture in one commit (with the record in
 * `research/rule-bodies.json`), so the no-loss test keeps proving the split and never holds the current wording against stale text.
 */
const BASE = "tools/fixtures/test-leftovers-base-7852de2.md";
const CAP = 32768;
/** The core must reach a reviewer whose prompt packs each rule file on its own under a ~10,000-unit free tail (owner decision 2026-11-01). */
const CORE_CAP = 9000;
const BEGIN = "<!-- core:begin -->\n";
const END = "<!-- core:end -->";
const gitGuarded = gitWith({ timeoutMs: GUARD_MS });

const read = (file) => fs.readFileSync(path.join(sourceRoot, file), "utf8").replaceAll("\r\n", "\n");

/** The text between each `<!-- core:begin -->\n` and the next `<!-- core:end -->` — the definition the private sibling extracts with. */
function spansOf(text) {
  const spans = [];
  for (let from = 0; ;) {
    const begin = text.indexOf(BEGIN, from);
    if (begin < 0) return spans;
    const end = text.indexOf(END, begin + BEGIN.length);
    assert.ok(end > begin, "a core span opened and never closed");
    spans.push(text.slice(begin + BEGIN.length, end));
    from = end + END.length;
  }
}

test("S1 1 the core has one core span, the detail two and the companion one, each non-empty", () => {
  const rule = spansOf(read(RULE));
  const detail = spansOf(read(DETAIL));
  assert.equal(rule.length, 1, "common/test-leftovers.md carries one span");
  assert.equal(detail.length, 2, "common/test-leftovers-detail.md carries two spans, the `## Tokens` table between them");
  assert.equal(spansOf(read(COMPANION)).length, 1, "the companion carries one span");
  assert.equal(spansOf(read(BASELINE)).length, 1, "the baseline companion carries one span");
  for (const span of [...rule, ...detail, ...spansOf(read(COMPANION)), ...spansOf(read(BASELINE))]) assert.ok(span.trim().length > 1000, "a span is the text, not a marker");
});

test("S1 2 a read of the detail refuses above the cap, proven on an inflated copy in a scratch root", (t) => {
  for (const file of [RULE, DETAIL, COMPANION, BASELINE]) assert.ok(Buffer.byteLength(bodyOf(read(file))) <= CAP, `${file}: the real body is under the per-read cap`);
  const root = ownedDir(t, "rule cap copy");
  for (const name of ["common", "csharp", "rust", "typescript", "AGENTS.md", "CLAUDE.md", "ENTRY.md", ".agents", "README.md", "research"]) {
    fs.cpSync(path.join(sourceRoot, name), path.join(root, name), { recursive: true });
  }
  gitGuarded(root, "init", "-q");
  gitGuarded(root, "-c", "user.name=Rule test", "-c", "user.email=rules@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-qm", "fixture");
  const invoke = (args) => run([...args, "--repo", root], root);
  assert.match(invoke(["read", "--task", "implement", "--only", "common.test-leftovers-detail"]), /END RULE common\.test-leftovers-detail/, "the unchanged copy reads");
  fs.appendFileSync(path.join(root, DETAIL), `\n${"A line that only makes the rule longer.\n".repeat(80)}`); // 3 200 B
  assert.throws(() => invoke(["read", "--task", "implement", "--only", "common.test-leftovers-detail"]), /exceeds 32 KiB per read/);
});

test("S1 3 no line of any of the three files is an owner-blind sweep pattern", () => {
  for (const file of [RULE, DETAIL, COMPANION, BASELINE]) assert.deepEqual(broadLines(read(file)), [], `${file} holds a sweep that names no owner`);
});

test("S1 4 the core names the detail and the companion; the detail and the companion name the core", () => {
  const rule = spansOf(read(RULE)).join("\n");
  const detail = bodyOf(read(DETAIL));
  const companion = spansOf(read(COMPANION)).join("\n");
  assert.ok(rule.includes("`" + DETAIL + "`"), "the core's header points at the detail by path");
  assert.ok(rule.includes("`" + COMPANION + "`"), "the core's janitor section points at the companion by path");
  assert.ok(detail.includes("`" + RULE + "`"), "the detail's header points back at the core");
  assert.ok(companion.includes("`" + RULE + "`"), "the companion points back at the core");
  assert.doesNotMatch(rule + spansOf(read(DETAIL)).join("\n") + companion, /\]\([^)]+\)/, "no markdown link inside a span");
  const pointers = rule.match(/^Detail: .*$/gm) ?? [];
  assert.equal(pointers.length, (rule.match(/^## /gm) ?? []).length, "every section of the core ends with a pointer to the same section of the detail");
  const headings = detail.split("\n").filter((line) => line.startsWith("## "));
  for (const pointer of pointers) {
    const target = /^Detail: § ?(.+)\.$/.exec(pointer);
    assert.ok(target !== null, `${pointer}: a pointer is \`Detail: §N.\` or \`Detail: § <name>.\``);
    const wanted = /^\d+$/.test(target[1]) ? `## ${target[1]}. ` : `## ${target[1]}`;
    assert.ok(headings.some((heading) => heading.startsWith(wanted)), `${pointer}: the detail has no heading \`${wanted}\``);
  }
});

/**
 * What the core must carry so that a reviewer with the core ALONE refuses what the detail refuses — a judge of the split found
 * the first core allowing deletions the detail forbids (2026-11-01). One phrase per obligation, under the section that owns it.
 */
const MUST_CARRY = {
  "## 1. ": ["testsToDelete-<owner>-<repo>-<what>-<id>", "u<uid>", "w<digits>", "^[uw][0-9]{1,10}$", "## Tokens", "legacy name", "never by age"],
  "## 2. ": ["claim first", "never at module load", "create exclusively", "never adopted", "redraw", "exact full name", "TMPDIR", "TEMP", "TMP"],
  "## 3. ": ["<owner>:<host>@<os>:<pid>[:<start>[:<ns>]]", "OUTSIDE the resource", "TESTSTODELETE_RUN", "kernel authorises", "REAL uid", "mismatch is `unknown`", "lock-owned", "unmarked", "pid namespace", "<ns>", "the only `gone`", "hidepid", "2 seconds", "never signals", "Uncertainty preserves"],
  "## 4. ": ["two keys", "git worktree list", "`gone`", "10 minutes", "by identity", "teststodelete-quarantine", "never renamed", "holds anything", "never fails the run"],
  "## 5. ": ["--rm", "reaper", "carve-out", "every path", "docker rm -f -v"],
  "## 6. ": ["teststodelete_<owner>_<repo>_<what>_<id>", "shared-store", "lock:", "wider than", "container-scoped", "reuse"],
  "## 7. ": ["scan of nothing", "raw-temp", "RUNNER_TEMP", "raw-worktree", "docker-run", "docker-name", "COMPOSE_PROJECT_NAME", "legacy-name", "owner-blind", "shared-store", "ryuk-off", "testsToDelete-exempt: <class> — <reason>", "placeholder", "take none", "`exemption`", "`raw-temp` baseline"],
  "## The janitor": ["tools/janitor.sh", "two keys of §4", "common/test-leftovers-janitor.md"],
  "## The barrier": ["no producer emits the owner form", "age-based", "concurrent", "two stages", "rollback"],
  "## Never": ["Never widen", "name alone", "age", "can be empty", "shared prefix", "fail the run", "--rm", "owner inside", "owner-blind"],
  "## Definition of Done": ["Detail: § Definition of Done."],
};

test("S1 9 the core carries, under each section, every phrase a reviewer needs to refuse what the detail refuses", () => {
  const text = spansOf(read(RULE)).join("\n");
  const sections = text.split(/^(?=## )/m);
  const missing = [];
  for (const [heading, phrases] of Object.entries(MUST_CARRY)) {
    const section = sections.find((part) => part.startsWith(heading));
    if (section === undefined) { missing.push(`${heading}: no such section`); continue; }
    for (const phrase of phrases) if (!section.includes(phrase)) missing.push(`${heading.trim()}: "${phrase}"`);
  }
  assert.deepEqual(missing, [], `${missing.length} phrase(s) the core must carry are missing`);
});

/** What the baseline companion must carry: the one class, the proof marker, the multiset key, the ratchet, the file format. */
const BASELINE_PHRASES = ["The `raw-temp` baseline", "testsToDelete-baseline-proof: <scope root>", "**multiset**", "sha256 of the trimmed line", "only when told to", "`baseline`", "**only shrinks**", "any creation but the first", "nothing regenerates it", "\"class\": \"raw-temp\"", "No `count` field", "--baseline-shrinks", "`raw-temp-baseline.json` at the repository root", "never a symlink", "a test file the guard discovered", "keeps the proof of the base scope", "only in the creation PR's own run", "never in the standing"];

test("S1 10 the baseline companion carries the full `raw-temp` baseline definition, once, and the detail's §7 points to it in one short paragraph, after the exemption grammar", () => {
  const text = read(BASELINE).replace(/\s+/g, " ");
  const missing = BASELINE_PHRASES.filter((phrase) => !text.includes(phrase));
  assert.deepEqual(missing, [], "the baseline companion is missing phrases");
  assert.equal(text.split("**The `raw-temp` baseline").length - 1, 1, "the definition is there once");
  assert.ok(text.includes("`" + RULE + "`") && text.includes("`" + DETAIL + "`"), "it names the core and the detail by path");
  const detail = read(DETAIL);
  const start = detail.indexOf("## 7. ");
  const section = detail.slice(start, detail.indexOf("## The janitor", start));
  const pointer = section.replace(/\s+/g, " ");
  assert.ok(pointer.includes("`" + BASELINE + "`"), "§7 points at the companion by path");
  assert.equal(pointer.split("**The `raw-temp` baseline").length - 1, 1, "§7 has the one pointer paragraph");
  assert.ok(section.indexOf("The exemption grammar") < section.indexOf("**The `raw-temp` baseline"), "it follows the exemption grammar");
  assert.ok(!pointer.includes("**multiset**"), "the definition is not copied into the detail");
  assert.ok(Buffer.byteLength(bodyOf(detail)) <= CAP - 800, "the detail keeps at least 800 B of headroom under the per-read cap");
});

test("S1 5 every example name carries an owner of the grammar; the old form appears only as the legacy name's own description", () => {
  const text = [...spansOf(read(RULE)), ...spansOf(read(DETAIL)), ...spansOf(read(COMPANION)), ...spansOf(read(BASELINE))].join("\n");
  const found = [...text.matchAll(/(teststodelete)[-_](<[a-z]+>|[A-Za-z0-9]+)/gi)].filter((match) => match[1] !== "TESTSTODELETE"); // the upper-case spelling is an environment variable, not a name
  assert.ok(found.length > 5, "the texts do carry examples");
  for (const { 2: segment, index } of found) {
    const legacySentence = segment === "<repo>" && text.slice(Math.max(0, index - 400), index).includes("legacy name");
    assert.ok(legacySentence || /^(?:<owner>|[uw][0-9]{1,10}|exempt|quarantine|baseline)$/.test(segment), "`" + segment + "` follows the prefix and is no owner");
  }
  assert.equal(found.filter((match) => match[2] === "<repo>").length, 1, "the old form is spelled once, where the legacy name is defined");
});

/** Every non-heading, non-blank line of a rule's body (frontmatter removed — the ids differ by design), with how often it occurs. */
function occurrences(text) {
  const counts = new Map();
  for (const line of bodyOf(text).split("\n")) {
    if (line.trim() === "" || /^#{1,6} /.test(line)) continue;
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }
  return counts;
}

test("S1 7 nothing lost: every non-heading, non-blank line of the rule at 7852de2 is in the detail file, at least as often", () => {
  const base = occurrences(read(BASE));
  assert.ok(base.size > 200, "the base fixture is the whole rule, not a stub");
  assert.ok(fs.existsSync(path.join(sourceRoot, DETAIL)), `${DETAIL} does not exist`);
  const detail = occurrences(read(DETAIL));
  const lost = [...base].filter(([line, count]) => (detail.get(line) ?? 0) < count).map(([line, count]) => `${count} x ${line.slice(0, 90)}`);
  assert.deepEqual(lost, [], `${lost.length} line(s) of the base text are missing from ${DETAIL}`);
});

test("S1 8 the core is self-contained under its own cap", () => {
  const bytes = Buffer.byteLength(read(RULE));
  assert.ok(bytes <= CORE_CAP, `${RULE} is ${bytes} B, over its cap of ${CORE_CAP} B`);
});

test("S1 6 the companion is its own rule with a conditional load and three tasks; the detail shares the core's load and tasks and the core depends on it", () => {
  const head = (file) => read(file).split("\n---\n")[0];
  assert.match(head(COMPANION), /^---\nid: "common\.test-leftovers-janitor"\nload: "conditional"\ntasks: \["audit","policy","release"\]$/);
  assert.equal(head(BASELINE), '---\nid: "common.test-leftovers-baseline"\nload: "conditional"\ntasks: ["test","audit","policy","release","pr"]', "the baseline companion is selected for the tasks that write, review or ship a baseline");
  const TASKS = '["implement","test","audit","policy","release"]';
  assert.equal(head(RULE), `---\nid: "common.test-leftovers"\nload: "conditional"\ntasks: ${TASKS}\ndepends: ["common.test-leftovers-detail"]`);
  assert.equal(head(DETAIL), `---\nid: "common.test-leftovers-detail"\nload: "conditional"\ntasks: ${TASKS}`);
});
