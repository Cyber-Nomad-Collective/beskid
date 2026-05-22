---
title: "Project manifest"
description: "Project.proj blocks—project identity, source root, targets, and path dependencies."
tableOfContents: true
---

`Project.proj` is HCL-**like** blocks parsed by Beskid tooling—not full Terraform HCL, not JSON with extra steps. One file, explicit intent.

## Minimal shape

```text
MyProject/
├── Project.proj
├── Src/
│   └── Main.bd
├── obj/
│   └── beskid/
└── Project.lock
```

```hcl
project {
  name    = "MyApp"
  version = "0.1.0"
  root    = "Src"
  root_namespace = "Company.Product"
}

target "App" {
  kind  = App
  entry = "Main.bd"
}

dependency "Std" {
  source = path
  path   = "../Std"
}
```

## Block roles

- **`project { ... }`** — identity, version, source root (`root`, default `Src`), optional `root_namespace` (metadata for package namespace conventions; does **not** change file-to-module mapping).
- **`target "<name>" { ... }`** — buildable unit (`kind`, `entry`).
- **`dependency "<name>" { ... }`** — edge in the dependency graph (`source`, plus provider fields).

## Provider reality (v1)

Path dependencies are the **enabled** provider. `git` and `registry` may appear in schema for forward compatibility but are provider-disabled in active graphs—do not plan your startup on them until the spec says otherwise.

## Validation expectations

Exactly one `project` block, at least one `target`, unique labels, entries resolvable under `project.root`. Details: [manifest reference](/book/reference/projects/manifest/) and [project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/).

## Next

[Targets and outputs](/book/03-project-proj-or-it-didnt-happen/targets-and-outputs/)
