## ADDED Requirements

### Requirement: Locals mut and assignment
Assignment to immutable bindings MUST error (**E1214**). `mut` MUST appear as a prefix modifier before the type or after `let` to allow reassignment (`mut T name = expr`, `let mut name = expr`, or `mut T name` parameters). Legacy suffix form `T mut name` MUST be rejected by the parser. Parameters are passed by value in v0.1; `ref` and `out` parameter modifiers are not part of v0.1.

#### Scenario: Assignment to immutable local
- **GIVEN** a non-`mut` local binding
- **WHEN** code assigns to that binding
- **THEN** the compiler emits **E1214**

### Requirement: Arrays heap and null prohibition
`T[]` values MUST use the fat-pointer layout (`BeskidArray`) described in execution ABI material. Element access MUST respect bounds checks in safe builds. Reference-bearing values that escape their defining frame MUST live on the GC heap. User code MUST NOT expose manual `free` or untracked pointers in v0.1. `null` MUST NOT appear as a value; optional absence MUST use `Option<T>`. Pointer stores to heap objects MUST execute write barriers when required by the active GC phase.

#### Scenario: Null literal rejected
- **GIVEN** a program that uses a `null` literal as a value
- **WHEN** the program is type-checked under v0.1
- **THEN** the compiler rejects `null` and requires `Option<T>` or an explicit absent variant

### Requirement: Cross-fiber sharing
Values MUST NOT be shared across fibers by alias unless immutability is proven or synchronization uses `Channel<T>`. Capturing mutable shared state in `spawn` closures SHOULD be rejected when detectable. Closure environments MUST outlive uses tracked by the compiler’s capture analysis.

#### Scenario: Unsynchronized cross-fiber alias
- **GIVEN** a mutable value aliased into two fibers without proven immutability or a `Channel<T>`
- **WHEN** sharing analysis runs
- **THEN** the compiler rejects the sharing or diagnoses detectable mutable capture

## REMOVED Requirements

### Requirement: Memory and references conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
