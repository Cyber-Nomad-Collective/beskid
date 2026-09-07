---
title: "Project manifest"
description: ".bproj blocks—project identity, source root, targets, and path dependencies."
tableOfContents: true
---

Project manifests use the **`.bproj`** extension and **Bsol** block syntax—HCL-like blocks parsed by Beskid tooling, not full Terraform HCL, not JSON with extra steps. One file per project directory, explicit intent.

Legacy **`Project.proj`** is rejected (**E1894**); rename to `<name>.bproj`.

## Minimal shape

```text
MyApp/
├── MyApp.bproj
├── Src/
│   └── Main.bd
├── obj/
│   └── beskid/
└── Project.lock
```

```text
MyApp {
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

The root block kind **`MyApp`** **must** match **`name = "MyApp"`**.

## Block roles

- **Named root block `{ ... }`** — identity, version, source root (`root`, default `Src`), optional `root_namespace` (metadata for package namespace conventions; does **not** change file-to-module mapping).
- **`target "<name>" { ... }`** — buildable unit (`kind`, `entry`; `entry` optional for `Lib` targets).
- **`dependency "<name>" { ... }`** — edge in the dependency graph (`source`, plus provider fields).

Corelib symbols are **not** prelude-injected; add explicit **`use`** imports for modules you need. Host projects still resolve corelib on the dependency graph by default.

## Provider reality (v1)

Path dependencies are the **enabled** provider. `git` and `registry` may appear in schema for forward compatibility but are provider-disabled in active graphs—do not plan your startup on them until the spec says otherwise.

## Validation expectations

Exactly one named root block (kind equals `name`), at least one `target`, unique labels, entries resolvable under `project.root` where required. Details: [manifest reference](/book/reference/projects/manifest/) and [project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/).

## Next

[Targets and outputs](/book/03-project-proj-or-it-didnt-happen/targets-and-outputs/)
