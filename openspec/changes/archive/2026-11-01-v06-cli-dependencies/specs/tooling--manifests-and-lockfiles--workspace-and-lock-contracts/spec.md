## MODIFIED Requirements

### Requirement: Explicit lock migration and strict read-only policy
`beskid dev project lock` and explicitly scoped `beskid update <package>` or `beskid update --all` SHALL be the only commands authorized to replace an existing v1 lock with v2, and SHALL derive the replacement from the current manifest graph rather than stale v1 absolute paths. Other consumers, including `build`, `run`, `test`, and LSP replay, SHALL reject a present v1 lock with an actionable migration diagnostic. Unknown headers and malformed v2 locks SHALL fail. A valid but stale v2 lock SHALL not be silently repaired by a non-update consumer. `--locked` and `--frozen` SHALL never write or rewrite a lock, even when a valid v2 lock is present; they SHALL reject missing, v1, or stale locks before writing any preparation output. When no lock exists, a normal unlocked build MAY create a v2 lock from the current graph. Only CLI lock mutation commands SHALL change an existing lock.

Required declared registry dependencies SHALL fail ordinary and strict application preparation when unavailable; warning-only omission SHALL NOT authorize successful add/build/run/test/check. Existing incomplete v2 locks SHALL remain unchanged until an explicit canonical lock mutation resolves missing pins. A declared registry package without a pin SHALL fail strict preparation before materialization. Add/remove transactional commands SHALL update valid v2 locks; they SHALL reject v1 with migration guidance rather than implicitly migrating it.

#### Scenario: Explicit v1 migration
- **GIVEN** a v1 lock whose absolute paths refer to an old checkout
- **WHEN** `beskid dev project lock` or explicitly scoped `beskid update <package>` or `beskid update --all` runs against the current manifests
- **THEN** it writes v2 using the newly resolved graph, without inferring paths from v1

#### Scenario: Non-update consumer sees v1 or stale v2
- **GIVEN** a present v1 lock or a v2 lock that no longer matches the current graph
- **WHEN** `build`, `run`, `test`, or LSP consumes it
- **THEN** the consumer reports migration or staleness and does not rewrite the lock

#### Scenario: Strict command rejects a missing or invalid lock
- **GIVEN** `--locked` or `--frozen` and a missing, v1, or stale lock
- **WHEN** the command starts project preparation
- **THEN** it fails before creating preparation output or changing lock bytes

#### Scenario: Strict command accepts a valid v2 lock without writing it
- **GIVEN** `--locked` or `--frozen` and a valid v2 lock matching the current graph
- **WHEN** the command resolves and prepares the project
- **THEN** it may use the locked graph but leaves the lock bytes and file metadata unchanged

#### Scenario: Unavailable unpinned registry remains warning-only on retry
- **GIVEN** a required registry package has no pin and remains unavailable
- **WHEN** ordinary application preparation retries
- **THEN** it fails before executable preparation and preserves existing lock bytes rather than retaining warning-only success

#### Scenario: Previously unavailable package becomes available
- **GIVEN** a declared registry package has no pin in an existing v2 lock
- **WHEN** ordinary preparation can resolve the package
- **THEN** it requires explicit scoped `beskid update <package>` or `beskid update --all` before materializing that package or changing the lock

#### Scenario: Strict preparation requires a registry pin
- **GIVEN** a declared registry package has no pin in an existing v2 lock
- **WHEN** `--locked` or `--frozen` starts preparation
- **THEN** it fails before materializing the package or changing the lock

The v1 descriptions retained below are historical informative provenance. They do not define a currently accepted lock format.

## ADDED Requirements

### Requirement: Recoverable dependency pair transactions
Recovery journals and private staging SHALL be created with access restricted to the current owner before writing their contents. Replacement and rollback SHALL preserve the original manifest and lock security state, including owner and discretionary access controls on Windows. Concurrent-change detection SHALL use platform file identity as well as contents and reject reparse or symlink substitution. Native qualification SHALL cover ordinary non-administrator execution, interruption recovery and the durability claims made by the supported filesystem publication path.

Add/remove/update SHALL plan intent, strict resolution, verified materialization and replacement Project.lock before exposing success. A failure before completed commit SHALL restore original manifest/lock bytes and original missing-file state. Commit SHALL use durable recoverable state before its first visible replacement; interrupted commit SHALL recover before subsequent project reads. Concurrent external edits SHALL be detected and preserved rather than overwritten. Success SHALL require a coherent manifest/lock/materialization result. Dry-run SHALL report the same planned effects without visible project writes; private cache staging MAY survive but SHALL NOT imply committed project success.

#### Scenario: Windows security state survives replacement and recovery
- **GIVEN** a manifest and lock with explicit owner and discretionary access controls
- **WHEN** a dependency command commits or recovers an interrupted pair replacement under a non-administrator account
- **THEN** the coherent recovered pair preserves that security state and private journal contents were never exposed through inherited public access

#### Scenario: DEP06-05 Resolution rollback
- **GIVEN** original manifest and lock
- **WHEN** resolution/download/hash or staging fails during add
- **THEN** the operation exits nonzero with original pair unchanged

#### Scenario: DEP06-05 Replacement rollback
- **GIVEN** a planned pair transaction
- **WHEN** second replacement or sync fails after first replacement
- **THEN** original pair and missing-file state are restored or terminal recovery guidance is reported without success

#### Scenario: DEP06-05 Interrupted recovery
- **GIVEN** process death after first replacement
- **WHEN** the next project command begins
- **THEN** it recovers original pair before any resolution or compilation read

#### Scenario: DEP06-05 Concurrent preservation
- **GIVEN** a transaction planned against original bytes
- **WHEN** another actor edits the manifest before commit
- **THEN** commit fails without overwriting that external edit

### Requirement: Explicit conservative update and removal
Update SHALL require package or --all, reject their combination, and show guidance with status 2 when scope is absent. Selected refresh SHALL change only selected eligible closure and necessary transitives, preserving unrelated pins. Exact declared intent SHALL change only through selected update --version; --all SHALL NOT rewrite exact intent. Remove SHALL delete direct intent and recompute reachability retaining shared transitives. Update --dry-run SHALL report deterministic old/new coordinates and manifest/lock effects without visible writes.

#### Scenario: DEP06-03 Scope and exact intent
- **GIVEN** two exact dependencies and shared transitives
- **WHEN** selected update or update --all runs without version
- **THEN** exact intentions and unrelated valid pins remain unchanged

#### Scenario: DEP06-03 Explicit version
- **GIVEN** an exact dependency
- **WHEN** update package --version chooses a valid different version
- **THEN** only selected intent and necessary reachable lock closure change transactionally

#### Scenario: DEP06-03 Shared removal
- **GIVEN** two direct packages share a transitive
- **WHEN** one direct dependency is removed
- **THEN** remaining reachable transitive stays locked

#### Scenario: DEP06-03 Dry-run
- **GIVEN** a proposed selected upgrade
- **WHEN** update --version runs with --dry-run
- **THEN** effects are reported and manifest/lock/materialized project bytes remain unchanged
