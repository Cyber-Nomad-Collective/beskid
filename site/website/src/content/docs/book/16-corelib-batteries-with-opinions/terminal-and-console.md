---
title: "Terminal and console"
description: Higher-level console APIs sit above syscall-backed I/O—ANSI belongs in corelib, not in every sample main.
tableOfContents: true
---

Low-level syscall-backed I/O lives under the runtime `System` split (`Input`, `Output`, `Error`). **Console** work—colors, line discipline, the stuff you actually want when printing—belongs in dedicated corelib packages (for example `corelib_console`), not a monolithic `IO.bd` that became a junk drawer.

## Practical guidance

- Prefer documented console helpers for user-facing CLI output in **your** packages.
- Do not reimplement ANSI escape archaeology in app code because Stack Overflow said so.
- When behavior differs by OS, check platform-spec **Standard** text before `#ifdef` cosplay in Beskid.

## Spec

- [Terminal and console](/platform-spec/core-library/terminal-and-console/)
- [Runtime-backed corelib surfaces](/platform-spec/core-library/stability-and-api-shape/runtime-backed-corelib-surfaces/)
