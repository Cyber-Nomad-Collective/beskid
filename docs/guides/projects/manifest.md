---
description: Beskid Project Manifest (HCL)
---

# Beskid Project Manifest (`Project.proj`)

`Project.proj` is the canonical project manifest format, using HCL syntax.

## File name and location
- Name: `Project.proj`
- Location: project root directory

## Minimal example

```hcl
project {
  name    = "MyApp"
  version = "0.1.0"
  root    = "Src"
}

target "App" {
  kind  = "App"
  entry = "Main.bd"
}

dependency "Std" {
  source = "path"
  path   = "../Std"
}
```

## Manifest schema (v0.1)

### `project` block (required, exactly one)
- `name` (string, required)
- `version` (string, required)
- `root` (string, optional, default: `"Src"`)

### `target` block (required, one or more)
- Label = target name (unique)
- `kind` (required): `"App" | "Lib" | "Test"`
- `entry` (required): path relative to `project.root`

### `dependency` block (optional, zero or more)
- Label = dependency alias used by tooling
- `source` (required): `"path" | "git" | "registry"`

For `source = "path"`:
- `path` (required)

For `source = "git"` (provider reserved, not enabled in v1):
- `url` (required)
- `rev` (required)

For `source = "registry"` (provider reserved, not enabled in v1):
- `name` (required)
- `version` (required)

## Active provider scope (v1)

1. Enabled dependency provider: `path`.
2. `git` and `registry` are schema-valid for forward compatibility but provider-disabled in runtime scope.
3. Build/run fails when a disabled provider dependency is present in an active graph.

## Validation rules

1. Exactly one `project` block.
2. At least one `target` block.
3. Target labels must be unique.
4. Dependency labels must be unique.
5. `target.entry` must resolve under `project.root`.
6. Dependency node identity is canonicalized by resolved manifest path.
7. Duplicate canonical manifest identities in graph construction must be interned to one node.
8. `project.name` duplicates across different manifest identities should be diagnostics in graph-resolution stage (warning in v0.1, error in strict mode).
9. Unknown fields should produce warnings in v0.1 and become errors later.
10. Dependency sources are source-code only; binary dependency artifacts are unsupported.
11. `Project.lock` is created automatically during resolve/build/run if missing.
12. `Project.lock` is updated automatically when dependency graph identity changes.

## Rust implementation guidance

- Parse and validate manifest with `hcl-rs` + serde structs.
- Use `hcl-edit` for formatting and migration tooling.
- Build dependency DAG with `daggy` and preserve unresolved non-path dependency nodes for policy diagnostics.
- Materialize resolved dependencies into `obj/beskid/deps/src` before compile stages.
