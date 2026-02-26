---
description: Beskid Project Resolution (HCL)
---

# Project Resolution

This document defines how module paths are resolved, how the project graph is built from `Project.proj`, and how imports are validated.

## Terminology
- **Project root**: directory containing `Project.proj`.
- **Source root**: `project.root` field inside `Project.proj` (default `Src`).
- **Module path**: dotted path like `Net.Http`.

## Project Graph Construction
1. Start at the root project `Project.proj`.
2. Parse manifest to collect project identity, targets, and dependencies.
3. Recursively load dependency project manifests.
4. Build a DAG of projects; detect cycles and report the chain.

## File-to-Module Mapping
- File `Src/Net/Http.bd` maps to module path `Net.Http`.
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
The module graph is inferred from `mod` declarations and file layout. The manifest does not list modules explicitly.

## `mod` Declarations
- `mod Net;` declares a submodule.
- The compiler searches for `root/Net.bd` or `root/Net/Mod.bd` (configurable).
- Error if not found.

## `use` Imports
- `use Net.Http.Client;` resolves against the module graph.
- If multiple imports provide the same name without aliasing, emit `AmbiguousImport`.

## Visibility
- Items are private by default.
- `pub` items are visible across modules.
- Access to non-`pub` symbols from another module is an error.

## Error Conditions
- Missing `Project.proj`.
- Duplicate project names in dependency graph.
- Project cycles.
- Import path not found.
- Visibility violations.
- Ambiguous imports.

## Manifest-specific error conditions
- Unknown `source` kind in `dependency` block.
- Missing `entry` in `target` block.
- Target entry path outside source root.
- Duplicate target names.

## Future Extensions
- Virtual modules for generated code.
- Workspace manifests (`Workspace.proj`) for monorepo builds.
- Registry lockfile integration.
