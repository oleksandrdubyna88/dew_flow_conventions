# PLAN — the two product manuals go home

> Status: **plan only; its precondition is half met.** Extracted from
> [research/PLAN_rule_ownership_and_release_pinning.md](../research/PLAN_rule_ownership_and_release_pinning.md)
> § 5 when that plan was promoted on 2026-09-15: everything else in it shipped, and this is the part
> whose precondition is not a decision but a deployment.
>
> Scope: `common/coai-review-gate.md`, `common/coai-caller-model.md`, `common/coai-document-gate.md`
> and `common/gpu-lease.md` in this repository, plus the product surfaces that have to carry what
> leaves them.
>
> Related docs: [common/rule-ownership.md](../common/rule-ownership.md),
> [research/module_tests.md](../research/module_tests.md).

## The symptom this still carries

Four rules hold **39 product references**, every one of them declared with an `owns:` marker and a
reason, which is what let the check be armed. Declaring them was the right answer for what they are —
a tool surface every repository must type, and a lease server the family has one of — but it is not
the answer this programme's plan chose for the FILES.

A shared rule carrying one product's protocol is still a rule the other five repositories must mount,
read and version, and whose every change is a commit in six places. The obligation is shared; the
protocol is not.

## The split, by body

**The obligation stays**, vendor-neutral, in a shared rule:

- run an independent review IN ADDITION to your own, and start both at once;
- the order is a contract — plan, review, implement, review, pull request;
- never a bare diff without scope, because a reviewer holding only a diff cannot judge whether the
  code is what was ASKED for;
- a request for a person stops the shipping;
- for GPU work: take the lease, wait rather than poll, release on every path, name the holder in a
  refusal.

**The protocol goes to the product that serves it** — tool names, arguments, verdict words; the GPU
wrapper's flags, its endpoint and its discovery file — because both products already reach a session
through surfaces that need no rule file: an MCP server's instructions and its tool descriptions.

## The precondition, and where it stands

Three things reached a session ONLY through the shared rule, so reducing the shared copy first would
take them off every surface.

| | state |
|---|---|
| the COMMANDS block | **shipped** to `Program.Instructions` (`dew_flow_connect_other_ais`, PR #281) |
| reject in round ONE, with its convergence argument | **shipped**, same PR |
| the enforced stop after `call_human` | **shipped**, same PR — and it corrected a stale claim on two surfaces: the override applies only after that verdict, not "while rounds remain" |
| **verified in a LIVE session** | **not done** |

The last row is the whole blocker, and it is not a review question. Instructions reach a caller from
the **installed** server, not from `main`: an agent session talks to whatever build is on the machine.
So the check is a deployment and a read-back, and it cannot be performed by the session that wrote the
change.

## Build order

1. **Cut a release of the gate** and install it.
2. **Live check.** Open a fresh session in a repository that mounts NO conventions, and read back the
   served instructions. All three must be there. Record the session and the version.
3. **Reduce `common/coai-review-gate.md`** to the obligation. Its `owns:` markers for the seven tool
   names leave with the protocol; `coai` and `ConnectOtherAIs` stay only if the remaining prose still
   names them.
4. **`coai-caller-model.md` and `coai-document-gate.md`**: the same question, one file at a time. Both
   exist because the gate rule was frozen, so retiring the freeze may merge them back rather than move
   them.
5. **`gpu-lease.md`**: the obligation stays because three consumers do GPU work; the wrapper's flags,
   the endpoint and `%LOCALAPPDATA%` discovery path go to the repository that serves them.
6. **A migration inventory**, committed, mapping every passage that leaves to exactly one of: a
   consumer-local rule (named file and `local.*` id), a product surface (named source file), or a
   deliberate deletion with its reason — each verified as LANDED by pull request URL rather than by
   memory. The reliability ledger is the shape to copy.

## What must not happen

- **No passage leaves without a named destination.** A count that reaches zero by deleting an
  actionable rule is the failure this programme exists to prevent.
- **No shared rule may `depends:` on a `local.*` id.** The dependency runs the wrong way and fails the
  whole catalog wherever the local rule is absent.
- **The armed check stays armed.** Anything that survives the split is declared in its own file.

## Test plan

- `node tools/ownership-check.mjs` — still exit 0, with no baseline, after every step.
- `node tools/rule-bodies.mjs --update` for each reduced rule, in the same commit.
- `npm test`, including the audit-ledger and freeze cases.
- The live check of step 2, recorded with the build version it was run against.

## Definition of Done

- [ ] A released gate build is installed, and a fresh session with no conventions mounted was shown to
      receive all three instructions.
- [ ] Every product manual's obligation is shared and its protocol lives with the product that owns it.
- [ ] The migration inventory is committed, and every mapping names a landed pull request.
- [ ] No shared rule `depends:` on a `local.*` id; the ownership check is still armed and green.
