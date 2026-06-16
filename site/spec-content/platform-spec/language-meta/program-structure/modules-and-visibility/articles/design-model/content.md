---
title: Modules and visibility - Design model
description: Conceptual model for the module graph, file-scoped modules, and pub
  visibility rules in Beskid.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-05
---

## Vocabulary

| Construct | Role |
| --- | --- |
| **`ModuleDeclaration`** | Out-of-line module declaration (`mod path;`) |
| **`InlineModule`** | Inline nested module (`mod name { items }`) |
| **`UseDeclaration`** | Import with optional alias (`use Path as Alias;`) |
| **`Visibility`** | `pub` or private (default) |

## Module architecture

The module graph is built from file paths and explicit `mod` declarations. The driver and package manager use the same module graph the typechecker sees.

```mermaid
flowchart LR
    file[File path]
    mod[mod declaration]
    inline[inline mod]
    use[use imports]
    vis[visibility check]
    file --> mod --> inline --> use --> vis
```

### Subsystem boundaries

| Subsystem | Responsibility | Key file |
| --- | --- | --- |
| Parser | Parse `mod`, `use`, `pub` | `syntax/items/module_declaration.rs`, `use_declaration.rs` |
| AST | Store module structure | `syntax/items/` |
| Resolver | Build scope chain | `resolve/collect.rs` |
| Visibility rules | Check access | `analysis/rules/staged/visibility.rs` |

## Module forms

| Form | Rule |
| --- | --- |
| **Path `mod`** | `mod a.b;` declares the file's module path; must be the first top-level item when used |
| **Inline `mod`** | `mod name { items }` nests a submodule in the current file |
| **File path** | Without file-scoped `mod`, module identity derives from file path relative to project source root |

## Visibility

- Items default to private to their module.
- `pub` on an item exports it to importers of the containing module.
- `pub use path` re-exports symbols; re-exported names must refer to accessible items.
