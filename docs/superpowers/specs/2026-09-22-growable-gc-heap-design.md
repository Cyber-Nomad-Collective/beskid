# Growable GC heap design

Owner ruling: v0.5 ships a growable managed heap. This document fixes the
approach, the heap-state layout, the growth policy, the failure contract, and
the verification plan. It is a design only; no build ran while writing it.

Code root for every path below unless stated otherwise:
`compiler/` (worktree `.worktrees/compiler-f6-native-descriptor-contract`).
OpenSpec paths are relative to the repository root.

## Intent

Today the managed heap is one fixed region of `HEAP_REGION_SIZE = 1048576`
bytes (`runtime/beskid/src/Runtime/Bootstrap/Lifecycle.bd:25`), installed by
`HeapInit` (`runtime/beskid/src/Runtime/Mem/Gc/RootsHandles.bd:180`). When
`GcAlloc` (`runtime/beskid/src/Runtime/Mem/Gc/Allocation.bd:73`) cannot bump
or reuse a free block it runs `GcCollect()` once, retries, and returns
`NativePointer(0)`. Generated code then executes
`trapz(value, TrapCode::unwrap_user(5))`
(`crates/beskid_isle/src/context/aggregate.rs:53,219`,
`crates/beskid_isle/src/context/calls.rs:133,282,511,670`,
`crates/beskid_isle/src/context/enums.rs:214`). In AOT output that trap is a
bare `brk`/`ud2`: the process dies with SIGILL, no diagnostic, no exit status
101. Any program with more than roughly 1 MiB of live managed data dies this
way; the corelib regex and pest tests reach it first.

Normative context: `openspec/specs/execution--runtime--memory-and-gc-runtime-contract/spec.md`
already states "On failure, runtime traps (panic), no silent null returns for
required objects" and "Full heap during `str_concat`: panic/trap, matches
allocation failure policy". The runtime manifest already names trap code 5
`out_of_memory` (`runtime_manifest.bsol:1857`). The current behaviour
satisfies neither the trap nor the diagnosability half of that contract.

## Current facts that constrain the design

| Fact | Where | Consequence |
| --- | --- | --- |
| Collector is non-moving. Compiled code, external roots (`gc_register_root`), handles (`gc_root_handle`), ABI-value slots, and C hosts hold raw object addresses. | `Mem/Gc/RootsHandles.bd`, `Mem/AbiValue.bd` | The heap can never relocate an object, so it cannot be "re-mapped" into a larger contiguous block by copying. |
| `system_allocate` is one `mmap` (Darwin, Linux) or one `VirtualAlloc` (Windows) per call; `system_free` is the matching `munmap`/`VirtualFree` by size. No remap, reserve, or commit intrinsic exists. | `crates/beskid_abi/assembly/*/platform.S`, `platform.asm` | Growth must be additive mappings unless the manifest gains new platform intrinsics. |
| Every heap walk (`IsAllocatedObject`, `AllocateFromFreeList`, `ResetMarkedObjects`, `ProcessGrayStack`, `Sweep`) starts at `region_start` and stops at `bump`; object boundaries come only from the descriptor at offset 0 or, for free blocks, `{0, block_size}`. | `Mem/Gc/State.bd:66`, `Allocation.bd:24`, `Collection.bd:54`, `Marking.bd:45`, `Sweep.bd:8` | Multiple regions need one shared "walk every region" iteration; the per-block boundary rule stays unchanged. |
| `HeapContains` is the "is this a heap pointer" test: `start <= address < bump && address % 8 == 0`. `ManagedObjectForReference` uses it for interior array references (value = object + 24). | `State.bd:56`, `Marking.bd:9` | Must become a per-region range test. |
| `AllocateFromFreeList` scans the whole heap from `region_start` on every allocation. | `Allocation.bd:24` | Already O(heap) per allocation; with a heap that grows to tens of MiB this becomes the dominant cost. The design must bound it. |
| Source heap-state constants (`HEAP_STATE_SIZE = 720`, `HEAP_GC_PHASE = 64`, `HEAP_EXTERNAL_ROOTS = 80`, `HEAP_HANDLES = 592`) disagree with the manifest layout `BeskidHeapState` (size 768, `gray_count` at 64, `gray_entries` at 72, `external_roots` at 128, `handles` at 640). No test cross-checks them. | `State.bd:10-26`, `runtime_manifest.bsol:1659` | The layout is already drifting. This change realigns both and adds the missing cross-check. |
| Tests that embed the heap layout: `crates/beskid_codegen/tests/isle_adapter/control_flow_closures_spawn.rs:546-555` builds a 90-word heap with words 0..3 = region start, size, bump, limit. `crates/beskid_abi/tests/runtime_bootstrap_contract.rs:283` only asserts the layout name exists. | | Exactly one fixture needs an update. |
| Runtime `.bd` sources contain no string literals; `Strings.bd:150-160` already renders decimal digits with `raw_byte_store`. | `runtime/beskid/src/Runtime/Data/Strings.bd` | A trap message can carry numbers, not prose. Prose must come from the C host. |
| `beskid_rt_v5_intrinsic_trap(code, message, len)` prints `beskid runtime trap v5: <message>` and `_exit(101)`; it ignores `code`. | `crates/beskid_abi/assembly/aarch64-apple-darwin/platform_host.c:157` (Linux and Windows twins) | The host can print the trap name from the manifest table with a small change. |
| `env_get` returns a managed `str` and therefore cannot run before the heap exists. The executable host `executable_bootstrap.c` owns process activation and already includes the generated C header. | `crates/beskid_abi/assembly/common/executable_bootstrap.c` | Cap configuration from the environment belongs to the host, after `process_init`, through an exported runtime call. |
| Runtime kits validate `source_hash` and `layout_hash` against the installed kit. | `crates/beskid_abi/src/runtime_kit/validation.rs` | Any `.bd`, manifest layout, or platform host change requires a kit rebuild. |
| Fibers keep their own root-frame chains; `MarkSuspendedFiberRoots` walks them; fiber contexts and stacks are `SystemAllocate` storage, never heap objects. | `runtime/beskid/src/Runtime/Fiber/Scheduler/Core.bd:395` | Growth never touches fiber storage; roots only reference objects, and objects never move. |

## Decision 1: chained regions, not one re-mapped region

The heap becomes a singly linked chain of independently mapped regions. Each
region is one `SystemAllocate` result and carries a 64-byte region header at
its base; objects start at `base + 64`. The heap state keeps the chain head,
the region receiving bump allocations (always the chain tail), the region
count, the committed byte total, and the growth and cap policy fields.

Rejected: a single region re-mapped larger.

- Copying into a larger mapping requires moving objects. Every raw address
  held by compiled code, external roots, handles, ABI-value slots, fiber
  frames, and C hosts would dangle. Introducing forwarding would convert the
  collector into a moving one, which is a different v0.6-scale project.
- Growing in place (`mremap`, or reserve-then-commit with `mprotect` /
  `VirtualAlloc(MEM_COMMIT)`) needs new manifest intrinsics implemented in
  three platform assemblies plus fail-closed validation of each, and Darwin
  has no `mremap`. Reserve-then-commit also forces choosing the reservation
  size up front, which is the same cap question with worse failure modes.
- Chaining is how simple non-moving mark/sweep collectors grow (Boehm heap
  blocks, MicroPython split heaps, Lua's allocator-backed growth). It keeps
  the platform intrinsic surface exactly as it is, keeps every existing
  object-boundary rule, and makes huge objects trivial (a dedicated region).

## Region header layout

Every region starts with this 64-byte header. `REGION_HEADER_SIZE = 64` keeps
`objects_start` 16-byte aligned for every page-aligned base.

| Offset | Field | Meaning |
| --- | --- | --- |
| 0 | `next` | Next region base, 0 for the tail. |
| 8 | `size` | Whole mapping size in bytes, header included. Passed back to `SystemFree`. |
| 16 | `bump` | First unallocated byte. Starts at `base + 64`. |
| 24 | `limit` | `base + size`. |
| 32 | `free_bytes` | Sum of free-block sizes, rebuilt by sweep, decremented by free-list reuse. |
| 40 | `largest_free` | Upper bound on the largest coalesced free block, rebuilt by sweep. Never increased outside sweep. |
| 48 | `objects_start` | `base + 64`. Stored so walkers never recompute it. |
| 56 | `reserved` | 0. |

The block rule inside `[objects_start, bump)` is unchanged: a block with a
non-zero first word is an object whose size is `ManagedObjectSize`; a block
with a zero first word is a free block whose size is its second word; every
block is at least 16 bytes and 8-byte aligned. The region header is outside
that range, so no walker can mistake it for a block.

## Heap-state layout (explicit new offsets)

Fields at 32..72 keep their present offsets so the exported statistics
(`gc_bytes_allocated`, `gc_object_count`, `gc_phase`, collection count and
threshold) and `GcWriteBarrier` read the same words as before. The region
fields at 0..32 change meaning. New policy fields follow the phase word.
External roots and handles shift.

| Offset | Field | Type | Notes |
| --- | --- | --- | --- |
| 0 | `first_region` | pointer | Chain head. Replaces `region_start`. |
| 8 | `current_region` | pointer | Chain tail; the only region that bump-allocates. Replaces `region_size`. |
| 16 | `region_count` | usize | Replaces `bump`. |
| 24 | `committed_bytes` | usize | Sum of region `size` words. Replaces `limit`. |
| 32 | `live_bytes` | usize | Unchanged. |
| 40 | `live_count` | usize | Unchanged. |
| 48 | `collection_count` | usize | Unchanged. |
| 56 | `collection_threshold` | usize | Unchanged offset; new meaning, see pacing. |
| 64 | `gc_phase` | usize | Unchanged (0 idle, 1 marking, 2 sweeping, 3 failed). |
| 72 | `cap_bytes` | usize | Maximum `committed_bytes`. |
| 80 | `next_region_size` | usize | Size of the next growth region. |
| 88 | `failure_reason` | usize | 0 none, 1 cap reached, 2 `system_allocate` failed, 3 request larger than cap. Set immediately before the trap; readable by the host trap path and by tests through `gc_heap_failure_reason`. |
| 96 | `failure_request_bytes` | usize | Requested size at the failing allocation. |
| 104 | `diagnostic` | u8[64] | Trap message bytes rendered by the runtime. |
| 168 | `external_root_count` | usize | Was 72. |
| 176 | `external_roots` | pointer[63] | Was 80. Ends at 680. |
| 680 | `handle_count` | usize | Was 584. |
| 688 | `handles` | BeskidGcHandleSlot[8] | Was 592. Ends at 816. |
| 816 | size | | `HEAP_STATE_SIZE = 816`, alignment 8. |

The manifest layout `BeskidHeapState` (`runtime_manifest.bsol:1659`) is
rewritten to exactly this table; `gray_count` and `gray_entries` are removed
because the source never had them (marking discovers gray objects by walking).
`HEAP_*` constants in `State.bd`, `Allocation.bd`, `Collection.bd`,
`Sweep.bd`, `RootsHandles.bd`, and `Lifecycle.bd` are updated to match, and a
new Rust test parses those constants from the canonical sources and asserts
they equal the manifest offsets, so the two cannot drift again.

Runtime-state and TLS layouts are untouched. `BeskidRuntimeState.heap` still
points at the heap state.

## Allocation across regions

`GcAlloc(size, alignment)` becomes:

1. Reject invalid requests as today (`size < 16`, misaligned, bad alignment).
   These still return null, and the compiler's `trapz` stays as the
   fail-closed backstop for that impossible-by-construction case.
2. Free-list pass: for each region in chain order, skip it when
   `largest_free < size + alignment` (the alignment slack bounds the prefix
   rule already used by `AllocateFromFreeList`); otherwise run today's
   in-region scan on `[objects_start, bump)`. On success decrement
   `free_bytes` by the consumed bytes (prefix and remainder blocks stay
   counted as free). `largest_free` is left as is; it is an upper bound and
   sweep rebuilds it.
3. Bump pass in `current_region` only, with today's gap-block rule.
4. If both fail, run the pacing decision below, then retry steps 2 and 3
   once.
5. If the retry fails, report exhaustion (Decision 3). `GcAlloc` never
   returns null for a valid request.

Bump allocation only happens in the tail region. Earlier regions are served
by their free lists. This keeps "bump then limit" a single-region check and
keeps the tail the only region whose `bump` moves.

## Decision 2: growth policy

Pacing follows the Lua and Go shape: collect when allocation since the last
collection has matched the live set that survived it; otherwise grow.
Programs with genuinely large live data grow instead of thrashing
collections; garbage-heavy programs collect and reuse.

Definitions:

- `collection_threshold` is the `live_bytes` value at which the next
  collection is due. After every collection it is set to
  `max(2 * live_bytes, HEAP_MIN_THRESHOLD)` with `HEAP_MIN_THRESHOLD = 512 KiB`.
  `HeapInit` sets it to `HEAP_MIN_THRESHOLD`. `gc_collect_if_needed` keeps its
  exported semantics (`live >= threshold` triggers a collection).
- `next_region_size` starts at `HEAP_INITIAL_REGION_SIZE = 1 MiB`, doubles
  after every growth, and stops doubling at `HEAP_MAX_REGION_SIZE = 64 MiB`.
- `cap_bytes` defaults to `HEAP_DEFAULT_CAP = 1 GiB`.

When the bump pass fails for a request of `size` bytes:

1. If `live_bytes >= collection_threshold`: collect, then retry. If the retry
   succeeds, done.
2. Otherwise, or if the retry failed: grow. The new region size is
   `max(next_region_size, AlignUp(size + REGION_HEADER_SIZE + alignment, 4096))`.
   Requests larger than `next_region_size` get a dedicated region of their
   own size; this is how huge arrays work without a separate large-object
   space.
3. Cap check: if `committed_bytes + new_size > cap_bytes`, first try the
   remaining budget `cap_bytes - committed_bytes` rounded down to 4096 if it
   still fits the request; otherwise, if no collection ran in step 1, collect
   now as a last resort and retry the free-list and bump passes. If that also
   fails, the heap is exhausted: `failure_reason = 1`.
4. `SystemAllocate(new_size, 8)`. A null result is `failure_reason = 2`
   (the OS refused; the cap was not the limit). A request whose dedicated
   region alone would exceed the cap is `failure_reason = 3` and skips the
   allocation attempt.
5. On success: write the region header, link it as `current_region.next`,
   make it `current_region`, add `new_size` to `committed_bytes`, increment
   `region_count`, and double `next_region_size` (bounded). The allocation
   then bump-allocates from the new region.

Regions are never unmapped before shutdown in v0.5. Sweep records
`free_bytes`, so a later change can release fully free non-head regions;
that is out of scope here and noted as follow-up. `ProcessShutdown` walks
the chain and frees every region by its stored `size` (today it frees one
region with the compile-time constant, `Lifecycle.bd:168`).

Cap configuration:

- The runtime exports `beskid_rt_v5_heap_set_cap(usize bytes) -> u8`. It
  succeeds only while the runtime is active, `bytes >= committed_bytes`, and
  `bytes >= HEAP_INITIAL_REGION_SIZE`; it returns 0 otherwise and changes
  nothing. `gc_heap_cap`, `gc_heap_committed`, `gc_heap_region_count`, and
  `gc_heap_failure_reason` are exported read-only statistics (same shape as
  `gc_bytes_allocated`), registered in `runtime_manifest.bsol` as exports and
  as corelib services so tests written in Beskid can observe growth.
- `executable_bootstrap.c` reads `BESKID_HEAP_MAX_BYTES` with `getenv` after
  `beskid_rt_v5_process_init` succeeds. Accepted syntax is a decimal integer
  with an optional `K`, `M`, or `G` suffix (powers of 1024). An unparsable
  value, or a value the runtime rejects, is a host configuration error: the
  bootstrap calls `beskid_rt_v5_trap(5, "BESKID_HEAP_MAX_BYTES", 21)` so the
  process exits 101 with the standard diagnostic line instead of running with
  a cap the operator did not ask for. Library hosts that attach through
  `beskid_library_attach_v5` receive no environment handling; they call the
  export themselves.
- The runtime never reads the environment for this setting. Keeping parsing
  in the host avoids string literals in the canonical `.bd` corpus and keeps
  one activation owner.

## Decision 3: exhaustion is a typed trap, not SIGILL

When `GcAlloc` establishes exhaustion (steps 3 and 4 above), it:

1. Stores `failure_reason` and `failure_request_bytes`.
2. Renders the diagnostic into `heap + 104` as ASCII
   `R<reason> req=<request> live=<live_bytes> committed=<committed_bytes> cap=<cap_bytes>`
   using digit rendering only (the `48 + digit` loop from
   `Strings.bd:150-160` moved into a shared `WriteDecimal(buffer, offset, value)`
   helper in `Mem/Gc/State.bd`, plus fixed byte constants for the seven
   literal characters). 64 bytes hold five 20-digit values with separators.
3. Calls `Trap(5, pointer_add(heap, 104), length)` from
   `runtime/beskid/src/Runtime/Bootstrap/Native.bd:55`.

`beskid_rt_v5_intrinsic_trap` in each `platform_host.c` gains the trap name:
the manifest renderer (`crates/beskid_manifest/src/v5/render.rs:render_c_header`)
emits `#define BESKID_TRAP_NAME_<CODE> "<name>"` for every `trap` block and a
`BESKID_TRAP_NAME(code)` lookup, and the host prints
`beskid runtime trap v5: out_of_memory (5): R1 req=1048592 live=... committed=... cap=...`
followed by newline, then `_exit(101)`. Codes without a name print `unknown`.
The prefix `beskid runtime trap v5` is unchanged, so every existing stderr
assertion still holds.

Where this surfaces, exactly:

- AOT executables and native-kit shared libraries: stderr line above, exit
  status 101 through the existing trap intrinsic.
- Inside a fiber: still process-fatal. `FiberPanic` needs `StrNew` to record
  a panic message and already falls back to `Trap(5, 0, 0)` when that fails
  (`runtime/beskid/src/Runtime/Io/Syscalls.bd:120`); an exhausted heap cannot
  promise a fiber-local outcome. The design records this as the v0.5 rule.
- JIT in `beskid_engine`: the JIT links the same canonical runtime, so the
  same export path runs. Tests use the trap hook already installed by the
  engine harness.
- The compiler's `trapz(..., unwrap_user(5))` after allocation calls is kept
  but is now unreachable for valid requests. It remains the fail-closed guard
  for malformed descriptors, which is a compiler bug class (code 9 semantics
  would be more accurate; changing the code is a separate lowering change and
  is not part of this design).

## Marking, sweeping, free list, boundary checks across regions

One iterator shape serves every walker: for `region = first_region; region != 0; region = region.next`, walk `[objects_start, bump)` with the existing block rule. Each function keeps its own body; only the outer loop changes.

| Function | Change |
| --- | --- |
| `HeapContains` (`State.bd:56`) | Iterate regions; true when `objects_start <= address < bump` in any region and `address % 8 == 0`. |
| `IsAllocatedObject` (`State.bd:66`) | Find the containing region first (reuse the range test), then walk only that region from `objects_start`. This also makes the check cheaper than today's whole-heap walk. |
| `ManagedObjectForReference` (`Marking.bd:9`) | Unchanged; it composes `IsAllocatedObject`. The interior array check (`value = object + 24`, `data = object + 48`) is per-object and region-agnostic. |
| `GcMarkGray`, `GcWriteBarrier` | Unchanged. |
| `ProcessGrayStack` (`Marking.bd:45`) | The "found any gray" outer loop wraps the region loop, so gray objects in earlier regions discovered while scanning later regions are processed on the next pass. Children can live in any region; `GcMarkGray` resolves them through `HeapContains`. |
| `ResetMarkedObjects` (`Collection.bd:54`) | Region loop. |
| `Sweep` (`Sweep.bd:8`) | Region loop with `pendingFree` reset at each region boundary (free blocks never coalesce across regions). Per region, rebuild `free_bytes` and `largest_free` (largest coalesced block seen). Heap-wide `live_bytes` and `live_count` are summed as today. |
| `AllocateFromFreeList` (`Allocation.bd:24`) | Takes a region; the caller loops regions with the `largest_free` skip. |
| `GcRootHandle`, `GcResolveHandle`, `AbiValueIsLive`, `AbiValueInitialize` | Unchanged; they go through `IsAllocatedObject`. |
| `MarkRoots`, `MarkSuspendedFiberRoots`, `MarkRootFrameChain` | Unchanged; roots are addresses, `GcMarkGray` decides membership. |
| `GcCollect` | Unchanged orchestration; after a successful sweep sets `collection_threshold = max(2 * live_bytes, HEAP_MIN_THRESHOLD)`. |
| `HeapInit(heapStruct, region, regionSize, capBytes)` | Writes the region header into `region`, sets `first_region = current_region = region`, `region_count = 1`, `committed_bytes = regionSize`, `next_region_size = 2 * regionSize` bounded, `cap_bytes = capBytes`, `collection_threshold = HEAP_MIN_THRESHOLD`. |
| `ProcessInit`, `ProcessShutdown` (`Lifecycle.bd`) | Init passes `HEAP_DEFAULT_CAP`. Shutdown walks the chain freeing each region by its header `size`, then the heap state. Every early-exit path in `ProcessInit` that frees `region` keeps doing so with the initial size; no growth can have happened yet. |

Invariants preserved:

- Objects never move; addresses stay valid across growth and collection.
- The write barrier and root registration ABI are unchanged.
- The GC phase machine is unchanged; growth happens only in phase 0 (it is
  called from `GcAlloc`, which never runs during marking or sweeping).
- Phase A single-mutator remains: growth is a mutator-side action.

## Interaction with fibers and external roots

- Fiber stacks, contexts, and scheduler tables are `SystemAllocate` storage,
  not managed objects; growth neither reads nor moves them.
- Fiber root frames point at objects; objects never move, so suspended
  fibers see the same addresses after growth. `MarkSuspendedFiberRoots`
  needs no change.
- External roots and handles hold addresses validated through
  `IsAllocatedObject`; the per-region range test keeps them valid across any
  number of regions. Capacity limits (63 roots, 8 handles) are unchanged and
  their offsets move as listed above.
- ABI-value slots record `owner_heap` as the heap-state address, which does
  not change when regions are added.
- An OOM trap inside a fiber is process-fatal, as stated above.

## Compatibility and kit impact

- Every `.bd` change alters the runtime `source_hash`; the manifest layout
  change alters `layout_hash`; the host C change alters the platform library.
  All of these require a runtime kit rebuild and regeneration of
  `crates/beskid_abi/src/generated/abi_v5_contract.rs`,
  `crates/beskid_abi/include/abi-v5.json`, and
  `crates/beskid_abi/include/beskid_runtime_abi_v5.h` through the existing
  `beskid_abi/build.rs` path.
- Rust-only tests that hand-build a heap
  (`control_flow_closures_spawn.rs:546-555`) must build a region with a header
  and the 816-byte heap state.
- No compiler lowering change is required. The `trapz` sites stay.
- No corelib API change. Corelib tests gain observability through the new
  `gc_heap_*` services only.

## Test plan

Rust unit and integration tests (no kit needed unless marked N):

1. `crates/beskid_abi/tests/runtime_bootstrap_contract.rs`: `BeskidHeapState`
   is 816 bytes with the field offsets in the table; `BeskidHeapRegion` (new
   manifest layout, 64 bytes) has the header offsets above.
2. New `crates/beskid_abi/src/runtime_source/tests.rs` case: parse every
   `const HEAP_*` and `REGION_*` in `Mem/Gc/*.bd` and `Bootstrap/Lifecycle.bd`
   and assert equality with the manifest layouts. Fails today (720 vs 768),
   which proves the drift it closes.
3. `control_flow_closures_spawn.rs` fixture updated; existing assertions on
   allocate, validate, and rooting pass unchanged.
4. New JIT harness test in `crates/beskid_codegen/tests/isle_adapter/` using
   `test_system_allocate` (`support/common.rs:10`): with a 4 KiB first region
   and cap 64 KiB, allocate 32-byte objects until `gc_heap_region_count`
   reads 3, assert every earlier object address still validates through
   `IsAllocatedObject`, then force `gc_collect` and assert `live_bytes` drops
   to the rooted subset and `largest_free` of region 1 is non-zero.
5. Deterministic growth past 1 MiB (N): `crates/beskid_engine/tests/heap_growth_native.rs`
   with fixture `fixtures/heap_growth.bd`: builds a rooted linked list of
   `u8[]` chunks totalling 4 MiB live, asserts `gc_heap_committed > 1 MiB`,
   `gc_heap_region_count >= 3`, then drops the list, calls `__gc_collect`,
   and asserts `gc_bytes_allocated` falls below 64 KiB while
   `gc_heap_committed` is unchanged (no shrink). Runs in JIT, static AOT, and
   the native kit like `fiber_value_transfer.rs`.
6. Deterministic cap hit (N): same test file, second run of the fixture with
   `BESKID_HEAP_MAX_BYTES=2M` and a program that keeps 3 MiB live. Asserts
   exit status 101 and stderr containing `beskid runtime trap v5`,
   `out_of_memory (5)`, and `cap=2097152`. This is the SIGILL replacement
   proof; the same fixture today dies with a signal and no stderr.
7. Cap configuration (N): `BESKID_HEAP_MAX_BYTES=abc` exits 101 with
   `BESKID_HEAP_MAX_BYTES` in stderr; `BESKID_HEAP_MAX_BYTES=512K` (below the
   initial region) exits 101; `beskid_rt_v5_heap_set_cap` returning 0 when the
   value is below `committed_bytes` is covered by a C host fixture in
   `crates/beskid_engine/tests/fixtures/` following `traced_abi_value_native.rs`.
8. Huge object (N): allocate one 3 MiB array with the default cap; asserts a
   dedicated region (`gc_heap_region_count == 2`, committed grows by at least
   3 MiB) and that the array is fully addressable.
9. Free-list skip: JIT harness test that fills region 1, frees half, and
   asserts an allocation larger than `largest_free` of region 1 lands in the
   tail region without scanning (observable through `gc_heap_region_count`
   unchanged and address range).
10. `just corelib`: `TextRegexIntegrationTests.bd` and
    `PestGrammarParseTests.bd` pass without the 1 MiB ceiling. These are the
    motivating regressions.
11. Existing suites that must stay green: `traced_abi_value_native.rs`,
    `fiber_value_transfer.rs`, `foundation_io_native.rs`,
    `external_wait_native.rs` (stderr prefix unchanged), and the
    `beskid_abi` runtime-kit validation tests.

## Follow-ups outside this design

- Releasing fully free non-head regions (shrink).
- Turning the post-allocation `trapz` code from 5 to 9 in lowering, since
  null now only signals a malformed request.
- `StrNew` and `str_from_i64` allocate strings through `SystemAllocate`
  (one mapping per string); that is a separate accounting problem and is not
  changed here.
