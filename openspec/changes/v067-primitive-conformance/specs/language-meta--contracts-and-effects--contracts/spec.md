## ADDED Requirements

### Requirement: Primitive types implement contracts
A primitive type SHALL conform to a contract through an implementation block `impl P : C { ... }`, where `P` is one of `i8`, `i16`, `i32`, `i64`, `u8`, `u16`, `u32`, `u64`, `word`, `f32`, `f64`, `bool`, `char` and `string`. The types `unit`, `never` and `pointer` SHALL NOT conform. An implementation block for a primitive SHALL name at least one contract, SHALL NOT declare type parameters or `where` bounds, and SHALL be in the source file that declares each contract it names. A primitive SHALL NOT implement the same applied contract twice in one file. A violation SHALL be **E1611** at the block, and such a block SHALL issue no conformance. The methods SHALL satisfy the contract by the ordinary rules: a missing method is **E1601**, a different signature is **E1602**, and a method that implements a contract method is `pub`. A bound `where T: C` SHALL be satisfied by a primitive `P` exactly when one conforming implementation block `impl P : C`, or `impl P : D` where `D` embeds `C`, exists in the compilation; otherwise the call SHALL be **E1610** and the message SHALL name `P`. Inside a method of `impl P : C`, `this` SHALL be a value of type `P` that the method receives by value. A call `value.M()` through a bound `T: C` in a function specialized with `T = P` SHALL call the implementation of `P` with the value as receiver, by static dispatch.

#### Scenario: Primitive satisfies a bound
- **GIVEN** `impl i64 : Formatting { pub string Format() { ... } }` and `string Show<T>(T v) where T: Formatting { return v.Format(); }`
- **WHEN** `Show<i64>(3)` is checked
- **THEN** no diagnostic is reported and the call uses the implementation for `i64`

#### Scenario: Primitive without implementation
- **GIVEN** the same `Show<T>` and no `impl bool : Formatting`
- **WHEN** `Show<bool>(true)` is checked
- **THEN** the compiler SHALL report **E1610** that names `bool`

#### Scenario: Generic primitive block
- **GIVEN** `impl i64 : Formatting where T: Other { ... }` with bounds, or `impl unit : Formatting { }`
- **WHEN** the block is checked
- **THEN** the compiler SHALL report **E1611** at the block
