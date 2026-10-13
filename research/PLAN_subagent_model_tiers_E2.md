# PLAN — Model tiers, E2: the guard, its installer, and the harnesses prepared for it

> Status: **IMPLEMENTED, 2026-10-13.** Stories of epic E2 of [PLAN_subagent_model_tiers.md](PLAN_subagent_model_tiers.md)
> (§ *Epics*, E2), shipped in PR #65. Deviations: the role-table parser is a `tools/lib/` module (S1); each harness
> opt-out is proved by its launcher's unit test plus the hook's opt-out test, not a paid real-launcher run, and no
> launcher goes through WSL (S4); the scout calibration's opt-out landed in `dew_flow_benchmark` #81 rather than on the
> other session's branch; the self-install (S5) grew handler-level merges, repair of an interrupted or invalid
> registration, and a refusal to install from the conventions repository itself. Checked and NOT observed:
> S1.8's open point 1 — `systemMessage` beside a decision on an interactive host has no record in
> [RESULTS](RESULTS_subagent_model_tiers.md). Open tail: the first live user-level install is E3's, in
> [PLAN_subagent_model_tiers_rollout.md](../todo/PLAN_subagent_model_tiers_rollout.md).
>
> Split by Opus; models per story below.

Done when (from the parent): the guard and installer tests pass and both break-its went red and back; `adapter-check`
demands the hook and this repository hosts it; real payloads and the allowed-call context are recorded; every harness
that needs the opt-out sets it, proved through its real launcher — all merged BEFORE this epic merges.

## S1 — The hook's contract with the host — **cornerstone (2 of 2)**

- **Models.** Evidence first: a Sonnet scout recorded the real payloads (S1.0). Fable wrote this spec (2026-10-13).
  A Sonnet coder writes `settings/hooks/subagent-model.mjs`, `tools/lib/role-table.mjs` and
  `tools/subagent-model-hook.test.mjs` from it, exactly as written — nothing more, nothing less; Opus reviews the code
  against this section, not against its own idea of the hook.
- **Scope.** The hook; the role-table parser (a `tools/lib/` module, so E4's smoke can reuse it — one small deviation
  from the two-file scope first written here); the test (the parent's §4 *Guard* list, both break-its, the
  digest-vs-rule test). Not here: the wiring (S3), the installer (S2), the research record's harness inventory (S4).
- **Status.** Spec written 2026-10-13; code written the same day (34 scenarios green; both break-its observed — RESULTS
  § *E2.S1 break-its*).

### S1.0 — What the real host does (recorded 2026-10-13, headless `-p`, `permission_mode: "default"`)

- PreToolUse payload keys: `session_id`, `transcript_path`, `cwd`, `scratchpad_dir`, `prompt_id`, `permission_mode`,
  `effort` (`{"level":"high"}`), `hook_event_name` (`"PreToolUse"`), `tool_name`, `tool_input`, `tool_use_id`.
- `tool_name` is `Agent`. `tool_input` with a model:
  `{"description","prompt","subagent_type","model":"sonnet","run_in_background":false}`. Without a model the `model`
  key is **absent** — the host injects no default.
- A hook stdout of `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"X"}}`
  reaches the model as the error tool result `PreToolUse:Agent hook error: X`; the subagent never runs.
- `{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"Y"}}` with no `permissionDecision` reaches
  the parent model as context, and the call proceeds through normal permission handling.
- Docs (`code.claude.com/docs/en/hooks.md`, read 2026-10-13): `"allow"` skips the permission prompt — the guard never
  emits it; across hooks `deny` > `defer` > `ask` > `allow`; a `deny`'s `permissionDecisionReason` is shown to Claude;
  `systemMessage` is a top-level field of every event — "warning message shown to the user" — and the PreToolUse
  section does not list it among the fields it discards (Notification and Setup do, explicitly).
- E1.S1's role table (draft on `docs/subagent-model-tiers`, read 2026-10-13, not final): a three-column GFM table under
  `## The role table`, header `| Role | Model | What it is |`, rows `Scout`, `Coder`, `Small edit`, `Judge`,
  `Plan → epics`, `Security judgement`, `Cornerstone spec`; the second column is one of `sonnet`, `opus`, `fable`,
  `main session or sonnet`. S1.4 is specified against that SHAPE; the `role` strings in S1.1 are copied from the draft
  and are updated — in the hook, never in the test — when the final table differs.

### S1.1 — The exported API (`settings/hooks/subagent-model.mjs`)

One ES module, copied verbatim into every consumer (`adapter-check` compares bytes), in the `build-flags.mjs` shape: a
block comment in that file's voice (what it enforces, why it fails open, why it teaches and never approves, why the
digest is its only copy of the table), exported constants and pure functions, the entry guarded by
`process.argv[1]?.endsWith('subagent-model.mjs')`. Node ≥ 20; no imports — `process`, `Buffer` and `JSON` are globals.

```js
export const DENY_MARKER = 'subagent-models.md:';
export const ALLOWED_MODELS = Object.freeze(['sonnet', 'opus', 'fable']);
export const OPT_OUT_VARIABLE = 'SUBAGENT_MODEL_GUARD';
export const FREEZE_VARIABLES = Object.freeze([
  'ANTHROPIC_DEFAULT_OPUS_MODEL', 'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL', 'ANTHROPIC_DEFAULT_FABLE_MODEL',
  'CLAUDE_CODE_SUBAGENT_MODEL_FORCE',
]);
export const STDIN_LIMIT = 256 * 1024;
export const STDIN_DEADLINE_MS = 2000;

/** The hook's ONLY copy of the rule's role table: `role` is the table's first cell verbatim, `model` its second. */
export const ROLE_DIGEST = Object.freeze([
  { role: 'Scout', model: 'sonnet' },
  { role: 'Coder', model: 'sonnet' },
  { role: 'Small edit', model: 'main session or sonnet' },
  { role: 'Judge', model: 'opus' },
  { role: 'Plan → epics', model: 'fable' },
  { role: 'Security judgement', model: 'fable' },
  { role: 'Cornerstone spec', model: 'fable' },
].map(Object.freeze));

export function roleLine(digest = ROLE_DIGEST)   // → string (S1.3)
export const TEACH_TEXT = …;                      // derived from roleLine(ROLE_DIGEST) (S1.3)
export const DENY_TEXT = …;                       // derived from roleLine(ROLE_DIGEST); opens with DENY_MARKER (S1.3)

export function subagentModelVerdict(payload, env)
  // → { kind: 'deny' | 'teach' | 'silent', text: string, warnings: string[] }
export function hookOutput(verdict)               // → string: '' or ONE line of JSON ending in '\n'
export function hookResponse(stdinText, env)      // → string: JSON.parse + verdict + hookOutput; '' on ANY throw
```

- `subagentModelVerdict` is pure: no I/O, no `process`, no clock. It reads exactly six keys of `env` —
  `OPT_OUT_VARIABLE` and the five `FREEZE_VARIABLES` — and nothing else. `text` is `DENY_TEXT`, `TEACH_TEXT` or `''`;
  `warnings` is `[]` whenever `kind` is `silent`.
- `hookOutput(verdict)`: `silent` → `''` (zero bytes). `deny` →
  `JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: text }, ...(warnings.length ? { systemMessage: warnings.join(' ') } : {}) }) + '\n'`.
  `teach` → the same with `hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: text }`. Keys in
  exactly that order, no whitespace; the texts carry no newline, so the output is one line with one trailing `\n`.
- `hookResponse(stdinText, env)`: `JSON.parse(stdinText)` → `subagentModelVerdict` → `hookOutput`, the whole body inside
  `try { … } catch { return ''; }`. This is the function the entry calls and the one the thrown-error test exercises.
- The entry:

  ```js
  if (process.argv[1]?.endsWith('subagent-model.mjs')) {
    let out = '';
    try {
      const { text, size } = await readStdin();   // build-flags.mjs payload(), returning raw text + byte count
      out = size > STDIN_LIMIT ? '' : hookResponse(text, process.env);
    } catch { out = ''; }
    if (out === '') process.exit(0);
    else process.stdout.write(out, () => process.exit(0));
  }
  ```

  `readStdin` is `build-flags.mjs:168-183` with two changes: it returns `{ text, size }` instead of parsing, and `size`
  counts every byte received — so a payload over the limit is judged over by its size, never parsed by luck of chunk
  boundaries. The write-then-exit callback is what guarantees the line is flushed before exit on a pipe. Exit code is
  always 0; nothing is ever written to stderr.

### S1.2 — The verdict matrix

Evaluation order inside `subagentModelVerdict(payload, env)`:

1. **Opt-out first.** `String(env.SUBAGENT_MODEL_GUARD ?? '').trim().toLowerCase() === 'off'` → `silent`, whatever the
   payload, `warnings: []`. A harness that measures models must not be steered by a refusal, a hint OR a warning.
2. **Envelope.** `silent` (the hook's problem — fail open) unless ALL of: `payload` is a plain object (`typeof 'object'`,
   not `null`, not an array); `payload.hook_event_name` is absent or exactly `'PreToolUse'`; `payload.tool_name` is
   exactly `'Agent'` or `'Task'`; `payload.tool_input` is a plain object.
3. **Model.** `const model = payload.tool_input.model`. `typeof model === 'string' && ALLOWED_MODELS.includes(model)` →
   `teach`; anything else → `deny`. Exact, case-sensitive, untrimmed.
4. **Warnings** — computed only when the kind is `deny` or `teach`, in this order:
   - *freeze:* the `FREEZE_VARIABLES` whose `String(env[name] ?? '').trim()` is non-empty, in `FREEZE_VARIABLES`
     order; if any → ONE sentence W-FREEZE (S1.3) naming them all;
   - *opt-out spelling:* `v = String(env.SUBAGENT_MODEL_GUARD ?? '').trim().toLowerCase()`; `v` not `''` and not `'on'`
     (`'off'` returned in step 1) → ONE sentence W-OPTOUT (S1.3).

Named outputs: `DENY_JSON` = `hookOutput({ kind: 'deny', text: DENY_TEXT, warnings: [] })`; `TEACH_JSON` likewise with
`teach`; `EMPTY` = `''`; `+W` = the same JSON with `"systemMessage"` appended as the last top-level key. In the table the
payload is the recorded shape with `tool_name: "Agent"` and the env carries none of the six variables unless the row
says otherwise.

| Input class | Examples | kind | stdout |
|---|---|---|---|
| allowed alias | `model` is `"sonnet"`, `"opus"`, `"fable"` | teach | TEACH_JSON |
| `model` key absent | the recorded no-model payload | deny | DENY_JSON |
| empty / whitespace / padded | `""`, `" "`, `"\t"`, `"sonnet "`, `" opus"` | deny | DENY_JSON |
| haiku | `"haiku"` | deny | DENY_JSON |
| inherit | `"inherit"` | deny | DENY_JSON |
| versioned id | `"claude-opus-5-5"`, `"claude-sonnet-4-5-20250929"`, `"claude-fable-5-1"`, `"opus-5"` | deny | DENY_JSON |
| another case or spelling | `"Opus"`, `"SONNET"`, `"Fable"`, `"sonnet,opus"` | deny | DENY_JSON |
| non-string | `null`, `123`, `true`, `{}`, `[]`, `["sonnet"]`, `{"alias":"sonnet"}` | deny | DENY_JSON |
| `tool_name: "Task"` | with `"sonnet"` / with no model | teach / deny | TEACH_JSON / DENY_JSON |
| `tool_name` not Agent/Task | `"Bash"`, `""`, `42`, absent — even with `model: "haiku"` or no model | silent | EMPTY |
| `tool_input` not a plain object | absent, `null`, `[]`, `"x"`, `7` | silent | EMPTY |
| payload not a plain object | `null`, `[]`, `"x"`, `7`, `true` | silent | EMPTY |
| `hook_event_name` other than PreToolUse | `"PostToolUse"` with no model | silent | EMPTY |
| `hook_event_name` absent | otherwise valid, no model | deny | DENY_JSON |
| garbage stdin | `not json at all`, `{`, `{"tool_name":` | silent (throw caught) | EMPTY |
| empty stdin | zero bytes, closed | silent | EMPTY |
| opt-out | `SUBAGENT_MODEL_GUARD` = `off`, `OFF`, ` off ` — with sonnet, with no model, with garbage, with a freeze variable set | silent | EMPTY |
| guard on, nothing to say | `SUBAGENT_MODEL_GUARD` unset, `""`, `on`, `ON` | as the payload says | DENY_JSON / TEACH_JSON, no `systemMessage` |
| opt-out misspelt | `SUBAGENT_MODEL_GUARD` = `false`, `0`, `no`, `disabled` | as the payload says | +W (W-OPTOUT) |
| alias frozen | any FREEZE_VARIABLE non-empty — `ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-5-5`, `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` | as the payload says | +W (W-FREEZE naming each set variable) |
| freeze variable set to `""` or `"  "` | — | as the payload says | no `systemMessage` |
| `CLAUDE_CODE_SUBAGENT_MODEL` (no FORCE) set | `=haiku` | as the payload says | no `systemMessage` — not read |
| both warnings apply | `ANTHROPIC_DEFAULT_FABLE_MODEL=x` and `SUBAGENT_MODEL_GUARD=false` | as the payload says | +W: W-FREEZE, one space, W-OPTOUT |
| a warning on a fail-open | `tool_name: "Bash"` with a freeze variable set | silent | EMPTY — a warning never rides a fail-open |

**Why the warning channel is `systemMessage`, never a deny.** The variable belongs to the host's environment, not to the
call: the launch may be perfectly correct, and a deny would block work the session cannot fix — it cannot unset its
parent process's environment. `additionalContext` reaches the model, not the person who set the variable. stderr under
exit 0 is never shown. `systemMessage` is the documented user-visible field of every event and travels beside a normal
decision, so the verdict is unchanged and the human sees the warning on every launch until the variable is gone.
A headless `-p` run shows it to nobody — accepted: the harnesses that run headless are the ones that opt out.

**Why `off` and only `off`.** One spelling, grep-able — `SUBAGENT_MODEL_GUARD=off` is what S4's inventory writes and
what `rt_search_literal` finds. A misspelt opt-out is exactly the silent-failure class this guard exists against, so it
is not quietly honoured and not quietly ignored: the guard stays on AND says so (W-OPTOUT), and S4's proof through the
real launcher catches it before any copy is live. Trimmed and case-insensitive because a shell or `WSLENV` adds neither
meaning nor safety to case; `on` is accepted silently so a launcher can state the default without a warning.

### S1.3 — The texts: ONE digest, two renderings

`roleLine(digest)`: group the entries by `model`; order the groups by index in `ALLOWED_MODELS`, any other model value
after them in order of first appearance; keep digest order within a group; render each entry as `role.toLowerCase()`;
a group is `` `${model}: ${roles.join(', ')}` ``; join groups with `' · '` (U+00B7). For `ROLE_DIGEST` above (136 B):

```
sonnet: scout, coder · opus: judge · fable: plan → epics, security judgement, cornerstone spec · main session or sonnet: small edit
```

`TEACH_TEXT` — `` `Subagent models — ${roleLine(ROLE_DIGEST)}. Name the model on every launch as a bare alias; the role table is common/subagent-models.md.` `` — **250 B UTF-8**, bound ≤ 300:

```
Subagent models — sonnet: scout, coder · opus: judge · fable: plan → epics, security judgement, cornerstone spec · main session or sonnet: small edit. Name the model on every launch as a bare alias; the role table is common/subagent-models.md.
```

`DENY_TEXT` — `` `${DENY_MARKER} name the model on every Agent call as a bare alias — sonnet, opus or fable. Missing, empty, haiku, inherit, a versioned id or another spelling is refused. Roles — ${roleLine(ROLE_DIGEST)}. Relaunch with the alias of the role.` `` — **361 B UTF-8**, bound ≤ 600:

```
subagent-models.md: name the model on every Agent call as a bare alias — sonnet, opus or fable. Missing, empty, haiku, inherit, a versioned id or another spelling is refused. Roles — sonnet: scout, coder · opus: judge · fable: plan → epics, security judgement, cornerstone spec · main session or sonnet: small edit. Relaunch with the alias of the role.
```

Rules the texts obey (each is a test in S1.6): the deny text is FIXED — it never echoes the offending value, because an
echo makes the byte bound depend on input and lets payload text into the reason; the marker `subagent-models.md:` appears
ONLY in `DENY_TEXT` — `TEACH_TEXT` and every warning must not contain that substring, because E4's smoke counts the marker
as denials and a teach carrying it would count as one (hence `common/subagent-models.md.` with a full stop); both texts
are one line (no `\n`, no `\r`); the dash is U+2014, the dot U+00B7, the arrow inside a role U+2192 — count with
`Buffer.byteLength(s, 'utf8')`, never `.length`.

Warnings (user-visible, S1.2 step 4; neither contains the marker):

- **W-FREEZE** — `` `Model guard: alias-freezing variable(s) set: ${names.join(', ')}. The rule wants bare aliases that follow the newest model — unset them (common/subagent-models.md).` `` where `names` are the set variables in `FREEZE_VARIABLES` order.
- **W-OPTOUT** — `` `Model guard: SUBAGENT_MODEL_GUARD is set but is not an opt-out, the guard stays on; the only opt-out is SUBAGENT_MODEL_GUARD=off.` `` — a fixed sentence that does not echo the value (a value such as `false subagent-models.md:` would otherwise put the deny marker into `systemMessage`).

### S1.4 — The digest-vs-rule test (`tools/lib/role-table.mjs` + the test)

`tools/lib/role-table.mjs` exports two pure functions; the hook never imports it (the hook reads no file).

- `parseRoleTable(markdown) → Array<{ role, model }>`. Normalise `\r\n` to `\n`. A GFM table is a run of consecutive
  lines starting with `|` whose second line is a separator (`|` and cells made of `-` and `:`). Cells of a row: split on
  unescaped pipes (`\|` is a literal pipe), drop the empty first and last pieces the outer pipes produce, `clean()` each.
  **Locate:** the FIRST table whose header row's second cell cleans to `model`; none → throw
  `Error('no role table in the rule: no table whose header's second cell is "Model"')`. Body rows map to
  `{ role: clean(cells[0]), model: clean(cells[1]) }`; a body row with fewer than two cells throws. Extra columns are
  ignored. `clean(cell)`: `[text](url)` → `text`; strip `**`, `*` and `` ` ``; `\|` → `|`; collapse whitespace to one
  space; trim; lowercase.
- `digestMismatches(digest, rows) → string[]`, with `clean()` applied to both sides' `role` before comparing and
  `model` compared exactly (the digest's models are already lowercase):
  - `rule row "<role>": model "<x>" is not one of sonnet, opus, fable, main session or sonnet`
  - `rule row "<role>" (<model>) is missing from the hook's ROLE_DIGEST`
  - `hook entry "<role>" is not in the rule's table`
  - `"<role>": rule says <m1>, hook says <m2>`
  - `duplicate role "<role>" in the rule` / `… in the hook`
  - `[]` when the two agree — the SET of roles equal and every model equal.
- The test (`tools/subagent-model-hook.test.mjs`): `rule = process.env.SUBAGENT_MODEL_RULE_PATH ??
  path.join(HERE, '..', 'common', 'subagent-models.md')`;
  `assert.deepEqual(digestMismatches(ROLE_DIGEST, parseRoleTable(fs.readFileSync(rule, 'utf8'))), [])`. The override is
  the TEST's, for the break-it and for parallel work — the hook has no such thing. **Never skipped:** on this branch,
  before E1's rule is merged, it is RED with "no role table" — correct, not a bug to paper over; the coder points
  `SUBAGENT_MODEL_RULE_PATH` at the E1 worktree's file to see it green, and the branch goes green when it rebases onto
  E1. Green against the real path is required before S1 is done.
- **Permanent break-it #2:** a second test tampers a COPY of the real rule text — the first body row's model cell
  replaced by another of the four values — and asserts the mismatch list has exactly one entry naming that row's role.
  A third asserts `parseRoleTable` throws on text without a role table (the OLD rule's shape: headings and prose, no
  table). The manual break-it in S1.6 does the same through the file system, once, for the record.

### S1.5 — Fail-open paths and what each one looks like

| Path | Observable result |
|---|---|
| stdin is not JSON (`not json at all`, cut-off JSON) | stdout `''`, exit 0 |
| stdin empty (0 bytes, closed) | `''`, exit 0 |
| JSON but not a plain object, or the envelope is wrong (S1.2 step 2) | `''`, exit 0 |
| any throw inside — an env whose property access throws (the Proxy test), a getter that throws | `''`, exit 0: `hookResponse` returns `''`; the entry's own `try/catch` covers `readStdin` |
| stdin never closed | after `STDIN_DEADLINE_MS` (2 s) the bytes received are judged: a complete payload gets its normal verdict (DENY_JSON or TEACH_JSON, ending in `\n`); an incomplete one `''`. Exit 0, well inside the test's 15 s |
| stdin over `STDIN_LIMIT` (256 KiB) | `''`, exit 0 — decided by `size > STDIN_LIMIT`, whether or not the whole payload arrived; a call that large is not judged (open point 2) |
| the host closed the stdout pipe (EPIPE) | exit 0, nothing on stderr: the entry installs `process.stdout.on('error', () => process.exit(0))` and the write callback ignores its error argument and exits 0 |

Every fail-open result is the same two observations — zero bytes on stdout and exit code 0 — one assertion shape for
all of them, which is the reason no warning rides a fail-open (S1.2, last row).

### S1.6 — Test scenarios (`tools/subagent-model-hook.test.mjs`, the `build-flags-hook.test.mjs` shape)

Fixtures: `REAL_PAYLOAD(toolInput)` builds the recorded shape of S1.0 with placeholder values and the given
`tool_input`; `noModel()` is `REAL_PAYLOAD({ description: 'd', prompt: 'p', subagent_type: 'general-purpose', run_in_background: false })`,
`withModel(m)` the same with `model: m`. `cleanEnv(overrides)` starts from `process.env`, deletes every key whose
upper-case form is one of the six variables (Windows folds case), then applies `overrides` — every spawn uses it, and
every in-process call passes a plain object: a developer's shell may carry `ANTHROPIC_DEFAULT_OPUS_MODEL`, and a test
that inherits it fails for the wrong reason. `spawnHook(input, env)` is
`spawnSync(process.execPath, [HOOK], { input, env: cleanEnv(env), encoding: 'utf8', timeout: 30_000, windowsHide: true })`.
`oneLine(out)` asserts `out.endsWith('\n')` and `!out.slice(0, -1).includes('\n')`, then returns `JSON.parse(out)`.
Scenarios are in-process unless marked **spawn**.

1. Each allowed alias → `{ kind: 'teach', text: TEACH_TEXT, warnings: [] }`; `hookOutput` parses to exactly
   `{ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: TEACH_TEXT } }` — no `permissionDecision`
   key anywhere, no `systemMessage`.
2. `model` absent → `{ kind: 'deny', text: DENY_TEXT, warnings: [] }`; `hookOutput` parses to exactly
   `{ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: DENY_TEXT } }`.
3. `''`, `' '`, `'\t'`, `'sonnet '`, `' opus'` → deny.
4. `'haiku'` → deny.
5. `'inherit'` → deny.
6. `'claude-opus-5-5'`, `'claude-sonnet-4-5-20250929'`, `'claude-fable-5-1'`, `'opus-5'` → deny.
7. `'Opus'`, `'SONNET'`, `'Fable'`, `'sonnet,opus'` → deny.
8. `null`, `123`, `true`, `{}`, `[]`, `['sonnet']`, `{ alias: 'sonnet' }` → deny.
9. `tool_name: 'Task'`: `'sonnet'` → teach; no model → deny.
10. `tool_name` `'Bash'`, `''`, `42`, absent — each twice, with `model: 'haiku'` and with no model → silent;
    `hookOutput` is `''`.
11. `tool_input` absent, `null`, `[]`, `'x'`, `7` → silent.
12. Payload `null`, `[]`, `'x'`, `7`, `true` passed straight to `subagentModelVerdict` → silent.
13. `hook_event_name: 'PostToolUse'` with no model → silent; `hook_event_name` deleted, no model → deny.
14. Opt-out: for each env value `'off'`, `'OFF'`, `' off '` — sonnet → silent; no model → silent; `tool_name: 'Bash'`
    → silent; with `ANTHROPIC_DEFAULT_OPUS_MODEL: 'x'` as well → silent and `warnings` deep-equals `[]`.
    `hookResponse('not json', { SUBAGENT_MODEL_GUARD: 'off' })` → `''`.
15. `SUBAGENT_MODEL_GUARD` unset, `''`, `'on'`, `'ON'` → the payload's verdict with `warnings: []`; `'false'`, `'0'`,
    `'no'`, `'disabled'` → the payload's kind and text unchanged, `warnings` deep-equals `[W-OPTOUT]` (the fixed sentence); a value of
    60 characters gives the same sentence; a value `false subagent-models.md:` → the `systemMessage` does not contain `DENY_MARKER`.
16. Freeze: each of the five names set alone (`'claude-x'`; FORCE `'1'`) with sonnet → teach,
    `warnings: [W-FREEZE(that name)]`; `ANTHROPIC_DEFAULT_OPUS_MODEL` + `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` set → one
    sentence naming both in `FREEZE_VARIABLES` order; the same pair with no model → deny with the same single warning;
    set to `''` and to `'  '` → `warnings: []`; `CLAUDE_CODE_SUBAGENT_MODEL: 'haiku'` alone → `warnings: []`.
17. Both: `ANTHROPIC_DEFAULT_FABLE_MODEL: 'x'` + `SUBAGENT_MODEL_GUARD: 'false'` with sonnet → `warnings` deep-equals
    `[W-FREEZE, W-OPTOUT]`; `oneLine(hookOutput(...))` has `systemMessage === W-FREEZE + ' ' + W-OPTOUT` and
    `Object.keys(parsed)` deep-equals `['hookSpecificOutput', 'systemMessage']`.
18. A warning never changes the kind and never rides a fail-open: deny stays deny and teach stays teach under 16–17;
    `tool_name: 'Bash'` + a freeze variable → `{ kind: 'silent', text: '', warnings: [] }`.
19. Marker: `DENY_TEXT.startsWith(DENY_MARKER)`; `!TEACH_TEXT.includes(DENY_MARKER)`; no warning produced in 15–17
    includes `DENY_MARKER`.
20. Budgets and derivation: `Buffer.byteLength(DENY_TEXT, 'utf8') <= 600`; `Buffer.byteLength(TEACH_TEXT, 'utf8') <= 300`;
    neither contains `\n` or `\r`; both contain `roleLine(ROLE_DIGEST)`; `roleLine` contains every entry's
    `role.toLowerCase()` and every distinct `model`; the group order is `sonnet`, `opus`, `fable`, then the rest
    (`indexOf('sonnet:') < indexOf('opus:') < indexOf('fable:') < indexOf('main session or sonnet:')`); a hand-made
    digest with a model outside `ALLOWED_MODELS` renders that group last.
21. `ROLE_DIGEST` and each entry are frozen; every `model` is in `ALLOWED_MODELS` or exactly `'main session or sonnet'`;
    no `role` repeats (case-insensitive).
22. `hookOutput` exactness: silent → `''`; deny and teach → `oneLine` parses and `JSON.stringify(parsed) === out.slice(0, -1)`
    (no whitespace).
23. `hookResponse`: `'not json at all'`, `''`, `'null'`, `'[]'`, `'"x"'`, `'7'` → `''`; `JSON.stringify(noModel())` →
    `DENY_JSON`; `JSON.stringify(withModel('sonnet'))` → `TEACH_JSON`; a valid payload with
    `env = new Proxy({}, { get() { throw new Error('boom'); } })` → `''` (the thrown-error path).
24. **spawn** `withModel('sonnet')` → `stdout === TEACH_JSON`, `status === 0`, `stderr === ''`.
25. **spawn** `noModel()` → `stdout === DENY_JSON`, `status === 0`, `stderr === ''`;
    `oneLine(stdout).hookSpecificOutput.permissionDecisionReason.startsWith('subagent-models.md:')`.
26. **spawn** `'not json at all'` → `''`, 0; `input: ''` → `''`, 0.
27. **spawn** env `{ SUBAGENT_MODEL_GUARD: 'off' }` with `noModel()` → `''`, 0.
28. **spawn** env `{ ANTHROPIC_DEFAULT_OPUS_MODEL: 'claude-opus-5-5' }` with `withModel('sonnet')` → `oneLine` parses;
    `hookSpecificOutput.additionalContext === TEACH_TEXT`; `systemMessage === W-FREEZE('ANTHROPIC_DEFAULT_OPUS_MODEL')`.
29. **spawn, stdin left open** (`build-flags-hook.test.mjs:125-142`): write `JSON.stringify(noModel())`, never end stdin
    → exits 0 within 15 s, `stdout === DENY_JSON`; the same with `withModel('sonnet')` → `TEACH_JSON` — the deadline path
    is not deny-only.
35. **spawn, stdout closed first** (`spawn`, not `spawnSync`): a valid no-model payload, `child.stdout.destroy()` before the hook writes → exit 0 and empty stderr. EPIPE depends on a race between the child's write and the reader's close, so the scenario loops 20 times and asserts every run exits 0 with a silent stderr.
30. **spawn, size**: `noModel()` with a `prompt` of 200 KiB of `'x'` → `DENY_JSON`; 300 KiB → `''`, status 0.
31. **digest-vs-rule**: `digestMismatches(ROLE_DIGEST, parseRoleTable(fs.readFileSync(rule, 'utf8')))` deep-equals `[]`
    (S1.4; RED on this branch until E1's rule is present — expected, and required green before S1 is done).
32. **tamper (permanent break-it #2)**: the real rule text with the FIRST body row's model cell replaced by another of
    the four values → the mismatch list has exactly one entry and it names that row's role.
33. `parseRoleTable` throws `/no role table/` on `'# nothing\n\ntext\n'` and on a table whose header's second cell is
    `Owner`; it accepts a two-column table (`| Role | Model |`), the three-column shape of S1.0, cells with `**bold**`,
    `` `code` `` and a markdown link (which `clean()` reduces to its text), and a `\|` inside a third-column cell; a
    body row with one cell throws.
34. `digestMismatches` directly: each of the five message kinds of S1.4 from hand-made inputs; `[]` for a pair that
    differs only in the case and surrounding whitespace of `role`.

**Manual break-its** (run once by the coder, both red messages and the final green run recorded in
`research/RESULTS_subagent_model_tiers.md` § *E2.S1 break-its* and in S1's summary, per `common/testing.md`; nothing
left behind): (1) change step 3 of `subagentModelVerdict` to return `teach` for every model → scenarios 2–9 (the deny
half), 23, 25, 29 and 30 go red — quote the first failing assertion; restore; green. (2) Point
`SUBAGENT_MODEL_RULE_PATH` at a copy of E1's rule in which `Judge`'s model is `sonnet` → scenario 31 red with
`"judge": rule says sonnet, hook says opus`; restore; green.

### S1.7 — What the hook must NOT do

- No network, no filesystem (not even the rule — `ROLE_DIGEST` is its only copy), no child processes, no state of any
  kind (no per-session marker, no temp file, no cache): every call is judged alone, which is what makes it survive a
  `/compact` and cost nothing to invalidate.
- Never `permissionDecision: 'allow'`, `'ask'` or `'defer'`; never `updatedInput`; never `continue`, `stopReason`,
  `suppressOutput` or `terminalSequence`; never the legacy top-level `decision`/`reason` pair.
- Never exit non-zero (exit 2 is a second deny protocol; the JSON one is this contract). Never write to stderr.
- Never read an environment variable other than the six named — not `CLAUDE_CODE_SUBAGENT_MODEL`, not
  `CLAUDE_PROJECT_DIR`; never read `permission_mode`, `effort`, `prompt`, `subagent_type` or anything in the payload
  beyond `hook_event_name`, `tool_name` and `tool_input.model`.
- Never echo payload content into any output — the deny text is fixed; W-OPTOUT echoes nothing at all, not even the
  environment variable's value.
- Never emit the marker anywhere but `permissionDecisionReason`.
- Never trim, lowercase or otherwise repair the model value — `Opus` is denied, not corrected; correcting it would be
  `updatedInput` under another name.
- Never a second rendering of the table: both texts come from `roleLine(ROLE_DIGEST)` and from nothing else.

### S1.8 — Open points (undecided here; each with a recommendation)

1. **`systemMessage` beside a decision is unobserved.** Today's recordings were a bare deny and a bare
   `additionalContext`; nobody has yet seen a `systemMessage` rendered on an interactive host next to either.
   Recommendation: keep `systemMessage` (the documented user-visible field; PreToolUse does not list it as discarded)
   and have the Opus reviewer run ONE interactive probe — `ANTHROPIC_DEFAULT_OPUS_MODEL=x claude`, one Agent call on
   `sonnet` — and record what appears; if nothing does, the fallback is appending the warning to `additionalContext`
   (model-visible, so the model tells the person), never a deny.
2. **`STDIN_LIMIT` at 256 KiB** means an Agent payload above it (a brief past ~64 k tokens) is never judged.
   Recommendation: keep the precedent's value; raise only if E4's recorded trace shows a real payload anywhere near it.
3. **The digest shows the table's first column and nothing else** — `judge`, not "reviewer, architect, scenarios,
   brief" — and the four excluded tasks see nothing more. Recommendation: keep it so. The lever is E1's first column: a
   longer role name there flows into both texts through the test, whereas words added to the hook are the untested
   second statement §3.1 forbids. The byte tests bound how far E1 can go (≈ 240 B of headroom in the deny, ≈ 50 B in
   the teach — with E1's current names).
4. **`CLAUDE_CODE_SUBAGENT_MODEL` without `_FORCE`.** The rule says it stays unset; the parent's §3.2 names only the
   freezers and `_FORCE` for the warning. Recommendation: not read — an explicit alias on every call makes it moot, and
   every extra variable widens S1.7; revisit only if the rule's "stays unset" is to be enforced rather than stated.
5. **The table locator keys on the header's second cell being `Model`.** Recommendation: E1 keeps that header; if it
   changes, `parseRoleTable`'s one normalised string changes, never the assertions.
6. **Two copies, two teaches.** In connect_other_ais the user-level and project-level copies both fire: two
   `additionalContext` entries (~150 tokens) and two warnings per launch. Recommendation: accept; the stricter deny wins
   by host precedence and S2's `--check` closes the version window; not S1's to solve.
7. **`Task` beside `Agent`.** The host says `Agent`; `Task` is the older name. Recommendation: keep both in the hook and
   in S3's matcher — zero cost, and an older CLI or a rollback is then covered.

## S2 — The installer

- **Models.** Brief by Opus; code by Sonnet; review by Opus.
- **Scope.** `tools/install-user-hook.mjs` (`--install` default, `--uninstall`, `--check`) and its test against a temporary
  home, with every requirement of the parent's §3.2 installer list and §4 *Installer* cases.

## S3 — Wiring and self-hosting

- **Models.** Sonnet, from this brief; review by Opus.
- **Brief.** `settings/settings.json`: a second `PreToolUse` entry, matcher `Agent|Task`, `node` +
  `${CLAUDE_PROJECT_DIR}/.claude/hooks/subagent-model.mjs` (the `build-flags` entry's shape at `settings/settings.json:24`).
  Copy the hook and the settings onto this repository's `.claude/` (self-hosting, `tools/adapter-check.test.mjs:48-50`).
  `tools/adapter-check.test.mjs`: `whole()` (`:36`) copies three hooks; the bare-repository case (`:55`) counts four
  findings. `research/module_tests.md` gains the two new test files.

## S4 — Harness preparation

- **Models.** Inventory by two Sonnet scouts (one per group of repositories); each opt-out patch by a Sonnet coder from
  an Opus brief; proofs judged by Opus.
- **Scope.** Every launcher of `claude` on this machine that must not be steered sets `SUBAGENT_MODEL_GUARD=off`
  (WSL: through `WSLENV`); each proved by an otherwise-denied call through the REAL launcher; the benchmark's PR (status
  line, three citations, the opt-out) merged first; the restart list for processes already running; all recorded in
  `research/RESULTS_subagent_model_tiers.md`.
- **What the inventory found** (RESULTS § *Host facts*): three launchers measure models — the connect_other_ais bench
  judge, the benchmark's subject runtime, and the scout calibration on another session's unmerged branch. No launcher
  goes through WSL, so `WSLENV` is not needed. **Deviation:** each opt-out is proved by its launcher's own unit test
  (the variable is in the child's environment, everything else inherited) plus the hook's opt-out test (that variable
  silences it) — not by a paid real-launcher run, which for the judge (`--max-turns 1`) cannot even reach an Agent call.
  The calibration branch cannot be edited from here; its plan now carries the requirement.

## S5 — The self-install (D13)

- **Models.** Brief by Opus; code by Sonnet; the security finding on it judged by Fable; review by Opus.
- **Scope.** `settings/hooks/ensure-user-guard.mjs` (SessionStart), the installer's core extracted to
  `settings/hooks/lib/user-guard-install.mjs` (used by it and by the CLI), `GUARD_VERSION` in the guard, the optout
  marker written by `--uninstall` and cleared by `--install`, `--force`, the provenance manifest, the dirty-source
  refusal, the never-silent newer-installed line; `tools/ensure-user-guard.test.mjs`. NOT wired into any settings file
  here — that is E4.S4, in the release commit.
- **Handlers, not groups.** The merge and the removal work on OUR handler (identified by `args[0]` = the installed
  hook path), never on a whole matcher group: a group shared with someone else's handler keeps that handler and its
  matcher through install, re-install and uninstall, and a group is dropped only when we emptied it.
- **No silent refusal.** The hook file is copied only AFTER `settings.json` was written, so a refused install leaves
  nothing behind; and the self-install treats a copy as current only when its version is >= the source's AND the
  registration is valid AND the provenance manifest matches the installed bytes' sha256 — otherwise it repairs.
- **A valid registration is the full shape.** Ownership (a handler whose `args[0]` is our path, used for removal) is
  kept apart from validity: one PreToolUse group with matcher exactly `Agent|Task` holding exactly one
  `{type:"command", command:"node", args:[<our path>]}`; `--check`'s drift report and the self-install share that one
  predicate, so a changed matcher or command is repaired instead of reported as current.
- **Newer + invalid registration.** The no-downgrade rule stands, but a newer installed copy that is not validly
  registered gets its registration repaired (settings.json only, with the installer's backup/re-read/atomic-write
  safety); the newer hook bytes and their manifest are left untouched. Newer and validly registered keeps the old line.
- **Interrupted self-install.** An interrupted self-install (killed by the host's SessionStart timeout between any two steps) is repaired by the next session start — tested for each step.
- **Never from the reference repository.** The self-install skips (action `skipped`, nothing written) when the source's project root has the conventions repository's own layout (`tools/rules.mjs` and `settings/hooks/subagent-model.mjs` both present): that checkout is where guards are developed, ahead of any release, so only a consumer, whose hook arrives through a released pin, installs into the user's home.
- **Decision.** The read-compare-rename window is now opened at session start, not only by an operator: accepted by
  the operator 2026-10-13 — a write by the host inside those milliseconds would be lost; the self-install runs only
  when the installed copy is missing, older or unregistered, not on every start.

## Order

S1's scout → S1's spec → {S1's code ∥ S2 ∥ S3} → S4 (needs the hook to prove against) → the epic's code round → PR,
merged after E1.
