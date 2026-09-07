---
title: "pub use re-exports"
description: Building a stable public API surface without dumping every internal module."
tableOfContents: true
---

`pub use` is how you tell the truth about **your package API** without inviting every consumer into `internal/v2/experimental/`.

## Pattern

Boundary module at `myapp.api`:

```beskid
mod myapp.api;

pub use myapp.core.Service;
pub use myapp.core.Config;
// do NOT pub use myapp.core.HelperHack;
```

Consumers import from `myapp.api`, not from twenty leaf modules.

## When re-exports help

- You split implementation across files but want one import path for apps
- You rename internal modules without breaking callers (re-export old names temporarily)
- You mirror platform-spec "feature hub" style surfaces in libraries

## When re-exports hurt

- Re-exporting everything `pub` in core because you were lazy
- Accidentally `pub use` internal helpers—now they are semver

```mermaid
flowchart LR
  INT[internal modules] --> API[api.bd pub use]
  API --> APP[application imports]
```

## Relation to project `root_namespace`

`root_namespace` in `Project.proj` is metadata for package naming conventions—it does **not** replace module paths in source. Keep module declarations honest.

## Next

[Diagnostics you will see](/book/05-names-nobody-agreed-on/diagnostics-you-will-see/)
