## Why

The 0.5 runtime kept every scheduler and synchronization table at a toy size baked into the source: 16 fibers, a 32-entry run queue, 32 pending cancels and wakes, 64 channels with 64-bit waiter masks, 32 mutexes with 16 waiters each, 16 wait groups with 16 waiters, 16 hubs with 256 registrations, 32 poll tasks, 64 monitors and links, 32 external waits, 256 composition plan entries, and a 1 GiB heap cap that only an executable host could raise. A program that spawned a seventeenth fiber or created a sixty-fifth channel got `-1` from the runtime with nothing exhausted. Go, Tokio and the JVM size these structures by demand; so must Beskid before 0.6 ships.

## What Changes

- Every runtime table that hands out handles (fibers, channels, mutexes, wait groups, hubs, poll tasks, poll monitors and links, external waits) is chunked, growable storage allocated from the system allocator. Records never relocate, so handles, traced `BeskidAbiValue` slots and registered GC roots stay valid across growth. Handle generation and staleness checks are unchanged.
- Waiter lists (channel send and receive waiters, mutex and wait-group waiters, hub waiters), the run queue, the poll ready queue, the external timer heap and the scheduler's pending-operation lists are growable vectors or rings. Channel and hub waiters are FIFO handle lists instead of 64-bit index masks.
- The only failure of any table is the system allocator refusing more memory. Creation paths report it the way they reported a full table (`-1`, null, `HubLimit`); paths that cannot report (a lost wake) trap as `out_of_memory`.
- The composition container sizes its slot array to the compiler's plan and a scope's owned values grow on demand; the 256-entry plan cap is gone.
- The managed heap has no fixed default cap. `BESKID_HEAP_MAX` (decimal bytes with an optional `k`, `m` or `g` suffix) installs one at `beskid_rt_v5_process_init`; the runtime itself reads it so every activation path (executable host, library attach, embedding engine) honours it identically. An unparsable value or one the runtime rejects traps with the variable name. Out-of-memory remains the existing diagnosable trap.
- `BESKID_FIBER_STACK_MAX` sets the per-fiber stack reservation (default 8 MiB); it must be a whole multiple of the 64 KiB initial commit.
- **BREAKING**: `BESKID_HEAP_MAX_BYTES`, read by the executable host only, is removed in favour of `BESKID_HEAP_MAX`, read by the runtime.
- `BeskidSchedulerState` is a 208-byte header of pointers and counters (no inline arrays); `BeskidPollState`, `BeskidPollTask` and `BeskidPollLink` describe the actual record layouts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `execution--runtime--fiber-scheduler-and-stacks`: growable scheduler tables, no fixed fiber count, configurable per-fiber stack reservation.
- `execution--runtime--channels-and-synchronization`: growable channel, hub, mutex and wait-group tables and waiter lists.
- `execution--runtime--memory-and-gc-runtime-contract`: no fixed heap cap, `BESKID_HEAP_MAX` read by the runtime.

## Impact

Runtime: `compiler/runtime/beskid/src/Runtime/Fiber/Scheduler/{Storage,Core,Queue,Poll,External}.bd`, `Sync/{Channel,Mutex,WaitGroup}.bd`, `PubSub/Hub.bd`, `Host/Composition.bd`, `Bootstrap/Lifecycle.bd`, `Mem/Gc/State.bd`; `compiler/runtime_manifest.bsol` layouts and the regenerated ABI artifacts; `crates/beskid_abi/assembly/common/executable_bootstrap.c` loses its environment parsing. Tests: `beskid_engine` native-kit heap and limit fixtures, `beskid_manifest` layout tests, the Corelib `ConcurrencySuite`.

Catalog: run `validate-standard` and regenerate `openspec/catalog.json` after this change is applied.
