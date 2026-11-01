## MODIFIED Requirements

### Requirement: Link-time extern is the Standard path: Decision [D-EXEC-ABI-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Track | Status |
> | --- | --- |
> | **Link-time** | **Standard** for v0.3 — addresses fixed before execution via [C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/link-time-linking/) |
> | **JIT symbol resolution** | The engine resolves each required extern symbol once, when it compiles the artifact; see "Extern resolution fails closed". There is no feature flag, cache policy or allow and deny list for it |
> | Validation | High-level Beskid types in extern signatures **must** be rejected before codegen |
> | Syscalls | User externs **must not** embed OS syscall sequences — see [Panic, IO, and syscalls](/platform-spec/execution/runtime/panic-io-and-syscalls/) |

**Stable ID:** `BSP-REQ-BFB9F04E7E50`  
**Legacy source:** `site/spec-content/platform-spec/execution/abi-and-host/extern-dispatch-and-policy/adr/0005-link-time-extern-standard/content.md`  
**Source SHA-256:** `510e845b8c76477c82027eebad4fbd3ae71fd88588cf64c219244465356d0e2c`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## ADDED Requirements

### Requirement: Extern resolution fails closed
The engine SHALL resolve a required `[Extern]` symbol while it compiles the artifact, before any user code runs. An import SHALL name the C ABI and a non-empty library. An import that names a symbol owned by the runtime kit SHALL fail. The engine SHALL look up the symbol first among the symbols that the process has loaded. When the process does not have the symbol, the engine SHALL load the declared library with `dlopen` (`RTLD_NOW | RTLD_LOCAL`) and look the symbol up in it. When the library cannot be loaded, or the symbol is not found, compilation SHALL fail and the message SHALL contain the `dlopen` or `dlsym` text. The engine SHALL NOT bind an address of zero or a stub address for a required symbol. The engine SHALL NOT read an allow list or a deny list. A host that does not support this resolution SHALL fail compilation of an artifact that has a required extern. An optional extern whose library or symbol does not resolve SHALL bind the absent sentinel and SHALL NOT fail compilation.

#### Scenario: Symbol is in the process
- **GIVEN** an `[Extern(Abi:"C", Library:"libc.so.6")]` contract that declares `getpid`
- **WHEN** the engine compiles the artifact on Linux
- **THEN** the symbol resolves from the loaded process and the call returns the process identifier

#### Scenario: Symbol is missing
- **GIVEN** an extern contract whose symbol exists in no loaded library and not in the declared library
- **WHEN** the engine compiles the artifact
- **THEN** compilation fails with a message that contains `dlsym(` and the symbol name

#### Scenario: Library is missing
- **GIVEN** an extern contract whose symbol is not loaded and whose declared library cannot be loaded
- **WHEN** the engine compiles the artifact
- **THEN** compilation fails with a message that contains `dlopen(` and the library name

#### Scenario: Environment variables have no effect
- **GIVEN** the variables `BESKID_EXTERN_ALLOW` or `BESKID_EXTERN_DENY` are set
- **WHEN** the engine compiles an artifact that has an extern
- **THEN** the result is the same as when they are not set
