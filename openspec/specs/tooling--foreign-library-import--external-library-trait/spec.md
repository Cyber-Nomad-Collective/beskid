<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# ExternalLibrary provider trait Specification

## Purpose

Rust tooling trait for resolving Extern Library strings to linker flags (v0.3).

## Requirements

### Requirement: ExternalLibrary provider trait contract
Tooling SHALL expose an `ExternalLibrary` provider that resolves logical `Extern` `Library` names to linker inputs. Each provider MUST return a stable provider id, a host key, `resolve_link_args(logical)` producing linker argument strings or a `LibraryResolveError`, and optional `resolve_search_paths(logical)` search paths.

#### Scenario: Logical name resolves to linker args
- **GIVEN** the `c-posix` provider and logical name `pthread`
- **WHEN** `resolve_link_args` is invoked
- **THEN** the provider returns linker arguments that include `-lpthread` (or the host-equivalent flag set for that logical name)

### Requirement: Closed provider registry for v0.3
The reference CLI MUST ship at least the `c-posix` provider for Linux/macOS tier-1 hosts covering logical names such as `libc`, `libpthread`, `libm`, and paths to `.so` / `.dylib`. Unknown providers and unknown logical names MUST surface as structured `LibraryResolveError` values instead of panics. Future providers MUST implement `ExternalLibrary` without changing Beskid source syntax.

#### Scenario: Unknown provider rejected
- **GIVEN** the default closed provider registry that ships `c-posix` only
- **WHEN** a caller requests provider id `msvc`
- **THEN** resolution fails with a structured `LibraryResolveError` and does not panic

### Requirement: LibraryResolveError diagnostic surface
`LibraryResolveError` MUST surface as CLI diagnostics that include the logical name, provider id, and host key so authors can fix `Project.proj` `link` entries.

#### Scenario: Diagnostic includes provider context
- **GIVEN** a resolve failure for an unknown logical library under `c-posix`
- **WHEN** the CLI reports the error
- **THEN** the diagnostic includes the logical name, provider id, and host key

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
