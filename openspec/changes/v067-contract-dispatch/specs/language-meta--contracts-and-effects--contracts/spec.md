## ADDED Requirements

### Requirement: Contract types as value types
A contract name SHALL be usable as a value type. A value of contract type SHALL hold any value whose type conforms to the contract: a `type`, an `enum`, or a primitive type or `string` with an `impl` block for the contract. Contract values SHALL be allowed as locals, including `mut` locals, as fields, as array and `List` elements, as parameters, as return values, and as the elements of `inject Contract[]`. A contract that embeds other contracts SHALL be convertible to each embedded contract type.

#### Scenario: Several implementations in a list
- **GIVEN** `contract Shape { f64 Area(); }`, `type Square : Shape` and `type Circle : Shape`
- **WHEN** `List<Shape> shapes` receives a `Square` and a `Circle` and the code sums `shape.Area()` over the list
- **THEN** each call runs the implementation of the held value

#### Scenario: Primitive as a contract value
- **GIVEN** `impl i64 : Formatting { ... }` and `string Show(Formatting f) { return f.Format(); }`
- **WHEN** `Show(3)` is checked and run
- **THEN** no diagnostic is reported and the result is the text of `3`

### Requirement: Conversion to a contract type
A concrete value SHALL convert to a contract type where a contract type is expected, if its type conforms to the contract. The positions SHALL be an assignment, an initializer, an argument, a return value, a field or element store and an injection. The conversion SHALL select the implementation at compile time and SHALL keep the held value. A value whose type does not conform SHALL be reported with the ordinary type-mismatch diagnostic naming the contract. A contract value SHALL NOT convert back to a concrete type implicitly.

#### Scenario: Value that does not conform
- **GIVEN** `Shape s = 3;` where `i64` has no `impl` for `Shape`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report the type-mismatch diagnostic that names `Shape`

### Requirement: Runtime dispatch through a contract value
A call through a contract value SHALL dispatch at run time to the implementation of the held value, with the held value as receiver. Default parameter values SHALL come from the contract. A call through a generic bound `T: C` SHALL keep static dispatch for each specialization.

#### Scenario: Dispatch follows the held value
- **GIVEN** `Shape s = new Square(2); s = new Circle(1);` where `s` is a `mut` local
- **WHEN** `s.Area()` runs after each assignment
- **THEN** the first call runs `Square.Area` and the second runs `Circle.Area`
