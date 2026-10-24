## ADDED Requirements

### Requirement: Internal-error floor E2101 to E2105
The registry SHALL allocate: **E2101** an unavailable semantic fact after the legality gate; **E2102** a missing ISLE lowering rule or fact; **E2103** any other lowering invariant failure, including verification failures; **E2104** a failure of Mod semantic authority; **E2105** a build failure that has no source site, such as a text-only compiler gap, a duplicate symbol or a module error. Every internal error SHALL be reported as exactly one of these codes. The message SHALL have the form "internal compiler error: <summary in words>; please report this". The label SHALL be "the compiler failed here", the help SHALL name the issue tracker and the internal reason, and the diagnostic SHALL be reported at the construct that failed. A failure without a site SHALL be reported at the start of the entry unit with the label "while compiling this program". An invalid CLIF block SHALL NOT be an internal error; it SHALL be **E1232** at the block. E2106–E2199 SHALL stay reserved.

#### Scenario: Lowering failure
- **GIVEN** a construct for which lowering finds no rule
- **WHEN** the program is built
- **THEN** the compiler reports one diagnostic with a code from E2101–E2105 at the construct, with the text "internal compiler error" and "please report this"

#### Scenario: Failure without a site
- **GIVEN** a duplicate symbol at link time
- **WHEN** the program is built
- **THEN** the compiler reports **E2105** at the start of the entry unit

### Requirement: CopyOnAssign diagnostic E1512
The code **E1512** SHALL identify a type that carries `[CopyOnAssign]` and has no valid `Copy` method. A valid method is exactly one method named `Copy` with a borrowed receiver, no parameters and the type as return type. The diagnostic SHALL be reported at the attribute, and the help SHALL name the required method `This Copy()`.

#### Scenario: Missing Copy
- **GIVEN** `[CopyOnAssign] type Bag { i64 n; }` without a `Copy` method
- **WHEN** the type is checked
- **THEN** the compiler SHALL report **E1512** at the attribute

### Requirement: Unused item warning W2101
The code **W2101** SHALL identify an unused private item and SHALL replace **W1504**. The code W1504 SHALL be retired. The message SHALL have the form "`Helper` is never used", the label SHALL be "unused function" (or the kind of the item), and the diagnostic SHALL carry the `Unnecessary` tag and a `MaybeIncorrect` fix that removes the item.

#### Scenario: Unused private function
- **GIVEN** a private function `Helper` that no item uses
- **WHEN** the file is analyzed
- **THEN** the compiler SHALL report **W2101** with the message "`Helper` is never used"

### Requirement: Serialize help for a Serializable bound
When a generic bound `Serializable` is violated by a type `T` (**E1610**), the help SHALL say "add `[Serialize]` to type `T` so the compiler derives its `Serializable` conformance". When the declaration of `T` is in the analysed source, the diagnostic SHALL carry a machine-applicable fix that inserts the attribute `[Serialize]` on its own line above the declaration of `T`.

#### Scenario: Missing Serialize attribute
- **GIVEN** `type Point { i64 x; }` without `[Serialize]` and a call that requires `Point: Serializable`
- **WHEN** the call is checked
- **THEN** the compiler SHALL report **E1610** with the help "add `[Serialize]` to type `Point` so the compiler derives its `Serializable` conformance" and a machine-applicable fix that inserts `[Serialize]` above `type Point`

### Requirement: Discarded array growth W1240
The code **W1240** SHALL identify an `Array.Append` call used as a statement on an array that the caller does not own, so that the result is discarded and the array is not changed. The message SHALL have the form "the result of `Array.Append` is discarded; `xs` is not changed" and SHALL be reported at the call. The help and the fix SHALL depend on the kind of the argument. For a parameter that is not `mut`, the fix SHALL declare the parameter `mut` (machine-applicable). For a pattern binding or a lambda parameter, the fix SHALL assign the result to the name (machine-applicable). For a `for` variable, a call result or an element, the fix SHALL use the result in a new local, `T[] grown = Array.Append(...)` when the element type is known (applicability `MaybeIncorrect`). Only `Array.Append` is covered, because the other growth operations either work in place or return a flag.

#### Scenario: Non-mut parameter
- **GIVEN** `unit Add(i64[] xs) { Array.Append<i64>(xs, 1); }`
- **WHEN** the function is checked
- **THEN** the compiler SHALL report **W1240** at the call with a machine-applicable fix that declares `mut i64[] xs`

#### Scenario: Pattern binding
- **GIVEN** a pattern binding `xs` and the statement `Array.Append<i64>(xs, 1);`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **W1240** with a fix that assigns the result to `xs`

#### Scenario: Owned array
- **GIVEN** `mut i64[] xs = Array.Empty<i64>(); Array.Append<i64>(xs, 1);`
- **WHEN** the code is checked
- **THEN** no diagnostic is reported
