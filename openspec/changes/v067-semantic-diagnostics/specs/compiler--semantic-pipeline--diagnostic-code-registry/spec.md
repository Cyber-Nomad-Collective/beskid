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
