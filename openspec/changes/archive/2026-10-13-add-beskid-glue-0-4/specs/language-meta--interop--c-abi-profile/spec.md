## MODIFIED Requirements

### Requirement: C ABI profile binds Interop.Contracts primitives
The C ABI profile SHALL bind `Interop.Contracts` primitives via `CAbiProfile::bind()` and SHALL validate foreign signatures via `CAbiProfile::validate_signature()`. The permitted scalar set SHALL be `I8`, `U8`, `I32`, `I64`, `F64`. The profile SHALL map interop view types to their ABI counterparts: `CStringView` to `BeskidStr`, `CBuffer` to a `{ptr, len}` layout, and `CArrayView` to `BeskidArray`. The profile SHALL NOT redefine `TypeShapeClass`, `OwnershipClass`, or `CallShapeClass`; it SHALL consume them from `beskid_abi::interop`. Beskid `string` and `T[]` SHALL NOT appear on user Extern signatures; they SHALL use the interop view types from `Core.Interop`.

**Stable ID:** `BSP-REQ-C-ABI-BIND-INTEROP`

#### Scenario: CAbiProfile binds a scalar signature
- **GIVEN** an `InteropSignature` with `I32` and `I64` scalar parameters
- **WHEN** `CAbiProfile::bind()` is called
- **THEN** the profile produces a C-ABI-compatible signature with the permitted scalar types

#### Scenario: CAbiProfile validates and rejects a forbidden type
- **GIVEN** an `InteropSignature` with a `StringLike` parameter not wrapped in a view type
- **WHEN** `CAbiProfile::validate_signature()` is called
- **THEN** validation fails because raw `string` is not permitted on the C ABI boundary

#### Scenario: CAbiProfile maps a CStringView to BeskidStr
- **GIVEN** an `InteropSignature` with a `CStringView` parameter
- **WHEN** `CAbiProfile::bind()` is called
- **THEN** the profile maps the view to the `BeskidStr { ptr, len }` ABI layout
