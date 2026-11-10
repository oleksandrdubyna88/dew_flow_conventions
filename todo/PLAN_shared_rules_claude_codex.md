---
paths: ["__conventions_planning_documentation_only__/**"]
---
# PLAN — единый источник правил для Claude Code и Codex

> Status: **IN PROGRESS, epoch 2 open since 2026-11-09** (the plan stopped on entry 1.2 and was reviewed again the same day: coai plan gate `proceed`, 2 of 2 reviewers, and the own Opus review; their accepted findings are the epoch-2 baseline). Scope: общий контракт инструкций, подключение Claude Code/Codex и миграция потребителей conventions (the six of 2026-09-09 and every repository that joined since — nine rows in `README.md` § Consumers on 2026-11-09). Resolver, self-host bootstrap, migration tool and smoke harness are shipped (S1 #16, S2 #17); the consumer rollout is part done.
>
> Progress, 2026-11-09 (read from each repository's default branch: `.gitmodules` path and `AGENTS.md` present or
> not): on the neutral layout — `dew_flow_connect_other_ais` (canary, #192), `dew_flow_benchmark` (#113),
> `dew_flow_rag_qln` (#83 and the Claude adapter #85, entry 1.1), and three repositories that joined the family on
> that layout and never had the legacy mount: `wsl_care` (2026-10-02), `dew_flow_vscode_kit` (2026-10-02),
> `dew_flow_amd_r9700_tuning_ai` (2026-11-01, hooks and adapter present, CI runs `leftovers-check`, `plan-lifecycle`
> and `post-deploy-check`; it never needed a migration PR); still on `.claude/rules/shared` with no `AGENTS.md` —
> `dew_flow_mcp`, `dew_flow_sidecar_rust`, `dew_flow_creds_for_devs`.
>
> Progress, 2026-11-10: `dew_flow_creds_for_devs` is on the neutral layout (story 3.C, #328, `75c1f1f`); both agents'
> smoke read every expected rule on its committed pin (part 1 of the § 7 pass condition; part 2, the observable, is
> owed — corrected the same day, see the closing matrix). Still on `.claude/rules/shared`:
> `dew_flow_mcp` and `dew_flow_sidecar_rust` (stories 3.M and 3.R, not selected). Release `9b1d668` is pinned by every
> consumer (conventions #147 and #148; the hook fixes the creds code gate found).
> Later the same day: the owner selected 3.M and 3.R (migration PRs mcp #71 and sidecar_rust #76). The smoke harness
> now records part 2 (conventions #154), and the rerun passes both parts of § 7 for both agents in all nine
> repositories (mcp and sidecar_rust on their migration branches; see the closing matrix).
>
> **The stop, 2026-11-09:** entry 1.2 (the owner moves `dew_flow_creds_for_devs` ahead of
> `dew_flow_sidecar_rust`) is this plan's second change since approval. No consumer migration and no new code on any
> stage of this plan until the whole plan is reviewed again and epoch 2 is open. The re-review (rule step 4) revised
> this whole plan on 2026-11-09; its record is under `## Plan changes`. The plan stays in `todo/` through the
> re-review: `plan-lifecycle.mjs` reads ledgers only there, and epoch 2's line must be written into this ledger. The
> promotion of the shipped design is Stage 4's closing step, after the closing matrix is complete, not a step of the
> stop; nothing of this plan moves to a remainder plan unless the owner defers it, recorded as a plan change then.

## Plan changes

> Epoch 1 · approved 2026-09-10 · by reviewers · state: closed

- 1.1 · 2026-11-04 · owner · build-order — dew_flow_rag_qln migrates before dew_flow_mcp, dew_flow_sidecar_rust and dew_flow_creds_for_devs, not last
  (Stage 3 said rag_qln is checked last, because it pins some of the others as submodules. The owner asked for its
  entry on 2026-11-04: the loader refused the repository and every session there read rules by hand. Its pins do
  not depend on the siblings' layout; its migration PR built and tested green with them unmigrated. This plan was
  approved before the change-control rule reached this repository, so this entry opens its ledger.)
- 1.2 · 2026-11-09 · owner · build-order — dew_flow_creds_for_devs migrates now, before dew_flow_sidecar_rust; sidecar_rust and dew_flow_mcp stay unmigrated
  (Stage 3 says the Rust consumer sidecar_rust is checked first, then creds. The owner asked on 2026-11-09 to fix rule
  loading in creds: the resolver refuses its legacy `.claude/rules/shared` mount and sessions there read rules by
  hand. Asked with three options after consult 806739e5 split (sidecar_rust then creds; only creds and stop this
  plan; wait), the owner chose only creds. No technical dependency was found between the two consumers; the creds
  migration is still to be built. This second change stopped the plan.)

### Re-review for epoch 2

Narrowed: no — the scope grows from the six consumers of 2026-09-09 to every row of `README.md` § Consumers (nine on 2026-11-09; the three that joined on the neutral layout need the acceptance check of § 7, not a migration), the Definition of Done keeps every item of epoch 1 and adds the `git grep` zero-result condition and the product-adapter review per migrated consumer, the merge conditions of a migration PR are written out in § 6 Stage 3 and are the same or stricter than epoch 1's bullets (both agents' smoke must pass, as epoch 1 required), the plan is promoted only after the closing matrix is complete, nothing moves to another plan and nothing is deferred (an owner's deferral would be a plan change of epoch 2, not part of this baseline); the two build-order entries become one selection rule in place of the fixed consumer order (§ 6 Stage 3), which orders the same work and cuts none of it

  (Both changes of epoch 1 were build-order entries by the owner for one cause each: a consumer whose loader refused
  the legacy mount was pulled forward. Consult f54922a3 advised the selection rule, the complete creds checklist and
  the promote-plus-remainder shape; the first two are applied below, the third is Stage 4's closing step because
  the stop rule keeps the ledger in `todo/` until epoch 2 is open. Every row below is a merged pull request, a
  merged direct commit or a pushed commit of this plan; the Opus judge filled Verdict and Action on 2026-11-09.)

| Work | Where | Verdict | Action |
|---|---|---|---|
| S1 — metadata, resolver, bootstrap, tests, migration inventory: conventions #16, `026b20e` | conventions `main`, released | fits | kept |
| S2 — migration tool, gate-copy check on the neutral mount, bounded native smoke: conventions #17, `895b24c` (promoted as `research/PLAN_shared_rules_rollout_tooling.md`) | conventions `main`, released | fits | kept |
| Ledger opened, entry 1.1 (rag_qln before the three siblings): conventions #127, `87274b6` | conventions `main` | fits | kept |
| Entry 1.2 and the stop: `a27f89d` | pushed, unmerged (`origin/docs/shared-rules-entry-1.2`; the base of this re-review branch) | fits | kept; lands with the re-review (open PR #144) |
| Canary — `dew_flow_connect_other_ais` #192, `8d42647`: AGENTS/CLAUDE adapters, PROJECT.md, mount moved to `.agents/conventions` | coai `main` (section name `.claude/rules/shared` kept, path `.agents/conventions`, `branch = release`) | fits | kept; § 7 acceptance owed (closing matrix) |
| `dew_flow_benchmark` #113, `89b4909`: adopt the shared entry | benchmark `main` | fits | kept; § 7 acceptance owed (closing matrix): no Claude adapter on `main` (no `.claude/hooks`), owed by story 3.B |
| `dew_flow_rag_qln` #83, `d83315b`: adopt the shared entry (entry 1.1) | rag_qln `main` | fits | kept; § 7 acceptance owed (closing matrix) |
| `dew_flow_rag_qln` #85, `75b7673`: the Claude adapter hook, `adapter-check` in CI | rag_qln `main` | fits | kept; its unannounced `external/dew_flow_benchmark` move (`469a510` → `2407ac8`, one docs commit) is already superseded by pin PRs #88 and #89, nothing to correct; § 7 acceptance owed |
| `wsl_care` `a8082f0` (2026-10-02): joined on the neutral layout, no legacy mount ever | wsl_care `main`, direct commit | fits | kept; § 7 acceptance owed (closing matrix) |
| `dew_flow_vscode_kit` `34338f4` (2026-10-02): joined on the neutral layout, no legacy mount ever | vscode_kit `main`, direct commit | fits | kept; § 7 acceptance owed (closing matrix) |
| `dew_flow_amd_r9700_tuning_ai` `2578d4e` (2026-11-01): joined on the neutral layout with hooks and adapter, no legacy mount ever | r9700 `main`, direct commit | fits | kept; § 7 acceptance owed (closing matrix) |
| The Claude adapter: `settings/hooks/load-instructions.mjs`, `settings/settings.json`, `tools/adapter-check.mjs`, conventions `524a994` … `d7cfbca` (2026-09-10..11) | conventions `main`, direct commits, released | fits | kept; story 3.C and story 3.B install it, the closing matrix checks it |
| coai's Claude adapter: `f6c1b0d`, `b415232` (2026-09-10, `.claude/hooks/load-instructions.mjs`, `adapter-check` test in CI) | coai `main`, via PR #195 (merge `d5ee8bf`) | fits | kept; § 7 acceptance owed (closing matrix, with #192) |

> Epoch 2 · approved 2026-11-09 · by reviewers · state: open

## Execution journal — 2026-09-10

Branch: `feat/shared-rules-claude-codex`, base `5d6984ebaa9efd3bae48e25f91f8a1bb3872b54f`.
Plan gate: session `07acef54`, all 3 reviewers answered, `good_enough`, 16 findings
(13 gating); all decisions recorded, server advanced to CodeReview. Accepted: pin/state
verification, bounded reads, explicit CLI inputs, override detection, Node prerequisite,
advisory scope, rollout ownership and fresh contexts for conflicts. Rejected claims already
covered: missing-source fail-closed behavior, mandatory dependencies, always core,
and actual reads rather than self-reported compliance. Persistent read-cache and a duplicate
fallback selector were rejected because they reintroduce stale state/duplication.

Two epics, four stories (each tested, documented and code-reviewed before the next):

**S1 and S2 tooling are implemented (PR #16 and #17).** S3–S4 rollout is not
claimed implemented. S1 acceptance: canonical bodies preserved, deterministic validated
selection and source bootstrap work, existing tools remain green on Windows/WSL, new behavior
is exercised through real CLI calls. Full live-agent/consumer rollout is acceptance of S2–S4.
The coai server reviews commit SHAs, not an unstaged working tree; a local review-snapshot
commit is required before review. It is not pushed or shipped until findings are resolved.

1. **Shared delivery**
   - S1: metadata on all 24 original bodies, validated resolver, source bootstrap,
     deterministic tests, CI and migration inventory. Merged in PR #16.
   - S2: migration tooling, compatibility checks and bounded real-agent smoke harness.
2. **Consumer rollout**
   - S3: isolated ConnectOtherAIs canary, Rust and CredsForDevs migrations.
   - S4: MCP, benchmark, then rag; reviewed pins/PRs, fresh clone and rollback,
     six-consumer journal and documentation.

The gate's autonomous-work and story-review commands apply. Its Fable/Opus assignment
cannot be honored by switching this running session; work uses the current Codex session,
with actual reviewer/model availability reported rather than impersonated.

Clarifications: hashes normalize CRLF to LF; file arguments are root-relative and task/file
flags repeat. Consumer preflight compares actual SHA to the index gitlink and reports HEAD
separately, so a staged migration is not called committed. Unresolved scoped overrides fail
closed; user/managed host inputs retain priority and remain outside resolver visibility.
Node 20+ and locked npm dependencies are required. No claim is made that advisory Markdown
mechanically gates every model write. No persistent read state is trusted after compaction.

Environment: Windows Codex 0.153.4, Claude Code 2.1.258; WSL Claude Code 2.1.197,
Node 20.20.2. WSL `codex` points to the Windows npm package and fails with missing
`@openai/codex-linux-x64`; no install/login or global configuration change was made.

The design below records the approved target; unchecked rollout items remain pending.

S1 checkpoint `8c5a418`: 53 deterministic cases, all pass on WSL; Windows has one
explicit symlink-privilege skip. Code review round 1: all 12 reviewers answered, `revise`,
34 findings; 8 accepted (including overlapping diagnostic findings), every decision recorded
in `research/shared-rules-review-s1.json`. Root-target hang and core-budget classification
were reproduced RED and fixed GREEN. Required PROJECT documents and dependency-load errors
are now validated. Remaining review round is pending on the corrected commit.

Real self-host inspection: Claude completed and its source-read trace matched the selected
hashes. Codex read canonical sources but hit its subscription usage limit before final completion;
recorded as incomplete. This does not stop deterministic work or imply a successful Codex rollout.

S1 code round 2 on `27f3150`: **proceed**, all 3 selected reviewers answered (architecture
round; this was not the earlier 12-reviewer panel). Decisions recorded for all 11 returned
entries, including prior-round entries carried forward. Accepted the new HTTP→testing
dependency; other claims were either already fixed in 27f3150 or rejected with source evidence.
The gate session is Done. HTTP selection was reproduced RED and fixed GREEN before the
final S1 commit. WSL nested Claude smoke also completed successfully. S1 is complete;
S2–S4 and complete Codex behavioral acceptance remain open.

Consumer boundary (also recorded in coai's `todo/PLAN_shared_rules_adoption.md`):

| Item | Implemented by | Dependency |
|---|---|---|
| Canonical rules, resolver, migration and bounded smoke tools | Conventions S1/S2 | Reviewed source lands first |
| Reviewer discovery, panel gate lookup, generated distributable gate text and CI | ConnectOtherAIs adoption plan | Pin reviewed source, verify canary before publishing other consumers |
| Rust/Creds and MCP/benchmark/rag adoption | S3/S4 of this plan | Canary accepted; pinned-by repositories last |

These slices are disjoint: coai does not implement another rule selector, and conventions
does not own product discovery. S2 gate session `3f126e89` reached Done after `proceed`
with 3/3 architecture reviewers; coai plan session `8e812028` reached CodeReview with
3/3 plan reviewers and every returned finding resolved. Native Codex acceptance is still incomplete.

Цель: правило редактируется один раз и применяется обоими агентами. У каждого потребителя один закреплённый checkout conventions; тексты правил не копируются в отдельные версии для Claude и Codex. Различаются только способы подключения и настройки исполняющей среды.

Этот план конкретизирует раздел 2 и часть разделов 3/5/6 [общего backlog](PLAN_product_improvements.md). Исправления F1–F4/F6–F9 из [аудита](REVIEW_product_audit_2026-09-09.md) остаются в общем backlog. Здесь — загрузка правил, F5, совместимость агентов и переход на новую структуру. Ни настройки агентов, ни submodules потребителей этим документом не изменены.

Frontmatter нужен, пока conventions целиком монтируется внутрь `.claude/rules/shared`: этот план не должен становиться действующим правилом. Статус размещён после frontmatter и заголовка.

## 1. Рекомендуемое решение

**Общая точка входа — `AGENTS.md`. `CLAUDE.md` импортирует её. Канонические правила лежат в одном submodule вне `.claude/rules/`.**

```text
consumer/
├── AGENTS.md                        # короткое указание прочитать общий контракт и правила проекта
├── CLAUDE.md                        # только @AGENTS.md
├── .agents/
│   ├── PROJECT.md                   # единственный текст правил именно этого проекта
│   ├── rules/                       # локальные тематические правила, если нужны
│   └── conventions/                 # один git submodule, один закреплённый SHA
│       ├── ENTRY.md                 # общий порядок загрузки и выбора правил
│       ├── common/                 # канонические общие правила
│       ├── csharp/
│       ├── rust/
│       ├── typescript/
│       ├── tools/                   # те же проверки для обоих агентов
│       └── ...                     # docs/todo/fixtures не входят в payload инструкций
├── .claude/settings.json            # адаптер полномочий/tools для Claude
└── .codex/config.toml               # адаптер полномочий/tools для Codex, если нужен
```

Это **целевая структура**, перечисленные новые файлы и новые команды пока не созданы. Пути `common/`, `csharp/`, `rust/`, `typescript/`, `tools/` внутри conventions сохраняются, чтобы не совмещать перенос mount с массовым переименованием всех правил.

Re-review note, 2026-11-09: the structure above is built and shipped. `ENTRY.md`, `tools/rules.mjs`,
`tools/migrate-rules.mjs`, `tools/smoke-rules.mjs`, `tools/adapter-check.mjs` and the reference adapter in
`settings/` exist in this repository (S1 #16, S2 #17 and later releases); six repositories run on it (status
block). The paragraph above is kept as the approved design text, not as a statement of what exists.

Предлагаемый `AGENTS.md` содержит только подключение, без пересказа правил:

```markdown
# Project instructions

Before working in this repository, read and apply `.agents/conventions/ENTRY.md`
and `.agents/PROJECT.md`. Follow the shared entry's rule-selection procedure
for the task and the files you will inspect or change.
Resolve these paths from this repository's root, including when started in a subdirectory.
If a required instruction source is missing, report the missing path before changing affected files.
```

Предлагаемый `CLAUDE.md`:

```markdown
@AGENTS.md
```

Короткий bootstrap может быть одинаковым во всех потребителях и проверяться по шаблону: он не содержит копий policy. Правила проекта из существующего `CLAUDE.md` **переносятся**, а не копируются в `.agents/PROJECT.md`. После перехода старый `CLAUDE.md` остаётся только импортом. Восстановить исходное содержимое можно из Git.

## 2. Почему нельзя просто подключить существующий CLAUDE.md к Codex

Проверено 2026-09-09:

| Механизм | Claude Code | Codex | Следствие для плана |
|---|---|---|---|
| Точка входа | `CLAUDE.md`, поддерживает import `@AGENTS.md` | `AGENTS.md`, с учётом `AGENTS.override.md` и иерархии | Один общий bootstrap + однострочный Claude-адаптер |
| Каталог `.claude/rules` | Markdown обнаруживается рекурсивно; есть `paths` | Эквивалентная автоматическая загрузка этого каталога не установлена | Не рассчитывать на неё; использовать общий явный порядок чтения |
| `@file` внутри AGENTS | Может быть импортирован Claude в контексте его механизма imports | Нативное раскрытие Claude-синтаксиса не установлено | В AGENTS писать явное «прочитай файл», пути держать в backticks |
| Размер первоначальных инструкций | Занимает context | `project_doc_max_bytes`, по умолчанию 32 KiB | Не вклеивать весь conventions в AGENTS |

Основания: [OpenAI — AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [OpenAI — configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference), [Claude Code — AGENTS.md и imports](https://code.claude.com/docs/en/memory#agentsmd). Отсутствие установленной поддержки — ограничение проектирования, не утверждение о внутреннем устройстве всех версий клиента.

**Важное ограничение выбранной схемы:** автоматически загружается bootstrap. Чтение файлов, на которые он указывает, — действие агента по инструкции. Это не скрытый импорт всех файлов самим Codex. Текстовая ссылка сама по себе не доказывает, что правило прочитано; это проверяется трассой чтений и сценариями поведения. Жёсткие ограничения исполнения реализуются отдельно настройками/контролями.

Fallback `project_doc_fallback_filenames = ["CLAUDE.md"]` не является основным решением: зависит от настройки Codex и не обеспечивает перенос семантики `.claude/rules`/`paths`. Symlinks также не обязательны: обычные файлы и относительные пути проще проверить на Windows и WSL. Генерация двух полных наборов policy исключается, потому что создаёт две копии текста, даже если они автоматически синхронизируются.

## 3. Что есть сейчас

| Проверенный checkout | Корневой CLAUDE.md | Корневой AGENTS.md | Общий mount |
|---|---|---|---|
| dew_flow_mcp | есть | нет | `.claude/rules/shared` |
| dew_flow_rag_qln | есть | нет | `.claude/rules/shared` |
| dew_flow_sidecar_rust | есть | нет | `.claude/rules/shared` |
| dew_flow_benchmark | есть | нет | `.claude/rules/shared` |
| dew_flow_creds_for_devs | есть | нет | `.claude/rules/shared` |
| dew_flow_connect_other_ais | есть | нет | `.claude/rules/shared` |

Проверялось наличие файлов на диске, не фактическая загрузка инструкций во всех работающих IDE. Глобальные правила или инструкции, добавленные хостом, этой таблицей не исключаются. В этих шести checkout также не обнаружен `.codex/config.toml`.

### 3.1. State on 2026-11-09 (re-review baseline)

Read from each repository's default branch with `gh api` (`.gitmodules`, `AGENTS.md`, `.claude/`), not from local
checkouts. "Legacy references" is `git grep -n -F '.claude/rules/shared'` over the committed tree; for creds it is
the exact count on `origin/main` `9916836` (after #325 and #327 merged, recounted 2026-11-09), for mcp and
sidecar_rust the GitHub code-search file count (approximate).

| Repository | Mount path | `AGENTS.md` | How it got there | Legacy references |
|---|---|---|---|---|
| dew_flow_connect_other_ais | `.agents/conventions` (section still named `.claude/rules/shared`) | yes | migration PR #192, 2026-09-10 (canary) | not re-counted here |
| dew_flow_benchmark | `.agents/conventions` (section `.claude/rules/shared`) | yes | migration PR #113, 2026-10-29 | not re-counted here |
| dew_flow_rag_qln | `.agents/conventions` (section `.claude/rules/shared`); code pins `external/dew_flow_mcp`, `external/dew_flow_benchmark` | yes | migration PR #83 and adapter PR #85, 2026-11-04 (entry 1.1) | not re-counted here |
| wsl_care | `.agents/conventions` | yes | joined on the neutral layout, `a8082f0`, 2026-10-02 | none by construction |
| dew_flow_vscode_kit | `.agents/conventions` | yes | joined on the neutral layout, `34338f4`, 2026-10-02 | none by construction |
| dew_flow_amd_r9700_tuning_ai | `.agents/conventions` | yes | joined on the neutral layout, `2578d4e`, 2026-11-01; `.claude/hooks` and `settings.json` present; CI: `leftovers-check`, `plan-lifecycle`, `post-deploy-check` | none by construction |
| dew_flow_mcp | `.claude/rules/shared` | no | not migrated | about 18 files |
| dew_flow_sidecar_rust | `.claude/rules/shared` | no | not migrated | about 21 files |
| dew_flow_creds_for_devs | `.claude/rules/shared` (pin `37b9aa5`); `.claude/settings.json` present, no `.claude/hooks` | no | not migrated; the resolver refuses the legacy mount (entry 1.2). **Migrated 2026-11-10** (story 3.C, #328, `75c1f1f`) | 249 lines in 97 files (detail in § 6 Stage 3, story 3.C) |

The three repositories that joined on the neutral layout are in scope for the acceptance check of § 7 (fresh clone,
both agents, adapter present), not for a migration: there is no legacy mount to move and no rollback to a legacy
state. The "not re-counted" cells are work of Stage 3's closing matrix, not a claim of zero.

В старом `ClaudeRag · AGENTS.md:8` уже есть индекс с `@CLAUDE.md` и ссылками на Claude rules. Он показывает намерение иметь один источник, но не служит проверкой автоматического import Codex. `ClaudeRag` заморожен по `README.md:116`; в rollout шести активных потребителей его не включать без отдельной задачи.

Проверенные опорные места текущего conventions:

- `README.md:3` — mount внутри Claude rules; `README.md:39` — rollout во все потребители; `README.md:80` — общий reference settings.
- `ROLLOUT.md:13`, `ROLLOUT.md:36` — подключение submodule и CI-пути, которые потребуется обновить.
- `csharp/doctrine.md:2`, `rust/doctrine.md:2`, `typescript/doctrine.md:2` — существующие `paths`.
- `common/coai-review-gate.md:4` — общий review-процесс и привязка к MCP tools.
- `tools/gate-snippet-check.mjs:36`, `tools/gate-snippet-check.mjs:115` — поиск канонического gate по mount; диагностику отсутствующего mount тоже проверить.
- `tools/pin-check.mjs:44` — нынешнее сравнение с remote HEAD; для rollout нужна отдельно утверждённая версия.

## 4. Один контракт выбора правил

### 4.1. ENTRY и канонические источники

`ENTRY.md` описывает общий порядок: определить целевой repo → прочитать его PROJECT → определить тип задачи и затронутые пути → прочитать применимые правила целиком → обновить набор при изменении scope.

Правила не перечисляются независимо в AGENTS и CLAUDE. Обоим выдаётся один и тот же набор `rule id → source path → hash → reason selected`. Порядок чтения нужен для воспроизводимости; он не меняет системную иерархию инструкций агента.

Для каждого правила сохранить один канонический body и один источник metadata. Использовать frontmatter самого правила: стабильный `id`, `load: always|conditional`, существующие `paths`, при необходимости `tasks` и зависимости от других rule id. `paths` и `tasks` означают логическое OR; обязательные зависимости добавляются транзитивно с устранением повторов. Документы без объявления rule не становятся rules только из-за расширения `.md`.

Registry/manifest строится из этих metadata. Не заводить второй вручную редактируемый список glob-условий. Генерируемый manifest может содержать пути, хеши и metadata, но не копии текстов. Необходимые переименования/разделения фиксируются в migration map.

### 4.2. Применимость сохраняется для всех существующих правил

На старте составить карту **всех 24 текущих файлов** в `common/csharp/rust/typescript`: каждый файл и каждая обязательная секция получает назначение. Возможные назначения: always, path/task conditional, справочная история, адаптер конкретного runtime. Ни одно обязательство не исчезает при переносе молча.

Примеры целевого разделения, окончательный состав подтверждается картой:

| Содержание | Когда читать |
|---|---|
| Владение изменениями, обращение с данными, достоверность результатов | В каждой задаче, компактное ядро |
| Стиль/безопасность языка | По путям чтения/изменения файлов соответствующего языка |
| Подробные Git/PR/review-процедуры | Перед соответствующим действием |
| Testing/reliability | При реализации и проверках; основные требования к правдивому результату остаются в ядре |
| HTTP, deployment, GPU, зависимости, миграции | При соответствующей поверхности/действии |
| Истории инцидентов и большие примеры | По ссылке из действующего правила |

Для docs-only, аудита и изменения policy определить отдельные triggers. Сокращение контекста не должно отключить нужный review только потому, что меняется Markdown.

### 4.3. Общий resolver

Предлагается один небольшой Node-инструмент `tools/rules.mjs` с режимами `check`, `explain`, `read`. Он выбирает источники и читает **существующие** body; ничего не генерирует в AGENTS/CLAUDE и не вызывает модели.

- `check`: валидность metadata, уникальность id, существование источников, циклы зависимостей, budgets и отсутствие двух канонических body одного rule id.
- `explain`: применимые rule id, пути, hashes и причины выбора для repo/task/files/agent.
- `read`: выдача выбранных канонических текстов с явными границами файлов; без молчаливого усечения.

Оба агента по ENTRY используют этот инструмент до первого изменения и при расширении scope. В минимальном bootstrap достаточно явно прочитать ENTRY/PROJECT; resolver становится общим способом выбора условных модулей. Он доступен в обычной IDE-сессии, поэтому запуск через особый shell launcher не обязателен.

При новом файле в другом языке, новой задаче release или переходе в другой repo выбор выполняется заново. Нельзя строить всё только по начальному `git diff`: в начале diff может быть пуст, а нужные правила действуют уже при проектировании. Учитываются планируемые пути, прочитанные рабочие исходники и последующие изменения. После compaction/новой сессии нет доверия к прежнему флагу «прочитано» без совпадающих repo, SHA и scope.

Если обязательный источник или submodule отсутствует, не продолжать затронутые изменения под видом полного набора правил. Назвать отсутствующий путь, восстановить из закреплённой версии в рамках разрешённой задачи; не скачивать remote HEAD вместо нужного SHA. Независимый read-only анализ может продолжаться.

## 5. Общая policy и различия runtime

| Слой | Единственный источник | Что отличается между агентами |
|---|---|---|
| Общие правила | conventions `common/` и языковые файлы | Ничего в body |
| Правила проекта | `.agents/PROJECT.md` и локальные `.agents/rules/` | Ничего в body |
| Первоначальная загрузка | AGENTS bootstrap | CLAUDE содержит только import |
| Процедуры и CLI-проверки | conventions `tools/` и task rules | Способ вызова shell/tool, но не реализация проверки |
| Permissions, sandbox, MCP registration | Явные runtime adapters | `.claude/settings.json` и `.codex/config.toml` имеют разные схемы |

Параметры полномочий двух продуктов не следует считать взаимозаменяемыми. Выбранную общую политику описать один раз, затем явно сопоставить с поддерживаемыми controls каждого агента. Если настройке нет эквивалента, это видимое ограничение, а не пропущенное поле. Не ослаблять текущие настройки и не добавлять новые подтверждения только ради унификации.

Claude/Codex-специфичные детали, если понадобятся, держать в маленьких отдельных adapter-файлах: имена tools, особенности shell, команда диагностики. В них запрещён пересказ общих правил. Указания пользователя и системные ограничения конкретного хоста не переопределяются общей policy.

Для coai общим остаётся контракт review и работа с findings. Регистрация MCP и фактические имена доступных tools проверяются в каждом runtime отдельно. Отсутствующий reviewer/tool не заменяется фиктивным proceed. Подключение не создаёт дополнительный review сверх того, который требует общая policy.

## 6. Порядок реализации

### Этап 0 — инвентаризация и baseline

- [ ] Зафиксировать поддерживаемые версии Claude Code, Codex CLI/IDE и Node; ничего не устанавливать и не менять в логине автоматически.
- [ ] Проверить user/project/nested/override инструкции, выбранный root и активные settings в canary-среде. Не печатать секреты конфигурации.
- [ ] Составить карту 24 файлов и локальных правил шести потребителей, перечень CI/scripts/skills, использующих старый mount.
- [ ] Измерить текущий набор источников и поведение на контрольных задачах; записать ограничения действующих permissions.

**Выход:** inventory и migration map с исходными SHA. Не считать отсутствие AGENTS доказательством отсутствия всех инструкций.

### Этап 1 — подготовить общую схему в conventions

- [ ] Добавить ENTRY, metadata и resolver с детерминированными тестами.
- [ ] Подготовить bootstrap templates, проверку адаптеров и собственную точку входа conventions без ссылки на себя как на вложенный submodule.
- [ ] Выделить компактное ядро и conditional rules, сохраняя каждое обязательство в migration map. Не копировать body между ядром и подробным правилом: разделять текст и ссылаться на единственный источник.
- [ ] Учесть переходный период: старые потребители остаются на предыдущем SHA; новую структуру получают только мигрирующие потребители.

**Выход:** проверенная версия conventions, которую можно применить к canary без зависимости от ещё не мигрировавших checkout.

### Этап 2 — canary на смешанном проекте

Первый кандидат — `dew_flow_connect_other_ais`: он проверяет .NET, TypeScript, MCP и собственный review flow. Работать в изолированной ветке/checkout; существующие изменения пользователя не переносить в migration commit.

- [ ] Переместить один submodule из `.claude/rules/shared` в `.agents/conventions`, сохранив историю и закреплённый SHA; не добавлять второй mount.
- [ ] Обновить `.gitmodules`, paths CI/tools и ссылки в проекте. Перенос делать средствами Git с проверкой итоговых путей.
- [ ] Перенести substantive `CLAUDE.md` в PROJECT, локальные policy-файлы — в `.agents/rules`; установить два коротких bootstrap-файла.
- [ ] Убрать прежние автоматические подключения тех же body в `.claude/rules`. Compatibility directory с копией rules не оставлять.
- [ ] Сохранить необходимые собственные Claude settings/hooks и настроить Codex adapter без перезаписи user/global configuration.
- [ ] Проверить fresh clone + submodule init, build/test-команды и оба агента по матрице ниже.

**Выход:** один consumer использует один набор источников с обоими агентами; исходный вариант восстанавливается откатом migration commit.

### Этап 3 — остальные потребители

Revised whole on 2026-11-09 (the re-review for epoch 2). Epoch 1 named a fixed consumer order — sidecar_rust, then
creds, then mcp and benchmark, rag_qln last because it pins siblings. Both changes of epoch 1 overrode that order for
the same cause: a consumer whose loader refused the legacy mount was pulled forward, and the fixed order had no
technical ground (rag_qln's migration built and tested green with its two code pins unmigrated; no dependency was
found between sidecar_rust and creds). The order is replaced by a selection rule; the same text replaces the order
in `ROLLOUT.md` § Recovery and later updates and in `README.md` § Editing discipline.

**Selection rule (replaces the fixed order).** The canary gate is what the merged migrations actually used: the
canary's migration PR (coai #192) and its adapter PR (#195) merged with green CI and `adapter-check` passing. That
gate is met since 2026-09-11; the canary's § 7 behaviour acceptance is a closing-matrix item like every other
consumer's, and does not block a selection. After the canary gate, the owner may select any consumer whose
documented migration prerequisites are met:

1. the migration tool's preflight passes in dry-run on the consumer's committed base (`validateInputs`: a clean
   legacy mount — a clean git tree with the gitlink and the tracked files unmodified against the committed base,
   NOT a working loader: the resolver refuses creds' legacy mount by definition — the selected `release` SHA, no
   host settings and no untracked policy pointing at the old mount, no reference-style Markdown definitions);
2. the product references the tool cannot rewrite are listed, each with its owner change (story 3.C shows the shape);
3. a code-pin change is never part of a migration PR: it needs its own justification, its own build and its own
   pull request (the pinned-by rule in `README.md` governs pin BUMPS, not migration order);
4. a loader refusal in a consumer (the resolver refuses its legacy mount, as in creds on 2026-11-09) triggers
   triage — which rule set the sessions there read by hand, since when, and what it cost — and then the owner's
   selection; it never migrates a consumer by itself and it is never a reason to skip a prerequisite.

Done, with evidence:

- [x] Canary `dew_flow_connect_other_ais` — PR #192, `8d42647`, 2026-09-10 (Stage 2).
- [x] `dew_flow_benchmark` — PR #113, `89b4909`, 2026-10-29.
- [x] `dew_flow_rag_qln` — PR #83, `d83315b`, and the Claude adapter PR #85, `75b7673`, 2026-11-04 (entry 1.1).
- [x] `wsl_care`, `dew_flow_vscode_kit`, `dew_flow_amd_r9700_tuning_ai` joined on the neutral layout (§ 3.1); each
      still owes the § 7 acceptance check in the closing matrix.

Open stories:

- [x] **Story 3.C — `dew_flow_creds_for_devs`** (the owner's selection of 2026-11-09, entry 1.2). One migration PR,
      with this acceptance checklist complete before merge:
      **Done 2026-11-10: creds #328, squash-merged as `75c1f1f`** (conventions pin `37b9aa5` → `5e73780`, the mount on
      `.agents/conventions`, the five hooks recopied, Sonar excluding `.claude/hooks/**`). Evidence, all in the PR: the
      tool's dry-run and apply; `git grep` with zero executable old-mount paths (re-checked after each of three `main`
      merges, which brought 12 live files of #329 back to the old path and were moved by hand); the extension and .NET
      suites green in CI on the head and on `main` at `75c1f1f`; a **fresh clone of the merged commit `75c1f1f`**
      (2026-11-10 17:42 UTC: `rules check` and `explain --task inspect` resolved, `gate-snippet-check`, `adapter-check`,
      `plan-lifecycle` and `build-flags-check` OK, no executable old-mount path — the two README lines left are the
      old-clone cleanup steps; `pin-check` was green at the merge and reads stale now only because `release` moved on);
      the **rollback tried on `75c1f1f`** in that clone (the revert gives exactly its parent's tree; with the PR's steps
      the old mount at `37b9aa5` is back, its tools and the low-priority wrapper run, the tree is clean); the same
      checks had also passed on the PR's first commit `8f31013`; **both agents' smoke read every expected rule on the committed
      pin `5e73780`** (part 1 of § 7 only — part 2 is owed, see the item below) before the promotion (two files, `Program.cs` and `extension.ts`: Codex and Claude, 7 of 7 rules each, hashes matched,
      HEAD/index/status unchanged), after the harness fixes of conventions #147 (the resolver's git had a stdin pipe the
      Codex sandbox refused; the Claude trace was cut at 256 KiB, and one whole read reached the model only as a preview);
      CI 19/19 on the head; the CodeRabbit threads answered, the old-clone steps added to the README after its finding.
      The creds pin then moved with the release to `9b1d668` inside creds #336.
  - [x] **Reconcile with the open work in creds first.** PR #323 (`feat/remote-bridge-e15` → `main`, another
        session's, 36 files, `CONFLICTING` against `main` on 2026-11-09) touches no `.claude/rules/shared` reference,
        no `CLAUDE.md`, no `.gitmodules` and no workflow (checked with `gh pr diff` on 2026-11-09); it does touch
        `todo/README.md` and two plan files. The migration PR names its base commit and its merge order relative to
        #323 and the other open PRs (#320–#322 and #326 on 2026-11-09 evening; #325 and #327 merged, creds `main` is
        `9916836`), and its owner re-checks that list on the day it opens; the migration never carries another
        session's files.
  - [x] **Dry-run, then apply** `tools/migrate-rules.mjs` with the `release` SHA, into a worktree outside both
        checkouts. The report's remaining-legacy list is read whole before `--apply`.
  - [x] **Project and local policy move:** `CLAUDE.md` (11 legacy references, including the local CPU-budget
        preload line `LP=.claude/rules/shared/tools/low-priority.mjs`) becomes `.agents/PROJECT.md` with its links
        rebased; the root `CLAUDE.md` is only `@AGENTS.md`; `AGENTS.md` is the family bootstrap; `.claude/rules`
        ends up empty. creds has no `.claude/rules` policy besides the mount, so no `.agents/rules` files are
        expected — the preflight confirms it.
  - [x] **Install the WHOLE Claude adapter**, every file `tools/adapter-check.mjs` compares (it reads every
        non-test `.mjs` under `settings/hooks/`, recursively): `.claude/hooks/load-instructions.mjs`,
        `ensure-user-guard.mjs`, `lib/user-guard-install.mjs`, `build-flags.mjs`, `subagent-model.mjs`, copied
        verbatim, plus the four hook registrations of `settings/settings.json` merged into creds' existing
        `.claude/settings.json` without weakening a permission; verified by
        `node .agents/conventions/tools/adapter-check.mjs` in CI, as rag_qln #85 did. **Behaviour change for creds:**
        `build-flags.mjs` then refuses a `dotnet build` that does not limit the MSBuild worker pool, so every build
        line in creds' `CLAUDE.md` (the future `PROJECT.md`), its scripts and its documentation carries the limit
        (`csharp/dotnet-build.md`), checked in the same PR.
  - [x] **Product scripts the tool cannot rewrite** (`validateInputs` accepts `--rewrite` only for tracked files
        under root `tools/`, `scripts/` or `deploy/` with the extensions `mjs|js|sh|ps1|cmd|bat|yaml|yml`; a `.cjs`
        and anything under `src_vs_code/` are refused). Each is a hand edit in the migration PR, with its test run:
        `src_vs_code/scripts/lower-priority.mjs:14` (`MOUNT`), `src_vs_code/scripts/lib/leftovers.cjs:5,31`
        (the mount path and the remount hint), `src_vs_code/scripts/lib/leftovers.d.cts`,
        `src_vs_code/scripts/lib/processTree.mjs:46-47` (two imports from the mount),
        `src_vs_code/scripts/run-tests.mjs`, `src_vs_code/scripts/run-itests.mjs`; the tests that assert the
        legacy path or the remount sentence: `src_vs_code/src/test/itestRunner.test.ts:387,448,701`,
        `workflowMount.test.ts:102,140,147-148`, `leftoversWrapper.test.ts`, `leftoversRunner.test.ts`,
        `localCpuBudget.test.ts`, `backupWatch.test.ts`; the .NET side:
        `src_service_defaults/tests/Leftovers/LeftoversJanitorTests.cs:17,32` (`Janitor` constant),
        `LeftoversGuardTests.cs:264,579`, `LeftoversAuditTests.cs`, `Support/Leftovers/*.cs` (three files),
        `Directory.Build.props`, `Directory.Packages.props` (comments), `src_minimalapi_server/src/Program.cs`,
        `Logging.cs`, `src_service_defaults/src/CredsLogging.cs` and its `.csproj` (comments),
        `src_vs_code/src/{logFormat,keyFingerprint,agentAuditFile}.ts` (comments); `.gitignore`;
        `deploy/restore-archive-itest.sh` (eligible for `--rewrite deploy/restore-archive-itest.sh`).
  - [x] **The leftovers sweep and guard** keep running against the new mount: the Node wrapper
        (`leftovers.cjs`), the C# tests that locate `tools/janitor.sh` and `tools/leftovers-check.mjs`, and the
        CI step, each green on the migrated tree.
  - [x] **Workflows** (`ci-server.yml` 8, `docs.yml` 6, `release.yml` 5, `rsd-server-deploy.yml` 2,
        `ci-extension.yml` 2, `ci-clients.yml` 1, `sonarcloud.yml` 1 references): rewritten by the tool's default
        allowlist; the `pin-check` step and the `plan-lifecycle` caller point at the new mount; `submodules: true`
        or the explicit `git submodule update --init .agents/conventions` stays.
  - [x] **Documentation:** root `README.md`, `POST_DEPLOY.md`, `http/README.md` and the product READMEs
        (`src_cli`, `src_mcp`, `src_minimalapi_server`) name the new mount; the live module documents with
        runnable old-mount lines are hand-edited, not exempted as citations: `research/module_tests.md` (14
        references, among them lines 135 and 242 — the remount sentence — 1159, 2143, 2148, 2178 and 2199 — the
        `LP=` preload, `http-run.mjs` and `MOUNT` lines), `research/module_server.md:1935` (the `LP=` line),
        `research/module_service_defaults.md:10`, plus the two live pointers in `research/README.md` and
        `research/architecture.md`; `research/PLAN_*.md` and `todo/` plan texts are historical citations and are
        NOT rewritten (the tool's rule).
  - [x] **Check the committed result:** `git grep -n -F '.claude/rules/shared'` on the PR head returns only
        historical plan and research citations and the preserved `.gitmodules` section name — zero executable paths,
        zero hints that tell a reader to init the old mount. The list is pasted into the PR.
  - [x] **Fresh clone** with `submodules: true`, `npm ci --ignore-scripts --prefix .agents/conventions`, then
        `rules.mjs check`, `explain --task inspect`, `gate-snippet-check`, `adapter-check`, `pin-check`,
        `plan-lifecycle`; the extension's `npm test` and the .NET test run, both green.
  - [x] **Both agents** read the selected sources in a bounded smoke (`tools/smoke-rules.mjs`, Claude and Codex)
        from the migrated worktree, and both pass the § 7 pass conditions; a quota or an absent CLI is recorded as
        incomplete, which is a fail of this item — the PR waits for a completed run of both agents, as epoch 1
        required.
        Progress 2026-11-10: both runs on creds #328 (pin `37b9aa5`) were incomplete — Codex `spawnSync git EPERM`
        (the resolver's git had a stdin pipe, which the Codex Linux sandbox refuses), Claude a cut 256 KiB trace and
        one whole read that the host showed the model only as a preview. The corrective PR under this story (stdin
        `ignore`, one `read --only <id>` per rule, an 8 MiB trace cap, and the code gate's hook findings) satisfies
        this item as written; it is not a plan change. With the fix in a disposable creds worktree each agent read
        5 of 5 rules in full (a measuring run on one file, `extension.ts`, which selects 5); the evidence is the run on
        #328's committed pin `5e73780` (two files, 7 rules), recorded in the story's Done paragraph above.
        **Corrected 2026-11-10 (CodeRabbit on #152):** that run proves part 1 of the § 7 pass condition only (every
        expected rule read in full, hash matched). Part 2, the observable in the recorded answer or checkout, was not
        checked: the Codex answer does not name ENTRY or PROJECT, and a second-path load is not recorded. This item
        stays open until the harness records both and the run is repeated; #328 merged on part 1 alone.
        **Ticked again 2026-11-10 evening:** the harness records part 2 (conventions #154), and the rerun in the
        creds worktree (`daa7e05`, pin `5e73780`, two files, 7 rules) passes both parts for both agents: every rule
        read in full with its hash, ENTRY and PROJECT read, no body by a second path, no unclassified call
        ([the record](../research/2026-11-10_shared_rules_acceptance.md), the rerun section).
  - [x] **Product behaviour unchanged:** the broker, CLI, MCP server and extension builds and their test suites
        green on the migrated tree; no permission in `.claude/settings.json` weakened.
  - [x] **Rollback** named in the PR: the migration is ONE whole commit (squash-merged), so the rollback is the
        revert of that one commit, restoring the gitlink, the adapters and every hand-edited product file together
        (`ROLLOUT.md` § Recovery); the revert is tried once in a disposable clone and the old mount, instructions and
        commands work again on the previous SHA.
  - [x] **Merge conditions of this PR** — below, the same for every migration PR.
- [ ] **Story 3.R — `dew_flow_sidecar_rust`** (Rust: `csharp/` never matches, `rust/doctrine.md` is its doctrine).
      Selected by the owner under the rule above when its prerequisites are met; its checklist is story 3.C's shape
      with its own product references (about 21 files on 2026-11-09) listed in the PR.
- [ ] **Story 3.M — `dew_flow_mcp`** (.NET, public; pinned by rag_qln as `external/dew_flow_mcp`). Selected by the
      owner under the rule above; its migration PR moves no code pin, and rag_qln's later bump of that pin is a
      separate code-pin PR with a build.
- [ ] **Story 3.B — the Claude adapter in `dew_flow_benchmark`** (found by the re-review's judge, 2026-11-09:
      benchmark migrated in #113, but its `main` has only `.claude/settings.json`, no `.claude/hooks`, so a Claude
      session there starts without its rules). Its own PR, selected by the owner under the rule above, in the shape
      of rag_qln #85: the WHOLE adapter — every file `adapter-check.mjs` compares (`load-instructions.mjs`,
      `ensure-user-guard.mjs`, `lib/user-guard-install.mjs`, `build-flags.mjs`, `subagent-model.mjs` under
      `.claude/hooks/`) and the four hook registrations of `settings/settings.json` merged into its
      `.claude/settings.json` without weakening a permission, and `node .agents/conventions/tools/adapter-check.mjs`
      in CI. `build-flags.mjs` then refuses a `dotnet build` without the worker-pool limit, so benchmark's build
      lines carry it in the same PR. It moves no code pin.
- [ ] **Closing matrix:** one table of every consumer in `README.md` § Consumers — mount path, pin, adapter check,
      fresh clone, both agents (§ 7 pass conditions), legacy-reference count, rollback (the revert tried, with the
      clone and date; "none by construction" only for a consumer that never had the legacy mount), and a
      **decision** column: for a consumer not yet migrated, `selected <date>` or `deferred by the owner until
      <review date>` (a deferral is a plan change of the current epoch) — so a stalled rollout is visible in one
      row. Written into this plan before Stage 4. **Where a § 7 failure is fixed:** a corrective PR under that
      consumer's story (3.C, 3.R, 3.M, 3.B, or a new story for a consumer that joined on the neutral layout), never
      a new plan or a plan change; only a failure that changes the design is a change.

  **The matrix, 2026-11-10** (read from each `main` and from disposable worktrees of it, after the pin bumps of
  release `1341995` merged in all nine; the smoke and rollback evidence, run by run with rule ids, hashes, trace
  sizes and dates, is [research/2026-11-10_shared_rules_acceptance.md](../research/2026-11-10_shared_rules_acceptance.md)).
  This item stays open. **§ 7 is not passed yet for any consumer:** its pass condition has two parts, (1) the trace
  shows every expected rule read in full with its hash, and (2) the row's observable is seen in the recorded answer
  or the checkout state. For "Claude / Codex from root" that observable is: ENTRY and PROJECT read, the expected
  sources read, no body loaded by a second path. Every run passed part 1. Part 2 is owed: the harness reports
  `behavior requires review`; the Codex answers do not name ENTRY or PROJECT, one Claude answer (wsl_care) names
  only PROJECT, and whether a body came by a second path is not recorded at all. The harness is being taught to
  record both, and the runs follow (corrected 2026-11-10 after CodeRabbit on #152). The same evening `release` moved
  to `153e6b5` (#151), with pin bumps open in every consumer.
  **Update, the same evening:** the harness records part 2 now (conventions #154, `afbe426`), and the rerun in the same
  worktrees passes **both parts for both agents in every row**: ENTRY and PROJECT read by a call that did not fail, no
  rule body by a second path, no call it cannot classify. mcp and sidecar_rust ran on their migration branches, on the
  committed pin `153e6b5`. The runs are in the record's rerun section. This item stays open until mcp #71 and
  sidecar_rust #76 merge, and while benchmark has no Claude adapter (story 3.B, not selected).

  | Consumer | Mount | Pin | Adapter check | Fresh clone / worktree | Both agents (§ 7) | Old-mount lines outside `todo/`, `research/`, `.gitmodules` | Rollback | Decision |
  |---|---|---|---|---|---|---|---|---|
  | dew_flow_connect_other_ais | `.agents/conventions` | `1341995` | OK | worktree of `ee8ad53`: `rules check` resolved | reads verified for both (part 1), 8 of 8 rules; the observable (part 2) owed; **both parts verified for both** in the rerun of 2026-11-10 evening, harness conventions #154 | 66, none executable for its own mount: the product's gate snippet and rule discovery support user repositories still on the old layout (and their tests), plus 14 comment and doc lines citing rules by the old path (corrective PR #972) | tried on `8d42647`: the revert gives its parent's tree, the old mount `895b24c` and its tools are back | migrated (#192) |
  | dew_flow_benchmark | `.agents/conventions` | `1341995` | none: no `.claude/hooks` (story 3.B) | worktree of `3958ecc`: resolved | reads verified for both (part 1), 6 of 6 rules; the observable (part 2) owed; **both parts verified for both** in the rerun of 2026-11-10 evening, harness conventions #154 | 23: the gate's tests and the spikes measure other repositories and old transcripts on the old layout; 2 comments cite rules by the old path (corrective PR #194) | tried on `89b4909`: parent's tree, old mount `e29883f`, low-priority wrapper runs | migrated (#113); the adapter is story 3.B, not selected |
  | dew_flow_rag_qln | `.agents/conventions` | `1341995` | OK | worktree of `f7f4fc4`: resolved | reads verified for both (part 1), 6 of 6 rules; the observable (part 2) owed; **both parts verified for both** in the rerun of 2026-11-10 evening, harness conventions #154 | 0 | tried on `d83315b`: parent's tree, old mount `cc24f9e`, low-priority wrapper runs | migrated (#83, #85) |
  | wsl_care | `.agents/conventions` | `1341995` | OK | worktree of `cb8046b`: resolved | reads verified for both (part 1), 6 of 6 rules; the observable (part 2) owed; **both parts verified for both** in the rerun of 2026-11-10 evening, harness conventions #154 | 0 | none by construction | joined on the neutral layout |
  | dew_flow_vscode_kit | `.agents/conventions` | `1341995` | OK | worktree of `a9ab150`: resolved | reads verified for both (part 1), 6 of 6 rules; the observable (part 2) owed; **both parts verified for both** in the rerun of 2026-11-10 evening, harness conventions #154 | 0 | none by construction | joined on the neutral layout |
  | dew_flow_amd_r9700_tuning_ai | `.agents/conventions` | `1341995` | OK (`build-flags.mjs` added in #28) | worktree of `2ecb356`: resolved | reads verified for both (part 1), 6 of 6 rules; the observable (part 2) owed; **both parts verified for both** in the rerun of 2026-11-10 evening, harness conventions #154 | 0 | none by construction | joined on the neutral layout |
  | dew_flow_creds_for_devs | `.agents/conventions` | `1341995` (`37b9aa5` → `5e73780` in #328 → `9b1d668` in #336 → `1341995` in #340) | OK | fresh clone of `75c1f1f` (story 3.C) | reads verified for both (part 1), 7 of 7 (on `5e73780`, story 3.C) rules; the observable (part 2) owed; **both parts verified for both** in the rerun of 2026-11-10 evening, harness conventions #154 (worktree `daa7e05`) | 2: the README's old-clone cleanup steps | tried on `75c1f1f` (story 3.C) | migrated (#328, story 3.C) |
  | dew_flow_mcp | `.claude/rules/shared` on `main`; `.agents/conventions` in #71 | `1341995` (mcp #70); `153e6b5` in #71 | in #71: OK | in #71: fresh clone of `a0809f5`, all checks, build and 622 tests green | in #71: reads verified for both (part 1), 6 rules; the observable (part 2) owed; **both parts verified for both** on `64f42d0` in the rerun of 2026-11-10 evening, harness conventions #154 | about 18 files (2026-11-09); in #71: 1, a fixture pinning that the old mount is never entered | in #71: tried, the revert gives `main`'s tree and the old mount is back | **selected 2026-11-10 by the owner** (story 3.M); migration PR #71, draft until § 7 passes (it passes since the rerun) |
  | dew_flow_sidecar_rust | `.claude/rules/shared` on `main`; `.agents/conventions` in #76 | `1341995` (sidecar_rust #75); `153e6b5` in #76 | in #76: OK | in #76: CI | in #76: owed; then **both parts verified for both**, 8 of 8 rules, on `a691935` in the rerun of 2026-11-10 evening, harness conventions #154 | about 21 files (2026-11-09) | in #76: owed; then tried on `c446c69`: one revert gives the tree of `main`, the old mount `1341995` is back | **selected 2026-11-10 by the owner** (story 3.R); migration PR #76, draft |
- [ ] Не двигать code dependency pins только для того, чтобы погасить старый pin-check; принять явное решение о совместимых версиях и проверить сборку при их изменении.
- [ ] Обновить README/ROLLOUT/POST_DEPLOY и checklist каждого потребителя. Ссылки на инструменты старого mount не должны остаться исполняемыми путями.

**Merge conditions of a migration PR** (written out in the re-review; epoch 1 had them as bullets): old and new
conventions SHA named; the tool's dry-run report attached; both agents' smoke results attached and both passed
(an incomplete run — quota, absent CLI, truncated output — is not a pass and the PR waits; epoch 1 required the
checks of both agents); the `git grep` result pasted; the consumer's own CI green on the head SHA, checks present
(never "no failure found"); rollback = the revert of the one whole migration commit (gitlink, adapters and every
hand-edited product file together), tried in a disposable clone and named in the PR; no code pin moved; the
reviewer gate and the automated reviewer's threads answered; the owner's go for the consumer recorded (the
selection rule).

**Выход:** матрица всех потребителей (nine rows on 2026-11-09) с подтверждёнными версиями. Старый `ClaudeRag` остаётся вне миграции.

### Этап 4 — закрытие и эксплуатация

- [ ] В CI: `rules check`, проверка templates, manifest и ссылок; запрет новых ручных policy-копий.
- [ ] Регулярный compatibility smoke после обновления Claude/Codex; staged rollout новой версии правил.
- [ ] Зафиксировать изменения поведения и отклонения; закрыть соответствующие пункты общего backlog.
- [ ] Close this plan (re-review of 2026-11-09): only once the closing matrix of Stage 3 is complete — every
      consumer migrated or on the neutral layout, every § 7 row passed for both agents, Codex native acceptance
      measured and passed — promote this file to `research/` with `IMPLEMENTED <date>` and its deviations (the fixed
      order that was dropped, the three repositories that joined without a migration, the section name kept in
      `.gitmodules`). Unselected consumers and the Codex acceptance are NOT moved to a remainder plan to make the
      promotion possible; a remainder plan exists only for work the owner explicitly defers, recorded as a plan
      change of the current epoch at the time, with the boundary table named on both sides. Not before: the ledger
      lives here and `plan-lifecycle.mjs` reads it only in `todo/`.

## 7. Проверки приёмки

| Сценарий | Что должно наблюдаться |
|---|---|
| Claude из root / Codex из root | Прочитаны ENTRY/PROJECT и ожидаемые canonical sources; body не загружен вторым путём |
| Запуск из вложенной папки | Правильно выбран repo root; учтены применимые локальные исключения |
| Дополнительный repo в IDE / переход из repo A в B | Для файлов B загружена policy B; правила A не выдаются за правила B |
| C# → TypeScript в одной задаче | Набор rules расширился до изменения второго языка |
| Новый файл при пустом diff | Правила определены по планируемому пути, а не пропущены |
| Docs-only / audit / release / dependency update | Срабатывают соответствующие triggers без лишних повторных workflows |
| Отсутствующий submodule или битый источник | Видимый incomplete; нет изменений под видом полной загрузки |
| AGENTS.override / local instructions / managed policy | Различия явно выявлены; шаблон не переписывает чужую policy |
| Compaction, новая сессия, другой SHA | Нужные источники восстановлены/перечитаны, нет устаревшего cache |
| Windows, WSL, пробелы, Unicode, fresh clone | Подключение не требует вручную созданных symlinks и абсолютных путей машины автора |
| Ошибка проверки / неполный coai review | Нет выдуманного pass или полного состава reviewers |
| Откат canary | Старый mount, инструкции и команды снова работают на прежнем SHA |
| Loader refuses a consumer's legacy mount (added 2026-11-09) | Recorded as a triage finding with what sessions there read by hand and since when; it is not itself a migration and it skips no prerequisite of § 6 Stage 3 |
| Consumer that joined on the neutral layout (added 2026-11-09) | The fresh-clone, adapter and both-agents rows above hold; no legacy mount, so no rollback row |

Pass and fail conditions (added 2026-11-09, for every row above and for each agent separately). **Pass:** the
recorded read trace shows every expected rule id read in full with its hash matching (`tools/smoke-rules.mjs`
evidence), AND the observable in the right column is seen in the recorded final answer or in the checkout state
(for example: the resolver's `explain` output names the second language's rules before the second language's file
is edited; the nested start names the repository root; the rollback clone runs the old commands on the old SHA).
**Fail:** any expected source not read or read in part, a hash mismatch, a body loaded by a second path, a quota or
absent-CLI outcome, a truncated or timed-out output, a changed HEAD/index/status, or the observable not seen. An
incomplete run is a fail of that row, never a pass pending; a model's claim "I read everything" is evidence of
nothing. Each closing-matrix cell cites the evidence file and the date.

Детерминированные tests проверяют resolver, пути, manifest и templates. Для model smoke хранить список ожидаемых rule id/hash, фактические чтения и результат поведения. Ответ модели «я всё прочитала» сам по себе не является достаточной проверкой. Проверки с моделями — отдельные разрешённые запуски с лимитом, не скрытая часть обычного `rules check`.

## 8. Бюджеты, хранение и сбои

- Bootstrap: целевой cap **4 KiB** на AGENTS, CLAUDE — только import. Отдельно проверять весь обнаруженный Codex instruction chain, а не размер одного файла. Увеличение глобального лимита не является заменой компактной структуры.
- Always-loaded каноническое ядро: проектная цель **до 16 KiB текста** до измерения tokenizer. Это бюджет плана, не лимит продукта. Большие условные пакеты читать по отдельности с проверкой полноты, не молча обрезать.
- Каталог: начальные **24 источника правил × до 2 KiB metadata ≈ 48 KiB**, плюс локальные правила; cap **256 KiB на manifest**. Тексты в manifest не копируются.
- Resolver не создаёт постоянный cache в первой версии: читает закреплённые файлы, ничего не накапливает. При большой выборке возвращает явный список ещё не прочитанного.
- Smoke artifacts: максимум **12 сценариев × 2 агента × 256 KiB = 6 MiB на consumer/run**; шесть потребителей — до **36 MiB на полный проход**. Хранить последние 10 полных проходов, не дольше 14 дней: до **360 MiB**. Это верхние бюджеты, не измеренный расход.
- Владелец очистки smoke artifacts — test harness при запуске/завершении; незавершённые run directories помечаются incomplete и убираются после проверки отсутствия активного процесса. Секреты и необязательные полные transcripts не сохранять.
- Rollout journal содержит только repo, old/new SHA, статус проверки и rollback reference; без токенов. Долговременная история — Git/PR; новая служба или БД для этого плана не нужна.

## 9. Definition of Done

- [ ] Каждое действующее правило и локальное обязательство имеет один canonical body и запись в migration map.
- [ ] В каждом из шести потребителей один submodule conventions и одна версия policy для обоих агентов.
- [ ] (Re-review 2026-11-09, widens the line above) The same holds for every row of `README.md` § Consumers — nine
      on 2026-11-09, plus any repository that joins before promotion; none left out and none deferred except by an
      owner's deferral recorded as a plan change — and for each migrated consumer
      `git grep -n -F '.claude/rules/shared'` on `main` returns no executable path and no remount hint; the product
      references the tool could not rewrite were reviewed as a separate list in the migration PR; the rollback
      (the revert of the one migration commit) was tried for each migrated consumer.
- [ ] CLAUDE импортирует AGENTS; отсутствуют циклы `AGENTS → CLAUDE → AGENTS` и ручные копии правил.
- [ ] Состав прочитанных rule id/hash соответствует задаче и совпадает у Claude/Codex, кроме явно названных runtime adapters.
- [ ] Todo, fixtures и справочные документы не входят в обычный instruction payload.
- [ ] Настройки полномочий не ослаблены, существующие user/managed policy не перезаписаны.
- [ ] Windows/WSL, fresh clone, nested directory, второй repo и compaction покрыты проверками.
- [ ] CI-команды нового mount и rollback проверены для каждого потребителя.
- [ ] Канонические тексты меняются один раз; изменение файла сразу видно обоим агентам на следующем чтении той же версии, без генерации дубликатов.
- [ ] План переведён в IMPLEMENTED только после rollout и проверок, с зафиксированными отклонениями.
