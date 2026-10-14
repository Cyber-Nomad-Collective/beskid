## ADDED Requirements

### Requirement: Contracts as static call namespaces
A path `C.M` whose first segment names a contract SHALL bind method `M` of `C` only when `C` is an `[Extern]` contract. The path SHALL bind wherever `C` is in scope and accessible under the ordinary visibility rules, in the declaring source unit and in importing source units. A contract without `[Extern]` SHALL NOT be a call namespace; `C.M` on it SHALL fail with **E1101**. Calls on a contract-typed or contract-bounded receiver SHALL follow "Contract call dispatch" and "Generic parameter contract bounds", not this requirement.

#### Scenario: Extern contract in its own unit
- **GIVEN** `Native.bd` that declares `[Extern(Abi:"C", Library:"libc.so.6")] pub contract Libc { i32 getpid(); }`
- **WHEN** a function of `Native.bd` calls `Libc.getpid()`
- **THEN** the call binds to the extern method `getpid` of `Libc`

#### Scenario: Imported extern contract
- **GIVEN** the same `Native.bd` and a unit `Tools.bd` with `use Native;`
- **WHEN** `Tools.bd` calls `Libc.getpid()`
- **THEN** the call binds to the extern method `getpid` of `Libc`

#### Scenario: Ordinary contract is not a namespace
- **GIVEN** a unit that declares `contract MathOps { i32 Abs(i32 value); }`
- **WHEN** the unit calls `MathOps.Abs(-5)`
- **THEN** the compiler emits **E1101**
