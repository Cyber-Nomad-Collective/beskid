---
title: Design model
description: Core.Bytes module layout and runtime builtin boundaries.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-06
---

## Module layout

| Module | Role |
| --- | --- |
| `Core.Bytes` | Re-export hub |
| `Core.Bytes.Errors` | `BytesError` variants |
| `Core.Bytes.Slice` | `Len`, `Get`, `Set`, `Copy`, `Compare`, `Fill`, `SubSlice`, `New` |
| `Core.Bytes.Convert` | Thin helpers delegating to `Core.Encoding.Utf8` |

## Layering

```mermaid
flowchart TB
  app[Application]
  bytes[Core.Bytes]
  array[Collections.Array]
  builtins[__array_* __bytes_*]
  app --> bytes --> array --> builtins
```

## Related topics

- [Contracts and edge cases](./contracts-and-edge-cases/)
- [Core.Encoding](/platform-spec/core-library/foundation-and-primitives/core-encoding/)
