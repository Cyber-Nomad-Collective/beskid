---
title: "Arrange, act, assert"
description: Structure Beskid tests without importing a ceremony framework from another ecosystem.
tableOfContents: true
---

You do not need a Beskid port of xUnit's 47 base classes. You need **readable failure messages** when the compiler disagrees with your story.

## The pattern

```mermaid
flowchart LR
  arrange[Arrange — inputs, fixtures, temp files]
  act[Act — call the unit under test]
  assert[Assert — corelib helpers or explicit checks]
  arrange --> act --> assert
```

1. **Arrange** — build data, configure paths, materialize projects if the test is integration-weight.
2. **Act** — one logical operation (parse, resolve, lower, run entrypoint).
3. **Assert** — use corelib testing helpers (see corelib `Testing` docs) or explicit comparisons; failed assertions become test failures, not undefined behavior ([Testing spec](/platform-spec/language-meta/contracts-and-effects/testing/)).

## Keep tests boring on purpose

| Good | Avoid |
| --- | --- |
| One reason to fail per test | Mega-tests that assert 40 unrelated diagnostics |
| Descriptive `test` names | `test Foo` copy-pasted fourteen times |
| `meta.tags` for speed tiers | Running the full compiler graph for "string literal parses" |

## Assertions and documentation

Test bodies can carry `///` docs like other statements when you need to explain **why** a regression exists—future you is also a developer.

## When AAA is not enough

Integration tests that need multi-file fixtures belong in dedicated **Test** projects with explicit `group` prefixes. Push heavy assets to `beskid_tests`-style layouts in the compiler repo when you are locking platform behavior ([Conformance vs unit](/book/08-green-tests-red-production/conformance-vs-unit/)).

## Next

[Conformance vs unit](/book/08-green-tests-red-production/conformance-vs-unit/)
