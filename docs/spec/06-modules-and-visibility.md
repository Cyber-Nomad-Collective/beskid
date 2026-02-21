# 06. Modules and Visibility

## Modules
- One file = one module.
- Declaration: `mod net;` (optional `pub`).
- Import: `use net.http.Client;` (optional `pub`).

Modules are resolved by file path. A dotted path refers to nested modules.

Example:
```
// file: net/http.pn
pub type Client { ... }

// file: app.pn
mod net;
use net.http.Client;
```

## Visibility
- Private by default.
- `pub` exposes a symbol externally.

Items without `pub` are visible only inside their defining module.

Example:
```
pub type User { name: string }
pub mod net;
pub use net.http.Client;
```

Example (private item):
```
type Secret { value: i32 }
// Secret is not visible outside this module
```
