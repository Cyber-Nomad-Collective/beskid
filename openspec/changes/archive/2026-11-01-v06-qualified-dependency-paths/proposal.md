## Why

Before this change, a fully qualified path such as `Core.Output.Write(...)` resolved only when its module was in the import closure for another reason, so a qualified call to a dependency module could fail with E1108 without a `use`. Program assembly also searched source roots in order and took the first root with a module file. When two packages in the dependency closure provided the same logical module path, the compiler silently selected the host or the first dependency. The result depended on root order, and the other package was never reported.

## What Changes

- A fully qualified path whose leading segments name a public module of any package in the resolved dependency closure resolves without a `use` declaration.
- A name in lexical scope (a `use` binding, an inline module, a type, an enum or a contract) shadows the absolute module lookup.
- A logical module path that two packages of the dependency closure provide fails with E1104. The diagnostic names the path and each providing package and module file, in effective root order (host first, then dependencies in plan order). Two roots that reach the same canonical file are one provider.
- A private item reached through a fully qualified path fails with E1107.
- **BREAKING**: a project whose host modules or dependencies provide the same logical module path as another package in its closure no longer compiles. There is no root-order fallback.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `language-meta--program-structure--name-resolution`: absolute qualified dependency paths, lexical shadowing, E1104 module path ambiguity and E1107 for qualified private items.
- `compiler--build-pipeline--program-assembly`: import-closure discovery fails closed on a module path that more than one package provides.

## Impact

Compiler: `beskid_analysis` module discovery (`projects/assembly/discovery.rs`, `resolve_module_file` now returns `Result<Option<PathBuf>, AmbiguousModulePath>`), the import-closure loader (`AssemblyError::AmbiguousModulePath`), the stage 5 module-not-found rule, and the semantic E1104 issue `ResolveAmbiguousModulePath`.

Compatibility: the Corelib packages and the Corelib Mods have no logical module path that two packages provide, so the Corelib aggregate is not affected. A user project that defines a host module with the same path as a Corelib or dependency module (for example `Console.bd` next to the `Core` dependency) must rename one of the modules.

Migration: rename or move the module in the package you own so that each logical module path has exactly one provider. The E1104 diagnostic lists every provider.

Legacy URLs: no public route changes.

Reversion: revert this change set. No persisted artifact records module path resolution.
