# Take the card before you use it (MANDATORY for GPU work)

> This machine has **one usable GPU**. Several things want it at once — an index pass embedding for twenty
> minutes, a search reranking inside its request, a local model held resident, and **other agents working
> from their own terminals in processes nobody can see**. Without a lease they collide, and the symptom is
> not an error: it is everything being slow, a pass taking three times as long, and searches queueing behind
> it with no signal at all.

## The rule

**Before running anything on the GPU, take the lease. Use the wrapper, not the raw endpoint.**

```bash
node <rag-repo>/tools/gpu-lease/dewflow-gpu.mjs run --reason "what this is for" -- <your command>
```

Who has it right now:

```bash
node <rag-repo>/tools/gpu-lease/dewflow-gpu.mjs status
```

The wrapper claims, spawns your command, heartbeats while it runs, and releases in a `finally` — on
success, on a non-zero exit, and on Ctrl-C. **That is why it exists.** An agent that has to remember to
release is an agent that eventually will not, and a lease nobody releases is a card nothing may touch until
a sweep notices.

It also sends its own pid, which puts you on the **liveness** path: if your process dies the daemon proves
it and hands the card back at once. A claimant that cannot supply a pid gets a two-minute TTL instead and
must keep renewing it.

## What counts as GPU work

Anything that embeds, reranks, or runs a local model: an index pass, a benchmark leg, an Ollama call, a
`llama.cpp` run, a script that calls the sidecar. **Tokenising does not** — it is CPU on the sidecar, and
gating it would serialise the one stage with no reason to wait.

## Waiting is the point

`--wait` blocks (default 600 s) and the endpoint long-polls. Waiting is the DEFAULT because a refusal you
have to poll turns you into a retry loop. Past the budget you get a refusal that **names the holder**, and
exit **75** — being told "busy" leaves you nothing to do but retry; being told *"indexer is indexing
aspnetcore, six minutes in"* lets you wait properly, do something else, or use the non-GPU tools.

## Never

- Never start GPU work without a lease because "it will only take a second". The pass you interrupt does not
  take a second, and the collision is invisible until someone measures it.
- Never hold a lease across a pause for human input. Release, ask, re-claim.
- Never poll `POST /api/gpu/lease` in a loop with `waitSeconds: 0`. That is the retry loop the long poll
  exists to remove; pass a real budget instead.
- Never write your own claim/release around the raw endpoint when the wrapper will do. If you must, you own
  the release on every path your code can throw on — which is the whole reason the wrapper exists.

## Definition of Done

- [ ] Every GPU command an agent runs goes through `dewflow gpu run`.
- [ ] The `--reason` says something an operator can act on, not "work".
- [ ] Nothing holds the card across an idle wait.

## Where it lives

The lease is served by the `dew_flow_rag_qln` daemon (`/api/gpu`), which discovers itself through
`%LOCALAPPDATA%/dew-flow/daemon.json`; the wrapper reads that file, so no address needs configuring. The
design and its reasoning: `dew_flow_rag_qln · research/PLAN_gpu_arbitration.md`.
