## ADDED Requirements

### Requirement: Method type argument inference
A call of a generic function or method whose own type parameters are not given explicitly SHALL infer them, and the inference SHALL proceed in this order:

1. The owner type parameters of a method SHALL be bound by the instantiated receiver.
2. Explicit type arguments, when written, SHALL bind every own type parameter, and steps 3 and 4 SHALL then only check.
3. Each argument that is not a lambda literal SHALL be synthesized and its proven type SHALL be unified structurally with its declared parameter type (through nominal type arguments, array elements and function parameter and result types), left to right. Two different bindings of one type parameter SHALL be reported as **E1229**.
4. Each lambda literal argument SHALL then be typed left to right against its declared function-typed parameter with the bindings of steps 1-3 and of earlier lambdas applied. An untyped lambda parameter SHALL take its type from that parameter type, which SHALL be fully bound at this point (**E1202** otherwise); a typed lambda parameter SHALL be unified like a step 3 argument. When the declared result type still names an unbound type parameter, the lambda's result SHALL be synthesized: an expression body from its own proven type (an unsuffixed integer literal takes the language default `i32`), a block body from its `return` expressions, which SHALL all have the same proven type (a block with no `return` value is `unit`); the synthesized result SHALL then be unified with the declared result type.
5. A type parameter that is still unbound SHALL be reported as **E1203** at the call, naming the parameter, with the help to write the type arguments.

Inference SHALL NOT use the expected type of the call itself and SHALL NOT bind a type parameter from a lambda's parameters' use inside its body. The expected type of an argument SHALL keep the 2026-10-09 rule (bound only by explicit arguments or the receiver), with one refinement: a function-typed parameter whose unbound type parameters appear only in its result SHALL still supply its parameter types to an untyped lambda, and the lambda's result SHALL have no expected type. After inference every argument SHALL be checked against the substituted parameter type (**E1206** on mismatch) and every `where` bound SHALL be proven (**E1610**).

#### Scenario: Result type inferred from an expression body
- **GIVEN** a method `pub Task<T> Spawn<T>(() => T body)` on `Scope` and `Task<i64> t = s.Spawn(() => 20_i64);`
- **WHEN** the call is checked
- **THEN** `T` is bound to `i64` and no diagnostic is reported

#### Scenario: Lambda parameter from the receiver, result from the body
- **GIVEN** `pub type Seq<T> { T[] items, pub Seq<U> Map<U>((T) => U f) { ... } }` and `Seq<string> Show(Seq<i64> numbers) { return numbers.Map((x) => "${x}"); }`
- **WHEN** the call is checked
- **THEN** `x` has type `i64`, `U` is bound to `string`, and no diagnostic is reported

#### Scenario: Type parameter from a non-lambda argument
- **GIVEN** a method `pub T Fold<C>(T seed, C combiner) where C: Folder<T>` on `Seq<T>`, a type `AddAll : Folder<i64>`, and `numbers.Fold(0_i64, AddAll {})`
- **WHEN** the call is checked
- **THEN** `C` is bound to `AddAll` and the bound is proven

#### Scenario: Block body result from its returns
- **GIVEN** `Task<i64> t = s.Spawn(() => { Log.Info("start"); return 7_i64; });`
- **WHEN** the call is checked
- **THEN** `T` is bound to `i64`

#### Scenario: Unresolvable result requires type arguments
- **GIVEN** `pub Task<T> SpawnTry<T>(() => Result<T, string> body)` and `s.SpawnTry(() => Result::Error("no input"))`
- **WHEN** the call is checked
- **THEN** the compiler reports **E1203** naming `T`, and `s.SpawnTry<i64>(() => Result::Error("no input"))` is accepted

#### Scenario: Conflicting bindings
- **GIVEN** `pub T Pick<T>(T a, T b)` and `Pick(1_i64, "x")`
- **WHEN** the call is checked
- **THEN** the compiler reports **E1229** naming `T`, `i64` and `string`
