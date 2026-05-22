---
title: "AOT build"
description: beskid_aot artifacts, linking, and why compiler mods are AOT-only.
tableOfContents: true
---

**AOT** emits native objects you can link and ship—required for **`type: Mod`** packages the host loads at compile time.

## Crate

`beskid_aot::build` consumes `CodegenArtifact` like JIT, then drives platform link steps per [Backends JIT/AOT](/platform-spec/compiler/build-pipeline/backends-jit-aot/).

## Mod artifacts

Mods are **not** interpreted Beskid scripts in the compiler process. The host loads **AOT-compiled** mod assemblies per target triple and cache key:

- [AOT artifact contract](/platform-spec/compiler/compiler-mods/mod-host-bridge/aot-artifact-contract/)
- [Mod AOT-only registration ADR](/platform-spec/compiler/compiler-mods/mod-host-bridge/adr/0003-mod-aot-only-registration/)

```mermaid
flowchart TB
  modSrc[Mod Beskid sources]
  aot[beskid_aot build mod]
  artifact[mod.descriptor.json + native object]
  host[mod.load in beskid_analysis]
  modSrc --> aot --> artifact --> host
```

## CLI

`beskid build` selects targets and backends per manifest—see [build command reference](/book/reference/cli/commands/build/).

## Next

[CLIF and debug](/book/14-from-source-to-runs/clif-and-debug/)
