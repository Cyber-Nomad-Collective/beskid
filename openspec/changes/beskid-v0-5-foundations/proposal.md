## Why

The v0.5 networking release cannot safely build on the current Foundation contract. The current implementation and standard permit a scalar-only fiber/channel ABI, worker-thread-local wakes, no scheduler timer source, and `use` as an import-only form. Those gaps lose generic values and GC roots, can leave an owner scheduler asleep, cannot arbitrate timeout races, and have no scoped resource cleanup contract.

CYB-60 establishes the Foundation gate before CYB-61 networking and CYB-62 HTTP. This change makes the v0.5 contracts explicit before implementation begins.

## What Changes

- Define bindable `spawn`, rooted `Fiber<T>` results and captures, consuming join/detach behavior, idempotent cancellation, and main-fiber child shutdown.
- Define canonical traced ABI-value channel transport, commit/cancel ownership, close-after-drain, and parking without holding the channel mutex.
- Define owner-routed external completion, active external-wait accounting, monotonic generation-tagged timers, and exactly-one wait winners.
- Define the `spawn` expression and scoped `use` binding grammar, `Disposable` cleanup ordering, `Core.IO`, strict bytes/encoding behavior, and the corrected `ReadBytesWith` result type.
- Add an acceptance matrix that assigns parser, semantic, runtime, corelib, JIT, AOT, and native evidence to each normative requirement.

## Compatibility, migration, and rollout

- The scalar `i64` fiber result and channel queue representation is incompatible with the v0.5 contract and MUST be replaced by the one traced ABI-value representation; no scalar fallback remains.
- TLS-local external wake delivery is replaced by owner-scheduler inbound commands and a wake primitive; no worker-local completion route remains.
- `use` is a new scoped-binding form. It has no `using` alias and MUST NOT be interpreted as an import.
- Existing source that discards a non-detached spawn handle becomes a diagnostic; callers explicitly retaining fire-and-forget behavior MUST call `Detach`.
- No catalog regeneration or deployment occurs in this change. Catalog generation, site publication, and implementation rollout follow only after the Foundation evidence gate is green.
- Native-handle representation, network address and type contracts, TCP, UDP, and DNS belong exclusively to CYB-61. HTTP framing, routing, server, and HTTP API contracts belong exclusively to CYB-62.

## Rollback

Before implementation, this OpenSpec change can be abandoned without runtime or public artifact rollback because it changes only proposed normative deltas. During implementation, rollback is one coordinated revert of the ABI value, owner-command, timer, and corelib API work; partial rollback is forbidden because it would restore multiple competing ownership paths.

## Impact

- Affected canonical capabilities: fibers/spawn, channels, scheduler, grammar/parser, error handling, bytes, encoding, core concurrency, Core.Syscall, and corelib API shape.
- Affected implementation surfaces: parser and semantic analysis, lowering and ABI manifest, scheduler and runtime builtins, foundation and concurrency corelib packages, JIT, AOT, and native runtime-kit conformance.
- Follow-on changes: CYB-61 networking consumes `Channel<TcpStream>`, `use`, monotonic deadlines, and owner-routed external completions; CYB-62 HTTP consumes only those completed Foundation contracts.
