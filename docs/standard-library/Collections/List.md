# Collections.List

## Purpose
Dynamic sequence abstraction built on contiguous storage.

## Candidate surface
- `List<T>.Add(T value) -> unit`
- `List<T>.Count() -> i64`
- `List<T>.Get(i64 index) -> T`

## Notes
- Reserve/capacity controls should be explicit.
- Query integration should be allocation-aware.
