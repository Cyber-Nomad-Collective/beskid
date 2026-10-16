## ADDED Requirements

### Requirement: Generic methods and method type arguments
A method SHALL be able to declare its own type parameters and bounds: `ImplMethodDefinition` SHALL accept `GenericParameters?` after the method name and `WhereClause?` after the parameter list, in the positions `FunctionDefinition` uses (`T Name<U>(...) where U: C`). A method's type parameters SHALL be the type parameters of its owner type (or `impl` block) followed by its own; an own type parameter SHALL NOT repeat an owner type parameter's name (**E1229**). A method's `where` clause MAY bound its own type parameters and the owner's type parameters (`TypeDefinition` has no `where` clause); inside the method body a bounded owner type parameter SHALL have the bound, and at each call a bound on an owner type parameter SHALL be proven against the receiver's instantiation (**E1610** at the call). `ContractMethodSignature` SHALL NOT accept type parameters in this release.

`MemberAccess` SHALL accept `GenericArguments?` after the member name (`MemberAccess = { "." ~ Identifier ~ GenericArguments? }`), with the same disambiguation from the comparison operators that `PathSegment` (`Identifier ~ GenericArguments?`) already has. Explicit type arguments on a method call, written on the last path segment (`s.Spawn<i64>(body)`) or on a member access (`values.Parallel().Map<i64>(f)`), SHALL bind the method's own type parameters only, all of them and in declaration order; a count that differs from the number of own type parameters, or type arguments on a method that declares none, SHALL be reported as **E1204**. The owner's type parameters SHALL be bound by the instantiated receiver, as for every method call today. The syntax model SHALL carry `generics` and `where_clause` on `MethodDefinition` and `type_args` on `MemberExpression`; the formatter SHALL emit both without spaces inside the angle brackets; hover and signature help SHALL show the method's own type parameters with their bindings at the call.

#### Scenario: Generic method with explicit arguments on a path receiver
- **GIVEN** `pub type Box<T> { T item, pub U Apply<U>((T) => U f) { return f(this.item); } }` and `i64 Main() { Box<string> b = Box<string> { item: "abc" }; return b.Apply<i64>((string s) => s.Length()); }`
- **WHEN** the program is checked and run
- **THEN** no diagnostic is reported and `Main` returns 3

#### Scenario: Explicit arguments after a call result
- **GIVEN** a method `pub Box<U> Map<U>((T) => U f)` on `Box<T>` and `Box<string> Twice(Box<i64> b) { return b.Map<i64>((i64 x) => x * 2).Map<string>((i64 y) => "${y}"); }`
- **WHEN** the function is parsed and checked
- **THEN** both member accesses carry their type arguments and no diagnostic is reported

#### Scenario: Wrong type argument count
- **GIVEN** the same `Apply<U>` and the call `b.Apply<i64, bool>((string s) => s.Length())`
- **WHEN** the call is checked
- **THEN** the compiler reports **E1204** at the type argument list

#### Scenario: Method bound on an own type parameter
- **GIVEN** `pub type Seq<T> { T[] items, pub T Fold<C>(T seed, C combiner) where C: Folder<T> { return seed; } }` and a type `Plain` that does not conform to `Folder<i64>`
- **WHEN** `seq.Fold<Plain>(0_i64, Plain {})` is checked
- **THEN** the compiler reports **E1610** naming `Folder<i64>`

#### Scenario: Method bound on an owner type parameter
- **GIVEN** `pub type Cell<T> { T value, pub T Read() where T: Shared { return this.value; } }` and a `Cell<u8[]> c`
- **WHEN** `c.Read()` is checked
- **THEN** the compiler reports **E1610** at the call naming `Shared`, and `Cell<string>` calls `Read` without a diagnostic

#### Scenario: Comparison after a member access still parses
- **GIVEN** `bool Small(Box<i64> b) { return b.item < 10 && b.item > 2; }`
- **WHEN** the function is parsed
- **THEN** both comparisons parse as binary expressions and no type arguments are attached to `item`
