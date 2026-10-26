## ADDED Requirements

### Requirement: Result and Option mismatch help
When an expression of type `Result<T, E>` or `Option<T>` is used where `T` is expected, the mismatch diagnostic SHALL print the short type names and SHALL give the help "add `?` to propagate the error, or `match` on the result". The help SHALL NOT suggest a cast. A cast SHALL be suggested only between numeric primitive types.

#### Scenario: Result where a value is expected
- **GIVEN** `i64 n = Parse(text);` where `Parse` returns `Result<i64, ParseError>`
- **WHEN** the code is checked
- **THEN** the mismatch help says to add `?` or to `match`, and does not suggest a cast

### Requirement: Generic arity in type positions
When a type position (a parameter, a return type, a field, a `let` declaration, a lambda parameter or an explicit type argument) names a generic type with the wrong number of type arguments, the compiler SHALL NOT report the name as unknown (**E1201**). A generic type written without type arguments SHALL be **E1203** with the message "missing type arguments for generic type". A generic type written with a different number of type arguments than it declares SHALL be **E1204** with the message "generic argument mismatch: expected <declared>, got <written>". A name that no declaration resolves at any arity SHALL stay **E1201**.

#### Scenario: Missing type arguments
- **GIVEN** `pub type Pair<A, B> { A first; B second; }` and `unit Demo(Pair pair) { return; }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1203** "missing type arguments for generic type" at the parameter and no **E1201**

#### Scenario: Wrong number of type arguments
- **GIVEN** the same `Pair` and `unit Demo(Pair<i64> pair) { return; }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1204** "generic argument mismatch: expected 2, got 1" and no **E1201**
