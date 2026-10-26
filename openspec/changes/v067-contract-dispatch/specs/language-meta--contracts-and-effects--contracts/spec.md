## ADDED Requirements

### Requirement: Contract types as value types
A contract name SHALL be usable as a value type. A value of contract type SHALL hold any value whose type conforms to the contract: a `type`, an `enum`, or a primitive type or `string` with an `impl` block for the contract. Contract values SHALL be allowed as locals, including `mut` locals, as fields, as array and `List` elements, as parameters, as return values, and as the elements of `inject Contract[]`. A contract that embeds other contracts SHALL be convertible to each embedded contract type.

#### Scenario: Several implementations in a list
- **GIVEN** `contract Shape { f64 Area(); }`, `type Square : Shape { f64 side; ... }` and `type Circle : Shape { f64 radius; ... }`
- **WHEN** `List<Shape> shapes` receives `Square { side: 2.0 }` and `Circle { radius: 1.0 }` and the code sums `shape.Area()` over the list
- **THEN** each call runs the implementation of the held value

#### Scenario: Primitive as a contract value
- **GIVEN** `impl i64 : Formatting { ... }` and `string Show(Formatting f) { return f.Format(); }`
- **WHEN** `Show(3)` is checked and run
- **THEN** no diagnostic is reported and the result is the text of `3`

### Requirement: Conversion to a contract type
A contract value SHALL be a value whose static type is a contract `C` or an applied contract `C<A...>`. It SHALL hold one implementing value of a type `T` with `T : C`, together with the implementation of `C` of `T`. A value of type `T` SHALL convert to `C` wherever `C` is expected exactly when `T : C` is proven. The positions SHALL be: a typed `let`; an assignment to a contract-typed local, field or element; an argument of a contract-typed parameter, or of a generic parameter bound to `C`; a `return` from a callable that returns `C`; and a struct field, array element or enum payload of a construction, including every element of an array literal whose element type is a contract. The conversion SHALL select the implementation at compile time and SHALL keep the held value. A value that is already a contract value of `C` SHALL pass through unchanged. A contract value of `D` SHALL convert to every non-generic contract `C` that `D` embeds, directly or transitively; the conversion SHALL keep the held value and SHALL use the implementation table of the implementing type for `C`. A generic embedded contract SHALL NOT be a conversion target. A value of a copy-on-assign type SHALL be copied before it is converted. A primitive SHALL be held by value: a later change of the source variable SHALL NOT reach the held value. When the expected type is a contract, the branches of a conditional expression, the results of match arms and the result of a block SHALL also be conversion positions, as with target typing in C#. Each branch or result SHALL convert to the contract on its own, and the whole expression SHALL have the contract type. The body of a lambda, and a `return` inside it, SHALL convert to the declared or inferred contract return type of the lambda, as any `return` does. Without an expected contract type these expressions SHALL keep their ordinary typing rules. A value whose type does not conform SHALL be reported with the ordinary type-mismatch diagnostic **E1206** naming the contract. A contract value SHALL NOT convert back to a concrete type implicitly.

#### Scenario: Value that does not conform
- **GIVEN** `Shape s = 3;` where `i64` has no `impl` for `Shape`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1206** that names `Shape`

#### Scenario: Upcast to an embedded contract
- **GIVEN** `contract Reader { ... }`, `contract Stream : Reader { ... }` and a `Stream s`
- **WHEN** `Reader r = s;` is checked
- **THEN** no diagnostic is reported and `r` holds the same implementing value

#### Scenario: Conditional branches convert to the expected contract
- **GIVEN** `Greeter g = c ? Hello {} : Bye {};` where `Hello` and `Bye` conform to `Greeter`
- **WHEN** the code is checked
- **THEN** no diagnostic is reported and `g` holds a `Hello` or a `Bye` according to `c`

#### Scenario: Match arms and blocks convert to the expected contract
- **GIVEN** `Greeter g = match k { 0 => Hello {}, _ => Bye {} };`
- **WHEN** the code is checked
- **THEN** no diagnostic is reported

#### Scenario: Lambda body
- **GIVEN** the lambda `() => Hello {}` where the expected function type returns `Greeter`
- **WHEN** the code is checked
- **THEN** no diagnostic is reported and a call of the lambda returns a contract value that holds a `Hello`

#### Scenario: Conditional without an expected contract
- **GIVEN** `let g = c ? Hello {} : Bye {};`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1206** at the second branch, because the branch types differ and no contract is expected

#### Scenario: Primitive held by value
- **GIVEN** `mut i64 n = 1; Formatting f = n; n = 2;`
- **WHEN** `f.Format()` runs
- **THEN** the result is `"1"`

### Requirement: Runtime dispatch through a contract value
A call through a contract value SHALL dispatch at run time to the implementation of the held value, with the held value as receiver. Default parameter values SHALL come from the contract. The compiler MAY call the implementation directly when it proves the implementing type statically; the observable behavior SHALL be the same. Static selection for an immutable local SHALL require that the initializer is itself the conversion site of the `let` and has the identity of one non-generic nominal type; everything else, including a conditional, a match, a block, a lambda, a primitive and a contract-valued initializer, SHALL dispatch at run time. A method of an implementation block for a primitive type SHALL NOT declare a `mut this` receiver, because the receiver is a copy; such a method SHALL be **E1611**. A contract type SHALL be a valid generic argument (`List<Greeter>`, `Greeter[]`). A bound `where T: C` SHALL be satisfied by `T = C`, and calls through such a `T` SHALL dispatch at run time. A call through a generic bound for a concrete `T` SHALL keep static dispatch for each specialization.

#### Scenario: Dispatch follows the held value
- **GIVEN** `Shape s = Square { side: 2.0 }; s = Circle { radius: 1.0 };` where `s` is a `mut` local
- **WHEN** `s.Area()` runs after each assignment
- **THEN** the first call runs `Square.Area` and the second runs `Circle.Area`

### Requirement: Equality of contract values
The operators `==` and `!=` SHALL be defined only between two contract values, of any contracts. Two contract values SHALL be equal exactly when they hold values of the same implementing type and the held values are identical: the same object for a `type` and for `string`, and an equal value for a primitive (floats compare by IEEE equality). A comparison between a contract value and a concrete operand SHALL be **E1209**, the invalid binary operation, because operators do not box. Ordering and arithmetic operators SHALL NOT be defined on contract values and SHALL be **E1209**.

#### Scenario: Same object
- **GIVEN** `Greeter a = h; Greeter b = a;` where `h` is a `Hello` object
- **WHEN** `a == b` is evaluated
- **THEN** the result is `true`

#### Scenario: Boxed primitives
- **GIVEN** `Formatting a = 3_i64; Formatting b = 3_i64;`
- **WHEN** `a == b` is evaluated
- **THEN** the result is `true`

#### Scenario: Contract against a concrete operand
- **GIVEN** a contract value `a` and an `i64` value `n`
- **WHEN** `a == n` is checked
- **THEN** the compiler SHALL report **E1209**

#### Scenario: Ordering
- **GIVEN** two contract values `a` and `b`
- **WHEN** `a < b` is checked
- **THEN** the compiler SHALL report **E1209**

### Requirement: Contract values have no serialization shape
A contract value SHALL have no serialization shape, no field codec and no dynamic packing. An attempt to serialize or pack one SHALL be an error that names "contract value".

#### Scenario: Serialize a contract value
- **GIVEN** a `[Serialize]` type with a field of contract type
- **WHEN** the type is checked
- **THEN** the compiler SHALL report an error that names "contract value"
