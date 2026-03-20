---
title: "Extern policy (v0.1)"
description: Engine-assisted dynamic linking policy for extern calls on Linux x86_64.
---

Scope
- Platform: Linux x86_64 only for v0.1
- ABI: "C" only
- Linking: engine-side dynamic resolution (dlopen/dlsym) behind feature flag

Feature flag
- Crate: beskid_engine
- Feature: extern_dlopen (disabled by default)
- Behavior when disabled and externs present: compilation fails with a clear error listing extern symbols

Resolution rules
- Library loaded with dlopen(RTLD_LOCAL | RTLD_NOW)
- Symbol resolved with dlsym; both errors report dlerror() text
- Caching: process-lifetime caches for (Library -> handle) and (Library, Symbol -> address)
- Deduplication: repeated externs across artifacts use the caches; no double-open/dlsym

Signature validation (engine)
- Allowed parameter/return kinds (Cranelift types):
  - pointer width type (x86_64)
  - i64, i32, i8
  - f64
- Disallowed: any other type; high-level Beskid types are rejected at typing time and guarded again by engine signature validation

Authoring externs in source
- Use `Extern` on contracts to declare FFI signatures (function prototypes end with `;`):
```
[Extern(Abi:"C", Library:"libc.so.6")]
pub contract C {
  i64 getpid();
}
```
- Inline modules require function bodies; use contracts for prototypes in v0.1.

Testing and commands
- Resolution-only smoke:
  - cargo test -p beskid_engine extern_resolution_only_compiles_with_feature --features extern_dlopen
- Real call demo (getpid):
  - cargo test -p beskid_engine extern_real_call_getpid --features extern_dlopen
- Negative (feature off):
  - cargo test -p beskid_engine extern_resolution_fails_without_feature
- Negative (missing symbol/library):
  - cargo test -p beskid_engine extern_missing_symbol_errors --features extern_dlopen
  - cargo test -p beskid_engine extern_missing_library_errors --features extern_dlopen

Notes
- With feature disabled: artifacts without externs compile normally; artifacts with externs fail fast with actionable diagnostics.
- With feature enabled: on Linux, extern resolution is performed and cached; other platforms are not supported in v0.1.

