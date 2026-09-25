---
title: "Targets and outputs"
description: App, Lib, and Test targets, what each one produces, and where the build puts it.
tableOfContents: true
---

A target answers two questions: what is the root of the module graph, and what shape of artifact comes out. A directory full of `.bd` files with no target is not a project. It is a folder that gaslights CI.

| `kind` | Needs `entry` | Default artifact from `beskid build` |
| --- | --- | --- |
| `App` | yes | executable |
| `Lib` | no | shared library |
| `Test` | yes | executable that runs `test` items |

## Entry and reachability

`entry` names the file whose `Main` starts the program. The compiler builds outward from there: modules the entry imports, modules those import, and the dependency packages they reach. Anything not reachable is not compiled, not type-checked past parse, and not in the binary. Two targets in one project can share most of their source and still produce different graphs, which is how you keep a test harness's helpers out of the shipped executable without a second project.

Because reachability is per target, you always say which one you mean when a project has several:

```bash
beskid build --project ./MyApp.bproj --target App
beskid test  --project ./MyApp.bproj --target Tests
```

`--project` accepts either the manifest path or its directory. Run from inside the project and the toolchain walks up to find the manifest, then down if there is exactly one below. Ambiguity is an error, not a coin flip.

## What `build` produces

`beskid build` resolves, type-checks, lowers to Cranelift IR, emits a native object, and links. There is no interpreter or bytecode in that sentence. The artifact kind follows the target: executables for `App` and `Test`, a shared library for `Lib`. Override with `--kind` when you want a static library out of a `Lib` or an object file without the link step. `--output` names the final artifact, `--release` selects the optimized profile, and `--target-triple` cross-compiles when the runtime kit for that triple is installed.

`beskid run` is `build` plus executing the result in a subprocess. It does not JIT. The thing that runs is the same binary `build` would have written, which means "works under `run`, breaks under `build`" is not a bug class you get to have.

## `obj/`

Dependencies get materialized under `obj/beskid/deps/src/<package>-<hash>/`, with `obj/beskid/cache` and `obj/beskid/root` beside them. Treat the whole directory as disposable. It is regenerated from the lockfile, and committing it is how you get a merge conflict in a file with a hash in its name.

Details of the build workflow live in the [build reference](/book/reference/projects/build-workflow/).
