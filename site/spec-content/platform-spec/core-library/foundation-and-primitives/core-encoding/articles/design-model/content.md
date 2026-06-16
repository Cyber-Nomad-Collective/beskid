---
title: Design model
description: Encoding contract and algorithm modules.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-06
---

## Modules

| Module | Role |
| --- | --- |
| `Core.Encoding.EncodingError` | Shared error enum |
| `Core.Encoding.Contract` | `Encoder` contract with encode/decode |
| `Core.Encoding.Utf8` | Language-default UTF-8 |
| `Core.Encoding.Hex` | Hexadecimal |
| `Core.Encoding.Base64` | RFC 4648 standard Base64 |

Utf8 uses `__bytes_from_str` / `__str_from_bytes_utf8` at the runtime boundary. Hex and Base64 are pure Beskid over `Core.Bytes`.
