---
title: "Injection and resolution"
description: Why every Beskid project sees the same corelib package identity without you declaring it seventeen times.
tableOfContents: true
---

You do not "add corelib like any other dependency" in the happy path. The analysis resolver **injects** the canonical package so beginners do not ship programs that forgot the standard library and veterans do not fork reality with a random `corelib` path on a USB stick.

## Mental model

1. Resolver builds the project graph from `Project.proj` (and workspace members if applicable).
2. Corelib is located via discovery rules (embedded layout, `BESKID_CORELIB_ROOT`, overrides in dev).
3. The same package identity **`corelib`** is what CI publishes to **pckg** and what the CLI embeds for offline work.

```mermaid
flowchart TD
  proj[Project.proj] --> graph[Resolution graph]
  graph --> inj[Inject corelib]
  inj --> canon[Canonical beskid_corelib tree]
  dev[BESKID_CORELIB_SOURCE override] -.-> canon
```

## When overrides matter

Local compiler work often sets `BESKID_CORELIB_SOURCE` to the submodule checkout so you are not editing the embedded snapshot like a cave person. Production consumers should rely on registry versions, not your laptop path.

## Spec

- [Corelib injection and resolution](/platform-spec/core-library/compiler-integration/corelib-injection-and-resolution/)
- [Resolution and projects](/platform-spec/compiler/resolution-and-projects/)
