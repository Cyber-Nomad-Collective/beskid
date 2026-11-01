## ADDED Requirements

### Requirement: Complete 0.6 native acceptance matrix
An implementation claiming beskid 0.6.0 release qualification SHALL execute every mandatory case in a frozen requirement-to-case manifest on Linux x64, macOS arm64 and Windows x64. The manifest SHALL cover everyday CLI and transactional dependency journeys; generated generic serialization and its format independence; checked dynamic casts, fresh mapping and forced-GC retention; native Beskid BSOL syntax, writer, schema profiles, controlled imports, references, constraints, structural migration and typed mapping; and manual plus generated bidirectional Rust Glue primitive, ownership and subprocess lifecycle behavior. The stdio bridge is provisional for 0.6 (`v06-glue-stdio-bridge-provisional`): its cases SHALL be listed as provisional in the manifest, SHALL never be required and SHALL be rejected if any evidence row names them. It SHALL include positive, negative and boundary cases, with analysis fixtures, documentation examples and native executable evidence appropriate to each obligation. Native generator materialization, missing primitive support and process/pipe prerequisites SHALL be tested through real production paths. Existing required foundations, networking and HTTP regression cases SHALL remain required. .NET Glue SHALL be classified separately as stretch.

#### Scenario: A scalar-only Glue success is insufficient
- **GIVEN** integer import generation passes but required export, floating-point, string, ownership or lifecycle cases are absent
- **WHEN** the 0.6 candidate is aggregated
- **THEN** qualification fails with the missing mandatory case identities

#### Scenario: BSOL is implemented by native corelib
- **GIVEN** the candidate contains a native Beskid BSOL implementation and the shared positive and negative corpus
- **WHEN** installed consumers execute syntax, schema and typed round trips on each required target
- **THEN** results and normalized diagnostics match the corpus and dependency inspection proves those APIs do not forward parsing or schema evaluation to the Rust BSOL implementation

#### Scenario: Existing behavior remains protected
- **GIVEN** a candidate supplies all new feature cases but omits a previously required foundations, networking or HTTP case
- **WHEN** the acceptance reader validates the matrix
- **THEN** the candidate is rejected rather than qualifying on the new features alone

### Requirement: Source-bound complete case evidence
Every mandatory release case SHALL retain its case and requirement identities, target, exact consumed source revisions, command/harness identity, tools, input digests, artifact and runtime-kit digests, bounded output digests, exit status and execution result. Readers SHALL verify the retained evidence against its declared sources and immutable candidate artifacts. Missing, duplicate, skipped, filtered-out, timed-out, malformed, source-mismatched or nonexecuted mandatory cells SHALL fail qualification. A passing command without proof that its required assertions executed SHALL NOT qualify a case. Installed-consumer cases SHALL use the candidate's complete installed prefix and package paths rather than source-tree or developer-kit fallback discovery.

#### Scenario: Stale evidence cannot qualify new bytes
- **GIVEN** a passing case consumes a different compiler, corelib, harness or artifact than the declared candidate
- **WHEN** the release reader checks evidence
- **THEN** it rejects that case and reports the mismatched consumed identity

#### Scenario: A harness exits without executing required cases
- **GIVEN** a test command exits successfully but filters out a mandatory case or reports it skipped
- **WHEN** evidence is validated
- **THEN** qualification fails for that case regardless of the process exit status

#### Scenario: Installed discovery is exact
- **GIVEN** a packaged candidate has a missing or mismatched runtime kit and a valid development kit is also available
- **WHEN** the installed-consumer journey executes
- **THEN** it fails closed without using the development kit to qualify the package

### Requirement: Execution kinds derive outcomes from retained raw output
The frozen manifest SHALL give every mandatory case exactly one execution kind. `installed_native` SHALL run one `beskid test --json` target of the bundled Corelib test workspace through the installed candidate CLI; the retained stdout SHALL be the raw JSON report, the reader SHALL derive executed outcomes from that report, every test of the target SHALL pass, and the required assertion ids SHALL be a subset of the passed tests. `installed_host_harness` SHALL run a reviewed Rust libtest executable built from the same compiler commit, one `--exact` process per required id, with the installed prefix named by `BESKID_V06_QUALIFIED_PREFIX`; the retained stdout and stderr SHALL be the raw libtest streams in per-test sections, and every installed CLI invocation SHALL write `beskid-installed-invocation sha256=<digest> argv0=<name>` to stderr, where the digest is the installed CLI's bytes. A harness test without that proof SHALL be recorded as not executed. Readers SHALL never trust a producer-authored outcome list, SHALL verify command templates against the installed prefix and the retained harness executable, SHALL require the frozen manifest in canonical bytes, and SHALL treat library-level tests that never touch the installed prefix as related evidence only.

#### Scenario: Filtered row cannot hide a failing target
- **GIVEN** a native cell whose raw report contains one failed non-required test and a row listing only passing required ids
- **WHEN** the reader validates the cell
- **THEN** it rejects the cell from the raw report regardless of the row

#### Scenario: Harness without installed invocation proof
- **GIVEN** a host cell whose retained stderr section carries no `beskid-installed-invocation` line or a line with a digest other than the installed CLI
- **WHEN** the reader validates the cell
- **THEN** the assertion is nonexecuted and qualification fails

#### Scenario: Provisional case cannot enter evidence
- **GIVEN** a feature row, profile row or obligation row naming a provisional case id
- **WHEN** the reader validates the packet
- **THEN** it rejects the packet
