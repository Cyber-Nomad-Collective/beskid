# Memory and References

## Memory Model
- All objects may be allocated on the heap, managed by the GC.
- The compiler may perform escape analysis and keep data on the stack when safe.
- Users do not control allocation explicitly in v0.1.

Example:
```
string make() {
    let s = "hello";
    return s; // allocation strategy is compiler/runtime choice
}
```

## Garbage Collector (v0.1)
- GC behavior is an implementation detail and is not observable from the language.
- The runtime uses a precise GC (details may change without affecting semantics).

## References
- `ref T` denotes an explicit, read-only reference.
- `out T` denotes an explicit, write-only output reference (callee must assign).
- A reference cannot outlive the object it points to.
- `ref mut T` is not planned; `ref` and `out` are the explicit forms.

## Ref/Out parameters
```
i32 len(ref s: string) { return s.len(); }

Result<(), string> parse_port(out port: i32) {
    port = 8080;
    return Ok(());
}
```

Example usage:
```
i32 mut port = 0;
parse_port(out port)?;
```

## Example
```
i32 len(s: ref string) {
    return s.len();
}
```

## Decisions
- `ref`/`out` are explicit and rely on GC/runtime safety (no borrow checking).
- Stack allocation may become observable via diagnostics, but this is a later feature.
- GC pacing and thresholds are implementation details and not part of v0.1.
