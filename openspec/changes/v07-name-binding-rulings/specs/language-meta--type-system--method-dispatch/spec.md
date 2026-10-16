## MODIFIED Requirements

### Requirement: Receiver member resolution
Instance calls MUST use postfix `.Identifier` after a primary expression that denotes a value type. The member set of a nominal type SHALL be its fields, its inline methods, the methods of its `impl` blocks and the methods of its `extend type` blocks; for a contract-typed or contract-bounded receiver it SHALL also include the methods of the contract, with embeddings flattened. A member name SHALL be unique in the member set (**E1102**). `receiver.M(...)` SHALL bind member `M` of the receiver's static type, or the call MUST error (**E1101**, **E1213**). A method without `pub` SHALL be callable only from the source unit that declares it, for every call spelling, including a call through a local receiver (**E1107**). A field read `receiver.f` and each field name of a struct literal SHALL bind a declared field of the nominal type, else **E1211**. `extend type` members MUST participate in the member set of the extended type with the same visibility rules as declared members.

#### Scenario: Missing member on receiver
- **GIVEN** a call `receiver.Missing()` where the static type has no such callable member
- **WHEN** member resolution runs
- **THEN** the compiler emits **E1101** or **E1213**

#### Scenario: Extend type method from another unit
- **GIVEN** `Panel.bd` that declares `pub type Panel {}` and `Extras.bd` that declares `extend type Panel { pub unit Extra() {} }`
- **WHEN** a third unit calls `panel.Extra()` on a `Panel` local
- **THEN** the call binds to `Extra` of the `extend type` block

#### Scenario: Private method through a local receiver
- **GIVEN** `Account.bd` that declares `pub type Account { unit Audit() {} }`
- **WHEN** `Main.bd` calls `account.Audit()` on an `Account` local
- **THEN** the compiler emits **E1107**

#### Scenario: Unknown literal field
- **GIVEN** `pub type Point { pub i64 x, pub i64 y }`
- **WHEN** a unit builds `Point { x: 1, z: 2 }`
- **THEN** the compiler emits **E1211** for `z`

### Requirement: Overload resolution and static dispatch
A method name SHALL identify one member of the receiver type's member set; Beskid SHALL NOT overload methods or functions by arity or argument types. A call SHALL check its arguments against the one bound signature. Dispatch is static in v0.1: the callee MUST be known at compile time from the receiver's static type. Interop thunks MUST preserve the statically selected symbol through lowering. Contracts used as namespaces (`Contract.method()`) SHALL follow "Contracts as static call namespaces" in the contracts capability.

#### Scenario: Two methods with one name
- **GIVEN** a type that declares `unit Write(i64 value)` and an `extend type` of it that declares `unit Write(string value)`
- **WHEN** the member set is built
- **THEN** the compiler emits **E1102** for `Write`

## ADDED Requirements

### Requirement: Implicit receiver and sibling methods
The receiver of a method SHALL be named `this`. `self` SHALL NOT name the receiver; it SHALL be an ordinary identifier that binds only where it is declared, for example as a parameter. Inside an inline method of a type body, a bare field name SHALL mean `this.field`, and a bare call `Name(...)` or `this.Name(...)` SHALL bind the sibling method `Name` of the type. A local or parameter of the same name SHALL take precedence over the field or sibling method. Inside an `impl` or `extend type` method, fields and methods SHALL be reached only through `this`.

#### Scenario: Undeclared self
- **GIVEN** `type Counter { i64 n, i64 Get() { return self.n; } }`
- **WHEN** the method is resolved
- **THEN** the compiler emits **E1101** for `self`

#### Scenario: Declared self parameter
- **GIVEN** a free function `Result<WsFrameIn, WsError> ReadFrame(WsConnection self)` that reads `self.transport`
- **WHEN** the function is resolved
- **THEN** `self` binds to the parameter

#### Scenario: Bare field in an extend type method
- **GIVEN** `extend type Account { pub i64 Peek() { return balance; } }` where `balance` is a `pub` field of `Account`
- **WHEN** the method is resolved
- **THEN** the compiler emits **E1101** for `balance`

#### Scenario: Function-typed local before a sibling method
- **GIVEN** `type Job { unit Run() {} unit Go((unit) => unit Run) { Run(); } }`
- **WHEN** `Go` is resolved
- **THEN** `Run()` calls the parameter `Run`
