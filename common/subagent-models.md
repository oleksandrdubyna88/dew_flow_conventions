---
id: "common.subagent-models"
load: "conditional"
tasks: ["plan","implement","audit","policy","test","docs","pr","release"]
---
# Which model a subagent runs on (MANDATORY)

> Every subagent you launch runs on **Opus**. Reach for **Fable** only when being wrong is
> expensive in a way a later round cannot repair: the architecture of a NEW project, security,
> cryptography, authentication and authorisation. Everything else — exploration, implementation of a
> decided design, mechanical refactors, tests, documentation, reviews of work already shaped — is
> Opus.

## The rule

1. **Opus is the default, and it is a real default, not a fallback.** A subagent with no model named
   must end up on Opus.
2. **Fable is for the decisions a later round cannot undo.** The shape of a system nobody has built
   yet; a trust boundary; a key, a token or a session; who may do what. What these share is that the
   cost of a wrong answer is paid long after the answer, by somebody who cannot see it.
3. **Say which you used, and why, in the summary.** One clause is enough — "split on Fable, the
   three implementations on Opus". A model choice nobody records is a choice nobody can correct.

## Pass it EXPLICITLY, every time

A subagent's model can come from three places, and only one of them is yours: the agent definition's
frontmatter, the session's configured default, and the argument you pass. **A plugin agent may pin
its own, and it wins over the session default.**

**What this repository can and cannot say about that.** Nothing here resolves a model. `tools/rules.mjs`
selects instruction SOURCES and `tools/lib/rule-trace.mjs` only records the `message.model` it
observed; neither sets a precedence, and no contract in this repository does. The order above is
OBSERVED behaviour of the host, measured once, on the date below — it is evidence, not a guarantee,
and a host release may change it without telling anyone. That is the whole argument for the
instruction this rule actually gives: pass the model explicitly, and the precedence stops mattering.

Measured 2026-09-12 in `connect_other_ais`: the `feature-dev` plugin's `code-architect`,
`code-explorer` and `code-reviewer` each carried `model: sonnet` in their frontmatter, across all
seventeen cached versions of the plugin. Three architects therefore split a feature on Sonnet while
the operator believed they were on Opus, and it surfaced only because they asked which models were
running — nothing in the transcript said.

**That example is dated on purpose, and it is an example rather than the rule.** A plugin's
frontmatter can change with any release, so do not rely on this list staying true: check the
definition you are about to launch, or make the question moot by naming the model yourself.

So: **name the model in the call**, whatever you believe the default to be. Passing it when it was
already right costs nothing; omitting it when it was wrong costs a plan.

## Why not Fable everywhere

Because the round after this one is cheap and the round after a bad architecture is not. Fable's
advantage shows where a mistake compounds — a boundary drawn in the wrong place is paid for by every
change that crosses it afterwards. In work where a mistake is caught by a test, a gate round or a
reviewer, that advantage buys a slower answer to a question that was going to be checked anyway.

## Never

- Never launch a subagent without deciding its model, then report what it produced as though the
  choice had been made.
- Never assume a plugin or a marketplace agent honours the session default — read its frontmatter or
  pass the model.
- Never use Fable for volume. Ten Fable subagents on mechanical work is not ten times the care.

## Definition of Done

- [ ] Every subagent launched in the task named its model explicitly.
- [ ] Anything on Fable is architecture of something new, security, cryptography, or authentication
      and authorisation — and the summary says which.
- [ ] The summary names the models used.
