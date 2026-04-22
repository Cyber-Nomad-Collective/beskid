---
title: "Modules and Visibility"
---


## Modules
- One file = one module.
- File-scoped declaration: `mod net.http;` (must be first top-level item).
- Import: `use net.http.Client;` or `use net.http.Client as HttpClient;` (optional `pub`).

When file-scoped `mod` is present, the declared path becomes the module identity for the whole file and overrides path-derived module identity.

| File context | Module identity |
|---|---|
| `mod net.http;` as first top-level item | `net.http` (declared file scope) |
| no file-scoped `mod` | derived from file path relative to source root |

Example:
```beskid
// file: any path under source root
mod net.http;
pub type Client { ... }
```

## File-scoped constraints
- A file can declare at most one file-scoped `mod`.
- The file-scoped declaration must be the first top-level item.
- Additional `mod` declarations in that file are errors.

## Visibility
- Private by default.
- `pub` exposes a symbol externally.

Items without `pub` are visible only inside their defining module.

Example:
```beskid
pub type User { string name }
pub use net.http.Client;
```

Example (private item):
```beskid
type Secret { i32 value }
// Secret is not visible outside this module
```
