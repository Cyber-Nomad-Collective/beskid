<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# ExternalLibrary provider trait Specification

## Purpose

Rust tooling trait for resolving Extern Library strings to linker flags (v0.3).

## Requirements

### Requirement: ExternalLibrary provider trait conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-1E3B654FE3E0`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: ExternalLibrary provider trait

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/foreign-library-import/external-library-trait/`  
**Source:** `site/spec-content/platform-spec/tooling/foreign-library-import/external-library-trait/content.md`  
**SHA-256:** `3dffc01562ff85b66ca730e98d7da9ffbd740930de0052155a83cf099345d26b`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

`Extern` contracts carry a logical **`Library`** name (for example `"libc"`, `"pthread"`). Linkers need concrete **flags** (`-lc`, `-lpthread`, framework paths). The **`ExternalLibrary`** trait abstracts that mapping so the CLI can support multiple providers over time.

## Trait contract (normative Rust shape)

```rust
/// Resolves a logical library name from Beskid `Extern` metadata to linker inputs.
pub trait ExternalLibrary: Send + Sync {
    /// Stable provider id (for example `"c-posix"`, `"msvc"` Proposed).
    fn id(&self) -> &'static str;

    /// Target triple or host key this provider supports.
    fn host_key(&self) -> &str;

    /// Map logical name to linker arguments (for example `["-lc"]`).
    fn resolve_link_args(&self, logical: &str) -> Result<Vec<String>, LibraryResolveError>;

    /// Optional: search paths to pass the linker when the logical name is a path.
    fn resolve_search_paths(&self, logical: &str) -> Vec<std::path::PathBuf>;
}
```

## Provider registry (v0.3)

The reference CLI **must** ship at least one provider:

| Provider id | Host | Logical names |
| --- | --- | --- |
| **`c-posix`** | Linux / macOS tier-1 | `libc`, `libpthread`, `libm`, paths to `.so` / `.dylib` |

**`msvc` / WinAPI** providers are **Proposed** and **out of scope** for stdlib Standard ([platform tier matrix](/platform-spec/language-meta/interop/c-abi-profile/platform-tier-matrix/)).

## Extension

Future providers (Rust `rlib`, Swift, etc.) **must** implement **`ExternalLibrary`** without changing Beskid source syntax—only manifest/link metadata and CLI selection.

## Errors

`LibraryResolveError` **must** surface as CLI diagnostics with the logical name, provider id, and host key so authors can fix `Project.proj` `link` entries.

## Verification anchors

- **Trait + closed registry implementation:** `compiler/crates/beskid_analysis/src/external_library/` (`trait_def.rs`, `providers.rs`, `registry.rs`).
- **Closed provider list:** `compiler/crates/beskid_analysis/src/external_library/registry.rs::default_registry` ships `c-posix` (+ `posix` alias) only; per ADR `D-TOOL-FLI-0002`.
- **C / POSIX mapping table:** `compiler/crates/beskid_analysis/src/external_library/providers.rs::C_POSIX_LOGICAL_NAMES` (e.g. `c -> -lc`, `m -> -lm`, `pthread -> -lpthread`); canonicalization strips `lib` prefix and `.so`/`.dylib`/`.a` suffixes.
- **Tests:** `external_library::providers::tests` and `external_library::registry::tests` (in-tree unit tests). End-to-end coverage in `compiler/crates/beskid_tests/src/cli/import_lib.rs`.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>
