# Measurement — a number you did not set up is a number about something else

> This family measures constantly: `RESULTS_*.md` in four repositories, prompt comparisons, model
> matrices, latency and token counts that decide what ships. Those numbers are read months later by
> people who cannot re-run them, and they change what gets built.
>
> Everything below was measured — by getting it wrong. Every item names the run that produced it.

## 1. Pin everything you are NOT varying, then prove the arm actually differed (MANDATORY)

A measurement has one variable. Every other input — prompt, model, seed, temperature, limits,
concurrency, the round's own defaults — is pinned, in the harness, explicitly. A default that is
"obviously fine" is the one that overrides the thing under test.

**Measured twice in one repository, five cells apart.** A prompt comparison ran with the product's
own round-1 default still in force, so every cell of phase B measured the *conventions pass* rather
than the prompt named in the results table. Nothing failed, nothing looked odd, and the numbers were
about a different question than the one in the heading. The fix was one pinned variable
(`COAI_PROMPTS_PER_ROUND`); the cost was two full runs.

So, before reading any result:

- **Pin it in the harness, not in your head.** "I set that in the panel earlier" is not a pin.
- **Read back what was actually sent** — the composed prompt, the request body, the env block — for at
  least one cell per arm. An arm that did not differ produces a beautiful table of one condition
  measured twice.
- **A/A first when the arms are cheap.** Two identical arms should come out equal; if they do not, the
  harness has a leak and nothing after that is worth reading.

## 2. Validate an automatic metric against a hand-read sample BEFORE reporting its numbers (MANDATORY)

A scoring function is code, and code that nothing tested is code that is wrong.

**Measured 2026-09-02.** An agreement matcher reported 0–5 % agreement between reviewers across a
five-model matrix. Reading the same findings by hand put it at **55–76 %**: the matcher compared
finding titles by Jaccard similarity with no file or line anchor, so two models naming the same defect
in different words scored zero. The number was published in a table before anyone checked it.

Worse, and the reason this is a rule: **the same matching rule was in the product**, deciding when the
gate treats two vendors' findings as one. The metric being wrong and the feature being wrong were one
defect, and the measurement was the thing that could have found it a month earlier.

- Hand-score a sample — twenty items is enough — and compare with the automatic score before the
  automatic score appears anywhere.
- When the metric shares a rule with production code, say so: a disagreement is then a bug report, not
  a harness note.

## 3. A conclusion may not be wider than the conditions measured (MANDATORY)

The mechanism you infer is a hypothesis. The measurement licenses a sentence about the conditions you
ran, and nothing else.

**Measured 2026-09-02.** From two failed local cells came the rule "cap local reviewers at one". Under
the operator's own limits (3 at once, 3 per vendor) all ten local cells then passed. The *mechanism* —
a KV cache reserved per parallel slot at a 128k context — is real; the rule drawn from it was not.
What the run licensed was "these two cells failed at this concurrency with this context size".

Write results with their conditions attached, and say plainly what the run does **not** settle. A
results document that names its own limits survives being read by someone who was not there; one that
states a general law from one afternoon gets quoted for a year.

## 4. Record the prediction BEFORE the run, and report observed-against-predicted (MANDATORY)

Write down what you expect to see and why, then run, then put the two side by side. A prediction
formed after the numbers arrive is not a prediction, and a run whose result "makes sense" is exactly
the one nobody checks.

This also settles what to do while a run is in flight: **finish the verification rather than stopping
to ask whether to continue.** A half-run measurement answers nothing, and the question interrupts the
one person who could have been doing something else.

## 5. A claim about code is settled by opening the file, never by remembering it (MANDATORY)

**Measured 2026-09-02**, judging thirty-five findings from five models against code the judge had
written days earlier. Three were marked *wrong* from memory and were **right** when the file was
opened — including one the judge had told the operator in writing was already fixed. It had been
fixed in the callee and left in the caller.

Memory of your own code is the least reliable evidence available about it, because it records what
you meant. When a reviewer — a model, a colleague, CI — makes a claim about a line:

- open the line, in the current working tree, and read what is there;
- if the claim is about behaviour rather than text, run it;
- report the verdict with the file and line that settled it.

"I remember removing that" is how one decision ends up living in two places
([reuse-first.md](reuse-first.md) — *A decision applied at SOME of its sites*).

## 6. A results document names its subject by sha, and its harness by path

Six months on, "the local model was faster" is unusable and `2b7d3ab, coai-matrix.mjs, 2026-09-02` is
reproducible. Name: the commit or input under test, the harness that ran it, the date, the pinned
variables, and the machine when the machine matters (a GPU measurement is about that card).

Related: [git-workflow.md](git-workflow.md) rule 9 — *"it is green" is a claim about a COMMIT, never
about now* — is the same discipline pointed at CI.

## Never

- Never publish a metric you have not hand-checked on a sample.
- Never compare arms whose inputs you have not read back at least once.
- Never state a conclusion the run's conditions do not license, however plausible the mechanism.
- Never judge a finding about your own code from memory.
- Never report a partial run as a result without saying which cells are missing.

## Definition of Done

- [ ] Every input except the variable under test is pinned in the harness, and one cell per arm was
      read back to prove the arms differ.
- [ ] Any automatic score was hand-checked on a sample before its numbers were reported.
- [ ] The written conclusion is no wider than the conditions run, and says what it does not settle.
- [ ] The prediction was recorded before the run and reported against the observation.
- [ ] Every claim about code in the write-up was checked by opening the file.
- [ ] The document names the subject sha, the harness, the date and the pinned variables.
