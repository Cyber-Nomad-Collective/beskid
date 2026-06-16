---
title: Backends (JIT and AOT) - Design model
description: Backend responsibility split and shared artifact model for run and
  build commands.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Backend split

```mermaid
flowchart TB
  artifact[CodegenArtifact sealed]
  artifact --> jitPath[JIT beskid run]
  artifact --> aotPath[AOT beskid build]
  jitPath --> load[Load runtime + resolve exports]
  load --> exec[Execute entry fiber]
  aotPath --> obj[Emit object module]
  obj --> link[Optional link + runtime prep]
```

- **JIT path** (`beskid run`): compile artifact in-process and execute resolved entrypoint.
- **AOT path** (`beskid build`): emit object, optionally prepare runtime, optionally link native output.

Both paths **must** consume the same lowering artifact contract. JIT and AOT **must not** rebuild [`ProgramAssembly`](/platform-spec/compiler/build-pipeline/program-assembly/) or re-resolve `CompilePlan`; assembly is owned by `beskid_analysis` front-end services only.
