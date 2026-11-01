## ADDED Requirements

### Requirement: Rust Glue build selection
`beskid build --backend glue-rust` SHALL build the selected Lib target as a shared Glue consumer image through the compiler-owned `beskid_aot` prepared Glue route. It SHALL also build one Rust owner image for each manifest glue block that a selected Extern import or `GlueHandle` type references. Runtime linkage SHALL be the shared Glue provider (`GlueSharedProviderV1`).

The consumer native library identity SHALL be the selected target name. Each owner identity SHALL be its glue label, and the two SHALL differ. The consumer image SHALL be written to `--output` or to the default target output name. Each owner image SHALL be written beside it with the platform shared-library name of its label. `--release` and `--target-triple` SHALL apply to both images.

Outputs SHALL be produced in a fresh staging directory and published only after every image has been admitted. A failure SHALL leave the previous outputs unchanged. A rebuild SHALL replace both images atomically, not fail because an output already exists.

The CLI SHALL reject each of these cases before any external tool runs:
- `glue-rust` for a project without a referenced glue block;
- a glue block that no selected binding references;
- a manifest with glue blocks built with the default `clif` backend;
- an App or Test target, or a `--kind` other than shared;
- `glue-dotnet`, which SHALL report the backend as unavailable in 0.6.

The obsolete 0.4/0.5 "declared but not implemented" diagnostic SHALL be removed.

#### Scenario: Owned fixture builds through the CLI alone
- **GIVEN** the manual owned Glue fixture with a `glue "glue_manual"` block and explicit Rust tools
- **WHEN** `beskid build --backend glue-rust` runs for its Lib target
- **THEN** it emits an admitted consumer image and an admitted `glue_manual` owner image whose loaded calls match the manual results, without test code constructing owner type or callable mappings

#### Scenario: Backend and project shape mismatches fail closed
- **GIVEN** `--backend glue-rust` on a project without glue blocks, a glue project built with `clif`, an App target, or `--backend glue-dotnet`
- **WHEN** `beskid build` runs
- **THEN** it exits non-zero with an actionable diagnostic before starting Cargo, rustc or the linker, and writes no output

#### Scenario: Failed rebuild preserves prior outputs
- **GIVEN** previously published consumer and owner images and an owner source that no longer compiles
- **WHEN** `beskid build --backend glue-rust` runs again
- **THEN** the build fails, the previous images remain byte-identical, and no staging directory remains as an output

### Requirement: Published Rust Glue image admission
Each Glue producer SHALL compile an immutable admission record into its image before the link: the consumer through a generated object, and each Rust owner through its generated bridge crate. The record SHALL be an exported read-only data symbol (`beskid_glue_artifact_v1_admission_record` or `beskid_glue_rust_owner_v1_admission_record`). It SHALL hold the producer, source, tool and provider evidence that loader initialization needs. A producer SHALL NOT modify a linked image, because that invalidates platform code signatures. Each producer SHALL read the record back from its linked image and fail if it differs from the issued record.

The consumer record SHALL pin the exact SHA-256 of every Rust owner image that the build produced for a referenced library. `beskid build --backend glue-rust` SHALL print the SHA-256 of each published image.

`beskid_aot::api::glue::admit_published_glue_images` SHALL admit published images only with a consumer digest that the host supplies. The host SHALL receive that digest through a channel it trusts. No file beside the outputs SHALL grant admission. Before any image code runs, the loader SHALL read every record from the file bytes and fail closed in each of these cases:
- the consumer bytes differ from the supplied digest;
- a record is absent, ambiguous, not canonically encoded, or from another compiler version;
- the target, runtime ABI or provider differs from the validated installed kit provider;
- the consumer record does not pin exactly one owner for each referenced library;
- a supplied owner image is not pinned, is supplied twice, or one pinned owner is missing;
- an owner record names another library, source generation or provider;
- an owner record names a compiler driver whose digest differs from the driver under the installed prefix;
- a required export is absent.

Admission SHALL then use the same process initialization as the in-process producer route.

#### Scenario: Published images match the manual results
- **GIVEN** the consumer and owner images that `beskid build --backend glue-rust` published for the manual owned fixture, and the consumer digest that the build printed
- **WHEN** the host admits them through the installed kit with that digest
- **THEN** the loaded calls match the manual results of the in-process producer route

#### Scenario: Substituted published images fail closed
- **GIVEN** a consumer image with one code byte changed, an owner image with one code byte changed, an owner image from another build of the same library, or a correctly pinned consumer from another build with the first build's owner
- **WHEN** the host requests admission
- **THEN** admission fails before any image is loaded, and the unchanged images still admit

#### Scenario: Owner set must equal the pinned set
- **GIVEN** a published consumer that pins one owner image
- **WHEN** the host supplies no owner image, or the same owner image twice
- **THEN** admission fails closed

### Requirement: Explicit Rust Glue tool selection
A `glue-rust` build SHALL take tools only from command-line flags. The flags are `--rust-toolchain <prefix>`, which resolves `<prefix>/bin/cargo` and `<prefix>/bin/rustc` with the platform executable suffix, or `--cargo <path>` and `--rustc <path>` together; these two forms SHALL be mutually exclusive. `--linker <path>` SHALL also be required.

The CLI SHALL NOT select tools from `CARGO`, `RUSTC`, `PATH`, Cargo configuration or rustup defaults. Each selected tool SHALL pass the bounded probe and executable identity recheck defined for Glue tool validation. The flags SHALL be rejected for `clif` builds. Machine-local tool paths SHALL NOT enter the portable artifact identity.

#### Scenario: Missing or conflicting tool flags
- **GIVEN** a glue-rust build with no Rust tool flags, `--rust-toolchain` together with `--cargo`, only one of `--cargo` and `--rustc`, or no `--linker`
- **WHEN** `beskid build` runs
- **THEN** it fails before the probe and names the required flag form

#### Scenario: Ambient tool variables do not select tools
- **GIVEN** inherited `CARGO`, `RUSTC` and `PATH` values that point at different executables
- **WHEN** a glue-rust build runs with explicit flags
- **THEN** only the flagged executables are probed, receipted and invoked
