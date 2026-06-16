---
title: Verification and traceability
description: Test mapping for BYTES requirement IDs.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-06
---

| Requirement | Test anchor |
| --- | --- |
| **BYTES-001**, **BYTES-007** | `BytesTests.bd` — `bytes_new_has_length` |
| **BYTES-003** | `BytesTests.bd` — `bytes_from_str_builtin_smoke` |
| **BYTES-002** | Runtime trap on OOB `__bytes_get` / `__bytes_set` (integration) |
| **BYTES-005** | `EncodingUtf8Tests.bd` — `utf8_from_str_builtin_round_trip` |

Harness: `compiler/corelib/beskid_corelib/tests/corelib_tests/src/core/BytesTests.bd`
