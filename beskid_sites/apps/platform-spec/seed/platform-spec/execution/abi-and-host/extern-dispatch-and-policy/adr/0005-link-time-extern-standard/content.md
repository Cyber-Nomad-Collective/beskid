import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Early engine prototypes resolved `Extern(Library:…)` via `dlopen`/`dlsym`. That complicates reproducible AOT artifacts and blurs security review of loaded code.

## Decision

| Track | Status |
| --- | --- |
| **Link-time** | **Standard** for v0.3 — addresses fixed before execution via [C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/link-time-linking/) |
| **Dynamic `extern_dlopen`** | **Proposed** / legacy — engine feature only; not required for reference CLI |
| Validation | High-level Beskid types in extern signatures **must** be rejected before codegen |
| Syscalls | User externs **must not** embed OS syscall sequences — see [Panic, IO, and syscalls](/platform-spec/execution/runtime/panic-io-and-syscalls/) |

## Consequences

New platform work documents link-time flows first. Dynamic resolution stays gated behind `extern_dlopen` in `beskid_engine`.

## Verification anchors

`compiler/crates/beskid_analysis` extern validation; `beskid_engine` link paths.
