---
title: ".bproj or it didn't happen"
description: One manifest per project, one lockfile, and a resolver that walks a DAG instead of guessing.
tableOfContents: true
---

A Beskid project is a directory with exactly one `<name>.bproj` in it. Not a solution file that points at project files that point at property sheets that point at a `Directory.Build.props` someone committed in 2017 and nobody dares delete. One file. It says what you are building, what you depend on, and where the sources are.

The file is written in Bsol, which looks like HCL because HCL got the shape right: a block, an optional label, assignments inside. If you have written Terraform you can read a manifest already. If you have written YAML for a living, this chapter is your parole hearing.

```text
MyApp/
├── MyApp.bproj
├── Project.lock
├── Src/
│   └── Main.bd
└── obj/
    └── beskid/
```

That is the whole layout. `MyApp.bproj` is intent. `Project.lock` is what the resolver actually did with that intent. `obj/` is where dependencies get materialized and it belongs in `.gitignore`.

The old `Project.proj` name is gone. Point a current toolchain at one and you get E1894 and an instruction to rename it. Same for `Workspace.proj`, which became `.bws` and gets E1895. Both errors exist because a build that silently accepts two spellings of the same file is a build that eventually resolves the wrong one.

The chapter walks the manifest block by block, then the target kinds, then `beskid new` so you stop hand-typing manifests, then the fetch/lock/update trio that keeps CI and your laptop in the same universe, and finally what the resolver does with all of it. The last page is about Bsol itself, for when you want to know why the config language is a language and not a JSON schema with delusions.
