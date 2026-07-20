## ADDED Requirements

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

## REMOVED Requirements

### Requirement: ExternalLibrary provider trait conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
