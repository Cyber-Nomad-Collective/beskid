## MODIFIED Requirements

### Requirement: Default privacy and pub export
Items MUST default to private to their module. `pub` on an item MUST export it to importers of the containing module. Importing a private item MUST error (**E1501**, **E1107**). v0.1 MUST use private-by-default plus `pub` only; there is no `internal` keyword. A private item of a unit that nothing in that unit references is **W1504** (unused private item), except the program entry function `Main` in the entry unit of an `App` or `Test` target, which the host invokes; no other spelling (such as a lowercase `main`) is exempt.

#### Scenario: Private item imported from another module
- **GIVEN** a `use` of a non-`pub` item from another module
- **WHEN** visibility checking runs
- **THEN** the compiler emits **E1501** or **E1107**

#### Scenario: Entry function is not unused
- **GIVEN** an `App` target whose entry unit declares `i32 Main() { return 0; }` and nothing references `Main`
- **WHEN** `beskid check` judges the entry unit
- **THEN** the compiler SHALL NOT report **W1504** for `Main`

#### Scenario: Lowercase main is an ordinary private item
- **GIVEN** an `App` target whose entry unit declares an unreferenced `i32 main() { return 0; }`
- **WHEN** `beskid check` judges the entry unit
- **THEN** the compiler SHALL report **W1504** for `main`
