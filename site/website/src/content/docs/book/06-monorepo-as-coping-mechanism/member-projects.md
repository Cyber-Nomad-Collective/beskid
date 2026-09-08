---
title: "Member projects"
description: Addressing workspace members from CLI and LSP, paths, and isolation."
tableOfContents: true
---

Members are normal Beskid projects with their own `App.bproj`. The workspace adds **labels** and shared policy—not a second hidden build system.

## Member labels

`member "app" { path = "apps/main" }` means tooling can target `app` while resolving paths relative to the workspace root. Exact CLI flags: `--workspace-member` on commands that support project resolution (see [command reference](/book/reference/cli/command-reference/)).

## Typical layout

```text
repo/
├── Workspace.bws
├── apps/
│   └── main/
│       ├── App.bproj
│       └── Src/
└── libs/
    └── shared/
        ├── App.bproj
        └── Src/
```

Path dependencies between members often use relative `path = "../../libs/shared"` edges—keep them boring and explicit.

## Editor experience

Open the workspace root folder in VS Code so LSP sees `Workspace.bws`. Opening only a nested member folder works until it does not—usually when cross-member imports confuse discovery.

## Next

[Dependency cycles](/book/06-monorepo-as-coping-mechanism/dependency-cycles/)
