// plan-ledger.mjs — what a plan's change ledger IS, and what the lifecycle check says about one.
//
// What it reads. The `## Plan changes` section of a plan in `todo/`, in the format of
// `todo/PLAN_plan_change_control.md` § 2 (the rule that gives it meaning is `common/plan-change-control.md`): epoch
// lines, entries, and the re-review records that separate one epoch from the next. `ledgerFindings` takes the file's
// text, its status paragraph and the name of its parent plan (or `null`), and returns the findings as plain strings.
// Nothing here reads the file system, the clock or the environment, and nothing throws on any text — the caller wraps
// each plan in a `try` anyway, because a crash here would turn every consumer's CI red with a stack, and a throw that
// reaches the caller is a defect of this file.
//
// What the check cannot see. It reads the ledger as it stands in the checkout — never git history, never the diff. It
// cannot see: a plan with no `## Plan changes` heading (opt-in by presence — a plan that never opened its ledger is
// invisible here; the rule's Definition of Done and the code review own it); a change nobody recorded (every entry is a
// line in a reviewed diff, and an unrecorded change leaves no line); code written during a stop (a stopped plan is
// CLEAN by design — plan round 1, finding 0, rejected — because a red while stopped would block the stop commit, the
// re-review and its reverts; the halt is the rule's, `common/plan-change-control.md`, and the review server's when it
// refuses `review_code` until the new `proceed`); an entry dated before its epoch, or entries dated out of order (the
// check judges structure and count, not when); where the section stands in the file (the rule says under the status
// block; the check reads it anywhere); an indented line behind TWO list markers (`  - - 1.2 · …`, `  1. - 1.2 · …`),
// which a renderer shows as a visibly nested bullet that takes deliberate nesting to write — reserving it would widen
// the parent's § 2, a contract change, so it is a known limit (code round 3, 2026-10-29); a setext heading (`Plan
// changes` over `---` or `===`), which a reader may take for the ledger's but which the parent's § 2 does not name —
// the ATX `## Plan changes` is the one heading — and which no plan of the estate writes: a second known limit, not
// worth a second grammar (code round 4). What it does see is exactly the grammar below, and every line it cannot read
// is a red, never a skip: an entry that fails to parse would otherwise lower the count in silence.
//
// The grammar, in one place. Text is folded (CRLF = LF) and a lone CR becomes a line ending too, as CommonMark reads it
// (here and not in the shared `folded`, which feeds the hashed rule bodies), then stripped of fenced blocks through
// `outsideFencedBlocks` (the one fence definition; a fenced line becomes an empty line, so a finding can say "line
// 90"). The ledger's heading is exactly `## Plan changes`; what a reader would take for it — another case or level, one
// to three leading spaces, closing hashes — is a finding, never an invisible ledger (four spaces are a code block: no
// heading, no ledger; a format character inside the heading is ignored, as a reader ignores it). Every pattern runs on
// a line after `trimEnd()` and with each run of spaces or tabs folded to ONE space, except the tests that read the
// original: the near-miss heading and the two on an indented line. A line that starts with a space or a tab is free
// text — EXCEPT one that, with its indent stripped and its format characters removed (a renderer prints nothing for
// them), starts like a ledger line: an entry (`- 1.2`, `* 1.2`, `1. 1.2`, a bare `1.2`), an epoch line (`>`) or a
// heading (`#`), whatever follows. A renderer shows such a line as a list item, a quote or a heading, which a reader
// counts, so it is a finding — `RESERVED_PREFIX`, parent § 2 — and is never parsed, never counted. Free text therefore
// may not begin with an entry-shaped number, `>` or `#`. Fields are separated by " · " (U+00B7) and the cause follows "
// — " (U+2014); `|`, `--`, `-` and the en dash are refused by a message that names the expected character, because a
// second spelling of the format would be a second grammar to keep in step forever. Keywords and values are
// case-sensitive. A pipe behind one or more backslashes is cell text, not a boundary (the cell keeps the run minus one
// backslash). Every value a message quotes goes through `clean`: control and format characters become a space and a
// long one is cut.
//
// Dependency-free on purpose: `plan-lifecycle.mjs` runs in every consumer's CI from the mounted rules, before any
// `npm ci`, so this file imports from `./rule-body.mjs` and from nothing else.

import { folded, outsideFencedBlocks } from "./rule-body.mjs";

/** The lists ARE the contract: plans in six repositories carry entries spelled from them, so changing one is a
 *  migration of every recorded plan. Tests iterate these and pin them to the parent plan's § 2 once, on purpose. */
export const SOURCES = Object.freeze(["owner", "agent", "reviewer"]);
export const KINDS = Object.freeze(["scope", "goals", "dod", "merge-conditions", "epics", "stories", "build-order", "contract", "approach"]);
export const STATES = Object.freeze(["open", "stopped", "closed"]);
export const APPROVERS = Object.freeze(["reviewers", "owner"]);
export const VERDICTS = Object.freeze(["fits", "cut", "—"]);

/** The stop must be visible in the status paragraph. `plan-lifecycle.mjs` imports this too, so the ledger check and
 *  the `misfiled` check read ONE phrase: a stopped plan may say what is done without being called finished. */
export const STOP_PHRASE = /\bstopped for re-review\b/i;

/** An indented line that starts like a ledger line (parent § 2, entries 1.2 and 2.1): an entry — whose marker may be a
 *  bullet or an ordered-list marker of at most nine digits, CommonMark's limit —, an epoch line (`>`) or a heading
 *  (`#`). One regex, three shapes, tested on the line with its indent stripped. */
export const RESERVED_PREFIX = /^(?:[>#]|(?:(?:[-*+]|\d{1,9}[.)])\s+)?[1-9]\d*\.[1-9]\d*(?=\s|$))/;

const HEADING = /^## Plan changes$/;
/** What a reader takes for the ledger's heading and the exact one is not: another case, level or spacing, one to three
 *  leading spaces, closing hashes, a format character inside. Tested on the original line with its format characters
 *  removed and then `trimEnd()`-ed — `fold` would shrink four leading
 *  spaces to one and make a code block a heading — so the space between the words is `\s+`: the exact heading runs on
 *  the folded line and takes any spacing, and the near miss must never be stricter than the exact test. Wider than CommonMark on purpose: a near miss costs one loud finding
 *  with the fix in it, a miss costs the whole ledger. */
const NEAR_HEADING = /^ {0,3}#{1,6}\s*plan\s+changes(?:\s+#+)?\s*$/i;
const SECTION_END = /^#{1,2} /;
const EPOCH_LINE = new RegExp(
  `^> Epoch ([1-9]\\d*) · approved (\\d{4}-\\d{2}-\\d{2}) · by (${APPROVERS.join("|")}) · state: (${STATES.join("|")})$`,
);
const RECORD_HEADING = /^### Re-review for epoch ([1-9]\d*)$/;
const NARROWED_LINE = /^Narrowed: (yes|no)(?: — .*)?$/;
const LIST_LINE = /^(?:[-*+]|\d+[.)]) /;
const ENTRY_NUMBER = /^([1-9]\d*)\.([1-9]\d*)$/;
const TABLE_HEADER = ["Work", "Where", "Verdict", "Action"];
const TABLE_SEPARATOR = /^:?-+:?$/;
/** What a terminal or a reader acts on or cannot see, and a quoted value must not carry: ASCII and C1 controls, DEL, and
 *  every format character (category `Cf`: directional marks and isolates, zero-width characters, the soft hyphen, the
 *  byte-order mark …). One definition — the indent and the heading test below use the same category. */
const CONTROL = /[\u0000-\u001f\u007f-\u009f\p{Cf}]/gu;
/** The indent of a free-text line and what a renderer prints nothing for beside it: space, tab, NBSP and every format
 *  character (category `Cf` — zero-width spaces and joiners, directional marks and isolates, the soft hyphen, the byte-
 *  order mark …), so no enumeration can fall behind. `trim()` is NOT this set (it keeps U+200B). */
const INDENT = /^[ \t\u00a0\p{Cf}]+/u;
/** A format character prints nothing; the tests that ask what a line READS as remove them first. */
const FORMAT = /\p{Cf}/gu;
export const QUOTE_LIMIT = 160;

const FIELD_SEPARATOR = '" · " (U+00B7)';
const CAUSE_SEPARATOR = '" — " (U+2014)';

/** A line the way every pattern reads it: trailing whitespace gone, each run of spaces or tabs one space. */
const fold = (line) => line.trimEnd().replace(/[ \t]+/g, " ");

/** A value as a message shows it: control characters (an escape sequence included) made a space, and a long one cut
 *  with `…`. The ONE cleaning function: a quoted line and every quoted field value go through it, and so does a
 *  message the caller catches. */
export function clean(value) {
  const text = String(value).replace(CONTROL, " ");
  return text.length > QUOTE_LIMIT ? `${text.slice(0, QUOTE_LIMIT)}…` : text;
}

/** A line as a message quotes it: the original, indent kept, trailing whitespace gone, cleaned. */
const quote = (raw) => `"${clean(raw.trimEnd())}"`;

/** `s` must be a real calendar date: the shape first, then a round trip (`2026-02-30` and `2026-13-01` are not). */
function isCalendarDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  // `new Date("2026-13-01T00:00:00Z")` is an Invalid Date, which is an object and never `NaN`: ask its time.
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

const oneOf = (list) => list.join(", ");
const verdictList = `${VERDICTS.slice(0, -1).join(", ")} or ${VERDICTS.at(-1)}`;

/**
 * `PLAN_<topic>_E<n>.md` and `PLAN_<topic>_E<n>_<more>.md` are stories documents of `PLAN_<topic>.md`.
 *
 * A topic may itself hold `_E<n>` (`PLAN_a_E1_b_E2.md`), so a single non-greedy pattern can cut the wrong one. The
 * candidates are every split at a `_E<digits>` followed by `_` or `.md`, tried from the RIGHT (the longest topic
 * first); the first that `exists` wins, and when none does the rightmost stands, so a caller with no folder to look
 * in still gets a name. `null` when the name is nobody's stories document.
 */
export function parentPlanOf(name, exists = () => false) {
  const candidates = [];
  for (const split of name.matchAll(/_E\d+(?=_|\.md$)/g)) {
    const topic = name.slice(0, split.index);
    if (/^PLAN_./.test(topic)) candidates.unshift(`${topic}.md`);
  }
  return candidates.find((candidate) => exists(candidate)) ?? candidates[0] ?? null;
}

/** One entry line → `{ entry }` or `{ detail }` saying which field is wrong, so the message corrects the writer. */
function parseEntry(raw) {
  const line = fold(raw);
  if (!line.startsWith("- ")) return { detail: 'entries start with "- "' };

  const rest = line.slice(2);
  const split = rest.indexOf(" — ");
  const head = split === -1 ? rest : rest.slice(0, split);
  const fields = head.split(" · ");
  if (fields.length !== 4) {
    return {
      detail: `expected 4 fields separated by ${FIELD_SEPARATOR} before ${CAUSE_SEPARATOR}: ` +
        `<k>.<n> · <YYYY-MM-DD> · ${SOURCES.join("|")} · <kinds>; found ${fields.length}`,
    };
  }
  if (split === -1) return { detail: `no cause: the cause follows ${CAUSE_SEPARATOR}` };

  const [number, date, source, kinds] = fields;
  const id = ENTRY_NUMBER.exec(number);
  if (id === null || !Number.isSafeInteger(Number(id[1])) || !Number.isSafeInteger(Number(id[2]))) {
    return { detail: `number "${clean(number)}" is not <k>.<n>` };
  }
  if (!isCalendarDate(date)) return { detail: `date "${clean(date)}" is not a calendar date YYYY-MM-DD` };
  if (!SOURCES.includes(source)) return { detail: `unknown source "${clean(source)}" (${oneOf(SOURCES)})` };
  for (const kind of kinds.split(/\s*,\s*/)) {
    if (!KINDS.includes(kind)) return { detail: `unknown kind "${clean(kind)}" (${oneOf(KINDS)})` };
  }
  return { entry: { k: Number(id[1]), n: Number(id[2]), id: number, line: raw } };
}

/** One epoch line → `{ epoch }` or `{ detail }`. */
function parseEpoch(raw) {
  const found = EPOCH_LINE.exec(fold(raw));
  if (found === null) {
    return {
      detail: `expected "> Epoch <k> · approved <YYYY-MM-DD> · by ${APPROVERS.join("|")} · state: ${STATES.join("|")}"; ` +
        `fields are separated by ${FIELD_SEPARATOR}`,
    };
  }
  const [, k, date, approver, state] = found;
  if (!Number.isSafeInteger(Number(k))) return { detail: `epoch number "${clean(k)}" is too large` };
  if (!isCalendarDate(date)) return { detail: `date "${clean(date)}" is not a calendar date YYYY-MM-DD` };
  return { epoch: { k: Number(k), date, approver, state, entries: [] } };
}

/** The ledger's line range: the heading's number and the first line of the next `# ` or `## ` heading, or the end. */
function sectionOf(lines, headingAt) {
  let end = lines.length;
  for (let i = headingAt + 1; i < lines.length; i += 1) {
    if (SECTION_END.test(fold(lines[i]))) {
      end = i;
      break;
    }
  }
  return { start: headingAt + 1, end };
}

/** A column-0 line that is no line kind of the grammar: red, never free text (an entry that lost its `- ` lands here). */
function unreadableLine(model, raw, say) {
  model.findings.push(say(
    `unreadable line ${quote(raw)} — a ledger line is an epoch line, an entry, a re-review heading, a Narrowed line or ` +
    "a table row; put free text on an indented line",
  ));
}

/**
 * An indented line is free text — unless, with its indent stripped and its format characters removed, it starts like
 * a ledger line (`RESERVED_PREFIX`).
 * That one is a finding and nothing else: it is not parsed, not counted, and opens or closes no record or block.
 */
function readIndented(model, raw, at, say) {
  if (!RESERVED_PREFIX.test(raw.replace(INDENT, "").replace(FORMAT, ""))) return;
  model.findings.push(say(
    `a ledger line stands at column 0: line ${at} ${quote(raw)} is indented and starts like a ledger line — an entry, an ` +
    "epoch line (>) or a heading (#) — which a renderer shows as a list item, a quote or a heading a reader counts; " +
    "move it to column 0, or reword the free text",
  ));
}

/** One entry line: it joins the block it stands in (an entry above the first epoch line is kept apart), or it is red. */
function readEntry(model, raw, at, say) {
  const { entry, detail } = parseEntry(raw);
  if (entry === undefined) model.findings.push(say(`unreadable entry ${quote(raw)} — ${detail}`));
  else if (model.epochs.length === 0) model.orphans.push({ ...entry, line: at });
  else model.epochs.at(-1).entries.push({ ...entry, line: at });
}

/** The kinds that belong to a re-review record: its heading (which opens it), its `Narrowed` line and its table rows. */
function readRecordLine(model, raw, line, at, say) {
  if (line.startsWith("###")) {
    const heading = RECORD_HEADING.exec(line);
    if (heading === null) {
      model.findings.push(say(`unreadable re-review heading ${quote(raw)} — it must read "### Re-review for epoch <k>"`));
      model.open = null;
      return;
    }
    model.open = { k: Number(heading[1]), line: at, narrowed: [], narrowedUnreadable: false, header: null, rows: [] };
    model.records.push(model.open);
  } else if (model.open === null) {
    unreadableLine(model, raw, say); // a Narrowed line or a table row outside a record
  } else if (line.startsWith("|")) {
    addTableRow(model.open, line);
  } else {
    const narrowed = NARROWED_LINE.exec(line);
    if (narrowed === null) {
      model.open.narrowedUnreadable = true;
      model.findings.push(say(
        `re-review for epoch ${model.open.k}: unreadable Narrowed line at line ${at} ${quote(raw)} — it reads ` +
        `"Narrowed: yes|no", optionally followed by ${CAUSE_SEPARATOR} and a reason`,
      ));
    } else model.open.narrowed.push(narrowed[1]);
  }
}

/**
 * The walk, top to bottom: every line of the section is one of the grammar's line kinds or a finding.
 *
 * The model is plain data so a test can read what the parser saw when a message is wrong:
 * `epochs: [{ k, date, approver, state, line, entries }]` (an entry belongs to the block it stands in) and
 * `records: [{ k, line, narrowed, narrowedUnreadable, header, rows }]`; `open` is the record the walk is inside.
 * `structural` is true when a row-3 finding was pushed: the shape of the section itself cannot be trusted, and the
 * state checks do not run.
 */
function parse(lines, { start, end }, say) {
  const model = { epochs: [], records: [], orphans: [], findings: [], open: null, structural: false, unreadableEpoch: false };
  for (let i = start; i < end; i += 1) {
    const raw = lines[i];
    const line = fold(raw);
    const at = i + 1;
    if (raw.trim() === "") continue;

    if (/^[ \t]/.test(raw)) {
      readIndented(model, raw, at, say);
    } else if (line.startsWith(">")) {
      const { epoch, detail } = parseEpoch(raw);
      model.open = null;
      if (epoch === undefined) {
        model.findings.push(say(`unreadable epoch line ${quote(raw)} — ${detail}`));
        model.structural = true;
        model.unreadableEpoch = true;
      } else {
        model.epochs.push({ ...epoch, line: at });
      }
    } else if (line.startsWith("###") || /^narrowed:/i.test(line) || line.startsWith("|")) {
      readRecordLine(model, raw, line, at, say);
    } else if (LIST_LINE.test(line)) {
      readEntry(model, raw, at, say);
    } else {
      unreadableLine(model, raw, say);
    }
  }
  return model;
}

/** One table row of a record: the separator is skipped, the first other row is the header, the rest are body rows. */
function addTableRow(record, line) {
  // A pipe not immediately preceded by a backslash is a boundary; behind one or more, whatever their number, it is cell
  // text and the cell keeps the run minus one backslash (measured with GitHub's renderer, 2026-10-29). The leading
  // pipe and the trailing boundary pipe are not cells.
  const cells = line.replace(/^\|/, "").replace(/(?<!\\)\|$/, "").split(/(?<!\\)\|/).map((cell) => cell.trim().replaceAll("\\|", "|"));
  if (cells.every((cell) => TABLE_SEPARATOR.test(cell))) return;
  if (record.header === null) record.header = cells;
  else record.rows.push(cells);
}

/** Row 3: what makes the section's shape untrustworthy — no epoch line, an entry above the first one. */
function checkShape(model, say) {
  if (model.unreadableEpoch) return; // the unreadable line is the finding; "no epoch line" would be noise on top of it
  if (model.epochs.length === 0) {
    model.findings.push(say('no epoch line; the section opens with "> Epoch 1 · approved <YYYY-MM-DD> · by reviewers|owner · state: open"'));
    model.structural = true;
    return;
  }
  for (const orphan of model.orphans) {
    model.findings.push(say(`entry ${orphan.id} stands before the first epoch line; an entry stands under its own epoch line`));
    model.structural = true;
  }
}

/** Row 6: epochs read 1..m in order, every lower one `closed`, the current one open or stopped, dates not going back. */
function checkSequence(model, say) {
  const { epochs } = model;
  const found = epochs.map((epoch) => epoch.k);
  if (found.some((k, index) => k !== index + 1)) {
    model.findings.push(say(`epochs not 1, 2, 3 … in order (found ${found.join(", ")})`));
    return false;
  }
  for (const [index, epoch] of epochs.entries()) {
    const current = index === epochs.length - 1;
    if (!current && epoch.state !== "closed") {
      model.findings.push(say(`epoch ${epoch.k} is not closed (state: ${epoch.state}); only the current epoch is open or stopped`));
    }
    if (current && epoch.state === "closed") {
      model.findings.push(say(`epoch ${epoch.k} is the current epoch and reads closed; the current epoch is open or stopped`));
    }
    if (index > 0 && epoch.date < epochs[index - 1].date) {
      model.findings.push(say(
        `epoch ${epoch.k}'s date goes back: approved ${epoch.date}, before epoch ${epochs[index - 1].k}'s ${epochs[index - 1].date}`,
      ));
    }
  }
  return true;
}

/** Row 5: an entry's epoch is the epoch it stands under and not above the current one; numbers run 1..n, never twice. */
function checkNumbers(model, say) {
  const current = model.epochs.at(-1).k;
  for (const epoch of model.epochs) {
    const own = [];
    const repeated = [];
    const seen = new Set(); // one pass: the second and later entry with a number is the repeat
    for (const entry of epoch.entries) {
      if (entry.k > current) model.findings.push(say(`entry ${entry.id} is above the current epoch ${current}`));
      else if (entry.k !== epoch.k) {
        model.findings.push(say(`entry ${entry.id} stands under epoch ${epoch.k}'s line; an entry stands under its own epoch line`));
      } else if (seen.has(entry.n)) repeated.push(entry);
      else {
        seen.add(entry.n);
        own.push(entry);
      }
    }
    for (const entry of repeated) {
      model.findings.push(say(`entry ${entry.id} twice: two branches each recorded a change — renumber; the merge is the stop`));
    }
    if (repeated.length === 0 && own.some((entry, index) => entry.n !== index + 1)) {
      model.findings.push(say(
        `epoch ${epoch.k}'s entries are numbered ${own.map((entry) => entry.id).join(", ")}; they must be 1..n in order`,
      ));
    }
  }
}

/** Rows 1 and 2: the second change stops the plan, and a stop is visible where a reader looks first. */
function checkCurrentEpoch(model, status, say) {
  const epoch = model.epochs.at(-1);
  if (epoch.entries.length >= 2 && epoch.state !== "stopped") {
    model.findings.push(say(
      `epoch ${epoch.k} has ${epoch.entries.length} changes and is not stopped; stop for a whole re-review ` +
      `(entries ${epoch.entries.map((entry) => entry.id).join(", ")})`,
    ));
  }
  if (epoch.state === "stopped" && !STOP_PHRASE.test(status)) {
    model.findings.push(say(
      `epoch ${epoch.k} is stopped, but the status paragraph does not say "stopped for re-review"; ` +
      "the stop must be visible where a reader looks first",
    ));
  }
}

/** The inside of one record: one Narrowed line, and a table with the exact header and at least one body row of 4 cells. */
function checkRecordBody(record, model, say) {
  const where = `re-review for epoch ${record.k}`;
  if (record.narrowed.length === 0 && !record.narrowedUnreadable) model.findings.push(say(`${where}: no "Narrowed: yes|no" line`));
  if (record.narrowed.length > 1) model.findings.push(say(`${where}: more than one Narrowed line`));
  if (record.header === null) {
    model.findings.push(say(`${where}: no table; the record is a "| ${TABLE_HEADER.join(" | ")} |" table`));
    return;
  }
  if (record.header.join("|") !== TABLE_HEADER.join("|")) {
    model.findings.push(say(
      `${where}: the table header must read "| ${TABLE_HEADER.join(" | ")} |", not "| ${clean(record.header.join(" | "))} |"`,
    ));
  }
  if (record.rows.length === 0) model.findings.push(say(`${where}: the table has no rows; at least one row (verdict — when nothing was built)`));
  for (const [index, cells] of record.rows.entries()) {
    if (cells.length !== TABLE_HEADER.length) {
      model.findings.push(say(`${where}: row ${index + 1} has ${cells.length} cells, not ${TABLE_HEADER.length}`));
    } else if (!VERDICTS.includes(cells[2])) {
      model.findings.push(say(`${where}: verdict "${clean(cells[2])}" in row ${index + 1}; a verdict is ${verdictList}`));
    }
  }
}

/** Where a record stands and whether the epoch it opens exists: row 7's record-level checks. */
function checkRecordPlace(record, model, say) {
  const { epochs } = model;
  const next = epochs.length + 1; // the re-review in progress names the epoch that does not exist yet
  const where = `re-review for epoch ${record.k}`;
  if (record.k === 1) {
    model.findings.push(say(`${where}; epoch 1 is the first approval and has no re-review`));
  } else if (record.k > next) {
    model.findings.push(say(`${where}, but the next epoch is ${next}`));
  } else {
    const previous = epochs[record.k - 2];
    const opened = epochs[record.k - 1]; // undefined while the re-review is in progress
    if (opened === undefined && epochs.at(-1).state !== "stopped") {
      model.findings.push(say(`${where} while epoch ${epochs.at(-1).k} is ${epochs.at(-1).state}; the stop comes first`));
    }
    if (opened !== undefined && record.line > opened.line) {
      model.findings.push(say(`${where} stands after epoch ${record.k}'s line; the record comes before the epoch line it opens`));
    }
    if (record.line < previous.line) {
      model.findings.push(say(`${where} stands before epoch ${previous.k}'s line; it stands between epoch ${previous.k}'s line and epoch ${record.k}'s`));
    }
  }
}

/** Rows 7 and 8: every record is well formed and stands once (also for an epoch not yet opened), every epoch k ≥ 2 has
 *  one, and a narrowed one needs the owner. */
function checkRecords(model, say) {
  const byEpoch = new Map();
  for (const record of model.records) {
    checkRecordPlace(record, model, say);
    checkRecordBody(record, model, say);
    let own = byEpoch.get(record.k);
    if (own === undefined) byEpoch.set(record.k, (own = []));
    own.push(record);
  }
  for (const [k, own] of byEpoch) {
    if (own.length > 1) model.findings.push(say(`two re-review records for epoch ${k}; there is one`));
  }
  for (const epoch of model.epochs.filter((candidate) => candidate.k >= 2)) {
    const own = byEpoch.get(epoch.k) ?? [];
    if (own.length === 0) {
      model.findings.push(say(
        `no re-review for epoch ${epoch.k}: a "### Re-review for epoch ${epoch.k}" record must stand before its epoch line; ` +
        "the re-review must leave a record",
      ));
    }
    if (own[0]?.narrowed[0] === "yes" && epoch.approver === "reviewers") {
      model.findings.push(say(
        `epoch ${epoch.k} is narrowed (Narrowed: yes) and approved by reviewers; a smaller plan needs the owner (by owner)`,
      ));
    }
  }
}

/**
 * The findings for one plan, each starting with `file` (the class prefix is the caller's).
 *
 * `status` is the status paragraph as `statusParagraph` returns it; `parent` is the root-relative name of the parent
 * plan (`todo/PLAN_x.md`) when `file` is a stories document whose parent is in `todo/`, else `null`. The caller
 * resolved it against the folder; this file prints it and never derives one. Order of work: parse (findings in line
 * order); if the section's shape is untrustworthy, stop; the sequence of epochs (and stop if it is not 1..m); entry
 * numbers; the current epoch's count and stop; the records; the stories-document row.
 */
export function ledgerFindings({ file, text, status, parent }) {
  const say = (message) => `${file} — ${message}`;
  // A lone CR is a line ending as CommonMark reads it; `folded` (shared, feeds the hashed rule bodies) knows CRLF only.
  const lines = outsideFencedBlocks(folded(text).replace(/\r\n?/g, "\n")).split("\n");
  const headings = [];
  for (const [index, raw] of lines.entries()) {
    const line = fold(raw);
    if (HEADING.test(line) || NEAR_HEADING.test(raw.replace(FORMAT, "").trimEnd())) headings.push({ index, exact: HEADING.test(line), raw });
  }
  if (headings.length === 0) return []; // opt-in by presence

  if (headings.length > 1) {
    const [first, second] = headings;
    const more = headings.length > 2 ? ` and ${headings.length - 2} more` : "";
    return [say(`two \`## Plan changes\` headings (lines ${first.index + 1} and ${second.index + 1}${more}); a plan has one ledger`)];
  }
  if (!headings[0].exact) {
    return [say(`the heading ${quote(headings[0].raw)} is not a ledger heading; it must read exactly "## Plan changes"`)];
  }

  const model = parse(lines, sectionOf(lines, headings[0].index), say);
  checkShape(model, say);
  if (!model.structural && checkSequence(model, say)) {
    checkNumbers(model, say);
    checkCurrentEpoch(model, String(status ?? ""), say);
    checkRecords(model, say);
  }

  if (typeof parent === "string" && parent !== "") {
    model.findings.push(say(`a stories document carries a ledger; its changes count in the parent, ${clean(parent)}`));
  }
  return model.findings;
}
