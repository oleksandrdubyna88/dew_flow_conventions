---
paths: ["__conventions_planning_documentation_only__/**"]
---
# PLAN — единый источник правил для Claude Code и Codex

> Status: **IN PROGRESS, 2026-09-10.** Scope: общий контракт инструкций, подключение Claude Code/Codex и миграция шести потребителей conventions. Resolver и self-host bootstrap написаны; rollout ещё не выполнен.

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

**Current code-review scope is S1 only.** S2–S4 are future stories and are not claimed
implemented in this diff. S1 acceptance: canonical bodies preserved, deterministic validated
selection and source bootstrap work, existing tools remain green on Windows/WSL, new behavior
is exercised through real CLI calls. Full live-agent/consumer rollout is acceptance of S2–S4.
The coai server reviews commit SHAs, not an unstaged working tree; a local review-snapshot
commit is required before review. It is not pushed or shipped until findings are resolved.

1. **Shared delivery**
   - S1: metadata on all 24 original bodies, validated resolver, source bootstrap,
     deterministic tests, CI and migration inventory. In progress.
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

- [ ] Проверить Rust-потребитель `dew_flow_sidecar_rust`, затем `dew_flow_creds_for_devs`.
- [ ] Мигрировать `dew_flow_mcp`, `dew_flow_benchmark`; `dew_flow_rag_qln`, который сам закрепляет часть этих репозиториев, проверять последним.
- [ ] Для каждого — отдельный migration PR с old/new SHA, обновлением путей, проверками обоих агентов и rollback.
- [ ] Не двигать code dependency pins только для того, чтобы погасить старый pin-check; принять явное решение о совместимых версиях и проверить сборку при их изменении.
- [ ] Обновить README/ROLLOUT/POST_DEPLOY и checklist каждого потребителя. Ссылки на инструменты старого mount не должны остаться исполняемыми путями.

**Выход:** матрица шести потребителей с подтверждёнными версиями. Старый `ClaudeRag` остаётся вне миграции.

### Этап 4 — закрытие и эксплуатация

- [ ] В CI: `rules check`, проверка templates, manifest и ссылок; запрет новых ручных policy-копий.
- [ ] Регулярный compatibility smoke после обновления Claude/Codex; staged rollout новой версии правил.
- [ ] Зафиксировать изменения поведения и отклонения; закрыть соответствующие пункты общего backlog.

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
- [ ] CLAUDE импортирует AGENTS; отсутствуют циклы `AGENTS → CLAUDE → AGENTS` и ручные копии правил.
- [ ] Состав прочитанных rule id/hash соответствует задаче и совпадает у Claude/Codex, кроме явно названных runtime adapters.
- [ ] Todo, fixtures и справочные документы не входят в обычный instruction payload.
- [ ] Настройки полномочий не ослаблены, существующие user/managed policy не перезаписаны.
- [ ] Windows/WSL, fresh clone, nested directory, второй repo и compaction покрыты проверками.
- [ ] CI-команды нового mount и rollback проверены для каждого потребителя.
- [ ] Канонические тексты меняются один раз; изменение файла сразу видно обоим агентам на следующем чтении той же версии, без генерации дубликатов.
- [ ] План переведён в IMPLEMENTED только после rollout и проверок, с зафиксированными отклонениями.
