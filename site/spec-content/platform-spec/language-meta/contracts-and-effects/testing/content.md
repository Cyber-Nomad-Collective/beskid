---
title: Testing
description: The language-level test harness, discovery, and assertions users
  rely on. Corelib testing helpers extend but do not redefine these semantics.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## Normative specification

### Scope

Defines the **`test`** item, discovery metadata, and skip rules for language-level tests. Harness execution is realized by tooling and corelib helpers.

### Syntax

```beskid
test MyCase {
    meta { timeout = 30; }
    // statements
}
```

- **`test Name { body }`** declares a test entry point; the identifier is followed directly by the test body block (no parameter list).
- **`meta { key = expr; }`** sections attach metadata (timeouts, categories) parsed as `TestMetaSection`.
- **`skip { key = expr; }`** sections mark conditional skip predicates.

### Static rules

- Test bodies **must** contain only statements and meta/skip sections allowed by `TestBodyItem`.
- Tests **may** appear in **Test** project kinds; placement in App/Lib projects **should** warn per manifest policy.
- Attributes on tests follow the general attribute rules (**E1508–E1510**).

### Dynamic semantics

- The test runner **must** invoke each discovered test entrypoint in isolation unless `meta` specifies shared fixtures (future).
- Failed assertions **must** report as test failures without undefined behavior.
- Skipped tests **must not** count as failures when skip predicates evaluate true.

### Diagnostics

Attribute and visibility issues use **E15xx**; test-specific codes **may** be added in the registry band reserved for tooling.

### Conformance

`beskid test` (tooling) **must** discover all `test` items in Test projects matching this syntax.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Testing - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Testing - Design model](./articles/design-model/)
- [Testing - Examples](./articles/examples/)
- [Testing - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Testing - Flow and algorithm](./articles/flow-and-algorithm/)
- [Testing - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
