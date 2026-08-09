## MODIFIED Requirements

### Requirement: Text file operations: Decision [D-CORE-PRIM-0160]
`Core.FS.ReadAllText(string path)` MUST return `Result<string, FsError>` and
`Core.FS.WriteAllText(string path, string text)` MUST return
`Result<Unit, FsError>`. Both MUST delegate through the canonical ABI-v5
filesystem adapter binding declared by `runtime_manifest.bsol`; neither may
probe the filesystem heuristically, invoke a Rust host dispatcher, or fabricate
an empty string, success payload, or error. An empty file SHALL be a successful
empty string distinct from unavailable output.

#### Scenario: Read an empty file successfully
- **GIVEN** a valid path naming a readable empty regular file
- **WHEN** `Core.FS.ReadAllText` executes
- **THEN** it returns `Result::Ok("")` from an adapter `Ok` status and does not
  infer `NotFound` from the empty content

#### Scenario: Write mutation returns Unit
- **GIVEN** a valid writable path and text
- **WHEN** `Core.FS.WriteAllText` receives adapter status `Ok`
- **THEN** it returns `Result::Ok(Unit)` with no boolean compatibility payload

### Requirement: Existence and deletion: Decision [D-CORE-PRIM-0161]
`Core.FS.Exists(string path)` SHALL return `Result<bool, FsError>` and MUST
preserve the adapter's three public outcomes: status `Ok` becomes `Ok(true)`,
status `NotFound` becomes `Ok(false)`, and every failure status becomes
`Error(FsError)`. `Core.FS.Delete` and `Core.FS.CreateDirectory` MUST return
`Result<Unit, FsError>` and delegate to their canonical adapters. Missing
adapter authority, null output, or an unknown status MUST fail closed and MUST
NOT be represented as `false` or a successful mutation.

#### Scenario: Missing path is successful false
- **GIVEN** a valid path that does not exist
- **WHEN** the canonical `fs_exists` adapter reports `NotFound`
- **THEN** `Core.FS.Exists` returns `Result::Ok(false)`

#### Scenario: Existence adapter failure remains an error
- **GIVEN** a valid path whose metadata cannot be queried because permission is
  denied or the adapter fails
- **WHEN** `Core.FS.Exists` receives the failure status
- **THEN** it returns the corresponding `Result::Error(FsError)` and does not
  collapse the failure to `false`

#### Scenario: Delete mutation returns Unit
- **GIVEN** an existing deletable path
- **WHEN** the canonical delete adapter returns `Ok`
- **THEN** `Core.FS.Delete` returns `Result::Ok(Unit)` and the path is absent

### Requirement: Filesystem error taxonomy and tier: Decision [D-CORE-PRIM-0162]
`Core.FS` and `Core.FS.FsError` MUST remain `@tier(supported)` under the sole
public `Core.*` namespace. `FsError` SHALL distinguish
`InvalidPath(string)`, `NotFound(string)`, `PermissionDenied(string)`,
`IOError(string)`, and `AlreadyExists(string)`; generic `Unknown`, boolean
error payloads, and public OS error numbers MUST NOT substitute for those
variants. Empty paths and adapter `InvalidInput` MUST map to `InvalidPath`.
Unsupported or unrecognized adapter statuses MUST fail closed as `IOError`
with no successful payload.

#### Scenario: Permission denial retains its type
- **GIVEN** a filesystem operation whose canonical adapter reports
  `PermissionDenied`
- **WHEN** Corelib maps the result
- **THEN** it returns `FsError::PermissionDenied(path)` rather than
  `NotFound`, `IOError`, `Unknown`, `false`, or success

#### Scenario: Invalid input is rejected before success
- **GIVEN** an empty path or a path the adapter classifies as invalid input
- **WHEN** a `Core.FS` operation executes
- **THEN** it returns `FsError::InvalidPath(path)` and cannot return a
  successful value

## ADDED Requirements

### Requirement: Manifest-owned filesystem status and target bindings
`runtime_manifest.bsol` SHALL own the `BeskidFsStatus` values `Ok = 0`,
`NotFound = 1`, `PermissionDenied = 2`, `IOError = 3`, `InvalidInput = 4`, and
`AlreadyExists = 5`. It SHALL declare `fs_read_text(path, text_out) -> i32`,
`fs_write_text(path, text) -> i32`, `fs_exists(path) -> i32`,
`fs_mkdir(path) -> i32`, and `fs_delete(path) -> i32` as canonical-runtime-only
intrinsics with exact ABI-v5 symbols and `runtime.adapter.*` capabilities.
Each intrinsic MUST have exactly one explicit binding for
`x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, and
`x86_64-pc-windows-msvc`; each binding MUST name its implementation and ordered
allowed OS imports. The read adapter MUST write a runtime-owned string pointer
only on `Ok`, and that pointer MUST distinguish valid empty text from no output.

#### Scenario: Three-target binding completeness
- **GIVEN** the ABI-v5 runtime manifest
- **WHEN** filesystem adapter bindings are validated
- **THEN** every filesystem intrinsic has one signature-matched binding for
  each supported target and any missing, duplicate, orphaned, or unavailable
  binding fails before link or load with intrinsic, capability, and target

#### Scenario: Read failure does not publish output
- **GIVEN** a read adapter call whose normalized status is not `Ok`
- **WHEN** the target adapter returns to the canonical runtime
- **THEN** `text_out` is not treated as initialized and Corelib receives the
  corresponding typed error rather than an empty or fabricated string

### Requirement: Canonical runtime exclusively owns filesystem authority
Only the compiler-embedded canonical runtime corpus SHALL invoke filesystem
adapter intrinsics or their selected OS imports. Corelib and application source
MUST NOT declare or invoke those intrinsics, copy a canonical runtime path to
acquire authority, call target OS imports, or fall back to Rust host dispatch,
generated dispatch tags, extern declarations, process-global tables, source
tree libraries, or fabricated results. Runtime-kit validation MUST reject any
such alternate provenance.

#### Scenario: Corelib cannot invoke a target adapter directly
- **GIVEN** Corelib or application source declaring `fs_exists` or its ABI-v5
  intrinsic symbol spelling
- **WHEN** trusted-runtime capability validation runs
- **THEN** compilation fails before ISLE lowering and emits neither the
  intrinsic nor a target OS import

#### Scenario: Stub or fallback provenance fails release validation
- **GIVEN** a runtime or linked application artifact containing a Rust FS host,
  dispatch route, extern fallback, or canonical wrapper that returns a
  constant success/null/false without its selected adapter call
- **WHEN** runtime-kit provenance and wrapper-shape audits run
- **THEN** the candidate fails before packaging and identifies the offending
  artifact and filesystem operation
