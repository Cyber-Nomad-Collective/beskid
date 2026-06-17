---
title: Documentation comments - Verification and traceability
description: Conformance evidence, test coverage, and verification for Documentation comments.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-15
---

## Conformance evidence

Conformance to this specification is verified through:

1. **Compiler test suite** — Unit and integration tests in the compiler workspace
2. **Corelib conformance** — Published corelib packages must conform to the specification
3. **End-to-end tests** — E2E tests validate the full pipeline
4. **Formatter stability** — Doc runs must survive formatting without reordering

## Implementation anchors

| Anchor | Role |
|---|---|
| `compiler/crates/beskid_analysis/src/doc/` | Doc comment extraction and API doc model |
| `compiler/crates/beskid_analysis/src/doc_comment_parser.rs` | `///` parsing and `@arg`/`@ref` tag resolution |
| `compiler/crates/beskid_cli/src/commands/doc.rs` | `beskid doc` command emitting `api.json` |

## Conformance rules

- Formatter **must not** reorder `///` runs across distinct items.
- LSP **must** return stored doc strings for resolved symbols.
- Malformed doc attachment **should** warn once the doc pipeline is strict; v0.1 **may** ignore orphan `///` outside wrappers.

## Traceability

Each normative statement in the parent hub should be traceable to:
- A test case in the compiler test suite
- An ADR documenting the decision (D-LM-DOC-001 through D-LM-DOC-004)
- A diagnostic code in the diagnostic registry
