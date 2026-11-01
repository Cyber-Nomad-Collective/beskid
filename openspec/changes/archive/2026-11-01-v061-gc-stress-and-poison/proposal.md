## Why

`v06-runtime-fail-fast` makes the runtime trap when a service receives a dead managed operand. The trap fires only when a collection runs between the moment that a root is missing and the moment that the operand is used, and only while the freed slot is not yet given to a new object. In ordinary test runs a collection runs rarely, so a missing root can stay hidden for a long time. A slot that the allocator gives again to a new object hides the error completely, because the reference then resolves to a live object of possibly another type.

Mature managed runtimes have two standard tools for this class of error. A stress mode collects much more often than the pacing policy does, so that every missing root is exercised. Poisoning and quarantine of freed memory make a use of freed memory visible, and delay the reuse of freed memory so that the liveness check can see it. Beskid adds both tools to the runtime and runs them in CI.

## What Changes

- A GC stress mode, set by the environment variable `BESKID_GC_STRESS` at `beskid_rt_v5_process_init`. Value `alloc` collects before every managed allocation. Value `alloc:<n>` collects before every n-th allocation. The runtime reads the variable itself, as it does for `BESKID_HEAP_MAX`, so every activation path behaves the same. The existing test hook `gc_heap_set_stress_interval` becomes the implementation of this mode and moves from the allocation slow path to every allocation.
- Heap verification in stress mode: when `BESKID_GC_STRESS` contains `verify`, the runtime runs `gc_heap_verify` before and after each collection and traps `runtime_internal_corruption` (10) when verification fails.
- Poisoning of freed objects in the debug runtime kit: the sweep fills the bytes of each freed slot after the free-list link with a fixed poison pattern. The liveness check of `v06-runtime-fail-fast`, the marker and the verifier trap when they find the pattern where a live object header must be.
- A quarantine of freed slots in the debug runtime kit: a freed slot goes into a FIFO with a byte budget before it returns to the free list of its span. Thus a dangling reference keeps pointing at a freed, poisoned slot for longer, and the liveness check can detect it.
- CI: the Woodpecker Linux validation lane runs the Corelib tests and `runtime_semantics` once with `BESKID_GC_STRESS=alloc:1,verify` against the debug kit.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `execution--runtime--memory-and-gc-runtime-contract`: adds the GC stress mode and the debug-kit poisoning and quarantine.

## Impact

Runtime: `compiler/runtime/beskid/src/Runtime/Mem/Gc/{Verify,Allocation,Sweep,Collection,State}.bd`, `Bootstrap/Lifecycle.bd` (environment), and one build-profile fact for the debug kit through `runtime_manifest.bsol` with regenerated ABI artifacts. Tests: `beskid_engine` native-kit fixtures for each mode. CI: `scripts/ci/` Linux validation lane. Release kits do not change behavior when `BESKID_GC_STRESS` is absent.
