---
paths:
  - "**/*.rs"
  - "**/Cargo.toml"
---
# Rust doctrine — the family's code rules

The Rust mirror of [../csharp/doctrine.md](../csharp/doctrine.md). Written down from what
`dew_flow_sidecar_rust` already practices; every rule below has a named precedent in that crate.
Where the two doctrines state the same idea, the idea is the rule and the language is the accent.

## 1. Toolchain & flavors

Edition 2021+. GPU execution providers are **compile-time features**; the binary is built per
machine, and CI builds the flavors a runner can actually build (`cpu` on ubuntu, the default on
windows) with `--locked` — a lockfile drift is a build failure, not a surprise. Vendor-toolchain
flavors (cuda, migraphx) are deliberately not built in CI; a job that can only report a missing
toolchain proves nothing.

## 2. Expected failures are values

`Result` end-to-end; expected failures travel as typed errors, never as panics. `anyhow` is legal
only at the binary's edges (startup, `main`) — wire-visible errors are typed in `wire.rs` and map to
one HTTP shape. A panic inside a `spawn_blocking` task is a **bug**, answered as 500: the handler
distinguishes `JoinError` (panicked) from `Err` (failed), and surfaces the panic payload in the
response text (`join_error_text` — the payload is the only place the actual reason lives).

## 3. `unwrap`/`expect` — the invariant is written beside it

Production paths carry `.expect()` only where an invariant makes it unreachable, and that invariant
is **stated in an inline comment at the call site** (the `expect("just loaded")` shape in
`inference.rs`: the same guard that inserts the entry is the only handle that can evict it). No
comment, no `.expect`. Tests use `unwrap`/`expect` freely — a test's panic is its failure report.

## 4. The reactor never blocks

CPU-bound work, model inference, and file I/O run on `spawn_blocking`, never on the async reactor
(the `/tokenize` incident: file I/O plus a CPU-bound encode on the reactor stalled every other
request). Borrows do not cross the `spawn_blocking` boundary — re-resolve inside the closure. Every
`JoinHandle` is observed: a detached task whose handle nobody awaits is a worker that dies with no
line in the log (`provider.rs` wraps even its one-shot provenance task so the fault is OBSERVED).

## 5. Locks refuse, recover, and log

A request-path `Mutex` is taken as **try-lock-or-refuse**, never as a queue behind a possibly wedged
holder (`lock_or_refuse` + the wedge policy: a stuck inference makes `/health` say `wedged` and new
requests get a refusal, not a place in line). Every lock recovery path calls `clear_poison()` **and
logs** — the silent `let Ok(..) = lock() else { return }` skip is the named anti-pattern
(`bookkeeping.rs`: one poisoning silently disabled a recorder for the life of the process).

## 6. RAII for invariants that span phases

An invariant that must hold across build-then-first-use (or any two phases a lock cannot span) is a
guard object held for the whole span, not a comment asking callers to be careful
(`CachePathLease`: the MIGraphX cache-path claim held across the build AND the first inference,
because the lock that only spanned the build was a measured race).

## 7. Layout and tests

Flat, one concern per file (`wire.rs`, `wedge.rs`, `handlers.rs`, …); split a file when it grows a
second concern, not a second hundred lines. Tests live in `#[cfg(test)]` beside the code they pin;
shared fixtures in `testing.rs`. Test names state guarantees, per
[../common/testing.md](../common/testing.md) — `cargo test` is the runner (the executables-only rule
is .NET-specific).

## 8. Comments carry the why

Comments state constraints, invariants and measured incidents — never restate the line below. A
dependency pin, a deliberate non-default, a refused alternative each get the reason written where
the decision sits (the crate's `Cargo.toml` is the reference: every pin explains itself).

## 9. Logging and numbers

Logging is `tracing`, per the Rust section of [../common/logging-serilog.md](../common/logging-serilog.md)
— ANSI stdout layer, plain file layer, same path shape, UTC. A numeric engine ships a **canary**: a
committed reference output compared at startup, so a wrong-but-plausible number is a red check, not
a quiet quality drop (`canary.rs` + `canary-reference.f32le`).
