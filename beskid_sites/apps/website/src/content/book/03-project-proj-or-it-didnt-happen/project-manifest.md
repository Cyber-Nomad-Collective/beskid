---
title: "Project manifest"
description: "The .bproj file: root block, targets, dependencies, and the one rule the resolver refuses to bend."
tableOfContents: true
---

Here is a complete manifest for an application with one library dependency.

```bsol
MyApp {
  name    = "MyApp"
  version = "0.1.0"
  root    = "Src"
}

target "App" {
  kind  = App
  entry = "Main.bd"
}

dependency "Inventory" {
  source = path
  path   = "../Inventory"
}
```

Three block kinds. That is the entire vocabulary you need for the first month.

## The root block

The first block is the project's identity, and its kind must equal its `name`. `MyApp { name = "MyApp" }` is valid. `MyApp { name = "Shop" }` is a manifest error before resolution even starts. The redundancy is deliberate: the block kind is what a human sees when they open the file, the `name` is what the resolver and the package registry use, and the compiler refuses to let those drift apart.

Fields you will actually set:

- `name` and `version`. The version is what you publish under. The registry assigns concrete versions on publish, so this is a floor, not a promise.
- `root`, the source directory relative to the manifest. Defaults to `Src`. The corelib packages use `src` because they were written by someone with lowercase opinions. Pick one per repository and stop.
- `readme`, a relative path the registry renders on the package page.
- `root_namespace`, metadata for package naming conventions. It does not change how files map to modules. Chapter 04 covers what does.

A hyphenated package name such as `my-tool` is accepted as `my_tool` for the root block, since hyphens are not identifiers. Prefer the underscore form in the file so the block and the name agree by inspection.

## Targets

A `target` is something the toolchain can build. The label is the name you pass to `--target`.

```bsol
target "App" {
  kind  = App
  entry = "Main.bd"
}

target "Core" {
  kind = Lib
}

target "Tests" {
  kind  = Test
  entry = "AllTests.bd"
}
```

`kind` is an enum written without quotes: `App`, `Lib`, or `Test`. `entry` is a file path relative to `root`. Libraries may omit it, because a library's surface is whatever its modules export rather than one file's `Main`. Applications and test harnesses need one, because something has to be the first thing that runs.

There is no `Debug` and `Release` target pair. Build profiles are a flag on `beskid build`, not a manifest fork. If you have ever maintained a `.csproj` with eleven `PropertyGroup` conditions, you know why.

## Dependencies

```bsol
dependency "Inventory" {
  source = path
  path   = "../Inventory"
}
```

The label is the package name as the dependency's own manifest declares it. `source = path` says where it comes from. Path dependencies are what resolve today; `git` and `registry` are recognized by the schema so manifests written for them parse, but the resolver reports them as disabled providers rather than pretending. The corelib itself is a path dependency in its own workspace, so path is not the training-wheels option. It is the option.

You do not declare the standard library. The resolver injects `corelib` into every project graph, and `Core.*` is reachable without an import. Chapter 16 explains the plumbing.

## What the validator checks

Before any Beskid source is parsed, the manifest is checked as a document against the `project.v1` schema profile and then as a project:

- exactly one root block, kind equal to `name`
- at least one `target`, with unique labels
- every `entry` resolvable under `root`
- every `dependency` label unique, with a provider that exists

Manifest errors land in the E18xx band and come with the file span, so you get "line 7, `entry` points outside `root`" and not a stack trace from a resolver three crates deep. The full contract is the [project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/) in the standard; the [manifest reference](/book/reference/projects/manifest/) lists every field.
