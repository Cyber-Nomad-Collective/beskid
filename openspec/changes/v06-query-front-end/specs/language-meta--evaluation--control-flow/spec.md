## MODIFIED Requirements

### Requirement: Conditional and loop statement typing
`if (cond) block else block` and `while (cond) block` MUST require `cond` to be `bool`. `for id in expr block` MUST require `expr` to be iterable: the built-in `range(start, end)` form, a value whose type is an array `T[]`, or a nominal value whose type declares the iterator protocol (`Option<T> Next()`); any other iterable is **E1215**. The iterator protocol is satisfied when the iterable's nominal type declares exactly one `Next` method, with no parameters, that returns an `Option<T>` whose variants are `Some` with one payload and `None` without one. Outside a generic or contract-parameterized item, a non-`range` iterable that is not proven to be an array or a nominal iterator is **E1215**, so `beskid check` accepts exactly the loops `beskid build` lowers. `return expr?;` MUST return from the innermost function and `expr` MUST match the return type when present.

#### Scenario: Non-bool if condition
- **GIVEN** an `if` whose condition expression is not `bool`
- **WHEN** control-flow typing runs
- **THEN** the compiler emits a non-bool condition diagnostic

#### Scenario: Nominal iterator loop builds
- **GIVEN** a nominal type that declares `Option<i64> Next()` and a `for item in source { }` loop over a local `source` of that type
- **WHEN** `beskid check` judges the loop and `beskid build` lowers it
- **THEN** `beskid check` SHALL NOT report **E1215**
- **AND** `beskid build` SHALL lower the loop without a compiler gap

#### Scenario: Next returns an Option without the Some and None variants
- **GIVEN** `pub enum Option<T> { Present(T value), Absent }`, a type `Odd` that declares `pub Option<i64> Next()`, and `unit Main(Odd odd) { for x in odd { return; } return; }`
- **WHEN** control-flow typing runs
- **THEN** the compiler SHALL report **E1215** at the iterable

#### Scenario: For over a non-iterable value
- **GIVEN** `unit Main(i64 n) { for i in n { return; } return; }`
- **WHEN** control-flow typing runs
- **THEN** the compiler SHALL report **E1215** at the iterable

## ADDED Requirements

### Requirement: Array iteration
`for id in expr block` where `expr` has type `T[]` SHALL evaluate `expr` exactly once, before the first iteration, to an array value; a null array value SHALL trap as an out-of-bounds access does. The loop SHALL run one iteration per index from `0` to the array's length (exclusive), in increasing order; at the start of each iteration `id` SHALL be bound to the element at the current index, read from the array value evaluated at loop entry. `id` SHALL have type `T` and SHALL be immutable (assigning it is **E1214**). Stores into not-yet-visited elements of the same array value SHALL be observed by later iterations (arrays are reference values); rebinding the local that named the iterable SHALL NOT change the iteration. `break` and `continue` SHALL target the loop. When `T` is a managed type the loop variable SHALL be a garbage-collector root for the duration of its iteration.

#### Scenario: Summing an array parameter
- **GIVEN** `i64 Sum(i64[] values) { mut i64 total = 0_i64; for value in values { total = total + value; } return total; }`
- **WHEN** the program is built and `Sum([1_i64, 2_i64, 3_i64])` runs
- **THEN** the compiler SHALL accept the program without a diagnostic
- **AND** the call SHALL return `6`

#### Scenario: Managed elements
- **GIVEN** `string Last(string[] names) { mut string last = ""; for name in names { last = name; } return last; }`
- **WHEN** the program is built
- **THEN** the loop variable `name` SHALL be a rooted managed local for each iteration
- **AND** `Last(["a", "b"])` SHALL return `"b"`

#### Scenario: Assigning the loop variable
- **GIVEN** `unit Main(i64[] values) { for value in values { value = 1_i64; } return; }`
- **WHEN** `beskid check` judges `Main`
- **THEN** the compiler SHALL report **E1214** at the assignment

### Requirement: Nominal iterator iteration
`for id in expr block` where the type of `expr` satisfies the iterator protocol with `Option<T> Next()` SHALL evaluate `expr` exactly once, before the first iteration, to an iterator value; a null iterator value SHALL trap. Before each iteration the loop SHALL call `Next()` on that iterator value: when it returns `None` the loop SHALL end, and when it returns `Some(v)` `id` SHALL be bound to `v` for that iteration. `id` SHALL have type `T` and SHALL be immutable (assigning it is **E1214**). `continue` SHALL proceed to the next `Next()` call and `break` SHALL end the loop without calling `Next()` again. The iterator value SHALL be a garbage-collector root for the whole loop, and when `T` is a managed type the loop variable SHALL be a garbage-collector root for the duration of its iteration. A generic iterator type binds its type parameters from the iterable's type; inside a generic or contract-parameterized item the protocol is resolved for each specialization.

#### Scenario: Break and continue over an iterator
- **GIVEN** a type `Counter` whose `Option<i64> Next()` yields `1` to `9` and then `None`, and a loop `for value in counter { if value == 2_i64 { continue; } if value == 5_i64 { break; } total = total + value; }`
- **WHEN** the program is built and the loop runs with `total` starting at `0`
- **THEN** the compiler SHALL accept the program without a diagnostic
- **AND** `total` SHALL be `8`

#### Scenario: Generic iterator with managed elements
- **GIVEN** `pub type Repeat<T> { T value, i64 left, pub Option<T> Next() { ... } }` and a loop over a `Repeat<Cell>` value whose body forces a garbage collection and then reads `cell.value`
- **WHEN** the program is built and the loop runs
- **THEN** `Next` SHALL be specialized for `Repeat<Cell>`
- **AND** each `Cell` the loop variable holds SHALL survive the collection
