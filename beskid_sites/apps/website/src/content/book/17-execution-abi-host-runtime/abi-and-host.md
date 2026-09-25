---
title: "ABI and host"
description: beskid_abi versions the contract between generated code and the runtime host; extern dispatch policy is a separate, language-level concern.
tableOfContents: true
---

`beskid_abi` is the versioned contract between generated code and the runtime host: layouts, symbol tables, and the `BeskidAbiValue` transport slot a managed value crosses through on its way into the runtime. Version skew here is not a vibe, it is normative text under [ABI versioning and compatibility](/platform-spec/execution/abi-and-host/abi-versioning-and-compatibility/), and the compiler validates an installed runtime kit against the exact ABI version it expects, failing closed on anything missing, mismatched, or tampered with. Chapter 14's AOT build page has the kit mechanics.

Extern dispatch is a different question from ABI versioning, and it lives on the language side. Chapter 21 covers the `extern` declaration itself, the C and Rust ABI profiles, and export and callback policy; this page is about what `beskid_runtime` does once execution starts, not the syntax that gets you there. See [Extern dispatch and policy](/platform-spec/execution/abi-and-host/extern-dispatch-and-policy/) for the normative split.
