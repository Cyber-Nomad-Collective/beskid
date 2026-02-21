---
description: Pecan Project Resolution
---

# Project Resolution

This document defines how module paths are resolved, how the project graph is built from `project.pn`, and how imports are validated.

## Terminology
- **Project root**: directory containing `project.pn`.
- **Source root**: `root` field inside `project.pn` (default `src`).
- **Module path**: dotted path like `net.http`.

## Project Graph Construction
1. Start at the root project `project.pn`.
2. Execute `project.pn` to register targets and dependencies via the Build API.
3. Recursively load dependency project roots and execute their `project.pn` scripts.
4. Build a DAG of projects; detect cycles and report the chain.

## File-to-Module Mapping
- File `src/net/http.pn` maps to module path `net.http`.
- The file path relative to `root` determines the module path.
- The last segment is the module name (file stem).

## Resolution Order (name lookup)
For identifiers and paths inside a module:
1. Local scope (params, let bindings).
2. Enclosing scopes.
3. Imports (`use` aliases).
4. Module-level items.

This order is consistent with `docs/spec/10-name-resolution.md`.

## Module Graph (Inferred)
The module graph is inferred from `mod` declarations and file layout. The build script does not list modules explicitly.

## `mod` Declarations
- `mod net;` declares a submodule.
- The compiler searches for `root/net.pn` or `root/net/mod.pn` (configurable).
- Error if not found.

## `use` Imports
- `use net.http.Client;` resolves against the module graph.
- If multiple imports provide the same name without aliasing, emit `AmbiguousImport`.

## Visibility
- Items are private by default.
- `pub` items are visible across modules.
- Access to non-`pub` symbols from another module is an error.

## Error Conditions
- Missing `project.pn`.
- Duplicate project names in dependency graph.
- Project cycles.
- Import path not found.
- Visibility violations.
- Ambiguous imports.

## Future Extensions
- Virtual modules for generated code.
- Path remapping / aliasing in `project.pn`.
