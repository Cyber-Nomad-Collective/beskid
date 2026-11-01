## Why

`Core.Threading.Thread.Spawn` passed the integer `0` as the `pthread_t*` out-parameter of `pthread_create`, so the C function wrote through a null pointer. `Join` repeated the error for `pthread_join`. Corelib has no address-of operation that could fix this, and nothing in corelib or the compiler called `Spawn` (docs/research/2026-10-13-glue-design-review.md). Fibers are the Beskid concurrency model.

## What Changes

- **BREAKING** Delete `Thread.Spawn`, `Thread.Join`, the `Thread` handle type, the `LinuxPthread`/`DarwinPthread` extern contracts and `ThreadError` from corelib foundation.
- Keep `Core.Threading.Thread.Yield`, which calls the canonical `__thread_yield` runtime service.
- Modify the Core.Threading OS-thread surface decision: corelib exposes no raw OS-thread creation. The 0.6 way to start concurrent work is a fiber `spawn` expression. CPU parallelism is planned for 0.6.1 through 0.6.5 through isolates (`v061-attributes-and-isolate-prerequisites`, `v062-captures-and-move`, `v063-isolates-and-scope`, `v064-ports-and-pipelines`, `v065-parallel-sequences`).
- The modified decision is rebased on the current base text: it keeps the stable ID, the legacy provenance lines and the base scenario "Conformance exercises Decision", and adds "Corelib exposes no raw thread spawn". The migrated rule table ("`Core.Threading` is the only supported preemptive OS-thread module") is replaced, because 0.6 has no preemptive OS-thread creation API.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `core-library--concurrency--core-threading`: Core.Threading exposes only the OS-level yield.

## Impact

`compiler/corelib/packages/foundation/src/Core/Threading/Thread.bd` keeps only `Yield`; `ThreadError.bd` is deleted. The corelib test `thread_surface_imports` is deleted. Runtime-internal threads of the fiber scheduler are not affected. Public standard links remain /docs/standard/.

## Compatibility, Migration and Reversion

No users exist; the API is deleted without deprecation. A future OS-thread API needs an out-parameter form in the C profile or a runtime service first, and a new OpenSpec change.
