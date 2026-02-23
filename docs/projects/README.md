description: Pecan Project Proposal
-----------------------------------

# Pecan Projects Proposal

This document proposes a Pecan-native project definition format inspired by Zig’s `build.zig` (code-driven build configuration). The goal is a **human-readable, code-based** project definition without XML/JSON, using regular Pecan syntax.

## Research Notes (short)

- **Zig** uses a Zig script (`build.zig`) to define build steps and module imports, offering code-driven configuration (no XML/JSON). Source: Zig build system modules guide. https://zig.guide/0.11/build-system/modules/
- **Go** uses a single `go.mod` file at the module root to declare module identity and dependencies in a minimal text format (contrast to our code-driven approach). Source: Go Modules guide. https://go.dev/wiki/Modules
- **Gleam** maps modules to directory/file structure and uses an external project file (gleam.toml) for project metadata; module name derives from path. https://tour.gleam.run/basics/modules/

## Goals

- Pure Pecan syntax for project definition (no XML/JSON/TOML).
- Stable project identity and deterministic project graph.
- Allow project metadata, dependencies, and build targets.
- Keep project structure **path-driven** by default (simple by convention).

## Proposed Structure

### 1) Project Script: `project.pn`

Each project root contains a `project.pn` file written in Pecan. It is executed by the toolchain to declare targets and dependencies via a build API.

```pecan
unit project(b: Build) {
    b.project("MyApp", "0.1.0");
    b.set_root("src");

    let std = b.dep("pecan.std", "../std");
    b.use_dep(std);

    let app = b.target("app", "main.pn");
    app.set_kind("app");
}
```

### 2) Project Layout

- `project.pn` sits at project root.
- `b.set_root("src")` defines source root (default: `src`).
- Project name and version are declared via `b.project(name, version)`.
- Files define module paths by folder structure:
  - `src/net/http.pn` → module path `net.http`

### 3) Module Path Rules

- `mod net;` loads subdirectory module.
- `use net.http.Client;` imports exported symbols.
- Paths are resolved relative to the **project root** (not CWD).

### 4) Dependency Resolution

- Dependencies are declared via `b.dep(...)` and enabled via `b.use_dep(...)`.
- Sources can be `path`, `git`, or `registry` (future).
- Dependency project roots contain their own `project.pn`.

### 5) Build Targets

Targets are explicit in the script:

- `entry` is a source file under `root`.
- Multiple targets allowed (app, tests, tools).

## Diagnostics Needed

- Missing `project.pn` when building.
- Duplicate project names in dependency graph.
- Project cycles (detect + report chain).
- Invalid target entry path.

## Incremental Adoption

- v0.1 can support `project`, `set_root`, `dep`, `use_dep`, `target`.
- Later: `features`, `profiles`, `build` hooks.
- Workspaces will group multiple projects (future feature).

## Canonical Next Doc

- `docs/projects/manifest.md`: formal grammar + fields.
- `docs/projects/resolution.md`: project graph + resolution order.
- `docs/projects/examples.md`: real layouts + sample manifests.
