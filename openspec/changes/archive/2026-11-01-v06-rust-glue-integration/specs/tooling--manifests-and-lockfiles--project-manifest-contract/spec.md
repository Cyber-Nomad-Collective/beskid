## ADDED Requirements

### Requirement: Rust Glue owner declaration in the project manifest
A project manifest SHALL declare each Rust Glue owner library with one top-level `glue "<library>" { backend = rust path = "<directory>" }` block. The label SHALL be the canonical owner native library identity. It SHALL contain 1 to 256 ASCII letters, digits, `_` or `-`, and SHALL be unique among glue blocks. `backend` SHALL be required. The only accepted value in 0.6 SHALL be `rust`, and `dotnet` SHALL be rejected as unavailable. `path` SHALL be required. It SHALL name a project-relative directory confined to the project root after canonicalization.

That directory SHALL contain `implementation.rs` and only regular `.rs` files, within the producer bounds: at most 1024 files, 8 MiB per file and 32 MiB in total. `Cargo.toml`, `Cargo.lock`, `build.rs`, `owner_bridge.rs`, symbolic links and every other file SHALL be rejected, not ignored. The compiler generates the owner Cargo package and lock, and 0.6 SHALL NOT admit third-party crate dependencies.

A glue label SHALL NOT also appear in `link.libraries`. Unknown keys SHALL fail with a stable manifest diagnostic. Tool paths SHALL NOT be manifest keys. A manifest without glue blocks SHALL be unaffected.

#### Scenario: Valid owner declaration lowers to a typed section
- **GIVEN** `glue "glue_manual" { backend = rust path = "rust" }` and a `rust/implementation.rs` file
- **WHEN** the manifest is parsed and validated
- **THEN** the project model exposes one Rust Glue owner with library `glue_manual` and the canonical confined source directory

#### Scenario: Ambiguous or unsupported declarations fail closed
- **GIVEN** a duplicate glue label, an invalid label character, `backend = dotnet`, an unknown key, an escaping `path`, or a label also listed in `link.libraries`
- **WHEN** the manifest is validated
- **THEN** validation fails before resolution, names the block, and produces no Glue build input

#### Scenario: Owner directory content is closed
- **GIVEN** an owner directory that lacks `implementation.rs`, or contains `Cargo.toml`, `build.rs`, a symbolic link, or a non-`.rs` file
- **WHEN** the Glue owner sources are collected
- **THEN** collection fails and names the offending relative path, and no partial source inventory reaches the producer
