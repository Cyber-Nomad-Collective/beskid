---
title: FAQ and troubleshooting
description: Optional runtime features vs ABI version, array backing surprises,
  and CI alignment.
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

### Do feature flags change `beskid_runtime_abi_version`?

No when behavior is backward compatible (**RFF-001**). Adding new optional symbols without old compilers calling them does not require a bump.

### Why is `array_new` pointer null in the debugger?

Default builds omit `arrays_backing`. Enable the feature for tests that touch elements.

### Where is `extern_dlopen` documented?

Under [Extern dispatch and policy](/platform-spec/execution/abi-and-host/extern-dispatch-and-policy/) — it is an **engine** feature, not a runtime Cargo feature.

### Can users toggle features at run time?

No. Selection is compile-time for the linked `beskid_runtime` artifact. CLI flags choose execution **mode**, not `arrays_backing`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Array element segfault | Build runtime with `arrays_backing` or stop dereferencing `ptr` |
| Missing `rt_metrics_*` at link | Enable `metrics` on runtime **and** ensure codegen emits calls |
| Extern works locally, fails in CI | CI engine lacks `extern_dlopen` — use link-time externs |
| VSIX vs local CLI array difference | Compare release matrices for runtime features |

## Related topics

- [Examples](./examples/)
- [FAQ ABI versioning](/platform-spec/execution/abi-and-host/abi-versioning-and-compatibility/faq-and-troubleshooting/)
