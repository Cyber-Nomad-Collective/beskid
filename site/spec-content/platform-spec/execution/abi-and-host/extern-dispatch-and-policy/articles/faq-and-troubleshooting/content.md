---
title: FAQ and troubleshooting
description: Extern linking failures, dlopen policy, and interop dispatch debugging.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-22
---

## FAQ

### Should new packages use `extern_dlopen`?

No for production **Standard** flows—use [link-time linking](/platform-spec/language-meta/interop/c-abi-profile/link-time-linking/). `extern_dlopen` remains documented for legacy engine tests and **Proposed** dynamic profiles.

### Why do externs fail on macOS CI?

Dynamic resolution tests target Linux x86_64. macOS agents should skip or use link-time externs; `dlopen` policy is not portable in the legacy feature.

### What is the difference between `interop_dispatch_*` and user `Extern`?

User `Extern` calls native library functions directly (C ABI). `interop_dispatch_*` interprets Beskid-owned tagged values at the language/runtime boundary; both are declared via `BUILTIN_SPECS` but serve different layers.

### Can externs call Beskid builtins?

No. Extern targets must be foreign symbols; calling `alloc` or `panic` through `dlsym` would bypass type descriptors and GC scope rules.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| "extern present but feature disabled" | Enable `extern_dlopen` on engine **or** switch to link-time profile |
| Invalid signature at JIT | Parameter uses Beskid struct/string type—fix contract to scalars/pointers |
| `dlsym` undefined symbol | Typo in symbol string; verify with `nm -D` on the `.so` |
| Dispatch returns garbage | ABI/layout drift—compare `interop_layout.rs` with [ABI versioning](/platform-spec/execution/abi-and-host/abi-versioning-and-compatibility/) |

## Related topics

- [Examples](./examples/)
- [Syscalls and ABI boundary (legacy)](../../../../execution/runtime/syscalls-and-abi-boundary.md)
