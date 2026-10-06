## ADDED Requirements

### Requirement: Complete 0.6 native acceptance matrix
An implementation claiming beskid 0.6.0 release qualification SHALL execute every mandatory case in a frozen requirement-to-case manifest on Linux x64, macOS arm64 and Windows x64. The manifest SHALL cover everyday CLI and transactional dependency journeys; generated generic serialization and its format independence; checked dynamic casts, fresh mapping and forced-GC retention; native Beskid BSOL syntax, writer, schema profiles, controlled imports, references, constraints, structural migration and typed mapping; and manual plus generated bidirectional Rust Glue primitive, ownership, subprocess and stdio lifecycle behavior. It SHALL include positive, negative and boundary cases, with analysis fixtures, documentation examples and native executable evidence appropriate to each obligation. Native generator materialization, missing primitive support and process/pipe prerequisites SHALL be tested through real production paths. Existing required foundations, networking and HTTP regression cases SHALL remain required. .NET Glue SHALL be classified separately as stretch.

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
