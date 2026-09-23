# Span/page GC heap design ("Green Tea" direction for Beskid)

Status: Phase 2 design only. No build ran while writing this document. Owner
decision: redesign the Beskid GC now and ship a span/page-based, non-moving,
mark-sweep collector with span-queued ("Green Tea") marking in v0.5.

This document is built on the component reference at
`docs/research/span-gc-reference/` (README.md index, documents `01` through
`13`, and the decision summary `90-beskid-minimum-viable-set.md`), which
reads Go 1.26.5 sources directly (cited as `runtime/mheap.go:268` meaning
`$GOROOT/src/runtime/mheap.go` line 268), the Green Tea blog post
(`https://go.dev/blog/greenteagc`) and design issue
(`https://github.com/golang/go/issues/73581`), and BDWGC/Immix as
alternatives. Every design decision below cites the specific reference
document it is drawn from; read that document for the full Go citation,
the alternatives table, and the "Beskid adaptation" section this design
implements.

Code root for every path below unless stated otherwise: `compiler/`
(worktree `.worktrees/compiler-f6-native-descriptor-contract`). OpenSpec
paths are relative to the repository root.

## 0. What changed since the last design, and why it matters here

The prior growable-heap design (`2026-09-22-growable-gc-heap-design.md`,
tasks 6.1-6.10, uncommitted in the worktree) fixed the regex/pest SIGILL's
*symptom* (a 1 MiB heap ceiling) but not its cause. Slice `sigill` found the
real bug: `GC_EXTERNAL_ROOT_CAPACITY = 63` and `GC_HANDLE_CAPACITY = 8` are
fixed-size tables backing every `gc_register_root`/`gc_root_handle` call
ISLE codegen emits (`crates/beskid_isle/src/context/roots.rs::bind_local`,
`root_temporary` — one root per live GC-managed local or construction
temporary on the call stack). Deep recursive descent (regex/PEG parsing)
needs thousands of these concurrently, not 63 or 8. The stopgap (4095/512,
`HEAP_STATE_SIZE` now 41136 bytes) works and the regex/pest corpus is green,
but it is the same class of bug at a higher ceiling. This design replaces
the ceiling with unbounded, O(1)-amortized growth (`06-roots-and-stack-maps.md`),
and separately, at the owner's request, adopts Go's Green Tea span-queued
marking and its span/page allocator (`01`-`04`, `07`).

Slice `cmp` is independently fixing a compiler gap — `pointer ==
NativePointer(0)` inside a multi-condition `||` chain hits
`MissingRuleOrFact` in ISLE lowering, blocking `HeapInit`
(`RootsHandles.bd:191-192`) and `Lifecycle.bd:39` — which currently blocks
building *any* runtime kit. This design does not touch or route around that
guard. Every implementation slice in section 9 is blocked on `cmp` landing
first.

## 1. Fixed constraints

- **Non-moving.** Compiled code, external roots, handles, ABI-value slots,
  fiber frames, and C hosts hold raw object addresses; nothing here
  introduces forwarding or copying.
- **No remap intrinsic.** `system_allocate`/`system_free` are the only
  platform primitives; heap growth is additive mappings.
- **Fibers keep working exactly as today.** `RootFrame`,
  `MarkSuspendedFiberRoots`, and fiber stack/context allocation
  (`SystemAllocate`, never span-allocated) are untouched.
- **ABI layouts are frozen by tests and generated from `runtime_manifest.bsol`**
  unless a test is deliberately updated in the same change; every layout
  edit in section 3 states which frozen test changes.
- **One OS thread, cooperative fibers, stop-the-world collection.** Beskid
  has no parallelism inside a runtime instance and no concurrent mutator
  during a collection; per `90-beskid-minimum-viable-set.md`, this removes
  an entire axis of Go's design (locks, atomics, work stealing, assists,
  the pacer's CPU controller) without giving up correctness.

## 2. Architecture overview

### 2.1 Components and how they interact

```
                    +--------------------------------------------+
                    |              BeskidHeapState                |
                    |  (region chain, span directory per region,  |
                    |   root stack, handle stack, pacing fields)   |
                    +--------------------------------------------+
                          |                    |            |
                          v                    v            v
                 +----------------+   +----------------+  +------------------+
                 |  Region chain  |   |  Root/handle    |  | Pacing & OOM     |
                 |  (unchanged    |   |  stacks (new,   |  | (kept from 6.1-  |
                 |   from 6.1-6.10|   |  segmented,     |  | 6.10: GcGrow,    |
                 |   growth/cap)  |   |  growable)      |  | cap, trap)       |
                 +----------------+   +----------------+  +------------------+
                          |
                          v
                 +----------------+
                 |  Span directory |  (page -> span lookup, per region)
                 +----------------+
                          |
             +------------+-------------+
             v                          v
     +----------------+       +-------------------+
     |  Small spans    |       |  Large spans       |
     |  (size class,   |       |  (dedicated pages,  |
     |  alloc/mark     |       |  one object)         |
     |  bitmaps,       |       +-------------------+
     |  free list)     |
     +----------------+
             |
             v
   +-------------------+      +--------------------+     +-------------------+
   |  Allocator          | -> |  Marker (span FIFO)  | -> |  Sweeper (per span) |
   |  GcAlloc: class pop, |    |  GcMarkGray enqueues |     |  bitmap swap,      |
   |  span refill, grow   |    |  spans; drain scans  |     |  free-span return  |
   +-------------------+      +--------------------+     +-------------------+
             ^                          ^                          |
             |                          |                          v
   +-------------------+      +--------------------+     back to allocator's
   |  Roots: root/handle | -> |  MarkRoots seeds the |     partial/full lists
   |  stacks, RootFrame,  |    |  span FIFO and the   |
   |  fiber suspension     |    |  object LIFO stack   |
   +-------------------+      +--------------------+
```

Interaction summary (component documents in parentheses):

- The **region chain** (`01`) is unchanged from 6.1-6.10: it is the
  address-space source. What changes is what a region contains once mapped:
  a **span directory** plus fixed 8 KiB pages, instead of one flat bump
  arena.
- The **allocator** (`04`) picks a size class, pops a free slot from that
  class's partial span, or refills a span from the region's free pages, or
  triggers growth (`10`, unchanged from 6.1-6.10) through the region chain.
- **Roots** (`06`) are pushed by `bind_local`/`root_temporary`-emitted calls
  exactly as today, but now land in growable segmented stacks instead of
  fixed arrays; fiber `RootFrame` chains and `MarkSuspendedFiberRoots` are
  untouched.
- **Marking** (`07`) starts from roots, calls `GcMarkGray`, which shades an
  object and, for small spans, enqueues the *span* (not the object) on a
  FIFO exactly once per queued interval; draining a span scans every object
  newly marked on it in one left-to-right pass. Large-object spans and
  root-discovered objects use a plain LIFO stack (the "classic" path in
  `07`), matching Go's split between the span path and the workbuf path.
- **Write barriers** are removed from codegen (`08`): the STW design never
  runs the mutator during marking, so a barrier that only fires "if phase
  == marking" never fires and is pure call overhead.
- **Sweeping** (`09`) walks the span directory once per region: swap
  alloc/mark bitmaps, rebuild the free-slot list, return fully empty spans
  to the region's free-page list.
- **Exhaustion** (`12`) is unchanged in contract (typed trap, code 5,
  `Trap(5, ...)`) with an extended diagnostic record and one new failure
  reason for root/handle stack growth failure.
- **Debugging** (`13`) adds a heap verifier and a stress mode, both new,
  both test-only.

### 2.2 Heap structure diagram

```mermaid
flowchart TD
    HS[BeskidHeapState] -->|first_region / current_region| R1[Region 1]
    HS -->|root_stack_head/current| RS1[RootStackBlock]
    HS -->|handle_stack_head/current| HB1[HandleStackBlock]
    R1 -->|region header, 64 bytes| RH1[next / size / bump / limit /\nfree_bytes / largest_free / objects_start]
    R1 -->|span directory| SD1["BeskidSpanHeader[pages]"]
    SD1 --> S1[Span: class 3 (48B), 8KiB, 170 slots]
    SD1 --> S2[Span: class 9 (256B), 8KiB, 32 slots]
    SD1 --> S3[Large span: 3 pages, 1 object]
    S1 --> O1[obj] --> O2[obj] --> O3[free slot]
    RS1 -->|next| RS2[RootStackBlock]
    HB1 -->|next| HB2[HandleStackBlock]
    R1 -->|next| R2[Region 2 same shape]
```

### 2.3 Collection-cycle diagram

```mermaid
sequenceDiagram
    participant Alloc as GcAlloc (mutator)
    participant Coll as GcCollect
    participant Roots as MarkRoots
    participant Q as Span FIFO + object LIFO
    participant Sweep as Sweep

    Alloc->>Coll: live_bytes >= collection_threshold
    Coll->>Roots: walk root stack, handle stack, RootFrame chain, fibers
    Roots->>Q: GcMarkGray each root value
    loop until both queues empty
        Q->>Q: pop span (FIFO) or object (LIFO)
        Q->>Q: scan marked-not-scanned slots; GcMarkGray children
    end
    Coll->>Sweep: mark phase done
    loop every region, every span
        Sweep->>Sweep: swap alloc/mark bitmaps; rebuild free list
        Sweep->>Sweep: page_marks clear? return span to free-page list
    end
    Sweep->>Coll: live_bytes, collection_threshold = max(2*live, MIN)
    Coll->>Alloc: retry allocation
```

## 3. Data structures

Every structure below states whether it is a `runtime_manifest.bsol` layout
(frozen, tested field-by-field) or runtime-internal (no manifest entry,
free to change without an ABI test, same status `BeskidSpanHeader` and the
old `BeskidHeapRegion` already have).

### 3.1 `BeskidHeapState` (manifest layout, frozen — changes here)

Kept from 6.1-6.10 (offsets 0-104, unchanged): `first_region` (0),
`current_region` (8), `region_count` (16), `committed_bytes` (24),
`live_bytes` (32), `live_count` (40), `collection_count` (48),
`collection_threshold` (56), `gc_phase` (64), `cap_bytes` (72),
`next_region_size` (80), `failure_reason` (88), `failure_request_bytes`
(96), `diagnostic` (104, `u8[64]`).

Replaced at offset 168 onward — today's `external_root_count`/
`external_roots`/`handle_count`/`handles` (which the `sigill` stopgap
already grew to 4095/512 slots, pushing `HEAP_STATE_SIZE` to 41136) are
removed and replaced with four pointer fields:

| Offset | Field | Type | Meaning |
|---|---|---|---|
| 168 | `root_stack_head` | pointer | First `BeskidRootStackBlock` in the chain. |
| 176 | `root_stack_current` | pointer | Block currently being filled (chain tail). |
| 184 | `handle_stack_head` | pointer | First `BeskidHandleStackBlock`. |
| 192 | `handle_stack_current` | pointer | Block currently being filled. |
| 200 | size | | `HEAP_STATE_SIZE = 200`, alignment 8. |

This is dramatically smaller than the 41136-byte stopgap and than the
original 816-byte 6.1 design, because no per-slot storage is inlined
anymore — both roots and spans move their bulk storage out of
`BeskidHeapState` into chains, per `06-roots-and-stack-maps.md`'s
"replace the fixed array with a growable ... stack" and `03-spans.md`'s
"span metadata lives out of the span's own bytes, indexed by page."

**Frozen tests that change:** `crates/beskid_abi/tests/runtime_bootstrap_contract.rs`
(`heap_state_and_heap_region_layouts_match_the_growable_heap_design`, added
by the 6.1-6.10 slice) — its `BeskidHeapState` offset table and size
shrink; add assertions for the three new layouts below.
`crates/beskid_abi/src/runtime_source/tests.rs`
(`heap_source_constants_match_the_manifest_heap_layouts`) — the constant
set it cross-checks changes (drop `HEAP_EXTERNAL_ROOT_COUNT`,
`HEAP_EXTERNAL_ROOTS`, `HEAP_HANDLE_COUNT`, `HEAP_HANDLES`,
`GC_EXTERNAL_ROOT_CAPACITY`, `GC_HANDLE_CAPACITY`; add the new offsets).
`crates/beskid_codegen/tests/isle_adapter/control_flow_closures_spawn.rs`'s
hand-built heap fixture needs re-verification (it never wrote the
root/handle region of the struct, so it may need only a smaller word count).

### 3.2 `BeskidHeapRegion` (manifest layout, frozen — unchanged shape, `objects_start` computation changes)

Unchanged fields (64 bytes, from 6.1-6.10): `next` (0), `size` (8), `bump`
(16), `limit` (24), `free_bytes` (32), `largest_free` (40), `objects_start`
(48), `reserved` (56).

**Semantic change, no field change:** `bump` is repurposed as the region's
*page cursor* (always page-aligned, advances by whole pages when a fresh
span is carved from untouched tail pages) instead of a byte-granular bump
pointer; `free_bytes`/`largest_free` become "free pages available for new
spans" bookkeeping instead of the old coalescing free-block stats (the
per-size-class free-slot lists inside spans replace the old free-block
mechanism entirely — see `03`, `04`). `objects_start` is computed at
`RegionInit` time as `base + REGION_HEADER_SIZE + page_aligned(span
directory bytes)` instead of `base + REGION_HEADER_SIZE`, per `01`'s
"span metadata lives out of the span's own bytes."

### 3.3 `BeskidSpanHeader` (new, runtime-internal, per `03-spans.md`)

Not a manifest layout (same status `BeskidHeapRegion` had before 6.1 — no
`runtime_manifest.bsol` entry, no frozen-offset test; it is purely an array
Beskid's own `.bd` code indexes, never read by generated user code or a C
host). One entry per page in a region, stored in the region's span
directory; only the entry for a span's *first* page is populated.

| Field | Type | Size | Meaning |
|---|---|---|---|
| `base` | pointer | 8 | First byte of the span. |
| `page_count` | usize | 8 | Pages in this span. |
| `size_class` | u32 | 4 | 0 = large/free; 1..N = small-object class index. |
| `next` | pointer | 8 | Intrusive link: region free-page list *or* size-class partial/full list *or* the mark-phase span FIFO — states are mutually exclusive (a span is exactly one of: free, holding live objects off-queue, or queued for scanning). |
| `queued` | u8 | 1 | Green Tea "owned" flag (`07`): 0 = not queued, 1 = queued. Single-threaded, so this collapses Go's three-state `owned` (unowned/oneMark/manyMark) to a boolean — see 6.2 below. |
| `live_count` | usize | 8 | Slots with a live object, refreshed by sweep. |
| `free_slot` | pointer | 8 | Head of the span's free-slot list (0 = full or large). |
| `alloc_bits` | inline `u64[2]` | 16 | Up to 128 slots (covers every small class's `nelems`, the largest class has 512 slots at 16 bytes/8KiB... see 3.5) — see note below on bitmap sizing. |
| `mark_bits` | inline `u64[2]` | 16 | Same shape, current-cycle marks. |

Total: 8+8+4+8+1+8+8+16+16 = 77, aligned/padded to 80 bytes. One region's
span directory costs `pages_in_region * 80` bytes — for the 1 MiB initial
region (128 pages of 8 KiB) that is 10,240 bytes, about 1% overhead, in
line with `01`'s observation that Go's `heapArena` record is a similar
fixed cost per arena.

**Bitmap sizing note:** the reference's inline-bitmap recommendation
(`03`, decision 3 in `90`) is "two 128-byte arrays" sized for up to 1024
slots per span; Beskid's smallest class (16 bytes) on an 8 KiB span has at
most 512 slots (`8192 / 16`), so two `u64[8]` (128 bytes total) bitmaps
suffice for every class without per-class bitmap sizing. Revise the field
table above to `alloc_bits: u64[8]` (64 bytes), `mark_bits: u64[8]` (64
bytes); span header becomes 8+8+4+8+1+8+8+64+64 = 173, aligned to 176
bytes. This is the number carried into the region-overhead estimate in
section 8 (superseding the smaller placeholder above — corrected here
because the true 16-byte class needs the full 512-bit bitmap; keeping this
correction inline rather than silently fixing the table is deliberate,
since it is exactly the kind of arithmetic mistake the heap verifier in
`13` exists to catch).

### 3.4 `BeskidRootStackBlock` / `BeskidHandleStackBlock` (new, runtime-internal)

Per `06-roots-and-stack-maps.md`'s "growable per-fiber root stack: register
is a push, scope exit is truncate to depth":

```
BeskidRootStackBlock { next: pointer(8), count: usize(8), capacity: usize(8), slots: pointer[64](512) }
  // size 536, aligned 8
BeskidHandleStackBlock { next: pointer(8), count: usize(8), capacity: usize(8), slots: BeskidGcHandleSlot[64](1024) }
  // size 1048, aligned 8
```

`BeskidGcHandleSlot` (existing, unchanged: `value: pointer(0)`,
`generation: usize(8)`, 16 bytes). 64 slots per block is chosen so a block
is close to one page (536 and 1048 bytes respectively; several blocks fit
one `SystemAllocate` call if a future change batches them, out of scope for
v0.5).

### 3.5 Size classes (new, runtime-internal generated table, per `02-size-classes.md`)

Beskid's table (13 classes, smaller than Go's ~67 per `02`'s Beskid
adaptation: "fewer classes ... about 45" was Go-scale advice; Beskid's
object population is narrower — no strings-as-bytes tiny-object pressure
yet — so 13 is chosen as the smallest table that keeps max waste under 25%
at every class and gives every class at least 2 slots per span, satisfying
Green Tea's "span has >= 2 live objects is the common case" assumption
from `07`):

| Class | Size (bytes) | Slots/8KiB span | Pages/span |
|---|---|---|---|
| 1 | 16 | 512 | 1 |
| 2 | 32 | 256 | 1 |
| 3 | 48 | 170 | 1 |
| 4 | 64 | 128 | 1 |
| 5 | 96 | 85 | 1 |
| 6 | 128 | 64 | 1 |
| 7 | 192 | 42 | 1 |
| 8 | 256 | 32 | 1 |
| 9 | 384 | 21 | 1 |
| 10 | 512 | 16 | 1 |
| 11 | 1024 | 8 | 1 |
| 12 | 2048 | 4 | 1 |
| 13 | 4096 | 2 | 1 |

Every class is a one-page span for v0.5 (per `02`'s Beskid adaptation:
"one-page spans for everything up to 1 KiB, 2-4 page spans only where tail
waste would exceed 12%" — checked and every class above stays under 12.5%
tail waste at one page; multi-page small spans are deferred, section 9).
Generated by a script checked into `compiler/scripts` (not hand-maintained,
per `02`), producing both the `.bd` `const` table and a Rust-side mirror
for the cross-check test (same pattern as the existing `HEAP_*`/`REGION_*`
cross-check, extended to `SIZE_CLASS_*`).

Every span additionally carries a `noscan` bit derived from the object's
type descriptor (`TypeDescriptorPointerCount(descriptor) == 0`) at
allocation time, so pointer-free spans (e.g. byte buffers) are never
scanned — folded into `spanclass = size_class << 1 | noscan`, matching `02`.

### 3.6 Object header — unchanged

`BeskidObjectHeader` (`descriptor` at 0, `gc_word` at 8, 16 bytes total)
is **not changed**. Per `05-pointer-maps.md`'s Beskid adaptation ("keep the
descriptor header... this preserves the ABI") and `03`'s decision 2 in
`90` ("header-full for v0.5... preserves the ABI (`aggregate_static.rs`
pointer-map offsets, arrays at +24)"): the collector stops *using*
`gc_word` for mark state (marks live in `BeskidSpanHeader.mark_bits`
instead), but the field stays physically present so no compiled program's
offset arithmetic changes — arrays still start their ABI value 24 bytes
into the object, every existing pointer-map offset in
`aggregate_static.rs`-generated code is untouched. `gc_word` becomes
reserved (write-once to `0` at allocation, never read by the collector);
removing it physically is listed as a deferred optimization in section 9,
gated on a full codegen audit of every site that assumes a 16-byte header.

## 4. Algorithms

### 4.1 Allocate (small)

```
GcAlloc(size, alignment, noscan):
    class = size_class_for(size)                     # ceil to nearest of the 13 classes; 0 if > 4096
    if class == 0: return GcAllocLarge(size, alignment)
    span = current[class]                             # per-class "the span we are bump/free-filling"
    if span == null or span.free_slot == null and span.bump_index == span.nelems:
        span = refill(class)                          # 4.3
    slot = pop_free_slot(span) or bump_next_slot(span) # ctz-free single-linked pop, or index++
    if slot == null: unreachable (refill guarantees one)
    zero(slot, size)                                   # every object is zeroed before publication (04)
    write descriptor at slot                            # unchanged Alloc() wrapper behavior
    return slot

refill(class):
    if partial[class] nonempty: return partial[class].pop()
    span = carve_span_from_region(current_region, class) # bump region.bump by page_count pages
    if span == null:
        # region has no room; today's pacing decision (unchanged from 6.1-6.10, see 10-pacing)
        if live_bytes >= collection_threshold: GcCollect(); retry carve/partial once
        else: GcGrow(...)                                # existing region growth, cap check, trap on failure
        span = carve_span_from_region(current_region, class) or from a newly grown region
        if span == null: GcReportExhaustion(...)          # unchanged trap path, 12-out-of-memory
    init span.size_class = class; span.alloc_bits = span.mark_bits = 0; span.free_slot = null
    return span
```

This matches `04-allocation.md`'s fast/slow split: the fast path (`ctz`-free
pop or bump index) never touches the region chain or pacing; only `refill`
does, and `refill` is where `checkGCTrigger`-equivalent pacing runs, exactly
once per span rather than once per object (`04`'s invariant: "`checkGCTrigger`
is evaluated only when a span was refilled, not per object").

### 4.2 Allocate (large)

```
GcAllocLarge(size, alignment):
    pages = page_align(size + span_header_room)
    span = carve_dedicated_span(current_region, pages)   # same region-growth fallback as 4.1's refill
    span.size_class = 0; span.live_count unused (single object)
    zero(span.base, size)
    return span.base
```

### 4.3 Grow (unchanged from 6.1-6.10, referenced here for completeness)

`GcGrow` picks the next region size (doubling, bounded, dedicated for
oversized requests), checks the cap, calls `SystemAllocate`, and on success
runs `RegionInit` — which now additionally computes and zeroes the span
directory before setting `objects_start` (section 3.2). No other change.

### 4.4 Mark (span-queued, per `07-marking-green-tea.md`)

```
GcMarkGray(pointer):
    obj = ManagedObjectForReference(heap, pointer)         # unchanged; array +24 case unchanged
    if obj == null: return
    span = span_of(obj)                                     # O(1): region -> page directory -> entry
    if span == null:                                         # large-object or headered-object path
        if gc_word(obj) == white: gc_word(obj) = gray; push obj onto the object LIFO stack
        return
    idx = (obj - span.base) / class_size(span.size_class)    # O(1), no division: precomputed reciprocal
    if bit idx set in span.mark_bits: return
    set bit idx in span.mark_bits
    if span.noscan: return                                    # black at once, matches greyobject's noscan fast exit
    if span.queued == 0:
        span.queued = 1
        push span onto the span FIFO
    # if span.queued was already 1, the span is already on the FIFO and will pick up this mark
    # when it is dequeued (the "marks accumulate while queued" property from 07)

ProcessSpanQueue():                                          # replaces ProcessGrayStack (see 6.2)
    while span FIFO nonempty or object LIFO nonempty:
        while object LIFO nonempty:                          # drain large/headered objects first
            obj = pop()
            trace_object(obj)                                # existing array/aggregate pointer-map walk
            gc_word(obj) = black
        if span FIFO nonempty:
            span = pop(); span.queued = 0
            to_scan = span.mark_bits AND NOT span.scanned_bits
            span.scanned_bits |= to_scan
            for idx in set_bits(to_scan):                     # left-to-right, one pass, cache-local
                obj = span.base + idx * class_size(span.size_class)
                trace_object(obj)                              # may call GcMarkGray, re-queuing spans
    return true
```

`trace_object` is exactly today's per-object body from `ProcessGrayStack`
(array pointer-map walk with stride/offset, aggregate pointer-map walk) —
unchanged, just no longer inline in the region-scanning outer loop.

Note on the single-object shortcut (`07`'s "representative"/`owned`
tri-state): Go's `oneMark`/`manyMark` distinction exists to decide, under
concurrency, whether a second thread's mark arrived while the span was
queued. Single-threaded, there is no race — `span.queued` is exactly "is
this span already on the FIFO", a boolean, and every dequeue processes
whatever `mark_bits &^ scanned_bits` says regardless of how many objects
were marked while it waited. This is `90`'s explicit simplification: "plain
stores instead of atomics ... no `mayNeedWorker`."

### 4.5 Sweep (per span, per `09-sweeping.md`)

```
Sweep(heap):
    live_bytes = 0; live_count = 0
    for region in region_chain:
        for span in region.span_directory (first-page entries only):
            if span.size_class == 0:                          # large span
                if popcount(span.mark_bits[0]) == 0: free_span(region, span)   # unmarked -> free
                else: span.mark_bits = 0; live_bytes += span.page_count * PAGE_SIZE; live_count += 1
                continue
            nalloc = popcount(span.mark_bits)
            if nalloc == 0:
                free_span(region, span)                        # whole span back to the free-page list
                continue
            span.alloc_bits = span.mark_bits                   # the swap (03's "the swap")
            span.mark_bits = 0; span.scanned_bits = 0
            rebuild_free_slot_list(span)                        # thread dead slots via their first word
            span.live_count = nalloc
            live_bytes += nalloc * class_size(span.size_class); live_count += nalloc
    heap.live_bytes = live_bytes; heap.live_count = live_count
    return true

free_span(region, span):
    span.size_class = 0; span.next = region.free_page_list; region.free_page_list = span
    # coalesce with an adjacent free run if one exists (address-order check, O(1) with a sorted list)
```

Eager, whole-heap, at the end of every STW cycle — `90`'s explicit v0.5
choice over lazy per-refill sweep (deferred, section 9).

### 4.6 Root push/pop (per `06-roots-and-stack-maps.md`)

```
GcRegisterRoot(address) -> bool:                              # called by codegen at scope entry
    block = heap.root_stack_current
    if block.count == block.capacity:
        block = SystemAllocate(sizeof(BeskidRootStackBlock))   # never GcAlloc: must not trigger GC
        if block == null: GcReportExhaustion(heap, REASON_ROOT_STACK, 0)  # new failure reason, 5.3
        block.next = null; block.count = 0; block.capacity = 64
        heap.root_stack_current.next = block; heap.root_stack_current = block
    block.slots[block.count] = address; block.count += 1
    return true

GcUnregisterRoot(address):                                     # called by codegen at scope exit
    # scope exit is LIFO in practice (structured Beskid scopes), so this is almost always
    # "the last slot of the current block" -- O(1) amortized; falls back to a block scan
    # only for the rare out-of-order release (see 6.3)
    if heap.root_stack_current.count > 0
       and heap.root_stack_current.slots[heap.root_stack_current.count - 1] == address:
        heap.root_stack_current.count -= 1
        return
    for block in root_stack (head to current):
        for i in 0..block.count:
            if block.slots[i] == address:
                block.slots[i] = block.slots[block.count - 1]; block.count -= 1
                return

MarkRoots():                                                    # unchanged fiber-frame walk, plus:
    for block in root_stack (head to current):
        for i in 0..block.count:
            value = *(block.slots[i])                            # the slot holds the address of a stack slot
            if value != null: GcMarkGray(value)
    for block in handle_stack (head to current):
        for i in 0..block.count:
            if block.slots[i].value != null: GcMarkGray(block.slots[i].value)
    # RootFrame / MarkSuspendedFiberRoots walk: unchanged from today
```

## 5. Invariants and how each is tested

| # | Invariant | Source | Test |
|---|---|---|---|
| 1 | Every reachable object is marked black by the end of `GcCollect`. | `07` tri-color definition | Heap verifier (5, new): after every test-mode collection, every pointer field of every allocated object resolves via `span_of`/`findObject`-equivalent to an allocated slot; root-stack, handle-stack, and `RootFrame` entries all resolve too. |
| 2 | `span.mark_bits ⊆ span.alloc_bits` immediately after sweep's bitmap swap. | `03` invariant, `09`'s zombie check | Sweep asserts `popcount(mark_bits) <= popcount(alloc_bits_before_swap)`; a violation throws "zombie" (ported from `09`'s `reportZombies`), same fail-closed posture Beskid already uses for `ValidateTypeDescriptor`. |
| 3 | A span is on at most one of {free-page list, size-class partial/full list, span FIFO} at a time. | `03`, mutually exclusive `next` link | Heap verifier walks all three structures per region and asserts no span address appears twice. |
| 4 | `span.queued == 1` iff the span is currently in the FIFO. | `07` | Verifier check: every span whose `queued` bit is set is found exactly once when walking the FIFO (checked before the FIFO is torn down at end of cycle; FIFO is always empty after `ProcessSpanQueue` returns, so this is really "no span has `queued == 1` after marking"). |
| 5 | `GcAlloc` never returns null for a valid request. | 6.1-6.10, unchanged | Existing `Alloc` wrapper contract test plus new size-class-sweep fixture (9.4). |
| 6 | Root/handle stack blocks are allocated only via `SystemAllocate`, never `GcAlloc`. | Registering a root must not itself require a collection | Code review invariant plus a fault-injection test (9.4) that makes `SystemAllocate` fail during root-block growth and asserts a typed trap (reason 5, section 5.3), not a crash or infinite recursion. |
| 7 | Every managed value crossing a fiber boundary is rooted by the transfer code. | `90`'s open decision 5 | Existing `Runtime.Mem.AbiValue` `GcRegisterRoot` calls, unchanged; new OpenSpec requirement states this normatively (section 10) so it is checked in review, not just by convention. |
| 8 | The object header layout (`descriptor` at 0, `gc_word` at 8, array data at +24) does not change. | `05`, `90` decision 2 | `crates/beskid_abi/tests/runtime_bootstrap_contract.rs`'s existing `BeskidObjectHeader` assertions are untouched (negative control: this design adds no diff to that layout). |
| 9 | Sweep never scans object memory except to read `mark_bits`/rebuild the free list — it does not walk object bytes. | `09` "touches no object memory except for poisoning" | Complexity test: a fixture with objects containing dangling/garbage pointer fields (never traced, because unreachable) still sweeps without dereferencing those fields — a poison-on-free run (13, deferred to stress mode) would catch a violation. |

## 6. Interfaces between compiler and runtime

### 6.1 Allocation — unchanged

`beskid_rt_v5_managed_object_allocate`, `beskid_rt_v5_array_allocate_rooted`,
`beskid_rt_v5_array_grow_rooted`, and the `Alloc`/`GcAlloc` signatures are
**unchanged**. ISLE's call sites (`crates/beskid_codegen/src/module_emission/orchestration.rs`
per the reference bibliography) need no edits; the allocator's internal
control flow changes (section 4.1) but its ABI contract does not.

### 6.2 Roots — unchanged call sites, changed backing store

No ISLE change. `crates/beskid_isle/src/context/roots.rs::bind_local`,
`root_temporary`, `register_root_slot`, `unregister_root_slot` (read during
Phase 2 research, see the transcript's grounding of `roots.rs:22-35`) keep
calling `gc_register_root(address) -> u8` / `gc_unregister_root(address)`
with the exact same signatures. Before/after is entirely on the `.bd` side:

```
// Before (6.1-6.10 and the sigill stopgap): fixed inline array
pub bool GcRegisterRoot(pointer ptrAddr) {
    word count = raw_word_load(pointer_add(heap, HEAP_EXTERNAL_ROOT_COUNT));
    if count >= GC_EXTERNAL_ROOT_CAPACITY { return false; }   // <- the bug: silently refuses to root
    raw_word_store(pointer_add(heap, HEAP_EXTERNAL_ROOTS + count * 8), NativeWord(ptrAddr));
    ...
}

// After (this design): segmented chain, no capacity refusal
pub bool GcRegisterRoot(pointer ptrAddr) {
    pointer block = NativePointer(raw_word_load(pointer_add(heap, HEAP_ROOT_STACK_CURRENT)));
    word count = raw_word_load(pointer_add(block, ROOT_BLOCK_COUNT));
    if count == ROOT_BLOCK_CAPACITY {
        pointer next = SystemAllocate(ROOT_BLOCK_SIZE, 8);
        if next == NativePointer(0) { GcReportRootExhaustion(heap); }   // never returns
        ... link, switch `block` to `next` ...
    }
    raw_word_store(pointer_add(block, ROOT_BLOCK_SLOTS + count * 8), NativeWord(ptrAddr));
    raw_word_store(pointer_add(block, ROOT_BLOCK_COUNT), count + 1);
    return true;
}
```

The `trapz(registered, TrapCode::unwrap_user(8))` codegen sees after
`gc_register_root` (`roots.rs::register_root_slot`) also becomes
unreachable in practice — the function only fails now if the runtime is
literally out of address space, which is a legitimate trap, not the
silent-refusal bug. No codegen change is required to keep this correct.

### 6.3 Write barriers — codegen change (removed)

Before: every managed store through `assign_local`/aggregate field
assignment that the compiler's `ManagedReferenceFact` marks `GcManaged`
emits a call to `gc_write_barrier(parent, child)`. After: ISLE stops
emitting this call for v0.5's STW collector. This *is* a compiler change
(`crates/beskid_isle/src/context/roots.rs` and wherever aggregate/array
field stores call the barrier helper), justified in `08-write-barriers.md`'s
Beskid adaptation: "a barrier that never fires is pure cost." The
`gc_write_barrier` runtime symbol and `Runtime.Mem.Gc.Collection`'s
`GcWriteBarrier` function are kept (not deleted) so re-enabling an
incremental collector later needs no ABI change, only a codegen flag flip
— this is explicitly deferred, not designed, per `08`'s "if adopted later,
the requirements are..." list.

### 6.4 What does NOT change

No ISLE/codegen change for: type descriptors, pointer maps, array
interior-pointer handling (`ManagedObjectForReference`'s `+24` rule),
closure environments, fiber spawn/join, `AbiValue` transfer rooting. The
entire "compiler emits X" surface for this redesign is: nothing new for
allocation and roots (existing calls keep working), one call site removed
(barrier), full stop.

## 7. Alternatives considered and rejected

Each entry cites the reference document with the fuller comparison table.

- **Precise compiler-emitted stack maps instead of a root stack**
  (`06-roots-and-stack-maps.md`, comparison table). Rejected for v0.5:
  needs a Cranelift-frame unwinder, per-fiber saved-context entry points
  for the unwinder, a new manifest layout for PC-indexed stack maps,
  liveness analysis in ISLE at every call site, and identical map formats
  from JIT and AOT — a multi-week compiler project with a large test
  surface, not a v0.5 slice. Recorded as the deferred direction (section
  9) with the exact migration path from `90`'s open decision 1: ship the
  root stack now, prototype stack maps behind a flag with a cross-check
  mode, switch only on measurement.
- **Radix-tree page allocator with per-region summaries** (`01`, "Go does
  it" section). Rejected: pays off only at many-gigabyte heaps with
  contended concurrent allocation; a per-region free-page bitmap with
  64-bit `ctz`/popcount first-fit is O(1) amortized at Beskid's scale and
  upgradable later without an interface change.
- **Conservative stack/root scanning** (`06`, BDWGC/Mono comparison).
  Rejected: Beskid is precise by construction (explicit root registration);
  conservative scanning trades that precision for no benefit here and is
  incompatible with a design that might move to a moving collector later.
- **Concurrent/incremental marking with a Dijkstra-Yuasa hybrid barrier**
  (`08`, full design). Rejected for v0.5: the barrier's entire cost is
  justified only by scanning goroutine/fiber stacks exactly once under
  concurrency (`08`'s citation of proposal 17503); Beskid's STW design
  scans everything during one pause and needs no barrier at all — cheaper
  than Go's "barrier that could fire" *and* cheaper than a barrier that
  never fires (today's state). Recorded as future work if pause times ever
  demand it.
- **Tiny allocator (sub-16-byte carving)** (`02`). Rejected: Beskid's
  smallest object is already 16 bytes with a header; the tiny allocator
  exists in Go for pointer-free sub-16-byte values (short strings, boxed
  interfaces) and complicates liveness ("a tiny object can be kept alive by
  a co-located neighbor"). Revisit only if profiling shows many
  pointer-free sub-16-byte corelib values.
- **Finalizers, cleanups, weak references, `specials`** (`11`). Rejected:
  no consumer exists; Beskid already has deterministic scoped cleanup.
  `BeskidSpanHeader` reserves conceptual room (a future `specials` pointer
  could be added without breaking the span record's other fields, since it
  is runtime-internal, not manifest-frozen) but nothing is implemented.
- **Header-free small objects with in-span heap bits** (`05`, decision 2 in
  `90`). Rejected for v0.5: saves 8 bytes/object and unlocks the SIMD dense
  scan kernel, but changes the object layout codegen assumes at every
  allocation site (`aggregate_static.rs` pointer-map offsets). Deferred
  (section 9) — the design here already gets marking's main win (span-order
  traversal) without this.
- **Go's 67-class size table** (`02`). Rejected: Beskid's object population
  does not need that granularity yet; 13 classes (section 3.5) keeps every
  class's waste under 25% and the class table a small, reviewable,
  generated artifact, upgradable later without changing the allocator's
  interface.
- **The Green Tea SIMD dense-scan kernel and oblets** (`07`). Rejected for
  v0.5: needs in-span heap bits (see above) and AVX-512-class hardware
  support with a scalar fallback; the blog's own numbers show most of the
  win (10-40% of 10-50%) comes from span-order traversal alone, which this
  design already adopts.

## 8. Complexity and memory overhead estimates

| Operation | Before (6.1-6.10 region walk) | After (span design) |
|---|---|---|
| `HeapContains`/`IsAllocatedObject` (`span_of`/`findObject`) | O(regions) to find the region, then O(objects in region) block walk | O(1): arena-index arithmetic into the span directory, then O(1) slot-index arithmetic |
| Small-object allocation (steady state) | O(free blocks in region) first-fit scan | O(1) amortized: pop `free_slot` or bump an index; O(spans in class) only at `refill`, which happens once per full span, not once per object |
| Marking one object | O(1) mark-bit set, but the outer driving loop re-walks the whole region on every "found any gray" pass, giving O(regions x objects x passes) in the worst case | O(1) mark-bit set; each span is scanned once per FIFO dequeue and a span can be re-queued but its total dequeue count across a cycle is bounded by the number of distinct marking waves that touch it, in practice a small constant — matching Go's empirical "FIFO... accumulate the highest average density of objects to scan on a span" (`07`) |
| Sweep | O(objects) block walk with coalescing | O(spans) bitmap popcount plus O(dead slots) free-list threading; no live-object bytes are touched |
| Root register/unregister | O(1) with a silent-failure ceiling (the bug) | O(1) amortized (push/pop; unregister is O(1) for the common LIFO case, O(block size) worst case — section 4.6) |

Memory overhead (fixed costs, independent of object count):

- Span directory: `pages_in_region * 176 bytes` (section 3.3's corrected
  span-header size) — for a 1 MiB region (128 pages), 22,528 bytes, about
  2.1% of the region. For the 64 MiB maximum region size (8192 pages),
  1,441,792 bytes (1.4 MiB), also about 2.1% — the ratio is constant
  because both scale with page count.
- `BeskidHeapState`: shrinks from the stopgap's 41,136 bytes to 200 bytes
  (section 3.1) — this alone recovers far more than the span directory
  costs on any heap with more than one region.
- Root/handle stack blocks: 536 / 1048 bytes each, allocated on demand;
  zero fixed cost when a program's call stack never needs more than 64
  concurrently rooted values (the common case; the stopgap already proved
  4095 is enough for the regex/pest corpus, so most programs will use one
  block).
- Per-object overhead: unchanged, 16 bytes (the header). This design does
  not reduce it (see section 7's rejection of header-free objects), but it
  also does not increase it — the old design's `gc_word` was already 8 of
  those 16 bytes; this design just stops writing to it.

Internal fragmentation from size-class rounding (section 3.5's table):
worst case at class 3 (48 bytes) rounding a 33-byte request is about 31%
of that one object, in line with Go's own worst-class waste (`02`'s
example: "class 5 is 48 bytes ... 31.52% max waste" — the same number,
because Beskid's class 3 is deliberately the same size). Average waste
across a uniform request distribution is far lower, as in Go's design.

## 9. Migration and slice plan

**Slice 0 (already implemented, uncommitted, kept):** the 6.1-6.10 region
chain, growth pacing, `beskid_rt_v5_heap_set_cap`/`gc_heap_*` exports, trap
rendering, `BESKID_HEAP_MAX_BYTES` parsing, `ProcessShutdown` chain-walk-free.
Not reverted; extended.

Every slice below is **blocked on slice `cmp`'s compiler-gap fix landing
first** (section 0). Each slice is test-first: the "first failing test" is
written before the implementation and must fail for the stated reason
before the slice's code lands.

1. **Root/handle segmented stacks** (section 3.4, 3.1, 4.6). No compiler
   change (section 6.2). First failing test: a fixture that pushes past 64
   roots without the old fixed-capacity code path, asserting no silent
   `false` return from `gc_register_root` and successful collection with
   all of them reachable — this is also the direct regression test for the
   original regex/pest bug, now proven by construction rather than by a
   raised ceiling. Frozen-test fallout: `BeskidHeapState` offset changes
   (section 3.1).
2. **Size classes and span directory** (sections 3.3, 3.5, 4.1 refill path,
   `RegionInit`'s `objects_start` change). No compiler change. First
   failing test: allocate one object of every class in a single 1 MiB
   region, assert each lands in a span whose `elemsize` matches its class,
   assert `objects_start` accounts for the span directory.
3. **Allocator fast/slow path** (section 4.1, 4.2). No compiler change
   (section 6.1). First failing test: allocate past one span's capacity for
   a single class, assert `refill` carves a second span without touching
   the region's free-page list until the region itself is exhausted.
4. **Span-queued marking** (section 4.4). No compiler change. First failing
   test: root two objects on the same span, one object on a different span,
   collect, assert both same-span objects are scanned in one dequeue (a
   counter fixture asserting the span is dequeued exactly once with both
   marks present) — this is the direct proof the FIFO batches instead of
   re-walking.
5. **Write barrier removal** (section 6.3). Compiler change: ISLE stops
   emitting `gc_write_barrier` calls. First failing test: a codegen golden
   test on a managed field assignment asserting no call to
   `gc_write_barrier` appears in the emitted CLIF/object code, paired with
   an engine test proving collection correctness is unaffected (STW means
   no barrier was ever needed for correctness, only removed for cost).
6. **Per-span sweep** (section 4.5). No compiler change. First failing
   test: fill a span, drop half its objects (interleaved), collect, assert
   the span's `alloc_bits` after sweep matches exactly the retained half
   and the freed half is on `free_slot`; fill and fully empty a second
   span, assert it returns to the region's free-page list and a
   differently-classed allocation can reuse those pages.
7. **Exhaustion diagnostic extension + new failure reason** (sections 5,
   6.2's `GcReportRootExhaustion`). No compiler change. First failing test:
   fault-inject `SystemAllocate` for root-block growth, assert trap reason
   5 (new) and exit 101, not a crash.
8. **Heap verifier and stress mode** (section 5, invariants 1-4; `13`'s
   Beskid adaptation). Test-only, no runtime behavior change outside test
   builds. First failing test: the verifier itself, run against a
   deliberately corrupted fixture (a mark bit set on a free slot) and
   asserting it throws.
9. **Full regression + `just corelib`.** `TextRegexTests`,
   `TextRegexIntegrationTests`, `PestEmitGoldenTests`,
   `PestGrammarParseTests` (already green under the `sigill` stopgap) must
   stay green under this design; add the deep-recursion fixture from the
   prior draft's test plan (thousands of concurrently rooted locals) as a
   permanent regression test now that it is not gated by any ceiling.

**Deferred, in suggested order** (from `90`'s "optimizations to defer",
mapped onto this plan): lazy sweep driven by refill; in-span heap bits and
header-free small objects (unlocks the SIMD dense path); the SIMD kernel
and oblets; Cranelift stack maps behind a flag with the cross-check mode;
releasing fully-free regions to the OS; cleanup/weak-handle specials if a
consumer appears; incremental marking with a barrier if pause times demand
it.

## 10. Open decisions — explicit choices

Restating `90`'s seven open decisions with this document's chosen answer
and justification (each is also load-bearing for the OpenSpec update):

1. **Roots: growable stack now, stack maps later.** Chosen: growable
   segmented root/handle stacks (sections 3.4, 4.6, 6.2). Justification:
   zero compiler risk, direct fix for the actual regression, ABI-identical
   for JIT and AOT. Stack maps recorded as the named v0.6+ direction with
   its exact compiler/runtime prerequisites (section 7).
2. **Header-full vs header-free small objects.** Chosen: header-full,
   unchanged 16-byte `BeskidObjectHeader` (section 3.6). Justification: zero
   ABI/codegen churn; the mark word's *use* is removed even though the
   field stays.
3. **Inline marks vs side bitmaps.** Chosen: inline, in
   `BeskidSpanHeader.alloc_bits`/`mark_bits` (section 3.3), for every
   one-page small-object span — which is every span in v0.5 (section 3.5:
   every class is one page). Justification: Go's own split degenerates to
   "always inline" once multi-page small spans are deferred; inline keeps
   marking cache-local per `07`.
4. **Eager vs lazy sweep.** Chosen: eager, at the end of every STW cycle
   (section 4.5). Justification: simplest correctness argument, bounded by
   span count, and v0.5 has no background sweeper to make lazy sweep pay
   for itself.
5. **Fiber-boundary rooting invariant.** Chosen: state it normatively in
   the OpenSpec runtime capability (section 5, invariant 7) — this is a
   spec change, tracked in the OpenSpec update alongside this design, per
   the repository's rule that the spec is updated before observable
   behavior changes.
6. **Where the collector runs.** Chosen for v0.5: the collector runs on
   whichever fiber's allocation triggered it, using an explicit iterative
   work stack/FIFO (never recursion) so stack depth is bounded regardless
   of heap shape — this avoids the "does the scheduler need a dedicated g0
   equivalent" question `90` raises, because Beskid's mark/sweep algorithm
   here (section 4) is already non-recursive by construction. Revisit only
   if a fiber's guard-page stack size proves too small for some
   region-count extreme, which the deep-recursion regression test (slice 9)
   will surface.
7. **GOGC default and minimum heap.** Chosen: keep `HEAP_MIN_THRESHOLD =
   512 KiB` (Beskid's current value, which `90` notes is already the
   smaller of Go's two historical defaults) and add a GOGC-equivalent
   multiplier of 2x live bytes (unchanged from 6.1-6.10's
   `collection_threshold = max(2 * live_bytes, HEAP_MIN_THRESHOLD)`, which
   is already GOGC=100 in Go's terms: "goal = live + live * GOGC/100"
   collapses to `2 * live` at GOGC=100). No change from the existing
   policy; explicitly reaffirmed rather than silently carried over, since
   `90` asked the question directly.

## 11. OpenSpec impact (see the change itself for full text)

`openspec/changes/beskid-v0-5-foundations/specs/execution--runtime--memory-and-gc-runtime-contract/spec.md`:
the three existing requirements (`BSP-REQ-88A15BB6918A` region chain,
`BSP-REQ-539C3C627D46` growth pacing, `BSP-REQ-8C1FA4687232` diagnosable
exhaustion) are amended to describe spans carved from regions instead of a
flat bump arena, and to describe the new root/handle stack backing instead
of the fixed arrays; new requirements are added for the span allocator and
directory, span-queued marking, per-span sweep, and the fiber-boundary
rooting invariant (section 5, invariant 7). `tasks.md` section 6 is
superseded by a new task list matching section 9's slices. See the
companion OpenSpec edit in this same change for the exact requirement text,
scenarios, and Stable IDs (assigned by `scripts/openspec/build-catalog.ts`'s
`stableId("BSP-REQ", "<capability>#<title>")` when the catalog is
regenerated).
