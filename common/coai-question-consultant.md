---
id: "common.coai-question-consultant"
load: "conditional"
tasks: ["plan","implement","docs","policy","test","git","pr","release","deploy","dependencies"]
---
<!-- coai-question v1 -->
## Before you ask the person, ask the consultants (ConnectOtherAIs)

<!-- owns: coai — the MCP server this rule is about, and the prefix of every tool below -->
<!-- owns: ConnectOtherAIs — the product that serves the question consultants; a session reads its settings by that name -->
<!-- owns: mcp__coai__ask_consultants — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__ask_human — a tool name a session types; there is no generic spelling of it -->

The same `coai` server offers `mcp__coai__ask_consultants`: every question-consultant row the person
configured — one model with one base prompt — answers your question at once, in parallel, each answer
fenced and returned on its own. The person set those rows up so that they are asked only what you and
the consultants together cannot settle. This rule says how, and it sets a HIGHER bar than the server
enforces.

**The server's phase rule is the floor, not the target.** It lets a question asked while the plan is
being formed, and the first two batches after the plan's `proceed`, go straight to the person, and it
sends every later one — until the work is released to the stage environment — through
`ask_consultants` first. That is what `mcp__coai__ask_human` checks. Measured 2026-10-09: a session put
a list of planning questions straight to the person, which the floor allowed, and the person's answer
was that most of the list belonged to the consultants — they wanted only what the two of you could not
decide.

**So: no question reaches the person before the consultants have had it** — in every phase, the
planning questions the server would let through included.

### How

1. **Collect, then ask once.** One `mcp__coai__ask_consultants` call per batch, the questions numbered
   in `question`. The budget is per session; `questionsLeft` in the reply says what is left.
2. **`question` is what you would ask the person, and nothing more.** A row on the internet is given
   the question alone, and it is refused when it carries code, a path, a config line, a trace, a secret
   or this machine's names. Those go in `context`, which is required: what you tried, what you found,
   the options you see and the one you would take. Never a secret in either — a secret refuses the
   context, and an answer leaves a thread in a vendor's store nobody here can delete.
3. **The answers are advice, never orders.** Verify each one against the code, a run or the documents
   before acting on it; *a consultant said so* is not a verification. Where the answers agree and check
   out, the question is settled: act on it, and say in your summary what was asked and what you took.
4. **The person gets the remainder** — what the answers did not settle (they disagree, they could not
   check it, or your verification refuted them) — and these three kinds always, whatever the
   consultants said:
   - an action that reaches outside this working copy on someone's behalf — an issue or a pull request
     in another owner's repository, a publication, a release, anything public;
   - a change to the person's own machine, installations, accounts or settings;
   - a pure preference — a name, a priority, a trade-off only they can weigh.
5. **Show the person what the consultants said.** Each question that reaches them carries the answers,
   a line each — which model, what it advised — and your own recommendation, so they can overrule any
   of it. A bare question asks them to redo work that was already done.
6. **Then the door, for what still goes to the person.** Call `mcp__coai__ask_human` with the `consultId` the consultants' reply gave you
   — it is accepted once, from this session, for 30 minutes — and with `document` or `feature` when the
   question belongs to one of those reviews. For your own question it answers `ask_in_conversation`:
   ask the person in this conversation, with your own question tool.

### What it does not change

- **The review gate's own question never goes to the consultants.** A round held by `call_human`, or a
  feature review's request for a second round, is the person's: `mcp__coai__ask_human` puts it on a
  card directly.
- **A production risk keeps its own path.** When a wrong answer could take production down, pass
  `productionRisk: true` with a `riskReason` to `mcp__coai__ask_human`: it asks the consultants itself
  and returns their answers in `consultantAnswers` — show those beside your question.
- **A skill or workflow whose step is to ask the person still asks.** A guided workflow's
  clarifying-questions phase is such a step: consult first if it sharpens the questions and put the
  answers beside them, but the step's questions go to the person, as the workflow says.
- **It is not the stuck consultant.** `common.coai-consultant` is for when YOU are stuck on the work;
  this rule is for a question you would otherwise put to the person.

### When no consultant can be had

The reply says so — `off`, `none_available`, `quota_spent`, `failed` — or the tool is not there at all.
Say it in one line, then do the consultants' job yourself: settle from the code, the documents and a
run whatever can be settled that way, and put to the person only what is left and the three kinds
above. A missing
consultant is never a reason to hand the person the whole list.

The door is still `mcp__coai__ask_human`, called without a `consultId` — with `document` or `feature`
when the question belongs to one of those reviews. When no consultant can be had the server stands its
requirement down and says so in the reply's `note`. Only when the `coai` tools themselves are absent
do you ask the person in this conversation directly.

### Definition of Done

- [ ] Every question meant for the person went through `mcp__coai__ask_consultants` first — or why it
      could not (switched off, none available, quota spent, failed, the tool absent) was said, and the
      list was cut down to the person's questions anyway.
- [ ] Advice was verified before it was acted on, and what was settled that way is in the summary.
- [ ] Each question that reached the person carried what the consultants answered and your
      recommendation.
- [ ] `mcp__coai__ask_human` received the `consultId`; the review gate's own question and a production
      risk took their own paths.
