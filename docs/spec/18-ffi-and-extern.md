# 18. FFI and Extern

## Scope
This document defines the language-level contract for external bindings.
Runtime ownership and syscall policy are specified in `docs/execution/runtime-syscalls-and-abi.md`.

## 18.1 Extern declaration model
Extern bindings are expressed using the `Extern` attribute.

```beskid
[Extern(Abi: "C", Library: "libc")]
pub mod LibC {
    pub i64 write(i32 fd, ref u8 buf, i64 count);
}
```

## 18.2 Required attribute arguments
- `Abi` MUST be a compile-time string literal.
- `Library` MUST be a compile-time string literal.
- Unsupported or malformed values MUST produce source-located diagnostics.

## 18.3 Type and signature constraints
- Extern function signatures MUST use representable ABI-compatible types.
- Unsupported high-level-only types in extern signatures MUST be rejected.
- Extern declarations define interface contracts; they do not imply runtime ownership policy.

## 18.4 Language/runtime boundary
- Language spec owns syntax, typing, and diagnostics for extern declarations.
- Execution spec owns symbol resolution/loading/linking behavior and syscall mediation.

## 18.5 Non-goals
- This document does not define per-platform syscall behavior.
- This document does not define runtime dispatch implementation details.
