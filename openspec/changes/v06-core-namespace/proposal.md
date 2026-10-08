## Why

The owner ruled on 2026-10-07: "I don't want Std, I want Core." Before this change, an App with the implicit Corelib dependency put a `Std.` prefix on every logical module path, host modules included. Corelib shards also saw a second, bare alias of their own modules. Two names for one module made imports, diagnostics, documentation and IDE completion disagree. This change removes the `Std` namespace and gives each module one package-native path.

## What Changes

- Logical module paths come only from the source location under a source root. The host project's modules have no prefix. Corelib packages keep their own roots: `Core.*`, `Testing.*`, `Concurrency.*`, `Beskid.Compiler.*` and the other package roots.
- The implicit Corelib dependency label is `Core`. The label is reserved for the Corelib aggregate (`corelib`). It requires `source = path`; without `path` it selects the installed Corelib.
- Dependency labels and module path segments are separate namespaces. The `Core` label never becomes a module path segment.
- A `Std.`-qualified import or module path fails with E1105 or E1108. The message states that the `Std` namespace does not exist, and the help names the package-native replacement.
- A path dependency labeled `Std` without `path` fails validation and names the `Core` label.
- **BREAKING**: `use Std.Core.Output;` and every other `Std.`-qualified path stop resolving. No alias or fallback is kept.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `compiler--build-pipeline--program-assembly`: package-native logical module paths and the removed `Std` namespace.
- `core-library--compiler-integration--corelib-injection-and-resolution`: the reserved `Core` dependency label.
- `tooling--lsp--intellisense-capabilities-and-behavior`: completion scenario uses a package-native import.
- `language-meta--contracts-and-effects--error-handling`: `Result` guidance refers to the `Core` dependency.

## Impact

Compiler: `beskid_analysis` path inference, module discovery, graph resolver and manifest validator; `beskid_queries` module registry (the App-only alias layer and the shard-local registry are deleted). Fixtures, tests, the Book, Docs and informative OpenSpec examples move to package-native paths. Every `Project.lock` that recorded `name=Std` is regenerated with `name=Core`.

Compatibility: source that imports `Std.*` no longer compiles. Manifests with an explicit `dependency "Std"` that points at the Corelib aggregate must rename the label to `Core`. A user dependency that was labeled `Core` and is not the Corelib aggregate must take a different label.

Migration: remove the leading `Std.` from each import and qualified path (`Std.Core.Output` becomes `Core.Output`; `Std.Testing.Assert` becomes `Testing.Assert`). Regenerate lockfiles with `beskid update --all`. The compiler diagnostic names the replacement for each site.

Legacy URLs: no public route changes.

Reversion: revert this change set and regenerate lockfiles. No persisted artifact other than `Project.lock` records the dependency label.
