## ADDED Requirements

### Requirement: C profile represents records and function pointers
The C ABI profile SHALL define a record shape for `repr(C)` records whose fields are admitted Glue types, with the field order, size and alignment of the target C ABI, and SHALL define a function-pointer representation for admitted callback forms.

#### Scenario: Record layout matches the target C ABI
- **GIVEN** a `repr(C)` record of one `u8` field followed by one `i64` field
- **WHEN** the C profile computes its shape for a supported target
- **THEN** the size, alignment and field offsets equal those of the equivalent C struct on that target
