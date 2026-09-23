# 05. Object metadata and pointer maps

Part of the [span GC component reference](README.md). Previous: [04 Allocation](04-allocation.md). Next: [06 Roots and stack maps](06-roots-and-stack-maps.md).

## Purpose

Tell the marker which words of an object hold pointers and how large the object is, without a per-object header wherever possible. This is what makes the collector precise ("type accurate", `runtime/mgc.go:7`) rather than conservative: a scalar that happens to look like an address is never followed.

## Data structures

Three encodings coexist in Go (`runtime/mbitmap.go:5-56`):

1. **Stack, data, and bss bitmaps**: 1 bit per pointer-sized word; 1 = "live pointer, visit", 0 = "scalar, ignore (may be a dead pointer value)". Produced by the compiler (stack maps, [06](06-roots-and-stack-maps.md)) and the linker (`gcdatamask`, `gcbssmask`).

2. **Small-object heap bitmap stored in the span**: for objects up to `MinSizeForMallocHeader = PtrSize * PtrBits` = 512 bytes on 64-bit (`internal/runtime/gc/malloc.go:47`), the span reserves `pageSize / PtrSize / 8` = 128 bytes at its end holding one bit per word of the whole span (`span.heapBits()`, `runtime/mbitmap.go:537`). Because such an object has at most 64 words, its bitmap fits one `uintptr` and "writing out bitmap data takes two bitmap writes at most" when it straddles a word boundary (`runtime/mbitmap.go:28-33`, `writeHeapBitsSmall` at line 624). `heapBitsInSpan(userSize) = userSize <= 512` (line 68-78).

3. **Malloc header**, for 512 < size <= 32 KiB - 8: the first word of the allocation slot holds a `*_type` and the object starts at `+8` (`MallocHeaderSize = 8`, `internal/runtime/gc/malloc.go:17`). Large objects (own span) keep the type in `mspan.largeType` instead. The pointer bitmap is not stored; it is "tiled" on the fly from `typ.GCData` (bits for the first `typ.PtrBytes` bytes), repeated every `typ.Size_` up to `s.elemsize`, which also covers arrays and slices with one element type (`runtime/mbitmap.go:35-52`).

Noscan objects have neither bitmap nor header (`runtime/mbitmap.go:20-21`).

The 512-byte cutover is a space argument (`internal/runtime/gc/malloc.go:24-33`): a span with heap bits pays 128 bytes; sixteen 512-byte objects with 8-byte headers also pay 128 bytes, so above 512 the header is cheaper.

The iterator:

```
type typePointers struct {         # runtime/mbitmap.go:86-107
    elem uintptr   // base of the current array element (constant for non-arrays)
    addr uintptr   // word address corresponding to bit 0 of mask
    mask uintptr   // 1 bit per word after addr; bits are cleared as pointers are yielded
    typ  *_type    // nil when the span keeps heap bits (small objects)
}
```

## Algorithm

```
heapSetType(x, dataSize, typ, span):                   # heapSetTypeNoHeader/SmallHeader/Large
    if heapBitsInSpan(dataSize): writeHeapBitsSmall(x, dataSize, typ)   # OR typ.GCData into span bits
    else if span.spanclass.sizeclass() != 0: *(**_type)(x - 8) = typ    # header
    else: span.largeType = typ
    return scanSize            # bytes up to the last pointer word; feeds the pacer's heapScan

typePointersOf(span, addr, size):                      # runtime/mbitmap.go:118-180
    base = span.objBase(addr)
    if heapBitsInSpan(span.elemsize): mask = span.heapBitsSmallForAddr(base); typ = nil
    else: typ = header or span.largeType; elem = base; mask = first word of typ.GCData
    (then fast-forward to addr if addr > base)

next(limit):                                           # runtime/mbitmap.go:243
    loop:
        if mask != 0: k = ctz(mask); mask &^= 1<<k; return addr + k*PtrSize
        advance addr by 64 words; if typ != nil and addr - elem >= typ.PtrBytes: elem += typ.Size_; addr = elem
        if addr >= limit: return 0
        mask = next 64 bits of typ.GCData (or of span heap bits)

scanobject(b, gcw):                                    # runtime/mgcmark.go, scanobject
    s = spanOfUnchecked(b); n = s.elemsize
    if n > maxObletBytes (128 KiB): scan only the first oblet; enqueue the rest as separate work
    tp = s.typePointersOfUnchecked(b)
    for addr = tp.next(b+n); addr != 0; addr = tp.next(b+n):
        obj = *(*uintptr)(addr)
        if obj != 0 and obj - b >= n:                   # skip nil and self-pointers
            if !tryDeferToSpanScan(obj, gcw):           # Green Tea first (07)
                base, span, idx = findObject(obj, b, addr - b)
                if base != 0: greyobject(base, b, addr-b, span, gcw, idx)
```

`bulkBarrierPreWrite(dst, src, size, typ)` (`runtime/mbitmap.go:388`) walks the same iterator to run the write barrier over every pointer slot of a typed memory copy ([08](08-write-barriers.md)).

## Invariants

- Heap bits for free slots of a scannable small-object span are undefined ("can be junk", `runtime/mbitmap.go:55-56`). The marker only scans a slot it reached via a pointer; the conservative scanner checks `isFreeOrNewlyAllocated` first.
- Bytes of a slot beyond `typ.Size_` up to `elemsize` are zero, so tiling past the type's end only observes nil (`runtime/mbitmap.go:46-49`).
- `typ.PtrBytes` is the offset after the last pointer; scanning stops there.
- Interior pointers are legal and resolve via `findObject` to the containing object, which is marked and scanned whole.
- For objects with headers, the header word is not part of the object and is not scanned.

## Concurrency notes

Heap bits are written before the object is published (`publicationBarrier` in the allocator), and the marker reads them only after finding a pointer to the object. When a span is not fresh, bit writes for neighboring objects sharing a word use atomic OR; fresh spans are written non-atomically. `typePointersOf` is `nosplit` because the write barrier calls it and must not be preempted.

## How Go does it

As above. Two historical notes explain the shape: until Go 1.20 the heap bitmap was 2 bits per word (pointer + "scan more") in the arena; Go 1.20-1.21 moved to 1 bit per word in the arena; Go 1.22 introduced the split between in-span heap bits for small objects and malloc headers for larger ones, removing the arena-wide bitmap and its cost for noscan memory. The header approach is why Green Tea's inline mark bits and dense SIMD scanning only apply to objects up to 512 bytes: those are exactly the spans with an in-span pointer bitmap the kernel can AND against.

## Alternatives in other collectors

- **BDWGC**: descriptors per object kind in the block header; the default is fully conservative scanning of every word, with optional "typed" allocation that supplies a bitmap descriptor or a procedure (gcdescr.html, "Block header contents"). Conservative scanning needs the blacklisting of near-miss pages to limit false retention.
- **Immix / JikesRVM**: precise, using the VM's per-object header (TIB pointer) and per-class reference-offset arrays; every object has a header.
- **Tagged-pointer runtimes** (OCaml, many Lisps): a low tag bit distinguishes pointers from immediates so a scanner needs no map for uniform-word data; not applicable to a language with unboxed 64-bit scalars.
- **Per-object header descriptor** (Beskid today, .NET's method table pointer): a pointer to a type descriptor in every object; simplest precise scheme, costs one word per object.

## Beskid adaptation

Today every managed object starts with a type descriptor word (`Runtime.Mem.Gc.Marking`, `descriptor = raw_word_load(object)`; `ValidateTypeDescriptor`, `TypeDescriptorFlags`), and arrays expose their ABI value 24 bytes into the object (`ManagedObjectForReference`). Tracing is descriptor-driven.

- **Keep**: the descriptor header as the single source of pointer layout for every object in v0.5. This is Go's over-512-byte design applied uniformly and it preserves the ABI (`aggregate_static.rs` pointer-map offsets, `pointer_map_offsets` in trampolines). Add a `typePointers`-style iterator over the descriptor's pointer offsets (or a per-descriptor word bitmap) with array tiling.
- **Simplify**: delete the mark word at offset 8 once marks live in span bitmaps ([03](03-spans.md)); derive the span's `noscan` bit from the descriptor at allocation; make `findObject` handle interior pointers arithmetically so the array `+24` special case becomes a normal interior pointer.
- **Defer**: in-span heap bits for small objects and header-free small objects. They save 8 bytes per object and enable the SIMD dense scan, but they change the object layout visible to codegen and every allocation site must supply a word bitmap. Do this after the span heap works.
- **Why**: correctness first; the header design is precise today and the cost is one word per object, which is the same cost the current mark word already pays.

Related: [07 Marking](07-marking-green-tea.md) consumes the iterator; [06 Roots](06-roots-and-stack-maps.md) covers the stack and globals bitmaps.

## References

- `runtime/mbitmap.go:5-56` (design comment), `:68-78` (`heapBitsInSpan`), `:86-260` (`typePointers`, `typePointersOf`, `next`, `nextFast`), `:388` (`bulkBarrierPreWrite`), `:508-760` (`initHeapBits`, `heapBits`, `writeHeapBitsSmall`, `heapSetType*`), `:1361` (`findObject`)
- `internal/runtime/gc/malloc.go:17-50`
- `runtime/mgcmark.go` (`scanobject`; `maxObletBytes` at line 35)
- `runtime/mgcmark_greenteagc.go:980-1100` (`scanObjectSmall`, `extractHeapBitsSmall`, `spanPtrMaskUnsafe`)
- BDWGC gcdescr.html ("Block header contents", typed allocation)
- Immix PLDI 2008
