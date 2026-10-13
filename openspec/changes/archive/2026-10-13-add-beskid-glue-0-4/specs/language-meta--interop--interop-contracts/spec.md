## MODIFIED Requirements

### Requirement: Typed Interop.Contracts instantiation
The `Interop.Contracts` vocabulary SHALL be instantiated as typed Rust models in `beskid_abi::interop`. The typed model SHALL include `TypeShapeClass` (Scalar, OpaqueHandle, Buffer, StringLike, Never), `TypeShape` (Primitive, View, Opaque), `OwnershipClass` (Borrow, Transfer, OpaqueBorrow), `CallShapeClass` (Direct, ByReference, View), `InteropParameter`, `InteropReturn`, `InteropSignature` (with a `validate()` method), and `ConformanceEnvelope` (with a `current()` method returning the envelope pinned to `BESKID_RUNTIME_ABI_VERSION` and `BESKID_USER_FFI_LAYOUT_BAND`). The typed model SHALL be the single source of truth for foreign-boundary type shapes; `Beskid.Glue` and the C/Rust ABI profiles SHALL consume it and SHALL NOT redefine it.

**Stable ID:** `BSP-REQ-INTEROP-TYPED-MODEL`

#### Scenario: TypeShapeClass maps a Beskid primitive
- **GIVEN** the Beskid primitive `i32`
- **WHEN** the typed Interop.Contracts model maps it
- **THEN** the result is `TypeShapeClass::Scalar` with `OwnershipClass::Borrow`

#### Scenario: TypeShapeClass maps a Beskid string
- **GIVEN** the Beskid primitive `string`
- **WHEN** the typed Interop.Contracts model maps it
- **THEN** the result is `TypeShapeClass::StringLike` mapping to `BeskidStr` at the boundary

#### Scenario: InteropSignature validates a permitted scalar signature
- **GIVEN** an `InteropSignature` with a parameter of `TypeShapeClass::Scalar(I32)` and return `TypeShapeClass::Scalar(I64)`
- **WHEN** `validate()` is called
- **THEN** validation passes because both scalars are permitted

#### Scenario: ConformanceEnvelope pins ABI version and layout band
- **GIVEN** the current `ConformanceEnvelope`
- **WHEN** `current()` is called
- **THEN** the envelope carries `BESKID_RUNTIME_ABI_VERSION` (5) and `BESKID_USER_FFI_LAYOUT_BAND` (1)

### Requirement: C and Rust ABI profiles bind Interop.Contracts primitives
The C ABI profile and Rust ABI profile SHALL bind `Interop.Contracts` primitives via `bind()` methods; they SHALL NOT redefine type-shape classes, ownership classes, or call-shape classes. The C ABI profile SHALL permit scalars `I8`, `U8`, `I32`, `I64`, `F64` and SHALL map interop view types (`CStringView`, `CBuffer`, `CArrayView`) to `BeskidStr` and `BeskidArray` at the boundary. The Rust ABI profile SHALL validate runtime symbols against the `RUNTIME_SYMBOL_PREFIX` (`beskid_rt_v5_`). Both profiles SHALL consume the `ConformanceEnvelope` from the typed model.

**Stable ID:** `BSP-REQ-INTEROP-PROFILE-BINDING`

#### Scenario: C ABI profile binds a scalar signature
- **GIVEN** an `InteropSignature` with scalar parameters
- **WHEN** `CAbiProfile::bind()` is called
- **THEN** the profile produces a C-ABI-compatible signature with the permitted scalar types

#### Scenario: C ABI profile rejects a non-permitted scalar
- **GIVEN** an `InteropSignature` with a `U32` parameter (not in the permitted scalar set)
- **WHEN** `CAbiProfile::validate_signature()` is called
- **THEN** validation fails because `U32` is not a permitted C ABI scalar

#### Scenario: Rust ABI profile validates a runtime symbol
- **GIVEN** a runtime symbol `beskid_rt_v5_fiber_join`
- **WHEN** `RustAbiProfile::validate_runtime_symbol()` is called
- **THEN** validation passes because the symbol starts with `beskid_rt_v5_`

#### Scenario: Rust ABI profile rejects a non-prefixed symbol
- **GIVEN** a runtime symbol `fiber_join` without the `beskid_rt_v5_` prefix
- **WHEN** `RustAbiProfile::validate_runtime_symbol()` is called
- **THEN** validation fails because the symbol does not match the runtime prefix
