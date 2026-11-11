# Shared rules — § 7 acceptance evidence, 2026-11-10

The bounded native smoke of `todo/PLAN_shared_rules_claude_codex.md` § 7, "Claude from root / Codex from root", run with
`tools/smoke-rules.mjs` from each consumer's own mount, in a disposable worktree of the consumer's `main`, for both agents
one after the other (`nice`). The plan's § 7 pass condition has two parts. **Part 1:** the recorded trace shows every expected rule read in full
with its hash matching (here also: the CLI finished, the output not cut, Git HEAD/index/status unchanged). **Part 2:**
the row's observable is seen in the recorded answer or the checkout state; for "Claude / Codex from root" that is
ENTRY and PROJECT read and no body loaded by a second path. Every run below passes part 1. **Part 2 is owed for
every run:** the harness says `behavior requires review`, the Codex answers do not name ENTRY or PROJECT, and a
second-path load is not recorded (corrected after CodeRabbit on #152; the harness is being taught to record both). **Update, the same evening:** the harness now records both. On the trace, as the harness classifies it, the rerun below passes part 2 for every run, and also for mcp and sidecar_rust on their migration branches. Under § 7's literal sentence, part 2 is not shown by the final answers, and the owner decides draft PR #156. The final answers are not kept here (a report is
up to 32 KiB); the trace itself is never stored, only its size and sha256. Planned files: `src/Example.cs` and
`src/example.ts` (C# and TypeScript rules selected), except creds, whose run named two real files.

Each block is generated from the run's report (`.git/worktrees/<wt>/rules-smoke/latest-<agent>.json` at the time).

## dew_flow_creds_for_devs

Consumer commit (worktree HEAD) for both runs below: `dc6fa09` (the head of PR #328, worktree `creds-smoke-328`).

**codex** — part 1 (reads) PASS · started 2026-11-10T12:42:58.108Z · linux · pin `5e73780` (pinned submodule) · files `src_minimalapi_server/src/Program.cs`, `src_vs_code/src/extension.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 211430 B, sha256 `8bcca9db3b64e0519734560bcbcc214c1741127e55ab1abdd7a128f6ca71eb33`; models []
- rules read in full (7 of 7): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.logging-serilog` `e7c43d5c52ec`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: no; PROJECT named: no; a second-path load: not recorded by the harness — **OWED**

**claude** — part 1 (reads) PASS · started 2026-11-10T12:44:24.111Z · linux · pin `5e73780` (pinned submodule) · files `src_minimalapi_server/src/Program.cs`, `src_vs_code/src/extension.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 424018 B, sha256 `a31496202311a1d389bb760adc26928190c7fab969466d0b8045226d9fd57b49`; models ["claude-opus-5-5"]
- rules read in full (7 of 7): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.logging-serilog` `e7c43d5c52ec`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: yes; PROJECT named: yes; a second-path load: not recorded by the harness — **OWED**

## dew_flow_connect_other_ais

Consumer commit (worktree HEAD) for both runs below: `ee8ad53`.

**codex** — part 1 (reads) PASS · started 2026-11-10T19:31:10.602Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 438365 B, sha256 `ce84b4560405b667cd4714df934aba25e197f9f018bc06f805077702340c952c`; models []
- rules read in full (8 of 8): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `local.common.review-gate` `5a8567d94f0b`, `local.common.vendor-routing` `c3d885655ab3`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: no; PROJECT named: no; a second-path load: not recorded by the harness — **OWED**

**claude** — part 1 (reads) PASS · started 2026-11-10T19:32:29.957Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 234936 B, sha256 `f67eb781dd365b3f7d1cd01d163ac24448b9afcefaf7418bb30ca7f8ea208aeb`; models ["claude-opus-5-5"]
- rules read in full (8 of 8): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `local.common.review-gate` `5a8567d94f0b`, `local.common.vendor-routing` `c3d885655ab3`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: yes; PROJECT named: yes; a second-path load: not recorded by the harness — **OWED**

## dew_flow_benchmark

Consumer commit (worktree HEAD) for both runs below: `3958ecc`.

**codex** — part 1 (reads) PASS · started 2026-11-10T19:33:10.981Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 486010 B, sha256 `36deae47f6e0575da028dea96a0b2a0189cb01129aec8f14fef40f07ebacc502`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: no; PROJECT named: no; a second-path load: not recorded by the harness — **OWED**

**claude** — part 1 (reads) PASS · started 2026-11-10T19:34:40.728Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 481084 B, sha256 `1f01560e91e0178cccf9a66166aa6bc7794b07eedaf66cd2af4fa4e5027a6dab`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: yes; PROJECT named: yes; a second-path load: not recorded by the harness — **OWED**

## dew_flow_rag_qln

Consumer commit (worktree HEAD) for both runs below: `f7f4fc4`.

**codex** — part 1 (reads) PASS · started 2026-11-10T19:35:30.467Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 103508 B, sha256 `cd4ac6cbbfb170a9f63be59d8effdabf99fc66d5b924bcad7fc00e456ef42f4e`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: no; PROJECT named: no; a second-path load: not recorded by the harness — **OWED**

**claude** — part 1 (reads) PASS · started 2026-11-10T19:36:21.472Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 300285 B, sha256 `4523f52af21432897394f659c5955051badfb78fc8035bfa2fba41cd627466ef`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: yes; PROJECT named: yes; a second-path load: not recorded by the harness — **OWED**

## wsl_care

Consumer commit (worktree HEAD) for both runs below: `cb8046b`.

**codex** — part 1 (reads) PASS · started 2026-11-10T19:37:01.169Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 487097 B, sha256 `f275dc0fc83f89df65f0de7be4201d6dd4fc8efa5902f7188988f521da0742ed`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: no; PROJECT named: no; a second-path load: not recorded by the harness — **OWED**

**claude** — part 1 (reads) PASS · started 2026-11-10T19:38:02.629Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 216120 B, sha256 `c7d3504810c3148973d228fd9da49ce510960b189745ea3deeb081f91d413a52`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: no; PROJECT named: yes; a second-path load: not recorded by the harness — **OWED**

## dew_flow_vscode_kit

Consumer commit (worktree HEAD) for both runs below: `a9ab150`.

**codex** — part 1 (reads) PASS · started 2026-11-10T19:38:39.731Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 250231 B, sha256 `4c81dc275af83a1836cf7f6d9c0b20c4a5031c6f1e0410a719e214ea7fc4a152`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: no; PROJECT named: no; a second-path load: not recorded by the harness — **OWED**

**claude** — part 1 (reads) PASS · started 2026-11-10T19:39:53.055Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 404475 B, sha256 `b378017a8b98fabc1d38fdeeabffba6610b1f97a0a310bd32151c459d08e4d66`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: yes; PROJECT named: yes; a second-path load: not recorded by the harness — **OWED**

## dew_flow_amd_r9700_tuning_ai

Consumer commit (worktree HEAD) for both runs below: `2ecb356`.

**codex** — part 1 (reads) PASS · started 2026-11-10T19:40:36.501Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 95801 B, sha256 `e72df6e64c0f7765b163fda3be7f2cfca967d0e5ea061dce065b639d00f1a49b`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: no; PROJECT named: no; a second-path load: not recorded by the harness — **OWED**

**claude** — part 1 (reads) PASS · started 2026-11-10T19:41:31.263Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 280627 B, sha256 `83bc202a429bc4f35caf837ddbe4b7729599887e47ee2a900c106b5a64d910c4`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`
- part 2 (the § 7 observable — ENTRY and PROJECT read, no body by a second path): ENTRY named in the recorded answer: yes; PROJECT named: yes; a second-path load: not recorded by the harness — **OWED**

## The rerun with the part-2 harness, 2026-11-10 evening

The same smoke again, in the same worktrees, for both agents, one after the other (`nice`), with
`tools/smoke-rules.mjs` from this repository at `9ad652d` (conventions #154; squash-merged as `afbe426` with the
same `tools/`). That harness records part 2 from the trace itself (`observable`): ENTRY and PROJECT read by a call
that did not fail, any selected rule body loaded outside one run of the resolver, and any call it cannot classify
(a call into a rule folder, or a dynamic command that could reach a rule, without naming a rule file). **On the trace, as the
harness classifies it, all 18 runs pass both parts:** 9 repositories, 2 agents each. Under § 7's literal sentence,
part 2 is not shown by the final answers, and the owner decides draft PR #156 (see "Which evidence shows part 2"
below). Every expected rule was read in full with its hash. ENTRY
and PROJECT were read, no body came by a second path, and no call is unclassified. Seven consumers ran on the
commits of the first runs above (creds on `daa7e05`, the later head of #328). `dew_flow_mcp` (#71) and
`dew_flow_sidecar_rust` (#76) ran on their migration branches, on the committed pin `153e6b5`. The planned files
for sidecar_rust are `src/main.rs` (Rust selects `rust.doctrine`) and `http/sidecar.http`.

How to read a block: the rule hashes here are given in full. `status` is the harness's own unchanged string, and
its "behavior requires review" means only that the final answer is not judged by the harness. § 7 part 2 is the
`observable` line, which the harness reads from the trace. The traces are not kept (each one holds every rule body
and the whole session; only the size and sha256 are recorded). So these results are what the harness reported, and
they are checked by running it again, not from this page: in the consumer worktree at the named commit,
`node <conventions checkout>/tools/smoke-rules.mjs --repo . --agent <codex|claude> --file <file> --file <file>`,
with conventions at `afbe426` or later. The creds worktree moved from `dc6fa09` (the first runs) to `daa7e05`, the
later head of #328: two merges of `main` (release 1.19.0 text, the changelog, the version files) and one docs
commit (two lines in `.agents/PROJECT.md` and the README's old-clone steps). The pin is `5e73780` in both.

**Which evidence shows part 2 (added 2026-11-11, CodeRabbit on #152).** § 7's pass sentence asks for the
observable "in the recorded final answer or in the checkout state". These runs show it in the recorded trace, as the
harness classifies it. The final answers name both ENTRY and PROJECT in 7 of 9 Claude runs (wsl_care and creds name
only PROJECT) and in 1 of 9 Codex runs (r9700). So part 2 passes on the trace, and under the literal sentence it is
not shown by the final answers. Whether the trace is the evidence for a read observable is the owner's decision:
the proposed plan change 2.1 is draft PR #156.

### dew_flow_creds_for_devs

Consumer commit (worktree HEAD) for both runs below: `daa7e05` (worktree `creds-smoke-328`).

**codex** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:39:55.242Z · linux · pin `5e73780` (pinned submodule) · files `src_minimalapi_server/src/Program.cs`, `src_vs_code/src/extension.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 231778 B, sha256 `983fedecb8eaf478357291a7a6c77b6dc5766824242164d08510af1361bd532a`; models []
- rules read in full (7 of 7): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.logging-serilog` `e7c43d5c52ec64437a6ad95ebb5229af3246ac66928bb6805fd4944984ad3265`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

**claude** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:41:22.738Z · linux · pin `5e73780` (pinned submodule) · files `src_minimalapi_server/src/Program.cs`, `src_vs_code/src/extension.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 271306 B, sha256 `95c248353021b857d735ca5b63712ab80a0dfbb455c049374f91142b35a53448`; models ["claude-opus-5-5"]
- rules read in full (7 of 7): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.logging-serilog` `e7c43d5c52ec64437a6ad95ebb5229af3246ac66928bb6805fd4944984ad3265`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

### dew_flow_connect_other_ais

Consumer commit (worktree HEAD) for both runs below: `ee8ad53` (worktree `accept-dew_flow_connect_other_ais`).

**codex** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:41:58.830Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 407561 B, sha256 `4352878086a83b943b29fd66ceff33e3703a9009de394f8e80839fffa858631c`; models []
- rules read in full (8 of 8): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `local.common.review-gate` `5a8567d94f0b`, `local.common.vendor-routing` `c3d885655ab3`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

**claude** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:43:27.083Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 273726 B, sha256 `6b7674c3b3b344c6ac38a05cf30f97265969075c84789837036d5cc04859f993`; models ["claude-opus-5-5"]
- rules read in full (8 of 8): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `local.common.review-gate` `5a8567d94f0b`, `local.common.vendor-routing` `c3d885655ab3`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

### dew_flow_benchmark

Consumer commit (worktree HEAD) for both runs below: `3958ecc` (worktree `accept-dew_flow_benchmark`).

**codex** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:44:01.662Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 468412 B, sha256 `b711dadbee0d45ca22bd362dc8bf5e04bb533c015b55611a1e340e1f162f82ed`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

**claude** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:45:26.256Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 488408 B, sha256 `b3a5205c8001d090980aa3a72fa1b17a6b3efd47be149daea83fc7dd1991100b`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

### dew_flow_rag_qln

Consumer commit (worktree HEAD) for both runs below: `f7f4fc4` (worktree `accept-dew_flow_rag_qln`).

**codex** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:37:20.371Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 103623 B, sha256 `0876e227f8c86ddb4c2c890b52adeda07a5012199bd1d165fdb9e8b2397315d1`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

**claude** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:38:12.632Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 304674 B, sha256 `a4a51f40d5129034dee1ce048727809c51d19f140fd73f4ac7c32b128ea03027`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

### wsl_care

Consumer commit (worktree HEAD) for both runs below: `cb8046b` (worktree `accept-wsl_care`).

**codex** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:46:13.533Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 512242 B, sha256 `369e2e4f8c123b69aafe204dbfa8d0377cbd5783d7154bde296c45d1861dcd16`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

**claude** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:48:16.525Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 215334 B, sha256 `eead36c2048fd4d1c212726289f12aa15a247b6e55599ed353147a2e233d434f`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

### dew_flow_vscode_kit

Consumer commit (worktree HEAD) for both runs below: `a9ab150` (worktree `accept-dew_flow_vscode_kit`).

**codex** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:48:48.386Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 247911 B, sha256 `ed317e90dbe96a6a3c6565076e5dac2aad796602705a88c4973e32a9a05dc6bc`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

**claude** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:50:03.697Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 405847 B, sha256 `e79729a76324def8a827d20c61d2111118e973d061776415432555150317c72f`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

### dew_flow_amd_r9700_tuning_ai

Consumer commit (worktree HEAD) for both runs below: `2ecb356` (worktree `accept-dew_flow_amd_r9700_tuning_ai`).

**codex** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:50:36.067Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 95682 B, sha256 `1beab1b2ffc7a9ba5cbf6ed0601d7fd5081b05677381dc49dc466dda44158d06`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

**claude** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:51:26.437Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 278784 B, sha256 `9af7cffe843f2c8c1af305fb4cfb998f20bf5f225a03015745134a1b8ebb9ae4`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

### dew_flow_mcp

Consumer commit (worktree HEAD) for both runs below: `64f42d0` (worktree `mcp-migration`, the head of PR #71 at the run; its later `5d89c22` changes only a README line).

**codex** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:51:58.995Z · linux · pin `153e6b5` (pinned submodule) · files `src/Mcp.Server/Example.cs`, `http/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 104072 B, sha256 `636e4bb1f42d9a2157570f06d020dcf32072c0d1ed7c0bbd9063f72a6d0025b0`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

**claude** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:52:51.331Z · linux · pin `153e6b5` (pinned submodule) · files `src/Mcp.Server/Example.cs`, `http/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 287166 B, sha256 `a99da1b2fced4e8b961774b0877f3d351e8270920641c20fb0b678d48e215c1b`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `csharp.doctrine` `b8ecae510e0fc421761418d3c19d2d4bf6996854b291c6e17fc8141c3bcd6c5a`, `typescript.doctrine` `90a8939f3004a8e81948867c3904bf66873bc8ef9ad4e196f8d2757769afef9a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

### dew_flow_sidecar_rust

Consumer commit (worktree HEAD) for both runs below: `a691935` (worktree `rs-migration`, the head of PR #76).

**codex** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:57:02.286Z · linux · pin `153e6b5` (pinned submodule) · files `src/main.rs`, `http/sidecar.http`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 229628 B, sha256 `3368d45f75faf7c35f5af08bca396f187b57ca3de2ec93f0d165b2c38d8f7581`; models []
- rules read in full (8 of 8): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.testing` `05ba365bbb16e70bee6927e069a0d37f808365938b27f49286555d2185dd9b74`, `common.http-contracts` `c19e1e22a62a1ed639170a464f4c9c3048704983ee399da13c8005c2803c5efd`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.logging-serilog` `e7c43d5c52ec64437a6ad95ebb5229af3246ac66928bb6805fd4944984ad3265`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `rust.doctrine` `5f112e562597ace8d676a3109088556947f8f76a15c1a997197985092da84c3a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

**claude** — part 1 (reads) PASS · part 2 (observable) PASS · started 2026-11-10T20:58:34.630Z · linux · pin `153e6b5` (pinned submodule) · files `src/main.rs`, `http/sidecar.http`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 441780 B, sha256 `a97e3cae00971afc16a83f69de1924a340bed7524ee4d6150013906c9eedb9d2`; models ["claude-opus-5-5"]
- rules read in full (8 of 8): `common.coding-style` `0ba570017a0414b2e46ec95307dbbc2703671293fd69ab7982a92964cf215ae7`, `common.testing` `05ba365bbb16e70bee6927e069a0d37f808365938b27f49286555d2185dd9b74`, `common.http-contracts` `c19e1e22a62a1ed639170a464f4c9c3048704983ee399da13c8005c2803c5efd`, `common.knowledge-base` `44712b79711c35be53ac5b7af8f14f4a2768434bb9f31779e5e20dccdab5ff68`, `common.logging-serilog` `e7c43d5c52ec64437a6ad95ebb5229af3246ac66928bb6805fd4944984ad3265`, `common.security` `47bbde205659cfc62a2fe57340d808483dd18b50762e13ce6af4d13a246c20a5`, `common.task-lifecycle` `2769609f1163c9ab7f32e7ee89f3834b3a4cb2c92a01d95867ea0ae26967c4bc`, `rust.doctrine` `5f112e562597ace8d676a3109088556947f8f76a15c1a997197985092da84c3a`
- part 2 (the § 7 observable, recorded by the harness): ENTRY read yes; PROJECT read yes; a rule body by a second path: none; unclassified calls: none

## Fresh clones, 2026-11-11

The matrix asks for a fresh clone per consumer. For the six below, the first runs used a worktree of the local
clone's `main` (CodeRabbit on #152). Each was cloned again from GitHub over HTTPS into an empty folder, with only
the `.agents/conventions` submodule initialised (as the consumers' CI does), the resolver's packages installed
(`npm ci --ignore-scripts`), and every rule check run. All six are on release `26589a5` by then (the 2026-11-11
pin bumps). creds has its fresh clone in story 3.C, and mcp in #71. sidecar_rust has no fresh clone with a build
here, because the Rust build cannot run on this machine; its CI built and tested it on both legs.

| Repository | `main` | Pin | `rules check` | `explain --task inspect` | Checks | Status lines after | Time (UTC) |
|---|---|---|---|---|---|---|---|
| dew_flow_connect_other_ais | `63a868f2` | `26589a5` | resolved | resolved | adapter-check OK pin-check OK gate-snippet-check OK | 0 | 2026-11-11T00:36:18Z |
| dew_flow_benchmark | `3079acf` | `26589a5` | resolved | resolved | adapter: none (story 3.B) pin-check OK gate-snippet-check OK | 0 | 2026-11-11T00:36:29Z |
| dew_flow_rag_qln | `b55d283` | `26589a5` | resolved | resolved | adapter-check OK pin-check OK gate-snippet-check OK | 0 | 2026-11-11T00:36:35Z |
| wsl_care | `776d737` | `26589a5` | resolved | resolved | adapter-check OK pin-check OK gate-snippet-check OK | 0 | 2026-11-11T00:36:41Z |
| dew_flow_vscode_kit | `fd905be` | `26589a5` | resolved | resolved | adapter-check OK pin-check OK gate-snippet-check OK | 0 | 2026-11-11T00:36:46Z |
| dew_flow_amd_r9700_tuning_ai | `b550f52` | `26589a5` | resolved | resolved | adapter-check OK pin-check OK gate-snippet-check OK | 0 | 2026-11-11T00:36:50Z |

## Rollback, tried 2026-11-10

Each migration commit reverted in a disposable clone, then `.agents/conventions` removed, `git submodule sync`, `git submodule update --init .claude/rules/shared`:

- dew_flow_connect_other_ais: migration `8d42647` reverted (exit 0), the tree equals its parent's, the old mount is back at `895b24c` (2026-09-10) with that era's tools — `rules.mjs`, `pin-check.mjs`, `smoke-rules.mjs` are there and `pin-check` runs (stale, as an old pin is); `low-priority.mjs` did not exist yet at that pin, so the first scripted check's "old-tools=missing" was only that file; status clean, 2026-11-10T19:31:50Z.
- dew_flow_benchmark: migration 89b4909 revert=0 tree-equals-parent=yes old-pin=e29883f old-tools=present low-priority=ok status=0 2026-11-10T19:32:01Z
- dew_flow_rag_qln: migration d83315b revert=0 tree-equals-parent=yes old-pin=cc24f9e old-tools=present low-priority=ok status=0 2026-11-10T19:32:05Z
- wsl_care, dew_flow_vscode_kit, dew_flow_amd_r9700_tuning_ai: **none by construction** — each joined the family on the neutral layout (2026-10-02, 2026-10-02, 2026-11-01) and never had the legacy mount, so there is no migration commit to revert (the plan's § 6 matrix rule).
- dew_flow_creds_for_devs: `75c1f1f` reverted — the tree is its parent's, the old mount at `37b9aa5` is back, its tools and the low-priority wrapper run, the tree is clean (recorded in story 3.C).
- dew_flow_mcp (#71): the branch squashed onto `main` in a disposable clone, then that commit reverted — the tree equals `main`, the old mount is back at `1341995`, its tools and the low-priority wrapper run, the tree is clean (2026-11-10, in #71).
- dew_flow_sidecar_rust (#76): the same on a fresh GitHub clone — the branch at `c446c69` squashed onto `main` `d816757`, one revert gives the tree of `main`, the old mount is back at `1341995` (its pin-check says stale, as the pin of `main` is), the low-priority wrapper runs, the tree is clean (2026-11-10).
  Tried again on `a691935`, the head the rerun tested (`c446c69` plus one README line): the same result, 2026-11-10T21:02:43Z.
