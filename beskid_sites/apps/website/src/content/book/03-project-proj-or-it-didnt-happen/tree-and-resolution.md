---
title: "Graphs and resolution"
description: What the resolver does between reading a manifest and handing the compiler a module graph, and how to look at it.
tableOfContents: true
---

Resolution is a DAG walk with a receipt. Nothing about it is clever, which is why it is debuggable.

1. Find the manifest, from `--project` or by walking the directory tree.
2. If a `.bws` workspace owns it, load the workspace's member list and shared policy.
3. Read every `dependency` block, load each dependency's manifest, and recurse until the graph closes.
4. Inject `corelib` and its packages.
5. Order the graph so every package builds before anything that depends on it.
6. Write or verify `Project.lock`, then materialize sources under `obj/beskid`.

Then, and only then, does the compiler see a `.bd` file.

## Looking at the graph

```bash
beskid graph --project ./MyApp.bproj
beskid graph --project ./MyApp.bproj --kind imports --mermaid --output graph.mmd
```

`graph` renders the resolved structure in the terminal, or emits Mermaid you can paste into a pull request. `--kind` selects the layer: `project` for the dependency graph, `workspace` for members, `module` for the module tree, `imports` for `use` edges between modules, and `host` for host composition. When "why is this package in my build" comes up in review, the answer is one command, not archaeology through five manifests.

`beskid tree file.bd` is a different tool. It prints the parse tree of one file, and it is for arguing with the parser, not the resolver.

## Failure modes

| Diagnostic says | What happened |
| --- | --- |
| disabled provider | a dependency uses `source = git` or `registry`; only `path` resolves today |
| entry not under root | `target.entry` escapes `root`, usually `../` in the path |
| cycle | project A depends on B depends on A; chapter 06 covers the surgery |
| lockfile mismatch under `--locked` | manifests changed since the last `lock` |
| legacy `Project.proj` (E1894) | rename it to `<name>.bproj` |
| legacy `Workspace.proj` (E1895) | rename it to `<name>.bws` |

Path dependencies fail on typos more than anything else. `path = "../Inventroy"` produces a clear "manifest not found at" with the absolute path it tried, so read that path before you read anything else.

The [resolution reference](/book/reference/projects/resolution/) has the full algorithm including workspace member precedence.
