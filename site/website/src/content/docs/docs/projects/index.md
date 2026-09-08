---
title: Projects
description: Define a Beskid project with a .bproj manifest, targets, and dependencies.
audience:
  - developer
authority:
  status: informative
  sourceLabel: Beskid project CLI reference
  sourceHref: /book/reference/projects/
  limits: This page gives a verified project workflow. It does not define the manifest format.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

A Beskid project uses a `.bproj` manifest. The manifest states the project identity, source root, targets, and dependencies.

## Start with a manifest

Create one `.bproj` file in the project directory. Keep the source tree under the declared root.

```text
MyApp/
├── MyApp.bproj
└── Src/
    └── Main.bd
```

Use a target to name a buildable unit. Use a dependency block to declare each dependency.

```text
MyApp {
  name = "MyApp"
  version = "0.1.0"
  root = "Src"
}

target "App" {
  kind = App
  entry = "Main.bd"
}
```

## Resolve before you build

Run the project-aware analysis command before you compile.

```bash
beskid dev syntax analyze --project ./MyApp.bproj
```

Use the project reference when you add targets, workspaces, or dependencies. Do not treat this page as a second specification of the manifest format.
