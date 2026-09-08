---
title: Projects
description: Define a Beskid project with a .bproj manifest, targets, and dependencies.
---

# Projects

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

## Document annotation

**Status:** informative.

**Source:** [Project manifest](/book/03-project-proj-or-it-didnt-happen/project-manifest/) explains the active manifest shape. The [standard](/docs/standard/) is normative.
