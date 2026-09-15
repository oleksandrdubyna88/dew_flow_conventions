---
id: "common.coai-caller-model"
load: "conditional"
tasks: ["plan","implement","docs","policy","test","git","pr","release","deploy","dependencies"]
---
<!-- coai-caller v2 -->
## Say which model you are when you open the review gate

<!-- owns: coai — the MCP server whose handshake this rule is about, named in its tool prefix -->
<!-- owns: mcp__coai__open — the tool that carries the declaration; the argument is on that call and no other -->

> **This extends [coai-review-gate.md](coai-review-gate.md), and it is a separate file because that
> one is frozen.** `tools/rules.test.mjs` hashes all 24 migrated rule bodies against baseline
> `5d6984eb` as evidence that nothing was lost when the rules moved, so adding a sentence to the
> gate rule turns the suite red. The house precedent — `common/task-lifecycle.md`,
> `common/coai-document-gate.md` — is a new file that says where it belongs once the inventory
> retires. **Where this belongs then: inside step 1 of `coai-review-gate.md`.**

**When you call `mcp__coai__open`, pass your own model id as `callerModel`.** One argument, on every
open, for the whole of this rule:

```
open(repoPath, branch, callerModel: "claude-opus-5")
```

Use the id you are actually running as — `claude-opus-5`, `codex-astra`, `gemini-3-pro` — not the
family name, and not the name of the product you are running inside.

### Why you have to be asked

The MCP handshake already tells the server which CLIENT is calling: `claude-code`, `codex`,
`gemini-cli`, with its version. **No field anywhere in the MCP protocol carries a model.** So this
is the only way a review gate can record which model asked for a round, and the log's whole purpose is
answering "what does the AI writing this code habitually miss" — a question that is about the model,
not about the CLI it arrived through.

*Checked 2026-09-13* against the `ModelContextProtocol` .NET SDK 2.2.0, which is what this gate's
server runs: `initialize` carries `clientInfo { name, version }` and the protocol's own
`Implementation` type has `Name`, `Title`, `Version`, `Description`, `Icons` and `WebsiteUrl` —
no model, on the `2025-11-25` revision or the `2026-07-28` one. Re-check before assuming this is
still true of a later revision; if a model field ever arrives, this rule is what retires.

**Send it again on every `open`, including one that resumes a session you already opened.** That is
the reason it is an argument rather than an environment variable: a variable is read once when your
process starts, so a model switched mid-session — `/model`, an escalation, a fall-back — would leave
every later round in the log naming the model you stopped using. A confidently wrong record is worse
than a silent one.

### If you genuinely do not know it

Leave the argument out. The round is then recorded as stating no model, which is true, and the log
shows *model not stated*. **Never send a guess, a family name, or the model you think you probably
are.** The blank is honest and costs one line of a log; a guess is a wrong answer to the only
question this field exists to answer, and nothing downstream can tell it apart from a real one.

### Definition of Done

- [ ] Every `open` in this task passed `callerModel`, or deliberately passed none.
- [ ] The id sent is the model actually answering, not its family or its host product.
- [ ] A model switched mid-task was followed by an `open` carrying the new id.
