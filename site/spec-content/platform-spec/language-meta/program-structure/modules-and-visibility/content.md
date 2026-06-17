---
title: Modules and visibility
description: File layout, `public`/`internal` boundaries, and how packages
  compose. The driver and package manager use the same module graph the
  typechecker sees.
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

Defines the **module graph**, **file-scoped modules**, and **`pub` visibility** rules. Name binding is in [Name resolution](/platform-spec/language-meta/program-structure/name-resolution/).

### Module forms

| Form | Rule |
| --- | --- |
| **Path `mod`** | `mod a.b;` declares the file’s module path; **must** be the first top-level item when used (**E1505**, **E1506**, **E1507**) |
| **Inline `mod`** | `mod name { items }` nests a submodule in the current file |
| **File path** | Without file-scoped `mod`, module identity **must** derive from file path relative to project source root |

### Visibility

- Items default to **private** to their module.
- **`pub`** on an item **must** export it to importers of the containing module.
- **`pub use path`** re-exports symbols; re-exported names **must** refer to accessible items.
- Importing a private item **must** error (**E1501**, **E1107**).

### Static rules

- Duplicate module declarations in one file **must** error.
- Nested `mod` declarations inside a file-scoped module file **must** error (**E1507**).
- Package boundaries **must** align with project manifests; cross-package visibility follows the same `pub` rules within each compilation.

### Dynamic semantics

Modules exist at compile time; runtime has no separate module loader beyond linked assemblies/packages produced by the toolchain.

### Diagnostics

Visibility band **E1501–E1507**; unused import **W1503**. Registry: [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Conformance

**L1** implementations **must** match reference layout tests for file-scoped modules and `pub` boundaries.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Modules and visibility - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Modules and visibility - Design model](./articles/design-model/)
- [Modules and visibility - Examples](./articles/examples/)
- [Modules and visibility - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Modules and visibility - Flow and algorithm](./articles/flow-and-algorithm/)
- [Modules and visibility - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
