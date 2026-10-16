## MODIFIED Requirements

### Requirement: Pinned registry artifacts
When a valid v2 lock exists, ordinary and strict resolution SHALL select its exact pinned registry version and verify the downloaded archive's SHA-256 against `artifact_digest` before extraction. An unavailable pinned version or a digest mismatch SHALL fail without selecting a newer version or extracting the artifact. Selected `beskid update <package>` or explicit `beskid update --all` SHALL refresh only eligible scoped coordinates and necessary transitives, preserving unrelated valid pins. Exact declared intent SHALL change only with selected `--version`; a permitted new coordinate SHALL record its exact version and digest. The compiler SHALL stream each compressed registry archive through auto-cleaned scratch storage while hashing, and SHALL reject an archive larger than 64 MiB (67,108,864 bytes) before extraction or project preparation output, regardless of pin or unresolved-warning policy. The compiler SHALL fully validate and stage an archive before changing its materialized package directory, SHALL reject conflicting or unsafe ZIP entries, and SHALL enforce both a 512 MiB (536,870,912 byte) per-entry and 1 GiB (1,073,741,824 byte) total uncompressed output limit during extraction. Digest-derived registry materialization directories SHALL be immutable: a newly staged package MAY be renamed into an absent destination, but an existing destination SHALL be reused only after byte-for-byte and path/type-for-path validation against the staged package, without mutation; mismatches SHALL fail closed. A rejected archive SHALL leave the prior materialized package unchanged and remove its scratch data. Path dependencies SHALL remain live sources: their contents MAY change without a lock change, while their manifest-derived identity and relative location remain checked.

The compiler SHALL treat exact duplicate raw ZIP names and Unicode-normalized, full-case-folded aliases for the same ZIP path as conflicts on every supported host, regardless of that host's case sensitivity. Every raw ZIP entry name SHALL be valid UTF-8; non-ASCII names SHALL carry the ZIP UTF-8 flag, Unicode Path override fields SHALL be rejected, and each local-header name SHALL match its central-directory name. This canonical-name profile prevents a ZIP library from coalescing distinct raw records under one decoded name before validation. The compiler SHALL reject ZIP path components that are non-portable on Windows, including reserved device names and trailing dots or spaces. Directory entries SHALL contain no payload and SHALL pass integrity validation rather than being skipped during full-archive checks. Before building path-prefix indexes or writing output, it SHALL reject archives with more than 10,000 raw central-directory entries (counting duplicate names), an entry name longer than 4,096 UTF-8 bytes, or more than 256 path components in one name. ZIP64 archives SHALL be rejected in v0.6, including ZIP64 entry metadata rather than only ZIP64 end-of-directory markers. Multidisk metadata SHALL be rejected both at the end-of-directory record and in each central-directory entry. The compiler SHALL require one unambiguous end-of-central-directory record anchored at the archive end, with the declared central-directory range immediately preceding that record. It SHALL walk the entire declared central-directory range, count its raw file records before ZIP-library name coalescing, and require the walked count and consumed range to match the record's declarations; ambiguous, truncated, or forged count/range metadata SHALL fail closed. The cumulative UTF-8 bytes retained for planned path-prefix keys SHALL not exceed 64 MiB (67,108,864 bytes). These preflight budgets SHALL apply independently of the compressed and uncompressed output limits.

The registry dependency's `source_root` SHALL be derived from the ZIP's exact top-level path spelling, not from host filesystem case-insensitive lookup: a literal directory `src` selects `src`, otherwise a literal `Src` selects `Src`, and otherwise the package root selects `.`. Preflight and post-extraction derivation SHALL agree so the same pinned archive produces identical lock bytes across supported hosts.

#### Scenario: Newer registry version exists
- **GIVEN** a valid v2 registry pin and a newer available version
- **WHEN** ordinary or strict resolution prepares the dependency
- **THEN** it requests the exact pinned version and retains its digest identity

#### Scenario: Pinned artifact is unavailable or changed
- **GIVEN** a pinned version is missing or its downloaded bytes have another SHA-256 digest
- **WHEN** the compiler prepares the dependency
- **THEN** it fails before extraction and does not fall back to another version

#### Scenario: Registry artifact exceeds the compressed-size limit
- **GIVEN** a registry response whose compressed archive exceeds 67,108,864 bytes
- **WHEN** the compiler prepares it, with or without a lock pin
- **THEN** it rejects the archive before extraction or project preparation output and removes its scratch data

#### Scenario: Registry archive conflicts or expands beyond the output budget
- **GIVEN** a registry ZIP with conflicting entry paths, a corrupt late entry, or uncompressed output above either limit
- **WHEN** the compiler prepares the dependency
- **THEN** it rejects the archive without changing the prior materialized package or Project.lock and removes staged output

#### Scenario: Case-aliased paths or directory payload
- **GIVEN** a registry ZIP with Unicode-normalized full-case-fold aliases for one materialized path, a non-portable Windows path component, or a directory entry containing payload or failing integrity validation
- **WHEN** the compiler prepares the dependency on any supported host
- **THEN** it rejects the archive before publishing a package, independent of host case sensitivity

#### Scenario: Exact duplicate ZIP names are hidden by the parser
- **GIVEN** a registry ZIP with two raw central-directory entries whose names are byte-for-byte identical
- **WHEN** the compiler preflights the archive
- **THEN** it rejects the archive before the ZIP library can coalesce those entries by name

#### Scenario: Different raw names decode to one ZIP path
- **GIVEN** a registry ZIP with invalid UTF-8 names, unflagged non-ASCII names, a Unicode Path override, or a local-header name that differs from its central-directory name
- **WHEN** the compiler preflights the archive
- **THEN** it rejects the archive before a ZIP library can coalesce or reinterpret an entry name

#### Scenario: Tiny ZIP with excessive path-index work
- **GIVEN** a registry ZIP below the compressed and uncompressed byte limits but with too many raw entries (including duplicate names), a ZIP64 entry-count marker, an overlong or overdeep entry path, or planned path-prefix keys beyond the cumulative budget
- **WHEN** the compiler preflights its entries
- **THEN** it rejects the archive before allocating an unbounded path index or changing the prior package or Project.lock

#### Scenario: Ambiguous or forged ZIP directory count
- **GIVEN** a registry ZIP with an alternate end-of-central-directory record in its comment, or a declared central-directory count or range that differs from its raw records
- **WHEN** the compiler preflights the archive
- **THEN** it rejects the archive before extraction or changing Project.lock, even if a ZIP library would accept a different directory interpretation

#### Scenario: Entry-level ZIP64 or multidisk metadata
- **GIVEN** a registry ZIP with an ordinary end-of-directory record but a ZIP64 entry field or a nonzero central-directory entry disk number
- **WHEN** the compiler preflights the archive
- **THEN** it rejects the archive before extraction or changing Project.lock, regardless of whether a ZIP library accepts the entry

#### Scenario: Registry source directory uses another case
- **GIVEN** a pinned registry ZIP with a top-level directory spelled `SRC` rather than literal `src` or `Src`
- **WHEN** Linux, macOS, or Windows prepares the dependency
- **THEN** each host records `source_root=.` and neither preflight nor lock generation infers a different spelling from its filesystem

#### Scenario: Existing materialization differs from the pinned artifact
- **GIVEN** a valid pinned archive and an existing digest-derived package directory with changed bytes, extra paths, or unsafe file types
- **WHEN** the compiler prepares the dependency
- **THEN** it reports the tampered materialization without overwriting or deleting that directory

## ADDED Requirements

### Requirement: Independent lock and network policies
Ordinary check/build/run/test/doc SHALL preserve valid eligible registry pins. Locked SHALL reject missing or drifted locks and forbid lock writes but MAY access network for exact pinned artifacts. Offline SHALL forbid every network request and require verified cached pinned artifact bytes; absent or tampered cache SHALL fail before executable preparation. Frozen SHALL combine locked and offline. These meanings SHALL apply uniformly through shared resolution, including dependency commands; incompatible mutation under locked SHALL fail rather than silently ignore the policy.

#### Scenario: DEP06-04 Locked network
- **GIVEN** valid lock and cold cache with registry available
- **WHEN** build --locked runs
- **THEN** it may fetch the exact digest-verified pin without modifying lock

#### Scenario: DEP06-04 Offline warm and cold
- **GIVEN** valid lock and warm verified cache, then cold or tampered cache
- **WHEN** build --offline runs
- **THEN** warm verified materialization succeeds without requests; cold/tampered fails with zero requests

#### Scenario: DEP06-04 Frozen drift
- **GIVEN** missing or stale lock and registry available
- **WHEN** build --frozen runs
- **THEN** it fails without requests or lock writes


#### Scenario: Offline documentation preparation shares the resolver policy
- **GIVEN** a project has an uncached registry dependency
- **WHEN** doc --offline prepares its project graph
- **THEN** it fails with an offline-cache diagnostic before any network request, materialized workspace, lockfile write or documentation output
