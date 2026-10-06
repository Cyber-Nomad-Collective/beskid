## MODIFIED Requirements

### Requirement: Type expression grammar
A type expression SHALL be a primitive (`bool`, `i8`, `i16`, `i32`, `i64`, `u8`, `u16`, `u32`, `u64`, `f32`, `f64`, `char`, `string`, `unit`, `never`, `word`, `pointer`), named Path with optional GenericArguments, array `T[]`, or function type `T(params)` / `(params) => R`. Primitive identity SHALL be consistent through parser, generated SDK syntax, semantic/query typing, typed AST and canonical ISLE lowering; retired HIR representations SHALL NOT be restored. Signed/unsigned fixed integers SHALL have their declared bit width, exact representable range and checked rejection of out-of-range literals/conversions; f32/f64 SHALL use IEEE 754 binary32/binary64, round-to-nearest ties-to-even for narrowing and preserve signed zero. Char SHALL denote a Unicode scalar, excluding surrogates and values above 0x10ffff. Word SHALL be unsigned selected-target pointer width; pointer SHALL remain an explicitly unsafe address construct, not a serializable value. Unit SHALL denote no value, never nonreturning control flow. Nullable syntax `?T`, `T?` and `optional T` SHALL remain rejected; absence SHALL use Option<T> or an explicit enum.

#### Scenario: Full primitives are real language types
- **GIVEN** a program with each fixed-width integer and f32/f64 plus generic instantiations
- **WHEN** parse/typecheck/query and canonical AOT lowering run
- **THEN** each type retains the declared width and value semantics through actual native execution rather than wrapper-only aliases

#### Scenario: Ranges and scalar validity reject
- **GIVEN** an integer outside its exact width or a surrogate char literal
- **WHEN** the compiler checks the program
- **THEN** it rejects the value with a source diagnostic before code generation

#### Scenario: Float narrowing and native width
- **GIVEN** an exactly halfway f64-to-f32 narrowing, negative zero and a word conversion on a selected target
- **WHEN** the operations execute
- **THEN** narrowing uses ties-to-even, negative zero is preserved and native-width overflow is rejected

#### Scenario: Nullable reference type rejected
- **GIVEN** a nullable type annotation such as T?
- **WHEN** the grammar is parsed
- **THEN** the nullable form is rejected

### Requirement: Aggregate unit fields retain semantics without physical storage
The compiler SHALL retain unit-valued aggregate fields in the logical field ordering while assigning them no payload bytes or GC pointer-map entry. It SHALL evaluate their initializers and assignment receivers and right-hand sides for effects exactly once. Field accesses following a unit field SHALL retain their declared logical indices and refer to their own physical offsets. A no-storage slot SHALL accept only an exact semantic unit value, including compiler-issued generic specializations.

#### Scenario: Concrete generic unit box
- **WHEN** the canonical runtime constructs `DynamicBoxV1<unit>` through its registered generic helper
- **THEN** its allocation metadata SHALL describe a header-only managed object with no payload pointer-map entries
- **AND** its logical value field SHALL remain unit typed

#### Scenario: Unit initializer effects and later field access
- **WHEN** an aggregate contains a unit-valued initializer with side effects followed by a scalar field
- **THEN** lowering SHALL execute that initializer once without a payload store
- **AND** accessing the later field SHALL use its original logical index and correct physical offset

#### Scenario: Forged no-storage slot
- **WHEN** a no-storage aggregate slot is supplied a nonunit initializer
- **THEN** lowering SHALL reject that initializer instead of discarding its value

### Requirement: Private canonical runtime helpers require verified corpus scope
The compiler SHALL resolve an unqualified private helper across canonical runtime units only when both units retain current runtime source authority and their import edge was issued as the private canonical corpus scope. Ordinary imports and support units SHALL retain public export visibility; spelling the private scope binding SHALL NOT grant runtime authority. Distinct matching declarations SHALL remain ambiguous.

#### Scenario: Canonical process string-view helpers
- **WHEN** a verified canonical process wrapper calls private StringViewData or StringViewLength from another verified runtime unit
- **THEN** the call SHALL resolve to that exact registered helper declaration

#### Scenario: Ordinary private import remains denied
- **WHEN** an ordinary unit imports a module containing a private helper
- **THEN** the private helper SHALL remain inaccessible regardless of alias spelling
