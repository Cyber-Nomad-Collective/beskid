---
title: Backends (JIT and AOT) - Contracts and edge cases
description: Required backend guarantees for output kinds, entrypoints, and
  shared lowering semantics.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

- JIT and AOT must not diverge in front-end semantic results for the same source.
- Entrypoint contract for executables requires symbol `main` in current AOT linker strategy.
- AOT supports `Exe`, `SharedLib`, `StaticLib`, and `ObjectOnly` output kinds, with platform limits enforced by linker strategy checks.
- Static archive merge currently targets Unix-style toolchains (`ar`/`ranlib` or `libtool` on Apple hosts); Windows static archive merge is rejected as unsupported.
- When JIT extern loading is enabled (`extern_dlopen`), symbol resolution must respect configured allow/deny policy filters (`BESKID_EXTERN_ALLOW`, `BESKID_EXTERN_DENY`).
- Backend failures should report compile/build diagnostics, not silently fallback to alternate modes.
