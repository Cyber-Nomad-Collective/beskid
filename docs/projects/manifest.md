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

For `source = "git"`:
- `url` (required)
- `rev` (required)

For `source = "registry"` (future):
- `name` (required)
- `version` (required)

## Validation rules

1. Exactly one `project` block.
2. At least one `target` block.
3. Target labels must be unique.
4. Dependency labels must be unique.
5. `target.entry` must resolve under `project.root`.
6. `project.name` must be unique in final dependency graph.
7. Unknown fields should produce warnings in v0.1 and become errors later.

## Rust implementation guidance

- Parse and validate manifest with `hcl-rs` + serde structs.
- Use `hcl-edit` for formatting and migration tooling.
