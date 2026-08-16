# Durable status for status-changing actions (MANDATORY)

Any button or action that changes the status of something or starts a process **must reflect the real,
current state across a reload, navigation, or F5** — never "clicked → reloaded → state lost". While work
runs, show "running" (e.g. *Processing…*, disabled); when it finishes, show the actual final state; if
it failed or the host crashed, never stick on the in-flight state.

In-component memory (a `_busy`/`_processing` flag) is **optimistic only** — never the source of truth,
because it dies on reload. The source of truth is **persisted server-side** and re-read on load.

## Rules

1. **Persist the in-flight state.** Write a real status (e.g. `Queued`/`Running`) *before* the work
   starts, advance it to the terminal state when it ends. The page derives the button label / badge /
   disabled-state from the persisted status, not only from a local flag.
2. **Detach work that must survive the client.** If the operation can outlive the request, it runs in
   the background, decoupled from HTTP (queue + hosted `BackgroundService`) — a request-bound run is
   aborted by the browser on reload/F5. The endpoint persists the queued state, enqueues, and returns
   `202` immediately.
3. **Advance the UI without a manual refresh.** Poll (disposal-safe, started only while something is
   in flight, self-terminating when idle) or push, so the persisted status flip appears live.
4. **Never get stuck.** On failure, revert out of the in-flight status with the reason shown. Add a
   **startup sweep** that ends rows orphaned by a crash — and make it **ownership-checked**: a row is
   swept only when its recorded owner host/pid is actually dead, never merely because the host
   restarted. (The reference implementation is `dew_flow_rag_qln`'s index passes: a distinct
   `Interrupted` terminal state for swept rows, owner columns on the row, progress counters that only
   grow so the UI never flickers backward.)
5. **Long work is visible** in the operator's UI for its duration — a process nobody can see is a
   process nobody can cancel or trust.
