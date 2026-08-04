<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Args Specification

## Purpose

Core.Args provides read-only access to the process command-line argument vector.

## Requirements

### Requirement: Argument collection and count: Decision [D-CORE-PRIM-0120]
Exactly and exclusively `__args_count() -> i64` and `__args_get(i64) -> string` SHALL be the only private Core.Args services. `Count() -> i64` SHALL obtain the
number of entries only through `__args_count() -> i64`. `All() -> string[]` SHALL enumerate
every index in `0..Count()` through `__args_get(i64) -> string` in ascending
order. `__args_all` SHALL NOT be an ABI service, generated adapter, raw import,
or compatibility fallback.

**Stable ID:** `BSP-REQ-0000000000000120`

#### Scenario: All enumerates the selected count/get services
- **GIVEN** a process vector with three ordered entries
- **WHEN** `Core.Args.All()` is evaluated
- **THEN** it returns the three entries in order after using `__args_count` and `__args_get` for indices `0`, `1`, and `2`

#### Scenario: The retired bulk service is unavailable
- **GIVEN** an ABI-v5 runtime manifest or generated adapter declaration
- **WHEN** it declares, imports, or resolves `__args_all`
- **THEN** validation fails without a compatibility route

### Requirement: Optional indexed access and errors: Decision [D-CORE-PRIM-0121]
`Get(i64 index) -> Option<string>` SHALL return the value at a valid index and
`None` when `index < 0` or `index >= Count()`. It SHALL NOT call
`__args_get(i64) -> string` outside `0..Count()`. The private service SHALL
report the stable bounds failure `Core.Args argument index is out of range` if
called outside that interval; `Core.Args.ArgsError` MUST define
`IndexOutOfRange(i64)` for APIs or callers that require an explicit indexing
error.

**Stable ID:** `BSP-REQ-0000000000000121`

#### Scenario: Public indexed access rejects an out-of-range index
- **GIVEN** a process vector with one entry
- **WHEN** `Core.Args.Get(-1)` or `Core.Args.Get(1)` is evaluated
- **THEN** it returns `None` without calling `__args_get`

#### Scenario: Direct invalid private access reports stable bounds failure
- **GIVEN** the canonical Args adapter has a count of one
- **WHEN** its generated `__args_get(-1)` or `__args_get(1)` binding is invoked
- **THEN** it fails with `Core.Args argument index is out of range`

### Requirement: Private Core.Args ABI-v5 source authority
Only byte-identical `Core/Args/Args.bd` at its canonical physical Foundation source path SHALL receive the only private Corelib imports
`__args_count() -> i64` and `__args_get(i64) -> string`. No other private Core.Args
service SHALL exist. The services SHALL be
manifest-owned ABI-v5 adapters and SHALL NOT be user-callable intrinsics,
ISLE special cases, JIT host registrations, Rust runtime routes, or ambient
globals. A copied, symlinked, altered, or user-authored source SHALL receive no
Args ABI import and code generation SHALL fail without an ABI or runtime
fallback.

**Stable ID:** `BSP-REQ-FAEDA7C0AF60`

#### Scenario: Non-canonical source has no Args ABI import
- **GIVEN** a copied, symlinked, altered, or user-authored source that spells `__args_count`
- **WHEN** code generation resolves its runtime services
- **THEN** code generation fails without an Args ABI import or runtime fallback

### Requirement: Managed argument values and bounds
For every valid index in `0..__args_count()`, `__args_get(i64) -> string` SHALL
return a managed UTF-8 string whose lifetime and contents are independent of
native scratch storage and of later service calls. `Core.Args.Get` and every
element retained by `Core.Args.All` SHALL therefore remain independently
retained after the native adapter returns.

**Stable ID:** `BSP-REQ-E4C6501C2F83`

#### Scenario: All retains independently managed values
- **GIVEN** a native adapter whose temporary storage is reused after each argument lookup
- **WHEN** `Core.Args.All()` retains multiple returned elements
- **THEN** every retained string remains its original value after later lookups

### Requirement: Native executable argument capture and Windows conversion
Before Beskid `Main` executes, an AOT executable SHALL capture one ordered
process argument vector through its manifest-owned entry adapter. The vector
SHALL include executable `argv[0]`. Linux x86-64 and macOS arm64 adapters SHALL
preserve their native process-argument order. The Windows x86-64 adapter SHALL
decode command-line arguments from UTF-16 to UTF-8; every ill-formed UTF-16
code-unit sequence SHALL become exactly one U+FFFD replacement character, and
the adapter SHALL NOT reinterpret it as raw bytes or omit the argument.

**Stable ID:** `BSP-REQ-9A5A995DA656`

#### Scenario: Native execution retains argv zero
- **GIVEN** an AOT executable invoked as `program --color`
- **WHEN** Beskid `Main` reads `Core.Args.All()`
- **THEN** it receives `program` at index `0` followed by `--color`

#### Scenario: Windows replaces ill-formed UTF-16 deterministically
- **GIVEN** a Windows command-line argument containing an unpaired UTF-16 surrogate
- **WHEN** the Windows x86-64 adapter captures the argument vector
- **THEN** the corresponding managed UTF-8 string contains one U+FFFD replacement character at that sequence

### Requirement: Explicit JIT arguments and non-executable denial
JIT execution that can evaluate `Core.Args` SHALL accept its argument vector
only through an explicit public execution API before the entrypoint runs. It
SHALL NOT inherit the host process vector, read an ambient global, or substitute
an empty vector when no vector is supplied. Execution without an explicitly
injected vector SHALL fail with the stable diagnostic
`Core.Args requires explicit JIT arguments`. Shared and library outputs that use
`Core.Args` SHALL be rejected with the stable diagnostic
`Core.Args requires executable arguments`; they SHALL NOT fabricate a process
vector.

**Stable ID:** `BSP-REQ-E02D15F88344`

#### Scenario: JIT requires explicit argument injection
- **GIVEN** a JIT program that evaluates `Core.Args.All()`
- **WHEN** it is executed with the explicit vector `["jit", "--flag"]`
- **THEN** it observes exactly that vector and no host-process argument

#### Scenario: JIT rejects missing argument injection
- **GIVEN** a JIT program that evaluates `Core.Args.All()`
- **WHEN** it is executed without an explicitly injected argument vector
- **THEN** execution fails with `Core.Args requires explicit JIT arguments` and no fallback vector

#### Scenario: Shared output denies Core.Args stably
- **GIVEN** a shared or library output that uses `Core.Args`
- **WHEN** it is built
- **THEN** the build fails with `Core.Args requires executable arguments` and no fallback vector

### Requirement: Three-target ABI-v5 adapter provenance
The ABI-v5 manifest and generated contract SHALL declare exactly one
provenance-valid adapter binding for each of `__args_count() -> i64` and
`__args_get(i64) -> string` on Linux x86-64, macOS arm64, and Windows x86-64.
Each supported target claim SHALL have installed debug and release kit evidence
for those bindings; handwritten allowlists, undeclared imports, and inferred
target bindings are prohibited.

**Stable ID:** `BSP-REQ-068C8227847F`

#### Scenario: Installed target kits prove generated bindings
- **GIVEN** installed debug and release ABI-v5 kits for Linux x86-64, macOS arm64, and Windows x86-64
- **WHEN** their Core.Args adapter provenance is validated
- **THEN** each kit exposes exactly one generated binding for each selected private service and no undeclared binding
