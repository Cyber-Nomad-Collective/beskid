---
title: Backends (JIT and AOT) - Flow and algorithm
description: Ordered backend execution for run and build after lowering completes.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

```mermaid
flowchart TB
  lower[lower_program -> CodegenArtifact]
  lower --> jitBranch[JIT branch]
  lower --> aotBranch[AOT branch]
  jitBranch --> j1[JitModule compile]
  j1 --> j2[ABI symbol resolve]
  j2 --> j3[Run entry]
  aotBranch --> a1[Object emit]
  a1 --> a2[Runtime prep]
  a2 --> a3[Link if requested]
```

## JIT flow

1. Lower source with diagnostics.
2. Compile artifact in `JitModule`.
3. Resolve and validate entrypoint against manifest.
4. Execute and return formatted result.

## AOT flow

1. Lower source with diagnostics.
2. Build request from CLI flags.
3. Emit object module.
4. Prepare runtime and link when output kind requires it.
