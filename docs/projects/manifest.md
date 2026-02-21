---
description: Pecan Project Manifest
---

# Pecan Project Script (`project.pn`)

`project.pn` is a Pecan build script executed by the toolchain. It declares project identity, dependencies, and build targets using the `Build` API.

## File name and location
- Name: `project.pn`
- Location: project root directory
- The script is parsed with the standard Pecan grammar.

## Minimal example (pure Pecan)
The script defines exactly one entrypoint: `fn project(b: Build) -> void`.

```pecan
fn project(b: Build) -> void {
    b.project("MyApp", "0.1.0");
    b.set_root("src");

    let std = b.dep("pecan.std", "../std");
    b.use_dep(std);

    let app = b.target("app", "main.pn");
    app.set_kind("app");
}
```

## Script validation (no special grammar)
`project.pn` is parsed as a normal Pecan program. The compiler then *validates usage*:
- There is exactly one `fn project(b: Build) -> void`.
- Only the `Build` API is used to declare targets/deps.
- IO is allowed but must go through explicit build APIs.

## Build API (v0.1)
### `b.project(name: string, version: string)`
- Sets project identity used in dependency resolution and diagnostics.

### `b.set_root(path: string)`
- Sets the source root (default: `"src"`).

### `b.dep(name: string, path: string)`
- Declares a local-path dependency.

### `b.dep_git(name: string, git: string, rev: string)`
- Declares a git dependency (rev can be tag/sha).

### `b.use_dep(dep: Dep)`
- Enables a dependency for this project.

### `b.target(name: string, entry: string)`
- Declares a build target with entry file under `root`.

### `Target.set_kind(kind: string)`
- `kind` is `"app" | "lib" | "test"`.

## Validation rules
- Project name must be unique within the dependency graph.
- `entry` must exist and be within `root`.
- Dependency sources must resolve.

## Notes
- Script uses Pecan syntax and is validated by toolchain rules.
- Future: `features`, `profiles`, `build` hooks.
