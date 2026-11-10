# Shared rules — § 7 acceptance evidence, 2026-11-10

The bounded native smoke of `todo/PLAN_shared_rules_claude_codex.md` § 7, "Claude from root / Codex from root", run with
`tools/smoke-rules.mjs` from each consumer's own mount, in a disposable worktree of the consumer's `main`, for both agents
one after the other (`nice`). The pass condition is the plan's: every expected rule read in full with its hash matching,
the CLI finished, the output not cut, Git HEAD/index/status unchanged. The final answers are not kept here (a report is
up to 32 KiB); the trace itself is never stored, only its size and sha256. Planned files: `src/Example.cs` and
`src/example.ts` (C# and TypeScript rules selected), except creds, whose run named two real files.

Each block is generated from the run's report (`.git/worktrees/<wt>/rules-smoke/latest-<agent>.json` at the time).

## dew_flow_creds_for_devs

Consumer commit (worktree HEAD) for both runs below: `dc6fa09` (the head of PR #328, worktree `creds-smoke-328`).

**codex** — PASS · started 2026-11-10T12:42:58.108Z · linux · pin `5e73780` (pinned submodule) · files `src_minimalapi_server/src/Program.cs`, `src_vs_code/src/extension.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 211430 B, sha256 `8bcca9db3b64e0519734560bcbcc214c1741127e55ab1abdd7a128f6ca71eb33`; models []
- rules read in full (7 of 7): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.logging-serilog` `e7c43d5c52ec`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`

**claude** — PASS · started 2026-11-10T12:44:24.111Z · linux · pin `5e73780` (pinned submodule) · files `src_minimalapi_server/src/Program.cs`, `src_vs_code/src/extension.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 424018 B, sha256 `a31496202311a1d389bb760adc26928190c7fab969466d0b8045226d9fd57b49`; models ["claude-opus-5-5"]
- rules read in full (7 of 7): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.logging-serilog` `e7c43d5c52ec`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`

## dew_flow_connect_other_ais

Consumer commit (worktree HEAD) for both runs below: `ee8ad53`.

**codex** — PASS · started 2026-11-10T19:31:10.602Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 438365 B, sha256 `ce84b4560405b667cd4714df934aba25e197f9f018bc06f805077702340c952c`; models []
- rules read in full (8 of 8): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `local.common.review-gate` `5a8567d94f0b`, `local.common.vendor-routing` `c3d885655ab3`, `typescript.doctrine` `90a8939f3004`

**claude** — PASS · started 2026-11-10T19:32:29.957Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 234936 B, sha256 `f67eb781dd365b3f7d1cd01d163ac24448b9afcefaf7418bb30ca7f8ea208aeb`; models ["claude-opus-5-5"]
- rules read in full (8 of 8): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `local.common.review-gate` `5a8567d94f0b`, `local.common.vendor-routing` `c3d885655ab3`, `typescript.doctrine` `90a8939f3004`

## dew_flow_benchmark

Consumer commit (worktree HEAD) for both runs below: `3958ecc`.

**codex** — PASS · started 2026-11-10T19:33:10.981Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 486010 B, sha256 `36deae47f6e0575da028dea96a0b2a0189cb01129aec8f14fef40f07ebacc502`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`

**claude** — PASS · started 2026-11-10T19:34:40.728Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 481084 B, sha256 `1f01560e91e0178cccf9a66166aa6bc7794b07eedaf66cd2af4fa4e5027a6dab`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`

## dew_flow_rag_qln

Consumer commit (worktree HEAD) for both runs below: `f7f4fc4`.

**codex** — PASS · started 2026-11-10T19:35:30.467Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 103508 B, sha256 `cd4ac6cbbfb170a9f63be59d8effdabf99fc66d5b924bcad7fc00e456ef42f4e`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`

**claude** — PASS · started 2026-11-10T19:36:21.472Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 300285 B, sha256 `4523f52af21432897394f659c5955051badfb78fc8035bfa2fba41cd627466ef`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`

## wsl_care

Consumer commit (worktree HEAD) for both runs below: `cb8046b`.

**codex** — PASS · started 2026-11-10T19:37:01.169Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 487097 B, sha256 `f275dc0fc83f89df65f0de7be4201d6dd4fc8efa5902f7188988f521da0742ed`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`

**claude** — PASS · started 2026-11-10T19:38:02.629Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 216120 B, sha256 `c7d3504810c3148973d228fd9da49ce510960b189745ea3deeb081f91d413a52`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`

## dew_flow_vscode_kit

Consumer commit (worktree HEAD) for both runs below: `a9ab150`.

**codex** — PASS · started 2026-11-10T19:38:39.731Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 250231 B, sha256 `4c81dc275af83a1836cf7f6d9c0b20c4a5031c6f1e0410a719e214ea7fc4a152`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`

**claude** — PASS · started 2026-11-10T19:39:53.055Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 404475 B, sha256 `b378017a8b98fabc1d38fdeeabffba6610b1f97a0a310bd32151c459d08e4d66`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`

## dew_flow_amd_r9700_tuning_ai

Consumer commit (worktree HEAD) for both runs below: `2ecb356`.

**codex** — PASS · started 2026-11-10T19:40:36.501Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 95801 B, sha256 `e72df6e64c0f7765b163fda3be7f2cfca967d0e5ea061dce065b639d00f1a49b`; models []
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`

**claude** — PASS · started 2026-11-10T19:41:31.263Z · linux · pin `1341995` (pinned submodule) · files `src/Example.cs`, `src/example.ts`

- status: source reads verified; behavior requires review; exit 0; timed out false; output cut false; HEAD/index/status unchanged true
- trace: 280627 B, sha256 `83bc202a429bc4f35caf837ddbe4b7729599887e47ee2a900c106b5a64d910c4`; models ["claude-opus-5-5"]
- rules read in full (6 of 6): `common.coding-style` `0ba570017a04`, `common.knowledge-base` `44712b79711c`, `common.security` `47bbde205659`, `common.task-lifecycle` `2769609f1163`, `csharp.doctrine` `b8ecae510e0f`, `typescript.doctrine` `90a8939f3004`

## Rollback, tried 2026-11-10

Each migration commit reverted in a disposable clone, then `.agents/conventions` removed, `git submodule sync`, `git submodule update --init .claude/rules/shared`:

- dew_flow_connect_other_ais: migration `8d42647` reverted (exit 0), the tree equals its parent's, the old mount is back at `895b24c` (2026-09-10) with that era's tools — `rules.mjs`, `pin-check.mjs`, `smoke-rules.mjs` are there and `pin-check` runs (stale, as an old pin is); `low-priority.mjs` did not exist yet at that pin, so the first scripted check's "old-tools=missing" was only that file; status clean, 2026-11-10T19:31:50Z.
- dew_flow_benchmark: migration 89b4909 revert=0 tree-equals-parent=yes old-pin=e29883f old-tools=present low-priority=ok status=0 2026-11-10T19:32:01Z
- dew_flow_rag_qln: migration d83315b revert=0 tree-equals-parent=yes old-pin=cc24f9e old-tools=present low-priority=ok status=0 2026-11-10T19:32:05Z
- wsl_care, dew_flow_vscode_kit, dew_flow_amd_r9700_tuning_ai: **none by construction** — each joined the family on the neutral layout (2026-10-02, 2026-10-02, 2026-11-01) and never had the legacy mount, so there is no migration commit to revert (the plan's § 6 matrix rule).
- dew_flow_creds_for_devs: `75c1f1f` reverted — the tree is its parent's, the old mount at `37b9aa5` is back, its tools and the low-priority wrapper run, the tree is clean (recorded in story 3.C).
