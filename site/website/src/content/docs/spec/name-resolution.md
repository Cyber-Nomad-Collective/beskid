---
title: "Name Resolution"
---


## Scope model (v0.1)
- Each file is a module.
- Each block introduces a new scope.
- `use` imports names into the current scope.

## Path vs member resolution contract
- `PathExpression` is for qualified symbol lookup (`module.item`, `alias.item`).
- `MemberExpression` is receiver-based access (`expr.member`).
- Resolver must not globally rewrite one shape into the other.
- Module/visibility diagnostics originate from path resolution only.

Scopes are lexical. Inner scopes can access names from outer scopes unless shadowed.

## Resolution order
- Local scope (including parameters)
- Enclosing scopes
- Imported names (including aliases)
- Module scope

This order ensures locals always win over imports and module-level items.

Example:
```beskid
use net.http.Client;

unit main() {
    let Client = 1; // local shadows import
    println(Client);
}
```

## Shadowing
- Later bindings can shadow earlier ones within inner scopes.
- Shadowing is allowed but should produce a warning.

Example:
```beskid
let value = 1;
if cond {
    let value = 2; // warning
    println(value);
}
```

## Imports
```beskid
use net.http.Client;
```

Aliasing resolves ambiguity:
```beskid
use a.Parser as AParser;
use b.Parser as BParser;
```

## Decisions
- `use` aliases participate in name resolution and method lookup.
- Alias precedence: locals win over aliases; aliases win over module scope.
- Item declarations are order-independent within a module.
- `pub use` is allowed for re-exporting.
- Ambiguous imports are compile-time errors (require aliasing).
- Shadowing is allowed but produces a warning in v0.1.
- Call semantics are resolved in typing, not by parser shape heuristics.
- Name resolution must provide stable symbol identity for later call classification (`MethodDispatch`, `ItemCall`, `CallableValueCall`).

Example (ambiguous import error):
```beskid
use a.Parser;
use b.Parser;
// error: Parser is ambiguous; use an alias
```
