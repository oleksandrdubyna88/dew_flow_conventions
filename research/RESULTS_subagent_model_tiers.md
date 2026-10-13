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

Recorded in E2.
