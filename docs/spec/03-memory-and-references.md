# 03. Memory and References

## Memory Model
- All objects may be allocated on the heap, managed by the GC.
- The compiler may perform escape analysis and keep data on the stack when safe.
- Users do not control allocation explicitly in v0.1.

Example:
```
fn make() -> string {
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
fn len(ref s: string) -> i32 { return s.len(); }

fn parse_port(out port: i32) -> Result<(), string> {
    port = 8080;
    return Ok(());
}
```

Example usage:
```
let mut port: i32 = 0;
parse_port(out port)?;
```

## Example
```
fn len(s: ref string) -> i32 {
    return s.len();
}
```

## Decisions
- `ref`/`out` are explicit and rely on GC/runtime safety (no borrow checking).
- Stack allocation may become observable via diagnostics, but this is a later feature.
- GC pacing and thresholds are implementation details and not part of v0.1.
