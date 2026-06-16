---
title: Examples
description: Examples of runtime-backed corelib surfaces.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## Stdout write path

Application code calls `Core.Output` helpers → codegen targets `syscall_write` builtin → host writes fd 1. Errors surface as Beskid exceptions per runtime mapping.

## Fiber spawn

`fiber_spawn` builtin allocates fiber control block in runtime, registers GC roots, and schedules on runtime thread pool—corelib exposes typed wrappers only.

## ABI contract test snippet

Tests in `abi/contracts.rs` assert each exported builtin symbol referenced by codegen exists in the linked runtime library for the target triple.

## Separating console concerns

ANSI coloring and terminal size queries belong in **`corelib_console`** package dependencies on `Core.*` streams, keeping syscall surface minimal.
