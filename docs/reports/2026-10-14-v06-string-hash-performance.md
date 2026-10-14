# v0.6 string and hash lookup performance

Compiler commit `ebd9cc2d`, corelib commit `001c7e5`.

## Method

A Beskid micro-benchmark ran each operation 1e5 times on the NixOS builder with a debug runtime kit, a small heap and 400k live strings. "Before" is the kit `dev-81fe8d4a09504939` built from the 0.6 development tree before these commits, not 0.5.3. A release runtime kit was not measured. The benchmark checks its accumulator against a computed expected value (`acc=211853780`).

## Results (time per operation)

| Operation | Before | After |
| --- | --- | --- |
| string `==`, two runtime strings | 22 ns | 23 ns |
| string `==` against a literal | 5,171 / 6,592 ns | 1 / 2 ns |
| `String.CompareOrdinal` | 513 ns | 50 ns |
| `StringMap.GetOr` | 1,527 ns | 95 ns |
| `I64Map.GetOr` | 1,022 ns | 55 ns |
| `Map<string, i64>.GetOr` (linear scan, 100 keys) | 8,510 ns | about 600 to 1,050 ns |
| interpolation `"${k%50}\|Name"` | 19,664 ns | 2,554 ns |
| concatenation | 14,842 ns | 1,218 ns |
| `SubSlice` | 3,601 ns | 968 ns |
| `String.Join` | 8.5 ms per line at 1k lines (quadratic) | 261 ns per line at 16k lines |

## Root causes

1. String payloads were built one byte at a time with one `Array.Append` per byte.
2. `str_concat` and `str_from_i64` took a scratch buffer from `SystemAllocate` (`mmap`/`munmap`) on every call.
3. Every evaluation of a string literal allocated a new string.
4. Every call with a managed argument registered and released GC roots.

## Fixes

Strings are allocated once at full size and filled in place. `==`, `!=` and string match patterns against literals of up to 64 bytes compare inline. Module emission drops root registration in functions that cannot reach a collection, from a whole-module analysis. `Join`, `Repeat` and `Replace` are linear, and hash tables index their arrays directly.

While doing this, a use-after-free was fixed: binary string operations did not keep the left operand alive while the right one was built.

## Remaining

Literal map keys and interpolation still allocate (about 1 to 2.5 us). `str_from_f64_bits` still uses three `mmap` scratch buffers per call. `Map<K, V>` is a linear scan; `StringMap` and `I64Map` are the hashed maps.
