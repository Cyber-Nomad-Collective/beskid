## ADDED Requirements

### Requirement: Borrowed element return
An element read `xs[i]`, where the element type is of Moved class, SHALL denote a borrowed value. A function SHALL NOT return that value directly or through a local that was initialized by the read. The compiler SHALL report **E1241** at the `return` expression, with the label "borrowed here" on the element read. The help SHALL say to take the value out of the collection or to clone it. A function that returns an owned expression, such as the result of a call that takes the value out, SHALL NOT receive the diagnostic. Element types of Shared, Copied and Never class SHALL NOT receive the diagnostic.

#### Scenario: Direct return of an element
- **GIVEN** `Block First(Block[] blocks) { return blocks[0]; }` where `Block` is of Moved class
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **E1241** at `return blocks[0]` with the label "borrowed here" on `blocks[0]`

#### Scenario: Return through a local
- **GIVEN** `Block First(Block[] blocks) { let b = blocks[0]; return b; }` where `Block` is of Moved class
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **E1241** at `return b`

#### Scenario: Element of Copied class
- **GIVEN** `i64 First(i64[] values) { return values[0]; }`
- **WHEN** the function is checked
- **THEN** no diagnostic is reported

### Requirement: Scope-borrowed values do not escape
A value of a type that carries `[ScopeBorrowed]`, and a borrowed value stored in such a value, SHALL be valid only inside the scope of the terminal operation that created it. The compiler SHALL report **E1241** when such a value is stored into a field, stored into an element, or returned. The compiler SHALL report **E1241** when an escaping closure captures such a value. An escaping closure is a closure that is returned, stored, or passed to `spawn`. A closure that is called inside the scope and does not escape SHALL be accepted. The attribute `[ScopeBorrowed]` outside a `Core.*` module SHALL remain **E1510**.

#### Scenario: Store into a field
- **GIVEN** a function that assigns a `SeqSource<T>` value to a field of a record
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **E1241** at the assignment

#### Scenario: Return of a view
- **GIVEN** a function that returns the `SeqSource<T>` it received
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **E1241** at the `return` expression

#### Scenario: Capture by a spawned closure
- **GIVEN** a `spawn` operand closure that captures a `SeqSource<T>`
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **E1241** at the capture

#### Scenario: Use inside the scope
- **GIVEN** `.Parallel().Map((x) => x * x).Reduce(0_i64, SumI64 {})` in one expression
- **WHEN** the function is checked
- **THEN** no diagnostic is reported
