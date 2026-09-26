---
title: "ABI and host"
description: Versioned ABI surfaces and how extern calls cross the host boundary.
tableOfContents: true
---

`beskid_abi` defines the contract between generated code and the runtime host. Version skew is not a vibe—it is a **compatibility** topic with normative text under [ABI versioning and compatibility](/platform-spec/execution/abi-and-host/abi-versioning-and-compatibility/).

Extern dispatch policy lives separately: [Extern dispatch and policy](/platform-spec/execution/abi-and-host/extern-dispatch-and-policy/). If you are wiring FFI, read chapter 21 *before* you `@extern` your way into a CVE write-up.

```mermaid
sequenceDiagram
  accTitle: Program crossing the ABI
  accDescr: A Beskid program calls builtin and fiber operations on the runtime services, calls extern functions on the native host under an ABI profile, and the runtime reaches the host through a syscall bridge.
  participant App as Beskid program
  participant RT as Runtime services
  participant Host as Native host
  App->>RT: builtin / fiber op
  App->>Host: extern (ABI profile)
  RT->>Host: syscall bridge
```

## Hub

[17. Execution](/book/17-execution-abi-host-runtime/)
