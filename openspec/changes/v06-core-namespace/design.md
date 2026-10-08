## Context

`infer_logical_module_path` added a `Std` segment to every unit when the compile plan had the implicit Corelib dependency. `beskid_queries` then registered a second, bare path for Corelib shard units and hid it from App units. `resolve_module_file` removed a leading `Std.` before it searched the disk. The resolver injected the implicit dependency under the label `Std`.

## Decisions

1. One path per module. The logical module path is the relative source path under its source root (with the homonymous-file and `.generated` rules unchanged). No package, dependency label or project kind adds a prefix.
2. The Corelib dependency label is `Core` (`CORE_DEPENDENCY_NAME`). A manifest may declare it only as a path dependency. If `path` is absent, the installed Corelib aggregate is used. If `path` is present, the target project must be the Corelib aggregate (`corelib`); otherwise graph resolution fails. A user package therefore cannot take the label and silently remove Corelib from the graph.
3. Dependency labels are not module path segments. Path inference reads only file locations, and `package_for_unit` uses labels only to name the declaring package. A module path that starts with `Core` and a dependency labeled `Core` cannot collide.
4. The removed namespace fails closed. `Std.X` is an ordinary unknown path (E1105 for `use`, E1108 for qualified module paths). The diagnostic message and help name the package-native replacement. No alias resolves it.

## Single path and removed behavior

Deleted: the `Std` prefix in `infer_logical_module_path`, `module_path_from_src_suffix` and `module_path_from_generated_suffix`; the `Std.` lookup candidate in `resolve_module_file`; `SyntaxDependencyRegistry::corelib_local_modules` and `corelib_shard_units`; the `Std.Concurrency.Fiber` lookup; the `Std` project-name and dependency-label checks in the graph resolver and validator; the implicit `std` import root in the file-local import rule.

## Observability and security

The E1105 and E1108 messages include the rejected path and the replacement. Manifest validation names the `Core` label when a path-less `Std` dependency appears. Reserving the `Core` label prevents a user package from shadowing Corelib in the dependency graph.

## Rollback and authority

OpenSpec is the normative authority for module paths and the dependency label. Rollback reverts the change set and regenerates lockfiles; no compatibility alias is introduced in either direction.

## Open item

Module paths are now shared across packages. A host file such as `Src/Testing/Assert.bd` has the same logical path as the Corelib `Testing.Assert` module. Before this change the same overlap existed under the `Std.` prefix. A cross-package module-path collision diagnostic is not part of this change and needs a separate decision.
