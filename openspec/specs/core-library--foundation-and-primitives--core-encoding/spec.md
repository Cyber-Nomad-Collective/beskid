<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Encoding Specification

## Purpose

Encoding contracts and Utf8, Hex, Base64 implementations.
## Requirements
### Requirement: Encoding contract v1: Decision [D-CORE-PRIM-0020]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> v1 uses a Beskid `contract Encoder` with `EncodeToBytes` / `DecodeFromBytes` returning `Result`. No lossy decode in v1.

**Stable ID:** `BSP-REQ-A96D64074920`  
**Legacy source:** `site/spec-content/platform-spec/core-library/foundation-and-primitives/core-encoding/adr/0020-encoding-contract-v1/content.md`  
**Source SHA-256:** `e01e708e2ad64837f5818c09e9d593eacc47f162de5716c5b36a3ca6e8826159`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Strict UTF-8 rejects non-scalar encodings
`Core.Encoding.Utf8.DecodeFromBytes` SHALL accept only shortest-form UTF-8 sequences encoding Unicode scalar values. It MUST return `EncodingError::InvalidSequence` for overlong encodings, surrogate code points, code points greater than `U+10FFFF`, invalid continuation bytes, and truncated sequences; it MUST NOT replace invalid input or panic. `Core.Encoding.DecodeHttpAscii(u8[] input) -> Core.Results.Result<string, EncodingError>` MUST reject every byte greater than `0x7F` and MUST return the corresponding ASCII string only for accepted input.

**Stable ID:** `BSP-REQ-6B3A72539DE6`

#### Scenario: Overlong UTF-8 is rejected
- **GIVEN** the two-byte overlong representation of an ASCII code point
- **WHEN** `Utf8.DecodeFromBytes` is invoked
- **THEN** it returns `EncodingError::InvalidSequence`

### Requirement: Hex and Base64 reject malformed encodings
Hex decoding SHALL reject odd-length input and non-hex characters. Base64 decoding SHALL use the RFC 4648 standard alphabet and SHALL reject invalid alphabet bytes, non-final padding, more than two padding bytes, invalid unused bits, and lengths not valid after padding rules; both decoders MUST return `EncodingError` rather than producing partial or lossy output.

**Stable ID:** `BSP-REQ-C1442592D817`

#### Scenario: Invalid Base64 unused bits are rejected
- **GIVEN** a Base64 input with valid alphabet characters but non-zero unused bits in its final quantum
- **WHEN** `Base64.DecodeFromBytes` is invoked
- **THEN** it returns `EncodingError`

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Core.Encoding

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/foundation-and-primitives/core-encoding/`  
**Source:** `site/spec-content/platform-spec/core-library/foundation-and-primitives/core-encoding/content.md`  
**SHA-256:** `79fe5962739615e3de8a6bd26a00528e198a8e42553fefe56f179b9756c6ca0d`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Core.Encoding` defines a shared encoder contract and concrete encodings: **Utf8** (language default), **Hex**, and **Base64**. Invalid input returns `Result` errors; no silent replacement in v1.
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-PRIM-0020`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Encoding contract v1

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/foundation-and-primitives/core-encoding/adr/0020-encoding-contract-v1/`  
**Source:** `site/spec-content/platform-spec/core-library/foundation-and-primitives/core-encoding/adr/0020-encoding-contract-v1/content.md`  
**SHA-256:** `e01e708e2ad64837f5818c09e9d593eacc47f162de5716c5b36a3ca6e8826159`

<details>
<summary>Migrated source text</summary>

``````markdown
## Decision

v1 uses a Beskid `contract Encoder` with `EncodeToBytes` / `DecodeFromBytes` returning `Result`. No lossy decode in v1.
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/foundation-and-primitives/core-encoding/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/core-library/foundation-and-primitives/core-encoding/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `551ebe750eec5624f63eb5c657572a8f6f1632661146c57aa16bbb8c32e5ff5f`

<details>
<summary>Migrated source text</summary>

``````markdown
## Base contract — **ENC-001** … **ENC-009**

| ID | Requirement |
| --- | --- |
| **ENC-001** | Every encoding **must** expose `EncodeToBytes` and `DecodeFromBytes` returning `Result`. |
| **ENC-002** | Error type **must** be `EncodingError` with distinct variants. |
| **ENC-003** | Utf8 **must** be the language-default encoding for `string` boundaries. |
| **ENC-004** | Invalid UTF-8 decode **must** return `InvalidSequence`, not panic (corelib layer). |
| **ENC-005** | Encoders **must not** perform I/O. |
| **ENC-006** | Hex encode **must** use lowercase `a`–`f`. |
| **ENC-007** | Hex decode **must** accept case-insensitive pairs. |
| **ENC-008** | Base64 **must** use RFC 4648 standard alphabet with `=` padding on decode. |
| **ENC-009** | Module tier **must** be `@tier(standard)` for prelude re-export. |

## Per-encoding IDs

| ID | Requirement |
| --- | --- |
| **ENC-UTF8-001** | `EncodeToBytes` copies UTF-8 code units without re-encoding. |
| **ENC-UTF8-002** | `DecodeFromBytes` validates full buffer as UTF-8. |
| **ENC-HEX-001** | Odd-length hex input **must** error. |
| **ENC-B64-001** | Invalid padding or alphabet char **must** error. |

## Implementation anchors

- `compiler/corelib/packages/foundation/src/Core/Encoding/`
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/foundation-and-primitives/core-encoding/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/core-library/foundation-and-primitives/core-encoding/articles/design-model/content.md`  
**SHA-256:** `3e7957906bf8605bd0963000f4afbf3d22b91ea96f5d79675b0760b5a4343be1`

<details>
<summary>Migrated source text</summary>

``````markdown
## Modules

| Module | Role |
| --- | --- |
| `Core.Encoding.EncodingError` | Shared error enum |
| `Core.Encoding.Contract` | `Encoder` contract with encode/decode |
| `Core.Encoding.Utf8` | Language-default UTF-8 |
| `Core.Encoding.Hex` | Hexadecimal |
| `Core.Encoding.Base64` | RFC 4648 standard Base64 |

Utf8 uses `__bytes_from_str` / `__str_from_bytes_utf8` at the runtime boundary. Hex and Base64 are pure Beskid over `Core.Bytes`.
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/foundation-and-primitives/core-encoding/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/core-library/foundation-and-primitives/core-encoding/articles/verification-and-traceability/content.md`  
**SHA-256:** `5a9c4c934b366d143aa881172d3db2699e837630422bac1ed5285da39a29ea54`

<details>
<summary>Migrated source text</summary>

``````markdown
| Requirement | Test anchor |
| --- | --- |
| **ENC-001**, **ENC-UTF8-001** | `CoreSuite.bd#EncodingUtf8Tests` (source fixture; enable target when direct `__bytes_*` JIT resolves) |
| **ENC-HEX-001**, **ENC-B64-001** | `Core.Encoding.Hex` / `Base64` modules + `CoreSuite.bd#EncodingUtf8Tests` hex round-trip |
| **ENC-005** | `System.FS` `ReadAllText` / `WriteAllText` UTF-8 paths |

Harness: `compiler/corelib/beskid_corelib/tests/corelib_tests/src/core/CoreSuite.bd#EncodingUtf8Tests`
``````

</details>
