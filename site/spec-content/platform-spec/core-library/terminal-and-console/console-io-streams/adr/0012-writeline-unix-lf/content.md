---
title: WriteLine emits Unix LF
description: WriteLine appends a single LF byte sequence.
specLevel: adr
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
adrId: D-CORE-TERM-0012
adrStatus: Accepted
adrDate: 2026-05-20
lastReviewed: 2026-05-22
---

## Context

Cross-platform hosts may translate line endings below the Beskid API.

## Decision

| Rule | Detail |
| --- | --- |
| Ending | `WriteLine` **must** append `\n` only |
| Windows | Host/platform layer **may** translate later without API change |

## Consequences

Authors see consistent Beskid source semantics; CRLF is not encoded in corelib strings.

## Verification anchors

`Output.bd` / `Error.bd` tests; platform IO docs.
