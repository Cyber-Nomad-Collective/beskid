---
title: "Module layout"
description: File-scoped mod declarations, directory mapping, and cohesive folder structure."
tableOfContents: true
---

Modules are how humans navigate code. The compiler will enforce the graph whether or not your folders look pretty.

## One file, one module

Default rule: module identity follows the file path relative to `project.root` unless you override with a file-scoped declaration.

Optional file-scoped form at the top of a file:

```beskid
mod net.http;
```

That declares the **entire file** lives in `net.http`. A second `mod` declaration in that file is a **duplicate file-scoped module** error, not a suggestion.

## Inline vs file-scoped

| Style | When |
| --- | --- |
| File-scoped `mod a.b;` | Stable package-like files, API surfaces |
| Path-derived module | Quick scripts, small tools |
| Inline `pub mod inner { ... }` | Nested modules inside a parent file |

## Folder patterns

Map `domain.feature` to `domain/feature.bd` or nested folders as your tree convention demands. Stay consistent within a repo so imports do not become a personality test.

```mermaid
flowchart TD
  R[project.root / Src] --> F1[net/http.bd]
  R --> F2[net/http/client.bd]
  F1 --> M1[mod net.http]
  F2 --> M2[mod net.http.client]
```

## Tutorial pattern

1. Start a boundary file with `mod domain.feature;`.
2. Keep implementation files under matching folders.
3. Re-export only stable types/functions at the boundary (chapter [05](/book/05-names-nobody-agreed-on/)).

See also the [Modules and Visibility](/platform-spec/language-meta/program-structure/modules-and-visibility/) reference.
