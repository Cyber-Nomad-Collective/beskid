---
title: "04. Imports and Names"
description: Use `use`, aliases, and scope rules to keep names explicit and unambiguous.
---

Imports bring module symbols into the current scope.

## By the end of this chapter

- Use direct imports and aliases safely.
- Understand scope-first name resolution.
- Avoid ambiguity errors with intentional naming.

## Import forms

```beskid
use net.http.Client;
use net.http.Client as HttpClient;
pub use net.http.Client;
```

## Resolution model

When resolving names inside expressions, the resolver checks in this order:

1. Local scope (parameters, let bindings)
2. Enclosing scopes
3. Imports (including aliases)
4. Module scope

If two imports provide the same unaliased name, the compiler emits an ambiguity error.

Aliasing (`use a.Parser as AParser;`) gives explicit local names and avoids collisions without changing the original symbol identity.

## File-scoped module interaction

- A file-scoped declaration (`mod app.core;`) sets the module scope that imports are resolved within.
- Local declarations still take precedence over imports.
- Additional `mod` declarations are disallowed in that file, so module boundaries stay explicit.

## Common mistakes

- Importing two symbols with the same local name and no alias.
- Assuming import order can "override" a local binding.
- Exporting internal helper names with `pub use` unintentionally.

## Deep dive in spec

- [Name Resolution](/spec/name-resolution/)
- [Modules and Visibility](/spec/modules-and-visibility/)

## Next

Continue with [05. Workspaces and Monorepos](/book/05-workspaces-and-monorepos/).
