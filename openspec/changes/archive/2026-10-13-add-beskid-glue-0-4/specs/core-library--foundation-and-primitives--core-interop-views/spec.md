## ADDED Requirements

### Requirement: Core.Interop corelib package with interop view types
The corelib SHALL define a `Core.Interop` package containing interop view record types `CStringView`, `CBuffer`, and `CArrayView`. Each view type SHALL use `pointer` for the `ptr` field and `i64` for `len` and `cap` fields, matching the ABI-v5 `BeskidStr` (`{ptr, len}`) and `BeskidArray` (`{ptr, len, cap}`) layouts. `CStringView` SHALL carry `{pointer ptr, i64 len}`. `CBuffer` SHALL carry `{pointer ptr, i64 len}`. `CArrayView` SHALL carry `{pointer ptr, i64 len, i64 cap}`. The `Core.Interop` package SHALL be a `Lib` target registered as a member of `CoreLib.bws` and a dependency of the aggregate corelib project. Beskid `string` and `T[]` values SHALL NOT cross the user FFI boundary as ordinary GC references; they SHALL use the interop view types.

**Stable ID:** `BSP-REQ-CORE-INTEROP-VIEWS`

#### Scenario: CStringView matches BeskidStr layout
- **GIVEN** a `CStringView` record with `{pointer ptr, i64 len}`
- **WHEN** it is lowered to the ABI boundary
- **THEN** its layout matches `BeskidStr { ptr, len }` and no GC reference crosses the boundary

#### Scenario: CArrayView matches BeskidArray layout
- **GIVEN** a `CArrayView` record with `{pointer ptr, i64 len, i64 cap}`
- **WHEN** it is lowered to the ABI boundary
- **THEN** its layout matches `BeskidArray { ptr, len, cap }` and no GC reference crosses the boundary

#### Scenario: Core.Interop package is a corelib member
- **GIVEN** the `CoreLib.bws` workspace manifest
- **WHEN** the corelib workspace is resolved
- **THEN** the `interop` member is present and the aggregate corelib project depends on `corelib_interop`
