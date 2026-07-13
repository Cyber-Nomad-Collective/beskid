<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Syscall Specification

## Purpose

Typed descriptor syscall facade for text and binary I/O.

## Requirements

### Requirement: Core.Syscall conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-3BFCF11BD720`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Core.Syscall

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/stability-and-api-shape/core-syscall/`  
**Source:** `site/spec-content/platform-spec/core-library/stability-and-api-shape/core-syscall/content.md`  
**SHA-256:** `f95c22f491d5508c581762cf0dc3e554cee867575464f13c2ed4e88a7da0bb46`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Core.Syscall` exposes typed `ReadWith` / `WriteWith` and binary `ReadBytes` / `WriteBytes` for arbitrary descriptors via `Descriptor::Raw`. Standard stream modules remain a restricted profile (**SC-004**, **IO-001** / **IO-002**).
</SpecSection>

<SpecSection title="Scope" id="scope">
- **In scope:** Typed descriptor facade (`Descriptor`, `ReadRequest`, `WriteRequest`, `SyscallError`), text and binary read/write for arbitrary fds, and stable error mapping across JIT/AOT.
- **Out of scope:** Console markup, terminal controls, and std-stream-only modules (`Core.Input`, `Core.Output`, `Core.Error`) which **must** use `Descriptor::Standard` only.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- `compiler/corelib/packages/foundation/src/Core/Syscall.bd`
- `compiler/corelib/packages/foundation/src/Core/Syscall/`
- Runtime builtins: `compiler/crates/beskid_runtime/src/builtins/io.rs`
- Corelib tests: `compiler/corelib/beskid_corelib/tests/corelib_tests/src/system/Syscall*Tests.bd`
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
| Surface | Rule |
| --- | --- |
| **SC-001** | `ReadWith` / `WriteWith` **must** route via typed `Descriptor`, not raw fd integers in stream modules. |
| **SC-004** | `Core.Input` / `Output` / `Error` **must** use `Descriptor::Standard` only (**IO-001**, **IO-002**). |
| **SC-005** | `SyscallError` mapping **must** be stable across JIT/AOT. |
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/stability-and-api-shape/core-syscall/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/core-library/stability-and-api-shape/core-syscall/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `e0632b9797576fd5e3abfecf6c85c43dc9c012e11fdb1f07770a67c288ceebd8`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative requirements

| ID | Requirement |
| --- | --- |
| **SC-001** | `ReadWith` / `WriteWith` **must** route via typed `Descriptor`, not raw fd integers in stream modules. |
| **SC-002** | `ReadBytes` **must** support arbitrary non-negative fds via `Descriptor::Raw`. |
| **SC-003** | `WriteBytes` **must** accept `u8[]` payloads for arbitrary fds. |
| **SC-004** | `Core.Input` / `Output` / `Error` **must** use `Descriptor::Standard` only (**IO-001**, **IO-002**). |
| **SC-005** | `SyscallError` mapping **must** be stable across JIT/AOT. |
| **SC-006** | Linux write path **must** loop partial writes; read returns short buffers on EOF. |
| **SC-007** | Text `Read` **must** validate UTF-8 when building `string`. |
| **SC-008** | Binary `ReadBytes` **must not** validate UTF-8. |
| **SC-009** | Negative fd **must** return `InvalidFd` before syscall. |
| **SC-010** | `maxBytes < 1` **must** return `InvalidReadLimit`. |

## Implementation anchors

- `compiler/corelib/packages/foundation/src/Core/Syscall.bd`
- `compiler/corelib/packages/foundation/src/Core/Syscall/`
``````

</details>
