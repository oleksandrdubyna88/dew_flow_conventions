# RESULTS — subagent model tiers

> Status: **record, 2026-10-13** — measurements for [PLAN_subagent_model_tiers.md](../todo/PLAN_subagent_model_tiers.md) (epic E1, story S3); the host facts are filled by E2.

## Read budget

Selected-rule bytes (sum of `rules[].bytes` from `node tools/rules.mjs explain --repo . --task <task> [--file <file>]`)
for all 18 tasks over seven scopes, measured at commit `4d364c6` with `common/subagent-models.md` in its final
form. One `rules read` carries at most 32 768 B; a cell in **bold** is over it and needs the explain-then-read-each-ID
route. `inspect`, `ui`, `gpu` and `storage` are the tasks excluded from the rule so that their scopes which fit
one read today still fit (`tools/rules.test.mjs` pins both halves).

| task | none | src/x.cs | src/x.csproj | ui/a.ts | src/main.rs | api/x.http | src/App.slnx |
|---|---:|---:|---:|---:|---:|---:|---:|
| inspect | 24207 | 28820 | 31901 | 30116 | **40743 over** | **60125 over** | **40676 over** |
| audit | **144331 over** | **148944 over** | **152025 over** | **150240 over** | **148710 over** | **144331 over** | **160800 over** |
| plan | **142665 over** | **147278 over** | **150359 over** | **148574 over** | **159201 over** | **178583 over** | **159134 over** |
| implement | **241760 over** | **246373 over** | **249454 over** | **247669 over** | **246139 over** | **241760 over** | **258229 over** |
| docs | **152304 over** | **156917 over** | **159998 over** | **158213 over** | **168840 over** | **188222 over** | **168773 over** |
| policy | **191634 over** | **196247 over** | **199328 over** | **197543 over** | **208170 over** | **202853 over** | **208103 over** |
| test | **234328 over** | **238941 over** | **242022 over** | **240237 over** | **250864 over** | **245547 over** | **239595 over** |
| git | **129880 over** | **134493 over** | **137574 over** | **135789 over** | **146416 over** | **165798 over** | **146349 over** |
| pr | **157117 over** | **161730 over** | **164811 over** | **163026 over** | **173653 over** | **193035 over** | **173586 over** |
| release | **203784 over** | **208397 over** | **211478 over** | **209693 over** | **220320 over** | **203784 over** | **220253 over** |
| deploy | **170036 over** | **174649 over** | **177730 over** | **175945 over** | **186572 over** | **205954 over** | **186505 over** |
| dependencies | **145746 over** | **150359 over** | **150359 over** | **151655 over** | **162282 over** | **181664 over** | **162215 over** |
| http | **69000 over** | **73613 over** | **76694 over** | **74909 over** | **85536 over** | **69000 over** | **85469 over** |
| gpu | 27680 | 32293 | **35374 over** | **33589 over** | **44216 over** | **63598 over** | **44149 over** |
| benchmark | **67819 over** | **72432 over** | **75513 over** | **73728 over** | **84355 over** | **103737 over** | **73086 over** |
| logging | **45239 over** | **49852 over** | **52933 over** | **51148 over** | **49618 over** | **81157 over** | **61708 over** |
| storage | 29406 | **34019 over** | **37100 over** | **35315 over** | **45942 over** | **65324 over** | **45875 over** |
| ui | 26420 | 31033 | **34114 over** | 32329 | **42956 over** | **62338 over** | **42889 over** |

## The rule's size

`common/subagent-models.md`: 8 875 bytes (LF line endings).

## Host facts

Recorded 2026-10-13 in E2, from real headless sessions (`claude -p --output-format stream-json --verbose`,
`permission_mode: "default"`), by scouts on Sonnet.

**The PreToolUse payload for the Agent tool.** Keys: `session_id`, `transcript_path`, `cwd`, `scratchpad_dir`,
`prompt_id`, `permission_mode`, `effort`, `hook_event_name`, `tool_name`, `tool_input`, `tool_use_id`. `tool_name` is
`"Agent"`. `tool_input` with a model: `{description, prompt, subagent_type, model: "sonnet", run_in_background}`;
without one the `model` key is **absent** — nothing is injected.

**What the hook's answers do.** A `deny` with a reason reaches the model as an error `tool_result`
(`PreToolUse:Agent hook error: <reason>`) and the subagent never runs. An `additionalContext` with NO
`permissionDecision` reaches the parent verbatim, and the call proceeds through normal permission handling.

**What the stream shows of a child.** A child contributes ONE event with `parent_tool_use_id` set — a `user` event
holding its prompt — plus `system/task_started` and `system/task_notification` (status, usage), none with a model. The
parent receives the child's hand-back as a parent-level `tool_result`. Resolved models appear only in aggregate:
`result.modelUsage` keyed by model (measured: `claude-opus-5-5[1m]` for the parent and an Opus child together,
`claude-sonnet-5-5` for the Sonnet child, and a little `claude-haiku-4-5` the host spends itself), and
`result.subagent_stats` `{spawned, requested.foreground, completed, max_depth}`. A per-child resolved model cannot be
read from the stream; the behaviour smoke checks the requested model per launch and the families in aggregate.

**Every launcher of `claude` on this machine** (two scouts, 2026-10-13), and whether it must opt out of the guard:

| Where | What | Agent tool | Measures models? | Opt-out |
|---|---|---|---|---|
| connect_other_ais `src_mcp/runners/Reviewers/ClaudeRuntime.cs:71-92` | gate reviewer | allowed unless confined | no — work | no |
| connect_other_ais `src_mcp/runners/Consultation/ClaudeConsultant.cs:53-71` | consultant | denied (`Task`, `Agent`) | no | no (never launches) |
| connect_other_ais `src_bench/CoaiBench/Judging/Judge.cs:162-183` | bench judge, `--max-turns 1` | allowed | **yes** | **yes** |
| connect_other_ais `src_vs_code/src/claudeAdapter.ts:22-49` | chat sessions | allowed | no — work | no |
| connect_other_ais `src_vs_code/src/claudeProbe.ts:71`, `scripts/live-claude-models.mjs` | model probes (`-p "hi"`) | not used | availability only | no (never launches) |
| connect_other_ais `src_server/src/Slots/SlotEnvironment.cs:67-77` | team-server slots, own `CLAUDE_CONFIG_DIR` | — | no | no (the user-level copy is not in that config dir) |
| benchmark `src/Bench.Infrastructure/Models/CliAgentRuntime.cs:177` | authoring, vetting, assessor | allowed | no — work | no |
| benchmark `src/Bench.Infrastructure/Models/CliSubjectRuntime.cs:107` | a CLI measured as a subject | allowed | **yes** | **yes** |
| benchmark branch `feat/scouts-context`: `CliScoutRunner.cs:108`, `ScoutsAliasCommand.cs:57`, `CliProbeRunner.cs:65` | scout calibration, alias check, probes; environment REPLACED by an allow-list | used, models always named | **yes** | **yes — added to the allow-list on that branch; it is another session's, so the requirement is written into its plan** |
| rag_qln `ClaudeCliProbe.cs:45-55`, `extension.ts:392` | `--version` / an interactive terminal | — | no | no |

No launcher passes `--settings` or `--setting-sources`; none launches `claude` through WSL from the C# runners.

## E2.S1 break-its

Run once each by the coder, 2026-10-13, then restored and green:

1. `subagentModelVerdict` made to answer `teach` for every model → 16 scenarios red (2–9, 13, 15, 16, 18, 23, 25, 29,
   30); the first failing assertion was scenario 2, expecting `kind: 'deny'` and receiving `'teach'` with `TEACH_TEXT`.
2. `SUBAGENT_MODEL_RULE_PATH` pointed at a copy of the rule with `Judge`'s model changed to `sonnet` → scenario 31 red
   with `"judge": rule says sonnet, hook says opus` (and 32, which tampers that already-tampered copy).

The installer's (`mergeEntry` forced to append → "installing twice leaves settings.json byte-identical" and "replaced
in place, never twinned" red) and the self-install's (version comparison forced to install → "an equal version writes
nothing" and "prints one systemMessage first run, nothing on the second" red) were observed the same way.
