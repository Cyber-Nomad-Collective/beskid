## Context

The Beskid collector is a non-moving, stop-the-world mark-sweep collector over span pages (`execution--runtime--memory-and-gc-runtime-contract`). Generated code roots managed locals with `gc_register_root` and construction temporaries with root handles. A missing root becomes visible only when a collection runs inside the window where the root is missing. Since 0.6.0 (`v06-runtime-fail-fast`) a service traps when it receives a reference whose slot is free, but a slot that was given again to a new object passes that check.

The runtime already has two test hooks: `gc_heap_set_stress_interval` (a collection every n-th allocation, read only on the allocation slow path) and `gc_heap_verify` (span free-list and large-span invariants). Neither is reachable without a hand-written C host, and nothing runs them in CI.

## Prior art (primary sources)

- **.NET GCStress.** `DOTNET_GCStress` is a bit set: `0x1` forces a GC on allocations, `0x2` on transitions to preemptive mode, `0x4` at every JIT-generated instruction where a GC is allowed, `0x8` at every ReadyToRun instruction, `0x10` only on a unique stack trace. The runtime team uses `0x3` for VM issues such as missing GC reporting in interop frames and `0xC` for GC-info errors. Source: dotnet/runtime, `docs/design/coreclr/jit/investigate-stress.md` (https://github.com/dotnet/runtime/blob/main/docs/design/coreclr/jit/investigate-stress.md).
- **Go GODEBUG.** The `runtime` package documents `clobberfree=1` (the collector overwrites the content of a freed object with bad content), `gccheckmark=1` (verification of the concurrent mark phase), `gcstoptheworld=1`, `efence=1` (each object on a unique page) and `invalidptr=1`, on by default, which makes the collector crash the program on an invalid pointer. Source: https://pkg.go.dev/runtime, section "Environment Variables".
- **V8.** `src/flags/flag-definitions.h` defines `--verify-heap` ("verify heap pointers before and after GC"), `--stress-compaction` ("Stress GC compaction to flush out bugs with moving objects"), `--gc-interval` ("garbage collect after <n> allocations") and `--clear-free-memory` ("initialize free memory with 0"). Source: https://github.com/v8/v8/blob/main/src/flags/flag-definitions.h.
- **HotSpot.** `src/hotspot/share/gc/shared/gc_globals.hpp` defines the diagnostic flags `VerifyBeforeGC`, `VerifyAfterGC` and `VerifyDuringGC` ("Verify memory system before GC", "after GC", "during GC (between phases)"); `runtime/globals.hpp` defines `ZapUnusedHeapArea` ("Zap unused heap space"), on in debug builds. Source: https://github.com/openjdk/jdk/blob/master/src/hotspot/share/gc/shared/gc_globals.hpp.
- **AddressSanitizer quarantine.** `quarantine_size_mb` (default 256, 16 on iOS and Android) is the "Size (in Mb) of quarantine used to detect use-after-free errors": freed chunks are held back and poisoned before reuse. Source: https://github.com/google/sanitizers/wiki/AddressSanitizerFlags.

## Decisions

1. **Stress is an environment variable read by the runtime.** `BESKID_GC_STRESS` follows `BESKID_HEAP_MAX`: the runtime reads it in `beskid_rt_v5_process_init`, so the executable host, `beskid_library_attach_v5` and embedding engines behave the same. Grammar: a comma list of `alloc`, `alloc:<n>` (n at least 1) and `verify`. A malformed value traps with the variable name, as `BESKID_HEAP_MAX` does. This is the .NET `0x1` mode and the V8 `--gc-interval` mode. Beskid has no preemptive transitions, and every collection starts inside a runtime call, so a per-instruction mode (.NET `0x4`) adds nothing: every safepoint is an allocating call.
2. **The stress counter runs on every allocation.** The existing `StressShouldCollect` moves from the slow path to the start of `GcAlloc`, `GcTryAlloc` and the array and string construction paths. Without the variable the cost is one load and one branch.
3. **`verify` runs the existing verifier around each collection**, as `VerifyBeforeGC` and `VerifyAfterGC` do, and traps `runtime_internal_corruption` (10) on a failure. The verifier gains one check: no allocated slot holds the poison pattern in its header word.
4. **Poisoning is a debug-kit property, not a variable.** Release kits keep their sweep cost. The debug kit gets one build-profile fact, declared in `runtime_manifest.bsol` and generated into the runtime layout prelude, never written by hand. The sweep writes the pattern `0xDEADBEEF_FEEDFACE` into each word of a freed slot after the free-list link, as Go `clobberfree` and HotSpot `ZapUnusedHeapArea` do. A large span is poisoned in its header and first page only, to bound the cost.
5. **Quarantine delays reuse, as in ASan.** In the debug kit, a freed small slot enters a per-heap FIFO of slots with a byte budget (default 4 MiB, `BESKID_GC_QUARANTINE` overrides it) and returns to its span's free list only when the budget overflows. The alloc bit stays clear while the slot is in quarantine, so `ManagedObjectForReference` reports it as not live and the fail-fast check traps. A collection drains nothing from the quarantine early: the quarantine is the oldest-first window that ASan uses.
6. **CI runs the stress pass on Linux only.** The pass is slow (a collection per allocation). One Woodpecker step in the Linux validation lane runs the Corelib tests and `runtime_semantics` with `BESKID_GC_STRESS=alloc:1,verify` against the debug kit, with a longer target timeout. Windows and macOS keep the ordinary pass.

## Rejected alternatives

- **A compile-time `--gc-stress` compiler flag.** It would need a second kit per profile and could not reach Glue and C hosts. The variable reaches every activation path with one kit.
- **One page per object (Go `efence`).** It finds the same errors as quarantine plus poisoning at a far higher memory cost.

## Risks

- The stress pass can exceed the CI time budget. Mitigation: `alloc:<n>` with n chosen per suite, recorded in the CI script.
- Quarantine raises the debug-kit footprint by the budget. The budget is bounded and documented.

## Implementation rulings (2026-10-15, v06x parallel program)

Sources: `~/.claude/handoffs/v06x-rt-progress.md` (decisions D1-D6).

- Kit debug fact (rt D1). The runtime corpus is lowered once per kit independent of the profile, so a generated constant cannot differ between kits. The manifest declares the intrinsic `kit_debug_profile` (`u8`), implemented as the macro `BESKID_RUNTIME_KIT_DEBUG` in `host_threads.h`; an absent macro means release and disables poisoning (fail closed). The kit builder passes `-DBESKID_RUNTIME_KIT_DEBUG=1` for a debug kit, and `HeapInit` caches the value in the heap state.
- Heap state (rt D2). The stress and quarantine fields (stress interval and counter, flags, test hook, quarantine head, tail, bytes and budget, debug flag) are appended at offsets 328 to 400.
- Slot encoding (rt D3). A quarantined slot holds the FIFO link in word 0, the tag `0xDEADBEEFFEEDFAC0` in word 1 and `0xDEADBEEFFEEDFACE` in every other word; a free-list slot of the debug kit holds the link in word 0 and poison elsewhere. A span with quarantined slots is never freed. A budget of 0 poisons only.
- Malformed values (rt D4). A malformed `BESKID_GC_STRESS` or `BESKID_GC_QUARANTINE` traps with code 5, as `BESKID_HEAP_MAX` and `BESKID_FIBER_STACK_MAX` do.
- Variable scope (rt D5). `BESKID_GC_STRESS` and `BESKID_GC_QUARANTINE` are the only `BESKID_GC_*` variables the runtime reads. The 0.6.2 requirement that the runtime reads no `BESKID_GC_*` variable concerns pacing knobs and exempts these two.
