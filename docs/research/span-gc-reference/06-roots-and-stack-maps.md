# 06. Roots: globals, stacks and stack maps, other roots

Part of the [span GC component reference](README.md). Previous: [05 Pointer maps](05-pointer-maps.md). Next: [07 Marking](07-marking-green-tea.md). The decision on Beskid's root strategy is in [90](90-beskid-minimum-viable-set.md).

## Purpose

Enumerate every pointer held outside the heap: global data, each thread's or fiber's stack and registers at a safe point, and runtime-internal tables. Roots seed tri-color marking. A missed root is a use-after-free; an over-approximated root is a leak.

## Data structures

**Globals**: per loaded module, `data..edata` with `gcdatamask` and `bss..ebss` with `gcbssmask`, 1 bit per word, emitted by the linker from the compiler's type information. Marked in `rootBlockBytes = 256 KiB` shards so the work parallelizes (`runtime/mgcmark.go:26`, `markrootBlock` at line 330).

**Stack maps, compiler side** (`cmd/compile/internal/liveness/plive.go`): the liveness pass computes, at every instruction that "must have a stack map" (`hasStackMap`, line 650; every call and a few other points), the set of pointer-bearing stack slots that are live. `OpVarDef` annotations mark where a multi-word variable's initialization begins so a partially written variable is not considered live (lines 41-90). Bitmaps are deduplicated (`compact`, line 917) and emitted per function as two `stackmap` tables (`emit`, line 1329): `FUNCDATA_LocalsPointerMaps` and `FUNCDATA_ArgsPointerMaps`; the PC-indexed `PCDATA_StackMapIndex` table selects the bitmap for each safe point (`internal/abi/symtab.go:108-121`). `markUnsafePoints` (line 507) computes ranges where asynchronous preemption is not allowed, emitted as `PCDATA_UnsafePoint`. `emitStackObjects` (line 1458) emits `FUNCDATA_StackObjects` records for address-taken locals. `-live` / `-live=2` print the maps (lines 7-13).

**Stack maps, runtime side** (`runtime/symtab.go:1324-1339`):

```
type stackmap struct {
    n        int32   // number of bitmaps
    nbit     int32   // bits in each bitmap
    bytedata [1]byte // bitmaps, each starting on a byte boundary
}
stackmapdata(m, i) = bitvector{m.nbit, &m.bytedata[i * ((m.nbit+7)>>3)]}
```

`getStackMap` (`runtime/stkframe.go`, `(frame *stkframe) getStackMap`): back up one byte from the return address ("Back up to the CALL"), read `PCDATA_StackMapIndex` (index -1 at function entry means the entry map, treated as 0), fetch the locals bitmap covering `[varp - nbit*8, varp)`, the args bitmap covering `argp`, and the `FUNCDATA_StackObjects` slice. It throws "missing stackmap" when a non-trivial frame has none.

**Stack objects** (`runtime/mgcstack.go:5-60`): address-taken stack variables whose liveness the compiler cannot decide statically become records `{off, size, type}`. Stack scanning is "organized as a mini garbage collection tracing pass": stack-map roots that point into the stack are resolved to stack objects, which are then scanned; dead stack objects are never scanned and cannot keep heap objects alive.

**Safe points and conservative fallback**: `isAsyncSafePoint` (`runtime/preempt.go:374-450`) consults `PCDATA_UnsafePoint`. When a goroutine is stopped asynchronously, the frame that saved its registers (`asyncPreempt`) and the interrupted frame are scanned conservatively (`scanframeworker`, `runtime/mgcmark.go:1069-1100`: "Conservatively scan the frame. Unlike the precise case, this includes the outgoing argument space since we may have stopped while this function was setting up a call"). `scanConservative` (line 1523) treats any word that `spanOfHeap` resolves to an allocated, not freshly allocated slot as a pointer.

**Other roots** (`markroot`, `runtime/mgcmark.go:221-330`): finalizer queue blocks (`allfin`, scanned with `finptrmask`), cleanup blocks, free goroutine stacks (released, not scanned), and per-span specials (`markrootSpans`, line 393: mark each finalizer's closure and scan the finalized object's contents so its referents survive without marking the object itself; scan weak-handle words).

## Algorithm

```
gcMarkRootPrepare():                                  # runtime/mgcmark.go, gcMarkRootPrepare
    nDataRoots = sum over modules of ceil((edata-data) / 256 KiB); nBSSRoots likewise
    nSpanRoots = arena pages / pagesPerSpanRoot         # specials shards
    nStackRoots = len(allgs) snapshot                   # goroutines created later start black
    job index ranges: data | bss | finalizers | freeGStacks | cleanups | span specials | stacks

markroot(gcw, i):  dispatch on i; stack jobs:
    gp = work.stackRoots[i - baseStacks]
    systemstack:                                        # never scan our own stack on itself
        stopped = suspendG(gp)                          # cooperative or async preemption to a safe point
        if stopped.dead: gp.gcscandone = true; return
        if gp.gcscandone: throw("g already scanned")
        scanstack(gp, gcw); gp.gcscandone = true
        resumeG(stopped)

scanstack(gp, gcw):                                   # runtime/mgcmark.go:904
    for each frame from gp.sched.pc/sp (unwinder):
        scanframeworker(frame, state, gcw)
    scan defer and panic records, gp fields that hold heap pointers
    stack-object pass: pop stack pointers; resolve to stack objects; scan reachable ones
    (shrink the stack if allowed)

scanframeworker(frame, state, gcw):                   # runtime/mgcmark.go:1069-1160
    if state.conservative or frame is asyncPreempt or debugCall:
        scanConservative(frame.sp .. frame.varp) and the argument area; set/clear state.conservative
        return
    locals, args, objs = frame.getStackMap(false)
    if locals.n > 0: scanblock(frame.varp - locals.n*8, locals.n*8, locals.bytedata, gcw, state)
    if args.n > 0:   scanblock(frame.argp, args.n*8, args.bytedata, gcw, state)
    for obj in objs: if frame.varp/argp + obj.off >= frame.sp: state.addObject(ptr, obj)

scanblock(b, n, ptrmask, gcw, stk):                   # runtime/mgcmark.go:1479
    for each word i with ptrmask bit set:
        p = *(b + i*8)
        if p != 0:
            if !tryDeferToSpanScan(p): if obj := findObject(p): greyobject(obj)
            else if stk != nil and p points into the stack: stk.putPtr(p, false)
```

## Invariants

- Each stack is scanned exactly once per cycle (`gp.gcscandone`) while the goroutine is stopped; it is then black and stays black because of the hybrid barrier ([08](08-write-barriers.md)).
- A stack map exists at every PC where a goroutine can be stopped synchronously (every call site); asynchronous stops fall back to conservative scanning of at most two frames.
- The root set is snapshotted at mark start; a goroutine created afterwards starts with a black stack; a heap pointer written to a stack after its scan is covered by the deletion barrier (the referent was reachable from the heap when the stack was scanned, or was shaded when overwritten).
- Liveness is use-based: a pointer slot the compiler knows is dead is not a root even if it still holds an address. Under `-clobberdead` the compiler proves this by overwriting dead slots ([13](13-debugging-and-verification.md)).

## Concurrency notes

Root jobs run in parallel across workers. Scanning a stack requires stopping its goroutine (`suspendG`), and a goroutine scanning its own stack switches to the system stack first. The stack may be shrunk during scanning, which is why `gcMarkTermination` runs on g0 and re-reads addresses afterwards (`runtime/mgc.go:1344-1380`).

## How Go does it

As above. The important design consequence, stated in proposal 17503, is that precise stack maps plus the hybrid barrier let Go scan each stack once, concurrently, with no STW rescan. Without a barrier, a STW collector simply scans all stacks during the pause and the same maps suffice.

## Alternatives in other collectors

- **Explicit root registration / shadow stack** (Beskid today via `gc_register_root`; LLVM's `shadow-stack` GC strategy; BDWGC's `GC_add_roots` for data segments plus conservative stack scanning; most interpreters' handle scopes): the mutator maintains a list of root slot addresses; the collector walks the list. No compiler liveness analysis, no unwinder.
- **Conservative stack scanning** (BDWGC, Mono's default, WebKit): treat every stack word as a potential pointer; needs `spanOfHeap`-style validation and blacklisting; cannot be used with a moving collector and retains garbage on false positives.
- **Precise maps with register maps** (HotSpot oop maps, .NET GC info): like Go's but also describe registers at safe points so pointers need not be spilled; Go spills everything at calls, which is why its maps only cover stack slots.

Comparison for a runtime deciding between the first alternative and stack maps:

| Property | Compiler stack maps | Explicit root stack |
|----------|--------------------|---------------------|
| Mutator cost | none on the hot path; pointers stay in registers between calls | a store per root binding, a store per update of a rooted local (`assign_local` re-stores into the slot), a pop per scope exit; today also an O(n) dedupe search per registration |
| Liveness precision | use-based, per safe point | scope-based: a slot is a root until unregistered |
| Compiler work | liveness analysis, safe-point selection, map emission, unsafe-point ranges, stack-object records, tests | emit register/unregister at scope boundaries (exists: `roots.rs`) |
| Runtime work | frame unwinder, PC-to-map lookup, per-fiber saved context to start unwinding from | a growable array or linked frames per fiber |
| Failure mode | a wrong map silently frees live data | a missed registration silently frees live data; a missed unregistration leaks |
| JIT and AOT | both backends must emit identical map formats and the loader must register them | one ABI symbol pair; identical for JIT and AOT |
| Fibers | need per-fiber stack bounds and saved registers at the switch point | each fiber owns its root segment; the switch point needs nothing extra |
| Cranelift support | user stack maps (`ir::UserStackMap`, safepoint annotations on calls) exist and are machine-independent; the runtime must still unwind Cranelift frames | none needed |

## Beskid adaptation

Today: every managed local gets an 8-byte stack slot and a `gc_register_root(&slot)` / `gc_unregister_root(&slot)` pair around its scope (`roots.rs:12-60`, `release_local_roots_from`); temporaries are rooted similarly; the runtime keeps a fixed array of 4095 root addresses with linear-search dedupe on register and linear search on unregister (`Runtime.Mem.Gc.RootsHandles`, `GcRegisterRoot`, `GcUnregisterRoot`); host-held values live in a 512-entry generation-tagged handle table; ABI value transfers root their payload (`Runtime.Mem.AbiValue`).

- **Keep for v0.5**: explicit roots. They are correct, ABI-simple, identical for JIT and AOT, and natural for fibers.
- **Simplify**: replace the fixed array with a growable per-fiber root stack: `register` is a push, scope exit is "truncate to depth" (which the ISLE scope tracking already models via `local_root_scope_depth`), and the linear dedupe goes away. Overflow becomes growth, not failure. Emit globals as a static root table (address, count, pointer mask) built by the loader instead of registering them individually. Keep the handle table as a separate root array.
- **Defer**: compiler-emitted stack maps via Cranelift user stack maps. The migration path is: keep the root-stack ABI, add stack maps behind a flag, and run a cross-check mode in tests asserting every stack-map root is also on the root stack (and report root-stack entries that the map says are dead, which quantify the liveness win). Switch only on measurement.
- **Drop**: conservative scanning; Beskid is precise by construction. Async preemption does not exist in a cooperative runtime, so no unsafe-point tables are needed even if stack maps arrive.
- **Why**: root registration cost today is O(roots) per registration, which is the measurable problem; the fix is the data structure, not the strategy. Stack maps are a compiler project with a large test surface and should not gate v0.5.

Related: [07 Marking](07-marking-green-tea.md) consumes roots via `scanblock`; [08 Write barriers](08-write-barriers.md) explains why Go can scan a stack only once.

## References

- `cmd/compile/internal/liveness/plive.go:5-90` (header, `OpVarDef`), `:491-660` (`IsUnsafe`, `markUnsafePoints`, `hasStackMap`), `:748-940` (`epilogue`, `compact`), `:942-1104` (clobberdead), `:1329-1510` (`emit`, `Compute`, `emitStackObjects`)
- `internal/abi/symtab.go:104-121` (`PCDATA_*`, `FUNCDATA_*`)
- `runtime/symtab.go:1324-1339` (`stackmap`, `stackmapdata`)
- `runtime/stkframe.go` (`getStackMap`, `stackObjectRecord`)
- `runtime/mgcstack.go:5-60`
- `runtime/preempt.go:374-450` (`isAsyncSafePoint`)
- `runtime/mgcmark.go:26` (`rootBlockBytes`), `:179` (`gcMarkRootCheck`), `:221-330` (`markroot`), `:330` (`markrootBlock`), `:393` (`markrootSpans`), `:904` (`scanstack`), `:1069-1160` (`scanframeworker`), `:1479` (`scanblock`), `:1523` (`scanConservative`)
- Proposal 17503 (why stacks are scanned once)
- Beskid: `compiler/crates/beskid_isle/src/context/roots.rs`; `Runtime.Mem.Gc.RootsHandles`; `Runtime.Mem.AbiValue`
- BDWGC gcdescr.html (root set, conservative scanning)
