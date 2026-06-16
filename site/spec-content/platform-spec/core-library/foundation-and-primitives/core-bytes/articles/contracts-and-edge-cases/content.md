---
title: Contracts and edge cases
description: MUST rules for Core.Bytes buffer operations.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-06
---

## Normative requirements

| ID | Requirement |
| --- | --- |
| **BYTES-001** | `u8[]` **must** be the canonical byte buffer type; allocation uses `__array_new(1, len)`. |
| **BYTES-002** | Out-of-bounds index on `Get`/`Set` **must** trap (same policy as `string[index]`). |
| **BYTES-003** | `Core.Bytes` **must not** embed OS or syscall semantics. |
| **BYTES-004** | `Copy`, `Compare`, and `Fill` **must** be deterministic; allocation for `SubSlice` **must** be explicit. |
| **BYTES-005** | String ↔ bytes conversion **must** route through `Core.Encoding` (not ad-hoc UTF-8 in `Core.Bytes`). |
| **BYTES-006** | Empty buffers **must** be representable with length zero. |
| **BYTES-007** | `Len` **must** delegate to `__array_len`. |
| **BYTES-008** | Hot paths **may** use `__bytes_copy` / `__bytes_compare` builtins when registered. |
| **BYTES-009** | Module tier **must** be `@tier(standard)` for prelude re-export. |

## Edge cases

| Case | Behavior |
| --- | --- |
| Zero-length copy | No-op; returns without error |
| `SubSlice` past end | Clamps to buffer end per runtime contract |
| Null backing (test builds) | `Len` returns 0; indexed access traps |

## Implementation anchors

- `compiler/corelib/packages/foundation/src/Core/Bytes/`
- `compiler/corelib/beskid_corelib/tests/corelib_tests/src/core/BytesTests.bd`
