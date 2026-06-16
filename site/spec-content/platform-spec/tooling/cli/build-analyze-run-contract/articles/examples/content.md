---
title: Examples
description: Concrete CLI invocations for build, analyze, and run workflows.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Analyze a project target

```bash
beskid analyze --project path/to/Project.proj
```

Emits semantic (+ mod) diagnostics for the resolved host target using the same pipeline as the IDE.

## Release build of an app

```bash
beskid build --project apps/demo/Project.proj --release --kind exe
```

Produces an AOT executable with release profile defaults; link mode and runtime strategy follow `beskid_aot` defaults unless overridden.

## Run with explicit entrypoint

```bash
beskid run --project apps/demo/Project.proj --entrypoint DemoHost.Run
```

JIT-compiles the resolved `app` target and invokes the named entry function.

## Workspace lock before CI build

```bash
beskid lock --project apps/demo/Project.proj
beskid build --project apps/demo/Project.proj
```

`lock` materializes `Project.lock`; `build` consumes the pinned graph.

## Plain progress for logs

```bash
beskid build --project apps/demo/Project.proj --plain
```

Maps pipeline phases to line-oriented stderr suitable for CI log parsers.
