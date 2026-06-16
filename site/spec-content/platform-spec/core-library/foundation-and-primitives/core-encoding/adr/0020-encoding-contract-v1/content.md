---
title: Encoding contract v1
description: Shared Encoder contract with Result-based decode.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-PRIM-0020
adrStatus: Accepted
adrDate: 2026-06-06
lastReviewed: 2026-06-06
---

## Decision

v1 uses a Beskid `contract Encoder` with `EncodeToBytes` / `DecodeFromBytes` returning `Result`. No lossy decode in v1.
