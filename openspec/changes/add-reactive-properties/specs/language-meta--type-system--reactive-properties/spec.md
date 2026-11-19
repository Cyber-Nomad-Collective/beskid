## ADDED Requirements

### Requirement: Mixed members in a type body
A type body SHALL accept ordinary fields, properties and inline methods in any declaration order. A value field SHALL use `T name;`. An automatic property with a default SHALL permit the shorthand `prop T Name = initializer;`. An expression-bodied property SHALL use `T Name => expression;`. The semicolon SHALL terminate each of these declarations. An inline method SHALL retain its existing parameter list and method-body syntax. A member reference SHALL be able to resolve a member declared later in the same type. Enum variant payloads SHALL retain their existing comma-separated syntax. The naming-style diagnostic SHALL use PascalCase for properties and lowerCamelCase for ordinary fields. The marker `prop` SHALL be contextual in this declaration form.

#### Scenario: Interleaved members and a forward reference
- **GIVEN** the following type declaration
```beskid
type Counter
{
    i64 raw;
    i64 Double => Count + Count;
    i64 ReadRaw() { return this.raw; }
    prop i64 Count = 0;
}
```
- **WHEN** a program constructs `Counter { raw: 1 }`
- **THEN** `Count` SHALL initially read as zero and `ReadRaw()` SHALL return one
- **WHEN** the program assigns three to the instance's `Count`
- **THEN** `Double` SHALL read as six

#### Scenario: Contextual marker and ordinary field
- **GIVEN** `type Gauge { i64 prop; prop i64 Count = 0; }`
- **WHEN** the compiler resolves the declarations
- **THEN** `prop` SHALL be the name of the ordinary field and `Count` SHALL be the name of the automatic property

#### Scenario: Read-only write in the CLI and editor
- **GIVEN** a variable `counter` of the type above
- **WHEN** the source contains `counter.Double = 4;`
- **THEN** the CLI and language server SHALL report E1260 at the authored member name
- **WHEN** the assignment target is corrected to `counter.Count`
- **THEN** the diagnostic SHALL clear

### Requirement: Property declarations and access
The language SHALL distinguish properties from ordinary fields. A bare automatic property SHALL require `prop`; an accessor block or expression body SHALL identify a property without `prop`. A property read or write SHALL use its declared accessor, and an unavailable accessor SHALL produce a diagnostic.

#### Scenario: Bare property and plain field
- **GIVEN** a type containing `prop i64 Count = 0;` and an ordinary `i64 raw;` field
- **WHEN** a program reads `Count` and reads `raw`
- **THEN** the former SHALL use the property getter and the latter SHALL remain a field access

#### Scenario: Derived property has no setter
- **GIVEN** `i64 Remaining => Limit - Count;`
- **WHEN** a program assigns to `Remaining`
- **THEN** the compiler SHALL reject the assignment

### Requirement: Stored properties with get and set blocks
A type SHALL accept `T Name { accessors }` among its fields and methods. A get/set block SHALL contain at least one accessor and at most one each of `get` and `set`, in either order. The separate initialization-only form is specified under Accessor storage and initialization. Each accessor SHALL be either automatic (`get;`, `set;`) or have a statement block. A default SHALL follow the closing brace as `= initializer;`. Without a default, the closing brace SHALL complete the declaration. The naming and visibility rules of stored properties SHALL apply to both accessors. The words `get` and `set` SHALL remain available as ordinary identifiers outside their accessor positions.

An automatic getter SHALL read the receiver's backing slot. An automatic setter SHALL write the assigned value into that slot. A custom getter SHALL return a value of the declared type. A custom setter SHALL receive the assigned value as an immutable parameter named `value` of the declared type and SHALL have a unit result. Inside a custom accessor, an unshadowed `field` SHALL refer directly to that property's backing slot on the current receiver. Reading or writing this slot SHALL NOT invoke another accessor. Ordinary names outside an accessor SHALL retain their existing binding rules.

A simple assignment SHALL evaluate its receiver and right-hand side once, invoke only the setter, and produce the assigned right-hand value. A compound assignment SHALL evaluate the receiver once, read through the getter, apply the ordinary compound operator, then write the result through the setter. An absent accessor SHALL cause a diagnostic at the member name for an operation that needs it. Construction SHALL initialize the backing slot directly from a named member initializer or its declared default, following the required-field rules when neither is supplied.

#### Scenario: A custom setter clamps a negative value
- **GIVEN** a property declared as follows
```beskid
i64 Count
{
    get;
    set { field = value < 0 ? 0 : value; }
} = 0;
```
- **WHEN** a caller assigns 3, then −4, then 5
- **THEN** reads of `Count` after each assignment SHALL return 3, 0 and 5
- **AND** the value of the second assignment expression SHALL be −4

#### Scenario: A custom property on a generic receiver
- **GIVEN** a declaration `type Box<T> { T Value { get { return field; } set { field = value; } } }`
- **WHEN** one program writes and reads both a `Box<i32>` and a `Box<string>`
- **THEN** each access SHALL execute the declared body with the receiver's concrete type substituted for `T` in the backing slot, setter input and getter result
- **AND** the same substitution SHALL apply when an enclosing generic function accesses `Box<T>.Value` and is instantiated for either type
- **AND** an incompatible assignment SHALL produce a type diagnostic
- **AND** member completion and definition navigation SHALL identify the authored `Value` property for both receivers

#### Scenario: A generic property stores a contract value
- **GIVEN** a contract `Runner` with two implementations and an instance of `Box<Runner>` with custom `get` and `set` for `Value`
- **WHEN** construction supplies one implementation and a later assignment supplies the other
- **THEN** calls through `box.Value` SHALL dispatch to the implementation currently stored, including after garbage collection
- **AND** assigning an existing `Runner` or passing a conforming value through a generic setter helper SHALL preserve that dispatch
- **AND** assigning a value without a conforming implementation SHALL produce a type mismatch at the source assignment

#### Scenario: The custom getter participates in a compound write
- **GIVEN** `i64 Score { set; get { return field + 1; } } = 2;`
- **WHEN** the caller performs `counter.Score += 4;`
- **THEN** the getter SHALL yield 3 for the operation, the setter SHALL receive 7, and a subsequent read SHALL yield 8

#### Scenario: Accessors may omit a store
- **GIVEN** `i64 Count { get; set { if value > 0 { field = value; } } } = 2;`
- **WHEN** a caller assigns −1
- **THEN** a subsequent read SHALL yield 2

#### Scenario: Construction and assignment have distinct effects
- **GIVEN** an instance constructed with a named initializer of −2 for the clamping property above
- **WHEN** the caller first reads the property and then assigns −2 through its setter
- **THEN** the reads before and after the assignment SHALL yield −2 and 0 respectively

#### Scenario: Accessor shape determines legal operations
- **GIVEN** a get-only stored property and a set-only stored property
- **WHEN** the program writes the get-only property, reads the set-only property, or applies a compound assignment to either
- **THEN** the compiler and language server SHALL diagnose the unavailable accessor
- **AND** a simple assignment to the set-only property SHALL be permitted

#### Scenario: Editing the clamping setter
- **GIVEN** the Count property with a custom setter
- **WHEN** the user requests completion in the setter body
- **THEN** the language server SHALL offer the contextual backing storage `field` and the input parameter `value`
- **WHEN** the user requests the definition of an unshadowed `field`
- **THEN** navigation SHALL select the declaration of `Count`
- **AND** member completion on the receiver SHALL offer `Count` once as a property and omit generated accessor method names

#### Scenario: A caller requests raw storage

- **GIVEN** a stored property with a custom setter
- **WHEN** a caller uses the property itself as the place for `move` or `exchange`
- **THEN** the compiler SHALL diagnose the property access because the operation requires direct access to storage
- **AND** unshadowed `field` inside the accessor SHALL follow the ordinary rules for backing storage

#### Scenario: Malformed accessor blocks
- **GIVEN** a property with an empty accessor block or two accessors of the same kind
- **WHEN** the source is checked
- **THEN** it SHALL be rejected at the malformed declaration

### Requirement: Accessor storage and initialization
Automatic accessors SHALL use synthesized storage. A custom accessor SHALL be able to refer to its backing storage as contextual `field`, and a setter SHALL receive the assigned value as contextual `value`. An `init` accessor SHALL reject assignment outside its permitted construction context. Initialization SHALL NOT notify observers.

#### Scenario: Initialization-only assignment
- **GIVEN** `i64 Limit { get; init; } = 100;`
- **WHEN** a program assigns `Limit` after construction
- **THEN** the compiler SHALL reject the assignment

#### Scenario: Explicit value overrides the default
- **GIVEN** the stored property `prop i64 Count = 0;`
- **WHEN** a construction explicitly supplies `Count: 12`
- **THEN** the first read SHALL yield twelve

#### Scenario: Invalid default on an unused property
- **GIVEN** a type declaring `prop i64 Count = true;`
- **WHEN** its source is checked, even without constructing an instance
- **THEN** the compiler SHALL diagnose the incompatible default at `true` with E1261

#### Scenario: Derived value read with method-call syntax
- **GIVEN** an instance with `i64 Double => Count + Count;`
- **WHEN** the program uses `counter.Double()`
- **THEN** the compiler SHALL diagnose E1262 at `Double` and indicate that the value is read as `counter.Double`

### Requirement: Contract property requirements
A contract SHALL be able to require a property accessor shape. Conformance SHALL be checked by the existing contract-conformance authority, and access through a runtime contract value SHALL dispatch to the actual conformer's property implementation.

#### Scenario: Missing required setter
- **GIVEN** a contract requiring `i64 Count { get; set; }` and a conformer exposing only `get`
- **WHEN** conformance is checked
- **THEN** the compiler SHALL diagnose the missing setter

#### Scenario: Runtime contract receiver
- **GIVEN** a runtime contract value whose concrete conformer implements a readable `Count`
- **WHEN** the program reads `Count` through that value
- **THEN** the conformer's getter SHALL supply the result

### Requirement: Stored property observation
A reachable `observe` subscription SHALL receive old and new stored values synchronously on the writing fiber and in registration order. By default an observed backing-store write SHALL compare the old value with the actual value to be stored, and SHALL skip the generated store and notification when they are equal. An `always` property SHALL notify for each backing-store write without this equality gate. A type without applicable equality SHALL require `always` or produce a diagnostic when observed.

#### Scenario: Normalized custom setter
- **GIVEN** an observed `i64 Count` whose setter assigns `field = value < 0 ? 0 : value` and whose stored value is `0`
- **WHEN** a caller assigns `-1`
- **THEN** the comparison SHALL use `0` as the new stored value and SHALL produce no notification

#### Scenario: Changed normalized value
- **GIVEN** the same observed setter with stored value `2`
- **WHEN** a caller assigns `-1`
- **THEN** the stored value SHALL become `0` and observers SHALL receive old `2` and new `0`

#### Scenario: Setter without a store
- **GIVEN** an observed property whose custom setter performs no backing-store write
- **WHEN** the setter executes
- **THEN** that invocation SHALL produce no backing-store change notification

### Requirement: Sound observation classification
The compiler SHALL classify observation for the reachable assembled program conservatively. Observation through runtime contract values SHALL classify every possible conforming target as observed; if the compiler cannot prove the target set complete it SHALL include all compatible targets or reject the operation. Observed derived properties SHALL NOT silently omit dependencies that cannot be established.

#### Scenario: Contract value can hold either conformer
- **GIVEN** reachable observation through a contract value that can hold either of two conforming types
- **WHEN** the compiler classifies their implementations of the property
- **THEN** both implementations SHALL be classified observed

#### Scenario: Opaque derived dependency
- **GIVEN** an observed derived expression whose method call hides property dependencies
- **WHEN** the compiler cannot establish a complete dependency set
- **THEN** it SHALL diagnose the unsupported observation instead of emitting an incomplete graph

### Requirement: Unobserved AOT cost
An unobserved automatic property SHALL use the same instance layout and load/store operations as an equivalent ordinary field under the same build configuration. It SHALL add no observer allocation, lookup, equality check or notification branch. A custom accessor SHALL retain its own declared work.

#### Scenario: Compare generated code and layout
- **GIVEN** equivalent programs differing only in an unobserved automatic property versus a field
- **WHEN** they are compiled for the same target and configuration
- **THEN** normalized generated load/store operations and instance layout SHALL match and no observation machinery SHALL be emitted for that property

### Requirement: Observed storage and collection
A type with observed properties SHALL have at most one additional pointer-sized observer handle per instance, shared by its observed properties. Subscription storage SHALL NOT be allocated before it is needed. The collector SHALL trace live observer state and its reachable managed references according to the runtime GC contract.

#### Scenario: Multiple observed properties share a handle
- **GIVEN** a type with two observed stored properties
- **WHEN** an instance is created without subscriptions
- **THEN** its layout SHALL contain no more than one additional pointer-sized observer handle and SHALL allocate no subscription storage

#### Scenario: Live callback survives collection
- **GIVEN** a live observed instance with a live subscription capturing a managed object
- **WHEN** garbage collection runs before the next notification
- **THEN** the callback and captured object SHALL remain reachable for that notification

Informative conformance anchors for the first example are the compiler fixture `crates/beskid_e2e_tests/fixtures/count_double`, the layout and CLIF comparison in `crates/beskid_aot/tests/aot/prepared_syntax.rs`, and the VS Code extension test `test/integration/suite/properties.integration.test.ts`. Observation and GC conformance belong to the later runtime work.
