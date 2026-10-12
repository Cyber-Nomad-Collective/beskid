## MODIFIED Requirements

### Requirement: Lambda syntax and typing
`param => body` or `(p1, p2) => body` MUST form a lambda where `body` is an expression or `{ block }`. Parameters MAY be typed (`T name`) or untyped (`name`) when contextual type is available. Lambdas MAY appear anywhere an `Expression` is allowed, including as `spawn` operands.

The type of a lambda SHALL be a function type. A typed parameter SHALL have its declared type. An untyped parameter SHALL have the parameter type, at the same position, of the function type that the lambda's position declares: an annotated local, a struct field, a declared return type, or the parameter of the callee of the enclosing call. A block body SHALL be a statement lambda: every `return` in it SHALL leave the lambda and SHALL be checked against the result of that function type, and a block body without a declared function type SHALL have the result `unit`. An expression body SHALL be checked against the result of that function type and SHALL otherwise have the type of its expression. A lambda SHALL NOT supply an expected type of its own; the only expected type inside a lambda is the one its own function type carries. An untyped parameter in a position that declares no function type SHALL be reported as **E1202**.

#### Scenario: Untyped lambda without context
- **GIVEN** an untyped lambda with no expected function type in context
- **WHEN** type inference runs
- **THEN** the compiler emits **E1202**

#### Scenario: Untyped parameter from the callee parameter
- **GIVEN** `i64 Apply(i64 v, (i64) => i64 f) { return f(v); }` and the call `Apply(5, x => x + 1)`
- **WHEN** the lambda is typed
- **THEN** `x` has the type `i64` and the lambda has the type `(i64) => i64`

#### Scenario: Block body return takes the declared result
- **GIVEN** `u8 Pick(u8 v, (u8) => u8 f) { return f(v); }` and the call `Pick(9, (u8 x) => { return 2; })`
- **WHEN** the literal `2` is typed
- **THEN** it has the type `u8` from the lambda's function type, not the result of the enclosing function

### Requirement: Capture and closure lifetime
Captured locals MUST be definitely assigned before capture or diagnosed per definite-assignment rules. A capture SHALL be a by-value snapshot taken when the closure record is created. A lambda that is not a `spawn` operand SHALL NOT capture a `mut` binding or a native pointer; the compiler SHALL report **E1233** at the lambda and SHALL name the captured binding. A `spawn` operand that captures a stack reference SHALL keep **E1225**. A closure MUST extend the lifetime of captured storage to at least the closure value's lifetime: a captured managed value SHALL be traced through the closure environment. Closures passed to `spawn` MUST be compatible with fiber entry signatures.

#### Scenario: Capture of mut binding rejected
- **GIVEN** `i64 Main() { mut i64 count = 1; let read = () => count; return read(); }`
- **WHEN** capture analysis runs
- **THEN** the compiler emits **E1233** at the lambda, naming `count`, and rejects the lambda

#### Scenario: Captured string is traced
- **GIVEN** `string Call((string) => string f) { return f("!"); }` and `string Main(string prefix) { return Call((string s) => prefix + s); }`
- **WHEN** the lambda's closure environment is laid out
- **THEN** `prefix` is a traced field of the environment

## ADDED Requirements

### Requirement: Function values and indirect calls
A function type SHALL be a reference type. A value of a function type SHALL be a reference to a GC-managed closure record `{ header, code pointer, environment pointer }`, and the ABI of every function type SHALL be one pointer. A lambda evaluated in value position SHALL allocate its environment (when it captures) and then its record; a capture-free lambda SHALL have a null environment. A named function item that is not generic, read as a value and not called, SHALL evaluate to a record whose code pointer is the item's entry and whose environment is null. A generic function item read as a value SHALL NOT compile.

A call whose callee is an expression of function type SHALL call indirectly through the record: it SHALL evaluate the callee first, then the arguments, and SHALL pass the environment pointer first when it is not null. The callee MAY be a function-typed parameter, lambda parameter or local, an unannotated local initialized by a lambda, a function-typed field projection, a call that returns a function value, or any other expression of function type. A function-typed local SHALL shadow every item, import and builtin of its name at a call site. The arguments SHALL be checked against the parameters of the callee's function type.

#### Scenario: Call through a function-typed parameter
- **GIVEN** `i64 Apply(i64 v, (i64) => i64 f) { return f(v); }`
- **WHEN** `Apply` is compiled
- **THEN** `f(v)` is an indirect call through the closure record `f` holds

#### Scenario: Named function as a value
- **GIVEN** `i64 Double(i64 x) { return x * 2; }` and the call `Apply(4, Double)`
- **WHEN** `Double` is evaluated as an argument
- **THEN** it is a closure record with the entry of `Double` and a null environment

#### Scenario: Call through a function-typed field
- **GIVEN** `type Handler { (i64) => i64 op }` and `h.op(5)` on a `Handler` local `h`
- **WHEN** the call is compiled
- **THEN** it is an indirect call through the record stored in the `op` field

#### Scenario: Call on a call result
- **GIVEN** `(i64) => i64 Make() { return (i64 x) => x + 1; }` and `Make()(1)`
- **WHEN** the outer call is compiled
- **THEN** `Make()` is evaluated first and its result is called indirectly with `1`

### Requirement: Stack and heap closures
A lambda bound to an immutable local, with an expression body, whose every use is the callee of a call SHALL be a stack closure: each call SHALL lower the lambda inline at the call site and SHALL NOT allocate. A lambda in any other position (an argument, a struct field value, a return value, an assigned value, a `mut` local, or a block-bodied local) SHALL be a heap closure: its environment and its record SHALL be allocated when the lambda is evaluated, and the record SHALL be a GC root for as long as a local holds it. A `mut` function-typed local SHALL call through the record it holds at the call site, never through its initializer.

#### Scenario: Lambda local used only as a callee does not allocate
- **GIVEN** `i64 Main(i64 offset) { let add = (i64 x) => x + offset; return add(1); }`
- **WHEN** `Main` is compiled
- **THEN** no closure record or environment is allocated and the call is lowered inline

#### Scenario: Lambda local passed as a value allocates its record
- **GIVEN** `i64 Main() { let twice = (i64 x) => x * 2; return Apply(twice(1), twice); }`
- **WHEN** `Main` is compiled
- **THEN** `twice` evaluates to an allocated closure record

#### Scenario: Reassigned function-typed local calls its current record
- **GIVEN** `mut (i64) => i64 op = (i64 x) => x + 1; op = ((i64 x) => x * 10); return op(1);`
- **WHEN** `op(1)` is compiled
- **THEN** the call reads the record `op` currently holds and calls it indirectly
