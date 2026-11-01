## ADDED Requirements

### Requirement: C profile represents records, enums and function pointers
The C ABI profile SHALL define a record shape for `[GlueRecord]` types. Fields SHALL be placed in declaration order, each at the next offset aligned to its natural alignment; the record alignment SHALL be the largest field alignment, and the record size SHALL be the end offset rounded up to that alignment. The profile SHALL bind a fieldless enum to a `uint32_t` discriminant and an admitted callback to a C function pointer that takes a `uint64_t` context token first and returns an `int32_t` status. The profile SHALL reject a record shape whose stated size, alignment or offsets differ from this computation.

#### Scenario: Record layout matches the target C ABI
- **GIVEN** a `[GlueRecord]` of one `u8` field followed by one `i64` field
- **WHEN** the C profile computes its shape for a supported target
- **THEN** the field offsets are 0 and 8, the alignment is 8 and the size is 16, equal to those of the equivalent C struct on that target

#### Scenario: Inconsistent record shape rejected
- **GIVEN** a record shape that states offset 4 for an `i64` field after a `u8` field
- **WHEN** the C profile binds the shape
- **THEN** the binding is rejected

### Requirement: Bool and Unicode scalar domains in the C profile
The C ABI profile SHALL bind Bool as `uint8_t` restricted to 0 and 1, `char` as `uint32_t` restricted to Unicode scalar values, and `word` as the target `uintptr_t`. These domains SHALL be part of the scalar shape so that Bool and `u8`, and `char` and `u32`, are distinct shapes with the same C type.

#### Scenario: Bool is a distinct shape
- **GIVEN** the surface primitives `bool` and `u8`
- **WHEN** both are mapped to type shapes
- **THEN** both bind to `uint8_t` and the two shapes are not equal
