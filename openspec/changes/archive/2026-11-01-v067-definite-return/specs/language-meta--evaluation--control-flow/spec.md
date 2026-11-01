## ADDED Requirements

### Requirement: Definite return
A function or method whose declared result is not `unit` or `never` SHALL NOT have a reachable end of body. Every path through the body SHALL end in `return <value>;` or in a statement that does not complete normally. The compiler SHALL report **E1258** for a body whose end is reachable, before lowering.

A statement SHALL complete normally except as follows:
- `return`, `break` and `continue` SHALL NOT complete normally. A reachable `break` SHALL make the end of its innermost loop reachable.
- A `while` statement SHALL NOT complete normally when its condition is the literal `true`, with or without grouping parentheses, and its body has no reachable `break` for that loop. The compiler SHALL NOT evaluate other loop conditions.
- An `if` statement without `else` SHALL complete normally, whatever its condition. An `if` statement with `else` SHALL complete normally when at least one of its branches completes normally.
- A `with` statement, a scoped `use` statement with a block, and a nested block SHALL complete normally when their statements complete normally.
- A `match` statement SHALL NOT complete normally when no arm body completes normally and the match cannot end without taking an arm: a match on an enum value, or a match on a primitive value with an unguarded `_` or binding arm.
- A call statement whose result type is `never` SHALL NOT complete normally.

`for`, `let` and `launch` statements, and all other expression statements, SHALL complete normally. Statements after a statement that does not complete normally SHALL NOT make the end of the body reachable. The rule SHALL apply in the same way to functions with `[Export]`, Mod and SDK callbacks, and methods.

#### Scenario: Expression statement at the end of a valued function
- **GIVEN** `i32 Main() { 0; }`
- **WHEN** the code is checked or built
- **THEN** the compiler SHALL report **E1258** at the closing brace of `Main`, and the build SHALL NOT report an internal error

#### Scenario: If without else
- **GIVEN** `i32 Sign(bool positive) { if (positive) { return 1; } }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1258**

#### Scenario: If and else both return
- **GIVEN** `i32 Sign(bool positive) { if (positive) { return 1; } else { return -1; } }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL NOT report **E1258**

#### Scenario: Formatted infinite loop
- **GIVEN** `i32 Wait(i32 limit) { mut i32 count = 0; while (true) { if (count >= limit) { return count; } count = count + 1; } }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL NOT report **E1258**

#### Scenario: Infinite loop with a break
- **GIVEN** `i32 Stop() { while (true) { break; } }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1258**

#### Scenario: Enum match whose arms return
- **GIVEN** `enum Step { Stop(), Go(i32 value) }` and `i32 Next(Step step) { match step { Step::Stop() => { return 0; }, Step::Go(value) => { return value; }, } }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL NOT report **E1258**

#### Scenario: Primitive match without a catch-all arm
- **GIVEN** `i32 Pick(i32 code) { match code { 1 => { return 10; }, 2 => { return 20; }, } }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1258**

#### Scenario: Call that returns never
- **GIVEN** `never Halt() { while (true) { } }` and `i32 Main() { Halt(); }`
- **WHEN** the code is checked
- **THEN** the compiler SHALL NOT report **E1258**
