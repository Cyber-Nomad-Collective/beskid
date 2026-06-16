---
title: Verification and traceability
description: Test mapping for ENC requirement IDs.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-06
---

| Requirement | Test anchor |
| --- | --- |
| **ENC-001**, **ENC-UTF8-001** | `EncodingUtf8Tests.bd` (source fixture; enable target when direct `__bytes_*` JIT resolves) |
| **ENC-HEX-001**, **ENC-B64-001** | `Core.Encoding.Hex` / `Base64` modules + `EncodingUtf8Tests.bd` hex round-trip |
| **ENC-005** | `System.FS` `ReadAllText` / `WriteAllText` UTF-8 paths |

Harness: `compiler/corelib/beskid_corelib/tests/corelib_tests/src/core/EncodingUtf8Tests.bd`
