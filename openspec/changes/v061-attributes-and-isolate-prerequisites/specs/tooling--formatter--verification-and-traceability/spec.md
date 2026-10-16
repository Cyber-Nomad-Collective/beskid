## ADDED Requirements

### Requirement: Attribute sites in the formatter corpus
The representative source corpus used by the idempotency round-trip test SHALL contain at least one attribute at each declaration site of the attribute target catalogue (module, type, enum, enum variant, contract, contract method, contract associated type, contract embedding, `impl` block, function, method, explicit receiver, parameter, lambda, lambda parameter, type parameter, field, `let` statement, constant, test, attribute declaration). The formatter SHALL emit each attribute list in the position the grammar gives it, on the same line as a parameter, receiver, lambda parameter or type parameter, and on its own line before every other site, and `format_program(parse(s))` SHALL be a fixed point for every file of that corpus.

#### Scenario: Parameter and lambda attributes round-trip
- **GIVEN** the corpus file containing `i64 Add([Trace] i64 left, i64 right) { return left + right; }` and `let square = [Pure] ([Hot] i64 x) => x * x;`
- **WHEN** the file is formatted twice
- **THEN** both passes produce identical output and the attributes stay on the same line as their parameter or lambda

#### Scenario: Let and type parameter attributes round-trip
- **GIVEN** the corpus file containing `[Pinned] mut i64 total = 0;` and `unit Keep<[Any] T>(T value) { }`
- **WHEN** the file is formatted
- **THEN** the `let` attribute is emitted on its own line before the statement and the type parameter attribute stays inside the angle brackets
